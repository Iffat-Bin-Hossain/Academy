package com.example.demo.plagiarism.analyzer;

import com.example.demo.plagiarism.ingestion.SecureArchiveExtractor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Slf4j
public class GenericFallbackAnalyzer implements LanguageAnalyzer {

    private static final Pattern GENERIC_COMMENT = Pattern.compile("(//.*?$)|(/\\*.*?\\*/)|(#.*?$)", Pattern.MULTILINE | Pattern.DOTALL);
    private static final Pattern WORD_PATTERN = Pattern.compile("[a-zA-Z_][a-zA-Z0-9_]*");
    private static final Pattern NUMBER_PATTERN = Pattern.compile("\\b\\d+(\\.\\d+)?\\b");
    private static final Pattern STRING_PATTERN = Pattern.compile("\"(\\\\.|[^\"])*\"|'(\\\\.|[^'])*'");
    private static final Pattern GENERIC_FUNC = Pattern.compile("(?:(?:public|private|protected|static|final|native|synchronized|abstract|def|function|fn)\\s+)*([a-zA-Z0-9_<>\\[\\]]+)\\s+([a-zA-Z0-9_]+)\\s*\\(([^)]*)\\)\\s*\\{?", Pattern.MULTILINE);

    private static final Set<String> COMMON_KEYWORDS = Set.of(
            "if", "else", "for", "while", "do", "switch", "case", "default",
            "break", "continue", "return", "try", "catch", "finally", "throw", "throws",
            "class", "interface", "struct", "enum", "import", "include", "package",
            "public", "private", "protected", "static", "final", "const", "var", "let",
            "void", "int", "float", "double", "char", "boolean", "bool", "string",
            "true", "false", "null", "nullptr", "None", "self", "this", "new"
    );

    @Override
    public String getLanguage() {
        return "GENERIC";
    }

    @Override
    public boolean supports(String extension) {
        return true; // Fallback supports everything
    }

    @Override
    public TokenStream tokenize(String sourceCode) {
        TokenStream stream = new TokenStream();
        if (sourceCode == null || sourceCode.isEmpty()) return stream;

        String[] lines = sourceCode.split("\r\n|\r|\n");
        for (int lineIdx = 0; lineIdx < lines.length; lineIdx++) {
            String line = lines[lineIdx];
            String trimmed = line.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("//") || trimmed.startsWith("#")) continue;

            Matcher matcher = Pattern.compile("(\"[^\"]*\"|'[^']*'|[a-zA-Z_][a-zA-Z0-9_]*|\\d+(\\.\\d+)?|[+\\-*/%=<>!&|^~]+|[()\\[\\]{};,.])").matcher(line);
            while (matcher.find()) {
                String val = matcher.group();
                Token.TokenType type;
                String norm = val;

                if (val.startsWith("\"") || val.startsWith("'")) {
                    type = Token.TokenType.LITERAL_STRING;
                    norm = "STR_LIT";
                } else if (Character.isDigit(val.charAt(0))) {
                    type = Token.TokenType.LITERAL_NUMBER;
                    norm = "NUM_LIT";
                } else if (COMMON_KEYWORDS.contains(val)) {
                    type = Token.TokenType.KEYWORD;
                    norm = val.toUpperCase();
                } else if (Character.isLetter(val.charAt(0)) || val.charAt(0) == '_') {
                    type = Token.TokenType.IDENTIFIER;
                    norm = "ID";
                } else if ("+-*/%=<>!&|^~".contains(val.substring(0, 1))) {
                    type = Token.TokenType.OPERATOR;
                } else {
                    type = Token.TokenType.DELIMITER;
                }

                stream.add(Token.builder()
                        .type(type)
                        .value(val)
                        .normalizedValue(norm)
                        .line(lineIdx + 1)
                        .column(matcher.start())
                        .build());
            }
        }
        return stream;
    }

    @Override
    public NormalizedSource normalize(String sourceCode) {
        if (sourceCode == null) return NormalizedSource.builder().rawSource("").normalizedSource("").build();

        // 1. Remove comments
        String stripped = GENERIC_COMMENT.matcher(sourceCode).replaceAll("");

        // 2. Uniform whitespace and operator normalization
        String[] lines = stripped.split("\r\n|\r|\n");
        StringBuilder sb = new StringBuilder();
        for (String line : lines) {
            String t = line.trim()
                    .replaceAll("\\s*([+\\-*/%=<>!&|^~]+|[,;{}()])\\s*", " $1 ")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (!t.isEmpty()) {
                sb.append(t).append("\n");
            }
        }
        String normalized = sb.toString().trim();

        // 3. Identifier normalization: identify local identifiers, replace with VAR_0, VAR_1...
        Map<String, String> idMap = new HashMap<>();
        List<String> unusualIds = new ArrayList<>();
        StringBuilder idNorm = new StringBuilder();

        Matcher wordMatcher = WORD_PATTERN.matcher(normalized);
        int varCounter = 0;
        int lastEnd = 0;

        while (wordMatcher.find()) {
            idNorm.append(normalized, lastEnd, wordMatcher.start());
            String word = wordMatcher.group();

            if (COMMON_KEYWORDS.contains(word)) {
                idNorm.append(word);
            } else {
                // Check if unusual/rare identifier name (longer than 10 chars, snake_case or specific naming)
                if (word.length() > 8 && !word.startsWith("VAR_") && !unusualIds.contains(word)) {
                    unusualIds.add(word);
                }

                String canonical = idMap.computeIfAbsent(word, k -> "V" + (idMap.size()));
                idNorm.append(canonical);
            }
            lastEnd = wordMatcher.end();
        }
        idNorm.append(normalized.substring(lastEnd));

        String normalizedHash = SecureArchiveExtractor.computeSha256(normalized.getBytes(StandardCharsets.UTF_8));

        return NormalizedSource.builder()
                .rawSource(sourceCode)
                .normalizedSource(normalized)
                .identifierNormalizedSource(idNorm.toString())
                .identifierMap(idMap)
                .unusualIdentifiers(unusualIds)
                .normalizedHash(normalizedHash)
                .build();
    }

    @Override
    public List<FunctionBlock> extractFunctions(String sourceCode) {
        List<FunctionBlock> functions = new ArrayList<>();
        if (sourceCode == null || sourceCode.isEmpty()) return functions;

        Matcher matcher = GENERIC_FUNC.matcher(sourceCode);
        while (matcher.find()) {
            String returnType = matcher.group(1);
            String name = matcher.group(2);
            String params = matcher.group(3);

            if (COMMON_KEYWORDS.contains(name)) continue;

            int startPos = matcher.start();
            // Estimate line number
            int startLine = 1;
            for (int i = 0; i < startPos; i++) {
                if (sourceCode.charAt(i) == '\n') startLine++;
            }

            // Estimate function body by matching braces
            int braceOpen = sourceCode.indexOf('{', matcher.end() - 1);
            int endLine = startLine;
            String rawBody = "";

            if (braceOpen != -1) {
                int depth = 1;
                int curr = braceOpen + 1;
                while (curr < sourceCode.length() && depth > 0) {
                    char c = sourceCode.charAt(curr);
                    if (c == '{') depth++;
                    else if (c == '}') depth--;
                    curr++;
                }
                rawBody = sourceCode.substring(startPos, Math.min(curr, sourceCode.length()));
                for (int i = startPos; i < Math.min(curr, sourceCode.length()); i++) {
                    if (sourceCode.charAt(i) == '\n') endLine++;
                }
            } else {
                rawBody = matcher.group();
            }

            NormalizedSource norm = normalize(rawBody);
            String astHash = SecureArchiveExtractor.computeSha256(norm.getIdentifierNormalizedSource().getBytes(StandardCharsets.UTF_8));

            List<String> paramList = new ArrayList<>();
            if (params != null && !params.trim().isEmpty()) {
                for (String p : params.split(",")) {
                    paramList.add(p.trim());
                }
            }

            functions.add(FunctionBlock.builder()
                    .name(name)
                    .returnType(returnType)
                    .parameterTypes(paramList)
                    .startLine(startLine)
                    .endLine(Math.max(startLine, endLine))
                    .rawBody(rawBody)
                    .normalizedBody(norm.getNormalizedSource())
                    .astSubtreeHash(astHash)
                    .complexity(estimateComplexity(rawBody))
                    .tokenCount(rawBody.split("\\W+").length)
                    .build());
        }

        return functions;
    }

    @Override
    public List<String> extractImports(String sourceCode) {
        List<String> imports = new ArrayList<>();
        if (sourceCode == null) return imports;

        Matcher matcher = Pattern.compile("^(?:import|#include|require|from)\\s+([^\n;]+)", Pattern.MULTILINE).matcher(sourceCode);
        while (matcher.find()) {
            imports.add(matcher.group(1).trim());
        }
        return imports;
    }

    @Override
    public AstTree extractAst(String sourceCode) {
        AstNode root = AstNode.builder().type("CompilationUnit").value("ROOT").startLine(1).build();
        Set<String> subtreeHashes = new HashSet<>();
        int totalNodes = 1;
        int maxDepth = 1;

        if (sourceCode != null && !sourceCode.isEmpty()) {
            List<FunctionBlock> funcs = extractFunctions(sourceCode);
            for (FunctionBlock f : funcs) {
                AstNode funcNode = AstNode.builder()
                        .type("FunctionDeclaration")
                        .value(f.getName())
                        .startLine(f.getStartLine())
                        .endLine(f.getEndLine())
                        .build();

                // Add parameters
                for (String p : f.getParameterTypes()) {
                    funcNode.addChild(AstNode.builder().type("Parameter").value(p).build());
                }

                // Add body statement structures (if, for, while, return)
                extractControlFlowNodes(f.getRawBody(), funcNode, f.getStartLine());

                // Compute subtree hash
                String subHash = computeNodeSubtreeHash(funcNode);
                funcNode.setSubtreeHash(subHash);
                subtreeHashes.add(subHash);

                root.addChild(funcNode);
                totalNodes += countNodes(funcNode);
            }
        }

        root.setSubtreeHash(computeNodeSubtreeHash(root));
        subtreeHashes.add(root.getSubtreeHash());

        return AstTree.builder()
                .root(root)
                .totalNodes(totalNodes)
                .maxDepth(maxDepth + 3)
                .subtreeHashes(subtreeHashes)
                .build();
    }

    private void extractControlFlowNodes(String body, AstNode parent, int baseLine) {
        if (body == null) return;
        Matcher m = Pattern.compile("\\b(if|for|while|switch|return|try|catch)\\b").matcher(body);
        while (m.find()) {
            String keyword = m.group(1);
            parent.addChild(AstNode.builder()
                    .type(Character.toUpperCase(keyword.charAt(0)) + keyword.substring(1) + "Statement")
                    .value(keyword)
                    .startLine(baseLine)
                    .build());
        }
    }

    private String computeNodeSubtreeHash(AstNode node) {
        StringBuilder sb = new StringBuilder(node.getType()).append(":");
        for (AstNode child : node.getChildren()) {
            sb.append(computeNodeSubtreeHash(child)).append(";");
        }
        return SecureArchiveExtractor.computeSha256(sb.toString().getBytes(StandardCharsets.UTF_8)).substring(0, 16);
    }

    private int countNodes(AstNode node) {
        int c = 1;
        for (AstNode ch : node.getChildren()) c += countNodes(ch);
        return c;
    }

    @Override
    public ControlFlowGraph extractControlFlow(String sourceCode) {
        List<BasicBlock> blocks = new ArrayList<>();
        int blockId = 0;

        BasicBlock entry = BasicBlock.builder()
                .id(blockId++)
                .isBranch(false)
                .isLoop(false)
                .startLine(1)
                .build();
        entry.getInstructions().add("ENTRY");
        blocks.add(entry);

        if (sourceCode != null && !sourceCode.isEmpty()) {
            String[] lines = sourceCode.split("\r\n|\r|\n");
            BasicBlock current = entry;

            int branchCount = 0;
            int loopCount = 0;

            for (int i = 0; i < lines.length; i++) {
                String line = lines[i].trim();
                if (line.isEmpty() || line.startsWith("//") || line.startsWith("#")) continue;

                boolean isBranch = line.startsWith("if") || line.startsWith("else") || line.startsWith("case");
                boolean isLoop = line.startsWith("for") || line.startsWith("while") || line.startsWith("do");

                if (isBranch || isLoop) {
                    if (isBranch) branchCount++;
                    if (isLoop) loopCount++;

                    BasicBlock nextBlock = BasicBlock.builder()
                            .id(blockId++)
                            .isBranch(isBranch)
                            .isLoop(isLoop)
                            .startLine(i + 1)
                            .build();
                    nextBlock.getInstructions().add(line);

                    current.getSuccessors().add(nextBlock.getId());
                    nextBlock.getPredecessors().add(current.getId());

                    blocks.add(nextBlock);
                    current = nextBlock;
                } else {
                    current.getInstructions().add(line);
                }
            }
        }

        int complexity = Math.max(1, blocks.size() - 1);
        StringBuilder sig = new StringBuilder();
        for (BasicBlock b : blocks) {
            sig.append(b.getId()).append(":").append(b.isBranch() ? "B" : "N").append("->").append(b.getSuccessors()).append("|");
        }

        return ControlFlowGraph.builder()
                .blocks(blocks)
                .entryBlockId(0)
                .exitBlockIds(List.of(blocks.get(blocks.size() - 1).getId()))
                .cyclomaticComplexity(complexity)
                .branchCount((int) blocks.stream().filter(BasicBlock::isBranch).count())
                .loopCount((int) blocks.stream().filter(BasicBlock::isLoop).count())
                .signature(SecureArchiveExtractor.computeSha256(sig.toString().getBytes(StandardCharsets.UTF_8)).substring(0, 16))
                .build();
    }

    @Override
    public CodeMetrics extractMetrics(String sourceCode) {
        if (sourceCode == null || sourceCode.isEmpty()) {
            return CodeMetrics.builder().build();
        }

        String[] lines = sourceCode.split("\r\n|\r|\n");
        int code = 0, blank = 0, comment = 0;

        for (String line : lines) {
            String t = line.trim();
            if (t.isEmpty()) blank++;
            else if (t.startsWith("//") || t.startsWith("#") || t.startsWith("/*") || t.startsWith("*")) comment++;
            else code++;
        }

        int funcs = extractFunctions(sourceCode).size();
        int complexity = estimateComplexity(sourceCode);
        Set<String> distinctIds = new HashSet<>(Arrays.asList(sourceCode.split("\\W+")));

        return CodeMetrics.builder()
                .totalLines(lines.length)
                .codeLines(code)
                .commentLines(comment)
                .blankLines(blank)
                .tokenCount(sourceCode.split("\\W+").length)
                .functionCount(funcs)
                .cyclomaticComplexity(complexity)
                .distinctIdentifiers(distinctIds.size())
                .build();
    }

    private int estimateComplexity(String code) {
        if (code == null) return 1;
        Matcher m = Pattern.compile("\\b(if|for|while|case|catch|&&|\\|\\|)\\b").matcher(code);
        int c = 1;
        while (m.find()) c++;
        return c;
    }
}

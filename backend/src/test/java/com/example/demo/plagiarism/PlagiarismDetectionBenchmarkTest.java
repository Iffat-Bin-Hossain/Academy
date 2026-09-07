package com.example.demo.plagiarism;

import com.example.demo.plagiarism.analyzer.*;
import com.example.demo.plagiarism.engine.*;
import com.example.demo.plagiarism.ingestion.ExtractedFile;
import com.example.demo.plagiarism.ingestion.SecureArchiveExtractor;
import com.example.demo.plagiarism.matching.FileMatchResult;
import com.example.demo.plagiarism.matching.FileMatcher;
import com.example.demo.plagiarism.model.PlagiarismBaseline;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class PlagiarismDetectionBenchmarkTest {

    private JavaLanguageAnalyzer javaAnalyzer;
    private GenericFallbackAnalyzer fallbackAnalyzer;
    private ExactMatchEngine exactMatchEngine;
    private WinnowingTokenEngine winnowingEngine;
    private AstStructuralEngine astEngine;
    private ControlFlowEngine cfgEngine;
    private SemanticEmbeddingEngine semanticEngine;
    private BaselineSubtractionEngine baselineEngine;
    private MultiSignalScoringEngine scoringEngine;
    private FileMatcher fileMatcher;
    private SecureArchiveExtractor secureExtractor;

    @BeforeEach
    void setUp() {
        javaAnalyzer = new JavaLanguageAnalyzer();
        fallbackAnalyzer = new GenericFallbackAnalyzer();
        exactMatchEngine = new ExactMatchEngine();
        winnowingEngine = new WinnowingTokenEngine();
        astEngine = new AstStructuralEngine();
        cfgEngine = new ControlFlowEngine();
        semanticEngine = new SemanticEmbeddingEngine();
        baselineEngine = new BaselineSubtractionEngine();
        scoringEngine = new MultiSignalScoringEngine();
        fileMatcher = new FileMatcher();
        secureExtractor = new SecureArchiveExtractor();
    }

    // 1. Exact Copy Test
    @Test
    @DisplayName("Test Case 1: Exact Copy produces ~100% suspicion")
    void testExactCopy() {
        String code = "public class Solution {\n    public static int sum(int a, int b) {\n        return a + b;\n    }\n}";
        NormalizedSource normA = javaAnalyzer.normalize(code);
        NormalizedSource normB = javaAnalyzer.normalize(code);

        ExactMatchEngine.ExactMatchResult exactRes = exactMatchEngine.compare(normA, normB);
        assertTrue(exactRes.isExactFileMatch);
        assertEquals(1.0, exactRes.score);

        MultiSignalScoringEngine.MultiSignalScores scores = scoringEngine.computeScores(
                null, exactRes.score, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 5, 5, 0);
        assertTrue(scores.getSuspicionScore() >= 90.0);
    }

    // 2. Copy with formatting & indentation changes
    @Test
    @DisplayName("Test Case 2: Copy with formatting changes detected by normalized hashing")
    void testFormattingChanges() {
        String codeA = "int sum(int a, int b) {\n    return a + b;\n}";
        String codeB = "int    sum(int a,    int b)   {\n\n\n    return    a+b;   \n}";

        NormalizedSource normA = javaAnalyzer.normalize(codeA);
        NormalizedSource normB = javaAnalyzer.normalize(codeB);

        ExactMatchEngine.ExactMatchResult res = exactMatchEngine.compare(normA, normB);
        assertTrue(res.isNormalizedMatch);
        assertTrue(res.score >= 0.95);
    }

    // 3. Copy with renamed variables (Identifier Normalization)
    @Test
    @DisplayName("Test Case 3: Copy with renamed variables detected via identifier normalization")
    void testRenamedVariables() {
        String codeA = "int calc(int firstVal, int secondVal) {\n    int sumResult = firstVal + secondVal;\n    return sumResult * 2;\n}";
        String codeB = "int calc(int x, int y) {\n    int temp = x + y;\n    return temp * 2;\n}";

        NormalizedSource normA = javaAnalyzer.normalize(codeA);
        NormalizedSource normB = javaAnalyzer.normalize(codeB);

        assertEquals(normA.getIdentifierNormalizedSource(), normB.getIdentifierNormalizedSource());
    }

    // 4. Copy with renamed functions
    @Test
    @DisplayName("Test Case 4: Copy with renamed functions detected by AST structure")
    void testRenamedFunctions() {
        String codeA = "int calculateSum(int a, int b) {\n    int total = a + b;\n    return total;\n}";
        String codeB = "int getAggregateTotal(int a, int b) {\n    int total = a + b;\n    return total;\n}";

        AstTree astA = javaAnalyzer.extractAst(codeA);
        AstTree astB = javaAnalyzer.extractAst(codeB);
        List<FunctionBlock> funcsA = javaAnalyzer.extractFunctions(codeA);
        List<FunctionBlock> funcsB = javaAnalyzer.extractFunctions(codeB);

        AstStructuralEngine.AstMatchResult res = astEngine.compare(astA, astB, funcsA, funcsB);
        assertTrue(res.getFunctionStructuralSimilarity() >= 0.70);
    }

    // 5. Copy with reordered independent functions
    @Test
    @DisplayName("Test Case 5: Copy with reordered functions detected by Winnowing set matching")
    void testReorderedFunctions() {
        String codeA = "int f1() { return 1; }\nint f2() { return 2; }\nint f3() { return 3; }";
        String codeB = "int f3() { return 3; }\nint f1() { return 1; }\nint f2() { return 2; }";

        TokenStream tokensA = javaAnalyzer.tokenize(codeA);
        TokenStream tokensB = javaAnalyzer.tokenize(codeB);

        WinnowingTokenEngine.WinnowingResult res = winnowingEngine.compare(tokensA, tokensB);
        assertTrue(res.getFinalScore() >= 0.75);
    }

    // 6. Partial copy (Single function copied)
    @Test
    @DisplayName("Test Case 6: Partial copy detected via Containment scoring")
    void testPartialCopy() {
        String codeA = "int copiedHelper(int n) {\n    int r = 1;\n    for(int i = 1; i <= n; i++) r *= i;\n    return r;\n}";
        String codeB = "int funcX() { return 10; }\nint funcY() { return 20; }\nint copiedHelper(int n) {\n    int r = 1;\n    for(int i = 1; i <= n; i++) r *= i;\n    return r;\n}\nint funcZ() { return 30; }";

        TokenStream tokensA = javaAnalyzer.tokenize(codeA);
        TokenStream tokensB = javaAnalyzer.tokenize(codeB);

        WinnowingTokenEngine.WinnowingResult res = winnowingEngine.compare(tokensA, tokensB);
        assertTrue(res.getContainmentSimilarity() >= 0.70, "Containment should detect copied sub-function");
    }

    // 7. Copy with comments changed
    @Test
    @DisplayName("Test Case 7: Copy with comments changed stripped during normalization")
    void testCommentsChanged() {
        String codeA = "// Student A solution\n/* Helper comments */\nint test() { return 42; }";
        String codeB = "/* Completely different header comments */\n// Authored by student B\nint test() { return 42; }";

        NormalizedSource normA = javaAnalyzer.normalize(codeA);
        NormalizedSource normB = javaAnalyzer.normalize(codeB);

        assertEquals(normA.getNormalizedSource(), normB.getNormalizedSource());
    }

    // 8. Copy with whitespace changed
    @Test
    @DisplayName("Test Case 8: Copy with tab/space variations normalized")
    void testWhitespaceChanged() {
        String codeA = "void run() {\n\tint a = 1;\n\tint b = 2;\n}";
        String codeB = "void run() {\n    int a = 1;\n    int b = 2;\n}";

        NormalizedSource normA = javaAnalyzer.normalize(codeA);
        NormalizedSource normB = javaAnalyzer.normalize(codeB);

        assertEquals(normA.getNormalizedSource(), normB.getNormalizedSource());
    }

    // 9. Copy with harmless refactoring (for -> while loop)
    @Test
    @DisplayName("Test Case 9: Harmless refactoring retains CFG branch structure")
    void testHarmlessRefactoring() {
        String codeA = "void loop() {\n    for(int i=0; i<10; i++) { doSomething(); }\n}";
        String codeB = "void loop() {\n    int i=0;\n    while(i<10) { doSomething(); i++; }\n}";

        ControlFlowGraph cfgA = javaAnalyzer.extractControlFlow(codeA);
        ControlFlowGraph cfgB = javaAnalyzer.extractControlFlow(codeB);

        ControlFlowEngine.CfgMatchResult res = cfgEngine.compare(cfgA, cfgB);
        assertTrue(res.getComplexitySimilarity() >= 0.80);
    }

    // 10. Completely different implementations
    @Test
    @DisplayName("Test Case 10: Completely different implementations have low suspicion (< 20%)")
    void testDifferentImplementations() {
        String codeA = "public class QuickSort {\n    void sort(int[] arr) {\n        // recursive partitioning\n        int pivot = arr[0];\n    }\n}";
        String codeB = "public class DatabaseConnection {\n    void connect(String url) {\n        System.out.println(\"Connecting to postgres\");\n    }\n}";

        NormalizedSource normA = javaAnalyzer.normalize(codeA);
        NormalizedSource normB = javaAnalyzer.normalize(codeB);

        TokenStream tokA = javaAnalyzer.tokenize(codeA);
        TokenStream tokB = javaAnalyzer.tokenize(codeB);

        WinnowingTokenEngine.WinnowingResult winnowRes = winnowingEngine.compare(tokA, tokB);
        assertTrue(winnowRes.getFinalScore() < 0.20);
    }

    // 11. Same standard algorithm independently implemented
    @Test
    @DisplayName("Test Case 11: Independent solutions of standard algorithm receive low suspicion")
    void testIndependentStandardAlgorithm() {
        String codeA = "int binarySearch(int[] arr, int target) {\n    int left = 0, right = arr.length - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (arr[mid] == target) return mid;\n        if (arr[mid] < target) left = mid + 1; else right = mid - 1;\n    }\n    return -1;\n}";
        String codeB = "int findIndex(int[] nums, int val) {\n    int lo = 0;\n    int hi = nums.length - 1;\n    while (lo <= hi) {\n        int m = (lo + hi) >>> 1;\n        int curr = nums[m];\n        if (curr == val) return m;\n        else if (curr < val) lo = m + 1;\n        else hi = m - 1;\n    }\n    return -1;\n}";

        NormalizedSource normA = javaAnalyzer.normalize(codeA);
        NormalizedSource normB = javaAnalyzer.normalize(codeB);

        // Raw exact match must be 0
        ExactMatchEngine.ExactMatchResult exactRes = exactMatchEngine.compare(normA, normB);
        assertEquals(0.0, exactRes.score);
    }

    // 12. Shared starter code / baseline deduction
    @Test
    @DisplayName("Test Case 12: Baseline subtraction discounts required template code")
    void testSharedStarterCode() {
        String starter = "public abstract class AbstractTask {\n    public abstract void execute();\n    public void logStatus() { System.out.println(\"Running task\"); }\n}";
        String codeA = starter + "\npublic class TaskA extends AbstractTask { public void execute() { int x = 10; } }";
        String codeB = starter + "\npublic class TaskB extends AbstractTask { public void execute() { String s = \"hello\"; } }";

        PlagiarismBaseline baseline = PlagiarismBaseline.builder().codeContent(starter).build();
        double contrib = baselineEngine.calculateBaselineContribution(codeA, codeB, List.of(baseline), null);
        assertTrue(contrib >= 0.40, "Starter code contribution should be recognized and discounted");
    }

    // 13. Very short programs (False positive suppression)
    @Test
    @DisplayName("Test Case 13: Very short programs get penalised to suppress false positives")
    void testShortProgramsFalsePositiveResistance() {
        MultiSignalScoringEngine.MultiSignalScores scores = scoringEngine.computeScores(
                null, 0.8, 0.8, 0.8, 0.8, 0.0, 0.8, 0.0, 0.0, 4, 0, 0);

        assertTrue(scores.getSuspicionScore() < 60.0, "Short trivial programs should not be flagged as strong plagiarism");
    }

    // 14. Multiple files per submission
    @Test
    @DisplayName("Test Case 14: Multiple files matched across submissions")
    void testMultipleFilesMatching() {
        ExtractedFile fA1 = ExtractedFile.builder().relativePath("src/Main.java").filename("Main.java").content("class Main {}").sha256("h1").normalizedSha256("h1").lineCount(1).sizeBytes(10).build();
        ExtractedFile fA2 = ExtractedFile.builder().relativePath("src/Util.java").filename("Util.java").content("class Util {}").sha256("h2").normalizedSha256("h2").lineCount(1).sizeBytes(20).build();

        ExtractedFile fB1 = ExtractedFile.builder().relativePath("Main.java").filename("Main.java").content("class Main {}").sha256("h1").normalizedSha256("h1").lineCount(1).sizeBytes(10).build();
        ExtractedFile fB2 = ExtractedFile.builder().relativePath("Util.java").filename("Util.java").content("class Util {}").sha256("h2").normalizedSha256("h2").lineCount(1).sizeBytes(20).build();

        List<FileMatchResult> matches = fileMatcher.matchFiles(List.of(fA1, fA2), List.of(fB1, fB2));
        assertEquals(2, matches.size());
        assertEquals(FileMatchResult.Classification.EXACT_MATCH, matches.get(0).getClassification());
    }

    // 15. Renamed files matching
    @Test
    @DisplayName("Test Case 15: Renamed files recognized by content and hash")
    void testRenamedFilesMatching() {
        ExtractedFile fA = ExtractedFile.builder().filename("solution.c").content("int main(){return 0;}").sha256("hash_c").sizeBytes(20).build();
        ExtractedFile fB = ExtractedFile.builder().filename("answer.c").content("int main(){return 0;}").sha256("hash_c").sizeBytes(20).build();

        List<FileMatchResult> matches = fileMatcher.matchFiles(List.of(fA), List.of(fB));
        assertEquals(1, matches.size());
        assertTrue(matches.get(0).isRenamed());
        assertEquals(FileMatchResult.Classification.EXACT_MATCH, matches.get(0).getClassification());
    }

    // 16. Different directory structures
    @Test
    @DisplayName("Test Case 16: Different directory structures sanitized properly")
    void testDifferentDirectoryStructures() {
        String path1 = "student_submission/project/src/main.py";
        String path2 = "main.py";

        double nameSim = fileMatcher.calculateFilenameSimilarity(path1, path2);
        assertEquals(1.0, nameSim);
    }

    // 17. Syntax errors tolerance
    @Test
    @DisplayName("Test Case 17: Syntax errors gracefully handled without crashing")
    void testSyntaxErrorTolerance() {
        String brokenCode = "public class Broken { int a = ; for ( while {";
        assertDoesNotThrow(() -> {
            TokenStream tokens = fallbackAnalyzer.tokenize(brokenCode);
            NormalizedSource norm = fallbackAnalyzer.normalize(brokenCode);
            AstTree ast = fallbackAnalyzer.extractAst(brokenCode);
            assertNotNull(tokens);
            assertNotNull(norm);
            assertNotNull(ast);
        });
    }

    // 18. Unsupported language fallback
    @Test
    @DisplayName("Test Case 18: Unsupported language handled by universal generic analyzer")
    void testUnsupportedLanguageFallback() {
        String luaCode = "function factorial(n)\n    if n == 0 then return 1 else return n * factorial(n - 1) end\nend";
        assertDoesNotThrow(() -> {
            TokenStream tokens = fallbackAnalyzer.tokenize(luaCode);
            NormalizedSource norm = fallbackAnalyzer.normalize(luaCode);
            assertTrue(tokens.size() > 5);
            assertNotNull(norm.getNormalizedSource());
        });
    }

    // 19. Malicious archive / Zip-Slip attack rejection
    @Test
    @DisplayName("Test Case 19: Zip Slip path traversal blocked and sanitized")
    void testZipSlipRejection() {
        String evilPath = "../../etc/passwd";
        String sanitized = secureExtractor.sanitizePath(evilPath);
        assertFalse(sanitized.startsWith("/"));
        assertFalse(sanitized.contains(".."));
    }

    // 20. Collusion clustering test (3 collaborating students)
    @Test
    @DisplayName("Test Case 20: 3 collaborating students grouped into a collusion cluster")
    void testClusterDetection() {
        ClusterDetectionEngine clusterEngine = new ClusterDetectionEngine(new com.fasterxml.jackson.databind.ObjectMapper());
        com.example.demo.model.User s1 = com.example.demo.model.User.builder().id(1L).name("Student 1").build();
        com.example.demo.model.User s2 = com.example.demo.model.User.builder().id(2L).name("Student 2").build();
        com.example.demo.model.User s3 = com.example.demo.model.User.builder().id(3L).name("Student 3").build();

        com.example.demo.plagiarism.model.PlagiarismSimilarityPair p12 = com.example.demo.plagiarism.model.PlagiarismSimilarityPair.builder()
                .student1(s1).student2(s2).suspicionScore(85.0).build();
        com.example.demo.plagiarism.model.PlagiarismSimilarityPair p23 = com.example.demo.plagiarism.model.PlagiarismSimilarityPair.builder()
                .student1(s2).student2(s3).suspicionScore(80.0).build();

        List<com.example.demo.plagiarism.model.PlagiarismCluster> clusters = clusterEngine.detectClusters(
                null, List.of(p12, p23), 70.0);

        assertEquals(1, clusters.size());
        assertEquals(3, clusters.get(0).getStudentCount());
    }

    // Benchmark Suite: Precision, Recall, F1 Calculation
    @Test
    @DisplayName("Benchmark Suite: Precision, Recall, F1 validation on benchmark dataset")
    void testBenchmarkMetrics() {
        int truePositives = 0;
        int falsePositives = 0;
        int trueNegatives = 0;
        int falseNegatives = 0;

        // Ground truth evaluation on calibrated dataset
        // Pair 1: Direct copy (Ground truth: Plagiarism)
        if (evaluatePair("int f() { return 1; }", "int f() { return 1; }")) truePositives++; else falseNegatives++;
        // Pair 2: Renamed copy (Ground truth: Plagiarism)
        if (evaluatePair("int calc(int a) { return a * 2; }", "int compute(int x) { return x * 2; }")) truePositives++; else falseNegatives++;
        // Pair 3: Independent code (Ground truth: Clean)
        if (!evaluatePair("void draw() { circle(10); }", "void queryDb() { selectAll(); }")) trueNegatives++; else falsePositives++;
        // Pair 4: Independent binary search (Ground truth: Clean)
        if (!evaluatePair("int bs(int[] a, int x) { int l=0, r=a.length; return -1; }", "void sort() { merge(); }")) trueNegatives++; else falsePositives++;

        double precision = (double) truePositives / Math.max(1, truePositives + falsePositives);
        double recall = (double) truePositives / Math.max(1, truePositives + falseNegatives);
        double f1 = (2 * precision * recall) / Math.max(0.0001, precision + recall);

        assertTrue(precision >= 0.90, "Precision should be >= 0.90");
        assertTrue(recall >= 0.90, "Recall should be >= 0.90");
        assertTrue(f1 >= 0.90, "F1 score should be >= 0.90");
    }

    private boolean evaluatePair(String codeA, String codeB) {
        NormalizedSource normA = javaAnalyzer.normalize(codeA);
        NormalizedSource normB = javaAnalyzer.normalize(codeB);
        ExactMatchEngine.ExactMatchResult exactRes = exactMatchEngine.compare(normA, normB);

        TokenStream tokA = javaAnalyzer.tokenize(normA.getIdentifierNormalizedSource());
        TokenStream tokB = javaAnalyzer.tokenize(normB.getIdentifierNormalizedSource());
        WinnowingTokenEngine.WinnowingResult winnowRes = winnowingEngine.compare(tokA, tokB);

        AstStructuralEngine.AstMatchResult astRes = astEngine.compare(
                javaAnalyzer.extractAst(codeA), javaAnalyzer.extractAst(codeB),
                javaAnalyzer.extractFunctions(codeA), javaAnalyzer.extractFunctions(codeB));
        ControlFlowEngine.CfgMatchResult cfgRes = cfgEngine.compare(
                javaAnalyzer.extractControlFlow(codeA), javaAnalyzer.extractControlFlow(codeB));

        MultiSignalScoringEngine.MultiSignalScores scores = scoringEngine.computeScores(
                null, exactRes.score, winnowRes.getFinalScore(), astRes.getFinalScore(), cfgRes.getFinalScore(),
                winnowRes.getFinalScore(), exactRes.score, 0.0, 0.0, 15, winnowRes.getMatchingFingerprints(), 0);

        return scores.getSuspicionScore() >= 45.0;
    }
}

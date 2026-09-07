package com.example.demo.plagiarism.matching;

import com.example.demo.plagiarism.ingestion.ExtractedFile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@Slf4j
public class FileMatcher {

    /**
     * Matches files between Submission A and Submission B, finding corresponding logical source files.
     */
    public List<FileMatchResult> matchFiles(List<ExtractedFile> filesA, List<ExtractedFile> filesB) {
        List<FileMatchResult> matches = new ArrayList<>();
        Set<ExtractedFile> matchedB = new HashSet<>();

        // Sort files by size descending so main implementation files get matched first
        List<ExtractedFile> sortedA = new ArrayList<>(filesA);
        sortedA.sort(Comparator.comparingLong(ExtractedFile::getSizeBytes).reversed());

        for (ExtractedFile fileA : sortedA) {
            ExtractedFile bestCandidate = null;
            double bestScore = -1.0;
            FileMatchResult.Classification bestClassification = FileMatchResult.Classification.UNRELATED;
            String bestRationale = "";
            boolean isRenamed = false;

            for (ExtractedFile fileB : filesB) {
                if (matchedB.contains(fileB)) continue;

                // 1. Exact SHA-256 hash match
                if (fileA.getSha256() != null && fileA.getSha256().equals(fileB.getSha256())) {
                    bestCandidate = fileB;
                    bestScore = 1.0;
                    bestClassification = FileMatchResult.Classification.EXACT_MATCH;
                    isRenamed = fileA.getFilename() != null && fileB.getFilename() != null && !fileA.getFilename().equalsIgnoreCase(fileB.getFilename());
                    bestRationale = isRenamed ? "Exact binary/content match under renamed filename" : "Identical file match";
                    break; // Can't get better than exact match
                }

                // 2. Normalized hash match (identical code disregarding formatting)
                if (fileA.getNormalizedSha256() != null && fileA.getNormalizedSha256().equals(fileB.getNormalizedSha256()) && fileA.getLineCount() > 2) {
                    bestCandidate = fileB;
                    bestScore = 0.98;
                    bestClassification = FileMatchResult.Classification.EXACT_MATCH;
                    isRenamed = fileA.getFilename() != null && fileB.getFilename() != null && !fileA.getFilename().equalsIgnoreCase(fileB.getFilename());
                    bestRationale = "Normalized code match (identical code ignoring whitespace/comments)";
                    break;
                }

                // Skip cross-matching if languages are completely incompatible (e.g. .py vs .java)
                if (!isLanguageCompatible(fileA.getDetectedLanguage(), fileB.getDetectedLanguage())) {
                    continue;
                }

                // 3. Multi-criteria similarity scoring
                double nameSim = calculateFilenameSimilarity(fileA.getFilename(), fileB.getFilename());
                double tokenSim = calculateTokenJaccard(fileA.getContent(), fileB.getContent());
                double lineRatio = calculateRatio(fileA.getLineCount(), fileB.getLineCount());

                // Combined score
                double score = (tokenSim * 0.60) + (nameSim * 0.25) + (lineRatio * 0.15);

                if (score > bestScore) {
                    bestScore = score;
                    bestCandidate = fileB;
                    isRenamed = !fileA.getFilename().equalsIgnoreCase(fileB.getFilename());

                    if (score >= 0.70) {
                        bestClassification = FileMatchResult.Classification.PROBABLE_MATCH;
                        bestRationale = String.format("High structural & token similarity (%.1f%%)", tokenSim * 100);
                    } else if (score >= 0.40) {
                        bestClassification = FileMatchResult.Classification.POSSIBLE_MATCH;
                        bestRationale = String.format("Moderate overlap (%.1f%% token sim, %.1f%% name sim)", tokenSim * 100, nameSim * 100);
                    } else {
                        bestClassification = FileMatchResult.Classification.UNRELATED;
                        bestRationale = "Low overlap";
                    }
                }
            }

            if (bestCandidate != null && bestClassification != FileMatchResult.Classification.UNRELATED) {
                matchedB.add(bestCandidate);
                matches.add(FileMatchResult.builder()
                        .file1(fileA)
                        .file2(bestCandidate)
                        .classification(bestClassification)
                        .matchConfidence(bestScore)
                        .isRenamed(isRenamed)
                        .rationale(bestRationale)
                        .build());
            } else {
                // File A has no corresponding file in B (unique/extra file)
                matches.add(FileMatchResult.builder()
                        .file1(fileA)
                        .file2(null)
                        .classification(FileMatchResult.Classification.UNIQUE_FILE)
                        .matchConfidence(0.0)
                        .isRenamed(false)
                        .rationale("Unique file with no match in compared submission")
                        .build());
            }
        }

        // Remaining unmatched files in B are missing from A
        for (ExtractedFile fileB : filesB) {
            if (!matchedB.contains(fileB)) {
                matches.add(FileMatchResult.builder()
                        .file1(null)
                        .file2(fileB)
                        .classification(FileMatchResult.Classification.UNIQUE_FILE)
                        .matchConfidence(0.0)
                        .isRenamed(false)
                        .rationale("File present in compared submission only")
                        .build());
            }
        }

        return matches;
    }

    private boolean isLanguageCompatible(String langA, String langB) {
        if (langA == null || langB == null) return true;
        if (langA.equals(langB)) return true;
        if (langA.equals("GENERIC") || langB.equals("GENERIC")) return true;
        // C and C++ can match
        if ((langA.equals("C") && langB.equals("CPP")) || (langA.equals("CPP") && langB.equals("C"))) return true;
        // JS and TS can match
        if ((langA.equals("JAVASCRIPT") && langB.equals("TYPESCRIPT")) || (langA.equals("TYPESCRIPT") && langB.equals("JAVASCRIPT"))) return true;
        return false;
    }

    public double calculateFilenameSimilarity(String name1, String name2) {
        if (name1 == null || name2 == null) return 0.0;
        String base1 = stripExtension(name1).toLowerCase();
        String base2 = stripExtension(name2).toLowerCase();
        if (base1.equals(base2)) return 1.0;

        int maxLen = Math.max(base1.length(), base2.length());
        if (maxLen == 0) return 1.0;
        int distance = levenshteinDistance(base1, base2);
        return 1.0 - ((double) distance / maxLen);
    }

    private double calculateTokenJaccard(String text1, String text2) {
        if (text1 == null || text2 == null || text1.isEmpty() || text2.isEmpty()) return 0.0;
        Set<String> tokens1 = extractTokenSet(text1);
        Set<String> tokens2 = extractTokenSet(text2);
        if (tokens1.isEmpty() || tokens2.isEmpty()) return 0.0;

        Set<String> intersection = new HashSet<>(tokens1);
        intersection.retainAll(tokens2);

        Set<String> union = new HashSet<>(tokens1);
        union.addAll(tokens2);

        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    private Set<String> extractTokenSet(String text) {
        String[] words = text.split("\\W+");
        Set<String> set = new HashSet<>();
        for (String w : words) {
            if (w.length() > 1) {
                set.add(w.toLowerCase());
            }
        }
        return set;
    }

    private double calculateRatio(int a, int b) {
        if (a <= 0 && b <= 0) return 1.0;
        if (a <= 0 || b <= 0) return 0.0;
        return (double) Math.min(a, b) / Math.max(a, b);
    }

    private String stripExtension(String filename) {
        if (filename == null) return "";
        String base = filename.replace('\\', '/');
        int lastSlash = base.lastIndexOf('/');
        if (lastSlash != -1) {
            base = base.substring(lastSlash + 1);
        }
        int dot = base.lastIndexOf('.');
        return (dot != -1) ? base.substring(0, dot) : base;
    }

    private int levenshteinDistance(String s1, String s2) {
        int[] prev = new int[s2.length() + 1];
        int[] curr = new int[s2.length() + 1];

        for (int j = 0; j <= s2.length(); j++) prev[j] = j;

        for (int i = 1; i <= s1.length(); i++) {
            curr[0] = i;
            for (int j = 1; j <= s2.length(); j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                curr[j] = Math.min(Math.min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
            }
            System.arraycopy(curr, 0, prev, 0, curr.length);
        }
        return prev[s2.length()];
    }
}

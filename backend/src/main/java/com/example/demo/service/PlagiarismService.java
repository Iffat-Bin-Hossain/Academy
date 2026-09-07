package com.example.demo.service;

import com.example.demo.dto.PlagiarismAnalysisResponse;
import com.example.demo.dto.PlagiarismBaselineRequest;
import com.example.demo.dto.PlagiarismCheckRequest;
import com.example.demo.dto.PlagiarismReviewRequest;
import com.example.demo.model.*;
import com.example.demo.plagiarism.analyzer.*;
import com.example.demo.plagiarism.engine.*;
import com.example.demo.plagiarism.ingestion.ExtractedFile;
import com.example.demo.plagiarism.ingestion.SecureArchiveExtractor;
import com.example.demo.plagiarism.ingestion.SubmissionManifestService;
import com.example.demo.plagiarism.matching.FileMatchResult;
import com.example.demo.plagiarism.matching.FileMatcher;
import com.example.demo.plagiarism.model.*;
import com.example.demo.plagiarism.repository.*;
import com.example.demo.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PlagiarismService {

    private final AssignmentRepository assignmentRepository;
    private final StudentSubmissionRepository submissionRepository;
    private final SubmissionFileRepository submissionFileRepository;
    private final CourseTeacherRepository courseTeacherRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    // Plagiarism Detection Engine Components
    private final SecureArchiveExtractor secureArchiveExtractor;
    private final SubmissionManifestService submissionManifestService;
    private final FileMatcher fileMatcher;
    private final LanguageAnalyzerRegistry analyzerRegistry;
    private final ExactMatchEngine exactMatchEngine;
    private final WinnowingTokenEngine winnowingTokenEngine;
    private final AstStructuralEngine astStructuralEngine;
    private final ControlFlowEngine controlFlowEngine;
    private final SemanticEmbeddingEngine semanticEmbeddingEngine;
    private final BaselineSubtractionEngine baselineSubtractionEngine;
    private final MultiSignalScoringEngine multiSignalScoringEngine;
    private final EvidenceExtractionEngine evidenceExtractionEngine;
    private final ClusterDetectionEngine clusterDetectionEngine;

    // Database Repositories
    private final PlagiarismAnalysisRunRepository runRepository;
    private final PlagiarismSubmissionManifestRepository manifestRepository;
    private final PlagiarismSimilarityPairRepository pairRepository;
    private final PlagiarismEvidenceItemRepository evidenceItemRepository;
    private final PlagiarismClusterRepository clusterRepository;
    private final PlagiarismReviewDecisionRepository reviewDecisionRepository;
    private final PlagiarismBaselineRepository baselineRepository;

    private final ObjectMapper objectMapper;

    // Memory cache for quick progress polling while analysis is active
    private final Map<String, PlagiarismAnalysisResponse.Progress> activeProgressMap = new ConcurrentHashMap<>();

    /**
     * Starts an asynchronous plagiarism analysis run.
     */
    public String startPlagiarismAnalysis(Long assignmentId, PlagiarismCheckRequest request) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        Course course = assignment.getCourse();

        boolean isAssigned = courseTeacherRepository.existsByCourseAndTeacherAndActiveTrue(course, teacher) ||
                (course.getAssignedTeacher() != null && course.getAssignedTeacher().getId().equals(request.getTeacherId()));

        if (!isAssigned) {
            throw new RuntimeException("Teacher is not assigned to the course containing this assignment");
        }

        String runId = UUID.randomUUID().toString();
        double threshold = request.getSettings() != null ? request.getSettings().getThreshold() : 70.0;

        PlagiarismAnalysisRun run = PlagiarismAnalysisRun.builder()
                .id(runId)
                .assignment(assignment)
                .status(PlagiarismAnalysisRun.RunStatus.PENDING)
                .threshold(threshold)
                .currentStage("Initializing forensic copy check pipeline...")
                .progressCurrent(0)
                .progressTotal(0)
                .exactWeight(0.25)
                .astWeight(0.25)
                .tokenWeight(0.15)
                .cfgWeight(0.15)
                .fingerprintWeight(0.10)
                .semanticWeight(0.10)
                .build();

        runRepository.save(run);

        activeProgressMap.put(runId, PlagiarismAnalysisResponse.Progress.builder()
                .current(0)
                .total(0)
                .stage("Initializing forensic copy check pipeline...")
                .build());

        // Launch async processing
        performPlagiarismAnalysisAsync(runId, assignmentId, request);

        return runId;
    }

    @Async
    public void performPlagiarismAnalysisAsync(String runId, Long assignmentId, PlagiarismCheckRequest request) {
        long startTime = System.currentTimeMillis();
        log.info("Starting forensic plagiarism analysis run: {}", runId);

        PlagiarismAnalysisRun run = runRepository.findById(runId).orElse(null);
        if (run == null) return;

        try {
            updateProgress(run, 1, 10, "Loading student submissions...", PlagiarismAnalysisRun.RunStatus.EXTRACTING);

            List<StudentSubmission> submissions = submissionRepository.findByAssignment_IdOrderBySubmittedAtAsc(assignmentId);
            log.info("Found {} submissions for assignment: {}", submissions.size(), assignmentId);

            if (submissions.size() < 2) {
                run.setStatus(PlagiarismAnalysisRun.RunStatus.FAILED);
                run.setErrorMessage("At least 2 submissions are required for plagiarism comparison.");
                runRepository.save(run);
                return;
            }

            run.setTotalSubmissions(submissions.size());
            int totalPairsExpected = (submissions.size() * (submissions.size() - 1)) / 2;
            run.setTotalComparisons(totalPairsExpected);
            runRepository.save(run);

            // Step 1: Ingestion & Extraction for all submissions
            updateProgress(run, 2, 10, "Extracting and parsing submission archives...", PlagiarismAnalysisRun.RunStatus.EXTRACTING);

            List<ExtractedSubmissionData> extractedSubmissions = new ArrayList<>();

            for (StudentSubmission sub : submissions) {
                try {
                    List<SubmissionFile> files = submissionFileRepository.findBySubmissionOrderByUploadedAtAsc(sub);
                    List<ExtractedFile> allExtracted = new ArrayList<>();
                    String archiveHash = "";

                    for (SubmissionFile sf : files) {
                        Path filePath = Paths.get(sf.getFilePath());
                        if (java.nio.file.Files.exists(filePath)) {
                            List<ExtractedFile> extracted = secureArchiveExtractor.extractSecurely(filePath, sf.getOriginalFilename());
                            allExtracted.addAll(extracted);
                            if (archiveHash.isEmpty() && !extracted.isEmpty()) {
                                archiveHash = extracted.get(0).getSha256();
                            }
                        }
                    }

                    if (!allExtracted.isEmpty()) {
                        submissionManifestService.generateAndSaveManifest(
                                run, sub, sub.getStudent(), archiveHash, allExtracted);

                        // Process code representations with pluggable language analyzers
                        ExtractedSubmissionData subData = new ExtractedSubmissionData(sub, allExtracted);
                        subData.processAnalyzers(analyzerRegistry);
                        extractedSubmissions.add(subData);
                    }
                } catch (Exception e) {
                    log.error("Error extracting submission {}: {}", sub.getId(), e.getMessage());
                }
            }

            if (extractedSubmissions.size() < 2) {
                run.setStatus(PlagiarismAnalysisRun.RunStatus.FAILED);
                run.setErrorMessage("Fewer than 2 valid source submissions were extracted.");
                runRepository.save(run);
                return;
            }

            // Step 2: Load Assignment Starter Code / Baseline
            updateProgress(run, 4, 10, "Analyzing assignment starter code and baseline templates...", PlagiarismAnalysisRun.RunStatus.ANALYZING);
            List<PlagiarismBaseline> baselines = baselineRepository.findByAssignment_Id(assignmentId);

            // Step 3: Pairwise Cross-Submission Comparison
            updateProgress(run, 6, 10, "Running multi-engine forensic similarity checks...", PlagiarismAnalysisRun.RunStatus.COMPARING);

            List<PlagiarismSimilarityPair> candidatePairs = new ArrayList<>();
            Map<String, Map<String, Double>> similarityMatrix = new HashMap<>();

            for (int i = 0; i < extractedSubmissions.size(); i++) {
                ExtractedSubmissionData subA = extractedSubmissions.get(i);
                similarityMatrix.putIfAbsent(subA.student.getName(), new HashMap<>());
                similarityMatrix.get(subA.student.getName()).put(subA.student.getName(), 100.0);

                for (int j = i + 1; j < extractedSubmissions.size(); j++) {
                    ExtractedSubmissionData subB = extractedSubmissions.get(j);
                    similarityMatrix.putIfAbsent(subB.student.getName(), new HashMap<>());

                    // Compare submission A with submission B
                    PlagiarismSimilarityPair pair = compareSubmissions(run, subA, subB, baselines);

                    similarityMatrix.get(subA.student.getName()).put(subB.student.getName(), pair.getSuspicionScore());
                    similarityMatrix.get(subB.student.getName()).put(subA.student.getName(), pair.getSuspicionScore());

                    // Filter pairs with meaningful overlap
                    if (pair.getRawSimilarityScore() >= 15.0 || pair.getSuspicionScore() >= 20.0) {
                        candidatePairs.add(pair);
                    }
                }
            }

            run.setCandidatePairsCount(candidatePairs.size());

            // Step 4: Collusion Clustering & Evidence Persistence
            updateProgress(run, 8, 10, "Detecting collusion rings and generating evidence items...", PlagiarismAnalysisRun.RunStatus.GENERATING_REPORT);

            // Persist pairs and evidence
            List<PlagiarismSimilarityPair> savedPairs = new ArrayList<>();
            for (PlagiarismSimilarityPair pair : candidatePairs) {
                PlagiarismSimilarityPair saved = pairRepository.save(pair);
                savedPairs.add(saved);

                // Save evidence items for this pair
                if (pair.getTransientEvidenceItems() != null) {
                    for (PlagiarismEvidenceItem item : pair.getTransientEvidenceItems()) {
                        item.setPair(saved);
                        evidenceItemRepository.save(item);
                    }
                }
            }

            // Detect collusion clusters
            List<PlagiarismCluster> clusters = clusterDetectionEngine.detectClusters(
                    run, savedPairs, run.getThreshold());
            for (PlagiarismCluster cluster : clusters) {
                clusterRepository.save(cluster);
            }

            // Step 5: Finalize run
            long duration = System.currentTimeMillis() - startTime;
            run.setDurationMs(duration);
            run.setStatus(PlagiarismAnalysisRun.RunStatus.COMPLETED);
            run.setCurrentStage("Forensic analysis completed successfully");
            run.setProgressCurrent(10);
            run.setProgressTotal(10);
            run.setCompletedAt(LocalDateTime.now());
            run.setSuspiciousPairsCount((int) savedPairs.stream()
                    .filter(p -> p.getSuspicionScore() >= run.getThreshold()).count());

            runRepository.save(run);

            activeProgressMap.put(runId, PlagiarismAnalysisResponse.Progress.builder()
                    .current(10)
                    .total(10)
                    .stage("Completed")
                    .build());

            log.info("Plagiarism run {} completed in {}ms. Found {} candidate pairs, {} above threshold.",
                    runId, duration, savedPairs.size(), run.getSuspiciousPairsCount());

            // Send notifications to students flagged with high suspicion
            notifyFlaggedStudents(assignmentRepository.findById(assignmentId).orElse(null), savedPairs, run.getThreshold());

        } catch (Exception e) {
            log.error("Fatal error in plagiarism analysis run {}: {}", runId, e.getMessage(), e);
            run.setStatus(PlagiarismAnalysisRun.RunStatus.FAILED);
            run.setErrorMessage("Analysis failed: " + e.getMessage());
            runRepository.save(run);
        }
    }

    private PlagiarismSimilarityPair compareSubmissions(
            PlagiarismAnalysisRun run,
            ExtractedSubmissionData subA,
            ExtractedSubmissionData subB,
            List<PlagiarismBaseline> baselines) {

        List<FileMatchResult> fileMatches = fileMatcher.matchFiles(subA.files, subB.files);

        double maxRawSim = 0.0;
        double maxSuspicion = 0.0;
        double bestExact = 0.0;
        double bestToken = 0.0;
        double bestAst = 0.0;
        double bestCfg = 0.0;
        double bestFp = 0.0;
        double bestSem = 0.0;
        double bestConfidence = 0.0;
        double bestBaseline = 0.0;
        PlagiarismSimilarityPair.RiskCategory bestRisk = PlagiarismSimilarityPair.RiskCategory.NO_CONCERN;
        String bestRationale = "";
        String dominantLang = "GENERIC";
        String sample1 = "";
        String sample2 = "";
        StringBuilder comparedFiles = new StringBuilder();
        List<PlagiarismEvidenceItem> evidenceList = new ArrayList<>();

        for (FileMatchResult match : fileMatches) {
            if (match.getFile1() == null || match.getFile2() == null) continue;

            ExtractedFile f1 = match.getFile1();
            ExtractedFile f2 = match.getFile2();

            if (comparedFiles.length() > 0) comparedFiles.append(", ");
            comparedFiles.append(f1.getFilename());
            if (match.isRenamed()) {
                comparedFiles.append(" (↔ ").append(f2.getFilename()).append(")");
            }

            ProcessedFile pf1 = subA.processedFiles.get(f1.getRelativePath());
            ProcessedFile pf2 = subB.processedFiles.get(f2.getRelativePath());

            if (pf1 == null || pf2 == null) continue;
            dominantLang = f1.getDetectedLanguage();

            // Run Engine 1: Exact Match Engine
            ExactMatchEngine.ExactMatchResult exactRes = exactMatchEngine.compare(pf1.normalized, pf2.normalized);

            // Run Engine 2: Winnowing Token Engine
            WinnowingTokenEngine.WinnowingResult winnowRes = winnowingTokenEngine.compare(pf1.tokenStream, pf2.tokenStream);

            // Run Engine 3: AST Structural Engine
            AstStructuralEngine.AstMatchResult astRes = astStructuralEngine.compare(
                    pf1.astTree, pf2.astTree, pf1.functions, pf2.functions);

            // Run Engine 4: Control Flow Engine
            ControlFlowEngine.CfgMatchResult cfgRes = controlFlowEngine.compare(pf1.cfg, pf2.cfg);

            // Run Engine 5: Semantic Embedding Engine
            double semScore = semanticEmbeddingEngine.calculateSemanticSimilarity(
                    pf1.tokenStream, pf2.tokenStream, pf1.metrics, pf2.metrics);

            // Run Engine 6: Baseline Subtraction
            double baselineContrib = baselineSubtractionEngine.calculateBaselineContribution(
                    f1.getContent(), f2.getContent(), baselines, winnowRes);

            // Multi-Signal Scoring Engine
            MultiSignalScoringEngine.MultiSignalScores scores = multiSignalScoringEngine.computeScores(
                    run,
                    exactRes.score,
                    winnowRes.getFinalScore(),
                    astRes.getFinalScore(),
                    cfgRes.getFinalScore(),
                    winnowRes.getMatchingFingerprints() > 0 ? (double) winnowRes.getMatchingFingerprints() / Math.max(1, winnowRes.getTotalFingerprintsA()) : 0.0,
                    semScore,
                    0.0, // Behavioral score default
                    baselineContrib,
                    f1.getLineCount(),
                    winnowRes.getMatchingFingerprints(),
                    pf1.normalized != null ? pf1.normalized.getUnusualIdentifiers().size() : 0
            );

            if (scores.getSuspicionScore() > maxSuspicion) {
                maxSuspicion = scores.getSuspicionScore();
                maxRawSim = scores.getRawSimilarityScore();
                bestExact = exactRes.score * 100.0;
                bestToken = winnowRes.getFinalScore() * 100.0;
                bestAst = astRes.getFinalScore() * 100.0;
                bestCfg = cfgRes.getFinalScore() * 100.0;
                bestFp = winnowRes.getMatchingFingerprints() * 10.0;
                bestSem = semScore * 100.0;
                bestConfidence = scores.getConfidenceScore();
                bestBaseline = baselineContrib * 100.0;
                bestRisk = scores.getRiskCategory();
                bestRationale = scores.getRationale();

                sample1 = f1.getContent() != null ? f1.getContent() : "";
                sample2 = f2.getContent() != null ? f2.getContent() : "";

                // Generate explainable evidence items
                evidenceList = evidenceExtractionEngine.extractEvidence(
                        null, f1.getRelativePath(), f2.getRelativePath(),
                        pf1.normalized, pf2.normalized,
                        astRes, winnowRes, exactRes, cfgRes, baselineContrib);
            }
        }

        PlagiarismSimilarityPair pair = PlagiarismSimilarityPair.builder()
                .run(run)
                .student1(subA.student)
                .student2(subB.student)
                .submission1Id(subA.submission.getId())
                .submission2Id(subB.submission.getId())
                .rawSimilarityScore(maxRawSim)
                .suspicionScore(maxSuspicion)
                .confidenceScore(bestConfidence)
                .exactMatchScore(bestExact)
                .tokenScore(bestToken)
                .astScore(bestAst)
                .cfgScore(bestCfg)
                .fingerprintScore(bestFp)
                .semanticScore(bestSem)
                .behavioralScore(0.0)
                .baselineContribution(bestBaseline)
                .riskCategory(bestRisk)
                .dominantLanguage(dominantLang)
                .comparedFilesSummary(comparedFiles.length() > 490 ? comparedFiles.substring(0, 490) + "..." : comparedFiles.toString())
                .summaryRationale(bestRationale)
                .code1Sample(sample1)
                .code2Sample(sample2)
                .build();

        pair.setTransientEvidenceItems(evidenceList);

        return pair;
    }

    private void updateProgress(PlagiarismAnalysisRun run, int current, int total, String stage, PlagiarismAnalysisRun.RunStatus status) {
        run.setProgressCurrent(current);
        run.setProgressTotal(total);
        run.setCurrentStage(stage);
        run.setStatus(status);
        runRepository.save(run);

        activeProgressMap.put(run.getId(), PlagiarismAnalysisResponse.Progress.builder()
                .current(current)
                .total(total)
                .stage(stage)
                .build());
    }

    public PlagiarismAnalysisResponse getAnalysisStatus(String runId) {
        PlagiarismAnalysisRun run = runRepository.findById(runId)
                .orElseThrow(() -> new RuntimeException("Analysis run not found"));

        PlagiarismAnalysisResponse.Progress prog = activeProgressMap.getOrDefault(runId,
                PlagiarismAnalysisResponse.Progress.builder()
                        .current(run.getProgressCurrent())
                        .total(run.getProgressTotal())
                        .stage(run.getCurrentStage())
                        .build());

        String statusStr = switch (run.getStatus()) {
            case COMPLETED -> "completed";
            case FAILED -> "failed";
            case CANCELLED -> "cancelled";
            default -> "processing";
        };

        return PlagiarismAnalysisResponse.builder()
                .status(statusStr)
                .progress(prog)
                .build();
    }

    public PlagiarismAnalysisResponse getAnalysisResults(String runId) {
        PlagiarismAnalysisRun run = runRepository.findById(runId)
                .orElseThrow(() -> new RuntimeException("Analysis run not found"));

        List<PlagiarismSimilarityPair> pairs = pairRepository.findByRun_IdOrderBySuspicionScoreDesc(runId);
        List<PlagiarismCluster> clusters = clusterRepository.findByRun_IdOrderByRiskLevelDesc(runId);

        List<PlagiarismAnalysisResponse.SimilarityPair> pairDtos = new ArrayList<>();
        for (PlagiarismSimilarityPair p : pairs) {
            List<PlagiarismEvidenceItem> evidence = evidenceItemRepository.findByPair_IdOrderBySimilarityScoreDesc(p.getId());

            List<PlagiarismAnalysisResponse.EvidenceDto> evDtos = evidence.stream()
                    .map(e -> PlagiarismAnalysisResponse.EvidenceDto.builder()
                            .evidenceType(e.getEvidenceType().name())
                            .file1Path(e.getFile1Path())
                            .file2Path(e.getFile2Path())
                            .startLine1(e.getStartLine1())
                            .endLine1(e.getEndLine1())
                            .startLine2(e.getStartLine2())
                            .endLine2(e.getEndLine2())
                            .similarityScore(e.getSimilarityScore())
                            .confidenceScore(e.getConfidenceScore())
                            .isBaseline(e.isBaseline())
                            .explanation(e.getExplanation())
                            .build())
                    .collect(Collectors.toList());

            pairDtos.add(PlagiarismAnalysisResponse.SimilarityPair.builder()
                    .pairId(p.getId())
                    .student1Name(p.getStudent1().getName())
                    .student2Name(p.getStudent2().getName())
                    .student1Id(p.getStudent1().getId())
                    .student2Id(p.getStudent2().getId())
                    .similarity(p.getRawSimilarityScore())
                    .suspicionScore(p.getSuspicionScore())
                    .confidenceScore(p.getConfidenceScore())
                    .riskCategory(p.getRiskCategory().name())
                    .type(p.getDominantLanguage())
                    .filesCompared(p.getComparedFilesSummary())
                    .detectionMethod("Multi-Signal Forensic (Exact + Token + AST + CFG + Baseline)")
                    .code1(p.getCode1Sample())
                    .code2(p.getCode2Sample())
                    .exactMatchScore(p.getExactMatchScore())
                    .tokenScore(p.getTokenScore())
                    .astScore(p.getAstScore())
                    .cfgScore(p.getCfgScore())
                    .fingerprintScore(p.getFingerprintScore())
                    .semanticScore(p.getSemanticScore())
                    .baselineContribution(p.getBaselineContribution())
                    .summaryRationale(p.getSummaryRationale())
                    .clusterId(p.getClusterId())
                    .evidenceItems(evDtos)
                    .build());
        }

        List<PlagiarismAnalysisResponse.ClusterSummary> clusterDtos = new ArrayList<>();
        for (PlagiarismCluster c : clusters) {
            List<Map<String, Object>> memberList = new ArrayList<>();
            try {
                if (c.getStudentDetailsJson() != null) {
                    memberList = objectMapper.readValue(c.getStudentDetailsJson(), new TypeReference<>() {});
                }
            } catch (Exception ignored) {}

            clusterDtos.add(PlagiarismAnalysisResponse.ClusterSummary.builder()
                    .clusterNumber(c.getClusterNumber())
                    .riskLevel(c.getRiskLevel().name())
                    .studentCount(c.getStudentCount())
                    .averageSimilarity(c.getAverageSimilarity())
                    .summaryText(c.getSummaryText())
                    .students(memberList)
                    .build());
        }

        PlagiarismAnalysisResponse.AnalysisMetadata metadata = PlagiarismAnalysisResponse.AnalysisMetadata.builder()
                .analysisTime(run.getDurationMs() != null ? run.getDurationMs() : 0L)
                .totalSubmissions(run.getTotalSubmissions())
                .comparisons(run.getTotalComparisons())
                .algorithm("Multi-Signal Forensic Ensemble (Winnowing + AST Tree + CFG + Baseline Subtraction)")
                .aiUsed(false)
                .suspiciousPairs(run.getSuspiciousPairsCount())
                .clusterCount(clusters.size())
                .build();

        PlagiarismAnalysisResponse.PlagiarismResults results = PlagiarismAnalysisResponse.PlagiarismResults.builder()
                .similarities(pairDtos)
                .clusters(clusterDtos)
                .metadata(metadata)
                .build();

        return PlagiarismAnalysisResponse.builder()
                .status("completed")
                .results(results)
                .build();
    }

    public PlagiarismAnalysisResponse.SimilarityPair getPairReport(Long pairId) {
        PlagiarismSimilarityPair p = pairRepository.findById(pairId)
                .orElseThrow(() -> new RuntimeException("Pair not found"));

        List<PlagiarismEvidenceItem> evidence = evidenceItemRepository.findByPair_IdOrderBySimilarityScoreDesc(p.getId());

        List<PlagiarismAnalysisResponse.EvidenceDto> evDtos = evidence.stream()
                .map(e -> PlagiarismAnalysisResponse.EvidenceDto.builder()
                        .evidenceType(e.getEvidenceType().name())
                        .file1Path(e.getFile1Path())
                        .file2Path(e.getFile2Path())
                        .startLine1(e.getStartLine1())
                        .endLine1(e.getEndLine1())
                        .startLine2(e.getStartLine2())
                        .endLine2(e.getEndLine2())
                        .similarityScore(e.getSimilarityScore())
                        .confidenceScore(e.getConfidenceScore())
                        .isBaseline(e.isBaseline())
                        .explanation(e.getExplanation())
                        .build())
                .collect(Collectors.toList());

        return PlagiarismAnalysisResponse.SimilarityPair.builder()
                .pairId(p.getId())
                .student1Name(p.getStudent1().getName())
                .student2Name(p.getStudent2().getName())
                .student1Id(p.getStudent1().getId())
                .student2Id(p.getStudent2().getId())
                .similarity(p.getRawSimilarityScore())
                .suspicionScore(p.getSuspicionScore())
                .confidenceScore(p.getConfidenceScore())
                .riskCategory(p.getRiskCategory().name())
                .type(p.getDominantLanguage())
                .filesCompared(p.getComparedFilesSummary())
                .detectionMethod("Multi-Signal Forensic")
                .code1(p.getCode1Sample())
                .code2(p.getCode2Sample())
                .exactMatchScore(p.getExactMatchScore())
                .tokenScore(p.getTokenScore())
                .astScore(p.getAstScore())
                .cfgScore(p.getCfgScore())
                .fingerprintScore(p.getFingerprintScore())
                .semanticScore(p.getSemanticScore())
                .baselineContribution(p.getBaselineContribution())
                .summaryRationale(p.getSummaryRationale())
                .clusterId(p.getClusterId())
                .evidenceItems(evDtos)
                .build();
    }

    @Transactional
    public void saveReviewDecision(Long pairId, PlagiarismReviewRequest request, Long reviewerId) {
        PlagiarismSimilarityPair pair = pairRepository.findById(pairId)
                .orElseThrow(() -> new RuntimeException("Pair not found"));

        User reviewer = userRepository.findById(reviewerId)
                .orElseThrow(() -> new RuntimeException("Reviewer not found"));

        PlagiarismReviewDecision decision = reviewDecisionRepository.findByPair_Id(pairId)
                .orElse(PlagiarismReviewDecision.builder().pair(pair).build());

        decision.setReviewer(reviewer);
        decision.setDecision(PlagiarismReviewDecision.DecisionType.valueOf(request.getDecision()));
        decision.setPenaltyPercentage(request.getPenaltyPercentage());
        decision.setNotes(request.getNotes());
        decision.setDecidedAt(LocalDateTime.now());

        reviewDecisionRepository.save(decision);
        log.info("Teacher {} recorded review decision {} for pair {}", reviewer.getName(), request.getDecision(), pairId);
    }

    @Transactional
    public PlagiarismBaseline uploadBaseline(Long assignmentId, PlagiarismBaselineRequest request) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        PlagiarismBaseline baseline = PlagiarismBaseline.builder()
                .assignment(assignment)
                .filename(request.getFilename())
                .language(request.getLanguage() != null ? request.getLanguage() : "GENERIC")
                .codeContent(request.getCodeContent())
                .build();

        return baselineRepository.save(baseline);
    }

    public void cancelAnalysis(String runId) {
        PlagiarismAnalysisRun run = runRepository.findById(runId).orElse(null);
        if (run != null && run.getStatus() != PlagiarismAnalysisRun.RunStatus.COMPLETED) {
            run.setStatus(PlagiarismAnalysisRun.RunStatus.CANCELLED);
            run.setCurrentStage("Analysis cancelled by teacher.");
            runRepository.save(run);
        }
        activeProgressMap.remove(runId);
    }

    private void notifyFlaggedStudents(Assignment assignment, List<PlagiarismSimilarityPair> pairs, double threshold) {
        if (assignment == null) return;
        Set<Long> notified = new HashSet<>();

        for (PlagiarismSimilarityPair pair : pairs) {
            if (pair.getSuspicionScore() >= threshold) {
                if (!notified.contains(pair.getStudent1().getId())) {
                    notificationService.createPlagiarismDetectionNotification(
                            pair.getStudent1(), assignment, pair.getSuspicionScore(), "submission by " + pair.getStudent2().getName());
                    notified.add(pair.getStudent1().getId());
                }
                if (!notified.contains(pair.getStudent2().getId())) {
                    notificationService.createPlagiarismDetectionNotification(
                            pair.getStudent2(), assignment, pair.getSuspicionScore(), "submission by " + pair.getStudent1().getName());
                    notified.add(pair.getStudent2().getId());
                }
            }
        }
    }

    // Helper classes for processing state
    private static class ExtractedSubmissionData {
        final StudentSubmission submission;
        final User student;
        final List<ExtractedFile> files;
        final Map<String, ProcessedFile> processedFiles = new HashMap<>();

        ExtractedSubmissionData(StudentSubmission submission, List<ExtractedFile> files) {
            this.submission = submission;
            this.student = submission.getStudent();
            this.files = files;
        }

        void processAnalyzers(LanguageAnalyzerRegistry registry) {
            for (ExtractedFile file : files) {
                if (file.isBinary()) continue;
                LanguageAnalyzer analyzer = registry.getAnalyzer(file.getExtension());

                NormalizedSource norm = analyzer.normalize(file.getContent());
                TokenStream tokens = analyzer.tokenize(file.getContent());
                List<FunctionBlock> funcs = analyzer.extractFunctions(file.getContent());
                AstTree ast = analyzer.extractAst(file.getContent());
                ControlFlowGraph cfg = analyzer.extractControlFlow(file.getContent());
                CodeMetrics metrics = analyzer.extractMetrics(file.getContent());

                processedFiles.put(file.getRelativePath(), new ProcessedFile(norm, tokens, funcs, ast, cfg, metrics));
            }
        }
    }

    private static class ProcessedFile {
        final NormalizedSource normalized;
        final TokenStream tokenStream;
        final List<FunctionBlock> functions;
        final AstTree astTree;
        final ControlFlowGraph cfg;
        final CodeMetrics metrics;

        ProcessedFile(NormalizedSource normalized, TokenStream tokenStream, List<FunctionBlock> functions,
                      AstTree astTree, ControlFlowGraph cfg, CodeMetrics metrics) {
            this.normalized = normalized;
            this.tokenStream = tokenStream;
            this.functions = functions;
            this.astTree = astTree;
            this.cfg = cfg;
            this.metrics = metrics;
        }
    }
}

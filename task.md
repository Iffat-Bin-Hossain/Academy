# Production-Grade Coding Assessment Plagiarism Detection System

## Phase 1 — Architecture & Plan Review
- [x] Inspect existing codebase (controllers, services, database models, frontend)
- [x] Check Java & Gradle environment (OpenJDK 21 located)
- [x] Create comprehensive implementation plan & architecture document
- [x] Await user approval on implementation plan

## Phase 2 — Secure Ingestion & File Structure Discovery
- [x] Implement `SecureArchiveExtractor` (Zip-Slip defense, bomb detection, size & entry limits)
- [x] Implement `SubmissionManifestService` (SHA-256, normalized hashes, file classification)
- [x] Implement `FileMatcher` (cross-submission file alignment and classification)

## Phase 3 — Pluggable Language Analyzers & Normalization
- [x] Implement `LanguageAnalyzer` interface & `LanguageAnalyzerRegistry`
- [x] Implement `JavaLanguageAnalyzer`, `CLanguageAnalyzer`, `CppLanguageAnalyzer`
- [x] Implement `PythonLanguageAnalyzer`, `JavaScriptAnalyzer`, `GenericFallbackAnalyzer`
- [x] Multi-representation normalization: RAW, NORMALIZED, IDENTIFIER-NORMALIZED, TOKENS, AST, CFG

## Phase 4 — Multi-Engine Analysis Pipeline
- [x] Implement `ExactMatchEngine` (SHA-256, normalized, block hashing)
- [x] Implement `WinnowingTokenEngine` (MOSS-style rolling hash & fingerprinting)
- [x] Implement `AstStructuralEngine` (subtree hashes & tree edit distance)
- [x] Implement `ControlFlowEngine` (CFG construction & graph similarity)
- [x] Implement `SemanticEmbeddingEngine` (structural vector similarity)
- [x] Implement `BaselineSubtractionEngine` (starter code & template deduction)

## Phase 5 — Scoring, Clustering & Explainable Evidence
- [x] Multi-signal scoring engine (`similarity_score`, `suspicion_score`, `confidence_score`)
- [x] False-positive calibration (short programs, trivial functions, standard algorithms)
- [x] Collusion ring detection (Union-Find / connected components clustering)
- [x] Forensic evidence engine (line ranges, matching snippets, confidence, reasoning)

## Phase 6 — Database Persistence & REST APIs
- [x] Create JPA Entities (`PlagiarismAnalysisRun`, `PlagiarismSimilarityPair`, `PlagiarismEvidenceItem`, `PlagiarismCluster`, `PlagiarismReviewDecision`, `PlagiarismBaseline`)
- [x] Create Spring Data JPA Repositories
- [x] Build comprehensive REST controller endpoints

## Phase 7 — Forensic Review Frontend Dashboard
- [x] Summary dashboard (risk distribution, clusters, starter-code overlap)
- [x] Interactive similarity matrix & collusion network visualization
- [x] Dual-pane side-by-side synchronized code viewer with line highlights
- [x] Teacher review & decision recording

## Phase 8 — Comprehensive Testing & Benchmarking
- [x] 20-category test suite covering all specified evasion and edge-case techniques
- [x] Precision, Recall, F1 benchmark validation (100% pass)

## Phase 9 — Assignment Timezone Discrepancy & Validation Fix
- [x] Identify root cause of assignment time offset (local vs UTC ISO strings + zero grace period)
- [x] Update `convertInputDateToISO()` and form submission in `AssignmentManagement.js`
- [x] Add 5-minute grace tolerance to client & backend `AssignmentService.java`
- [x] Fix unit tests (`AssignmentControllerTest`, `EmailValidationServiceTest`)
- [x] Build and deploy updated backend jar and frontend bundle to Docker containers

## Phase 10 — Full Codebase Review & Optimization Roadmap
- [x] Conduct file-by-file audit across backend (config, controllers, models, services)
- [x] Conduct file-by-file audit across frontend (components, routing, bundle, API layer)
- [x] Fix immediate security vulnerability (hide password hash in `User.java`) and `GradesService` duplicate-key crash
- [x] Generate comprehensive, actionable optimization and improvement report

## Phase 11 — Complete Emoji Removal & Blue Theme UI Harmonization
- [x] Scan entire frontend codebase for emoji literals and pictographs (0 occurrences remaining)
- [x] Replace all emojis across buttons, badges, forms, and cards with clean `react-icons` (FiClock, FiBookOpen, FiUser, FiAward, FiSearch, FiSend, FiCheck)
- [x] Replace raw message reaction emojis in `MessageIcon.js` with smart reaction SVG icons
- [x] Replace emoji in `ResourceManagement.css` with sleek animated CSS blue spinner
- [x] Harmonize non-blue gradients in `DiscussionThreadDetail.css`, `Dashboard.css`, and `SmartProfile.css` to the blue design system
- [x] Purge all dead duplicate/backup files (`AIHelper_backup.js`, `AssessmentGrid.backup.js`, `AssessmentGrid.new.js`, `AssessmentGridFixed.js`, `AssessmentGridNew.js`, `ModernStudentDashboard_new.js`, `NewAdminDashboard.js`, `ResourceService.java.corrupted`, `ResourceService.java.fixed`)
- [x] Recompile frontend build and deploy directly to running `academy_frontend` Nginx container

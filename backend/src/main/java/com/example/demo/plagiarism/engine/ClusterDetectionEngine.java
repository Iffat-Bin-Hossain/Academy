package com.example.demo.plagiarism.engine;

import com.example.demo.plagiarism.model.PlagiarismAnalysisRun;
import com.example.demo.plagiarism.model.PlagiarismCluster;
import com.example.demo.plagiarism.model.PlagiarismSimilarityPair;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class ClusterDetectionEngine {

    private final ObjectMapper objectMapper;

    /**
     * Detects collusion clusters among suspicious pairs using Disjoint-Set Union (Union-Find).
     */
    public List<PlagiarismCluster> detectClusters(
            PlagiarismAnalysisRun run,
            List<PlagiarismSimilarityPair> pairs,
            double suspicionThreshold) {

        List<PlagiarismCluster> clusters = new ArrayList<>();
        if (pairs == null || pairs.isEmpty()) return clusters;

        // Disjoint Set Union data structures
        Map<Long, Long> parent = new HashMap<>();
        Map<Long, String> studentNames = new HashMap<>();
        Map<Long, Set<Long>> graphEdges = new HashMap<>();

        for (PlagiarismSimilarityPair pair : pairs) {
            long id1 = pair.getStudent1().getId();
            long id2 = pair.getStudent2().getId();
            studentNames.put(id1, pair.getStudent1().getName());
            studentNames.put(id2, pair.getStudent2().getName());

            if (pair.getSuspicionScore() >= suspicionThreshold) {
                union(parent, id1, id2);
                graphEdges.computeIfAbsent(id1, k -> new HashSet<>()).add(id2);
                graphEdges.computeIfAbsent(id2, k -> new HashSet<>()).add(id1);
            }
        }

        // Group students by connected component root
        Map<Long, List<Long>> componentGroups = new HashMap<>();
        for (Long studentId : graphEdges.keySet()) {
            long root = find(parent, studentId);
            componentGroups.computeIfAbsent(root, k -> new ArrayList<>()).add(studentId);
        }

        int clusterNum = 1;
        for (Map.Entry<Long, List<Long>> entry : componentGroups.entrySet()) {
            List<Long> members = entry.getValue();
            // A cluster must contain at least 2 collaborating students (or 3+ for a collusion ring)
            if (members.size() >= 2) {
                // Calculate average similarity among cluster pairs
                double totalSim = 0.0;
                int count = 0;
                for (PlagiarismSimilarityPair p : pairs) {
                    if (members.contains(p.getStudent1().getId()) && members.contains(p.getStudent2().getId())) {
                        totalSim += p.getSuspicionScore();
                        count++;
                        p.setClusterId(clusterNum);
                    }
                }

                double avgSim = count > 0 ? totalSim / count : 0.0;
                PlagiarismCluster.ClusterRiskLevel risk = avgSim >= 80.0 || members.size() >= 3 ?
                        PlagiarismCluster.ClusterRiskLevel.HIGH : PlagiarismCluster.ClusterRiskLevel.MEDIUM;

                List<Map<String, Object>> memberDetails = new ArrayList<>();
                for (Long sId : members) {
                    memberDetails.add(Map.of("id", sId, "name", studentNames.getOrDefault(sId, "Student " + sId)));
                }

                String jsonDetails = "[]";
                try {
                    jsonDetails = objectMapper.writeValueAsString(memberDetails);
                } catch (Exception e) {
                    log.error("Error serializing cluster member details: {}", e.getMessage());
                }

                String summary = String.format("Collusion group with %d students showing %.1f%% average suspicion.",
                        members.size(), avgSim);

                clusters.add(PlagiarismCluster.builder()
                        .run(run)
                        .clusterNumber(clusterNum++)
                        .riskLevel(risk)
                        .studentCount(members.size())
                        .studentDetailsJson(jsonDetails)
                        .averageSimilarity(avgSim)
                        .summaryText(summary)
                        .build());
            }
        }

        return clusters;
    }

    private long find(Map<Long, Long> parent, long i) {
        parent.putIfAbsent(i, i);
        if (parent.get(i) == i) return i;
        long root = find(parent, parent.get(i));
        parent.put(i, root);
        return root;
    }

    private void union(Map<Long, Long> parent, long i, long j) {
        long rootI = find(parent, i);
        long rootJ = find(parent, j);
        if (rootI != rootJ) {
            parent.put(rootI, rootJ);
        }
    }
}

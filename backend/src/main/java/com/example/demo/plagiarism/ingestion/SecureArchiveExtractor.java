package com.example.demo.plagiarism.ingestion;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.zip.GZIPInputStream;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
@Slf4j
public class SecureArchiveExtractor {

    /**
     * Extracts files from a source file or archive securely.
     */
    public List<ExtractedFile> extractSecurely(Path filePath, String originalFilename) throws IOException {
        List<ExtractedFile> results = new ArrayList<>();
        if (!Files.exists(filePath)) {
            log.warn("File not found for extraction: {}", filePath);
            return results;
        }

        long fileSize = Files.size(filePath);
        if (fileSize > ArchiveSecurityConfig.MAX_COMPRESSED_SIZE) {
            log.warn("Archive {} exceeds max allowed compressed size: {} bytes", originalFilename, fileSize);
            throw new SecurityException("Archive size exceeds maximum allowed size of 50MB");
        }

        String lowerName = originalFilename.toLowerCase();

        if (lowerName.endsWith(".zip") || lowerName.endsWith(".jar")) {
            extractZip(filePath, originalFilename, results);
        } else if (lowerName.endsWith(".tar.gz") || lowerName.endsWith(".tgz")) {
            extractTarGz(filePath, originalFilename, results);
        } else if (lowerName.endsWith(".tar")) {
            extractTar(filePath, originalFilename, results);
        } else {
            // Single regular source file
            processSingleFile(filePath, originalFilename, results);
        }

        return results;
    }

    private void extractZip(Path zipPath, String originalFilename, List<ExtractedFile> results) throws IOException {
        long totalUncompressedBytes = 0;
        int fileCount = 0;
        long compressedSize = Math.max(1, Files.size(zipPath));

        try (InputStream fis = Files.newInputStream(zipPath);
             BufferedInputStream bis = new BufferedInputStream(fis);
             ZipInputStream zis = new ZipInputStream(bis)) {

            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (entry.isDirectory()) {
                    zis.closeEntry();
                    continue;
                }

                fileCount++;
                if (fileCount > ArchiveSecurityConfig.MAX_FILE_COUNT) {
                    throw new SecurityException("Archive contains too many files (max: " + ArchiveSecurityConfig.MAX_FILE_COUNT + ")");
                }

                String rawName = entry.getName();
                String sanitizedPath = sanitizePath(rawName);
                if (sanitizedPath == null || isIgnoredPath(sanitizedPath)) {
                    zis.closeEntry();
                    continue;
                }

                String ext = getExtension(sanitizedPath);
                if (ArchiveSecurityConfig.BLOCKED_EXTENSIONS.contains(ext)) {
                    log.debug("Skipping blocked extension file in archive: {}", sanitizedPath);
                    zis.closeEntry();
                    continue;
                }

                // Read stream with size monitoring to prevent decompression bombs
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                byte[] buffer = new byte[8192];
                int readBytes;
                long entryBytes = 0;

                while ((readBytes = zis.read(buffer)) != -1) {
                    entryBytes += readBytes;
                    totalUncompressedBytes += readBytes;

                    if (entryBytes > ArchiveSecurityConfig.MAX_SINGLE_FILE_SIZE) {
                        throw new SecurityException("Single file in archive exceeds max size limit: " + sanitizedPath);
                    }
                    if (totalUncompressedBytes > ArchiveSecurityConfig.MAX_UNCOMPRESSED_SIZE) {
                        throw new SecurityException("Total uncompressed size exceeds limit (decompression bomb protection)");
                    }
                    double ratio = (double) totalUncompressedBytes / compressedSize;
                    if (totalUncompressedBytes > 1024 * 1024 && ratio > ArchiveSecurityConfig.MAX_COMPRESSION_RATIO) {
                        throw new SecurityException("Decompression ratio " + ratio + " exceeded safety limit (Zip bomb detected)");
                    }

                    baos.write(buffer, 0, readBytes);
                }

                byte[] fileBytes = baos.toByteArray();
                ExtractedFile extracted = buildExtractedFile(sanitizedPath, fileBytes);
                if (extracted != null) {
                    results.add(extracted);
                }

                zis.closeEntry();
            }
        }
        log.info("Securely extracted {} files from ZIP: {}", results.size(), originalFilename);
    }

    private void extractTarGz(Path tarGzPath, String originalFilename, List<ExtractedFile> results) throws IOException {
        try (InputStream fis = Files.newInputStream(tarGzPath);
             GZIPInputStream gzis = new GZIPInputStream(fis)) {
            extractTarStream(gzis, originalFilename, results, Files.size(tarGzPath));
        }
    }

    private void extractTar(Path tarPath, String originalFilename, List<ExtractedFile> results) throws IOException {
        try (InputStream fis = Files.newInputStream(tarPath)) {
            extractTarStream(fis, originalFilename, results, Files.size(tarPath));
        }
    }

    /**
     * Minimal lightweight POSIX TAR extractor without external dependencies.
     */
    private void extractTarStream(InputStream is, String originalFilename, List<ExtractedFile> results, long compressedSize) throws IOException {
        byte[] header = new byte[512];
        long totalBytes = 0;
        int fileCount = 0;

        while (true) {
            int offset = 0;
            while (offset < 512) {
                int read = is.read(header, offset, 512 - offset);
                if (read == -1) break;
                offset += read;
            }
            if (offset < 512) break;

            // Check for end of tar archive (two consecutive blocks of zero bytes)
            boolean allZero = true;
            for (byte b : header) {
                if (b != 0) { allZero = false; break; }
            }
            if (allZero) break;

            String fileName = new String(header, 0, 100, StandardCharsets.UTF_8).trim();
            if (fileName.isEmpty()) continue;

            // Extract file size from header (octal, bytes 124-135)
            String sizeStr = new String(header, 124, 12, StandardCharsets.UTF_8).trim();
            long entrySize = 0;
            try {
                if (!sizeStr.isEmpty()) {
                    entrySize = Long.parseLong(sizeStr.replace("\0", ""), 8);
                }
            } catch (NumberFormatException e) {
                entrySize = 0;
            }

            // Type flag at byte 156: '0' or '\0' is regular file, '5' is directory, '2' is symlink
            byte typeFlag = header[156];
            boolean isRegularFile = (typeFlag == '0' || typeFlag == 0 || typeFlag == ' ');

            String sanitized = sanitizePath(fileName);

            if (isRegularFile && sanitized != null && !isIgnoredPath(sanitized) && entrySize > 0) {
                fileCount++;
                if (fileCount > ArchiveSecurityConfig.MAX_FILE_COUNT) {
                    throw new SecurityException("Archive contains too many files");
                }

                if (entrySize > ArchiveSecurityConfig.MAX_SINGLE_FILE_SIZE) {
                    throw new SecurityException("File in tar exceeds single file limit: " + sanitized);
                }

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                byte[] buffer = new byte[8192];
                long remaining = entrySize;
                while (remaining > 0) {
                    int toRead = (int) Math.min(buffer.length, remaining);
                    int r = is.read(buffer, 0, toRead);
                    if (r == -1) break;
                    baos.write(buffer, 0, r);
                    remaining -= r;
                    totalBytes += r;
                }

                // Read padding to 512 byte boundary
                long padding = (512 - (entrySize % 512)) % 512;
                if (padding > 0) {
                    is.skip(padding);
                }

                byte[] fileBytes = baos.toByteArray();
                ExtractedFile extracted = buildExtractedFile(sanitized, fileBytes);
                if (extracted != null) {
                    results.add(extracted);
                }
            } else {
                // Skip entry content and padding
                long padding = (512 - (entrySize % 512)) % 512;
                long toSkip = entrySize + padding;
                is.skip(toSkip);
            }
        }
    }

    private void processSingleFile(Path filePath, String originalFilename, List<ExtractedFile> results) throws IOException {
        byte[] bytes = Files.readAllBytes(filePath);
        String sanitized = sanitizePath(originalFilename);
        if (sanitized != null) {
            ExtractedFile extracted = buildExtractedFile(sanitized, bytes);
            if (extracted != null) {
                results.add(extracted);
            }
        }
    }

    /**
     * Sanitizes paths to prevent Zip Slip / Path Traversal attacks.
     * Rejects attempts to escape target directory.
     */
    public String sanitizePath(String rawPath) {
        if (rawPath == null) return null;
        String normalized = rawPath.replace('\\', '/').trim();

        // Reject absolute paths or paths with path traversal
        if (normalized.startsWith("/") || normalized.contains("../") || normalized.contains("/..") || normalized.equals("..")) {
            log.warn("Zip Slip / path traversal attempt detected and blocked: {}", rawPath);
            // Sanitize by stripping leading separators and any ".." segments
            normalized = normalized.replaceAll("^/+", "").replaceAll("\\.\\./", "").replaceAll("/\\.\\.", "");
        }

        // Remove redundant slashes
        normalized = normalized.replaceAll("/+", "/");

        return normalized.isEmpty() ? null : normalized;
    }

    private boolean isIgnoredPath(String path) {
        String lower = path.toLowerCase();
        for (String prefix : ArchiveSecurityConfig.IGNORED_PATH_PREFIXES) {
            if (lower.startsWith(prefix) || lower.contains("/" + prefix)) {
                return true;
            }
        }
        return false;
    }

    private ExtractedFile buildExtractedFile(String relativePath, byte[] bytes) {
        String filename = new File(relativePath).getName();
        String ext = getExtension(filename);

        boolean isBinary = isBinaryContent(bytes);
        String sha256 = computeSha256(bytes);
        String content = "";

        if (!isBinary) {
            content = new String(bytes, StandardCharsets.UTF_8);
        }

        int lineCount = 0;
        int tokenCount = 0;
        String normalizedSha256 = sha256;

        if (!content.isEmpty()) {
            String[] lines = content.split("\r\n|\r|\n");
            lineCount = lines.length;
            // Rough token estimate based on word boundaries
            tokenCount = content.split("\\W+").length;
            String normalized = content.replaceAll("\\s+", " ").trim();
            normalizedSha256 = computeSha256(normalized.getBytes(StandardCharsets.UTF_8));
        }

        String language = detectLanguageFromExtension(ext);

        return ExtractedFile.builder()
                .relativePath(relativePath)
                .filename(filename)
                .extension(ext)
                .content(content)
                .rawBytes(bytes)
                .sha256(sha256)
                .normalizedSha256(normalizedSha256)
                .sizeBytes(bytes.length)
                .lineCount(lineCount)
                .tokenCount(tokenCount)
                .detectedLanguage(language)
                .isBinary(isBinary)
                .parseStatus(isBinary ? "BINARY" : "READY")
                .build();
    }

    private boolean isBinaryContent(byte[] bytes) {
        if (bytes == null || bytes.length == 0) return false;
        int checkLen = Math.min(bytes.length, 1024);
        int nonPrintable = 0;
        for (int i = 0; i < checkLen; i++) {
            byte b = bytes[i];
            if (b == 0 || (b < 32 && b != '\t' && b != '\n' && b != '\r')) {
                nonPrintable++;
            }
        }
        return (double) nonPrintable / checkLen > 0.20;
    }

    public static String computeSha256(byte[] bytes) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    public static String getExtension(String path) {
        int dot = path.lastIndexOf('.');
        if (dot != -1 && dot < path.length() - 1) {
            return path.substring(dot + 1).toLowerCase();
        }
        return "";
    }

    public static String detectLanguageFromExtension(String ext) {
        return switch (ext.toLowerCase()) {
            case "java" -> "JAVA";
            case "c", "h" -> "C";
            case "cpp", "cc", "cxx", "hpp", "hxx" -> "CPP";
            case "py" -> "PYTHON";
            case "js", "jsx", "mjs" -> "JAVASCRIPT";
            case "ts", "tsx" -> "TYPESCRIPT";
            case "go" -> "GO";
            case "rs" -> "RUST";
            case "cs" -> "CSHARP";
            case "kt" -> "KOTLIN";
            case "php" -> "PHP";
            case "rb" -> "RUBY";
            case "html", "htm" -> "HTML";
            case "css" -> "CSS";
            case "sql" -> "SQL";
            default -> "GENERIC";
        };
    }
}

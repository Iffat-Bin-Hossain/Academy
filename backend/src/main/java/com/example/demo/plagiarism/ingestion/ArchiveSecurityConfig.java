package com.example.demo.plagiarism.ingestion;

import lombok.Getter;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
@Getter
public class ArchiveSecurityConfig {

    public static final int MAX_FILE_COUNT = 500;
    public static final long MAX_COMPRESSED_SIZE = 50L * 1024L * 1024L; // 50MB
    public static final long MAX_UNCOMPRESSED_SIZE = 100L * 1024L * 1024L; // 100MB
    public static final long MAX_SINGLE_FILE_SIZE = 15L * 1024L * 1024L; // 15MB
    public static final double MAX_COMPRESSION_RATIO = 20.0; // 20:1 limit for zip bombs

    public static final Set<String> BLOCKED_EXTENSIONS = Set.of(
            "exe", "bin", "dll", "so", "class", "jar", "o", "a", "pyc", "pyd",
            "iso", "img", "dmg", "vmdk", "sh", "bat", "cmd", "ps1"
    );

    public static final Set<String> IGNORED_PATH_PREFIXES = Set.of(
            "__macosx", ".git", ".idea", ".vscode", "node_modules", "target", "build", "dist", ".svn"
    );

    public static final Set<String> SUPPORTED_CODE_EXTENSIONS = Set.of(
            "c", "cpp", "cc", "cxx", "h", "hpp", "hxx",
            "java",
            "py",
            "js", "jsx", "ts", "tsx", "mjs",
            "cs", "go", "rs", "kt", "scala", "rb", "php", "swift", "m",
            "sql", "html", "css", "xml", "json", "yaml", "yml", "txt", "md"
    );
}

/**
 * Smart Context Manager for R1 Enhancer
 * 
 * Provides utilities for automatically gathering relevant context files
 * based on project structure, imports, and file relationships.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';

// Promisify fs functions
const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);
const readFile = util.promisify(fs.readFile);

// Configuration for file scanning
interface ScanConfig {
  maxFiles: number;
  maxDepth: number;
  excludeDirs: string[];
  excludeExtensions: string[];
  priorityExtensions: string[];
}

// Default configuration
const defaultConfig: ScanConfig = {
  maxFiles: 10,
  maxDepth: 3,
  excludeDirs: ['node_modules', 'dist', 'build', '.git', 'coverage'],
  excludeExtensions: ['.log', '.map', '.d.ts'],
  priorityExtensions: ['.js', '.ts', '.jsx', '.tsx', '.py', '.c', '.cpp', '.h', '.hpp']
};

/**
 * Context Manager class for smart file context gathering
 */
export class ContextManager {
  private config: ScanConfig;

  constructor(config: Partial<ScanConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Get relevant context files based on a source file
   * @param sourcePath Path to the source file
   * @returns Array of related file paths
   */
  async getContextFiles(sourcePath: string): Promise<string[]> {
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Source file does not exist: ${sourcePath}`);
    }

    const sourceDir = path.dirname(sourcePath);
    const sourceExt = path.extname(sourcePath);
    const sourceContent = await readFile(sourcePath, 'utf-8');
    
    // Find imports in the source file
    const importedFiles = this.extractImports(sourceContent, sourceExt, sourceDir);
    
    // Get sibling files (files in the same directory with similar names or extensions)
    const siblingFiles = await this.getSiblingFiles(sourcePath);
    
    // Combine and prioritize files
    const contextFiles = await this.prioritizeFiles(
      [...new Set([...importedFiles, ...siblingFiles])],
      sourcePath,
      sourceContent
    );

    return contextFiles;
  }

  /**
   * Extract import statements from source code to find related files
   * @param content Source file content
   * @param fileExt Source file extension
   * @param baseDir Base directory of the source file
   * @returns Array of imported file paths
   */
  private extractImports(content: string, fileExt: string, baseDir: string): string[] {
    const importedFiles: string[] = [];
    let importRegexes: RegExp[] = [];
    
    // Define regex patterns for different file types
    switch (fileExt) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        // ES6 imports
        importRegexes = [
          /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
          /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
          /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g
        ];
        break;
      case '.py':
        // Python imports
        importRegexes = [
          /import\s+([a-zA-Z0-9_.]+)/g,
          /from\s+([a-zA-Z0-9_.]+)\s+import/g
        ];
        break;
      case '.c':
      case '.cpp':
      case '.h':
      case '.hpp':
        // C/C++ includes
        importRegexes = [
          /#include\s+["<]([^">]+)[">]/g
        ];
        break;
      default:
        // Generic regex for any potential file references
        importRegexes = [
          /['"]([^'"]+\.[a-zA-Z0-9]+)['"]/g
        ];
    }
    
    // Extract import paths
    for (const regex of importRegexes) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const importPath = match[1];
        try {
          // Resolve the import path relative to the base directory
          const resolvedPath = this.resolveImportPath(importPath, baseDir, fileExt);
          if (resolvedPath && fs.existsSync(resolvedPath)) {
            importedFiles.push(resolvedPath);
          }
        } catch (err) {
          console.error(`Error resolving import path: ${importPath}`, err);
        }
      }
    }
    
    return importedFiles;
  }

  /**
   * Resolve an import path to an absolute file path
   * @param importPath Import path from source code
   * @param baseDir Base directory to resolve from
   * @param sourceExt Source file extension
   * @returns Resolved absolute file path
   */
  private resolveImportPath(importPath: string, baseDir: string, sourceExt: string): string | null {
    // Handle node module imports or absolute imports
    if (importPath.startsWith('@') || 
        importPath.startsWith('http') || 
        importPath.startsWith('node:')) {
      return null;
    }
    
    // Try to resolve the import path
    try {
      // Handle relative imports
      if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const resolved = path.resolve(baseDir, importPath);
        
        // Check if the resolved path exists
        if (fs.existsSync(resolved)) {
          return resolved;
        }
        
        // Try adding extensions if no extension specified
        if (!path.extname(resolved)) {
          for (const ext of this.config.priorityExtensions) {
            const withExt = `${resolved}${ext}`;
            if (fs.existsSync(withExt)) {
              return withExt;
            }
          }
          
          // Try index files for directories
          const indexFile = path.join(resolved, `index${sourceExt}`);
          if (fs.existsSync(indexFile)) {
            return indexFile;
          }
        }
      } else {
        // Try to resolve non-relative imports as local files
        const resolved = path.resolve(baseDir, importPath);
        if (fs.existsSync(resolved)) {
          return resolved;
        }
      }
    } catch (err) {
      console.error(`Error resolving import path: ${importPath}`, err);
    }
    
    return null;
  }

  /**
   * Get sibling files in the same directory as the source file
   * @param sourcePath Source file path
   * @returns Array of sibling file paths
   */
  private async getSiblingFiles(sourcePath: string): Promise<string[]> {
    const sourceDir = path.dirname(sourcePath);
    const sourceBase = path.basename(sourcePath, path.extname(sourcePath));
    const sourceExt = path.extname(sourcePath);
    
    const siblingFiles: string[] = [];
    
    try {
      const files = await readdir(sourceDir);
      
      for (const file of files) {
        const filePath = path.join(sourceDir, file);
        
        // Skip directories and the source file itself
        if (filePath === sourcePath || (await stat(filePath)).isDirectory()) {
          continue;
        }
        
        const fileExt = path.extname(file);
        const fileBase = path.basename(file, fileExt);
        
        // Prioritize files with similar names or same extensions
        if (fileBase.includes(sourceBase) || 
            sourceBase.includes(fileBase) || 
            fileExt === sourceExt ||
            this.isRelatedExtension(fileExt, sourceExt)) {
          siblingFiles.push(filePath);
        }
      }
    } catch (err) {
      console.error(`Error getting sibling files for: ${sourcePath}`, err);
    }
    
    return siblingFiles;
  }

  /**
   * Check if two file extensions are related
   * @param ext1 First extension
   * @param ext2 Second extension
   * @returns Boolean indicating if the extensions are related
   */
  private isRelatedExtension(ext1: string, ext2: string): boolean {
    const relatedExtensions: Record<string, string[]> = {
      '.js': ['.jsx', '.ts', '.tsx', '.d.ts', '.js.map'],
      '.jsx': ['.js', '.ts', '.tsx', '.d.ts', '.jsx.map'],
      '.ts': ['.js', '.jsx', '.tsx', '.d.ts', '.ts.map'],
      '.tsx': ['.js', '.jsx', '.ts', '.d.ts', '.tsx.map'],
      '.c': ['.h', '.cpp', '.hpp', '.o'],
      '.cpp': ['.h', '.c', '.hpp', '.o'],
      '.h': ['.c', '.cpp', '.hpp'],
      '.hpp': ['.h', '.c', '.cpp'],
      '.py': ['.pyc', '.pyd', '.pyo'],
    };
    
    return relatedExtensions[ext1]?.includes(ext2) || relatedExtensions[ext2]?.includes(ext1) || false;
  }

  /**
   * Prioritize files based on relevance to the source file
   * @param files List of potential context files
   * @param sourcePath Source file path
   * @param sourceContent Source file content
   * @returns Array of prioritized file paths
   */
  private async prioritizeFiles(
    files: string[],
    sourcePath: string, 
    sourceContent: string
  ): Promise<string[]> {
    const scoredFiles: { path: string; score: number }[] = [];
    
    // Score each file based on relevance
    for (const filePath of files) {
      let score = 0;
      
      try {
        // Check if the file exists and is readable
        const stats = await stat(filePath);
        if (!stats.isFile()) continue;
        
        // Skip large files
        if (stats.size > 1024 * 1024) continue;
        
        const fileExt = path.extname(filePath);
        const fileContent = await readFile(filePath, 'utf-8');
        
        // Prioritize by file extension
        if (this.config.priorityExtensions.includes(fileExt)) {
          score += 5;
        }
        
        // Prioritize by directory proximity
        const fileDir = path.dirname(filePath);
        const sourceDir = path.dirname(sourcePath);
        const relativeDepth = this.getDirectoryDepth(fileDir, sourceDir);
        score += Math.max(0, 10 - relativeDepth * 2);
        
        // Prioritize by content similarity
        const sourceKeywords = this.extractKeywords(sourceContent);
        const fileKeywords = this.extractKeywords(fileContent);
        const commonKeywords = sourceKeywords.filter(kw => fileKeywords.includes(kw));
        score += commonKeywords.length * 2;
        
        // Prioritize by cross-references (file mentions source or vice versa)
        const sourceBaseName = path.basename(sourcePath);
        const fileBaseName = path.basename(filePath);
        if (fileContent.includes(sourceBaseName)) score += 10;
        if (sourceContent.includes(fileBaseName)) score += 10;
        
        scoredFiles.push({ path: filePath, score });
      } catch (err) {
        console.error(`Error scoring file: ${filePath}`, err);
      }
    }
    
    // Sort by score and limit to max files
    return scoredFiles
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxFiles)
      .map(item => item.path);
  }

  /**
   * Calculate directory depth between two paths
   * @param dir1 First directory
   * @param dir2 Second directory
   * @returns Number of directory levels between the paths
   */
  private getDirectoryDepth(dir1: string, dir2: string): number {
    const relativePath = path.relative(dir1, dir2);
    return relativePath.split(path.sep).length;
  }

  /**
   * Extract significant keywords from content
   * @param content Text content to analyze
   * @returns Array of significant keywords
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction (improved version could use NLP)
    const words = content
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4) // Skip short words
      .filter(word => !word.match(/^[0-9]+$/)) // Skip numbers
      .map(word => word.toLowerCase());
    
    // Count word frequency
    const wordCounts = new Map<string, number>();
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }
    
    // Get the most frequent words
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 50)
      .map(([word]) => word);
  }

  /**
   * Find test files related to a source file
   * @param sourcePath Source file path
   * @returns Array of test file paths
   */
  async findTestFiles(sourcePath: string): Promise<string[]> {
    const sourceDir = path.dirname(sourcePath);
    const sourceBase = path.basename(sourcePath, path.extname(sourcePath));
    const testFiles: string[] = [];
    
    // Common test directory patterns
    const testDirPatterns = [
      path.join(sourceDir, 'tests'),
      path.join(sourceDir, 'test'),
      path.join(sourceDir, '__tests__'),
      path.join(path.dirname(sourceDir), 'tests'),
      path.join(path.dirname(sourceDir), 'test'),
      path.join(path.dirname(sourceDir), '__tests__')
    ];
    
    // Common test file patterns
    const testFilePatterns = [
      `${sourceBase}.test.js`,
      `${sourceBase}.spec.js`,
      `${sourceBase}.test.ts`,
      `${sourceBase}.spec.ts`,
      `test_${sourceBase}.py`,
      `${sourceBase}_test.py`
    ];
    
    // Check for test files in the same directory
    for (const pattern of testFilePatterns) {
      const testPath = path.join(sourceDir, pattern);
      if (fs.existsSync(testPath)) {
        testFiles.push(testPath);
      }
    }
    
    // Check for test files in test directories
    for (const testDir of testDirPatterns) {
      if (fs.existsSync(testDir)) {
        try {
          const files = await readdir(testDir);
          for (const file of files) {
            if (file.includes(sourceBase) && !this.config.excludeExtensions.includes(path.extname(file))) {
              testFiles.push(path.join(testDir, file));
            }
          }
        } catch (err) {
          console.error(`Error reading test directory: ${testDir}`, err);
        }
      }
    }
    
    return testFiles;
  }

  /**
   * Get documentation files related to a source file
   * @param sourcePath Source file path
   * @returns Array of documentation file paths
   */
  async findDocumentationFiles(sourcePath: string): Promise<string[]> {
    const sourceDir = path.dirname(sourcePath);
    const sourceBase = path.basename(sourcePath, path.extname(sourcePath));
    const docFiles: string[] = [];
    
    // Common documentation directories
    const docDirPatterns = [
      path.join(sourceDir, 'docs'),
      path.join(sourceDir, 'doc'),
      path.join(sourceDir, 'documentation'),
      path.join(path.dirname(sourceDir), 'docs'),
      path.join(path.dirname(sourceDir), 'doc'),
      path.join(path.dirname(sourceDir), 'documentation')
    ];
    
    // Common documentation file extensions
    const docExtensions = ['.md', '.txt', '.pdf', '.html', '.rst', '.adoc'];
    
    // Check for documentation files in documentation directories
    for (const docDir of docDirPatterns) {
      if (fs.existsSync(docDir)) {
        try {
          const files = await readdir(docDir);
          for (const file of files) {
            const fileExt = path.extname(file);
            if (docExtensions.includes(fileExt) && 
                (file.includes(sourceBase) || fs.existsSync(path.join(docDir, 'index.md')))) {
              docFiles.push(path.join(docDir, file));
            }
          }
        } catch (err) {
          console.error(`Error reading documentation directory: ${docDir}`, err);
        }
      }
    }
    
    // Check for README file
    ['README.md', 'README.txt'].forEach(readmeFile => {
      const readmePath = path.join(sourceDir, readmeFile);
      if (fs.existsSync(readmePath)) {
        docFiles.push(readmePath);
      }
    });
    
    return docFiles;
  }
}

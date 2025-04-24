/**
 * Path resolver utility for MCP tools
 * 
 * Ensures that file paths are properly resolved relative to the project root
 * regardless of the current working directory when the MCP server is running
 */
import * as path from 'path';
import * as fs from 'fs';

// Get the project root directory using ES modules approach
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../..');

/**
 * Resolves a file path relative to the project root
 * Handles both absolute and relative paths
 * 
 * @param filePath The path to resolve
 * @returns The absolute path
 */
export function resolveProjectPath(filePath: string): string {
  // If it's already absolute and exists, use it
  if (path.isAbsolute(filePath) && fs.existsSync(filePath)) {
    return filePath;
  }
  
  // Try resolving relative to project root
  const projectPath = path.resolve(PROJECT_ROOT, filePath);
  if (fs.existsSync(projectPath)) {
    return projectPath;
  }
  
  // If the file has a leading "../", try resolving it relative to project root's parent
  if (filePath.startsWith('../')) {
    const parentRelativePath = path.resolve(path.dirname(PROJECT_ROOT), filePath.substring(3));
    if (fs.existsSync(parentRelativePath)) {
      return parentRelativePath;
    }
  }
  
  // If none of the above worked, just return the resolved project path
  // The calling code will handle the case where the file doesn't exist
  return projectPath;
}

/**
 * Checks if a file exists at the given path
 * Uses proper path resolution to ensure reliability
 * 
 * @param filePath The path to check
 * @returns True if the file exists, false otherwise
 */
export function fileExists(filePath: string): boolean {
  const resolvedPath = resolveProjectPath(filePath);
  return fs.existsSync(resolvedPath);
}

/**
 * Reads a file at the given path and returns its contents
 * Uses proper path resolution to ensure reliability
 * 
 * @param filePath The path to the file to read
 * @returns The file contents as a string
 * @throws Error if the file doesn't exist or can't be read
 */
export function readProjectFile(filePath: string): string {
  const resolvedPath = resolveProjectPath(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`File not found: ${filePath} (resolved to ${resolvedPath})`);
  }
  return fs.readFileSync(resolvedPath, 'utf-8');
}

/**
 * Lists all files in a directory
 * Uses proper path resolution to ensure reliability
 * 
 * @param dirPath The path to the directory to list
 * @returns An array of file paths
 * @throws Error if the directory doesn't exist or can't be read
 */
export function listDirectoryFiles(dirPath: string): string[] {
  const resolvedPath = resolveProjectPath(dirPath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Directory not found: ${dirPath} (resolved to ${resolvedPath})`);
  }
  return fs.readdirSync(resolvedPath).map(file => path.join(resolvedPath, file));
}

/**
 * Returns debug info about a file path
 * Useful for troubleshooting path resolution issues
 * 
 * @param filePath The path to get info about
 * @returns An object with debug info
 */
export function getPathInfo(filePath: string): any {
  const resolvedPath = resolveProjectPath(filePath);
  return {
    originalPath: filePath,
    resolvedPath,
    exists: fs.existsSync(resolvedPath),
    isAbsolute: path.isAbsolute(filePath),
    projectRoot: PROJECT_ROOT,
    currentWorkingDir: process.cwd()
  };
}

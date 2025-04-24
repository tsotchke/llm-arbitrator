#!/usr/bin/env node
/**
 * Test script for path resolver utility
 * Validates that file paths can be properly resolved regardless of current working directory
 */
import { fileExists, resolveProjectPath, getPathInfo, readProjectFile } from './build/utils/pathResolver.js';
import * as path from 'path';
import * as fs from 'fs';

console.log('LLM Arbitrator - Path Resolver Test');
console.log('====================================');

// Get current working directory and project root
const cwd = process.cwd();
console.log(`Current working directory: ${cwd}`);

// Test file resolution
const testFiles = [
  // Project files
  'package.json',
  'tsconfig.json',
  'README.md',
  
  // Source files
  'src/index.ts',
  'src/config.ts',
  'src/utils/pathResolver.ts',
  
  // Test files
  'test-path-resolver.js',
  
  // Non-existent files
  'does-not-exist.txt',
  'src/does-not-exist.js'
];

// Test each file
console.log('\nTesting file resolution:');
console.log('------------------------');

for (const testFile of testFiles) {
  const exists = fileExists(testFile);
  const resolvedPath = resolveProjectPath(testFile);
  const relPath = path.relative(cwd, resolvedPath);
  
  console.log(`\nFile: ${testFile}`);
  console.log(`Resolved to: ${resolvedPath}`);
  console.log(`Relative path: ${relPath}`);
  console.log(`Exists: ${exists ? 'YES' : 'NO'}`);
  
  if (exists) {
    try {
      const fileContent = readProjectFile(testFile);
      const firstLine = fileContent.split('\n')[0].substring(0, 80);
      console.log(`First line: ${firstLine}${firstLine.length >= 80 ? '...' : ''}`);
    } catch (error) {
      console.log(`Error reading file: ${error.message}`);
    }
  }
  
  // Get detailed path info
  const pathInfo = getPathInfo(testFile);
  console.log('Path info:', pathInfo);
}

// Test directory resolution
console.log('\nTesting directory resolution:');
console.log('----------------------------');

const testDirs = [
  '.',
  'src',
  'src/utils',
  'non-existent-dir'
];

for (const testDir of testDirs) {
  const resolvedPath = resolveProjectPath(testDir);
  const exists = fs.existsSync(resolvedPath);
  const isDir = exists ? fs.statSync(resolvedPath).isDirectory() : false;
  
  console.log(`\nDirectory: ${testDir}`);
  console.log(`Resolved to: ${resolvedPath}`);
  console.log(`Exists: ${exists ? 'YES' : 'NO'}`);
  console.log(`Is directory: ${isDir ? 'YES' : 'NO'}`);
  
  if (isDir) {
    try {
      const files = fs.readdirSync(resolvedPath);
      console.log(`Contains ${files.length} files/directories:`);
      console.log(files.slice(0, 5).join(', ') + (files.length > 5 ? '...' : ''));
    } catch (error) {
      console.log(`Error reading directory: ${error.message}`);
    }
  }
}

console.log('\nTest completed successfully!');

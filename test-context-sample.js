#!/usr/bin/env node
/**
 * Test script to run context manager on our test files
 */

import { ContextManager } from './build/utils/contextManager.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test file paths
const HEADER_FILE = path.join(__dirname, 'test-context/src/components/Header.js');
const APP_FILE = path.join(__dirname, 'test-context/src/App.js');
const HOME_PAGE_FILE = path.join(__dirname, 'test-context/src/pages/Home.js');

async function testContextManager() {
  console.log("Testing Smart Context Management\n");
  
  try {
    // Create a context manager with more files allowed for testing
    const contextManager = new ContextManager({
      maxFiles: 15
    });
    
    // Test Header file
    console.log(`\n========== Context for Header Component ==========`);
    const headerFiles = await contextManager.getContextFiles(HEADER_FILE);
    
    console.log(`Found ${headerFiles.length} related files:`);
    headerFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${path.relative(__dirname, file)}`);
    });
    
    // Test App.js file
    console.log(`\n========== Context for App.js ==========`);
    const appFiles = await contextManager.getContextFiles(APP_FILE);
    
    console.log(`Found ${appFiles.length} related files:`);
    appFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${path.relative(__dirname, file)}`);
    });
    
    // Test Home page file
    console.log(`\n========== Context for Home Page ==========`);
    const homeFiles = await contextManager.getContextFiles(HOME_PAGE_FILE);
    
    console.log(`Found ${homeFiles.length} related files:`);
    homeFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${path.relative(__dirname, file)}`);
    });
    
    // Find test files
    console.log(`\n========== Test Files for Header Component ==========`);
    const headerTestFiles = await contextManager.findTestFiles(HEADER_FILE);
    
    console.log(`Found ${headerTestFiles.length} test files:`);
    headerTestFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${path.relative(__dirname, file)}`);
    });
    
    // Find documentation files
    console.log(`\n========== Documentation Files ==========`);
    const docFiles = await contextManager.findDocumentationFiles(HEADER_FILE);
    
    console.log(`Found ${docFiles.length} documentation files:`);
    docFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${path.relative(__dirname, file)}`);
    });
    
    console.log(`\n✅ Smart Context Manager test completed successfully.`);
    console.log(`\nThis feature allows R1 to automatically identify related files that provide important context`);
    console.log(`for understanding and enhancing the code, without requiring manual selection of every file.`);
    
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the test
testContextManager();

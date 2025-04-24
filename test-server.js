#!/usr/bin/env node

/**
 * R1 Enhancer MCP Server Test Script
 * 
 * This script tests the R1 Enhancer server functionality directly,
 * bypassing the MCP protocol to validate the core functionality.
 * 
 * Usage:
 *   node test-server.js
 */

import { LmStudioClient } from './build/api/lmStudioClient.js';

// Configuration
const API_ENDPOINT = process.env.LM_STUDIO_ENDPOINT || 'http://127.0.0.1:1234';
const TEST_PROMPT = 'Write a simple hello world function in JavaScript';

// Helper for logging
function log(level, message) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

async function runTests() {
  log('info', '=== R1 Enhancer MCP Server Test ===');
  log('info', `Testing LM Studio connection to: ${API_ENDPOINT}`);
  
  // Create LM Studio client
  const client = new LmStudioClient(API_ENDPOINT);
  
  try {
    // Test 1: Connection to LM Studio
    log('info', 'Test 1: LM Studio Connection');
    const connectionResult = await client.testConnection();
    log('info', 'Connection test successful ✓');
    
    // Test 2: Simple completion
    log('info', 'Test 2: Basic Completion API');
    log('info', `Sending test prompt: "${TEST_PROMPT}"`);
    
    const completion = await client.completePrompt(TEST_PROMPT, {
      temperature: 0.3,
      max_tokens: 1000,
      system_message: 'You are an expert JavaScript programmer. Provide only the code with minimal comments.'
    });
    
    log('info', 'Received completion response:');
    console.log('\n---COMPLETION RESULT---');
    console.log(completion);
    console.log('---END RESULT---\n');
    
    log('info', 'Basic completion test successful ✓');
    
    // All tests passed
    log('info', 'All tests completed successfully! ✓');
    log('info', 'The R1 Enhancer core functionality is working.');
    log('info', '');
    log('info', 'If the MCP integration is still not working:');
    log('info', '1. Check the Cline MCP settings file configuration');
    log('info', '2. Verify the server process is being started correctly by Cline');
    log('info', '3. Check for any errors in the VSCode debug console');
    log('info', '4. Ensure you\'ve rebuilt the project with latest changes: npm run build');
    
    return true;
  } catch (error) {
    log('error', 'Test failed with error:');
    console.error(error);
    
    log('error', '');
    log('error', 'Troubleshooting steps:');
    log('error', '1. Is LM Studio running with DeepSeek R1 model loaded?');
    log('error', '2. Is the API endpoint correct? (default: http://127.0.0.1:1234)');
    log('error', '3. Check LM Studio logs for any API errors');
    
    return false;
  }
}

// Run the tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    log('error', 'Unexpected error running tests:');
    console.error(error);
    process.exit(1);
  });

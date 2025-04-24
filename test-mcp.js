#!/usr/bin/env node

/**
 * R1 Enhancer MCP Protocol Test
 * 
 * This script tests the MCP server by directly simulating the MCP protocol.
 * It sends MCP requests to the server and verifies the responses.
 */

import { spawn } from 'child_process';
import { PassThrough } from 'stream';
import * as readline from 'readline';

console.log('Starting MCP Protocol Test');
console.log('========================');

// Messages to test the MCP server
const listToolsRequest = {
  id: "1",
  jsonrpc: "2.0",
  method: "mcp.listTools",
  params: {}
};

const toolCallRequest = {
  id: "2",
  jsonrpc: "2.0",
  method: "mcp.callTool",
  params: {
    name: "enhance_code_generation",
    arguments: {
      taskDescription: "Write a hello world function in JavaScript",
      language: "javascript"
    }
  }
};

// Start the MCP server process
const serverProcess = spawn('node', ['/Users/tyr/Documents/Cline/MCP/r1-enhancer/build/index.js'], {
  env: {
    ...process.env,
    DEBUG_MODE: 'true',
    LOG_LEVEL: 'debug',
    LM_STUDIO_ENDPOINT: 'http://127.0.0.1:1234'
  }
});

// Create a pass-through stream for input
const stdin = new PassThrough();
const stdout = serverProcess.stdout;
const stderr = serverProcess.stderr;

// Set up readline for reading lines from the process
const rl = readline.createInterface({
  input: stdout,
  crlfDelay: Infinity
});

// Handle stderr for debugging
stderr.on('data', (data) => {
  console.log(`[SERVER LOG] ${data.toString().trim()}`);
});

// Flag to track if we've received the list tools response
let receivedListToolsResponse = false;
let receivedToolCallResponse = false;

// Listen for messages from the server
rl.on('line', (line) => {
  try {
    // Try to parse the line as JSON
    const message = JSON.parse(line);
    console.log('\n[RECEIVED]', JSON.stringify(message, null, 2));
    
    // Check if this is a response to our list tools request
    if (message.id === '1' && !receivedListToolsResponse) {
      receivedListToolsResponse = true;
      console.log('✅ Received listTools response');
      
      // If successful, send the tool call request
      setTimeout(() => {
        console.log('\n[SENDING] Tool call request');
        stdin.write(JSON.stringify(toolCallRequest) + '\n');
      }, 1000);
    }
    
    // Check if this is a response to our tool call request
    if (message.id === '2' && !receivedToolCallResponse) {
      receivedToolCallResponse = true;
      console.log('✅ Received callTool response');
      
      // Test completed successfully
      console.log('\n========================');
      console.log('✅ MCP Protocol Test Completed Successfully');
      
      // Give time for any final logs to appear
      setTimeout(() => {
        serverProcess.kill();
        process.exit(0);
      }, 1000);
    }
  } catch (error) {
    console.log(`[NON-JSON LINE] ${line}`);
  }
});

// Handle process exit
serverProcess.on('exit', (code) => {
  console.log(`\nServer process exited with code ${code}`);
  
  if (!receivedListToolsResponse || !receivedToolCallResponse) {
    console.log('❌ MCP Protocol Test Failed - Did not receive all expected responses');
    
    console.log('\nTroubleshooting steps:');
    console.log('1. Check the server logs above for any errors');
    console.log('2. Verify MCP SDK versions are compatible in package.json');
    console.log('3. Make sure the server is properly handling stdin/stdout communication');
    console.log('4. Ensure LM Studio is running and accessible');
  }
  
  process.exit(code || 0);
});

// Start the test by sending the list tools request
setTimeout(() => {
  console.log('[SENDING] List tools request');
  stdin.write(JSON.stringify(listToolsRequest) + '\n');
  
  // Pipe the stdin to the process
  stdin.pipe(serverProcess.stdin);
}, 1000);

// Set a timeout for the entire test
setTimeout(() => {
  console.log('\n⚠️ Test timed out after 30 seconds');
  serverProcess.kill();
  process.exit(1);
}, 30000);

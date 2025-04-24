#!/usr/bin/env node
/**
 * Test script for the LLM Arbitrator MCP server
 * Demonstrates using the optimize_prompt and enhance_code_generation tools
 */
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import net from 'net';

// Socket path for MCP communication
const SOCKET_PATH = '/tmp/mcp-socket';

// Function to send a request to the MCP server and get the response
async function sendMcpRequest(method, params) {
  return new Promise((resolve, reject) => {
    const client = net.createConnection({ path: SOCKET_PATH }, () => {
      console.log('Connected to MCP server');
      
      const request = {
        method,
        params,
        id: Date.now().toString()
      };
      
      client.write(JSON.stringify(request) + '\n');
      console.log('Request sent:', JSON.stringify(request, null, 2));
    });
    
    let data = '';
    
    client.on('data', (chunk) => {
      data += chunk.toString();
      
      // Check if we have a complete response (assumes one message per connection)
      if (data.endsWith('\n')) {
        try {
          const response = JSON.parse(data);
          resolve(response);
          client.end();
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
          client.end();
        }
      }
    });
    
    client.on('error', (error) => {
      console.error('Socket error:', error);
      reject(error);
    });
    
    client.on('end', () => {
      console.log('Disconnected from MCP server');
    });
  });
}

// Test the optimize_prompt tool
async function testOptimizePrompt() {
  console.log('Testing optimize_prompt tool...');
  
  try {
    const response = await sendMcpRequest('call_tool', {
      name: 'optimize_prompt',
      arguments: {
        originalPrompt: 'Review the INSTALLATION.md file and suggest three specific improvements to make it more user-friendly.',
        files: ['INSTALLATION.md'],
        domain: 'documentation'
      }
    });
    
    console.log('\nOptimize Prompt Response:');
    console.log(JSON.stringify(response, null, 2));
    
    return response;
  } catch (error) {
    console.error('Error calling optimize_prompt:', error);
  }
}

// Test the enhance_code_generation tool for documentation
async function testEnhanceDocumentation() {
  console.log('\nTesting enhance_code_generation tool for documentation...');
  
  try {
    const response = await sendMcpRequest('call_tool', {
      name: 'enhance_code_generation',
      arguments: {
        taskDescription: 'Create a Quick Start guide section for the LLM Arbitrator that is concise, clear, and visually structured. It should help users get up and running in minimal time with the most essential information.',
        language: 'markdown',
        domain: 'documentation',
        files: ['INSTALLATION.md', 'README.md']
      }
    });
    
    console.log('\nEnhance Documentation Response:');
    console.log(JSON.stringify(response, null, 2));
    
    return response;
  } catch (error) {
    console.error('Error calling enhance_code_generation:', error);
  }
}

// Test the get_context_files tool
async function testGetContextFiles() {
  console.log('\nTesting get_context_files tool...');
  
  try {
    const response = await sendMcpRequest('call_tool', {
      name: 'get_context_files',
      arguments: {
        filePath: 'README.md',
        maxFiles: 5,
        includeDocs: true
      }
    });
    
    console.log('\nGet Context Files Response:');
    console.log(JSON.stringify(response, null, 2));
    
    return response;
  } catch (error) {
    console.error('Error calling get_context_files:', error);
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testOptimizePrompt();
    await testEnhanceDocumentation();
    await testGetContextFiles();
    
    console.log('\nAll tests completed.');
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

// Run the tests
runAllTests();

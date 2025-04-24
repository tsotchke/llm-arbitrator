#!/usr/bin/env node
/**
 * Test script to demonstrate the Chain-of-Thought preservation capabilities
 * This shows how the enhanced response format captures R1's reasoning process
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LmStudioClient } from './build/api/lmStudioClient.js';
import { CodeEnhancer } from './build/enhancers/codeEnhancer.js';
import { VerificationEnhancer } from './build/enhancers/verificationEnhancer.js';
import { PromptEnhancer } from './build/enhancers/promptEnhancer.js';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_ENDPOINT = process.env.LM_STUDIO_ENDPOINT || 'http://127.0.0.1:1234';
const OUTPUT_DIR = path.join(__dirname, 'test-output');

// Make sure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Sample code for testing verification
const sampleFunction = `
/**
 * Binary search function to find a value in a sorted array
 * @param {number[]} arr - The sorted array to search in
 * @param {number} target - The value to find
 * @return {number} - The index of the target value, or -1 if not found
 */
function binarySearch(arr, target) {
  // Initialize search bounds
  let left = 0;
  let right = arr.length - 1;
  
  // Continue searching while the bounds are valid
  while (left <= right) {
    // Calculate the middle index
    let mid = Math.floor((left + right) / 2);
    
    // Check if we found the target
    if (arr[mid] === target) {
      return mid;
    }
    
    // Adjust search bounds based on comparison
    if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  // Target not found
  return -1;
}
`;

// Sample prompt for testing prompt optimization
const samplePrompt = `
I want you to build me a React app that connects to a weather API and shows a 5-day forecast.
`;

// Test the code enhancer with chain-of-thought preservation
async function testCodeEnhancer(client) {
  console.log("\n========== Testing Code Enhancer with Chain-of-Thought ==========");
  
  try {
    // Create code enhancer
    const codeEnhancer = new CodeEnhancer(client);
    
    // Test coding task
    const taskDescription = "Implement a recursive function to calculate the nth Fibonacci number with memoization to improve performance.";
    const language = "javascript";
    const domain = "functional";
    
    console.log("Generating enhanced code solution with captured reasoning process...");
    
    // Generate code with enhanced chain-of-thought preservation
    const enhancedCode = await codeEnhancer.enhance(taskDescription, "", language, domain);
    
    // Save the result
    const outputPath = path.join(OUTPUT_DIR, 'code-enhancer-result.md');
    fs.writeFileSync(outputPath, enhancedCode);
    
    console.log(`✅ Code Enhancer test completed. Result saved to: ${outputPath}`);
    console.log("Sample of the reasoning process:");
    
    // Print a sample of the thinking section
    const thinkingMatch = enhancedCode.match(/## R1 Reasoning Process\n\n([\s\S]{1,500})/);
    if (thinkingMatch) {
      console.log("-----------------------------------");
      console.log(thinkingMatch[1] + "...");
      console.log("-----------------------------------");
    }
    
    return true;
  } catch (error) {
    console.error("Error in Code Enhancer test:", error);
    return false;
  }
}

// Test the verification enhancer with chain-of-thought preservation
async function testVerificationEnhancer(client) {
  console.log("\n========== Testing Verification Enhancer with Chain-of-Thought ==========");
  
  try {
    // Create verification enhancer
    const verificationEnhancer = new VerificationEnhancer(client);
    
    console.log("Verifying code with captured review process...");
    
    // Generate verification result with enhanced chain-of-thought preservation
    const verificationResult = await verificationEnhancer.verify(
      sampleFunction,
      "javascript",
      "Implement a binary search function to find a value in a sorted array"
    );
    
    // Save the result
    const outputPath = path.join(OUTPUT_DIR, 'verification-enhancer-result.md');
    fs.writeFileSync(outputPath, verificationResult);
    
    console.log(`✅ Verification Enhancer test completed. Result saved to: ${outputPath}`);
    console.log("Sample of the reasoning process:");
    
    // Print a sample of the thinking section
    const thinkingMatch = verificationResult.match(/## Review Process and Reasoning\n\n([\s\S]{1,500})/);
    if (thinkingMatch) {
      console.log("-----------------------------------");
      console.log(thinkingMatch[1] + "...");
      console.log("-----------------------------------");
    }
    
    return true;
  } catch (error) {
    console.error("Error in Verification Enhancer test:", error);
    return false;
  }
}

// Test the prompt enhancer with chain-of-thought preservation
async function testPromptEnhancer(client) {
  console.log("\n========== Testing Prompt Enhancer with Chain-of-Thought ==========");
  
  try {
    // Create prompt enhancer
    const promptEnhancer = new PromptEnhancer(client);
    
    console.log("Optimizing prompt with captured engineering process...");
    
    // Generate optimized prompt with enhanced chain-of-thought preservation
    const optimizedPrompt = await promptEnhancer.optimize(samplePrompt, "web");
    
    // Save the result
    const outputPath = path.join(OUTPUT_DIR, 'prompt-enhancer-result.md');
    fs.writeFileSync(outputPath, optimizedPrompt);
    
    console.log(`✅ Prompt Enhancer test completed. Result saved to: ${outputPath}`);
    console.log("Sample of the reasoning process:");
    
    // Print a sample of the thinking section
    const thinkingMatch = optimizedPrompt.match(/## Prompt Engineering Process\n\n([\s\S]{1,500})/);
    if (thinkingMatch) {
      console.log("-----------------------------------");
      console.log(thinkingMatch[1] + "...");
      console.log("-----------------------------------");
    }
    
    return true;
  } catch (error) {
    console.error("Error in Prompt Enhancer test:", error);
    return false;
  }
}

// Main test function
async function runTests() {
  try {
    // Create LmStudioClient instance
    const client = new LmStudioClient(API_ENDPOINT);
    
    // Test connection to LM Studio
    console.log("Testing connection to LM Studio...");
    await client.testConnection();
    console.log("✅ LM Studio connection successful");
    
    // Run the chain-of-thought tests
    const codeSuccess = await testCodeEnhancer(client);
    const verificationSuccess = await testVerificationEnhancer(client);
    const promptSuccess = await testPromptEnhancer(client);
    
    console.log("\n========== Chain-of-Thought Tests Summary ==========");
    console.log(`Code Enhancer: ${codeSuccess ? '✅ Success' : '❌ Failed'}`);
    console.log(`Verification Enhancer: ${verificationSuccess ? '✅ Success' : '❌ Failed'}`);
    console.log(`Prompt Enhancer: ${promptSuccess ? '✅ Success' : '❌ Failed'}`);
    console.log("\nDetailed results saved in the test-output directory.");
    
    console.log("\n✨ The chain-of-thought preservation capabilities allow Claude/Cline");
    console.log("to better understand R1's reasoning and provide more intelligent responses.");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Run the tests
runTests();

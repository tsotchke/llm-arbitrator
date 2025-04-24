#!/usr/bin/env node
/**
 * Test script to verify multimodal file input functionality
 * This demonstrates passing file paths to the R1 enhancer tools
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LmStudioClient } from './build/api/lmStudioClient.js';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_ENDPOINT = process.env.LM_STUDIO_ENDPOINT || 'http://127.0.0.1:1234';
const TEST_FILE_PATH = path.join(__dirname, 'test-files', 'sample.c');

// Make sure test directory exists
const testDir = path.join(__dirname, 'test-files');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Create a sample C file for verification
const sampleCCode = `
/**
 * Binary Search Tree implementation in C
 */
#include <stdio.h>
#include <stdlib.h>

// Node structure for the BST
typedef struct Node {
    int data;
    struct Node* left;
    struct Node* right;
} Node;

// Create a new node
Node* createNode(int value) {
    Node* newNode = (Node*)malloc(sizeof(Node));
    newNode->data = value;
    newNode->left = NULL;
    newNode->right = NULL;
    return newNode;
}

// Insert a value into the BST
Node* insert(Node* root, int value) {
    if (root == NULL) {
        return createNode(value);
    }
    
    if (value < root->data) {
        root->left = insert(root->left, value);
    } else if (value > root->data) {
        root->right = insert(root->right, value);
    }
    
    return root;
}

// Search for a value in the BST
Node* search(Node* root, int value) {
    if (root == NULL || root->data == value) {
        return root;
    }
    
    if (value < root->data) {
        return search(root->left, value);
    }
    
    return search(root->right, value);
}

// Print the BST in-order
void inorderTraversal(Node* root) {
    if (root == NULL) {
        return;
    }
    
    inorderTraversal(root->left);
    printf("%d ", root->data);
    inorderTraversal(root->right);
}

// Free the memory used by the BST
void freeTree(Node* root) {
    if (root == NULL) {
        return;
    }
    
    freeTree(root->left);
    freeTree(root->right);
    free(root);
}

int main() {
    Node* root = NULL;
    
    // Insert some values
    root = insert(root, 50);
    insert(root, 30);
    insert(root, 70);
    insert(root, 20);
    insert(root, 40);
    insert(root, 60);
    insert(root, 80);
    
    // Print the tree in-order
    printf("BST in-order traversal: ");
    inorderTraversal(root);
    printf("\\n");
    
    // Search for a value
    int searchValue = 40;
    Node* result = search(root, searchValue);
    if (result != NULL) {
        printf("Value %d found in the BST.\\n", searchValue);
    } else {
        printf("Value %d not found in the BST.\\n", searchValue);
    }
    
    // Free the memory
    freeTree(root);
    
    return 0;
}
`;

// Save sample file
fs.writeFileSync(TEST_FILE_PATH, sampleCCode);
console.log(`Sample C file created at: ${TEST_FILE_PATH}`);

// Function to test the verification enhancer with file input
async function testVerificationWithFile() {
  console.log("\n========== Testing R1 Verify Solution with File Input ==========");
  
  try {
    // Create simplified code with a deliberate bug (memory leak)
    const buggyCode = `
// BST implementation with a memory leak bug
#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int data;
    struct Node* left;
    struct Node* right;
} Node;

Node* createNode(int value) {
    Node* newNode = (Node*)malloc(sizeof(Node));
    newNode->data = value;
    newNode->left = NULL;
    newNode->right = NULL;
    return newNode;
}

void inorderTraversal(Node* root) {
    if (root == NULL) {
        return;
    }
    
    inorderTraversal(root->left);
    printf("%d ", root->data);
    inorderTraversal(root->right);
}

// DELIBERATE BUG: No freeTree function implemented!

int main() {
    Node* root = createNode(50);
    // Insert more nodes...
    
    printf("BST traversal: ");
    inorderTraversal(root);
    printf("\\n");
    
    // MEMORY LEAK: Tree is not freed before program exits
    return 0;
}
    `;
    
    // Test the verification enhancer
    console.log("Calling the R1 verification enhancer with file input...");
    
    // Create LmStudioClient instance 
    const client = new LmStudioClient(API_ENDPOINT);
    
    // Build prompt with text and file paths
    const promptData = {
      text: `# Code Verification Task

## Code to Verify
\`\`\`c
${buggyCode}
\`\`\`

## Task Description
Verify this C implementation of a binary search tree for correctness, memory leaks, and best practices.

Please analyze this code and provide:
1. Verification of correctness
2. Identification of memory leaks or other bugs
3. Performance analysis
4. Suggestions for improvements
5. Assessment of code quality`,
      files: [TEST_FILE_PATH]
    };
    
    // Call the LM Studio API through our client
    const result = await client.completePrompt(promptData, {
      temperature: 0.2,
      max_tokens: 4000,
      system_message: 'You are an expert code reviewer specializing in C programming.'
    });
    
    console.log("\n=== VERIFICATION RESULT ===");
    console.log(result);
    console.log("\n✅ File input test completed successfully");
  } catch (error) {
    console.error("Error in verification test:", error);
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
    
    // Run the multimodal verification test
    await testVerificationWithFile();
    
    console.log("\n========== All Tests Completed ==========");
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Run the tests
runTests();

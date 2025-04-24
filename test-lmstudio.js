#!/usr/bin/env node

/**
 * Simple LM Studio Connection Test
 * This script tests the connection to LM Studio API directly
 */

import axios from 'axios';

const API_ENDPOINT = process.env.LM_STUDIO_ENDPOINT || 'http://127.0.0.1:1234';

console.log(`Testing connection to LM Studio at: ${API_ENDPOINT}`);
console.log('------------------------');

// Create a simple axios client
const client = axios.create({
  baseURL: API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Test connection by getting models
async function testConnection() {
  try {
    console.log('Attempting to connect to LM Studio API...');
    const response = await client.get('/v1/models');
    
    console.log('\n✅ CONNECTION SUCCESSFUL');
    console.log('Models available:');
    
    if (response.data && response.data.data) {
      response.data.data.forEach((model, index) => {
        console.log(`${index + 1}. ${model.id}`);
      });
    } else {
      console.log('No model information returned');
    }
    
    console.log('\nNow testing a simple completion...');
    
    // Try a simple completion
    const completionResponse = await client.post('/v1/chat/completions', {
      model: response.data.data[0]?.id || 'deepseek-r1-distill-qwen-32b-uncensored-mlx', // Use first available model or default
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello' }
      ],
      temperature: 0.7,
      max_tokens: 100
    });
    
    console.log('\n✅ COMPLETION TEST SUCCESSFUL');
    console.log('Response:');
    console.log(completionResponse.data.choices[0]?.message?.content || 'No response text');
    
    console.log('\n------------------------');
    console.log('✅ ALL TESTS PASSED - LM Studio connection is working correctly');
    
  } catch (error) {
    console.log('\n❌ CONNECTION FAILED');
    
    if (axios.isAxiosError(error)) {
      console.error(`Status: ${error.response?.status || 'unknown'}`);
      console.error(`Message: ${error.message}`);
      
      if (error.response?.data) {
        console.error('Response data:', error.response.data);
      }
    } else {
      console.error(`Error: ${error}`);
    }
    
    console.log('\nTroubleshooting steps:');
    console.log('1. Is LM Studio running with DeepSeek R1 or another model loaded?');
    console.log('2. Is the API Server started in LM Studio? (It should show "HTTP server listening on port 1234")');
    console.log('3. Is the port correct? (Default: 1234)');
    console.log('4. Check if any firewalls or security software might be blocking the connection');
  }
}

testConnection().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

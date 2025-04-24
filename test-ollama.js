import axios from 'axios';
import fs from 'fs';
import path from 'path';

// File to include in the test
const fileToTest = 'README.md';

// Read the file content
const fileContent = fs.readFileSync(fileToTest, 'utf-8');
const fileName = path.basename(fileToTest);
const fileExt = path.extname(fileToTest).substring(1);

// Format file content with proper markdown
const formattedContent = `# File: ${fileName}\n\`\`\`${fileExt}\n${fileContent}\n\`\`\`\n`;

// Create the complete prompt with instructions and file content
const prompt = `Hello, please analyze this file and tell me what it's about:\n\n${formattedContent}`;

// Ollama API configuration
const ollamaEndpoint = 'http://127.0.0.1:11434/api/chat';
const ollamaModel = 'deepseek-r1:70b'; // Use the available model

async function testOllamaAPI() {
  console.log('Testing Ollama API with file content...');
  console.log(`Using model: ${ollamaModel}`);
  console.log(`File: ${fileToTest} (${fileContent.length} bytes)`);
  
  try {
    const response = await axios.post(ollamaEndpoint, {
      model: ollamaModel,
      messages: [
        { role: 'system', content: 'You are a helpful assistant that analyzes files.' },
        { role: 'user', content: prompt }
      ],
      options: {
        temperature: 0.7,
        num_predict: 1000
      },
      stream: false
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n--- Ollama Response ---');
    console.log(response.data.message.content);
    console.log('\n--- End Response ---');
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error calling Ollama API:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testOllamaAPI();

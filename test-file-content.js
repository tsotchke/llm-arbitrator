import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Handle command line arguments
const filePath = process.argv[2] || 'INSTALLATION.md';

// Get file info
const fileName = path.basename(filePath);
const fileExt = path.extname(fileName).toLowerCase().substring(1);

// Function to get appropriate language for syntax highlighting
function getLanguageFromExt(ext) {
  const langMap = {
    'js': 'javascript',
    'ts': 'typescript',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'go': 'go',
    'rb': 'ruby',
    'php': 'php',
    'html': 'html',
    'css': 'css',
    'json': 'json',
    'xml': 'xml',
    'md': 'markdown',
    'sql': 'sql',
    'sh': 'bash',
    'bat': 'batch'
  };
  
  return langMap[ext] || '';
}

// Read file content
console.log(`Reading file: ${filePath}`);
const fileContent = fs.readFileSync(filePath, 'utf8');
console.log(`File size: ${fileContent.length} bytes`);

// Format file content with markdown syntax highlighting
const formattedContent = `# File: ${fileName}\n\`\`\`${getLanguageFromExt(fileExt)}\n${fileContent}\n\`\`\``;

// Create message with file content
const content = [
  {
    type: 'text',
    text: 'Please analyze this file and suggest improvements to make it more user-friendly.'
  },
  {
    type: 'text',
    text: formattedContent
  }
];

const messages = [
  {
    role: 'user',
    content: content
  }
];

console.log('Message structure:');
console.log(JSON.stringify(messages, null, 2));

// Test LM Studio API directly
async function testAPI() {
  console.log('\nSending request to LM Studio API...');
  try {
    // First, test if we can reach the models endpoint
    const modelsResponse = await axios.get('http://127.0.0.1:1234/v1/models');
    console.log(`Available models: ${JSON.stringify(modelsResponse.data.data.map(m => m.id))}`);
    
    // Send the actual completion request
    const response = await axios.post('http://127.0.0.1:1234/v1/chat/completions', {
      model: 'deepseek-r1-distill-qwen-32b-uncensored-mlx',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('\nAPI Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Extract the assistant's response
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const assistantResponse = response.data.choices[0].message.content;
      console.log('\n--- Assistant Response ---');
      console.log(assistantResponse);
      console.log('--- End Response ---');
    }
  } catch (error) {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    
    // Log more details about the error
    console.error('\nDetailed error info:');
    console.error(`Request URL: ${error.config?.url}`);
    console.error(`Request method: ${error.config?.method}`);
    if (error.config?.data) {
      console.error(`Request data: ${error.config.data.substring(0, 500)}...`);
    }
  }
}

// Run the test API
testAPI();

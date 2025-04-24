import axios from 'axios';
import fs from 'fs';
import path from 'path';

// Handle command line arguments
const filePaths = process.argv.slice(2);

if (filePaths.length === 0) {
  console.error('Please provide at least one file path as a command line argument');
  console.error('Example: node test-multiple-files.js README.md INSTALLATION.md');
  process.exit(1);
}

console.log(`Testing with ${filePaths.length} files: ${filePaths.join(', ')}`);

// Function to get appropriate language for syntax highlighting
function getLanguageFromExt(fileName) {
  const ext = path.extname(fileName).toLowerCase().substring(1);
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

// Process files and create content array
async function processFiles() {
  const content = [];
  
  // Add task description as first text item
  content.push({
    type: 'text',
    text: 'Please analyze these files and summarize them briefly, mentioning each file by name.'
  });
  
  // Process each file
  for (const filePath of filePaths) {
    try {
      console.log(`Reading file: ${filePath}`);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      console.log(`File size: ${fileContent.length} bytes`);
      
      const fileName = path.basename(filePath);
      const fileExt = path.extname(fileName).toLowerCase().substring(1);
      
      // Format file content with markdown syntax highlighting
      const formattedContent = `# File: ${fileName}\n\`\`\`${getLanguageFromExt(fileExt)}\n${fileContent}\n\`\`\``;
      
      // Add as separate content item
      content.push({
        type: 'text',
        text: formattedContent
      });
      
      console.log(`Added ${fileName} as content item`);
    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error.message);
    }
  }
  
  return content;
}

// Test LM Studio API directly
async function testAPI() {
  try {
    // Process files
    const content = await processFiles();
    
    // Create messages array with content
    const messages = [
      {
        role: 'user',
        content: content
      }
    ];
    
    console.log('\nContent structure:');
    console.log(`Number of content items: ${content.length}`);
    for (let i = 0; i < content.length; i++) {
      const item = content[i];
      console.log(`- Item ${i+1}: ${item.type}, ${item.text.length} chars, starts with "${item.text.substring(0, 30)}..."`);
    }
    
    console.log('\nSending request to LM Studio API...');
    // First, test if we can reach the models endpoint
    const modelsResponse = await axios.get('http://127.0.0.1:1234/v1/models');
    console.log(`Available models: ${JSON.stringify(modelsResponse.data.data.map(m => m.id))}`);
    
    // Detailed request logging
    console.log('\nRequest details:');
    console.log('Endpoint: http://127.0.0.1:1234/v1/chat/completions');
    console.log('Model: deepseek-r1-distill-qwen-32b-uncensored-mlx');
    console.log(`Messages array contains ${messages.length} messages`);
    console.log(`First message has ${messages[0].content.length} content items`);
    
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
      try {
        const dataObj = JSON.parse(error.config.data);
        console.error(`Request model: ${dataObj.model}`);
        console.error(`Request message count: ${dataObj.messages.length}`);
        console.error(`First message content items: ${dataObj.messages[0].content.length}`);
      } catch (e) {
        console.error(`Error parsing request data: ${e.message}`);
        console.error(`Raw request data: ${error.config.data.substring(0, 500)}...`);
      }
    }
  }
}

// Run the test API
testAPI();

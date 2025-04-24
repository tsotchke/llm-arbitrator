import axios from 'axios';

const content = [
  {
    type: 'text',
    text: 'Hello, this is a prompt'
  },
  {
    type: 'text',
    text: '# File: README.md\n```markdown\n# Test Content\nThis is a test file\n```'
  }
];

const messages = [
  {
    role: 'user',
    content: content
  }
];

console.log(JSON.stringify(messages, null, 2));

// Test LM Studio API directly
async function testAPI() {
  try {
    const response = await axios.post('http://127.0.0.1:1234/v1/chat/completions', {
      model: 'deepseek-r1-distill-qwen-32b-uncensored-mlx',
      messages: messages,
      temperature: 0.7,
      max_tokens: 500,
      stream: false,
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('API Response:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('API Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test API
testAPI();

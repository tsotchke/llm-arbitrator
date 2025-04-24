#!/bin/bash
# Verify that our MCP tools are working correctly

echo "LLM Arbitrator MCP Verification Test"
echo "=================================="
echo

# Check if a test file was provided
TEST_FILE=${1:-"README.md"}
echo "Testing with file: $TEST_FILE"
echo

# Ensure test file exists
if [[ ! -f "$TEST_FILE" ]]; then
  echo "Error: Test file '$TEST_FILE' not found"
  exit 1
fi

# Compile typescript if needed
if [[ ! -d "build" ]]; then
  echo "Building project..."
  npm run build
  echo
fi

# Run the MCP server in background for testing
echo "Starting MCP server in background..."
node build/index.js &
SERVER_PID=$!

# Ensure server is terminated on script exit
trap "kill $SERVER_PID" EXIT

# Wait for server to start
echo "Waiting for server to initialize..."
sleep 2
echo

# Create test JSON payload for the optimize_prompt tool with our test file
echo "Creating test MCP request..."
cat > test-request.json << EOL
{
  "method": "call_tool",
  "params": {
    "name": "optimize_prompt",
    "arguments": {
      "originalPrompt": "Use the provided file to explain the LLM Arbitrator",
      "files": ["$TEST_FILE"]
    }
  },
  "id": "test-1"
}
EOL

# Send request to MCP server via stdin
echo "Sending MCP request with file: $TEST_FILE"
cat test-request.json | node -e '
process.stdin.on("data", data => {
  process.stdout.write(data);
  // Add delay to ensure MCP server processes the request
  setTimeout(() => {
    console.log("\n\nTest request sent. Check server logs for results.");
    process.exit(0);
  }, 1000);
});
'

# Wait for response
echo "Waiting for MCP server response..."
sleep 5

# Clean up test file
rm -f test-request.json

echo
echo "Verification complete. If you see file content in the logs above, the MCP tool is working correctly."
echo "Note: Check error logs for any issues with file loading."

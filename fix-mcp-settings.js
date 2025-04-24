#!/usr/bin/env node
/**
 * Script to update and fix MCP settings
 */
import fs from 'fs';
import path from 'path';
import os from 'os';

// Path to MCP settings
const settingsPath = path.join(
  os.homedir(),
  'Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'
);

// Read existing settings
console.log(`Reading settings from: ${settingsPath}`);
let settings = {};
try {
  const content = fs.readFileSync(settingsPath, 'utf8');
  // Handle the case where the file might not be proper JSON (missing enclosing braces)
  const jsonContent = content.startsWith('{') ? content : `{${content}}`;
  settings = JSON.parse(jsonContent);
} catch (err) {
  console.error(`Error reading settings: ${err.message}`);
  process.exit(1);
}

// Ensure mcpServers exists
if (!settings.mcpServers) {
  settings.mcpServers = {};
}

// Update the llm-arbitrator settings
settings.mcpServers['llm-arbitrator'] = {
  command: 'node',
  args: [`${process.cwd()}/build/index.js`],
  env: {
    LM_STUDIO_ENDPOINT: 'http://127.0.0.1:1234',
    DEBUG_MODE: 'true',
    LOG_LEVEL: 'debug',
    MCP_PROTOCOL_VERSION: '1.0'
  },
  disabled: false,
  autoApprove: ['enhance_code_generation', 'verify_solution', 'optimize_prompt', 'get_context_files'],
  timeout: 120000
};

// Write updated settings
console.log(`Updating settings at: ${settingsPath}`);
try {
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('Settings updated successfully');
} catch (err) {
  console.error(`Error writing settings: ${err.message}`);
  process.exit(1);
}

console.log('MCP settings have been updated. Please restart VS Code for changes to take effect.');

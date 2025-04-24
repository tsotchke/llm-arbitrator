#!/usr/bin/env node
/**
 * Test script to demonstrate both Chain-of-Thought preservation and Smart Context Management
 * working together to provide enhanced R1 capabilities
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { LmStudioClient } from './build/api/lmStudioClient.js';
import { CodeEnhancer } from './build/enhancers/codeEnhancer.js';
import { ContextManager } from './build/utils/contextManager.js';

// Get current file directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test directory 
const TEST_DIR = path.join(__dirname, 'test-integrated');
const OUTPUT_DIR = path.join(__dirname, 'test-output');

// Configuration
const API_ENDPOINT = process.env.LM_STUDIO_ENDPOINT || 'http://127.0.0.1:1234';

// Make sure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Test project template
const PROJECT_FILES = {
  'src': {
    'components': {
      'Button.js': `
import React from 'react';
import '../styles/Button.css';

/**
 * Button component that provides a customizable button with different variants
 * @param {object} props - Component props
 * @param {string} [props.variant='primary'] - Button variant (primary, secondary, danger)
 * @param {string} props.children - Button text content
 * @param {function} props.onClick - Click handler function
 * @param {boolean} [props.disabled=false] - Whether the button is disabled
 * @returns {JSX.Element} - Rendered button component
 */
export function Button({ 
  variant = 'primary', 
  children, 
  onClick,
  disabled = false,
  ...rest
}) {
  return (
    <button 
      className={\`btn btn-\${variant} \${disabled ? 'btn-disabled' : ''}\`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
`,
      'UserProfile.js': `
import React, { useState } from 'react';
import { Button } from './Button';
import { Avatar } from './Avatar';
import { useUser } from '../context/UserContext';
import '../styles/UserProfile.css';

/**
 * User profile component that displays user information and profile actions
 * @returns {JSX.Element} Rendered user profile
 */
export function UserProfile() {
  const { user, updateUser, logoutUser } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  
  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };
  
  const handleSaveProfile = () => {
    // Save profile logic would go here
    setIsEditing(false);
  };
  
  if (!user) {
    return <div className="user-profile-loading">Loading user data...</div>;
  }
  
  return (
    <div className="user-profile">
      <div className="user-profile-header">
        <Avatar src={user.avatarUrl} alt={user.name} size="large" />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
      </div>
      
      <div className="user-profile-actions">
        <Button 
          variant="primary" 
          onClick={handleEditToggle}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </Button>
        
        {isEditing && (
          <Button 
            variant="secondary" 
            onClick={handleSaveProfile}
          >
            Save Changes
          </Button>
        )}
        
        <Button 
          variant="danger" 
          onClick={logoutUser}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
`,
      'Avatar.js': `
import React from 'react';
import '../styles/Avatar.css';

/**
 * Avatar component that displays a user's profile image
 * @param {object} props - Component props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alternative text for the image
 * @param {string} [props.size='medium'] - Size of avatar (small, medium, large)
 * @returns {JSX.Element} - Rendered avatar component
 */
export function Avatar({ src, alt, size = 'medium' }) {
  // If no image is provided, use default avatar
  const imageSrc = src || '/images/default-avatar.png';
  
  return (
    <img 
      className={\`avatar avatar-\${size}\`}
      src={imageSrc}
      alt={alt}
    />
  );
}
`
    },
    'context': {
      'UserContext.js': `
import React, { createContext, useContext, useState } from 'react';

// Create context
const UserContext = createContext();

/**
 * Provider component for user authentication and profile data
 * @param {object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} - User context provider
 */
export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Simulated login function
  const loginUser = async (credentials) => {
    setLoading(true);
    try {
      // API call would go here in a real application
      const userData = { 
        id: '123', 
        name: 'Jane Doe', 
        email: 'jane@example.com',
        avatarUrl: '/images/jane.png'
      };
      setUser(userData);
      return { success: true };
    } catch (error) {
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logoutUser = () => {
    setUser(null);
  };
  
  // Update user profile
  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }));
  };
  
  // Context value
  const value = {
    user,
    loading,
    loginUser,
    logoutUser,
    updateUser
  };
  
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Hook to access user context
 * @returns {object} - User context value
 */
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
`
    },
    'styles': {
      'Button.css': `
.btn {
  padding: 8px 16px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: background-color 0.2s, opacity 0.2s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-danger {
  background-color: #dc3545;
  color: white;
}

.btn-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
`,
      'Avatar.css': `
.avatar {
  border-radius: 50%;
  object-fit: cover;
}

.avatar-small {
  width: 32px;
  height: 32px;
}

.avatar-medium {
  width: 48px;
  height: 48px;
}

.avatar-large {
  width: 96px;
  height: 96px;
}
`,
      'UserProfile.css': `
.user-profile {
  padding: 20px;
  border-radius: 8px;
  background-color: #f8f9fa;
  max-width: 500px;
  margin: 0 auto;
}

.user-profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.user-profile-header h2 {
  margin: 12px 0 4px 0;
}

.user-profile-header p {
  color: #6c757d;
  margin: 0;
}

.user-profile-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.user-profile-loading {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}
`
    }
  },
  'tests': {
    'components': {
      'UserProfile.test.js': `
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserProfile } from '../../src/components/UserProfile';
import { UserProvider } from '../../src/context/UserContext';

// Mock the user context
jest.mock('../../src/context/UserContext', () => ({
  useUser: jest.fn()
}));

describe('UserProfile', () => {
  it('renders loading state when user is null', () => {
    // Mock user context with null user
    const mockUseUser = require('../../src/context/UserContext').useUser;
    mockUseUser.mockReturnValue({
      user: null
    });
    
    render(<UserProfile />);
    expect(screen.getByText('Loading user data...')).toBeInTheDocument();
  });
  
  it('renders user profile when user data is available', () => {
    // Mock user context with user data
    const mockUseUser = require('../../src/context/UserContext').useUser;
    mockUseUser.mockReturnValue({
      user: {
        name: 'Test User',
        email: 'test@example.com',
        avatarUrl: '/test.png'
      },
      logoutUser: jest.fn()
    });
    
    render(<UserProfile />);
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });
  
  it('toggles edit mode when Edit Profile button is clicked', () => {
    // Mock user context
    const mockUseUser = require('../../src/context/UserContext').useUser;
    mockUseUser.mockReturnValue({
      user: {
        name: 'Test User',
        email: 'test@example.com'
      },
      logoutUser: jest.fn()
    });
    
    render(<UserProfile />);
    
    // Initially, Save Changes button should not be visible
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
    
    // Click Edit Profile button
    fireEvent.click(screen.getByText('Edit Profile'));
    
    // Save Changes button should now be visible
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    
    // Click Cancel (previously Edit Profile)
    fireEvent.click(screen.getByText('Cancel'));
    
    // Save Changes button should be hidden again
    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
  });
});
`
    }
  },
  'docs': {
    'components.md': `
# Component Documentation

## UserProfile

The UserProfile component displays a user's profile information and provides actions like editing the profile and logging out.

### Props

This component does not accept any props, as it gets all user data from the UserContext.

### Context

- Requires a UserProvider ancestor to access user data and actions.

### Example Usage

\`\`\`jsx
import { UserProfile } from './components/UserProfile';
import { UserProvider } from './context/UserContext';

function App() {
  return (
    <UserProvider>
      <UserProfile />
    </UserProvider>
  );
}
\`\`\`

## Avatar

Displays a user's avatar image with different size options.

### Props

- \`src\`: (string) Image URL
- \`alt\`: (string) Alternative text for the image
- \`size\`: (string, optional) Size variant ('small', 'medium', 'large'), defaults to 'medium'

## Button

A reusable button component with different style variants.

### Props

- \`variant\`: (string, optional) Button style variant ('primary', 'secondary', 'danger'), defaults to 'primary'
- \`children\`: (React.ReactNode) Button content
- \`onClick\`: (function) Click handler
- \`disabled\`: (boolean, optional) Whether the button is disabled, defaults to false
`
  }
};

/**
 * Set up test environment
 */
function setupTestEnvironment() {
  console.log("Setting up test environment...");
  
  // Create test directory
  if (fs.existsSync(TEST_DIR)) {
    console.log("Cleaning existing test directory...");
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  
  fs.mkdirSync(TEST_DIR, { recursive: true });
  
  // Create test project structure
  createProject(PROJECT_FILES, TEST_DIR);
  
  console.log(`Test project created at: ${TEST_DIR}`);
}

/**
 * Create a project structure recursively
 */
function createProject(structure, basePath) {
  for (const [name, content] of Object.entries(structure)) {
    const itemPath = path.join(basePath, name);
    
    if (typeof content === 'string') {
      fs.writeFileSync(itemPath, content);
    } else {
      fs.mkdirSync(itemPath, { recursive: true });
      createProject(content, itemPath);
    }
  }
}

/**
 * Test the integrated features
 */
async function testIntegratedFeatures() {
  console.log("\n===== Testing Integrated Chain-of-Thought & Context Management =====\n");
  
  try {
    // Step 1: Create LM Studio client
    const client = new LmStudioClient(API_ENDPOINT);
    
    // Step 2: Test connection
    console.log("Testing connection to LM Studio...");
    await client.testConnection();
    console.log("✅ LM Studio connection successful");
    
    // Step 3: Create enhancers
    const codeEnhancer = new CodeEnhancer(client);
    const contextManager = new ContextManager();
    
    // Step 4: Get target file
    const userProfileFile = path.join(TEST_DIR, 'src/components/UserProfile.js');
    
    // Step 5: Use Smart Context Manager to automatically discover related files
    console.log("\n📊 Using Smart Context Manager to auto-discover files...");
    
    // Get directly related files
    const relatedFiles = await contextManager.getContextFiles(userProfileFile);
    console.log(`Found ${relatedFiles.length} directly related files:`);
    relatedFiles.forEach((file, i) => console.log(`  ${i+1}. ${path.relative(TEST_DIR, file)}`));
    
    // Get test files
    const testFiles = await contextManager.findTestFiles(userProfileFile);
    console.log(`\nFound ${testFiles.length} test files:`);
    testFiles.forEach((file, i) => console.log(`  ${i+1}. ${path.relative(TEST_DIR, file)}`));
    
    // Get documentation files
    const docFiles = await contextManager.findDocumentationFiles(userProfileFile);
    console.log(`\nFound ${docFiles.length} documentation files:`);
    docFiles.forEach((file, i) => console.log(`  ${i+1}. ${path.relative(TEST_DIR, file)}`));
    
    // Combine all discovered files for context
    const allContextFiles = [...relatedFiles, ...testFiles, ...docFiles];
    
    // Step 6: Use Chain-of-Thought enhanced code generator with discovered files
    console.log("\n💭 Using Chain-of-Thought Enhanced Code Generator with discovered context...");
    
    const taskDescription = "Add a 'Last Login' timestamp field to the UserProfile component that displays when the user last logged in";
    
    console.log(`Task: ${taskDescription}`);
    console.log(`Using ${allContextFiles.length} auto-discovered context files`);
    
    // Generate enhanced code with automatic context discovery
    const enhancedCode = await codeEnhancer.enhance(
      taskDescription,
      "React component enhancement task", // Project context
      "react",                           // Language
      "web",                             // Domain
      [userProfileFile],                 // Starting file
      "",                                // Use default model
      true                               // Enable auto-discovery
    );
    
    // Save the result to output directory
    const outputPath = path.join(OUTPUT_DIR, 'integrated-features-result.md');
    fs.writeFileSync(outputPath, enhancedCode);
    
    console.log(`\n✅ Enhanced code generated and saved to: ${outputPath}`);
    console.log("\nExtracting chain-of-thought reasoning sample:");
    
    // Extract and print a sample of the chain-of-thought
    const thinkingMatch = enhancedCode.match(/## R1 Reasoning Process\n\n([\s\S]{1,500})/);
    if (thinkingMatch) {
      console.log("\n-----------------------------------");
      console.log(thinkingMatch[1] + "...");
      console.log("-----------------------------------");
    }
    
    console.log("\n✨ Successfully demonstrated both features working together:");
    console.log("1. Smart Context Management automatically discovered related files");
    console.log("2. Chain-of-Thought preservation captured R1's detailed reasoning process");
    console.log("\nThis integration enables more transparent, context-aware AI assistance.");
    
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  } finally {
    // Clean up
    //console.log("\nCleaning up test environment...");
    //fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

// Run the test
(async () => {
  setupTestEnvironment();
  await testIntegratedFeatures();
})();

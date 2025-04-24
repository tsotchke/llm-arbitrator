#!/usr/bin/env node
/**
 * Test script to demonstrate the Smart Context Management capabilities
 * This shows how the system automatically identifies and prioritizes relevant files
 */

const fs = require('fs');
const path = require('path');
const { ContextManager } = require('./build/utils/contextManager.js');

// Test files directory
const TEST_DIR = path.join(__dirname, 'test-context');

// Test configuration
const TEST_PROJECT_STRUCTURE = {
  src: {
    components: {
      'Header.js': `
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import { AppContext } from '../context/AppContext';
import '../styles/header.css';

export function Header() {
  return (
    <header className="main-header">
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Button>Login</Button>
      </nav>
    </header>
  );
}
`,
      'Button.js': `
import React from 'react';
import '../styles/button.css';

export function Button({ children, onClick, variant = 'primary' }) {
  return (
    <button 
      className={\`btn btn-\${variant}\`} 
      onClick={onClick}
    >
      {children}
    </button>
  );
}
`,
      'Footer.js': `
import React from 'react';
import '../styles/footer.css';

export function Footer() {
  return (
    <footer>
      <p>&copy; 2025 Sample Project</p>
    </footer>
  );
}
`
    },
    context: {
      'AppContext.js': `
import React, { createContext, useState } from 'react';

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  
  return (
    <AppContext.Provider value={{ user, setUser }}>
      {children}
    </AppContext.Provider>
  );
}
`
    },
    styles: {
      'header.css': `
.main-header {
  background-color: #f8f9fa;
  padding: 1rem;
}

nav {
  display: flex;
  gap: 1rem;
}
`,
      'button.css': `
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}
`,
      'footer.css': `
footer {
  margin-top: 2rem;
  padding: 1rem;
  background-color: #f8f9fa;
  text-align: center;
}
`
    },
    utils: {
      'helpers.js': `
export function formatDate(date) {
  return new Intl.DateTimeFormat('en-US').format(date);
}

export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}
`
    },
    'App.js': `
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AppProvider } from './context/AppContext';
import Home from './pages/Home';
import About from './pages/About';
import './styles/app.css';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
`,
    pages: {
      'Home.js': `
import React from 'react';
import { Button } from '../components/Button';

function Home() {
  return (
    <div>
      <h1>Home Page</h1>
      <p>Welcome to our application!</p>
      <Button>Get Started</Button>
    </div>
  );
}

export default Home;
`,
      'About.js': `
import React from 'react';
import { formatDate } from '../utils/helpers';

function About() {
  return (
    <div>
      <h1>About Us</h1>
      <p>We are a sample project created to demonstrate context management.</p>
      <p>Today's date: {formatDate(new Date())}</p>
    </div>
  );
}

export default About;
`
    }
  },
  tests: {
    components: {
      'Button.test.js': `
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../../src/components/Button';

test('renders button with children', () => {
  render(<Button>Test Button</Button>);
  expect(screen.getByText('Test Button')).toBeInTheDocument();
});
`,
      'Header.test.js': `
import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from '../../src/components/Header';

jest.mock('../context/AppContext', () => ({
  AppContext: React.createContext({})
}));

test('renders header with navigation', () => {
  const { getByText } = render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
  expect(getByText('Home')).toBeInTheDocument();
  expect(getByText('About')).toBeInTheDocument();
});
`
    }
  },
  docs: {
    'components.md': `
# Components Documentation

## Header
The main navigation header for the application.

## Button
A reusable button component with different variants.

## Footer
The footer component that appears at the bottom of every page.
`,
    'context.md': `
# Context API

The application uses React Context API for state management.

## AppContext
Provides authentication and user information to all components.
`
  },
  'README.md': `
# Sample Project

This is a sample React project to demonstrate the Smart Context Management feature.

## Components
- Header: Main navigation
- Button: Reusable button component
- Footer: Application footer

## Context
- AppContext: User authentication state

## Styling
CSS files for each component are stored in the src/styles directory.
`
};

// Set up test environment
function setupTestEnvironment() {
  console.log("Setting up test environment...");
  
  // Create test directory
  if (fs.existsSync(TEST_DIR)) {
    console.log("Cleaning existing test directory...");
    deleteFolderRecursive(TEST_DIR);
  }
  
  fs.mkdirSync(TEST_DIR, { recursive: true });
  
  // Create test project structure
  createTestProject(TEST_PROJECT_STRUCTURE, TEST_DIR);
  
  console.log(`Test project created at: ${TEST_DIR}`);
}

// Recursive function to create project structure
function createTestProject(structure, basePath) {
  for (const [name, content] of Object.entries(structure)) {
    const itemPath = path.join(basePath, name);
    
    if (typeof content === 'string') {
      // Create file
      fs.writeFileSync(itemPath, content);
    } else {
      // Create directory
      fs.mkdirSync(itemPath, { recursive: true });
      createTestProject(content, itemPath);
    }
  }
}

// Helper to delete directories recursively
function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}

// Main test function - simplified for demo purposes
async function runTests() {
  try {
    // Set up test environment
    setupTestEnvironment();
    
    console.log("Test environment set up successfully.");
    console.log("\nTo test the Context Manager, run the following command after building the project:");
    console.log("\nnode -e \"");
    console.log("const { ContextManager } = require('./build/utils/contextManager.js');");
    console.log("const path = require('path');");
    console.log("const contextManager = new ContextManager();");
    console.log("const headerFile = path.join(__dirname, 'test-context/src/components/Header.js');");
    console.log("contextManager.getContextFiles(headerFile).then(files => {");
    console.log("  console.log('Found related files:');");
    console.log("  files.forEach(f => console.log('- ' + path.relative(__dirname, f)));");
    console.log("});\"");
    
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

// Run the tests
runTests();

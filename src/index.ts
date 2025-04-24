#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';

// Define log level type since it's not exported from the SDK
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
import { LmStudioClient } from './api/lmStudioClient.js';
import { CodeEnhancer } from './enhancers/codeEnhancer.js';
import { PromptEnhancer } from './enhancers/promptEnhancer.js';
import { VerificationEnhancer } from './enhancers/verificationEnhancer.js';
import { loadTemplates } from './templates/templateLoader.js';
import { isValidEnhanceCodeGenerationArgs, isValidVerifySolutionArgs, isValidOptimizePromptArgs, isValidGetContextFilesArgs } from './utils/validation.js';
import { adaptServerForNamespacedMethods } from './mcp-adapter.js';
import { ContextManager } from './utils/contextManager.js';

// Import configuration
import { 
  config, 
  serverConfig, 
  providersConfig, 
  modelsConfig, 
  filesConfig, 
  debugConfig 
} from './config.js';

// Helper for consistent logging
function log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
  // Skip logs below the configured level
  const levelPriorities = { debug: 0, info: 1, warn: 2, error: 3 };
  const configLevel = levelPriorities[serverConfig.logLevel] || 1;
  const msgLevel = levelPriorities[level] || 1;
  
  if (msgLevel < configLevel) return;
  
  // Format log message
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}] [${serverConfig.name}] `;
  
  // Only show debug messages if debug mode is enabled
  if (level === 'debug' && !debugConfig.enabled) return;
  
  // Log to console
  if (data) {
    console.error(`${prefix}${message}`, typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  } else {
    console.error(`${prefix}${message}`);
  }
  
  // If log file is configured, log to file as well
  if (debugConfig.logFilePath) {
    try {
      const fs = require('fs');
      const logMessage = `${prefix}${message} ${data ? JSON.stringify(data) : ''}\n`;
      fs.appendFileSync(debugConfig.logFilePath, logMessage);
    } catch (error) {
      console.error(`Failed to write to log file: ${error}`);
    }
  }
}

class LlmArbitratorServer {
  private server: Server;
  private lmStudioClient: LmStudioClient;
  private codeEnhancer: CodeEnhancer;
  private promptEnhancer: PromptEnhancer;
  private verificationEnhancer: VerificationEnhancer;
  private contextManager: ContextManager;
  private isShuttingDown: boolean = false;

  constructor() {
    // Initialize the MCP server with detailed configuration
    this.server = new Server(
      {
        name: serverConfig.name,
        version: serverConfig.version,
        logLevel: serverConfig.logLevel,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    log('info', 'Initializing LLM Arbitrator MCP server');

    // Initialize the LM Studio client with configuration
    this.lmStudioClient = new LmStudioClient(providersConfig.lmStudio.endpoint, providersConfig.lmStudio.defaultModel);
    
    // Initialize context manager
    this.contextManager = new ContextManager();
    
    // Initialize enhancers
    this.codeEnhancer = new CodeEnhancer(this.lmStudioClient);
    this.promptEnhancer = new PromptEnhancer(this.lmStudioClient);
    this.verificationEnhancer = new VerificationEnhancer(this.lmStudioClient);
    
    // Load templates
    loadTemplates();
    log('debug', 'Templates loaded successfully');
    
    // Adapt server to handle both namespaced and non-namespaced methods
    try {
      adaptServerForNamespacedMethods(this.server, log);
      
      // Manually register methods as fallback if adapter fails
      (this.server as any).registerMethod?.('list_tools', async (params: any) => {
        log('debug', 'Received direct list_tools call', params);
        const result = await (this.server as any).handleRequest?.(ListToolsRequestSchema, {}) || 
                      this.server.setRequestHandler(ListToolsRequestSchema, async () => {
                        return { tools: [] };
                      });
        return result;
      });
      
      (this.server as any).registerMethod?.('call_tool', async (params: any) => {
        log('debug', 'Received direct call_tool call', params);
        if (!params || !params.name) {
          throw new McpError(ErrorCode.InvalidParams, 'Missing tool name');
        }
        const result = await (this.server as any).handleRequest?.(CallToolRequestSchema, params);
        return result;
      });
      
      log('info', 'Manually registered methods as fallback');
    } catch (error) {
      log('error', 'Error setting up method handlers:', error);
    }
    
    // Setup tool handlers
    this.setupToolHandlers();
    
    // Enhanced error handling
    this.server.onerror = (error) => {
      log('error', 'MCP Server Error:', error);
    };
    
    // Log connection events using the existing events
    log('info', 'Server initialized, will log when connected');
    
    // Improved process signal handling
    this.setupProcessHandlers();
  }
  
  private setupProcessHandlers() {
    // Handle graceful shutdown
    const signalHandler = async (signal: string) => {
      if (this.isShuttingDown) return;
      
      this.isShuttingDown = true;
      log('info', `Received ${signal} signal, shutting down gracefully...`);
      
      try {
        await this.server.close();
        log('info', 'MCP server closed successfully');
      } catch (error) {
        log('error', 'Error during server shutdown:', error);
      }
      
      setTimeout(() => {
        log('info', 'Forcing exit after timeout');
        process.exit(1);
      }, 3000).unref();
      
      process.exit(0);
    };
    
    // Register handlers for various termination signals
    process.on('SIGINT', () => signalHandler('SIGINT'));
    process.on('SIGTERM', () => signalHandler('SIGTERM'));
    process.on('uncaughtException', (error) => {
      log('error', 'Uncaught exception:', error);
      signalHandler('uncaughtException');
    });
    process.on('unhandledRejection', (reason) => {
      log('error', 'Unhandled rejection:', reason);
    });
  }

  private setupToolHandlers() {
    log('debug', 'Setting up tool handlers');
    
    // Log all received messages for debugging
    (this.server as any).transport?.on?.('message', (msg: any) => {
      log('debug', 'RAW MCP MESSAGE RECEIVED:', msg);
    });
    
    // Register available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async (request) => {
      log('info', '✅ Received ListToolsRequest', request);
      
      return {
        tools: [
          {
            name: 'enhance_code_generation',
            description: 'Enhances code generation by leveraging specialized models for different domains',
            inputSchema: {
              type: 'object',
              properties: {
                taskDescription: {
                  type: 'string',
                  description: 'Description of the coding task to be performed',
                },
                projectContext: {
                  type: 'string',
                  description: 'Context about the project (optional)',
                },
                language: {
                  type: 'string',
                  description: 'Programming language or framework (optional)',
                },
                domain: {
                  type: 'string',
                  description: 'Specialized domain (e.g., quantum, functional, web) (optional)',
                },
                files: {
                  type: 'array',
                  description: 'File paths to include as multimodal input (optional)',
                  items: {
                    type: 'string'
                  }
                },
                model: {
                  type: 'string',
                  description: 'Specific model to use (optional)'
                }
              },
              required: ['taskDescription'],
            },
          },
          {
            name: 'verify_solution',
            description: 'Verifies a code solution using specialized models',
            inputSchema: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  description: 'Code solution to verify',
                },
                language: {
                  type: 'string',
                  description: 'Programming language of the code',
                },
                taskDescription: {
                  type: 'string',
                  description: 'Description of what the code should do',
                },
                files: {
                  type: 'array',
                  description: 'File paths to include as multimodal input (optional)',
                  items: {
                    type: 'string'
                  }
                },
                model: {
                  type: 'string',
                  description: 'Specific model to use (optional)'
                }
              },
              required: ['code', 'language'],
            },
          },
          {
            name: 'optimize_prompt',
            description: 'Optimizes a user prompt for more efficient processing by Claude',
            inputSchema: {
              type: 'object',
              properties: {
                originalPrompt: {
                  type: 'string',
                  description: 'Original user prompt',
                },
                domain: {
                  type: 'string',
                  description: 'Specialized domain (e.g., quantum, functional, web) (optional)',
                },
                files: {
                  type: 'array',
                  description: 'File paths to include as multimodal input (optional)',
                  items: {
                    type: 'string'
                  }
                },
                model: {
                  type: 'string',
                  description: 'Specific model to use (optional)'
                }
              },
              required: ['originalPrompt'],
            },
          },
          {
            name: 'get_context_files',
            description: 'Automatically finds related files for better context',
            inputSchema: {
              type: 'object',
              properties: {
                filePath: {
                  type: 'string',
                  description: 'Path to the main source file to analyze',
                },
                maxFiles: {
                  type: 'number',
                  description: 'Maximum number of context files to return (default: 10)',
                },
                includeTests: {
                  type: 'boolean',
                  description: 'Whether to include related test files (default: true)',
                },
                includeDocs: {
                  type: 'boolean',
                  description: 'Whether to include related documentation files (default: true)',
                },
              },
              required: ['filePath'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      log('info', `✅ Received tool call: ${request.params.name}`, request);
      
      try {
        switch (request.params.name) {
          case 'enhance_code_generation': {
            if (!isValidEnhanceCodeGenerationArgs(request.params.arguments)) {
              log('error', 'Invalid enhance_code_generation arguments', request.params.arguments);
              throw new McpError(
                ErrorCode.InvalidParams,
                'Invalid enhance_code_generation arguments'
              );
            }

            const { taskDescription, projectContext, language, domain, files, model } = request.params.arguments;
            log('info', `Enhancing code for task: ${taskDescription.substring(0, 50)}...`);
            
            const enhancedCode = await this.codeEnhancer.enhance(
              taskDescription,
              projectContext || '',
              language || '',
              domain || '',
              files || [],
              model || ''
            );

            return {
              content: [
                {
                  type: 'text',
                  text: enhancedCode,
                },
              ],
            };
          }

          case 'verify_solution': {
            if (!isValidVerifySolutionArgs(request.params.arguments)) {
              log('error', 'Invalid verify_solution arguments', request.params.arguments);
              throw new McpError(
                ErrorCode.InvalidParams,
                'Invalid verify_solution arguments'
              );
            }

            const { code, language, taskDescription, files, model } = request.params.arguments;
            log('info', `Verifying ${language} code solution`);
            
            const verificationResult = await this.verificationEnhancer.verify(
              code,
              language,
              taskDescription || '',
              files || [],
              model || ''
            );

            return {
              content: [
                {
                  type: 'text',
                  text: verificationResult,
                },
              ],
            };
          }

          case 'optimize_prompt': {
            if (!isValidOptimizePromptArgs(request.params.arguments)) {
              log('error', 'Invalid optimize_prompt arguments', request.params.arguments);
              throw new McpError(
                ErrorCode.InvalidParams,
                'Invalid optimize_prompt arguments'
              );
            }

            const { originalPrompt, domain, files, model } = request.params.arguments;
            log('info', `Optimizing prompt: ${originalPrompt.substring(0, 50)}...`);
            
            const optimizedPrompt = await this.promptEnhancer.optimize(
              originalPrompt,
              domain || '',
              files || [],
              model || ''
            );

            return {
              content: [
                {
                  type: 'text',
                  text: optimizedPrompt,
                },
              ],
            };
          }
          
          case 'get_context_files': {
            if (!isValidGetContextFilesArgs(request.params.arguments)) {
              log('error', 'Invalid get_context_files arguments', request.params.arguments);
              throw new McpError(
                ErrorCode.InvalidParams,
                'Invalid get_context_files arguments'
              );
            }

            const { filePath, maxFiles, includeTests, includeDocs } = request.params.arguments;
            log('info', `Finding context files for: ${filePath}`);
            
            try {
              // Configure context manager
              const options: any = {};
              if (maxFiles !== undefined) options.maxFiles = maxFiles;
              const contextManager = new ContextManager(options);

              // Get all context files
              const contextFiles = await contextManager.getContextFiles(filePath);
              
              // Get test and doc files if requested
              let testFiles: string[] = [];
              let docFiles: string[] = [];
              
              if (includeTests !== false) {
                testFiles = await contextManager.findTestFiles(filePath);
              }
              
              if (includeDocs !== false) {
                docFiles = await contextManager.findDocumentationFiles(filePath);
              }
              
              // Combine all files (removing duplicates)
              const allFiles = [...new Set([...contextFiles, ...testFiles, ...docFiles])];
              
              // Format response with categorization
              const response = {
                related_files: contextFiles,
                test_files: testFiles,
                documentation_files: docFiles,
                all_files: allFiles
              };
              
              return {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(response, null, 2),
                  },
                ],
              };
            } catch (error) {
              log('error', `Error finding context files: ${error}`);
              throw new McpError(
                ErrorCode.InternalError,
                `Error finding context files: ${error}`
              );
            }
          }

          default:
            log('error', `Unknown tool requested: ${request.params.name}`);
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${request.params.name}`
            );
        }
      } catch (error) {
        // Enhanced error handling
        if (error instanceof McpError) {
          throw error;
        }
        
        log('error', `Error handling tool call ${request.params.name}:`, error);
        throw new McpError(
          ErrorCode.InternalError,
          `Internal error processing ${request.params.name}: ${error}`
        );
      }
    });
  }

  async run() {
    try {
      log('info', `Connecting to LM Studio at ${providersConfig.lmStudio.endpoint}`);
      
      // Test connection to LM Studio
      await this.lmStudioClient.testConnection();
      
      // Start the server
      log('info', 'Starting MCP server with stdio transport');
      const transport = new StdioServerTransport();
      
      // Connect with timeout handling
      const connectionPromise = this.server.connect(transport);
      
      // Add timeout for connection
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });
      
      await Promise.race([connectionPromise, timeoutPromise]);
      
      log('info', 'LLM Arbitrator MCP server running on stdio');
    } catch (error) {
      log('error', 'Failed to start LLM Arbitrator server:', error);
      process.exit(1);
    }
  }
  
  // Method to test the server directly
  async testServer() {
    try {
      log('info', 'Testing LLM Arbitrator server functionality...');
      
      // Test connection to LM Studio
      await this.lmStudioClient.testConnection();
      
      // Test template loading
      const hasQuantumTemplate = await import('./templates/templateLoader.js')
        .then(mod => mod.hasTemplate('quantum', 'code-generation'));
      
      log('info', `Quantum template available: ${hasQuantumTemplate}`);
      
      // Simple code enhancement test
      const testTaskDescription = 'Write a hello world function';
      log('info', `Testing code enhancement with: "${testTaskDescription}"`);
      
      const enhancedCode = await this.codeEnhancer.enhance(testTaskDescription, '', 'javascript', '');
      log('info', 'Code enhancement test successful');
      
      return 'Server test successful';
    } catch (error) {
      log('error', 'Server test failed:', error);
      return `Server test failed: ${error}`;
    }
  }
}

// Detect test mode
const TEST_MODE = process.argv.includes('--test');

// Start the server
const server = new LlmArbitratorServer();

if (TEST_MODE) {
  log('info', 'Running in test mode');
  server.testServer()
    .then(result => {
      log('info', result);
      process.exit(0);
    })
    .catch(error => {
      log('error', 'Test failed:', error);
      process.exit(1);
    });
} else {
  server.run().catch(error => {
    log('error', 'Server failed:', error);
    process.exit(1);
  });
}

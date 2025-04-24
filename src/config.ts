/**
 * Configuration system for the LLM Arbitrator MCP server
 * 
 * Handles loading configuration from multiple sources with the following priority:
 * 1. Environment variables
 * 2. Configuration file
 * 3. Default values
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// Define the configuration schema
export interface MpcConfig {
  // Server configuration
  server: {
    name: string;
    version: string;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  
  // Provider configuration
  providers: {
    lmStudio: {
      enabled: boolean;
      endpoint: string;
      defaultModel: string;
      timeout: number;
    };
    ollama: {
      enabled: boolean;
      endpoint: string;
      defaultModel: string;
      timeout: number;
    };
  };
  
  // Model configuration
  models: {
    defaultTemperature: number;
    defaultMaxTokens: number;
    defaultStopSequences: string[];
  };
  
  // File handling configuration
  files: {
    maxContextFiles: number;
    maxFileSize: number; // in bytes
    allowedExtensions: string[];
  };
  
  // Debug configuration
  debug: {
    enabled: boolean;
    logFilePath: string | null;
    verboseLogging: boolean;
  };
}

// Define default configuration
const DEFAULT_CONFIG: MpcConfig = {
  server: {
    name: 'llm-arbitrator',
    version: '1.0.0',
    logLevel: 'info',
  },
  providers: {
    lmStudio: {
      enabled: true,
      endpoint: 'http://127.0.0.1:1234',
      defaultModel: 'deepseek-r1-distill-qwen-32b',
      timeout: 30000,
    },
    ollama: {
      enabled: true,
      endpoint: 'http://127.0.0.1:11434',
      defaultModel: 'deepseek-coder:33b',
      timeout: 30000,
    },
  },
  models: {
    defaultTemperature: 0.7,
    defaultMaxTokens: 4000,
    defaultStopSequences: [],
  },
  files: {
    maxContextFiles: 10,
    maxFileSize: 1024 * 1024, // 1MB
    allowedExtensions: [
      '.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.c', '.cpp', '.h', '.hpp',
      '.cs', '.go', '.rb', '.php', '.html', '.css', '.json', '.md', '.txt',
      '.yml', '.yaml', '.xml', '.sh', '.bat', '.ps1'
    ],
  },
  debug: {
    enabled: false,
    logFilePath: null,
    verboseLogging: false,
  },
};

/**
 * Load configuration file from the specified path
 */
function loadConfigFile(configPath: string): Partial<MpcConfig> {
  try {
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf-8');
      return JSON.parse(configContent);
    }
  } catch (error) {
    console.error(`Error loading config file from ${configPath}:`, error);
  }
  return {};
}

/**
 * Get configuration value from environment variable
 */
function getEnvConfig(): Partial<MpcConfig> {
  const config: Partial<MpcConfig> = {
    server: { } as any,
    providers: {
      lmStudio: { } as any,
      ollama: { } as any,
    },
    models: { } as any,
    files: { } as any,
    debug: { } as any,
  };

  // Server config
  if (process.env.MPC_SERVER_NAME) config.server!.name = process.env.MPC_SERVER_NAME;
  if (process.env.MPC_SERVER_VERSION) config.server!.version = process.env.MPC_SERVER_VERSION;
  if (process.env.MPC_LOG_LEVEL) {
    const level = process.env.MPC_LOG_LEVEL.toLowerCase();
    if (['debug', 'info', 'warn', 'error'].includes(level)) {
      config.server!.logLevel = level as 'debug' | 'info' | 'warn' | 'error';
    }
  }

  // Provider config
  if (process.env.MPC_LMSTUDIO_ENABLED !== undefined) {
    config.providers!.lmStudio!.enabled = process.env.MPC_LMSTUDIO_ENABLED === 'true';
  }
  if (process.env.MPC_LMSTUDIO_ENDPOINT) {
    config.providers!.lmStudio!.endpoint = process.env.MPC_LMSTUDIO_ENDPOINT;
  }
  if (process.env.MPC_LMSTUDIO_DEFAULT_MODEL) {
    config.providers!.lmStudio!.defaultModel = process.env.MPC_LMSTUDIO_DEFAULT_MODEL;
  }
  if (process.env.MPC_LMSTUDIO_TIMEOUT) {
    config.providers!.lmStudio!.timeout = parseInt(process.env.MPC_LMSTUDIO_TIMEOUT, 10);
  }

  if (process.env.MPC_OLLAMA_ENABLED !== undefined) {
    config.providers!.ollama!.enabled = process.env.MPC_OLLAMA_ENABLED === 'true';
  }
  if (process.env.MPC_OLLAMA_ENDPOINT) {
    config.providers!.ollama!.endpoint = process.env.MPC_OLLAMA_ENDPOINT;
  }
  if (process.env.MPC_OLLAMA_DEFAULT_MODEL) {
    config.providers!.ollama!.defaultModel = process.env.MPC_OLLAMA_DEFAULT_MODEL;
  }
  if (process.env.MPC_OLLAMA_TIMEOUT) {
    config.providers!.ollama!.timeout = parseInt(process.env.MPC_OLLAMA_TIMEOUT, 10);
  }

  // Model config
  if (process.env.MPC_DEFAULT_TEMPERATURE) {
    config.models!.defaultTemperature = parseFloat(process.env.MPC_DEFAULT_TEMPERATURE);
  }
  if (process.env.MPC_DEFAULT_MAX_TOKENS) {
    config.models!.defaultMaxTokens = parseInt(process.env.MPC_DEFAULT_MAX_TOKENS, 10);
  }
  if (process.env.MPC_DEFAULT_STOP_SEQUENCES) {
    config.models!.defaultStopSequences = JSON.parse(process.env.MPC_DEFAULT_STOP_SEQUENCES);
  }

  // File config
  if (process.env.MPC_MAX_CONTEXT_FILES) {
    config.files!.maxContextFiles = parseInt(process.env.MPC_MAX_CONTEXT_FILES, 10);
  }
  if (process.env.MPC_MAX_FILE_SIZE) {
    config.files!.maxFileSize = parseInt(process.env.MPC_MAX_FILE_SIZE, 10);
  }
  if (process.env.MPC_ALLOWED_EXTENSIONS) {
    config.files!.allowedExtensions = JSON.parse(process.env.MPC_ALLOWED_EXTENSIONS);
  }

  // Debug config
  if (process.env.MPC_DEBUG_ENABLED !== undefined) {
    config.debug!.enabled = process.env.MPC_DEBUG_ENABLED === 'true';
  }
  if (process.env.MPC_DEBUG_LOG_FILE) {
    config.debug!.logFilePath = process.env.MPC_DEBUG_LOG_FILE;
  }
  if (process.env.MPC_DEBUG_VERBOSE !== undefined) {
    config.debug!.verboseLogging = process.env.MPC_DEBUG_VERBOSE === 'true';
  }

  return config;
}

/**
 * Recursively merge objects
 */
function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceValue = source[key as keyof typeof source];
      if (isObject(sourceValue)) {
        if (!(key in target)) {
          output[key as keyof T] = sourceValue as any;
        } else {
          const targetValue = target[key as keyof T];
          if (isObject(targetValue)) {
            output[key as keyof T] = deepMerge(
              targetValue,
              sourceValue as any
            ) as any;
          }
        }
      } else if (sourceValue !== undefined) {
        output[key as keyof T] = sourceValue as any;
      }
    });
  }
  
  return output;
}

/**
 * Check if value is an object
 */
function isObject(item: any): item is Record<string, any> {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

/**
 * Find configuration file in standard locations
 */
// Get dirname for ES modules
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function findConfigFile(): string | null {
  const configPaths = [
    // Current directory
    path.resolve(process.cwd(), '.llm-arbitrator.json'),
    path.resolve(process.cwd(), '.llm-arbitrator.config.json'),
    
    // Project directory (using ES modules approach for dirname)
    path.resolve(__dirname, '..', '.llm-arbitrator.json'),
    path.resolve(__dirname, '..', '.llm-arbitrator.config.json'),
    
    // User's home directory
    path.resolve(os.homedir(), '.llm-arbitrator', 'config.json'),
    path.resolve(os.homedir(), '.llm-arbitrator.json'),
    
    // Environment variable specified path
    process.env.LLM_ARBITRATOR_CONFIG_PATH ? process.env.LLM_ARBITRATOR_CONFIG_PATH : null,
  ].filter(Boolean) as string[];
  
  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      return configPath;
    }
  }
  
  return null;
}

// Load and merge configuration from all sources
const configFile = findConfigFile();
const fileConfig = configFile ? loadConfigFile(configFile) : {};
const envConfig = getEnvConfig();

// Merge configurations with proper priority
export const config: MpcConfig = deepMerge(
  deepMerge(DEFAULT_CONFIG, fileConfig),
  envConfig
);

// Export for testing/debugging
export const _configSources = {
  default: DEFAULT_CONFIG,
  file: fileConfig,
  fileSource: configFile,
  env: envConfig,
};

// Export convenience accessors
export const serverConfig = config.server;
export const providersConfig = config.providers;
export const modelsConfig = config.models;
export const filesConfig = config.files;
export const debugConfig = config.debug;

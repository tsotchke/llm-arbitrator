# Installation Guide for LLM Arbitrator

This comprehensive installation guide will walk you through setting up the LLM Arbitrator system, configuring it for your needs, and troubleshooting common issues.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation Options](#installation-options)
- [Basic Setup](#basic-setup)
- [Advanced Configuration](#advanced-configuration)
- [Provider Setup](#provider-setup)
  - [LM Studio Setup](#lm-studio-setup)
  - [Ollama Setup](#ollama-setup)
  - [Custom Provider Setup](#custom-provider-setup)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Updating](#updating)
- [Next Steps](#next-steps)

## Prerequisites

Before installing the LLM Arbitrator, ensure your system meets these requirements:

- **Node.js**: Version 16.x or newer
  - [Download from nodejs.org](https://nodejs.org/en/download/)
  - Verify with: `node --version`
- **npm**: Version 8.x or newer (usually bundled with Node.js)
  - Verify with: `npm --version`
- **Git**: For cloning the repository (optional if downloading directly)
  - [Download Git](https://git-scm.com/downloads)
- **Model Backends**: At least one of the following:
  - [LM Studio](https://lmstudio.ai/) (version 0.2.0+)
  - [Ollama](https://ollama.ai/) (version 0.1.14+)

### System Requirements

- **CPU**: Multi-core processor (4+ cores recommended for running models)
- **RAM**: Minimum 8GB, 16GB+ recommended depending on models
- **Disk Space**: 1GB for LLM Arbitrator + space for models
  - LM Studio models: 4GB-50GB per model
  - Ollama models: 4GB-50GB per model

## Installation Options

### Option 1: Clone Repository (Recommended)

```bash
# Clone the repository
git clone https://github.com/tsotchke/llm-arbitrator.git

# Navigate to project directory
cd llm-arbitrator
```

### Option 2: Download Release

1. Go to the [Releases page](https://github.com/tsotchke/llm-arbitrator/releases)
2. Download the latest release archive
3. Extract to your preferred location
4. Open a terminal and navigate to the extracted directory

## Basic Setup

After cloning or downloading, follow these steps for a basic installation:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Test the installation
npm test

# Start the server
npm start
```

The server should now be running and ready to connect to LM Studio and/or Ollama.

## Advanced Configuration

### Configuration File

The LLM Arbitrator uses a configuration file located at `.llm-arbitrator.config.json`. You can create this file manually or let the system generate a default one.

Example configuration:

```json
{
  "server": {
    "name": "llm-arbitrator",
    "version": "1.0.0",
    "logLevel": "info"
  },
  "providers": {
    "lmStudio": {
      "enabled": true,
      "endpoint": "http://127.0.0.1:1234",
      "defaultModel": "deepseek-r1-distill-qwen-32b",
      "timeout": 30000
    },
    "ollama": {
      "enabled": true,
      "endpoint": "http://127.0.0.1:11434",
      "defaultModel": "deepseek-r1:70b",
      "timeout": 30000
    }
  },
  "models": {
    "defaultTemperature": 0.7,
    "defaultMaxTokens": 4000,
    "defaultStopSequences": []
  },
  "files": {
    "maxContextFiles": 10,
    "maxFileSize": 1048576,
    "allowedExtensions": [
      ".js", ".ts", ".jsx", ".tsx", ".py", ".java", ".c", ".cpp", ".h", ".hpp",
      ".cs", ".go", ".rb", ".php", ".html", ".css", ".json", ".md", ".txt",
      ".yml", ".yaml", ".xml", ".sh", ".bat", ".ps1"
    ]
  },
  "debug": {
    "enabled": false,
    "logFilePath": null,
    "verboseLogging": false
  }
}
```

### Configuration Options

| Section | Option | Description | Default |
|---------|--------|-------------|---------|
| `server` | `name` | Server name for identification | `"llm-arbitrator"` |
| | `version` | Server version | `"1.0.0"` |
| | `logLevel` | Logging detail level | `"info"` |
| `providers.lmStudio` | `enabled` | Enable LM Studio provider | `true` |
| | `endpoint` | LM Studio API endpoint | `"http://127.0.0.1:1234"` |
| | `defaultModel` | Default model to use | Model-dependent |
| | `timeout` | Request timeout in milliseconds | `30000` |
| `providers.ollama` | `enabled` | Enable Ollama provider | `true` |
| | `endpoint` | Ollama API endpoint | `"http://127.0.0.1:11434"` |
| | `defaultModel` | Default model to use | Model-dependent |
| | `timeout` | Request timeout in milliseconds | `30000` |
| `models` | `defaultTemperature` | Default temperature for generation | `0.7` |
| | `defaultMaxTokens` | Default max tokens to generate | `4000` |
| | `defaultStopSequences` | Default stop sequences | `[]` |
| `files` | `maxContextFiles` | Max files in context | `10` |
| | `maxFileSize` | Max file size in bytes | `1048576` (1MB) |
| | `allowedExtensions` | Allowed file extensions | See example |
| `debug` | `enabled` | Enable debug mode | `false` |
| | `logFilePath` | Path to log file | `null` |
| | `verboseLogging` | Enable verbose logging | `false` |

## Provider Setup

### LM Studio Setup

1. **Install LM Studio**:
   - Download from [lmstudio.ai](https://lmstudio.ai/)
   - Complete the installation for your OS

2. **Download and Configure Models**:
   - Launch LM Studio
   - Go to the "Models" tab
   - Search for and download models (recommended: DeepSeek R1 or Qwen models)
   
3. **Configure API Server**:
   - Go to "Settings" > "API Server"
   - Enable API server
   - Set Host to `127.0.0.1` and Port to `1234`
   - Click "Save" and "Start Server"
   
4. **Verify API Connection**:
   - Test with: `curl http://127.0.0.1:1234/v1/models`
   - Should return a list of available models

### Ollama Setup

1. **Install Ollama**:
   - Follow instructions at [ollama.ai](https://ollama.ai/)
   - macOS/Linux: `curl -fsSL https://ollama.ai/install.sh | sh`
   - Windows: Download and run the installer

2. **Start Ollama Server**:
   - Run: `ollama serve`
   - This starts the Ollama API server on `127.0.0.1:11434`

3. **Download Models**:
   - In another terminal, run:
   - `ollama pull deepseek-r1:70b` (or another model)
   - Wait for the download to complete

4. **Verify Installation**:
   - Test with: `curl http://127.0.0.1:11434/api/tags`
   - Should return a list of available models

### Custom Provider Setup

To add a custom provider:

1. Create a new provider implementation in `src/providers/custom/`
2. Implement the `ModelProvider` interface
3. Add the provider to `src/providers/ProviderFactory.ts`
4. Rebuild the project: `npm run build`

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed instructions.

## Environment Variables

The following environment variables can override configuration file settings:

| Variable | Description | Example |
|----------|-------------|---------|
| `LM_STUDIO_ENDPOINT` | LM Studio API endpoint | `http://127.0.0.1:1234` |
| `LM_STUDIO_ENABLED` | Enable LM Studio provider | `true` or `false` |
| `LM_STUDIO_DEFAULT_MODEL` | Default LM Studio model | `deepseek-r1-distill-qwen-32b` |
| `OLLAMA_ENDPOINT` | Ollama API endpoint | `http://127.0.0.1:11434` |
| `OLLAMA_ENABLED` | Enable Ollama provider | `true` or `false` |
| `OLLAMA_DEFAULT_MODEL` | Default Ollama model | `deepseek-r1:70b` |
| `LOG_LEVEL` | Logging level | `debug`, `info`, `warn`, or `error` |
| `DEBUG_MODE` | Enable debug mode | `true` or `false` |
| `CONFIG_PATH` | Path to custom config file | `./custom-config.json` |

Setting environment variables:

**Linux/macOS**:
```bash
export LM_STUDIO_ENDPOINT="http://custom-address:port"
export OLLAMA_DEFAULT_MODEL="mistral:7b"
```

**Windows**:
```bash
set LM_STUDIO_ENDPOINT=http://custom-address:port
set OLLAMA_DEFAULT_MODEL=mistral:7b
```

## Troubleshooting

### Common Issues and Solutions

#### Connection Issues

**LM Studio connection failed**:
```
Failed to connect to LM Studio API at http://127.0.0.1:1234
```
- **Solution**: 
  - Ensure LM Studio is running
  - Check that the API server is enabled in Settings
  - Verify that the port is set to 1234 (or update your configuration)
  - Make sure a model is loaded in LM Studio

**Ollama connection failed**:
```
Failed to connect to Ollama API at http://127.0.0.1:11434
```
- **Solution**:
  - Ensure Ollama is running with `ollama serve`
  - Check if any firewall is blocking the connection
  - Try `curl http://127.0.0.1:11434/api/tags` to test directly

#### Model Issues

**Model not found**:
```
Model [model-name] not found. Available models: [list]
```
- **Solution**:
  - Install the missing model in LM Studio or Ollama
  - Check for typos in the model name
  - Use one of the available models listed

**Model loading errors**:
```
Failed to load model: error loading model vocabulary
```
- **Solution**:
  - Restart LM Studio or Ollama
  - Try a different model
  - Check model files for corruption

#### Performance Issues

**Slow response times**:
- **Solution**:
  - Reduce the number of context files
  - Use a smaller/faster model
  - Increase the timeout in configuration
  - Close other resource-intensive applications

### Diagnostic Commands

```bash
# Check LM Studio API status
curl http://127.0.0.1:1234/v1/models

# Check Ollama API status
curl http://127.0.0.1:11434/api/tags

# Run LLM Arbitrator tests
npm test

# Test provider connections specifically
node test-providers.js

# Enable debug logging
export LOG_LEVEL=debug
npm start
```

## Updating

To update to the latest version:

```bash
# Navigate to the project directory
cd llm-arbitrator

# Pull the latest changes (if using Git)
git pull

# Or download and replace files (if not using Git)

# Install any new dependencies
npm install

# Rebuild the project
npm run build

# Restart the server
npm start
```

## Next Steps

After installation:

1. Check out the [Quick Start](README.md#quick-start) guide
2. Explore [Usage Examples](README.md#usage-examples)
3. Learn about the [Architecture](README.md#architecture)
4. Try some example commands with [Ollama](test-ollama.js) and [LM Studio](test-content.js)

For developers:
1. Review the [Contributing Guide](CONTRIBUTING.md)
2. Explore the [API Documentation](docs/WHITEPAPER.md)
3. Learn about [Model Capabilities](docs/DECISION_FLOW.md)

---

If you encounter any issues not covered in this guide, please [open an issue](https://github.com/tsotchke/llm-arbitrator/issues) on GitHub.

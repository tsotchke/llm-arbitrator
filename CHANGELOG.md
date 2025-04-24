# Changelog

All notable changes to the LLM Arbitrator project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-04-23

### Added
- Initial public release
- Multi-provider architecture for coordinating diverse language models
- Capability-based routing system for intelligent model selection
- Smart context management for automatic file discovery
- Chain-of-thought preservation across model boundaries
- Provider implementations:
  - LM Studio provider with DeepSeek R1 and other models
  - Ollama provider for local model deployment
- MCP tools:
  - `enhance_code_generation` for specialized code tasks
  - `verify_solution` for code validation and verification
  - `optimize_prompt` for efficient prompt engineering
  - `get_context_files` for smart context discovery
- Comprehensive documentation including README, CONTRIBUTING guide, and ARCHITECTURE documentation
- Test infrastructure for all components
- CI/CD integration with GitHub Actions

### Changed
- N/A (initial release)

### Deprecated
- N/A (initial release)

### Removed
- N/A (initial release)

### Fixed
- N/A (initial release)

### Security
- Input validation for all MCP tool arguments
- Safe file access mechanisms for context management

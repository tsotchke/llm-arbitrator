# LLM Arbitrator Decision Flow

This document details the decision-making process of the LLM Arbitrator framework, showing how tasks are analyzed, routed, and executed across different models.

## Overview

The LLM Arbitrator makes a series of critical decisions when handling each request:

```
                    +-------------------+
                    |   Request Entry   |
                    +--------+----------+
                             |
                    +--------v----------+
                    |   Task Analysis   |
                    +--------+----------+
                             |
                    +--------v----------+
                    | Provider Selection|
                    +--------+----------+
                             |
                    +--------v----------+
                    | Context Gathering |
                    +--------+----------+
                             |
                    +--------v----------+
                    |   Task Execution  |
                    +--------+----------+
                             |
                    +--------v----------+
                    |Response Processing|
                    +--------+----------+
                             |
                    +--------v----------+
                    |   Result Return   |
                    +-------------------+
```

## Detailed Decision Flow

### 1. Request Analysis Phase

```
+-------------------+     +----------------------+     +------------------------+
| Extract Tool Name |---->| Parse Tool Arguments |---->| Validate Input Schema  |
+-------------------+     +----------------------+     +------------------------+
                                                                |
+------------------------+     +----------------------+     +---v----------------+
| Identify Task Category |<----| Extract Task Domain  |<----| Determine Task Type|
+------------+-----------+     +----------------------+     +--------------------+
             |
             v
+----------------------------+
| Generate Task Requirements |
+----------------------------+
```

During this phase, the Arbitrator:
- Determines which MCP tool was requested
- Validates all required parameters are present
- Extracts the task type (code generation, verification, etc.)
- Identifies the domain of the task (web, quantum, etc.)
- Generates a TaskRequirements object that captures all relevant aspects

### 2. Provider Selection Phase

```
+---------------------------+     +-------------------------+     +------------------------+
| Discover Active Providers |---->| Retrieve Capabilities   |---->| Score Each Provider    |
+---------------------------+     +-------------------------+     +----------+-------------+
                                                                             |
+---------------------------+     +-------------------------+     +----------v------------+
| Select Provider & Model   |<----| Apply User Preferences  |<----| Rank Provider Scores  |
+-------------+-------------+     +-------------------------+     +-----------------------+
              |
              v
+----------------------------+
| Test Provider Availability |
+-------------+--------------+
              |
              v
+----------------------------+
| Fallback Logic (if needed) |
+----------------------------+
```

The provider selection process:
- Discovers all currently available providers
- Retrieves capability profiles of each provider/model
- Scores each provider against the task requirements
- Applies any user preferences or constraints
- Tests the availability of the selected provider
- Implements fallback logic if the preferred provider is unavailable

### 3. Context Management Phase

```
+---------------------------+     +-------------------------+     +------------------------+
| Analyze Provided Files    |---->| Discover Related Files  |---->| Prioritize Context     |
+---------------------------+     +-------------------------+     +----------+-------------+
                                                                             |
+---------------------------+     +-------------------------+     +----------v------------+
| Format Context for Model  |<----| Check Context Limits    |<----| Add Test & Doc Files  |
+-------------+-------------+     +-------------------------+     +-----------------------+
              |
              v
+---------------------------+
| Create Contextual Prompt  |
+---------------------------+
```

The context gathering process:
- Analyzes any files explicitly provided by the user
- Uses the ContextManager to discover related files
- Prioritizes the most relevant context
- Adds relevant test and documentation files
- Ensures context fits within model limits
- Formats context appropriately for the selected model

### 4. Task Execution Phase

```
+---------------------------+     +-------------------------+     +------------------------+
| Format Model Prompt       |---->| Set Model Parameters    |---->| Execute Model Request  |
+---------------------------+     +-------------------------+     +----------+-------------+
                                                                             |
+---------------------------+     +-------------------------+     +----------v------------+
| Process Model Response    |<----| Handle Errors & Retries |<----| Receive Raw Response  |
+-------------+-------------+     +-------------------------+     +-----------------------+
              |
              v
+---------------------------+
| Extract Reasoning Chain   |
+---------------------------+
```

The execution flow:
- Creates a well-formatted prompt for the selected model
- Sets appropriate model parameters (temperature, max tokens, etc.)
- Sends the request to the provider
- Handles any errors or timeouts with retry logic
- Processes the raw model response
- Extracts the chain-of-thought reasoning

### 5. Result Processing Phase

```
+---------------------------+     +-------------------------+     +------------------------+
| Structure Model Output    |---->| Apply Post-Processing   |---->| Format as MCP Response |
+---------------------------+     +-------------------------+     +----------+-------------+
                                                                             |
                                                                  +----------v------------+
                                                                  | Return Final Response |
                                                                  +-----------------------+
```

Final processing:
- Structures the model output according to tool expectations
- Applies any necessary post-processing
- Formats the result as an MCP-compatible response
- Returns the final response to the client

## Multi-Model Coordination Flow

For tasks that involve multiple models:

```
+---------------------------+     +-------------------------+     +------------------------+
| Decompose Complex Task    |---->| Assign Sub-Tasks        |---->| Execute Primary Task   |
+---------------------------+     +-------------------------+     +----------+-------------+
                                                                             |
+---------------------------+     +-------------------------+     +----------v-------------+
| Integrate All Results     |<----| Execute Verification    |<----| Process Primary Result |
+-------------+-------------+     +-------------------------+     +------------------------+
              |
              v
+---------------------------+
| Return Combined Response  |
+---------------------------+
```

The coordination process:
- Breaks down complex tasks into manageable sub-tasks
- Assigns each sub-task to the most appropriate model
- Executes the primary task using the selected model
- Processes and validates the primary result
- May execute verification using a different model
- Integrates results from all models
- Returns a comprehensive, combined response

## Error Handling Flow

```
+---------------------------+     +-------------------------+     +------------------------+
| Detect Error Condition    |---->| Classify Error Type     |---->| Apply Recovery Strategy|
+---------------------------+     +-------------------------+     +----------+-------------+
                                                                             |
+---------------------------+     +-------------------------+     +----------v------------+
| Return Graceful Failure   |<----| Document Error Details  |<----| Attempt Provider Swap |
+---------------------------+     +-------------------------+     +-----------------------+
```

Robust error handling:
- Detects errors at all stages of processing
- Classifies errors (connection, timeout, model, etc.)
- Applies appropriate recovery strategies
- May attempt to swap providers if needed
- Documents detailed error information
- Returns graceful failures with useful information

---

© 2025 tsotchke. All Rights Reserved.

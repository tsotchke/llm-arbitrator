import { LmStudioClient } from '../api/lmStudioClient.js';
import { getDomainTemplate } from '../templates/templateLoader.js';
import { ContextManager } from '../utils/contextManager.js';

/**
 * Enhances code generation by leveraging the DeepSeek R1 model
 * Specializes in providing optimized code solutions for various domains
 */
export class CodeEnhancer {
  private lmStudioClient: LmStudioClient;
  private contextManager: ContextManager;

  constructor(lmStudioClient: LmStudioClient) {
    this.lmStudioClient = lmStudioClient;
    this.contextManager = new ContextManager();
  }
  
  /**
   * Discovers related files for better context
   * @param mainFilePath Path to the main source file
   * @param maxFiles Maximum number of files to include
   * @returns Array of related file paths
   */
  async discoverContextFiles(mainFilePath: string, maxFiles: number = 10): Promise<string[]> {
    try {
      const contextOptions = { maxFiles };
      const contextManager = new ContextManager(contextOptions);
      
      // Get directly related files
      const relatedFiles = await contextManager.getContextFiles(mainFilePath);
      
      // Get test files if available
      const testFiles = await contextManager.findTestFiles(mainFilePath);
      
      // Get documentation files if available
      const docFiles = await contextManager.findDocumentationFiles(mainFilePath);
      
      // Combine all unique files
      const allFiles = [...new Set([...relatedFiles, ...testFiles, ...docFiles])];
      
      // Limit to maxFiles
      return allFiles.slice(0, maxFiles);
    } catch (error) {
      console.error(`Error discovering context files for ${mainFilePath}:`, error);
      return [];
    }
  }

  /**
   * Enhances code generation by leveraging R1 model for specialized domains
   * @param taskDescription Description of the coding task to be performed
   * @param projectContext Optional context about the project
   * @param language Optional programming language or framework
   * @param domain Optional specialized domain (e.g., quantum, functional, web)
   * @param files Optional array of file paths to include as context
   * @param model Optional model to use (defaults to the configured model in LmStudioClient)
   * @param autoDiscover Optional flag to auto-discover related files (defaults to true)
   * @returns Enhanced code solution with additional context and explanations
   */
  async enhance(
    taskDescription: string,
    projectContext: string = '',
    language: string = '',
    domain: string = '',
    files: string[] = [],
    model: string = '',
    autoDiscover: boolean = true
  ): Promise<string> {
    // Get domain-specific template if available
    const template = getDomainTemplate(domain, 'code-generation');
    
    // Auto-discover related files if requested and a target file is available
    let enhancedFiles = [...files];
    
    if (autoDiscover && files.length > 0) {
      try {
        // Use the first file as the starting point for discovery
        const mainFile = files[0];
        const discoveredFiles = await this.discoverContextFiles(mainFile, 5);
        
        // Add discovered files that aren't already included
        for (const file of discoveredFiles) {
          if (!enhancedFiles.includes(file)) {
            enhancedFiles.push(file);
          }
        }
        
        console.log(`Auto-discovered ${discoveredFiles.length} additional context files`);
      } catch (error) {
        console.error('Error during auto-discovery of context files:', error);
      }
    }
    
    // Construct the prompt for the R1 model
    const prompt = this.constructCodeGenerationPrompt(
      taskDescription,
      projectContext,
      language,
      domain,
      template
    );
    
    try {
      // Generate code solution from R1 model
      let promptData: string | { text: string; files?: string[] };
      
      if (enhancedFiles && enhancedFiles.length > 0) {
        // If files are provided, use multimodal input
        promptData = {
          text: prompt,
          files: enhancedFiles
        };
      } else {
        // Otherwise use standard text prompt
        promptData = prompt;
      }
      
      const enhancedCode = await this.lmStudioClient.completePrompt(promptData, {
        temperature: 0.2, // Lower temperature for more deterministic code generation
        max_tokens: 4000,
        system_message: this.getCodeGenerationSystemMessage(domain, language),
        model: model || undefined
      });
      
      // Post-process the response to format it appropriately for Claude
      return this.postProcessCodeResponse(enhancedCode, language);
    } catch (error) {
      console.error('Error enhancing code generation:', error);
      return `Error enhancing code: ${error}. Please try again with a more specific task description.`;
    }
  }

  /**
   * Constructs a prompt for code generation based on the task and context
   */
  private constructCodeGenerationPrompt(
    taskDescription: string,
    projectContext: string,
    language: string,
    domain: string,
    template: string | null
  ): string {
    if (template) {
      // Use the template with placeholders replaced
      return template
        .replace('{{TASK_DESCRIPTION}}', taskDescription)
        .replace('{{PROJECT_CONTEXT}}', projectContext)
        .replace('{{LANGUAGE}}', language)
        .replace('{{DOMAIN}}', domain);
    }

    // Fallback to a generic prompt structure
    let prompt = `# Code Generation Task\n\n`;
    prompt += `## Task Description\n${taskDescription}\n\n`;
    
    if (projectContext) {
      prompt += `## Project Context\n${projectContext}\n\n`;
    }
    
    if (language) {
      prompt += `## Programming Language\n${language}\n\n`;
    }
    
    if (domain) {
      prompt += `## Specialized Domain\n${domain}\n\n`;
    }
    
    prompt += `\nPlease provide a high-quality, optimized code solution for this task.
Include explanations of key components and approach.
Your solution should be comprehensive, efficient, and follow best practices.
Structure your response to be easily understood by Claude, another AI assistant.
`;

    return prompt;
  }

  /**
   * Returns an appropriate system message based on domain and language
   */
  private getCodeGenerationSystemMessage(domain: string, language: string): string {
    let systemMessage = `You are an expert code generator specializing in producing high-quality, optimized solutions.`;
    
    if (domain === 'quantum') {
      systemMessage += ` You excel at quantum computing code that correctly implements quantum algorithms and circuits.`;
    } else if (domain === 'functional') {
      systemMessage += ` You excel at functional programming with immutable data structures and pure functions.`;
    }
    
    if (language) {
      systemMessage += ` You are particularly skilled in ${language} programming.`;
    }
    
    systemMessage += `
    
Your response should have a clear structure with three main sections:

1. <think>...</think> - Begin with a detailed thinking process that explains your approach, alternatives considered, tradeoffs, and important design decisions. This thought process is valuable for understanding your reasoning.

2. Implementation - The actual code solution, properly formatted with code blocks and clear function/class documentation.

3. Key Insights - After the implementation, highlight 3-5 key insights about your solution, such as performance characteristics, important design patterns used, or potential extensions.

Provide detailed solutions with clear explanations that another AI assistant (Claude) can easily understand and present to a user. Focus on correctness, efficiency, and best practices. Include essential code comments but avoid excessive commenting.`;

    return systemMessage;
  }

  /**
   * Post-processes the code response to ensure it's formatted optimally for Claude
   */
  private postProcessCodeResponse(response: string, language: string): string {
    // Extract thinking process if present
    let thinking = '';
    let implementation = response;
    const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
    
    if (thinkMatch) {
      thinking = thinkMatch[1].trim();
      implementation = response.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    }
    
    // Find key insights section if present
    let keyInsights = '';
    const insightsMatch = implementation.match(/(?:## |# )(?:Key Insights|Important Considerations|Design Decisions)([\s\S]*?)(?=(?:## |# |$))/i);
    
    if (insightsMatch) {
      keyInsights = insightsMatch[0];
      implementation = implementation.replace(insightsMatch[0], '').trim();
    }
    
    // Ensure code blocks are properly formatted with language tags
    if (!implementation.includes("```") && language) {
      const codeRegex = /^([\s\S]+)$/;
      implementation = implementation.replace(codeRegex, (_, code) => {
        return `\`\`\`${language}\n${code}\n\`\`\``;
      });
    }
    
    // Structure the response with clear sections
    let processed = `# R1-Enhanced Code Solution\n\n`;
    
    // Add thinking section if present
    if (thinking) {
      processed += `## R1 Reasoning Process\n\n${thinking}\n\n`;
    }
    
    // Add implementation
    processed += `## Implementation\n\n${implementation}\n\n`;
    
    // Add key insights if present or detected
    if (keyInsights) {
      processed += keyInsights;
    }
    
    // Add guidance for Claude
    processed += `\n\n## Notes for Claude\n
The above solution was generated by DeepSeek R1 model to provide optimal code for the requested task.
The "R1 Reasoning Process" section reveals the model's thought process and should help you understand the rationale behind design decisions.
You can present this solution to the user, or enhance it further if you identify any improvements.
If you need to modify the code, please make sure to maintain the core solution logic.`;

    return processed;
  }
}

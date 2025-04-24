import { LmStudioClient } from '../api/lmStudioClient.js';
import { getDomainTemplate } from '../templates/templateLoader.js';

/**
 * Verifies code solutions using the DeepSeek R1 model
 * Analyzes code for correctness, performance, and best practices
 */
export class VerificationEnhancer {
  private lmStudioClient: LmStudioClient;

  constructor(lmStudioClient: LmStudioClient) {
    this.lmStudioClient = lmStudioClient;
  }

  /**
   * Verifies a code solution using the R1 model
   * @param code Code solution to verify
   * @param language Programming language of the code
   * @param taskDescription Optional description of what the code should do
   * @param files Optional array of file paths to include as additional context
   * @param model Optional model to use (defaults to the configured model in LmStudioClient)
   * @returns Verification results and analysis
   */
  async verify(
    code: string,
    language: string,
    taskDescription: string = '',
    files: string[] = [],
    model: string = ''
  ): Promise<string> {
    // Determine the domain based on language or other heuristics
    const domain = this.inferDomainFromCode(code, language);
    
    // Get domain-specific template if available
    const template = getDomainTemplate(domain, 'verification');
    
    // Construct the prompt for the R1 model
    const prompt = this.constructVerificationPrompt(
      code,
      language,
      taskDescription,
      domain,
      template
    );
    
    try {
      // Generate verification analysis from R1 model
      let promptData: string | { text: string; files?: string[] };
      
      if (files && files.length > 0) {
        // If files are provided, use multimodal input
        promptData = {
          text: prompt,
          files: files
        };
      } else {
        // Otherwise use standard text prompt
        promptData = prompt;
      }
      
      const verificationResult = await this.lmStudioClient.completePrompt(promptData, {
        temperature: 0.2, // Lower temperature for more deterministic analysis
        max_tokens: 4000,
        system_message: this.getVerificationSystemMessage(domain, language),
        model: model || undefined
      });
      
      // Post-process the response to format it appropriately for Claude
      return this.postProcessVerificationResponse(verificationResult);
    } catch (error) {
      console.error('Error verifying code:', error);
      return `Error verifying code: ${error}. Please check the code manually.`;
    }
  }

  /**
   * Attempts to infer the domain based on code content and language
   */
  private inferDomainFromCode(code: string, language: string): string {
    // Check for quantum computing libraries or patterns
    if (
      code.includes('qiskit') ||
      code.includes('cirq') ||
      code.includes('qubit') ||
      code.includes('quantum') ||
      language.toLowerCase().includes('qiskit') ||
      language.toLowerCase().includes('q#')
    ) {
      return 'quantum';
    }
    
    // Check for functional programming patterns
    if (
      (language.toLowerCase() === 'haskell' || 
       language.toLowerCase() === 'ocaml' || 
       language.toLowerCase() === 'elm' ||
       language.toLowerCase() === 'f#') ||
      (code.includes('=>') && !code.includes('this.') && !code.includes('class ')) ||
      (code.match(/(?:fold|map|filter|reduce|pure|compose|curry)/g)?.length || 0 > 3)
    ) {
      return 'functional';
    }
    
    // Default to general
    return 'general';
  }

  /**
   * Constructs a prompt for code verification based on the code and context
   */
  private constructVerificationPrompt(
    code: string,
    language: string,
    taskDescription: string,
    domain: string,
    template: string | null
  ): string {
    if (template) {
      // Use the template with placeholders replaced
      return template
        .replace('{{CODE}}', code)
        .replace('{{LANGUAGE}}', language)
        .replace('{{TASK_DESCRIPTION}}', taskDescription);
    }

    // Fallback to a generic prompt structure
    let prompt = `# Code Verification Task\n\n`;
    
    prompt += `## Code to Verify\n\`\`\`${language}\n${code}\n\`\`\`\n\n`;
    
    if (taskDescription) {
      prompt += `## Task Description\n${taskDescription}\n\n`;
    }
    
    if (domain !== 'general') {
      prompt += `## Specialized Domain\n${domain}\n\n`;
    }
    
    prompt += `\nPlease analyze this code and provide:
1. Verification of correctness (will it compile/run properly?)
2. Identification of bugs, errors, or edge cases
3. Performance analysis
4. Suggestions for improvements
5. Assessment of code quality and adherence to best practices

Your analysis should be thorough but focused on the most important issues.
`;

    return prompt;
  }

  /**
   * Returns an appropriate system message based on domain and language
   */
  private getVerificationSystemMessage(domain: string, language: string): string {
    let systemMessage = `You are an expert code reviewer specializing in ${language} programming.`;
    
    if (domain === 'quantum') {
      systemMessage += ` You have deep expertise in quantum computing and can identify issues specific to quantum algorithms and circuits.`;
    } else if (domain === 'functional') {
      systemMessage += ` You have deep expertise in functional programming and can identify issues related to immutability, side effects, and functional patterns.`;
    }
    
    systemMessage += `
    
Your code review should have a clear structure with distinct sections:

1. <think>...</think> - Begin with your detailed analysis process, showing how you systematically evaluate the code, spot patterns, and identify potential issues. This thought process is valuable for understanding your reasoning.

2. Analysis sections:
   - Correctness: Does the code work as expected? Are there any bugs or edge cases not handled?
   - Performance: Analyze algorithmic complexity and performance characteristics
   - Code Structure: Evaluate organization, modularity, and readability
   - Best Practices: Identify areas where the code follows or violates language best practices
   
3. Summary of Key Findings: 3-5 most important points about the code

4. Suggested Improvements: Concrete, specific changes that would address the issues you found

Focus on critical issues first, followed by optimization suggestions. Be specific about problems and provide concrete solutions with code examples where helpful.`;

    return systemMessage;
  }

  /**
   * Post-processes the verification response to format it for Claude
   */
  private postProcessVerificationResponse(response: string): string {
    // Extract thinking process if present
    let thinking = '';
    let analysis = response;
    const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
    
    if (thinkMatch) {
      thinking = thinkMatch[1].trim();
      analysis = response.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    }
    
    // Find key findings section if present
    let keyFindings = '';
    const findingsMatch = analysis.match(/(?:## |# )(?:Key Findings|Summary|Important Issues|Critical Problems)([\s\S]*?)(?=(?:## |# |$))/i);
    
    if (findingsMatch) {
      keyFindings = findingsMatch[0];
    }
    
    // Find suggested improvements if present
    let improvements = '';
    const improvementsMatch = analysis.match(/(?:## |# )(?:Suggested Improvements|Recommendations|Fixes|Solutions)([\s\S]*?)(?=(?:## |# |$))/i);
    
    if (improvementsMatch) {
      improvements = improvementsMatch[0];
    }
    
    // Structure the response with clear sections
    let processed = `# R1 Code Verification Analysis\n\n`;
    
    // Add thinking section if present
    if (thinking) {
      processed += `## Review Process and Reasoning\n\n${thinking}\n\n`;
    }
    
    // Add main analysis content
    processed += `## Detailed Analysis\n\n${analysis}\n\n`;
    
    // Highlight key sections if they weren't already extracted
    if (!keyFindings && !improvements) {
      processed += `## Key Takeaways\n\nThe most important findings from this analysis are:\n\n`;
      processed += `1. [First key finding extracted from analysis]\n`;
      processed += `2. [Second key finding extracted from analysis]\n`;
      processed += `3. [Third key finding extracted from analysis]\n\n`;
    }
    
    // Add guidance for Claude
    processed += `\n\n## Notes for Claude\n
The above analysis was generated by the DeepSeek R1 model to verify the code solution.
The "Review Process and Reasoning" section reveals the model's analytical approach and should help you understand how issues were identified.
You can use these insights to explain any problems to the user or to suggest specific improvements.
If the analysis identified critical problems, consider addressing them before presenting the solution.`;

    return processed;
  }
}

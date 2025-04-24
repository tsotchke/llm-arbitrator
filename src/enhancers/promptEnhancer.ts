import { LmStudioClient } from '../api/lmStudioClient.js';
import { getDomainTemplate } from '../templates/templateLoader.js';

/**
 * Optimizes user prompts to enhance Claude's performance
 * Leverages specialized language models to restructure and enhance prompts for more efficient and accurate responses
 */
export class PromptEnhancer {
  private lmStudioClient: LmStudioClient;

  constructor(lmStudioClient: LmStudioClient) {
    this.lmStudioClient = lmStudioClient;
  }

  /**
   * Optimizes a user prompt for more efficient processing by Claude
   * @param originalPrompt Original user prompt
   * @param domain Optional specialized domain (e.g., quantum, functional, web)
   * @param files Optional array of file paths to include as context
   * @param model Optional model to use (defaults to the configured model in LmStudioClient)
   * @returns Optimized prompt structure
   */
  async optimize(
    originalPrompt: string, 
    domain: string = '',
    files: string[] = [],
    model: string = ''
  ): Promise<string> {
    // Get domain-specific template if available
    const template = getDomainTemplate(domain, 'prompt-optimization');
    
    // Construct the prompt for the selected model
    const prompt = this.constructPromptOptimizationRequest(
      originalPrompt,
      domain,
      template
    );
    
    try {
      // Generate optimized prompt from the selected model
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
      
      const optimizedPrompt = await this.lmStudioClient.completePrompt(promptData, {
        temperature: 0.3,
        max_tokens: 4000,
        system_message: this.getPromptOptimizationSystemMessage(domain),
        model: model || undefined
      });
      
      // Post-process the response to format it appropriately for Claude
      return this.postProcessPromptResponse(optimizedPrompt);
    } catch (error) {
      console.error('Error optimizing prompt:', error);
      return `Error optimizing prompt: ${error}. Proceeding with original prompt.`;
    }
  }

  /**
   * Constructs a request for prompt optimization based on the original prompt and domain
   */
  private constructPromptOptimizationRequest(
    originalPrompt: string,
    domain: string,
    template: string | null
  ): string {
    if (template) {
      // Use the template with placeholders replaced
      return template.replace('{{ORIGINAL_PROMPT}}', originalPrompt);
    }

    // Fallback to a generic prompt structure
    let prompt = `# Prompt Optimization Request\n\n`;
    prompt += `## Original Prompt\n"""${originalPrompt}"""\n\n`;
    
    if (domain) {
      prompt += `## Specialized Domain\n${domain}\n\n`;
    }
    
    prompt += `\nPlease help me optimize this prompt for Claude to:
1. Improve clarity and structure
2. Add necessary context and constraints
3. Specify requirements more precisely
4. Structure the request for optimal processing
5. Include any domain-specific terminology or frameworks that should be used

I need the restructured prompt to be comprehensive yet efficient in token usage.
`;

    return prompt;
  }

  /**
   * Returns an appropriate system message based on the domain
   */
  private getPromptOptimizationSystemMessage(domain: string): string {
    let systemMessage = `You are an expert prompt engineer specializing in optimizing prompts for AI assistants.`;
    
    if (domain === 'quantum') {
      systemMessage += ` You have deep knowledge of quantum computing concepts and terminology.`;
    } else if (domain === 'functional') {
      systemMessage += ` You have deep knowledge of functional programming paradigms and best practices.`;
    }
    
    systemMessage += `
    
Your prompt optimization should have a clear structure with these sections:

1. <think>...</think> - Begin with your detailed analysis of the original prompt, identifying its strengths, weaknesses, ambiguities, and opportunities for improvement. This reasoning process helps others understand your optimization approach.

2. Optimized Prompt - The clearly formatted, improved prompt that addresses the issues you identified.

3. Optimization Rationale - Brief explanation of the 3-5 key improvements you made and why they will make the prompt more effective.

Focus on improving clarity, adding necessary context, specifying requirements more precisely, and optimizing for token efficiency. Your optimized prompts should lead to more accurate, relevant, and concise responses from Claude.`;

    return systemMessage;
  }

  /**
   * Post-processes the optimized prompt response to format it for Claude
   */
  private postProcessPromptResponse(response: string): string {
    // Extract thinking process if present
    let thinking = '';
    let optimizedContent = response;
    const thinkMatch = response.match(/<think>([\s\S]*?)<\/think>/);
    
    if (thinkMatch) {
      thinking = thinkMatch[1].trim();
      optimizedContent = response.replace(/<think>[\s\S]*?<\/think>/, '').trim();
    }
    
    // Try to extract just the optimized prompt if there are explanations
    let optimizedPrompt = '';
    let rationale = '';
    
    // First look for standard patterns in the response
    const promptPattern = /(?:(?:Here'?s?|is) the optimized prompt:|I've restructured the prompt:|OPTIMIZED PROMPT:|## Optimized Prompt)([\s\S]+?)(?:(?:\n\n|$)(?:Explanation:|Note:|Why this works:|Rationale:|## |----))/i;
    const promptMatch = optimizedContent.match(promptPattern);
    
    if (promptMatch && promptMatch[1]) {
      // Extract just the optimized prompt part
      optimizedPrompt = promptMatch[1].trim();
      
      // Look for rationale section
      const rationalePattern = /(?:## |# )(?:Optimization Rationale|Explanation|Why This Works|Key Improvements)([\s\S]*?)(?=(?:## |# |$))/i;
      const rationaleMatch = optimizedContent.match(rationalePattern);
      
      if (rationaleMatch) {
        rationale = rationaleMatch[0].trim();
      }
    } else {
      // If we can't cleanly extract, use the whole content minus some headers
      optimizedPrompt = optimizedContent.replace(/^(?:(?:Here is|Here's) (?:the|an|my) optimized prompt:?\s*|OPTIMIZED PROMPT:?\s*)/i, '');
    }
    
    // Structure the response with clear sections
    let processed = `# Optimized Prompt\n\n`;
    
    // Add thinking section if present
    if (thinking) {
      processed += `## Prompt Engineering Process\n\n${thinking}\n\n`;
    }
    
    // Add the optimized prompt
    processed += `## Optimized Prompt\n\n${optimizedPrompt}\n\n`;
    
    // Add rationale if found
    if (rationale) {
      processed += `${rationale}\n\n`;
    } else if (thinking) {
      // Generate a placeholder for the rationale based on thinking
      processed += `## Key Improvements\n\n`;
      processed += `Based on the analysis, this optimized prompt improves the original by:\n\n`;
      processed += `1. Adding more specific context and requirements\n`;
      processed += `2. Improving structure and organization\n`;
      processed += `3. Clarifying expectations and deliverables\n\n`;
    }
    
    // Add guidance for Claude
    processed += `## Notes for Claude\n
The above is an optimized version of the original user prompt, enhanced by a specialized language model.
The "Prompt Engineering Process" section reveals the analysis behind the improvements and should help you understand why certain changes were made.
This structure should help you provide a more precise and efficient response to the user's request.
You can use the optimized prompt as your primary guidance for responding to the user.`;

    return processed;
  }
}

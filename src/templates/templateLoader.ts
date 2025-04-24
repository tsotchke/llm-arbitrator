/**
 * Template loader for domain-specific prompts and responses
 * Manages loading and retrieving templates for different domains and use cases
 */

// Template categories
type TemplateCategory = 'code-generation' | 'verification' | 'prompt-optimization';

// Template mapping structure
interface TemplateMap {
  [domain: string]: {
    [category: string]: string;
  };
}

// Global template store
const templates: TemplateMap = {};

/**
 * Loads predefined templates for various domains and categories
 * Called during server initialization
 */
export function loadTemplates(): void {
  // Quantum Computing templates
  templates.quantum = {
    'code-generation': `# Quantum Computing Code Generation Task

## Task Description
{{TASK_DESCRIPTION}}

## Project Context
{{PROJECT_CONTEXT}}

## Programming Language/Framework
{{LANGUAGE}}

Please provide a high-quality quantum computing solution for this task.
Your solution should:
1. Correctly implement quantum circuits and algorithms
2. Follow quantum computing best practices
3. Include proper qubit management and measurement
4. Be optimized for the target quantum framework
5. Include explanations of the quantum approach used

Structure your code to be compilable and include comments explaining the quantum operations.
`,

    'verification': `# Quantum Code Verification Task

## Code to Verify
\`\`\`{{LANGUAGE}}
{{CODE}}
\`\`\`

## Task Description
{{TASK_DESCRIPTION}}

Please analyze this quantum computing code and provide:
1. Verification of correctness for quantum operations
2. Identification of any quantum-specific issues (decoherence, measurement, etc.)
3. Performance analysis for quantum circuit depth and operations
4. Suggestions for quantum-specific optimizations
5. Assessment of whether the code achieves the intended quantum task

Your analysis should focus on quantum computing best practices and potential issues.
`,

    'prompt-optimization': `I need to optimize a prompt about quantum computing for Claude.
The original prompt is:

"""
{{ORIGINAL_PROMPT}}
"""

Please help me restructure this prompt to:
1. Include proper quantum computing terminology
2. Specify the quantum framework/language requirements clearly
3. Structure the request in a way that will generate correct quantum code
4. Specify any quantum-specific constraints or requirements
5. Request appropriate explanations of quantum concepts
`
  };

  // Functional Programming templates
  templates.functional = {
    'code-generation': `# Functional Programming Code Generation Task

## Task Description
{{TASK_DESCRIPTION}}

## Project Context
{{PROJECT_CONTEXT}}

## Programming Language
{{LANGUAGE}}

Please provide a pure functional programming solution for this task.
Your solution should:
1. Use immutable data structures
2. Avoid side effects
3. Use higher-order functions where appropriate
4. Apply functional composition
5. Include appropriate type signatures

Structure your code to be both correct and elegant, showcasing functional programming paradigms.
`,

    'verification': `# Functional Code Verification Task

## Code to Verify
\`\`\`{{LANGUAGE}}
{{CODE}}
\`\`\`

## Task Description
{{TASK_DESCRIPTION}}

Please analyze this functional code and provide:
1. Verification that it follows functional programming principles
2. Identification of any side effects or mutable state
3. Assessment of function purity
4. Suggestions for improving functional composition
5. Analysis of type correctness (if applicable)

Your analysis should focus on functional programming best practices.
`,

    'prompt-optimization': `I need to optimize a prompt about functional programming for Claude.
The original prompt is:

"""
{{ORIGINAL_PROMPT}}
"""

Please help me restructure this prompt to:
1. Properly emphasize functional programming paradigms
2. Specify immutability and side-effect constraints
3. Request appropriate functional patterns
4. Structure the request for clarity
5. Ask for type signatures if appropriate
`
  };

  // General programming templates
  templates.general = {
    'code-generation': `# Code Generation Task

## Task Description
{{TASK_DESCRIPTION}}

## Project Context
{{PROJECT_CONTEXT}}

## Programming Language
{{LANGUAGE}}

Please provide a high-quality, optimized code solution for this task.
Your solution should:
1. Be correct and efficient
2. Follow best practices for {{LANGUAGE}}
3. Use appropriate data structures and algorithms
4. Include proper error handling
5. Be well-structured and maintainable

Include explanations of your approach and key design decisions.
`,

    'verification': `# Code Verification Task

## Code to Verify
\`\`\`{{LANGUAGE}}
{{CODE}}
\`\`\`

## Task Description
{{TASK_DESCRIPTION}}

Please analyze this code and provide:
1. Verification of correctness
2. Performance analysis
3. Identification of potential bugs or edge cases
4. Suggestions for improvements
5. Assessment of code quality and maintainability

Your analysis should focus on programming best practices for {{LANGUAGE}}.
`,

    'prompt-optimization': `I need to optimize a programming prompt for Claude.
The original prompt is:

"""
{{ORIGINAL_PROMPT}}
"""

Please help me restructure this prompt to:
1. Clearly specify the requirements
2. Include relevant context
3. Specify the programming language/framework precisely
4. Structure the request for clarity
5. Ask for appropriate explanations and documentation
`
  };
}

/**
 * Gets a template for a specific domain and category
 * @param domain Domain to get template for (e.g., 'quantum', 'functional')
 * @param category Category of template (e.g., 'code-generation', 'verification')
 * @returns Template string or null if not found
 */
export function getDomainTemplate(
  domain: string,
  category: TemplateCategory
): string | null {
  // If domain is not specified or doesn't exist, use general templates
  const domainKey = domain && templates[domain] ? domain : 'general';
  
  // Return the requested template or null if not found
  return templates[domainKey]?.[category] || null;
}

/**
 * Checks if a template exists for a specific domain and category
 * @param domain Domain to check
 * @param category Category to check
 * @returns True if template exists, false otherwise
 */
export function hasTemplate(domain: string, category: string): boolean {
  return Boolean(templates[domain]?.[category]);
}

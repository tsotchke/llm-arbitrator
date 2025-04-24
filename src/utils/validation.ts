/**
 * Type guards for validating MCP tool arguments
 */

// Type definitions for tool arguments
export interface EnhanceCodeGenerationArgs {
  taskDescription: string;
  projectContext?: string;
  language?: string;
  domain?: string;
  files?: string[];
  model?: string;
}

export interface VerifySolutionArgs {
  code: string;
  language: string;
  taskDescription?: string;
  files?: string[];
  model?: string;
}

export interface OptimizePromptArgs {
  originalPrompt: string;
  domain?: string;
  files?: string[];
  model?: string;
}

export interface GetContextFilesArgs {
  filePath: string;
  maxFiles?: number;
  includeTests?: boolean;
  includeDocs?: boolean;
}

/**
 * Validates arguments for the enhance_code_generation tool
 */
export function isValidEnhanceCodeGenerationArgs(
  args: Record<string, unknown> | undefined
): args is EnhanceCodeGenerationArgs & Record<string, unknown> {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof args.taskDescription === 'string' &&
    (args.projectContext === undefined || typeof args.projectContext === 'string') &&
    (args.language === undefined || typeof args.language === 'string') &&
    (args.domain === undefined || typeof args.domain === 'string') &&
    (args.files === undefined || (Array.isArray(args.files) && 
      args.files.every((file: unknown) => typeof file === 'string'))) &&
    (args.model === undefined || typeof args.model === 'string')
  );
}

/**
 * Validates arguments for the verify_solution tool
 */
export function isValidVerifySolutionArgs(
  args: Record<string, unknown> | undefined
): args is VerifySolutionArgs & Record<string, unknown> {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof args.code === 'string' &&
    typeof args.language === 'string' &&
    (args.taskDescription === undefined || typeof args.taskDescription === 'string') &&
    (args.files === undefined || (Array.isArray(args.files) && 
      args.files.every((file: unknown) => typeof file === 'string'))) &&
    (args.model === undefined || typeof args.model === 'string')
  );
}

/**
 * Validates arguments for the optimize_prompt tool
 */
export function isValidOptimizePromptArgs(
  args: Record<string, unknown> | undefined
): args is OptimizePromptArgs & Record<string, unknown> {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof args.originalPrompt === 'string' &&
    (args.domain === undefined || typeof args.domain === 'string') &&
    (args.files === undefined || (Array.isArray(args.files) && 
      args.files.every((file: unknown) => typeof file === 'string'))) &&
    (args.model === undefined || typeof args.model === 'string')
  );
}

/**
 * Validates arguments for the get_context_files tool
 */
export function isValidGetContextFilesArgs(
  args: Record<string, unknown> | undefined
): args is GetContextFilesArgs & Record<string, unknown> {
  return (
    typeof args === 'object' &&
    args !== null &&
    typeof args.filePath === 'string' &&
    (args.maxFiles === undefined || typeof args.maxFiles === 'number') &&
    (args.includeTests === undefined || typeof args.includeTests === 'boolean') &&
    (args.includeDocs === undefined || typeof args.includeDocs === 'boolean')
  );
}

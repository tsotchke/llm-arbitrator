/**
 * MCP Protocol Adapter
 * This file adds support for both namespaced and non-namespaced MCP methods
 * to ensure compatibility with different versions of the MCP protocol.
 */

import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  McpError,
  ErrorCode,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';

type LogFn = (level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) => void;

/**
 * Adapts a server to support both namespaced (mcp.X) and non-namespaced methods
 * to ensure broader compatibility with different MCP clients
 */
export function adaptServerForNamespacedMethods(server: Server, log: LogFn): void {
  // Get the original dispatcher to wrap it
  let originalDispatch = (server as any)._dispatcher;
  
  // Try alternative property names if not found
  if (!originalDispatch) {
    if ((server as any).dispatcher) {
      originalDispatch = (server as any).dispatcher;
    } else if ((server as any).dispatch) {
      originalDispatch = (server as any).dispatch;
    } else if (typeof (server as any).handleRequest === 'function') {
      originalDispatch = (server as any).handleRequest;
    }
  }
  
  if (!originalDispatch) {
    log('warn', 'Could not find server dispatcher to adapt for namespaced methods');
    return;
  }
  
  log('debug', 'Found dispatcher, adapting for namespaced methods');
  
  // Wrap the dispatcher to handle different method names
  (server as any)._dispatcher = async (message: any) => {
    try {
      // Check if the message has a method with mcp. prefix
      const method = message.method || '';
      
  // Log raw message for debugging
  log('debug', `Received RPC message with method: ${method}`, message);
  
  // Handle both namespaced and non-namespaced method names
  if (method === 'mcp.listTools' || method === 'tools/list' || method === 'list_tools') {
    // Rewrite to the method name expected by the SDK
    const adaptedMessage = {
      ...message,
      method: 'tools/list',  // Method name expected by the SDK
    };
    
    log('debug', `Adapted "${method}" to "tools/list" for SDK compatibility`);
    return await originalDispatch(adaptedMessage);
  } 
  else if (method === 'mcp.callTool' || method === 'tools/call' || method === 'call_tool') {
    // Rewrite to the method name expected by the SDK
    const adaptedMessage = {
      ...message,
      method: 'tools/call',  // Method name expected by the SDK
    };
    
    log('debug', `Adapted "${method}" to "tools/call" for SDK compatibility`);
    return await originalDispatch(adaptedMessage);
  }
      
      // Pass through other methods unchanged
      return await originalDispatch(message);
    } catch (error) {
      log('error', 'Error in adapted method dispatcher:', error);
      
      // Return a proper JSON-RPC error response
      return {
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: ErrorCode.InternalError,
          message: `Error processing request: ${error}`,
        },
      };
    }
  };
  
  log('info', 'Server adapted to support namespaced MCP methods');
}

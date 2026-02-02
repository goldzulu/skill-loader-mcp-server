#!/usr/bin/env node
/**
 * CLI Entry Point for Skill Loader MCP Server
 * 
 * Starts the MCP server with stdio transport
 */

import { SkillLoaderMCPServer } from './index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function main() {
  try {
    const server = new SkillLoaderMCPServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);

    // Log to stderr (stdout is used for MCP protocol)
    console.error('Skill Loader MCP Server started');
    console.error('Version: 1.0.0');
    console.error('Listening on stdio...');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.error('\nShutting down gracefully...');
      await server.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.error('\nShutting down gracefully...');
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});

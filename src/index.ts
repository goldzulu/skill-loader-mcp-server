/**
 * Skill Loader MCP Server
 * 
 * Main server class implementing the Model Context Protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Import tool handlers
import { listSkillsHandler } from './tools/list-skills.js';
import { searchSkillsHandler } from './tools/search-skills.js';
import { getLeaderboardHandler } from './tools/get-leaderboard.js';
import { fetchSkillHandler } from './tools/fetch-skill.js';
import { validateSkillHandler } from './tools/validate-skill.js';
import { convertToSteeringHandler } from './tools/convert-to-steering.js';
import { convertToPowerHandler } from './tools/convert-to-power.js';
import { importSkillHandler } from './tools/import-skill.js';

/**
 * Skill Loader MCP Server
 * 
 * Exposes 9 tools for discovering, fetching, validating, and converting Claude skills
 */
export class SkillLoaderMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'skill-loader',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  /**
   * Set up request handlers for the MCP server
   */
  private setupHandlers(): void {
    // Handle list_tools request
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'list_skills',
          description: 'List all available skills from skills.sh with pagination',
          inputSchema: {
            type: 'object',
            properties: {
              page: {
                type: 'number',
                description: 'Page number (default: 1)',
              },
              pageSize: {
                type: 'number',
                description: 'Results per page (default: 50, max: 100)',
              },
            },
          },
        },
        {
          name: 'search_skills',
          description: 'Search for skills by keyword',
          inputSchema: {
            type: 'object',
            properties: {
              query: {
                type: 'string',
                description: 'Search query (required)',
              },
              limit: {
                type: 'number',
                description: 'Max results (default: 20, max: 50)',
              },
            },
            required: ['query'],
          },
        },
        {
          name: 'get_leaderboard',
          description: 'Get trending or top-installed skills',
          inputSchema: {
            type: 'object',
            properties: {
              timeframe: {
                type: 'string',
                enum: ['all', '24h'],
                description: 'Timeframe: "all" or "24h" (default: "all")',
              },
              limit: {
                type: 'number',
                description: 'Max results (default: 20, max: 50)',
              },
            },
          },
        },
        {
          name: 'fetch_skill',
          description: 'Fetch raw skill content from GitHub',
          inputSchema: {
            type: 'object',
            properties: {
              identifier: {
                type: 'string',
                description: 'Skill name or owner/repo format (required)',
              },
            },
            required: ['identifier'],
          },
        },
        {
          name: 'validate_skill',
          description: 'Validate skill content for security issues',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Skill content to validate (required)',
              },
              url: {
                type: 'string',
                description: 'Source URL for verification (optional)',
              },
            },
            required: ['content'],
          },
        },
        {
          name: 'convert_to_steering',
          description: 'Convert skill to Kiro steering file format',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Skill content (required)',
              },
              sourceUrl: {
                type: 'string',
                description: 'Original source URL (optional)',
              },
            },
            required: ['content'],
          },
        },
        {
          name: 'convert_to_power',
          description: 'Convert skill to Kiro power format',
          inputSchema: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'Skill content (required)',
              },
              sourceUrl: {
                type: 'string',
                description: 'Original source URL (optional)',
              },
            },
            required: ['content'],
          },
        },
        {
          name: 'import_skill',
          description: 'Complete import workflow (fetch + validate + convert)',
          inputSchema: {
            type: 'object',
            properties: {
              identifier: {
                type: 'string',
                description: 'Skill identifier (required)',
              },
              outputFormat: {
                type: 'string',
                enum: ['steering', 'power'],
                description: 'Output format: "steering" or "power" (required)',
              },
              skipValidation: {
                type: 'boolean',
                description: 'Skip security validation (default: false)',
              },
            },
            required: ['identifier', 'outputFormat'],
          },
        },
      ],
    }));

    // Handle call_tool request
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        let result;

        switch (name) {
          case 'list_skills':
            result = await listSkillsHandler(args as any || {});
            break;
          case 'search_skills':
            result = await searchSkillsHandler(args as any);
            break;
          case 'get_leaderboard':
            result = await getLeaderboardHandler(args as any || {});
            break;
          case 'fetch_skill':
            result = await fetchSkillHandler(args as any);
            break;
          case 'validate_skill':
            result = await validateSkillHandler(args as any);
            break;
          case 'convert_to_steering':
            result = await convertToSteeringHandler(args as any);
            break;
          case 'convert_to_power':
            result = await convertToPowerHandler(args as any);
            break;
          case 'import_skill':
            result = await importSkillHandler(args as any);
            break;
          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Tool ${name} failed:`, error);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  error: errorMessage,
                  tool: name,
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
          isError: true,
        };
      }
    });
  }

  /**
   * Connect the server to a transport
   */
  async connect(transport: StdioServerTransport): Promise<void> {
    await this.server.connect(transport);
  }

  /**
   * Close the server connection
   */
  async close(): Promise<void> {
    await this.server.close();
  }
}

export default SkillLoaderMCPServer;

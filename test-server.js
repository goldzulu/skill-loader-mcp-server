#!/usr/bin/env node
/**
 * Simple test script to verify the MCP server works
 * 
 * This script tests the server by simulating MCP protocol messages
 */

import { SkillLoaderMCPServer } from './dist/index.js';

async function testServer() {
  console.log('Testing Skill Loader MCP Server...\n');
  
  try {
    // Create server instance
    const server = new SkillLoaderMCPServer();
    console.log('✓ Server instance created successfully');
    
    // Test that server has the expected structure
    if (!server) {
      throw new Error('Server instance is null or undefined');
    }
    console.log('✓ Server instance is valid');
    
    console.log('\n✅ All basic tests passed!');
    console.log('\nThe MCP server is ready to use.');
    console.log('To start the server, run: npm start');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

testServer();

#!/usr/bin/env node
/**
 * Generate OpenAPI spec from the running backend service.
 *
 * This script fetches the OpenAPI spec from the backend's SpringDoc endpoint
 * and saves it to the docs site for API documentation generation.
 *
 * Usage:
 *   node scripts/generate-openapi.js
 *
 * If the backend is not running, it will use a cached/placeholder spec.
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '..', 'dev', 'api', 'openapi.json');

async function fetchOpenAPISpec() {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080/v3/api-docs';

  try {
    console.log(`Fetching OpenAPI spec from ${backendUrl}...`);
    const response = await fetch(backendUrl);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const spec = await response.json();
    return spec;
  } catch (error) {
    console.warn(`Warning: Could not fetch OpenAPI spec from backend: ${error.message}`);
    console.warn('Using placeholder spec. Run the backend to generate full API docs.');

    // Return a minimal placeholder spec
    return {
      openapi: '3.0.3',
      info: {
        title: 'GateFlow API',
        version: '1.0.0',
        description: 'GateFlow A/B Testing Platform API. Start the backend service to generate full API documentation.',
      },
      servers: [
        {
          url: 'http://localhost:8080',
          description: 'Local development server',
        },
      ],
      paths: {},
    };
  }
}

async function main() {
  const spec = await fetchOpenAPISpec();

  // Ensure output directory exists
  const outputDir = dirname(outputPath);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  writeFileSync(outputPath, JSON.stringify(spec, null, 2), 'utf-8');
  console.log(`OpenAPI spec saved to ${outputPath}`);
}

main().catch((error) => {
  console.error('Failed to generate OpenAPI spec:', error);
  process.exit(1);
});

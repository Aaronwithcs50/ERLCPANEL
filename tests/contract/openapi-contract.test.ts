import { readFileSync } from 'node:fs';

import { Ajv } from 'ajv';
import yaml from 'js-yaml';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp } from '../../src/app.js';

type OpenApiPath = {
  get?: {
    responses: {
      [statusCode: string]: {
        content?: {
          'application/json'?: {
            schema: Record<string, unknown>;
          };
        };
      };
    };
  };
};

type OpenApiDocument = {
  paths: {
    [pathName: string]: OpenApiPath;
  };
};

describe('API contract', () => {
  it('GET /api/v1/ping satisfies OpenAPI schema', async () => {
    const rawSpec = readFileSync('docs/api/openapi.yaml', 'utf8');
    const spec = yaml.load(rawSpec) as OpenApiDocument;

    const schema =
      spec.paths['/api/v1/ping']?.get?.responses['200']?.content?.['application/json']?.schema;

    expect(schema).toBeDefined();

    const validate = new Ajv({ allErrors: true, strict: false }).compile(schema!);
    const response = await request(createApp()).get('/api/v1/ping').expect(200);
    const valid = validate(response.body);

    expect(valid, JSON.stringify(validate.errors)).toBe(true);
  });
});

import { notFound } from '@core/errors';

import { getToolByKey, TOOL_CATALOG } from './catalog';
import type { GetToolResponse, ListToolsResponse, Tool } from './types';

function list(): ListToolsResponse {
  return { tools: TOOL_CATALOG as Tool[] };
}

function getByKey(key: string): GetToolResponse {
  const tool = getToolByKey(key);
  if (!tool) {
    throw notFound('tools.unknown_key', `Unknown tool key: ${key}`);
  }
  return { tool };
}

export const toolsService = { list, getByKey };

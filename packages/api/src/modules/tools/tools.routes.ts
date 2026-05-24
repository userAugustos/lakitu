import { Elysia } from 'elysia';

import { toolsService } from './tools.service';
import { GetToolResponseSchema, ListToolsResponseSchema, ToolKeyParamSchema } from './types';

export const toolsRoutes = new Elysia({
  name: 'tools.routes',
  prefix: '/tools',
})
  .get('/', () => toolsService.list(), {
    response: ListToolsResponseSchema,
    detail: { summary: 'List all tools in the catalog', tags: ['tools'] },
  })
  .get('/:key', ({ params }) => toolsService.getByKey(params.key), {
    params: ToolKeyParamSchema,
    response: GetToolResponseSchema,
    detail: { summary: 'Get a tool by key', tags: ['tools'] },
  });

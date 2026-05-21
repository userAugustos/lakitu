import { Elysia } from 'elysia';

import { gatewayService } from './gateway.service';
import { GatewayDecideBodySchema, GatewayDecideResponseSchema } from './types';

export const gatewayRoutes = new Elysia({
  name: 'gateway.routes',
  prefix: '/gateway',
}).post(
  '/decide',
  async ({ body, request }) => {
    const signature = request.headers.get('agent-signature');
    return gatewayService.decide(body, signature);
  },
  {
    body: GatewayDecideBodySchema,
    response: GatewayDecideResponseSchema,
    detail: { summary: 'Evaluate an agent action request', tags: ['gateway'] },
  }
);

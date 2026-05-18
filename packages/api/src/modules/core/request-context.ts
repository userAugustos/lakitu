import { AsyncLocalStorage } from 'async_hooks';

interface RequestContext {
  request_id: string;
  client_ip: string;
}

const requestStorage = new AsyncLocalStorage<RequestContext>();

export function enterRequestContext(requestId: string, clientIp: string): void {
  requestStorage.enterWith({ request_id: requestId, client_ip: clientIp });
}

export function getRequestContext(): RequestContext | undefined {
  return requestStorage.getStore();
}

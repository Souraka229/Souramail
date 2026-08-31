export const API_SCOPES = [
  'emails:send',
  'emails:read',
  'emails:delete',
  'domains:read',
  'domains:manage',
  'webhooks:manage',
] as const;

export const SCOPE_HELP: Record<(typeof API_SCOPES)[number], string> = {
  'emails:send': 'POST /v1/emails',
  'emails:read': 'GET /v1/emails/:id, /v1/messages',
  'emails:delete': 'delete messages',
  'domains:read': 'GET /v1/domains',
  'domains:manage': 'create / verify domains',
  'webhooks:manage': 'CRUD /v1/webhooks',
};

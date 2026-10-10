/**
 * DRE-01: transport-neutral public records. This package must never expose
 * private media, device keys, raw ambient audio or consumer on-demand controls.
 * Media/key authorization is delegated to the Distributed Audio Engine.
 */
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const contentKinds = Object.freeze(['music', 'news', 'documentary', 'talk', 'episode']);
const requiredMedia = ['tenantId', 'publisherId', 'id', 'title', 'kind'];
export class ContractError extends Error {
  constructor(message) { super(message); this.name = 'ContractError'; }
}
export function id(value, field = 'id') {
  if (typeof value !== 'string' || !ID.test(value)) throw new ContractError('Invalid ' + field);
  return value;
}
export function text(value, field, max = 256) {
  if (typeof value !== 'string' || !value.trim() || value !== value.trim() || value.length > max ||
      /[\u0000-\u001f\u007f]/u.test(value)) throw new ContractError('Invalid ' + field);
  return value;
}
export function assertObject(value, name = 'object') {
  if (value === null || typeof value !== 'object' || Array.isArray(value) ||
      Object.getPrototypeOf(value) !== Object.prototype) throw new ContractError('Invalid ' + name);
  return value;
}
export function createStation(input) {
  assertObject(input, 'station');
  const station = {
    id: id(input.id, 'station id'),
    tenantId: id(input.tenantId, 'tenant id'),
    publisherId: id(input.publisherId, 'publisher id'),
    name: text(input.name, 'station name'),
    kind: 'linear-radio',
    status: input.status === undefined ? 'draft' : input.status,
  };
  if (!['draft', 'active', 'suspended'].includes(station.status))
    throw new ContractError('Invalid station status');
  return Object.freeze(station);
}
export function createMediaItem(input) {
  assertObject(input, 'media');
  for (const field of requiredMedia) if (!(field in input)) throw new ContractError('Missing ' + field);
  if (!contentKinds.includes(input.kind)) throw new ContractError('Unsupported content kind');
  const media = {
    id: id(input.id, 'media id'),
    tenantId: id(input.tenantId, 'tenant id'),
    publisherId: id(input.publisherId, 'publisher id'),
    title: text(input.title, 'title', 512),
    kind: input.kind,
    assetRef: id(input.assetRef, 'opaque encrypted asset reference'),
    attribution: input.attribution === undefined ? '' : text(input.attribution, 'attribution', 256),
  };
  return Object.freeze(media);
}
export function assertSameTenant(station, record) {
  if (!station || !record || station.tenantId !== record.tenantId)
    throw new ContractError('Cross-tenant access denied');
  return true;
}
export const mediaKinds = contentKinds;

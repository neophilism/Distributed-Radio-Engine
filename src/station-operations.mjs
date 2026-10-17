import { assertObject, createStation, id, ContractError } from './contracts.mjs';
import { buildStationRotation, radioPositionAt } from './rotation.mjs';

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const FIELDS = Object.freeze(['tenantId', 'stationId', 'segmentRef', 'assetRef', 'ciphertextSha256']);

/**
 * DRE-10 (stage 1): validate an already-approved radio rotation and immutable,
 * endpoint-published ciphertext asset references for unattended playout.
 *
 * This is not an encryption implementation, storage service, audio decoder, or
 * license validator. Actual availability, signed publication and rights decisions
 * must be provided by trusted adapters; all fail closed when absent/revoked.
 * The scheduler is deliberately not given media keys, plaintext or manifests.
 */
export function stageEncryptedRadioBroadcast({
  station, rotation, assets, verifyEditorialApproval, verifyCiphertextAvailable
}) {
  const checkedStation = createStation(station);
  if (checkedStation.status !== 'active') throw new ContractError('Station is not active');
  assertObject(rotation, 'rotation');
  if (rotation.stationId !== checkedStation.id)
    throw new ContractError('Rotation station does not match authorization');
  if (typeof verifyEditorialApproval !== 'function' ||
      typeof verifyCiphertextAvailable !== 'function')
    throw new ContractError('Trusted publication and ciphertext availability adapters required');
  const schedule = buildStationRotation(rotation);
  const required = new Set();
  for (const { program } of schedule.blocks) {
    if (!DIGEST.test(program.digest) || !Number.isSafeInteger(program.version) || program.version < 1)
      throw new ContractError('Unverifiable program identity');
    if (verifyEditorialApproval(program, checkedStation) !== true)
      throw new ContractError('Program publication not approved');
    for (const cue of program.timeline) {
      assertObject(cue, 'program cue');
      const ref = id(cue.ref, 'program cue ref');
      if (!['opening', 'closing', 'content', 'sponsor'].includes(cue.role))
        throw new ContractError('Unrecognized ciphertext cue role');
      if (!Number.isSafeInteger(cue.fromMs) || !Number.isSafeInteger(cue.toMs) ||
          cue.fromMs < 0 || cue.toMs <= cue.fromMs || cue.toMs > program.durationMs)
        throw new ContractError('Invalid cue timing');
      required.add(ref);
    }
  }
  if (!Array.isArray(assets) || assets.length !== required.size)
    throw new ContractError('Every broadcast cue requires exactly one ciphertext asset');
  const catalog = new Map();
  const safeAssets = [];
  for (const raw of assets) {
    assertObject(raw, 'ciphertext publication record');
    const names = Object.keys(raw);
    if (names.length !== FIELDS.length || names.some(name => !FIELDS.includes(name)) ||
        Object.values(Object.getOwnPropertyDescriptors(raw)).some(desc => !('value' in desc)))
      throw new ContractError('Only public ciphertext identifiers and hashes are permitted');
    const item = Object.freeze({
      tenantId: id(raw.tenantId, 'tenant id'),
      stationId: id(raw.stationId, 'station id'),
      segmentRef: id(raw.segmentRef, 'program cue ref'),
      assetRef: id(raw.assetRef, 'ciphertext asset ref'),
      ciphertextSha256: raw.ciphertextSha256
    });
    if (item.tenantId !== checkedStation.tenantId || item.stationId !== checkedStation.id)
      throw new ContractError('Cross-tenant or cross-station ciphertext denied');
    if (!item.assetRef.startsWith('ciphertext:') || !DIGEST.test(item.ciphertextSha256))
      throw new ContractError('Ciphertext publication lacks encrypted asset and strong hash');
    if (!required.has(item.segmentRef) || catalog.has(item.segmentRef))
      throw new ContractError('Duplicate or unsolicited ciphertext cue');
    catalog.set(item.segmentRef, item);
    safeAssets.push(item);
  }
  for (const { program } of schedule.blocks) {
    for (const cue of program.timeline) {
      const item = catalog.get(cue.ref);
      if (!item || verifyCiphertextAvailable(item, {
        stationId: checkedStation.id,
        programDigest: program.digest,
        version: program.version,
        segmentRole: cue.role
      }) !== true) throw new ContractError('Required ciphertext unavailable or unverified');
    }
  }
  return Object.freeze({
    stationId: checkedStation.id,
    tenantId: checkedStation.tenantId,
    schedule,
    assets: Object.freeze(safeAssets)
  });
}

/**
 * Deterministic crash/restart-safe playhead, without an artist phone.
 * No cue is returned unless current station/rights and asset availability
 * are freshly verified; merely staging once never permits stale delivery.
 */
export function encryptedRadioCueAt(prepared, nowMs, {
  verifyPlayoutRights, verifyCiphertextAvailable
} = {}) {
  assertObject(prepared, 'staged station');
  if (typeof verifyPlayoutRights !== 'function' ||
      typeof verifyCiphertextAvailable !== 'function')
    throw new ContractError('Fresh broadcast-rights and asset authorization required');
  const position = radioPositionAt(prepared.schedule, nowMs);
  const item = prepared.assets.find(asset => asset.segmentRef === position.segmentRef);
  if (!item || item.tenantId !== prepared.tenantId || item.stationId !== prepared.stationId)
    throw new ContractError('No authorized ciphertext for current cue');
  if (verifyPlayoutRights({
    tenantId: prepared.tenantId,
    stationId: prepared.stationId,
    programDigest: position.digest,
    version: position.version,
    atMs: nowMs
  }) !== true || verifyCiphertextAvailable(item, {
    stationId: prepared.stationId,
    programDigest: position.digest,
    version: position.version,
    segmentRole: position.segmentRole,
    atMs: nowMs
  }) !== true) throw new ContractError('Live authorization or encrypted asset revoked');
  return Object.freeze({
    stationId: prepared.stationId,
    programDigest: position.digest,
    version: position.version,
    cycle: position.cycle,
    cycleStartedAt: position.cycleStartedAt,
    segmentRole: position.segmentRole,
    segmentRef: position.segmentRef,
    segmentOffsetMs: position.segmentOffsetMs,
    ciphertextAssetRef: item.assetRef,
    ciphertextSha256: item.ciphertextSha256
  });
}

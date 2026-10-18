import { ContractError } from './contracts.mjs';
/** DRE-11: transport-neutral, encrypted-live-radio join position. */
export function createRadioJoin({program, startedAtMs, nowMs, route, evidence}) {
  if (!program || !Array.isArray(program.timeline) || !Number.isSafeInteger(program.durationMs) || program.durationMs <= 0)
    throw new ContractError('Compiled radio timeline required');
  if (!Number.isSafeInteger(startedAtMs) || !Number.isSafeInteger(nowMs) || nowMs < startedAtMs)
    throw new ContractError('Invalid authoritative station clock');
  if (!['web','native'].includes(route?.clientType)) throw new ContractError('Unsupported client route');
  if (!['ready','recovering','unavailable'].includes(route?.status)) throw new ContractError('Invalid route status');
  if (!['verified','unverified','unavailable'].includes(evidence?.status)) throw new ContractError('Invalid evidence state');
  const atMs = (nowMs - startedAtMs) % program.durationMs;
  const segment = program.timeline.find(s => s.fromMs <= atMs && atMs < s.toMs);
  if (!segment) throw new ContractError('Incomplete station timeline');
  return Object.freeze({stationId:program.stationId, version:program.version, digest:program.digest,
    atMs, cycle:Math.floor((nowMs-startedAtMs)/program.durationMs), segmentRef:segment.ref,
    segmentRole:segment.role, segmentOffsetMs:atMs-segment.fromMs,
    seekable:false, onDemand:false, route:Object.freeze({...route}), evidence:Object.freeze({...evidence})});
}
/** Bounded recovery after interruption; always rejoins the live station, never a stale offset. */
export function recoverRadioJoin(options) { return createRadioJoin(options); }

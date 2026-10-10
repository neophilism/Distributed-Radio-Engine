import {assertObject,id,ContractError} from './contracts.mjs';
/**
 * Offline broadcaster-independent, deterministic revision schedule. New
 * revisions only activate at cycle boundaries; no listener-selected song API.
 * Program cues are preapproved, with encrypted media delivered elsewhere.
 */
export function buildStationRotation({stationId,blocks}) {
 id(stationId,'station id');
 if(!Array.isArray(blocks)||blocks.length<1||blocks.length>1000)throw new ContractError('Invalid rotation blocks');
 const ordered=blocks.map(b=>{
   assertObject(b,'rotation block');assertObject(b.program,'compiled program');
   if(b.program.stationId!==stationId||!Array.isArray(b.program.timeline) ||
      b.program.timeline.length===0 || !Number.isSafeInteger(b.program.durationMs) || b.program.durationMs<1)
     throw new ContractError('Invalid compiled program');
   if(!Number.isSafeInteger(b.effectiveAt)||b.effectiveAt<0)throw new ContractError('Invalid activation time');
   return Object.freeze({effectiveAt:b.effectiveAt,program:b.program});
 });
 for(let i=1;i<ordered.length;i++){
   const prev=ordered[i-1],cur=ordered[i];
   if(cur.effectiveAt<=prev.effectiveAt ||
      (cur.effectiveAt-prev.effectiveAt)%prev.program.durationMs!==0)
     throw new ContractError('Revision must activate at the prior full-cycle boundary');
 }
 return Object.freeze({stationId,blocks:Object.freeze(ordered)});
}
export function radioPositionAt(rotation,nowMs) {
 assertObject(rotation,'rotation');
 if(!Number.isSafeInteger(nowMs)||nowMs<rotation.blocks[0].effectiveAt)
   throw new ContractError('Outside scheduled time');
 let block=rotation.blocks[0];
 for(const candidate of rotation.blocks){
   if(candidate.effectiveAt<=nowMs)block=candidate;else break;
 }
 const program=block.program,elapsed=nowMs-block.effectiveAt;
 const cycle=Math.floor(elapsed/program.durationMs),offsetMs=elapsed%program.durationMs;
 const segment=program.timeline.find(s=>s.fromMs<=offsetMs&&offsetMs<s.toMs);
 if(!segment)throw new ContractError('Timeline gap');
 return Object.freeze({stationId:rotation.stationId,digest:program.digest,version:program.version,
   cycle,offsetMs,segmentRef:segment.ref,segmentRole:segment.role,segmentOffsetMs:offsetMs-segment.fromMs,
   currentOccurrenceId:segment.occurrenceId,cycleStartedAt:block.effectiveAt+cycle*program.durationMs});
}

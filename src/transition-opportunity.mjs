import {createHash} from 'node:crypto';
/** Shared server occurrence opportunities, independent of individual listener joins. */
export function transitionOpportunity({stationId,programVersion,completedItems,everyMin,everyMax,sequence}) {
  if(typeof stationId!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(stationId))throw new TypeError('Station required');
  if(![programVersion,completedItems,everyMin,everyMax,sequence].every(Number.isSafeInteger)||
     programVersion<1||completedItems<0||everyMin<1||everyMax<everyMin||everyMax>10000||sequence<0)
    throw new RangeError('Invalid transition cadence');
  const range=everyMax-everyMin+1;
  const hash=createHash('sha256').update([stationId,programVersion,sequence].join(':')).digest();
  const cadence=everyMin+(hash.readUInt32BE(0)%range);
  const eligible=completedItems>0 && completedItems%cadence===0;
  const id=createHash('sha256').update([stationId,programVersion,completedItems,'outro-transition'].join(':')).digest('hex');
  return Object.freeze({opportunityId:eligible?id:null,eligible,cadence,afterOutro:true,beforeNextIntro:true});
}

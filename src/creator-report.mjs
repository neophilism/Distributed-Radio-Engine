/** DRE-25 exact source-bound reporting, no invented audience or financial totals. */
export function creatorReport({creatorId,events}) {
 if(typeof creatorId!=='string'||creatorId.length<1||creatorId.length>128||!Array.isArray(events))throw new TypeError('Scoped creator and events required');
 const result={creatorId,speakerMicroPoints:0n,grooveGrants:0n,paidMinorByCurrency:{},sources:new Set()};
 const seen=new Set();
 for(const e of events) {
   if(e?.creatorId!==creatorId)continue;
   if(typeof e.source!=='string'||!e.source||typeof e.eventId!=='string'||!e.eventId)throw new TypeError('Provenance IDs required');
   const key=e.source+'\0'+e.eventId;
   if(seen.has(key))throw new Error('Duplicate source event in report');
   seen.add(key);result.sources.add(e.source);
   if(e.kind==='speaker') {if(e.status!=='verified'||typeof e.microPoints!=='bigint'||e.microPoints<0n)throw new RangeError('Unverified speaker evidence');result.speakerMicroPoints+=e.microPoints;}
   else if(e.kind==='groove_grant'){if(e.status!=='settled')throw new RangeError('Unsettled grant');result.grooveGrants++;}
   else if(e.kind==='commerce'){if(e.status!=='settled'||typeof e.amountMinor!=='bigint'||!(/^[A-Z]{3}$/).test(e.currency))throw new RangeError('Unsettled or malformed commerce');result.paidMinorByCurrency[e.currency]=(result.paidMinorByCurrency[e.currency]??0n)+e.amountMinor;}
   else throw new TypeError('Unsupported event');
 }
 return Object.freeze({...result,sources:Object.freeze([...result.sources].sort()),paidMinorByCurrency:Object.freeze(result.paidMinorByCurrency)});
}

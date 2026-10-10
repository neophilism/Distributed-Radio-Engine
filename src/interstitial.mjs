import {assertObject,id,text,ContractError} from './contracts.mjs';
/** Human-readable reference copy only. Actual broadcaster-approved audio is mandatory. */
export function suggestedClosingIdentification({contentTitle,creatorName,stationName}) {
 return 'That was '+text(contentTitle,'content title',512)+' by '+
   text(creatorName,'creator name',256)+' on '+text(stationName,'station name',256)+' radio.';
}
/** Artist endpoint attestation is a separate, required validation boundary. */
export function authorizeInterstitial(record,verifyPublishedAudio) {
 assertObject(record,'interstitial');
 const stationId=id(record.stationId,'station id');
 const contentRef=id(record.contentRef,'content ref');
 const audioRef=id(record.audioRef,'opaque audio ref');
 if(!audioRef.startsWith('ciphertext:'))throw new ContractError('Requires encrypted recorded audio');
 if(!['opening','closing','station-id'].includes(record.kind))throw new ContractError('Invalid ID kind');
 if(!Number.isSafeInteger(record.durationMs)||record.durationMs<1||record.durationMs>1800000)
  throw new ContractError('Must contain nonempty, bounded audio');
 if(typeof verifyPublishedAudio!=='function' || verifyPublishedAudio(record)!==true)
  throw new ContractError('Authorized endpoint audio proof missing');
 return Object.freeze({stationId,contentRef,audioRef,kind:record.kind,durationMs:record.durationMs});
}

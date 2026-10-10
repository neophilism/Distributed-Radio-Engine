import {assertObject,id,ContractError} from './contracts.mjs';
/** Shared-program sponsorship. No individual audio substitution or audience inference. */
export function authorizeSponsorCampaign(input,verifyPublisherApproval) {
 assertObject(input,'campaign');
 const tenantId=id(input.tenantId,'tenant id'),stationId=id(input.stationId,'station id');
 const campaignId=id(input.campaignId,'campaign id'),audioRef=id(input.audioRef,'encrypted sponsor audio reference');
 if(!audioRef.startsWith('ciphertext:'))throw new ContractError('Unencrypted sponsor asset');
 if(typeof input.programDigest!=='string'||!/^sha256:[a-f0-9]{64}$/.test(input.programDigest))
  throw new ContractError('Sponsor slot must bind an approved program');
 if(!Number.isSafeInteger(input.rateMinor)||input.rateMinor<0)throw new ContractError('Invalid sponsor rate');
 if(typeof verifyPublisherApproval!=='function'||verifyPublisherApproval(input)!==true)
  throw new ContractError('No broadcaster approval');
 return Object.freeze({tenantId,stationId,campaignId,audioRef,programDigest:input.programDigest,rateMinor:input.rateMinor});
}
export function accountCommonSponsorDelivery(campaign,program,cue,deliveryId,verifyCompletedPlayback){
 assertObject(campaign,'campaign');assertObject(program,'compiled program');assertObject(cue,'cue');
 id(deliveryId,'delivery id');
 if(program.stationId!==campaign.stationId||program.digest!==campaign.programDigest)
  throw new ContractError('Campaign does not match program');
 if(cue.role!=='sponsor'||cue.ref!==campaign.audioRef ||
   !program.timeline.some(segment=>segment.role==='sponsor'&&segment.ref===cue.ref&&
     segment.fromMs===cue.fromMs&&segment.toMs===cue.toMs))
  throw new ContractError('Sponsor cue not in common timeline');
 if(typeof verifyCompletedPlayback!=='function'||verifyCompletedPlayback(cue)!==true)
  throw new ContractError('Unverified sponsor delivery');
 return Object.freeze({deliveryId,campaignId:campaign.campaignId,stationId:campaign.stationId,
   programDigest:program.digest,deliveryUnits:1,rateMinor:campaign.rateMinor,
   listenerCount:null,verifiedAcousticOutputs:null,radioPoints:0});
}

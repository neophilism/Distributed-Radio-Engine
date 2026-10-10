import {assertObject,id,ContractError} from './contracts.mjs';
const allowedUses = Object.freeze(['broadcast','cache','reward','sale']);
export function makeRightsRecord(input) {
 assertObject(input,'rights');
 const {tenantId,assetRef}=input;
 id(tenantId,'tenant id'); id(assetRef,'asset id');
 if(!Array.isArray(input.uses) || input.uses.length===0 || input.uses.some(x=>!allowedUses.includes(x)) || new Set(input.uses).size!==input.uses.length)throw new ContractError('Invalid granted uses');
 if(!Array.isArray(input.territories) || input.territories.length===0 || input.territories.some(x=>typeof x!=='string'|| !/^[A-Z]{2}$/.test(x)))throw new ContractError('Invalid territory list');
 const start=Date.parse(input.validFrom),end=Date.parse(input.validUntil);
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)throw new ContractError('Invalid rights window');
 return Object.freeze({tenantId,assetRef,uses:Object.freeze([...input.uses]),territories:Object.freeze([...new Set(input.territories)]),validFrom:new Date(start).toISOString(),validUntil:new Date(end).toISOString(),revoked:input.revoked===true});
}
export function requirePublishingRights(record,request) {
 const r=makeRightsRecord(record);assertObject(request,'rights request');
 if(r.tenantId!==id(request.tenantId,'tenant id') ||r.assetRef!==id(request.assetRef,'asset id'))throw new ContractError('Rights scope mismatch');
 if(!allowedUses.includes(request.use)||!r.uses.includes(request.use))throw new ContractError('Use not permitted');
 if(!r.territories.includes(request.territory))throw new ContractError('Territory not permitted');
 if(!Number.isFinite(request.at)||request.at<Date.parse(r.validFrom)||request.at>=Date.parse(r.validUntil)||r.revoked)throw new ContractError('No currently valid rights');
 return true;
}

import {createHash} from 'node:crypto';
import {assertObject,id,ContractError} from './contracts.mjs';
import {authorizeStationAction} from './identity.mjs';
const entries = ['media','identification','sponsor','marker'];
/** The digest binds exact schedule order and opaque content identifiers. */
export function compileEditorialRevision(input) {
  assertObject(input,'revision');
  const stationId=id(input.stationId,'station id');
  const tenantId=id(input.tenantId,'tenant id');
  const applicationId=id(input.applicationId,'application id');
  if (!Number.isSafeInteger(input.version) || input.version < 1) throw new ContractError('Invalid revision version');
  if (!Array.isArray(input.program) || input.program.length<1 || input.program.length>10000)
    throw new ContractError('Invalid program');
  const program=input.program.map((entry)=>{
    assertObject(entry,'entry');
    if (!entries.includes(entry.kind)) throw new ContractError('Unknown program entry kind');
    return Object.freeze({kind:entry.kind,ref:id(entry.ref,'asset id')});
  });
  const scope=Object.freeze({tenantId,applicationId,stationId,version:input.version,program:Object.freeze(program)});
  const canonical=JSON.stringify(scope);
  return Object.freeze({...scope,digest:'sha256:'+createHash('sha256').update(canonical).digest('hex')});
}
/** Signatures are verified by trusted client identity/authorization adapters; not by this library. */
export function approveEditorialRevision({revision,membership,approval,verifySignature}) {
  assertObject(revision,'revision'); assertObject(approval,'approval');
  authorizeStationAction(membership,{...membership,tenantId:revision.tenantId,
    applicationId:revision.applicationId,stationId:revision.stationId,action:'publish'});
  if (approval.digest!==revision.digest || approval.version!==revision.version ||
      approval.stationId!==revision.stationId || approval.principalId!==membership.principalId ||
      typeof verifySignature!=='function' || verifySignature(approval,revision,membership)!==true)
    throw new ContractError('Invalid editorial approval');
  return Object.freeze({stationId:revision.stationId,version:revision.version,digest:revision.digest,approvedBy:membership.principalId});
}

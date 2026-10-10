import {assertObject, id, ContractError} from './contracts.mjs';

const ROLES = Object.freeze(['owner','editor','programmer','analyst','sponsor']);
const ACTIONS = Object.freeze({
  publish:['owner','editor'], revise:['owner','editor','programmer'],
  report:['owner','editor','analyst'], sponsor:['owner','sponsor'], admin:['owner'],
});
/**
 * An external login is ONLY a principal assertion. This is not a media key
 * enrollment mechanism. Membership and decryption authority are distinct.
 */
export function makeMembership(input) {
  assertObject(input,'membership');
  if (!ROLES.includes(input.role)) throw new ContractError('Unknown station role');
  return Object.freeze({
    tenantId:id(input.tenantId,'tenant id'),
    applicationId:id(input.applicationId,'application id'),
    stationId:id(input.stationId,'station id'),
    principalId:id(input.principalId,'principal id'),
    role:input.role,
    active:input.active===true,
  });
}
export function authorizeStationAction(membership, request) {
  const m=makeMembership(membership);
  assertObject(request,'authorization request');
  const scope=['tenantId','applicationId','stationId','principalId'];
  for (const k of scope) if (m[k]!==id(request[k],k)) throw new ContractError('Mismatched '+k);
  if (!m.active || !ACTIONS[request.action]?.includes(m.role))
    throw new ContractError('Station permission denied');
  return true;
}
export function validateRecipientAuthorization(input, verifyEndpointGrant) {
  assertObject(input,'recipient authorization');
  const required=['tenantId','applicationId','stationId','principalId','deviceId','grantId'];
  for(const field of required) id(input[field],field);
  if(typeof verifyEndpointGrant!=='function') throw new ContractError('Endpoint verifier required');
  // The verifier must be an explicit, externally provided E2EESA-authorized
  // endpoint implementation. The radio engine never signs or invents grants.
  if(verifyEndpointGrant(input)!==true) throw new ContractError('No authorized endpoint grant');
  return Object.freeze({tenantId:input.tenantId,applicationId:input.applicationId,
    stationId:input.stationId,deviceId:input.deviceId,grantId:input.grantId});
}
export const stationRoles=ROLES;

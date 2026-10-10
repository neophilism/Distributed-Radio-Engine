import test from 'node:test';
import assert from 'node:assert/strict';
import {makeMembership,authorizeStationAction,validateRecipientAuthorization,ContractError} from '../src/index.mjs';
const m={tenantId:'t',applicationId:'app',stationId:'s',principalId:'p',role:'editor',active:true};
test('editor can publish in exact station scope',()=>assert.equal(authorizeStationAction(m,{...m,action:'publish'}),true));
test('cross-tenant and cross-application requests fail closed',()=>{
for(const k of ['tenantId','applicationId','stationId','principalId'])assert.throws(()=>authorizeStationAction(m,{...m,[k]:'other',action:'publish'}),ContractError);
});
test('unknown, revoked and restricted roles cannot publish',()=>{
for(const role of ['sponsor','analyst','guest'])assert.throws(()=>authorizeStationAction({...m,role},{...m,action:'publish'}),ContractError);
assert.throws(()=>authorizeStationAction({...m,active:false},{...m,action:'publish'}),ContractError);
});
test('external login alone cannot enroll a decrypting recipient',()=>{
const grant={...m,deviceId:'d',grantId:'g'};
assert.throws(()=>validateRecipientAuthorization(grant),ContractError);
assert.throws(()=>validateRecipientAuthorization(grant,()=>false),ContractError);
assert.equal(validateRecipientAuthorization(grant,()=>true).deviceId,'d');
});
test('identity adapter does not create or expose media keys',()=>assert.equal(Object.hasOwn(makeMembership(m),'mediaKey'),false));

import test from 'node:test';
import assert from 'node:assert/strict';
import {compileRadioProgram,compileEditorialRevision,ContractError} from '../src/index.mjs';
const revision=()=>compileEditorialRevision({tenantId:'t',applicationId:'app',stationId:'s',version:1,
  program:[{kind:'identification',ref:'intro'},{kind:'media',ref:'recording'},
   {kind:'identification',ref:'outro'},{kind:'marker',ref:'groove'},
   {kind:'sponsor',ref:'sponsor'},{kind:'identification',ref:'intro2'},
   {kind:'media',ref:'documentary'},{kind:'identification',ref:'outro2'}]});
const durations={intro:1000,recording:10000,outro:2000,sponsor:1500,intro2:1000,documentary:12000,outro2:2000};
const compile=(rev=revision(),opts={})=>compileRadioProgram({revision:rev,approval:{digest:rev.digest,stationId:rev.stationId,version:rev.version},
  durations,verifyPublishingRight:()=>true,...opts});
test('full outro, not recording, is the completion boundary',()=>{const v=compile();assert.equal(v.completions[0].vestNotBeforeMs,13000);assert.equal(v.opportunities[0].atMs,13000);assert.equal(v.timeline[3].role,'sponsor');assert.equal(v.completions[1].occurrenceId,2);});
test('identical input produces identical timeline and duration',()=>assert.deepEqual(compile(),compile()));
test('reordered or unapproved editorial sequence fails closed',()=>{const a=revision();const altered=compileEditorialRevision({...a,program:[...a.program].reverse()});assert.throws(()=>compile(altered,{approval:{digest:a.digest,stationId:a.stationId,version:a.version}}),ContractError);});
test('rights check is mandatory for both media and documentary',()=>{assert.throws(()=>compile(revision(),{verifyPublishingRight:undefined}),ContractError);assert.throws(()=>compile(revision(),{verifyPublishingRight:r=>r!=='documentary'}),ContractError);});
test('incomplete identification cannot compile',()=>{const a=revision();const modified=compileEditorialRevision({...a,program:a.program.slice(0,-1)});assert.throws(()=>compile(modified),ContractError);});
test('reward marker cannot precede outro or occur twice',()=>{const a=revision();const malformed=compileEditorialRevision({...a,program:[a.program[0],a.program[1],a.program[3],a.program[2]]});assert.throws(()=>compile(malformed),ContractError);});
test('missing or zero timing evidence fails closed',()=>assert.throws(()=>compile(revision(),{durations:{...durations,outro:0}}),ContractError));

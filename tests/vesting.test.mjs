import assert from 'node:assert/strict';
import {test} from 'node:test';
import {VestingGate} from '../src/vesting.mjs';
const sample={stationId:'station',occurrenceId:'run1',creatorId:'artist',startedAtMs:100,completedAtMs:1000,requiredStartMs:100,outroEndMs:1000,points:50n,evidenceContinuous:true,interruptions:false};
test('vest only after entire outro',()=>{const g=new VestingGate();assert.equal(g.vest({...sample,completedAtMs:999}).accepted,false);assert.equal(g.vest(sample).accepted,true)});
test('late join does not earn cycle',()=>assert.equal(new VestingGate().vest({...sample,startedAtMs:101}).accepted,false));
test('interruption or missing evidence forfeits',()=>{const g=new VestingGate();assert.equal(g.vest({...sample,interruptions:true}).accepted,false);assert.equal(g.vest({...sample,evidenceContinuous:false}).accepted,false)});
test('idempotent duplicate cannot vest twice',()=>{const g=new VestingGate();assert.equal(g.vest(sample).accepted,true);assert.equal(g.vest(sample).reason,'already-vested')});

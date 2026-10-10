import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStationRotation,radioPositionAt,ContractError} from '../src/index.mjs';
const program=(version=1)=>({stationId:'s',digest:'sha256:valid'+version,version,durationMs:3000,timeline:[
{ref:'intro',role:'opening',fromMs:0,toMs:500,occurrenceId:1},
{ref:'track',role:'content',fromMs:500,toMs:2500,occurrenceId:1},
{ref:'outro',role:'closing',fromMs:2500,toMs:3000,occurrenceId:1}]});
const schedule=()=>buildStationRotation({stationId:'s',blocks:[{effectiveAt:10000,program:program()}]});
test('late join enters current broadcasting position',()=>{const p=radioPositionAt(schedule(),11750);assert.equal(p.segmentRef,'track');assert.equal(p.segmentOffsetMs,1250);});
test('continuous cycle repeats without broadcaster handset',()=>{const p=radioPositionAt(schedule(),13750);assert.equal(p.cycle,1);assert.equal(p.segmentRef,'track');});
test('revisions switch atomically on cycle boundary',()=>{const s=buildStationRotation({stationId:'s',blocks:[{effectiveAt:10000,program:program()},{effectiveAt:16000,program:program(2)}]});assert.equal(radioPositionAt(s,15999).version,1);assert.equal(radioPositionAt(s,16000).version,2);});
test('mid-cycle changes must be rejected',()=>assert.throws(()=>buildStationRotation({stationId:'s',blocks:[{effectiveAt:10000,program:program()},{effectiveAt:11000,program:program(2)}]}),ContractError));
test('no missing program or pre-start instant can masquerade as broadcasting',()=>{assert.throws(()=>radioPositionAt(schedule(),9999),ContractError);assert.throws(()=>buildStationRotation({stationId:'s',blocks:[]}),ContractError);});
test('cycle wrap never requests a listener-selected next track',()=>{const p=radioPositionAt(schedule(),13000);assert.equal(p.segmentRole,'opening');assert.equal('listenerChoice' in p,false);});

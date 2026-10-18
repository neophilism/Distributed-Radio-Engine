import assert from 'node:assert/strict';
import {test} from 'node:test';
import {aggregateSpeakerEvidence} from '../src/speaker-evidence.mjs';
const a={physicalOutputId:'speaker-one',issuerId:'verified-issuer',route:'speaker',status:'verified',microPoints:100n};
test('one physical output fanout counts once',()=>assert.deepEqual(aggregateSpeakerEvidence([a,a]),{microPoints:100n,verifiedOutputs:1}));
test('different physical outputs with the same attestor add',()=>assert.equal(aggregateSpeakerEvidence([a,{...a,physicalOutputId:'speaker-two'}]).microPoints,200n));
test('unverified or headphone claims do not contribute',()=>assert.equal(aggregateSpeakerEvidence([{...a,status:'unverified'},{...a,route:'headphone'}]).microPoints,0n));
test('invalid output identifiers and negative values do not contribute',()=>assert.equal(aggregateSpeakerEvidence([{...a,physicalOutputId:''},{...a,microPoints:-100n}]).verifiedOutputs,0));

test('conflicting duplicate physical output values cannot be selected by order',()=>{
  assert.throws(()=>aggregateSpeakerEvidence([a,{...a,microPoints:200n}]),/Conflicting/);
  assert.throws(()=>aggregateSpeakerEvidence([{...a,microPoints:200n},a]),/Conflicting/);
});

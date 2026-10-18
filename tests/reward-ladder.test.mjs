import assert from 'node:assert/strict';
import {test} from 'node:test';
import {rewardPrice} from '../src/reward-ladder.mjs';
test('exponential ladder is exact BigInt and bound by level',()=>{
 const options={basePoints:100n,multiplierNumerator:2n,multiplierDenominator:1n};
 assert.equal(rewardPrice({...options,level:0}).points,100n);
 assert.equal(rewardPrice({...options,level:3}).points,800n);
 assert.equal(rewardPrice({...options,level:3}).spendAuthorized,false);
});
test('fractional growth uses deterministic integer truncation',()=>{
 assert.equal(rewardPrice({basePoints:100n,multiplierNumerator:3n,multiplierDenominator:2n,level:2}).points,225n);
});
test('reject unsafe multiplier or unbounded level',()=>{
 assert.throws(()=>rewardPrice({basePoints:100n,multiplierNumerator:1n,level:1}),/Multiplier/);
 assert.throws(()=>rewardPrice({basePoints:100n,level:65}),/Level/);
 assert.throws(()=>rewardPrice({basePoints:0n,level:1}),/base/);
});

import {test} from 'node:test';import assert from 'node:assert/strict';
import {rarityWeights,selectRarityTier} from '../src/rarity-policy.mjs';
test('every rare tier retains strictly positive probability',()=>{
 const x=rarityWeights({tiers:8});assert.ok(x.hasPositiveTail);
 assert.equal(x.weights.at(-1),1n);assert.equal(selectRarityTier(x,x.total-1n),7);
});
test('draw is deterministic for an audited uniform integer',()=>{
 const x=rarityWeights({tiers:4,base:2n});
 assert.equal(selectRarityTier(x,0n),0);assert.equal(selectRarityTier(x,x.total-1n),3);
});
test('invalid large tiers and draws fail closed',()=>{
 assert.throws(()=>rarityWeights({tiers:129}));
 const x=rarityWeights({tiers:3});
 assert.throws(()=>selectRarityTier(x,x.total));
});

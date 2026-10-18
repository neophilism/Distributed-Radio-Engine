import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ProvisionalProgress} from '../src/provisional-progress.mjs';
test('verified windows accumulate without creating spendable credit',()=>{
const p=new ProvisionalProgress();p.addWindow({cycleId:'cycle',creatorId:'artist',windowId:'first',points:100n,verified:true});
const preview=p.addWindow({cycleId:'cycle',creatorId:'artist',windowId:'second',points:50n,verified:true});
assert.equal(preview.provisionalPoints,150n);assert.equal(preview.spendablePoints,0n);assert.equal(preview.settled,false);
});
test('retry does not double count a window',()=>{
const p=new ProvisionalProgress(),a={cycleId:'c',creatorId:'a',windowId:'w',points:7n,verified:true};
p.addWindow(a);assert.equal(p.addWindow(a).provisionalPoints,7n);
});
test('failed evidence earns no preview',()=>{
const p=new ProvisionalProgress();assert.equal(p.addWindow({cycleId:'c',creatorId:'a',windowId:'w',points:100n,verified:false}).provisionalPoints,0n);
});
test('abandoned cycle wipes provisional state',()=>{
const p=new ProvisionalProgress();p.addWindow({cycleId:'c',creatorId:'a',windowId:'w',points:7n,verified:true});
assert.equal(p.abandon('c').provisionalPoints,0n);
});

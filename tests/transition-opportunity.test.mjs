import {test} from 'node:test';import assert from 'node:assert/strict';
import {transitionOpportunity} from '../src/transition-opportunity.mjs';
const x={stationId:'radio',programVersion:1,completedItems:12,everyMin:3,everyMax:3,sequence:1};
test('same station occurrence yields same opportunity across clients',()=>{
 const a=transitionOpportunity(x),b=transitionOpportunity({...x});
 assert.deepEqual(a,b);assert.equal(a.eligible,true);assert.equal(a.opportunityId.length,64);
});
test('opportunity is absent outside shared outro cadence',()=>{
 const r=transitionOpportunity({...x,completedItems:11});
 assert.equal(r.eligible,false);assert.equal(r.opportunityId,null);
});
test('invalid cadence and counters fail',()=>{
 assert.throws(()=>transitionOpportunity({...x,everyMax:2}));
 assert.throws(()=>transitionOpportunity({...x,completedItems:-1}));
});

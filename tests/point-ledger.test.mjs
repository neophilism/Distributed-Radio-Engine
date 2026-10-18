import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CreatorPointLedger} from '../src/point-ledger.mjs';
test('exact large values and distinct creator balances',()=>{
 const l=new CreatorPointLedger(),big=9007199254740993n;
 l.post({creatorId:'creator_1',entryId:'credit_1',source:'verified_cycle',delta:big});
 assert.equal(l.balance('creator_1'),big); assert.equal(l.balance('creator_2'),0n);
});
test('replay is idempotent but contradictory duplicate fails',()=>{
 const l=new CreatorPointLedger(),x={creatorId:'a',entryId:'one',source:'cycle',delta:100n};
 assert.equal(l.post(x).applied,true); assert.equal(l.post(x).applied,false);
 assert.throws(()=>l.post({...x,delta:200n}),/Conflicting/);assert.equal(l.balance('a'),100n);
});
test('overspending fails atomically without recording transaction',()=>{
 const l=new CreatorPointLedger();l.post({creatorId:'a',entryId:'one',source:'cycle',delta:10n});
 assert.throws(()=>l.post({creatorId:'a',entryId:'two',source:'redeem',delta:-11n}),/Insufficient/);
 assert.equal(l.balance('a'),10n); assert.equal(l.entries('a').length,1);
});
test('another creator cannot spend someone else points',()=>{
 const l=new CreatorPointLedger();l.post({creatorId:'a',entryId:'one',source:'cycle',delta:10n});
 assert.throws(()=>l.post({creatorId:'b',entryId:'two',source:'redeem',delta:-1n}),/Insufficient/);
});

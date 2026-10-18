import {test} from 'node:test';import assert from 'node:assert/strict';import {creatorReport} from '../src/creator-report.mjs';
const e=(creatorId,eventId,kind,rest={})=>({creatorId,eventId,kind,source:'radio',...rest});
test('scope and currency separation preserve exact big numbers',()=>{
 const result=creatorReport({creatorId:'a',events:[e('a','one','speaker',{status:'verified',microPoints:9007199254740993n}),e('a','two','commerce',{status:'settled',currency:'USD',amountMinor:50n}),e('a','three','commerce',{status:'settled',currency:'EUR',amountMinor:20n}),e('b','four','commerce',{status:'settled',currency:'USD',amountMinor:999n})]});
 assert.equal(result.speakerMicroPoints,9007199254740993n);assert.equal(result.paidMinorByCurrency.USD,50n);assert.equal(result.paidMinorByCurrency.EUR,20n);
});
test('reject unverified or duplicated source events',()=>{
 assert.throws(()=>creatorReport({creatorId:'a',events:[e('a','one','speaker',{status:'unverified',microPoints:2n})]}));
 const a=e('a','one','groove_grant',{status:'settled'});assert.throws(()=>creatorReport({creatorId:'a',events:[a,a]}));
});

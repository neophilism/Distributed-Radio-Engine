import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GrooveCatalog} from '../src/groove-catalog.mjs';
const a={grooveId:'bonus',recordingId:'takeA',creatorId:'artist',exclusive:true};
test('groove channel forbids nonexclusive or alternate reward channels',()=>{
 const c=new GrooveCatalog();
 assert.throws(()=>c.put({...a,exclusive:false}));
 assert.throws(()=>c.put({...a,channel:'points'}));
});
test('distinct alternate recordings need distinct IDs',()=>{
 const c=new GrooveCatalog();c.put(a);
 assert.throws(()=>c.put({...a,grooveId:'other'}),/already/);
 assert.throws(()=>c.put({...a,recordingId:'takeB'}),/reassign/);
});
test('grant survives catalog removal, and replay is idempotent',()=>{
 const c=new GrooveCatalog();c.put(a);
 const g={listenerId:'listener',grooveId:'bonus',grantId:'grant_1'};
 assert.equal(c.grant(g).created,true);assert.equal(c.grant(g).created,false);
 c.remove('bonus');assert.equal(c.entitlements('listener')[0].recordingId,'takeA');
});
test('conflicting grant replay cannot overwrite existing entitlement',()=>{
 const c=new GrooveCatalog();c.put(a);c.put({grooveId:'other',recordingId:'takeB',creatorId:'artist',exclusive:true});
 c.grant({listenerId:'listener',grooveId:'bonus',grantId:'grant_1'});
 assert.throws(()=>c.grant({listenerId:'listener',grooveId:'other',grantId:'grant_1'}),/Conflicting/);
});

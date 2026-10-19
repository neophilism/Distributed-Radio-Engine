import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {GrooveCatalog} from '../src/groove-catalog.mjs';
import {RecordingChannelRegistry} from '../src/recording-channels.mjs';
const scope={tenantId:'tenant',applicationId:'app',principalId:'publisher'};
const a={grooveId:'bonus',recordingId:'takeA',creatorId:'artist',exclusive:true};
function setup(t,authorizeCatalog=()=>true) {
 const registry=new RecordingChannelRegistry(':memory:',{allowMemory:true});
 t.after(()=>registry.close());
 return {registry,catalog:new GrooveCatalog({registry,scope,authorizeCatalog})};
}
test('Groove identity still rejects nonexclusive wrong-channel and retargeted recordings',t=>{
 const {catalog:c}=setup(t);c.put(a);
 assert.throws(()=>c.put({...a,exclusive:false}));
 assert.throws(()=>c.put({...a,channel:'points'}));
 assert.throws(()=>c.put({...a,grooveId:'other'}),/already/);
 assert.throws(()=>c.put({...a,recordingId:'takeB'}),/reassign/);
});
test('caller flags or missing authorizer cannot publish a Groove identity',t=>{
 const {registry,catalog:c}=setup(t,()=>false);
 assert.throws(()=>c.put(a),/authorization denied/);
 assert.equal(registry.get({tenantId:'tenant',applicationId:'app',recordingId:'takeA'}),null);
 assert.throws(()=>new GrooveCatalog(),/registry/);
});
test('shared points or paid reservations prevent Groove channel collision',t=>{
 for(const channel of ['points','paid']) {
  const {registry,catalog:c}=setup(t);
  registry.reserve({tenantId:'tenant',applicationId:'app',recordingId:'takeA',creatorId:'artist',entryId:'other',channel});
  assert.throws(()=>c.put(a),/already reserved/);
 }
});
test('Groove reservation cannot later become paid points or another creator identity',t=>{
 const {registry,catalog:c}=setup(t);c.put(a);
 for(const change of [{channel:'paid'},{channel:'points'},{creatorId:'other'},{entryId:'other'}])
  assert.throws(()=>registry.reserve({tenantId:'tenant',applicationId:'app',recordingId:'takeA',
   creatorId:'artist',entryId:'bonus',channel:'groove',...change}),/already reserved/);
});
test('withdrawal retains channel reservation and distinct alternate takes use distinct IDs',t=>{
 const {registry,catalog:c}=setup(t);c.put(a);c.remove('bonus');
 assert.equal(registry.get({tenantId:'tenant',applicationId:'app',recordingId:'takeA'}).channel,'groove');
 assert.throws(()=>registry.reserve({tenantId:'tenant',applicationId:'app',recordingId:'takeA',
  creatorId:'artist',entryId:'sale',channel:'paid'}));
 assert.equal(c.put({...a,grooveId:'bonusB',recordingId:'takeB'}).recordingId,'takeB');
});
test('persistent shared channel registry survives restart across catalog instances',t=>{
 const dir=mkdtempSync(join(tmpdir(),'groove-channel-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const path=join(dir,'channels.sqlite');
 let registry=new RecordingChannelRegistry(path);
 new GrooveCatalog({registry,scope,authorizeCatalog:()=>true}).put(a);registry.close();
 registry=new RecordingChannelRegistry(path);
 assert.throws(()=>registry.reserve({tenantId:'tenant',applicationId:'app',recordingId:'takeA',
  creatorId:'artist',entryId:'sale',channel:'paid'}),/already reserved/);
 registry.close();
});
test('independent connections see one immutable identity and scope separation',t=>{
 const dir=mkdtempSync(join(tmpdir(),'groove-channel-'));t.after(()=>rmSync(dir,{recursive:true,force:true}));
 const path=join(dir,'channels.sqlite'),one=new RecordingChannelRegistry(path),two=new RecordingChannelRegistry(path);
 const record={tenantId:'tenant',applicationId:'app',recordingId:'takeA',creatorId:'artist',entryId:'bonus',channel:'groove'};
 assert.equal(one.reserve(record).created,true);
 assert.equal(two.reserve(record).created,false);
 assert.throws(()=>two.reserve({...record,channel:'paid'}),/already reserved/);
 assert.equal(two.reserve({...record,applicationId:'other',channel:'paid'}).created,true);
 one.close();two.close();
});
test('entry ID cannot silently become another recording and failed transaction rolls back',t=>{
 const {registry,catalog:c}=setup(t);c.put(a);
 assert.throws(()=>registry.reserve({tenantId:'tenant',applicationId:'app',recordingId:'takeB',
  creatorId:'artist',entryId:'bonus',channel:'groove'}));
 assert.equal(registry.get({tenantId:'tenant',applicationId:'app',recordingId:'takeB'}),null);
 assert.equal(registry.reserve({tenantId:'tenant',applicationId:'app',recordingId:'takeB',
  creatorId:'artist',entryId:'bonusB',channel:'groove'}).created,true);
});
test('unimplemented grant persistence cannot issue or fabricate entitlement reads',t=>{
 const {catalog:c}=setup(t);c.put(a);
 assert.throws(()=>c.grant({listenerId:'listener',grooveId:'bonus',grantId:'grant'}),/not implemented/);
 assert.throws(()=>c.entitlements('listener'),/not implemented/);
});
test('asynchronous creator authorization cannot bypass the publication gate',async t=>{
 const {catalog:c}=setup(t,()=>Promise.reject(new Error('private')));
 assert.throws(()=>c.put(a),/Synchronous/);
 await new Promise(resolve=>setImmediate(resolve));
});
test('withdrawal requires the same explicit creator authority as publication',t=>{
 const {catalog:c}=setup(t,operation=>operation.action==='publish');c.put(a);
 assert.throws(()=>c.remove('bonus'),/withdrawal authorization/);
 assert.equal(c.put(a).recordingId,'takeA');
});


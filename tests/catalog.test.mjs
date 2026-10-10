import test from 'node:test';
import assert from 'node:assert/strict';
import {RadioCatalog,createStation,validateContentForStation,ContractError} from '../src/index.mjs';
const sample=(kind,id)=>({id,tenantId:'t',publisherId:'p',title:id,kind,assetRef:'ciphertext:'+id});
test('music and documentary clients use one catalog',()=>{const c=new RadioCatalog();c.register(sample('music','track'));c.register(sample('documentary','episode'));assert.equal(c.list({tenantId:'t'}).length,2);assert.equal(c.get({tenantId:'t',id:'episode'}).kind,'documentary');});
test('reject raw and non ciphertext asset references',()=>assert.throws(()=>new RadioCatalog().register({...sample('news','a'),assetRef:'https://plain.media/audio.wav'}),ContractError));
test('isolate tenant-owned catalog resources',()=>{const c=new RadioCatalog();c.register(sample('news','a'));assert.equal(c.get({tenantId:'other',id:'a'}),null);assert.equal(c.list({tenantId:'other'}).length,0);});
test('reject duplicate IDs within a tenant',()=>{const c=new RadioCatalog();c.register(sample('music','a'));assert.throws(()=>c.register(sample('music','a')),ContractError);});
test('station access respects tenant scope',()=>{const m=sample('music','a');const station=createStation({id:'station',tenantId:'t',publisherId:'p',name:'Station'});assert.equal(validateContentForStation(station,m),true);assert.throws(()=>validateContentForStation({...station,tenantId:'other'},m),ContractError);});

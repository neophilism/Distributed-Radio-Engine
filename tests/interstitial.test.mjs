import test from 'node:test';
import assert from 'node:assert/strict';
import {authorizeInterstitial,suggestedClosingIdentification,ContractError} from '../src/index.mjs';
const interstitial=()=>({stationId:'s',contentRef:'track',audioRef:'ciphertext:intro',kind:'closing',durationMs:2500});
test('suggested closing identification uses deterministic content attribution',()=>assert.equal(
 suggestedClosingIdentification({contentTitle:'A Song',creatorName:'Artist',stationName:'Unsealed'}),
 'That was A Song by Artist on Unsealed radio.'));
test('actual artist-controlled audio and endpoint verification are mandatory',()=>{const i=interstitial();assert.throws(()=>authorizeInterstitial(i),ContractError);assert.throws(()=>authorizeInterstitial(i,()=>false),ContractError);assert.equal(authorizeInterstitial(i,()=>true).audioRef,'ciphertext:intro');});
test('silent, unencrypted or malformed placeholders cannot count',()=>{const i=interstitial();for(const patch of [{durationMs:0},{durationMs:-1},{audioRef:'placeholder.wav'},{kind:'none'}])assert.throws(()=>authorizeInterstitial({...i,...patch},()=>true),ContractError);});
test('return immutable authorized identification metadata',()=>assert(Object.isFrozen(authorizeInterstitial(interstitial(),()=>true))));

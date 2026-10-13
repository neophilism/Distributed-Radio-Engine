import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ContractError, buildStationRotation, createStation,
  stageEncryptedRadioBroadcast, encryptedRadioCueAt
} from '../src/index.mjs';

const digest = n => 'sha256:' + String(n).repeat(64);
const station = (status = 'active') => createStation({
  id: 'station', tenantId: 'tenant', publisherId: 'publisher',
  name: 'Independent radio', status
});
const program = (version = 1) => ({
  stationId: 'station', version, digest: digest(version), durationMs: 3000,
  timeline: [
    { ref: 'intro', role: 'opening', fromMs: 0, toMs: 500, occurrenceId: 1 },
    { ref: 'music', role: 'content', fromMs: 500, toMs: 2500, occurrenceId: 1 },
    { ref: 'outro', role: 'closing', fromMs: 2500, toMs: 3000, occurrenceId: 1 }
  ]
});
const rotation = () => buildStationRotation({
  stationId: 'station', blocks: [{ effectiveAt: 10000, program: program() }]
});
const assets = () => ['intro', 'music', 'outro'].map(ref => ({
  tenantId: 'tenant', stationId: 'station', segmentRef: ref,
  assetRef: 'ciphertext:' + ref, ciphertextSha256: digest('a')
}));
const stage = (overrides = {}) => stageEncryptedRadioBroadcast({
  station: station(), rotation: rotation(), assets: assets(),
  verifyEditorialApproval: () => true, verifyCiphertextAvailable: () => true,
  ...overrides
});
const cue = (prepared, at, overrides = {}) => encryptedRadioCueAt(prepared, at, {
  verifyPlayoutRights: () => true, verifyCiphertextAvailable: () => true,
  ...overrides
});

test('DRE-10: a verified ciphertext station cycles without an artist phone, key or plaintext', () => {
  const staged = stage();
  assert.ok(Object.isFrozen(staged));
  assert.ok(Object.isFrozen(staged.assets));
  assert.ok(staged.assets.every(Object.isFrozen));
  assert.equal(cue(staged, 11750).segmentRef, 'music');
  assert.equal(cue(staged, 14750).cycle, 1);
  assert.equal(cue(staged, 14750).segmentOffsetMs, 1250);
  const descriptor = JSON.stringify(cue(staged, 11750));
  assert.match(descriptor, /ciphertext:music/);
  assert.doesNotMatch(descriptor, /key|plaintext|secret|waveform|listenerChoice/);
  assert.equal('listenerSelectedTrack' in cue(staged, 11750), false);
});

test('revision handoff is deterministic on the approved cycle boundary', () => {
  const scheduled = buildStationRotation({
    stationId: 'station',
    blocks: [{ effectiveAt: 10000, program: program(1) },
             { effectiveAt: 16000, program: program(2) }]
  });
  const staged = stage({ rotation: scheduled });
  assert.equal(cue(staged, 15999).version, 1);
  assert.equal(cue(staged, 16000).version, 2);
  assert.equal(cue(staged, 16000).segmentRef, 'intro');
});

test('refuses drafts, other stations, missing approvals and unverified encrypted assets', () => {
  assert.throws(() => stage({ station: station('draft') }), ContractError);
  assert.throws(() => stage({ station: station('suspended') }), ContractError);
  assert.throws(() => stage({ verifyEditorialApproval: () => false }), ContractError);
  assert.throws(() => stage({ verifyEditorialApproval: undefined }), ContractError);
  assert.throws(() => stage({ verifyCiphertextAvailable: () => false }), ContractError);
  assert.throws(() => stage({ verifyCiphertextAvailable: undefined }), ContractError);
  assert.throws(() => stage({ rotation: { ...rotation(), stationId: 'other' } }), ContractError);
});

test('refuses missing, duplicate, off-tenant, non-ciphertext, malformed and key-bearing records', () => {
  assert.throws(() => stage({ assets: assets().slice(0, 2) }), ContractError);
  assert.throws(() => stage({ assets: [assets()[0], assets()[0], assets()[2]] }), ContractError);
  const altered = (field, value) => assets().map((record, i) =>
    i === 1 ? { ...record, [field]: value } : record);
  assert.throws(() => stage({ assets: altered('tenantId', 'other') }), ContractError);
  assert.throws(() => stage({ assets: altered('stationId', 'other') }), ContractError);
  assert.throws(() => stage({ assets: altered('assetRef', 'https://public.example/track.wav') }), ContractError);
  assert.throws(() => stage({ assets: altered('ciphertextSha256', 'sha256:fake') }), ContractError);
  assert.throws(() => stage({ assets: altered('segmentRef', 'unknown') }), ContractError);
  assert.throws(() => stage({ assets: altered('decryptionKey', 'never-allowed') }), ContractError);
  assert.throws(() => stage({ assets: altered('plainAudio', 'never-allowed') }), ContractError);
});

test('fresh rights/availability gates block access after rights loss or ciphertext revocation', () => {
  const staged = stage();
  assert.throws(() => encryptedRadioCueAt(staged, 11750), ContractError);
  assert.throws(() => cue(staged, 11750, { verifyPlayoutRights: () => false }), ContractError);
  assert.throws(() => cue(staged, 11750, { verifyCiphertextAvailable: () => false }), ContractError);
  assert.throws(() => cue(staged, 9999), ContractError);
  let observed = null;
  cue(staged, 11750, { verifyPlayoutRights: (scope) => {
    observed = scope;
    return scope.programDigest === digest(1) && scope.atMs === 11750;
  } });
  assert.deepEqual(observed, {
    tenantId: 'tenant', stationId: 'station', programDigest: digest(1),
    version: 1, atMs: 11750
  });
});

test('a malformed or non-editorial program never starts a station', () => {
  const schedule = rotation();
  const malformed = {
    ...schedule,
    blocks: [{ effectiveAt: 10000, program: { ...program(1), digest: 'forged' } }]
  };
  assert.throws(() => stage({ rotation: malformed }), ContractError);
  const wrongRole = {
    ...schedule,
    blocks: [{ effectiveAt: 10000, program: { ...program(1), timeline: [
      { ref: 'intro', role: 'hidden', fromMs: 0, toMs: 500 }
    ] } }]
  };
  assert.throws(() => stage({ rotation: wrongRole }), ContractError);
});

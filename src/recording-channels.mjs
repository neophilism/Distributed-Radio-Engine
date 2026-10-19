import {DatabaseSync} from 'node:sqlite';
import {openSync,closeSync,statSync,lstatSync} from 'node:fs';
import {dirname,isAbsolute} from 'node:path';
import {id,assertObject} from './contracts.mjs';

/** Shared atomic ownership across Groove/points/paid catalogs at one endpoint.
 * Internal persistence only: caller must authenticate creator rights first.
 * Reservations are permanent identities; withdrawal cannot erase entitlements.
 */
export class RecordingChannelRegistry {
  #db;
  constructor(path,{allowMemory=false}={}) {
    if(path===':memory:') {if(!allowMemory)throw new TypeError('Volatile test registry requires explicit opt-in');}
    else {
      if(typeof path!=='string'||!isAbsolute(path))throw new TypeError('Absolute registry path required');
      const parent=statSync(dirname(path));
      if(!parent.isDirectory()||(parent.mode&0o077)!==0)throw new Error('Private endpoint registry directory required');
      try {const fd=openSync(path,'wx',0o600);closeSync(fd);}catch(error){if(error.code!=='EEXIST')throw error;}
      const file=lstatSync(path);
      if(!file.isFile()||file.isSymbolicLink()||(file.mode&0o077)!==0)throw new Error('Private ordinary registry file required');
    }
    const db=new DatabaseSync(path);
    try {
      db.exec('PRAGMA busy_timeout=1000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; BEGIN IMMEDIATE;');
      db.exec('CREATE TABLE IF NOT EXISTS radio_channel_schema(id INTEGER PRIMARY KEY CHECK(id=1),version INTEGER NOT NULL)');
      db.exec('INSERT OR IGNORE INTO radio_channel_schema VALUES(1,1)');
      if(db.prepare('SELECT version FROM radio_channel_schema WHERE id=1').get().version!==1)
        throw new Error('Unsupported recording-channel schema');
      db.exec("CREATE TABLE IF NOT EXISTS radio_recording_channels(tenant_id TEXT NOT NULL,application_id TEXT NOT NULL,recording_id TEXT NOT NULL,creator_id TEXT NOT NULL,channel TEXT NOT NULL CHECK(channel IN ('groove','points','paid')),entry_id TEXT NOT NULL,PRIMARY KEY(tenant_id,application_id,recording_id),UNIQUE(tenant_id,application_id,channel,entry_id)) STRICT");
      db.exec('COMMIT');
    } catch(error){try{db.exec('ROLLBACK');}catch{}db.close();throw error;}
    this.#db=db;
  }
  reserve(input) {
    assertObject(input,'recording channel');
    const record={};
    for(const key of ['tenantId','applicationId','recordingId','creatorId','entryId'])record[key]=id(input[key],key);
    if(!['groove','points','paid'].includes(input.channel))throw new TypeError('Explicit reward/commerce channel required');
    record.channel=input.channel;Object.freeze(record);
    this.#db.exec('BEGIN IMMEDIATE');
    try {
      const old=this.get(record);
      if(old) {
        if(['creatorId','channel','entryId'].some(key=>old[key]!==record[key]))
          throw new RangeError('Recording already reserved in another identity or channel');
        this.#db.exec('COMMIT');return Object.freeze({created:false,record:old});
      }
      this.#db.prepare('INSERT INTO radio_recording_channels VALUES(?,?,?,?,?,?)')
        .run(record.tenantId,record.applicationId,record.recordingId,record.creatorId,record.channel,record.entryId);
      this.#db.exec('COMMIT');return Object.freeze({created:true,record});
    } catch(error){try{this.#db.exec('ROLLBACK');}catch{}throw error;}
  }
  get({tenantId,applicationId,recordingId}) {
    for(const value of [tenantId,applicationId,recordingId])id(value,'recording scope');
    const row=this.#db.prepare('SELECT * FROM radio_recording_channels WHERE tenant_id=? AND application_id=? AND recording_id=?')
      .get(tenantId,applicationId,recordingId);
    return row?Object.freeze({tenantId:row.tenant_id,applicationId:row.application_id,recordingId:row.recording_id,
      creatorId:row.creator_id,channel:row.channel,entryId:row.entry_id}):null;
  }
  close(){this.#db.close();}
}

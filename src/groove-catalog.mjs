/** DRE-19 separate bonus-recording catalog, not points or paid commerce. */
export class GrooveCatalog {
  #items=new Map();
  #grants=new Map();
  put({grooveId,recordingId,creatorId,exclusive,channel='groove'}) {
    for(const id of [grooveId,recordingId,creatorId]) if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new TypeError('Stable identifiers required');
    if(channel!=='groove'||exclusive!==true) throw new TypeError('Grooves require app-exclusive bonus channel');
    for(const entry of this.#items.values()) {
      if(entry.recordingId===recordingId&&entry.grooveId!==grooveId) throw new Error('Recording already mapped to a groove');
    }
    const original=this.#items.get(grooveId);
    if(original && (original.recordingId!==recordingId || original.creatorId!==creatorId))
      throw new Error('Cannot reassign existing groove identity');
    const item=Object.freeze({grooveId,recordingId,creatorId,channel:'groove',exclusive:true});
    this.#items.set(grooveId,item);return item;
  }
  grant({listenerId,grooveId,grantId}) {
    for(const id of [listenerId,grantId]) if(typeof id!=='string'||!/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new TypeError('Stable grant identifiers required');
    const item=this.#items.get(grooveId);
    if(!item)throw new Error('Groove not found');
    const key=JSON.stringify([listenerId,grantId]),old=this.#grants.get(key);
    if(old) {
      if(old.grooveId!==grooveId)throw new Error('Conflicting grant replay');
      return Object.freeze({created:false,grant:old});
    }
    const grant=Object.freeze({listenerId,grantId,grooveId,recordingId:item.recordingId,creatorId:item.creatorId});
    this.#grants.set(key,grant);return Object.freeze({created:true,grant});
  }
  remove(grooveId){return this.#items.delete(grooveId);}
  entitlements(listenerId){return Object.freeze([...this.#grants.values()].filter(e=>e.listenerId===listenerId));}
}

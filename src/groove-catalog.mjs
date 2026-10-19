/** DRE-19 separate bonus-recording catalog, not points or paid commerce. */
export class GrooveCatalog {
  #items=new Map();
  #registry; #scope; #authorize;
  constructor({registry,scope,authorizeCatalog}={}) {
    if(typeof registry?.reserve!=='function'||!scope||![scope.tenantId,scope.applicationId,scope.principalId].every(x=>typeof x==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(x))||typeof authorizeCatalog!=='function')
      throw new TypeError('Shared channel registry, scope and creator authorizer required');
    this.#registry=registry;this.#scope=Object.freeze({tenantId:scope.tenantId,applicationId:scope.applicationId,principalId:scope.principalId});this.#authorize=authorizeCatalog;
  }
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
    const result=this.#authorize(Object.freeze({action:'publish',...item}),this.#scope);
    if(result&&typeof result.then==='function'){Promise.resolve(result).catch(()=>{});throw new TypeError('Synchronous creator authorization required');}
    if(result!==true)throw new TypeError('Creator catalog authorization denied');
    this.#registry.reserve({tenantId:this.#scope.tenantId,applicationId:this.#scope.applicationId,recordingId,creatorId,entryId:grooveId,channel:'groove'});
    this.#items.set(grooveId,item);return item;
  }
  grant() {throw new Error('Durable authorized Groove grant adapter is not implemented');}
  remove(grooveId){
    const item=this.#items.get(grooveId);
    if(!item)return false;
    const result=this.#authorize(Object.freeze({action:'withdraw',...item}),this.#scope);
    if(result&&typeof result.then==='function'){Promise.resolve(result).catch(()=>{});throw new TypeError('Synchronous creator authorization required');}
    if(result!==true)throw new TypeError('Creator withdrawal authorization denied');
    return this.#items.delete(grooveId);
  }
  entitlements() {throw new Error('Durable authorized entitlement reader is not implemented');}
}


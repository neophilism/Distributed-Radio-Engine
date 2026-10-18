/** DRE-16 in-process accounting contract. Requires durable DB transaction binding before production. */
export class CreatorPointLedger {
  #entries=new Map();
  #balances=new Map();
  post({creatorId,entryId,delta,source}) {
    if (![creatorId,entryId,source].every(v=>typeof v==='string' && /^[A-Za-z0-9_:-]{1,128}$/.test(v))) throw new TypeError('Scoped creator, id and source required');
    if(typeof delta!=='bigint' || delta===0n) throw new RangeError('Nonzero exact point delta required');
    const key=JSON.stringify([creatorId,source,entryId]);
    const existing=this.#entries.get(key);
    if(existing) {
      if(existing.delta!==delta) throw new Error('Conflicting financial replay');
      return Object.freeze({applied:false,balance:this.balance(creatorId)});
    }
    const current=this.balance(creatorId),next=current+delta;
    if(next<0n) throw new RangeError('Insufficient creator-specific points');
    this.#entries.set(key,Object.freeze({creatorId,source,entryId,delta}));
    this.#balances.set(creatorId,next);
    return Object.freeze({applied:true,balance:next});
  }
  balance(creatorId){return this.#balances.get(creatorId)??0n;}
  entries(creatorId){return Object.freeze([...this.#entries.values()].filter(e=>e.creatorId===creatorId));}
}

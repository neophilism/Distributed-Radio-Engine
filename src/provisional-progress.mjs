/** DRE-14: ephemeral preview, deliberately not an earn/spend wallet. */
export class ProvisionalProgress {
  #cycles = new Map();
  addWindow({cycleId,creatorId,windowId,points,verified}) {
    if (![cycleId,creatorId,windowId].every(x=>typeof x==='string'&&x.length>0)) throw new TypeError('Cycle, creator and window IDs required');
    if(typeof points!=='bigint'||points<0n) throw new RangeError('Points must be nonnegative integer units');
    if(verified!==true) return this.preview(cycleId);
    const current=this.#cycles.get(cycleId);
    if(current && current.creatorId!==creatorId)throw new Error('Cycle creator mismatch');
    const entry=current??{creatorId,windows:new Map()};
    if(!entry.windows.has(windowId))entry.windows.set(windowId,points);
    this.#cycles.set(cycleId,entry);
    return this.preview(cycleId);
  }
  preview(cycleId) {
    const entry=this.#cycles.get(cycleId);
    const points=entry?[...entry.windows.values()].reduce((a,b)=>a+b,0n):0n;
    return Object.freeze({cycleId,creatorId:entry?.creatorId??null,provisionalPoints:points,spendablePoints:0n,settled:false});
  }
  abandon(cycleId) {this.#cycles.delete(cycleId);return this.preview(cycleId);}
}

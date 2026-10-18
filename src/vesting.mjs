/** DRE-15: idempotent cycle vesting only when entire outro and output-evidence continuity are verified. */
export class VestingGate {
  #vested = new Map();
  vest({stationId, occurrenceId, creatorId, startedAtMs, completedAtMs, requiredStartMs, outroEndMs, points, evidenceContinuous, interruptions}) {
    if (![stationId,occurrenceId,creatorId].every(x=>typeof x==='string'&&x.length>0))
      throw new TypeError('Station, occurrence and creator IDs required');
    if (![startedAtMs,completedAtMs,requiredStartMs,outroEndMs].every(Number.isSafeInteger) ||
        requiredStartMs>=outroEndMs || startedAtMs>completedAtMs || startedAtMs<0 || completedAtMs<0 || requiredStartMs<0 || outroEndMs<0)
      throw new RangeError('Invalid occurrence interval');
    if (typeof points!=='bigint'||points<0n)throw new RangeError('Invalid points');
    const id=stationId+':'+occurrenceId;
    if(this.#vested.has(id))return Object.freeze({accepted:false,reason:'already-vested',record:this.#vested.get(id)});
    if (startedAtMs>requiredStartMs || completedAtMs<outroEndMs || evidenceContinuous!==true || interruptions!==false)
      return Object.freeze({accepted:false,reason:'incomplete-cycle',record:null});
    const record=Object.freeze({stationId,occurrenceId,creatorId,points});
    this.#vested.set(id,record);
    return Object.freeze({accepted:true,reason:'vested',record});
  }
  get(stationId,occurrenceId) {return this.#vested.get(stationId+':'+occurrenceId)??null;}
}

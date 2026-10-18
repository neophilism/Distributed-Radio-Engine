/** DRE-13: count only attested, distinct physical output IDs. */
export function aggregateSpeakerEvidence(entries) {
  if (!Array.isArray(entries)) throw new TypeError('Evidence array required');
  const seen=new Map(); let microPoints=0n;
  for(const entry of entries) {
    if(!entry || entry.route!=='speaker' || entry.status!=='verified' ||
       typeof entry.physicalOutputId!=='string' || !entry.physicalOutputId ||
       typeof entry.issuerId!=='string' || !entry.issuerId ||
       typeof entry.microPoints!=='bigint' || entry.microPoints<0n) continue;
    // One physical speaker must not count twice even under different evidence issuers.
    const key=entry.physicalOutputId;
    if(seen.has(key)) {
      if(seen.get(key)!==entry.microPoints) throw new RangeError('Conflicting evidence for one physical output');
      continue;
    }
    seen.set(key,entry.microPoints);microPoints+=entry.microPoints;
  }
  return Object.freeze({microPoints,verifiedOutputs:seen.size});
}

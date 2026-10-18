/** DRE-13: count only attested, distinct physical output IDs. */
export function aggregateSpeakerEvidence(entries) {
  if (!Array.isArray(entries)) throw new TypeError('Evidence array required');
  const seen=new Set(); let microPoints=0n;
  for(const entry of entries) {
    if(!entry || entry.route!=='speaker' || entry.status!=='verified' ||
       typeof entry.physicalOutputId!=='string' || !entry.physicalOutputId ||
       typeof entry.issuerId!=='string' || !entry.issuerId ||
       typeof entry.microPoints!=='bigint' || entry.microPoints<0n) continue;
    // One physical speaker must not count twice even under different evidence issuers.
    const key=entry.physicalOutputId;
    if(seen.has(key))continue;
    seen.add(key);microPoints+=entry.microPoints;
  }
  return Object.freeze({microPoints,verifiedOutputs:seen.size});
}

/** DRE-12: conservative creator-specific speaker contribution units, not decibel sums. */
export function createContributionPolicy({version, thresholdDb, referenceDb, ceilingDb, maxWindowMs}) {
  if (!Number.isSafeInteger(version)||version<1) throw new RangeError('Version required');
  if (![thresholdDb,referenceDb,ceilingDb].every(Number.isFinite) || thresholdDb < 0 ||
      thresholdDb > referenceDb || referenceDb > ceilingDb || ceilingDb > 120)
    throw new RangeError('Unsafe threshold/reference/ceiling ordering');
  if (!Number.isSafeInteger(maxWindowMs)||maxWindowMs<1||maxWindowMs>60000)
    throw new RangeError('Invalid evidence window');
  return Object.freeze({version,thresholdDb,referenceDb,ceilingDb,maxWindowMs,unit:'micro-reference-seconds'});
}
export function measureContribution({policy,windowMs,conservativeDb,route,evidence}) {
  if (!policy||policy.unit!=='micro-reference-seconds')throw new TypeError('Policy required');
  if (!Number.isSafeInteger(windowMs)||windowMs<=0||windowMs>policy.maxWindowMs)throw new RangeError('Invalid duration');
  if (route!=='speaker'||evidence!=='verified'||!Number.isFinite(conservativeDb)||
      conservativeDb<policy.thresholdDb||conservativeDb>policy.ceilingDb)
    return Object.freeze({points:0n,eligible:false,policyVersion:policy.version});
  const ratio=Math.pow(10,(conservativeDb-policy.referenceDb)/10);
  const scaled=ratio*windowMs*1000;
  if (!Number.isSafeInteger(Math.floor(scaled))||scaled<0)throw new RangeError('Unrepresentable window');
  return Object.freeze({points:BigInt(Math.floor(scaled)),eligible:true,policyVersion:policy.version});
}

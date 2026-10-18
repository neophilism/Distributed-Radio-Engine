/** DRE-17 versioned deterministic default reward price ladder, no payment authorization. */
export function rewardPrice({basePoints, multiplierNumerator=2n, multiplierDenominator=1n, level, maxLevel=64}) {
  if(typeof basePoints!=='bigint'||basePoints<=0n)throw new RangeError('Positive base point price required');
  if(typeof multiplierNumerator!=='bigint'||typeof multiplierDenominator!=='bigint'||multiplierDenominator<=0n||multiplierNumerator<=multiplierDenominator)
    throw new RangeError('Multiplier must exceed one');
  if(!Number.isSafeInteger(level)||level<0||!Number.isSafeInteger(maxLevel)||maxLevel<0||maxLevel>64||level>maxLevel)
    throw new RangeError('Level outside bounded ladder');
  const price=basePoints*multiplierNumerator**BigInt(level)/multiplierDenominator**BigInt(level);
  if(price<=0n)throw new RangeError('Price underflows configured precision');
  return Object.freeze({level,points:price,kind:'quoted',spendAuthorized:false});
}

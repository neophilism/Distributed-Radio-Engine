/** DRE-21 positive-tail rarity weights, not a live grant or RNG. */
export function rarityWeights({tiers,base=2n,maxTiers=128}) {
  if(!Number.isSafeInteger(tiers)||tiers<1||tiers>maxTiers||!Number.isSafeInteger(maxTiers)||maxTiers<1||maxTiers>128)
    throw new RangeError('Invalid bounded tier count');
  if(typeof base!=='bigint'||base<2n||base>100n)throw new RangeError('Invalid rarity base');
  // Weight_i = base^(tiers-1-i) gives positive integer support to every tier.
  const weights=Array.from({length:tiers},(_,i)=>base**BigInt(tiers-1-i));
  const total=weights.reduce((a,b)=>a+b,0n);
  return Object.freeze({weights:Object.freeze(weights),total,hasPositiveTail:weights.every(w=>w>0n)});
}
export function selectRarityTier({weights,total},draw) {
  if(!Array.isArray(weights)||weights.length===0||typeof total!=='bigint'||total<=0n||typeof draw!=='bigint'||draw<0n||draw>=total)
    throw new RangeError('Invalid auditable draw');
  let cursor=0n;
  for(let i=0;i<weights.length;i++) {
    if(typeof weights[i]!=='bigint'||weights[i]<=0n)throw new RangeError('Nonpositive tier');
    cursor+=weights[i];if(draw<cursor)return i;
  }
  throw new RangeError('Weights and draw total inconsistent');
}

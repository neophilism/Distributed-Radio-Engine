# Creator point ledger boundary (DRE-16)

The in-process `CreatorPointLedger` is an exact-BigInt, per-creator transaction-domain prototype. Its synchronous map update rejects negative balances, conflicting replays and unauthorized creator cross-spend by construction. It is **not** a durable, multi-process, production transactional wallet or authoritative rewards account.

Before production, use a database with an atomic unique constraint on (creatorId, source, entryId), serializable balance updates and durable signed attestation linkage to DRE-15 vesting. Add authorization, audit, reversals, migration, concurrency, crash recovery, payout controls, and end-to-end privacy verification. Never credit provisional or unverified speaker evidence.

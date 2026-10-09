# Distributed Radio Engine

Reusable general radio infrastructure consuming Distributed Audio Engine; TrackZero is one client. It supports music, news, documentaries, talk shows and organization-owned stations with broadcaster-set linear sequences.

This layer owns creator attribution, station schedule compilation, required opening/closing identifications, shared reward markers, verified output contribution policies, provisional/vested/spent creator-specific points, separate bonus catalogs, exponential pricing/rarity and wallet/entitlement transactions. It owns no venue, exact-location or event-permit policy. Its API never exposes a consumer-selected next-song command.

See the TrackZero product specification and 28-item development plan for exact radio reward semantics. Those semantics are generic content/creator contracts here; TrackZero owns the LOCKED-to-UNLOCKED animation and music-oriented language. Acoustic evidence and playback primitives remain in the underlying audio engine.

Protected assets/manifests/controls are endpoint encrypted. Scheduling services can operate on intentionally disclosed timing/routing metadata without holding media keys. Point adjudication can receive minimal signed decision evidence as an explicit authorized endpoint; it cannot silently inspect ambient recordings or enroll itself as a media recipient. Persistent completion/wallet state uses creator-specific routing and encryption with declared business metadata.

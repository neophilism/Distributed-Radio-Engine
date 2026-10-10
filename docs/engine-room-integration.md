# Engine Room integration

This manifest describes the owner's approved **28 roadmap packages**, DRE-01 through DRE-28, using a planned one-package/one-feature-PR mapping for Engine Room's current count-oriented schema. GitHub PR #1 was a planning-only PR; the first implementation feature PR is #2 = DRE-01. **PR numbers and roadmap IDs must not be matched by ordinal guesses**, as hardening PRs may be introduced.

Engine Room's GitHub App must discover the repository and import this approved manifest, then map feature PRs to roadmap units only from explicit verified evidence. Counting a merge as a completed roadmap item without a verified mapping is inaccurate.

Current explicit mapping:
- DRE-01: GitHub PR #2 (merged)
- DRE-02: GitHub PR #3 (merged)
- DRE-03: GitHub PR #4 (checks/merge should be read live)
- DRE-04: GitHub PR #5 (checks/merge should be read live)
- DRE-05: GitHub PR #6 (checks/merge should be read live)
- DRE-06: GitHub PR #7 (checks/merge should be read live)
- DRE-07: GitHub PR #8 (checks/merge should be read live)
- DRE-08: GitHub PR #9 (checks/merge should be read live)

The manifest is not a deployment certificate. Report distinct fields for planning, implementation, tests, deployment and secure/device/field assurance. Do not convert an unknown device or independent-review result to passed. Engine Room's scheduler credentials and service availability must be separately verified before claiming near-real-time monitoring.

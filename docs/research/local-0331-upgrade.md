# Custom 0.3.3.1 migration

Official release: https://github.com/sganggs/Stronghold-Protocol/releases/tag/v0.3.3

- Previous custom branch: `c90407ae` (`v0.3.0.1`).
- Official base: `f07b8965061bbc311ad7aa815879b09264a1e47d` (`v0.3.3`, released 2026-10-25).
- Source delta since official 0.3.0: 1248 files, 168717 insertions, 11544 deletions.
- Version: `0.3.3.1`, retaining both source histories on `test`.

## Compatibility

| Area | Official update | Custom integration |
|---|---|---|
| Official versions | Four official periods, room votes, version match hosts | Preserve version identity/rules and all wire options; forward `endless` alongside them |
| Room and briefing | Redesigned seat cards/settings and extracted MatchEnemies component | Retain custom Ultimate controls and use the published boss round in the new component |
| Rules | Shop slot/cross-version icon/bench-swap fixes, settlement and operator fixes | Preserve upstream changes and exact generated data |
| Promotion | Three-copy official records and explicit overrides | Retain two-copy ordinary records in all versions; explicit counts/plugin overrides take precedence |
| Ultimate | Default official built-in modes | Retain 20–100 rounds and compounded growth; plugin-added modes keep their schedules; changes blocked during version votes |
| Personnel document | Official effect data | Retain +1 per use to 13; generated text overridden at display time |
| Dependencies | Runtime dependencies and lockfile unchanged | Reuse installed dependencies, regenerate vendor files with Node 22 |
| Packaging | Official package/update tooling | Retain four-part app versions; old local ZIP artifacts remain untouched and untracked |

[ASSUMED] Retain owner-authorized R15 / HP +20% / ATK +10% compounded defaults, the repeated last ordinary template
and the seeded faction cycle. These custom rules are intentional deviations. No extracted game art is committed.
Historical upstream regression fixtures that require a held pair explicitly opt into `makeThreeCopyMatch`;
custom tests and golden matches continue to exercise two-copy production defaults.

## Validation

- Node 22.23.3; the dependency lock matches 0.3.0.1 except the root version, so no dependency installation was needed.
- CI setup, smoke, guards, lint, imports and typecheck: all six steps passed.
- Initial targeted tests (custom rounds, lobby, update/version parsing, real plugin child): 48 passed, zero failed,
  one optional test skipped (49 tests, 32196 ms).
- Updated docs/custom rules/lobby/golden coverage tests: 57 passed, zero failed (1759 ms).
- Browser custom-room test: one passed, zero failed (17983 ms): 50 preset, 37 custom rounds,
  R16 / HP25% / ATK12%, repeated-document description and the new briefing component, no page errors.
- Strict i18n: en/ja/ko/zh-TW each 2346/2346 translated, zero missing/errors.
- Generated data matches upstream exactly. All 999 generated golden scenarios record zero engine errors.
- Fresh golden comparisons all passed: 289 default (343449 ms), 270 第二期上半 (235883 ms),
  221 第一期下半 (165203 ms), 219 第一期上半 (159283 ms), each with two workers.
- Final full collection: `tests 10194 / suites 656 / pass 10095 / fail 0 / cancelled 0 / skipped 99`
  (1008623 ms). All files from the CI test collection ran with four workers; optional browser/asset suites
  were disabled, with the custom-room browser scenario independently enabled and verified above.
- New version-host, advisor and bench-swap regressions: 75 passed, zero failed (5268 ms).
  Normal-room options omit the custom field; only ABYSS passes it. Bench-swap fixtures read the real merge count,
  so all four versions also verify two-copy merging at a full bench. Advisor fixtures that require singles to
  remain unprotected explicitly use the official three-copy test data. Replay checks retain production defaults.
- Advisor/replay follow-up: 38 passed, zero failed (1798 ms).
- Real-time co-op, historical operator traits, room version voting, record lookups and default-state guards
  pass in the final full collection. Item text assertions preserve the raw effect record. The accelerated
  real-time fixture has its own rate budget; production network limits are unchanged.

## Custom golden moves relative to official v0.3.3

The 79 changed digests consist of 69 full matches (earlier two-copy promotions, plus the retained extended
Ultimate schedule/curve where applicable) and ten default-version Ultimate boss fields (custom leader HP growth).
Each version also retains the seed-2 unowned-roster companion from this branch: four additional scenarios,
while every original upstream seed stays in the corpus. The other families stay identical to official v0.3.3.
The complete lists below distinguish intended custom moves from the upstream gameplay fixes already in v0.3.3.

```text
test/golden/act1autochess/bonds.json: 36 scenarios, 0 moved, 0 added.
test/golden/act1autochess/diy.json: 95 scenarios, 0 moved, 0 added.
test/golden/act1autochess/fields.json: 20 scenarios, 0 moved, 0 added.
test/golden/act1autochess/matches.json: 17 scenarios, 16 moved, 1 added.
- solo-FUNNY-1
- solo-FUNNY-2
- solo-NORMAL-1
- solo-NORMAL-2
- solo-HARD-1
- solo-HARD-2
- coop2-NORMAL-3
- coop2-HARD-4
- coop4-FUNNY-6
- coop2-NORMAL-8-serverrun
- solo-HARD-9-boosted
- coop2-NORMAL-14-standins
- coop2-NORMAL-70-diy
- coop2-NORMAL-1-coverage-standins
- coop2-NORMAL-5-coverage-diy
- coop2-NORMAL-1-unowned-roster
- NEW coop2-NORMAL-2-coverage-unowned-roster
test/golden/act1autochess/roster.json: 41 scenarios, 0 moved, 0 added.
test/golden/act1autochess/standins.json: 12 scenarios, 0 moved, 0 added.
test/golden/act1autochess-v1_1/bonds.json: 36 scenarios, 0 moved, 0 added.
test/golden/act1autochess-v1_1/diy.json: 93 scenarios, 0 moved, 0 added.
test/golden/act1autochess-v1_1/fields.json: 20 scenarios, 0 moved, 0 added.
test/golden/act1autochess-v1_1/matches.json: 17 scenarios, 16 moved, 1 added.
- solo-FUNNY-1
- solo-FUNNY-2
- solo-NORMAL-1
- solo-NORMAL-2
- solo-HARD-1
- solo-HARD-2
- coop2-NORMAL-3
- coop2-HARD-4
- coop4-FUNNY-6
- coop2-NORMAL-8-serverrun
- solo-HARD-9-boosted
- coop2-NORMAL-14-standins
- coop2-NORMAL-70-diy
- coop2-NORMAL-1-coverage-standins
- coop2-NORMAL-5-coverage-diy
- coop2-NORMAL-1-unowned-roster
- NEW coop2-NORMAL-2-coverage-unowned-roster
test/golden/act1autochess-v1_1/roster.json: 41 scenarios, 0 moved, 0 added.
test/golden/act1autochess-v1_1/standins.json: 12 scenarios, 0 moved, 0 added.
test/golden/act2autochess-v2_1/bonds.json: 46 scenarios, 0 moved, 0 added.
test/golden/act2autochess-v2_1/diy.json: 126 scenarios, 0 moved, 0 added.
test/golden/act2autochess-v2_1/fields.json: 22 scenarios, 0 moved, 0 added.
test/golden/act2autochess-v2_1/matches.json: 17 scenarios, 16 moved, 1 added.
- solo-FUNNY-1
- solo-FUNNY-2
- solo-NORMAL-1
- solo-NORMAL-2
- solo-HARD-1
- solo-HARD-2
- coop2-NORMAL-3
- coop2-HARD-4
- coop4-FUNNY-6
- coop2-NORMAL-8-serverrun
- solo-HARD-9-boosted
- coop2-NORMAL-14-standins
- coop2-NORMAL-70-diy
- coop2-NORMAL-1-coverage-standins
- coop2-NORMAL-5-coverage-diy
- coop2-NORMAL-1-unowned-roster
- NEW coop2-NORMAL-2-coverage-unowned-roster
test/golden/act2autochess-v2_1/roster.json: 49 scenarios, 0 moved, 0 added.
test/golden/act2autochess-v2_1/standins.json: 10 scenarios, 0 moved, 0 added.
test/golden/bonds.json: 46 scenarios, 0 moved, 0 added.
test/golden/diy.json: 140 scenarios, 0 moved, 0 added.
test/golden/fields.json: 22 scenarios, 10 moved, 0 added.
- boss-boss_2-pair
- boss-boss_2-solo
- boss-boss_4-pair
- boss-boss_4-solo
- boss-boss_6-pair
- boss-boss_6-solo
- hidden-boss_8-pair
- hidden-boss_8-solo
- hidden-boss_10-pair
- hidden-boss_10-solo
test/golden/matches.json: 22 scenarios, 21 moved, 1 added.
- solo-FUNNY-1
- solo-FUNNY-2
- solo-NORMAL-1
- solo-NORMAL-2
- solo-HARD-1
- solo-HARD-2
- solo-ABYSS-1
- solo-ABYSS-2
- coop2-NORMAL-3
- coop2-HARD-4
- coop3-ABYSS-5
- coop4-FUNNY-6
- coop4-ABYSS-7
- coop2-NORMAL-8-serverrun
- solo-HARD-9-boosted
- coop2-ABYSS-10-boosted
- coop2-NORMAL-14-standins
- coop2-NORMAL-70-diy
- coop2-NORMAL-1-coverage-standins
- coop2-NORMAL-5-coverage-diy
- coop2-NORMAL-1-unowned-roster
- NEW coop2-NORMAL-2-coverage-unowned-roster
test/golden/roster.json: 49 scenarios, 0 moved, 0 added.
test/golden/standins.json: 10 scenarios, 0 moved, 0 added.
```

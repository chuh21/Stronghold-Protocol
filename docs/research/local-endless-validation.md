# Local extended Ultimate validation

Owner-requested local variant, implemented 2026-10-14/15. Rules and [ASSUMED] defaults are in
`docs/design/match.md` §6.1 and the local note in `docs/history/0.2.6.md`. The original implementation was prepared locally; release metadata is now `0.2.6.1`.
Generated game data and art were not edited. Existing two-copy operator promotion was preserved.

## Checks

Environment initially had Node 18 and no dependencies. Checks used a checksum-verified Node 22.23.3 in `/tmp`,
locked npm dependencies, and vendored browser libraries. Chrome for Testing 154.0.8037.57 was installed only
in `/tmp` for the optional browser test.

- `node --test test/match/endless.test.js test/lobby-endless.test.js test/match/waves.test.js test/match/finalAssault.test.js`:
  `# tests 40`, `# pass 40`, `# fail 0`. Covers solo/co-op 20/30/40/50/37/100 rounds, populated waves through
  the last ordinary round, moved boss/hidden templates, growth bounds and curves, 50-round phase flow, host
  authority, guest readiness reset, match-option forwarding and host migration.
- `node --test-name-pattern='人事部文档' test/content/items.test.js`: `# tests 1`, `# pass 1`, `# fail 0`.
  Verifies repeated uses 8→9→10→11→12→13 and another use at the cap; actually deploys 13 distinct operators
  through `g.move`, then verifies `BOARD_FULL` for the 14th.
- `SP_E2E=1 CHROME_PATH=<temporary Chrome> node --test test/ui/endless.e2e.test.js`:
  `# tests 1`, `# pass 1`, `# fail 0`. Real server and browser: selects the 50-round preset, enters 37 rounds
  / R16 / HP +25% / ATK +12%, applies, checks synchronized state, starts a match and sees R37 in the briefing;
  the personnel-document text shows 13; no browser page errors.
- `node tools/i18n.mjs check --all --strict`: each of en/ja/ko/zh-TW has 1202/1202 translated,
  `0 missing, 0 errors`. ESLint: 0 errors (existing warnings); typecheck passes; `git diff --check` passes.
- `npm run ci -- --keep-going` was run in full. Setup, smoke, lint, imports and typecheck passed.
  Test snapshot: `# tests 6351`, `# pass 6216`, `# fail 95`, `# skipped 40`. The baseline from the original
  tracked tree was also run: `# tests 6334`, `# pass 6199`, `# fail 95`, `# skipped 40`. This is **not a green
  full-suite result**: old three-copy merge fixtures, fixed official round/config expectations and the missing
  optional `public/fonts/` directory already fail before this work. Baseline packaging/doc failures caused
  by its temporary tree lacking `.git` are not counted as product regressions.
- Failure names were compared, not only totals. The new leader-HP expectation failures were corrected; a
  regression in the test-only `bossHpMul` override was fixed in `finalAssault.bossPoolHp`. The focused rerun
  (`boss-hp-scaling`, `balance`, `playtest6-bosspool`, `playtest6-limits`) reports `# tests 25`, `# pass 24`,
  `# fail 1`: the remaining 烛煌 three-copy fixture failure also appears in the baseline. The isolated
  heavy-boss performance rerun reports `# tests 1`, `# pass 1`, `# fail 0` (the concurrent full run was noisy).
- `node --test test/docs-consistency.test.js test/docs-paths.test.js` was included in full CI and additionally
  run directly. Existing three-copy fixture / missing optional font-directory failures remain; the local
  custom rules, protocol and META documentation were updated. Full CI was not repeated after the focused fixes.

## Golden results

`npm run golden:update`'s underlying command (`node tools/golden.mjs --update`) regenerated all families;
`node tools/golden.mjs` then matched all 287 scenarios:

```text
golden roster: 49 scenarios match
golden bonds: 46 scenarios match
golden fields: 22 scenarios match
golden matches: 20 scenarios match
golden standins: 10 scenarios match
golden diy: 140 scenarios match
ok · 82909 ms (jobs 4)
```

Only `fields.json` and `matches.json` moved. To distinguish this work from earlier local rules, the original
tracked tree was extracted to `/tmp` and its fields/matches were regenerated independently.

New moves relative to that baseline (custom ABYSS stat growth, moved-round enemy picks and leader HP):

- Fields: `boss-boss_2-pair`, `boss-boss_2-solo`, `boss-boss_4-pair`, `boss-boss_4-solo`,
  `boss-boss_6-pair`, `boss-boss_6-solo`, `hidden-boss_8-pair`, `hidden-boss_8-solo`,
  `hidden-boss_10-pair`, `hidden-boss_10-solo`.
- Matches: `solo-ABYSS-1`, `solo-ABYSS-2`, `coop3-ABYSS-5`, `coop4-ABYSS-7`,
  `coop2-ABYSS-10-boosted`.

Before this work, all 20 stored match digests and those same 10 field digests already differed from the user's
modified runtime (two-copy promotions / extended 20-round ABYSS data). Their refreshed digests are retained too.
Those pre-existing match moves are: `solo-FUNNY-1`, `solo-FUNNY-2`, `solo-NORMAL-1`, `solo-NORMAL-2`,
`solo-HARD-1`, `solo-HARD-2`, `solo-ABYSS-1`, `solo-ABYSS-2`, `coop2-NORMAL-3`, `coop2-HARD-4`,
`coop3-ABYSS-5`, `coop4-FUNNY-6`, `coop4-ABYSS-7`, `coop2-NORMAL-8-serverrun`, `solo-HARD-9-boosted`,
`coop2-ABYSS-10-boosted`, `coop2-NORMAL-14-standins`, `coop2-NORMAL-70-diy`,
`coop2-NORMAL-1-coverage-standins`, `coop2-NORMAL-5-coverage-diy`.

## Trying the controls

Use Node 22 or newer to run the server, create a solo/co-op room, select Ultimate and expand the
“终极自定义” panel. Set the round count and growth fields, then press “应用设置” before starting.
Settings are held in the room's memory, preserved between its matches and through host migration,
and cleared when the server restarts. Hidden Core is an optional extra round beyond the chosen total.

## 0.2.6.1 release preparation

Package metadata, APP_VERSION, README and CHANGELOG use `0.2.6.1`. Update metadata accepts an optional
fourth revision; version comparison treats an absent fourth component as zero. Targeted checks:

- `node --test test/version.test.js test/update-package.test.js test/update-boot.test.js test/match/endless.test.js test/lobby-endless.test.js`:
  `# tests 44`, `# pass 44`, `# fail 0`.
- Personnel-document deployment test: `# tests 1`, `# pass 1`, `# fail 0`.
- Changed release/version files: ESLint 0 errors; strict UI translations 0 missing / 0 errors in all packs;
  typecheck and `git diff --check` pass. No battle mechanics changed in this release-metadata step.

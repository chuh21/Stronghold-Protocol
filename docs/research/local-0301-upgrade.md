# Custom 0.3.0.1 migration

Official release: https://github.com/sganggs/Stronghold-Protocol/releases/tag/v0.3.0

- Official 0.2.6 baseline: `488db49f`.
- Previous custom test: `a92cdfbc` (`v0.2.6.1`).
- Official 0.3.0: `c24e17eec3af1e6dedfa9935a6d15245cf2f4586` (2026-10-16).
- Official baseline delta: 807 files, 111918 insertions, 9489 deletions.
- Custom version: `0.3.0.1` on `test`; source integration retains both histories.

## Changes and compatibility

| Area | Official 0.3.0 | Custom integration |
|---|---|---|
| Plugins | Content/visual sets, room modes, studio, DSL, script sandbox, UI plugins | Preserve official code and defaults; no plugin installed or script execution enabled by this migration |
| Match execution | Separate gameplay-plugin child process / optional worker, content hashes | Preserve cs/vs/requireCs and add endless to the IPC option whitelist |
| Round rules | Official templates and mode-level global overrides | Preserve source JSON exactly; build 20–100 Ultimate rounds at runtime |
| Plugin modes | Inherited and custom schedules | Do not impose Ultimate rounds on plugin-added modes; hide/reject the custom control there |
| Promotion | Official three-copy defaults plus record overrides | Keep two copies for ordinary official operators; honor explicit overrides and plugin record counts |
| Deployment | Original personnel-document rule | Keep +1 per use, max 13 and localized explanation |
| UI/assets | Official effects, import assets, battle statistics and hover controls | Preserve official UI and custom Ultimate form together; additional official effects require matching v0.3.0 assets |
| Economy | Queued temporary overflow, displayed item-stock debt, DIY stock changes | Preserve upstream logic, including extended temp inventory |
| Dependencies | Adds SES 2.3.0 and Acorn 8.18.0 | Install the upstream lockfile; only the root application version changes |
| Release/update | Official packaging changes, including asset-pack export | Retain optional fourth revision parsing/comparison; current version 0.3.0.1 |

[ASSUMED] defaults retained: growth from R15, HP +20% / ATK +10% compounded, extra ordinary rounds
reuse the last normal template and cycle the seeded faction schedule. No official art is committed.
The existing local `Stronghold-Protocol-v0.2.6.1-update.zip` is left untouched and excluded from source staging.

## Validation

- `npm ci`: 200 packages installed, 201 audited, zero vulnerabilities reported.
- `npm run ci -- --keep-going --only setup,smoke,lint,imports,typecheck`: all five steps passed.
- `node --test --test-concurrency=4`: 7615 tests, 569 suites; 7562 passed, zero failed,
  zero cancelled, 53 skipped (736834 ms). Optional browser/asset/raw-client-data suites remain opt-in;
  the custom UI browser suite was run separately as noted below.
- `node test/match/endless.test.js`: 19 tests passed, zero failures. Includes real stock accounting,
  deployed-tile/equipment preservation, queued overflow, custom mode inheritance and 50-round match flow.
- Real gameplay-plugin child: custom 50-round settings, content identity and zero diagnostic errors passed.
- Personnel document: repeated increases to 13, 13 actual deployments and refusal of a 14th passed.
- `SP_E2E=1 ... node --test test/ui/endless.e2e.test.js`: one browser test passed (50 preset,
  37-round custom form, R16 / HP25% / ATK12%, briefing and localized personnel text, no page errors).
- `node tools/i18n.mjs check --all --strict`: en/ja/ko/zh-TW each 1774/1774 strings, zero missing/errors.
- `npm run golden`: 289 scenarios match, zero failures (132304 ms, four workers).
- Generated `data/` matches upstream exactly; `git diff --check` passed.

Migration also corrects hard-coded boss/hidden-round assumptions to use the active GameData schedule. The first
13 opening waves retain their original briefing distribution under the extended mode. The plugin importer language
collision fixture uses distinct file paths so it reaches language canonicalization rather than archive path rejection.
The reconnect/content test controls async content arrival with a deferred promise, avoiding a race between a real
0-ms timer and the virtual battle clock; all 17 plugin-content tests pass. Docs consistency/path checks: 32 passed.

Official historical fixtures that require two unmerged normal copies explicitly use `makeThreeCopyMatch`.
It applies the supported `economy.mergeCountOverrides` to the test's data without changing production defaults,
so the upstream regression scenario (for example third-copy promotion or queued overflow) stays meaningful.
All other `makeMatch` callers and the golden corpus retain the custom two-copy rule. New custom regression
cases independently test two-copy promotion and overflow. Language/plugin manifests retain upstream three-part
semver ranges (`>=0.3.0`); the application release/update version remains `0.3.0.1` and matches those ranges.

## Golden moves relative to official v0.3.0

The ten field digests move because the Ultimate leader HP pool uses the retained custom late-round curve.
All 21 existing full-match digests move because of earlier two-copy promotions; Ultimate matches also use the
extended schedule/curve. The remaining four families do not move. Seed 1 remains as an outcome regression;
a seed-2 unowned-roster companion restores multiple stand-in coverage under two-copy promotion. DIY coverage
looks up the normal slot for an earlier-promoted elite rather than assuming the deployed record is normal.

```text
roster: 49 scenarios; 0 moved; 0 added.
bonds: 46 scenarios; 0 moved; 0 added.
fields: 22 scenarios; 10 moved; 0 added.
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
matches: 22 scenarios; 21 moved; 1 added.
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
standins: 10 scenarios; 0 moved; 0 added.
diy: 140 scenarios; 0 moved; 0 added.
```

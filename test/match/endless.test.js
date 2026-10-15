import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameData } from '../../server/match/gamedata.js';
import { createRng } from '../../server/sim/rng.js';
import { setupMatchWaves, buildNormalWave, buildBossWave } from '../../server/match/waves.js';
import { ENDLESS_DEFAULTS, validEndlessOptions } from '../../shared/endless.js';
import { validateC2S } from '../../shared/protocol.js';
import { DATA, makeMatch } from './harness.js';

test('custom settings reject malformed, non-finite and out-of-range values', () => {
  assert.equal(validateC2S({ t: 'room.setEndless', options: ENDLESS_DEFAULTS }), null);
  for (const bad of [null, [], {}, { ...ENDLESS_DEFAULTS, rounds: 19 }, { ...ENDLESS_DEFAULTS, rounds: 101 },
    { ...ENDLESS_DEFAULTS, rounds: 30.5 }, { ...ENDLESS_DEFAULTS, hpGrowth: Infinity },
    { ...ENDLESS_DEFAULTS, atkGrowth: -1 }, { ...ENDLESS_DEFAULTS, growthStart: 1 },
    { ...ENDLESS_DEFAULTS, growthStart: '15' }, { ...ENDLESS_DEFAULTS, extra: true }]) {
    assert.equal(validEndlessOptions(bad), false);
    assert.notEqual(validateC2S({ t: 'room.setEndless', options: bad }), null);
  }
});

for (const mode of ['single', 'multi']) for (const rounds of [20, 30, 40, 50, 37, 100]) {
  test(`${mode} ABYSS: ${rounds} rounds have populated waves, final and hidden templates and a stable opening`, () => {
    const modeId = `mode_${mode}_abyss`;
    const gd = new GameData(DATA, modeId, { ...ENDLESS_DEFAULTS, rounds });
    const original = JSON.stringify(DATA.config.modes[modeId]);
    assert.equal(gd.bossRound, rounds);
    assert.equal(gd.lastRound, rounds);
    assert.equal(gd.hiddenRound, rounds + 1);
    const setup = setupMatchWaves(gd, createRng(21));
    const normal = setupMatchWaves(new GameData(DATA, modeId), createRng(21));
    assert.deepEqual(setup.picks.slice(0, 16), normal.picks.slice(0, 16));
    for (let r = 1; r < rounds; r++) {
      const wave = buildNormalWave(gd, createRng(r), setup.factions, r);
      assert.ok(wave.pick?.key, `R${r}: enemy pick`);
      assert.ok(wave.spawns.length > 0, `R${r}: enemies`);
      assert.ok(wave.timeLimit > 0);
      assert.equal(gd.roundCfg(r).isBoss, false);
      if (r <= 14) assert.deepEqual(gd.enemyScale(r), gd.baseEnemyScale(r));
    }
    for (const [r, bossId, hidden] of [[rounds, setup.bossId, false], [rounds + 1, setup.hiddenBossId, true]]) {
      const wave = buildBossWave(gd, createRng(r), setup.factions, r, { bossId, hidden, solo: mode === 'single' });
      assert.ok(wave.templateId && DATA.waves[wave.templateId]);
      assert.ok(wave.spawns.some(s => s.enemyKey === gd.boss(bossId).enemyKey));
    }
    assert.equal(JSON.stringify(DATA.config.modes[modeId]), original, 'frozen source data unchanged');
  });
}

test('late-round HP/ATK growth compounds from the chosen anchor and scales both boss pools', () => {
  const gd = new GameData(DATA, 'mode_multi_abyss', { rounds: 50, growthStart: 15, hpGrowth: 30, atkGrowth: 20 });
  const base = gd.baseEnemyScale(14);
  for (const r of [15, 16, 30, 50, 51]) {
    const scale = gd.enemyScale(r);
    assert.ok(Math.abs(scale.hpMul / base.hpMul - 1.3 ** (r - 14)) < 1e-6);
    assert.ok(Math.abs(scale.atkMul / base.atkMul - 1.2 ** (r - 14)) < 1e-6);
    assert.equal(scale.speedMul, base.speedMul);
  }
  const id = 'boss_1';
  const hp = DATA.bosses[id].bloodPoint.ABYSS * 2;
  assert.equal(gd.bossPoolHp(id, 2, 50), Math.round(hp * gd.growthFactor(50, 'hpGrowth')));
  assert.equal(gd.bossPoolHp(id, 2, 51), Math.round(hp * gd.growthFactor(51, 'hpGrowth')));
  const flat = new GameData(DATA, 'mode_single_abyss', { rounds: 50, growthStart: 20, hpGrowth: 0, atkGrowth: 0 });
  assert.deepEqual(flat.enemyScale(50), flat.baseEnemyScale(14));
  const early = new GameData(DATA, 'mode_single_abyss', { rounds: 50, growthStart: 10, hpGrowth: 20, atkGrowth: 10 });
  assert.equal(early.enemyScale(10).hpMul, early.baseEnemyScale(9).hpMul * 1.2);
  assert.equal(new GameData(DATA, 'mode_single_hard', { ...ENDLESS_DEFAULTS, rounds: 50 }).endless, null);
});

for (const mode of ['solo', 'coop']) {
  test(`${mode}: 50-round match reaches moved Final Assault and Hidden Core and publishes settings`, () => {
    const h = makeMatch({ mode, difficulty: 'ABYSS', endless: { ...ENDLESS_DEFAULTS, rounds: 50 },
      humans: mode === 'coop' ? 2 : 1,
      fake: true, captureFrames: false, script: b => b.kind === 'boss' || b.kind === 'hidden' ? { bossDps: 1e15 } : {} });
    try {
      h.start();
      h.toPrep(50);
      for (const ps of h.m.players.values()) {
        ps.lp = 1000;
        ps.bondCountBonus.yanShip = 3;
        ps.layers.yanShip = 601;
        ps.recompute();
      }
      assert.equal(h.m.round, 50);
      assert.equal(h.m.gd.roundCfg(50).isBoss, true);
      assert.ok(h.bc.some(f => f.t === 'm.public' && f.bossRound === 50 && f.hiddenRound === 51 && f.endless.rounds === 50));
      h.toPrep(51);
      assert.equal(h.m.gd.roundCfg(51).isHidden, true);
      assert.deepEqual(h.logs.error, []);
    } finally { h.m.dispose(); }
  });
}

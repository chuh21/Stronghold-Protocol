import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GameData } from '../../server/match/gamedata.js';
import { createRng } from '../../server/sim/rng.js';
import { setupMatchWaves, buildNormalWave, buildBossWave } from '../../server/match/waves.js';
import { ENDLESS_DEFAULTS, validEndlessOptions } from '../../shared/endless.js';
import { validateC2S } from '../../shared/protocol.js';
import { DATA, makeMatch } from './harness.js';
import { wireOptions } from '../../server/match/host/proxy.js';
import { getVersionData } from '../../server/data.js';
import { VERSIONS } from '../../shared/versions.js';

test('0.3.3 official versions keep two-copy promotion without modifying their generated records', () => {
  for (const version of VERSIONS) {
    const raw = getVersionData(version.id);
    const c = Object.values(raw.chess).find(c => c.visible && !c.isGolden && c.upgradeNum === 3);
    assert.ok(c, version.id);
    const gd = new GameData(raw, 'mode_single_normal');
    assert.equal(gd.mergeCount(c.chessId), 2, version.id);
    assert.equal(c.upgradeNum, 3, 'source data stays official');
    if (version.dir) assert.equal(gd.endless, null);
  }
});

test('default two-copy promotion keeps the deployed tile, equipment and actual stock accounting', () => {
  const h = makeMatch({ mode: 'solo', fake: true }).start().toPrep(1);
  try {
    const m = h.m, ps = h.ps('p_0'), id = 'chess_char_1_06_a';
    for (const p of ps.allChess()) ps.returnCopies(p);
    ps.board.clear(); ps.hand.fill(null); ps.temp.fill(null); ps.bandId = null; ps.recompute();
    h.setStage('act2autochess_m04');
    assert.equal(m.gd.mergeCount(id), 2);
    const cap = m.pool.left(id);
    const first = ps.acquireChess(id, { silent: true });
    assert.deepEqual(m.handle(ps.playerId, { t: 'g.move', uid: first.uid, to: { area: 'board', row: 9, col: 3 }, dir: 'UP' }), { ok: true });
    const item = ps.acquireItem('chess_item_1_01_e_a', { silent: true });
    assert.deepEqual(ps.equip(item.uid, first.uid), { ok: true });
    const elite = ps.acquireChess(id, { silent: true });
    assert.equal(elite.id, m.gd.goldenIdOf(id));
    assert.equal(ps.board.get('9,3'), elite);
    assert.equal(elite.dir, 'UP');
    assert.equal(ps.find(first.uid), null);
    assert.equal(elite.poolCopies, m.gd.goldenCopies);
    assert.equal(m.pool.left(id), cap - m.gd.goldenCopies);
    assert.ok(ps.hand.includes(item), 'equipment returns to the hand');
    assert.equal(ps.stats.merges, 1);
    assert.deepEqual(ps.sell(elite.uid), { ok: true });
    assert.equal(m.pool.left(id), cap, 'selling returns all copies charged by the existing elite-stock rule');
  } finally { h.m.dispose(); }
});

test('two-copy promotion also merges hidden overflow without losing queued resources', () => {
  const h = makeMatch({ mode: 'solo', fake: true }).start().toPrep(1);
  try {
    const m = h.m, ps = h.ps('p_0'), id = 'chess_char_1_06_a';
    for (const p of ps.allChess()) ps.returnCopies(p);
    ps.board.clear(); ps.hand.fill(null); ps.temp.fill(null); ps.bandId = null; ps.recompute();
    const fillers = Array.from({ length: 24 }, () => ps.acquireItem('chess_item_2_03_e_b', { silent: true }));
    assert.ok(fillers.every(Boolean));
    const first = ps.acquireChess(id, { silent: true });
    assert.ok(ps.temp.indexOf(first) >= 5);
    const elite = ps.acquireChess(id, { silent: true });
    assert.equal(elite.id, m.gd.goldenIdOf(id));
    assert.equal(ps.find(first.uid), null);
    assert.ok(ps.temp.indexOf(elite) >= 5);
    for (const p of fillers) assert.equal(ps.find(p.uid).piece, p);
    assert.equal(ps.temp.filter(Boolean).length, 15);
  } finally { h.m.dispose(); }
});

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

test('0.3.0 host IPC carries custom Ultimate settings, while plugin modes retain their own schedule and globals', () => {
  const options = { ...ENDLESS_DEFAULTS, rounds: 40 };
  const wire = wireOptions({ modeId: 'mode_multi_abyss', endless: options, version: 'act1autochess', soloUnlimited: true, kitted: ['char_102_texas'], send() {} });
  assert.deepEqual(JSON.parse(JSON.stringify(wire)).endless, options);
  assert.equal(wire.version, 'act1autochess');
  assert.equal(wire.soloUnlimited, true);
  assert.deepEqual(wire.kitted, ['char_102_texas']);
  assert.equal('send' in wire, false);
  const customMode = { ...DATA.config.modes.mode_single_abyss, modeId: 'mode_x_demo_abyss', lastRound: 7, bossRound: 7, hiddenRound: null,
    economy: { deployCap: 11, mergeCountOverrides: { chess_char_1_01_a: 4 } } };
  const data = { ...DATA, config: { ...DATA.config, modes: { ...DATA.config.modes, mode_x_demo_abyss: customMode } } };
  const gd = new GameData(data, 'mode_x_demo_abyss', options);
  assert.equal(gd.endless, null);
  assert.equal(gd.lastRound, 7);
  assert.equal(gd.bossRound, 7);
  assert.equal(gd.hiddenRound, null);
  assert.equal(gd.deployCap, 11);
  assert.equal(gd.mergeCount('chess_char_1_01_a'), 4);
  assert.equal(new GameData(DATA, 'mode_single_abyss', wire.endless).lastRound, 40);
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

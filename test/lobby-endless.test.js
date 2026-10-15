import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startServer } from '../server/index.js';
import { StubMatch } from '../server/match/StubMatch.js';
import { TestClient } from './helpers/wsClient.js';
import { ENDLESS_DEFAULTS } from '../shared/endless.js';

test('custom Ultimate settings: host-only, synchronized, reset guest readiness, survive host migration and reach match options', async () => {
  let started;
  class RecordingMatch extends StubMatch {
    constructor(options) { super(options); started = options; }
  }
  const srv = await startServer({ host: '127.0.0.1', port: 0, MatchClass: RecordingMatch,
    log: { info() {}, warn() {}, error() {}, debug() {} } });
  const clients = [];
  const connect = async name => {
    const c = await TestClient.connect(`ws://127.0.0.1:${srv.port}/ws`);
    clients.push(c);
    c.id = (await c.hello(name)).playerId;
    return c;
  };
  const ok = async (c, msg) => assert.equal((await c.request(msg)).t, 'ok');
  try {
    const host = await connect('Host');
    await ok(host, { t: 'room.create', mode: 'coop', difficulty: 'ABYSS' });
    const room = await host.waitFor('room.state');
    assert.deepEqual(room.endless, ENDLESS_DEFAULTS);
    const guest = await connect('Guest');
    await ok(guest, { t: 'room.join', code: room.code });
    await guest.waitFor('room.state');
    const options = { rounds: 50, growthStart: 15, hpGrowth: 30, atkGrowth: 15 };
    assert.equal((await guest.request({ t: 'room.setEndless', options })).code, 'NOT_HOST');
    await ok(guest, { t: 'room.ready', ready: true });
    await host.waitFor('room.state', s => s.seats.some(p => p?.playerId === guest.id && p.ready));
    await ok(host, { t: 'room.setEndless', options });
    const changed = await guest.waitFor('room.state', s => s.endless.rounds === 50);
    assert.deepEqual(changed.endless, options);
    assert.equal(changed.seats.find(p => p?.playerId === guest.id).ready, false);
    await ok(guest, { t: 'room.ready', ready: true });
    await ok(host, { t: 'room.setEndless', options });
    await ok(host, { t: 'room.start' });
    assert.deepEqual(started.endless, options);
    assert.equal((await host.request({ t: 'room.setEndless', options })).code, 'ROOM_STARTED');
    await ok(host, { t: 'g.infoReady' });
    await ok(guest, { t: 'g.infoReady' });
    await guest.waitFor('room.state', s => !s.inMatch && s.endless.rounds === 50);
    await ok(host, { t: 'room.leave' });
    const migrated = await guest.waitFor('room.state', s => s.hostId === guest.id);
    assert.deepEqual(migrated.endless, options);
    await ok(guest, { t: 'room.setDifficulty', difficulty: 'NORMAL' });
    assert.equal((await guest.request({ t: 'room.setEndless', options })).code, 'BAD_TARGET');
    await ok(guest, { t: 'room.setDifficulty', difficulty: 'ABYSS' });
    await guest.waitFor('room.state', s => s.difficulty === 'ABYSS');
  } finally {
    await Promise.all(clients.map(c => c.terminate()));
    await srv.close();
  }
});

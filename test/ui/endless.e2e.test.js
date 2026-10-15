import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';

const chrome = process.env.CHROME_PATH;
test('Ultimate room UI: custom rounds and growth apply, persist, reach the briefing and show the personnel rule', {
  skip: !(process.env.SP_E2E === '1' && chrome && existsSync(chrome)),
}, async () => {
  const { startServer } = await import('../../server/index.js');
  const { default: puppeteer } = await import('puppeteer-core');
  const srv = await startServer({ host: '127.0.0.1', port: 0, quiet: true });
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.evaluateOnNewDocument(() => {
      localStorage.setItem('sp.name', 'Doctor');
      sessionStorage.setItem('sp.entered', '1');
    });
    await page.goto(`http://127.0.0.1:${srv.port}/`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('.lobby-screen');
    await page.evaluate(async () => {
      const { net } = await import('/js/net.js');
      await net.request('room.create', { mode: 'solo', difficulty: 'ABYSS' });
    });
    await page.waitForSelector('.endless-settings summary');
    await page.click('.endless-settings summary');
    await page.click('.endless-settings__presets button:nth-child(4)');
    const setNumber = async (index, value) => {
      await page.$$eval('.endless-settings input', (inputs, i, v) => {
        inputs[i].value = String(v); inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
      }, index, value);
    };
    await setNumber(0, 37);
    await setNumber(1, 16);
    await setNumber(2, 25);
    await setNumber(3, 12);
    await page.click('.endless-settings button[type="submit"]');
    await page.waitForFunction(() => document.querySelector('.endless-settings summary').textContent.includes('37'));
    const settings = await page.evaluate(async () => (await import('/js/store.js')).store.get().room.endless);
    assert.deepEqual(settings, { rounds: 37, growthStart: 16, hpGrowth: 25, atkGrowth: 12 });
    await page.evaluate(async () => {
      const { data } = await import('/js/data.js');
      await data.loadAll('items');
      window.__personnelText = data.lookup('items', 'chess_item_6_08_e_a').desc;
    });
    assert.match(await page.evaluate(() => window.__personnelText), /13/);
    await page.evaluate(async () => (await import('/js/net.js')).net.request('room.start', {}));
    await page.waitForSelector('.brief-boss__when');
    assert.match(await page.$eval('.brief-boss__when', e => e.textContent), /37/);
    assert.deepEqual(errors, []);
  } finally {
    await browser?.close();
    await srv.close();
  }
});

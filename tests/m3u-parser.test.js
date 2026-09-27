const { test } = require('node:test');
const assert = require('node:assert/strict');
const M3UParser = require('../src/js/m3u-parser.js');

test('M3U Parser', async (t) => {
  await t.test('Empty playlist', () => {
    const result = M3UParser.parseM3U('');
    assert.equal(result.channels.length, 0);
    assert.equal(result.stats.validChannels, 0);
  });

  await t.test('Simple channel', () => {
    const m3u = '#EXTM3U\n#EXTINF:-1,Test Channel\nhttp://example.com/stream.m3u8';
    const result = M3UParser.parseM3U(m3u);
    assert.equal(result.channels.length, 1);
    assert.equal(result.channels[0].name, 'Test Channel');
    assert.equal(result.channels[0].url, 'http://example.com/stream.m3u8');
  });

  await t.test('Channel with tvg attributes', () => {
    const m3u = '#EXTM3U\n#EXTINF:-1 tvg-id="123" tvg-name="Channel 1" tvg-logo="http://logo.png" group-title="Sports",Test\nhttp://example.com/stream.m3u8';
    const result = M3UParser.parseM3U(m3u);
    assert.equal(result.channels.length, 1);
    assert.equal(result.channels[0].tvgId, '123');
    assert.equal(result.channels[0].tvgName, 'Channel 1');
    assert.equal(result.channels[0].tvgLogo, 'http://logo.png');
    assert.equal(result.channels[0].groupTitle, 'Sports');
  });

  await t.test('Channel without logo', () => {
    const m3u = '#EXTM3U\n#EXTINF:-1 tvg-name="Channel",Test\nhttp://example.com/stream.m3u8';
    const result = M3UParser.parseM3U(m3u);
    assert.equal(result.channels.length, 1);
    assert.equal(result.channels[0].tvgLogo, '');
  });

  await t.test('Channel without group', () => {
    const m3u = '#EXTM3U\n#EXTINF:-1,Test Channel\nhttp://example.com/stream.m3u8';
    const result = M3UParser.parseM3U(m3u);
    assert.equal(result.channels.length, 1);
    assert.equal(result.channels[0].groupTitle, 'Sem categoria');
  });

  await t.test('Special characters in name', () => {
    const m3u = '#EXTM3U\n#EXTINF:-1,Café & Irmãos - 🎬\nhttp://example.com/stream.m3u8';
    const result = M3UParser.parseM3U(m3u);
    assert.equal(result.channels.length, 1);
    assert.equal(result.channels[0].name, 'Café & Irmãos - 🎬');
  });

  await t.test('Multiple channels', () => {
    const m3u = `#EXTM3U
#EXTINF:-1,Channel 1
http://example.com/1.m3u8
#EXTINF:-1,Channel 2
http://example.com/2.m3u8
#EXTINF:-1,Channel 3
http://example.com/3.m3u8`;
    const result = M3UParser.parseM3U(m3u);
    assert.equal(result.channels.length, 3);
  });

  await t.test('Invalid lines mixed in', () => {
    const m3u = `#EXTM3U
#EXTINF:-1,Channel 1
http://example.com/1.m3u8
#Invalid line here
#EXTINF:-1,Channel 2
http://example.com/2.m3u8`;
    const result = M3UParser.parseM3U(m3u);
    assert.equal(result.channels.length, 2);
  });

  await t.test('Fields missing', () => {
    const m3u = '#EXTM3U\n#EXTINF:-1\nhttp://example.com/stream.m3u8';
    const result = M3UParser.parseM3U(m3u);
    assert.equal(result.channels.length, 1);
    assert.equal(result.channels[0].name, 'Sem nome');
  });

  await t.test('Invalid URL (no http/https)', () => {
    const m3u = '#EXTM3U\n#EXTINF:-1,Channel\nftp://example.com/stream.m3u8';
    const result = M3UParser.parseM3U(m3u);
    assert.equal(result.channels.length, 0);
    assert.ok(result.errors.length > 0);
  });

  await t.test('Duplicate by ID', () => {
    const m3u = `#EXTM3U
#EXTINF:-1 tvg-id="123",Channel 1
http://example.com/1.m3u8
#EXTINF:-1 tvg-id="123",Channel 2
http://example.com/2.m3u8`;
    const result = M3UParser.parseM3U(m3u);
    assert.equal(result.channels.length, 1);
    assert.equal(result.stats.duplicateCount, 1);
  });

  await t.test('Duplicate by URL', () => {
    const m3u = `#EXTM3U
#EXTINF:-1,Channel 1
http://example.com/stream.m3u8
#EXTINF:-1,Channel 2
http://example.com/stream.m3u8`;
    const result = M3UParser.parseM3U(m3u);
    assert.equal(result.channels.length, 1);
  });

  await t.test('URL without EXTINF', () => {
    const m3u = `#EXTM3U
http://orphaned.com/stream.m3u8
#EXTINF:-1,Channel
http://example.com/stream.m3u8`;
    const result = M3UParser.parseM3U(m3u);
    assert.equal(result.channels.length, 1);
    assert.ok(result.errors.length > 0);
  });
});

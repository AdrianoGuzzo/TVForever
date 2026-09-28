/**
 * Channel Service tests
 */

const ChannelService = require('../src/js/channel-service.js');

// Test data
const mockChannels = [
  {
    id: 'ch1',
    name: 'Globo',
    groupTitle: 'Brasil',
    tvgId: 'globo.br',
    tvgName: 'Globo',
    tvgLogo: '',
    url: 'http://example.com/globo'
  },
  {
    id: 'ch2',
    name: 'SBT',
    groupTitle: 'Brasil',
    tvgId: 'sbt.br',
    tvgName: 'SBT',
    tvgLogo: '',
    url: 'http://example.com/sbt'
  },
  {
    id: 'ch3',
    name: 'Band',
    groupTitle: 'Brazil - Aberta',
    tvgId: 'band.br',
    tvgName: 'Band',
    tvgLogo: '',
    url: 'http://example.com/band'
  },
  {
    id: 'ch4',
    name: 'Fox Sports',
    groupTitle: 'Sports',
    tvgId: 'fox.sports',
    tvgName: 'Fox Sports',
    tvgLogo: '',
    url: 'http://example.com/fox'
  },
  {
    id: 'ch5',
    name: 'BBC',
    groupTitle: 'UK',
    tvgId: 'bbc.uk',
    tvgName: 'BBC',
    tvgLogo: '',
    url: 'http://example.com/bbc'
  }
];

// Test suite
const t = require('node:test');
const assert = require('node:assert');

t.describe('ChannelService', () => {
  t.beforeEach(() => {
    // Reset service state before each test
    ChannelService._channels = [];
    ChannelService._byId = {};
    ChannelService._categories = {};
    ChannelService._byCategory = {};
  });

  t.test('setChannels builds indices', () => {
    ChannelService.setChannels(mockChannels);

    assert.strictEqual(ChannelService._channels.length, 5, 'Should have 5 channels');
    assert.strictEqual(Object.keys(ChannelService._byId).length, 5, 'Should have 5 channels in index');
  });

  t.test('Identifies Brazilian channels and creates Brasil category', () => {
    ChannelService.setChannels(mockChannels);

    const categories = ChannelService.getCategories();
    const brasilCat = categories.find(c => c.id === '🇧🇷 Brasil');

    assert.ok(brasilCat, 'Should have Brasil category');
    assert.strictEqual(brasilCat.count, 3, 'Should have 3 Brazilian channels');
  });

  t.test('Brasil category appears after Todos but before others', () => {
    ChannelService.setChannels(mockChannels);

    const categories = ChannelService.getCategories();
    const todoIdx = categories.findIndex(c => c.id === '__ALL__');
    const brasilIdx = categories.findIndex(c => c.id === '🇧🇷 Brasil');

    assert.strictEqual(todoIdx, 0, 'Todos should be first');
    assert.strictEqual(brasilIdx, 1, 'Brasil should be second');
  });

  t.test('getChannelsByCategory returns correct Brazilian channels', () => {
    ChannelService.setChannels(mockChannels);

    const brazilChannels = ChannelService.getChannelsByCategory('🇧🇷 Brasil');

    assert.strictEqual(brazilChannels.length, 3, 'Should return 3 Brazilian channels');
    assert.ok(brazilChannels.every(ch => ch.groupTitle === '🇧🇷 Brasil'), 'All should have Brasil as groupTitle');
  });

  t.test('search works with Brazil category filter', () => {
    ChannelService.setChannels(mockChannels);

    const results = ChannelService.search('Globo', { categoryId: '🇧🇷 Brasil' });

    assert.strictEqual(results.length, 1, 'Should find 1 channel');
    assert.strictEqual(results[0].name, 'Globo', 'Should find Globo');
  });

  t.test('Non-Brazilian channels stay in their original categories', () => {
    ChannelService.setChannels(mockChannels);

    const sportsChannels = ChannelService.getChannelsByCategory('Sports');
    const ukChannels = ChannelService.getChannelsByCategory('UK');

    assert.strictEqual(sportsChannels.length, 1, 'Should have 1 Sports channel');
    assert.strictEqual(sportsChannels[0].name, 'Fox Sports', 'Sports channel should be Fox Sports');

    assert.strictEqual(ukChannels.length, 1, 'Should have 1 UK channel');
    assert.strictEqual(ukChannels[0].name, 'BBC', 'UK channel should be BBC');
  });

  t.test('Empty channels list', () => {
    ChannelService.setChannels([]);

    const categories = ChannelService.getCategories();

    assert.strictEqual(categories.length, 1, 'Should only have Todos category');
    assert.strictEqual(categories[0].id, '__ALL__', 'Should be Todos');
    assert.strictEqual(categories[0].count, 0, 'Should have 0 channels');
  });

  t.test('No Brazilian channels', () => {
    const nonBrazilChannels = mockChannels.slice(3); // Only Sports and UK
    ChannelService.setChannels(nonBrazilChannels);

    const categories = ChannelService.getCategories();
    const brasilCat = categories.find(c => c.id === '🇧🇷 Brasil');

    assert.ok(!brasilCat, 'Should not have Brasil category if no Brazilian channels');
  });

  t.test('Case insensitive Brazilian channel detection', () => {
    const testChannels = [
      {
        id: 'ch1',
        name: 'Test 1',
        groupTitle: 'BRASIL',
        tvgId: '',
        tvgName: '',
        tvgLogo: '',
        url: 'http://example.com/1'
      },
      {
        id: 'ch2',
        name: 'Test 2',
        groupTitle: 'BrAsIl',
        tvgId: '',
        tvgName: '',
        tvgLogo: '',
        url: 'http://example.com/2'
      }
    ];

    ChannelService.setChannels(testChannels);

    const categories = ChannelService.getCategories();
    const brasilCat = categories.find(c => c.id === '🇧🇷 Brasil');

    assert.strictEqual(brasilCat.count, 2, 'Should detect Brazilian channels regardless of case');
  });
});

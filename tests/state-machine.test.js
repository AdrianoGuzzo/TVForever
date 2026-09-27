const { test } = require('node:test');
const assert = require('node:assert/strict');
const StateMachine = require('../src/js/state-machine.js');

test('StateMachine', async (t) => {

  await t.test('Initial state is LOADING_PLAYLIST', () => {
    StateMachine._reset();
    assert.equal(StateMachine.getState(), 'LOADING_PLAYLIST');
  });

  await t.test('Valid transition: LOADING_PLAYLIST -> PLAYLIST_LOADED', () => {
    StateMachine._reset();
    StateMachine.dispatch('SUCCESS');
    assert.equal(StateMachine.getState(), 'PLAYLIST_LOADED');
  });

  await t.test('Auto transition: PLAYLIST_LOADED -> CHANNEL_LIST', () => {
    StateMachine._reset();
    StateMachine.dispatch('SUCCESS');
    StateMachine.dispatch('AUTO');
    assert.equal(StateMachine.getState(), 'CHANNEL_LIST');
  });

  await t.test('Invalid transition is ignored', () => {
    StateMachine._reset();
    StateMachine.dispatch('INVALID_EVENT');
    assert.equal(StateMachine.getState(), 'LOADING_PLAYLIST');
  });

  await t.test('Transition with context payload', () => {
    StateMachine._reset();
    StateMachine.dispatch('SUCCESS');
    StateMachine.dispatch('AUTO');
    StateMachine.dispatch('SELECT_CHANNEL', { channelId: '123', categoryId: 'sports' });
    assert.equal(StateMachine.getState(), 'PLAYING');
    const ctx = StateMachine.getContext();
    assert.equal(ctx.channelId, '123');
    assert.equal(ctx.categoryId, 'sports');
  });

  await t.test('PLAYING -> PLAYER_ERROR -> RETRY', () => {
    StateMachine._reset();
    StateMachine.dispatch('SUCCESS');
    StateMachine.dispatch('AUTO');
    StateMachine.dispatch('SELECT_CHANNEL', { channelId: '123' });
    StateMachine.dispatch('ERROR');
    assert.equal(StateMachine.getState(), 'PLAYER_ERROR');
    StateMachine.dispatch('RETRY');
    assert.equal(StateMachine.getState(), 'PLAYING');
  });

  await t.test('PLAYER_ERROR -> BACK', () => {
    StateMachine._reset();
    StateMachine.dispatch('SUCCESS');
    StateMachine.dispatch('AUTO');
    StateMachine.dispatch('SELECT_CHANNEL', { channelId: '123' });
    StateMachine.dispatch('ERROR');
    StateMachine.dispatch('BACK');
    assert.equal(StateMachine.getState(), 'CHANNEL_LIST');
  });

  await t.test('SETTINGS saves returnTo and restores on BACK', () => {
    StateMachine._reset();
    StateMachine.dispatch('SUCCESS');
    StateMachine.dispatch('AUTO');
    StateMachine.dispatch('OPEN_SETTINGS');
    assert.equal(StateMachine.getState(), 'SETTINGS');
    assert.equal(StateMachine.getContext().returnTo, 'CHANNEL_LIST');
    StateMachine.dispatch('BACK');
    assert.equal(StateMachine.getState(), 'CHANNEL_LIST');
  });

  await t.test('PLAYLIST_ERROR -> SETTINGS -> BACK restores error state', () => {
    StateMachine._reset();
    StateMachine.dispatch('FAILED');
    assert.equal(StateMachine.getState(), 'PLAYLIST_ERROR');
    StateMachine.dispatch('OPEN_SETTINGS');
    assert.equal(StateMachine.getState(), 'SETTINGS');
    assert.equal(StateMachine.getContext().returnTo, 'PLAYLIST_ERROR');
    StateMachine.dispatch('BACK');
    assert.equal(StateMachine.getState(), 'PLAYLIST_ERROR');
  });

  await t.test('getContext returns copy, not reference', () => {
    StateMachine._reset();
    StateMachine.dispatch('SUCCESS');
    StateMachine.dispatch('AUTO');
    StateMachine.dispatch('SELECT_CHANNEL', { channelId: '123' });
    const ctx1 = StateMachine.getContext();
    ctx1.channelId = '999';
    const ctx2 = StateMachine.getContext();
    assert.equal(ctx2.channelId, '123');
  });

  await t.test('Full workflow: LOADING -> CHANNEL_LIST -> PLAYING -> BACK -> SETTINGS -> BACK', () => {
    StateMachine._reset();
    StateMachine.dispatch('SUCCESS');
    StateMachine.dispatch('AUTO');
    assert.equal(StateMachine.getState(), 'CHANNEL_LIST');
    StateMachine.dispatch('SELECT_CHANNEL', { channelId: 'ch1' });
    assert.equal(StateMachine.getState(), 'PLAYING');
    StateMachine.dispatch('BACK');
    assert.equal(StateMachine.getState(), 'CHANNEL_LIST');
    StateMachine.dispatch('OPEN_SETTINGS');
    assert.equal(StateMachine.getState(), 'SETTINGS');
    StateMachine.dispatch('BACK');
    assert.equal(StateMachine.getState(), 'CHANNEL_LIST');
  });
});

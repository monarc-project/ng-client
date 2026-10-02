'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const {createPayload, getLaunch, handoffFailureMessage, isHandoffRequest, requiresLogin} = require('../src/ScenarioLaunch');

test('keeps the existing AngularJS route for an asset analysis', () => {
  assert.deepEqual(getLaunch({
    id: 12,
    analysisType: 'asset',
    launchUrl: '#/client/project/12/anr',
    permittedActions: {open: true}
  }), {
    type: 'asset',
    state: 'main.project.anr',
    params: {modelId: 12}
  });
});

test('uses the FrontOffice bridge return path for a scenario analysis', () => {
  assert.deepEqual(getLaunch({
    id: 34,
    analysisType: 'scenario',
    launchUrl: '/scenario/frontoffice',
    permittedActions: {open: true}
  }), {
    type: 'scenario',
    returnPath: '/scenario/frontoffice'
  });
});

test('does not offer a disabled scenario analysis for launch', () => {
  assert.equal(getLaunch({
    id: 34,
    analysisType: 'scenario',
    launchUrl: null,
    permittedActions: {open: false}
  }), null);
});

test('keeps the ordinary empty-analysis inputs while creating a scenario', () => {
  assert.deepEqual(createPayload({
    label: 'Management interview',
    description: 'Known business context',
    language: 2,
    sourceType: 2
  }), {
    label: 'Management interview',
    description: 'Known business context',
    language: 2,
    emptyAnalysis: true,
    analysisType: 'scenario'
  });
});

test('does not create a scenario without the normal required ANR identity', () => {
  assert.equal(createPayload({label: '', language: 2}), null);
});

test('recognises Scenario handoff endpoints without treating all API calls as handoffs', () => {
  assert.equal(isHandoffRequest('api/scenario/v1/auth/bridge/issue'), true);
  assert.equal(isHandoffRequest('/scenario/auth/legacy/consume'), true);
  assert.equal(isHandoffRequest('/api/client-anr/78'), false);
});

test('uses the response message for a failed handoff and a helpful status fallback otherwise', () => {
  assert.equal(handoffFailureMessage({status: 403, data: {error: 'Scenario catalog access is forbidden.'}}),
    'Scenario catalog access is forbidden.');
  assert.equal(handoffFailureMessage({status: 401, data: {}}),
    'Scenario access could not be authorised. Please sign in again and retry.');
});

test('redirects to login only for an explicitly expired MONARC session', () => {
  assert.equal(requiresLogin({
    status: 401,
    data: {error: {code: 'legacy_session_expired'}},
  }), true);
  assert.equal(requiresLogin({status: 401, data: {error: 'Invalid handoff'}}), false);
  assert.equal(requiresLogin({
    status: 403,
    data: {error: {code: 'scenario_access_forbidden'}},
  }), false);
});

'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const ScenarioLaunch = require('../src/ScenarioLaunch');

function loadController() {
  let controller;
  const registration = {
    controller(name, definition) {
      controller = definition.at(-1);
      return registration;
    },
    directive() {
      return registration;
    },
    filter() {
      return registration;
    },
  };
  const context = {
    CreateRiskAnalysisDialog() {},
    ScenarioLaunch,
    angular: {
      copy: (value) => JSON.parse(JSON.stringify(value)),
      extend: Object.assign,
      isDefined: (value) => value !== undefined,
      module: () => registration,
    },
    btoa: (value) => Buffer.from(value, 'binary').toString('base64'),
    document: { getElementById: () => ({ parentElement: { clientWidth: 1 } }) },
    setTimeout,
    Uint8Array,
    window: {
      crypto: { getRandomValues: (bytes) => bytes },
      location: { assign() {} },
    },
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '..', 'src', 'ClientMainCtrl.js'), 'utf8'),
    context,
  );

  return controller;
}

async function flushPromises() {
  await new Promise((resolve) => setImmediate(resolve));
}

test('keeps a created Scenario draft in the registry when its guarded handoff fails', async () => {
  const ClientMainCtrl = loadController();
  const events = [];
  const scope = { $watch() {}, $watchGroup() {} };
  const rootScope = {
    $dialogScope: { $new: () => ({}) },
    $on() {},
    isAllowed: () => true,
  };
  let created = false;
  let payload;
  const ClientAnrService = {
    createEmptyAnr(value, onSuccess) {
      payload = value;
      created = true;
      events.push('created');
      onSuccess({ id: 88 });
    },
    getAnrs() {
      events.push(created ? 'registry-refreshed' : 'initial-registry-load');
      return Promise.resolve({
        anrs: created
          ? [{ id: 88, label: 'Management interview', analysisType: 'scenario', rwd: 0 }]
          : [],
      });
    },
  };
  const toastr = { error: () => events.push('handoff-failed') };
  const dialog = {
    show: () => ({
      then: (onSuccess) => onSuccess({
        label: 'Management interview',
        description: 'Known business context',
        language: 2,
      }),
    }),
  };

  ClientMainCtrl(
    scope,
    rootScope,
    { transitionTo() {} },
    () => ({ close() {}, open() {} }),
    () => true,
    dialog,
    () => {},
    { getString: (value) => value, setCurrentLanguage() {} },
    { isAuthenticated: () => true, reauthenticate: () => false, isAllowed: () => true },
    {},
    ClientAnrService,
    { getValidation: () => Promise.resolve({ isStatsAvailable: false }), updateAnrSettings() {} },
    { getActiveSystemMessages: () => Promise.resolve({ messages: [] }) },
    {},
    toastr,
    {},
    () => {},
    { isScenarioEnabled: () => true },
  );
  await flushPromises();

  scope.openAnalysis = () => toastr.error('The Scenario workspace could not be opened.');
  scope.sidebarCreateScenario();
  await flushPromises();

  assert.deepEqual(payload, {
    label: 'Management interview',
    description: 'Known business context',
    language: 2,
    emptyAnalysis: true,
    analysisType: 'scenario',
  });
  assert.ok(events.indexOf('registry-refreshed') < events.indexOf('handoff-failed'));
  assert.deepEqual(scope.scenarioAnalyses, [
    { id: 88, label: 'Management interview', analysisType: 'scenario', rwd: 0 },
  ]);
});

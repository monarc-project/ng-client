'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function loadDialog() {
  const context = {
    angular: {
      forEach(values, callback) {
        Object.keys(values).forEach((key) => callback(values[key], key));
      }
    }
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '..', 'src', 'CreateRiskAnalysisDialog.js'), 'utf8'),
    context
  );

  return context.CreateRiskAnalysisDialog;
}

test('does not request normal-analysis models or referentials for a Scenario draft', () => {
  const CreateRiskAnalysisDialog = loadDialog();
  const scope = {
    $watch() {},
  };
  let modelsRequested = 0;
  let referentialsRequested = 0;

  CreateRiskAnalysisDialog(
    scope,
    {},
    {},
    {},
    {
      getActiveLanguageCodes: () => ({1: 'en'}),
      getLanguages: () => ({1: {code: 'en'}}),
    },
    {getModels: () => { modelsRequested += 1; }},
    {},
    {getReferentials: () => { referentialsRequested += 1; }},
    {emptyAnalysis: true, analysisType: 'scenario', scenarioOnly: true}
  );

  assert.equal(modelsRequested, 0);
  assert.equal(referentialsRequested, 0);
  assert.equal(scope.anr.referentials.length, 0);
});

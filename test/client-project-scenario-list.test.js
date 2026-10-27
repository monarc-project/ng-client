'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

test('renders Scenario analysis rows with the same launch and permission controls as asset analyses', () => {
  const view = fs.readFileSync(path.join(__dirname, '..', 'views', 'client.project.html'), 'utf8');
  const scenarioList = view.slice(view.indexOf("{{ 'Scenario-based' | translate }}"));

  assert.match(scenarioList, /ng-click="openAnalysis\(\$event, anr\)" ng-repeat="anr in scenarioAnalyses"/);
  assert.match(scenarioList, /languages\[anr\['language'\]\]\.flag/);
  assert.match(scenarioList, /<md-icon class="md-primary" aria-label="\{\{ 'Read' \| translate \}\}">visibility<\/md-icon>/);
  assert.match(scenarioList, /<md-icon>edit<\/md-icon>/);
  assert.match(scenarioList, /ng-disabled="!anr\.rwd"/);
  assert.match(scenarioList, /deleteClientAnrGlobal\(\$event, anr\)/);
  assert.match(scenarioList, /<md-icon>delete<\/md-icon>/);
  assert.doesNotMatch(scenarioList, /\{\{ 'Open' \| translate \}\}/);
});

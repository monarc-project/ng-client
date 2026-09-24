(function (root, factory) {
  var scenarioLaunch = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = scenarioLaunch;
  }

  root.ScenarioLaunch = scenarioLaunch;
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function getLaunch(anr) {
    if (!anr || !anr.permittedActions || !anr.permittedActions.open || !anr.launchUrl) {
      return null;
    }

    if (anr.analysisType === 'scenario') {
      return {
        type: 'scenario',
        returnPath: anr.launchUrl
      };
    }

    return {
      type: 'asset',
      state: 'main.project.anr',
      params: {modelId: anr.id}
    };
  }

  function createPayload(anr) {
    if (!anr || typeof anr.label !== 'string' || anr.label.trim() === '' || !anr.language) {
      return null;
    }

    return {
      label: anr.label,
      description: anr.description || '',
      language: anr.language,
      emptyAnalysis: true,
      analysisType: 'scenario'
    };
  }

  return {
    getLaunch: getLaunch,
    createPayload: createPayload
  };
}));

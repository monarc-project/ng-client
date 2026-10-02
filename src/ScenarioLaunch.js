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

  function isHandoffRequest(url) {
    if (typeof url !== 'string') {
      return false;
    }

    return /^\/?api\/scenario\/v1\/auth\/bridge\/issue(?:[?#]|$)/.test(url)
      || /^\/scenario\/auth\/legacy\/(?:csrf|consume)(?:[?#]|$)/.test(url);
  }

  function handoffFailureMessage(response) {
    var data = response && response.data;
    var message = data && typeof data.error === 'string'
      ? data.error
      : data && data.error && typeof data.error.message === 'string'
        ? data.error.message
        : data && typeof data.message === 'string'
          ? data.message
          : null;

    if (message) {
      return message;
    }

    switch (response && response.status) {
      case 400:
        return 'The Scenario launch request is invalid. Please retry from the analysis list.';
      case 401:
        return 'Scenario access could not be authorised. Please sign in again and retry.';
      case 403:
        return 'You do not have permission to open this Scenario analysis.';
      case 404:
        return 'This Scenario analysis is no longer available.';
      case 409:
        return 'The Scenario handoff has expired. Please retry.';
      default:
        return 'The Scenario workspace could not be opened.';
    }
  }

  function requiresLogin(response) {
    return response && response.status === 401
      && response.data && response.data.error
      && response.data.error.code === 'legacy_session_expired';
  }

  return {
    getLaunch: getLaunch,
    createPayload: createPayload,
    isHandoffRequest: isHandoffRequest,
    handoffFailureMessage: handoffFailureMessage,
    requiresLogin: requiresLogin
  };
}));

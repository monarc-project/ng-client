(function () {

    angular
        .module('ClientApp')
        .factory('ConfigService', [ '$http', ConfigService ]);

    function ConfigService($http) {
        var self = this;
        self.config = {
            appVersion: null,
            checkVersion: null,
            appCheckingURL: null,
            languages: null,
            defaultLanguageIndex: null,
        };

        var loadConfig = function (success) {
            $http.get('api/config').then(function (data) {
                self.config.languages = {}
                if (data.data.languages) {
                    for (lang in data.data.languages) {
                        self.config.languages[lang] = ISO6391.getCode(data.data.languages[lang]);
                    }
                }
                if (data.data.defaultLanguageIndex) {
                    self.config.defaultLanguageIndex = data.data.defaultLanguageIndex;
                }

                if (data.data.appVersion) {
                    self.config.appVersion = data.data.appVersion;
                } else {
                    self.config.appVersion = ''
                }

                if (data.data.checkVersion !== undefined) {
                    self.config.checkVersion = data.data.checkVersion;
                } else {
                    self.config.checkVersion = true
                }

                if (data.data.appCheckingURL !== undefined) {
                    self.config.appCheckingURL = data.data.appCheckingURL;
                } else {
                    self.config.appCheckingURL = ''
                }

                if (success) {
                    success();
                }
            });
        };

        var isLoaded = function () {
            return !!self.config.languages;
        };

        var getLanguages = function () {
            if (self.config.languages) {
                return self.config.languages;
            } else {
                // Fallback in case of error
                return {1: 'gb'};
            }
        };

        var getVersion = function () {
            if (self.config.appVersion) {
                return self.config.appVersion;
            } else {
                // Fallback in case of error
                return '';
            }
        };

        var getCheckVersion = function () {
            if (self.config.checkVersion) {
                return self.config.checkVersion;
            } else {
                // Fallback in case of error
                return false;
            }
        };

        var getAppCheckingURL = function () {
            if (self.config.appCheckingURL) {
                return self.config.appCheckingURL;
            } else {
                // Fallback in case of error
                return '';
            }
        };

        var getDefaultLanguageIndex = function () {
            if (self.config.defaultLanguageIndex) {
                return self.config.defaultLanguageIndex;
            } else {
                // Fallback in case of error
                return 1;
            }
        };

        return {
            loadConfig: loadConfig,
            isLoaded: isLoaded,
            getLanguages: getLanguages,
            getVersion: getVersion,
            getCheckVersion: getCheckVersion,
            getAppCheckingURL: getAppCheckingURL,
            getDefaultLanguageIndex: getDefaultLanguageIndex
        };
    }

})();

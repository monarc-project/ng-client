(function () {

    angular
        .module('ClientApp')
        .factory('ConfigService', [ '$http', ConfigService ]);

    function ConfigService($http) {
        var self = this;
        self.config = {};

        var loadConfig = function (success) {
            $http.get('/api/config').success(function (data) {
                self.config = data;

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
                return {1: 'English'};
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
            getDefaultLanguageIndex: getDefaultLanguageIndex
        };
    }

})();
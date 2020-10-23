(function () {

    angular
        .module('ClientApp')
        .factory('StatsService', [ '$resource', StatsService ]);

    function StatsService($resource) {
        var self = this;

        self.StatsResource = $resource('api/stats/', { }, {
            'query': {
                isArray: false
            }
        });

        self.StatsProcessorResource = $resource('api/stats/processed/', { }, {
            'query': {
                isArray: false
            }
        });

        self.StatsSettingsResource = $resource('api/stats/settings/', { }, {
            'update': {
                method: 'PATCH'
            },
            'query': {
                isArray: false
            }
        });

        self.StatsValidatorResource = $resource('api/stats/validate-stats-availability/', { }, {
            'query': {
                isArray: false
            }
        });

        var getStats = function (params) {
            return self.StatsResource.query(params).$promise;
        };

        var getStatsProcessor = function (params) {
            return self.StatsProcessorResource.query(params).$promise;
        };

        var getAnrSettings = function () {
            return self.StatsSettingsResource.query().$promise;
        };
        var updateAnrSettings = function (id, params, success, error) {
            return self.StatsSettingsResource.update(id, params, success, error).$promise;
        };

        var getValidation = function () {
          return self.StatsValidatorResource.query().$promise;
        };

        return {
            getStats: getStats,
            getStatsProcessor: getStatsProcessor,
            getAnrSettings: getAnrSettings,
            updateAnrSettings: updateAnrSettings,
            getValidation: getValidation
        };
    }

})
();

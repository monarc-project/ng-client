(function () {

    angular
        .module('ClientApp')
        .factory('ClientRecommandationService', [ '$resource', ClientRecommandationService ]);

    function ClientRecommandationService($resource) {
        var self = this;

        self.ClientRecommandationResource = $resource('api/client-anr/:anr/recommandations/:id', { 'id': '@id', 'anr': '@anr' }, {
            'update': {
                method: 'PATCH'
            },
            'query': {
                isArray: false
            }
        });

        var getRecommandations = function (params) {
            return self.ClientRecommandationResource.query(params).$promise;
        };

        var getRecommandation = function (anr_id, id) {
            return self.ClientRecommandationResource.query({anr: anr_id, id: id}).$promise;
        };

        var createRecommandation = function (params, success, error) {
            new self.ClientRecommandationResource(params).$save(success, error);
        };

        var updateRecommandation = function (params, success, error) {
            var cleanParams = angular.copy(params);
            delete cleanParams.id;
            delete cleanParams.anr;
            self.ClientRecommandationResource.update({'anr': params.anr, 'id': params.id}, cleanParams, success, error);
        };

        var copyRecommandation = function (params, success, error) {
            var cleanParams = angular.copy(params);
            delete cleanParams.id;
            cleanParams.code += ' (copy)';
            // delete cleanParams.anr;
            console.log(cleanParams);
            new self.ClientRecommandationResource(cleanParams).$save(success, error);
            // self.ClientRecommandationResource.update({'anr': params.anr, 'id': params.id}, cleanParams, success, error);
        };

        var deleteRecommandation = function (params, success, error) {
            self.ClientRecommandationResource.delete(params, success, error);
        };

        self.ClientRecommandationRiskResource = $resource('api/client-anr/:anr/recommandations-risks/:id', { 'id': '@id', 'anr': '@anr' }, {
            'update': {
                method: 'PATCH'
            },
            'query': {
                isArray: false
            }
        });
        self.ClientRecommandationRiskValidateResource = $resource('api/client-anr/:anr/recommandations-risks/:id/validate', { 'id': '@id', 'anr': '@anr' }, {
            'update': {
                method: 'PATCH'
            },
            'query': {
                isArray: false
            }
        });

        var attachToRisk = function (anr_id, rec_id, risk_id, op, success, error) {
            new self.ClientRecommandationRiskResource({anr: anr_id, recommandation: rec_id, risk: risk_id, op: op ? 1 : 0}).$save(success, error);
        };

        var detachFromRisk = function (anr_id, risk_attach_id, success, error) {
            self.ClientRecommandationRiskResource.delete({anr: anr_id, id: risk_attach_id}, success, error);
        }

        var getRiskRecommandations = function (anr_id, risk_id, op, success, error) {
            return self.ClientRecommandationRiskResource.query({anr: anr_id, risk: risk_id, op: op ? 1 : 0}).$promise;
        };

        var getRiskRecommandation = function (anr_id, id) {
            return self.ClientRecommandationRiskResource.query({anr: anr_id, id: id}).$promise;
        };

        var getRecommandationRisks = function (anr_id, rec_id, op, success, error) {
            return self.ClientRecommandationRiskResource.query({anr: anr_id, recommandation: rec_id, op: op ? 1 : 0}).$promise;
        };

        var updateRecommandationRisk = function (anr_id, risk_id, params, success, error) {
            self.ClientRecommandationRiskResource.update({anr: anr_id, id: risk_id}, params, success, error);
        };

        var validateRecommandationRisk = function (anr_id, risk_id, params, success, error) {
            self.ClientRecommandationRiskValidateResource.update({anr: anr_id, id: risk_id}, params, success, error);
        };

        self.ClientRecommandationMeasureResource = $resource('api/client-anr/:anr/recommandations-measures/:id', { 'id': '@id', 'anr': '@anr' }, {
            'update': {
                method: 'PATCH'
            },
            'query': {
                isArray: false
            }
        });

        var attachMeasureToRecommandation = function (anr_id, recommandation_id, measure_id, success, error) {
            new self.ClientRecommandationMeasureResource({anr: anr_id, recommandation: recommandation_id, measure: measure_id}).$save(success, error);
        };

        var detachMeasureFromRecommandation = function (anr_id, id, success, error) {
            self.ClientRecommandationMeasureResource.delete({anr: anr_id, id: id}, success, error);
        };

        self.ClientRecommandationHistoryResource = $resource('api/client-anr/:anr/recommandations-historics', { 'anr': '@anr' }, {
            'update': {
                method: 'PATCH'
            },
            'query': {
                isArray: false
            }
        });

        var getRecommandationHistory = function (anr_id) {
            return self.ClientRecommandationHistoryResource.query({anr: anr_id}).$promise;
        };

        return {
            getRecommandations: getRecommandations,
            getRecommandation: getRecommandation,
            createRecommandation: createRecommandation,
            updateRecommandation: updateRecommandation,
            copyRecommandation: copyRecommandation,
            deleteRecommandation: deleteRecommandation,
            attachToRisk: attachToRisk,
            detachFromRisk: detachFromRisk,
            getRiskRecommandations: getRiskRecommandations,
            getRiskRecommandation: getRiskRecommandation,
            attachMeasureToRecommandation: attachMeasureToRecommandation,
            detachMeasureFromRecommandation: detachMeasureFromRecommandation,
            getRecommandationHistory: getRecommandationHistory,
            getRecommandationRisks: getRecommandationRisks,
            updateRecommandationRisk: updateRecommandationRisk,
            validateRecommandationRisk: validateRecommandationRisk,
        };
    }

})
();

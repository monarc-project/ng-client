(function () {

    angular
        .module('ClientApp')
        .factory('ClientRecommandationService', [ '$resource', ClientRecommandationService ]);

    function ClientRecommandationService($resource) {
        var self = this;

        self.ClientRecommandationResource = $resource('/api/client-anr/:anr/recommandations/:id', { 'id': '@id', 'anr': '@anr' }, {
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

        var getRecommandation = function (id) {
            return self.ClientRecommandationResource.query({id: id}).$promise;
        };

        var createRecommandation = function (params, success, error) {
            new self.ClientRecommandationResource(params).$save(success, error);
        };

        var updateRecommandation = function (params, success, error) {
            self.ClientRecommandationResource.update(params, success, error);
        };

        var deleteRecommandation = function (params, success, error) {
            self.ClientRecommandationResource.delete(params, success, error);
        };

        self.ClientRecommandationRiskResource = $resource('/api/client-anr/:anr/recommandations-risks/:id', { 'id': '@id', 'anr': '@anr' }, {
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

        self.ClientRecommandationMeasureResource = $resource('/api/client-anr/:anr/recommandations-measures/:id', { 'id': '@id', 'anr': '@anr' }, {
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


        return {
            getRecommandations: getRecommandations,
            getRecommandation: getRecommandation,
            createRecommandation: createRecommandation,
            updateRecommandation: updateRecommandation,
            deleteRecommandation: deleteRecommandation,
            attachToRisk: attachToRisk,
            detachFromRisk: detachFromRisk,
            getRiskRecommandations: getRiskRecommandations,
            attachMeasureToRecommandation: attachMeasureToRecommandation,
            detachMeasureFromRecommandation: detachMeasureFromRecommandation,
        };
    }

})
();
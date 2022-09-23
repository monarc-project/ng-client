(function () {

    angular
        .module('ClientApp')
        .factory('ClientRecommandationService', ['$resource', '$rootScope', 'MassDeleteService', 'gettextCatalog', ClientRecommandationService]);

    function ClientRecommandationService($resource, $rootScope, MassDeleteService, gettextCatalog) {
        var self = this;

        var anr = $rootScope.OFFICE_MODE == "FO" ? "client-anr/:urlAnrId/" : "";

        self.ClientRecommandationResource = $resource('api/' + anr + 'recommandations/:id', {
                id: '@id',
                urlAnrId: $rootScope.getUrlAnrId()
            },
            {
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
            return self.ClientRecommandationResource.query({ anr: anr_id, id: id }).$promise;
        };

        var checkCode = function(recs, code){
            var result = recs.find(x => x.code === code);
            if (result !== undefined) {
                code += '  (' + gettextCatalog.getString('Copy') + ')';
                return checkCode(recs, code);
            }
            return code;
        };

        var createRecommandation = function (params, success, error) {
            getRecommandations({ anr: params.anr }).then(function (data) {
                params.code = checkCode(data.recommandations, params.code);
                new self.ClientRecommandationResource(params).$save(success, error);
            });
        };

        var createRecommandationMass = function (importData, success, error) {
            getRecommandations({ anr: importData.anr }).then(function (data) {
                delete importData.anr;
                importData.forEach(params => {
                    params.code = checkCode(data.recommandations, params.code);
                });
                new self.ClientRecommandationResource(importData).$save(success, error);
            });
        };

        var updateRecommandation = function (params, success, error) {
            var cleanParams = angular.copy(params);
            delete cleanParams.uuid;
            delete cleanParams.anr;
            self.ClientRecommandationResource.update({'id': params.uuid }, cleanParams, success, error);
        };

        var copyRecommandation = function (params, success, error) {
            var cleanParams = angular.copy(params);
            delete cleanParams.uuid;
            delete cleanParams.duedate;
            delete cleanParams.position;
            new self.ClientRecommandationResource(cleanParams).$save(success, error);
        };

        var deleteRecommandation = function (params, success, error) {
            self.ClientRecommandationResource.delete(params, success, error);
        };

        var deleteMassRecommandation = function (anr, ids, success, error) {
            MassDeleteService.deleteMass('api/client-anr/' + anr + '/recommandations', ids, success, error);
        }

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
            new self.ClientRecommandationRiskResource({ anr: anr_id, recommandation: rec_id, risk: risk_id, op: op ? 1 : 0 }).$save(success, error);
        };

        var detachFromRisk = function (anr_id, risk_attach_id, success, error) {
            self.ClientRecommandationRiskResource.delete({ anr: anr_id, id: risk_attach_id }, success, error);
        }

        var getRiskRecommandations = function (anr_id, risk_id, op, success, error) {
            return self.ClientRecommandationRiskResource.query({ anr: anr_id, risk: risk_id, op: op ? 1 : 0 }).$promise;
        };

        var getRiskRecommandation = function (anr_id, id) {
            return self.ClientRecommandationRiskResource.query({ anr: anr_id, id: id }).$promise;
        };

        var getRecommandationRisks = function (anr_id, rec_id, op, success, error) {
            return self.ClientRecommandationRiskResource.query({ anr: anr_id, recommandation: rec_id, op: op ? 1 : 0 }).$promise;
        };

        var updateRecommandationRisk = function (anr_id, risk_id, params, success, error) {
            self.ClientRecommandationRiskResource.update({ anr: anr_id, id: risk_id }, params, success, error);
        };

        var validateRecommandationRisk = function (anr_id, risk_id, params, success, error) {
            self.ClientRecommandationRiskValidateResource.update({ anr: anr_id, id: risk_id }, params, success, error);
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
            return self.ClientRecommandationHistoryResource.query({ anr: anr_id }).$promise;
        };

        self.ClientRecommandationSetResource = $resource('api/client-anr/:anr/recommandations-sets/:id', { 'id': '@id', 'anr': '@anr' }, {
            'update': {
                method: 'PATCH'
            },
            'query': {
                isArray: false
            }
        });

        var getRecommandationsSets = function (params) {
            return self.ClientRecommandationSetResource.query(params).$promise;
        };

        var getRecommandationSet = function (anr_id, id) {
            return self.ClientRecommandationSetResource.query({ anr: anr_id, id: id }).$promise;
        };

        var createRecommandationSet = function (params, success, error) {
            new self.ClientRecommandationSetResource(params).$save(success, error);
        };

        var updateRecommandationSet = function (params, success, error) {
            var cleanParams = angular.copy(params);
            delete cleanParams.uuid;
            delete cleanParams.anr;
            self.ClientRecommandationSetResource.update({ 'anr': params.anr, 'id': params.uuid }, cleanParams, success, error);
        };

        var deleteRecommandationSet = function (params, success, error) {
            self.ClientRecommandationSetResource.delete(params, success, error);
        };

        return {
            getRecommandations: getRecommandations,
            getRecommandation: getRecommandation,
            createRecommandation: createRecommandation,
            createRecommandationMass: createRecommandationMass,
            updateRecommandation: updateRecommandation,
            copyRecommandation: copyRecommandation,
            deleteRecommandation: deleteRecommandation,
            deleteMassRecommandation: deleteMassRecommandation,
            attachToRisk: attachToRisk,
            detachFromRisk: detachFromRisk,
            getRiskRecommandations: getRiskRecommandations,
            getRiskRecommandation: getRiskRecommandation,
            getRecommandationHistory: getRecommandationHistory,
            getRecommandationRisks: getRecommandationRisks,
            updateRecommandationRisk: updateRecommandationRisk,
            validateRecommandationRisk: validateRecommandationRisk,
            getRecommandationsSets: getRecommandationsSets,
            getRecommandationSet: getRecommandationSet,
            createRecommandationSet: createRecommandationSet,
            updateRecommandationSet: updateRecommandationSet,
            deleteRecommandationSet: deleteRecommandationSet
        };
    }

})
    ();

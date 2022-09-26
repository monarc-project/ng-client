(function() {

	angular
		.module('ClientApp')
		.factory('ClientRecommandationService', ['$resource', '$rootScope', 'MassDeleteService', 'gettextCatalog', ClientRecommandationService]);

	function ClientRecommandationService($resource, $rootScope, MassDeleteService, gettextCatalog) {
		var self = this;

		var anr = $rootScope.OFFICE_MODE == "FO" ? "client-anr/:urlAnrId/" : "";

		var makeResource = function() {
			self.ClientRecommandationResource = $resource('api/' + anr + 'recommandations/:id', {
				id: '@id',
				urlAnrId: $rootScope.getUrlAnrId()
			}, {
				'update': {
					method: 'PATCH'
				},
				'query': {
					isArray: false
				}
			});

			self.ClientRecommandationRiskResource = $resource('api/' + anr + 'recommandations-risks/:id', {
				id: '@id',
				urlAnrId: $rootScope.getUrlAnrId()
			}, {
				'update': {
					method: 'PATCH'
				},
				'query': {
					isArray: false
				}
			});

			self.ClientRecommandationRiskValidateResource = $resource('api/' + anr + 'recommandations-risks/:id/validate', {
				id: '@id',
				urlAnrId: $rootScope.getUrlAnrId()
			}, {
				'update': {
					method: 'PATCH'
				},
				'query': {
					isArray: false
				}
			});

			self.ClientRecommandationHistoryResource = $resource('api/' + anr + 'recommandations-historics', {
				urlAnrId: $rootScope.getUrlAnrId()
			}, {
				'update': {
					method: 'PATCH'
				},
				'query': {
					isArray: false
				}
			});

			self.ClientRecommandationSetResource = $resource('api/' + anr + 'recommandations-sets/:id', {
				id: '@id',
				urlAnrId: $rootScope.getUrlAnrId()
			}, {
				'update': {
					method: 'PATCH'
				},
				'query': {
					isArray: false
				}
			});
		}

		makeResource();

		var getRecommandations = function(params) {
			return self.ClientRecommandationResource.query(params).$promise;
		};

		var getRecommandation = function(id) {
			return self.ClientRecommandationResource.query({
				id: id
			}).$promise;
		};

        var checkCode = function(recs, code){
            var result = recs.find(x => x.code === code);
            if (result !== undefined) {
                code += '  (' + gettextCatalog.getString('Copy') + ')';
                return checkCode(recs, code);
            }
            return code;
        };

		var createRecommandation = function(params, success, error) {
			getRecommandations().then(function (data) {
			    params.code = checkCode(data.recommandations, params.code);
			    new self.ClientRecommandationResource(params).$save(success, error);
			});
		};

		var createRecommandationMass = function(importData, success, error) {
			getRecommandations().then(function(data) {
				importData.forEach(params => {
					params.code = checkCode(data.recommandations, params.code);
				});
				new self.ClientRecommandationResource(importData).$save(success, error);
			});
		};

		var updateRecommandation = function(params, success, error) {
            var cleanParams = angular.copy(params);
            delete cleanParams.uuid;
            delete cleanParams.anr;
			self.ClientRecommandationResource.update({
				id: params.uuid
			}, cleanParams, success, error);
		};

		var deleteRecommandation = function(params, success, error) {
			self.ClientRecommandationResource.delete(params, success, error);
		};

		var deleteMassRecommandation = function(ids, success, error) {
            if ($rootScope.OFFICE_MODE == 'FO') {
                MassDeleteService.deleteMass('api/client-anr/' + $rootScope.getUrlAnrId() + '/recommandations', ids, success, error);
            } else {
                MassDeleteService.deleteMass('api/recommandations', ids, success, error);
            }
		}

		var attachToRisk = function(rec_id, risk_id, op, success, error) {
			new self.ClientRecommandationRiskResource({
				recommandation: rec_id,
				risk: risk_id,
				op: op ? 1 : 0
			}).$save(success, error);
		};

		var detachFromRisk = function(risk_attach_id, success, error) {
			self.ClientRecommandationRiskResource.delete({
				id: risk_attach_id
			}, success, error);
		}

		var getRiskRecommandations = function(risk_id, op, success, error) {
			return self.ClientRecommandationRiskResource.query({
				risk: risk_id,
				op: op ? 1 : 0
			}).$promise;
		};

		var getRiskRecommandation = function(id) {
			return self.ClientRecommandationRiskResource.query({
				id: id
			}).$promise;
		};

		var getRecommandationRisks = function(rec_id, op, success, error) {
			return self.ClientRecommandationRiskResource.query({
				recommandation: rec_id,
				op: op ? 1 : 0
			}).$promise;
		};

		var updateRecommandationRisk = function(risk_id, params, success, error) {
			self.ClientRecommandationRiskResource.update({
				id: risk_id
			}, params, success, error);
		};

		var validateRecommandationRisk = function(risk_id, params, success, error) {
			self.ClientRecommandationRiskValidateResource.update({
				id: risk_id
			}, params, success, error);
		};

		var getRecommandationHistory = function() {
			return self.ClientRecommandationHistoryResource.query().$promise;
		};

		var getRecommandationsSets = function(params) {
			return self.ClientRecommandationSetResource.query(params).$promise;
		};

		var getRecommandationSet = function(id) {
			return self.ClientRecommandationSetResource.query({
				id: id
			}).$promise;
		};

		var createRecommandationSet = function(params, success, error) {
			new self.ClientRecommandationSetResource(params).$save(success, error);
		};

		var updateRecommandationSet = function(params, success, error) {
			var cleanParams = angular.copy(params);
			delete cleanParams.uuid;
			delete cleanParams.anr;
			self.ClientRecommandationSetResource.update({
				id: params.uuid
			}, cleanParams, success, error);
		};

		var deleteRecommandationSet = function(params, success, error) {
			self.ClientRecommandationSetResource.delete(params, success, error);
		};

		return {
			makeResource: makeResource,
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

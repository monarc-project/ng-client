(function() {

	angular
		.module('ClientApp')
		.factory('ClientRecommendationService', ['$resource', '$rootScope', 'MassDeleteService', 'gettextCatalog', ClientRecommendationService]);

	function ClientRecommendationService($resource, $rootScope, MassDeleteService, gettextCatalog) {
		var self = this;

		var anr = $rootScope.OFFICE_MODE == "FO" ? "client-anr/:urlAnrId/" : "";

		var makeResource = function() {
			self.ClientRecommendationResource = $resource('api/' + anr + 'recommendations/:id', {
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

			self.ClientRecommendationRiskResource = $resource('api/' + anr + 'recommendations-risks/:id', {
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

			self.ClientRecommendationRiskValidateResource = $resource('api/' + anr + 'recommendations-risks/:id/validate', {
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

			self.ClientRecommendationHistoryResource = $resource('api/' + anr + 'recommendations-history', {
				urlAnrId: $rootScope.getUrlAnrId()
			}, {
				'update': {
					method: 'PATCH'
				},
				'query': {
					isArray: false
				}
			});

			self.ClientRecommendationSetResource = $resource('api/' + anr + 'recommendations-sets/:id', {
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

		var getRecommendations = function(params) {
			return self.ClientRecommendationResource.query(params).$promise;
		};

		var getRecommendation = function(id) {
			return self.ClientRecommendationResource.query({
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

		var createRecommendation = function(params, success, error) {
			getRecommendations().then(function (data) {
			    params.code = checkCode(data.recommendations, params.code);
			    new self.ClientRecommendationResource(params).$save(success, error);
			});
		};

		var createRecommendationMass = function(importData, success, error) {
			getRecommendations().then(function(data) {
				importData.forEach(params => {
					params.code = checkCode(data.recommendations, params.code);
				});
				new self.ClientRecommendationResource(importData).$save(success, error);
			});
		};

		var updateRecommendation = function(params, success, error) {
            var cleanParams = angular.copy(params);
            delete cleanParams.uuid;
            delete cleanParams.anr;
			self.ClientRecommendationResource.update({
				id: params.uuid
			}, cleanParams, success, error);
		};

		var deleteRecommendation = function(params, success, error) {
			self.ClientRecommendationResource.delete(params, success, error);
		};

		var deleteMassRecommendation = function(ids, success, error) {
            if ($rootScope.OFFICE_MODE == 'FO') {
                MassDeleteService.deleteMass('api/client-anr/' + $rootScope.getUrlAnrId() + '/recommendations', ids, success, error);
            } else {
                MassDeleteService.deleteMass('api/recommendations', ids, success, error);
            }
		}

		var attachToRisk = function(rec_id, risk_id, op, success, error) {
			new self.ClientRecommendationRiskResource({
				recommendation: rec_id,
				risk: risk_id,
				op: op ? 1 : 0
			}).$save(success, error);
		};

		var detachFromRisk = function(risk_attach_id, success, error) {
			self.ClientRecommendationRiskResource.delete({
				id: risk_attach_id
			}, success, error);
		}

		var getRiskRecommendations = function(risk_id, op, success, error) {
			return self.ClientRecommendationRiskResource.query({
				risk: risk_id,
				op: op ? 1 : 0
			}).$promise;
		};

		var getRiskRecommendation = function(id) {
			return self.ClientRecommendationRiskResource.query({
				id: id
			}).$promise;
		};

		var getRecommendationRisks = function(rec_id, op, success, error) {
			return self.ClientRecommendationRiskResource.query({
				recommendation: rec_id,
				op: op ? 1 : 0
			}).$promise;
		};

		var updateRecommendationRisk = function(risk_id, params, success, error) {
			self.ClientRecommendationRiskResource.update({
				id: risk_id
			}, params, success, error);
		};

		var validateRecommendationRisk = function(risk_id, params, success, error) {
			self.ClientRecommendationRiskValidateResource.update({
				id: risk_id
			}, params, success, error);
		};

		var getRecommendationHistory = function() {
			return self.ClientRecommendationHistoryResource.query().$promise;
		};

		var getRecommendationsSets = function(params) {
			return self.ClientRecommendationSetResource.query(params).$promise;
		};

		var getRecommendationSet = function(id) {
			return self.ClientRecommendationSetResource.query({
				id: id
			}).$promise;
		};

		var createRecommendationSet = function(params, success, error) {
			new self.ClientRecommendationSetResource(params).$save(success, error);
		};

		var updateRecommendationSet = function(params, success, error) {
			var cleanParams = angular.copy(params);
			delete cleanParams.uuid;
			delete cleanParams.anr;
			self.ClientRecommendationSetResource.update({
				id: params.uuid
			}, cleanParams, success, error);
		};

		var deleteRecommendationSet = function(params, success, error) {
			self.ClientRecommendationSetResource.delete(params, success, error);
		};

		return {
			makeResource: makeResource,
			getRecommendations: getRecommendations,
			getRecommendation: getRecommendation,
			createRecommendation: createRecommendation,
			createRecommendationMass: createRecommendationMass,
			updateRecommendation: updateRecommendation,
			deleteRecommendation: deleteRecommendation,
			deleteMassRecommendation: deleteMassRecommendation,
			attachToRisk: attachToRisk,
			detachFromRisk: detachFromRisk,
			getRiskRecommendations: getRiskRecommendations,
			getRiskRecommendation: getRiskRecommendation,
			getRecommendationHistory: getRecommendationHistory,
			getRecommendationRisks: getRecommendationRisks,
			updateRecommendationRisk: updateRecommendationRisk,
			validateRecommendationRisk: validateRecommendationRisk,
			getRecommendationsSets: getRecommendationsSets,
			getRecommendationSet: getRecommendationSet,
			createRecommendationSet: createRecommendationSet,
			updateRecommendationSet: updateRecommendationSet,
			deleteRecommendationSet: deleteRecommendationSet
		};
	}

})
();

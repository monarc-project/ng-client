(function () {

    angular
        .module('ClientApp')
        .factory('TreatmentPlanService', [ '$resource', TreatmentPlanService ]);

    function TreatmentPlanService($resource) {
        var self = this;

        self.TreatmentPlanResource = $resource('/api/client-anr/:anr/treatment-plan/:id', { 'id': '@id', 'anr': '@anr' }, {
            'update': {
                method: 'PATCH'
            },
            'query': {
                isArray: false
            }
        });

        var getTreatmentPlans = function (params) {
            return self.TreatmentPlanResource.query(params).$promise;
        };

        var getTreatmentPlan = function (id) {
            return self.TreatmentPlanResource.query({id: id}).$promise;
        };

        var createTreatmentPlan = function (params, success, error) {
            new self.TreatmentPlanResource(params).$save(success, error);
        };

        var updateTreatmentPlan = function (params, success, error) {
            self.TreatmentPlanResource.update(params, success, error);
        };

        var deleteTreatmentPlan = function (params, success, error) {
            self.TreatmentPlanResource.delete(params, success, error);
        };


        return {
            getTreatmentPlans: getTreatmentPlans,
            getTreatmentPlan: getTreatmentPlan,
            createTreatmentPlan: createTreatmentPlan,
            updateTreatmentPlan: updateTreatmentPlan,
            deleteTreatmentPlan: deleteTreatmentPlan,
        };
    }

})
();
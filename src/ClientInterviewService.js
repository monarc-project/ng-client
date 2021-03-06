(function () {

    angular
        .module('ClientApp')
        .factory('ClientInterviewService', [ '$resource', ClientInterviewService ]);

    function ClientInterviewService($resource) {
        var self = this;

        self.ClientInterviewResource = $resource('api/client-anr/:anr/interviews/:id', { 'id': '@id', 'anr': '@anr' }, {
            'update': {
                method: 'PATCH'
            },
            'query': {
                isArray: false
            }
        });

        var getInterviews = function (params) {
            return self.ClientInterviewResource.query(params).$promise;
        };

        var getInterview = function (id) {
            return self.ClientInterviewResource.query({id: id}).$promise;
        };

        var createInterview = function (params, success, error) {
            new self.ClientInterviewResource(params).$save(success, error);
        };

        var updateInterview = function (params, success, error) {
            self.ClientInterviewResource.update(params, success, error);
        };

        var deleteInterview = function (params, success, error) {
            self.ClientInterviewResource.delete(params, success, error);
        };
        return {
            getInterviews: getInterviews,
            getInterview: getInterview,
            createInterview: createInterview,
            updateInterview: updateInterview,
            deleteInterview: deleteInterview
        };
    }

})
();
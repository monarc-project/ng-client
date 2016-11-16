(function () {

    angular
        .module('ClientApp')
        .factory('ClientAnrService', [ '$resource', ClientAnrService ]);

    function ClientAnrService($resource) {
        var self = this;

        self.ClientAnrResource = $resource('/api/client-anr/:id', { 'id': '@id' }, {
            'update': {
                method: 'PATCH'
            },
            'query': {
                isArray: false
            }
        });

        var getAnrs = function (id) {
            return self.ClientAnrResource.query().$promise;
        };

        var getAnr = function (id) {
            return self.ClientAnrResource.query({id: id}).$promise;
        };

        var updateAnr = function (params, success, error) {
            self.ClientAnrResource.update(params, success, error);
        };

        return {
            getAnr: getAnr,
            updateAnr: updateAnr,
        };
    }

})
();
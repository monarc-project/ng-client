(function () {

    angular
        .module('ClientApp')
        .factory('ClientSoaService', [ '$resource', ClientSoaService ]);

    function ClientSoaService($resource) {
        var self = this;



                self.ClientSoaResource = $resource('api/client-anr/:anr/soa/:id', { 'id': '@id', 'anr': '@anr' }, {
                    'update': {
                        method: 'PATCH'
                    },
                    'query': {
                        isArray: false
                    }
                });


                var getSoas = function (params) {
                    return self.ClientSoaResource.query(params).$promise;
                };

                var getSoa = function (id) {
                    return self.ClientSoaResource.query({id: id}).$promise;
                };

                var createSoa = function (params, success, error) {
                    new self.ClientSoaResource(params).$save(success, error);
                };

                var updateSoa = function (params, success, error) {
                    self.ClientSoaResource.update(params, success, error);
                };

                var deleteSoa = function (params, success, error) {
                    self.ClientSoaResource.delete(params, success, error);
                };

                return {
                    getSoas: getSoas,
                    getSoa: getSoa,
                    createSoa: createSoa,
                    updateSoa: updateSoa,
                    deleteSoa: deleteSoa,
                };



    }

})
();

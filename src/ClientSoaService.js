(function () {

    angular
        .module('ClientApp')
        .factory('ClientSoaService', [ '$resource', '$rootScope', 'MassDeleteService', ClientSoaService ]);

    function ClientSoaService($resource, $rootScope, MassDeleteService) {
        var self = this;

        var anr = $rootScope.OFFICE_MODE == "FO" ? "client-anr/:urlAnrId/" : "";

        var makeResource = function () {
            self.ClientSoaResource = $resource('api/' + anr + 'soa/:SoaId', {
                    SoaId: '@id',
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
          }
          makeResource();


                var getSoas = function (params) {
                    return self.ClientSoaResource.query(params).$promise;
                };

                var getSoa = function (id) {
                    return self.ClientSoaResource.query({SoaId: id}).$promise;
                };

                var createSoa = function (params, success, error) {
                    new self.ClientSoaResource(params).$save(success, error);
                };

                var updateSoa = function (id, params, success, error) {
                    self.ClientSoaResource.update({id: id}, params, success, error);
                };

                var deleteSoa = function (params, success, error) {
                    self.ClientSoaResource.delete(params, success, error);
                };

                var deleteMassSoa = function (ids, success, error) {
                    if ($rootScope.OFFICE_MODE == 'FO') {
                        MassDeleteService.deleteMass('api/client-anr/' + $rootScope.getUrlAnrId() + '/soas', ids, success, error);
                    } else {
                        MassDeleteService.deleteMass('api/soas', ids, success, error);
                    }
                }

                return {
                    makeResource: makeResource,
                    getSoas: getSoas,
                    getSoa: getSoa,
                    createSoa: createSoa,
                    updateSoa: updateSoa,
                    deleteSoa: deleteSoa,
                    deleteMassSoa:deleteMassSoa,

                };

    }

})
();

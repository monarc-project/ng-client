(function () {

  angular
    .module('ClientApp')
    .factory('ClientSoaService', ['$resource', '$rootScope', 'MassDeleteService', ClientSoaService]);

  function ClientSoaService($resource, $rootScope, MassDeleteService) {
    var self = this;

    var makeResource = function () {
      self.ClientSoaResource = $resource('api/client-anr/:urlAnrId/soa/:SoaId', {
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

    var updateSoa = function (id, params, success, error) {
      self.ClientSoaResource.update({id: id}, params, success, error);
    };

    return {
      makeResource: makeResource,
      getSoas: getSoas,
      updateSoa: updateSoa,
    };
  }
})
();

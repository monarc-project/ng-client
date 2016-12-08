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

        self.ClientDuplicateAnrResource = $resource('/api/client-duplicate-anr/:id', { 'id': '@id' }, {
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

        var createAnrFromModel = function (params, success, error) {
            new self.ClientAnrResource(params).$save(success, error);
        };

        var duplicateAnr = function (params, success, error) {
            new self.ClientDuplicateAnrResource(params).$save(success, error);
        };

        var updateAnr = function (params, success, error) {
            self.ClientAnrResource.update(params, success, error);
        };

        var deleteAnr = function (params, success, error) {
            self.ClientAnrResource.delete(params, success, error);
        };

        var patchAnr = function (id, params, success, error) {
            self.ClientAnrResource.update({id: id}, params, success, error);
        };

        return {
            getAnrs: getAnrs,
            getAnr: getAnr,
            createAnrFromModel: createAnrFromModel,
            duplicateAnr: duplicateAnr,
            updateAnr: updateAnr,
            deleteAnr: deleteAnr,
            patchAnr: patchAnr,
        };
    }

})
();
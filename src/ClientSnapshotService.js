(function () {

    angular
        .module('ClientApp')
        .factory('ClientSnapshotService', [ '$resource', '$http', '$rootScope', ClientSnapshotService ]);

    function ClientSnapshotService($resource, $http, $rootScope) {
        var self = this;

        var makeResource = function () {
            self.ClientSnapshotResource = $resource('/api/client-anr/:urlAnrId/snapshot/:id', { 'id': '@id', 'urlAnrId': $rootScope.getUrlAnrId() }, {
                'update': {
                    method: 'PATCH'
                },
                'query': {
                    isArray: false
                }
            });
        }
        makeResource();

        var getSnapshots = function (params) {
            return self.ClientSnapshotResource.query(params).$promise;
        };

        var getSnapshot = function (id) {
            return self.ClientSnapshotResource.query({id: id}).$promise;
        };

        var createSnapshot = function (params, success, error) {
            new self.ClientSnapshotResource(params).$save(success, error);
        };

        var updateSnapshot = function (params, success, error) {
            self.ClientSnapshotResource.update(params, success, error);
        };

        var deleteSnapshot = function (params, success, error) {
            self.ClientSnapshotResource.delete(params, success, error);
        };

        var restoreSnapshot = function (id, success, error) {
            $http.post('/api/client-anr/' + $rootScope.getUrlAnrId() + '/restore-snapshot/' + id).then(success, error);
        };

        return {
            makeResource: makeResource,
            getSnapshots: getSnapshots,
            getSnapshot: getSnapshot,
            createSnapshot: createSnapshot,
            updateSnapshot: updateSnapshot,
            deleteSnapshot: deleteSnapshot,
            restoreSnapshot: restoreSnapshot
        };
    }

})
();
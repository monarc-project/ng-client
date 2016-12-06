(function () {

    angular
        .module('ClientApp')
        .factory('ClientSnapshotService', [ '$resource', '$http', ClientSnapshotService ]);

    function ClientSnapshotService($resource, $http) {
        var self = this;

        self.ClientSnapshotResource = $resource('/api/client-snapshot/:id', { 'id': '@id' }, {
            'update': {
                method: 'PATCH'
            },
            'query': {
                isArray: false
            }
        });

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
            $http.post('/api/client-restore-snapshot', {'anr': id}).then(success, error);
        };

        return {
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
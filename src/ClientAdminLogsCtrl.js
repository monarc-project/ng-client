(function () {

    angular
        .module('ClientApp')
        .controller('ClientAdminLogsCtrl', [
            '$scope', 'TableHelperService',
            ClientAdminLogsCtrl
        ]);

    /**
     * Access Logs Controller for the Client module
     */
    function ClientAdminLogsCtrl($scope, TableHelperService) {
        $scope.logs = TableHelperService.build('-createdAt', 20, 1, '');

        $scope.removeFilter = function () {
            TableHelperService.removeFilter($scope.logs);
        };

        $scope.updateLogs = function () {
            // TODO: Mewants a backend!
            /*$scope.logs.promise = AdminLogsService.getLogs($scope.logs.query);
            $scope.logs.promise.then(
                function (data) {
                    $scope.logs.items = data;
                }
            );*/
        };

        TableHelperService.watchSearch($scope, 'logs.query.filter', $scope.logs.query, $scope.updateLogs);
    }
})();
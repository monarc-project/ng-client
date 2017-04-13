(function () {

    angular
        .module('ClientApp')
        .controller('ClientDashboardCtrl', [
            '$scope', '$http', 'gettextCatalog', 'UserService', 'toastr', '$rootScope', '$timeout',
            ClientDashboardCtrl
        ]);

    /**
     * Dashboard Controller for the Client module
     */
    function ClientDashboardCtrl($scope, $http, gettextCatalog, UserService, toastr, $rootScope, $timeout) {

        $scope.dashboard = {
            anr: null,
            anrData: null,
            carto: undefined,
            cartoStats: {}
        };

        // $scope.user = UserService.get();

        $scope.$watch('dashboard.anr', function (newValue) {
            if (newValue) {
                $scope.dashboard.anrData = null;

                for (var i = 0; i < $scope.clientAnrs.length; ++i) {
                    if ($scope.clientAnrs[i].id == newValue) {
                        $scope.dashboard.anrData = $scope.clientAnrs[i];
                        break;
                    }
                }

                updateCartoRisks(newValue);
            }
        });

        $scope.$watch('clientCurrentAnr', function (newValue) {
            if (newValue) {
                $scope.dashboard.anr = newValue.id;
            }
        });

        var updateCartoRisks = function (anrId) {
            $http.get("api/client-anr/" + anrId + "/carto-risks").then(function (data) {
                $scope.dashboard.carto = data.data.carto;
                $scope.dashboard.carto.real.totalDistrib = 0;
                if ($scope.dashboard.carto.targeted) {
                    $scope.dashboard.carto.targeted.totalDistrib = 0;
                }

                for (var i = 0; i < 3; ++i) {
                    if ($scope.dashboard.carto.real.distrib[i] && !isNaN($scope.dashboard.carto.real.distrib[i])) {
                        $scope.dashboard.carto.real.totalDistrib += $scope.dashboard.carto.real.distrib[i];
                    } else {
                        $scope.dashboard.carto.real.distrib[i] = 0;
                    }

                    if ($scope.dashboard.carto.targeted) {
                        if (!isNaN($scope.dashboard.carto.targeted.distrib[i])) {
                            $scope.dashboard.carto.targeted.totalDistrib += $scope.dashboard.carto.targeted.distrib[i];
                        } else {
                            $scope.dashboard.carto.targeted.distrib[i] = 0;
                        }
                    }
                }
            });
        };
    }

})();
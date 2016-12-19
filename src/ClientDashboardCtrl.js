(function () {

    angular
        .module('ClientApp')
        .controller('ClientDashboardCtrl', [
            '$scope', '$http', 'gettextCatalog', 'UserService', 'toastr', '$rootScope',
            ClientDashboardCtrl
        ]);

    /**
     * Dashboard Controller for the Client module
     */
    function ClientDashboardCtrl($scope, $http, gettextCatalog, UserService, toastr, $rootScope) {

        $scope.dashboard = {
            anr: null,
            anrData: null,
            carto: undefined,
            cartoStats: {}
        };

        $rootScope.$broadcast('fo-anr-changed');

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
            $http.get("/api/client-anr/" + anrId + "/carto-risks").then(function (data) {
                $scope.dashboard.carto = data.data.carto;

                // Pre-calculate carto stats
                $scope.dashboard.cartoStats = {
                    real_low: 0,
                    real_med: 0,
                    real_hi: 0,
                    real_total: 0,
                    target_low: 0,
                    target_med: 0,
                    target_hi: 0,
                    target_total: 0
                };

                if (data.data.carto.real) {
                    for (var mxn in data.data.carto.real.MxV) {
                        for (var row in data.data.carto.real.Impact) {
                            var value = mxn * row;

                            if (value <= $scope.dashboard.anrData.seuil1) {
                                $scope.dashboard.cartoStats.real_low++;
                            } else if (value <= $scope.dashboard.anrData.seuil2) {
                                $scope.dashboard.cartoStats.real_med++;
                            } else {
                                $scope.dashboard.cartoStats.real_hi++;
                            }

                            $scope.dashboard.cartoStats.real_total++;
                        }
                    }
                }

                if (data.data.carto.targeted) {
                    for (var mxn in data.data.carto.targeted.MxV) {
                        for (var row in data.data.carto.targeted.Impact) {
                            var value = mxn * row;

                            if (value <= $scope.dashboard.anrData.seuil1) {
                                $scope.dashboard.cartoStats.target_low++;
                            } else if (value <= $scope.dashboard.anrData.seuil2) {
                                $scope.dashboard.cartoStats.target_med++;
                            } else {
                                $scope.dashboard.cartoStats.target_hi++;
                            }

                            $scope.dashboard.cartoStats.target_total++;
                        }
                    }
                }

            });
        };
    }

})();
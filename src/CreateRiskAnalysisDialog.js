
function CreateRiskAnalysisDialog($scope, $mdDialog, toastr, gettext, gettextCatalog, ConfigService, ModelService,
                                    ClientAnrService, anr) {
    $scope.languages = ConfigService.getLanguages();
    $scope.smileModels = [];
    $scope.myAnrs = [];
    $scope.anr = anr || {};

    ClientAnrService.getAnrs().then(function (data) {
        $scope.myAnrs = data.anrs;

        if ($scope.myAnrs && $scope.myAnrs.length == 0) {
            $scope.anr.sourceType = 1;
        }
    }, function () {
        // Error, force SMILE model
        $scope.anr.sourceType = 1;
    });

    $scope.modelHasRawRolf = function () {
        if ($scope.anr && $scope.anr.model > 0) {
            for (var i = 0; i < $scope.smileModels.length; ++i) {
                if ($scope.smileModels[i].id == $scope.anr.model) {
                    return $scope.smileModels[i].showRolfBrut;
                }
            }
        }

        return false;
    }

    ModelService.getModels().then(function (data) {
        $scope.smileModels = data.models;
    })

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    $scope.create = function () {
        $mdDialog.hide($scope.anr);
    };
}
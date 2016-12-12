
function CreateRiskAnalysisDialog($scope, $mdDialog, toastr, gettext, gettextCatalog, ConfigService, ModelService,
                                    ClientAnrService) {
    $scope.languages = ConfigService.getLanguages();
    $scope.smileModels = [];
    $scope.myAnrs = [];
    $scope.anr = {};

    ClientAnrService.getAnrs().then(function (data) {
        $scope.myAnrs = data.anrs;

        if ($scope.myAnrs && $scope.myAnrs.length == 0) {
            $scope.anr.sourceType = 1;
        }
    }, function () {
        // Error, force SMILE model
        $scope.anr.sourceType = 1;
    });

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
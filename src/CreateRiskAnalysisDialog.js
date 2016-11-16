
function CreateRiskAnalysisDialog($scope, $mdDialog, toastr, gettext, gettextCatalog, ConfigService, ModelService,
                                    ClientAnrService) {
    $scope.languages = ConfigService.getLanguages();
    $scope.smileModels = [];
    $scope.myAnrs = [];

    ClientAnrService.getAnrs().then(function (data) {
        $scope.myAnrs = data.anrs;
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
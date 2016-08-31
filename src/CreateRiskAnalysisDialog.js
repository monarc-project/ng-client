
function CreateRiskAnalysisDialog($scope, $mdDialog, toastr, gettext, gettextCatalog, ConfigService) {
    $scope.languages = ConfigService.getLanguages();
}
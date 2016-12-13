(function () {

    angular
        .module('ClientApp')
        .controller('ClientMainCtrl', [
            '$scope', '$rootScope', '$state', '$mdSidenav', '$mdMedia', '$mdDialog', 'gettextCatalog', 'UserService',
            'ClientAnrService', 'toastr',
            ClientMainCtrl
        ]);

    /**
     * Main Controller for the Client module
     */
    function ClientMainCtrl($scope, $rootScope, $state, $mdSidenav, $mdMedia, $mdDialog, gettextCatalog, UserService,
                            ClientAnrService, toastr) {
        if (!UserService.isAuthenticated() && !UserService.reauthenticate()) {
            setTimeout(function () {
                $state.transitionTo('login');
            }, 1);

            return;
        }

        $rootScope.isAllowed = UserService.isAllowed;
        gettextCatalog.debug = true;

        $scope.sidenavIsOpen = $mdMedia('gt-md');
        $scope.isLoggingOut = false;

        // Translations helper
        $scope.setLang = function (lang) {
            gettextCatalog.setCurrentLanguage(lang);
        };

        // Toolbar helpers
        $scope.openToolbarMenu = function ($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        };

        $scope.logout = function () {
            $scope.isLoggingOut = true;

            UserService.logout().then(
                function () {
                    $scope.isLoggingOut = false;
                    $state.transitionTo('login');
                },

                function () {
                    // TODO
                    $scope.isLoggingOut = false;
                    console.log("Error while logging out!");
                }
            )
        };

        // Sidenav helpers
        $scope.closeLeftSidenav = function () {
            $scope.sidenavIsOpen = false;
            $mdSidenav('left').close();
        };
        $scope.openLeftSidenav = function () {
            if ($mdMedia('gt-md')) {
                $scope.sidenavIsOpen = true;
            }
            $mdSidenav('left').open();
        };

        // Menu actions
        $scope.sidebarCreateNewANR = function (ev) {
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'toastr', 'gettext', 'gettextCatalog', 'ConfigService', 'ModelService',
                    'ClientAnrService',
                    CreateRiskAnalysisDialog],
                templateUrl: '/views/dialogs/create.anr.html',
                clickOutsideToClose: true,
                targetEvent: ev,
                scope: $rootScope.$dialogScope.$new()
            })
                .then(function (anr) {
                    $scope.clientAnrIsCreating = true;

                    if (anr.sourceType == 1) {
                        // SMILE model
                        ClientAnrService.createAnrFromModel(anr, function (data) {
                            updateMenuANRs();

                            // Redirect to ANR
                            $state.transitionTo('main.project.anr', {modelId: data.id});
                            toastr.success(gettextCatalog.getString('The risk analysis has been successfully created from the model.'), gettextCatalog.getString('Creation successful'));
                        });
                    } else if (anr.sourceType == 2) {
                        // Existing source
                        ClientAnrService.duplicateAnr(anr, function (data) {
                            updateMenuANRs();
                            
                            // Redirect to ANR
                            $state.transitionTo('main.project.anr', {modelId: data.id});
                            toastr.success(gettextCatalog.getString('The risk analysis has been successfully duplicated.'), gettextCatalog.getString('Duplication successful'));
                        });
                    }
                });
        };

        $scope.deleteClientAnrGlobal = function (ev, anr, cb) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the risk analysis "{{ label }}"?',
                    {label: anr[$scope._langField('label')]}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ClientAnrService.deleteAnr(anr.id,
                    function () {
                        updateMenuANRs();
                        toastr.success(gettextCatalog.getString('The risk analysis has been deleted.'), gettextCatalog.getString('Deletion successful'));

                        if (cb) {
                            cb();
                        }
                    }
                );
            });
        };

        $rootScope.$on('fo-anr-changed', function () {
            updateMenuANRs();
        })

        // Menu ANRs preloading
        var updateMenuANRs = function () {
            ClientAnrService.getAnrs().then(function (data) {
                $scope.clientAnrIsCreating = false;
                $scope.clientAnrs = data.anrs;
            });
        };

        updateMenuANRs();
    }

})();
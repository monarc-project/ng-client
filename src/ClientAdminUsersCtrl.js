(function () {

    angular
        .module('ClientApp')
        .controller('ClientAdminUsersCtrl', [
            '$scope', '$state', 'toastr', '$mdMedia', '$mdDialog', 'gettextCatalog', 'ClientUsersService',
            'TableHelperService', 'UserService', '$rootScope',
            ClientAdminUsersCtrl
        ]);

    /**
     * Admin Users Controller for the Client module
     */
    function ClientAdminUsersCtrl($scope, $state, toastr, $mdMedia, $mdDialog, gettextCatalog, ClientUsersService,
                                      TableHelperService, UserService, $rootScope) {

        $scope.myself = UserService.getUserId();

        $scope.users = TableHelperService.build('-firstname', 25, 1, '');
        $scope.users.activeFilter = 1;
        var initUsersFilter = true;
        $scope.$watch('users.activeFilter', function() {
            if (initUsersFilter) {
                initUsersFilter = false;
            } else {
                $scope.updateUsers();
            }
        });



        $scope.removeFilter = function () {
            TableHelperService.removeFilter($scope.users);
            $scope.users.activeFilter = 1;
        };

        $scope.updateUsers = function () {
            var query = angular.copy($scope.users.query);
            query.status = $scope.users.activeFilter;

            $scope.users.promise = ClientUsersService.getUsers(query);
            $scope.users.promise.then(
                function (data) {
                    $scope.users.items = data;
                }
            );
        };

        TableHelperService.watchSearch($scope, 'users.query.filter', $scope.users.query, $scope.updateUsers);

        $scope.toggleUserStatus = function (user) {
            ClientUsersService.patchUser(user.id, {status: !user.status}, function () {
                user.status = !user.status;
            });
        }

        $scope.createNewUser = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'ClientAnrService', CreateUserDialogCtrl],
                templateUrl: '/views/dialogs/create.user.html',
                targetEvent: ev,
                scope: $scope.$dialogScope.$new(),
                clickOutsideToClose: false,
                fullscreen: useFullScreen
            })
                .then(function (user) {
                    ClientUsersService.createUser(user,
                        function () {
                            $scope.updateUsers();
                            toastr.success(gettextCatalog.getString('The user has been created successfully.',
                                {firstname: user.firstname, lastname: user.lastname}), gettextCatalog.getString('Creation successful'));
                        });
                });
        };

        $scope.editUser = function (ev, user) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            ClientUsersService.getUser(user.id).then(function (userData) {
                $mdDialog.show({
                    controller: ['$scope', '$mdDialog', 'ClientAnrService', 'user', CreateUserDialogCtrl],
                    templateUrl: '/views/dialogs/create.user.html',
                    targetEvent: ev,
                    scope: $scope.$dialogScope.$new(),
                    clickOutsideToClose: false,
                    fullscreen: useFullScreen,
                    locals: {
                        'user': userData
                    }
                })
                    .then(function (user) {
                        ClientUsersService.patchUser(user.id, user,
                            function () {
                                $scope.updateUsers();
                                toastr.success(gettextCatalog.getString('The user has been edited successfully.',
                                    {firstname: user.firstname, lastname: user.lastname}), gettextCatalog.getString('Edition successful'));

                                if (user.id == UserService.getUserId()) {
                                    $rootScope.$broadcast('fo-anr-changed');
                                }
                            }
                        );
                    });
            });
        };

        $scope.deleteUser = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete user?',
                    {firstname: item.firstname, lastname: item.lastname}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .theme('light')
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ClientUsersService.deleteUser(item.id,
                    function () {
                        $scope.updateUsers();
                        toastr.success(gettextCatalog.getString('The user has been deleted.',
                            {firstname: item.firstname, lastname: item.lastname}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };
    }


    function CreateUserDialogCtrl($scope, $mdDialog, ClientAnrService, user) {
        ClientAnrService.getAnrs().then(function (data) {
            $scope.anrs = data.anrs;
            $scope.anrs.sort(function (a, b) {
                var str1 = a['label' + a.language];
                var str2 = b['label' + b.language];
                return ( ( str1 == str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
            });

            for (var i = 0; i < $scope.anrs.length; ++i) {
                if (!$scope.anrById[$scope.anrs[i].id]) {
                    $scope.anrById[$scope.anrs[i].id] = $scope.anrs[i];
                    $scope.anrs[i].rwd = -1;
                }
            }
        });

        $scope.anrById = {};
        if (user != undefined && user != null) {
            $scope.user = user;
            // Ensure password isn't set, otherwise it will be erased with the encrypted value, and is going to be
            // encrypted again.
            $scope.user.password = undefined;
            $scope.user.currentAnr = undefined;

            if (user.anrs) {
                for (var i = 0; i < user.anrs.length; ++i) {
                    $scope.anrById[user.anrs[i].id] = user.anrs[i];
                }
            }
        } else {
            $scope.user = {
                firstname: '',
                lastname: '',
                email: '',
                phone: '',
                role: []
            };
        }

        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            var cleanedAnrs = [];
            for (var i in $scope.anrById) {
                var anr = $scope.anrById[i];

                if (anr.rwd >= 0) {
                    cleanedAnrs.push({id: i, rwd: anr.rwd});
                }
            }


            $scope.user.anrs = cleanedAnrs;

            $mdDialog.hide($scope.user);
        };
    }

})();

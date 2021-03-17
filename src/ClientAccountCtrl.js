(function () {

    angular
        .module('ClientApp')
        .controller('ClientAccountCtrl', [
            '$scope', '$rootScope', '$state', '$mdDialog', 'gettext', 'gettextCatalog', 'toastr', '$http', 'UserService', 'UserProfileService',
            'ConfigService', 'StatsService',
            ClientAccountCtrl
        ]);

    /**
     * Account Controller for the Client module
     */
    function ClientAccountCtrl($scope, $rootScope, $state, $mdDialog, gettext, gettextCatalog, toastr, $http, UserService, UserProfileService,
                                   ConfigService, StatsService) {
        $scope.password = {
            old: '',
            new: '',
            confirm: ''
        }

        $scope.refreshProfile = function () {
            UserProfileService.getProfile().then(function (data) {
                // Keep only the fields that matters for a clean PATCH
                $scope.user = {
                    firstname: data.firstname,
                    lastname: data.lastname,
                    email: data.email,
                    mospApiKey: data.mospApiKey,
                };
            });
        };


        $scope.updateProfile = function () {
            UserProfileService.updateProfile($scope.user, function (data) {
                toastr.success(gettextCatalog.getString('Your profile has been edited successfully'), gettext('Profile edited'));
            });
        }

        $scope.deleteProfile = function (ev) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete your account?',
                    {firstname: $scope.user.firstname, lastname: $scope.user.lastname}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .theme('light')
                .ok(gettextCatalog.getString('Delete'))
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                UserProfileService.deleteProfile($scope.user, function (data) {
                    $state.transitionTo('login');
                });
                $state.transitionTo('login');
            });
        };

        $scope.updatePassword = function () {
            $http.put('api/user/password/' + UserService.getUserId(), $scope.password).then(function (data) {
                if (data.data.status == 'ok') {
                    toastr.success(gettextCatalog.getString('Your password has been updated successfully'));
                }
            })
        }

        // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
        $scope.escapeRegExp = function (str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    }
})();

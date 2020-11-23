(function () {

    angular
        .module('ClientApp')
        .controller('ClientAccountCtrl', [
            '$scope', '$rootScope', '$state', '$mdDialog', 'gettext', 'gettextCatalog', 'toastr', '$http', 'UserService', 'UserProfileService',
            'ConfigService', 'localStorageService',
            ClientAccountCtrl
        ]);

    /**
     * Account Controller for the Client module
     */
    function ClientAccountCtrl($scope, $rootScope, $state, $mdDialog, gettext, gettextCatalog, toastr, $http, UserService, UserProfileService,
                                   ConfigService, localStorageService) {
        $scope.password = {
            old: '',
            new: '',
            confirm: ''
        }

        var ensureLanguagesLoaded = function () {
            if (ConfigService.isLoaded()) {
                $scope.languages = ConfigService.getLanguages();
                $scope.languagesNames = {};
                $scope.countriesCode = {};
                angular.copy($scope.languages, $scope.languagesNames);
                angular.copy($scope.languages, $scope.countriesCode);
                for (lang in $scope.languages) {
                     $scope.languagesNames[lang] = ISO6391.getName($scope.languages[lang]);
                     $scope.countriesCode[lang] = $scope.languages[lang] == 'en' ? 'gb' : $scope.languages[lang];
                }
                $scope.lang_selected = $scope.languages[UserService.getUiLanguage()] == 'en' ? 'gb' : $scope.languages[UserService.getUiLanguage()];
            } else {
                setTimeout(ensureLanguagesLoaded, 500);
            }

        };
        ensureLanguagesLoaded();
        $scope.refreshProfile = function () {
            UserProfileService.getProfile().then(function (data) {
                // Keep only the fields that matters for a clean PATCH
                $scope.user = {
                    firstname: data.firstname,
                    lastname: data.lastname,
                    email: data.email,
                    language: data.language
                };
            });
        };

        $scope.refreshProfile();


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

        $scope.changeLanguage = function (lang_id) {
            UserService.setUiLanguage(lang_id);
            $scope.user.language = lang_id;
            $rootScope.uiLanguage = lang_id;
            gettextCatalog.setCurrentLanguage($scope.languages[lang_id]);
            $scope.lang_selected = $scope.languages[lang_id] == 'en' ? 'gb' : $scope.languages[lang_id];
            $scope.updatePaginationLabels();
            $scope.updateProfile();
        }

        if (UserService.isAllowed('superadminfo')) {
            $http.get('api/client').then(function (data) {
                if(data.data.clients.length > 0){
                    $scope.client = data.data.clients[0];
                }else{
                    $scope.client = {
                        contact_email: '',
                        id: 0,
                        model_id: 0,
                        name: ''
                    }
                }
            });
        }

        $scope.updateClient = function () {
            if($scope.client.id > 0){
                $http.patch('api/client/' + $scope.client.id, $scope.client).then(function () {
                    toastr.success(gettextCatalog.getString('Your organization information has been updated successfully'));
                });
            }else{
                $http.post('api/client', $scope.client).then(function () {
                    toastr.success(gettextCatalog.getString('Your organization information has been updated successfully'));
                });
            }
        }

        // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
        $scope.escapeRegExp = function (str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    }
})();

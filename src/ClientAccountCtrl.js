(function () {

    angular
        .module('ClientApp')
        .controller('ClientAccountCtrl', [
            '$scope', 'gettext', 'gettextCatalog', 'toastr', '$http', 'UserService', 'UserProfileService',
            'ConfigService', 'localStorageService',
            ClientAccountCtrl
        ]);

    /**
     * Account Controller for the Client module
     */
    function ClientAccountCtrl($scope, gettext, gettextCatalog, toastr, $http, UserService, UserProfileService,
                                   ConfigService, localStorageService) {
        $scope.password = {
            old: '',
            new: '',
            confirm: ''
        }

        var ensureLanguagesLoaded = function () {
            if (ConfigService.isLoaded()) {
                $scope.languages = ConfigService.getLanguages();
                $scope.lang_selected = $scope.languages[UserService.getUiLanguage()].substring(0, 2).toLowerCase();
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
                    phone: data.phone,
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
            gettextCatalog.setCurrentLanguage($scope.languages[lang_id].substring(0, 2).toLowerCase());
            $scope.lang_selected = $scope.languages[lang_id].substring(0, 2).toLowerCase();
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
            var specials = ["-", "[", "]", "/", "{", "}", "(", ")", "*", "+", "?", ".", "\\", "^", "$", "|"],
                regex = RegExp('[' + specials.join('\\') + ']', 'g');
            return str.replace(regex, "\\$&");
        }
    }
})();

(function () {

    angular
        .module('ClientApp')
        .factory('UserService', [
            '$resource', '$http', '$q', 'localStorageService',
            UserService
        ]);

    function UserService($resource, $http, $q, localStorageService) {
        var self = this;

        self.token = null;
        self.uid = null;
        self.authenticated = false;
        self.permissionGroups = [];

        var reauthenticate = function () {
            if (localStorageService.get('auth_token') != null) {
                self.authenticated = true;
                self.token = localStorageService.get('auth_token');
                self.uid = localStorageService.get('uid');
                self.permissionGroups = JSON.parse(localStorageService.get('permission_groups'));
                return true;
            } else {
                return false;
            }
        };

        /**
         * Authenticates the user against the backend authentication API
         * @param login The username
         * @param password The password
         * @returns Promise
         */
        var authenticate = function (login, password) {
            var promise = $q.defer();

            $http.post('/auth', {login: login, password: password}).then(
                function (data) {
                    if (data.status == 200 && data.data && data.data.token) {
                        self.authenticated = true;
                        self.token = data.data.token;
                        self.uid = data.data.uid;

                        localStorageService.set('auth_token', self.token);
                        localStorageService.set('uid', self.uid);
                        localStorageService.set('permission_groups', JSON.stringify([]));

                        $http.get('/api/users-roles').then(
                            function (data) {
                                if (data.status == 200 && data.data && data.data.roles) {
                                    self.permissionGroups = [];

                                    for (var i = 0; i < data.data.roles.length; ++i) {
                                        self.permissionGroups.push(data.data.roles[i].role);
                                    }

                                    localStorageService.set('permission_groups', JSON.stringify(self.permissionGroups));

                                    promise.resolve(true);
                                } else {
                                    self.authenticated = false;
                                    self.token = null;

                                    promise.reject();
                                }
                            },
                            function (data) {
                                self.authenticated = false;
                                self.token = null;

                                promise.reject();
                            }
                        )
                    } else {
                        self.authenticated = false;
                        self.token = null;

                        promise.reject();
                    }
                },

                function (data) {
                    self.authenticated = false;
                    self.token = null;

                    promise.reject();
                }
            );

            return promise.promise;
        };

        /**
         * Clears the active authentication and revokes the active authentication token
         * @returns Promise
         */
        var logout = function () {
            self.token = null;
            self.authenticated = false;

            return $http.delete('/auth');
        };

        /**
         * @returns {null|string} The current active token, or null
         */
        var getToken = function () {
            return self.token;
        };

        /**
         * @returns {null|int} The current user ID, or null
         */
        var getUserId = function () {
            return self.uid;
        }

        /**
         * @returns {boolean} True if authenticated, false otherwise
         */
        var isAuthenticated = function () {
            return self.authenticated;
        };

        /**
         * @param group The group we need to check for permission (superadmin, sysadmin, dbadmin, accadmin)
         * @returns {boolean} True if the user has access to elements in the group, false otherwise
         */
        var isAllowed = function (group) {
            return (self.permissionGroups.indexOf(group) >= 0);
        };

        ////////////////////////////////////

        return {
            reauthenticate: reauthenticate,
            authenticate: authenticate,
            logout: logout,
            getToken: getToken,
            getUserId: getUserId,
            isAuthenticated: isAuthenticated,
            isAllowed: isAllowed
        };
    }

})
();
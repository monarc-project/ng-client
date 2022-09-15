(function () {

  angular
  .module('ClientApp')
  .factory('UserService', [
    '$rootScope', '$http', '$q', 'localStorageService', 'ConfigService', 'gettextCatalog', 'toastr',
    UserService
  ]);

  function UserService($rootScope, $http, $q, localStorageService, ConfigService, gettextCatalog, toastr) {
    var self = this;

    self.token = null;
    self.qrcode = null;
    self.otpSecret = null;
    self.uid = null;
    self.authenticated = false;
    self.uiLanguage = null;
    self.isLoggingOut = false;
    self.permissionGroups = [];

    var reauthenticate = function () {
      if (localStorageService.get('auth_token') != null) {
        self.authenticated = true;
        self.token = localStorageService.get('auth_token');
        self.uid = localStorageService.get('uid');
        self.permissionGroups = JSON.parse(localStorageService.get('permission_groups'));
        self.uiLanguage = localStorageService.get('uiLanguage');

        updateRoles();

        return true;
      } else {
        return false;
      }
    };

    var updateRoles = function (promise) {
      $http.get('api/users-roles').then(
        function (data) {
          if (data.status == 200 && data.data && data.data.roles) {
            self.permissionGroups = [];

            for (var i = 0; i < data.data.roles.length; ++i) {
              self.permissionGroups.push(data.data.roles[i].role);
            }

            localStorageService.set('permission_groups', JSON.stringify(self.permissionGroups));

            if (promise) {
              promise.resolve(true);
            }
          } else {
            self.authenticated = false;
            self.token = null;

            if (promise) {
              promise.reject();
            }
          }
        },
        function (data) {
          self.authenticated = false;
          self.token = null;

          if (promise) {
            toastr.error(gettextCatalog.getString("All your rights have been revoked. Please contact the manager for your organization."))
            promise.reject(true);
          }
        }
      )
    };

    /**
    * Authenticates the user against the backend authentication API
    * @param login The username
    * @param password The password
    * @param otp The one-time assword
    * @param recoveryCode The one-time assword
    * @returns Promise
    */
    var authenticate = function (login, password, otp, recoveryCode, verificationCode) {
      var promise = $q.defer();

      var payload = {
        login: login,
        password: password,
      }
      if (otp) {
        payload["otp"] = otp
      }
      if (recoveryCode) {
        payload["recoveryCode"] = recoveryCode
      }
      if (verificationCode) {
        payload["verificationCode"] = verificationCode
      }
      if (self.otpSecret) {
        payload["otpSecret"] = self.otpSecret
      }

      $http.post('auth', payload).then(
        function (data) {
          if (data.status == 200 && data.data && data.data.token) {
            self.authenticated = true;
            self.token = data.data.token;
            self.uid = data.data.uid;
            self.uiLanguage = data.data.language;

            localStorageService.set('auth_token', self.token);
            localStorageService.set('uid', self.uid);
            localStorageService.set('permission_groups', JSON.stringify([]));
            localStorageService.set('uiLanguage', data.data.language);

            if (data.data.language === undefined || data.data.language === null) {
              gettextCatalog.setCurrentLanguage('en');
              $rootScope.uiLanguage = 'gb';
            } else {
              gettextCatalog.setCurrentLanguage($rootScope.languages[self.uiLanguage].code);
              $rootScope.uiLanguage = $rootScope.languages[self.uiLanguage].flag;
            }

            updateRoles(promise);
          } else {
            self.authenticated = false;
            self.token = null;

            promise.reject();
          }
        },

        function (data) {
          self.authenticated = false;
          self.token = null;
          if (data.data.token == "2FARequired") {
            promise.reject("2FARequired");
          }
          if (data.data.token == "2FAToBeConfigured") {
            self.otpSecret = data.data.secret;
            promise.reject("2FAToBeConfigured:"+data.data.qrcode);
          }

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
      var promise = $q.defer();
      $http.delete('auth').then(function (data) {
        localStorageService.set('permission_groups', JSON.stringify([]));
        localStorageService.set('auth_token', null);
        localStorageService.set('uid', null);

        self.token = null;
        self.authenticated = false;
        self.permissionGroups = [];
        self.uid = null;

        promise.resolve(data);
      }, function (data) {
        promise.reject(data);
      });

      return promise.promise;
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

    var isLoggingOut = function () {
      return self.isLoggingOut;
    };

    var getUiLanguage = function () {
      return self.uiLanguage;
    };

    var setUiLanguage = function (lang) {
      localStorageService.set('uiLanguage', lang);
      self.uiLanguage = lang;
    }

    ////////////////////////////////////

    return {
      reauthenticate: reauthenticate,
      authenticate: authenticate,
      logout: logout,
      getToken: getToken,
      getUserId: getUserId,
      getUiLanguage: getUiLanguage,
      setUiLanguage: setUiLanguage,
      isAuthenticated: isAuthenticated,
      isAllowed: isAllowed,
    };
  }

})
();

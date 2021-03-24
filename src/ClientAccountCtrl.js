(function () {

    angular
        .module('ClientApp')
        .controller('ClientAccountCtrl', [
            '$scope', '$rootScope', '$state', '$q', '$mdMedia', '$mdDialog', 'gettext', 'gettextCatalog',
            'toastr', '$http', 'UserService', 'UserProfileService',
            ClientAccountCtrl
        ]);

    /**
     * Account Controller for the Client module
     */
    function ClientAccountCtrl($scope, $rootScope, $state, $q, $mdMedia, $mdDialog, gettext, gettextCatalog,
                              toastr, $http, UserService, UserProfileService) {
        $scope.password = {
            old: '',
            new: '',
            confirm: ''
        }

        $scope.typePassword = false;

        $scope.refreshProfile = function () {
            UserProfileService.getProfile().then(function (data) {
                // Keep only the fields that matters for a clean PATCH
                $scope.user = {
                    firstname: data.firstname,
                    lastname: data.lastname,
                    email: data.email,
                    mospApiKey: data.mospApiKey,
                };

                validateMospApiKey().then(function(data){
                  $scope.acceptMospApiKey = data
                });
            });
        };

        $scope.updateProfile = function () {
            validateMospApiKey().then(function(data){
              $scope.acceptMospApiKey = data;
              if (data !== false) {
                UserProfileService.updateProfile($scope.user, function (data) {
                    toastr.success(gettextCatalog.getString('Your profile has been edited successfully'), gettext('Profile edited'));
                });
              }
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
        };

        $scope.regenerateToken = function () {
          let params = {
            headers : {
              'X-API-KEY' : $scope.user.mospApiKey,
              'Accept' : 'application/json'
            }
          };

          $http.get($rootScope.mospApiUrl + 'v2/user/me/regenerate-token', params).then(function (data){
            $scope.user.mospApiKey = data.data['api-key'];
            $scope.updateProfile();
          }, function(error){
            toastr.error(error.data.Error, gettextCatalog.getString('Error'));
          });
        };

        $scope.createMospAccount = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$rootScope', '$mdDialog', 'toastr', '$http', 'user', createMospAccountDialogCtrl],
                templateUrl: 'views/dialogs/create.mospAccount.html',
                targetEvent: ev,
                preserveScope: true,
                scope: $scope,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                  user : $scope.user
                }
            })
                .then(function (mospAccount) {

                  let params = {
                    headers : {
                      'Content-Type' : 'application/json',
                      'Accept' : 'application/json'
                    }
                  };

                  $http.post($rootScope.mospApiUrl + 'v2/user/', mospAccount, params)
                  .then(function(){
                    toastr.success(gettextCatalog.getString('The MOSP account has been created successfully. You will get a confirmation mail'), gettextCatalog.getString('Creation successful'));
                  }, function(error){
                    toastr.error(error.data.message, gettextCatalog.getString('Error'));
                  });

                }, function (reject) {
                  $scope.handleRejectionDialog(reject);
                });
        };

        function validateMospApiKey() {
          let promise = $q.defer();
          if ($scope.user.mospApiKey) {
            let params = {
                headers : {
                  'X-API-KEY' : $scope.user.mospApiKey,
                  Accept : 'application/json'
                }
            };

            $http.get($rootScope.mospApiUrl + 'v2/user/me', params)
              .then(function (){
                promise.resolve(true);
              }, function (data){
                toastr.error(gettextCatalog.getString('Wrong MOSP API Key. Try again.'), data.data.Error + ' ' + gettextCatalog.getString('Error'));
                promise.resolve(false);

            });
          }else {
            promise.resolve(undefined);
          }
          return promise.promise;
        }

        $scope.togglePassword = function () {
          $scope.typePassword = !$scope.typePassword;
        }

        // http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
        $scope.escapeRegExp = function (str) {
            return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }
    }

    function createMospAccountDialogCtrl($scope, $rootScope, $mdDialog, toastr, $http, user) {

        let params = {
          headers : {
            'Accept' : 'application/json'
          },
          params :{
            'is_membership_restricted' : false,
          }
        };

        $http.get($rootScope.mospApiUrl + 'v2/organization/', params).then(function (data){
          $scope.mospOrganizations = data.data.data;
          $scope.mospAccount = {
            login : (user.firstname + '.' + user.lastname).toLowerCase(),
            email: user.email,
          }
        }, function(error){
          toastr.error(error.data.Error, gettextCatalog.getString('Error'));
        });


        $scope.cancel = function() {
            $mdDialog.cancel();
        };

        $scope.create = function() {
            $mdDialog.hide($scope.mospAccount);
        };
    }

})();

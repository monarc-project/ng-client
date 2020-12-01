(function () {

    angular
        .module('ClientApp')
        .controller('ClientSettingsCtrl', [
            '$scope', 'gettextCatalog', 'toastr', '$http', 'StatsService',
            ClientSettingsCtrl
        ]);

    /**
     * Account Controller for the Client module
     */
    function ClientSettingsCtrl($scope, gettextCatalog, toastr, $http, StatsService) {

        $scope.getSettings = function() {
          $http.get('api/client').then(function (data) {
              if(data.data.clients.length > 0){
                  $scope.client = data.data.clients[0];

                  StatsService.getGeneralSettings()
                    .then(function(data){
                      $scope.client.stats = data.data.is_sharing_enabled;
                    });
              }else{
                  $scope.client = {
                      contact_email: '',
                      id: 0,
                      model_id: 0,
                      name: '',
                      stats: false,
                  }
              }
          });
        }

        $scope.updateClient = function () {
            if($scope.client.id > 0){
                $http.patch('api/client/' + $scope.client.id, $scope.client).then(function () {
                  StatsService.updateGeneralSettings(null,{is_sharing_enabled: $scope.client.stats}).then(function () {
                    toastr.success(gettextCatalog.getString('Your settings have been updated successfully'));
                  });
                });
            }else{
                $http.post('api/client', $scope.client).then(function () {
                  StatsService.updateGeneralSettings(null,{is_sharing_enabled: $scope.client.stats}).then(function () {
                    toastr.success(gettextCatalog.getString('Your settings have been updated successfully'));
                  });
                });
            }
        }
    }
})();

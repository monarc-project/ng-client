
function CreateRiskAnalysisDialog($scope, $mdDialog, $http, $q, ConfigService, ModelService,
                                    ClientAnrService, ReferentialService, anr) {
    $scope.languages = ConfigService.getLanguages();
    $scope.smileModels = [];
    $scope.myAnrs = [];
    $scope.anr = anr || {};

    if (anr !== undefined) {
      ReferentialService.getReferentials({order: 'createdAt'}).then(function (e) {
        $scope.anr.referentials = e.referentials;
      });
    }else {
      $scope.anr.referentials = [];
    }


    $scope.$watch('anr.model', function (newValue) {
        if (newValue) {
            $http.get('api/model-verify-language/' + newValue).then(function (data) {
                $scope.acceptableLangs = data.data;
            })
        }
    });

    ClientAnrService.getAnrs().then(function (data) {
        $scope.myAnrs = [];
        $scope.anrById = {};

        for (var i = 0; i < data.anrs.length; ++i) {
            var anr = data.anrs[i];

            if (anr.rwd >= 0) {
                $scope.myAnrs.push(anr);
                $scope.anrById[anr.id] = anr;
            }
        }

        $scope.myAnrs.sort(function (a, b) {
            var str1 = a['label' + a.language];
            var str2 = b['label' + b.language];
            return ( ( str1 == str2 ) ? 0 : ( ( str1 > str2 ) ? 1 : -1 ) );
        })

        if ($scope.myAnrs && $scope.myAnrs.length == 0) {
            $scope.anr.sourceType = 1;
        }
    }, function () {
        // Error, force SMILE model
        $scope.anr.sourceType = 1;
    });

    $scope.modelHasRawRolf = function () {
        if ($scope.anr && $scope.anr.model > 0) {
            for (var i = 0; i < $scope.smileModels.length; ++i) {
                if ($scope.smileModels[i].id == $scope.anr.model) {
                    return $scope.smileModels[i].showRolfBrut;
                }
            }
        }

        return false;
    }

    ModelService.getModels().then(function (data) {
        $scope.smileModels = data.models;
    })

    $scope.queryReferentialsSearch = function (query) {
        var promise = $q.defer();
        ReferentialService.getReferentialsCommon({filter: query, order: 'uuid'}).then(function (e) {
          var filtered = [];
          for (var j = 0; j < e.referentials.length; ++j) {
              var found = false;
              for (var i = 0; i < $scope.anr.referentials.length; ++i) {

                  if ($scope.anr.referentials[i].uuid == e.referentials[j].uuid) {
                      found = true;
                      break;
                  }
              }

              if (!found) {
                  filtered.push(e.referentials[j]);
              }
          }

          promise.resolve(filtered);
        }, function (e) {
            promise.reject(e);
        });

        return promise.promise;
    };

    $scope.cancel = function () {
        $mdDialog.cancel();
    };

    $scope.create = function () {
        $mdDialog.hide($scope.anr);
    };

    $scope.changeOptionResetLanguage = function(){
        $scope.anr.language = 0;
    }
}

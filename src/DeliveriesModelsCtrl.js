(function () {

    angular
        .module('ClientApp')
        .controller('DeliveriesModelsCtrl', [
            '$scope', '$mdDialog', '$mdMedia', '$http', 'toastr', 'gettextCatalog', 'DeliveriesModelsService',
            'ConfigService', '$timeout', 'DownloadService',
            DeliveriesModelsCtrl
        ]);

    /**
     * KB > Document Models Controller for the Backoffice module
     */
    function DeliveriesModelsCtrl($scope, $mdDialog, $mdMedia, $http, toastr, gettextCatalog,
                                     DeliveriesModelsService, ConfigService, $timeout, DownloadService) {
        $scope.deliveriesmodels = [];

        $timeout(function () {
            $scope.languages = ConfigService.getLanguages();
            $scope.categories = DeliveriesModelsService.getCategories();
        }, 1000);


        $scope.updateDeliveriesModels = function () {
            DeliveriesModelsService.getDeliveriesModels().then(function (data) {
                if (data.deliveriesmodels) {
                    $scope.deliveriesmodels = data.deliveriesmodels;
                }
            });
        }
        $scope.updateDeliveriesModels();

        $scope.createNewDeliveryModel = function (ev) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'toastr', 'gettextCatalog', 'ConfigService', 'DeliveriesModelsService', 'Upload', CreateDeliveryModelDialogCtrl],
                templateUrl: 'views/dialogs/create.deliverymodel.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen
            })
                .then(function (deliveryModel) {
                    $scope.updateDeliveriesModels();
                    toastr.success(gettextCatalog.getString('The document has been created successfully.',
                        {deliveryModelLabel: $scope._langField(deliveryModel,'description')}), gettextCatalog.getString('Creation successful'));
                });
        };

        $scope.editDeliveryModel = function (ev, deliverymodel) {
            var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));
            deliverymodel.editable = 1;

            $mdDialog.show({
                controller: ['$scope', '$mdDialog', 'toastr', 'gettextCatalog','ConfigService', 'DeliveriesModelsService', 'Upload', 'deliverymodel', CreateDeliveryModelDialogCtrl],
                templateUrl: 'views/dialogs/create.deliverymodel.html',
                targetEvent: ev,
                clickOutsideToClose: false,
                fullscreen: useFullScreen,
                locals: {
                    deliverymodel: deliverymodel
                }
            })
                .then(function (deliveryModel) {
                    $scope.updateDeliveriesModels();
                    toastr.success(gettextCatalog.getString('The document has been edited successfully.',
                        {deliveryModelLabel: $scope._langField(deliveryModel,'description')}), gettextCatalog.getString('Edition successful'));
                });
        };

        $scope.deleteDeliveryModel = function (ev, item) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete document?',
                    {label: $scope._langField(item,'description')}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .theme('light')
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                DeliveriesModelsService.deleteDeliveryModel(item.id,
                    function () {
                        $scope.updateDeliveriesModels();
                        toastr.success(gettextCatalog.getString('The document has been deleted.',
                            {label: $scope._langField(item,'description')}), gettextCatalog.getString('Deletion successful'));
                    }
                );
            });
        };

        $scope.isPresentModel = function (item, lang)
        {
          if (item['path' + lang] && item['path' + lang]!="null") {
            return true;
          }else {
            return false;
          }
        }
        $scope.downloadDeliveryModel = function (item, lang) {
            if (item['path' + lang]) {
                $http.get(item['path' + lang], {responseType: 'arraybuffer'}).then(function (data) {
                    var contentD = data.headers('Content-Disposition'),
                        contentT = data.headers('Content-Type');
                    contentD = contentD.substring(0, contentD.length - 1).split('filename="');
                    contentD = contentD[contentD.length - 1];
                    contentD = contentD.substring(14, contentD.length); //remove the random characters
                    DownloadService.downloadBlob(data.data, item['description' + lang]+'.docx', contentT);
                });
            } else {
                toastr.warning(gettextCatalog.getString("There is no document template of this category for this language."));
            }

        }

        $scope.getCategoryLabel = function (id) {
            return DeliveriesModelsService.getCategoryLabel(id);
        };

    }


    function CreateDeliveryModelDialogCtrl($scope, $mdDialog, toastr, gettextCatalog, ConfigService, DeliveriesModelsService, Upload, deliverymodel) {
        $scope.languages = ConfigService.getLanguages();
        $scope.languagesNames = {};
        angular.copy($scope.languages, $scope.languagesNames);
        for (lang in $scope.languages) {
             $scope.languagesNames[lang] = ISO6391.getName($scope.languages[lang] == 'gb' ? 'en' : $scope.languages[lang]);
        }
        $scope.language = ConfigService.getDefaultLanguageIndex();

        if (deliverymodel) {
            $scope.deliveryModel = deliverymodel;
            for (var i = 1; i <= 4; ++i) {
                if ($scope.deliveryModel['description' + i] == null) {
                    $scope.deliveryModel['description' + i] = undefined;
                }
            }
        } else {
            $scope.deliveryModel = {
                category: null,
                editable: 1,
                // description: ''
            };
        }

        $scope.categories = DeliveriesModelsService.getCategories();

        $scope.range = function (min, max) {
            var ret = [];
            for (var i = min; i <= max; ++i) {
                ret.push(i);
            }
            return ret;
        }

        $scope.uploadProgress = null;
        $scope.file = {};

        // Upload system
        $scope.cancel = function () {
            $mdDialog.cancel();
        };

        $scope.create = function () {
            var hasErrors = false;
            var hasFiles = false;

            for (var i = 1; i <= 4; ++i) {
                if ($scope.file[i]) {
                    hasFiles = true;

                    if ($scope.file[i].$error) {
                        hasErrors = true;
                        break;
                    }

                    if ($scope.deliveryModel['description' + i] == undefined) {
                        hasErrors = true;
                        toastr.error($scope.file.$error, gettextCatalog.getString('Missing description for ') + $scope.languages[i]);
                        break;
                    }
                }
            }

            if (hasFiles && !hasErrors) {
                $scope.uploadProgress = 0;

                var performUpload = function () {

                    Upload.upload({
                        url: $scope.deliveryModel.id ? 'api/deliveriesmodels/' + $scope.deliveryModel.id : 'api/deliveriesmodels',
                        method: 'POST',
                        file: $scope.file,
                        data: $scope.deliveryModel
                    }).then(function (resp) {
                        $scope.uploadProgress = null;
                        if (resp.status == 200) {
                            $mdDialog.hide($scope.deliveryModel);
                        }
                    }, function (resp) {
                        toastr.error(gettextCatalog.getString('The server returned the error code:') + ' ' + resp.status, gettextCatalog.getString('Error while uploading'))
                    }, function (evt) {
                        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
                        $scope.uploadProgress = progressPercentage;
                    })
                }

                if ($scope.deliveryModel.id) {
                    DeliveriesModelsService.deleteDeliveryModel($scope.deliveryModel.id, function () {
                        $scope.deliveryModel.id = undefined;
                        $scope.deliveryModel.anr = undefined;
                        performUpload();
                    });
                } else {
                    performUpload();
                }

            } else if (hasFiles && hasErrors) {
                toastr.error($scope.file.$error, gettextCatalog.getString('File error'));
            } else if ($scope.deliveryModel.id > 0) {
                DeliveriesModelsService.updateDeliveryModel($scope.deliveryModel, function () {
                    $mdDialog.hide($scope.deliveryModel);
                }, function () {

                });
            } else {
                toastr.warning(gettextCatalog.getString('You must select a file'));
            }
        };
    }

})();

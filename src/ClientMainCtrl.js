(function () {

    angular
        .module('ClientApp')
        .controller('ClientMainCtrl', [
            '$scope', '$rootScope', '$state', '$mdSidenav', '$mdMedia', '$mdDialog', 'gettextCatalog', 'UserService',
            'ClientAnrService', 'toastr', 'verticalBarChartService', 'horizontalBarChartService','lineChartService',
            ClientMainCtrl
        ]);

    /**
     * Main Controller for the Client module
     */
    function ClientMainCtrl($scope, $rootScope, $state, $mdSidenav, $mdMedia, $mdDialog, gettextCatalog, UserService,
                            ClientAnrService, toastr, verticalBarChartService, horizontalBarChartService, lineChartService) {
        if (!UserService.isAuthenticated() && !UserService.reauthenticate()) {
            setTimeout(function () {
                $state.transitionTo('login');
            }, 1);

            return;
        }

        $rootScope.appVersionCheckingTimestamp = new Date().getTime();

        $rootScope.BreadcrumbAnrHackLabel = '_';
        $rootScope.isAllowed = UserService.isAllowed;
        gettextCatalog.debug = true;

        $scope.sidenavIsOpen = $mdMedia('gt-md');
        $scope.isLoggingOut = false;

        // Translations helper
        $scope.setLang = function (lang) {
            gettextCatalog.setCurrentLanguage(lang);
        };

        // Toolbar helpers
        $scope.openToolbarMenu = function ($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        };

        $scope.logout = function () {
            $scope.isLoggingOut = true;

            UserService.logout().then(
                function () {
                    $scope.isLoggingOut = false;
                    $state.transitionTo('login');
                },

                function () {
                    // TODO
                    $scope.isLoggingOut = false;
                }
            )
        };

        // Sidenav helpers
        $scope.closeLeftSidenav = function () {
            $scope.sidenavIsOpen = false;
            $mdSidenav('left').close();
        };
        $scope.openLeftSidenav = function () {
            if ($mdMedia('gt-md')) {
                $scope.sidenavIsOpen = true;
            }
            $mdSidenav('left').open();
        };

        // Menu actions
        $scope.sidebarCreateNewANR = function (ev) {
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', '$http', '$q', 'ConfigService', 'ModelService',
                    'ClientAnrService', 'ReferentialService', CreateRiskAnalysisDialog],
                templateUrl: 'views/dialogs/create.anr.html',
                clickOutsideToClose: false,
                targetEvent: ev,
                scope: $rootScope.$dialogScope.$new()
            })
                .then(function (anr) {
                    $scope.clientAnrIsCreating = true;

                    if (anr.sourceType == 1) {
                        // SMILE model
                        ClientAnrService.createAnrFromModel(anr, function (data) {
                            updateMenuANRs();

                            // Redirect to ANR
                            $state.transitionTo('main.project.anr', {modelId: data.id});
                            toastr.success(gettextCatalog.getString('The risk analysis has been successfully created from the model.'), gettextCatalog.getString('Creation successful'));
                        });
                    } else if (anr.sourceType == 2) {
                        // Existing source
                        ClientAnrService.duplicateAnr(anr, function (data) {
                            updateMenuANRs();

                            // Redirect to ANR
                            $state.transitionTo('main.project.anr', {modelId: data.id});
                            toastr.success(gettextCatalog.getString('The risk analysis has been successfully duplicated.'), gettextCatalog.getString('Duplication successful'));
                        });
                    }
                });
        };

        $scope.deleteClientAnrGlobal = function (ev, anr, cb) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the risk analysis?',
                    {label: $scope._langField(anr,'label')}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .theme('light')
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ClientAnrService.deleteAnr(anr.id,
                    function () {
                        updateMenuANRs();
                        toastr.success(gettextCatalog.getString('The risk analysis has been deleted.'), gettextCatalog.getString('Deletion successful'));

                        if (cb) {
                            cb();
                        }
                    }
                );
            });
        };

        $rootScope.$on('fo-anr-changed', function () {
            updateMenuANRs();
        })

        // Menu ANRs preloading
        var updateMenuANRs = function () {
            ClientAnrService.getAnrs().then(function (data) {
                $scope.clientAnrIsCreating = false;
                $scope.clientAnrs = [];

                for (var i = 0; i < data.anrs.length; ++i) {
                    var anr = data.anrs[i];
                    if (anr.rwd >= 0) {
                        $scope.clientAnrs.push(anr);
                    }
                }

                $scope.clientAnrs.sort(function (a, b) {
                    let anrLabelA = a['label' + a['language']].toLowerCase()
                    let anrLabelB = b['label' + b['language']].toLowerCase();
                    if (anrLabelA < anrLabelB)  {return -1;}
                    if (anrLabelA > anrLabelB)  {return 1;}
                    return 0;
                });

                $scope.clientCurrentAnr = null;
                for (var i = 0; i < $scope.clientAnrs.length; ++i) {
                    if ($scope.clientAnrs[i].isCurrentAnr) {
                        $scope.clientCurrentAnr = $scope.clientAnrs[i];
                        break;
                    }
                }
            });
        };

        updateMenuANRs();

        /**
        * Exemple Data
        */

        dataSample = [
          {category:'ANR 1',
            series: [
              {label:"Low risks", value:50},
              {label:"Medium risks",value:30},
              {label:"High risks", value:10}
            ]
          },
          {category:'ANR 2',
            series: [
              {label:"Low risks", value:40},
              {label:"Medium risks", value:20},
              {label:"High risks", value:5}
            ]
          },
          {category:'ANR 3',
            series: [
              {label:"Low risks", value:20},
              {label:"Medium risks", value:12},
              {label:"High risks", value:45}
            ]
          },
          {category:'ANR 4',
            series: [
              {label:"Low risks", value:35},
              {label:"Medium risks", value:20},
              {label:"High risks", value:16}
            ]
          },
          {category:'ANR 5',
            series: [
              {label:"Low risks", value:17},
              {label:"Medium risks", value:23},
              {label:"High risks", value:16}
            ]
          },
          {category:'ANR 6',
            series: [
              {label:"Low risks", value:32},
              {label:"Medium risks", value:27},
              {label:"High risks", value:2}
            ]
          },
          {category:'ANR 7',
            series: [
              {label:"Low risks", value:32},
              {label:"Medium risks", value:5},
              {label:"High risks",value:1}
            ]
          }
        ];

        dataSampleTimeGraphForOneAnr = [
          {
            category:'ANR 1',
            series : [
              {
                category:"Abuse of rights",
                series:[
                  {label:"2019-01-04", value:3},
                  {label:"2020-01-05",value:2},
                  {label:"2020-03-06", value:5}
                ]
              },
              {
                category:"Breach of information system maintainability",
                series:[
                  {label:"2019-05-04", value:1},
                  {label:"2020-01-05",value:1},
                  {label:"2020-05-06", value:1}
                ]
              },
              {
                category:"Breach of personnel availability",
                series:[
                  {label:"2019-05-04", value:5},
                  {label:"2020-02-05",value:0},
                  {label:"2020-04-06", value:1}
                ]
              },
              {
                category:"Corruption of data",
                series:[
                  {label:"2019-05-04", value:2},
                  {label:"2020-02-25",value:1},
                  {label:"2020-04-06", value:1}
                ]
              },
              {
                category:"Data from untrustworthy sources",
                series:[
                  {label:"2019-05-04", value:5},
                  {label:"2020-03-01",value:0},
                  {label:"2020-04-06", value:1}
                ]
              }
            ]
          },
          {
            category:'ANR2',
            series : [
              {
                category:"Denial of actions",
                series:[
                  {label:"2019-05-04", value:3},
                  {label:"2020-01-01",value:2},
                  {label:"2020-05-06", value:1}
                ]
              },
              {
                category:"Destruction of equipment or supports",
                series:[
                  {label:"2019-05-04", value:1},
                  {label:"2020-01-25",value:2},
                  {label:"2020-03-06", value:3}
                ]
              },
              {
                category:"Disclosure",
                series:[
                  {label:"2019-05-04", value:1},
                  {label:"2019-12-05",value:1},
                  {label:"2020-04-06", value:1}
                ]
              },
              {
                category:"Corruption of data",
                series:[
                  {label:"2019-05-04", value:5},
                  {label:"2019-11-01",value:0},
                  {label:"2020-04-06", value:3}
                ]
              },
              {
                category:"Data from untrustworthy sources",
                series:[
                  {label:"2019-05-04", value:5},
                  {label:"2020-02-27",value:3},
                  {label:"2020-04-06", value:1}
                ]
              }
            ]
          }
        ];

        $scope.categories = dataSample.map(function(d) { return d.category; });
        $scope.subCategories = [];
        dataSampleTimeGraphForOneAnr.map(function(cat){
          cat.series.forEach(function(subcat){
            if($scope.subCategories.indexOf(subcat.category)===-1)
              $scope.subCategories.push(subcat.category);
          });
        });

        $scope.selectGraphRisks = function () {
            options = {'width':450,'height':300}
            verticalBarChartService.draw('#graphGlobalRisk',dataSample,options);
        };

        $scope.selectGraphVulnerabilities = function () {
            options = {'width':450,'height':300}
            horizontalBarChartService.draw('#graphHorizBarChart',dataSample,options);
        };

        $scope.selectGraphThreats = function () {
            options2 = {'width':1000,'height':500,'lineColor':["#1d19eb"],'externalFilterSubCateg':".filter-subCategories"}
            lineChartService.draw('#graphLineChart',dataSampleTimeGraphForOneAnr,options2);
        };


    }

})();

(function () {

  angular
      .module('ClientApp')
      .controller('ClientMainCtrl', [
          '$scope', '$rootScope', '$state', '$http', '$mdSidenav', '$mdMedia', '$mdDialog', 'gettextCatalog', 'UserService',
          'ClientAnrService', 'ChartService', 'toastr', ClientMainCtrl
      ]);

  /**
   * Main Controller for the Client module
   */
  function ClientMainCtrl($scope, $rootScope, $state, $http, $mdSidenav, $mdMedia, $mdDialog, gettextCatalog, UserService,
                          ClientAnrService, ChartService, toastr ) {
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

///////////////////////// GLOBAL DASHBOARD /////////////////////////////////////

// OPTIONS CHARTS ==============================================================

    //Options of chart displaying current/residual risks
    const optionsHorizontalCurrentRisks = {
      margin: {
        top: 30,
        right: 150,
        bottom: 30,
        left: 100
      },
      width: 550,
      height: 550,
      externalFilter: '.filter-categories-graphGlobalCurrentRisks',
      radioButton: '.chartMode-graphGlobalCurrentRisks',
      showValues: true
    };

    const optionsVerticalCurrentRisks = $.extend(
      angular.copy(optionsHorizontalCurrentRisks), {
        margin: {
          top: 30,
          right: 100,
          bottom: 100,
          left: 30
        },
        externalFilter: '.filter-categories-graphGlobalCurrentRisks',
        radioButton: '.chartMode-graphGlobalCurrentRisks',
        rotationXAxisLabel: 45,
        offsetXAxisLabel: 0.9
      }
    );

    const optionsHorizontalResidualRisks = $.extend(
      angular.copy(optionsHorizontalCurrentRisks), {
        externalFilter: '.filter-categories-graphGlobalResidualRisks',
        radioButton: '.chartMode-graphGlobalResidualRisks',
      }
    );

    const optionsVerticalResidualRisks = $.extend(
      angular.copy(optionsVerticalCurrentRisks), {
        externalFilter: '.filter-categories-graphGlobalResidualRisks',
        radioButton: '.chartMode-graphGlobalResidualRisks',
      }
    );

    //Options of threats chart

    const optionsThreats = {
      width: 1000,
      height: 500,
      externalFilter: true,
      nameValue: 'averageRate'
    }

// DATA MODELS =================================================================

    //Data Model for the graph for the current/target information risk
    var dataCurrentRisks = [];
    var dataResidualRisks = [];

    //Data Model for the graph for the threats by anr
    var allThreats = [];
    var dataThreats = [];

// INIT FUNCTION ==================================================================

    function updateGlobalDashboard() {
    $scope.risksOptions = {
      current: "horizontal",
      residual: "horizontal"
    };

    getRiskAndVulnerabilitiesStats();
    getThreatsStats();

  }

// WATCHERS ====================================================================

    $scope.$watch('risksOptions.current', function() {
      drawCurrentRisk();
    });
    $scope.$watch('risksOptions.residual', function() {
      drawResidualRisk();
    });

    $scope.$watch('threatSelected.value', function(newValue) {
      dataThreats = allThreats.map(
        x => { return {
          ...x,
          series: x.series.filter(
            y => y.category == newValue
          )
        }}
      );
      optionsThreats.title = newValue;
      drawThreats();
    });

// DRAW CHART FUNCTIONS ========================================================

    function drawCurrentRisk() {
      if ($scope.risksOptions.current == 'vertical') {
        dataCurrentRisks.sort(
          function(a, b) {
            return a.category.localeCompare(b.category)
          }
        );
        ChartService.multiVerticalBarChart(
          '#graphGlobalCurrentRisks',
          dataCurrentRisks,
          optionsVerticalCurrentRisks
        );
      }
      if ($scope.risksOptions.current == 'horizontal') {
        ChartService.multiHorizontalBarChart(
          '#graphGlobalCurrentRisks',
          dataCurrentRisks,
          optionsHorizontalCurrentRisks
        );
      }
    };

    function drawResidualRisk() {
      if ($scope.risksOptions.residual == 'vertical') {
        dataResidualRisks.sort(
          function(a, b) {
            return a.category.localeCompare(b.category)
          }
        );
        ChartService.multiVerticalBarChart(
          '#graphGlobalResidualRisks',
          dataResidualRisks,
          optionsVerticalResidualRisks
        );
      }
      if ($scope.risksOptions.residual == 'horizontal') {
        ChartService.multiHorizontalBarChart(
          '#graphGlobalResidualRisks',
          dataResidualRisks,
          optionsHorizontalResidualRisks
        );
      }
    };

    function drawThreats() {
      ChartService.lineChart(
        '#graphLineChart',
        dataThreats,
        optionsThreats
      );
    };

// UPDATE CHART FUNCTIONS ======================================================

    // TODO: In General:
    // 1. this is just an example.
    // 2. fetures of zm_client, zm_core -> feature/stats

    // Note: The structure suppose to have 'current' and 'residual' keys inside.

    updateGlobalDashboard();

    function getRiskAndVulnerabilitiesStats() {
      let params = {
        type: "risk",
        getLast: true
      }
      $http.get("api/stats/",{params: params})
        .then(function (response) {
          dataCurrentRisks = response.data['current'];
          dataResidualRisks = response.data['residual'];

          $scope.categories = dataCurrentRisks.map(function (d) {
              return d.category;
          });

          drawCurrentRisk();
          drawResidualRisk();
      });
    }

    // TODO: probaly date from a date time picker or period range selector.
    function getThreatsStats() {
        let params = {
          type: "threat"
        }
        $http.get("api/stats/",{params: params})
          .then(function (response) {
            allThreats = response.data;

            let allValues = allThreats.flatMap(
              cat => cat.series.flatMap(
                subCat => subCat.series.flatMap(
                  d => d['averageRate']
                )
              )
            );

            optionsThreats.forceMaxY = Math.max(...allValues);

            $scope.threats = [...new Set(
              allThreats.flatMap(
                cat => cat.series.flatMap(
                  serie => serie.category
                )
              )
            )];

            $scope.threats.sort(
              function(a, b) {
                return a.localeCompare(b)
              }
            );

            $scope.threatSelected = {
              value: $scope.threats[0]
            };

            optionsThreats.title = $scope.threatSelected.value;

            dataThreats = allThreats.map(x => {
              return {...x,series: x.series.filter(
                y => y.category == $scope.threatSelected.value)}
              }
            );

        });
    };

    // TODO: if we need the Vulnerabilities stats in the same format as threats,
    //       then it can be fetched by {"type": "vulnerability"}


    // Cartography chart setting up.
    $scope.selectGraphCartography = function () {
      data = [
        {y: 0, x: 0, value: null},
        {y: 0, x: 1, value: null},
        {y: 0, x: 2, value: null},
        {y: 0, x: 3, value: null},
        {y: 0, x: 4, value: null},
        {y: 0, x: 5, value: null},
        {y: 0, x: 6, value: null},
        {y: 0, x: 8, value: null},
        {y: 0, x: 9, value: null},
        {y: 0, x: 10, value: null},
        {y: 0, x: 12, value: null},
        {y: 0, x: 15, value: null},
        {y: 0, x: 16, value: null},
        {y: 0, x: 20, value: null},
        {y: 1, x: 0, value: null},
        {y: 1, x: 1, value: null},
        {y: 1, x: 2, value: null},
        {y: 1, x: 3, value: null},
        {y: 1, x: 4, value: null},
        {y: 1, x: 5, value: null},
        {y: 1, x: 6, value: null},
        {y: 1, x: 8, value: null},
        {y: 1, x: 9, value: null},
        {y: 1, x: 10, value: null},
        {y: 1, x: 12, value: null},
        {y: 1, x: 15, value: null},
        {y: 1, x: 16, value: null},
        {y: 1, x: 20, value: null},
        {y: 2, x: 0, value: null},
        {y: 2, x: 1, value: null},
        {y: 2, x: 2, value: 1},
        {y: 2, x: 3, value: null},
        {y: 2, x: 4, value: 2},
        {y: 2, x: 5, value: null},
        {y: 2, x: 6, value: 5},
        {y: 2, x: 8, value: null},
        {y: 2, x: 9, value: 10},
        {y: 2, x: 10, value: null},
        {y: 2, x: 12, value: 6},
        {y: 2, x: 15, value: 2},
        {y: 2, x: 16, value: 4},
        {y: 2, x: 20, value: null},
        {y: 3, x: 0, value: 4},
        {y: 3, x: 1, value: null},
        {y: 3, x: 2, value: null},
        {y: 3, x: 3, value: null},
        {y: 3, x: 4, value: 3},
        {y: 3, x: 5, value: null},
        {y: 3, x: 6, value: 20},
        {y: 3, x: 8, value: 1},
        {y: 3, x: 9, value: 24},
        {y: 3, x: 10, value: 3},
        {y: 3, x: 12, value: 12},
        {y: 3, x: 15, value: 5},
        {y: 3, x: 16, value: 3},
        {y: 3, x: 20, value: null},
        {y: 4, x: 0, value: null},
        {y: 4, x: 1, value: null},
        {y: 4, x: 2, value: 1},
        {y: 4, x: 3, value: null},
        {y: 4, x: 4, value: 3},
        {y: 4, x: 5, value: null},
        {y: 4, x: 6, value: 13},
        {y: 4, x: 8, value: 1},
        {y: 4, x: 9, value: null},
        {y: 4, x: 10, value: null},
        {y: 4, x: 12, value: 2},
        {y: 4, x: 15, value: null},
        {y: 4, x: 16, value: null},
        {y: 4, x: 20, value: null}
      ];
      options = {
        xLabel:"Likelihood",
        yLabel:"Impact",
        color : ["#D6F107","#FFBC1C","#FD661F"],
        threshold : [9,28]
      };
      ChartService.heatmapChart('#graphHeatmapChart',data,options);
    };

    let getCartographyStats = function() {
        $http.get(
            "api/stats/",
            {"params": {"type": "cartography", "getLast": true}}
        ).then(function (response) {

            dataSampleTimeGraphForOneAnr = response.data;

            $scope.subCategories = [...new Set(dataSampleTimeGraphForOneAnr.flatMap(
                cat=>cat.series.flatMap(serie=>serie.category)
            ))];

        });
    };

    $scope.selectGraphCompliance = function () {
        options = {
            width:700,
            opacityArea: [0.2,0.5],
            fillCategories: [true,true]
        }
        data = [
          {category:'ANR 1',
            series: [
              {label: "Information security policies", value: "0.20",
                data: [
                  { category:'ANR 1',
                    series:[
                      {label: 'label1', value: 0.23, data:[]},
                      {label: 'label2', value: 0.43},
                      {label: 'label3', value: 0.83}
                  ]}
                ]
              },
              {label: "Organization of information security", value: "0.43", data: []},
              {label: "Human resource security", value: "0.73", data: []},
              {label: "Asset management", value: "0.66", data: []},
              {label: "Access control", value: "0.56", data: []},
              {label: "Cryptography", value: "0.20", data: []},
              {label: "Physical and environmental security", value: "0.71", data: []},
              {label: "Operations security", value: "0.86", data: []},
              {label: "Communications security", value: "0.71", data: []},
              {label: "System acquisition, development and maintenance", value: "0.68", data: []},
              {label: "Supplier relationships", value: "0.68", data: []},
              {label: "information security incident management", value: "0.63", data: []},
              {label: "Information security aspects of business continuity management", value: "0.75", data: []},
              {label: "Compliance", value: "0.78", data: []}
            ]
          },
          {category:'ANR 2',
            series: [
              {label: "Information security policies", value: "0.40",
                data: [
                    { category:'ANR 2',
                      series:[
                      {label: 'label1', value: 0.53},
                      {label: 'label2', value: 0.13},
                      {label: 'label3', value: 0.43}
                    ]
                  }
                ]},
              {label: "Organization of information security", value: "0.13", data: []},
              {label: "Human resource security", value: "0.83", data: []},
              {label: "Asset management", value: "0.26", data: []},
              {label: "Access control", value: "0.76", data: []},
              {label: "Cryptography", value: "0.70", data: []},
              {label: "Physical and environmental security", value: "0.91", data: []},
              {label: "Operations security", value: "0.46", data: []},
              {label: "Communications security", value: "0.21", data: []},
              {label: "System acquisition, development and maintenance", value: "0.38", data: []},
              {label: "Supplier relationships", value: "0.58", data: []},
              {label: "information security incident management", value: "0.13", data: []},
              {label: "Information security aspects of business continuity management", value: "0.95", data: []},
              {label: "Compliance", value: "0.68", data: []}
            ]
          }
        ]
        ChartService.radarChart('#graphRadarChart',data,options);
    };
  }

})();

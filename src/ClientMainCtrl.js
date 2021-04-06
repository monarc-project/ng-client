(function () {

  angular
      .module('ClientApp')
      .controller('ClientMainCtrl', [
          '$scope', '$rootScope', '$state', '$mdSidenav', '$mdMedia', '$mdDialog', '$timeout', 'gettextCatalog', 'UserService',
          'UserProfileService', 'ClientAnrService', 'StatsService', 'ChartService', 'toastr', ClientMainCtrl
      ]);

  /**
   * Main Controller for the Client module
   */
  function ClientMainCtrl($scope, $rootScope, $state, $mdSidenav, $mdMedia, $mdDialog, $timeout, gettextCatalog, UserService,
                          UserProfileService, ClientAnrService, StatsService, ChartService, toastr ) {
    if (!UserService.isAuthenticated() && !UserService.reauthenticate()) {
        setTimeout(function () {
            $state.transitionTo('login');
        }, 1);

        return;
    }

    $rootScope.appVersionCheckingTimestamp = new Date().getTime();

    $scope.changeLanguage = function (lang_id) {
        UserService.setUiLanguage(lang_id);
        UserProfileService.updateProfile({language:lang_id},function(){});
        gettextCatalog.setCurrentLanguage($rootScope.languages[lang_id].code);
        $rootScope.uiLanguage = $rootScope.languages[lang_id].flag;
        $scope.updatePaginationLabels();
    }

    $rootScope.BreadcrumbAnrHackLabel = '_';
    $rootScope.isAllowed = UserService.isAllowed;

    $scope.checkSelectTab = function() {
      $scope.tabSelected = 1
      if ($rootScope.isAllowed('userfo')) {
        $scope.tabSelected = 0
      }
    }

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
            }, function (reject) {
              $scope.handleRejectionDialog(reject);
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
        }, function (reject) {
          $scope.handleRejectionDialog(reject);
        });
    };

    $scope.setIsStatsCollected = function (anr) {
      anr.isStatsCollected = !anr.isStatsCollected;
      let data = [{
        anrId: anr.id,
        isStatsCollected: anr.isStatsCollected
      }];
      StatsService.updateAnrSettings(null,data)
    }

    $scope.setIsVisibleOnDashboard = function (anr) {
      anr.isVisibleOnDashboard = !anr.isVisibleOnDashboard;

      let data = [{
        anrId: anr.id,
        isVisible: anr.isVisibleOnDashboard
      }];

      StatsService.updateAnrSettings(null,data).then(function(){
          $scope.mustUpdate = true;
        });
    }

    $rootScope.$on('fo-anr-changed', function () {
        updateMenuANRs();
    })

    // Menu ANRs preloading
    var updateMenuANRs = function () {
        ClientAnrService.getAnrs().then(function (data) {
            $scope.clientAnrIsCreating = false;
            $scope.clientAnrs = [];
            $scope.allAnrs = data.anrs;
            $scope.anrList = $scope.allAnrs.map(x => x['label' + x.language]);

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

    //Options of chart displaying current/residual information risks
    const optionsHorizontalCurrentRisks = {
      margin: {
        top: 50,
        right: 30,
        bottom: 30,
        left: 150
      },
      width: 600,
      height: 550,
      externalFilter: '.filter-categories-graphGlobalCurrentRisks',
      radioButton: '.chartMode-graphGlobalCurrentRisks',
      showValues: true,
      nameValue :'riskInfo'
    };

    const optionsVerticalCurrentRisks = $.extend(
      angular.copy(optionsHorizontalCurrentRisks), {
        margin: {
          top: 50,
          right: 30,
          bottom: 100,
          left: 30
        },
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

    const optionsLineCurrentRisks = {
      margin : {
        top: 50,
        right: 30,
        bottom: 30,
        left: 30
      },
      width: 600,
      height: 400,
      legendSize: 0,
      positionLegend: 'top',
      color: ["#FD661F","#FFBC1C","#D6F107"],
      xTicks: 5
    };

    //Options of chart displaying current/residual operational risks
    const optionsHorizontalCurrentOpRisks = $.extend(
      angular.copy(optionsHorizontalCurrentRisks), {
        externalFilter: '.filter-categories-graphGlobalCurrentOpRisks',
        radioButton: '.chartMode-graphGlobalCurrentOpRisks',
        showValues: true,
        nameValue :'riskOp'
      }
    );

    const optionsVerticalCurrentOpRisks = $.extend(
      angular.copy(optionsVerticalCurrentRisks), {
        externalFilter: '.filter-categories-graphGlobalCurrentOpRisks',
        radioButton: '.chartMode-graphGlobalCurrentOpRisks',
        showValues: true,
        nameValue :'riskOp'
      }
    );

    const optionsHorizontalResidualOpRisks = $.extend(
      angular.copy(optionsHorizontalCurrentOpRisks), {
        externalFilter: '.filter-categories-graphGlobalResidualOpRisks',
        radioButton: '.chartMode-graphGlobalResidualOpRisks',
      }
    );

    const optionsVerticalResidualOpRisks = $.extend(
      angular.copy(optionsVerticalCurrentOpRisks), {
        externalFilter: '.filter-categories-graphGlobalResidualOpRisks',
        radioButton: '.chartMode-graphGlobalResidualOpRisks',
      }
    );

    //Options of threats chart
    const optionsThreats = {
      margin : {
        top: 50,
        right: 30,
        bottom: 30,
        left: 30
      },
      width: 1000,
      height: 500,
      externalFilter: true,
      nameValue: 'averageRate',
      order: 'label',
      title: null
    }

    const optionsThreatsOverview = {
      margin: {
        top: 50,
        right: 30,
        bottom: 50,
        left: 30
      },
      width: 250,
      height: 250,
      onClickFunction : function (d) {
        $scope.threatOptions.chartType = "line";
        $scope.threatOptions.threat = d;
        $scope.$apply()
      }
    };

    //Options of vulnerabilities chart
    const optionsVulnerabilities= $.extend(
      angular.copy(optionsThreats)
    );

    const optionsVulnerabilitiesOverview = $.extend(
      angular.copy(optionsThreatsOverview), {
        onClickFunction : function (d) {
          $scope.vulnerabilityOptions.chartType = "line";
          $scope.vulnerabilityOptions.vulnerability = d;
          $scope.$apply()
        }
      }
    );

    const optionsCartographyRisks = {
      xLabel: "Likelihood",
      yLabel: "Impact",
      color : ["#D6F107","#FFBC1C","#FD661F"],
      threshold : [8,27],
    }

    const optionsCartographyOpRisks = $.extend(
      angular.copy(optionsCartographyRisks), {
        xLabel: "Probability",
        threshold : [3,8],
      }
    )

// DATA MODELS =================================================================

    //Data Model for the graph for the current/target information risk
    var dataCurrentRisks = [];
    var dataResidualRisks = [];

    //Data Model for the graph for the record current/target information risk
    var dataRecordsCurrentRisks = [];
    var dataRecordsTargetRisks = [];

    //Data Model for the graph for the record current/target operational risk
    var dataRecordsCurrentOpRisks = [];
    var dataRecordsTargetOpRisks = [];

    //Data Model for the threat graphs
    var allThreats = [];
    var dataThreats = [];
    var dataThreatsOverview = [];

    //Data Model for the vulnerability graphs
    var allVulnerabilities = [];
    var dataVulnerabilities = [];
    var dataVulnerabilitiesOverview = [];

    //Data Model for the cartography graphs
    var dataCartographyCurrentRisks = [];
    var dataCartographyResidualRisks = [];
    var dataCartographyCurrentOpRisks = [];
    var dataCartographyResidualOpRisks = [];

// INIT FUNCTIONS ==============================================================

    StatsService.getValidation().then(function(data) {
        $scope.isStatsAvailable = data.isStatsAvailable;
    });

    $scope.initializeScopes = function (){
      window.onresize = function() {
        $scope.globalDashboardWidth =  window.innerWidth;
      }

      if ($scope.mustUpdate == undefined) {
        $scope.mustUpdate = true;
      }

      if ($scope.risksOptions == undefined) {
        $scope.risksOptions = {
          current: {
            chartType: "vertical",
            startDate: null,
            endDate: null,
            minDate: null,
            maxDate: new Date()
          },
          residual: {
            chartType: "vertical",
            startDate: null,
            endDate: null,
            minDate: null,
            maxDate: new Date()
          }
        };
        $scope.opRisksOptions = $.extend(angular.copy($scope.risksOptions));
      }

      if ($scope.threatOptions == undefined) {
        $scope.threatOptions = {
          displayBy: "averageRate",
          chartType: "overview",
          order: 'label',
          title: null,
          threat: null,
          startDate: null,
          endDate: null,
          minDate: null,
          maxDate: new Date()
        };
      }

      if ($scope.vulnerabilityOptions == undefined) {
        $scope.vulnerabilityOptions = {
          displayBy: "averageRate",
          chartType: "overview",
          order: 'label',
          title: null,
          vulnerability: null,
          startDate: null,
          endDate: null,
          minDate: null,
          maxDate: new Date()
        };
      }

      if ($scope.cartographyOptions == undefined) {
        $scope.cartographyOptions = {
          chartType: "info_risks"
        }
      }
    }

    $scope.updateGlobalDashboard = function() {

      $scope.loadingData = true;

      if ($scope.mustUpdate == true) {
        getRiskStats();
        getRisksOverviewStats();
        getThreatsOverviewStats();
        getThreatsStats();
        getVulnerabilitiesOverviewStats();
        getVulnerabilitiesStats();
        getCartographyStats();
        $scope.mustUpdate = false;
      } else{
        drawCurrentRisk();
        drawResidualRisk();
        drawCurrentOpRisk();
        drawResidualOpRisk();
        drawThreats();
        drawVulnerabilities();
        drawCartographyRisk();
      }
  }

// SETTINGS FUNCTIONS ==========================================================

    $scope.settingsGlobalDashboard = function() {
      var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

      $mdDialog.show({
          controller: settingsDialog,
          templateUrl: 'views/settings.globalDashboard.html',
          preserveScope: true,
          scope: $scope,
          clickOutsideToClose: false,
          fullscreen: useFullScreen
      }).then(
        function () {},
        function(updated){
          updateMenuANRs();
          if (updated) {
            $scope.mustUpdate = true;
            $scope.updateGlobalDashboard();
          }
      })

      function settingsDialog() {
        let initialAnrIds = [];
        StatsService.getAnrSettings().then(function (response) {
            $scope.anrs = response.data;
            $scope.anrs.sort(
              function(a, b) {
                return a.anrName.localeCompare(b.anrName)
              }
            );
            initialAnrIds = angular.copy($scope.anrs)
              .filter(anr => { return anr.isVisible === true})
              .map(anr => anr.anrId);
          });


        $scope.cancel = function() {
          let finalAnrIds = angular.copy($scope.anrs)
              .filter(anr => { return anr.isVisible === true})
              .map(anr => anr.anrId);

          if (finalAnrIds.length > 0) {
            StatsService.updateAnrSettings(null,$scope.anrs).then(function(){
              if (JSON.stringify(initialAnrIds) !== JSON.stringify(finalAnrIds)) {
                $mdDialog.cancel(true);
              }else {
                $mdDialog.cancel(false);
              }
            });
          }else{
            toastr.error(gettextCatalog.getString('At least one risk analysis must be selected'));
          }
        };
      }
    }

// DATE FUNCTIONS===============================================================

    const optionsDate = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    const  dateTimeFormat = new Intl.DateTimeFormat('en', optionsDate);

    $scope.today = new Date();

    $scope.dateChanged = function (nameScope, type) {
        const date = dateTimeFormat.formatToParts($scope.$eval(nameScope)[type]);
        let setDate = `${date[4].value}-${date[0].value}-${date[2].value}`;
        let customParams = {};
        if (setDate == '1970-01-01') {
          $scope.$eval(nameScope)[type] = null;
          if (type == 'startDate') {
            $scope.$eval(nameScope)['minDate'] = null;
          }else {
            $scope.$eval(nameScope)['maxDate'] = $scope.today;
          }
        }else {
          if (type == 'startDate') {
            $scope.$eval(nameScope)['minDate'] = $scope.$eval(nameScope)[type];
          }else {
            $scope.$eval(nameScope)['maxDate'] = $scope.$eval(nameScope)[type];
          }
          $scope.$eval(nameScope)[type] = setDate;
        }
        switch (nameScope) {
        	case "threatOptions": getThreatsStats(); break;
          case "vulnerabilityOptions": getVulnerabilitiesStats(); break;
          case "risksOptions.current":
            customParams = {
              dateFrom: $scope.risksOptions.current.startDate,
              dateTo: $scope.risksOptions.current.endDate,
              "processor_params[risks_type]":"informational",
              "processor_params[risks_state]":"current",
            }
            drawCurrentRisk();
            getRisksOverviewStats(customParams);
            break;
          case "risksOptions.residual":
            customParams = {
              dateFrom: $scope.risksOptions.residual.startDate,
              dateTo: $scope.risksOptions.residual.endDate,
              "processor_params[risks_type]":"informational",
              "processor_params[risks_state]":"residual",
            }
            getRisksOverviewStats(customParams);
            break;
          case "opRisksOptions.current":
            customParams = {
              dateFrom: $scope.opRisksOptions.current.startDate,
              dateTo: $scope.opRisksOptions.current.endDate,
              "processor_params[risks_type]":"operational",
              "processor_params[risks_state]":"current",
            }
            getRisksOverviewStats(customParams);
            break;
          case "opRisksOptions.residual":
            customParams = {
              dateFrom: $scope.opRisksOptions.residual.startDate,
              dateTo: $scope.opRisksOptions.residual.endDate,
              "processor_params[risks_type]":"operational",
              "processor_params[risks_state]":"residual",
            }
            getRisksOverviewStats(customParams);
            break;
        }
    }

// WATCHERS ====================================================================

    $scope.$watchGroup(
      ['sidenavIsOpen','globalDashboardWidth', '$root.uiLanguage'],
      function(newValue,oldValue) {
      if (newValue !== oldValue && $state.current.name == "main.project" && $scope.isStatsAvailable) {
        $timeout(function() {
          drawCurrentRisk();
          drawResidualRisk();
          drawCurrentOpRisk();
          drawResidualOpRisk();
          drawThreats();
          drawVulnerabilities();
          drawCartographyRisk();
        },150);
      }
    }
    );

    $scope.$watch('risksOptions.current.chartType', function() {
      if(dataCurrentRisks.length > 0){
        drawCurrentRisk();
      };
    });
    $scope.$watch('risksOptions.residual.chartType', function() {
      if(dataResidualRisks.length > 0){
        drawResidualRisk();
      }
    });

    $scope.$watch('opRisksOptions.current.chartType', function() {
      if(dataCurrentRisks.length > 0){
        drawCurrentOpRisk();
      };
    });
    $scope.$watch('opRisksOptions.residual.chartType', function() {
      if(dataResidualRisks.length > 0){
        drawResidualOpRisk();
      }
    });

    $scope.$watchGroup(
      ['threatOptions.displayBy',
      'threatOptions.chartType',
      'threatOptions.threat',
      'threatOptions.order'],
      function(newValue,oldValue) {
      if (newValue[0] !== oldValue[0]) {
        optionsThreats.nameValue = newValue[0];
        optionsThreatsOverview.nameValue = newValue[0];

        let allValues = allThreats
        .filter(x => $scope.categories.map(cat => cat.uuid).indexOf(x.uuid) > -1)
        .flatMap(
          cat => cat.series.flatMap(
            subCat => subCat.series.flatMap(
              d => d[newValue[0]]
            )
          )
        );

        optionsThreats.forceMaxY = Math.max(...allValues);
        drawThreats();
      }
      if (newValue[1] !== oldValue[1] ) {
          drawThreats();
      }
      if (newValue[2] !== oldValue[2] && newValue[2] !== null) {
        dataThreats = allThreats
        .map(
          x => { return {
            ...x,
            series: x.series.filter(
              y => y.uuid == newValue[2].uuid
            )
          }}
        );

        optionsThreats.title = newValue[2].category;

        drawThreats();
      }
      if (newValue[3] !== oldValue[3] ) {
          drawThreats();
      }
    }
    );

    $scope.$watchGroup(
      ['vulnerabilityOptions.displayBy',
      'vulnerabilityOptions.chartType',
      'vulnerabilityOptions.vulnerability',
      'vulnerabilityOptions.order'],
      function(newValue,oldValue) {
      if (newValue[0] !== oldValue[0]) {
        optionsVulnerabilities.nameValue = newValue[0];
        optionsVulnerabilitiesOverview.nameValue = newValue[0];

        let allValues = allVulnerabilities
        .filter(x => $scope.categories.map(cat => cat.uuid).indexOf(x.uuid) > -1)
        .flatMap(
          cat => cat.series.flatMap(
            subCat => subCat.series.flatMap(
              d => d[newValue[0]]
            )
          )
        );

        optionsVulnerabilities.forceMaxY = Math.max(...allValues);
        drawVulnerabilities();
      }
      if (newValue[1] !== oldValue[1] ) {
          drawVulnerabilities();
      }
      if (newValue[2] !== oldValue[2] && newValue[2] !== null) {
        dataVulnerabilities = allVulnerabilities
        .map(
          x => { return {
            ...x,
            series: x.series.filter(
              y => y.uuid == newValue[2].uuid
            )
          }}
        );
        optionsVulnerabilities.title = newValue[2].category;
        drawVulnerabilities();
      }
      if (newValue[3] !== oldValue[3] ) {
          drawVulnerabilities();
      }
    }
    );

    $scope.$watch('cartographyOptions.chartType', function() {
      if (dataCartographyCurrentRisks.length > 0 || dataCartographyCurrentOpRisks.length > 0) {
        drawCartographyRisk();
      }
    });

// DRAW CHART FUNCTIONS ========================================================

    function drawCurrentRisk() {
      if ($scope.risksOptions.current.chartType == 'vertical') {
        optionsVerticalCurrentRisks.width = getParentWidth('graphGlobalCurrentRisks');
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
      if ($scope.risksOptions.current.chartType == 'horizontal') {
        optionsHorizontalCurrentRisks.width = getParentWidth('graphGlobalCurrentRisks');
        optionsHorizontalCurrentRisks.margin.left = optionsHorizontalCurrentRisks.width * 0.2;
        ChartService.multiHorizontalBarChart(
          '#graphGlobalCurrentRisks',
          dataCurrentRisks,
          optionsHorizontalCurrentRisks
        );
      }
      if ($scope.risksOptions.current.chartType == 'line') {
        optionsLineCurrentRisks.width = getParentWidth('graphGlobalCurrentRisks');
        ChartService.lineChart(
          '#graphGlobalCurrentRisks',
          dataRecordsCurrentRisks,
          optionsLineCurrentRisks
        );
      }
    };

    function drawResidualRisk() {
      if ($scope.risksOptions.residual.chartType == 'vertical') {
        optionsVerticalResidualRisks.width = getParentWidth('graphGlobalResidualRisks');
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
      if ($scope.risksOptions.residual.chartType == 'horizontal') {
        optionsHorizontalResidualRisks.width = getParentWidth('graphGlobalResidualRisks');
        optionsHorizontalResidualRisks.margin.left = optionsHorizontalResidualRisks.width * 0.2;
        ChartService.multiHorizontalBarChart(
          '#graphGlobalResidualRisks',
          dataResidualRisks,
          optionsHorizontalResidualRisks
        );
      }
      if ($scope.risksOptions.residual.chartType == 'line') {
        optionsLineCurrentRisks.width = getParentWidth('graphGlobalResidualRisks');
        ChartService.lineChart(
          '#graphGlobalResidualRisks',
          dataRecordsTargetRisks,
          optionsLineCurrentRisks
        );
      }
    };

    function drawCurrentOpRisk() {
      if ($scope.opRisksOptions.current.chartType == 'vertical') {
        optionsVerticalCurrentOpRisks.width = getParentWidth('graphGlobalCurrentRisks');
        dataCurrentRisks.sort(
          function(a, b) {
            return a.category.localeCompare(b.category)
          }
        );
        ChartService.multiVerticalBarChart(
          '#graphGlobalCurrentOpRisks',
          dataCurrentRisks,
          optionsVerticalCurrentOpRisks
        );
      }
      if ($scope.opRisksOptions.current.chartType == 'horizontal') {
        optionsHorizontalCurrentOpRisks.width = getParentWidth('graphGlobalCurrentRisks');
        optionsHorizontalCurrentOpRisks.margin.left = optionsHorizontalCurrentOpRisks.width * 0.2;
        ChartService.multiHorizontalBarChart(
          '#graphGlobalCurrentOpRisks',
          dataCurrentRisks,
          optionsHorizontalCurrentOpRisks
        );
      }
      if ($scope.opRisksOptions.current.chartType == 'line') {
        optionsLineCurrentRisks.width = getParentWidth('graphGlobalCurrentRisks');
        ChartService.lineChart(
          '#graphGlobalCurrentOpRisks',
          dataRecordsCurrentOpRisks,
          optionsLineCurrentRisks
        );
      }
    };

    function drawResidualOpRisk() {
      if ($scope.opRisksOptions.residual.chartType == 'vertical') {
        optionsVerticalResidualOpRisks.width = getParentWidth('graphGlobalResidualOpRisks');
        dataResidualRisks.sort(
          function(a, b) {
            return a.category.localeCompare(b.category)
          }
        );
        ChartService.multiVerticalBarChart(
          '#graphGlobalResidualOpRisks',
          dataResidualRisks,
          optionsVerticalResidualOpRisks
        );
      }
      if ($scope.opRisksOptions.residual.chartType == 'horizontal') {
        optionsHorizontalResidualOpRisks.width = getParentWidth('graphGlobalResidualOpRisks');
        optionsHorizontalResidualOpRisks.margin.left = optionsHorizontalResidualOpRisks.width * 0.2;
        ChartService.multiHorizontalBarChart(
          '#graphGlobalResidualOpRisks',
          dataResidualRisks,
          optionsHorizontalResidualOpRisks
        );
      }
      if ($scope.opRisksOptions.residual.chartType == 'line') {
        optionsLineCurrentRisks.width = getParentWidth('graphGlobalResidualOpRisks');
        ChartService.lineChart(
          '#graphGlobalResidualOpRisks',
          dataRecordsTargetOpRisks,
          optionsLineCurrentRisks
        );
      }
    };

    function drawThreats() {
      if ($scope.threatOptions.chartType == "overview") {
        let displayBy = $scope.threatOptions.displayBy;
        dataThreatsOverview.sort(
          function(a, b) {
            switch ($scope.threatOptions.order) {
              case "label":
                return a.category.localeCompare(b.category);
              case "descending":
                return b[displayBy]- a[displayBy];
              case "ascending":
                return a[displayBy] - b[displayBy]
            }
          }
        );
        ChartService.multiLineChart(
          '#graphGlobalThreats',
          dataThreatsOverview,
          optionsThreatsOverview
        );
      }
      if ($scope.threatOptions.chartType == "line") {
        optionsThreats.width = getParentWidth('graphGlobalThreats', 0.7);
        optionsThreats.legendSize = optionsThreats.width * 0.2;
        ChartService.lineChart(
          '#graphGlobalThreats',
          dataThreats,
          optionsThreats
        );
      }
    };

    function drawVulnerabilities() {
      if ($scope.vulnerabilityOptions.chartType == "overview") {
        let displayBy = $scope.vulnerabilityOptions.displayBy;
        dataVulnerabilitiesOverview.sort(
          function(a, b) {
            switch ($scope.vulnerabilityOptions.order) {
              case "label":
                return a.category.localeCompare(b.category);
              case "descending":
                return b[displayBy]- a[displayBy];
              case "ascending":
                return a[displayBy] - b[displayBy]
            }
          }
        );
        ChartService.multiLineChart(
          '#graphGlobalVulnerabilities',
          dataVulnerabilitiesOverview,
          optionsVulnerabilitiesOverview
        );
      }
      if ($scope.vulnerabilityOptions.chartType == "line") {
        optionsVulnerabilities.width = getParentWidth('graphGlobalVulnerabilities', 0.7);
        optionsVulnerabilities.legendSize = optionsVulnerabilities.width * 0.2;
        ChartService.lineChart(
          '#graphGlobalVulnerabilities',
          dataVulnerabilities,
          optionsVulnerabilities
        );
      }
    };

    function drawCartographyRisk() {
      if ($scope.cartographyOptions.chartType == "info_risks") {
        optionsCartographyRisks.width = getParentWidth('graphGlobalCartographyCurrent');
        ChartService.multiHeatmapChart(
          '#graphGlobalCartographyCurrent',
          dataCartographyCurrentRisks,
          optionsCartographyRisks
        );

        ChartService.multiHeatmapChart(
          '#graphGlobalCartographyResidual',
          dataCartographyResidualRisks,
          optionsCartographyRisks
        );
      }
      if ($scope.cartographyOptions.chartType == "op_risks") {
        optionsCartographyOpRisks.width = getParentWidth('graphGlobalCartographyCurrent',0.6);
        ChartService.multiHeatmapChart(
          '#graphGlobalCartographyCurrent',
          dataCartographyCurrentOpRisks,
          optionsCartographyOpRisks
        );

        ChartService.multiHeatmapChart(
          '#graphGlobalCartographyResidual',
          dataCartographyResidualOpRisks,
          optionsCartographyOpRisks
        );
      }
    }

// GET STATS DATA FUNCTIONS ====================================================

    function getRiskStats() {
      let params = {
        type: "risk",
      }

      StatsService.getStats(params).then(function (response) {
          dataCurrentRisks = [];
          dataResidualRisks = [];

          if (Object.keys(response.data).length !== 0) {
            dataCurrentRisks = response.data['current'];
            dataResidualRisks = response.data['residual'];
          }

          $scope.categories = dataCurrentRisks.map(function (d) {
              return {
                category: d.category,
                uuid: d.uuid
              };
          });

          if ($scope.risksOptions.current.chartType !== 'line')
            drawCurrentRisk();
          if ($scope.risksOptions.residual.chartType !== 'line')
            drawResidualRisk();
          if ($scope.opRisksOptions.current.chartType !== 'line')
            drawCurrentOpRisk();
          if ($scope.opRisksOptions.current.chartType !== 'line')
            drawResidualOpRisk();
      });
    }

    function getRisksOverviewStats(customParams) {
      let params = {
        type: "risk",
        processor: "risk_averages_on_date",
      };

      params = $.extend(params,customParams);
      let type = null;
      let state = null;
      let typestate = null;
      let newData = [];

      if (customParams) {
        type = params["processor_params[risks_type]"];
        state = params["processor_params[risks_state]"];
        typestate = type + state;
      }

      StatsService.getStatsProcessor(params).then(function (response) {
          let result = [];
          let data = [];

          if (response.data.length) {
            if (customParams) {
              data = [response.data[0][type]];
            }else{
              $scope.risksOptions.current.startDate = null;
              $scope.risksOptions.current.endDate = null;
              $scope.risksOptions.residual.startDate = null;
              $scope.risksOptions.residual.endDate = null;
              $scope.opRisksOptions.current.startDate = null;
              $scope.opRisksOptions.current.endDate = null;
              $scope.opRisksOptions.residual.startDate = null;
              $scope.opRisksOptions.residual.endDate = null;

              data = [
                response.data[0].informational,
                response.data[1].informational,
                response.data[0].operational,
                response.data[1].operational
              ];
            }

            data.forEach((data,index) => {
              result[index] = [];
              for(levelRisks in data) {
                  let addCategorie = {
                    category: levelRisks,
                    series: [{
                      category: levelRisks,
                      series: data[levelRisks]
                    }]
                  };
                  result[index].push(addCategorie);
              };
            })

            if (result.length > 1) {
              dataRecordsCurrentRisks = result[0].reverse();
              dataRecordsTargetRisks = result[1].reverse();
              dataRecordsCurrentOpRisks = result[2].reverse();
              dataRecordsTargetOpRisks = result[3].reverse();
            }
          }

          if (customParams && result[0]) {
            newData =  result[0].reverse();
          }

          switch (typestate) {
            case "informationalcurrent":
              dataRecordsCurrentRisks = newData;
              drawCurrentRisk();
              break;
            case "informationalresidual":
              dataRecordsTargetRisks = newData;
              drawResidualRisk();
              break;
            case "operationalcurrent":
              dataRecordsCurrentOpRisks = newData;
              drawCurrentOpRisk();
              break;
            case "operationalresidual":
              dataRecordsTargetOpRisks = newData;
              drawResidualOpRisk();
              break;
            default:
              if ($scope.risksOptions.current.chartType == 'line')
                drawCurrentRisk();
              if ($scope.risksOptions.residual.chartType == 'line')
                drawResidualRisk();
              if ($scope.opRisksOptions.current.chartType == 'line')
                drawCurrentOpRisk();
              if ($scope.opRisksOptions.current.chartType == 'line')
                drawResidualOpRisk();
              break;
          }
      });
    }

    function getThreatsOverviewStats() {
      let params = {
        type: "threat",
        processor: "threat_average_on_date",
      };

      StatsService.getStatsProcessor(params).then(function (response) {
          dataThreatsOverview = [];

          if (response.data.length) {
            response.data.forEach((threat) => {
              let addCategorie = {
                uuid: threat.object,
                category: threat.label,
                series: threat.values,
                count: threat.averages.count,
                maxRisk: threat.averages.maxRisk,
                averageRate: threat.averages.averageRate
              };

              dataThreatsOverview.push(addCategorie);

            });

            dataThreatsOverview.sort(
              function(a, b) {
                return a.category.localeCompare(b.category)
              }
            );

            $scope.threats = dataThreatsOverview;

            let existsInThreats = $scope.threats
              .map(threat => threat.category)
              .indexOf(optionsThreats.title);

            if (!$scope.threatOptions.threat || existsInThreats == -1) {
              $scope.threatOptions.threat = $scope.threats[0];
              optionsThreats.title = $scope.threatOptions.threat.category;
            }
          }

          drawThreats();
      });

    }

    function getThreatsStats() {
        let params = {
          type: "threat",
          dateFrom: $scope.threatOptions.startDate,
          dateTo: $scope.threatOptions.endDate,
        };

        StatsService.getStats(params).then(function (response) {
            allThreats = response.data;

            let allValues = allThreats.flatMap(
              cat => cat.series.flatMap(
                subCat => subCat.series.flatMap(
                  d => d[$scope.threatOptions.displayBy]
                )
              )
            );

            if ($scope.threatOptions.threat) {
              dataThreats = allThreats
              .map(
                x => { return {
                  ...x,
                  series: x.series.filter(
                    y => y.uuid == $scope.threatOptions.threat.uuid
                  )
                }}
              );
            }

            optionsThreats.forceMaxY = Math.max(...allValues);

            drawThreats();
        });
    };

    function getVulnerabilitiesOverviewStats() {
      let params = {
        type: "vulnerability",
        processor: "vulnerability_average_on_date",
      };

      StatsService.getStatsProcessor(params).then(function (response) {
          dataVulnerabilitiesOverview = [];

          if (response.data.length) {
            response.data.forEach((vulnerability) => {
              let addCategorie = {
                uuid: vulnerability.object,
                category: vulnerability.label,
                series: vulnerability.values,
                count: vulnerability.averages.count,
                maxRisk: vulnerability.averages.maxRisk,
                averageRate: vulnerability.averages.averageRate
              };

              dataVulnerabilitiesOverview.push(addCategorie);

            });

            dataVulnerabilitiesOverview.sort(
              function(a, b) {
                return a.category.localeCompare(b.category)
              }
            );

            $scope.vulnerabilities = dataVulnerabilitiesOverview;

            let existsInVulnerabilities = $scope.vulnerabilities
              .map(vulnerability => vulnerability.category)
              .indexOf(optionsVulnerabilities.title);

            if (!$scope.vulnerabilityOptions.vulnerability || existsInVulnerabilities == -1) {
              $scope.vulnerabilityOptions.vulnerability = $scope.vulnerabilities[0];
              optionsVulnerabilities.title = $scope.vulnerabilityOptions.vulnerability.category;
            }
          }

          drawVulnerabilities();
          $scope.loadingData = false;
      });

    }

    function getVulnerabilitiesStats() {
        let params = {
          type: "vulnerability",
          dateFrom: $scope.vulnerabilityOptions.startDate,
          dateTo: $scope.vulnerabilityOptions.endDate,
        };

        StatsService.getStats(params).then(function (response) {
            allVulnerabilities = response.data;

            let allValues = allVulnerabilities.flatMap(
              cat => cat.series.flatMap(
                subCat => subCat.series.flatMap(
                  d => d[$scope.vulnerabilityOptions.displayBy]
                )
              )
            );

            if ($scope.vulnerabilityOptions.vulnerability) {
              dataVulnerabilities = allVulnerabilities
              .map(
                x => { return {
                  ...x,
                  series: x.series.filter(
                    y => y.uuid == $scope.vulnerabilityOptions.vulnerability.uuid
                  )
                }}
              );
            }

            optionsVulnerabilities.forceMaxY = Math.max(...allValues);

            drawVulnerabilities();
        });
    };

    function getCartographyStats() {
      let params = {
        type: "cartography",
        getLast: true
      }

      StatsService.getStats(params).then(function (response) {
        dataCartographyCurrentRisks = [];
        dataCartographyResidualRisks = [];
        dataCartographyCurrentOpRisks = [];
        dataCartographyResidualOpRisks = [];

        if (Object.keys(response.data).length !== 0) {
          dataCartographyCurrentRisks = response.data.informational.current;
          dataCartographyResidualRisks = response.data.informational.residual;
          dataCartographyCurrentOpRisks = response.data.operational.current;
          dataCartographyResidualOpRisks = response.data.operational.residual;
        }

        drawCartographyRisk();
      });
    };

// EXPORT FUNCTIONS  ===========================================================

    $scope.exportAsPNG = function(idOfGraph, name, parametersAction = {backgroundColor: 'white'}) {
      let node = d3.select('#' + idOfGraph).select("svg");
      saveSvgAsPng(node.node(), name + '.png', parametersAction);
    }

    $scope.generateXlsxData = function() {

      let wb = XLSX.utils.book_new();
      let headingsRisks = [
        [
          gettextCatalog.getString('Risk analysis'),
          gettextCatalog.getString('Current risks'),
          null,
          null,
          gettextCatalog.getString('Residual risks'),
        ],
        [
          null,
          gettextCatalog.getString('Low risks'),
          gettextCatalog.getString('Medium risks'),
          gettextCatalog.getString('High risks'),
          gettextCatalog.getString('Low risks'),
          gettextCatalog.getString('Medium risks'),
          gettextCatalog.getString('High risks'),
        ]
      ];
      let mergedCellsRisks =  [
        {
          s: { r: 0, c: 0 },
          e: { r: 1, c: 0 }
        },
        {
          s: { r: 0, c: 1 },
          e: { r: 0, c: 3 }
        },
        {
          s: { r: 0, c: 4 },
          e: { r: 0, c: 6 }
        }
      ];
      let xlsxData = {
        [gettextCatalog.getString('Information risks')] : {
          data: [],
          headings: headingsRisks,
          mergedCells: mergedCellsRisks
        },
        [gettextCatalog.getString('Operational risks')] : {
          data: [],
          headings: headingsRisks,
          mergedCells: mergedCellsRisks
        },
        [gettextCatalog.getString('Info. Risks - daily values')] : {
          data: [],
          headings: angular.copy(headingsRisks),
          mergedCells: mergedCellsRisks
        },
        [gettextCatalog.getString('Oper. Risks - daily values')] : {
          data: [],
          headings: angular.copy(headingsRisks),
          mergedCells: mergedCellsRisks
        },
        [gettextCatalog.getString('Threats')] : {
          data: [],
          headings: [[gettextCatalog.getString('Date')],[null]],
          mergedCells: [{ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }]
        },
        [gettextCatalog.getString('Vulnerabilities')] : {
          data: [],
          headings: [[gettextCatalog.getString('Date')],[null]],
          mergedCells: [{ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }]
        }
      };
      let allRisks = {
        currentRisks : angular.copy(dataCurrentRisks).map(data => data.series),
        residualRisks : angular.copy(dataResidualRisks).map(data => data.series)
      };
      let allRecordsRisks = {
        [gettextCatalog.getString('Info. Risks - daily values')] : {
          current : angular.copy(dataRecordsCurrentRisks).flatMap(data => data.series),
          residual : angular.copy(dataRecordsTargetRisks).flatMap(data => data.series)
        },
        [gettextCatalog.getString('Oper. Risks - daily values')] : {
          current : angular.copy(dataRecordsCurrentOpRisks).flatMap(data => data.series),
          residual : angular.copy(dataRecordsTargetOpRisks).flatMap(data => data.series)
        }
      };
      let threatsAndVulns = {
        [gettextCatalog.getString('Threats')] : {
          data: angular.copy(dataThreatsOverview).map(data => data.series),
          labels:angular.copy(dataThreatsOverview).map(data => data.category),
          headings: [[null],[null]],
          mergedCells: [{ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }]
        },
        [gettextCatalog.getString('Vulnerabilities')] : {
          data: angular.copy(dataVulnerabilitiesOverview).map(data => data.series),
          labels: angular.copy(dataVulnerabilitiesOverview).map(data => data.category),
          headings: [[null],[null]],
          mergedCells: [{ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }]
        }
      };

      /* Information & Operational Risks */
      allRisks['currentRisks'].forEach((anr,index) => {
        let infoRisk = {};
        let opRisk = {};
        infoRisk[0] = anr[0].category;
        opRisk[0] = anr[0].category;
        anr.forEach((level,subindex) => {
          infoRisk[subindex + 1] = level.riskInfo;
          infoRisk[subindex + 4] = allRisks['residualRisks'][index][subindex].riskInfo;
          opRisk[subindex + 1] = level.riskOp;
          opRisk[subindex + 4] = allRisks['residualRisks'][index][subindex].riskOp;
        })
        xlsxData[gettextCatalog.getString('Information risks')].data.push(infoRisk);
        xlsxData[gettextCatalog.getString('Operational risks')].data.push(opRisk);
      });

      /* Records Information & Operational Risks */
      for (recordsRisks in allRecordsRisks) {
        allRecordsRisks[recordsRisks].current[0].series.forEach((data,index) => {
          xlsxData[recordsRisks].data[index] = {};
          xlsxData[recordsRisks].data[index][0] = data.date;
          allRecordsRisks[recordsRisks].current.forEach((value,subindex) => {
            xlsxData[recordsRisks].data[index][-subindex + 3] = value.series[index].value;
            xlsxData[recordsRisks].data[index][-subindex + 6] = allRecordsRisks[recordsRisks].residual[subindex].series[index].value;
          });
        });
        xlsxData[recordsRisks].headings[0][0] = gettextCatalog.getString('Date');
      };

      /* Threats & Vulnerabilities */
      for (elt in threatsAndVulns) {
        let maxLength = Math.max(...threatsAndVulns[elt].data.map(data => { return data.length}));
        let indexOfMax = null;

        for (index in threatsAndVulns[elt].data) {
          if (threatsAndVulns[elt].data[index].length === maxLength) {
            indexOfMax = index;
            break;
          }
        }

        threatsAndVulns[elt].data[indexOfMax].forEach((date) => {
          let newObj = {};
          newObj[0] = date.date;
          threatsAndVulns[elt].data.forEach((value,subindex) => {
            let itemFound = value.filter(value => {
              return value.date == newObj[0];
            });
            if (itemFound.length > 0) {
              newObj[(subindex * 3) + 1] = itemFound[0].averageRate;
              newObj[(subindex * 3) + 2] = itemFound[0].count;
              newObj[(subindex * 3) + 3] = itemFound[0].maxRisk;
            }else {
              newObj[(subindex * 3) + 1] = null;
              newObj[(subindex * 3) + 2] = null;
              newObj[(subindex * 3) + 3] = null;
            }
          })
          xlsxData[elt].data.push(newObj);
        })

        threatsAndVulns[elt].labels.forEach((label,index) => {
          xlsxData[elt].headings[0].push(label,"","");
          xlsxData[elt].headings[1].push(
            elt == gettextCatalog.getString('Threats') ?
              gettextCatalog.getString('Prob.') :
              gettextCatalog.getString('Qualif.'),
            gettextCatalog.getString('Occurrence'),
            gettextCatalog.getString('MAX risk'),
          );
          xlsxData[elt].mergedCells.push(
            {s:{r:0,c:(index * 3) + 1},
            e:{r:0,c:(index * 3) + 3}}
          );
        })
      }

      /* Add sheets on workbook*/
      for (data in xlsxData) {
        let sheet = XLSX.utils.aoa_to_sheet(xlsxData[data].headings);
        sheet['!merges'] = xlsxData[data].mergedCells;
        XLSX.utils.sheet_add_json(sheet, xlsxData[data].data, {origin:2, skipHeader:true});
        XLSX.utils.book_append_sheet(wb, sheet, data.substring(0, 31));
      }

      /* write workbook and force a download */
      XLSX.writeFile(wb, "globalDashboard.xlsx");
    }

    function getParentWidth(id,rate = 1) {
      return document.getElementById(id).parentElement.clientWidth * rate;
    }
  }

})();

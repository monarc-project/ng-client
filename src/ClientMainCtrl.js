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
        top: 30,
        right: 150,
        bottom: 30,
        left: 100
      },
      width: 550,
      height: 550,
      externalFilter: '.filter-categories-graphGlobalCurrentRisks',
      radioButton: '.chartMode-graphGlobalCurrentRisks',
      showValues: true,
      nameValue :'riskInfo'
    };

    const optionsVerticalCurrentRisks = $.extend(
      angular.copy(optionsHorizontalCurrentRisks), {
        margin: {
          top: 30,
          right: 100,
          bottom: 150,
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
      width: 700,
      height: 400,
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
      width: 1000,
      height: 500,
      externalFilter: true,
      nameValue: 'averageRate'
    }

    const optionsThreatsOverview = {
      margin: {
        top: 30,
        right: 0,
        bottom: 30,
        left: 50
      },
      width: 200,
      height: 200,
      onClickFunction : function (d) {
        $scope.threatOptions.chartType = "line";
        $scope.threatOptions.threat = d.category;
        $scope.$apply()
      }
    };

// DATA MODELS =================================================================

    //Data Model for the graph for the current/target information risk
    var dataCurrentRisks = [];
    var dataResidualRisks = [];

    //Data Model for the graph for the historic current/target information risk
    var dataHistoricCurrentRisks = [
      {
        category:"High risks",
        series: [{
          category:"High risks",
          series: [
            {label:'2020-01-01', value:10},
            {label:'2020-02-02', value:15},
            {label:'2020-03-03', value:16},
            {label:'2020-04-04', value:15},
            {label:'2020-05-04', value:20},
            {label:'2020-06-04', value:13},
            {label:'2020-07-04', value:13},
            {label:'2020-08-04', value:12},
            {label:'2020-09-04', value:12},
            {label:'2020-10-04', value:14},
            {label:'2020-11-04', value:14},
            {label:'2020-12-04', value:5},
          ]
        }]
      },
      {
        category:"Medium risks",
        series: [{
          category:"Medium risks",
          series: [
            {label:'2020-01-01', value:40},
            {label:'2020-02-02', value:40},
            {label:'2020-03-03', value:36},
            {label:'2020-04-04', value:45},
            {label:'2020-05-04', value:20},
            {label:'2020-06-04', value:10},
            {label:'2020-07-04', value:10},
            {label:'2020-08-04', value:12},
            {label:'2020-09-04', value:12},
            {label:'2020-10-04', value:12},
            {label:'2020-11-04', value:12},
            {label:'2020-12-04', value:11},
          ]
        }]
      },
      {
        category:"Low risks",
        series: [{
          category:"Low risks",
          series: [
            {label:'2020-01-01', value:10},
            {label:'2020-02-02', value:30},
            {label:'2020-03-03', value:60},
            {label:'2020-04-04', value:28},
            {label:'2020-05-04', value:150},
            {label:'2020-06-04', value:145},
            {label:'2020-07-04', value:130},
            {label:'2020-08-04', value:110},
            {label:'2020-09-04', value:120},
            {label:'2020-10-04', value:120},
            {label:'2020-11-04', value:125},
            {label:'2020-12-04', value:111},
          ]
        }]
      }
    ];
    var dataHistoricTargetRisks = dataHistoricCurrentRisks;

    //Data Model for the graph for the threats by anr
    var allThreats = [];
    var dataThreats = [];

    var dataMultiLine = [];


// INIT FUNCTIONS ==============================================================

    var observerDisconnected = false;

    $scope.updateGlobalDashboard = function() {

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

      $scope.threatOptions = {
        displayBy: "probability",
        chartType: "overview",
        threat: null,
        startDate: null,
        endDate: null,
        minDate: null,
        maxDate: new Date()
      };

      getRiskStats();
      getThreatsStats();

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
        function(){
          drawCurrentRisk();
          drawResidualRisk();
          drawCurrentOpRisk();
          drawResidualOpRisk();
          newThreats = allThreats.filter(x => $scope.categories.indexOf(x.category) > -1);
          filterThreats(newThreats);
          drawThreats();



      })

      function settingsDialog() {
         if (!$scope.anrs) {
           $scope.anrs = [];
           $scope.categories.forEach(
             anr => {if (anr.selected == undefined) {
               anr = {
                 label : anr,
                 selected : true
               }
               $scope.anrs.push(anr);
             }
           })
         }

        $scope.cancel = function() {
            $scope.categories =  $scope.anrs.filter(
              x => {
                return x.selected === true
              })
              .map(x => x.label);
              $mdDialog.cancel();
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
        }
    }

// SELECT TAB FUNCTION =========================================================

    $scope.selectGraphRisks = function() {
      setObserver();
    }

    $scope.selectGraphOpRisks = function() {
      drawCurrentOpRisk();
      drawResidualOpRisk();
    }

    function setObserver (){
      let targetNode = document.querySelector('#filterByAnr');
      let observer = new MutationObserver(function([], observer) {
        let filter = document.querySelector('.filter-categories-graphGlobalCurrentRisks');
        if (filter && !observerDisconnected) {
          drawCurrentRisk();
          drawResidualRisk();
          observer.disconnect();
          observerDisconnected = true;
        }
      });
      observer.observe(targetNode, {childList: true,subtree: true});
    }


// WATCHERS ====================================================================

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

    $scope.$watchGroup(['threatOptions.displayBy', 'threatOptions.chartType', 'threatOptions.threat'], function(newValue,oldValue) {
      if (newValue[0] !== oldValue[0]) {
        optionsThreats.nameValue = newValue[0];
        optionsThreatsOverview.nameValue = newValue[0];

        let allValues = allThreats
        .filter(x => $scope.categories.indexOf(x.category) > -1)
        .flatMap(
          cat => cat.series.flatMap(
            subCat => subCat.series.flatMap(
              d => d[newValue[0]]
            )
          )
        );

        optionsThreats.forceMaxY = Math.max(...allValues);
      }
      if (newValue[2] !== oldValue[2] ) {
        dataThreats = allThreats
        .filter(x => $scope.categories.indexOf(x.category) > -1)
        .map(
          x => { return {
            ...x,
            series: x.series.filter(
              y => y.category == newValue[2]
            )
          }}
        );
        optionsThreats.title = newValue[2];
      }
      drawThreats();
    });

// DRAW CHART FUNCTIONS ========================================================

    function drawCurrentRisk() {
      if ($scope.risksOptions.current.chartType == 'vertical') {
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
        ChartService.multiHorizontalBarChart(
          '#graphGlobalCurrentRisks',
          dataCurrentRisks,
          optionsHorizontalCurrentRisks
        );
      }
      if ($scope.risksOptions.current.chartType == 'line') {
        ChartService.lineChart(
          '#graphGlobalCurrentRisks',
          dataHistoricCurrentRisks,
          optionsLineCurrentRisks
        );
      }
    };

    function drawResidualRisk() {
      if ($scope.risksOptions.residual.chartType == 'vertical') {
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
        ChartService.multiHorizontalBarChart(
          '#graphGlobalResidualRisks',
          dataResidualRisks,
          optionsHorizontalResidualRisks
        );
      }
      if ($scope.risksOptions.residual.chartType == 'line') {
        ChartService.lineChart(
          '#graphGlobalResidualRisks',
          dataHistoricTargetRisks,
          optionsLineCurrentRisks
        );
      }
    };

    function drawCurrentOpRisk() {
      if ($scope.opRisksOptions.current.chartType == 'vertical') {
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
        ChartService.multiHorizontalBarChart(
          '#graphGlobalCurrentOpRisks',
          dataCurrentRisks,
          optionsHorizontalCurrentOpRisks
        );
      }
      if ($scope.opRisksOptions.current.chartType == 'line') {
        ChartService.lineChart(
          '#graphGlobalCurrentOpRisks',
          dataHistoricCurrentRisks,
          optionsLineCurrentRisks
        );
      }
    };

    function drawResidualOpRisk() {
      if ($scope.opRisksOptions.residual.chartType == 'vertical') {
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
        ChartService.multiHorizontalBarChart(
          '#graphGlobalResidualOpRisks',
          dataResidualRisks,
          optionsHorizontalResidualOpRisks
        );
      }
      if ($scope.opRisksOptions.residual.chartType == 'line') {
        ChartService.lineChart(
          '#graphGlobalResidualOpRisks',
          dataHistoricTargetRisks,
          optionsLineCurrentRisks
        );
      }
    };

    function drawThreats() {
      if ($scope.threatOptions.chartType == "overview") {
        ChartService.multiLineChart(
          '#graphGlobalThreats',
          dataMultiLine,
          optionsThreatsOverview
        );
      }
      if ($scope.threatOptions.chartType == "line") {
        ChartService.lineChart(
          '#graphGlobalThreats',
          dataThreats,
          optionsThreats
        );
      }
    };

// GET STATS DATA FUNCTIONS ====================================================

    function getRiskStats() {
      let params = {
        type: "risk",
      }
      $http.get("api/stats/",{params: params})
        .then(function (response) {
          dataCurrentRisks = response.data['current'];
          dataResidualRisks = response.data['residual'];

          $scope.categories = dataCurrentRisks.map(function (d) {
              return d.category;
          });
      });
    }

    function getThreatsStats() {
        // let anrs = [
        //   580,
        //   627,
        //   637,
        // ]

        let params = {
          type: "threat",
          dateFrom: $scope.threatOptions.startDate,
          dateTo: $scope.threatOptions.endDate,
          postprocessor: "threat_average_on_date",
          // 'anrs[]' : anrs,
        };

        $http.get("api/stats/",{params: params})
          .then(function (response) {
            allThreats = response.data;
            filterThreats(allThreats);
            drawThreats();
        });
    };

    function filterThreats(threats) {

      let allValues = threats.flatMap(
        cat => cat.series.flatMap(
          subCat => subCat.series.flatMap(
            d => d[$scope.threatOptions.displayBy]
          )
        )
      );

      optionsThreats.forceMaxY = Math.max(...allValues);

      $scope.threats = [...new Set(
        threats.flatMap(
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

      dataMultiLine = [];

      $scope.threats.forEach((threat) => {
        let addCategorie = {
          category:threat,
          series: [
            {label:'2020-01-01', averageRate:1, count:8, maxRisk:40},
            {label:'2020-02-02', averageRate:2, count:8, maxRisk:40},
            {label:'2020-03-03', averageRate:2, count:9, maxRisk:36},
            {label:'2020-04-04', averageRate:1, count:2, maxRisk:45},
            {label:'2020-05-04', averageRate:4, count:6, maxRisk:20},
            {label:'2020-06-04', averageRate:4, count:6, maxRisk:10},
            {label:'2020-07-04', averageRate:4, count:4, maxRisk:10},
            {label:'2020-08-04', averageRate:3, count:8, maxRisk:12},
            {label:'2020-09-04', averageRate:3, count:8, maxRisk:12},
            {label:'2020-10-04', averageRate:2, count:8, maxRisk:12},
            {label:'2020-11-04', averageRate:1, count:2, maxRisk:12},
            {label:'2020-12-04', averageRate:2, count:10, maxRisk:11},

          ]
        };

        dataMultiLine.push(addCategorie);

      });

      if (!$scope.threatOptions.threat) {
        $scope.threatOptions.threat = $scope.threats[0];
        optionsThreats.title = $scope.threatOptions.threat;
      }


      dataThreats = threats.map(x => {
        return {...x,series: x.series.filter(
          y => y.category == $scope.threatOptions.threat)}
        }
      );

    }


// EXPORT FUNCTIONS  ===========================================================

    $scope.exportAsPNG = function(idOfGraph, name, parametersAction = {backgroundColor: 'white'}) {
      let node = d3.select('#' + idOfGraph).select("svg");
      saveSvgAsPng(node.node(), name + '.png', parametersAction);
    }




    // TODO: if we need the Vulnerabilities stats in the same format as threats,
    //       then it can be fetched by {"type": "vulnerability"}

    $scope.selectGraphVulnerabilities = function () {

    }

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
/*
    let getCartographyStats = function() {
        $http.get(
            "api/stats/",
            {"params": {"type": "cartography", "getLast": true}}
        ).then(function (response) {

            options = {
                xLabel:"Likelihood",
                yLabel:"Impact",
                color : ["#D6F107","#FFBC1C","#FD661F"],
                threshold : [9,28]
            };

            //console.log(response.data);

            // TODO: we need to iterate through anrs: response.data['current'] and response.data['target']
            dataSampleTimeGraphForOneAnr = response.data['current'][2]['series'];


            ChartService.heatmapChart('#graphHeatmapChart', dataSampleTimeGraphForOneAnr, options);
        });
    };
    getCartographyStats();
*/
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
/*
      let getComplianceStats = function () {
          $http.get(
              "api/stats/",
              {"params": {"type": "compliance", "getLast": true}}
          ).then(function (response) {

              options = {
                  width: 700,
                  opacityArea: [0.2, 0.5],
                  fillCategories: [true, true]
              }

              console.log(response.data);

              // TODO: we might need to change the response format for convenience.
              // The current example is not correct, as category is shown as referential name (which is the same here).
              // Format of `data` is not the same as in sample data.
              data = [
                  {
                      "category": response.data[2]['series'][0]['category'],
                      "series": response.data[2]['series'][0]['series']['target'],
                  },
                  {
                      "category": response.data[2]['series'][0]['category'],
                      "series": response.data[2]['series'][0]['series']['current'],
                  }
              ];
              console.log(data);
              ChartService.radarChart('#graphRadarChart', data, options);
          });
      };
      getComplianceStats();
*/
  }

})();

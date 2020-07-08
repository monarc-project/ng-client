(function() {
  angular
    .module('ClientApp')
    .controller('ClientDashboardCtrl', [
      '$scope', '$state', '$http', 'gettextCatalog', '$q', '$timeout',
      '$stateParams', 'AnrService', 'ClientAnrService', 'ReferentialService', 'SOACategoryService',
      'ClientSoaService', 'ChartService', ClientDashboardCtrl
    ]);

  function ClientDashboardCtrl($scope, $state, $http, gettextCatalog, $q, $timeout,
    $stateParams, AnrService, ClientAnrService, ReferentialService, SOACategoryService,
    ClientSoaService, ChartService) {

    $scope.dashboard = {
      riskInfo: false,
      riskOp: false,
      currentTabIndex: 0,
      refSelected: null,
      cartographyRisksType: 'info_risks'
    };

    var anr = null;
    var cartoCurrent = null;
    var cartoTarget = null;
    var threatScale = null;
    var vulnerabilityScale = null;
    var firstRefresh = true;

// TABS ========================================================================
     //Displays the risks charts
    $scope.selectGraphRisks = function() {
    };

    //Displays the threats charts
    $scope.selectGraphThreats = function() {};

    //Displays the vulnerabilities charts
    $scope.selectGraphVulnerabilities = function() {};

    //Displays the cartography
    $scope.selectGraphCartography = function() {
      if ($scope.dashboard.cartographyRisksType == "info_risks") {
        if ($scope.dashboard.riskInfo) {
          optionsCartography.threshold = [anr.seuil1, anr.seuil2];
          optionsCartography.width = document.getElementById('graphCartographyCurrent').parentElement.clientWidth;
          ChartService.heatmapChart(
            '#graphCartographyCurrent',
            dataCurrentCartography,
            optionsCartography
          );
          ChartService.heatmapChart(
            '#graphCartographyTarget',
            dataTargetCartography,
            optionsCartography
          );
        }
      } else {
        if ($scope.dashboard.riskOp) {
          optionsCartography.threshold = [anr.seuilRolf1, anr.seuilRolf2];
          optionsCartography.width = 400;
          ChartService.heatmapChart(
            '#graphCartographyCurrent',
            dataCurrentCartographyRiskOp,
            optionsCartography
          );
          ChartService.heatmapChart(
            '#graphCartographyTarget',
            dataTargetCartographyRiskOp,
            optionsCartography
          );
        }
      }
    };

    //Displays the Compliance tab
    $scope.selectGraphCompliance = function() {
      if ($scope.dashboard.refSelected) {
        ChartService.radarChart(
          '#graphCompliance',
          dataCompliance[$scope.dashboard.refSelected],
          optionsChartCompliance
        );
      }
      $scope.loadCompliance = true;
    };

// OPTIONS CHARTS ==============================================================

    //Options of the chart that displays current risks by level
    const optionsCurrentRisksByLevel = {
      height: 450,
      width: 450,
      margin: {
        top: 20,
        right: 20,
        bottom: 50,
        left: 55
      },
      color: ["#D6F107", "#FFBC1C", "#FD661F"],
      showLegend: false,
      forceDomainY: {
        min: 0,
        max: 0
      },
      yLabel: gettextCatalog.getString('Current risks')
    };

    //Options of the chart that displays Residual risks by level
    const optionsTargetRisksByLevel = $.extend(
      optionsCurrentRisksByLevel, {
        yLabel: gettextCatalog.getString('Residual risks')
      }
    );

    //Options for the chart that displays the current risks by asset
    const optionsRisksByAsset = {
      height: 650,
      width: 600,
      margin: {
        top: 20,
        right: 150,
        bottom: 100,
        left: 20
      },
      showValues: true,
      forceChartMode: 'stacked',
      rotationXAxisLabel: 45,
      offsetXAxisLabel: 0.9,
      onClickFunction: function(d) {
        $state.transitionTo("main.project.anr.instance", {
          modelId: anr.id,
          instId: d.id
        }, {
          notify: true,
          relative: null,
          location: true,
          inherit: false,
          reload: true
        });
      }
    };

    //Options for the charts that display the risks by parent asset
    const optionsCurrentRisksByParent = {
      height: 650,
      width: 600,
      margin: {
        top: 20,
        right: 150,
        bottom: 100,
        left: 20
      },
      showValues: true,
      forceChartMode: 'stacked',
      rotationXAxisLabel: 45,
      offsetXAxisLabel: 0.9,
      onClickFunction: function(d) { //on click go one child deeper (node) or go to MONARC (leaf)
        if (d.child.length > 0) {
          updateCurrentRisksByParentAsset(d.child).then(function(data) {
            $scope.dashboard.currentRisksBreadcrumb.push(d.category);
            $scope.dashboard.currentRisksMemoryTab.push(data);
            ChartService.multiVerticalBarChart(
              '#graphCurrentRisks',
              data,
              optionsCurrentRisksByParent
            );
          });
        } else {
          $state.transitionTo("main.project.anr.instance", {
            modelId: anr.id,
            instId: d.id
          }, {
            notify: true,
            relative: null,
            location: true,
            inherit: false,
            reload: true
          });
        }
      }
    };

    //Options for the charts that display the risks by parent asset
    const optionsTargetRisksByParent = $.extend(
      angular.copy(optionsCurrentRisksByParent), {
        onClickFunction: function(d) { //on click go one child deeper (node) or go to MONARC (leaf)
          if (d.child.length > 0) {
            updateTargetRisksByParentAsset(d.child).then(function(data) {
              $scope.dashboard.targetRisksBreadcrumb.push(d.category);
              $scope.dashboard.targetRisksMemoryTab.push(data);
              ChartService.multiVerticalBarChart(
                '#graphTargetRisks',
                data,
                optionsTargetRisksByParent
              );
            });
          } else {
            $state.transitionTo("main.project.anr.instance", {
              modelId: anr.id,
              instId: d.id
            }, {
              notify: true,
              relative: null,
              location: true,
              inherit: false,
              reload: true
            });
          }
        }
      }
    );

    //Options for the chart that displays threats by their number of occurrences
    const optionsHorizontalThreats = {
      height: 800,
      width: 1400,
      margin: {
        top: 30,
        right: 30,
        bottom: 30,
        left: 300
      },
      colorGradient: true,
      color: ["#D6F107", "#FD661F"],
      showLegend: false,
      sort: true,
    };

    //Options for the chart that displays threats by their number of occurrences
    const optionsVerticalThreats = $.extend(
      angular.copy(optionsHorizontalThreats), {
        margin: {
          top: 30,
          right: 200,
          bottom: 300,
          left: 30
        },
        rotationXAxisLabel: 45,
        offsetXAxisLabel: 0.9,
      }
    );

    const optionsHotizontalVulnerabilities = {
      height: 800,
      width: 1400,
      margin: {
        top: 30,
        right: 30,
        bottom: 30,
        left: 300
      },
      colorGradient: true,
      color: ["#D6F107", "#FD661F"],
      showLegend: false,
      sort: true,
    }

    const optionsVerticalVulnerabilities = $.extend(
      angular.copy(optionsHotizontalVulnerabilities), {
        margin: {
          top: 30,
          right: 200,
          bottom: 300,
          left: 30
        },
        rotationXAxisLabel: 45,
        offsetXAxisLabel: 0.9,
      }

    );

    //Options for the chart that displays the cartography
    const optionsCartography = {
      xLabel: gettextCatalog.getString('Likelihood'),
      yLabel: gettextCatalog.getString('Impact'),
      color: ["#D6F107", "#FFBC1C", "#FD661F"],
      threshold: []
    };

    //Options for the chart that displays the compliance
    const optionsChartCompliance = {
      width: 650
    };

// DATA MODELS =================================================================

    //Data Model for the graph for the current risk by level of risk (low, med., high)
    var dataCurrentRisksByLevel = [];

    //Data model for the graph for the target risk by level of risk (low, med., high)
    var dataTargetRisksByLevel = [];

    //Data model for the graph of current risk by asset
    var dataCurrentRisksByAsset = [];

    //Data model for the graph of Residual risks by asset
    var dataTargetRisksByAsset = [];

    //Data model for the graph of current risk by parent asset
    let dataCurrentRisksByParent = [];

    //Data model for the graph of residual risk by parent asset
    let dataTargetRisksByParent = [];

    //Data for the graph for the number of threats by threat type
    var dataThreats = [];

    //Data for the graph for all vulnerabilities
    var dataAllVulnerabilities = [];

    //Data for the graph for the spliced vulnerabilities
    var dataSplicedVulnerabilities = [];

    //Data for the graph for risk cartography
    let dataCurrentCartography = [];
    let dataTargetCartography = [];
    let dataCurrentCartographyRiskOp = [];
    let dataTargetCartographyRiskOp = [];

    //Data for the graph for the compliance
    let dataCompliance = [];

// GET ALL DATA CHARTS FUNCTION=================================================

    $scope.updateGraphs = function() {

      $scope.dashboard.currentRisksBreadcrumb = [gettextCatalog.getString("Overview")];
      $scope.dashboard.targetRisksBreadcrumb = [gettextCatalog.getString("Overview")];
      $scope.dashboard.currentRisksMemoryTab = [];
      $scope.dashboard.targetRisksMemoryTab = [];
      $scope.displayCurrentRisksBy, $scope.displayTargetRisksBy = "level";
      if (!$scope.currentRisksOptions) {
        $scope.currentRisksOptions = 'vertical';
      }
      if (!$scope.targetRisksOptions) {
        $scope.targetRisksOptions = 'vertical';
      }
      if (!$scope.displayThreatsBy) {
        $scope.displayThreatsBy = 'number';
      }
      if (!$scope.threatsOptions) {
        $scope.threatsOptions = 'vertical';
      }
      if (!$scope.displayVulnerabilitiesBy) {
        $scope.displayVulnerabilitiesBy = 'number';
      }
      if (!$scope.vulnerabilitiesOptions) {
        $scope.vulnerabilitiesOptions = 'vertical';
      }
      if (!$scope.vulnerabilitiesDisplayed) {
        $scope.vulnerabilitiesDisplayed = 20;
      }
      $scope.loadCompliance = false;
      $scope.loadingPptx = false;

      ClientAnrService.getAnr($stateParams.modelId).then(function(data) {
        anr = data;
        $http.get("api/client-anr/" + anr.id + "/carto-risks-dashboard").then(function(data) {
          cartoCurrent = data.data.carto.real;
          cartoTarget = data.data.carto.targeted;
          if (Object.values(cartoCurrent.riskInfo.distrib).length > 0) {
            $scope.dashboard.riskInfo = true;
          }
          if (Object.values(cartoCurrent.riskOp.distrib).length > 0) {
            $scope.dashboard.riskOp = true;
          }

          try {
            // cartography of risks - first tab
            updateCartoRisks();
          } catch {
            console.log('Error when retrieving data for the risks tab.');
          }
          try {
            // cartography - fourth tab
            updateCartography(data);
          } catch {
            console.log('Error when retrieving data for the cartography.');
          }

          if ($scope.dashboard.currentTabIndex == 3) {
            $scope.selectGraphCartography();
          }

          AnrService.getScales(anr.id).then(function(data) {
            threatScale = data.scales.filter(d => {
              return d.type == "threat"
            })[0];
            vulnerabilityScale = data.scales.filter(d => {
              return d.type == "vulnerability"
            })[0];

            AnrService.getInstances(anr.id).then(function(data) {
              let instances = data.instances;

              AnrService.getAnrRisks(anr.id, {
                limit: -1,
                order: 'instance',
                order_direction: 'asc'
              }).then(function(data) {
                let risks = data.risks;
                updateCurrentRisksByAsset(risks);
                updateTargetRisksByAsset(risks);
                updateThreats(risks);
                updateVulnerabilities(risks);
                updateCurrentRisksByParentAsset(instances).then(function(data) {
                  $scope.dashboard.currentRisksMemoryTab.push(data);
                });
                updateTargetRisksByParentAsset(instances).then(function(data) {
                  $scope.dashboard.targetRisksMemoryTab.push(data);
                });
                ReferentialService.getReferentials({
                  order: 'createdAt'
                }).then(function(data) {
                  $scope.dashboard.referentials = [];
                  data.referentials.forEach(function(ref) {
                    if (Array.isArray(ref.measures)) {
                      $scope.dashboard.referentials.push(ref);
                    }
                  })
                  SOACategoryService.getCategories().then(function(data) {
                    let categories = data.categories;
                    ClientSoaService.getSoas().then(function(data) {
                      let soa = data.soaMeasures;
                      updateCompliance($scope.dashboard.referentials, categories, soa);
                      if ($scope.dashboard.referentials[0] && !$scope.dashboard.refSelected) {
                        $scope.dashboard.refSelected = $scope.dashboard.referentials[0].uuid;
                      }
                      $scope.selectGraphCompliance();
                    });
                  });
                });
                firstRefresh = false;
              });
            });
          });
        });
      });
    }

    $scope.$on('Dashboard', function() {
      if (!firstRefresh) {
        $scope.updateGraphs();
      }
    });

// WATCHERS ====================================================================

    $scope.$watchGroup(['displayCurrentRisksBy', 'currentRisksOptions', 'graphCurrentRisks'], function(newValues) {
      if (newValues[0] == "level" && $scope.currentRisksOptions && dataCurrentRisksByLevel.length > 0) {
        if (newValues[1] == 'vertical') {
          ChartService.verticalBarChart(
            '#graphCurrentRisks',
            dataCurrentRisksByLevel,
            optionsCurrentRisksByLevel
          );
        }
        if (newValues[1] == 'donut') {
          ChartService.donutChart(
            '#graphCurrentRisks',
            dataCurrentRisksByLevel,
            optionsCurrentRisksByLevel
          );
        }
      }
      if (newValues[0] == "asset" && $scope.currentRisksOptions) {
        ChartService.multiVerticalBarChart(
          '#graphCurrentRisks',
          dataCurrentRisksByAsset,
          optionsRisksByAsset
        );
      }
      if (newValues[0] == "parentAsset" && $scope.currentRisksOptions) {
        ChartService.multiVerticalBarChart(
          '#graphCurrentRisks',
          dataCurrentRisksByParent,
          optionsCurrentRisksByParent
        );
      }
    });

    $scope.$watchGroup(['displayTargetRisksBy', 'targetRisksOptions', 'graphTargetRisks'], function(newValues) {
      if (newValues[0] == "level" && $scope.currentRisksOptions && dataTargetRisksByLevel.length > 0) {
        if (newValues[1] == 'vertical') {
          ChartService.verticalBarChart(
            '#graphTargetRisks',
            dataTargetRisksByLevel,
            optionsTargetRisksByLevel
          );
        }
        if (newValues[1] == 'donut') {
          ChartService.donutChart(
            '#graphTargetRisks',
            dataTargetRisksByLevel,
            optionsTargetRisksByLevel
          );
        }
      }
      if (newValues[0] == "asset" && $scope.targetRisksOptions) {
        ChartService.multiVerticalBarChart(
          '#graphTargetRisks',
          dataTargetRisksByAsset,
          optionsRisksByAsset
        );
      }
      if (newValues[0] == "parentAsset" && anr.id && $scope.targetRisksOptions) {
        ChartService.multiVerticalBarChart(
          '#graphTargetRisks',
          dataTargetRisksByParent,
          optionsTargetRisksByParent
        );
      }
    });

    $scope.$watchGroup(['displayThreatsBy', 'threatsOptions'], function(newValue) {

      if (newValue[0] == "number") {
        dataThreats.map(d => {
          d.value = d.ocurrance;
          return d
        });
      }

      if (newValue[0] == "probability") {
        dataThreats.map(d => {
          d.value = d.average;
          return d
        });
        optionsHorizontalThreats.forceDomainX =
          optionsVerticalThreats.forceDomainY = {
            min: threatScale.min,
            max: threatScale.max
          };
      }

      if (newValue[0] == "max_associated_risk") {
        dataThreats.map(d => {
          d.value = d.max_risk;
          return d
        });
      }

      if (newValue[1] == 'horizontal') {
        ChartService.horizontalBarChart(
          '#graphThreats',
          dataThreats,
          optionsHorizontalThreats
        );
      } else {
        ChartService.verticalBarChart(
          '#graphThreats',
          dataThreats,
          optionsVerticalThreats
        );
      }
      delete optionsHorizontalThreats.forceDomainX;
      delete optionsVerticalThreats.forceDomainY;
    });

    $scope.$watchGroup(['displayVulnerabilitiesBy', 'vulnerabilitiesDisplayed', 'vulnerabilitiesOptions'], function(newValue) {
      if (newValue[0] == "number") {
        dataAllVulnerabilities.map(d => {
          d.value = d.ocurrance;
          return d
        });
      }

      if (newValue[0] == "qualification") {
        dataAllVulnerabilities.map(d => {
          d.value = d.average;
          return d
        });
        optionsHotizontalVulnerabilities.forceDomainX =
          optionsVerticalVulnerabilities.forceDomainY = {
            min: vulnerabilityScale.min,
            max: vulnerabilityScale.max
          };
      }

      if (newValue[0] == "max_associated_risk") {
        dataAllVulnerabilities.map(d => {
          d.value = d.max_risk;
          return d
        });
      }

      if (dataAllVulnerabilities.length >= newValue[1] && newValue[1] !== "all") {
        dataAllVulnerabilities.sort(function(a, b) {
          return b['value'] - a['value']
        })
        dataSplicedVulnerabilities = dataAllVulnerabilities.slice(0, $scope.vulnerabilitiesDisplayed);
        if (optionsHotizontalVulnerabilities.initHeight) {
          optionsHotizontalVulnerabilities.height = optionsHotizontalVulnerabilities.initHeight;
          delete optionsHotizontalVulnerabilities.initHeight;
        }
        if (optionsVerticalVulnerabilities.initWidth) {
          optionsVerticalVulnerabilities.width = optionsVerticalVulnerabilities.initWidth;
          delete optionsVerticalVulnerabilities.initWidth;
        }
      } else {
        dataSplicedVulnerabilities = angular.copy(dataAllVulnerabilities);
      }

      if (newValue[2] == 'horizontal') {
        if (dataSplicedVulnerabilities.length > 30 && optionsHotizontalVulnerabilities.initHeight == undefined) {
          optionsHotizontalVulnerabilities.initHeight = optionsHotizontalVulnerabilities.height;
          optionsHotizontalVulnerabilities.height += (dataSplicedVulnerabilities.length - 30) * 30;
        }
        ChartService.horizontalBarChart(
          '#graphVulnerabilities',
          dataSplicedVulnerabilities,
          optionsHotizontalVulnerabilities
        );
      } else {
        if (dataSplicedVulnerabilities.length > 30 && optionsVerticalVulnerabilities.initWidth == undefined) {
          optionsVerticalVulnerabilities.initWidth = optionsVerticalVulnerabilities.width;
          optionsVerticalVulnerabilities.width += (dataSplicedVulnerabilities.length - 30) * 10;
        }
        ChartService.verticalBarChart(
          '#graphVulnerabilities',
          dataSplicedVulnerabilities,
          optionsVerticalVulnerabilities
        );
      }
      delete optionsHotizontalVulnerabilities.forceDomainX;
      delete optionsVerticalVulnerabilities.forceDomainY;
    });

    $scope.$watch('cartographyRisksType', function(newValue) {
      if (newValue == "info_risks") {
        if ($scope.dashboard.riskInfo) {
          $scope.dashboard.cartographyRisksType = 'info_risks';
          optionsCartography.threshold = [anr.seuil1, anr.seuil2];
          optionsCartography.width = document.getElementById('graphCartographyCurrent').parentElement.clientWidth;
          ChartService.heatmapChart(
            '#graphCartographyCurrent',
            dataCurrentCartography,
            optionsCartography
          );
          ChartService.heatmapChart(
            '#graphCartographyTarget',
            dataTargetCartography,
            optionsCartography
          );
        }
      } else {
        if ($scope.dashboard.riskOp) {
          $scope.dashboard.cartographyRisksType = 'op_risk';
          optionsCartography.threshold = [anr.seuilRolf1, anr.seuilRolf2];
          optionsCartography.width = 400;

          ChartService.heatmapChart(
            '#graphCartographyCurrent',
            dataCurrentCartographyRiskOp,
            optionsCartography
          );
          ChartService.heatmapChart(
            '#graphCartographyTarget',
            dataTargetCartographyRiskOp,
            optionsCartography
          );
        }
      }
    });

    $scope.$watch('dashboard.refSelected', function(newValue) {
      if (newValue) {
        ChartService.radarChart(
          '#graphCompliance',
          dataCompliance[$scope.dashboard.refSelected],
          optionsChartCompliance
        );
      }
    });

// UPDATE CHART FUNCTIONS ======================================================

    function updateCartoRisks() {
      if (!Array.isArray(cartoCurrent.riskInfo.distrib)) {
        dataCurrentRisksByLevel = [{
            category: gettextCatalog.getString('Low risks'),
            value: cartoCurrent.riskInfo.distrib[0]
          },
          {
            category: gettextCatalog.getString('Medium risks'),
            value: cartoCurrent.riskInfo.distrib[1]
          },
          {
            category: gettextCatalog.getString('High risks'),
            value: cartoCurrent.riskInfo.distrib[2]
          }
        ];

        let risksValues = dataCurrentRisksByLevel.map(d => d.value);
        optionsCurrentRisksByLevel.forceDomainY.max =
          optionsTargetRisksByLevel.forceDomainY.max =
          risksValues.reduce((sum, d) => {
            return sum + d
          })

        ChartService.verticalBarChart(
          '#graphCurrentRisks',
          dataCurrentRisksByLevel,
          optionsCurrentRisksByLevel
        );
      }

      if (!Array.isArray(cartoTarget.riskInfo.distrib)) {
        dataTargetRisksByLevel = [{
            category: gettextCatalog.getString('Low risks'),
            value: cartoTarget.riskInfo.distrib[0]
          },
          {
            category: gettextCatalog.getString('Medium risks'),
            value: cartoTarget.riskInfo.distrib[1]
          },
          {
            category: gettextCatalog.getString('High risks'),
            value: cartoTarget.riskInfo.distrib[2]
          }
        ];

        ChartService.verticalBarChart(
          '#graphTargetRisks',
          dataTargetRisksByLevel,
          optionsTargetRisksByLevel
        );
      }
    };

    function updateCurrentRisksByAsset(risks) {
      treshold1 = anr.seuil1;
      treshold2 = anr.seuil2;
      dataCurrentRisksByAsset = [];

      risks.forEach(function(risk) {
        if (risk.max_risk > -1) {
          let assetFound = dataCurrentRisksByAsset.filter(function(asset) {
            return asset.id == risk.instance
          })[0];
          if (assetFound == undefined) {
            dataCurrentRisksByAsset.push({
              id: risk.instance,
              category: $scope._langField(risk, 'instanceName'),
              series: [{
                  label: gettextCatalog.getString("Low risks"),
                  value: (risk.max_risk >= 0 && risk.max_risk <= treshold1) ? 1 : 0
                },
                {
                  label: gettextCatalog.getString("Medium risks"),
                  value: (risk.max_risk <= treshold2 && risk.max_risk > treshold1) ? 1 : 0
                },
                {
                  label: gettextCatalog.getString("High risks"),
                  value: (risk.max_risk > treshold2) ? 1 : 0
                }
              ],
            });
          } else {
            if (risk.max_risk > treshold2) {
              assetFound.series[2].value += 1;
            } else if (risk.max_risk <= treshold2 && risk.max_risk > treshold1) {
              assetFound.series[1].value += 1;
            } else if (risk.max_risk >= 0 && risk.max_risk <= treshold1) {
              assetFound.series[0].value += 1;
            }
          }
        }
      })
    };

    function updateTargetRisksByAsset(risks) {
      treshold1 = anr.seuil1;
      treshold2 = anr.seuil2;
      dataTargetRisksByAsset = [];

      risks.forEach(function(risk) {
        if (risk.max_risk > -1) {
          let assetFound = dataTargetRisksByAsset.filter(function(asset) {
            return asset.id == risk.instance
          })[0];
          if (assetFound == undefined) {
            dataTargetRisksByAsset.push({
              id: risk.instance,
              category: $scope._langField(risk, 'instanceName'),
              series: [{
                  label: gettextCatalog.getString("Low risks"),
                  value: (risk.target_risk >= 0 && risk.target_risk <= treshold1) ? 1 : 0
                },
                {
                  label: gettextCatalog.getString("Medium risks"),
                  value: (risk.target_risk <= treshold2 && risk.target_risk > treshold1) ? 1 : 0
                },
                {
                  label: gettextCatalog.getString("High risks"),
                  value: (risk.target_risk > treshold2) ? 1 : 0
                }
              ],
            });
          } else {
            if (risk.target_risk > treshold2) {
              assetFound.series[2].value += 1;
            } else if (risk.target_risk <= treshold2 && risk.target_risk > treshold1) {
              assetFound.series[1].value += 1;
            } else if (risk.target_risk >= 0 && risk.target_risk <= treshold1) {
              assetFound.series[0].value += 1;
            }
          }
        }
      });
    };

    function updateCurrentRisksByParentAsset(data) {
      let promise = $q.defer();
      dataCurrentRisksByParent = [];

      treshold1 = anr.seuil1;
      treshold2 = anr.seuil2;

      data.forEach(function(instance, index, instances) {
        AnrService.getInstanceRisks(anr.id, instance.id, {
          limit: -1
        }).then(function(data) {
          let parent = {
            id: instance.id,
            category: $scope._langField(instance, 'name'),
            isparent: (instance.parent == 0) ? true : false,
            child: instance.child,
            series: [{
                label: gettextCatalog.getString("Low risks"),
                value: 0
              },
              {
                label: gettextCatalog.getString("Medium risks"),
                value: 0
              },
              {
                label: gettextCatalog.getString("High risks"),
                value: 0
              }
            ]
          }

          data.risks.forEach(function(risk) {
            if (risk.max_risk > -1) {
              if (risk.max_risk > treshold2) {
                parent.series[2].value += 1;
              } else if (risk.max_risk <= treshold2 && risk.max_risk > treshold1) {
                parent.series[1].value += 1;
              } else if (risk.max_risk >= 0 && risk.max_risk <= treshold1) {
                parent.series[0].value += 1;
              }
            }
          });

          return parent;

        }).then((data) => {
          dataCurrentRisksByParent.push(data);
          if (dataCurrentRisksByParent.length == instances.length) {
            dataCurrentRisksByParent.sort(function(a, b) {
                return a.category.localeCompare(b.category)
              }),
              promise.resolve(dataCurrentRisksByParent);
          }
        });
      })

      return promise.promise;
    }

    function updateTargetRisksByParentAsset(data) {
      let promise = $q.defer();
      dataTargetRisksByParent = [];
      treshold1 = anr.seuil1;
      treshold2 = anr.seuil2;

      data.forEach(function(instance, index, instances) {
        AnrService.getInstanceRisks(anr.id, instance.id, {
          limit: -1
        }).then(function(data) {
          let parent = {
            id: instance.id,
            category: $scope._langField(instance, 'name'),
            isparent: (instance.parent == 0) ? true : false,
            child: instance.child,
            series: [{
                label: gettextCatalog.getString("Low risks"),
                value: 0
              },
              {
                label: gettextCatalog.getString("Medium risks"),
                value: 0
              },
              {
                label: gettextCatalog.getString("High risks"),
                value: 0
              }
            ]
          }

          data.risks.forEach(function(risk) {
            if (risk.max_risk > -1) {
              if (risk.target_risk > treshold2) {
                parent.series[2].value += 1;
              } else if (risk.target_risk <= treshold2 && risk.target_risk > treshold1) {
                parent.series[1].value += 1;
              } else if (risk.target_risk >= 0 && risk.target_risk <= treshold1) {
                parent.series[0].value += 1;
              }
            }
          });

          return parent;

        }).then((data) => {
          dataTargetRisksByParent.push(data);
          if (dataTargetRisksByParent.length == instances.length) {
            dataTargetRisksByParent.sort(function(a, b) {
                return a.category.localeCompare(b.category)
              }),
              promise.resolve(dataTargetRisksByParent);
          }
        });
      })

      return promise.promise;
    }

    function updateThreats(risks) {
      dataThreats = [];

      risks.sort(function(a, b) {
        return b['max_risk'] - a['max_risk']
      })

      risks.forEach(function(risk) {
        if (risk.max_risk > -1) {
          let threatFound = dataThreats.filter(function(threat) {
            return threat.id == risk.threat
          })[0];
          if (threatFound == undefined) {
            dataThreats.push({
              id: risk.threat,
              category: $scope._langField(risk, 'threatLabel'),
              ocurrance: 1,
              value: null,
              average: risk.threatRate,
              max_risk: risk.max_risk
            })
          } else {
            threatFound.ocurrance += 1;
            threatFound.average *= (threatFound.ocurrance - 1);
            threatFound.average += risk.threatRate;
            threatFound.average = threatFound.average / threatFound.ocurrance;
          }
        }
      });

      if ($scope.displayThreatsBy == "number") {
        dataThreats.map(d => {
          d.value = d.ocurrance;
          return d
        });
      }

      if ($scope.displayThreatsBy == "probability") {
        dataThreats.map(d => {
          d.value = d.average;
          return d
        });
        optionsHorizontalThreats.forceDomainX =
          optionsVerticalThreats.forceDomainY = {
            min: threatScale.min,
            max: threatScale.max
          };
      }

      if ($scope.displayThreatsBy == "max_associated_risk") {
        dataThreats.map(d => {
          d.value = d.max_risk;
          return d
        });
      }

      if ($scope.threatsOptions == 'horizontal') {
        ChartService.horizontalBarChart(
          '#graphThreats',
          dataThreats,
          optionsHorizontalThreats
        );
      } else {
        ChartService.verticalBarChart(
          '#graphThreats',
          dataThreats,
          optionsVerticalThreats
        );
      }
      delete optionsHorizontalThreats.forceDomainX;
      delete optionsVerticalThreats.forceDomainY;
    };

    function updateVulnerabilities(risks) {
      dataAllVulnerabilities = [];

      risks.forEach(function(risk) {
        if (risk.max_risk > -1) {
          let vulnerabilityFound = dataAllVulnerabilities.filter(function(vulnerability) {
            return vulnerability.id == risk.vulnerability
          })[0];
          if (vulnerabilityFound == undefined) {
            dataAllVulnerabilities.push({
              id: risk.vulnerability,
              category: $scope._langField(risk, 'vulnLabel'),
              ocurrance: 1,
              value: null,
              average: risk.vulnerabilityRate,
              max_risk: risk.max_risk
            })
          } else {
            vulnerabilityFound.ocurrance += 1;
            vulnerabilityFound.average *= (vulnerabilityFound.ocurrance - 1);
            vulnerabilityFound.average += risk.vulnerabilityRate;
            vulnerabilityFound.average = vulnerabilityFound.average / vulnerabilityFound.ocurrance;
          }
        }
      });

      if ($scope.displayVulnerabilitiesBy == "number") {
        dataAllVulnerabilities.map(d => {
          d.value = d.ocurrance;
          return d
        });
      }

      if ($scope.displayVulnerabilitiesBy == "qualification") {
        dataAllVulnerabilities.map(d => {
          d.value = d.average;
          return d
        });
        optionsHotizontalVulnerabilities.forceDomainX =
          optionsVerticalVulnerabilities.forceDomainY = {
            min: vulnerabilityScale.min,
            max: vulnerabilityScale.max
          };
      }

      if ($scope.displayVulnerabilitiesBy == "max_associated_risk") {
        dataAllVulnerabilities.map(d => {
          d.value = d.max_risk;
          return d
        });
      }

      if (dataAllVulnerabilities.length >= $scope.vulnerabilitiesDisplayed && $scope.vulnerabilitiesDisplayed !== "all") {
        dataAllVulnerabilities.sort(function(a, b) {
          return b['value'] - a['value']
        })
        dataSplicedVulnerabilities = dataAllVulnerabilities.slice(0, $scope.vulnerabilitiesDisplayed);
        if (optionsHotizontalVulnerabilities.initHeight) {
          optionsHotizontalVulnerabilities.height = optionsHotizontalVulnerabilities.initHeight;
          delete optionsHotizontalVulnerabilities.initHeight;
        }
        if (optionsVerticalVulnerabilities.initWidth) {
          optionsVerticalVulnerabilities.width = optionsVerticalVulnerabilities.initWidth;
          delete optionsVerticalVulnerabilities.initWidth;
        }
      } else {
        dataSplicedVulnerabilities = angular.copy(dataAllVulnerabilities);
      }

      if ($scope.vulnerabilitiesOptions == 'horizontal') {
        if (dataSplicedVulnerabilities.length > 30 && optionsHotizontalVulnerabilities.initHeight == undefined) {
          optionsHotizontalVulnerabilities.initHeight = optionsHotizontalVulnerabilities.height;
          optionsHotizontalVulnerabilities.height += (dataSplicedVulnerabilities.length - 30) * 30;
        }
        ChartService.horizontalBarChart(
          '#graphVulnerabilities',
          dataSplicedVulnerabilities,
          optionsHotizontalVulnerabilities
        );
      } else {
        if (dataSplicedVulnerabilities.length > 30 && optionsVerticalVulnerabilities.initWidth == undefined) {
          optionsVerticalVulnerabilities.initWidth = optionsVerticalVulnerabilities.width;
          optionsVerticalVulnerabilities.width += (dataSplicedVulnerabilities.length - 30) * 10;
        }
        ChartService.verticalBarChart(
          '#graphVulnerabilities',
          dataSplicedVulnerabilities,
          optionsVerticalVulnerabilities
        );
      }
      delete optionsHotizontalVulnerabilities.forceDomainX;
      delete optionsVerticalVulnerabilities.forceDomainY;
    };

    function updateCartography() {
      dataCurrentCartography = [];
      dataTargetCartography = [];
      dataCurrentCartographyRiskOp = [];
      dataTargetCartographyRiskOp = [];

      let impacts = cartoCurrent.Impact;
      let likelihoods = cartoCurrent.MxV;
      let probabilities = cartoCurrent.Probability;
      let countersCurrent = cartoCurrent.riskInfo.counters;
      let countersTarget = cartoTarget.riskInfo.counters;
      let countersRiskOpCurrent = cartoCurrent.riskOp.counters;
      let countersRiskOpTarget = cartoTarget.riskOp.counters;

      optionsCartography.threshold = [anr.seuil1, anr.seuil2];

      impacts.forEach(function(impact) {
        likelihoods.forEach(function(likelihood) {
          dataCurrentCartography.push({
            y: impact,
            x: likelihood,
            value: (countersCurrent[impact] !== undefined && countersCurrent[impact][likelihood] !== undefined) ?
              countersCurrent[impact][likelihood] : null
          })

          dataTargetCartography.push({
            y: impact,
            x: likelihood,
            value: (countersTarget[impact] !== undefined && countersTarget[impact][likelihood] !== undefined) ?
              countersTarget[impact][likelihood] : null
          })
        });
        probabilities.forEach(function(likelihood) {
          dataCurrentCartographyRiskOp.push({
            y: impact,
            x: likelihood,
            value: (countersRiskOpCurrent[impact] !== undefined && countersRiskOpCurrent[impact][likelihood] !== undefined) ?
              countersRiskOpCurrent[impact][likelihood] : null
          })

          dataTargetCartographyRiskOp.push({
            y: impact,
            x: likelihood,
            value: (countersRiskOpTarget[impact] !== undefined && countersRiskOpTarget[impact][likelihood] !== undefined) ?
              countersRiskOpTarget[impact][likelihood] : null
          })
        });
      })
    };

    function updateCompliance(referentials, categories, data) {
      let categoriesIds = data.map(soa => soa.measure.category.id);

      referentials.forEach(function(ref) {
        dataCompliance[ref.uuid] = [{
            category: gettextCatalog.getString("Current level"),
            series: []
          },
          {
            category: gettextCatalog.getString("Applicable target level"),
            series: []
          }
        ];
        categories
          .filter(category => category.referential.uuid == ref.uuid && categoriesIds.includes(category.id))
          .forEach(function(cat) {
            let catCurrentData = {
              label: $scope._langField(cat, 'label'),
              value: null,
              data: []
            }
            let catTargetData = {
              label: $scope._langField(cat, 'label'),
              value: null,
              data: []
            }
            let currentSoas = data.filter(soa => soa.measure.category.id == cat.id);
            let targetSoas = data.filter(soa => soa.measure.category.id == cat.id && soa.EX != 1);
            let controlCurrentData = [];
            let controlTargetData = [];

            currentSoas.forEach(function(soa) {
              if (soa.EX == 1) {
                soa.compliance = 0;
              }
              controlCurrentData.push({
                label: soa.measure.code,
                value: (soa.compliance * 0.2).toFixed(2)
              })
              controlTargetData.push({
                label: soa.measure.code,
                value: ((soa.EX == 1) ? 0 : 1)
              })
            });

            catCurrentData.data.push({
              category: gettextCatalog.getString("Current level"),
              series: controlCurrentData
            });

            catTargetData.data.push({
              category: gettextCatalog.getString("Applicable target level"),
              series: controlTargetData
            });

            let complianceCurrentValues = currentSoas.map(soa => soa.compliance);
            let sum = complianceCurrentValues.reduce(function(a, b) {
              return a + b;
            }, 0);
            let currentAvg = (sum / complianceCurrentValues.length) * 0.2;
            let targetAvg = (targetSoas.length / complianceCurrentValues.length);
            catCurrentData.value = currentAvg.toFixed(2);
            catTargetData.value = targetAvg.toFixed(2);

            dataCompliance[ref.uuid][0].series.push(catCurrentData);
            dataCompliance[ref.uuid][1].series.push(catTargetData);
          })
      });
    }

// BREADCRUMB MANAGE FUNCTIONS =================================================

    //function triggered by 'return' button : loads graph data in memory tab then deletes it
    $scope.goBackCurrentRisksParentAsset = function() {
      $scope.dashboard.currentRisksBreadcrumb.pop();
      $scope.dashboard.currentRisksMemoryTab.pop();
      dataCurrentRisksByParent = $scope.dashboard.currentRisksMemoryTab[$scope.dashboard.currentRisksMemoryTab.length - 1];
      ChartService.multiVerticalBarChart(
        '#graphCurrentRisks',
        dataCurrentRisksByParent,
        optionsCurrentRisksByParent
      );
    }

    //function triggered with the interactive breadcrumb : id is held by the button
    $scope.breadcrumbGoBackCurrentRisksParentAsset = function(id) {
      if ($scope.dashboard.currentRisksBreadcrumb.length > 4) {
        dataCurrentRisksByParent = $scope.dashboard.currentRisksMemoryTab[id + $scope.dashboard.currentRisksBreadcrumb.length - 4];
        $scope.dashboard.currentRisksMemoryTab = $scope.dashboard.currentRisksMemoryTab.slice(0, id + $scope.dashboard.currentRisksBreadcrumb.length - 3); //only keep elements before the one we display
        $scope.dashboard.currentRisksBreadcrumb = $scope.dashboard.currentRisksBreadcrumb.slice(0, id + $scope.dashboard.currentRisksBreadcrumb.length - 3);
        ChartService.multiVerticalBarChart(
          '#graphCurrentRisks',
          dataCurrentRisksByParent,
          optionsCurrentRisksByParent
        );
      } else {
        dataCurrentRisksByParent = $scope.dashboard.currentRisksMemoryTab[id];
        $scope.dashboard.currentRisksMemoryTab = $scope.dashboard.currentRisksMemoryTab.slice(0, id + 1); //only keep elements before the one we display
        $scope.dashboard.currentRisksBreadcrumb = $scope.dashboard.currentRisksBreadcrumb.slice(0, id + 1);
        ChartService.multiVerticalBarChart(
          '#graphCurrentRisks',
          dataCurrentRisksByParent,
          optionsCurrentRisksByParent
        );
      }
    }

    //function triggered by 'return' button : loads graph data in memory tab then deletes it
    $scope.goBackTargetRisksParentAsset = function() {
      $scope.dashboard.targetRisksBreadcrumb.pop();
      $scope.dashboard.targetRisksMemoryTab.pop();
      dataTargetRisksByParent = $scope.dashboard.targetRisksMemoryTab[$scope.dashboard.targetRisksMemoryTab.length - 1];
      ChartService.multiVerticalBarChart(
        '#graphTargetRisks',
        dataTargetRisksByParent,
        optionsTargetRisksByParent
      );
    }

    //function triggered with the interactive breadcrumb : id is held by the button
    $scope.breadcrumbGoBackTargetRisksParentAsset = function(id) {
      if ($scope.dashboard.targetRisksBreadcrumb.length > 4) {
        dataTargetRisksByParent = $scope.dashboard.targetRisksMemoryTab[id + $scope.dashboard.targetRisksBreadcrumb.length - 4];
        $scope.dashboard.targetRisksMemoryTab = $scope.dashboard.targetRisksMemoryTab.slice(0, id + $scope.dashboard.targetRisksBreadcrumb.length - 3); //only keep elements before the one we display
        $scope.dashboard.targetRisksBreadcrumb = $scope.dashboard.targetRisksBreadcrumb.slice(0, id + $scope.dashboard.targetRisksBreadcrumb.length - 3);
        ChartService.multiVerticalBarChart(
          '#graphTargetRisks',
          dataTargetRisksByParent,
          optionsTargetRisksByParent
        );
      } else {
        dataTargetRisksByParent = $scope.dashboard.targetRisksMemoryTab[id];
        $scope.dashboard.targetRisksMemoryTab = $scope.dashboard.targetRisksMemoryTab.slice(0, id + 1); //only keep elements before the one we display
        $scope.dashboard.targetRisksBreadcrumb = $scope.dashboard.targetRisksBreadcrumb.slice(0, id + 1);
        ChartService.multiVerticalBarChart(
          '#graphTargetRisks',
          dataTargetRisksByParent,
          optionsTargetRisksByParent
        );
      }
    }

// EXPORT FUNCTIONS  ===========================================================

    $scope.generateXlsxData = function() {
      //prepare by risk level
      let byLevel = dataCurrentRisksByLevel;

      byLevel.forEach(function(obj, i) {
        obj[gettextCatalog.getString('Level')] = obj.category;
        obj[gettextCatalog.getString('Current risks')] = obj.value;
        obj[gettextCatalog.getString('Residual risks')] = dataTargetRisksByLevel[i].value;
        delete obj.category;
        delete obj.value;
      });

      //prepare risk by assets
      let byAsset = angular.copy(dataCurrentRisksByAsset).map(({
        category,
        series
      }) => ({
        category,
        series
      }));
      makeDataExportableForByAsset(byAsset);
      let byAssetResidual = angular.copy(dataTargetRisksByAsset).map(({
        category,
        series
      }) => ({
        category,
        series
      }));
      makeDataExportableForByAsset(byAssetResidual);

      //prepare threats info
      let byThreats = dataThreats.map(({
        category,
        ocurrance,
        average,
        max_risk
      }) => ({
        category,
        ocurrance,
        average,
        max_risk
      }));
      byThreats.forEach(function(obj) {
        obj[gettextCatalog.getString('Threat')] = obj.category;
        obj[gettextCatalog.getString('Number')] = obj.ocurrance;
        obj[gettextCatalog.getString('Probability')] = obj.average;
        obj[gettextCatalog.getString('MAX risk')] = obj.max_risk;
        delete obj.category;
        delete obj.ocurrance;
        delete obj.average;
        delete obj.max_risk;
      });

      //prepare vulns info
      let byVulnerabilities = dataAllVulnerabilities.map(({
        category,
        ocurrance,
        average,
        max_risk
      }) => ({
        category,
        ocurrance,
        average,
        max_risk
      }));
      byVulnerabilities.forEach(function(obj) {
        obj[gettextCatalog.getString('Vulnerability')] = obj.category;
        obj[gettextCatalog.getString('Number')] = obj.ocurrance;
        obj[gettextCatalog.getString('Qualification')] = obj.average;
        obj[gettextCatalog.getString('MAX risk')] = obj.max_risk;
        delete obj.category;
        delete obj.ocurrance;
        delete obj.average;
        delete obj.max_risk;
      });

      //manage by parent asset
      let byCurrentAssetParent = angular.copy(dataCurrentRisksByParent).map(({
        category,
        series
      }) => ({
        category,
        series
      }));
      makeDataExportableForByAsset(byCurrentAssetParent);

      let byTargetedAssetParent = angular.copy(dataTargetRisksByParent).map(({
        category,
        series
      }) => ({
        category,
        series
      }));
      makeDataExportableForByAsset(byTargetedAssetParent);

      //Cartography
      let byCartographyRiskInfo = dataCurrentCartography.map(({
        x,
        y,
        value
      }) => ({
        x,
        y,
        value
      }));

      for (i in byCartographyRiskInfo) {
        byCartographyRiskInfo[i][gettextCatalog.getString('Impact')] = byCartographyRiskInfo[i]['y'];
        byCartographyRiskInfo[i][gettextCatalog.getString('Likelihood')] = byCartographyRiskInfo[i]['x'];
        byCartographyRiskInfo[i][gettextCatalog.getString('Current risk')] = byCartographyRiskInfo[i]['value'] == null ? 0 : byCartographyRiskInfo[i]['value'];
        byCartographyRiskInfo[i][gettextCatalog.getString('Residual risk')] = dataTargetCartography[i]['value'] == null ? 0 : dataTargetCartography[i]['value'];
        delete byCartographyRiskInfo[i].x;
        delete byCartographyRiskInfo[i].y;
        delete byCartographyRiskInfo[i].value;
      }

      let byCartographyRiskOp = dataCurrentCartographyRiskOp.map(({
        x,
        y,
        value
      }) => ({
        x,
        y,
        value
      }));

      for (i in byCartographyRiskOp) {
        byCartographyRiskOp[i][gettextCatalog.getString('Impact')] = byCartographyRiskOp[i]['y'];
        byCartographyRiskOp[i][gettextCatalog.getString('Likelihood')] = byCartographyRiskOp[i]['x'];
        byCartographyRiskOp[i][gettextCatalog.getString('Current risk')] = byCartographyRiskOp[i]['value'] == null ? 0 : byCartographyRiskOp[i]['value'];
        byCartographyRiskOp[i][gettextCatalog.getString('Residual risk')] = dataTargetCartographyRiskOp[i]['value'] == null ? 0 : dataTargetCartographyRiskOp[i]['value'];
        delete byCartographyRiskOp[i].x;
        delete byCartographyRiskOp[i].y;
        delete byCartographyRiskOp[i].value;
      }

      //Compliance
      let byCompliance = [];
      let byComplianceTab = [];
      $scope.dashboard.referentials.forEach(function(ref) {
        byCompliance[ref.uuid] = dataCompliance[ref.uuid][0].series.map(({
          label,
          value
        }) => ({
          label,
          value
        }));
        for (i in byCompliance[ref.uuid]) {
          byCompliance[ref.uuid][i][gettextCatalog.getString('Category')] = byCompliance[ref.uuid][i]["label"];
          byCompliance[ref.uuid][i][gettextCatalog.getString('Current level')] = byCompliance[ref.uuid][i]["value"];
          byCompliance[ref.uuid][i][gettextCatalog.getString('Applicable target level')] = dataCompliance[ref.uuid][1].series[i]["value"];
          delete byCompliance[ref.uuid][i].label;
          delete byCompliance[ref.uuid][i].value;
        }
        byComplianceTab[ref.uuid] = XLSX.utils.json_to_sheet(byCompliance[ref.uuid]);
      })

      //prepare the tabs for workbook
      let bylevelTab = XLSX.utils.json_to_sheet(byLevel);
      let byAssetTab = XLSX.utils.json_to_sheet(byAsset);
      let byAssetResidualTab = XLSX.utils.json_to_sheet(byAssetResidual);
      let byThreatsTab = XLSX.utils.json_to_sheet(byThreats);
      let byVulnerabilitiesTab = XLSX.utils.json_to_sheet(byVulnerabilities);
      let byCartographyRiskInfoTab = XLSX.utils.json_to_sheet(byCartographyRiskInfo);
      let byCartographyRiskOpTab = XLSX.utils.json_to_sheet(byCartographyRiskOp);
      let byCurrentAssetParentTab = XLSX.utils.json_to_sheet(byCurrentAssetParent);
      let byTargetedAssetParentTab = XLSX.utils.json_to_sheet(byTargetedAssetParent);

      /*add to workbook */
      let wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, bylevelTab, gettextCatalog.getString('Level').substring(0, 31));
      XLSX.utils.book_append_sheet(wb, byAssetTab, gettextCatalog.getString('All assets').substring(0, 31));
      XLSX.utils.book_append_sheet(wb, byAssetResidualTab, (gettextCatalog.getString('Residual risks') + '_' + gettextCatalog.getString('All assets')).substring(0, 31));
      XLSX.utils.book_append_sheet(wb, byCurrentAssetParentTab, gettextCatalog.getString('Parent asset').substring(0, 31));
      XLSX.utils.book_append_sheet(wb, byTargetedAssetParentTab, (gettextCatalog.getString('Residual risks') + '_' + gettextCatalog.getString('Parent asset')).substring(0, 31));
      XLSX.utils.book_append_sheet(wb, byThreatsTab, gettextCatalog.getString('Threats').substring(0, 31));
      XLSX.utils.book_append_sheet(wb, byVulnerabilitiesTab, gettextCatalog.getString('Vulnerabilities').substring(0, 31));
      XLSX.utils.book_append_sheet(wb, byCartographyRiskInfoTab, gettextCatalog.getString('Cartography Information Risk').substring(0, 31));
      XLSX.utils.book_append_sheet(wb, byCartographyRiskOpTab, gettextCatalog.getString('Cartography Operational Risk').substring(0, 31));

      $scope.dashboard.referentials.forEach(function(ref) {
        XLSX.utils.book_append_sheet(wb, byComplianceTab[ref.uuid], (gettextCatalog.getString('Compliance') + "_" + ref['label' + anr.language]).substring(0, 31).replace(/[:?*/[\]\\]+/g, ''));
      })

      /* write workbook and force a download */
      XLSX.writeFile(wb, "dashboard.xlsx");

      /*
       * Prepare the array and the objects of risks by assets to be properly export in XLSX
       * @param mappedData, the source of the Data e.g. angular.copy(dataCurrentRisksByAsset).map(({key,values}) => ({key,values}));
       * @param id : the id referenced in the mappedData e.g. asset_id, id etc.
       */
      function makeDataExportableForByAsset(mappedData) {
        mappedData.forEach(function(obj) {
          obj[gettextCatalog.getString('Asset')] = obj.category;
          obj[obj.series[0].label] = obj.series[0].value;
          obj[obj.series[1].label] = obj.series[1].value;
          obj[obj.series[2].label] = obj.series[2].value;
          delete obj.category; // in case of child of risk by parent asset
          delete obj.series; // in case of child of risk by parent asset
        });
      }
    }

    $scope.generatePptxSildes = async function() {
      $scope.loadingPptx = true;

      let charts = [{
          slide: 1,
          title: gettextCatalog.getString('Risks'),
          subtitle: gettextCatalog.getString('Current risks'),
          chart: function() {
            ChartService.verticalBarChart(
              '#loadPptx',
              dataCurrentRisksByLevel,
              optionsCurrentRisksByLevel,
            )
          },
          x: 0.60,
          y: 2.00,
          w: 4.00,
          h: 4.00
        },
        {
          slide: 1,
          subtitle: gettextCatalog.getString('Residual risks'),
          chart: function() {
            ChartService.verticalBarChart(
              '#loadPptx',
              dataTargetRisksByLevel,
              optionsTargetRisksByLevel,
            )
          },
          x: 5.40,
          y: 2.00,
          w: 4.00,
          h: 4.00
        },
        {
          slide: 2,
          title: gettextCatalog.getString('Risks'),
          subtitle: gettextCatalog.getString('Current risks'),
          chart: function() {
            ChartService.multiVerticalBarChart(
              '#loadPptx',
              dataCurrentRisksByAsset,
              optionsRisksByAsset,
            )
          },
          x: 0.60,
          y: 1.40,
          w: 3.80,
          h: 6.00
        },
        {
          slide: 2,
          subtitle: gettextCatalog.getString('Residual risks'),
          chart: function() {
            ChartService.multiVerticalBarChart(
              '#loadPptx',
              dataTargetRisksByAsset,
              optionsRisksByAsset,
            )
          },
          x: 5.60,
          y: 1.40,
          w: 3.80,
          h: 6.00
        },
        {
          slide: 3,
          title: gettextCatalog.getString('Risks'),
          subtitle: gettextCatalog.getString('Current risks'),
          chart: function() {
            ChartService.multiVerticalBarChart(
              '#loadPptx',
              dataCurrentRisksByParent,
              optionsCurrentRisksByParent,
            )
          },
          x: 0.60,
          y: 1.60,
          w: 3.80,
          h: 5.50
        },
        {
          slide: 3,

          subtitle: gettextCatalog.getString('Residual risks'),
          chart: function() {
            ChartService.multiVerticalBarChart(
              '#loadPptx',
              dataTargetRisksByParent,
              optionsTargetRisksByParent
            )
          },
          x: 5.40,
          y: 1.60,
          w: 3.80,
          h: 5.50
        },
        {
          slide: 4,
          title: gettextCatalog.getString('Threats'),
          subtitle: gettextCatalog.getString('Number'),
          chart: function() {
            ChartService.horizontalBarChart(
              '#loadPptx',
              dataThreats.map(d => {
                d.value = d.ocurrance;
                return d
              }),
              optionsHorizontalThreats
            );
          },
          x: 0.60,
          y: 1.40,
          w: 8.80,
          h: 6.00
        },
        {
          slide: 5,
          title: gettextCatalog.getString('Threats'),
          subtitle: gettextCatalog.getString('Probability'),
          chart: function() {
            optionsHorizontalThreats.forceDomainX = {
              min: threatScale.min,
              max: threatScale.max
            };
            ChartService.horizontalBarChart(
              '#loadPptx',
              dataThreats.map(d => {
                d.value = d.average;
                return d
              }),
              optionsHorizontalThreats
            );
            delete optionsHorizontalThreats.forceDomainX;
          },
          x: 0.60,
          y: 1.40,
          w: 8.80,
          h: 6.00
        },
        {
          slide: 6,
          title: gettextCatalog.getString('Threats'),
          subtitle: gettextCatalog.getString('Max. associated risk level'),
          chart: function() {
            ChartService.horizontalBarChart(
              '#loadPptx',
              dataThreats.map(d => {
                d.value = d.max_risk;
                return d
              }),
              optionsHorizontalThreats
            );
          },
          x: 0.60,
          y: 1.40,
          w: 8.80,
          h: 6.00
        },
        {
          slide: 7,
          title: gettextCatalog.getString('Vulnerabilities'),
          subtitle: gettextCatalog.getString('Number'),
          chart: function() {
            ChartService.horizontalBarChart(
              '#loadPptx',
              dataAllVulnerabilities
              .map(d => {
                d.value = d.ocurrance;
                return d
              })
              .sort(function(a, b) {
                return b['value'] - a['value']
              })
              .slice(0, $scope.vulnerabilitiesDisplayed),
              optionsHotizontalVulnerabilities
            );
          },
          x: 0.60,
          y: 1.40,
          w: 8.80,
          h: 6.00
        },
        {
          slide: 8,
          title: gettextCatalog.getString('Vulnerabilities'),
          subtitle: gettextCatalog.getString('Qualification'),
          chart: function() {
            optionsHotizontalVulnerabilities.forceDomainX = {
              min: vulnerabilityScale.min,
              max: vulnerabilityScale.max
            };

            ChartService.horizontalBarChart(
              '#loadPptx',
              dataAllVulnerabilities
              .map(d => {
                d.value = d.average;
                return d
              })
              .sort(function(a, b) {
                return b['value'] - a['value']
              })
              .slice(0, $scope.vulnerabilitiesDisplayed),
              optionsHotizontalVulnerabilities
            );

            delete optionsHotizontalVulnerabilities.forceDomainX;
          },
          x: 0.60,
          y: 1.40,
          w: 8.80,
          h: 6.00
        },
        {
          slide: 9,
          title: gettextCatalog.getString('Vulnerabilities'),
          subtitle: gettextCatalog.getString('Max. associated risk level'),
          chart: function() {
            ChartService.horizontalBarChart(
              '#loadPptx',
              dataAllVulnerabilities
              .map(d => {
                d.value = d.max_risk;
                return d
              })
              .sort(function(a, b) {
                return b['value'] - a['value']
              })
              .slice(0, $scope.vulnerabilitiesDisplayed),
              optionsHotizontalVulnerabilities
            );
          },
          x: 0.60,
          y: 1.40,
          w: 8.80,
          h: 6.00
        },
        {
          slide: 10,
          title: gettextCatalog.getString('Cartography') + ' - ' + gettextCatalog.getString('Information risks'),
          subtitle: gettextCatalog.getString('Current risks'),
          chart: function() {
            ChartService.heatmapChart(
              '#loadPptx',
              dataCurrentCartography,
              optionsCartography
            );
          },
          x: 0.05,
          y: 2.50,
          w: 5.00,
          h: 3.00
        },
        {
          slide: 10,
          subtitle: gettextCatalog.getString('Residual risks'),
          chart: function() {
            ChartService.heatmapChart(
              '#loadPptx',
              dataTargetCartography,
              optionsCartography
            );
          },
          x: 4.95,
          y: 2.50,
          w: 5.00,
          h: 3.00
        },
        {
          slide: 11,
          title: gettextCatalog.getString('Cartography') + ' - ' + gettextCatalog.getString('Operational risks'),
          subtitle: gettextCatalog.getString('Current risks'),
          chart: function() {
            ChartService.heatmapChart(
              '#loadPptx',
              dataCurrentCartographyRiskOp,
              optionsCartography
            );
          },
          x: 0.60,
          y: 2.00,
          w: 4.00,
          h: 4.00
        },
        {
          slide: 11,
          subtitle: gettextCatalog.getString('Residual risks'),
          chart: function() {
            ChartService.heatmapChart(
              '#loadPptx',
              dataTargetCartographyRiskOp,
              optionsCartography
            );
          },
          x: 5.50,
          y: 2.00,
          w: 4.00,
          h: 4.00
        },
      ];

      if ($scope.dashboard.referentials.length > 0) {
        slideIndex = 12;
        $scope.dashboard.referentials.forEach(function(ref) {
          charts.push({
            slide: slideIndex,
            title: gettextCatalog.getString('Compliance'),
            subtitle: ref['label' + anr.language],
            chart: function() {
              ChartService.radarChart(
                '#loadPptx',
                dataCompliance[ref.uuid],
                optionsChartCompliance
              );
            },
            x: 0.60,
            y: 1.40,
            w: 8.80,
            h: 5.50
          });
          slideIndex++;
        });
      }

      let pptx = new PptxGenJS();
      let slide = [];
      let lastSlide = 0;
      let date = new Date();

      pptx.setLayout('LAYOUT_4x3');

      pptx.defineSlideMaster({
        title: 'TITLE_SLIDE',
        objects: [{
            'rect': {
              x: 0.00,
              y: 4.60,
              w: '100%',
              h: 1.75,
              fill: '006fba'
            }
          },
          {
            'line': {
              x: 0.00,
              y: 6.35,
              w: '100%',
              h: 0.00,
              line: 'FFC107',
              lineSize: 5
            }
          },
          {
            'image': {
              x: 7.0,
              y: 5.10,
              w: 1.50,
              h: 0.65,
              path: 'img/logo-monarc.png'
            }
          }
        ]
      });

      pptx.defineSlideMaster({
        title: 'MASTER_SLIDE',
        bkgd: 'FFFEFE',
        slideNumber: {
          x: 9.00,
          y: 7.0,
          color: 'FFFFFF'
        },
        objects: [{
            'rect': {
              x: 0,
              y: 6.9,
              w: '100%',
              h: 0.6,
              fill: '006fba'
            }
          },
          {
            'image': {
              x: 0.60,
              y: 7.0,
              w: 0.98,
              h: 0.4,
              path: 'img/logo-monarc.png'
            }
          },
          {
            'text': {
              text: anr['label' + anr.language],
              options: {
                x: 0,
                y: 6.9,
                w: '100%',
                h: 0.6,
                align: 'c',
                valign: 'm',
                color: 'FFFEFE',
                fontSize: 12
              }
            }
          },
          {
            'line': {
              x: 0.60,
              y: 0.80,
              w: 8.80,
              h: 0.00,
              line: 'FFC107',
              lineSize: 1
            }
          },
          {
            'placeholder': {
              options: {
                name: 'slideTitle',
                type: 'title',
                x: 0.00,
                y: 0.30,
                w: '100%',
                color: '006fba',
                bold: true,
                fontSize: 28,
                align: 'center'
              }
            }
          }
        ]
      });

      slide[lastSlide] = pptx.addNewSlide('TITLE_SLIDE');
      slide[lastSlide].addText(gettextCatalog.getString('Dashboard'), {
        x: 0.00,
        y: 2.50,
        w: '100%',
        color: '006fba',
        bold: true,
        fontSize: 44,
        align: 'center'
      });
      slide[lastSlide].addText(anr['label' + anr.language] + '\n' +
        anr['description' + anr.language] + '\n' +
        date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear(), {
          x: 1.50,
          y: 5.25,
          w: 5.5,
          h: 0.75,
          color: 'FFFEFE',
          fontSize: 20,
          valign: 'm'
        });

      for (chart of charts) {
        await addChart(chart)
      };

      $scope.loadingPptx = false;
      pptx.save('dashboard');

      function addChart(chart) {
        let promise = $q.defer();
        if (chart.slide !== lastSlide) {
          slide[chart.slide] = pptx.addNewSlide('MASTER_SLIDE');
          slide[chart.slide].addText(chart.title, {
            placeholder: 'slideTitle'
          });
        }
        chart.chart();
        $timeout(function() {
          let node = d3.select('#loadPptx').select("svg")
          svgAsPngUri(node.node(), {
            fonts: []
          }, function(uri) {
            slide[chart.slide].addImage({
              data: uri,
              x: chart.x,
              y: chart.y,
              w: chart.w,
              h: chart.h
            });
            slide[chart.slide].addText(chart.subtitle, {
              x: chart.x,
              y: chart.y - 0.50,
              w: chart.w,
              align: 'center'
            });
          });
          lastSlide = chart.slide;
          promise.resolve();
        }, 600)
        return promise.promise;
      }
    }

    $scope.exportAsPNG = function(idOfGraph, name, parametersAction = {backgroundColor: 'white'}) {
      let node = d3.select('#' + idOfGraph).select("svg");
      saveSvgAsPng(node.node(), name + '.png', parametersAction);
    }
  }
})();

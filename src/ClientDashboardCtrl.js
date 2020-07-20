(function() {
  angular
    .module('ClientApp')
    .controller('ClientDashboardCtrl', [
      '$scope', '$mdMedia', '$mdDialog', '$http', 'gettextCatalog', '$q', '$timeout',
      '$stateParams', 'AnrService', 'ClientAnrService', 'ReferentialService', 'SOACategoryService',
      'ClientSoaService', 'ChartService', ClientDashboardCtrl
    ]);

  function ClientDashboardCtrl($scope, $mdMedia, $mdDialog, $http, gettextCatalog, $q, $timeout,
    $stateParams, AnrService, ClientAnrService, ReferentialService, SOACategoryService,
    ClientSoaService, ChartService) {

    $scope.dashboard = {
      currentTabIndex: 0,
      export: false
    };

    var anr = null;
    var cartoCurrent = null;
    var cartoTarget = null;
    var threatScale = null;
    var vulnerabilityScale = null;
    var firstRefresh = true;

// OPTIONS CHARTS ==============================================================

    //Options of the chart that displays current risks by level
    const optionsRisksByLevel = {
      height: 500,
      width: 500,
      margin: {
        top: 20,
        right: 20,
        bottom: 50,
        left: 30
      },
      color: ["#D6F107", "#FFBC1C", "#FD661F"],
      showLegend: false,
      forceDomainY: {
        min: 0,
        max: 0
      },
      onClickFunction: function(d) {
        let amvs = null;
        let order = null;
        let rolfRisks = null;
        let field = null;
        let kindOfRisks = null;

        if (d.amvsCurrent || d.amvsTarget) {
          kindOfRisks = 'info_risks'
          if (d.amvsCurrent) {
            amvs = "'"+ d.amvsCurrent.join() + "'";
            field = 'max_risk';
            order = 'maxRisk'
          }else {
            amvs = "'"+ d.amvsTarget.join() + "'";
            field = 'target_risk';
            order = 'targetRisk'
          }

          AnrService.getAnrRisks(anr.id,
            {
              order: order,
              order_direction: 'desc',
              limit: -1,
              amvs:amvs
            }
          ).then(function(data){
            let risks = data.risks.filter(function(risk){
              return risk[field] > -1 &&
                risk[field] >= d.threshold[0] &&
                risk[field] <= d.threshold[1];
            });
            risksTable(risks,kindOfRisks)
          });
        }else if(d.rolfRisksCurrent || d.rolfRisksTarget){
          kindOfRisks = 'op_risks'
          if (d.rolfRisksCurrent) {
            rolfRisks = "'"+ d.rolfRisksCurrent.join() + "'";
            field = 'cacheNetRisk';
          }else {
            rolfRisks = "'"+ d.rolfRisksTarget.join() + "'";
            field = 'cacheTargetedRisk';
          }

          AnrService.getAnrRisksOp(anr.id,
            {
              order: field,
              order_direction: 'desc',
              limit: -1,
              rolfRisks:rolfRisks
            }
          ).then(function(data){
            let risks = data.oprisks.filter(function(risk){
                if (risk['cacheTargetedRisk'] == -1) {
                  risk['cacheTargetedRisk'] = risk['cacheNetRisk'];
                }
                return risk[field] > -1 &&
                  risk[field] >= d.threshold[0] &&
                  risk[field] <= d.threshold[1];
            });
            risksTable(risks,kindOfRisks)
          });
        }
      }
    };

    //Options for the chart that displays the current risks by asset
    const optionsRisksByAsset = {
      height: 650,
      width: 650,
      margin: {
        top: 20,
        right: 150,
        bottom: 250,
        left: 30
      },
      showValues: true,
      forceChartMode: 'stacked',
      rotationXAxisLabel: 45,
      offsetXAxisLabel: 0.9,
      onClickFunction: function(d) {
        AnrService.getInstanceRisks(anr.id, d.id, {
          limit: -1
        }).then(function(data) {
          let risks = data.risks.filter(function(risk){
            return risk.max_risk > -1;
          });
          risksTable(risks,'info_risks')
        });
      }
    };

    //Options for the charts that display the risks by parent asset
    const optionsCurrentRisksByParent = {
      height: 650,
      width: 650,
      margin: {
        top: 20,
        right: 150,
        bottom: 250,
        left: 30
      },
      showValues: true,
      forceChartMode: 'stacked',
      rotationXAxisLabel: 45,
      offsetXAxisLabel: 0.9,
      onClickFunction: function(d) {
        if (d.child.length > 0) {
          updateCurrentRisksByParentAsset(d.child).then(function(data) {
            $scope.currentRisksBreadcrumb.push(d.category);
            $scope.currentRisksMemoryTab.push(data);
            ChartService.multiVerticalBarChart(
              '#graphCurrentRisks',
              data,
              optionsCurrentRisksByParent
            );
          });
        } else {
          AnrService.getInstanceRisks(anr.id, d.id, {
            limit: -1
          }).then(function(data) {
            let risks = data.risks.filter(function(risk){
              return risk.max_risk > -1;
            });
            risksTable(risks,'info_risks')
          });
        }
      }
    };

    const optionsTargetRisksByParent = $.extend(
      angular.copy(optionsCurrentRisksByParent), {
        onClickFunction: function(d) { //on click go one child deeper (node) or go to MONARC (leaf)
          if (d.child.length > 0) {
            updateTargetRisksByParentAsset(d.child).then(function(data) {
              $scope.targetRisksBreadcrumb.push(d.category);
              $scope.targetRisksMemoryTab.push(data);
              ChartService.multiVerticalBarChart(
                '#graphTargetRisks',
                data,
                optionsTargetRisksByParent
              );
            });
          } else {
            AnrService.getInstanceRisks(anr.id, d.id, {
              limit: -1
            }).then(function(data) {
              let risks = data.risks.filter(function(risk){
                return risk.max_risk > -1;
              });
              risksTable(risks,'info_risks')
            });
          }
        }
      }
    );

    //Options of the chart that displays current operational risks by level
    const optionsOpRisksByLevel = $.extend(
      angular.copy(optionsRisksByLevel)
    );

    //Options for the chart that displays the current operational risks by asset
    const optionsOpRisksByAsset = $.extend(
      angular.copy(optionsRisksByAsset),{
        onClickFunction: function(d) {
          AnrService.getInstanceRisksOp(anr.id, d.id, {
            limit: -1
          }).then(function(data) {
            let risks = data.oprisks.filter(function(risk){
              return risk.cacheNetRisk > -1;
            });
            risksTable(risks,'op_risks')
          });
        }
      }
    );

    //Options for the charts that display the operational risks by parent asset
    const optionsCurrentOpRisksByParent = $.extend(
      angular.copy(optionsCurrentRisksByParent), {
        onClickFunction: function(d) {
          if (d.child.length > 0) {
            updateCurrentOpRisksByParentAsset(d.child).then(function(data) {
              $scope.currentOpRisksBreadcrumb.push(d.category);
              $scope.currentOpRisksMemoryTab.push(data);
              ChartService.multiVerticalBarChart(
                '#graphCurrentOpRisks',
                data,
                optionsCurrentOpRisksByParent
              );
            });
          } else {
            AnrService.getInstanceRisksOp(anr.id, d.id, {
              limit: -1
            }).then(function(data) {
              let risks = data.oprisks.filter(function(risk){
                return risk.cacheNetRisk > -1;
              });
              risksTable(risks,'op_risks')
            });
          }
        }
      }
    );

    const optionsTargetOpRisksByParent = $.extend(
      angular.copy(optionsCurrentRisksByParent), {
        onClickFunction: function(d) {
          if (d.child.length > 0) {
            updateTargetOpRisksByParentAsset(d.child).then(function(data) {
              $scope.targetOpRisksBreadcrumb.push(d.category);
              $scope.targetOpRisksMemoryTab.push(data);
              ChartService.multiVerticalBarChart(
                '#graphTargetOpRisks',
                data,
                optionsTargetOpRisksByParent
              );
            });
          } else {
            AnrService.getInstanceRisksOp(anr.id, d.id, {
              limit: -1
            }).then(function(data) {
              let risks = data.oprisks.filter(function(risk){
                return risk.cacheNetRisk > -1;
              });
              risksTable(risks,'op_risks')
            });
          }
        }
      }
    );

    //Options for the chart that displays threats
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

    //Options for the chart that displays vulnerabilities
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
      threshold: [],
      onClickFunction: function(d) {
        let amvs = null;
        let rolfRisks = null;
        let field = null;
        let kindOfRisks = null;

        if (d.amvsCurrent || d.amvsTarget) {
          kindOfRisks = 'info_risks'
          if (d.amvsCurrent) {
            amvs = "'"+ d.amvsCurrent.join() + "'";
            field = 'max_risk';
          }else {
            amvs = "'"+ d.amvsTarget.join() + "'";
            field = 'target_risk';
          }

          AnrService.getAnrRisks(anr.id,
            {
              order:'instance',
              order_direction: 'asc',
              limit: -1,
              amvs:amvs
            }
          ).then(function(data){
            let risks = data.risks.filter(function(risk){
              let impactMax = Math.max(
                risk.c_impact * risk.c_risk_enabled,
                risk.i_impact * risk.i_risk_enabled,
                risk.d_impact * risk.d_risk_enabled
              );
              return  impactMax == d.y &&
                risk[field] == d.x * d.y;
            });
            risksTable(risks,kindOfRisks)
          });
        }else if(d.rolfRisksCurrent || d.rolfRisksTarget){
          kindOfRisks = 'op_risks'
          if (d.rolfRisksCurrent) {
            rolfRisks = "'"+ d.rolfRisksCurrent.join() + "'";
            field = 'cacheNetRisk';
          }else {
            rolfRisks = "'"+ d.rolfRisksTarget.join() + "'";
            field = 'cacheTargetedRisk';
          }

          AnrService.getAnrRisksOp(anr.id,
            {
              order:'instance',
              order_direction: 'asc',
              limit: -1,
              rolfRisks:rolfRisks
            }
          ).then(function(data){
            let risks = data.oprisks.filter(function(risk){
                if (risk['cacheTargetedRisk'] == -1) {
                  risk['cacheTargetedRisk'] = risk['cacheNetRisk'];
                }
                return risk[field] == d.x * d.y
            });
            risksTable(risks,kindOfRisks)
          });
        }
      }
    };

    //Options for the chart that displays the compliance
    const optionsChartCompliance = {
      width: 650
    };

// DATA MODELS =================================================================

    //Data Model for the graph for the current/target information risk by level of risk
    var dataCurrentRisksByLevel = [];
    var dataTargetRisksByLevel = [];

    //Data model for the graph of current/target risk by asset
    var dataCurrentRisksByAsset = [];
    var dataTargetRisksByAsset = [];

    //Data model for the graph of current/target risk by parent asset
    var dataCurrentRisksByParent = [];
    var dataTargetRisksByParent = [];

    //Data Model for the graph for the current/target operational risk by level of risk
    var dataCurrentOpRisksByLevel = [];
    var dataTargetOpRisksByLevel = [];

    //Data model for the graph of current/target operational risk by asset
    var dataCurrentOpRisksByAsset = [];
    var dataTargetOpRisksByAsset = [];

    //Data model for the graph of current/target operational risk by parent asset
    var dataCurrentOpRisksByParent = [];
    var dataTargetOpRisksByParent = [];

    //Data for the graph for the number of threats by threat type
    var dataThreats = [];

    //Data for the graph for all/spliced vulnerabilities
    var dataAllVulnerabilities = [];
    var dataSplicedVulnerabilities = [];

    //Data for the graph for Information/operational risks cartography
    var dataCurrentCartography = [];
    var dataTargetCartography = [];
    var dataCurrentCartographyRiskOp = [];
    var dataTargetCartographyRiskOp = [];

    //Data for the graph for the compliance
    var dataCompliance = [];

// GET ALL DATA CHARTS FUNCTION=================================================

    $scope.updateGraphs = function() {

      $scope.currentRisksBreadcrumb = [gettextCatalog.getString("Overview")];
      $scope.targetRisksBreadcrumb = [gettextCatalog.getString("Overview")];
      $scope.currentRisksMemoryTab = [];
      $scope.targetRisksMemoryTab = [];
      $scope.currentOpRisksBreadcrumb = [gettextCatalog.getString("Overview")];
      $scope.targetOpRisksBreadcrumb = [gettextCatalog.getString("Overview")];
      $scope.currentOpRisksMemoryTab = [];
      $scope.targetOpRisksMemoryTab = [];
      if (!$scope.displayCurrentRisksBy || !$scope.displayTargetRisksBy ) {
        $scope.displayCurrentRisksBy, $scope.displayTargetRisksBy = "level";
      }
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
      if (!$scope.cartographyRisksType) {
        $scope.cartographyRisksType= 'info_risks';
      }
      $scope.dashboardUpdated = false;
      $scope.loadingPptx = false;

      ClientAnrService.getAnr($stateParams.modelId).then(function(data) {
        anr = data;
        $http.get("api/client-anr/" + anr.id + "/carto-risks-dashboard").then(function(data) {
          cartoCurrent = data.data.carto.real;
          cartoTarget = data.data.carto.targeted;
          if (Object.values(cartoCurrent.riskInfo.distrib).length > 0 ||
              Object.values(cartoCurrent.riskOp.distrib).length > 0
            ) {
            $scope.dashboard.export = true;
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
            drawCartography();
          } catch {
            console.log('Error when retrieving data for the cartography.');
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
                drawCurrentRisk();
                drawTargetRisk();
                updateCurrentRisksByParentAsset(instances).then(function(data) {
                  $scope.currentRisksMemoryTab.push(data);
                  drawCurrentRiskByParent();
                });
                updateTargetRisksByParentAsset(instances).then(function(data) {
                  $scope.targetRisksMemoryTab.push(data);
                  drawTargetRiskByParent();
                });
                updateThreats(risks);
                drawThreats();
                updateVulnerabilities(risks);
                drawVulnerabilities();
                firstRefresh = false;
              });

              AnrService.getAnrRisksOp(anr.id, {
                limit: -1,
                order: 'instance',
                order_direction: 'asc'
              }).then(function(data) {
                let opRisks = data.oprisks;
                updateCurrentOpRisksByAsset(opRisks);
                updateTargetOpRisksByAsset(opRisks);
                drawCurrentOpRisk();
                drawTargetOpRisk();
                updateCurrentOpRisksByParentAsset(instances).then(function(data) {
                  $scope.currentOpRisksMemoryTab.push(data);
                  drawCurrentOpRiskByParent();
                });
                updateTargetOpRisksByParentAsset(instances).then(function(data) {
                  $scope.targetOpRisksMemoryTab.push(data);
                  drawTargetOpRiskByParent();
                });

              });
            });

          });
        });
      });
      ReferentialService.getReferentials({order: 'createdAt'}).then(function(data) {
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
            if ($scope.dashboard.referentials[0] && !$scope.referentialSelected) {
              $scope.referentialSelected = $scope.dashboard.referentials[0].uuid;
            }
            drawCompliance();
            $scope.dashboardUpdated = true;
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

    $scope.$watchGroup(['displayCurrentRisksBy', 'currentRisksOptions'], function() {
      if (dataCurrentRisksByLevel.length > 0) {
        drawCurrentRisk();
      }
      drawCurrentRiskByParent();
    });

    $scope.$watchGroup(['displayTargetRisksBy', 'targetRisksOptions'], function() {
      if (dataTargetRisksByLevel.length > 0) {
        drawTargetRisk();
      }
      drawTargetRiskByParent();
    });

    $scope.$watchGroup(['displayCurrentOpRisksBy', 'currentOpRisksOptions'], function() {
      if (dataCurrentOpRisksByLevel.length > 0) {
        drawCurrentOpRisk();
      }
      drawCurrentOpRiskByParent();
    });

    $scope.$watchGroup(['displayTargetOpRisksBy', 'targetOpRisksOptions'], function() {
      if (dataTargetOpRisksByLevel.length > 0) {
        drawTargetOpRisk();
      }
      drawTargetOpRiskByParent();
    });

    $scope.$watchGroup(['displayThreatsBy', 'threatsOptions'], function() {
      drawThreats();
    });

    $scope.$watchGroup(['displayVulnerabilitiesBy', 'vulnerabilitiesDisplayed', 'vulnerabilitiesOptions'], function() {
      drawVulnerabilities();
    });

    $scope.$watch('cartographyRisksType', function() {
      drawCartography();
    });

    $scope.$watch('referentialSelected', function() {
        drawCompliance();
    });

// UPDATE CHART FUNCTIONS ======================================================

    function updateCartoRisks() {
      if (Object.keys(cartoCurrent.riskInfo.distrib).length > 0) {
        dataCurrentRisksByLevel = [{
            category: gettextCatalog.getString('Low risks'),
            value: (cartoCurrent.riskInfo.distrib[0]) ?
              cartoCurrent.riskInfo.distrib[0].length :
              null,
            amvsCurrent:cartoCurrent.riskInfo.distrib[0],
            threshold : [
              Math.min(...cartoCurrent.Impact) * Math.min(...cartoCurrent.MxV),
              anr.seuil1
            ]
          },
          {
            category: gettextCatalog.getString('Medium risks'),
            value: (cartoCurrent.riskInfo.distrib[1]) ?
              cartoCurrent.riskInfo.distrib[1].length :
              null,
            amvsCurrent:cartoCurrent.riskInfo.distrib[1],
            threshold : [anr.seuil1 + 1, anr.seuil2]
          },
          {
            category: gettextCatalog.getString('High risks'),
            value: (cartoCurrent.riskInfo.distrib[2]) ?
              cartoCurrent.riskInfo.distrib[2].length :
              null,
            amvsCurrent:cartoCurrent.riskInfo.distrib[2],
            threshold : [
              anr.seuil2 + 1,
              Math.max(...cartoCurrent.Impact)*Math.max(...cartoCurrent.MxV)
            ]
          }
        ];

        let risksValues = dataCurrentRisksByLevel.map(d => d.value);
        optionsRisksByLevel.forceDomainY.max = risksValues.reduce((sum, d) => {
            return sum + d
          })

      }

      if (Object.keys(cartoTarget.riskInfo.distrib).length > 0) {
        dataTargetRisksByLevel = [{
            category: gettextCatalog.getString('Low risks'),
            value: (cartoTarget.riskInfo.distrib[0]) ?
              cartoTarget.riskInfo.distrib[0].length :
              null,
            amvsTarget:cartoTarget.riskInfo.distrib[0],
            threshold : [
              Math.min(...cartoTarget.Impact) * Math.min(...cartoTarget.MxV),
              anr.seuil1
            ]
          },
          {
            category: gettextCatalog.getString('Medium risks'),
            value: (cartoTarget.riskInfo.distrib[1]) ?
              cartoTarget.riskInfo.distrib[1].length :
              null,
            amvsTarget:cartoTarget.riskInfo.distrib[1],
            threshold : [anr.seuil1 + 1, anr.seuil2]
          },
          {
            category: gettextCatalog.getString('High risks'),
            value: (cartoTarget.riskInfo.distrib[2]) ?
              cartoTarget.riskInfo.distrib[2].length :
              null,
            amvsTarget:cartoTarget.riskInfo.distrib[2],
            threshold : [
              anr.seuil2 + 1,
              Math.max(...cartoTarget.Impact)*Math.max(...cartoTarget.MxV)
            ]
          }
        ];
      }

      if (Object.keys(cartoCurrent.riskOp.distrib).length > 0) {
        dataCurrentOpRisksByLevel = [{
            category: gettextCatalog.getString('Low risks'),
            value: (cartoCurrent.riskOp.distrib[0]) ?
              cartoCurrent.riskOp.distrib[0].length :
              null,
            rolfRisksCurrent: cartoCurrent.riskOp.distrib[0],
            threshold : [
              Math.min(...cartoCurrent.Impact) * Math.min(...cartoCurrent.Probability),
              anr.seuilRolf1
            ]
          },
          {
            category: gettextCatalog.getString('Medium risks'),
            value: (cartoCurrent.riskOp.distrib[1]) ?
              cartoCurrent.riskOp.distrib[1].length :
              null,
            rolfRisksCurrent: cartoCurrent.riskOp.distrib[1],
            threshold : [anr.seuilRolf1 + 1, anr.seuilRolf2]
          },
          {
            category: gettextCatalog.getString('High risks'),
            value: (cartoCurrent.riskOp.distrib[2]) ?
              cartoCurrent.riskOp.distrib[2].length :
              null,
            rolfRisksCurrent: cartoCurrent.riskOp.distrib[2],
            threshold : [
              anr.seuilRolf2 + 1,
              Math.max(...cartoCurrent.Impact)*Math.max(...cartoCurrent.Probability)
            ]
          }
        ];

        let risksValues = dataCurrentOpRisksByLevel.map(d => d.value);
        optionsOpRisksByLevel.forceDomainY.max = risksValues.reduce((sum, d) => {
            return sum + d
          })

      }

      if (Object.keys(cartoTarget.riskOp.distrib).length > 0) {
        dataTargetOpRisksByLevel = [{
            category: gettextCatalog.getString('Low risks'),
            value: (cartoTarget.riskOp.distrib[0]) ?
              cartoTarget.riskOp.distrib[0].length :
              null,
            rolfRisksTarget: cartoTarget.riskOp.distrib[0],
            threshold : [
              Math.min(...cartoTarget.Impact) * Math.min(...cartoTarget.Probability),
              anr.seuilRolf1
            ]

          },
          {
            category: gettextCatalog.getString('Medium risks'),
            value: (cartoTarget.riskOp.distrib[1]) ?
              cartoTarget.riskOp.distrib[1].length :
              null,
            rolfRisksTarget: cartoTarget.riskOp.distrib[1],
            threshold : [anr.seuilRolf1 + 1, anr.seuilRolf2]
          },
          {
            category: gettextCatalog.getString('High risks'),
            value: (cartoTarget.riskOp.distrib[2]) ?
              cartoTarget.riskOp.distrib[2].length :
              null,
            rolfRisksTarget: cartoTarget.riskOp.distrib[2],
            threshold : [
              anr.seuilRolf2 + 1,
              Math.max(...cartoTarget.Impact)*Math.max(...cartoTarget.Probability)
            ]

          }
        ];

      }
    };

    function updateCurrentRisksByAsset(risks) {
      let treshold1 = anr.seuil1;
      let treshold2 = anr.seuil2;
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

    function updateCurrentOpRisksByAsset(opRisks) {
      let treshold1 = anr.seuilRolf1;
      let treshold2 = anr.seuilRolf2;
      dataCurrentOpRisksByAsset = [];

      opRisks.forEach(function(risk) {
        if (risk.cacheNetRisk > -1) {
          let assetFound = dataCurrentOpRisksByAsset.filter(function(asset) {
            return asset.id == risk.instanceInfos.id
          })[0];
          if (assetFound == undefined) {
            dataCurrentOpRisksByAsset.push({
              id: risk.instanceInfos.id,
              category: $scope._langField(risk.instanceInfos, 'name'),
              series: [{
                  label: gettextCatalog.getString("Low risks"),
                  value: (risk.cacheNetRisk >= 0 && risk.cacheNetRisk <= treshold1) ? 1 : 0
                },
                {
                  label: gettextCatalog.getString("Medium risks"),
                  value: (risk.cacheNetRisk <= treshold2 && risk.cacheNetRisk > treshold1) ? 1 : 0
                },
                {
                  label: gettextCatalog.getString("High risks"),
                  value: (risk.cacheNetRisk > treshold2) ? 1 : 0
                }
              ],
            });
          } else {
            if (risk.cacheNetRisk > treshold2) {
              assetFound.series[2].value += 1;
            } else if (risk.cacheNetRisk <= treshold2 && risk.cacheNetRisk > treshold1) {
              assetFound.series[1].value += 1;
            } else if (risk.cacheNetRisk >= 0 && risk.cacheNetRisk <= treshold1) {
              assetFound.series[0].value += 1;
            }
          }
        }
      })
    };

    function updateTargetOpRisksByAsset(opRisks) {
      let treshold1 = anr.seuilRolf1;
      let treshold2 = anr.seuilRolf2;
      dataTargetOpRisksByAsset = [];

      opRisks.forEach(function(risk) {
        if (risk.cacheNetRisk > -1) {
          let assetFound = dataTargetOpRisksByAsset.filter(function(asset) {
            return asset.id == risk.instanceInfos.id
          })[0];
          if (risk.cacheTargetedRisk == -1) {
            risk.cacheTargetedRisk = risk.cacheNetRisk;
          }
          if (assetFound == undefined) {
            dataTargetOpRisksByAsset.push({
              id: risk.instanceInfos.id,
              category: $scope._langField(risk.instanceInfos, 'name'),
              series: [{
                  label: gettextCatalog.getString("Low risks"),
                  value: (risk.cacheTargetedRisk >= 0 &&
                    risk.cacheTargetedRisk <= treshold1) ? 1 : 0
                },
                {
                  label: gettextCatalog.getString("Medium risks"),
                  value: (risk.cacheTargetedRisk <= treshold2 &&
                    risk.cacheTargetedRisk > treshold1) ? 1 : 0
                },
                {
                  label: gettextCatalog.getString("High risks"),
                  value: (risk.cacheTargetedRisk > treshold2) ? 1 : 0
                }
              ],
            });
          } else {
            if (risk.cacheTargetedRisk > treshold2) {
              assetFound.series[2].value += 1;
            } else if (risk.cacheTargetedRisk <= treshold2 && risk.cacheTargetedRisk > treshold1) {
              assetFound.series[1].value += 1;
            } else if (risk.cacheTargetedRisk >= 0 && risk.cacheTargetedRisk <= treshold1) {
              assetFound.series[0].value += 1;
            }
          }
        }
      })
    };

    function updateCurrentOpRisksByParentAsset(data) {
      let promise = $q.defer();
      dataCurrentOpRisksByParent = [];

      let treshold1 = anr.seuilRolf1;
      let treshold2 = anr.seuilRolf2;

      data.forEach(function(instance, index, instances) {
        AnrService.getInstanceRisksOp(anr.id, instance.id, {
          limit: -1,
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
          data.oprisks.forEach(function(risk) {
            if (risk.cacheNetRisk > -1) {
              if (risk.cacheNetRisk > treshold2) {
                parent.series[2].value += 1;
              } else if (risk.cacheNetRisk <= treshold2 && risk.cacheNetRisk > treshold1) {
                parent.series[1].value += 1;
              } else if (risk.cacheNetRisk >= 0 && risk.cacheNetRisk <= treshold1) {
                parent.series[0].value += 1;
              }
            }
          });

          return parent;

        }).then((data) => {
          dataCurrentOpRisksByParent.push(data);
          if (dataCurrentOpRisksByParent.length == instances.length) {
            dataCurrentOpRisksByParent.sort(function(a, b) {
                return a.category.localeCompare(b.category)
              }),
              promise.resolve(dataCurrentOpRisksByParent);
          }
        });
      })

      return promise.promise;
    }

    function updateTargetOpRisksByParentAsset(data) {
      let promise = $q.defer();
      dataTargetOpRisksByParent = [];
      let treshold1 = anr.seuilRolf1;
      let treshold2 = anr.seuilRolf2;

      data.forEach(function(instance, index, instances) {
        AnrService.getInstanceRisksOp(anr.id, instance.id, {
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

          data.oprisks.forEach(function(risk) {
            if (risk.cacheNetRisk > -1) {
              if (risk.cacheTargetedRisk == -1) {
                risk.cacheTargetedRisk = risk.cacheNetRisk;
              }
              if (risk.cacheTargetedRisk > treshold2) {
                parent.series[2].value += 1;
              } else if (risk.cacheTargetedRisk <= treshold2 && risk.cacheTargetedRisk > treshold1) {
                parent.series[1].value += 1;
              } else if (risk.cacheTargetedRisk >= 0 && risk.cacheTargetedRisk <= treshold1) {
                parent.series[0].value += 1;
              }
            }
          });

          return parent;

        }).then((data) => {
          dataTargetOpRisksByParent.push(data);
          if (dataTargetOpRisksByParent.length == instances.length) {
            dataTargetOpRisksByParent.sort(function(a, b) {
                return a.category.localeCompare(b.category)
              }),
              promise.resolve(dataTargetOpRisksByParent);
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

      impacts.forEach(function(impact) {
        likelihoods.forEach(function(likelihood) {
          dataCurrentCartography.push({
            y: impact,
            x: likelihood,
            value: (countersCurrent[impact] !== undefined && countersCurrent[impact][likelihood] !== undefined) ?
              countersCurrent[impact][likelihood].length : null,
            amvsCurrent: (countersCurrent[impact] !== undefined && countersCurrent[impact][likelihood] !== undefined) ?
              countersCurrent[impact][likelihood] : null
          })

          dataTargetCartography.push({
            y: impact,
            x: likelihood,
            value: (countersTarget[impact] !== undefined && countersTarget[impact][likelihood] !== undefined) ?
              countersTarget[impact][likelihood].length : null,
            amvsTarget: (countersTarget[impact] !== undefined && countersTarget[impact][likelihood] !== undefined) ?
              countersTarget[impact][likelihood] : null
          })
        });
        probabilities.forEach(function(likelihood) {
          dataCurrentCartographyRiskOp.push({
            y: impact,
            x: likelihood,
            value: (countersRiskOpCurrent[impact] !== undefined && countersRiskOpCurrent[impact][likelihood] !== undefined) ?
              countersRiskOpCurrent[impact][likelihood].length : null,
            rolfRisksCurrent: (countersRiskOpCurrent[impact] !== undefined && countersRiskOpCurrent[impact][likelihood] !== undefined) ?
              countersRiskOpCurrent[impact][likelihood] : null
          })

          dataTargetCartographyRiskOp.push({
            y: impact,
            x: likelihood,
            value: (countersRiskOpTarget[impact] !== undefined && countersRiskOpTarget[impact][likelihood] !== undefined) ?
              countersRiskOpTarget[impact][likelihood].length : null,
            rolfRisksTarget: (countersRiskOpTarget[impact] !== undefined && countersRiskOpTarget[impact][likelihood] !== undefined) ?
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

// DRAW CHART FUNCTIONS ========================================================

    function drawCurrentRisk() {
      if ($scope.displayCurrentRisksBy == "level") {
        if ($scope.currentRisksOptions == 'vertical') {
          ChartService.verticalBarChart(
            '#graphCurrentRisks',
            dataCurrentRisksByLevel,
            optionsRisksByLevel
          );
        }
        if ($scope.currentRisksOptions == 'donut') {
          ChartService.donutChart(
            '#graphCurrentRisks',
            dataCurrentRisksByLevel,
            optionsRisksByLevel
          );
        }
      }
      if ($scope.displayCurrentRisksBy == "asset") {
        ChartService.multiVerticalBarChart(
          '#graphCurrentRisks',
          dataCurrentRisksByAsset,
          optionsRisksByAsset
        );
      }
    };

    function drawTargetRisk() {
      if ($scope.displayTargetRisksBy == "level") {
        if ($scope.targetRisksOptions == 'vertical') {
          ChartService.verticalBarChart(
            '#graphTargetRisks',
            dataTargetRisksByLevel,
            optionsRisksByLevel
          );
        }
        if ($scope.targetRisksOptions == 'donut') {
          ChartService.donutChart(
            '#graphTargetRisks',
            dataTargetRisksByLevel,
            optionsRisksByLevel
          );
        }
      }
      if ($scope.displayTargetRisksBy == "asset") {
        ChartService.multiVerticalBarChart(
          '#graphTargetRisks',
          dataTargetRisksByAsset,
          optionsRisksByAsset
        );
      }
    };

    function drawCurrentRiskByParent() {
      if ($scope.displayCurrentRisksBy == "parentAsset") {
        ChartService.multiVerticalBarChart(
          '#graphCurrentRisks',
          dataCurrentRisksByParent,
          optionsCurrentRisksByParent
        );
      }
    };

    function drawTargetRiskByParent() {
      if ($scope.displayTargetRisksBy == "parentAsset") {
        ChartService.multiVerticalBarChart(
          '#graphTargetRisks',
          dataTargetRisksByParent,
          optionsTargetRisksByParent
        );
      }
    };

    function drawCurrentOpRiskByParent() {
      if ($scope.displayCurrentOpRisksBy == "parentAsset") {
        ChartService.multiVerticalBarChart(
          '#graphCurrentOpRisks',
          dataCurrentOpRisksByParent,
          optionsCurrentOpRisksByParent
        );
      }
    };

    function drawTargetOpRiskByParent() {
      if ($scope.displayTargetOpRisksBy == "parentAsset") {
        ChartService.multiVerticalBarChart(
          '#graphTargetOpRisks',
          dataTargetOpRisksByParent,
          optionsTargetOpRisksByParent
        );
      }
    };

    function drawCurrentOpRisk() {
      if ($scope.displayCurrentOpRisksBy == "level") {
        if ($scope.currentOpRisksOptions == 'vertical') {
          ChartService.verticalBarChart(
            '#graphCurrentOpRisks',
            dataCurrentOpRisksByLevel,
            optionsOpRisksByLevel
          );
        }
        if ($scope.currentOpRisksOptions == 'donut') {
          ChartService.donutChart(
            '#graphCurrentOpRisks',
            dataCurrentOpRisksByLevel,
            optionsOpRisksByLevel
          );
        }
      }
      if ($scope.displayCurrentOpRisksBy == "asset") {
        ChartService.multiVerticalBarChart(
          '#graphCurrentOpRisks',
          dataCurrentOpRisksByAsset,
          optionsOpRisksByAsset
        );
      }
    };

    function drawTargetOpRisk() {
      if ($scope.displayTargetOpRisksBy == "level") {
        if ($scope.targetOpRisksOptions == 'vertical') {
          ChartService.verticalBarChart(
            '#graphTargetOpRisks',
            dataTargetOpRisksByLevel,
            optionsOpRisksByLevel
          );
        }
        if ($scope.targetOpRisksOptions == 'donut') {
          ChartService.donutChart(
            '#graphTargetOpRisks',
            dataTargetOpRisksByLevel,
            optionsOpRisksByLevel
          );
        }
      }
      if ($scope.displayTargetOpRisksBy == "asset") {
        ChartService.multiVerticalBarChart(
          '#graphTargetOpRisks',
          dataTargetOpRisksByAsset,
          optionsOpRisksByAsset
        );
      }
    };

    function drawThreats() {
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

    function drawVulnerabilities() {
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

    function drawCartography() {
      if ($scope.cartographyRisksType == "info_risks" && anr) {
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
      } else if (anr) {
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
    };

    function drawCompliance() {
        ChartService.radarChart(
          '#graphCompliance',
          dataCompliance[$scope.referentialSelected],
          optionsChartCompliance
        );
    };

// BREADCRUMB MANAGE FUNCTIONS =================================================

    //function triggered by 'return' button : loads graph data in memory tab then deletes it
    $scope.goBackCurrentRisks = function() {
      $scope.currentRisksBreadcrumb.pop();
      $scope.currentRisksMemoryTab.pop();
      dataCurrentRisksByParent = $scope.currentRisksMemoryTab[$scope.currentRisksMemoryTab.length - 1];
      ChartService.multiVerticalBarChart(
        '#graphCurrentRisks',
        dataCurrentRisksByParent,
        optionsCurrentRisksByParent
      );
    }

    //function triggered with the interactive breadcrumb : id is held by the button
    $scope.breadcrumbGoBackCurrentRisks = function(id) {
      if ($scope.currentRisksBreadcrumb.length > 4) {
        dataCurrentRisksByParent = $scope.currentRisksMemoryTab[id + $scope.currentRisksBreadcrumb.length - 4];
        $scope.currentRisksMemoryTab = $scope.currentRisksMemoryTab.slice(0, id + $scope.currentRisksBreadcrumb.length - 3); //only keep elements before the one we display
        $scope.currentRisksBreadcrumb = $scope.currentRisksBreadcrumb.slice(0, id + $scope.currentRisksBreadcrumb.length - 3);
        ChartService.multiVerticalBarChart(
          '#graphCurrentRisks',
          dataCurrentRisksByParent,
          optionsCurrentRisksByParent
        );
      } else {
        dataCurrentRisksByParent = $scope.currentRisksMemoryTab[id];
        $scope.currentRisksMemoryTab = $scope.currentRisksMemoryTab.slice(0, id + 1); //only keep elements before the one we display
        $scope.currentRisksBreadcrumb = $scope.currentRisksBreadcrumb.slice(0, id + 1);
        ChartService.multiVerticalBarChart(
          '#graphCurrentRisks',
          dataCurrentRisksByParent,
          optionsCurrentRisksByParent
        );
      }
    }

    //function triggered by 'return' button : loads graph data in memory tab then deletes it
    $scope.goBackTargetRisks = function() {
      $scope.targetRisksBreadcrumb.pop();
      $scope.targetRisksMemoryTab.pop();
      dataTargetRisksByParent = $scope.targetRisksMemoryTab[$scope.targetRisksMemoryTab.length - 1];
      ChartService.multiVerticalBarChart(
        '#graphTargetRisks',
        dataTargetRisksByParent,
        optionsTargetRisksByParent
      );
    }

    //function triggered with the interactive breadcrumb : id is held by the button
    $scope.breadcrumbGoBackTargetRisks = function(id) {
      if ($scope.targetRisksBreadcrumb.length > 4) {
        dataTargetRisksByParent = $scope.targetRisksMemoryTab[id + $scope.targetRisksBreadcrumb.length - 4];
        $scope.targetRisksMemoryTab = $scope.targetRisksMemoryTab.slice(0, id + $scope.targetRisksBreadcrumb.length - 3); //only keep elements before the one we display
        $scope.targetRisksBreadcrumb = $scope.targetRisksBreadcrumb.slice(0, id + $scope.targetRisksBreadcrumb.length - 3);
        ChartService.multiVerticalBarChart(
          '#graphTargetRisks',
          dataTargetRisksByParent,
          optionsTargetRisksByParent
        );
      } else {
        dataTargetRisksByParent = $scope.targetRisksMemoryTab[id];
        $scope.targetRisksMemoryTab = $scope.targetRisksMemoryTab.slice(0, id + 1); //only keep elements before the one we display
        $scope.targetRisksBreadcrumb = $scope.targetRisksBreadcrumb.slice(0, id + 1);
        ChartService.multiVerticalBarChart(
          '#graphTargetRisks',
          dataTargetRisksByParent,
          optionsTargetRisksByParent
        );
      }
    }

    //function triggered by 'return' button : loads graph data in memory tab then deletes it
    $scope.goBackCurrentOpRisks = function() {
      $scope.currentOpRisksBreadcrumb.pop();
      $scope.currentOpRisksMemoryTab.pop();
      dataCurrentOpRisksByParent = $scope.currentOpRisksMemoryTab[$scope.currentOpRisksMemoryTab.length - 1];
      ChartService.multiVerticalBarChart(
        '#graphCurrentOpRisks',
        dataCurrentOpRisksByParent,
        optionsCurrentOpRisksByParent
      );
    }

    //function triggered with the interactive breadcrumb : id is held by the button
    $scope.breadcrumbGoBackCurrentOpRisks = function(id) {
      if ($scope.currentOpRisksBreadcrumb.length > 4) {
        dataCurrentOpRisksByParent = $scope.currentOpRisksMemoryTab[id + $scope.currentOpRisksBreadcrumb.length - 4];
        $scope.currentOpRisksMemoryTab = $scope.currentOpRisksMemoryTab.slice(0, id + $scope.currentOpRisksBreadcrumb.length - 3); //only keep elements before the one we display
        $scope.currentOpRisksBreadcrumb = $scope.currentOpRisksBreadcrumb.slice(0, id + $scope.currentOpRisksBreadcrumb.length - 3);
        ChartService.multiVerticalBarChart(
          '#graphCurrentOpRisks',
          dataCurrentOpRisksByParent,
          optionsCurrentOpRisksByParent
        );
      } else {
        dataCurrentOpRisksByParent = $scope.currentOpRisksMemoryTab[id];
        $scope.currentOpRisksMemoryTab = $scope.currentOpRisksMemoryTab.slice(0, id + 1); //only keep elements before the one we display
        $scope.currentOpRisksBreadcrumb = $scope.currentOpRisksBreadcrumb.slice(0, id + 1);
        ChartService.multiVerticalBarChart(
          '#graphCurrentOpRisks',
          dataCurrentOpRisksByParent,
          optionsCurrentOpRisksByParent
        );
      }
    }

    //function triggered by 'return' button : loads graph data in memory tab then deletes it
    $scope.goBackTargetOpRisks = function() {
      $scope.targetOpRisksBreadcrumb.pop();
      $scope.targetOpRisksMemoryTab.pop();
      dataTargetOpRisksByParent = $scope.targetOpRisksMemoryTab[$scope.targetOpRisksMemoryTab.length - 1];
      ChartService.multiVerticalBarChart(
        '#graphTargetOpRisks',
        dataTargetOpRisksByParent,
        optionsTargetOpRisksByParent
      );
    }

    //function triggered with the interactive breadcrumb : id is held by the button
    $scope.breadcrumbGoBackTargetOpRisks = function(id) {
      if ($scope.targetOpRisksBreadcrumb.length > 4) {
        dataTargetOpRisksByParent = $scope.targetOpRisksMemoryTab[id + $scope.targetOpRisksBreadcrumb.length - 4];
        $scope.targetOpRisksMemoryTab = $scope.targetOpRisksMemoryTab.slice(0, id + $scope.targetOpRisksBreadcrumb.length - 3); //only keep elements before the one we display
        $scope.targetOpRisksBreadcrumb = $scope.targetOpRisksBreadcrumb.slice(0, id + $scope.targetOpRisksBreadcrumb.length - 3);
        ChartService.multiVerticalBarChart(
          '#graphTargetOpRisks',
          dataTargetOpRisksByParent,
          optionsTargetOpRisksByParent
        );
      } else {
        dataTargetOpRisksByParent = $scope.targetOpRisksMemoryTab[id];
        $scope.targetOpRisksMemoryTab = $scope.targetOpRisksMemoryTab.slice(0, id + 1); //only keep elements before the one we display
        $scope.targetOpRisksBreadcrumb = $scope.targetOpRisksBreadcrumb.slice(0, id + 1);
        ChartService.multiVerticalBarChart(
          '#graphTargetOpRisks',
          dataTargetOpRisksByParent,
          optionsTargetOpRisksByParent
        );
      }
    }

// DIALOGS =====================================================================

    function risksTable(risks,kindOfRisks) {
        var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

        $mdDialog.show({
            controller: risksTableDialogCtrl,
            templateUrl: 'views/anr/anr.dashboard.risks.html',
            preserveScope: true,
            scope: $scope,
            clickOutsideToClose: false,
            fullscreen: useFullScreen,
            locals: {
                'risks': risks,
                'kindOfRisks' : kindOfRisks
            }
        })
    };

    function risksTableDialogCtrl($scope, $mdDialog,risks,kindOfRisks) {
        $scope.risks = risks;
        $scope.kindOfRisks = kindOfRisks;
        $scope.cancel = function() {
            $mdDialog.cancel();
        };
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
              optionsRisksByLevel,
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
              optionsRisksByLevel,
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
          y: 2.00,
          w: 4.50,
          h: 5.00
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
          x: 5.10,
          y: 2.00,
          w: 4.50,
          h: 5.00
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
          y: 2.00,
          w: 4.50,
          h: 5.00
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
          x: 5.10,
          y: 2.00,
          w: 4.50,
          h: 5.00
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
          h: 5.50
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
          h: 5.50
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
          h: 5.50
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
          h: 5.50
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
          h: 5.50
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
          h: 5.50
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
          h: 2.50
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
          h: 2.50
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
            x: 1.50,
            y: 1.40,
            w: 7.00,
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

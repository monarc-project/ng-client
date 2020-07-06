(function () {
    angular
        .module('ClientApp')
        .controller('ClientDashboardCtrl', [
            '$scope', '$state', '$http', 'gettextCatalog', '$q', '$timeout',
            '$stateParams', 'AnrService', 'ClientAnrService', 'ReferentialService', 'SOACategoryService',
            'ClientSoaService', 'ChartService', ClientDashboardCtrl
        ]);

    /**
     * Dashboard Controller for the Client module
     */
    function ClientDashboardCtrl($scope, $state, $http, gettextCatalog, $q, $timeout,
                                 $stateParams, AnrService, ClientAnrService, ReferentialService, SOACategoryService,
                                 ClientSoaService, ChartService) {

        $scope.dashboard = {
            anr: null,
            data: [],
            riskInfo: false,
            riskOp: false,
            currentTabIndex: 0,
            refSelected: null,
            cartographyRisksType: 'info_risks',
            carto: null
        };

//==============================================================================


        //The two following arrays are used for the breadcrumb for parent asset charts

        let firstRefresh = true;

        $scope.selectGraphRisks = function () { //Displays the risks charts
        };

        $scope.selectGraphThreats = function () { //Displays the threats charts
        };

        $scope.selectGraphVulnerabilities = function () { //Displays the vulnerabilities charts
        };

        $scope.selectGraphCartography = function () { //Displays the cartography
            if ($scope.dashboard.cartographyRisksType == "info_risks") {
                if ($scope.dashboard.riskInfo) {
                  optionsChartCartography_current.threshold =
                  optionsChartCartography_target.threshold = [$scope.dashboard.anr.seuil1, $scope.dashboard.anr.seuil2];
                  optionsChartCartography_current.width = document.getElementById('graphCartographyCurrent').parentElement.clientWidth;
                  optionsChartCartography_target.width = document.getElementById('graphCartographyTarget').parentElement.clientWidth;
                  ChartService.heatmapChart(
                    '#graphCartographyCurrent',
                    dataChartCartoCurrent,
                    optionsChartCartography_current
                  );
                  ChartService.heatmapChart(
                    '#graphCartographyTarget',
                    dataChartCartoTarget,
                    optionsChartCartography_target
                  );
                }
            } else {
                if ($scope.dashboard.riskOp) {
                  optionsChartCartography_current.threshold =
                  optionsChartCartography_target.threshold = [$scope.dashboard.anr.seuilRolf1, $scope.dashboard.anr.seuilRolf2];
                  optionsChartCartography_current.width =
                  optionsChartCartography_target.width = 400;

                  ChartService.heatmapChart(
                    '#graphCartographyCurrent',
                    dataChartCartoRiskOpCurrent,
                    optionsChartCartography_current
                  );
                  ChartService.heatmapChart(
                    '#graphCartographyTarget',
                    dataChartCartoRiskOpTarget,
                    optionsChartCartography_target
                  );
                }
            }
        };

        $scope.selectGraphCompliance = function () { //Displays the Compliance tab
            if ($scope.dashboard.refSelected) {
                ChartService.radarChart('#graphCompliance',dataChartCompliance[$scope.dashboard.refSelected],optionsChartCompliance);
            }
            $scope.loadCompliance = true;
        };

        $scope.serializeQueryString = function (obj) { // helps with creating a URL (if the clicking feature is enabled)
            let str = [];
            for (let p in obj) {
                if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                }
            }
            return str.join('&');
        };

//==============================================================================

        //Options of the chart that displays current risks by level
        const optionsCartoRisk_discreteBarChart_current = {
          height: 450,
          width: 450,
          margin: {
              top: 20,
              right: 20,
              bottom: 50,
              left: 55
          },
          color : ["#D6F107","#FFBC1C","#FD661F"],
          showLegend : false,
          forceDomainY : { min : 0, max : 0},
          yLabel : gettextCatalog.getString('Current risks')
        };

        //Options of the chart that displays Residual risks by level
        const optionsCartoRisk_discreteBarChart_target = {
          height: 450,
          width: 450,
          margin: {
              top: 20,
              right: 20,
              bottom: 50,
              left: 55
          },
          color : ["#D6F107","#FFBC1C","#FD661F"],
          showLegend : false,
          forceDomainY : { min : 0, max : 0},
          yLabel : gettextCatalog.getString('Residual risks')
        };

//==============================================================================

        //Options for the chart that displays the current risks by asset
        const optionsChartCurrentRisksByAsset = {
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
          onClickFunction :
            function(d) {
               $state.transitionTo("main.project.anr.instance", {
                  modelId: $scope.dashboard.anr.id,
                  instId: d.id
              }, {notify: true, relative: null, location: true, inherit: false, reload: true});
            }
        };

//==============================================================================

        const optionsChartTargetRisksByAsset = {
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
          onClickFunction :
            function(d) {
               $state.transitionTo("main.project.anr.instance", {
                  modelId: $scope.dashboard.anr.id,
                  instId: d.id
              }, {notify: true, relative: null, location: true, inherit: false, reload: true});
            }
        };

//==============================================================================

        //Options for the charts that display the risks by parent asset
        const optionsChartCurrentRisksByParentAsset = {
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
          onClickFunction :
            function (d) { //on click go one child deeper (node) or go to MONARC (leaf)
                if (d.child.length > 0) {
                    updateCurrentRisksByParentAsset(d.child).then(function (data) {
                      $scope.dashboard.currentRisksBreadcrumb.push(d.category);
                      $scope.dashboard.currentRisksParentAssetMemoryTab.push(data);
                      ChartService.multiVerticalBarChart(
                        '#graphCurrentRisks',
                        data,
                        optionsChartCurrentRisksByParentAsset
                      );
                    });
                } else {
                    $state.transitionTo("main.project.anr.instance", {
                        modelId: $scope.dashboard.anr.id,
                        instId: d.id
                    }, {notify: true, relative: null, location: true, inherit: false, reload: true});
                }
            }
        };

//==============================================================================

        //Options for the charts that display the risks by parent asset
        const optionsChartTargetRisksByParentAsset = {
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
          onClickFunction :
            function (d) { //on click go one child deeper (node) or go to MONARC (leaf)
                if (d.child.length > 0) {
                    updateTargetRisksByParentAsset(d.child).then(function (data) {
                      $scope.dashboard.targetRisksBreadcrumb.push(d.category);
                      $scope.dashboard.targetRisksParentAssetMemoryTab.push(data);
                      ChartService.multiVerticalBarChart(
                        '#graphTargetRisks',
                        data,
                        optionsChartTargetRisksByParentAsset
                      );
                    });
                } else {
                    $state.transitionTo("main.project.anr.instance", {
                        modelId: $scope.dashboard.anr.id,
                        instId: d.id
                    }, {notify: true, relative: null, location: true, inherit: false, reload: true});
                }
            }
        };

//==============================================================================

        //Options for the chart that displays threats by their number of occurrences
        const optionsChartThreats_discreteBarChart = {
              height: 800,
              width: 1400,
              margin: {
                  top: 30,
                  right: 200,
                  bottom: 300,
                  left: 30
              },
              colorGradient: true,
              color : ["#D6F107","#FD661F"],
              showLegend : false,
              rotationXAxisLabel : 45,
              offsetXAxisLabel : 0.9,
              sort : true
        };

        //Options for the chart that displays threats by their number of occurrences
        const optionsChartThreats_multiBarHorizontalChart = {
          height: 800,
          width: 1400,
          margin: {
              top: 30,
              right: 30,
              bottom: 30,
              left: 300
          },
          colorGradient: true,
          color : ["#D6F107","#FD661F"],
          showLegend : false,
          sort : true,
        };

//==============================================================================

        //Options for the chart that displays vulnerabilities by their maximum associated risk
        const optionsChartVulnerabilities_discreteBarChart = {
          height: 800,
          width: 1400,
          margin: {
              top: 30,
              right: 200,
              bottom: 300,
              left: 30
          },
          colorGradient: true,
          color : ["#D6F107","#FD661F"],
          showLegend : false,
          rotationXAxisLabel : 45,
          offsetXAxisLabel : 0.9,
          sort : true
        }

        const optionsChartVulnerabilities_horizontalBarChart = {
          height: 800,
          width: 1400,
          margin: {
              top: 30,
              right: 30,
              bottom: 30,
              left: 300
          },
          colorGradient: true,
          color : ["#D6F107","#FD661F"],
          showLegend : false,
          sort : true,
        }

//==============================================================================

        //Options for the chart that displays the cartography
        const optionsChartCartography_current = {
          xLabel : gettextCatalog.getString('Likelihood'),
          yLabel : gettextCatalog.getString('Impact'),
          color : ["#D6F107","#FFBC1C","#FD661F"],
          threshold : []
        };

        const optionsChartCartography_target = {
          xLabel : gettextCatalog.getString('Likelihood'),
          yLabel : gettextCatalog.getString('Impact'),
          color : ["#D6F107","#FFBC1C","#FD661F"],
          threshold : []
        };

//==============================================================================

        //Options for the chart that displays the compliance
        const optionsChartCompliance = {
            width: 650
        };

// DATA MODELS =================================================================

        //Data Model for the graph for the current risk by level of risk (low, med., high)
        var dataChartCurrentRisksByLevel_discreteBarChart = [];

        //Data model for the graph of current risk by asset
        var dataChartCurrentRisksByAsset = [];

        //Data model for the graph for the target risk by level of risk (low, med., high)
        var dataChartTargetRisksByLevel_discreteBarChart = [];

        //Data model for the graph of Residual risks by asset
        var dataChartTargetRisksByAsset = [];

        //Data for the graph for the number of threats by threat type
        var dataChartThreats = [];

        //Data for the graph for the number of vulnerabilities by vulnerabilities type
        var  dataChartVulnes_all = [];

        //Data for the graph for the vulnerabilities by vulnerabilities risk
        var dataChartVulnes_risk = [];

        //Data for the graph for risk cartography
        let dataChartCartoCurrent = [];
        let dataChartCartoTarget = [];
        let dataChartCartoRiskOpCurrent = [];
        let dataChartCartoRiskOpTarget = [];

        //Data for the graph for the compliance
        let dataChartCompliance = [];

        //Data model for the graph of current risk by parent asset
        let dataChartTargetRisksByParentAsset = [];

//==============================================================================

        /*
        * load a new graph with options and data
        */
        const loadGraph = function (api, options, data) {
            api.updateWithOptions(options);
            api.updateWithData(data);
            api.refresh();
        }

        /*
        * Export idOfGraph as name.PNG
        * @param idOfGraph : string  : the id of the graph
        * @param name : string  : name of the file
        * @param parametersAction : array  : parameters for the function saveSvgAsPng
        */

        $scope.exportAsPNG = function (idOfGraph, name, parametersAction = {backgroundColor: 'white'}) {
            if (idOfGraph == 'graphVulnerabilities') {
                parametersAction = {backgroundColor: 'white', height: '1100'}
            }
            let node = d3.select('#' + idOfGraph).select("svg");
            saveSvgAsPng(node.node(), name + '.png', parametersAction);
        }

//==============================================================================
        $scope.updateGraphs = function () {

            angular.copy(d3v3,d3)
            $scope.dashboard.currentRisksBreadcrumb = [gettextCatalog.getString("Overview")];
            $scope.dashboard.targetRisksBreadcrumb = [gettextCatalog.getString("Overview")];
            $scope.dashboard.currentRisksParentAssetMemoryTab = [];
            $scope.dashboard.targetRisksParentAssetMemoryTab = [];
            $scope.displayCurrentRisksBy = $scope.displayTargetRisksBy = "level";
            if (!$scope.currentRisksChartOptions) {
                $scope.currentRisksChartOptions = 'optionsCartoRisk_discreteBarChart_current';
            }
            if (!$scope.targetRisksChartOptions) {
                $scope.targetRisksChartOptions = 'optionsCartoRisk_discreteBarChart_target';
            }
            if (!$scope.displayThreatsBy) {
                $scope.displayThreatsBy = 'number';
            }
            if (!$scope.threatsChartOption) {
                $scope.threatsChartOption = 'optionsChartThreats_discreteBarChart';
            }
            if (!$scope.displayVulnerabilitiesBy) {
                $scope.displayVulnerabilitiesBy = 'number';
            }
            if (!$scope.vulnerabilitiesChartOption) {
                $scope.vulnerabilitiesChartOption = 'optionsChartVulnerabilities_discreteBarChart';
            }
            if (!$scope.vulnerabilitiesDisplayed) {
                $scope.vulnerabilitiesDisplayed = 20;
            }
            $scope.loadCompliance = false;
            $scope.loadingPptx = false;

            ClientAnrService.getAnr($stateParams.modelId).then(function (data) {
                $scope.dashboard.anr = data;
                $http.get("api/client-anr/" + $scope.dashboard.anr.id + "/carto-risks-dashboard").then(function (data) {
                    $scope.dashboard.carto = data.data.carto.real;
                    if (Object.values(data.data.carto.real.riskInfo.distrib).length > 0) {
                        $scope.dashboard.riskInfo = true;
                    }
                    if (Object.values(data.data.carto.real.riskOp.distrib).length > 0) {
                        $scope.dashboard.riskOp = true;
                    }

                    try {
                        // cartography of risks - first tab
                        updateCartoRisks(data);
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

                    AnrService.getScales($scope.dashboard.anr.id).then(function (data) {
                        $scope.dashboard.scales = data.scales;

                        AnrService.getInstances($scope.dashboard.anr.id).then(function (data) {
                            $scope.dashboard.instances = data.instances;

                            AnrService.getAnrRisks($scope.dashboard.anr.id, {
                                limit: -1,
                                order: 'instance',
                                order_direction: 'asc'
                            }).then(function (data) {
                                $scope.dashboard.data = data;
                                updateCurrentRisksByAsset(data);
                                updateTargetRisksByAsset(data);
                                updateThreats(data);
                                updateVulnerabilities(data);
                                updateCurrentRisksByParentAsset($scope.dashboard.instances).then(function(data){
                                  $scope.dashboard.currentRisksParentAssetMemoryTab.push(data);
                                });
                                updateTargetRisksByParentAsset($scope.dashboard.instances).then(function(data){
                                  $scope.dashboard.targetRisksParentAssetMemoryTab.push(data);
                                });
                                ReferentialService.getReferentials({order: 'createdAt'}).then(function (data) {
                                    $scope.dashboard.referentials = [];
                                    data['referentials'].forEach(function (ref) {
                                        if (Array.isArray(ref.measures)) {
                                            $scope.dashboard.referentials.push(ref);
                                        }
                                    })
                                    SOACategoryService.getCategories().then(function (data) {
                                        $scope.dashboard.categories = data['categories'];
                                        ClientSoaService.getSoas().then(function (data) {
                                            $scope.dashboard.soa = data['soaMeasures'];
                                            updateCompliance($scope.dashboard.referentials, $scope.dashboard.categories, $scope.dashboard.soa);
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


//==============================================================================

        /*
          Refreshes the charts with the right data if the displayed risk analysis changes
        */
        $scope.$on('Dashboard', function () {
            if (!firstRefresh) {
                $scope.updateGraphs();
            }
        });

        /*
        * Prepare the array and the objects of risks by assets to be properly export in XLSX
        * @param mappedData, the source of the Data e.g. angular.copy(dataChartCurrentRisksByAsset).map(({key,values}) => ({key,values}));
        * @param id : the id referenced in the mappedData e.g. asset_id, id etc.
        */
        const makeDataExportableForByAsset = function (mappedData, id = 'id') {
            mappedData[0].values.forEach(function (obj) {
                obj[gettextCatalog.getString('Asset')] = obj.x;
                obj[gettextCatalog.getString('Low risks')] = obj.y;
                for (i in mappedData[1].values) {
                    if (obj[id] == mappedData[1].values[i][id])
                        obj[gettextCatalog.getString('Medium risks')] = mappedData[1].values[i]['y'];
                }
                for (i in mappedData[2].values) {
                    if (obj[id] == mappedData[2].values[i][id])
                        obj[gettextCatalog.getString('High risks')] = mappedData[2].values[i]['y'];
                }
                delete obj.x;
                delete obj.y;
                delete obj.color;
                delete obj.id;
                delete obj.asset_id;
                delete obj.child; // in case of root of risk by parent asset
                delete obj.isparent; // in case of root of risk by parent asset
                delete obj.key; // in case of child of risk by parent asset
                delete obj.series; // in case of child of risk by parent asset
            });
        }

        /*
        * Generate the excel with the DATAs of all the graphs of Dashboard
        */
        $scope.generateXlsxData = function () {
            //prepare by risk level
            let byLevel = dataChartCurrentRisksByLevel_discreteBarChart[0].values.map(({label, value}) => ({
                label,
                value
            }));
            byLevel.forEach(function (obj) {
                obj[gettextCatalog.getString('Level')] = obj.label;
                obj[gettextCatalog.getString('Current risks')] = obj.value;
                delete obj.label;
                delete obj.value;
            });

            let byLevelResidual = dataChartTargetRisksByLevel_discreteBarChart[0].values.map(({label, value}) => ({
                label,
                value
            }));
            byLevelResidual.forEach(function (obj) {
                obj[gettextCatalog.getString('Level')] = obj.label;
                obj[gettextCatalog.getString('Residual risks')] = obj.value;
                delete obj.label;
                delete obj.value;
            });

            //prepare risk by assets
            let byAsset = angular.copy(dataChartCurrentRisksByAsset).map(({key, values}) => ({key, values}));
            makeDataExportableForByAsset(byAsset);
            let byAssetResidual = angular.copy(dataChartTargetRisksByAsset).map(({key, values}) => ({key, values}));
            makeDataExportableForByAsset(byAssetResidual);

            //prepare threats info
            let byThreats = dataChartThreats[0].values.map(({x, y, average, max_risk}) => ({x, y, average, max_risk}));
            byThreats.forEach(function (obj) {
                obj[gettextCatalog.getString('Threat')] = obj.x;
                obj[gettextCatalog.getString('Number')] = obj.y;
                obj[gettextCatalog.getString('Probability')] = obj.average;
                obj[gettextCatalog.getString('MAX risk')] = obj.max_risk;
                delete obj.x;
                delete obj.y;
                delete obj.average;
                delete obj.max_risk;
            });
            //prepare vulns info
            let byVulnerabilities = dataChartVulnes_risk[0].values.map(({x, y, average, max_risk}) => ({
                x,
                y,
                average,
                max_risk
            }));
            for (i in byVulnerabilities) {
                byVulnerabilities[i][gettextCatalog.getString('Vulnerabilities')] = byVulnerabilities[i]["x"];
                byVulnerabilities[i][gettextCatalog.getString('Number')] = byVulnerabilities[i]["y"];
                byVulnerabilities[i][gettextCatalog.getString('Qualification')] = byVulnerabilities[i]["average"];
                byVulnerabilities[i][gettextCatalog.getString('MAX risk')] = byVulnerabilities[i]["max_risk"];
                delete byVulnerabilities[i].x;
                delete byVulnerabilities[i].y;
                delete byVulnerabilities[i].average;
                delete byVulnerabilities[i].max_risk;
            }

            //manage by parent asset

            let byCurrentAssetParent = angular.copy(dataChartCurrentRisksByParentAsset).map(({key, values}) => ({
                key,
                values
            }));
            makeDataExportableForByAsset(byCurrentAssetParent, 'asset_id');

            let byTargetedAssetParent = angular.copy(dataChartTargetRisksByParentAsset).map(({key, values}) => ({
                key,
                values
            }));
            makeDataExportableForByAsset(byTargetedAssetParent, 'asset_id');

            //Cartography

            let byCartographyRiskInfo = dataChartCartoCurrent.map(({impact, likelihood, risks}) => ({
                impact,
                likelihood,
                risks
            }));
            for (i in byCartographyRiskInfo) {
                byCartographyRiskInfo[i][gettextCatalog.getString('Impact')] = byCartographyRiskInfo[i]['impact'];
                byCartographyRiskInfo[i][gettextCatalog.getString('Likelihood')] = byCartographyRiskInfo[i]['likelihood'];
                byCartographyRiskInfo[i][gettextCatalog.getString('Current risk')] = byCartographyRiskInfo[i]['risks'] == null ? 0 : byCartographyRiskInfo[i]['risks'];
                byCartographyRiskInfo[i][gettextCatalog.getString('Residual risk')] = dataChartCartoTarget[i]['risks'] == null ? 0 : dataChartCartoTarget[i]['risks'];
                delete byCartographyRiskInfo[i].impact;
                delete byCartographyRiskInfo[i].likelihood;
                delete byCartographyRiskInfo[i].risks;
            }

            let byCartographyRiskOp = dataChartCartoRiskOpCurrent.map(({impact, likelihood, risks}) => ({
                impact,
                likelihood,
                risks
            }));
            for (i in byCartographyRiskOp) {
                byCartographyRiskOp[i][gettextCatalog.getString('Impact')] = byCartographyRiskOp[i]['impact'];
                byCartographyRiskOp[i][gettextCatalog.getString('Likelihood')] = byCartographyRiskOp[i]['likelihood'];
                byCartographyRiskOp[i][gettextCatalog.getString('Current risk')] = byCartographyRiskOp[i]['risks'] == null ? 0 : byCartographyRiskOp[i]['risks'];
                byCartographyRiskOp[i][gettextCatalog.getString('Residual risk')] = dataChartCartoRiskOpTarget[i]['risks'] == null ? 0 : dataChartCartoRiskOpTarget[i]['risks'];
                delete byCartographyRiskOp[i].impact;
                delete byCartographyRiskOp[i].likelihood;
                delete byCartographyRiskOp[i].risks;
            }

            //Compliance

            let byCompliance = [];
            let byComplianceTab = [];
            $scope.dashboard.referentials.forEach(function (ref) {
                byCompliance[ref.uuid] = dataChartCompliance[ref.uuid][0].map(({axis, value}) => ({axis, value}));
                for (i in byCompliance[ref.uuid]) {
                    byCompliance[ref.uuid][i][gettextCatalog.getString('Categories')] = byCompliance[ref.uuid][i]["axis"];
                    byCompliance[ref.uuid][i][gettextCatalog.getString('Current level')] = byCompliance[ref.uuid][i]["value"];
                    byCompliance[ref.uuid][i][gettextCatalog.getString('Applicable target level')] = dataChartCompliance[ref.uuid][1][i]["value"];
                    delete byCompliance[ref.uuid][i].axis;
                    delete byCompliance[ref.uuid][i].value;
                }
                byComplianceTab[ref.uuid] = XLSX.utils.json_to_sheet(byCompliance[ref.uuid]);
            })
            //prepare the tabs for workbook
            let bylevelTab = XLSX.utils.json_to_sheet(byLevel);
            let bylevelResidualTab = XLSX.utils.json_to_sheet(byLevelResidual);
            let byAssetTab = XLSX.utils.json_to_sheet(byAsset[0]['values']);
            let byAssetResidualTab = XLSX.utils.json_to_sheet(byAssetResidual[0]['values']);
            let byThreatsTab = XLSX.utils.json_to_sheet(byThreats);
            let byVulnerabilitiesTab = XLSX.utils.json_to_sheet(byVulnerabilities);
            let byCartographyRiskInfoTab = XLSX.utils.json_to_sheet(byCartographyRiskInfo);
            let byCartographyRiskOpTab = XLSX.utils.json_to_sheet(byCartographyRiskOp);
            let byCurrentAssetParentTab = XLSX.utils.json_to_sheet(byCurrentAssetParent[0]['values']);
            let byTargetedAssetParentTab = XLSX.utils.json_to_sheet(byTargetedAssetParent[0]['values']);

            /*add to workbook */
            let wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, bylevelTab, gettextCatalog.getString('Level').substring(0, 31));
            XLSX.utils.book_append_sheet(wb, bylevelResidualTab, (gettextCatalog.getString('Residual risks') + '_' + gettextCatalog.getString('Level').substring(0, 31)));
            XLSX.utils.book_append_sheet(wb, byAssetTab, gettextCatalog.getString('All assets').substring(0, 31));
            XLSX.utils.book_append_sheet(wb, byAssetResidualTab, (gettextCatalog.getString('Residual risks') + '_' + gettextCatalog.getString('All assets')).substring(0, 31));
            XLSX.utils.book_append_sheet(wb, byCurrentAssetParentTab, gettextCatalog.getString('Parent asset').substring(0, 31));
            XLSX.utils.book_append_sheet(wb, byTargetedAssetParentTab, (gettextCatalog.getString('Residual risks') + '_' + gettextCatalog.getString('Parent asset')).substring(0, 31));
            XLSX.utils.book_append_sheet(wb, byThreatsTab, gettextCatalog.getString('Threats').substring(0, 31));
            XLSX.utils.book_append_sheet(wb, byVulnerabilitiesTab, gettextCatalog.getString('Vulnerabilities').substring(0, 31));
            XLSX.utils.book_append_sheet(wb, byCartographyRiskInfoTab, gettextCatalog.getString('Cartography Information Risk').substring(0, 31));
            XLSX.utils.book_append_sheet(wb, byCartographyRiskOpTab, gettextCatalog.getString('Cartography Operational Risk').substring(0, 31));

            $scope.dashboard.referentials.forEach(function (ref) {
                XLSX.utils.book_append_sheet(wb, byComplianceTab[ref.uuid], (gettextCatalog.getString('Compliance') + "_" + ref['label' + $scope.dashboard.anr.language]).substring(0, 31).replace(/[:?*/[\]\\]+/g, ''));
            })

            /* write workbook and force a download */
            XLSX.writeFile(wb, "dashboard.xlsx");
        }

        /*
        * Generate Threat charts for Powerpoint
        */
        const getThreatPptx = function () {
            let promise = $q.defer();
            currentDisplayThreat = $scope.displayThreatsBy;
            displayThreatby = ['number', 'probability', 'max_associated_risk'];
            displayThreatbyIndex = angular.copy(displayThreatby.length) - 1;
            dataThreatCharts = [];
            displayThreatby.forEach(function (display) {
                $timeout(function () {
                    $scope.displayThreatsBy = display;
                    updateThreats($scope.dashboard.data).then(function (data) {
                        dataThreatCharts.push(angular.copy(data));
                    });
                    if (dataThreatCharts.length == displayThreatbyIndex) {
                        $scope.displayThreatsBy = currentDisplayThreat;
                        promise.resolve(dataThreatCharts);
                    }
                });
            });
            return promise.promise;
        }

        /*
        * Generate Vulnerability charts for Powerpoint
        */
        const getVulnPptx = function () {
            let promise = $q.defer();
            currentDisplayVuln = $scope.displayVulnerabilitiesBy;
            displayVulnby = ['number', 'qualification', 'max_associated_risk'];
            displayVulnbyIndex = angular.copy(displayVulnby.length) - 1;
            dataVulnCharts = [];
            displayVulnby.forEach(function (display) {
                $timeout(function () {
                    $scope.displayVulnerabilitiesBy = display;
                    updateVulnerabilities($scope.dashboard.data).then(function (data) {
                        dataVulnCharts.push(angular.copy(data));
                    });
                    if (dataVulnCharts.length == displayVulnbyIndex) {
                        $scope.displayVulnerabilitiesBy = currentDisplayVuln;
                        promise.resolve(dataVulnCharts);
                    }
                });
            });
            return promise.promise;
        }

        /*
        * Generate the Powerpoint with all graphs of Dashboard
        */

        $scope.generatePptxSildes = async function () {
            $scope.loadingPptx = true;
            let dataThreatPptx = await getThreatPptx();
            let dataVulnPptx = await getVulnPptx();

            charts = [
                {
                    slide: 1,
                    title: gettextCatalog.getString('Risks'),
                    subtitle: gettextCatalog.getString('Current risks'),
                    option: optionsCartoRisk_discreteBarChart_current,
                    data: dataChartCurrentRisksByLevel_discreteBarChart,
                    x: 0.60, y: 2.00, w: 4.00, h: 4.00
                },
                {
                    slide: 1,
                    subtitle: gettextCatalog.getString('Residual risks'),
                    option: optionsCartoRisk_discreteBarChart_target,
                    data: dataChartTargetRisksByLevel_discreteBarChart,
                    x: 5.40, y: 2.00, w: 4.00, h: 4.00
                },
                {
                    slide: 2,
                    title: gettextCatalog.getString('Risks'),
                    subtitle: gettextCatalog.getString('Current risks'),
                    option: optionsChartCurrentRisksByAsset,
                    data: dataChartCurrentRisksByAsset,
                    x: 0.60, y: 1.40, w: 3.80, h: 6.00
                },
                {
                    slide: 2,
                    subtitle: gettextCatalog.getString('Residual risks'),
                    option: optionsChartTargetRisksByAsset,
                    data: dataChartTargetRisksByAsset,
                    x: 5.60, y: 1.40, w: 3.80, h: 6.00
                },
                {
                    slide: 3,
                    title: gettextCatalog.getString('Risks'),
                    subtitle: gettextCatalog.getString('Current risks'),
                    option: optionsChartCurrentRisksByParentAsset,
                    data: dataChartCurrentRisksByParentAsset,
                    x: 0.60, y: 1.60, w: 3.80, h: 5.50
                },
                {
                    slide: 3,
                    option: optionsChartTargetRisksByParentAsset,
                    subtitle: gettextCatalog.getString('Residual risks'),
                    data: dataChartTargetRisksByParentAsset,
                    x: 5.40, y: 1.60, w: 3.80, h: 5.50
                },
                {
                    slide: 4,
                    title: gettextCatalog.getString('Threats'),
                    subtitle: gettextCatalog.getString('Number'),
                    option: optionsChartThreats_multiBarHorizontalChart,
                    data: dataThreatPptx[0],
                    x: 0.60, y: 1.40, w: 8.80, h: 6.00
                },
                {
                    slide: 5,
                    title: gettextCatalog.getString('Threats'),
                    subtitle: gettextCatalog.getString('Probability'),
                    option: optionsChartThreats_multiBarHorizontalChart,
                    data: dataThreatPptx[1],
                    x: 0.60, y: 1.40, w: 8.80, h: 6.00
                },
                {
                    slide: 6,
                    title: gettextCatalog.getString('Threats'),
                    subtitle: gettextCatalog.getString('Max. associated risk level'),
                    option: optionsChartThreats_multiBarHorizontalChart,
                    data: dataThreatPptx[2],
                    x: 0.60, y: 1.40, w: 8.80, h: 6.00
                },
                {
                    slide: 7,
                    title: gettextCatalog.getString('Vulnerabilities'),
                    subtitle: gettextCatalog.getString('Number'),
                    option: optionsChartVulnerabilities_horizontalBarChart,
                    data: dataVulnPptx[0],
                    x: 0.60, y: 1.40, w: 8.80, h: 6.00
                },
                {
                    slide: 8,
                    title: gettextCatalog.getString('Vulnerabilities'),
                    subtitle: gettextCatalog.getString('Qualification'),
                    option: optionsChartVulnerabilities_horizontalBarChart,
                    data: dataVulnPptx[1],
                    x: 0.60, y: 1.40, w: 8.80, h: 6.00
                },
                {
                    slide: 9,
                    title: gettextCatalog.getString('Vulnerabilities'),
                    subtitle: gettextCatalog.getString('Max. associated risk level'),
                    option: optionsChartVulnerabilities_horizontalBarChart,
                    data: dataVulnPptx[2],
                    x: 0.60, y: 1.40, w: 8.80, h: 6.00
                },
                {
                    slide: 10,
                    title: gettextCatalog.getString('Cartography') + ' - ' + gettextCatalog.getString('Information risks'),
                    subtitle: gettextCatalog.getString('Current risks'),
                    option: optionsChartCartography_current,
                    data: dataChartCartoCurrent,
                    x: 0.05, y: 2.50, w: 5.00, h: 3.00
                },
                {
                    slide: 10,
                    subtitle: gettextCatalog.getString('Residual risks'),
                    option: optionsChartCartography_target,
                    data: dataChartCartoTarget,
                    x: 4.95, y: 2.50, w: 5.00, h: 3.00
                },
                {
                    slide: 11,
                    title: gettextCatalog.getString('Cartography') + ' - ' + gettextCatalog.getString('Operational risks'),
                    subtitle: gettextCatalog.getString('Current risks'),
                    option: optionsChartCartography_current,
                    data: dataChartCartoRiskOpCurrent,
                    x: 0.60, y: 2.00, w: 4.00, h: 4.00
                },
                {
                    slide: 11,
                    subtitle: gettextCatalog.getString('Residual risks'),
                    option: optionsChartCartography_target,
                    data: dataChartCartoRiskOpTarget,
                    x: 5.50, y: 2.00, w: 4.00, h: 4.00
                },
            ];

            if ($scope.dashboard.referentials.length > 0) {
                slideIndex = 12;
                $scope.dashboard.referentials.forEach(function (ref) {
                    charts.push({
                            slide: slideIndex,
                            title: gettextCatalog.getString('Compliance'),
                            subtitle: ref['label' + $scope.dashboard.anr.language],
                            option: optionsChartCompliance,
                            data: dataChartCompliance[ref.uuid],
                            x: 0.60, y: 1.40, w: 8.80, h: 5.50
                        }
                    );
                    slideIndex++;
                });
            }

            let pptx = new PptxGenJS();
            pptx.setLayout('LAYOUT_4x3');
            let slide = [];
            let lastSlide = 0;
            let date = new Date();

            pptx.defineSlideMaster({
                title: 'TITLE_SLIDE',
                objects: [
                    {'rect': {x: 0.00, y: 4.60, w: '100%', h: 1.75, fill: '006fba'}},
                    {'line': {x: 0.00, y: 6.35, w: '100%', h: 0.00, line: 'FFC107', lineSize: 5}},
                    {'image': {x: 7.0, y: 5.10, w: 1.50, h: 0.65, path: 'img/logo-monarc.png'}}
                ]
            });

            pptx.defineSlideMaster({
                title: 'MASTER_SLIDE',
                bkgd: 'FFFEFE',
                slideNumber: {x: 9.00, y: 7.0, color: 'FFFFFF'},
                objects: [
                    {'rect': {x: 0, y: 6.9, w: '100%', h: 0.6, fill: '006fba'}},
                    {'image': {x: 0.60, y: 7.0, w: 0.98, h: 0.4, path: 'img/logo-monarc.png'}},
                    {
                        'text': {
                            text: $scope.dashboard.anr['label' + $scope.dashboard.anr.language],
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
                    {'line': {x: 0.60, y: 0.80, w: 8.80, h: 0.00, line: 'FFC107', lineSize: 1}},
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
            slide[lastSlide].addText($scope.dashboard.anr['label' + $scope.dashboard.anr.language] + '\n' +
                $scope.dashboard.anr['description' + $scope.dashboard.anr.language] + '\n' +
                date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear(),
                {x: 1.50, y: 5.25, w: 5.5, h: 0.75, color: 'FFFEFE', fontSize: 20, valign: 'm'});

            charts.forEach(function (chart) {
                chart.option = angular.copy(chart.option);
                if (chart.option.chart) {
                    chart.option.chart.duration = 0;
                }

                let idOfGraph = '#loadPptx';

                if (chart.data == dataChartCartoCurrent || chart.data == dataChartCartoRiskOpCurrent) {
                    let api = $scope.graphCartographyCurrent;
                    idOfGraph = '#graphCartographyCurrent';
                    if (chart.data == dataChartCartoRiskOpCurrent) {
                        if (!$scope.dashboard.riskOp) {
                            return;
                        }
                        chart.option.chart.width = 400;
                        let cellHeight = (chart.option.chart.width - 106) / $scope.dashboard.carto.Probability.length;
                        chart.option.chart.height = ($scope.dashboard.carto.Impact.length * cellHeight) + 100;
                    } else {
                        chart.option.chart.width = document.querySelector('md-tabs').clientWidth / 2;
                        let cellHeight = (chart.option.chart.width - 106) / $scope.dashboard.carto.MxV.length;
                        chart.option.chart.height = ($scope.dashboard.carto.Impact.length * cellHeight) + 100;
                    }
                    loadGraph(api, chart.option, chart.data);
                } else if (chart.data == dataChartCartoTarget || chart.data == dataChartCartoRiskOpTarget) {
                    let api = $scope.graphCartographyTarget;
                    idOfGraph = '#graphCartographyTarget';
                    if (chart.data == dataChartCartoRiskOpTarget) {
                        if (!$scope.dashboard.riskOp) {
                            return;
                        }
                        chart.option.chart.width = 400;
                        let cellHeight = (chart.option.chart.width - 106) / $scope.dashboard.carto.Probability.length;
                        chart.option.chart.height = ($scope.dashboard.carto.Impact.length * cellHeight) + 100;
                    } else {
                        chart.option.chart.width = document.querySelector('md-tabs').clientWidth / 2;
                        let cellHeight = (chart.option.chart.width - 106) / $scope.dashboard.carto.MxV.length;
                        chart.option.chart.height = ($scope.dashboard.carto.Impact.length * cellHeight) + 100;

                    }
                    loadGraph(api, chart.option, chart.data);
                } else if (chart.title == gettextCatalog.getString('Compliance')) {
                    radarChart('#graphCompliance', chart.option, chart.data);
                    idOfGraph = '#graphCompliance';
                } else {
                    let api = $scope.loadPptx;
                    loadGraph(api, chart.option, chart.data);
                }

                if (chart.slide !== lastSlide) {
                    slide[chart.slide] = pptx.addNewSlide('MASTER_SLIDE');
                    slide[chart.slide].addText(chart.title, {placeholder: 'slideTitle'});
                }

                let node = d3.select(idOfGraph).select("svg");
                svgAsPngUri(node.node(), {fonts: []}, function (uri) {
                    slide[chart.slide].addImage({data: uri, x: chart.x, y: chart.y, w: chart.w, h: chart.h});
                    slide[chart.slide].addText(chart.subtitle, {
                        x: chart.x,
                        y: chart.y - 0.50,
                        w: chart.w,
                        align: 'center'
                    });
                })
                lastSlide = chart.slide;
            })
            $scope.loadingPptx = false;
            pptx.save('dashboard');
        }

        $scope.$watchGroup(['displayCurrentRisksBy', 'currentRisksChartOptions', 'graphCurrentRisks'], function (newValues) {
            if (newValues[0] == "level" && $scope.currentRisksChartOptions && dataChartCurrentRisksByLevel_discreteBarChart.length > 0) {
                if (newValues[1] == 'optionsCartoRisk_discreteBarChart_current') {
                    ChartService.verticalBarChart(
                      '#graphCurrentRisks',
                      dataChartCurrentRisksByLevel_discreteBarChart,
                      optionsCartoRisk_discreteBarChart_current
                    );
                }
                if (newValues[1] == 'optionsCartoRisk_pieChart') {
                  ChartService.donutChart(
                    '#graphCurrentRisks',
                    dataChartCurrentRisksByLevel_discreteBarChart,
                    optionsCartoRisk_discreteBarChart_current
                  );
                }
            }
            if (newValues[0] == "asset" && $scope.currentRisksChartOptions) {
              ChartService.multiVerticalBarChart(
                '#graphCurrentRisks',
                dataChartCurrentRisksByAsset,
                optionsChartCurrentRisksByAsset
              );
            }
            if (newValues[0] == "parentAsset" && $scope.currentRisksChartOptions) {
              ChartService.multiVerticalBarChart(
                '#graphCurrentRisks',
                dataChartCurrentRisksByParentAsset,
                optionsChartCurrentRisksByParentAsset
              );
            }
        });

        $scope.$watchGroup(['displayTargetRisksBy', 'targetRisksChartOptions', 'graphTargetRisks'], function (newValues) {
            if (newValues[0] == "level" && $scope.currentRisksChartOptions && dataChartTargetRisksByLevel_discreteBarChart.length > 0) {
                if (newValues[1] == 'optionsCartoRisk_discreteBarChart_target') {
                    ChartService.verticalBarChart(
                      '#graphTargetRisks',
                      dataChartTargetRisksByLevel_discreteBarChart,
                      optionsCartoRisk_discreteBarChart_target
                    );
                }
                if (newValues[1] == 'optionsCartoRisk_pieChart') {
                  ChartService.donutChart(
                    '#graphTargetRisks',
                    dataChartTargetRisksByLevel_discreteBarChart,
                    optionsCartoRisk_discreteBarChart_target
                  );
                }
            }
            if (newValues[0] == "asset" && $scope.targetRisksChartOptions) {
              ChartService.multiVerticalBarChart(
                '#graphTargetRisks',
                dataChartTargetRisksByAsset,
                optionsChartTargetRisksByAsset
              );
            }
            if (newValues[0] == "parentAsset" && $scope.dashboard.anr.id && $scope.targetRisksChartOptions) {
              ChartService.multiVerticalBarChart(
                '#graphTargetRisks',
                dataChartTargetRisksByParentAsset,
                optionsChartTargetRisksByParentAsset
              );
            }
        });

        $scope.$watchGroup(['displayThreatsBy', 'threatsChartOption'], function (newValue) {

          if (newValue[0] == "number") {
            dataChartThreats.map(d => {d.value = d.ocurrance; return d});
            delete optionsChartThreats_discreteBarChart.forceDomainY;
            delete optionsChartThreats_multiBarHorizontalChart.forceDomainX;
          }

          if (newValue[0] == "probability") {
             dataChartThreats.map(d => {d.value = d.average; return d});
             let threatScale = $scope.dashboard.scales.filter(d => {return d.type == "threat"})[0];
             optionsChartThreats_multiBarHorizontalChart.forceDomainX =
             optionsChartThreats_discreteBarChart.forceDomainY = {
               min : threatScale.min,
               max : threatScale.max
             };
           }

          if (newValue[0] == "max_associated_risk") {
            dataChartThreats.map(d => {d.value = d.max_risk; return d});
            delete optionsChartThreats_discreteBarChart.forceDomainY;
            delete optionsChartThreats_multiBarHorizontalChart.forceDomainX;
          }

          if (newValue[1] == 'optionsChartThreats_multiBarHorizontalChart') {
            ChartService.horizontalBarChart(
              '#graphThreats',
              dataChartThreats,
              optionsChartThreats_multiBarHorizontalChart
            );
          }else{
            ChartService.verticalBarChart(
              '#graphThreats',
              dataChartThreats,
              optionsChartThreats_discreteBarChart
            );
          }
        });

        $scope.$watchGroup(['displayVulnerabilitiesBy', 'vulnerabilitiesDisplayed', 'vulnerabilitiesChartOption'], function (newValue) {
          if (newValue[0] == "number") {
            dataChartVulnes_all.map(d => {d.value = d.ocurrance; return d});
            delete optionsChartThreats_discreteBarChart.forceDomainY;
            delete optionsChartThreats_multiBarHorizontalChart.forceDomainX;
          }

          if (newValue[0] == "qualification") {
             dataChartVulnes_all.map(d => {d.value = d.average; return d});
             let vulnerabilityScale = $scope.dashboard.scales.filter(d => {return d.type == "vulnerability"})[0];
             optionsChartThreats_multiBarHorizontalChart.forceDomainX =
             optionsChartThreats_discreteBarChart.forceDomainY = {
               min : vulnerabilityScale.min,
               max : vulnerabilityScale.max
             };
           }

          if (newValue[0] == "max_associated_risk") {
            dataChartVulnes_all.map(d => {d.value = d.max_risk; return d});
            delete optionsChartThreats_discreteBarChart.forceDomainY;
            delete optionsChartThreats_multiBarHorizontalChart.forceDomainX;
          }

          if (dataChartVulnes_all.length >= newValue[1] && newValue[1] !== "all") {
            dataChartVulnes_all.sort(function (a, b) {
              return b['value'] - a['value']
            })
            dataChartVulnes_risk = dataChartVulnes_all.slice(0, $scope.vulnerabilitiesDisplayed);
            if (optionsChartVulnerabilities_horizontalBarChart.initHeight) {
              optionsChartVulnerabilities_horizontalBarChart.height = optionsChartVulnerabilities_horizontalBarChart.initHeight;
              delete optionsChartVulnerabilities_horizontalBarChart.initHeight;
            }
            if (optionsChartVulnerabilities_discreteBarChart.initWidth ) {
                optionsChartVulnerabilities_discreteBarChart.width = optionsChartVulnerabilities_discreteBarChart.initWidth;
                delete optionsChartVulnerabilities_discreteBarChart.initWidth;
            }
          }else{
            dataChartVulnes_risk = angular.copy(dataChartVulnes_all);
          }

          if (newValue[2] == 'optionsChartVulnerabilities_horizontalBarChart') {
            if (dataChartVulnes_risk.length > 30 && optionsChartVulnerabilities_horizontalBarChart.initHeight == undefined) {
                optionsChartVulnerabilities_horizontalBarChart.initHeight = optionsChartVulnerabilities_horizontalBarChart.height;
                optionsChartVulnerabilities_horizontalBarChart.height += (dataChartVulnes_risk.length - 30) * 30;
            }
            ChartService.horizontalBarChart(
              '#graphVulnerabilities',
              dataChartVulnes_risk,
              optionsChartVulnerabilities_horizontalBarChart
            );
          }else{
            if (dataChartVulnes_risk.length > 30 && optionsChartVulnerabilities_discreteBarChart.initWidth == undefined) {
                optionsChartVulnerabilities_discreteBarChart.initWidth = optionsChartVulnerabilities_discreteBarChart.width;
                optionsChartVulnerabilities_discreteBarChart.width += (dataChartVulnes_risk.length - 30) * 10;
            }
            ChartService.verticalBarChart(
              '#graphVulnerabilities',
              dataChartVulnes_risk,
              optionsChartVulnerabilities_discreteBarChart
            );
          }
        });

        $scope.$watch('cartographyRisksType', function (newValue) {
            if (newValue == "info_risks") {
              if ($scope.dashboard.riskInfo) {
                  $scope.dashboard.cartographyRisksType = 'info_risks';
                  optionsChartCartography_current.threshold =
                  optionsChartCartography_target.threshold = [$scope.dashboard.anr.seuil1, $scope.dashboard.anr.seuil2];
                  optionsChartCartography_current.width = document.getElementById('graphCartographyCurrent').parentElement.clientWidth;
                  optionsChartCartography_target.width = document.getElementById('graphCartographyTarget').parentElement.clientWidth;
                  ChartService.heatmapChart(
                    '#graphCartographyCurrent',
                    dataChartCartoCurrent,
                    optionsChartCartography_current
                  );
                  ChartService.heatmapChart(
                    '#graphCartographyTarget',
                    dataChartCartoTarget,
                    optionsChartCartography_target
                  );
              }
            } else {
              if ($scope.dashboard.riskOp) {
                $scope.dashboard.cartographyRisksType = 'op_risk';
                optionsChartCartography_current.threshold =
                optionsChartCartography_target.threshold = [$scope.dashboard.anr.seuilRolf1, $scope.dashboard.anr.seuilRolf2];
                optionsChartCartography_current.width =
                optionsChartCartography_target.width = 400;

                ChartService.heatmapChart(
                  '#graphCartographyCurrent',
                  dataChartCartoRiskOpCurrent,
                  optionsChartCartography_current
                );
                ChartService.heatmapChart(
                  '#graphCartographyTarget',
                  dataChartCartoRiskOpTarget,
                  optionsChartCartography_target
                );
              }
            }
        });

        $scope.$watch('dashboard.refSelected', function (newValue) {
            if (newValue) {
                ChartService.radarChart('#graphCompliance',dataChartCompliance[$scope.dashboard.refSelected],optionsChartCompliance);
            }
        });


//==============================================================================

        /**
         * Update the two first charts which are displayed (the number of risk
         * by category (high, med., low) for target and current risk)
         */
        const updateCartoRisks = function (data) {

            //current risks
            //fill the bar chart
            if(!Array.isArray(data.data.carto.real.riskInfo.distrib)){
              dataChartCurrentRisksByLevel_discreteBarChart = [
                { category: gettextCatalog.getString('Low risks'),
                  value: data.data.carto.real.riskInfo.distrib[0]
                },
                { category: gettextCatalog.getString('Medium risks'),
                  value: data.data.carto.real.riskInfo.distrib[1]
                },
                { category: gettextCatalog.getString('High risks'),
                  value: data.data.carto.real.riskInfo.distrib[2]
                }
              ];

              let risksValues = dataChartCurrentRisksByLevel_discreteBarChart.map(d => d.value);
              optionsCartoRisk_discreteBarChart_current.forceDomainY.max =
              optionsCartoRisk_discreteBarChart_target.forceDomainY.max =
              risksValues.reduce((sum,d) => { return sum + d})

              ChartService.verticalBarChart(
                '#graphCurrentRisks',
                dataChartCurrentRisksByLevel_discreteBarChart,
                optionsCartoRisk_discreteBarChart_current
              );
            }

            if (!Array.isArray(data.data.carto.targeted.riskInfo.distrib)) {
                dataChartTargetRisksByLevel_discreteBarChart = [
                      { category: gettextCatalog.getString('Low risks'),
                        value: data.data.carto.targeted.riskInfo.distrib[0]
                      },
                      { category: gettextCatalog.getString('Medium risks'),
                        value: data.data.carto.targeted.riskInfo.distrib[1]
                      },
                      { category: gettextCatalog.getString('High risks'),
                        value: data.data.carto.targeted.riskInfo.distrib[2]
                      }
                ];

                ChartService.verticalBarChart(
                  '#graphTargetRisks',
                  dataChartTargetRisksByLevel_discreteBarChart,
                  optionsCartoRisk_discreteBarChart_target
                );
            }
        };

//==============================================================================

        /*
        * Update the chart of the current risks by assets
        */
        const updateCurrentRisksByAsset = function (data) {

            treshold1 = $scope.dashboard.anr.seuil1;
            treshold2 = $scope.dashboard.anr.seuil2;

            risksList = data.risks;

            dataChartCurrentRisksByAsset = [];
            risksList.forEach(function(risk) {
              if (risk.max_risk > -1) {
              let assetFound = dataChartCurrentRisksByAsset.filter(function(asset){
                  return asset.id == risk.instance
              })[0];
              if (assetFound == undefined) {
                dataChartCurrentRisksByAsset.push({
                  id : risk.instance,
                  category : $scope._langField(risk, 'instanceName'),
                  series : [
                    {label : gettextCatalog.getString("Low risks"), value : (risk.max_risk >= 0 && risk.max_risk <= treshold1) ? 1 : 0},
                    {label : gettextCatalog.getString("Medium risks"), value : (risk.max_risk <= treshold2 && risk.max_risk > treshold1) ? 1 : 0},
                    {label : gettextCatalog.getString("High risks"), value : (risk.max_risk > treshold2) ? 1 : 0}
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

//==============================================================================

        /*
        * Update the chart of the Residual risks by assets
        */
        const updateTargetRisksByAsset = function (data) {
          treshold1 = $scope.dashboard.anr.seuil1;
          treshold2 = $scope.dashboard.anr.seuil2;

          risksList = data.risks;
          dataChartTargetRisksByAsset = [];

          risksList.forEach(function(risk) {
            if (risk.max_risk > -1) {
              let assetFound = dataChartTargetRisksByAsset.filter(function(asset){
                  return asset.id == risk.instance
              })[0];
              if (assetFound == undefined) {
                dataChartTargetRisksByAsset.push({
                  id : risk.instance,
                  category : $scope._langField(risk, 'instanceName'),
                  series : [
                    {label : gettextCatalog.getString("Low risks"), value : (risk.target_risk >= 0 && risk.target_risk <= treshold1) ? 1 : 0},
                    {label : gettextCatalog.getString("Medium risks"), value : (risk.target_risk <= treshold2 && risk.target_risk > treshold1) ? 1 : 0},
                    {label : gettextCatalog.getString("High risks"), value : (risk.target_risk > treshold2) ? 1 : 0}
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

//==============================================================================

        $scope.goBackCurrentRisksParentAsset = function () { //function triggered by 'return' button : loads graph data in memory tab then deletes it
            $scope.dashboard.currentRisksBreadcrumb.pop();
            $scope.dashboard.currentRisksParentAssetMemoryTab.pop();
            dataChartCurrentRisksByParentAsset = $scope.dashboard.currentRisksParentAssetMemoryTab[$scope.dashboard.currentRisksParentAssetMemoryTab.length - 1];
            ChartService.multiVerticalBarChart(
              '#graphCurrentRisks',
              dataChartCurrentRisksByParentAsset,
              optionsChartCurrentRisksByParentAsset
            );
        }

        $scope.breadcrumbGoBackCurrentRisksParentAsset = function (id) { //function triggered with the interactive breadcrumb : id is held by the button
            if ($scope.dashboard.currentRisksBreadcrumb.length > 4) {
                dataChartCurrentRisksByParentAsset = $scope.dashboard.currentRisksParentAssetMemoryTab[id + $scope.dashboard.currentRisksBreadcrumb.length - 4];
                $scope.dashboard.currentRisksParentAssetMemoryTab = $scope.dashboard.currentRisksParentAssetMemoryTab.slice(0, id + $scope.dashboard.currentRisksBreadcrumb.length - 3); //only keep elements before the one we display
                $scope.dashboard.currentRisksBreadcrumb = $scope.dashboard.currentRisksBreadcrumb.slice(0, id + $scope.dashboard.currentRisksBreadcrumb.length - 3);
                ChartService.multiVerticalBarChart(
                  '#graphCurrentRisks',
                  dataChartCurrentRisksByParentAsset,
                  optionsChartCurrentRisksByParentAsset
                );
            } else {
                dataChartCurrentRisksByParentAsset = $scope.dashboard.currentRisksParentAssetMemoryTab[id];
                $scope.dashboard.currentRisksParentAssetMemoryTab = $scope.dashboard.currentRisksParentAssetMemoryTab.slice(0, id + 1); //only keep elements before the one we display
                $scope.dashboard.currentRisksBreadcrumb = $scope.dashboard.currentRisksBreadcrumb.slice(0, id + 1);
                ChartService.multiVerticalBarChart(
                  '#graphCurrentRisks',
                  dataChartCurrentRisksByParentAsset,
                  optionsChartCurrentRisksByParentAsset
                );
            }
        }

        //======================================================================

        $scope.goBackTargetRisksParentAsset = function () { //function triggered by 'return' button : loads graph data in memory tab then deletes it
            $scope.dashboard.targetRisksBreadcrumb.pop();
            $scope.dashboard.targetRisksParentAssetMemoryTab.pop();
            dataChartTargetRisksByParentAsset = $scope.dashboard.targetRisksParentAssetMemoryTab[$scope.dashboard.targetRisksParentAssetMemoryTab.length - 1];
            ChartService.multiVerticalBarChart(
              '#graphTargetRisks',
              dataChartTargetRisksByParentAsset,
              optionsChartTargetRisksByParentAsset
            );
        }

        $scope.breadcrumbGoBackTargetRisksParentAsset = function (id) { //function triggered with the interactive breadcrumb : id is held by the button
            if ($scope.dashboard.targetRisksBreadcrumb.length > 4) {
                dataChartTargetRisksByParentAsset = $scope.dashboard.targetRisksParentAssetMemoryTab[id + $scope.dashboard.targetRisksBreadcrumb.length - 4];
                $scope.dashboard.targetRisksParentAssetMemoryTab = $scope.dashboard.targetRisksParentAssetMemoryTab.slice(0, id + $scope.dashboard.targetRisksBreadcrumb.length - 3); //only keep elements before the one we display
                $scope.dashboard.targetRisksBreadcrumb = $scope.dashboard.targetRisksBreadcrumb.slice(0, id + $scope.dashboard.targetRisksBreadcrumb.length - 3);
                ChartService.multiVerticalBarChart(
                  '#graphTargetRisks',
                  dataChartTargetRisksByParentAsset,
                  optionsChartTargetRisksByParentAsset
                );
            } else {
                dataChartTargetRisksByParentAsset = $scope.dashboard.targetRisksParentAssetMemoryTab[id];
                $scope.dashboard.targetRisksParentAssetMemoryTab = $scope.dashboard.targetRisksParentAssetMemoryTab.slice(0, id + 1); //only keep elements before the one we display
                $scope.dashboard.targetRisksBreadcrumb = $scope.dashboard.targetRisksBreadcrumb.slice(0, id + 1);
                ChartService.multiVerticalBarChart(
                  '#graphTargetRisks',
                  dataChartTargetRisksByParentAsset,
                  optionsChartTargetRisksByParentAsset
                );
            }
        }

//==============================================================================

        /*
        * Update the chart of the Residual risks by assets
        */
        const updateCurrentRisksByParentAsset = function (data) {
            let promise = $q.defer();

            //Data model for the graph of current risk by parent asset
            dataChartCurrentRisksByParentAsset = [];

            treshold1 = $scope.dashboard.anr.seuil1;
            treshold2 = $scope.dashboard.anr.seuil2;

            data.forEach(function(instance,index,instances){
              AnrService.getInstanceRisks($scope.dashboard.anr.id, instance.id, {limit: -1}).then(function (data) {
                let parent = {
                  id: instance.id,
                  category: $scope._langField(instance, 'name'),
                  isparent : (instance.parent == 0) ? true : false,
                  child : instance.child,
                  series : [
                    {label : gettextCatalog.getString("Low risks"), value : 0},
                    {label : gettextCatalog.getString("Medium risks"), value :0},
                    {label : gettextCatalog.getString("High risks"), value : 0}
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
                dataChartCurrentRisksByParentAsset.push(data);
                if (dataChartCurrentRisksByParentAsset.length == instances.length) {
                  dataChartCurrentRisksByParentAsset.sort(function (a, b) {
                      return a.category.localeCompare(b.category)
                  }),
                  promise.resolve(dataChartCurrentRisksByParentAsset);
                }
              });
          })

          return promise.promise;
        }

//==============================================================================

        /*
        * Update the chart of the Residual risks by assets
        */
        const updateTargetRisksByParentAsset = function (data) {
            const promise = $q.defer();

            dataChartTargetRisksByParentAsset = [];

            treshold1 = $scope.dashboard.anr.seuil1;
            treshold2 = $scope.dashboard.anr.seuil2;

            data.forEach(function(instance,index,instances){
              AnrService.getInstanceRisks($scope.dashboard.anr.id, instance.id, {limit: -1}).then(function (data) {
                let parent = {
                  id: instance.id,
                  category: $scope._langField(instance, 'name'),
                  isparent : (instance.parent == 0) ? true : false,
                  child : instance.child,
                  series : [
                    {label : gettextCatalog.getString("Low risks"), value : 0},
                    {label : gettextCatalog.getString("Medium risks"), value :0},
                    {label : gettextCatalog.getString("High risks"), value : 0}
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
                dataChartTargetRisksByParentAsset.push(data);
                if (dataChartTargetRisksByParentAsset.length == instances.length) {
                  dataChartTargetRisksByParentAsset.sort(function (a, b) {
                      return a.category.localeCompare(b.category)
                  }),
                  promise.resolve(dataChartTargetRisksByParentAsset);
                }
              });
          })

          return promise.promise;
        }


//==============================================================================

        /*
        * Update the chart of the number of threats by threat type
        */
        const updateThreats = function (data) {

            let risksList = data.risks;
            dataChartThreats = [];

            risksList.sort(function (a, b) {
                return b['max_risk'] - a['max_risk']
            })

            risksList.forEach(function (risk) {
              if (risk.max_risk > -1) {
                let threatFound = dataChartThreats.filter(function(threat){
                    return threat.id == risk.threat
                })[0];
                  if (threatFound == undefined) {
                    dataChartThreats.push({
                      id : risk.threat,
                      category : $scope._langField(risk, 'threatLabel'),
                      ocurrance : 1,
                      value : null,
                      average : risk.threatRate,
                      max_risk : risk.max_risk
                    })
                  } else {
                    threatFound.ocurrance += 1;
                    threatFound.average *= (threatFound.ocurrance - 1);
                    threatFound.average += risk.threatRate;
                    threatFound.average = threatFound.average/ threatFound.ocurrance;
                  }
              }
            });

            if ($scope.displayThreatsBy == "number") {
              dataChartThreats.map(d => {d.value = d.ocurrance; return d});
              delete optionsChartThreats_discreteBarChart.forceDomainY;
              delete optionsChartThreats_multiBarHorizontalChart.forceDomainX;
            }

            if ($scope.displayThreatsBy == "probability") {
               dataChartThreats.map(d => {d.value = d.average; return d});
               let threatScale = $scope.dashboard.scales.filter(d => {return d.type == "threat"})[0];
               optionsChartThreats_multiBarHorizontalChart.forceDomainX =
               optionsChartThreats_discreteBarChart.forceDomainY = {
                 min : threatScale.min,
                 max : threatScale.max
               };
             }

            if ($scope.displayThreatsBy == "max_associated_risk") {
              dataChartThreats.map(d => {d.value = d.max_risk; return d});
              delete optionsChartThreats_discreteBarChart.forceDomainY;
              delete optionsChartThreats_multiBarHorizontalChart.forceDomainX;
            }

            if ($scope.threatsChartOption == 'optionsChartThreats_multiBarHorizontalChart') {
              ChartService.horizontalBarChart(
                '#graphThreats',
                dataChartThreats,
                optionsChartThreats_multiBarHorizontalChart
              );
            }else{
              ChartService.verticalBarChart(
                '#graphThreats',
                dataChartThreats,
                optionsChartThreats_discreteBarChart
              );
            }
        };

//==============================================================================

        /*
        * Update the chart of the number of the top 5 vulnerabilities by vulnerabilities type
        */
        const updateVulnerabilities = function (data) {

            let risksList = data.risks;

            dataChartVulnes_risk = [];
            dataChartVulnes_all = [];


            risksList.forEach(function (risk) {
              if (risk.max_risk > -1) {
                let vulnerabilityFound = dataChartVulnes_all.filter(function(vulnerability){
                    return vulnerability.id == risk.vulnerability
                })[0];
                  if (vulnerabilityFound == undefined) {
                    dataChartVulnes_all.push({
                      id : risk.vulnerability,
                      category : $scope._langField(risk, 'vulnLabel'),
                      ocurrance : 1,
                      value : null,
                      average : risk.vulnerabilityRate,
                      max_risk : risk.max_risk
                    })
                  } else {
                    vulnerabilityFound.ocurrance += 1;
                    vulnerabilityFound.average *= (vulnerabilityFound.ocurrance - 1);
                    vulnerabilityFound.average += risk.vulnerabilityRate;
                    vulnerabilityFound.average = vulnerabilityFound.average/ vulnerabilityFound.ocurrance;
                  }
              }
            });

            if ($scope.displayVulnerabilitiesBy == "number") {
              dataChartVulnes_all.map(d => {d.value = d.ocurrance; return d});
              delete optionsChartThreats_discreteBarChart.forceDomainY;
              delete optionsChartThreats_multiBarHorizontalChart.forceDomainX;
            }

            if ($scope.displayVulnerabilitiesBy == "qualification") {
               dataChartVulnes_all.map(d => {d.value = d.average; return d});
               let vulnerabilityScale = $scope.dashboard.scales.filter(d => {return d.type == "vulnerability"})[0];
               optionsChartThreats_multiBarHorizontalChart.forceDomainX =
               optionsChartThreats_discreteBarChart.forceDomainY = {
                 min : vulnerabilityScale.min,
                 max : vulnerabilityScale.max
               };
             }

            if ($scope.displayVulnerabilitiesBy == "max_associated_risk") {
              dataChartVulnes_all.map(d => {d.value = d.max_risk; return d});
              delete optionsChartThreats_discreteBarChart.forceDomainY;
              delete optionsChartThreats_multiBarHorizontalChart.forceDomainX;
            }

            if (dataChartVulnes_all.length >= $scope.vulnerabilitiesDisplayed && $scope.vulnerabilitiesDisplayed !== "all") {
                dataChartVulnes_all.sort(function (a, b) {
                  return b['value'] - a['value']
                })
                dataChartVulnes_risk = dataChartVulnes_all.slice(0, $scope.vulnerabilitiesDisplayed);
                if (optionsChartVulnerabilities_horizontalBarChart.initHeight) {
                  optionsChartVulnerabilities_horizontalBarChart.height = optionsChartVulnerabilities_horizontalBarChart.initHeight;
                  delete optionsChartVulnerabilities_horizontalBarChart.initHeight;
                }
                if (optionsChartVulnerabilities_discreteBarChart.initWidth) {
                    optionsChartVulnerabilities_discreteBarChart.width = optionsChartVulnerabilities_discreteBarChart.initWidth;
                    delete optionsChartVulnerabilities_discreteBarChart.initWidth;
                }
            }else{
              dataChartVulnes_risk = angular.copy(dataChartVulnes_all);
            }


            if ($scope.vulnerabilitiesChartOption == 'optionsChartVulnerabilities_horizontalBarChart') {
              if (dataChartVulnes_risk.length > 30 && optionsChartVulnerabilities_horizontalBarChart.initHeight == undefined) {
                  optionsChartVulnerabilities_horizontalBarChart.initHeight = optionsChartVulnerabilities_horizontalBarChart.height;
                  optionsChartVulnerabilities_horizontalBarChart.height += (dataChartVulnes_risk.length - 30) * 30;
              }
              ChartService.horizontalBarChart(
                '#graphVulnerabilities',
                dataChartVulnes_risk,
                optionsChartVulnerabilities_horizontalBarChart
              );
            }else{
              if (dataChartVulnes_risk.length > 30 && optionsChartVulnerabilities_discreteBarChart.initWidth == undefined) {
                  optionsChartVulnerabilities_discreteBarChart.initWidth = optionsChartVulnerabilities_discreteBarChart.width;
                  optionsChartVulnerabilities_discreteBarChart.width += (dataChartVulnes_risk.length - 30) * 10;
              }
              ChartService.verticalBarChart(
                '#graphVulnerabilities',
                dataChartVulnes_risk,
                optionsChartVulnerabilities_discreteBarChart
              );
            }


        };

//==============================================================================

        /*
        * Update the data for the cartography
        */
        const updateCartography = function (data) {
            dataChartCartoCurrent = [];
            dataChartCartoTarget = [];
            dataChartCartoRiskOpCurrent = [];
            dataChartCartoRiskOpTarget = [];

            let impacts = data.data.carto.real.Impact;
            let likelihoods = data.data.carto.real.MxV;
            let probabilities = data.data.carto.real.Probability;
            let countersCurrent = data.data.carto.real.riskInfo.counters;
            let countersTarget = data.data.carto.targeted.riskInfo.counters;
            let countersRiskOpCurrent = data.data.carto.real.riskOp.counters;
            let countersRiskOpTarget = data.data.carto.targeted.riskOp.counters;

            optionsChartCartography_current.threshold =
            optionsChartCartography_target.threshold = [$scope.dashboard.anr.seuil1, $scope.dashboard.anr.seuil2];

            impacts.forEach(function (impact) {
                likelihoods.forEach(function (likelihood) {
                    dataChartCartoCurrent.push({
                        y: impact,
                        x: likelihood,
                        value: (countersCurrent[impact] !== undefined && countersCurrent[impact][likelihood] !== undefined) ?
                                countersCurrent[impact][likelihood] :
                                null
                    })

                    dataChartCartoTarget.push({
                        y: impact,
                        x: likelihood,
                        value: (countersTarget[impact] !== undefined && countersTarget[impact][likelihood] !== undefined) ?
                                countersTarget[impact][likelihood] :
                                null
                    })
                });
                probabilities.forEach(function (likelihood) {
                    dataChartCartoRiskOpCurrent.push({
                        y: impact,
                        x: likelihood,
                        value: (countersRiskOpCurrent[impact] !== undefined && countersRiskOpCurrent[impact][likelihood] !== undefined) ?
                                countersRiskOpCurrent[impact][likelihood] :
                                null
                    })

                    dataChartCartoRiskOpTarget.push({
                        y: impact,
                        x: likelihood,
                        value: (countersRiskOpTarget[impact] !== undefined && countersRiskOpTarget[impact][likelihood] !== undefined) ?
                                countersRiskOpTarget[impact][likelihood] :
                                null
                    })
                });
            })
        };

//==============================================================================

        /*
        * Update the data for the compliance
        */
        const updateCompliance = function (referentials, categories, data) {
            let categoriesIds = data.map(soa => soa.measure.category.id);
            referentials.forEach(function (ref) {
              dataChartCompliance[ref.uuid] = [
                {
                  category : gettextCatalog.getString("Current level"),
                  series : []
                },
                {
                  category : gettextCatalog.getString("Applicable target level"),
                  series : []
                }
              ];
                categories
                    .filter(category => category.referential.uuid == ref.uuid && categoriesIds.includes(category.id))
                    .forEach(function (cat) {
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

                        currentSoas.forEach(function (soa) {
                            if (soa.EX == 1) {
                                soa.compliance = 0;
                            }
                            controlCurrentData.push(
                              { label: soa.measure.code, value: (soa.compliance * 0.2).toFixed(2) }
                            )
                            controlTargetData.push(
                              { label: soa.measure.code, value: ((soa.EX == 1) ? 0 : 1) }
                            )
                        });

                        catCurrentData.data.push(
                          {
                            category : gettextCatalog.getString("Current level"),
                            series : controlCurrentData
                          }
                        );

                        catTargetData.data.push(
                          {
                            category : gettextCatalog.getString("Applicable target level"),
                            series : controlTargetData
                          }
                        );

                        let complianceCurrentValues = currentSoas.map(soa => soa.compliance);
                        let sum = complianceCurrentValues.reduce(function (a, b) {
                            return a + b;
                        }, 0);
                        let currentAvg = (sum / complianceCurrentValues.length) * 0.2;
                        let targetAvg = (targetSoas.length / complianceCurrentValues.length);
                        catCurrentData.value = currentAvg.toFixed(2);
                        catTargetData.value = targetAvg.toFixed(2);

                        dataChartCompliance[ref.uuid][0].series.push(catCurrentData);
                        dataChartCompliance[ref.uuid][1].series.push(catTargetData);
                    })
            });
        }
    }
})();

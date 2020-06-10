(function () {
    angular
        .module('ClientApp')
        .controller('ClientDashboardCtrl', [
            '$scope', '$state', '$http', 'gettextCatalog', 'toastr', '$rootScope', '$q', '$timeout',
            '$stateParams', 'AnrService', 'ClientAnrService', 'ReferentialService', 'SOACategoryService',
            'ClientSoaService', ClientDashboardCtrl
        ]);

    /**
     * Dashboard Controller for the Client module
     */
    function ClientDashboardCtrl($scope, $state, $http, gettextCatalog, toastr, $rootScope, $q, $timeout,
                                 $stateParams, AnrService, ClientAnrService, ReferentialService, SOACategoryService,
                                 ClientSoaService) {

        $scope.dashboard = {
            anr: null,
            data: [],
            riskInfo: false,
            riskOp: false,
            currentTabIndex: 0,
            deepGraph: false,
            refSelected: null,
            cartographyRisksType: 'info_risks',
            carto: null
        };

//==============================================================================

        //init default value to avoid errors
        $scope.initOption = $scope.initOptionBis = {
            chart: {
                type: 'discreteBarChart',
            },
        };


        // init default datas to avoid errors
        $scope.initData = $scope.initDataBis = [];
        $scope.initDataCartoCurrent = $scope.initDataCartoTarget = [];

//==============================================================================


        //The two following arrays are used for the breadcrumb for parent asset charts

        $scope.dashboard.currentRisksBreadcrumb = [gettextCatalog.getString("Overview")];
        $scope.dashboard.targetRisksBreadcrumb = [gettextCatalog.getString("Overview")];

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
                    optionsChartCartography_current.chart.width = document.getElementById('graphCartographyCurrent').parentElement.clientWidth;
                    optionsChartCartography_target.chart.width = document.getElementById('graphCartographyTarget').parentElement.clientWidth;
                    const cellHeight = (optionsChartCartography_target.chart.width - 106) / $scope.dashboard.carto.MxV.length;
                    optionsChartCartography_current.chart.height = optionsChartCartography_target.chart.height = ($scope.dashboard.carto.Impact.length * cellHeight) + 100;
                    loadGraph($scope.graphCartographyCurrent, optionsChartCartography_current, dataChartCartoCurrent);
                    loadGraph($scope.graphCartographyTarget, optionsChartCartography_target, dataChartCartoTarget);

                }
            } else {
                if ($scope.dashboard.riskOp) {
                    optionsChartCartography_target.chart.width = 400;
                    optionsChartCartography_current.chart.width = 400;
                    const cellHeight = (optionsChartCartography_target.chart.width - 106) / $scope.dashboard.carto.Probability.length;
                    optionsChartCartography_current.chart.height = optionsChartCartography_target.chart.height = ($scope.dashboard.carto.Impact.length * cellHeight) + 100;
                    loadGraph($scope.graphCartographyCurrent, optionsChartCartography_current, dataChartCartoRiskOpCurrent);
                    loadGraph($scope.graphCartographyTarget, optionsChartCartography_target, dataChartCartoRiskOpTarget);
                }
            }
        };

        $scope.selectGraphCompliance = function () { //Displays the Compliance tab
            if (!$scope.dashboard.deepGraph) {
                document.getElementById("goBack").style.visibility = 'hidden';
            }
            if ($scope.dashboard.refSelected) {
                radarChart('#graphCompliance', optionsChartCompliance, dataChartCompliance[$scope.dashboard.refSelected], true);
            }
            $scope.loadCompliance = true;
        };

        $scope.selectGraphPerspective = function () { //Displays the persepctive charts

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
            chart: {
                type: 'discreteBarChart',
                height: 450,
                width: 450,
                margin: {
                    top: 20,
                    right: 20,
                    bottom: 50,
                    left: 55
                },
                x: function (d) {
                    return d.label;
                },
                y: function (d) {
                    return d.value;
                },
                showValues: true,
                valueFormat: function (d) {
                    return (d);
                },
                duration: 500,
                xAxis: {
                    axisLabel: ''
                },
                yAxis: {
                    axisLabel: gettextCatalog.getString('Current risks'),
                    axisLabelDistance: -10,
                    tickFormat: function (d) { //display only integers
                        if (Math.floor(d) != d) {
                            return;
                        }

                        return d;
                    }
                }
            }
        };

        //Options of the chart that displays Residual risks by level
        const optionsCartoRisk_discreteBarChart_target = {
            chart: {
                type: 'discreteBarChart',
                height: 450,
                width: 450,
                margin: {
                    top: 20,
                    right: 20,
                    bottom: 50,
                    left: 55
                },
                x: function (d) {
                    return d.label;
                },
                y: function (d) {
                    return d.value;
                },
                showValues: true,
                valueFormat: function (d) {
                    return (d);
                },
                duration: 500,
                xAxis: {
                    axisLabel: ''
                },
                yAxis: {
                    axisLabel: gettextCatalog.getString('Residual risks'),
                    axisLabelDistance: -10,
                    tickFormat: function (d) { //display only integers
                        if (Math.floor(d) != d) {
                            return;
                        }
                        return d;
                    }
                }
            }
        };

//==============================================================================

        //Options for the pie chart for current risks
        const optionsCartoRisk_pieChart = {
            chart: {
                type: "pieChart",
                height: 650,
                width: 450,
                duration: 500,
                showLabels: true,
                labelType: "value",
                objectEquality: true,
                donut: true,
                donutRatio: 0.60,
                valueFormat: function (d) {
                    return (d);
                },
                x: function (d) {
                    return d.label;
                },
                y: function (d) {
                    return d.value;
                },
            }
        };

//==============================================================================

        //Options for the chart that displays the current risks by asset
        const optionsChartCurrentRisksByAsset = {
            chart: {
                type: 'multiBarChart',
                height: 850,
                width: 450,
                margin: {
                    top: 0,
                    right: 20,
                    bottom: 250,
                    left: 45
                },
                multibar: {
                    dispatch: { //on click switch to the evaluated risk
                        elementClick: function (e) {
                            $state.transitionTo("main.project.anr.instance", {
                                modelId: $scope.dashboard.anr.id,
                                instId: e.data.id
                            }, {notify: true, relative: null, location: true, inherit: false, reload: true});
                        }
                    }
                },
                clipEdge: true,
                //staggerLabels: true,
                duration: 500,
                stacked: true,
                reduceXTicks: false,
                staggerLabels: false,
                wrapLabels: false,
                xAxis: {
                    showMaxMin: false,
                    rotateLabels: 90,
                    height: 150,
                    tickFormat: function (d) {
                        return (d);
                    }
                },
                yAxis: {
                    axisLabel: gettextCatalog.getString('Current risk'),
                    axisLabelDistance: -20,
                    tickFormat: function (d) {
                        return (d);
                    }
                }
            },
        };

//==============================================================================

        const optionsChartTargetRisksByAsset = {
            chart: {
                type: 'multiBarChart',
                height: 850,
                width: 450,
                margin: {
                    top: 0,
                    right: 20,
                    bottom: 250,
                    left: 45
                },
                multibar: {
                    dispatch: { //on click switch to the evaluated risk
                        elementClick: function (e) {
                            $state.transitionTo("main.project.anr.instance", {
                                modelId: $scope.dashboard.anr.id,
                                instId: e.data.id
                            }, {notify: true, relative: null, location: true, inherit: false, reload: true});
                        }
                    }
                },

                clipEdge: true,
                //staggerLabels: true,
                duration: 500,
                stacked: true,
                reduceXTicks: false,
                staggerLabels: false,
                wrapLabels: false,
                xAxis: {
                    showMaxMin: false,
                    rotateLabels: 90,
                    height: 150,
                    tickFormat: function (d) {
                        return (d);
                    }
                },
                yAxis: {
                    axisLabel: gettextCatalog.getString('Residual risks'),
                    axisLabelDistance: -20,
                    tickFormat: function (d) {
                        return (d);
                    }
                }
            },
        };

//==============================================================================

        //Options for the charts that display the risks by parent asset
        const optionsChartCurrentRisksByParentAsset = {
            chart: {
                type: 'multiBarChart',
                height: 850,
                width: 450,
                margin: {
                    top: 0,
                    right: 20,
                    bottom: 250,
                    left: 45
                },
                multibar: {
                    dispatch: {
                        elementClick: function (element) { //on click go one child deeper (node) or go to MONARC (leaf)
                            if (element.data.child.length > 0) {
                                updateCurrentRisksByParentAsset(element.data.child).then(function () {
                                    $scope.dashboard.currentRisksBreadcrumb.push(element.data.x);
                                    $scope.dashboard.currentRisksParentAssetMemoryTab.push(dataChartCurrentRisksByParentAsset);
                                    const maxValue = calculateAxisY(dataChartCurrentRisksByParentAsset);
                                    optionsChartCurrentRisksByParentAsset.chart.forceY = [0, Math.max(...maxValue)];
                                    loadGraph($scope.graphCurrentRisks, optionsChartCurrentRisksByParentAsset, dataChartCurrentRisksByParentAsset);
                                });
                            } else {
                                $state.transitionTo("main.project.anr.instance", {
                                    modelId: $scope.dashboard.anr.id,
                                    instId: element.data.asset_id
                                }, {notify: true, relative: null, location: true, inherit: false, reload: true});
                            }
                        }
                    }
                },

                clipEdge: true,
                //staggerLabels: true,
                duration: 500,
                stacked: false,
                reduceXTicks: false,
                staggerLabels: false,
                wrapLabels: false,
                xAxis: {
                    showMaxMin: false,
                    rotateLabels: 90,
                    height: 150,
                    tickFormat: function (d) {
                        return (d);
                    }
                },
                yAxis: {
                    axisLabel: gettextCatalog.getString("Current risks"),
                    axisLabelDistance: -20,
                    tickFormat: function (d) { //display only integers
                        if (Math.floor(d) != d) {
                            return;
                        }

                        return d;
                    }
                }
            },
        };

//==============================================================================

        //Options for the charts that display the risks by parent asset
        const optionsChartTargetRisksByParentAsset = {
            chart: {
                type: 'multiBarChart',
                height: 850,
                width: 450,
                margin: {
                    top: 0,
                    right: 20,
                    bottom: 250,
                    left: 45
                },
                multibar: {
                    dispatch: { //on click go one child deeper (node) or go to MONARC (leaf)
                        elementClick: function (element) {
                            if (element.data.child.length > 0) {
                                updateTargetRisksByParentAsset(element.data.child).then(function () {
                                    $scope.dashboard.targetRisksBreadcrumb.push(element.data.x);
                                    $scope.dashboard.targetRisksParentAssetMemoryTab.push(dataChartTargetRisksByParentAsset);
                                    const maxValue = calculateAxisY(dataChartTargetRisksByParentAsset);
                                    optionsChartTargetRisksByParentAsset.chart.forceY = [0, Math.max(...maxValue)];
                                    loadGraph($scope.graphTargetRisks, optionsChartTargetRisksByParentAsset, dataChartTargetRisksByParentAsset);
                                });
                            } else {
                                $state.transitionTo("main.project.anr.instance", {
                                    modelId: $scope.dashboard.anr.id,
                                    instId: element.data.asset_id
                                }, {notify: true, relative: null, location: true, inherit: false, reload: true});
                            }
                        }
                    }
                },

                clipEdge: true,
                //staggerLabels: true,
                duration: 500,
                stacked: false,
                reduceXTicks: false,
                staggerLabels: false,
                wrapLabels: false,
                xAxis: {
                    showMaxMin: false,
                    rotateLabels: 90,
                    height: 150,
                    tickFormat: function (d) {
                        return (d);
                    }
                },
                yAxis: {
                    axisLabel: gettextCatalog.getString("Residual risks"),
                    axisLabelDistance: -20,
                    tickFormat: function (d) { //display only integers
                        if (Math.floor(d) != d) {
                            return;
                        }

                        return d;
                    }
                }
            },
        };

//==============================================================================

        //Options for the chart that displays threats by their number of occurrences
        const optionsChartThreats_discreteBarChart = {
            chart: {
                type: 'discreteBarChart',
                height: 800,
                width: 1400,
                margin: {
                    top: 20,
                    right: 250,
                    bottom: 200,
                    left: 45
                },
                discretebar: {
                    dispatch: { //on click switch to the evaluated risk
                        elementClick: function (e) {
                            // let keywords=e.data.x.replace(/ /g,"+");
                            // let params = angular.copy($scope.risks_filters);
                            // let anr = 'anr';
                            // if ($scope.OFFICE_MODE == 'FO') {
                            //     anr = 'client-anr';
                            // }
                            // //$http.get("api/" + anr + "/" + $scope.dashboard.anr + "/risks?keywords=" + keywords + "&" + $scope.serializeQueryString(params)).then(function (data) {
                            // $state.transitionTo("main.project.anr", {modelId: $scope.dashboard.anr});
                        }
                    }
                },
                clipEdge: true,
                //staggerLabels: true,
                duration: 500,
                stacked: true,
                reduceXTicks: false,
                staggerLabels: false,
                wrapLabels: false,
                showValues: true,
                valueFormat: function (d) {
                    return (Math.round(d * 100) / 100);
                },
                xAxis: {
                    tickDecimals: 0,
                    showMaxMin: false,
                    rotateLabels: 30,
                    height: 150,
                    tickFormat: function (d) {
                        return (d);
                    }
                },
                yAxis: {
                    axisLabelDistance: -20,
                    tickFormat: function (d) { //display only integers
                        if (Math.floor(d) != d) {
                            return;
                        }

                        return d;
                    }
                }
            },
        };

        //Options for the chart that displays threats by their number of occurrences
        const optionsChartThreats_multiBarHorizontalChart = {
            chart: {
                type: 'multiBarHorizontalChart',
                height: 800,
                width: 1400,
                margin: {
                    top: 20,
                    right: 250,
                    bottom: 200,
                    left: 400
                },
                barColor: (d3.scale.category20().range()),
                multibar: {
                    dispatch: { //on click switch to the evaluated risk
                        elementClick: function (e) {
                            // let keywords=e.data.x.replace(/ /g,"+");
                            // let params = angular.copy($scope.risks_filters);
                            // let anr = 'anr';
                            // if ($scope.OFFICE_MODE == 'FO') {
                            //     anr = 'client-anr';
                            // }
                            // //$http.get("api/" + anr + "/" + $scope.dashboard.anr + "/risks?keywords=" + keywords + "&" + $scope.serializeQueryString(params)).then(function (data) {
                            // $state.transitionTo("main.project.anr", {modelId: $scope.dashboard.anr});
                        }
                    }
                },
                clipEdge: true,
                //staggerLabels: true,
                duration: 500,
                stacked: false,
                showLegend: false,
                showControls: false,
                reduceXTicks: false,
                staggerLabels: false,
                wrapLabels: false,
                showValues: true,
                valueFormat: function (d) {
                    return (Math.round(d * 100) / 100);
                },
                xAxis: {
                    tickDecimals: 0,
                    showMaxMin: false,
                    rotateLabels: 30,
                    height: 150,
                    tickFormat: function (d) {
                        return (d);
                    }
                },
                yAxis: {
                    axisLabelDistance: -10,
                    tickFormat: function (d) { //display only integers
                        if (Math.floor(d) != d) {
                            return;
                        }

                        return d;
                    }
                }
            },
        };

//==============================================================================

        //Options for the chart that displays vulnerabilities by their maximum associated risk
        const optionsChartVulnerabilities_discreteBarChart = {
            chart: {
                type: 'discreteBarChart',
                height: 800,
                width: 1400,
                margin: {
                    top: 20,
                    right: 250,
                    bottom: 300,
                    left: 45
                },
                clipEdge: true,
                //staggerLabels: true,
                duration: 500,
                stacked: true,
                reduceXTicks: false,
                staggerLabels: false,
                wrapLabels: false,
                y: function (d) {
                    return d.y
                },
                showValues: true,
                valueFormat: function (d) {
                    return (Math.round(d * 100) / 100);
                },
                xAxis: {
                    showMaxMin: false,
                    rotateLabels: 45,
                    height: 150,
                    tickFormat: function (d) {
                        return (d);
                    }
                },
                yAxis: {
                    axisLabel: "",
                    axisLabelDistance: -20,
                    tickFormat: function (d) { //display only integers
                        if (Math.floor(d) != d) {
                            return;
                        }

                        return d;
                    }
                }
            },
        }

        const optionsChartVulnerabilities_horizontalBarChart = {
            chart: {
                type: 'multiBarHorizontalChart',
                height: 800,
                width: 1400,
                margin: {
                    top: 20,
                    right: 250,
                    bottom: 100,
                    left: 400
                },
                barColor: (d3.scale.category20().range()),
                clipEdge: true,
                //staggerLabels: true,
                duration: 500,
                stacked: false,
                showLegend: false,
                showControls: false,
                reduceXTicks: false,
                staggerLabels: false,
                wrapLabels: false,
                showValues: true,
                valueFormat: function (d) {
                    return (Math.round(d * 100) / 100);
                },
                xAxis: {
                    showMaxMin: false,
                    rotateLabels: 45,
                    height: 150,
                    tickFormat: function (d) {
                        return (d);
                    }
                },
                yAxis: {
                    axisLabelDistance: -10,
                    tickFormat: function (d) { //display only integers
                        if (Math.floor(d) != d) {
                            return;
                        }

                        return d;
                    }
                }
            },
        }

//==============================================================================

        //Options for the chart that displays the cartography
        const optionsChartCartography_current = {
            chart: {
                type: "heatMapChart",
                height: window.outerHeight * 0.5,
                width: 600,
                x: function (d) {
                    return d.likelihood
                },
                y: function (d) {
                    return d.impact
                },
                cellValue: function (d) {
                    return d.risks
                },
                cellAspectRatio: 1,
                colorRange: ["#D6F107", "#FFBC1C", "#FD661F"],
                highContrastText: false,
                showLegend: false,
                showCellValues: true,
                alignXAxis: 'top',
                alignYAxis: 'left',
                xAxis: {
                    axisLabel: gettextCatalog.getString('Likelihood'),
                    axisLabelDistance: 40,
                },
                yAxis: {
                    axisLabel: gettextCatalog.getString('Impact'),
                    axisLabelDistance: -30,
                },
                tooltip: {
                    headerEnabled: false,
                },
                cellValueFormat: function (d) {
                    return (d)
                },
                cellRadius: 1,
                margin: {top: 50, right: 50},
                duration: 5,
                dispatch: {
                    renderEnd: function () {
                        //Set width
                        if ($scope.dashboard.cartographyRisksType == 'info_risks') {
                            optionsChartCartography_current.chart.width = document.getElementById('graphCartographyCurrent').parentElement.clientWidth;
                            let cellHeight = (optionsChartCartography_current.chart.width - 106) / $scope.dashboard.carto.MxV.length;
                            optionsChartCartography_current.chart.height = ($scope.dashboard.carto.Impact.length * cellHeight) + 100;
                        }

                        if ($scope.dashboard.cartographyRisksType == 'op_risk') {
                            let cellHeight = (optionsChartCartography_current.chart.width - 106) / $scope.dashboard.carto.Probability.length;
                            optionsChartCartography_current.chart.height = ($scope.dashboard.carto.Impact.length * cellHeight) + 100;
                        }

                        // Fix bug HeatMapChatr.js#294
                        d3.selectAll(".nv-axis").selectAll("line").style("stroke-opacity", 1);
                        let attributeD = d3.select('#graphTargetRisks').select('svg').selectAll('.nv-y').select('path.domain').attr('d');
                        d3.select('#graphCurrentRisks')
                            .select('svg').selectAll('.nv-y')
                            .append('path').attr('d', attributeD);

                        let g = d3.select('#graphCartographyCurrent').select('svg');
                        let dataGraph = g.data();
                        let nbRiskMax = Math.max.apply(Math, dataGraph[0].map(function (row) {
                            return row.risks;
                        }));
                        // re-fill cells right MONARC colors
                        g.selectAll('.nv-cell')
                            .each(function (d, i) {
                                d3.select(this).select('rect')
                                    .style("fill", d.color)
                                    .style("stroke", d.color)
                                    .style("stroke-opacity", 0.4 + (0.6 * d.risks / nbRiskMax))
                                    .style("fill-opacity", 0.4 + (0.6 * d.risks / nbRiskMax));
                            })
                        // remove first line
                        g.selectAll('.nv-y').select('path.domain').remove();

                        g.selectAll(".nv-axis").selectAll("line").style("stroke-opacity", 0);
                        // set labelDistance manually
                        g.selectAll('.nv-x').select('.nv-axislabel')
                            .attr('y', -30);

                    },
                }
            }
        };

        const optionsChartCartography_target = {
            chart: {
                type: "heatMapChart",
                height: window.outerHeight * 0.5,
                width: 600,
                x: function (d) {
                    return d.likelihood
                },
                y: function (d) {
                    return d.impact
                },
                cellValue: function (d) {
                    return d.risks
                },
                cellAspectRatio: 1,
                colorRange: ["#D6F107", "#FFBC1C", "#FD661F"],
                highContrastText: false,
                showLegend: false,
                showCellValues: true,
                alignXAxis: 'top',
                alignYAxis: 'left',
                xAxis: {
                    axisLabel: gettextCatalog.getString('Likelihood'),
                    axisLabelDistance: 40,
                },
                yAxis: {
                    axisLabel: gettextCatalog.getString('Impact'),
                    axisLabelDistance: -30,
                },
                tooltip: {
                    headerEnabled: false,
                },
                cellValueFormat: function (d) {
                    return typeof d === 'number' ? d.toFixed(0) : d
                },
                cellRadius: 1,
                margin: {top: 50, right: 50},
                duration: 5,
                dispatch: {
                    renderEnd: function () {

                        if ($scope.dashboard.cartographyRisksType == 'info_risks') {
                            optionsChartCartography_target.chart.width = document.getElementById('graphCartographyTarget').parentElement.clientWidth;
                            let cellHeight = (optionsChartCartography_target.chart.width - 160) / $scope.dashboard.carto.MxV.length;
                            optionsChartCartography_target.chart.height = ($scope.dashboard.carto.Impact.length * cellHeight) + 100;
                        }

                        if ($scope.dashboard.cartographyRisksType == 'op_risk') {
                            let cellHeight = (optionsChartCartography_target.chart.width - 160) / $scope.dashboard.carto.Probability.length;
                            optionsChartCartography_target.chart.height = ($scope.dashboard.carto.Impact.length * cellHeight) + 100;
                        }

                        let g = d3.select('#graphCartographyTarget').select('svg');
                        let dataGraph = g.data();
                        let nbRiskMax = Math.max.apply(Math, dataGraph[0].map(function (row) {
                            return row.risks;
                        }));
                        // re-fill cells right MONARC colors
                        g.selectAll('.nv-cell')
                            .each(function (d, i) {
                                d3.select(this).select('rect')
                                    .style("fill", d.color)
                                    .style("stroke", d.color)
                                    .style("stroke-opacity", 0.4 + (0.6 * d.risks / nbRiskMax))
                                    .style("fill-opacity", 0.4 + (0.6 * d.risks / nbRiskMax));
                            })
                        // remove first line
                        g.selectAll('.nv-y').select('path.domain').remove();
                        g.selectAll(".nv-axis").selectAll("line").style("stroke-opacity", 0);
                        // set labelDistance manually
                        g.selectAll('.nv-x').select('.nv-axislabel')
                            .attr('y', -30);
                    },
                }
            }
        };

//==============================================================================

        //Options for the chart that displays the compliance
        const optionsChartCompliance = {
            radius: 5,
            w: 650,
            h: 650,
            factor: 1,
            factorLegend: 1.05,
            levels: 5,
            maxValue: 1,
            radians: -2 * Math.PI, // negative for clockwise
            opacityArea: 0.5,
            ToRight: 5,
            TranslateX: 200,
            TranslateY: 80,
            ExtraWidthX: 500,
            ExtraWidthY: 150,
            legend: [gettextCatalog.getString("Current level"), gettextCatalog.getString("Applicable target level")],
            color: d3.scale.category10()
        };

// DATA MODELS =================================================================

        //Data Model for the graph for the current risk by level of risk (low, med., high)
        const dataChartCurrentRisksByLevel_discreteBarChart = [
            {
                key: "currentRiskGraph",
                values: [
                    {
                        "label": gettextCatalog.getString('Low risks'),
                        "value": 0,
                        "color": '#D6F107'
                    },
                    {
                        "label": gettextCatalog.getString('Medium risks'),
                        "value": 0,
                        "color": '#FFBC1C'
                    },
                    {

                        "label": gettextCatalog.getString('High risks'),
                        "value": 0,
                        "color": '#FD661F'
                    }
                ]
            }
        ];

        const dataChartCurrentRisksByLevel_pieChart = [
            {
                label: gettextCatalog.getString('Low risks'),
                value: 0,
                color: "#D6F107"
            },
            {
                label: gettextCatalog.getString('Medium risks'),
                value: 0,
                color: "#FFBC1C"
            },
            {
                label: gettextCatalog.getString('High risks'),
                value: 0,
                color: "#FD661F"
            }
        ];

        //Data model for the graph of current risk by asset
        const dataChartCurrentRisksByAsset = [
            {
                key: gettextCatalog.getString('Low risks'),
                values: [],
                color: '#D6F107'
            },
            {
                key: gettextCatalog.getString('Medium risks'),
                values: [],
                color: '#FFBC1C'
            },
            {
                key: gettextCatalog.getString('High risks'),
                values: [],
                color: '#FD661F'
            }
        ];

        //Data model for the graph for the target risk by level of risk (low, med., high)
        const dataChartTargetRisksByLevel_discreteBarChart = [
            {
                key: "targetRiskGraph",
                values: [
                    {
                        "label": gettextCatalog.getString('Low risks'),
                        "value": 0,
                        "color": '#D6F107'
                    },
                    {
                        "label": gettextCatalog.getString('Medium risks'),
                        "value": 0,
                        "color": '#FFBC1C'
                    },
                    {
                        "label": gettextCatalog.getString('High risks'),
                        "value": 0,
                        "color": '#FD661F'
                    }
                ]
            }
        ];

        const dataChartTargetRisksByLevel_pieChart = [
            {
                label: gettextCatalog.getString('Low risks'),
                value: 0,
                color: "#D6F107"
            },
            {
                label: gettextCatalog.getString('Medium risks'),
                value: 0,
                color: "#FFBC1C"
            },
            {
                label: gettextCatalog.getString('High risks'),
                value: 0,
                color: "#FD661F"
            }
        ];

        //Data model for the graph of Residual risks by asset
        const dataChartTargetRisksByAsset = [
            {
                key: gettextCatalog.getString('Low risks'),
                values: [],
                color: '#D6F107'
            },
            {
                key: gettextCatalog.getString('Medium risks'),
                values: [],
                color: '#FFBC1C'
            },
            {
                key: gettextCatalog.getString('High risks'),
                values: [],
                color: '#FD661F'
            }
        ];

        //Data for the graph for the number of threats by threat type
        let dataChartThreats = [
            {
                key: "",
                values: []
            }
        ];

        //Data for the graph for the number of vulnerabilities by vulnerabilities type
        let dataChartVulnes_number = [
            {
                key: "",
                values: []
            },
        ];

        //Data for the graph for the vulnerabilities by vulnerabilities risk
        let dataChartVulnes_risk = [
            {
                key: "",
                values: []
            },
        ];

        //Data for the graph for risk cartography
        let dataChartCartoCurrent = [];
        let dataChartCartoTarget = [];
        let dataChartCartoRiskOpCurrent = [];
        let dataChartCartoRiskOpTarget = [];

        //Data for the graph for the compliance
        let dataChartCompliance = [];

        //Data model for the graph of current risk by parent asset
        let dataChartTargetRisksByParentAsset = [
            {
                key: gettextCatalog.getString("Low risks"),
                values: [],
                color: '#D6F107'
            },
            {
                key: gettextCatalog.getString("Medium risks"),
                values: [],
                color: '#FFBC1C'
            },
            {
                key: gettextCatalog.getString("High risks"),
                values: [],
                color: '#FD661F'
            }
        ];

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

        const calculateAxisY = function (dataChart) {
            values = dataChart.map(x => x.values.map(y => y.y));
            transposeValues = values[0].map((col, i) => values.map(row => row[i]));
            maxValue = [];
            transposeValues.forEach(function (max) {
                maxValue.push(max.reduce((a, b) => a + b));
            });
            return maxValue
        }

//==============================================================================
        $scope.updateGraphs = function () {

            angular.copy(d3v3,d3)
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
                                updateCurrentRisksByParentAsset(null);
                                updateTargetRisksByParentAsset(null);
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
            if (newValues[0] == "level" && $scope.currentRisksChartOptions && $scope.graphCurrentRisks) {
                if (newValues[1] == 'optionsCartoRisk_discreteBarChart_current') {
                    loadGraph($scope.graphCurrentRisks, optionsCartoRisk_discreteBarChart_current, dataChartCurrentRisksByLevel_discreteBarChart);
                }
                if (newValues[1] == 'optionsCartoRisk_pieChart') {
                    loadGraph($scope.graphCurrentRisks, optionsCartoRisk_pieChart, dataChartCurrentRisksByLevel_pieChart);
                }
            }
            if (newValues[0] == "asset" && $scope.currentRisksChartOptions) {
                loadGraph($scope.graphCurrentRisks, optionsChartCurrentRisksByAsset, dataChartCurrentRisksByAsset);
            }
            if (newValues[0] == "parentAsset" && $scope.currentRisksChartOptions) {
                let maxValue = calculateAxisY(dataChartCurrentRisksByParentAsset);
                optionsChartCurrentRisksByParentAsset.chart.forceY = [0, Math.max(...maxValue)];
                loadGraph($scope.graphCurrentRisks, optionsChartCurrentRisksByParentAsset, dataChartCurrentRisksByParentAsset);
            }
        });

        $scope.$watchGroup(['displayTargetRisksBy', 'targetRisksChartOptions', 'graphTargetRisks'], function (newValues) {
            if (newValues[0] == "level" && $scope.targetRisksChartOptions && $scope.graphTargetRisks) {
                if (newValues[1] == 'optionsCartoRisk_discreteBarChart_target') {
                    loadGraph($scope.graphTargetRisks, optionsCartoRisk_discreteBarChart_target, dataChartTargetRisksByLevel_discreteBarChart);
                }
                if (newValues[1] == 'optionsCartoRisk_pieChart') {
                    loadGraph($scope.graphTargetRisks, optionsCartoRisk_pieChart, dataChartTargetRisksByLevel_pieChart);
                }
            }
            if (newValues[0] == "asset" && $scope.targetRisksChartOptions) {
                loadGraph($scope.graphTargetRisks, optionsChartTargetRisksByAsset, dataChartTargetRisksByAsset);
            }
            if (newValues[0] == "parentAsset" && $scope.dashboard.anr.id && $scope.targetRisksChartOptions) {
                let maxValue = calculateAxisY(dataChartTargetRisksByParentAsset);
                optionsChartTargetRisksByParentAsset.chart.forceY = [0, Math.max(...maxValue)];
                loadGraph($scope.graphTargetRisks, optionsChartTargetRisksByParentAsset, dataChartTargetRisksByParentAsset);
            }
        });

        $scope.$watchGroup(['displayThreatsBy', 'graphThreats'], function (newValue) {
            if ($scope.dashboard.data.count) {
                updateThreats($scope.dashboard.data);
            }
        });

        $scope.$watchGroup(['threatsChartOption', 'graphThreats'], function (newValue) {
            if (newValue[0] && $scope.graphThreats) {
                let options = optionsChartThreats_discreteBarChart;
                if (newValue[0] == 'optionsChartThreats_multiBarHorizontalChart') {
                    options = optionsChartThreats_multiBarHorizontalChart;
                }
                loadGraph($scope.graphThreats, options, dataChartThreats);
            }
        });

        $scope.$watchGroup(['vulnerabilitiesDisplayed', 'displayVulnerabilitiesBy', 'graphVulnerabilities'], function (newValue) {
            if ($scope.dashboard.data.count) {
                updateVulnerabilities($scope.dashboard.data);
            }
        });

        $scope.$watchGroup(['vulnerabilitiesChartOption', 'graphVulnerabilities'], function (newValue) {
            if (newValue[0] && $scope.graphVulnerabilities) {
                let options = optionsChartVulnerabilities_discreteBarChart;
                if (newValue[0] == 'optionsChartVulnerabilities_horizontalBarChart') {
                    options = optionsChartVulnerabilities_horizontalBarChart;
                }
                loadGraph($scope.graphVulnerabilities, options, dataChartVulnes_risk);
            }
        });

        $scope.$watch('cartographyRisksType', function (newValue) {
            if (newValue == "info_risks") {
                if ($scope.dashboard.riskInfo) {
                    $scope.dashboard.cartographyRisksType = 'info_risks';
                    optionsChartCartography_current.chart.width = document.getElementById('graphCartographyCurrent').parentElement.clientWidth;
                    optionsChartCartography_target.chart.width = document.getElementById('graphCartographyTarget').parentElement.clientWidth;
                    let cellHeight = (optionsChartCartography_target.chart.width - 106) / $scope.dashboard.carto.MxV.length;
                    optionsChartCartography_current.chart.height = optionsChartCartography_target.chart.height = ($scope.dashboard.carto.Impact.length * cellHeight) + 100;
                    loadGraph($scope.graphCartographyCurrent, optionsChartCartography_current, dataChartCartoCurrent);
                    loadGraph($scope.graphCartographyTarget, optionsChartCartography_target, dataChartCartoTarget);
                }
            } else {
                if ($scope.dashboard.riskOp) {
                    $scope.dashboard.cartographyRisksType = 'op_risk';
                    optionsChartCartography_target.chart.width = 400;
                    optionsChartCartography_current.chart.width = 400;
                    let cellHeight = (optionsChartCartography_target.chart.width - 106) / $scope.dashboard.carto.Probability.length;
                    optionsChartCartography_current.chart.height = optionsChartCartography_target.chart.height = ($scope.dashboard.carto.Impact.length * cellHeight) + 100;
                    loadGraph($scope.graphCartographyCurrent, optionsChartCartography_current, dataChartCartoRiskOpCurrent);
                    loadGraph($scope.graphCartographyTarget, optionsChartCartography_target, dataChartCartoRiskOpTarget);
                }
            }
        });

        $scope.$watch('dashboard.refSelected', function (newValue) {
            if (newValue) {
                document.getElementById("goBack").style.visibility = 'hidden';
                radarChart('#graphCompliance', optionsChartCompliance, dataChartCompliance[$scope.dashboard.refSelected], true);
            }
        });

//==============================================================================

        /*
        * Check if a risk is present or not in the tab
        * @return true if present else false
        */
        const findValueId = function (tab, value) {
            for (i = 0; i < tab.length; i++)
                if (tab[i].x === value)
                    return true;
            return false;
        }

//==============================================================================

        /*
        * Add a risk in a tab if the risk is not already present in the tab
        */
        const addOneRisk = function (tab, value) {
            for (i = 0; i < tab.length; i++)
                if (tab[i].x === value)
                    tab[i].y++;
        }

//==============================================================================

        const compareByNumber = function (a, b) { //allows to sort an array of objects given a certain attribute
            if (a.y > b.y)
                return -1;
            if (a.y < b.y)
                return 1;
            return 0;
        }

//==============================================================================

        const compareByAverage = function (a, b) { //allows to sort an array of objects given a certain attribute
            if (a.average > b.average)
                return -1;
            if (a.average < b.average)
                return 1;
            return 0;
        }

//==============================================================================

        const hslToHex = function (h, s, l) {
            h /= 360;
            s /= 100;
            l /= 100;
            let r, g, b;
            if (s === 0) {
                r = g = b = l; // achromatic
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }
            const toHex = x => {
                const hex = Math.round(x * 255).toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            };
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        }

//==============================================================================

        const numberToColorHsl = function (i, max_angle) {
            // as the function expects a value between 0 and 1, and red = 0° and green = 120°
            // we convert the input to the appropriate hue value
            let hue = max_angle - i * max_angle;
            // we convert hsl to hex (saturation 100%, lightness 50%)
            return hslToHex(hue, 100, 50);
        }

//==============================================================================

        const relativeHexColorYParameter = function (index, tab, max_angle) { //max_angle references hsl colors that can be found here : https://i.stack.imgur.com/b7mU9.jpg
            relative_color = (tab[index].y - tab[tab.length - 1].y + 1) / (tab[0].y - tab[tab.length - 1].y + 1);
            tab[index].color = numberToColorHsl(relative_color, max_angle);
        }

//==============================================================================

        const relativeHexColorMaxRiskParameter = function (index, tab, max_angle) { //max_angle references hsl colors that can be found here : https://i.stack.imgur.com/b7mU9.jpg
            relative_color = (tab[index].max_risk - tab[tab.length - 1].max_risk + 1) / (tab[0].max_risk - tab[tab.length - 1].max_risk + 1);
            tab[index].color = numberToColorHsl(relative_color, max_angle);
        }

//==============================================================================

        /**
         * Update the two first charts which are displayed (the number of risk
         * by category (high, med., low) for target and current risk)
         */
        const updateCartoRisks = function (data) {
            if ($scope.dashboard.riskInfo) {
                let maxNbRisk = Object.values(data.data.carto.real.riskInfo.distrib).reduce((a, b) => a + b);
                optionsCartoRisk_discreteBarChart_current.chart.forceY = [0, maxNbRisk];
                optionsCartoRisk_discreteBarChart_target.chart.forceY = [0, maxNbRisk];
            }

            for (let i = 0; i < 3; i++) {
                dataChartCurrentRisksByLevel_discreteBarChart[0].values[i].value = 0;
                dataChartCurrentRisksByLevel_pieChart[i].value = 0;
                dataChartTargetRisksByLevel_discreteBarChart[0].values[i].value = 0;
                dataChartTargetRisksByLevel_pieChart[i].value = 0;
            }
            //current risks
            //fill the bar chart
            if (data.data.carto.real.riskInfo.distrib[0] != null) {
                dataChartCurrentRisksByLevel_discreteBarChart[0].values[0].value = data.data.carto.real.riskInfo.distrib[0];
            }
            if (data.data.carto.real.riskInfo.distrib[1] != null) {
                dataChartCurrentRisksByLevel_discreteBarChart[0].values[1].value = data.data.carto.real.riskInfo.distrib[1];
            }
            if (data.data.carto.real.riskInfo.distrib[2] != null) {
                dataChartCurrentRisksByLevel_discreteBarChart[0].values[2].value = data.data.carto.real.riskInfo.distrib[2];
            }

            //fill the pie chart
            if (data.data.carto.real.riskInfo.distrib[0] != null) {
                dataChartCurrentRisksByLevel_pieChart[0].value = data.data.carto.real.riskInfo.distrib[0];
            }
            if (data.data.carto.real.riskInfo.distrib[1] != null) {
                dataChartCurrentRisksByLevel_pieChart[1].value = data.data.carto.real.riskInfo.distrib[1];
            }
            if (data.data.carto.real.riskInfo.distrib[2] != null) {
                dataChartCurrentRisksByLevel_pieChart[2].value = data.data.carto.real.riskInfo.distrib[2];
            }

            if (data.data.carto.targeted) {

                //fill the bar chart
                if (data.data.carto.targeted.riskInfo.distrib[0] != null)
                    dataChartTargetRisksByLevel_discreteBarChart[0].values[0].value = data.data.carto.targeted.riskInfo.distrib[0];
                if (data.data.carto.targeted.riskInfo.distrib[1] != null)
                    dataChartTargetRisksByLevel_discreteBarChart[0].values[1].value = data.data.carto.targeted.riskInfo.distrib[1];
                if (data.data.carto.targeted.riskInfo.distrib[2] != null)
                    dataChartTargetRisksByLevel_discreteBarChart[0].values[2].value = data.data.carto.targeted.riskInfo.distrib[2];

                //fill the pie chart
                if (data.data.carto.targeted.riskInfo.distrib[0] != null)
                    dataChartTargetRisksByLevel_pieChart[0].value = data.data.carto.targeted.riskInfo.distrib[0];
                if (data.data.carto.targeted.riskInfo.distrib[1] != null)
                    dataChartTargetRisksByLevel_pieChart[1].value = data.data.carto.targeted.riskInfo.distrib[1];
                if (data.data.carto.targeted.riskInfo.distrib[2] != null)
                    dataChartTargetRisksByLevel_pieChart[2].value = data.data.carto.targeted.riskInfo.distrib[2];
            }
        };

//==============================================================================

        /*
        * Update the chart of the current risks by assets
        */
        const updateCurrentRisksByAsset = function (data) {

            for (let i = 0; i < 3; i++) {
                dataChartCurrentRisksByAsset[i].values = [];
            }

            treshold1 = $scope.dashboard.anr.seuil1;
            treshold2 = $scope.dashboard.anr.seuil2;


            risksList = data.risks;
            for (let i = 0; i < risksList.length; ++i) {
                let eltlow = new Object();
                let eltmed = new Object();
                let elthigh = new Object();
                if (!findValueId(dataChartCurrentRisksByAsset[0].values, $scope._langField(risksList[i], 'instanceName')) && risksList[i].max_risk >= 0) {
                    // initialize element
                    eltlow.id = eltmed.id = elthigh.id = risksList[i].instance; //keep the instance id as id
                    eltlow.x = eltmed.x = elthigh.x = $scope._langField(risksList[i], 'instanceName');
                    eltlow.y = eltmed.y = elthigh.y = 0;
                    eltlow.color = '#D6F107';
                    dataChartCurrentRisksByAsset[0].values.push(eltlow);
                    eltmed.color = '#FFBC1C';
                    dataChartCurrentRisksByAsset[1].values.push(eltmed);
                    elthigh.color = '#FD661F';
                    dataChartCurrentRisksByAsset[2].values.push(elthigh);
                }
                if (risksList[i].max_risk > treshold2) {
                    addOneRisk(dataChartCurrentRisksByAsset[2].values, $scope._langField(risksList[i], 'instanceName'));
                } else if (risksList[i].max_risk <= treshold2 && risksList[i].max_risk > treshold1) {
                    addOneRisk(dataChartCurrentRisksByAsset[1].values, $scope._langField(risksList[i], 'instanceName'));
                } else if (risksList[i].max_risk >= 0 && risksList[i].max_risk <= treshold1) {
                    addOneRisk(dataChartCurrentRisksByAsset[0].values, $scope._langField(risksList[i], 'instanceName'));
                }
            }
        };

//==============================================================================

        /*
        * Update the chart of the Residual risks by assets
        */
        const updateTargetRisksByAsset = function (data) {

            for (let i = 0; i < 3; i++) {
                dataChartTargetRisksByAsset[i].values = [];
            }

            treshold1 = $scope.dashboard.anr.seuil1;
            treshold2 = $scope.dashboard.anr.seuil2;

            risksList = data.risks;
            //if($scope.dashboard.carto.targeted){ //n'affiche des données que si des risques cible existent
            for (let i = 0; i < risksList.length; ++i) {
                let eltlow2 = new Object();
                let eltmed2 = new Object();
                let elthigh2 = new Object();
                if (!findValueId(dataChartTargetRisksByAsset[0].values, $scope._langField(risksList[i], 'instanceName')) && risksList[i].max_risk >= 0) {
                    // initialize element
                    eltlow2.id = eltmed2.id = elthigh2.id = risksList[i].instance; //keep the instance id as id
                    eltlow2.x = eltmed2.x = elthigh2.x = $scope._langField(risksList[i], 'instanceName');
                    eltlow2.y = eltmed2.y = elthigh2.y = 0;
                    eltlow2.color = '#D6F107';
                    dataChartTargetRisksByAsset[0].values.push(eltlow2);
                    eltmed2.color = '#FFBC1C';
                    dataChartTargetRisksByAsset[1].values.push(eltmed2);
                    elthigh2.color = '#FD661F';
                    dataChartTargetRisksByAsset[2].values.push(elthigh2);
                }
                if (risksList[i].target_risk > treshold2) {
                    addOneRisk(dataChartTargetRisksByAsset[2].values, $scope._langField(risksList[i], 'instanceName'));
                } else if (risksList[i].target_risk <= treshold2 && risksList[i].target_risk > treshold1) {
                    addOneRisk(dataChartTargetRisksByAsset[1].values, $scope._langField(risksList[i], 'instanceName'));
                } else if (risksList[i].target_risk >= 0 && risksList[i].target_risk <= treshold1) {
                    addOneRisk(dataChartTargetRisksByAsset[0].values, $scope._langField(risksList[i], 'instanceName'));
                }
            }
            //};
        };

//==============================================================================

        const recursiveAdd = function (tab, chart_data) {
            for (let i = 0; i < tab.length; i++) {
                for (let j = 0; j < chart_data.length; j++) {
                    let eltchart = new Object();
                    eltchart.x = $scope._langField(tab[i], 'name');
                    eltchart.y = 0;
                    eltchart.asset_id = tab[i].id;
                    if (tab[i].parent == 0) eltchart.isparent = true;
                    else eltchart.isparent = false;
                    tab[i].child.sort(function (a, b) {
                        return a['name' + $scope.dashboard.anr.language].localeCompare(b['name' + $scope.dashboard.anr.language])
                    });
                    eltchart.child = tab[i].child;
                    chart_data[j].values.push(eltchart);
                }
            }
        }

        $scope.goBackCurrentRisksParentAsset = function () { //function triggered by 'return' button : loads graph data in memory tab then deletes it
            $scope.dashboard.currentRisksBreadcrumb.pop();
            $scope.dashboard.currentRisksParentAssetMemoryTab.pop();
            dataChartCurrentRisksByParentAsset = $scope.dashboard.currentRisksParentAssetMemoryTab[$scope.dashboard.currentRisksParentAssetMemoryTab.length - 1];
            const maxValue = calculateAxisY(dataChartCurrentRisksByParentAsset);
            optionsChartCurrentRisksByParentAsset.chart.forceY = [0, Math.max(...maxValue)];
            loadGraph($scope.graphCurrentRisks, optionsChartCurrentRisksByParentAsset, dataChartCurrentRisksByParentAsset);
        }

        $scope.breadcrumbGoBackCurrentRisksParentAsset = function (id) { //function triggered with the interactive breadcrumb : id is held by the button
            if ($scope.dashboard.currentRisksBreadcrumb.length > 4) {
                dataChartCurrentRisksByParentAsset = $scope.dashboard.currentRisksParentAssetMemoryTab[id + $scope.dashboard.currentRisksBreadcrumb.length - 4];
                $scope.dashboard.currentRisksParentAssetMemoryTab = $scope.dashboard.currentRisksParentAssetMemoryTab.slice(0, id + $scope.dashboard.currentRisksBreadcrumb.length - 3); //only keep elements before the one we display
                $scope.dashboard.currentRisksBreadcrumb = $scope.dashboard.currentRisksBreadcrumb.slice(0, id + $scope.dashboard.currentRisksBreadcrumb.length - 3);
                const maxValue = calculateAxisY(dataChartCurrentRisksByParentAsset);
                optionsChartCurrentRisksByParentAsset.chart.forceY = [0, Math.max(...maxValue)];
                loadGraph($scope.graphCurrentRisks, optionsChartCurrentRisksByParentAsset, dataChartCurrentRisksByParentAsset);
            } else {
                dataChartCurrentRisksByParentAsset = $scope.dashboard.currentRisksParentAssetMemoryTab[id];
                $scope.dashboard.currentRisksParentAssetMemoryTab = $scope.dashboard.currentRisksParentAssetMemoryTab.slice(0, id + 1); //only keep elements before the one we display
                $scope.dashboard.currentRisksBreadcrumb = $scope.dashboard.currentRisksBreadcrumb.slice(0, id + 1);
                const maxValue = calculateAxisY(dataChartCurrentRisksByParentAsset);
                optionsChartCurrentRisksByParentAsset.chart.forceY = [0, Math.max(...maxValue)];
                loadGraph($scope.graphCurrentRisks, optionsChartCurrentRisksByParentAsset, dataChartCurrentRisksByParentAsset);
            }
        }

        //======================================================================

        $scope.goBackTargetRisksParentAsset = function () { //function triggered by 'return' button : loads graph data in memory tab then deletes it
            $scope.dashboard.targetRisksBreadcrumb.pop();
            $scope.dashboard.targetRisksParentAssetMemoryTab.pop();
            dataChartTargetRisksByParentAsset = $scope.dashboard.targetRisksParentAssetMemoryTab[$scope.dashboard.targetRisksParentAssetMemoryTab.length - 1];
            const maxValue = calculateAxisY(dataChartTargetRisksByParentAsset);
            optionsChartTargetRisksByParentAsset.chart.forceY = [0, Math.max(...maxValue)];
            loadGraph($scope.graphTargetRisks, optionsChartTargetRisksByParentAsset, dataChartTargetRisksByParentAsset);
        }

        $scope.breadcrumbGoBackTargetRisksParentAsset = function (id) { //function triggered with the interactive breadcrumb : id is held by the button
            if ($scope.dashboard.targetRisksBreadcrumb.length > 4) {
                dataChartTargetRisksByParentAsset = $scope.dashboard.targetRisksParentAssetMemoryTab[id + $scope.dashboard.targetRisksBreadcrumb.length - 4];
                $scope.dashboard.targetRisksParentAssetMemoryTab = $scope.dashboard.targetRisksParentAssetMemoryTab.slice(0, id + $scope.dashboard.targetRisksBreadcrumb.length - 3); //only keep elements before the one we display
                $scope.dashboard.targetRisksBreadcrumb = $scope.dashboard.targetRisksBreadcrumb.slice(0, id + $scope.dashboard.targetRisksBreadcrumb.length - 3);
                const maxValue = calculateAxisY(dataChartTargetRisksByParentAsset);
                optionsChartTargetRisksByParentAsset.chart.forceY = [0, Math.max(...maxValue)];
                loadGraph($scope.graphTargetRisks, optionsChartTargetRisksByParentAsset, dataChartTargetRisksByParentAsset);
            } else {
                dataChartTargetRisksByParentAsset = $scope.dashboard.targetRisksParentAssetMemoryTab[id];
                $scope.dashboard.targetRisksParentAssetMemoryTab = $scope.dashboard.targetRisksParentAssetMemoryTab.slice(0, id + 1); //only keep elements before the one we display
                $scope.dashboard.targetRisksBreadcrumb = $scope.dashboard.targetRisksBreadcrumb.slice(0, id + 1);
                const maxValue = calculateAxisY(dataChartTargetRisksByParentAsset);
                optionsChartTargetRisksByParentAsset.chart.forceY = [0, Math.max(...maxValue)];
                loadGraph($scope.graphTargetRisks, optionsChartTargetRisksByParentAsset, dataChartTargetRisksByParentAsset);
            }
        }

//==============================================================================

        /*
        * Update the chart of the Residual risks by assets
        */
        const updateCurrentRisksByParentAsset = function (special_tab) {
            let promise = $q.defer();

            //Data model for the graph of current risk by parent asset
            dataChartCurrentRisksByParentAsset = [
                {
                    key: gettextCatalog.getString("Low risks"),
                    values: [],
                    color: '#D6F107'
                },
                {
                    key: gettextCatalog.getString("Medium risks"),
                    values: [],
                    color: '#FFBC1C'
                },
                {
                    key: gettextCatalog.getString("High risks"),
                    values: [],
                    color: '#FD661F'
                }
            ];

            treshold1 = $scope.dashboard.anr.seuil1;
            treshold2 = $scope.dashboard.anr.seuil2;

            function fillParentAssetCurrentRisksChart(initial_data, dataChart) {
                data = angular.copy(initial_data);
                let data_id = data[0].id;
                AnrService.getInstanceRisks($scope.dashboard.anr.id, data[0].id, {limit: -1}).then(function (data2) {
                    for (j = 0; j < data2.risks.length; j++) {
                        if (data2.risks[j].max_risk > treshold2) {
                            for (k = 0; k < dataChart[2].values.length; k++) {
                                if (dataChart[2].values[k].asset_id == data_id) dataChart[2].values[k].y++;
                            }
                        } else if (data2.risks[j].max_risk <= treshold2 && data2.risks[j].max_risk > treshold1) {
                            for (k = 0; k < dataChart[1].values.length; k++) {
                                if (dataChart[1].values[k].asset_id == data_id) dataChart[1].values[k].y++;
                            }
                        } else if (data2.risks[j].max_risk >= 0 && data2.risks[j].max_risk <= treshold1) {
                            for (k = 0; k < dataChart[0].values.length; k++) {
                                if (dataChart[0].values[k].asset_id == data_id) {
                                    dataChart[0].values[k].y++;
                                }
                            }
                        }
                    }

                    if (indexCurrent == 1) {
                        promise.resolve();
                    }
                    indexCurrent--;
                });
                data.shift();
                if (data.length > 0) {
                    fillParentAssetCurrentRisksChart(data, dataChart);
                }
            }

            if (special_tab == null) {
                indexCurrent = angular.copy($scope.dashboard.instances);
                recursiveAdd($scope.dashboard.instances, dataChartCurrentRisksByParentAsset);
                if ($scope.dashboard.instances.length > 0) {
                    fillParentAssetCurrentRisksChart($scope.dashboard.instances, dataChartCurrentRisksByParentAsset);
                    $scope.dashboard.currentRisksParentAssetMemoryTab.push(dataChartCurrentRisksByParentAsset);
                }
            } else {
                recursiveAdd(special_tab, dataChartCurrentRisksByParentAsset);
                indexCurrent = angular.copy(special_tab.length);
                if (special_tab.length > 0) {
                    fillParentAssetCurrentRisksChart(special_tab, dataChartCurrentRisksByParentAsset);
                }
            }
            return promise.promise;
        }

//==============================================================================

        /*
        * Update the chart of the Residual risks by assets
        */
        const updateTargetRisksByParentAsset = function (special_tab) {
            const promise = $q.defer();

            treshold1 = $scope.dashboard.anr.seuil1;
            treshold2 = $scope.dashboard.anr.seuil2;

            let fillParentAssetTargetRisksChart = function (initial_data, dataChart) {
                data = angular.copy(initial_data);
                const dataId = data[0].id;
                AnrService.getInstanceRisks($scope.dashboard.anr.id, data[0].id, {limit: -1}).then(function (data2) {
                    for (j = 0; j < data2.risks.length; j++) {
                        if (data2.risks[j].target_risk > treshold2) {
                            for (k = 0; k < dataChart[2].values.length; k++) {
                                if (dataChart[2].values[k].asset_id == dataId) dataChart[2].values[k].y++;
                            }
                        } else if (data2.risks[j].target_risk <= treshold2 && data2.risks[j].target_risk > treshold1) {
                            for (k = 0; k < dataChart[1].values.length; k++) {
                                if (dataChart[1].values[k].asset_id == dataId) dataChart[1].values[k].y++;
                            }
                        } else if (data2.risks[j].target_risk >= 0 && data2.risks[j].target_risk <= treshold1) {
                            for (k = 0; k < dataChart[0].values.length; k++) {
                                if (dataChart[0].values[k].asset_id == dataId) {
                                    dataChart[0].values[k].y++;
                                }
                            }
                        }
                    }

                    if (indexTarget == 1) {
                        promise.resolve();
                    }
                    indexTarget--;

                });
                data.shift();
                if (data.length > 0) {
                    fillParentAssetTargetRisksChart(data, dataChart);
                }
            }

            if (special_tab == null) {
                recursiveAdd($scope.dashboard.instances, dataChartTargetRisksByParentAsset);
                indexTarget = angular.copy($scope.dashboard.instances);
                if ($scope.dashboard.instances.length > 0) {
                    fillParentAssetTargetRisksChart($scope.dashboard.instances, dataChartTargetRisksByParentAsset);
                    $scope.dashboard.targetRisksParentAssetMemoryTab.push(dataChartTargetRisksByParentAsset);
                }
            } else {
                recursiveAdd(special_tab, dataChartTargetRisksByParentAsset);
                indexTarget = angular.copy(special_tab.length);
                if (special_tab.length > 0) {
                    fillParentAssetTargetRisksChart(special_tab, dataChartTargetRisksByParentAsset);
                }
            }
            return promise.promise;
        }


//==============================================================================

        /*
        * Update the chart of the number of threats by threat type
        */
        const updateThreats = function (data) {
            const promise = $q.defer();

            dataChartThreats[0].values = [];
            let risksList = data.risks;
            risksList.sort(function (a, b) {
                return b['max_risk'] - a['max_risk']
            })
            for (let i = 0; i < risksList.length; ++i) {
                let eltrisk = new Object();
                if (!findValueId(dataChartThreats[0].values, $scope._langField(risksList[i], 'threatLabel')) && risksList[i].max_risk > 0) {
                    // initialize element
                    eltrisk.id = risksList[i].tid; //keep the threatID as id
                    eltrisk.x = $scope._langField(risksList[i], 'threatLabel');
                    eltrisk.y = 0;
                    eltrisk.average = 0;
                    eltrisk.color = '#FF0000';
                    eltrisk.max_risk = risksList[i].max_risk; //We can define max_risk for the threat in the initialisation because objects in RisksList are ordered by max_risk
                    eltrisk.rate = risksList[i].threatRate;
                    dataChartThreats[0].values.push(eltrisk);
                }
                if (risksList[i].max_risk > 0) {
                    addOneRisk(dataChartThreats[0].values, $scope._langField(risksList[i], 'threatLabel'));
                    for (let j = 0; j < dataChartThreats[0].values.length; j++) {
                        if (dataChartThreats[0].values[j].id === risksList[i].tid) {
                            dataChartThreats[0].values[j].average *= (dataChartThreats[0].values[j].y - 1);
                            dataChartThreats[0].values[j].average += risksList[i].threatRate;
                            dataChartThreats[0].values[j].average /= dataChartThreats[0].values[j].y;
                        }
                    }
                }
            }
            if ($scope.displayThreatsBy == "number") {
                dataChartThreats[0].values.sort(compareByNumber);
                for (let i = 0; i < dataChartThreats[0].values.length; i++) {
                    relativeHexColorYParameter(i, dataChartThreats[0].values, 79.75);
                }
                delete optionsChartThreats_discreteBarChart.chart.yDomain;
                delete optionsChartThreats_multiBarHorizontalChart.chart.yDomain;
                promise.resolve(dataChartThreats);
            }
            if ($scope.displayThreatsBy == "probability") {
                dataChartThreats[0].values.sort(compareByAverage);
                for (let i = 0; i < dataChartThreats[0].values.length; i++) {
                    dataChartThreats[0].values[i].y = dataChartThreats[0].values[i].average;
                }
                for (let i = 0; i < dataChartThreats[0].values.length; i++) {
                    relativeHexColorYParameter(i, dataChartThreats[0].values, 79.75);
                }

                for (let k = 0; k < $scope.dashboard.scales.length; k++) {
                    if ($scope.dashboard.scales[k].type == "threat") {
                        if ($scope.dashboard.scales[k].min == 0) {
                            optionsChartThreats_discreteBarChart.chart.yDomain = [$scope.dashboard.scales[k].min, $scope.dashboard.scales[k].max];
                        } else {
                            optionsChartThreats_discreteBarChart.chart.yDomain = [$scope.dashboard.scales[k].min - 1, $scope.dashboard.scales[k].max];
                        }
                        if ($scope.dashboard.scales[k].min == 0) {
                            optionsChartThreats_multiBarHorizontalChart.chart.yDomain = [$scope.dashboard.scales[k].min, $scope.dashboard.scales[k].max];
                        } else {
                            optionsChartThreats_multiBarHorizontalChart.chart.yDomain = [$scope.dashboard.scales[k].min - 1, $scope.dashboard.scales[k].max];
                        }
                    }
                }
                promise.resolve(dataChartThreats);
            }

            if ($scope.displayThreatsBy == "max_associated_risk") {
                for (let i = 0; i < dataChartThreats[0].values.length; i++) {
                    relativeHexColorMaxRiskParameter(i, dataChartThreats[0].values, 79.75)
                }
                for (let i = 0; i < dataChartThreats[0].values.length; i++) {
                    dataChartThreats[0].values[i].y = dataChartThreats[0].values[i].max_risk;
                }

                delete optionsChartThreats_discreteBarChart.chart.yDomain;
                delete optionsChartThreats_multiBarHorizontalChart.chart.yDomain;
                promise.resolve(dataChartThreats);
            }

            return promise.promise;
        };

//==============================================================================

        /*
        * Update the chart of the number of the top 5 vulnerabilities by vulnerabilities type
        */
        const updateVulnerabilities = function (data) {
            let promise = $q.defer();
            let dataTempChartVulnes_risk = [];
            dataChartVulnes_risk[0].values = [];
            risksList = data.risks;
            for (let i = 0; i < risksList.length; ++i) {
                let eltvuln_risk = new Object();
                if (!findValueId(dataTempChartVulnes_risk, $scope._langField(risksList[i], 'vulnLabel')) && risksList[i].max_risk >= 0) {
                    // initialize element
                    eltvuln_risk.id = risksList[i].vid; //keep the vulnID as id
                    eltvuln_risk.x = $scope._langField(risksList[i], 'vulnLabel');
                    eltvuln_risk.y = 0;
                    eltvuln_risk.average = 0;
                    eltvuln_risk.max_risk = risksList[i].max_risk; //We can define max_risk for the vulnerability in the initialisation because objects in RisksList are ordered by max_risk
                    eltvuln_risk.color = '#D66607';
                    dataTempChartVulnes_risk.push(eltvuln_risk);
                }
                if (risksList[i].max_risk >= 0) {
                    addOneRisk(dataTempChartVulnes_risk, $scope._langField(risksList[i], 'vulnLabel'));
                    for (let j = 0; j < dataTempChartVulnes_risk.length; j++) {
                        if (dataTempChartVulnes_risk[j].id === risksList[i].vid) {
                            dataTempChartVulnes_risk[j].average *= (dataTempChartVulnes_risk[j].y - 1);
                            dataTempChartVulnes_risk[j].average += risksList[i].vulnerabilityRate;
                            dataTempChartVulnes_risk[j].average /= dataTempChartVulnes_risk[j].y;
                        }
                    }
                }
            }
            if ($scope.displayVulnerabilitiesBy == "number") {
                // optionsChartVulnerabilities_discreteBarChart.chart.yAxis.axisLabel = gettextCatalog.getString("Number of occurences");
                dataTempChartVulnes_risk.sort(compareByNumber);
                for (let i = 0; i < dataTempChartVulnes_risk.length; i++) {
                    relativeHexColorYParameter(i, dataTempChartVulnes_risk, 79.75);
                }
                delete optionsChartVulnerabilities_discreteBarChart.chart.yDomain;
                delete optionsChartVulnerabilities_horizontalBarChart.chart.yDomain;
            }
            if ($scope.displayVulnerabilitiesBy == "qualification") {
                // optionsChartVulnerabilities_discreteBarChart.chart.yAxis.axisLabel = gettextCatalog.getString("Qualification");
                dataTempChartVulnes_risk.sort(compareByAverage);
                for (let i = 0; i < dataTempChartVulnes_risk.length; i++) {
                    dataTempChartVulnes_risk[i].y = dataTempChartVulnes_risk[i].average;
                }
                for (let i = 0; i < dataTempChartVulnes_risk.length; i++) {
                    relativeHexColorYParameter(i, dataTempChartVulnes_risk, 79.75);
                }
                for (let k = 0; k < $scope.dashboard.scales.length; k++) {
                    if ($scope.dashboard.scales[k].type == "vulnerability") {
                        if ($scope.dashboard.scales[k].min == 0) {
                            optionsChartVulnerabilities_discreteBarChart.chart.yDomain = [$scope.dashboard.scales[k].min, $scope.dashboard.scales[k].max];
                        } else {
                            optionsChartVulnerabilities_discreteBarChart.chart.yDomain = [$scope.dashboard.scales[k].min - 1, $scope.dashboard.scales[k].max];
                        }
                        if ($scope.dashboard.scales[k].min == 0) {
                            optionsChartVulnerabilities_horizontalBarChart.chart.yDomain = [$scope.dashboard.scales[k].min, $scope.dashboard.scales[k].max];
                        } else {
                            optionsChartVulnerabilities_horizontalBarChart.chart.yDomain = [$scope.dashboard.scales[k].min - 1, $scope.dashboard.scales[k].max];
                        }
                    }
                }
            }

            if ($scope.displayVulnerabilitiesBy == "max_associated_risk") {
                // optionsChartVulnerabilities_discreteBarChart.chart.yAxis.axisLabel = gettextCatalog.getString("Max. associated risk");
                for (let i = 0; i < dataTempChartVulnes_risk.length; i++) {
                    relativeHexColorMaxRiskParameter(i, dataTempChartVulnes_risk, 79.75)
                }
                for (let i = 0; i < dataTempChartVulnes_risk.length; i++) {
                    dataTempChartVulnes_risk[i].y = dataTempChartVulnes_risk[i].max_risk;
                }
            }
            if (dataTempChartVulnes_risk.length >= $scope.vulnerabilitiesDisplayed && $scope.vulnerabilitiesDisplayed != "all") {
                for (var j = 0; j < $scope.vulnerabilitiesDisplayed; ++j) { //Only keeps first X elements of array
                    dataChartVulnes_risk[0].values.push(dataTempChartVulnes_risk[j]);
                }
            } else {
                for (var j = 0; j < dataTempChartVulnes_risk.length; ++j) { //Only keeps first X elements of array
                    dataChartVulnes_risk[0].values.push(dataTempChartVulnes_risk[j]);
                }
            }
            delete optionsChartVulnerabilities_discreteBarChart.chart.yDomain;
            delete optionsChartVulnerabilities_horizontalBarChart.chart.yDomain;
            promise.resolve(dataChartVulnes_risk);
            return promise.promise;
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

            impacts.forEach(function (impact) {
                likelihoods.forEach(function (likelihood) {
                    dataChartCartoCurrent.push({
                        impact: impact,
                        likelihood: likelihood,
                        risks: (countersCurrent[impact] !== undefined && countersCurrent[impact][likelihood] !== undefined) ? countersCurrent[impact][likelihood] : null,
                        color: (impact * likelihood <= $scope.dashboard.anr.seuil1) ? '#D6f107' :
                            (impact * likelihood > $scope.dashboard.anr.seuil2) ? '#FD661F' : '#FFBC1C'
                    })

                    dataChartCartoTarget.push({
                        impact: impact,
                        likelihood: likelihood,
                        risks: (countersTarget[impact] !== undefined && countersTarget[impact][likelihood] !== undefined) ? countersTarget[impact][likelihood] : null,
                        color: (impact * likelihood <= $scope.dashboard.anr.seuil1) ? '#D6f107' :
                            (impact * likelihood > $scope.dashboard.anr.seuil2) ? '#FD661F' : '#FFBC1C'
                    })
                });
                probabilities.forEach(function (likelihood) {
                    dataChartCartoRiskOpCurrent.push({
                        impact: impact,
                        likelihood: likelihood,
                        risks: (countersRiskOpCurrent[impact] !== undefined && countersRiskOpCurrent[impact][likelihood] !== undefined) ? countersRiskOpCurrent[impact][likelihood] : null,
                        color: (impact * likelihood <= $scope.dashboard.anr.seuilRolf1) ? '#D6f107' :
                            (impact * likelihood > $scope.dashboard.anr.seuilRolf2) ? '#FD661F' : '#FFBC1C'
                    })

                    dataChartCartoRiskOpTarget.push({
                        impact: impact,
                        likelihood: likelihood,
                        risks: (countersRiskOpTarget[impact] !== undefined && countersRiskOpTarget[impact][likelihood] !== undefined) ? countersRiskOpTarget[impact][likelihood] : null,
                        color: (impact * likelihood <= $scope.dashboard.anr.seuilRolf1) ? '#D6f107' :
                            (impact * likelihood > $scope.dashboard.anr.seuilRolf2) ? '#FD661F' : '#FFBC1C'
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
                dataChartCompliance[ref.uuid] = [[], []];
                categories
                    .filter(category => category.referential.uuid == ref.uuid && categoriesIds.includes(category.id))
                    .forEach(function (cat) {
                        let catCurrentData = {
                            axis: cat['label' + $scope.dashboard.anr.language],
                            id: cat.id,
                            value: null,
                            controls: [[], []]
                        }
                        let catTargetData = {
                            axis: cat['label' + $scope.dashboard.anr.language],
                            id: cat.id,
                            value: null,
                            controls: [[], []]
                        }
                        let currentSoas = data.filter(soa => soa.measure.category.id == cat.id);
                        let targetSoas = data.filter(soa => soa.measure.category.id == cat.id && soa.EX != 1);
                        currentSoas.forEach(function (soa) {
                            if (soa.EX == 1) {
                                soa.compliance = 0;
                            }
                            let controlCurrentData = {
                                axis: soa.measure.code,
                                value: (soa.compliance * 0.2).toFixed(2),
                                uuid: soa.measure.uuid
                            }
                            let controlTargetData = {
                                axis: soa.measure.code,
                                value: ((soa.EX == 1) ? 0 : 1),
                                uuid: soa.measure.uuid
                            }
                            catCurrentData.controls[0].push(controlCurrentData);
                            catCurrentData.controls[1].push(controlTargetData);

                            catTargetData.controls[0].push(controlCurrentData);
                            catTargetData.controls[1].push(controlTargetData);
                        });

                        let complianceCurrentValues = currentSoas.map(soa => soa.compliance);
                        let sum = complianceCurrentValues.reduce(function (a, b) {
                            return a + b;
                        }, 0);
                        let currentAvg = (sum / complianceCurrentValues.length) * 0.2;
                        let targetAvg = (targetSoas.length / complianceCurrentValues.length);
                        catCurrentData.value = currentAvg.toFixed(2);
                        catTargetData.value = targetAvg.toFixed(2);
                        dataChartCompliance[ref.uuid][0].push(catCurrentData);
                        dataChartCompliance[ref.uuid][1].push(catTargetData);
                    })
            });
        }

        $scope.goBackChartCompliance = function () {
            document.getElementById("goBack").style.visibility = 'hidden';
            radarChart('#graphCompliance', optionsChartCompliance, dataChartCompliance[$scope.dashboard.refSelected], true);
            $scope.dashboard.deepGraph = false;
        }

//==============================================================================

        /*
        * Generate Radar Chart
        */
        const radarChart = function (id, cfg, d, deepData = false) {
            cfg.maxValue = Math.max(cfg.maxValue, d3.max(d, function (i) {
                return d3.max(i.map(function (o) {
                    return o.value;
                }))
            }));
            let allAxis = (d[0].map(function (i, j) {
                return {axis: i.axis, id: i.id}
            }));
            let total = allAxis.length;
            let radius = cfg.factor * Math.min(cfg.w / 2, cfg.h / 2);
            let Format = d3.format('%');
            d3.select(id).select("svg").remove();

            let g = d3.select(id)
                .append("svg")
                .attr("width", cfg.w + cfg.ExtraWidthX)
                .attr("height", cfg.h + cfg.ExtraWidthY)
                .append("g")
                .attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")");
            let tooltip;

            //Circular segments
            for (let j = 0; j < cfg.levels; j++) {
                let levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
                g.selectAll(".levels")
                    .data(allAxis)
                    .enter()
                    .append("svg:line")
                    .attr("x1", function (d, i) {
                        return levelFactor * (1 - cfg.factor * Math.sin(i * cfg.radians / total));
                    })
                    .attr("y1", function (d, i) {
                        return levelFactor * (1 - cfg.factor * Math.cos(i * cfg.radians / total));
                    })
                    .attr("x2", function (d, i) {
                        return levelFactor * (1 - cfg.factor * Math.sin((i + 1) * cfg.radians / total));
                    })
                    .attr("y2", function (d, i) {
                        return levelFactor * (1 - cfg.factor * Math.cos((i + 1) * cfg.radians / total));
                    })
                    .attr("class", "line")
                    .style("stroke", "grey")
                    .style("stroke-opacity", "0.75")
                    .style("stroke-width", "0.3px")
                    .attr("transform", "translate(" + (cfg.w / 2 - levelFactor) + ", " + (cfg.h / 2 - levelFactor) + ")");
            }

            //Text indicating at what % each level is
            for (let j = 0; j < cfg.levels; j++) {
                let levelFactor = cfg.factor * radius * ((j + 1) / cfg.levels);
                g.selectAll(".levels")
                    .data([1]) //dummy data
                    .enter()
                    .append("svg:text")
                    .attr("x", function (d) {
                        return levelFactor * (1 - cfg.factor * Math.sin(0));
                    })
                    .attr("y", function (d) {
                        return levelFactor * (1 - cfg.factor * Math.cos(0));
                    })
                    .attr("class", "legend")
                    .style("font-family", "sans-serif")
                    .style("font-size", "10px")
                    .attr("transform", "translate(" + (cfg.w / 2 - levelFactor + cfg.ToRight) + ", " + (cfg.h / 2 - levelFactor) + ")")
                    .attr("fill", "#737373")
                    .text(Format((j + 1) * cfg.maxValue / cfg.levels));
            }

            series = 0;

            let axis = g.selectAll(".axis")
                .data(allAxis)
                .enter()
                .append("g")
                .attr("class", "axis");

            axis.append("line")
                .attr("x1", cfg.w / 2)
                .attr("y1", cfg.h / 2)
                .attr("x2", function (d, i) {
                    return cfg.w / 2 * (1 - cfg.factor * Math.sin(i * cfg.radians / total));
                })
                .attr("y2", function (d, i) {
                    return cfg.h / 2 * (1 - cfg.factor * Math.cos(i * cfg.radians / total));
                })
                .attr("class", "line")
                .style("stroke", "grey")
                .style("stroke-width", "1px");

            axis.append("text")
                .attr("class", "legend")
                .text(function (d) {
                    return d.axis
                })
                .style("font-family", "sans-serif")
                .style("font-size", "11px")
                .attr("text-anchor", "middle")
                .attr("dy", "1.5em")
                .attr("transform", function (d, i) {
                    return "translate(0, -10)"
                })
                .attr("x", function (d, i) {
                    return cfg.w / 2 * (1 - cfg.factorLegend * Math.sin(i * cfg.radians / total)) - 60 * Math.sin(i * cfg.radians / total);
                })
                .attr("y", function (d, i) {
                    return cfg.h / 2 * (1 - cfg.factorLegend * Math.cos(i * cfg.radians / total)) - 20 * Math.cos(i * cfg.radians / total);
                })
                .call(wrap, 200)
                .on('mouseover', function (d) {
                    (deepData) ?
                        d3.select(this).style("cursor", "pointer").style("font-weight", "bold") :
                        d3.select(this).style("cursor", "text").style("font-weight", "normal")
                })
                .on('mouseout', function (d) {
                    d3.select(this).style("cursor", "text").style("font-weight", "normal")
                })
                .on("click", function (e) {
                        if (deepData) {
                            d3.select(this).style("cursor", "pointer");
                            let controls = d[0].filter(controls => controls.id == e.id);
                            document.getElementById("goBack").style.visibility = 'visible';
                            radarChart('#graphCompliance', optionsChartCompliance, controls[0]['controls']);
                            $scope.dashboard.deepGraph = true;
                        }
                    }
                );

            d.forEach(function (y, x) {
                dataValues = [];
                g.selectAll(".nodes")
                    .data(y, function (j, i) {
                        dataValues.push([
                            cfg.w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total)),
                            cfg.h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total))
                        ]);
                    });
                dataValues.push(dataValues[0]);

                g.selectAll(".area")
                    .data([dataValues])
                    .enter()
                    .append("polygon")
                    .attr("class", "radar-chart-serie" + series)
                    .style("stroke-width", "2px")
                    .style("stroke", cfg.color(series))
                    .attr("points", function (d) {
                        let str = "";
                        for (let pti = 0; pti < d.length; pti++) {
                            str = str + d[pti][0] + "," + d[pti][1] + " ";
                        }
                        return str;
                    })
                    .style("fill", (series == 1) ? 'none' : cfg.color(series))
                    .style("fill-opacity", cfg.opacityArea)
                    .on('mouseover', function (d) {
                        z = "polygon." + d3.select(this).attr("class");
                        g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", 0.1);
                        g.selectAll(z)
                            .transition(200)
                            .style("fill-opacity", .7);
                    })
                    .on('mouseout', function () {
                        g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", ((series == 0) ? 0 : cfg.opacityArea));
                    });
                series++;
            });
            series = 0;


            d.forEach(function (y, x) {
                g.selectAll(".nodes")
                    .data(y).enter()
                    .append("svg:circle")
                    .attr("class", "radar-chart-serie" + series)
                    .attr('r', cfg.radius)
                    .attr("alt", function (j) {
                        return Math.max(j.value, 0)
                    })
                    .attr("cx", function (j, i) {
                        dataValues.push([
                            cfg.w / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total)),
                            cfg.h / 2 * (1 - (parseFloat(Math.max(j.value, 0)) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total))
                        ]);
                        return cfg.w / 2 * (1 - (Math.max(j.value, 0) / cfg.maxValue) * cfg.factor * Math.sin(i * cfg.radians / total));
                    })
                    .attr("cy", function (j, i) {
                        return cfg.h / 2 * (1 - (Math.max(j.value, 0) / cfg.maxValue) * cfg.factor * Math.cos(i * cfg.radians / total));
                    })
                    .attr("data-id", function (j) {
                        return j.axis
                    })
                    .style("fill", cfg.color(series)).style("fill-opacity", .9)
                    .on('mouseover', function (d) {
                        newX = parseFloat(d3.select(this).attr('cx')) - 10;
                        newY = parseFloat(d3.select(this).attr('cy')) - 5;

                        tooltip
                            .attr('x', newX)
                            .attr('y', newY)
                            .text(Format(d.value))
                            .transition(200)
                            .style('opacity', 1);

                        z = "polygon." + d3.select(this).attr("class");
                        g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", 0.1);
                        g.selectAll(z)
                            .transition(200)
                            .style("fill-opacity", .7);
                    })
                    .on('mouseout', function () {
                        tooltip
                            .transition(200)
                            .style('opacity', 0);
                        g.selectAll("polygon")
                            .transition(200)
                            .style("fill-opacity", cfg.opacityArea);
                    })
                    .append("svg:title")
                    .text(function (j) {
                        return Math.max(j.value, 0)
                    });

                series++;
            });
            //Tooltip
            tooltip = g.append('text')
                .style('opacity', 0)
                .style('font-family', 'sans-serif')
                .style('font-size', '13px');

            //legend

            if (cfg.legend) {
                let legendZone = g.append('g');
                let names = cfg.legend;

                let legend = legendZone.append("g")
                    .attr("class", "legend")
                    .attr("height", 100)
                    .attr("width", 200)
                    .attr('transform', `translate(${cfg.TranslateX},${cfg.TranslateY})`);
                // Create rectangles markers
                legend.selectAll('rect')
                    .data(names)
                    .enter()
                    .append("rect")
                    .attr("x", cfg.w - 65)
                    .attr("y", (d, i) => i * 20)
                    .attr("width", 10)
                    .attr("height", 10)
                    .style("fill", (d, i) => cfg.color(i));
                // Create labels
                legend.selectAll('text')
                    .data(names)
                    .enter()
                    .append("text")
                    .attr("x", cfg.w - 52)
                    .attr("y", (d, i) => i * 20 + 9)
                    .attr("font-size", "11px")
                    .attr("fill", "#737373")
                    .text(d => d);
            }
        };

        const wrap = function (text, width) {
            text.each(function () {
                let text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    x = text.attr("x"),
                    y = text.attr("y"),
                    dy = 0, //parseFloat(text.attr("dy")),
                    tspan = text.text(null)
                        .append("tspan")
                        .attr("x", x)
                        .attr("y", y)
                        .attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
                        line.pop();
                        tspan.text(line.join(" "));
                        line = [word];
                        tspan = text.append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", ++lineNumber * lineHeight + dy + "em")
                            .text(word);
                    }
                }
            });
        }
    }
})();

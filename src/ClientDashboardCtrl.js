(function () {

    angular
        .module('ClientApp')
        .controller('ClientDashboardCtrl', [
            '$scope', '$state', '$http', 'gettextCatalog', 'toastr', '$rootScope', '$timeout',
            '$stateParams', 'AnrService', 'ClientAnrService', 'ReferentialService', 'SOACategoryService',
            'ClientSoaService', ClientDashboardCtrl
        ]);

    /**
     * Dashboard Controller for the Client module
     */
    function ClientDashboardCtrl($scope, $state, $http, gettextCatalog, toastr, $rootScope, $timeout,
                                 $stateParams, AnrService, ClientAnrService, ReferentialService, SOACategoryService,
                                 ClientSoaService) {

        $scope.dashboard = {
            anr: null,
            data: [],
            carto: undefined,
            currentTabIndex: 0,
            deepGraph: false,
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

//==============================================================================



        //The two following arrays are used for the breadcrumb for parent asset charts

        $scope.dashboard.currentRisksBreadcrumb = [gettextCatalog.getString("Overview")];
        $scope.dashboard.targetRisksBreadcrumb = [gettextCatalog.getString("Overview")];

        $scope.firstRefresh=true;

        $scope.selectGraphRisks = function () { //Displays the risks charts
        };

        $scope.selectGraphThreats = function () { //Displays the threats charts
        };

        $scope.selectGraphVulnerabilities = function () { //Displays the vulnerabilities charts
        };

        $scope.selectGraphCartography = function () { //Displays the cartography
            loadGraph($scope.graphCartography,optionsChartCartography,dataChartCartography);
        };

        $scope.selectGraphCompliance = function () { //Displays the Compliance tab
          if (!$scope.dashboard.deepGraph) {
            document.getElementById("goBack").style.visibility = 'hidden';
          }
          RadarChart('#graphCompliance', optionsChartCompliance, dataChartCompliance[$scope.dashboard.refSelected], true);
        };

        $scope.selectGraphPerspective = function () { //Displays the persepctive charts

        };

        $scope.serializeQueryString = function (obj) { // helps with creating a URL (if the clicking feature is enabled)
            var str = [];
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                }
            }
            return str.join('&');
        };

//==============================================================================

         //Options of the chart that displays current risks by level
         optionsCartoRisk_discreteBarChart_current = {
           chart: {
             type: 'discreteBarChart',
             height: 450,
             width: 450,
             margin : {
                 top: 20,
                 right: 20,
                 bottom: 50,
                 left: 55
             },
             x: function(d){return d.label;},
             y: function(d){return d.value;},
             showValues: true,
             valueFormat: function(d){
                 return (d);
             },
             duration: 500,
             xAxis: {
                 axisLabel: ''
             },
             yAxis: {
                 axisLabel: gettextCatalog.getString('Current risks'),
                 axisLabelDistance: -10,
                 tickFormat: function(d){ //display only integers
                   if(Math.floor(d) != d)
                     {
                         return;
                     }

                     return d;
                 }
             }
           }
         };

         //Options of the chart that displays Residual risks by level
         optionsCartoRisk_discreteBarChart_target = {
            chart: {
             type: 'discreteBarChart',
             height: 450,
             width: 450,
             margin : {
                 top: 20,
                 right: 20,
                 bottom: 50,
                 left: 55
             },
             x: function(d){return d.label;},
             y: function(d){return d.value;},
             showValues: true,
             valueFormat: function(d){
               return (d);
             },
             duration: 500,
             xAxis: {
                 axisLabel: ''
             },
             yAxis: {
               axisLabel: gettextCatalog.getString('Residual risks'),
               axisLabelDistance: -10,
               tickFormat: function(d){ //display only integers
                 if(Math.floor(d) != d){
                     return;
                 }
                     return d;
               }
             }
           }
         };

//==============================================================================

         //Options for the pie chart for current risks
         optionsCartoRisk_pieChart = {
           chart : {
             type: "pieChart",
             height: 650,
             width: 450,
             duration: 500,
             showLabels: true,
             labelType: "value",
             objectEquality: true,
             donut: true,
             donutRatio: 0.60,
             valueFormat: function(d){
                 return (d);
             },
             x: function(d){return d.label;},
             y: function(d){return d.value;},
           }
         };

//==============================================================================

       //Options for the chart that displays the current risks by asset
       optionsChartCurrentRisksByAsset = {
            chart: {
                type: 'multiBarChart',
                height: 850,
                width: 450,
                margin : {
                    top: 0,
                    right: 20,
                    bottom: 250,
                    left: 45
                },
                multibar: {
                  dispatch: { //on click switch to the evaluated risk
                    elementClick: function(e){
                      $state.transitionTo("main.project.anr.instance",{modelId: $scope.dashboard.anr.id, instId: e.data.id}, {notify: true, relative:null, location: true, inherit: false, reload:true});
                    }
                  }
                },

                clipEdge: true,
                //staggerLabels: true,
                duration: 500,
                stacked: true,
                reduceXTicks: false,
                staggerLabels : false,
                wrapLabels : false,
                xAxis: {
                    showMaxMin: false,
                    rotateLabels : 90,
                    height : 150,
                    tickFormat: function(d){
                        return (d);
                    }
                },
                yAxis: {
                    axisLabel: gettextCatalog.getString('Current risk'),
                    axisLabelDistance: -20,
                    tickFormat: function(d){
                        return (d);
                    }
                }
            },
      };

//==============================================================================

      optionsChartTargetRisksByAsset = {
           chart: {
               type: 'multiBarChart',
               height: 850,
               width: 450,
               margin : {
                   top: 0,
                   right: 20,
                   bottom: 250,
                   left: 45
               },
               multibar: {
                 dispatch: { //on click switch to the evaluated risk
                   elementClick: function(e){
                     $state.transitionTo("main.project.anr.instance",{modelId: $scope.dashboard.anr.id, instId: e.data.id}, {notify: true, relative:null, location: true, inherit: false, reload:true});
                   }
                 }
               },

               clipEdge: true,
               //staggerLabels: true,
               duration: 500,
               stacked: true,
               reduceXTicks: false,
               staggerLabels : false,
               wrapLabels : false,
               xAxis: {
                   showMaxMin: false,
                   rotateLabels : 90,
                   height : 150,
                   tickFormat: function(d){
                       return (d);
                   }
               },
               yAxis: {
                   axisLabel: gettextCatalog.getString('Residual risks'),
                   axisLabelDistance: -20,
                   tickFormat: function(d){
                       return (d);
                   }
               }
           },
     };

//==============================================================================

      //Options for the charts that display the risks by parent asset
      optionsChartCurrentRisksByParentAsset = {
           chart: {
               type: 'multiBarChart',
               height: 850,
               width: 450,
               margin : {
                   top: 0,
                   right: 20,
                   bottom: 250,
                   left: 45
               },
               multibar: {
                 dispatch: {
                   elementClick: function(element){ //on click go one child deeper (node) or go to MONARC (leaf)
                     if (element.data.child.length>0){
                       updateCurrentRisksByParentAsset(element.data.child);
                       $scope.dashboard.currentRisksBreadcrumb.push(element.data.x);
                       $scope.dashboard.currentRisksParentAssetMemoryTab.push(dataChartCurrentRisksByParentAsset);
                       loadGraph($scope.graphCurrentRisks, optionsChartCurrentRisksByParentAsset, dataChartCurrentRisksByParentAsset);
                     }
                     else{
                       $state.transitionTo("main.project.anr.instance",{modelId: $scope.dashboard.anr.id, instId: element.data.asset_id}, {notify: true, relative:null, location: true, inherit: false, reload:true});
                     }
                   }
                 }
               },

               clipEdge: true,
               //staggerLabels: true,
               duration: 500,
               stacked: false,
               reduceXTicks: false,
               staggerLabels : false,
               wrapLabels : false,
               xAxis: {
                   showMaxMin: false,
                   rotateLabels : 90,
                   height : 150,
                   tickFormat: function(d){
                       return (d);
                   }
               },
               yAxis: {
                    axisLabel: gettextCatalog.getString("Current risks"),
                   axisLabelDistance: -20,
                   tickFormat: function(d){ //display only integers
                     if(Math.floor(d) != d)
                       {
                           return;
                       }

                       return d;
                   }
               }
           },
     };

//==============================================================================

     //Options for the charts that display the risks by parent asset
     optionsChartTargetRisksByParentAsset = {
          chart: {
              type: 'multiBarChart',
              height: 850,
              width: 450,
              margin : {
                  top: 0,
                  right: 20,
                  bottom: 250,
                  left: 45
              },
              multibar: {
                dispatch: { //on click go one child deeper (node) or go to MONARC (leaf)
                  elementClick: function(element){
                    if (element.data.child.length>0){
                      updateTargetRisksByParentAsset(element.data.child);
                      $scope.dashboard.targetRisksBreadcrumb.push(element.data.x);
                      $scope.dashboard.targetRisksParentAssetMemoryTab.push(dataChartTargetRisksByParentAsset);
                      loadGraph($scope.graphTargetRisks, optionsChartTargetRisksByParentAsset, dataChartTargetRisksByParentAsset);

                    }
                    else{
                      $state.transitionTo("main.project.anr.instance",{modelId: $scope.dashboard.anr.id, instId: element.data.asset_id}, {notify: true, relative:null, location: true, inherit: false, reload:true});
                    }
                  }
                }
              },

              clipEdge: true,
              //staggerLabels: true,
              duration: 500,
              stacked: false,
              reduceXTicks: false,
              staggerLabels : false,
              wrapLabels : false,
              xAxis: {
                  showMaxMin: false,
                  rotateLabels : 90,
                  height : 150,
                  tickFormat: function(d){
                      return (d);
                  }
              },
              yAxis: {
                  axisLabel: gettextCatalog.getString("Residual risks"),
                  axisLabelDistance: -20,
                  tickFormat: function(d){ //display only integers
                    if(Math.floor(d) != d)
                      {
                          return;
                      }

                      return d;
                  }
              }
          },
    };

//==============================================================================

     //Options for the chart that displays threats by their number of occurrences
     optionsChartThreats_discreteBarChart = {
          chart: {
              type: 'discreteBarChart',
              height: 800,
              width: 1400,
              margin : {
                  top: 20,
                  right: 250,
                  bottom: 200,
                  left: 45
              },
              discretebar: {
                dispatch: { //on click switch to the evaluated risk
                  elementClick: function(e){
                    // var keywords=e.data.x.replace(/ /g,"+");
                    // var params = angular.copy($scope.risks_filters);
                    // var anr = 'anr';
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
              staggerLabels : false,
              wrapLabels : false,
              showValues: true,
              valueFormat: function(d){
                  return (Math.round(d * 100) / 100);
              },
              xAxis: {
                  tickDecimals: 0,
                  showMaxMin: false,
                  rotateLabels : 30,
                  height : 150,
                  tickFormat: function(d){
                      return (d);
                  }
              },
              yAxis: {
                  axisLabelDistance: -20,
                  tickFormat: function(d){ //display only integers
                    if(Math.floor(d) != d)
                      {
                          return;
                      }

                      return d;
                  }
              }
          },
    };

    //Options for the chart that displays threats by their number of occurrences
    optionsChartThreats_multiBarHorizontalChart = {
         chart: {
             type: 'multiBarHorizontalChart',
             height: 800,
             width: 1400,
             margin : {
                 top: 20,
                 right: 250,
                 bottom: 200,
                 left: 400
             },
             barColor:(d3.scale.category20().range()),
             multibar: {
               dispatch: { //on click switch to the evaluated risk
                 elementClick: function(e){
                   // var keywords=e.data.x.replace(/ /g,"+");
                   // var params = angular.copy($scope.risks_filters);
                   // var anr = 'anr';
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
             staggerLabels : false,
             wrapLabels : false,
             showValues: true,
             valueFormat: function(d){
                 return (Math.round(d * 100) / 100);
             },
             xAxis: {
                 tickDecimals: 0,
                 showMaxMin: false,
                 rotateLabels : 30,
                 height : 150,
                 tickFormat: function(d){
                     return (d);
                 }
             },
             yAxis: {
                 axisLabelDistance: -10,
                 tickFormat: function(d){ //display only integers
                   if(Math.floor(d) != d)
                     {
                         return;
                     }

                     return d;
                 }
             }
         },
   };

//==============================================================================

    //Options for the chart that displays vulnerabilities by their maximum associated risk
    optionsChartVulnerabilities_discreteBarChart = {
        chart: {
            type: 'discreteBarChart',
            height: 800,
            width: 1400,
            margin : {
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
            staggerLabels : false,
            wrapLabels : false,
            y: function(d){return d.y},
            showValues : true,
            valueFormat: function(d){
                return (Math.round(d * 100) / 100);
            },
            xAxis: {
                showMaxMin: false,
                rotateLabels : 45,
                height : 150,
                tickFormat: function(d){
                    return (d);
                }
            },
            yAxis: {
                axisLabel: "",
                axisLabelDistance: -20,
                tickFormat: function(d){ //display only integers
                  if(Math.floor(d) != d)
                    {
                        return;
                    }

                    return d;
                }
            }
        },
    }

    optionsChartVulnerabilities_horizontalBarChart = {
        chart: {
            type: 'multiBarHorizontalChart',
            height: 800,
            width: 1400,
            margin : {
                top: 20,
                right: 250,
                bottom: 100,
                left: 400
            },
            barColor:(d3.scale.category20().range()),
            clipEdge: true,
            //staggerLabels: true,
            duration: 500,
            stacked: false,
            showLegend: false,
            showControls: false,
            reduceXTicks: false,
            staggerLabels : false,
            wrapLabels : false,
            showValues : true,
            valueFormat: function(d){
                return (Math.round(d * 100) / 100);
            },
            xAxis: {
                showMaxMin: false,
                rotateLabels : 45,
                height : 150,
                tickFormat: function(d){
                    return (d);
                }
            },
            yAxis: {
                axisLabelDistance: -10,
                tickFormat: function(d){ //display only integers
                  if(Math.floor(d) != d)
                    {
                        return;
                    }

                    return d;
                }
            }
        },
    }

//==============================================================================

    //Options for the chart that displays the cartography
     optionsChartCartography = {
        chart: {
          type: "scatterChart",
          height: 600,
          width: 1200,
          showDistX: true,
          showDistY: true,
          duration: 350,
          xDomain: [1, 1], //Replaced in the updateCartography function
          yDomain: [1, 1], //Replaced in the updateCartography function
          showValues: true,
          showLabels: true,
          showMaxMin: false,
          scatter: {
            onlyCircles: true,
          },
          tooltip: {
              contentGenerator: function(d) {
                  return d.point.size/5 + " " + gettextCatalog.getString('risks with probability') + " " + d.point.x + " " + gettextCatalog.getString('and an impact') + " " + d.point.y + " " + gettextCatalog.getString('on') + " " + d.point.mesured;
              }
          },
          xAxis: {
            axisLabel: gettextCatalog.getString('Likelihood')
          },
          yAxis: {
            axisLabel: gettextCatalog.getString('Impact'),
            axisLabelDistance: -5,
            tickFormat: function(d){ //display only integers
              if(Math.floor(d) != d)
                {
                    return;
                }

                return d;
            }
          },
          x: function(d){return d.x;},
          y: function(d){return d.y;},
          size: function(d){return d.size;},
          pointDomain: [0, 10],
        }
    }

//==============================================================================

    //Options for the chart that displays the compliance
    optionsChartCompliance = {
       radius: 5,
       w: 650,
       h: 650,
       factor: 1,
       factorLegend: 1.1,
       levels: 5,
       maxValue: 1,
       radians: 2 * Math.PI,
       opacityArea: 0.5,
       ToRight: 5,
       TranslateX: 200,
       TranslateY: 30,
       ExtraWidthX: 500,
       ExtraWidthY: 150,
       legend: [gettextCatalog.getString("Current level"), gettextCatalog.getString("Applicable target level")],
       color: d3.scale.category10()
    };

// DATA MODELS =================================================================

        //Data Model for the graph for the current risk by level of risk (low, med., high)
        dataChartCurrentRisksByLevel_discreteBarChart = [
            {
              key: "currentRiskGraph",
              values: [
                  {
                      "label" : gettextCatalog.getString('Low risks'),
                      "value" : 0,
                      "color" : '#D6F107'
                  } ,
                  {
                      "label" : gettextCatalog.getString('Medium risks'),
                      "value" : 0,
                      "color" : '#FFBC1C'
                  } ,
                  {

                      "label" : gettextCatalog.getString('High risks'),
                      "value" : 0,
                      "color" : '#FD661F'
                  }
                ]
            }
        ];

        dataChartCurrentRisksByLevel_pieChart=[
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
        dataChartCurrentRisksByAsset = [
            {
                key: gettextCatalog.getString('Low risks'),
                values: [],
                color : '#D6F107'
            },
            {
                 key: gettextCatalog.getString('Medium risks'),
                 values: [],
                 color : '#FFBC1C'
             },
             {
                 key: gettextCatalog.getString('High risks'),
                 values: [],
                 color : '#FD661F'
             }
        ];

         //Data model for the graph for the target risk by level of risk (low, med., high)
         dataChartTargetRisksByLevel_discreteBarChart = [
             {
               key: "targetRiskGraph",
               values: [
                   {
                       "label": gettextCatalog.getString('Low risks'),
                       "value" : 0,
                       "color" : '#D6F107'
                   } ,
                   {
                       "label": gettextCatalog.getString('Medium risks'),
                       "value" : 0,
                       "color" : '#FFBC1C'
                   } ,
                   {
                       "label": gettextCatalog.getString('High risks'),
                       "value" : 0,
                       "color" : '#FD661F'
                   }
                 ]
             }
         ];

        dataChartTargetRisksByLevel_pieChart=[
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
        dataChartTargetRisksByAsset = [
          {
              key: gettextCatalog.getString('Low risks'),
              values: [],
              color : '#D6F107'
          },
          {
               key: gettextCatalog.getString('Medium risks'),
               values: [],
               color : '#FFBC1C'
           },
           {
               key: gettextCatalog.getString('High risks'),
               values: [],
               color : '#FD661F'
           }
        ];

        //Data for the graph for the number of threats by threat type
        dataChartThreats = [
              {
                key: "",
                values: []
              }
        ];

        //Data for the graph for the number of vulnerabilities by vulnerabilities type
        dataChartVulnes_number = [
              {
                key: "",
                values: []
              },
        ];

        //Data for the graph for the vulnerabilities by vulnerabilities risk
        dataChartVulnes_risk = [
              {
                key: "",
                values: []
              },
        ];

        //Data for the graph for the vulnerabilities by vulnerabilities risk
        dataChartCartography = [];

        //Data for the graph for the compliance
        dataChartCompliance = [];

//==============================================================================

        /*
        * load a new graph with options and data
        */
        function loadGraph(api, options, data){
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

        $scope.exportAsPNG = function (idOfGraph, name,parametersAction = { backgroundColor: 'white'}){
            if (idOfGraph == 'graphVulnerabilities') {
              parametersAction = { backgroundColor: 'white', height:'1100'}
            }
            var node = d3.select('#'+idOfGraph).select("svg");
            saveSvgAsPng(node.node(), name + '.png', parametersAction);
        }

//==============================================================================

        /*
        * Add a clickable title on a graph. The title created have the id idOfGraph+Title
        * @param idOfGraph : string  : the id of the graph
        * @param titleText : string : the text to be diplayed as title
        * @param action : function : the name of the function on the click on the title
        * @parametersAction : Array : the parameters of the action
        */
        function d3AddClickableTitleAction(idOfGraph, titleText, action, parametersAction, id){
          var sampleSVG = d3.selectAll("#"+idOfGraph)
            .append('button', ":last-child")
            .attr("class", 'added-button')
            .attr('id', id)
            .on('click', function(){action.apply(this, parametersAction)})
            .text(titleText);
        }

//==============================================================================
        function updateGraphs(){

          $scope.dashboard.currentRisksParentAssetMemoryTab = [];
          $scope.dashboard.targetRisksParentAssetMemoryTab = [];
          $scope.displayCurrentRisksBy = $scope.displayTargetRisksBy = "level";

          ClientAnrService.getAnr($stateParams.modelId).then(function (data) {
            $scope.dashboard.anr = data;
            $http.get("api/client-anr/" + $scope.dashboard.anr.id + "/carto-risks-dashboard").then(function (data) {
              updateCartoRisks(data);
              $scope.dashboard.carto = data.data.carto;

              AnrService.getScales($scope.dashboard.anr.id).then(function (data) {
                $scope.dashboard.scales = data.scales;

                AnrService.getInstances($scope.dashboard.anr.id,).then(function(data){
                  $scope.dashboard.instances = data.instances;

                  AnrService.getAnrRisksOp($scope.dashboard.anr.id,{limit:-1}).then(function(data){
                    $scope.dashboard.riskOp = data;
                    AnrService.getAnrRisks($scope.dashboard.anr.id,{limit:-1}).then(function(data){
                        $scope.dashboard.data = data;
                        updateCurrentRisksByAsset(data);
                        updateTargetRisksByAsset(data);
                        updateThreats(data);
                        updateVulnerabilities(data);
                        updateCurrentRisksByParentAsset(null);
                        updateTargetRisksByParentAsset(null);
                        updateCartography(data, $scope.dashboard.riskOp);
                        if ($scope.dashboard.currentTabIndex == 3) {
                          $scope.selectGraphCartography();
                        }
                        ReferentialService.getReferentials({order: 'createdAt'}).then(function (data) {
                          $scope.dashboard.referentials = [];
                          data['referentials'].forEach(function(ref){
                            if (Array.isArray(ref.measures)) {
                                $scope.dashboard.referentials.push(ref);
                            }
                          })
                          SOACategoryService.getCategories().then(function (data) {
                            $scope.dashboard.categories = data['categories'];
                            ClientSoaService.getSoas().then(function (data) {
                              $scope.dashboard.soa = data['soaMeasures'];
                              updateCompliance($scope.dashboard.referentials, $scope.dashboard.categories,$scope.dashboard.soa);
                              if ($scope.dashboard.referentials[0] && !$scope.dashboard.refSelected) {
                                $scope.dashboard.refSelected = $scope.dashboard.referentials[0].uuid;
                              }
                              $scope.selectGraphCompliance();
                            });
                          });
                        });
                        $scope.firstRefresh = false;
                    });
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
          if (!$scope.firstRefresh) {
              updateGraphs();
          }
         });

         if ($scope.firstRefresh) {
           updateGraphs();
         }


        /*
        * Prepare the array and the objects of risks by assets to be properly export in XLSX
        * @param mappedData, the source of the Data e.g. angular.copy(dataChartCurrentRisksByAsset).map(({key,values}) => ({key,values}));
        * @param id : the id referenced in the mappedData e.g. asset_id, id etc.
        */
        function makeDataExportableForByAsset(mappedData, id='id')
        {
          mappedData[0].values.forEach(function(obj){
            obj[gettextCatalog.getString('Asset')]=obj.x;
            obj[gettextCatalog.getString('Low risks')]= obj.y;
            for(i in mappedData[1].values)
              {
                if(obj[id] == mappedData[1].values[i][id] )
                  obj[gettextCatalog.getString('Medium risks')] = mappedData[1].values[i]['y'];
              }
            for(i in mappedData[2].values)
              {
                if(obj[id] == mappedData[2].values[i][id] )
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
         $scope.generateXlsxData = function (){
          //prepare by risk level
           var byLevel = dataChartCurrentRisksByLevel_discreteBarChart[0].values.map(({label,value}) => ({label,value}));
           byLevel.forEach(function(obj){
             obj[gettextCatalog.getString('Level')] = obj.label;
             obj[gettextCatalog.getString('Current risks')] = obj.value;
             delete obj.label;
             delete obj.value;
           });

           var byLevelResidual = dataChartTargetRisksByLevel_discreteBarChart[0].values.map(({label,value}) => ({label,value}));
           byLevelResidual.forEach(function(obj){
             obj[gettextCatalog.getString('Level')] = obj.label;
             obj[gettextCatalog.getString('Residual risks')] = obj.value;
             delete obj.label;
             delete obj.value;
           });

           //prepare risk by assets
          var byAsset = angular.copy(dataChartCurrentRisksByAsset).map(({key,values}) => ({key,values}));
          makeDataExportableForByAsset(byAsset);
          var byAssetResidual = angular.copy(dataChartTargetRisksByAsset).map(({key,values}) => ({key,values}));
          makeDataExportableForByAsset(byAssetResidual);

          //prepare threats info
          var byThreats = dataChartThreats[0].values.map(({x,y,average,max_risk}) => ({x,y,average,max_risk}));
          byThreats.forEach(function(obj){
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
          var byVulnerabilities = dataChartVulnes_risk[0].values.map(({x,y,average,max_risk}) => ({x,y,average,max_risk}));
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

          var byCurrentAssetParent = angular.copy(dataChartCurrentRisksByParentAsset).map(({key,values}) => ({key,values}));
          makeDataExportableForByAsset(byCurrentAssetParent, 'asset_id');

          var byTargetedAssetParent = angular.copy(dataChartTargetRisksByParentAsset).map(({key,values}) => ({key,values}));
          makeDataExportableForByAsset(byTargetedAssetParent, 'asset_id');

          //Compliance

          var byCompliance = [];
          var byComplianceTab = [];
          $scope.dashboard.referentials.forEach(function(ref){
            byCompliance[ref.uuid] = dataChartCompliance[ref.uuid][0].map(({axis,value}) => ({axis,value}));
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
          var bylevelTab = XLSX.utils.json_to_sheet(byLevel);
          var bylevelResidualTab = XLSX.utils.json_to_sheet(byLevelResidual);
          var byAssetTab = XLSX.utils.json_to_sheet(byAsset[0]['values']);
          var byAssetResidualTab = XLSX.utils.json_to_sheet(byAssetResidual[0]['values']);
          var byThreatsTab = XLSX.utils.json_to_sheet(byThreats);
          var byVulnerabilitiesTab = XLSX.utils.json_to_sheet(byVulnerabilities);
          var byCurrentAssetParentTab = XLSX.utils.json_to_sheet(byCurrentAssetParent[0]['values']);
          var byTargetedAssetParentTab = XLSX.utils.json_to_sheet(byTargetedAssetParent[0]['values']);

          /*add to workbook */
          var wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, bylevelTab, gettextCatalog.getString('Level').substring(0,31));
          XLSX.utils.book_append_sheet(wb, bylevelResidualTab, (gettextCatalog.getString('Residual risks')+'_'+gettextCatalog.getString('Level').substring(0,31)));
          XLSX.utils.book_append_sheet(wb, byAssetTab, gettextCatalog.getString('All assets').substring(0,31));
          XLSX.utils.book_append_sheet(wb, byAssetResidualTab, (gettextCatalog.getString('Residual risks')+'_'+gettextCatalog.getString('All assets')).substring(0,31));
          XLSX.utils.book_append_sheet(wb, byCurrentAssetParentTab, gettextCatalog.getString('Parent asset').substring(0,31));
          XLSX.utils.book_append_sheet(wb, byTargetedAssetParentTab, (gettextCatalog.getString('Residual risks')+'_'+gettextCatalog.getString('Parent asset')).substring(0,31));
          XLSX.utils.book_append_sheet(wb, byThreatsTab, gettextCatalog.getString('Threats').substring(0,31));
          XLSX.utils.book_append_sheet(wb, byVulnerabilitiesTab, gettextCatalog.getString('Vulnerabilities').substring(0,31));
          $scope.dashboard.referentials.forEach(function(ref){
            XLSX.utils.book_append_sheet(wb, byComplianceTab[ref.uuid], (gettextCatalog.getString('Compliance') + "_" + ref['label'+$scope.dashboard.anr.language]).substring(0,31).replace(/[:?*/[\]\\]+/g, ''));
          })

          /* write workbook and force a download */
          XLSX.writeFile(wb, "dashboard.xlsx");
        }

        $scope.$watchGroup(['displayCurrentRisksBy','currentRisksChartOptions'], function (newValues) {
            if (newValues[0]=="level" && $scope.currentRisksChartOptions) {
              if (newValues[1] == 'optionsCartoRisk_discreteBarChart_current') loadGraph($scope.graphCurrentRisks,window[newValues[1]],dataChartCurrentRisksByLevel_discreteBarChart);
              if (newValues[1] == 'optionsCartoRisk_pieChart') loadGraph($scope.graphCurrentRisks,window[newValues[1]],dataChartCurrentRisksByLevel_pieChart);
            }
            if (newValues[0]=="asset" && $scope.currentRisksChartOptions) {
              loadGraph($scope.graphCurrentRisks,optionsChartCurrentRisksByAsset,dataChartCurrentRisksByAsset);
            }
            if (newValues[0]=="parentAsset" && $scope.currentRisksChartOptions) {
              loadGraph($scope.graphCurrentRisks,optionsChartCurrentRisksByParentAsset,dataChartCurrentRisksByParentAsset);
            }
        });

        $scope.$watchGroup(['displayTargetRisksBy','targetRisksChartOptions'], function (newValues) {
            if (newValues[0]=="level" && $scope.targetRisksChartOptions) {
              if (newValues[1] == 'optionsCartoRisk_discreteBarChart_target') loadGraph($scope.graphTargetRisks,window[newValues[1]],dataChartTargetRisksByLevel_discreteBarChart);
              if (newValues[1] == 'optionsCartoRisk_pieChart') loadGraph($scope.graphTargetRisks,window[newValues[1]],dataChartTargetRisksByLevel_pieChart);
            }
            if (newValues[0]=="asset" && $scope.targetRisksChartOptions) {
              loadGraph($scope.graphTargetRisks,optionsChartTargetRisksByAsset,dataChartTargetRisksByAsset);
            }
            if (newValues[0]=="parentAsset" && $scope.dashboard.anr.id && $scope.targetRisksChartOptions) {
              loadGraph($scope.graphTargetRisks,optionsChartTargetRisksByParentAsset,dataChartTargetRisksByParentAsset);
            }
        });

        $scope.$watch('displayThreatsBy', function (newValue) {
          if ($scope.dashboard.data.count) {
            updateThreats($scope.dashboard.data);
          }
        });

        $scope.$watch('threatsChartOption', function (newValue) {
            if (newValue) {
              loadGraph($scope.graphThreats,window[newValue],dataChartThreats);
            }
        });

        $scope.$watchGroup(['dashboard.vulnerabilitiesDisplayed', 'displayVulnerabilitiesBy'], function (newValue) {
            if ($scope.dashboard.data.count) {
                updateVulnerabilities($scope.dashboard.data);
            }
        });

        $scope.$watch('vulnerabilitiesChartOption', function (newValue) {
            if (newValue){
              loadGraph($scope.graphVulnerabilities,window[newValue],dataChartVulnes_risk);
            }
        });

        $scope.$watch('cartographyRisksType', function (newValue) {
          if (newValue == "info_risks"){
            if ($scope.dashboard.data.count) {
                updateCartography($scope.dashboard.data, $scope.dashboard.riskOp);
                loadGraph($scope.graphCartography, optionsChartCartography, dataChartCartography);
            }
          }else {
            if ($scope.dashboard.riskOp) {
                updateCartography($scope.dashboard.data, $scope.dashboard.riskOp);
                loadGraph($scope.graphCartography, optionsChartCartography, dataChartCartography);
            }
          }
        });

        $scope.$watch('dashboard.refSelected', function (newValue) {
            if (newValue){
              document.getElementById("goBack").style.visibility = 'hidden';
              RadarChart('#graphCompliance', optionsChartCompliance, dataChartCompliance[$scope.dashboard.refSelected], true);
            }
        });

//==============================================================================

        /*
        * Check if a risk is present or not in the tab
        * @return true if present else false
        */
        function findValueId(tab,value){
          for(i=0 ; i < tab.length ; i++)
            if(tab[i].x === value)
              return true;
          return false;
        }

//==============================================================================

        /*
        * Add a risk in a tab if the risk is not already present in the tab
        */
        function addOneRisk(tab, value)
        {
          for(i=0 ; i < tab.length ; i++)
            if(tab[i].x === value)
              tab[i].y++;
        }

//==============================================================================

        function compareByNumber(a,b) { //allows to sort an array of objects given a certain attribute
          if (a.y > b.y)
            return -1;
          if (a.y < b.y)
            return 1;
          return 0;
        }

//==============================================================================

        function compareByAverage(a,b) { //allows to sort an array of objects given a certain attribute
          if (a.average > b.average)
            return -1;
          if (a.average < b.average)
            return 1;
          return 0;
        }

//==============================================================================

        function hslToHex(h, s, l) {
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

        function numberToColorHsl(i, max_angle) {
            // as the function expects a value between 0 and 1, and red = 0° and green = 120°
            // we convert the input to the appropriate hue value
            var hue = max_angle - i * max_angle;
            // we convert hsl to hex (saturation 100%, lightness 50%)
            return hslToHex(hue, 100, 50);
        }

//==============================================================================

        function relativeHexColorYParameter(index,tab,max_angle){ //max_angle references hsl colors that can be found here : https://i.stack.imgur.com/b7mU9.jpg
          relative_color=(tab[index].y-tab[tab.length-1].y+1)/(tab[0].y-tab[tab.length-1].y+1);
          tab[index].color=numberToColorHsl(relative_color,max_angle);
        }

//==============================================================================

        function relativeHexColorMaxRiskParameter(index,tab,max_angle){ //max_angle references hsl colors that can be found here : https://i.stack.imgur.com/b7mU9.jpg
          relative_color=(tab[index].max_risk-tab[tab.length-1].max_risk+1)/(tab[0].max_risk-tab[tab.length-1].max_risk+1);
          tab[index].color=numberToColorHsl(relative_color,max_angle);
        }

//==============================================================================

        /**
        * Update the two first charts which are displayed (the number of risk
        * by category (high, med., low) for target and current risk)
        */
        var updateCartoRisks = function (data) {
            for (var i = 0; i < 3; i++) {
              dataChartCurrentRisksByLevel_discreteBarChart[0].values[i].value = 0;
              dataChartCurrentRisksByLevel_pieChart[i].value = 0;
              dataChartTargetRisksByLevel_discreteBarChart[0].values[i].value = 0;
              dataChartTargetRisksByLevel_pieChart[i].value = 0;
            }
            //current risks
            //fill the bar chart
            if(data.data.carto.real.distrib[0] !=null)
              dataChartCurrentRisksByLevel_discreteBarChart[0].values[0].value = data.data.carto.real.distrib[0];
            if(data.data.carto.real.distrib[1] !=null)
              dataChartCurrentRisksByLevel_discreteBarChart[0].values[1].value = data.data.carto.real.distrib[1];
            if(data.data.carto.real.distrib[2] !=null)
              dataChartCurrentRisksByLevel_discreteBarChart[0].values[2].value = data.data.carto.real.distrib[2];

            //fill the pie chart
            if(data.data.carto.real.distrib[0]!=null )
              dataChartCurrentRisksByLevel_pieChart[0].value = data.data.carto.real.distrib[0];
            if(data.data.carto.real.distrib[1]!=null )
              dataChartCurrentRisksByLevel_pieChart[1].value = data.data.carto.real.distrib[1];
            if(data.data.carto.real.distrib[2]!=null )
              dataChartCurrentRisksByLevel_pieChart[2].value = data.data.carto.real.distrib[2];

            if (data.data.carto.targeted) {

                //fill the bar chart
                if(data.data.carto.targeted.distrib[0] != null)
                  dataChartTargetRisksByLevel_discreteBarChart[0].values[0].value = data.data.carto.targeted.distrib[0];
                if(data.data.carto.targeted.distrib[1] != null)
                  dataChartTargetRisksByLevel_discreteBarChart[0].values[1].value = data.data.carto.targeted.distrib[1];
                if(data.data.carto.targeted.distrib[2] != null)
                  dataChartTargetRisksByLevel_discreteBarChart[0].values[2].value = data.data.carto.targeted.distrib[2];

                //fill the pie chart
                if(data.data.carto.targeted.distrib[0] != null)
                  dataChartTargetRisksByLevel_pieChart[0].value = data.data.carto.targeted.distrib[0];
                if(data.data.carto.targeted.distrib[1] != null)
                  dataChartTargetRisksByLevel_pieChart[1].value = data.data.carto.targeted.distrib[1];
                if(data.data.carto.targeted.distrib[2] != null)
                  dataChartTargetRisksByLevel_pieChart[2].value = data.data.carto.targeted.distrib[2];
            };
        };

//==============================================================================

        /*
        * Update the chart of the current risks by assets
        */
        var updateCurrentRisksByAsset = function (data) {

          for (var i = 0; i < 3; i++) {
            dataChartCurrentRisksByAsset[i].values = [];
          }

          treshold1 = $scope.dashboard.anr.seuil1;
          treshold2 = $scope.dashboard.anr.seuil2;


          risksList = data.risks;
          for (var i=0; i < risksList.length ; ++i)
          {
            var eltlow = new Object();
            var eltmed = new Object();
            var elthigh = new Object();
              if(!findValueId(dataChartCurrentRisksByAsset[0].values,$scope._langField(risksList[i],'instanceName'))&&risksList[i].max_risk>=0)
              {
                // initialize element
                eltlow.id = eltmed.id = elthigh.id = risksList[i].instance; //keep the instance id as id
                eltlow.x = eltmed.x = elthigh.x = $scope._langField(risksList[i],'instanceName');
                eltlow.y = eltmed.y = elthigh.y = 0;
                eltlow.color = '#D6F107';
                dataChartCurrentRisksByAsset[0].values.push(eltlow);
                eltmed.color = '#FFBC1C';
                dataChartCurrentRisksByAsset[1].values.push(eltmed);
                elthigh.color = '#FD661F';
                dataChartCurrentRisksByAsset[2].values.push(elthigh);
              }
              if(risksList[i].max_risk>treshold2)
              {
                addOneRisk(dataChartCurrentRisksByAsset[2].values,$scope._langField(risksList[i],'instanceName'));
              }
              else if (risksList[i].max_risk<=treshold2 && risksList[i].max_risk>treshold1)
              {
                addOneRisk(dataChartCurrentRisksByAsset[1].values,$scope._langField(risksList[i],'instanceName'));
              }
              else if (risksList[i].max_risk>=0 && risksList[i].max_risk<=treshold1)
              {
                addOneRisk(dataChartCurrentRisksByAsset[0].values,$scope._langField(risksList[i],'instanceName'));
              }
          }
        };

//==============================================================================

        /*
        * Update the chart of the Residual risks by assets
        */
        var updateTargetRisksByAsset = function (data) {

          for (var i = 0; i < 3; i++) {
            dataChartTargetRisksByAsset[i].values = [];
          }

          treshold1 = $scope.dashboard.anr.seuil1;
          treshold2 = $scope.dashboard.anr.seuil2;

          risksList = data.risks;
          if($scope.dashboard.carto.targeted){ //n'affiche des données que si des risques cible existent
              for (var i=0; i < risksList.length ; ++i)
              {
                var eltlow2 = new Object();
                var eltmed2 = new Object();
                var elthigh2 = new Object();
                  if(!findValueId(dataChartTargetRisksByAsset[0].values,$scope._langField(risksList[i],'instanceName'))&&risksList[i].max_risk>=0)
                  {
                    // initialize element
                    eltlow2.id = eltmed2.id = elthigh2.id = risksList[i].instance; //keep the instance id as id
                    eltlow2.x = eltmed2.x = elthigh2.x = $scope._langField(risksList[i],'instanceName');
                    eltlow2.y = eltmed2.y = elthigh2.y = 0;
                    eltlow2.color = '#D6F107';
                    dataChartTargetRisksByAsset[0].values.push(eltlow2);
                    eltmed2.color = '#FFBC1C';
                    dataChartTargetRisksByAsset[1].values.push(eltmed2);
                    elthigh2.color = '#FD661F';
                    dataChartTargetRisksByAsset[2].values.push(elthigh2);
                  }
                  if(risksList[i].target_risk>treshold2)
                  {
                    addOneRisk(dataChartTargetRisksByAsset[2].values,$scope._langField(risksList[i],'instanceName'));
                  }
                  else if (risksList[i].target_risk<=treshold2 && risksList[i].target_risk>treshold1)
                  {
                    addOneRisk(dataChartTargetRisksByAsset[1].values,$scope._langField(risksList[i],'instanceName'));
                  }
                  else if (risksList[i].target_risk>=0 && risksList[i].target_risk<=treshold1)
                  {
                    addOneRisk(dataChartTargetRisksByAsset[0].values,$scope._langField(risksList[i],'instanceName'));
                  }
              }
            };
        };

//==============================================================================

        function recursiveAdd(tab, chart_data){
          for (var i=0; i<tab.length; i++){
            for (var j=0; j<chart_data.length; j++){
              var eltchart = new Object();
              eltchart.x=$scope._langField(tab[i],'name');
              eltchart.y=0;
              eltchart.asset_id = tab[i].id;
              if (tab[i].parent==0) eltchart.isparent=true;
              else eltchart.isparent=false;
              eltchart.child= tab[i].child;
              chart_data[j].values.push(eltchart);
            }
          }
        }

        $scope.goBackCurrentRisksParentAsset = function(){ //function triggered by 'return' button : loads graph data in memory tab then deletes it
            $scope.dashboard.currentRisksBreadcrumb.pop();
            $scope.dashboard.currentRisksParentAssetMemoryTab.pop();
            loadGraph($scope.graphCurrentRisks, optionsChartCurrentRisksByParentAsset, $scope.dashboard.currentRisksParentAssetMemoryTab[$scope.dashboard.currentRisksParentAssetMemoryTab.length-1]);
        }

        $scope.breadcrumbGoBackCurrentRisksParentAsset = function(id){ //function triggered with the interactive breadcrumb : id is held by the button
          if ($scope.dashboard.currentRisksBreadcrumb.length > 4){
            updateParameter = $scope.dashboard.currentRisksParentAssetMemoryTab[id + $scope.dashboard.currentRisksBreadcrumb.length - 4];
            $scope.dashboard.currentRisksParentAssetMemoryTab = $scope.dashboard.currentRisksParentAssetMemoryTab.slice(0,id + $scope.dashboard.currentRisksBreadcrumb.length - 3); //only keep elements before the one we display
            $scope.dashboard.currentRisksBreadcrumb = $scope.dashboard.currentRisksBreadcrumb.slice(0,id + $scope.dashboard.currentRisksBreadcrumb.length - 3);
            loadGraph($scope.graphCurrentRisks, optionsChartCurrentRisksByParentAsset, updateParameter);
          }
          else{
            updateParameter = $scope.dashboard.currentRisksParentAssetMemoryTab[id];
            $scope.dashboard.currentRisksParentAssetMemoryTab = $scope.dashboard.currentRisksParentAssetMemoryTab.slice(0,id+1); //only keep elements before the one we display
            $scope.dashboard.currentRisksBreadcrumb = $scope.dashboard.currentRisksBreadcrumb.slice(0,id+1);
            loadGraph($scope.graphCurrentRisks, optionsChartCurrentRisksByParentAsset, updateParameter);
          }
        }

        //======================================================================

        $scope.goBackTargetRisksParentAsset = function(){ //function triggered by 'return' button : loads graph data in memory tab then deletes it
          $scope.dashboard.targetRisksBreadcrumb.pop();
          $scope.dashboard.targetRisksParentAssetMemoryTab.pop();
          loadGraph($scope.graphTargetRisks, optionsChartTargetRisksByParentAsset, $scope.dashboard.targetRisksParentAssetMemoryTab[$scope.dashboard.targetRisksParentAssetMemoryTab.length-1])
        }

        $scope.breadcrumbGoBackTargetRisksParentAsset = function(id){ //function triggered with the interactive breadcrumb : id is held by the button
          if ($scope.dashboard.targetRisksBreadcrumb.length > 4){
            updateParameter = $scope.dashboard.targetRisksParentAssetMemoryTab[id + $scope.dashboard.targetRisksBreadcrumb.length - 4];
            $scope.dashboard.targetRisksParentAssetMemoryTab = $scope.dashboard.targetRisksParentAssetMemoryTab.slice(0,id + $scope.dashboard.targetRisksBreadcrumb.length - 3); //only keep elements before the one we display
            $scope.dashboard.targetRisksBreadcrumb = $scope.dashboard.targetRisksBreadcrumb.slice(0,id + $scope.dashboard.targetRisksBreadcrumb.length - 3);
            loadGraph($scope.graphTargetRisks, optionsChartTargetRisksByParentAsset, updateParameter);
          }
          else{
            updateParameter = $scope.dashboard.targetRisksParentAssetMemoryTab[id];
            $scope.dashboard.targetRisksParentAssetMemoryTab = $scope.dashboard.targetRisksParentAssetMemoryTab.slice(0,id+1); //only keep elements before the one we display
            $scope.dashboard.targetRisksBreadcrumb = $scope.dashboard.targetRisksBreadcrumb.slice(0,id+1);
            loadGraph($scope.graphTargetRisks, optionsChartTargetRisksByParentAsset, updateParameter);
          }
        }

//==============================================================================

        /*
        * Update the chart of the Residual risks by assets
        */
        var updateCurrentRisksByParentAsset = function (special_tab) {


          //Data model for the graph of current risk by parent asset
          dataChartCurrentRisksByParentAsset = [
            {
                key: gettextCatalog.getString("Low risks"),
                values: [],
                color : '#D6F107'
            },
            {
                 key: gettextCatalog.getString("Medium risks"),
                 values: [],
                 color : '#FFBC1C'
             },
             {
                 key: gettextCatalog.getString("High risks"),
                 values: [],
                 color : '#FD661F'
             }
          ];

          treshold1 = $scope.dashboard.anr.seuil1;
          treshold2 = $scope.dashboard.anr.seuil2;

          function fillParentAssetCurrentRisksChart(initial_data, dataChart){
            data = angular.copy(initial_data);
            var data_id = data[0].id;
            AnrService.getInstanceRisks($scope.dashboard.anr.id,data[0].id,{limit:-1}).then(function(data2){
                for (j=0; j<data2.risks.length; j++){
                  if(data2.risks[j].max_risk>treshold2){
                    for (k=0; k<dataChart[2].values.length; k++){
                      if (dataChart[2].values[k].asset_id == data_id) dataChart[2].values[k].y++;
                    }
                  }
                  else if (data2.risks[j].max_risk<=treshold2 && data2.risks[j].max_risk>treshold1){
                    for (k=0; k<dataChart[1].values.length; k++){
                      if (dataChart[1].values[k].asset_id == data_id) dataChart[1].values[k].y++;
                    }
                  }
                  else if (data2.risks[j].max_risk>=0 && data2.risks[j].max_risk<=treshold1){
                    for (k=0; k<dataChart[0].values.length; k++){
                      if (dataChart[0].values[k].asset_id == data_id) {
                        dataChart[0].values[k].y++;
                      }
                    }
                  }
                }
            });
            data.shift();
            if (data.length > 0){
              fillParentAssetCurrentRisksChart(data, dataChart);
            }
          }

          if (special_tab==null){
              recursiveAdd($scope.dashboard.instances, dataChartCurrentRisksByParentAsset);
              if ($scope.dashboard.instances.length>0){
                fillParentAssetCurrentRisksChart($scope.dashboard.instances, dataChartCurrentRisksByParentAsset);
                $scope.dashboard.currentRisksParentAssetMemoryTab.push(dataChartCurrentRisksByParentAsset);
              }
          }
          else{
            recursiveAdd(special_tab, dataChartCurrentRisksByParentAsset);
            if (special_tab.length>0){
              fillParentAssetCurrentRisksChart(special_tab, dataChartCurrentRisksByParentAsset);
            }
          }
        }

//==============================================================================

        /*
        * Update the chart of the Residual risks by assets
        */
        var updateTargetRisksByParentAsset = function (special_tab) {

          //Data model for the graph of current risk by parent asset
          dataChartTargetRisksByParentAsset = [
            {
                key: gettextCatalog.getString("Low risks"),
                values: [],
                color : '#D6F107'
            },
            {
                 key: gettextCatalog.getString("Medium risks"),
                 values: [],
                 color : '#FFBC1C'
             },
             {
                 key: gettextCatalog.getString("High risks"),
                 values: [],
                 color : '#FD661F'
             }
          ];

          treshold1 = $scope.dashboard.anr.seuil1;
          treshold2 = $scope.dashboard.anr.seuil2;

          function fillParentAssetTargetRisksChart(initial_data, dataChart){
            data = angular.copy(initial_data);
            var data_id = data[0].id;
            AnrService.getInstanceRisks($scope.dashboard.anr.id,data[0].id,{limit:-1}).then(function(data2){
              for (j=0; j<data2.risks.length; j++){
                if(data2.risks[j].target_risk>treshold2){
                  for (k=0; k<dataChart[2].values.length; k++){
                    if (dataChart[2].values[k].asset_id == data_id) dataChart[2].values[k].y++;
                  }
                }
                else if (data2.risks[j].target_risk<=treshold2 && data2.risks[j].target_risk>treshold1){
                  for (k=0; k<dataChart[1].values.length; k++){
                    if (dataChart[1].values[k].asset_id == data_id) dataChart[1].values[k].y++;
                  }
                }
                else if (data2.risks[j].target_risk>=0 && data2.risks[j].target_risk<=treshold1){
                  for (k=0; k<dataChart[0].values.length; k++){
                    if (dataChart[0].values[k].asset_id == data_id) {
                      dataChart[0].values[k].y++;
                    }
                  }
                }
              }
            });
            data.shift();
            if (data.length > 0){
              fillParentAssetTargetRisksChart(data, dataChart);
            }
          }

          if (special_tab==null){
              recursiveAdd($scope.dashboard.instances, dataChartTargetRisksByParentAsset);
              if ($scope.dashboard.instances.length>0){
                fillParentAssetTargetRisksChart($scope.dashboard.instances, dataChartTargetRisksByParentAsset);
                $scope.dashboard.targetRisksParentAssetMemoryTab.push(dataChartTargetRisksByParentAsset);
              }
          }
          else{
            recursiveAdd(special_tab, dataChartTargetRisksByParentAsset);
            if (special_tab.length>0){
              fillParentAssetTargetRisksChart(special_tab, dataChartTargetRisksByParentAsset);
            }
          }
        }


//==============================================================================

        /*
        * Update the chart of the number of threats by threat type
        */
        var updateThreats = function (data) {

              dataChartThreats[0].values = [];
              risksList = data.risks;
              for (var i=0; i < risksList.length ; ++i)
              {
                var eltrisk = new Object();
                if(!findValueId(dataChartThreats[0].values,$scope._langField(risksList[i],'threatLabel'))&&risksList[i].max_risk>0)
                {
                  // initialize element
                  eltrisk.id = risksList[i].tid; //keep the threatID as id
                  eltrisk.x = $scope._langField(risksList[i],'threatLabel');
                  eltrisk.y = 0;
                  eltrisk.average = 0;
                  eltrisk.color = '#FF0000';
                  eltrisk.max_risk = risksList[i].max_risk; //We can define max_risk for the threat in the initialisation because objects in RisksList are ordered by max_risk
                  eltrisk.rate = risksList[i].threatRate;
                  dataChartThreats[0].values.push(eltrisk);
                }
                if (risksList[i].max_risk>0)
                {
                  addOneRisk(dataChartThreats[0].values,$scope._langField(risksList[i],'threatLabel'));
                  for (var j=0; j<dataChartThreats[0].values.length; j++)
                  {
                    if (dataChartThreats[0].values[j].id === risksList[i].tid)
                    {
                      dataChartThreats[0].values[j].average*=(dataChartThreats[0].values[j].y-1);
                      dataChartThreats[0].values[j].average+=risksList[i].threatRate;
                      dataChartThreats[0].values[j].average/=dataChartThreats[0].values[j].y;
                    }
                  }
                }
              }
              if ($scope.displayThreatsBy == "number")
              {
                dataChartThreats[0].values.sort(compareByNumber);
                for (var i=0; i<dataChartThreats[0].values.length; i++)
                {
                  relativeHexColorYParameter(i,dataChartThreats[0].values,79.75);
                }
                delete optionsChartThreats_discreteBarChart.chart.yDomain;
                delete optionsChartThreats_multiBarHorizontalChart.chart.yDomain;
              }
              if ($scope.displayThreatsBy == "probability")
              {
                dataChartThreats[0].values.sort(compareByAverage);
                for (var i=0; i<dataChartThreats[0].values.length; i++)
                {
                  dataChartThreats[0].values[i].y=dataChartThreats[0].values[i].average;
                }
                for (var i=0; i<dataChartThreats[0].values.length; i++)
                {
                  relativeHexColorYParameter(i,dataChartThreats[0].values,79.75);
                }

                for (var k=0; k < $scope.dashboard.scales.length; k++){
                  if ($scope.dashboard.scales[k].type=="threat") {
                    if ($scope.dashboard.scales[k].min==0) optionsChartThreats_discreteBarChart.chart.yDomain = [$scope.dashboard.scales[k].min, $scope.dashboard.scales[k].max];
                    else optionsChartThreats_discreteBarChart.chart.yDomain = [$scope.dashboard.scales[k].min-1, $scope.dashboard.scales[k].max];
                    if ($scope.dashboard.scales[k].min==0) optionsChartThreats_multiBarHorizontalChart.chart.yDomain = [$scope.dashboard.scales[k].min, $scope.dashboard.scales[k].max];
                    else optionsChartThreats_multiBarHorizontalChart.chart.yDomain = [$scope.dashboard.scales[k].min-1, $scope.dashboard.scales[k].max];
                  }
                }
              };
              if ($scope.displayThreatsBy == "max_associated_risk")
              {
                for (var i=0; i<dataChartThreats[0].values.length; i++)
                {
                  relativeHexColorMaxRiskParameter(i,dataChartThreats[0].values,79.75)
                }
                for (var i=0; i<dataChartThreats[0].values.length; i++)
                {
                  dataChartThreats[0].values[i].y=dataChartThreats[0].values[i].max_risk;
                };
                delete optionsChartThreats_discreteBarChart.chart.yDomain;
                delete optionsChartThreats_multiBarHorizontalChart.chart.yDomain;
              };
        };

//==============================================================================

        /*
        * Update the chart of the number of the top 5 vulnerabilities by vulnerabilities type
        */
        var updateVulnerabilities = function (data) {
            var dataTempChartVulnes_risk = [];
            dataChartVulnes_risk[0].values = [];
            risksList = data.risks;
            for (var i=0; i < risksList.length ; ++i)
            {
              var eltvuln_risk = new Object();
              if(!findValueId(dataTempChartVulnes_risk,$scope._langField(risksList[i],'vulnLabel'))&&risksList[i].max_risk>=0)
              {
                // initialize element
                eltvuln_risk.id = risksList[i].vid; //keep the vulnID as id
                eltvuln_risk.x = $scope._langField(risksList[i],'vulnLabel');
                eltvuln_risk.y = 0;
                eltvuln_risk.average = 0;
                eltvuln_risk.max_risk = risksList[i].max_risk; //We can define max_risk for the vulnerability in the initialisation because objects in RisksList are ordered by max_risk
                eltvuln_risk.color = '#D66607';
                dataTempChartVulnes_risk.push(eltvuln_risk);
              }
              if (risksList[i].max_risk>=0)
              {
                addOneRisk(dataTempChartVulnes_risk,$scope._langField(risksList[i],'vulnLabel'));
                for (var j=0; j<dataTempChartVulnes_risk.length; j++)
                {
                  if (dataTempChartVulnes_risk[j].id === risksList[i].vid)
                  {
                    dataTempChartVulnes_risk[j].average*=(dataTempChartVulnes_risk[j].y-1);
                    dataTempChartVulnes_risk[j].average+=risksList[i].vulnerabilityRate;
                    dataTempChartVulnes_risk[j].average/=dataTempChartVulnes_risk[j].y;
                  }
                }
              }
            }
            if ($scope.displayVulnerabilitiesBy == "number")
            {
              // optionsChartVulnerabilities_discreteBarChart.chart.yAxis.axisLabel = gettextCatalog.getString("Number of occurences");
              dataTempChartVulnes_risk.sort(compareByNumber);
              for (var i=0; i<dataTempChartVulnes_risk.length; i++)
              {
                relativeHexColorYParameter(i,dataTempChartVulnes_risk,79.75);
              }
              delete optionsChartVulnerabilities_discreteBarChart.chart.yDomain;
              delete optionsChartVulnerabilities_horizontalBarChart.chart.yDomain;
            }
            if ($scope.displayVulnerabilitiesBy == "qualification")
            {
              // optionsChartVulnerabilities_discreteBarChart.chart.yAxis.axisLabel = gettextCatalog.getString("Qualification");
              dataTempChartVulnes_risk.sort(compareByAverage);
              for (var i=0; i<dataTempChartVulnes_risk.length; i++)
              {
                dataTempChartVulnes_risk[i].y=dataTempChartVulnes_risk[i].average;
              }
              for (var i=0; i<dataTempChartVulnes_risk.length; i++)
              {
                relativeHexColorYParameter(i,dataTempChartVulnes_risk,79.75);
              }
                for (var k=0; k < $scope.dashboard.scales.length; k++){
                  if ($scope.dashboard.scales[k].type=="vulnerability") {
                    if ($scope.dashboard.scales[k].min==0) optionsChartVulnerabilities_discreteBarChart.chart.yDomain = [$scope.dashboard.scales[k].min, $scope.dashboard.scales[k].max];
                    else optionsChartVulnerabilities_discreteBarChart.chart.yDomain = [$scope.dashboard.scales[k].min-1, $scope.dashboard.scales[k].max];
                    if ($scope.dashboard.scales[k].min==0) optionsChartVulnerabilities_horizontalBarChart.chart.yDomain = [$scope.dashboard.scales[k].min, $scope.dashboard.scales[k].max];
                    else optionsChartVulnerabilities_horizontalBarChart.chart.yDomain = [$scope.dashboard.scales[k].min-1, $scope.dashboard.scales[k].max];
                  }
                }
            };
            if ($scope.displayVulnerabilitiesBy == "max_associated_risk")
            {
              // optionsChartVulnerabilities_discreteBarChart.chart.yAxis.axisLabel = gettextCatalog.getString("Max. associated risk");
              for (var i=0; i<dataTempChartVulnes_risk.length; i++)
              {
                relativeHexColorMaxRiskParameter(i,dataTempChartVulnes_risk,79.75)
              }
              for (var i=0; i<dataTempChartVulnes_risk.length; i++)
              {
                dataTempChartVulnes_risk[i].y=dataTempChartVulnes_risk[i].max_risk;
              }
            }
            if (dataTempChartVulnes_risk.length>=$scope.dashboard.vulnerabilitiesDisplayed && $scope.dashboard.vulnerabilitiesDisplayed!="all")
            {
              for (var j=0; j < $scope.dashboard.vulnerabilitiesDisplayed; ++j) //Only keeps first X elements of array
              {
                dataChartVulnes_risk[0].values.push(dataTempChartVulnes_risk[j]);
              }
            }
            else
            {
              for (var j=0; j < dataTempChartVulnes_risk.length; ++j) //Only keeps first X elements of array
              {
                dataChartVulnes_risk[0].values.push(dataTempChartVulnes_risk[j]);
              }
            }
            delete optionsChartVulnerabilities_discreteBarChart.chart.yDomain;
            delete optionsChartVulnerabilities_horizontalBarChart.chart.yDomain;
        };

//==============================================================================

        /*
        * Check if two itv objects are the same
        * @return true if the same else false
        */
        function sameITV(itv1,itv2){
          if (itv1.i != itv2.i) return false;
          if (itv1.t * itv1.v != itv2.t * itv2.v) return false;
          return true;
        }

//==============================================================================

        /*
        * Check if an itv triplet is present or not in the tab
        * @return true if present else false
        */
        function findITV(tab, itv){
          for(var b=0 ; b < tab.length ; b++)
            if(sameITV(tab[b].itv,itv)) return true;
          return false;
        }

//==============================================================================

        /*
        * Update the data for the cartography
        */
        var updateCartography = function (data, risksOp) {


          if ($scope.cartographyRisksType == "info_risks"){
            dataChartCartography = [
                {
                  key: gettextCatalog.getString('Confidentiality'),
                  values: [],
                  color: "#FF0000"
                },
                {
                  key: gettextCatalog.getString('Availability'),
                  values: [],
                  color: "#00FF00"
                },
                {
                  key: gettextCatalog.getString('Integrity'),
                  values: [],
                  color: "#0000FF"
                },
            ];
            risksList = data.risks;
            for (var risk_number=0; risk_number < 3; risk_number++){
              for (var i=0; i < risksList.length ; ++i)
              {
                // define ITV_array (Impact, Threat, Vulnerability)
                var ITV_array = new Object();
                if (risk_number==0) ITV_array.i = risksList[i].c_impact;
                else if (risk_number==1) ITV_array.i = risksList[i].d_impact;
                else if (risk_number==2) ITV_array.i = risksList[i].i_impact;
                ITV_array.t = risksList[i].threatRate;
                ITV_array.v = risksList[i].vulnerabilityRate;
                if(!findITV(dataChartCartography[risk_number].values, ITV_array)&&risksList[i].max_risk>0&&(ITV_array.t*ITV_array.v > 0))
                {
                  // initialize element
                  var eltCarto = new Object();
                  eltCarto.itv = ITV_array;
                  eltCarto.x = ITV_array.t * ITV_array.v //Likelihood = threat * vulnerability
                  //defines the y value depending on what risk we're looking at
                  if (risk_number==0) eltCarto.y = risksList[i].c_impact;
                  else if (risk_number==1) eltCarto.y = risksList[i].d_impact;
                  else if (risk_number==2) eltCarto.y = risksList[i].i_impact;
                  //defines the group depending on what risk we're looking at
                  if (risk_number==0) eltCarto.mesured = gettextCatalog.getString('Confidentiality');
                  else if (risk_number==1) eltCarto.mesured = gettextCatalog.getString('Availability');
                  else if (risk_number==2) eltCarto.mesured = gettextCatalog.getString('Integrity');
                  eltCarto.size = 0;
                  dataChartCartography[risk_number].values.push(eltCarto);
                }
                for (var k=0; k<dataChartCartography[risk_number].values.length;k++){
                  if(JSON.stringify(ITV_array) === JSON.stringify(dataChartCartography[risk_number].values[k].itv)) dataChartCartography[risk_number].values[k].size+=5 ;
                }
              }
            }

            optionsChartCartography.chart.xDomain = [1,1];
            optionsChartCartography.chart.yDomain = [1,1];
            for (var k=0; k < $scope.dashboard.scales.length; k++){
              if ($scope.dashboard.scales[k].type=="impact") {
                optionsChartCartography.chart.yDomain = [$scope.dashboard.scales[k].min, $scope.dashboard.scales[k].max];
              }
              else {
                optionsChartCartography.chart.xDomain[0]*=$scope.dashboard.scales[k].min;
                optionsChartCartography.chart.xDomain[1]*=$scope.dashboard.scales[k].max;
              }
            }
            optionsChartCartography.chart.xDomain[1]++; //add 1 to make sure no circle on the far right is cut
            optionsChartCartography.chart.yDomain[1]++; //add 1 to make sure no circle on the top is cut
          }
          else if ($scope.cartographyRisksType == "op_risks"){
            dataChartCartography = [
                {
                  key: gettextCatalog.getString('Reputation'),
                  values: [],
                  color: "#FF0000"
                },
                {
                  key: gettextCatalog.getString('Operational'),
                  values: [],
                  color: "#00FF00"
                },
                {
                  key: gettextCatalog.getString('Legal'),
                  values: [],
                  color: "#FFFF00"
                },
                {
                  key: gettextCatalog.getString('Financial'),
                  values: [],
                  color: "#0000FF"
                },
                {
                  key: gettextCatalog.getString('Person'),
                  values: [],
                  color: "#FF00FF"
                },
            ];
            risksList = risksOp.oprisks;
            for (var risk_number=0; risk_number < 5; risk_number++){
              for (var i=0; i < risksList.length ; ++i)
              {
                // define ITV_array (Impact, Threat, Vulnerability)
                var ITV_array = new Object();
                if (risk_number==0) ITV_array.i = risksList[i].netR;
                else if (risk_number==1) ITV_array.i = risksList[i].netO;
                else if (risk_number==2) ITV_array.i = risksList[i].netL;
                else if (risk_number==3) ITV_array.i = risksList[i].netF;
                else if (risk_number==4) ITV_array.i = risksList[i].netP;
                ITV_array.p = risksList[i].netProb;
                if(!findITV(dataChartCartography[risk_number].values, ITV_array) && risksList[i].cacheNetRisk>0 && ITV_array.p > 0 && ITV_array.i > 0)
                {
                  // initialize element
                  var eltCarto = new Object();
                  eltCarto.itv = ITV_array;
                  eltCarto.x = ITV_array.p
                  //defines the y value depending on what risk we're looking at
                  if (risk_number==0) eltCarto.y = risksList[i].netR;
                  else if (risk_number==1) eltCarto.y = risksList[i].netO;
                  else if (risk_number==2) eltCarto.y = risksList[i].netL;
                  else if (risk_number==3) eltCarto.y = risksList[i].netF;
                  else if (risk_number==4) eltCarto.y = risksList[i].netP;
                  //defines the group depending on what risk we're looking at
                  if (risk_number==0) eltCarto.mesured = gettextCatalog.getString('Reputation');
                  else if (risk_number==1) eltCarto.mesured = gettextCatalog.getString('Operational');
                  else if (risk_number==2) eltCarto.mesured = gettextCatalog.getString('Legal');
                  else if (risk_number==3) eltCarto.mesured = gettextCatalog.getString('Financial');
                  else if (risk_number==4) eltCarto.mesured = gettextCatalog.getString('Person');
                  eltCarto.size = 0;
                  dataChartCartography[risk_number].values.push(eltCarto);
                }
                for (var k=0; k<dataChartCartography[risk_number].values.length;k++){
                  if(JSON.stringify(ITV_array) === JSON.stringify(dataChartCartography[risk_number].values[k].itv)) dataChartCartography[risk_number].values[k].size+=5 ;
                }
              }
            }

            for (var k=0; k < $scope.dashboard.scales.length; k++){
              if ($scope.dashboard.scales[k].type=="impact") {
                optionsChartCartography.chart.yDomain = [$scope.dashboard.scales[k].min, $scope.dashboard.scales[k].max];
              }
              else if ($scope.dashboard.scales[k].type=="threat") {
                optionsChartCartography.chart.xDomain = [$scope.dashboard.scales[k].min, $scope.dashboard.scales[k].max];
              }
            }
            optionsChartCartography.chart.xDomain[1]++; //add 1 to make sure no circle on the far right is cut
            optionsChartCartography.chart.yDomain[1]++; //add 1 to make sure no circle on the top is cut
          }
        };

//==============================================================================

        /*
        * Update the data for the compliance
        */
        var updateCompliance = function (referentials,categories,data){
          referentials.forEach(function(ref){
              dataChartCompliance[ref.uuid] = [[],[]];
              categories.filter(category => category.referential.uuid == ref.uuid).forEach(function(cat){
                let catCurrentData = {
                  axis:cat['label'+ $scope.dashboard.anr.language],
                  id:cat.id,
                  value: null,
                  controls: [[],[]]
                }
                let catTargetData = {
                  axis:cat['label'+ $scope.dashboard.anr.language],
                  id:cat.id,
                  value: null,
                  controls: [[],[]]
                }
                let currentSoas = data.filter(soa => soa.measure.category.id == cat.id);
                let targetSoas = data.filter(soa => soa.measure.category.id == cat.id && soa.EX != 1);
                currentSoas.forEach(function(soa){
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
                let sum = complianceCurrentValues.reduce(function(a, b) { return a + b; }, 0);
                let currentAvg = (sum / complianceCurrentValues.length) * 0.2;
                let targetAvg = (targetSoas.length / complianceCurrentValues.length);
                catCurrentData.value = currentAvg.toFixed(2);
                catTargetData.value = targetAvg.toFixed(2);
                dataChartCompliance[ref.uuid][0].push(catCurrentData);
                dataChartCompliance[ref.uuid][1].push(catTargetData);
              })
          });
        }

        $scope.goBackChartCompliance = function (){
          document.getElementById("goBack").style.visibility = 'hidden';
          RadarChart('#graphCompliance', optionsChartCompliance, dataChartCompliance[$scope.dashboard.refSelected], true);
          $scope.dashboard.deepGraph = false;
        }

//==============================================================================

        /*
        * Generate Radar Chart
        */
        function RadarChart(id, cfg, d, deepData = false){
        	cfg.maxValue = Math.max(cfg.maxValue, d3.max(d, function(i){return d3.max(i.map(function(o){return o.value;}))}));
        	var allAxis = (d[0].map(function(i, j){return {axis :i.axis, id: i.id}}));
        	var total = allAxis.length;
        	var radius = cfg.factor*Math.min(cfg.w/2, cfg.h/2);
        	var Format = d3.format('%');
        	d3.select(id).select("svg").remove();

        	var g = d3.select(id)
        			.append("svg")
        			.attr("width", cfg.w+cfg.ExtraWidthX)
        			.attr("height", cfg.h+cfg.ExtraWidthY)
        			.append("g")
        			.attr("transform", "translate(" + cfg.TranslateX + "," + cfg.TranslateY + ")");
        			;
        	var tooltip;

        	//Circular segments
        	for(var j=0; j<cfg.levels; j++){
        	  var levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
        	  g.selectAll(".levels")
        	   .data(allAxis)
        	   .enter()
        	   .append("svg:line")
        	   .attr("x1", function(d, i){return levelFactor*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
        	   .attr("y1", function(d, i){return levelFactor*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
        	   .attr("x2", function(d, i){return levelFactor*(1-cfg.factor*Math.sin((i+1)*cfg.radians/total));})
        	   .attr("y2", function(d, i){return levelFactor*(1-cfg.factor*Math.cos((i+1)*cfg.radians/total));})
        	   .attr("class", "line")
        	   .style("stroke", "grey")
        	   .style("stroke-opacity", "0.75")
        	   .style("stroke-width", "0.3px")
        	   .attr("transform", "translate(" + (cfg.w/2-levelFactor) + ", " + (cfg.h/2-levelFactor) + ")");
        	}

        	//Text indicating at what % each level is
        	for(var j=0; j<cfg.levels; j++){
        	  var levelFactor = cfg.factor*radius*((j+1)/cfg.levels);
        	  g.selectAll(".levels")
        	   .data([1]) //dummy data
        	   .enter()
        	   .append("svg:text")
        	   .attr("x", function(d){return levelFactor*(1-cfg.factor*Math.sin(0));})
        	   .attr("y", function(d){return levelFactor*(1-cfg.factor*Math.cos(0));})
        	   .attr("class", "legend")
        	   .style("font-family", "sans-serif")
        	   .style("font-size", "10px")
        	   .attr("transform", "translate(" + (cfg.w/2-levelFactor + cfg.ToRight) + ", " + (cfg.h/2-levelFactor) + ")")
        	   .attr("fill", "#737373")
        	   .text(Format((j+1)*cfg.maxValue/cfg.levels));
        	}

        	series = 0;

        	var axis = g.selectAll(".axis")
        			.data(allAxis)
        			.enter()
        			.append("g")
        			.attr("class", "axis");

        	axis.append("line")
        		.attr("x1", cfg.w/2)
        		.attr("y1", cfg.h/2)
        		.attr("x2", function(d, i){return cfg.w/2*(1-cfg.factor*Math.sin(i*cfg.radians/total));})
        		.attr("y2", function(d, i){return cfg.h/2*(1-cfg.factor*Math.cos(i*cfg.radians/total));})
        		.attr("class", "line")
        		.style("stroke", "grey")
        		.style("stroke-width", "1px");

        	axis.append("text")
        		.attr("class", "legend")
        		.text(function(d){return d.axis})
        		.style("font-family", "sans-serif")
        		.style("font-size", "11px")
        		.attr("text-anchor", "middle")
        		.attr("dy", "1.5em")
        		.attr("transform", function(d, i){return "translate(0, -10)"})
        		.attr("x", function(d, i){return cfg.w/2*(1-cfg.factorLegend*Math.sin(i*cfg.radians/total))-60*Math.sin(i*cfg.radians/total);})
        		.attr("y", function(d, i){return cfg.h/2*(1-Math.cos(i*cfg.radians/total))-20*Math.cos(i*cfg.radians/total);})
            .on("click", function(e){
              if (deepData) {
                let controls = d[0].filter(controls => controls.id == e.id);
                document.getElementById("goBack").style.visibility = 'visible';
                RadarChart('#graphCompliance', optionsChartCompliance, controls[0]['controls']);
                $scope.dashboard.deepGraph = true;
              }
            });


        	d.forEach(function(y, x){
        	  dataValues = [];
        	  g.selectAll(".nodes")
        		.data(y, function(j, i){
        		  dataValues.push([
        			cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)),
        			cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
        		  ]);
        		});
        	  dataValues.push(dataValues[0]);

        	  g.selectAll(".area")
        					 .data([dataValues])
        					 .enter()
        					 .append("polygon")
        					 .attr("class", "radar-chart-serie"+series)
        					 .style("stroke-width", "2px")
        					 .style("stroke", cfg.color(series))
        					 .attr("points",function(d) {
        						 var str="";
        						 for(var pti=0;pti<d.length;pti++){
        							 str=str+d[pti][0]+","+d[pti][1]+" ";
        						 }
        						 return str;
        					  })
        					 .style("fill", (series == 1) ? 'none' : cfg.color(series))
        					 .style("fill-opacity", cfg.opacityArea)
        					 .on('mouseover', function (d){
        										z = "polygon."+d3.select(this).attr("class");
        										g.selectAll("polygon")
        										 .transition(200)
        										 .style("fill-opacity", 0.1);
        										g.selectAll(z)
        										 .transition(200)
        										 .style("fill-opacity", .7);
        									  })
        					 .on('mouseout', function(){
        										g.selectAll("polygon")
        										 .transition(200)
        										 .style("fill-opacity", ((series == 0) ? 0 : cfg.opacityArea));
        					 });
        	  series++;
        	});
        	series=0;


        	d.forEach(function(y, x){
        	  g.selectAll(".nodes")
        		.data(y).enter()
        		.append("svg:circle")
        		.attr("class", "radar-chart-serie"+series)
        		.attr('r', cfg.radius)
        		.attr("alt", function(j){return Math.max(j.value, 0)})
        		.attr("cx", function(j, i){
        		  dataValues.push([
        			cfg.w/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total)),
        			cfg.h/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total))
        		]);
        		return cfg.w/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*cfg.radians/total));
        		})
        		.attr("cy", function(j, i){
        		  return cfg.h/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*cfg.radians/total));
        		})
        		.attr("data-id", function(j){return j.axis})
        		.style("fill", cfg.color(series)).style("fill-opacity", .9)
        		.on('mouseover', function (d){
        					newX =  parseFloat(d3.select(this).attr('cx')) - 10;
        					newY =  parseFloat(d3.select(this).attr('cy')) - 5;

        					tooltip
        						.attr('x', newX)
        						.attr('y', newY)
        						.text(Format(d.value))
        						.transition(200)
        						.style('opacity', 1);

        					z = "polygon."+d3.select(this).attr("class");
        					g.selectAll("polygon")
        						.transition(200)
        						.style("fill-opacity", 0.1);
        					g.selectAll(z)
        						.transition(200)
        						.style("fill-opacity", .7);
        				  })
        		.on('mouseout', function(){
        					tooltip
        						.transition(200)
        						.style('opacity', 0);
        					g.selectAll("polygon")
        						.transition(200)
        						.style("fill-opacity", cfg.opacityArea);
        				  })
        		.append("svg:title")
        		.text(function(j){return Math.max(j.value, 0)});

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
         		  .attr("y", (d,i) => i * 20)
         		  .attr("width", 10)
         		  .attr("height", 10)
         		  .style("fill", (d,i) => cfg.color(i));
         		// Create labels
         		legend.selectAll('text')
         		  .data(names)
         		  .enter()
         		  .append("text")
         		  .attr("x", cfg.w - 52)
         		  .attr("y", (d,i) => i * 20 + 9)
         		  .attr("font-size", "11px")
         		  .attr("fill", "#737373")
         		  .text(d => d);
         	}
        };
    }
})();

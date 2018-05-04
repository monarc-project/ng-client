(function () {

    angular
        .module('ClientApp')
        .controller('ClientDashboardCtrl', [
            '$scope', '$state', '$http', 'gettextCatalog', 'UserService', 'toastr', '$rootScope', '$timeout',
            ClientDashboardCtrl
        ]);

    /**
     * Dashboard Controller for the Client module
     */
    function ClientDashboardCtrl($scope, $state, $http, gettextCatalog, UserService, toastr, $rootScope, $timeout) {

        $scope.dashboard = {
            anr: null,
            anrData: null,
            carto: undefined,
            cartoStats: {}
        };

//==============================================================================

        //init default value to avoid errors
        $scope.initOptionActualRisk = $scope.initOptionResidualRisk = {
           chart: {
               type: 'discreteBarChart',
           },
       };


       // init default datas to avoid errors
        $scope.initDataActualRisk = $scope.initDataResidualRisk  = [];

//==============================================================================


        $scope.dashboard.showGraphFrame1 = $scope.dashboard.showGraphFrame2 = true; //These values define which graphs will be displayed
        $scope.dashboard.pieChartData = {
              key: "Number of occurrences for this vulnerability",
              values: []
        };
        $scope.dashboard.firstRefresh = true;

        $scope.risks_op_filters = { //help to create the url for clickable bars
            order: 'maxRisk',
            order_direction: 'desc',
            thresholds: 0,
            page: 1,
            limit: 20
        };

        $scope.selectGraphRisks = function () { //Displays the risks charts
            $scope.showVulnerabilitiesTabs = false;
            $scope.showThreatsTabs = false;
            $scope.showRisksTabs = true;
            $scope.dashboard.showGraphFrame2=true;
            if ($scope.displayActualRisksBy == "level") {
              loadGraph($scope.graphFrame1,optionsCartoRisk,dataChartActualRisksByLevel);
            }
            if ($scope.displayActualRisksBy == "asset") {
              loadGraph($scope.graphFrame1,optionsChartActualRisksByAsset,dataChartActualRisksByAsset);
            }
            if ($scope.displayResidualRisksBy == "level") {
              loadGraph($scope.graphFrame2,optionsCartoRisk,dataChartResidualRisksByLevel);
            }
            if ($scope.displayResidualRisksBy == "asset") {
              loadGraph($scope.graphFrame2,optionsChartActualRisksByAsset,dataChartResidualRisksByAsset);
            }
            document.getElementById("graphFrame1_title").textContent=gettextCatalog.getString('Current risks map');
            document.getElementById("graphFrame2_title").textContent=gettextCatalog.getString('Target risks map');
        };

        $scope.selectGraphThreats = function () { //Displays the threats charts
            $scope.showVulnerabilitiesTabs = false;
            $scope.showThreatsTabs = true;
            $scope.showRisksTabs = false;
            $scope.dashboard.showGraphFrame2=false;
            loadGraph($scope.graphFrame1,window[$scope.threatsChartOption],dataChartThreats);
            document.getElementById("graphFrame1_title").textContent=gettextCatalog.getString('Number of threats for each threat type');
            document.getElementById("graphFrame2_title").textContent=gettextCatalog.getString('Maximum risk for each threat type');
        };

        $scope.selectGraphVulnerabilities = function () { //Displays the vulnerabilities charts
            $scope.showVulnerabilitiesTabs = true;
            $scope.showThreatsTabs = false;
            $scope.showRisksTabs = false;
            $scope.dashboard.showGraphFrame2=false;
            loadGraph($scope.graphFrame1,window[$scope.vulnerabilitiesChartOption],dataChartVulnes_risk);
            // loadGraph($scope.graphFrame2,optionsChartVulnerabilitiesNumber,$scope.dashboard.pieChartData.values);
            document.getElementById("graphFrame1_title").textContent=gettextCatalog.getString('Vulnerabilities with the highest risk');
            document.getElementById("graphFrame2_title").textContent=gettextCatalog.getString('Vulnerabilities with the most occurrences');
        };

        $scope.selectGraphCartography = function () { //Displays the cartography
            $scope.showVulnerabilitiesTabs = false;
            $scope.showThreatsTabs = false;
            $scope.showRisksTabs = false;
            $scope.dashboard.showGraphFrame2=false;
            loadGraph($scope.graphFrame1,optionsChartCartography,dataChartCartography);
            document.getElementById("graphFrame1_title").textContent=gettextCatalog.getString('Cartography');
        };

        $scope.selectGraphDecisionSupport = function () { //Displays the decision support tab
            $scope.showVulnerabilitiesTabs = false;
            $scope.showThreatsTabs = false;
            $scope.showRisksTabs = false;
            $scope.dashboard.showGraphFrame2=false;
            loadGraph($scope.graphFrame1,optionsChartCartography,dataChartCartography);
        };

        $scope.selectGraphPerspective = function () { //Displays the persepctive charts
            $scope.showVulnerabilitiesTabs = false;
            $scope.showThreatsTabs = false;
            $scope.showRisksTabs = false;
            $scope.dashboard.showGraphFrame2=false;
            loadGraph($scope.graphFrame1,optionsChartCartography,dataChartCartography);
        };

        $scope.serializeQueryString = function (obj) {
            var str = [];
            for (var p in obj) {
                if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                }
            }
            return str.join('&');
        };

//==============================================================================

        //Options of the chart for both charts that display risks by level
        optionsCartoRisk = {
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
                   axisLabel: gettextCatalog.getString('Current risk'),
                   axisLabelDistance: -10
               },
              discretebar: {
                dispatch: { //on click switch on the second graph
                  renderEnd: function(e){
                    d3AddButton('graphFrame1_title',exportAsPNG, ['graphFrame1','ActualRiskByCategory'] );
                    d3AddButton('graphFrame2_title',exportAsPNG, ['graphFrame2','ResidualRiskByCategory'] );
                  },
                }
            },
           },
       };

//==============================================================================

       //Options for the chart that displays the actual risks by asset
       optionsChartActualRisksByAsset = {
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
                      $state.transitionTo("main.project.anr.instance", {modelId: $scope.dashboard.anr, instId: e.data.id});
                    },
                    renderEnd: function(e){
                      d3AddButton('graphFrame1_title',exportAsPNG, ['graphFrame1','dataChartActualRisksByAsset'] );
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
                    axisLabel: gettextCatalog.getString('Asset'),
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

      optionsChartResidualRisksByAsset = {
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
                     $state.transitionTo("main.project.anr.instance", {modelId: $scope.dashboard.anr, instId: e.data.id});
                   },
                   renderEnd: function(e){
                     d3AddButton('graphFrame2_title',exportAsPNG, ['graphFrame2','dataChartResidualRisksByAsset'] );
                   },
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
                   axisLabel: gettextCatalog.getString('Asset'),
                   showMaxMin: false,
                   rotateLabels : 90,
                   height : 150,
                   tickFormat: function(d){
                       return (d);
                   }
               },
               yAxis: {
                   axisLabel: gettextCatalog.getString('Target risk'),
                   axisLabelDistance: -20,
                   tickFormat: function(d){
                       return (d);
                   }
               }
           },
     };

//==============================================================================

    function threatsChartYAxis(){
      if ($scope.displayThreatsBy == "number")
      {
        return gettextCatalog.getString("Occurrences");
      }
      if ($scope.displayThreatsBy == "probability")
      {
        return gettextCatalog.getString("Probability");
      };
      if ($scope.displayThreatsBy == "max_associated_risk")
      {
        return gettextCatalog.getString("Max. Associated Risk");
      };
    }

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
                  },
                  renderEnd: function(e){
                    d3AddButton('graphFrame1_title',exportAsPNG, ['graphFrame1','dataChartThreats'] );
                  },
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
                  axisLabel: gettextCatalog.getString('Threat'),
                  showMaxMin: false,
                  rotateLabels : 30,
                  height : 150,
                  tickFormat: function(d){
                      return (d);
                  }
              },
              yAxis: {
                  axisLabelDistance: -20,
                  tickFormat: function(d){
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
                 },
                 renderEnd: function(e){
                   d3AddButton('graphFrame1_title',exportAsPNG, ['graphFrame1','dataChartThreats'] );
                 },
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
                 tickFormat: function(d){
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

     //Options for the chart that displays vulnerabilities by their number of occurrences
     optionsChartVulnerabilitiesNumber_pieChart = {
          chart : {
            type: "pieChart",
            height: 650,
            width: 450,
            // showLabels: true,
            labelType: "value",
            objectEquality: true,
            donut: true,
            donutRatio: 0.60,
            valueFormat: function(d){
                return (d);
            },
            x: function(d){return d.key;},
            y: function(d){return d.y;},
            dispatch: {
              renderEnd: function(e){
                d3AddButton('graphFrame1_title',exportAsPNG, ['graphFrame1','dataChartVulnes_number'] );
              },
            },
          },
    };

    // optionsChartVulnerabilitiesNumber_discreteBarChart = { //options pour display les vulnérabilités par occurrences en bar chart
    //     chart: {
    //         type: 'discreteBarChart',
    //         height: 800,
    //         width: 450,
    //         margin : {
    //             top: 20,
    //             right: 20,
    //             bottom: 300,
    //             left: 45
    //         },
    //         dispatch: {
    //           renderEnd: function(e){
    //             d3AddButton('graphFrame1_title',exportAsPNG, ['graphFrame1','dataChartVulnes_risk'] );
    //           },
    //         },
    //         clipEdge: true,
    //         //staggerLabels: true,
    //         duration: 500,
    //         stacked: true,
    //         reduceXTicks: false,
    //         staggerLabels : false,
    //         wrapLabels : false,
    //         x: function(d){console.log("d_vuln_number"); console.log(d); return d.key;},
    //         y: function(d){ return d.y;},
    //         xAxis: {
    //             axisLabel: gettextCatalog.getString('Vulnerabilities'),
    //             showMaxMin: false,
    //             rotateLabels : 90,
    //             height : 150,
    //             tickFormat: function(d){
    //                 return (d);
    //             }
    //         },
    //         yAxis: {
    //             axisLabel: gettextCatalog.getString('Number of occurrences'),
    //             axisLabelDistance: -20,
    //             tickFormat: function(d){
    //                 return (d);
    //             }
    //         }
    //     },
    // }

    //Options for the chart that displays vulnerabilities by their maximum associated risk
    optionsChartVulnerabilitiesRisk_discreteBarChart = {
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
            dispatch: {
              renderEnd: function(e){
                d3AddButton('graphFrame1_title',exportAsPNG, ['graphFrame2','dataChartVulnes_risk'] );
              },
            },
            clipEdge: true,
            //staggerLabels: true,
            duration: 500,
            stacked: true,
            reduceXTicks: false,
            staggerLabels : false,
            wrapLabels : false,
            y: function(d){return d.y},
            xAxis: {
                axisLabel: gettextCatalog.getString('Vulnerabilities'),
                showMaxMin: false,
                rotateLabels : 45,
                height : 150,
                tickFormat: function(d){
                    return (d);
                }
            },
            yAxis: {
                axisLabel: gettextCatalog.getString('Number of occurrences'),
                axisLabelDistance: -20,
                tickFormat: function(d){
                  if(Math.floor(d) != d)
                    {
                        return;
                    }

                    return d;
                }
            }
        },
    }

    optionsChartVulnerabilitiesRisk_horizontalBarChart = {
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
            multibar: {
              renderEnd: function(e){
                d3AddButton('graphFrame1_title',exportAsPNG, ['graphFrame2','dataChartVulnes_risk'] );
              },
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
            //y: function(d){return d.max_risk;},
            xAxis: {
                showMaxMin: false,
                rotateLabels : 45,
                height : 150,
                tickFormat: function(d){
                    return (d);
                }
            },
            yAxis: {
                axisLabel: gettextCatalog.getString('Number of occurrences'),
                axisLabelDistance: -10,
                tickFormat: function(d){
                  if(Math.floor(d) != d)
                    {
                        return;
                    }

                    return d;
                }
            }
        },
    }

    function max_x_in_values(tab){
      var out = 0;
      for (var i in [0,1,2]){
        for (var j in tab[i].values){
          if (j.x > i) out = j.x;
        }
      }
    }

    //Options for the chart that displays the cartography
     optionsChartCartography= {
        chart: {
          type: "scatterChart",
          height: 450,
          width: 1000,
          showDistX: true,
          showDistY: true,
          duration: 350,
          xDomain: [0, 20], //Find the max and put max+1 instead of 20
          yDomain: [0, 5], //Find the max and put max+1 instead of 5
          showValues: true,
          showLabels: true,
          dispatch:{
            renderEnd: function(e){
              d3AddButton('graphFrame1_title',exportAsPNG, ['graphFrame1','dataChartCartography'] );
            },
          },
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
            axisLabelDistance: -5
          },
          x: function(d){return d.x;},
          y: function(d){return d.y;},
          size: function(d){return d.size;},
          pointDomain: [0, 10],
        }
    }


// DATA MODELS =================================================================

        //Data model for the graph of actual risk by asset
        dataChartActualRisksByAsset = [
            {
                key: "Low Risks",
                values: []
            },
            {
                 key: "Medium Risks",
                 values: []
             },
             {
                 key: "High Risks",
                 values: []
             }
         ];

         //Data Model for the graph for the actual risk by level of risk (low, med., high)
         dataChartActualRisksByLevel = [
             {
               key: "actualRiskGraph",
               values: [
                   {
                       "label" : "Low Risks" ,
                       "value" : 0,
                       "color" : '#D6F107'
                   } ,
                   {
                       "label" : "Medium Risks" ,
                       "value" : 0,
                       "color" : '#FFBC1C'
                   } ,
                   {
                       "label" : "High Risks" ,
                       "value" : 0,
                       "color" : '#FD661F'
                   }
                 ]
             }
         ];

        //Data model for the graph of residual risks by asset
       dataChartResidualRisksByAsset = [
            {
              key: "Low Risks",
              values: []
          },
          {
               key: "Medium Risks",
               values: []
           },
           {
               key: "High Risks",
               values: []
            }
        ];

        //Data model for the graph for the residual risk by level of risk (low, med., high)
        dataChartResidualRisksByLevel = [
            {
                key: "residualRisks",
                values: [
                    {
                        "label" : "A" ,
                        "value" : 0,
                        "color" : '#D6F107'
                    },
                    {
                        "label" : "B" ,
                        "value" : 0,
                        "color" : '#FFBC1C'
                    },
                    {
                        "label" : "C" ,
                        "value" : 0,
                        "color" : '#FD661F'
                    }
                ]
            }
        ];

        //Data for the graph for the number of threats by threat type
        dataChartThreats = [
             {
               key: "Number of Threats",
               values: []
             }
         ];

        //Data for the graph for the number of threats by threat type
        dataChartThreats = [
              {
                key: "Max. risk associated",
                values: []
              }
          ];

        //Data for the graph for the number of vulnerabilities by vulnerabilities type
        dataChartVulnes_number = [
              {
                key: "Number of occurrences for this vulnerability",
                values: []
              },
        ];

        //Data for the graph for the vulnerabilities by vulnerabilities risk
        dataChartVulnes_risk = [
              {
                key: "Maximum risk for this vulnerability",
                values: []
              },
        ];

        //Data for the graph for the vulnerabilities by vulnerabilities risk
        dataChartCartography = [
            {
              key: gettextCatalog.getString('Confidentiality'), // Problem : Pas de traduction ?
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

//==============================================================================

        /*
        * load a new graph with options and data
        */
        function loadGraph(api,options, data)
        {
          api.updateWithOptions(options);
          api.updateWithData(data);
          api.refresh();
          console.log('loadgraph');
        }

        /*
        * Export idOfGraph as name.PNG
        * @param idOfGraph : string  : the id of the graph
        * @param name : string  : name of the file
        * @param parametersAction : array  : parameters for the function saveSvgAsPng
        */
        function exportAsPNG(idOfGraph, name,parametersAction = { backgroundColor: 'white'})
        {
            var node = d3.select('#'+idOfGraph).select("svg");
            saveSvgAsPng(node.node(), name + '.png', parametersAction);
            console.log('export');
        }
        /*
        * Add a button to a Graph : the layout of the button is for downloading
        * @param idOfGraph : string  : the id of the graph
        * @param action : function  : name of the function
        * @param parametersAction : array  : parameters for the action function
        * TODO : improve to custom the button
        * TODO : improve general layout (manage css in proper file ...)
        */
        function d3AddButton(idOfGraph, action, parametersAction = [])
        {
          if(d3.select("#"+idOfGraph+"Export").empty())
          {
            var sampleSVG = d3.selectAll("#"+idOfGraph)
                  .insert('span', ":first-child")
                  .attr("class", 'title h4')
                  .attr('id', idOfGraph+'Export');

          var sampleSVG = d3.selectAll("#"+idOfGraph+"Export")
                .insert('md-button', ":first-child")
                .attr('type','button')
                .attr('title',gettextCatalog.getString('Export')+ ' (PNG)')
                .attr("class", 'md-icon-button md-button ng-scope md-light-theme');

          var sampleSVG = d3.selectAll("#"+idOfGraph+"Export").select('md-button')
                .insert('md-icon', ":first-child")
                .attr('class', "md-warn ng-scope md-light-theme material-icons")
                .attr('role','img')
                .attr('aria-label','file_download')
                .on('click', function(){action.apply(this, parametersAction)})
                .text('file_download');
            }
        }

//==============================================================================

        /*
        * Add a clickable title on a graph. The title created have the id idOfGraph+Title
        * @param idOfGraph : string  : the id of the graph
        * @param titleText : string : the text to be diplayed as title
        * @param action : function : the name of the function on the click on the title
        * @parametersAction : Array : the parameters of the action
        * TODO : Maybe better to manage style in CSS file
        */
        function d3AddClickableTitleAction(idOfGraph, titleText, action, parametersAction)
        {
            if(d3.select("#"+idOfGraph+"Title").empty()) {
                var sampleSVG = d3.selectAll("#"+idOfGraph)
                                .insert('span', ":first-child")
                                .attr("class", 'title h4')
                                .attr("style", 'transform: translateY(+75%)')
                                .attr('id', idOfGraph+'Title');
             }
             var sampleSVG = d3.selectAll("#"+idOfGraph+"Title")
                  .text(titleText)
                  .on('click', function(){action.apply(this, parametersAction)});
         }

//==============================================================================

        /*
          Refreshes the charts with the right data if the displayed risk analysis changes
        */
        $scope.$watch('dashboard.anr', function (newValue) {
            if (newValue) {
                $scope.dashboard.anrData = null;
                for (var i = 0; i < $scope.clientAnrs.length; ++i) {
                    if ($scope.clientAnrs[i].id == newValue) {
                        $scope.dashboard.anrData = $scope.clientAnrs[i];
                        break;
                    }
                }
                $scope.currentTabIndex = $scope.currentTabIndex2 = $scope.currentTabIndex3 = $scope.currentTabIndex4 = $scope.currentTabIndex5 = 0;
                $scope.dashboard.firstRefresh = true; // allows to avoid the pie chart display bug
                $rootScope.setAnrLanguage($scope.clientAnrs.find(x => x.id === newValue).language); //gets the language of the analysis
                $http.get("api/client-anr/" + newValue + "/carto-risks-dashboard").then(function (data) {
                  updateCartoRisks(newValue, data);
                });
                $http.get("api/client-anr/" + newValue + "/risks-dashboard?limit=-1").then(function(data){
                  updateActualRisksByAsset(newValue, data);
                  updateResidualRisksByAsset(newValue, data);
                  updateThreats(newValue, data);
                  updateVulnerabilities(newValue, data, callbackVulnerabilitiesNumber);
                  // updateVulnerabilities(newValue, data,$scope.dashboard.vulnerabilitiesDisplayed);
                  updateCartography(newValue, data);
                  $scope.selectGraphRisks();
                });
            }
        });

        $scope.$watch('clientCurrentAnr', function (newValue) {
            if (newValue) {
                $scope.dashboard.anr = newValue.id;
            }
        });

        $scope.$watch('displayActualRisksBy', function (newValue) {
            if (newValue=="level" && $scope.dashboard.anr) {
              loadGraph($scope.graphFrame1,optionsCartoRisk,dataChartActualRisksByLevel);
            }
            if (newValue=="asset" && $scope.dashboard.anr) {
              loadGraph($scope.graphFrame1,optionsChartActualRisksByAsset,dataChartActualRisksByAsset);
            }
        });

        $scope.$watch('displayResidualRisksBy', function (newValue) {
            if (newValue=="level" && $scope.dashboard.anr) {
              loadGraph($scope.graphFrame2,optionsCartoRisk,dataChartResidualRisksByLevel);
            }
            if (newValue=="asset" && $scope.dashboard.anr) {
              loadGraph($scope.graphFrame2,optionsChartResidualRisksByAsset,dataChartResidualRisksByAsset);
            }
        });

        $scope.$watch('displayThreatsBy', function (newValue) {
            if (newValue && $scope.dashboard.anr) {
              $http.get("api/client-anr/" + $scope.dashboard.anr + "/risks-dashboard?limit=-1").then(function(data){
                updateThreats($scope.dashboard.anr, data);
                updateThreats($scope.dashboard.anr, data);
              });
            }
        });

        $scope.$watch('threatsChartOption', function (newValue) {
            if (newValue && $scope.dashboard.anr) {
              loadGraph($scope.graphFrame1,window[newValue],dataChartThreats);
            }
        });

        $scope.$watch('dashboard.vulnerabilitiesDisplayed', function (newValue) {
            if (newValue && $scope.dashboard.anr && $scope.showVulnerabilitiesTabs && $scope.vulnerabilitiesChartOption) {
              $http.get("api/client-anr/" + $scope.dashboard.anr + "/risks-dashboard?limit=-1").then(function(data){
                updateVulnerabilities($scope.dashboard.anr, data, callbackVulnerabilitiesNumber);
              });
            }
        });

        $scope.$watch('displayVulnerabilitiesBy', function (newValue) {
            if (newValue && $scope.dashboard.anr) {
              $http.get("api/client-anr/" + $scope.dashboard.anr + "/risks-dashboard?limit=-1").then(function(data){
                updateVulnerabilities($scope.dashboard.anr, data, callbackVulnerabilitiesNumber);
                updateVulnerabilities($scope.dashboard.anr, data, callbackVulnerabilitiesNumber);
              });
            }
        });

        $scope.$watch('vulnerabilitiesChartOption', function (newValue) {
            if (newValue && $scope.dashboard.anr) {
              loadGraph($scope.graphFrame1,window[newValue],dataChartVulnes_risk);
            }
        });

        // $scope.$watch('dashboard.vulnerabilitiesDisplayed', function (newValue) {
        //     if (newValue && $scope.dashboard.anr && $scope.showVulnerabilitiesTabs) {
        //       $http.get("api/client-anr/" + $scope.dashboard.anr + "/risks-dashboard?limit=-1").then(function(data){
        //         updateVulnerabilities($scope.dashboard.anr, data);
        //       });
        //     }
        // });

        function callbackVulnerabilitiesNumber(){
          loadGraph($scope.graphFrame1,optionsChartVulnerabilitiesNumber_pieChart,$scope.dashboard.pieChartData.values);
        }

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

        /*
        * Add a risk in a tab if the risk is not already present in the tab
        */
        function addOneRiskPieChart(tab, value)
        {
          for(i=0 ; i < tab.length ; i++)
            if(tab[i].key === value)
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

        /*
        * Update the chart of the actual risks by assets
        */
        var updateActualRisksByAsset = function (anrId, data) {
            treshold1 = $scope.clientAnrs.find(x => x.id === anrId).seuil1;
            treshold2 = $scope.clientAnrs.find(x => x.id === anrId).seuil2;
              dataChartActualRisksByAsset[0].values = [];
              dataChartActualRisksByAsset[1].values = [];
              dataChartActualRisksByAsset[2].values = [];
              risksList = data.data.risks;
              for (var i=0; i < risksList.length ; ++i)
              {
                var eltlow = new Object();
                var eltmed = new Object();
                var elthigh = new Object();
                  if(!findValueId(dataChartActualRisksByAsset[0].values,$scope._langField(risksList[i],'instanceName'))&&risksList[i].max_risk>0)
                  {
                    // initialize element
                    eltlow.id = eltmed.id = elthigh.id = risksList[i].instance; //keep the instance id as id
                    eltlow.x = eltmed.x = elthigh.x = $scope._langField(risksList[i],'instanceName');
                    eltlow.y = eltmed.y = elthigh.y = 0;
                    eltlow.color = '#D6F107';
                    dataChartActualRisksByAsset[0].values.push(eltlow);
                    eltmed.color = '#FFBC1C';
                    dataChartActualRisksByAsset[1].values.push(eltmed);
                    elthigh.color = '#FD661F';
                    dataChartActualRisksByAsset[2].values.push(elthigh);
                  }
                  if(risksList[i].max_risk>treshold2)
                  {
                    addOneRisk(dataChartActualRisksByAsset[2].values,$scope._langField(risksList[i],'instanceName'));
                  }
                  else if (risksList[i].max_risk<=treshold2 && risksList[i].max_risk>treshold1)
                  {
                    addOneRisk(dataChartActualRisksByAsset[1].values,$scope._langField(risksList[i],'instanceName'));
                  }
                  else if (risksList[i].max_risk>0 && risksList[i].max_risk<=treshold1)
                  {
                    addOneRisk(dataChartActualRisksByAsset[0].values,$scope._langField(risksList[i],'instanceName'));
                  }
                };
        };

//==============================================================================

        /*
        * Update the chart of the residual risks by assets
        */
        var updateResidualRisksByAsset = function (anrId, data) {
            treshold1 = $scope.clientAnrs.find(x => x.id === anrId).seuil1;
            treshold2 = $scope.clientAnrs.find(x => x.id === anrId).seuil2;
              dataChartResidualRisksByAsset[0].values = [];
              dataChartResidualRisksByAsset[1].values = [];
              dataChartResidualRisksByAsset[2].values = [];
              risksList = data.data.risks;
              if($scope.dashboard.carto.targeted){ //n'affiche des données que si des risques cible existent
                for (var i=0; i < risksList.length ; ++i)
                {
                  var eltlow2 = new Object();
                  var eltmed2 = new Object();
                  var elthigh2 = new Object();
                    if(!findValueId(dataChartResidualRisksByAsset[0].values,$scope._langField(risksList[i],'instanceName'))&&risksList[i].max_risk>0)
                    {
                      // initialize element
                      eltlow2.id = eltmed2.id = elthigh2.id = risksList[i].instance; //keep the instance id as id
                      eltlow2.x = eltmed2.x = elthigh2.x = $scope._langField(risksList[i],'instanceName');
                      eltlow2.y = eltmed2.y = elthigh2.y = 0;
                      eltlow2.color = '#D6F107';
                      dataChartResidualRisksByAsset[0].values.push(eltlow2);
                      eltmed2.color = '#FFBC1C';
                      dataChartResidualRisksByAsset[1].values.push(eltmed2);
                      elthigh2.color = '#FD661F';
                      dataChartResidualRisksByAsset[2].values.push(elthigh2);
                    }
                    if(risksList[i].target_risk>treshold2)
                    {
                      addOneRisk(dataChartResidualRisksByAsset[2].values,$scope._langField(risksList[i],'instanceName'));
                    }
                    else if (risksList[i].target_risk<=treshold2 && risksList[i].target_risk>treshold1)
                    {
                      addOneRisk(dataChartResidualRisksByAsset[1].values,$scope._langField(risksList[i],'instanceName'));
                    }
                    else if (risksList[i].target_risk>-1 && risksList[i].target_risk<=treshold1)
                    {
                      addOneRisk(dataChartResidualRisksByAsset[0].values,$scope._langField(risksList[i],'instanceName'));
                    }
                }
              };
        };

//==============================================================================

        /*
        * Update the chart of the number of threats by threat type
        */
        var updateThreats = function (anrId, data) {
              dataChartThreats[0].values = [];
              risksList = data.data.risks;
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
              };
        };

//==============================================================================

        /*
        * Update the chart of the number of the top 5 vulnerabilities by vulnerabilities type
        */
        var updateVulnerabilities = function (anrId, data, callback) {
              if ($scope.vulnerabilitiesChartOption!="optionsChartVulnerabilitiesRisk_pieChart"){ //if the graph is not a pie chart
                var dataTempChartVulnes_risk = [];
                dataChartVulnes_risk[0].values = [];
                risksList = data.data.risks;
                for (var i=0; i < risksList.length ; ++i)
                {
                  var eltvuln_risk = new Object();
                  if(!findValueId(dataTempChartVulnes_risk,$scope._langField(risksList[i],'vulnLabel'))&&risksList[i].max_risk>0)
                  {
                    // initialize element
                    eltvuln_risk.id = risksList[i].vid; //keep the threatID as id
                    eltvuln_risk.x = $scope._langField(risksList[i],'vulnLabel');
                    eltvuln_risk.y = 0;
                    eltvuln_risk.max_risk = risksList[i].max_risk; //We can define max_risk for the vulnerability in the initialisation because objects in RisksList are ordered by max_risk
                    eltvuln_risk.color = '#D66607';
                    dataTempChartVulnes_risk.push(eltvuln_risk);
                  }
                  if (risksList[i].max_risk>0)
                  {
                  addOneRisk(dataTempChartVulnes_risk,$scope._langField(risksList[i],'vulnLabel'));
                  }
                }
                if ($scope.displayVulnerabilitiesBy == "number")
                {
                  console.log("salut_number")
                  dataTempChartVulnes_risk.sort(compareByNumber);
                  console.log(dataTempChartVulnes_risk)
                  for (var i=0; i<dataTempChartVulnes_risk.length; i++)
                  {
                    relativeHexColorYParameter(i,dataTempChartVulnes_risk,79.75);
                  }
                }
                // if ($scope.displayThreatsBy == "probability")
                // {
                //   dataChartThreats[0].values.sort(compareByAverage);
                //   for (var i=0; i<dataChartThreats[0].values.length; i++)
                //   {
                //     dataChartThreats[0].values[i].y=dataChartThreats[0].values[i].average;
                //   }
                //   for (var i=0; i<dataChartThreats[0].values.length; i++)
                //   {
                //     relativeHexColorYParameter(i,dataChartThreats[0].values,79.75);
                //   }
                // };
                if ($scope.displayVulnerabilitiesBy == "max_associated_risk")
                {
                  console.log("salut_risk")
                  for (var i=0; i<dataTempChartVulnes_risk.length; i++)
                  {
                    relativeHexColorMaxRiskParameter(i,dataTempChartVulnes_risk,79.75)
                  }
                  console.log(dataTempChartVulnes_risk)
                  for (var i=0; i<dataTempChartVulnes_risk.length; i++)
                  {
                    dataTempChartVulnes_risk[i].y=dataTempChartVulnes_risk[i].max_risk;
                  }
                  console.log(dataTempChartVulnes_risk)
                }
                if (dataTempChartVulnes_risk.length>=$scope.dashboard.vulnerabilitiesDisplayed)
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
              }
              else{ //if the graph is a pie chart
                var dataTempChartVulnes_number = [];
                $scope.dashboard.pieChartData.values = [];
                risksList = data.data.risks;
                for (var i=0; i < risksList.length ; ++i)
                {
                  //define the color
                  var eltvuln_number = new Object();
                  if(!findValueId(dataTempChartVulnes_number,$scope._langField(risksList[i],'vulnLabel'))&&risksList[i].max_risk>0)
                  {
                    // initialize element
                    eltvuln_number.id = risksList[i].vid; //keep the threatID as id
                    eltvuln_number.x = $scope._langField(risksList[i],'vulnLabel');
                    eltvuln_number.key = $scope._langField(risksList[i],'vulnLabel');
                    eltvuln_number.y = 0;
                    eltvuln_number.max_risk = risksList[i].max_risk; //We can define max_risk for the vulnerability in the initialisation because objects in RisksList are ordered by max_risk
                    eltvuln_number.color = '#D66607';
                    dataTempChartVulnes_number.push(eltvuln_number);
                  }
                  if (risksList[i].max_risk>0)
                  {
                    addOneRiskPieChart(dataTempChartVulnes_number,$scope._langField(risksList[i],'vulnLabel'));
                  }
                }
                dataTempChartVulnes_number.sort(compareByNumber);
                //define adapted color for the chart
                for (var i=0; i<dataTempChartVulnes_number.length; i++)
                {
                  relativeHexColorYParameter(i,dataTempChartVulnes_number,120)
                }
                if (dataTempChartVulnes_number.length>$scope.dashboard.vulnerabilitiesDisplayed) //if we have enough data
                {
                  for (var j=0; j < $scope.dashboard.vulnerabilitiesDisplayed; ++j) //we keep the first 5/10/15/20 elements of the array
                  {
                    $scope.dashboard.pieChartData.values.push(dataTempChartVulnes_number[j]);
                  }
                }
                else //if we don't have enough data
                {
                  for (var j=0; j < dataTempChartVulnes_number.length; ++j) //we put everything in the data scope
                  {
                    $scope.dashboard.pieChartData.values.push(dataTempChartVulnes_number[j]);
                  }
                }
                if (!$scope.dashboard.firstRefresh) //the following lines are here to prevent a display bug when loading the dashboard
                {
                    callback(); //made to call the loadgraph to help with the refresh problems of the pie chart
                }
                else
                {
                  $scope.dashboard.firstRefresh=false;
                };
              }
        };

//==============================================================================

        /*
        * Update the chart of the number of the top 5 vulnerabilities by vulnerabilities type
        */
        // var updateVulnerabilities = function (anrId, data) {
        //       var dataTempChartVulnes_risk = [];
        //       dataChartVulnes_risk[0].values = [];
        //       risksList = data.data.risks;
        //       for (var i=0; i < risksList.length ; ++i)
        //       {
        //         var eltvuln_risk = new Object();
        //         if(!findValueId(dataTempChartVulnes_risk,$scope._langField(risksList[i],'vulnLabel'))&&risksList[i].max_risk>0)
        //         {
        //           // initialize element
        //           eltvuln_risk.id = risksList[i].vid; //keep the threatID as id
        //           eltvuln_risk.x = $scope._langField(risksList[i],'vulnLabel');
        //           eltvuln_risk.y = 0;
        //           eltvuln_risk.max_risk = risksList[i].max_risk; //We can define max_risk for the vulnerability in the initialisation because objects in RisksList are ordered by max_risk
        //           eltvuln_risk.color = '#D66607';
        //           dataTempChartVulnes_risk.push(eltvuln_risk);
        //         }
        //         if (risksList[i].max_risk>0)
        //         {
        //         addOneRisk(dataTempChartVulnes_risk,$scope._langField(risksList[i],'vulnLabel'));
        //         }
        //       }
        //       for (var i=0; i<dataTempChartVulnes_risk.length; i++)
        //       {
        //         relativeHexColorMaxRiskParameter(i,dataTempChartVulnes_risk,79.75)
        //       }
        //       if (dataTempChartVulnes_risk.length>=$scope.dashboard.vulnerabilitiesDisplayed)
        //       {
        //         for (var j=0; j < $scope.dashboard.vulnerabilitiesDisplayed; ++j) //Only keeps first X elements of array
        //         {
        //           dataChartVulnes_risk[0].values.push(dataTempChartVulnes_risk[j]);
        //         }
        //       }
        //       else
        //       {
        //         for (var j=0; j < dataTempChartVulnes_risk.length; ++j) //Only keeps first X elements of array
        //         {
        //           dataChartVulnes_risk[0].values.push(dataTempChartVulnes_risk[j]);
        //         }
        //       };
        // };

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
        var updateCartography = function (anrId, data) {
              dataChartCartography[0].values = [];
              dataChartCartography[1].values = [];
              dataChartCartography[2].values = [];
              risksList = data.data.risks;
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
                    //defines the y value depending on what risk we're looking at
                    if (risk_number==0) eltCarto.mesured = gettextCatalog.getString('Confidentiality');
                    else if (risk_number==1) eltCarto.mesured = gettextCatalog.getString('Availability');
                    else if (risk_number==2) eltCarto.mesured = gettextCatalog.getString('Integrity');
                    eltCarto.size = 0;
                    eltCarto.color = '#FFBC1C';
                    dataChartCartography[risk_number].values.push(eltCarto);
                  }
                  for (var k=0; k<dataChartCartography[risk_number].values.length;k++){
                    if(JSON.stringify(ITV_array) === JSON.stringify(dataChartCartography[risk_number].values[k].itv)) dataChartCartography[risk_number].values[k].size+=5 ;
                  }
                }
              }
        };

//==============================================================================

        /**
        * Update the two first charts which are displayed (the number of risk
        * by category (high, med., low) for residual and actual risk)
        */
        var updateCartoRisks = function (anrId, data) {
                $scope.dashboard.carto = data.data.carto;
                //fill the charts
                dataChartActualRisksByLevel[0].values[0].label = gettextCatalog.getString('low risks');
                dataChartActualRisksByLevel[0].values[0].value = data.data.carto.real.distrib[0];
                dataChartActualRisksByLevel[0].values[1].label = gettextCatalog.getString('medium risks');
                dataChartActualRisksByLevel[0].values[1].value = data.data.carto.real.distrib[1];
                dataChartActualRisksByLevel[0].values[2].label = gettextCatalog.getString('high risks');
                dataChartActualRisksByLevel[0].values[2].value = data.data.carto.real.distrib[2];
                //loadGraph($scope.graphFrame1,optionsCartoRisk,dataChartActualRisksByLevel);
                dataChartResidualRisksByLevel[0].values[0].value = [];
                dataChartResidualRisksByLevel[0].values[1].value = [];
                dataChartResidualRisksByLevel[0].values[2].value = [];
                if (data.data.carto.targeted) {
                    dataChartResidualRisksByLevel[0].values[0].label = gettextCatalog.getString('low risks');
                    dataChartResidualRisksByLevel[0].values[0].value = data.data.carto.targeted.distrib[0];
                    dataChartResidualRisksByLevel[0].values[1].label = gettextCatalog.getString('medium risks');
                    dataChartResidualRisksByLevel[0].values[1].value = data.data.carto.targeted.distrib[1];
                    dataChartResidualRisksByLevel[0].values[2].label = gettextCatalog.getString('high risks');
                    dataChartResidualRisksByLevel[0].values[2].value = data.data.carto.targeted.distrib[2];
                    //loadGraph($scope.graphFrame2,optionsCartoRisk,dataChartResidualRisksByLevel);
                };
        };
    }

})();

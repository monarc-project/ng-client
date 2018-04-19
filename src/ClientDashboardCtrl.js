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


$scope.dashboard.showGraphFrame1 = $scope.dashboard.showGraphFrame2 = true; //These values define if the graphs will be displayed
$scope.dashboard.showVulnerabilitiesTab = false; //This value defines if the "Top 5, Top 10" tab will be displayed
$scope.dashboard.pieChartData = {
      key: "Number of occurences for this vulnerability",
      values: []
};
$scope.dashboard.firstRefresh = true;

        $scope.selectGraphRisks = function () { //Displays the risks charts
            $scope.showVulnerabilitiesTab = false;
            $scope.dashboard.showGraphFrame2=true;
            loadGraph($scope.graphFrame1,optionsCartoRisk,dataDesignActualRisks);
            loadGraph($scope.graphFrame2,optionsCartoRisk,dataDesignResidualRisks);
            document.getElementById("graphFrame1_title").textContent=gettextCatalog.getString('Current risks map');
            document.getElementById("graphFrame2_title").textContent=gettextCatalog.getString('Target risks map');
        };

        $scope.selectGraphThreats = function () { //Displays the threats charts
            $scope.showVulnerabilitiesTab = false;
            loadGraph($scope.graphFrame1,optionsChartThreats_number,dataChartThreats_number);
            loadGraph($scope.graphFrame2,optionsChartThreats_risk,dataChartThreats_risk);
            $scope.dashboard.showGraphFrame2=true;
            document.getElementById("graphFrame1_title").textContent=gettextCatalog.getString('Number of threats for each threat type');
            document.getElementById("graphFrame2_title").textContent=gettextCatalog.getString('Maximum risk for each threat type');
        };

        $scope.selectGraphVulnerabilities = function () { //Displays the vulnerabilities charts
            $scope.showVulnerabilitiesTab = true;
            loadGraph($scope.graphFrame1,optionsChartVulnerabilities_number,$scope.dashboard.pieChartData.values);
            loadGraph($scope.graphFrame2,optionsChartVulnerabilities_risk,dataChartVulnes_risk);
            $scope.dashboard.showGraphFrame2=true;
            document.getElementById("graphFrame1_title").textContent=gettextCatalog.getString('Vulnerabilities with the most occurences');
            document.getElementById("graphFrame2_title").textContent=gettextCatalog.getString('Vulnerabilities with the highest risk');
        };

        $scope.selectGraphCartography = function () { //Displays the cartography
            $scope.showVulnerabilitiesTab = false;
            loadGraph($scope.graphFrame1,optionsChartCartography,dataChartCartography);
            document.getElementById('graphFrame2').setAttribute("ng-show", "false");
            $scope.dashboard.showGraphFrame2=false;
            document.getElementById("graphFrame1_title").textContent=gettextCatalog.getString('Cartography');
        };

        $scope.selectGraphDecisionSupport = function () { //Displays the decision support tab
            $scope.showVulnerabilitiesTab = false;
            $scope.dashboard.showGraphFrame2=false;
            loadGraph($scope.graphFrame1,optionsChartCartography,dataChartCartography);
        };

        $scope.selectGraphPerspective = function () { //Displays the persepctive charts
            $scope.showVulnerabilitiesTab = false;
            $scope.dashboard.showGraphFrame2=false;
            loadGraph($scope.graphFrame1,optionsChartCartography,dataChartCartography);
        };

        $scope.changeDisplayedVulnerabilities = function (number) { //Changes the top X vulnerabilities displayed
            $scope.dashboard.vulnerabilitiesDisplayed = number;
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
                  elementClick: function(e){
                    if(e.element.ownerSVGElement.parentElement.id == "graphFrame1"){ //fetch the father
                      loadGraph($scope.graphFrame1,optionsChartActualRisks,dataChartActualRisks);
                    }
                    else if(e.element.ownerSVGElement.parentElement.id == "graphFrame2"){ //fetch the father
                      loadGraph($scope.graphFrame2,optionsChartResidualRisks,dataChartResidualRisks);
                    }
                  },
                  renderEnd: function(e){
                    d3AddButton('graphFrame1',exportAsPNG, ['graphFrame1','ActualRiskByCategory'] );
                    d3AddButton('graphFrame2',exportAsPNG, ['graphFrame2','ResidualRiskByCategory'] );
                  },
                }
            },
           },
       };

//==============================================================================

       //Options for the chart that displays the actual risks by asset
       optionsChartActualRisks = {
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
                      d3AddButton('graphFrame1',exportAsPNG, ['graphFrame1','dataChartActualRisks'] );
                      d3AddClickableTitleAction('graphFrame1','Retour',loadGraph, [$scope.graphFrame1,optionsCartoRisk,dataDesignActualRisks]);
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

      // !!! : Très peu élégant : A changer en rentrant simplement les bons paramètres dans le renderEnd de optionsChartRisks
      // optionsChartResidualRisks : option for the chart of residual risks by asset
      optionsChartResidualRisks = {
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
                     d3AddButton('graphFrame2',exportAsPNG, ['graphFrame2','dataChartResidualRisks'] );
                     d3AddClickableTitleAction('graphFrame2','Retour',loadGraph, [$scope.graphFrame2,optionsCartoRisk,dataDesignResidualRisks]);
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

     //Options for the chart that displays threats by their number of occurences
     optionsChartThreats_number = {
          chart: {
              type: 'discreteBarChart',
              height: 800,
              width: 450,
              margin : {
                  top: 20,
                  right: 20,
                  bottom: 400,
                  left: 45
              },
              dispatch: { //on click switch to the evaluated risk
                renderEnd: function(e){
                  d3AddButton('graphFrame1',exportAsPNG, ['graphFrame1','dataChartThreats_number'] );
                },
              },

              clipEdge: true,
              //staggerLabels: true,
              duration: 500,
              stacked: true,
              reduceXTicks: false,
              staggerLabels : false,
              wrapLabels : false,
              xAxis: {
                  axisLabel: gettextCatalog.getString('Threat'),
                  showMaxMin: false,
                  rotateLabels : 90,
                  height : 150,
                  tickFormat: function(d){
                      return (d);
                  }
              },
              yAxis: {
                  axisLabel: gettextCatalog.getString('Occurences'),
                  axisLabelDistance: -20,
                  tickFormat: function(d){
                      return (d);
                  }
              }
          },
    };

//==============================================================================

     //Options for the chart that displays threats by their maximum associated risk
     optionsChartThreats_risk = {
          chart: {
              type: 'discreteBarChart',
              height: 800,
              width: 450,
              margin : {
                  top: 20,
                  right: 20,
                  bottom: 400,
                  left: 45
              },
              dispatch: { //on click switch to the evaluated risk
                renderEnd: function(e){
                  d3AddButton('graphFrame2',exportAsPNG, ['graphFrame2','dataChartThreats_risk'] );
                },
              },

              clipEdge: true,
              //staggerLabels: true,
              duration: 500,
              stacked: true,
              reduceXTicks: false,
              staggerLabels : false,
              wrapLabels : false,
              xAxis: {
                  axisLabel: gettextCatalog.getString('Threat'),
                  showMaxMin: false,
                  rotateLabels : 90,
                  height : 150,
                  tickFormat: function(d){
                      return (d);
                  }
              },
              yAxis: {
                  axisLabel: gettextCatalog.getString('Max. risk associated'),
                  axisLabelDistance: -20,
                  tickFormat: function(d){
                      return (d);
                  }
              }
          },
    };

//==============================================================================

     //Options for the chart that displays vulnerabilities by their number of occurences
     optionsChartVulnerabilities_number = {
          chart : {
            type: "pieChart",
            height: 650,
            width: 450,
            // showLabels: true,
            labelType: "value",
            objectEquality: true,
            // donut: true,
            // donutRatio: 0.60,
            x: function(d){return d.key;},
            y: function(d){return d.y;},
            dispatch: {
              renderEnd: function(e){
                d3AddButton('graphFrame1',exportAsPNG, ['graphFrame1','dataChartVulnes_number'] );
              },
            },
          },
    };
    // optionsChartVulnerabilities_number = {
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
    //             d3AddButton('graphFrame1',exportAsPNG, ['graphFrame1','dataChartVulnes_risk'] );
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
    //             axisLabel: gettextCatalog.getString('Number of occurences'),
    //             axisLabelDistance: -20,
    //             tickFormat: function(d){
    //                 return (d);
    //             }
    //         }
    //     },
    // }

    //Options for the chart that displays vulnerabilities by their maximum associated risk
    optionsChartVulnerabilities_risk = {
        chart: {
            type: 'discreteBarChart',
            height: 800,
            width: 450,
            margin : {
                top: 20,
                right: 20,
                bottom: 300,
                left: 45
            },
            dispatch: {
              renderEnd: function(e){
                d3AddButton('graphFrame2',exportAsPNG, ['graphFrame2','dataChartVulnes_risk'] );
              },
            },
            clipEdge: true,
            //staggerLabels: true,
            duration: 500,
            stacked: true,
            reduceXTicks: false,
            staggerLabels : false,
            wrapLabels : false,
            y: function(d){return d.max_risk;},
            xAxis: {
                axisLabel: gettextCatalog.getString('Vulnerabilities'),
                showMaxMin: false,
                rotateLabels : 90,
                height : 150,
                tickFormat: function(d){
                    return (d);
                }
            },
            yAxis: {
                axisLabel: gettextCatalog.getString('Number of occurences'),
                axisLabelDistance: -20,
                tickFormat: function(d){
                    return (d);
                }
            }
        },
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
          xDomain: [0, 20],
          yDomain: [0, 5],
          showValues: true,
          showLabels: true,
          yAxisTickFormat : "yAxisTickFormatFunction()",
          xAxisTickFormat : "xAxisTickFormatFunction()",
          scatter: {
            onlyCircles: true,
            renderEnd: function(e){
              d3AddButton('graphFrame1',exportAsPNG, ['graphFrame1','dataChartCartography'] );
            },
          },
          // zoom: {
          //   enabled: true,
          //   scaleExtent: [
          //     1,
          //     10
          //   ],
          //   useFixedDomain: false,
          //   useNiceScale: false,
          //   horizontalOff: false,
          //   verticalOff: false,
          //   unzoomEventType: "dblclick.zoom"
          // },
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
          pointDomain: [0, 10]
        }
    }


// DATA MODELS =================================================================

        //Data model for the graph of actual risk by asset
        dataChartActualRisks = [
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
         dataDesignActualRisks = [
             {
               key: "actualRiskGraph",
               values: [
                   {
                       "label" : "A" ,
                       "value" : 0,
                       "color" : '#D6F107'
                   } ,
                   {
                       "label" : "B" ,
                       "value" : 0,
                       "color" : '#FFBC1C'
                   } ,
                   {
                       "label" : "C" ,
                       "value" : 0,
                       "color" : '#FD661F'
                   }
                 ]
             }
         ];

        //Data model for the graph of residual risks by asset
       dataChartResidualRisks = [
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
        dataDesignResidualRisks = [
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
        dataChartThreats_number = [
             {
               key: "Number of Threats",
               values: []
             }
         ];

        //Data for the graph for the number of threats by threat type
        dataChartThreats_risk = [
              {
                key: "Max. risk associated",
                values: []
              }
          ];

        //Data for the graph for the number of vulnerabilities by vulnerabilities type
        dataChartVulnes_number = [
              {
                key: "Number of occurences for this vulnerability",
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
              key: gettextCatalog.getString('Integrity'),
              values: [],
              color: "#00FF00"
            },
            {
              key: gettextCatalog.getString('Availability'),
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
                updateCartoRisks(newValue);
                updateActualRisksByAsset(newValue);
                updateResidualRisksByAsset(newValue);
                updateThreats_number(newValue);
                updateThreats_risk(newValue);
                // updateVulnerabilities_number(newValue,$scope.dashboard.vulnerabilitiesDisplayed); //Not necessary as long as we watch "vulnerabilities displayed"
                // updateVulnerabilities_risk(newValue,$scope.dashboard.vulnerabilitiesDisplayed);
                updateCartography(newValue);
            }
        });

        $scope.$watch('clientCurrentAnr', function (newValue) {
            if (newValue) {
                $scope.dashboard.anr = newValue.id;
            }
        });

        function callbackVulnerabilitiesNumber(){
          loadGraph($scope.graphFrame1,optionsChartVulnerabilities_number,$scope.dashboard.pieChartData.values);
        }

        $scope.$watch('dashboard.vulnerabilitiesDisplayed', function (newValue) {
            if (newValue) {
              console.log($scope)
              updateVulnerabilities_risk(/*$scope.dashboard.anr*/1,newValue);
              updateVulnerabilities_number(/*$scope.dashboard.anr*/1,newValue, callbackVulnerabilitiesNumber);
            }
        });

        $scope.$watchCollection('dashboard.pieChartData.values', function (newVal, oldVal) {
          //loadGraph($scope.graphFrame1,optionsChartVulnerabilities_number,$scope.dashboard.pieChartData.values);
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

        function numberToColorHsl(i) {
            // as the function expects a value between 0 and 1, and red = 0° and green = 120°
            // we convert the input to the appropriate hue value
            max_angle=79.75;
            var hue = max_angle - i * max_angle;
            // we convert hsl to hex (saturation 100%, lightness 50%)
            return hslToHex(hue, 100, 50);
        }

//==============================================================================

        function relativeHexColorYParameter(index,tab){
          relative_color=(tab[index].y-tab[tab.length-1].y+1)/(tab[0].y-tab[tab.length-1].y+1);
          tab[index].color=numberToColorHsl(relative_color);
        }

//==============================================================================

        function relativeHexColorMaxRiskParameter(index,tab){
          relative_color=(tab[index].max_risk-tab[tab.length-1].max_risk+1)/(tab[0].max_risk-tab[tab.length-1].max_risk+1);
          tab[index].color=numberToColorHsl(relative_color);
        }

//==============================================================================

        /*
        * Update the chart of the actual risks by assets
        */
        var updateActualRisksByAsset = function (anrId) {
            treshold1 = $scope.clientAnrs.find(x => x.id === anrId).seuil1;
            treshold2 = $scope.clientAnrs.find(x => x.id === anrId).seuil2;

            $http.get("api/client-anr/" + anrId + "/risks-dashboard?limit=-1").then(function (data) {
              dataChartActualRisks[0].values = [];
              dataChartActualRisks[1].values = [];
              dataChartActualRisks[2].values = [];
              risksList = data.data.risks;
              for (var i=0; i < risksList.length ; ++i)
              {
                var eltlow = new Object();
                var eltmed = new Object();
                var elthigh = new Object();
                  if(!findValueId(dataChartActualRisks[0].values,$scope._langField(risksList[i],'instanceName'))&&risksList[i].max_risk>0)
                  {
                    // initialize element
                    eltlow.id = eltmed.id = elthigh.id = risksList[i].instance; //keep the instance id as id
                    eltlow.x = eltmed.x = elthigh.x = $scope._langField(risksList[i],'instanceName');
                    eltlow.y = eltmed.y = elthigh.y = 0;
                    eltlow.color = '#D6F107';
                    dataChartActualRisks[0].values.push(eltlow);
                    eltmed.color = '#FFBC1C';
                    dataChartActualRisks[1].values.push(eltmed);
                    elthigh.color = '#FD661F';
                    dataChartActualRisks[2].values.push(elthigh);
                  }
                  if(risksList[i].max_risk>treshold2)
                  {
                    addOneRisk(dataChartActualRisks[2].values,$scope._langField(risksList[i],'instanceName'));
                  }
                  else if (risksList[i].max_risk<=treshold2 && risksList[i].max_risk>treshold1)
                  {
                    addOneRisk(dataChartActualRisks[1].values,$scope._langField(risksList[i],'instanceName'));
                  }
                  else if (risksList[i].max_risk>0 && risksList[i].max_risk<=treshold1)
                  {
                    addOneRisk(dataChartActualRisks[0].values,$scope._langField(risksList[i],'instanceName'));
                  }
                }
              }
            );
        };

//==============================================================================

        /*
        * Update the chart of the residual risks by assets
        */
        var updateResidualRisksByAsset = function (anrId) {
            treshold1 = $scope.clientAnrs.find(x => x.id === anrId).seuil1;
            treshold2 = $scope.clientAnrs.find(x => x.id === anrId).seuil2;

            $http.get("api/client-anr/" + anrId + "/risks-dashboard?limit=-1").then(function (data) {
              dataChartResidualRisks[0].values = [];
              dataChartResidualRisks[1].values = [];
              dataChartResidualRisks[2].values = [];
              risksList = data.data.risks;
              for (var i=0; i < risksList.length ; ++i)
              {
                var eltlow2 = new Object();
                var eltmed2 = new Object();
                var elthigh2 = new Object();
                  if(!findValueId(dataChartResidualRisks[0].values,$scope._langField(risksList[i],'instanceName'))&&risksList[i].max_risk>0)
                  {
                    // initialize element
                    eltlow2.id = eltmed2.id = elthigh2.id = risksList[i].instance; //keep the instance id as id
                    eltlow2.x = eltmed2.x = elthigh2.x = $scope._langField(risksList[i],'instanceName');
                    eltlow2.y = eltmed2.y = elthigh2.y = 0;
                    eltlow2.color = '#D6F107';
                    dataChartResidualRisks[0].values.push(eltlow2);
                    eltmed2.color = '#FFBC1C';
                    dataChartResidualRisks[1].values.push(eltmed2);
                    elthigh2.color = '#FD661F';
                    dataChartResidualRisks[2].values.push(elthigh2);
                  }
                  if(risksList[i].target_risk>treshold2)
                  {
                    addOneRisk(dataChartResidualRisks[2].values,$scope._langField(risksList[i],'instanceName'));
                  }
                  else if (risksList[i].target_risk<=treshold2 && risksList[i].target_risk>treshold1)
                  {
                    addOneRisk(dataChartResidualRisks[1].values,$scope._langField(risksList[i],'instanceName'));
                  }
                  else if (risksList[i].target_risk>-1 && risksList[i].target_risk<=treshold1)
                  {
                    addOneRisk(dataChartResidualRisks[0].values,$scope._langField(risksList[i],'instanceName'));
                  }
                }
              }
            );
        };

//==============================================================================

        /*
        * Update the chart of the number of threats by threat type
        */
        var updateThreats_number = function (anrId) {

            $http.get("api/client-anr/" + anrId + "/risks-dashboard?limit=-1").then(function (data) {
              dataChartThreats_number[0].values = [];
              risksList = data.data.risks;
              for (var i=0; i < risksList.length ; ++i)
              {
                var eltrisk_number = new Object();
                if(!findValueId(dataChartThreats_number[0].values,risksList[i].threatLabel1)&&risksList[i].max_risk>0)
                {
                  // initialize element
                  eltrisk_number.id = risksList[i].tid; //keep the threatID as id
                  eltrisk_number.x = risksList[i].threatLabel1;
                  eltrisk_number.y = 0;
                  eltrisk_number.color = '#D6F107';
                  dataChartThreats_number[0].values.push(eltrisk_number);
                }
                addOneRisk(dataChartThreats_number[0].values,risksList[i].threatLabel1);
              }
              dataChartThreats_number[0].values.sort(compareByNumber);
              for (var i=0; i<dataChartThreats_number[0].values.length; i++)
              {
                relativeHexColorYParameter(i,dataChartThreats_number[0].values)
              }
            }
            );
        };

//==============================================================================

        /*
        * Update the chart of the number of threats by threat type
        */
        var updateThreats_risk = function (anrId) {

            $http.get("api/client-anr/" + anrId + "/risks-dashboard?limit=-1").then(function (data) {
              dataChartThreats_risk[0].values = [];
              risksList = data.data.risks;
              for (var i=0; i < risksList.length ; ++i)
              {
                var eltrisk_risk = new Object();
                if(!findValueId(dataChartThreats_risk[0].values,risksList[i].threatLabel1)&&risksList[i].max_risk>0)
                {
                  // initialize element
                  eltrisk_risk.id = risksList[i].tid; //keep the threatID as id
                  eltrisk_risk.x = risksList[i].threatLabel1;
                  eltrisk_risk.y = 0;
                  eltrisk_risk.max_risk = risksList[i].max_risk; //We can define max_risk for the threat in the initialisation because objects in RisksList are ordered by max_risk
                  eltrisk_risk.color = '#D66607';
                  dataChartThreats_risk[0].values.push(eltrisk_risk);
                }
                addOneRisk(dataChartThreats_risk[0].values,risksList[i].threatLabel1);
              }
              for (var i=0; i<dataChartThreats_risk[0].values.length; i++)
              {
                relativeHexColorMaxRiskParameter(i,dataChartThreats_risk[0].values)
              }
              for (var i=0; i<dataChartThreats_risk[0].values.length; i++)
              {
                dataChartThreats_risk[0].values[i].y=dataChartThreats_risk[0].values[i].max_risk;
              }
              }
            );
        };

//==============================================================================

        /*
        * Update the chart of the number of the top 5 vulnerabilities by vulnerabilities type
        */
        var updateVulnerabilities_number = function (anrId,vulnerabilitiesDisplayed, callback) {
            $http.get("api/client-anr/" + anrId + "/risks-dashboard?limit=-1").then(function (data) {
              var dataTempChartVulnes_number = [];
              $scope.dashboard.pieChartData.values = [];
              risksList = data.data.risks;
              for (var i=0; i < risksList.length ; ++i)
              {
                //define the color
                var eltvuln_number = new Object();
                if(!findValueId(dataTempChartVulnes_number,risksList[i].vulnLabel1)&&risksList[i].max_risk>0)
                {
                  // initialize element
                  eltvuln_number.id = risksList[i].vid; //keep the threatID as id
                  eltvuln_number.x = risksList[i].vulnLabel1;
                  eltvuln_number.key = risksList[i].vulnLabel1;
                  eltvuln_number.y = 0;
                  eltvuln_number.max_risk = risksList[i].max_risk; //We can define max_risk for the vulnerability in the initialisation because objects in RisksList are ordered by max_risk
                  eltvuln_number.color = '#D66607';
                  dataTempChartVulnes_number.push(eltvuln_number);
                }
                addOneRiskPieChart(dataTempChartVulnes_number,risksList[i].vulnLabel1);
              }
              dataTempChartVulnes_number.sort(compareByNumber);
              //define adapted color for the chart
              for (var i=0; i<dataTempChartVulnes_number.length; i++)
              {
                relativeHexColorYParameter(i,dataTempChartVulnes_number)
              }
              if (dataTempChartVulnes_number.length>vulnerabilitiesDisplayed)
              {
                for (var j=0; j < vulnerabilitiesDisplayed; ++j) //Only keeps first 5 elements of array
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
              }
            }
            );
        };

//==============================================================================

        /*
        * Update the chart of the number of the top 5 vulnerabilities by vulnerabilities type
        */
        var updateVulnerabilities_risk = function (anrId,vulnerabilitiesDisplayed) {
            $http.get("api/client-anr/" + anrId + "/risks-dashboard?limit=-1").then(function (data) {
              var dataTempChartVulnes_risk = [];
              dataChartVulnes_risk[0].values = [];
              risksList = data.data.risks;
              for (var i=0; i < risksList.length ; ++i)
              {
                var eltvuln_risk = new Object();
                if(!findValueId(dataTempChartVulnes_risk,risksList[i].vulnLabel1)&&risksList[i].max_risk>0)
                {
                  // initialize element
                  eltvuln_risk.id = risksList[i].vid; //keep the threatID as id
                  eltvuln_risk.x = risksList[i].vulnLabel1;
                  eltvuln_risk.y = 0;
                  eltvuln_risk.max_risk = risksList[i].max_risk; //We can define max_risk for the vulnerability in the initialisation because objects in RisksList are ordered by max_risk
                  eltvuln_risk.color = '#D66607';
                  dataTempChartVulnes_risk.push(eltvuln_risk);
                }
                addOneRisk(dataTempChartVulnes_risk,risksList[i].vulnLabel1);
              }
              for (var i=0; i<dataTempChartVulnes_risk.length; i++)
              {
                relativeHexColorMaxRiskParameter(i,dataTempChartVulnes_risk)
              }
              if (dataTempChartVulnes_risk.length>=vulnerabilitiesDisplayed)
              {
                for (var j=0; j < vulnerabilitiesDisplayed; ++j) //Only keeps first X elements of array
                {
                  dataChartVulnes_risk[0].values.push(dataTempChartVulnes_risk[j]);
                }
              }
            }
            );
        };

//==============================================================================

        /*
        * Check if two itv objects are the same
        * @return true if the same else false
        */
        function sameITV(itv1,itv2){
          if (itv1.i != itv2.i) return false;
          if (itv1.t != itv2.t) return false;
          if (itv1.v != itv2.v) return false;
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
        var updateCartography = function (anrId) {
            $http.get("api/client-anr/" + anrId + "/risks-dashboard?limit=-1").then(function (data) {
              dataChartCartography[0].values = [];
              risksList = data.data.risks;
              for (var risk_number=0; risk_number < 3; risk_number++){
                for (var i=0; i < risksList.length ; ++i)
                {
                  // define ITV_array (Impact, Threat, Vulnerability)
                  var ITV_array = new Object();
                  if (risk_number==0) ITV_array.i = risksList[i].c_impact;
                  else if (risk_number==1) ITV_array.i = risksList[i].d_impact;
                  else ITV_array.i = risksList[i].i_impact;
                  ITV_array.t = risksList[i].threatRate;
                  ITV_array.v = risksList[i].vulnerabilityRate;
                  if(!findITV(dataChartCartography[risk_number].values, ITV_array)&&risksList[i].max_risk>0&&(ITV_array.t*ITV_array.v > 0))
                  {
                    // initialize element
                    var eltCarto = new Object();
                    eltCarto.itv = ITV_array;
                    eltCarto.x = ITV_array.t * ITV_array.v //Likelihood = threat * vulnerability
                    if (risk_number==0) eltCarto.y = risksList[i].c_impact;
                    else if (risk_number==1) eltCarto.y = risksList[i].d_impact;
                    else eltCarto.y = risksList[i].i_impact;
                    eltCarto.size = 0;
                    eltCarto.color = '#FFBC1C';
                    dataChartCartography[risk_number].values.push(eltCarto);
                  }
                  for (var k=0; k<dataChartCartography[risk_number].values.length;k++){
                    if(JSON.stringify(ITV_array) === JSON.stringify(dataChartCartography[risk_number].values[k].itv)) dataChartCartography[risk_number].values[k].size+=5 ;
                  }
                }
              }
            }
            );
        };

//==============================================================================

        /**
        * Update the two first charts which are displayed (the number of risk
        * by category (high, med., low) for residual and actual risk)
        */
        var updateCartoRisks = function (anrId) {
            $http.get("api/client-anr/" + anrId + "/carto-risks-dashboard").then(function (data) {
                $scope.dashboard.carto = data.data.carto;
                //fill the charts
                dataDesignActualRisks[0].values[0].label = gettextCatalog.getString('low risks');
                dataDesignActualRisks[0].values[0].value = data.data.carto.real.distrib[0];
                dataDesignActualRisks[0].values[1].label = gettextCatalog.getString('medium risks');
                dataDesignActualRisks[0].values[1].value = data.data.carto.real.distrib[1];
                dataDesignActualRisks[0].values[2].label = gettextCatalog.getString('high risks');
                dataDesignActualRisks[0].values[2].value = data.data.carto.real.distrib[2];
                loadGraph($scope.graphFrame1,optionsCartoRisk,dataDesignActualRisks);
                if (data.data.carto.targeted) {
                    dataDesignResidualRisks[0].values[0].label = gettextCatalog.getString('low risks');
                    dataDesignResidualRisks[0].values[0].value = data.data.carto.targeted.distrib[0];
                    dataDesignResidualRisks[0].values[1].label = gettextCatalog.getString('medium risks');
                    dataDesignResidualRisks[0].values[1].value = data.data.carto.targeted.distrib[1];
                    dataDesignResidualRisks[0].values[2].label = gettextCatalog.getString('high risks');
                    dataDesignResidualRisks[0].values[2].value = data.data.carto.targeted.distrib[2];
                    loadGraph($scope.graphFrame2,optionsCartoRisk,dataDesignResidualRisks);
                }
            });
        };
    }

})();

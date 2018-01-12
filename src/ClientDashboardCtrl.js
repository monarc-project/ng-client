(function () {

    angular
        .module('ClientApp')
        .controller('ClientDashboardCtrl', [
            '$scope', '$http', 'gettextCatalog', 'UserService', 'toastr', '$rootScope', '$timeout',
            ClientDashboardCtrl
        ]);

    /**
     * Dashboard Controller for the Client module
     */
    function ClientDashboardCtrl($scope, $http, gettextCatalog, UserService, toastr, $rootScope, $timeout) {

        $scope.dashboard = {
            anr: null,
            anrData: null,
            carto: undefined,
            cartoStats: {}
        };
//init default value to avoid errors
        $scope.initOptionActualRisk = $scope.initOptionResidualRisk = {
           chart: {
               type: 'discreteBarChart',
           },
       };
// init default datas to avoid errors
        $scope.initDataActualRisk = $scope.initDataResidualRisk  = [];
//Options of the chart for the both charts who displayed risks by level
        optionsCartoRisk = {
           chart: {
               type: 'discreteBarChart',
               height: 450,
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
                  if(e.element.ownerSVGElement.parentElement.id == "actualGraphRisk") //fetch the father
                    loadGraph($scope.actualGraphRisk,optionsChartRisks,dataChartRisks);
                  //if(e.element.ownerSVGElement.parentElement.id == "residualGraphRisk") //fetch the father
                  //  loadGraph($scope.residualGraphRisk,$scope.optionsChartRisks,dataResidualRisksAsset);
                  },
                }
            },
           },
       };

       optionsChartRisks = {
            chart: {
                type: 'multiBarChart',
                height: 850,
                margin : {
                    top: 70,
                    right: 20,
                    bottom: 300,
                    left: 45
                },
                dispatch: {
                  renderEnd: function(e){
                    console.log(e);
                    d3AddClickableTitleAction('actualGraphRisk','return to the previous graph',loadGraph, [$scope.actualGraphRisk,optionsCartoRisk,dataCartoRisk]);
                    d3AddButton('actualGraphRisk',exportAsPNG, ['actualGraphRisk','ActualRiskByAsset'] );
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

//Data Model for the graph for the actual risk by level of risk (low, med., high)
       dataCartoRisk = [
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
//Data model for the graph of actual risk by asset
        dataChartRisks = [
                         {
                             key: "lowRisks",
                             values: []
                         },
                         {
                             key: "mediumRisks",
                             values: []
                         },
                         {
                             key: "highRisks",
                             values: []
                         }
                     ];
//Data model for the graph of residual risks by asset
       dataResidualRisksAsset = [
                        {
                            key: "lowRisks",
                            values: []
                        },
                        {
                            key: "mediumRisks",
                            values: []
                        },
                        {
                            key: "highRisks",
                            values: []
                        }
                    ];
//Data model for the graph for the residual risk by level of risk (low, med., high)
        dataResidualRisks = [
                  {
                      key: "residualRisks",
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
        * TODO : improve general layout 
        */
        function d3AddButton(idOfGraph, action, parametersAction = [])
        {
          if(d3.select("#"+idOfGraph+"Export").empty())
          {
            var sampleSVG = d3.selectAll("#"+idOfGraph)
                  .insert('div', ":first-child")
                  .attr("class", 'title h4')
                  .attr('id', idOfGraph+'Export')
                  .on('click', function(){action.apply(this, parametersAction)});

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
                .text('file_download');
            }
        }
        /*
        * Add a clickable title on a graph. The title created have the id idOfGraph+Title
        * @param idOfGraph : string  : the id of the graph
        * @param titleText : string : the text to be diplayed as title
        * @param action : function : the name of the function on the click on the title
        * @parametersAction : Array : the parameters of the action
        */
        function d3AddClickableTitleAction(idOfGraph, titleText, action, parametersAction)
        {
          if(d3.select("#"+idOfGraph+"Title").empty())
          {
            var sampleSVG = d3.selectAll("#"+idOfGraph)
                  .insert('div', ":first-child")
                  .attr("class", 'title h4')
                  .attr('id', idOfGraph+'Title');
          }
            var sampleSVG = d3.selectAll("#"+idOfGraph+"Title")
                  .text(titleText)
                  .on('click', function(){action.apply(this, parametersAction)});
          }

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
            }
        });

        $scope.$watch('clientCurrentAnr', function (newValue) {
            if (newValue) {
                $scope.dashboard.anr = newValue.id;
            }
        });
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
        /*
        * Add a risk in a tab if the risk is not already present in the tab
        */        function addOneRisk(tab, value)
        {
          for(i=0 ; i < tab.length ; i++)
            if(tab[i].x === value)
              tab[i].y++;
        }
        /*
        * Update the chart of the actual risks by assets
        */
        var updateActualRisksByAsset = function (anrId) {
          // TODO : Finaly clean the code and create an api who send the information in the right format, maybe better ?
          treshold1 = 0;
          treshold2 = 0;
          $http.get("api/client-anr/" + anrId).then(function (data) {
            treshold1 = data.data.seuil1;
            treshold2 = data.data.seuil2;

            $http.get("api/client-anr/" + anrId + "/risks?limit=-1").then(function (data) {
              dataChartRisks[0].values = [];
              dataChartRisks[1].values = [];
              dataChartRisks[2].values = [];
              risksList = data.data.risks;
              for (var i=0; i < risksList.length ; ++i)
              {
                var eltlow = new Object();
                var eltmed = new Object();
                var elthigh = new Object();
                  if(!findValueId(dataChartRisks[0].values,$scope._langField(risksList[i],'instanceName'))&&risksList[i].max_risk>-1)
                  {
                    // initialize element
                    eltlow.id = eltmed.id = elthigh.id = risksList[i].instance; //keep the instance id as id
                    eltlow.x = eltmed.x = elthigh.x = $scope._langField(risksList[i],'instanceName');
                    eltlow.y = eltmed.y = elthigh.y = 0;
                    eltlow.color = '#D6F107';
                    dataChartRisks[0].values.push(eltlow);
                    eltmed.color = '#FFBC1C';
                    dataChartRisks[1].values.push(eltmed);
                    elthigh.color = '#FD661F';
                    dataChartRisks[2].values.push(elthigh);
                  }
                  if(risksList[i].max_risk>treshold2)
                  {
                    addOneRisk(dataChartRisks[2].values,$scope._langField(risksList[i],'instanceName'));
                  }
                  else if (risksList[i].max_risk<=treshold2 && risksList[i].max_risk>treshold1)
                  {
                    addOneRisk(dataChartRisks[1].values,$scope._langField(risksList[i],'instanceName'));
                  }
                  else if (risksList[i].max_risk>-1 && risksList[i].max_risk<=treshold1)
                  {
                    addOneRisk(dataChartRisks[0].values,$scope._langField(risksList[i],'instanceName'));
                  }
                }
              }
            );
          });
        };

/**
* Update the two first charts which are displayed (the number of risk by category (high, med., low) for residual and actual risk)
*/
        var updateCartoRisks = function (anrId) {
            $http.get("api/client-anr/" + anrId + "/carto-risks").then(function (data) {
                $scope.dashboard.carto = data.data.carto;
                //fill the charts
                  dataCartoRisk[0].values[0].label = gettextCatalog.getString('low risks');
                  dataCartoRisk[0].values[0].value = data.data.carto.real.distrib[0];
                  dataCartoRisk[0].values[1].label = gettextCatalog.getString('medium risks');
                  dataCartoRisk[0].values[1].value = data.data.carto.real.distrib[1];
                  dataCartoRisk[0].values[2].label = gettextCatalog.getString('high risks');
                  dataCartoRisk[0].values[2].value = data.data.carto.real.distrib[2];
                  loadGraph($scope.actualGraphRisk,optionsCartoRisk,dataCartoRisk);
                  if (data.data.carto.targeted) {
                    dataResidualRisks[0].values[0].label = gettextCatalog.getString('low risks');
                    dataResidualRisks[0].values[0].value = data.data.carto.targeted.distrib[0];
                    dataResidualRisks[0].values[1].label = gettextCatalog.getString('medium risks');
                    dataResidualRisks[0].values[1].value = data.data.carto.targeted.distrib[1];
                    dataResidualRisks[0].values[2].label = gettextCatalog.getString('high risks');
                    dataResidualRisks[0].values[2].value = data.data.carto.targeted.distrib[2];
                    loadGraph($scope.residualGraphRisk,optionsCartoRisk,dataResidualRisks);

                }
            });
        };
    }

})();

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

        var salut=true;

//==============================================================================

        $scope.selectGraphRisks = function () {
            loadGraph($scope.graphFrame1,optionsCartoRisk,dataDesignActualRisks);
            loadGraph($scope.graphFrame2,optionsCartoRisk,dataDesignResidualRisks);
            document.getElementById("graphFrame1_title").textContent=gettextCatalog.getString('Current risks map');
            document.getElementById("graphFrame2_title").textContent=gettextCatalog.getString('Target risks map');
        };

        $scope.selectGraphThreats = function () {
            loadGraph($scope.graphFrame1,optionsChartThreats_number,dataChartThreats_number);
            loadGraph($scope.graphFrame2,optionsChartThreats_risk,dataChartThreats_risk);
            document.getElementById("graphFrame1_title").textContent=gettextCatalog.getString('Number of threats for each threat type');
            document.getElementById("graphFrame2_title").textContent=gettextCatalog.getString('Maximum risk for each threat type');
        };

        $scope.selectGraphVulnerabilities = function () {
            loadGraph($scope.graphFrame1,optionsChartVulnerabilities_number,dataChartVulnes_number);
            loadGraph($scope.graphFrame2,optionsChartVulnerabilities_risk,dataChartVulnes_risk);
            document.getElementById("graphFrame1_title").textContent=gettextCatalog.getString('Vulnerabilities with the most occurences');
            document.getElementById("graphFrame2_title").textContent=gettextCatalog.getString('Vulnerabilities with the highest risk');
        };

        $scope.selectGraphCartography = function () {
            loadGraph($scope.graphFrame1,optionsChartActualRisks,dataChartThreats);
        };

        $scope.selectGraphDecisionSupport = function () {
            loadGraph($scope.graphFrame1,optionsChartActualRisks,dataChartThreats);
        };

        $scope.selectGraphPerspective = function () {
            loadGraph($scope.graphFrame1,optionsChartActualRisks,dataChartThreats);
        };

//==============================================================================

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

       optionsChartActualRisks = {
            chart: {
                type: 'multiBarChart',
                height: 850,
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
      // optionsChartResidualRisks : sert comme option pour le graphe résiduel

      optionsChartResidualRisks = {
           chart: {
               type: 'multiBarChart',
               height: 850,
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

     optionsChartThreats_number = {
          chart: {
              type: 'discreteBarChart',
              height: 800,
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

     optionsChartThreats_risk = {
          chart: {
              type: 'discreteBarChart',
              height: 800,
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

     optionsChartVulnerabilities_number = {
          chart : {
            type: "pieChart",
            height: 650,
            showLabels: true,
            labelType: "value",
            donut: true,
            donutRatio: 0.35,
            x: function(d){return d.x;},
            y: function(d){return d.y;},
          },
    };

    optionsChartVulnerabilities_risk = {
        chart: {
            type: 'discreteBarChart',
            height: 1000,
            margin : {
                top: 20,
                right: 20,
                bottom: 600,
                left: 45
            },
            dispatch: {
              renderEnd: function(e){
                d3AddButton('graphFrame1',exportAsPNG, ['graphFrame1','dataChartVulnes_number'] );
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
        dataChartVulnes_number = [];

        //Data for the graph for the vulnerabilities by vulnerabilities risk
        dataChartVulnes_risk = [
              {
                key: "Maximum risk for this vulnerability",
                values: []
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
                updateVulnerabilities_number(newValue);
                updateVulnerabilities_risk(newValue);
            }
        });

        $scope.$watch('clientCurrentAnr', function (newValue) {
            if (newValue) {
                $scope.dashboard.anr = newValue.id;
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

        function compareByMaxRisk(a,b) { //allows to sort an array of objects given a certain attribute
          if (a.max_risk > b.max_risk)
            return -1;
          if (a.max_risk < b.max_risk)
            return 1;
          return 0;
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
                  if(!findValueId(dataChartActualRisks[0].values,$scope._langField(risksList[i],'instanceName'))&&risksList[i].max_risk>-1)
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
                  else if (risksList[i].max_risk>-1 && risksList[i].max_risk<=treshold1)
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
                  if(!findValueId(dataChartResidualRisks[0].values,$scope._langField(risksList[i],'instanceName'))&&risksList[i].max_risk>-1)
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
              console.log(dataChartThreats_risk)
              for (var i=0; i<dataChartThreats_risk[0].values.length; i++)
              {
                dataChartThreats_risk[0].values[i].y=dataChartThreats_risk[0].values[i].max_risk;
              }
              console.log(dataChartThreats_risk)
              }
            );
        };

//==============================================================================

        /*
        * Update the chart of the number of the top 5 vulnerabilites by vulnerabilities type
        */
        var updateVulnerabilities_number = function (anrId) {
            $http.get("api/client-anr/" + anrId + "/risks-dashboard?limit=-1").then(function (data) {
              var dataTempChartVulnes_number = [];
              risksList = data.data.risks;
              for (var i=0; i < risksList.length ; ++i)
              {
                var eltvuln_number = new Object();
                if(!findValueId(dataTempChartVulnes_number,risksList[i].vulnLabel1)&&risksList[i].max_risk>-1)
                {
                  eltvuln_number.x = risksList[i].vulnLabel1;
                  eltvuln_number.y = 0;
                  dataTempChartVulnes_number.push(eltvuln_number);
                }
                addOneRisk(dataTempChartVulnes_number,risksList[i].vulnLabel1);
              }
              dataTempChartVulnes_number.sort(compareByNumber);
              if (dataTempChartVulnes_number.length>10)
              {
                for (var i=0; i < 10; ++i) //Only keeps first 5 elements of array
                {
                  dataChartVulnes_number.push(dataTempChartVulnes_number[i]);
                }
              }
            }
            );
        };

//==============================================================================

        /*
        * Update the chart of the number of the top 5 vulnerabilites by vulnerabilities type
        */
        var updateVulnerabilities_risk = function (anrId) {
            $http.get("api/client-anr/" + anrId + "/risks-dashboard?limit=-1").then(function (data) {
              var dataTempChartVulnes_risk = [];
              dataChartVulnes_risk[0].values = [];
              risksList = data.data.risks;
              for (var i=0; i < risksList.length ; ++i)
              {
                var eltvuln_number = new Object();
                if(!findValueId(dataTempChartVulnes_risk,risksList[i].vulnLabel1)&&risksList[i].max_risk>-1)
                {
                  // initialize element
                  eltvuln_number.id = risksList[i].vid; //keep the threatID as id
                  eltvuln_number.x = risksList[i].vulnLabel1;
                  eltvuln_number.y = 0;
                  eltvuln_number.max_risk = risksList[i].max_risk; //We can define max_risk for the vulnerability in the initialisation because objects in RisksList are ordered by max_risk
                  eltvuln_number.color = '#D66607';
                  dataTempChartVulnes_risk.push(eltvuln_number);
                }
                addOneRisk(dataTempChartVulnes_risk,risksList[i].vulnLabel1);
              }
              dataTempChartVulnes_risk.sort(compareByMaxRisk);
              if (dataTempChartVulnes_risk.length>10)
              {
                for (var i=0; i < 10; ++i) //Only keeps first 5 elements of array
                {
                  dataTempChartVulnes_risk[i].y=dataTempChartVulnes_risk[i].max_risk;
                  dataChartVulnes_risk[0].values.push(dataTempChartVulnes_risk[i]);
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

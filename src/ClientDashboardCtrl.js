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

//initialize options of the chart
        $scope.optionsCartoRisk = {
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
                   axisLabel: 'X Axis'
               },
               yAxis: {
                   axisLabel: 'Y Axis',
                   axisLabelDistance: -10
               }
           }
       };

       $scope.optionsChartRisks = {
            chart: {
                type: 'multiBarChart',
                height: 850,
                margin : {
                    top: 20,
                    right: 20,
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
                xAxis: {
                    axisLabel: 'Time (ms)',
                    showMaxMin: false,
                    rotateLabels : 90,
                    height : 150,
                    tickFormat: function(d){
                        return (d);
                    }
                },
                yAxis: {
                    axisLabel: 'Y Axis',
                    axisLabelDistance: -20,
                    tickFormat: function(d){
                        return d3.format(',.1f')(d);
                    }
                }
            }
        };

//initialize datas
       $scope.dataCartoRisk = [
                  {
                      key: "Risks",
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
        $scope.dataChartRisks = [
                         {
                             key: "lowRisks",
                             values: [

                             ]
                         },
                         {
                             key: "mediumRisks",
                             values: [

                             ]
                         },
                         {
                             key: "highRisks",
                             values: [

                             ]
                         }
                     ];

        // $scope.user = UserService.get();

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
                updateChartRisks(newValue);
            }
        });

        $scope.$watch('clientCurrentAnr', function (newValue) {
            if (newValue) {
                $scope.dashboard.anr = newValue.id;
            }
        });

        function findValueId(tab,value){
          for(i=0 ; i < tab.length ; i++)
            if(tab[i].id === value)
              return true;
          return false;
        }

        function addOneRisk(tab, value)
        {
          for(i=0 ; i < tab.length ; i++)
            if(tab[i].id === value)
              tab[i].y++;
        }
        var updateChartRisks = function (anrId) {
          //fetch data : TODO : fetch all risks (see ApiAnrRisksController.php)
          // TODO : make the function multinlingual
          // TODO : Finaly clean the code and create an api who send the information in the right format, maybe better ?
          // TODO : fetch the right value for the "seuil"
            $http.get("api/client-anr/" + anrId + "/risks").then(function (data) {
              risksList = data.data.risks;
              for (var i=0; i < risksList.length ; ++i)
              {
                var eltlow = new Object();
                var eltmed = new Object();
                var elthigh = new Object();
                  if(!findValueId($scope.dataChartRisks[0].values,risksList[i].instance)&&risksList[i].max_risk>-1)
                  {
                    // initialize element
                    eltlow.id = eltmed.id = elthigh.id = risksList[i].instance; //keep the instance id as id
                    eltlow.x = eltmed.x = elthigh.x = risksList[i].instanceName1;
                    eltlow.y = eltmed.y = elthigh.y = 0;
                    eltlow.color = '#D6F107';
                    $scope.dataChartRisks[0].values.push(eltlow);
                    eltmed.color = '#FFBC1C';
                    $scope.dataChartRisks[1].values.push(eltmed);
                    elthigh.color = '#FD661F';
                    $scope.dataChartRisks[2].values.push(elthigh);
                  }
                  if(risksList[i].max_risk>26)
                  {
                    addOneRisk($scope.dataChartRisks[2].values,risksList[i].instance);
                  }
                  else if (risksList[i].max_risk<27 && risksList[i].max_risk>8)
                  {
                    addOneRisk($scope.dataChartRisks[1].values,risksList[i].instance);
                  }
                  else if (risksList[i].max_risk>-1 && risksList[i].max_risk<9)
                  {
                    addOneRisk($scope.dataChartRisks[0].values,risksList[i].instance);
                  }
                }
              }
            );
        };

        var updateCartoRisks = function (anrId) {
            $http.get("api/client-anr/" + anrId + "/carto-risks").then(function (data) {
                $scope.dashboard.carto = data.data.carto;
                $scope.dashboard.carto.real.totalDistrib = 0;
                if ($scope.dashboard.carto.targeted) {
                    $scope.dashboard.carto.targeted.totalDistrib = 0;
                }
                //fill the chart
                  $scope.dataCartoRisk[0].values[0].label = gettextCatalog.getString('low risks');
                  $scope.dataCartoRisk[0].values[0].value = data.data.carto.real.distrib[0];
                  $scope.dataCartoRisk[0].values[1].label = gettextCatalog.getString('medium risks');
                  $scope.dataCartoRisk[0].values[1].value = data.data.carto.real.distrib[1];
                  $scope.dataCartoRisk[0].values[2].label = gettextCatalog.getString('high risks');
                  $scope.dataCartoRisk[0].values[2].value = data.data.carto.real.distrib[2];



                for (var i = 0; i < 3; ++i) {
                    if ($scope.dashboard.carto.real.distrib[i] && !isNaN($scope.dashboard.carto.real.distrib[i])) {
                        $scope.dashboard.carto.real.totalDistrib += $scope.dashboard.carto.real.distrib[i];
                    } else {
                        $scope.dashboard.carto.real.distrib[i] = 0;
                    }

                    if ($scope.dashboard.carto.targeted) {
                        if (!isNaN($scope.dashboard.carto.targeted.distrib[i])) {
                            $scope.dashboard.carto.targeted.totalDistrib += $scope.dashboard.carto.targeted.distrib[i];
                        } else {
                            $scope.dashboard.carto.targeted.distrib[i] = 0;
                        }
                    }
                }
            });
        };
    }

})();

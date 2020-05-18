(function () {

  angular
    .module('ClientApp')
    .factory('ChartService', ['VerticalBarChartService', 'HorizontalBarChartService', 'LineChartService',
                              'RadarChartService', ChartService]);

      function ChartService(VerticalBarChartService,HorizontalBarChartService,LineChartService,
                            RadarChartService){

        var verticalBarChart = function (tag, data, parameters){
          VerticalBarChartService.draw(tag, data, parameters);
        }
        var horizontalBarChart = function (tag, data, parameters){
          HorizontalBarChartService.draw(tag, data, parameters);
        }
        var lineChart = function (tag, data, parameters){
          LineChartService.draw(tag, data, parameters);
        }
        var radarChart = function (tag, data, parameters){
          RadarChartService.draw(tag, data, parameters);
        }


        return {
            verticalBarChart: verticalBarChart,
            horizontalBarChart: horizontalBarChart,
            lineChart: lineChart,
            radarChart: radarChart
        }

      }


})
();

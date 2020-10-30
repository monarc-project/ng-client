(function () {

  angular
    .module('ClientApp')
    .factory('ChartService', ['MultiVerticalBarChartService', 'VerticalBarChartService', 'MultiHorizontalBarChartService', 'HorizontalBarChartService', 'LineChartService',
                              'MultiLineChartService','RadarChartService', 'HeatmapChartService', 'MultiHeatmapChartService', 'DonutChartService', ChartService]);

      function ChartService(MultiVerticalBarChartService, VerticalBarChartService, MultiHorizontalBarChartService, HorizontalBarChartService,LineChartService,
                            MultiLineChartService, RadarChartService, HeatmapChartService, MultiHeatmapChartService, DonutChartService){

        var multiVerticalBarChart = function (tag, data, parameters){
          MultiVerticalBarChartService.draw(tag, data, parameters);
        }
        var verticalBarChart = function (tag, data, parameters){
          VerticalBarChartService.draw(tag, data, parameters);
        }
        var multiHorizontalBarChart = function (tag, data, parameters){
          MultiHorizontalBarChartService.draw(tag, data, parameters);
        }
        var horizontalBarChart = function (tag, data, parameters){
          HorizontalBarChartService.draw(tag, data, parameters);
        }
        var lineChart = function (tag, data, parameters){
          LineChartService.draw(tag, data, parameters);
        }
        var multiLineChart = function (tag, data, parameters){
          MultiLineChartService.draw(tag, data, parameters);
        }
        var radarChart = function (tag, data, parameters){
          RadarChartService.draw(tag, data, parameters);
        }
        var heatmapChart = function (tag, data, parameters){
          HeatmapChartService.draw(tag, data, parameters);
        }
        var multiHeatmapChart = function (tag, data, parameters){
          MultiHeatmapChartService.draw(tag, data, parameters);
        }
        var donutChart = function (tag, data, parameters){
          DonutChartService.draw(tag, data, parameters);
        }


        return {
            multiVerticalBarChart: multiVerticalBarChart,
            verticalBarChart: verticalBarChart,
            multiHorizontalBarChart: multiHorizontalBarChart,
            horizontalBarChart: horizontalBarChart,
            lineChart: lineChart,
            multiLineChart: multiLineChart,
            radarChart: radarChart,
            heatmapChart: heatmapChart,
            multiHeatmapChart: multiHeatmapChart,
            donutChart: donutChart
        }

      }


})
();

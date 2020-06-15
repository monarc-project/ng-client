(function () {

  angular
    .module('ClientApp')
    .factory('DonutChartService', ['gettextCatalog', function (gettextCatalog){

      /*
      * Generate a donut Chart
      * @param tag : string  : tag where to put the svg
      * @param data : JSON  : The data for the graph
      * @param parameters : margin : {top: 20, right: 20, bottom: 30, left: 40}
      *                     width : int : width of the graph
      *                     barColor : array : colors pallete of series
      *
      */

      function draw(tag, data, parameters){
        options = {
          margin : {top: 15, right: 15, bottom: 30, left: 40},
          width : 400,
          height : 300,
          barColor : ["#D6F107","#FFBC1C","#FD661F"],
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin,
            width = options.width - margin.left - margin.right,
            height = options.height - margin.top - margin.bottom;

        d3.select(tag).select("svg").remove();

        var svg = d3.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", width + margin.top + margin.bottom)
            .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);



      }
      return {
          draw: draw
      }
    }]);

})
();

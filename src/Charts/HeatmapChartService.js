(function () {

  angular
    .module('ClientApp')
    .factory('HeatmapChartService', ['gettextCatalog', function (gettextCatalog){

      /*
      * Generate a grouped/stacked Vertical Bar Chart
      * @param tag : string  : tag where to put the svg
      * @param data : JSON  : The data for the graph
      * @param parameters : margin : {top: 20, right: 20, bottom: 30, left: 40}
      *                     width : int : width of the graph
      *                     barColor : array : colors pallete of series
      *
      */

      function draw(tag, data, parameters){
        options = {
          margin : {top: 15, right: 100, bottom: 30, left: 40},
          width : 400,
          height : 300,
          barColor : ["#D6F107","#FFBC1C","#FD661F"],
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin,
            width = options.width - margin.left - margin.right,
            height = options.height - margin.top - margin.bottom;

        var myGroups = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]
        var myVars = ["v1", "v2", "v3", "v4", "v5", "v6", "v7", "v8", "v9", "v10"]

        d3.select(tag).select("svg").remove();

        var svg = d3.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", width + margin.top + margin.bottom)
            .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

        var x = d3.scale.ordinal()
          .rangeRoundBands([ 0, width ], .1)
          .domain(myGroups)

        var y = d3.scale.ordinal()
          .rangeRoundBands([ height, 0 ], .1)
          .domain(myVars)

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickSize(-height, 0, 0);

        var yAxis = d3.svg.axis()
            .scale(y)
            .orient("left");

        svg.append("g")
          .attr("transform", "translate(0," + height + ")")
          .call(xAxis)

          svg.append("g")
          .call(yAxis)
          .select(".domain").remove();

        // Build color scale
        var myColor = d3.scale.linear()
          .range(["white", "#69b3a2"])
          .domain([1,100])

        //Read the data
        d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/heatmap_data.csv", function(data) {
          svg.selectAll()
              .data(data, function(d) {return d.group+':'+d.variable;})
              .enter()
              .append("rect")
              .attr("x", function(d) { return x(d.group) })
              .attr("y", function(d) { return y(d.variable) })
              .attr("width", x.rangeBand() )
              .attr("height", y.rangeBand() )
              .style("fill", function(d) { return myColor(d.value)} )
        })
      }
      return {
          draw: draw
      }
    }]);

})
();

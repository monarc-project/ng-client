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
      *                     color : array : colors pallete of series
      *
      */

      function draw(tag, data, parameters){
        options = {
          margin : {top: 50, right: 50, bottom: 30, left: 40},
          width : 350,
          color : ["#D6F107","#FFBC1C","#FD661F"],
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin,
            width = options.width - margin.left - margin.right

        var myGroups = ["A", "B", "C", "D", "E","F", "G", "H", "I", "J","K"]
        var myVars = ["v1", "v2", "v3", "v4", "v5", "v6"]//, "v7", "v8", "v9", "v10"]

        var gridSize = width / myGroups.length;
        var height = gridSize * myVars.length;

        d3v5.select(tag).select("svg").remove();

        var svg = d3v5.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

        var x = d3v5.scaleBand()
          .range([0,width])
          .domain(myGroups)

        var y = d3v5.scaleBand()
          .range([0,height])
          .domain(myVars)

        var xAxis = d3v5.axisTop(x)
          .tickSize(0)

        var yAxis = d3v5.axisLeft(y)
          .tickSize(0)

        var color = d3v5.scaleLinear()
          .range(options.color)
          .domain([1,100])

        svg.append("g")
          .attr("transform", "translate(0,0)")
          .call(xAxis)
          .select(".domain").remove();

        svg.append("g")
          .call(yAxis)
          .select(".domain").remove();

        //Read the data
        d3v5.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/heatmap_data.csv")
         .then(function(data) {
          svg.selectAll()
              .data(data, function(d) {return d.group+':'+d.variable;})
              .enter()
              .append("rect")
              .attr("x", function(d) { return x(d.group) })
              .attr("y", function(d) { return y(d.variable) })
              .attr("width", gridSize)
              .attr("height",gridSize)
              .attr("stroke", "white")
              .attr("stroke-opacity", 1)
              .attr("stroke-width", 1)
              .style("fill", function(d) { return color(d.value)} )
        })
      }
      return {
          draw: draw
      }
    }]);

})
();

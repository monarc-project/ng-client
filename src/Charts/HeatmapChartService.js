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
      *                     xLabel : string : x axis label
      *                     yLabel : string : y axis label
      *
      */

      function draw(tag, data, parameters){
        options = {
          margin : {top: 50, right: 50, bottom: 30, left: 40},
          width : 500,
          color : ["#D6F107","#FFBC1C","#FD661F"],
          xLabel : null,
          yLabel : null
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin,
            width = options.width - margin.left - margin.right

        var xTicks = [...new Set(data.map(d => d.x))];
        var yTicks = [...new Set(data.map(d => d.y))];

        var maxValue = d3v5.max(data.map(d => d.value));

        var gridSize = width / xTicks.length;
        var height = gridSize * yTicks.length;

        d3v5.select(tag).select("svg").remove();

        var svg = d3v5.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .style("user-select","none")
            .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

        var x = d3v5.scaleBand()
          .range([0,width])
          .domain(xTicks)

        var y = d3v5.scaleBand()
          .range([0,height])
          .domain(yTicks)

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

        if (options.xLabel) {
          svg.append("text")
            .attr("x", width/2)
            .attr("dy","-2em")
            .attr("font-size",10)
            .style("text-anchor", "middle")
            .text(options.xLabel);
        }

        svg.append("g")
          .call(yAxis)
          .select(".domain").remove();

        if (options.yLabel) {
          svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height + margin.bottom)/2)
            .attr("dy","-2em")
            .attr("dx","2em")
            .attr("font-size",10)
            .style("text-anchor", "middle")
            .text(options.yLabel);
        }

        var cell = svg.selectAll('cell')
            .data(data)
            .enter().append('g')

        cell.append("rect")
          .attr("x", d => { return x(d.x) })
          .attr("y", d => { return y(d.y) })
          .attr("width", gridSize)
          .attr("height",gridSize)
          .attr("stroke", "white")
          .attr("stroke-opacity", 1)
          .attr("stroke-width", 1)
          .style("fill", d => d.color)
          .style("fill-opacity", d => { return 0.4 + (0.6 * d.value / maxValue)})

        cell.append("text")
          .attr("transform", d => { return `translate(${x(d.x)},${y(d.y)})`})
          .attr("x", gridSize/2)
          .attr("y", gridSize/2)
          .attr("font-size",10)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .text(d => d.value);
      }
      return {
          draw: draw
      }
    }]);

})
();

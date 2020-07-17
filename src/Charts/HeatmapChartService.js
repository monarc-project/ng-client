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
      *                     color : array : transition between colors
*                           threshold : array : threshold values related to color array
      *                     xLabel : string : x axis label
      *                     yLabel : string : y axis label
      *
      */

      function draw(tag, data, parameters){
        var options = {
          margin : {top: 50, right: 50, bottom: 30, left: 40},
          width : 500,
          color : d3.schemeCategory10,
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin,
            width = options.width - margin.left - margin.right

        var xTicks = [...new Set(data.map(d => d.x))];
        var yTicks = [...new Set(data.map(d => d.y))];

        var maxValue = d3.max(data.map(d => d.value));

        var gridSize = width / xTicks.length;
        var height = gridSize * yTicks.length;

        d3.select(tag).select("svg").remove();

        var svg = d3.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .style("user-select","none")
            .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

        if (maxValue == undefined) {
          svg.append('text')
            .attr("x", (width / 2))
            .attr("y", (height / 2))
            .style("text-anchor", "middle")
            .style("font-size", 20)
            .style("font-weight", "bold")
            .text(gettextCatalog.getString('No Data Avalaible'))
          return;
        }

        var x = d3.scaleBand()
          .range([0,width])
          .domain(xTicks)

        var y = d3.scaleBand()
          .range([0,height])
          .domain(yTicks)

        var xAxis = d3.axisTop(x)
          .tickSize(0)

        var yAxis = d3.axisLeft(y)
          .tickSize(0)

        if (options.threshold) {
          var  color = d3.scaleThreshold()
              .domain(options.threshold.map(d => d + 1))
              .range(options.color)
        }else {
          var color = d3.scaleLinear()
              .domain(d3.extent(data.map(d => d.value)))
              .range(options.color)
        }

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
          .style("fill", d => {
            if (options.threshold) {
              return color(d.x * d.y);
            }else {
              return color(d.value);
            }
          })
          .style("fill-opacity", d => {
            if (options.threshold) {
              return 0.4 + (0.6 * d.value / maxValue);
            }else {
              return 1;
            }
          })

        cell.append("text")
          .attr("transform", d => { return `translate(${x(d.x)},${y(d.y)})`})
          .attr("x", gridSize/2)
          .attr("y", gridSize/2)
          .attr("font-size",10)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .text(d => d.value);

        if(options.onClickFunction){
          var filter = svg.append("defs").append("filter")
              .attr("id", "drop-shadow")
              .attr("height", "120%");

          filter.append("feGaussianBlur")
              .attr("in", "SourceAlpha")
              .attr("stdDeviation", 5)
              .attr("result", "blur");

          filter.append("feOffset")
              .attr("in", "blur")
              .attr("dx", 5)
              .attr("dy", 5)
              .attr("result", "offsetBlur");

          var feMerge = filter.append("feMerge");

          feMerge.append("feMergeNode")
              .attr("in", "offsetBlur")
          feMerge.append("feMergeNode")
              .attr("in", "SourceGraphic");

          cell
            .on("click", options.onClickFunction)
            .on("mouseover", function(d){
              if (d.value) {
                d3.select(this)
                .style("cursor", "pointer")
                .style("filter", "url(#drop-shadow)")
                .attr("transform", "translate(-1,-1)")
                .select('rect').style("fill-opacity",1)
              }
            })
            .on("mouseleave", function(d){
              if (d.value) {
                d3.select(this)
                  .style("filter", "none")
                  .attr("transform", "translate(0,0)")
                  .select('rect').style("fill-opacity", d => {
                    if (options.threshold) {
                      return 0.4 + (0.6 * d.value / maxValue);
                    }else {
                      return 1;
                    }
                  });
              }
            });
        }
      }
      return {
          draw: draw
      }
    }]);

})
();

(function () {

  angular
    .module('ClientApp')
    .factory('MultiLineChartService', ['gettextCatalog', function (gettextCatalog){

      /*
      * Generate a multiLineChart
      * @param tag : string  : tag where to put the svg
      * @param data : JSON  : The data for the graph
      * @param parameters : margin : {top: 20, right: 20, bottom: 30, left: 40}
      *                     width : int : width of the graph
      *                     height : int of the graph
      *                     color : array of string : set of Color to draw the line
      *                     nameValue : string, define key to set as value
      *
      */
      function draw(tag, data, parameters){
        var options = {
          margin : {top: 30, right: 50, bottom: 30, left: 40},
          width : 400,
          height : 300,
          color : d3.interpolateTurbo,
          nameValue : 'value'
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin;
            width = options.width - margin.left - margin.right,
            height = options.height - margin.top - margin.bottom;

        var x = d3.scaleTime();

        var y = d3.scaleLinear();

        var xAxis = d3.axisBottom(x)
              .ticks(4)

        var yAxis = d3.axisLeft(y)
              .ticks(3)

        var parseDate = d3.timeParse("%Y-%m-%d");

        var line = d3.line()
              .defined(function(d) { return !isNaN(d[options.nameValue]); })
              .curve(d3.curveMonotoneX)
              .x(function(d) { return x(parseDate(d.date)); })
              .y(function(d) { return y(d[options.nameValue]); });

        d3.select(tag).selectAll("svg").remove();

        if (data.length === 0) {
          var svg = d3.select(tag).append("svg")
                .attr("width", 4 * width)
                .attr("height", 3 * height)
                .style("user-select","none")

          svg.append('text')
            .attr("x", (2 * width))
            .attr("y", (height))
            .style("text-anchor", "middle")
            .style("font-size", 20)
            .style("font-weight", "bold")
            .text(gettextCatalog.getString('No Data Avalaible'))
          return;
        }

        var svg = d3.select(tag)
              .selectAll("lineChart")
              .data(data)
              .enter()
            .append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .style("user-select","none")
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


        if(options.onClickFunction){
          svg
            .on("click", options.onClickFunction);
        }

        var allDates = data.flatMap(
                          cat=>cat.series.flatMap(
                              d=>d.date
                          )
                        )

        if (options.forceMaxY) {
          var maxY = options.forceMaxY;
        }else{
          var allValues = data.flatMap(
                            cat=>cat.series.flatMap(
                                  d=>d[options.nameValue]
                              )
                            )

          var maxY = d3.max(allValues);
        }

        var setDates = [...new Set(allDates)];
        var rangeX = setDates.map(date=>parseDate(date)).sort((a,b) => a - b);
        var allSeries = data.map(d => d.category);

        var color =  d3.scaleSequential(options.color)
                          .domain([0,allSeries.length]);

        y.domain([0,maxY])
          .range([height, 0]);

        x.domain(d3.extent(rangeX))
          .range([0, width]);

        svg.append("g")
           .attr("class", "xAxis")
           .attr("transform", `translate(0,${height})`)
           .call(xAxis);

        svg.append("g")
           .attr("class", "yAxis")
           .call(yAxis);

       svg.append("path")
          .attr("class", "line")
          .attr("fill","none")
          .attr("stroke",(d,i) => color(i))
          .attr("stroke-width", 2)
          .attr("d", d => line(d.series));

       svg.append("text")
          .attr("x", (width / 2))
          .attr('class',"chartTitle")
          .attr("y", - margin.top)
          .attr("text-anchor", "middle")
          .style("font-size", "10px")
          .style("text-decoration", "underline")
          .text((d) => d.category)
          .on('mouseover', function() {
              d3.select(this)
                .style("cursor", "pointer")
                .style("font-weight", "bold")
                .style("fill", "#006FBA");
          })
          .on('mouseout', function() {
            d3.select(this)
            .style("cursor", "text")
            .style("font-weight", "normal")
            .style("fill", "rgba(0,0,0,0.87)");

          })
          .call(wrap, width);

      function wrap(text, width) {
        text.each(function() {
          var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1,
            x = text.attr("x"),
            y = 15 - margin.top,
            dy = .2,
            tspan = text.text(null)
            .append("tspan")
            .attr("x", x)
            .attr("y", y)
            .attr("dy", dy + "em");
          while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width - 30) {
              line.pop();
              tspan.text(line.join(" "));
              line = [word];
              tspan = text.append("tspan")
                .attr("x", x)
                .attr("y", y)
                .attr("dy", ++lineNumber * lineHeight + dy + "em")
                .text(word);
            }
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

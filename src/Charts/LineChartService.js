(function () {

  angular
    .module('ClientApp')
    .factory('LineChartService', ['gettextCatalog', function (gettextCatalog){

      /**
      * Generate a Line Chart
      * @param {string} tag - tag where to put the svg
      * @param {object} data - The data for the graph
      * @param {object} parameters - options of chart
      *        {object}   margin - top: 20, right: 20, bottom: 30, left: 40
      *        {int}      width - width of the graph
      *        {int}      height - height of the graph
      *        {array}    color - colors pallete of series
      *        {int}      legendSize - width of the graph for the legend
      *        {string}   externalFilter - class of external filter prefixed by a point
      *        {boolean}  isZoomable - enable to zoom in the graph
      *        {boolean}  zoomYAxis - enable zoom on y axis
      *        {boolean}  drawCircles - draw circles on the line
      *        {string}   nameValue - define key to set as value
      *        {int}      xTicks - number of ticks on x axis
      *        {int}      yTicks - number of ticks on y axis
      * @return {svg} chart svg
      */

      function draw(tag, data, parameters){
        var options = {
          margin : {top: 30, right: 50, bottom: 30, left: 40},
          width : 400,
          height : 300,
          color : d3.interpolateTurbo,
          legendSize : 250,
          isZoomable : true,
          zoomYAxis: false,
          drawCircles : true,
          nameValue : 'value',
          xTicks: null,
          yTicks: null
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin;
            width = options.width - margin.left - margin.right - options.legendSize;
            height = options.height - margin.top - margin.bottom;

        var x = d3.scaleTime();

        var y = d3.scaleLinear();

        var xAxis = d3.axisBottom(x)
              .ticks(options.xTicks)

        var yAxis = d3.axisLeft(y)
              .ticks(options.yTicks)

        var parseDate = d3.timeParse("%Y-%m-%d");

        var line = d3.line()
              .defined(function(d) { return !isNaN(d[options.nameValue]); })
              .curve(d3.curveMonotoneX)
              .x(function(d) { return x(parseDate(d.date)); })
              .y(function(d) { return y(d[options.nameValue]); });

        var zoom = d3.zoom()
              .scaleExtent([.5, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
              .translateExtent([[0, 0], [width, height]])
              .extent([[0, 0], [width, height]])
              .on("zoom", zoomed);

        d3.select(tag).selectAll("svg").remove();
        d3.selectAll(".tooltip" + tag.substring(1)).remove();

        var svg = d3.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right + options.legendSize)
              .attr("height", height + margin.top + margin.bottom)
              .style("user-select","none")
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //tooltip to show on the circle if they are displayed
        var tooltip = d3.select("body").append("div")
              .attr("class", "tooltip" + tag.substring(1))
              .style("opacity", 0)
              .style("position", "absolute")
              .style("background-color", "white")
              .style("color","rgba(0,0,0,0.87)")
              .style("border", "solid black")
              .style("border-width", "1px")
              .style("border-radius", "5px")
              .style("padding", "5px")
              .style("font-size", "10px");

        if (data.length === 0) {
          svg.append('text')
            .attr("x", (width / 2))
            .attr("y", (height / 2))
            .style("text-anchor", "middle")
            .style("font-size", 20)
            .style("font-weight", "bold")
            .text(gettextCatalog.getString('No Data Avalaible'))
          return;
        }

        svg.append("defs") // in case we needs to restrict the area of drawing
            .append("clipPath")
              .attr("id", `clip${tag}`)
            .append("rect")
              .attr("x", 0)
              .attr("y", -5)
              .attr("width", width + 5)
              .attr("height", height + 5);

        if(options.isZoomable){ //draw a zone which get the mouse interaction
          svg.append("rect")
              .attr("width", width)
              .attr("height", height)
              .style("fill", "none")
              .style("pointer-events", "all")
              .call(zoom);
        }

        data.map(function(cat){
          cat.series.forEach(function(d,i){
            if (d.translationLabelKey == undefined) {
              d.translationLabelKey = cat.category;
            }
            d.category = gettextCatalog.getString(d.translationLabelKey);
            d.root = cat.category;
          })
        });

        var allDates = data.flatMap(
                          cat=>cat.series.flatMap(
                            subCat=>subCat.series.flatMap(
                              d=>d.date
                            )
                          )
                        )

        if (options.forceMaxY) {
          var maxY = options.forceMaxY;
        }else{
          var allValues = data.flatMap(
                            cat=>cat.series.flatMap(
                                subCat=>subCat.series.flatMap(
                                  d=>d[options.nameValue]
                                )
                              )
                            )

          var maxY = d3.max(allValues);

        }

        var setDates = [...new Set(allDates)];
        var rangeX = setDates.map(date=>parseDate(date)).sort((a,b) => a - b);
        var allSeries = data.flatMap(d => d.series);
        allSeries.forEach((d,i) => d.index=i)

        if (!options.externalFilter) {
          var color = d3.scaleOrdinal()
              .range(["#FD661F","#FFBC1C","#D6F107"]);
        }else{
          var color = d3.scaleSequential(options.color)
                            .domain([0,allSeries.length]);
        }

        y.domain([0,maxY]).nice()
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

        if (options.title) {
         svg.append("text")
            .attr("x", (width / 2))
            .attr('class',"chartTitle")
            .attr("y", 0 - margin.top)
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("text-decoration", "underline")
            .text(options.title)
            .call(wrap,width);
        }

        var categories = svg.selectAll('.category')
              .data(allSeries)
            .enter().append('g')
              .attr("class", (d) => 'category ' + d.category.replace(/\s/g, ''))
              .attr("index", (d,i)=>i);

        categories.append("path")
              .attr("class", "line")
              .attr("clip-path", `url(#clip${tag})`)
              .attr("fill","none")
              .attr("stroke",(d,i) => color(i))
              .attr("stroke-width", 2)
              .attr("d", d => line(d.series));

        if (options.drawCircles) {
          categories.selectAll('points')
            .data(d => d.series)
            .enter().append("circle")
             .attr("class", "point")
             .attr("cx", d => x(parseDate(d.date)))
             .attr("cy", d => y(d[options.nameValue]))
             .attr("clip-path", `url(#clip${tag})`)
             .attr("r", 4)
             .attr("fill", function(){
               let i = this.parentNode.getAttribute("index");
               return color(i);
             })
            .on("mouseover", function(d) {
               var startX = d3.event.pageX;
               var startY = d3.event.pageY;
               tooltip
                .transition()
                .style("z-index", "100")
                .style("opacity", .9)
                .duration(100);

               tooltip
                .html('Date : ' + new Date(d.date).toDateString() +
                      "<br/>"   +
                      'Value : '+ d[options.nameValue])
                .style("left", (startX) + "px")
                .style("top", (startY) + "px");
            })
            .on("mouseout", function() {
               tooltip
                 .transition()
                 .duration(500)
                 .style("z-index", "-100")
                 .style("opacity", 0);
            });
        }

        var dataLength = 0;
        var legend = svg.selectAll(".legend")
              .data(allSeries)
            .enter().append('g')
              .attr("class", "legend")
              .attr("index", d => d.index)
              .attr("transform", (d,i) => {
                let label = options.externalFilter ? d.root : d.category;
                if (options.positionLegend == "top") {
                  let textLength = getWidth(label);
                  if (i == 0) {
                    dataLength = textLength + 30;
                    return `translate(0,-40)`;
                  } else {
                    let preDataLength = dataLength;
                    dataLength += textLength + 30;
                    return `translate(${preDataLength},${-40})`;
                  }
                }else{
                  return `translate(0,${i * 20})`;
                }
              })

        legend.append("rect")
              .attr("x", () => {
                if (options.positionLegend == "top") {
                  return width - dataLength;
                }else {
                  return width + 20;
                }
              })
              .attr("width", 18)
              .attr("height", 18)
              .style("fill", (d,i) => {
                if(options.externalFilter) {
                  return color(i);
                }else {
                  return color(d.index);
                }
              })
              .style("stroke", (d,i) => {
                if(options.externalFilter) {
                  return color(i);
                }else {
                  return color(d.index);
                }
              })
              .attr("index", d => d.index)
              .on('click', function(d,i){ updateChart(this,i) });

        legend.append("text")
              .attr("x",() => {
                if (options.positionLegend == "top") {
                  return width - dataLength + 25;
                }else {
                  return width + 45;
                }
              })
              .attr("y", 9)
              .attr("dy", ".35em")
              .style("font-size",10)
              .text(d => {
                let label = options.externalFilter ? d.root : d.category;
                if (options.positionLegend == "top") {
                  return  label;
                }else{
                  let ratioCharPixels = Math.round(options.legendSize/6.5);
                  if (label.length > ratioCharPixels) {
                    return label.substring(0, ratioCharPixels) +' ...';
                  }else{
                    return label;
                  }
                }
              });

        function updateChart(d,i) {
          let indexCategory = d.getAttribute("index");

          var selected = svg.selectAll('.category')
          .filter(function(){
            return this.getAttribute("index") == indexCategory}
          )
          if (selected.style("visibility") == "visible") {
            selected.style("visibility","hidden");
            d3.select(d).style('fill','white');
          }else{
            selected.style("visibility","visible");
            d3.select(d).style('fill', function(){
              if(options.externalFilter) {
                    return color(i);
                  }else {
                    return color(indexCategory);
                  }
            })
          }
        }

        function zoomed() { //make the modification of zooming

          xZommed = d3.event.transform.rescaleX(x);

          svg.select(".xAxis")
            .call(xAxis.scale(xZommed));


          line.x(function(d) { return xZommed(parseDate(d.date)); })

          if (options.zoomYAxis) {
            yZommed = d3.event.transform.rescaleY(y);

            svg.select(".yAxis")
              .call(yAxis.scale(yZommed));

            line.y(function(d) { return yZommed(d[options.nameValue]); })

            svg.selectAll('.point')
              .attr('cx', function(d) { return xZommed(parseDate(d.date)); })
              .attr("cy", function (d) { return yZommed(d[options.nameValue]); })
          }

          svg.selectAll('.point')
            .attr('cx', function(d) { return xZommed(parseDate(d.date)); })

          svg.selectAll('.line')
              .attr('d', function(d) {return line(d.series)});
        }

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

        function getWidth(text) {
          var canvas = document.createElement('canvas'),
          context = canvas.getContext('2d');
          context.font = '10px Helvetica';
          return context.measureText(text).width;
        }
      }

      return {
          draw: draw
      }
    }]);

})
();

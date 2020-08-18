(function () {

  angular
    .module('ClientApp')
    .factory('LineChartService', function (){

      /*
      * Generate a lineChart
      * @param tag : string  : tag where to put the svg
      * @param data : JSON  : The data for the graph
      * @param parameters : margin : {top: 20, right: 20, bottom: 30, left: 40}
      *                     width : int : width of the graph
      *                     height : int of the graph
      *                     color : array of string : set of Color to draw the line
      *                     legendSize : int : width of the graph for the legend
      *                     externalFilter : boolean, enable external filter
      *                     isZoomable : boolean, enable to zoom in the graph or not
      *                     zoomYAxis: boolean, enable zoom on Y axis
      *                     drawCircles : boolean, draw circl on the line
      *                     nameValue : string, define key to set as value
      *
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
          nameValue : 'value'
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin;
            width = options.width - margin.left - margin.right - options.legendSize,
            height = options.height - margin.top - margin.bottom;

        var x = d3.scaleTime();

        var y = d3.scaleLinear();

        var xAxis = d3.axisBottom(x)

        var yAxis = d3.axisLeft(y)

        var parseDate = d3.timeParse("%Y-%m-%d");

        var line = d3.line()
              .defined(function(d) { return !isNaN(d[options.nameValue]); })
              .curve(d3.curveMonotoneX)
              .x(function(d) { return x(parseDate(d.label)); })
              .y(function(d) { return y(d[options.nameValue]); });

        var zoom = d3.zoom()
              .scaleExtent([.5, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
              .translateExtent([[0, 0], [width, height]])
              .extent([[0, 0], [width, height]])
              .on("zoom", zoomed);

        d3.select(tag).selectAll("svg").remove();

        var svg = d3.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right + options.legendSize)
              .attr("height", height + margin.top + margin.bottom)
              .style("user-select","none")
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //tooltip to show on the circle if they are displayed
        var tooltip = d3.select("body").append("div")
              .style("opacity", 0)
              .style("position", "absolute")
              .style("background-color", "white")
              .style("color","rgba(0,0,0,0.87)")
              .style("border", "solid black")
              .style("border-width", "1px")
              .style("border-radius", "5px")
              .style("padding", "5px")
              .style("font-size", "10px");

        svg.append("defs") // in case we needs to restrict the area of drawing
            .append("clipPath")
              .attr("id","clip")
            .append("rect")
              .attr("x", 0)
              .attr("y", -10)
              .attr("width", width + 5)
              .attr("height", height);

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
            d.root = cat.category;
          })
        });

        var allDates = data.flatMap(
                          cat=>cat.series.flatMap(
                            subCat=>subCat.series.flatMap(
                              d=>d.label
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

        // var random = d3.randomUniform(maxY);
        // data.flatMap(cat=>cat.series.flatMap(subCat=>subCat.series.flatMap(
        //   d=>d[options.nameValue] = random()
        // )));

        var setDates = [...new Set(allDates)];
        var rangeX = setDates.map(date=>parseDate(date)).sort((a,b) => a - b);
        var allSeries = data.flatMap(d => d.series);
        allSeries.forEach((d,i) => d.index=i)

        var color =  d3.scaleSequential(options.color)
                          .domain([0,allSeries.length]);

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
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("text-decoration", "underline")
            .text(options.title);
        }

        var categories = svg.selectAll('.category')
              .data(allSeries)
            .enter().append('g')
              .attr("class", (d) => 'category ' + d.category.replace(/\s/g, ''))
              .attr("index", (d,i)=>i);

        categories.append("path")
              .attr("class", "line")
              .attr("clip-path", "url(#clip)")
              .attr("fill","none")
              .attr("stroke",(d,i) => color(i))
              .attr("stroke-width", 2)
              .attr("d", d => line(d.series));

        if (options.drawCircles) {
          categories.selectAll('points')
            .data(d => d.series)
            .enter().append("circle")
             .attr("class", "point")
             .attr("cx", d => x(parseDate(d.label)))
             .attr("cy", d => y(d[options.nameValue]))
             .attr("clip-path", "url(#clip)")
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
                .html('Date : ' + new Date(d.label).toDateString() +
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

        var legend = svg.selectAll(".legend")
              .data(allSeries)
            .enter().append('g')
              .attr("class", "legend")
              .attr("index", d => d.index)
              .attr("transform", (d,i) => `translate(${margin.right},${i * 20})`)

        legend.append("rect")
              .attr("x", width - 40)
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
              .attr("x", width - 15)
              .attr("y", 12)
              .attr("height",30)
              .attr("width",100)
              .text(d => {
                if(options.externalFilter){
                  return d.root;
                }else{
                  return d.category;
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


          line.x(function(d) { return xZommed(parseDate(d.label)); })

          if (options.zoomYAxis) {
            yZommed = d3.event.transform.rescaleY(y);

            svg.select(".yAxis")
              .call(yAxis.scale(yZommed));

            line.y(function(d) { return yZommed(d[options.nameValue]); })

            svg.selectAll('.point')
              .attr('cx', function(d) { return xZommed(parseDate(d.label)); })
              .attr("cy", function (d) { return yZommed(d[options.nameValue]); })
          }

          svg.selectAll('.point')
            .attr('cx', function(d) { return xZommed(parseDate(d.label)); })

          svg.selectAll('.line')
              .attr('d', function(d) {return line(d.series)});
        }
      }

      return {
          draw: draw
      }
    });

})
();

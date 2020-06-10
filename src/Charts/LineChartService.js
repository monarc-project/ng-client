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
      *                     lineColor : array of string : set of Color to draw the line
      *                     legendSize : int : width of the graph for the legend
      *                     externalFilterSubCateg : string of the class of the filter to fetch with d3
      *                     isZoomable : boolean, enable to zoom in the graph or not
      *                     drawCircles : boolean, is drawCircles draw circl on the line
      *
      */
      function draw(tag, data, parameters){
        options = {
          margin : {top: 30, right: 50, bottom: 30, left: 40},
          width : 400,
          height : 300,
          lineColor : ["#D6F107","#FFBC1C","#FD661F"],
          legendSize : 250,
          externalFilterSubCateg : null,
          isZoomable : true,
          drawCircles : true,
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin;
            width = options.width - margin.left - margin.right - options.legendSize,
            height = options.height - margin.top - margin.bottom;

        var x = d3v5.scaleTime();

        var y = d3v5.scaleLinear();

        var xAxis = d3v5.axisBottom(x)

        var yAxis = d3v5.axisLeft(y)

        var parseDate = d3v5.timeParse("%Y-%m-%d");

        var color = d3v5.scaleOrdinal(d3v5.schemeCategory10);

        var line = d3v5.line()
              .defined(function(d) { return !isNaN(d.value); })
              .curve(d3v5.curveLinear)
              .x(function(d) { return x(parseDate(d.label)); })
              .y(function(d) { return y(d.value); });

        var zoom = d3v5.zoom() //define a zoom
              .scaleExtent([.5, 20])  // This control how much you can unzoom (x0.5) and zoom (x20)
              .translateExtent([[0, 0], [width, height]])
              .extent([[0, 0], [width, height]])
              .on("zoom", zoomed);

        d3v5.select(tag).select("svg").remove();

        var svg = d3v5.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right + options.legendSize)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        //tooltip to show on the circle if they are displayed
        var tooltip = d3v5.select("body").append("div")
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
              .attr("y", 0)
              .attr("width", width)
              .attr("height", height);

        if(options.isZoomable){ //draw a zone which get the mouse interaction
          svg.append("rect")
              .attr("width", width)
              .attr("height", height)
              .style("fill", "none")
              .style("pointer-events", "all")
              .call(zoom);
        }

        var allValues = data.flatMap(
                          cat=>cat.series.flatMap(
                            subCat=>subCat.series.flatMap(
                              d=>d.value
                            )
                          )
                        )
        var allDates = data.flatMap(
                          cat=>cat.series.flatMap(
                            subCat=>subCat.series.flatMap(
                              d=>d.label
                            )
                          )
                        )

        var maxY = d3.max(allValues); // the max for Y axis
        var setDates = [...new Set(allDates)];
        var rangeX = setDates.map(date=>parseDate(date)).sort((a,b) => a - b); // the date range for X axis
        var allSeries = data.flatMap(d => d.series);

        y.domain([0,maxY]).nice()
          .range([height, 0]);

        x.domain(d3v5.extent(rangeX))
          .range([0, width]);

        svg.append("g")
           .attr("class", "xAxis")
           .attr("transform", `translate(0,${height})`)
           .call(xAxis);

        svg.append("g")
           .attr("class", "yAxis")
           .call(yAxis);

        var categories = svg.selectAll('.category')
              .data(allSeries)
            .enter().append('g')
              .attr("class", 'category')
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
             .attr("cy", d => y(d.value))
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
                      'Value : '+ d.value)
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
              .attr("index", (d,i) => i)
              .attr("transform", (d,i) => `translate(${margin.right},${i * 20})`)

        legend.append("rect")
              .attr("x", width - 40)
              .attr("width", 18)
              .attr("height", 18)
              .style("fill", (d,i) => color(i))
              .style("stroke", (d,i) => color(i))
              .attr("index",(d,i) =>  i)
              .on('click', function(){ legendOnClick(this) });

        legend.append("text")
              .attr("x", width - 15)
              .attr("y", 12)
              .attr("height",30)
              .attr("width",100)
              .text(d => d.category);

        function legendOnClick(d) {
          let indexCategory = d.getAttribute("index");

          var selected = svg.selectAll('.category')
          .nodes().filter(function(node){
            return node.getAttribute("index") == indexCategory}
          )
          if (d3v5.select(selected[0]).style("visibility") == "visible") {
            d3v5.select(selected[0]).style("visibility","hidden");
            d3v5.select(d).style('fill','white');
          }else{
            d3v5.select(selected[0]).style("visibility","visible");
            d3v5.select(d).style('fill',color(indexCategory));
          }
        }

        function zoomed() { //make the modification of zooming
          xZommed = d3.event.transform.rescaleX(x);
          yZommed = d3.event.transform.rescaleY(y);

          svg.select(".xAxis")
            .call(xAxis.scale(xZommed));

          svg.select(".yAxis")
            .call(yAxis.scale(yZommed));

          line.x(function(d) { return xZommed(parseDate(d.label)); })
          line.y(function(d) { return yZommed(d.value); })

          svg.selectAll('.point')
            .attr('cx', function(d) { return xZommed(parseDate(d.label)); })
            .attr("cy", function (d) { return yZommed(d.value); })

          svg.selectAll('.line')
              .attr('d', function(d) {return line(d.series)});
        }

        if(options.externalFilterSubCateg){ // check if we have set an external filter
          var filterSubCategories = d3v5.selectAll(options.externalFilterSubCateg);
          filterSubCategories.on('change', function() {
            legendOnClick(null,this.value,this.checked);
          });
        }

      }

      return {
          draw: draw
      }
    });

})
();

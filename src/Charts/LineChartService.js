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
      *                     externalFilter : string of the class of the filter to fetch with d3
      *                     isZoomable : boolean, enable to zoom in the graph or not
      *                     zoomYAxis: boolean, enable zoom on Y axis
      *                     drawCircles : boolean, is drawCircles draw circl on the line
      *
      */
      function draw(tag, data, parameters){
        options = {
          margin : {top: 30, right: 50, bottom: 30, left: 40},
          width : 400,
          height : 300,
          color : d3v5.interpolateTurbo,
          legendSize : 250,
          externalFilter : null,
          isZoomable : true,
          zoomYAxis: false,
          drawCircles : true,
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin;
            width = options.width - margin.left - margin.right - options.legendSize,
            height = options.height - margin.top - margin.bottom;

        var x = d3v5.time.scale(); // TODO: change when use only d3.v5 by scaleTime()

        var y = d3v5.scaleLinear();

        var xAxis = d3v5.axisBottom(x)

        var yAxis = d3v5.axisLeft(y)

        var parseDate = d3v5.timeParse("%Y-%m-%d");

        var line = d3v5.line()
              .defined(function(d) { return !isNaN(d.value); })
              .curve(d3v5.curveLinear)
              .x(function(d) { return x(parseDate(d.label)); })
              .y(function(d) { return y(d.value); });

        var zoom = d3v5.zoom()
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

        data.map(function(cat){
          cat.series.forEach(function(d,i){
            d.root = cat.category;
          })
        });

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

        var maxY = d3v5.max(allValues);
        var setDates = [...new Set(allDates)];
        var rangeX = setDates.map(date=>parseDate(date)).sort((a,b) => a - b);
        var allSeries = data.flatMap(d => d.series);
        var allRootCat = data.map(d => d.category);
        allSeries.forEach((d,i) => d.index=i)

        var color =  d3v5.scaleSequential(options.color)
                          .domain([0,allSeries.length]);

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

        updateLegend(allSeries)

        function updateLegend(series) {
          svg.selectAll(".legend").remove();

          var legend = svg.selectAll(".legend")
                .data(series)
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
        }

        function updateChart(d,i) {
          let indexCategory = d.getAttribute("index");

          var selected = svg.selectAll('.category')
          .filter(function(){
            return this.getAttribute("index") == indexCategory}
          )
          if (selected.style("visibility") == "visible") {
            selected.style("visibility","hidden");
            d3v5.select(d).style('fill','white');
          }else{
            selected.style("visibility","visible");
            d3v5.select(d).style('fill', function(){
              if(options.externalFilter) {
                    return color(i);
                  }else {
                    return color(indexCategory);
                  }
            })
          }
        }

        function addTitle(title){

          svg.selectAll('.chartTitle').remove();

          svg.append("text")
            .attr("x", (width / 2))
            .attr('class',"chartTitle")
            .attr("y", 0 - (margin.top / 2))
            .attr("text-anchor", "middle")
            .style("font-size", "16px")
            .style("text-decoration", "underline")
            .text(title);
        }

        function updateChartByFilter(){

          if (allRootCat.length < 10) {
              color =  d3v5.scaleOrdinal(d3v5.schemeCategory10);
          }else{
            color.domain([0,allRootCat.length]);
          }

          let hiddenCat = svg.selectAll('.category').filter(function(){
                            return !this.classList.contains(catSelected)
                          });

          let visibleCat = svg.selectAll('.category').filter(function(){
                            return this.classList.contains(catSelected)
                          });

          let = newData = svg.selectAll('.category').filter(function(){
            return this.classList.contains(catSelected)
          }).data()

          let title = newData[0].category;

          hiddenCat.style("visibility","hidden");
          visibleCat.style("visibility","visible");


          visibleCat.nodes().map(x => x.childNodes)
            .forEach((x,i) => x
              .forEach((x,j) => {
                  if (x.localName == 'circle') {
                    d3v5.select(x).attr("fill", color(i))
                  }else{
                    d3v5.select(x).attr("stroke", color(i))

                  }
              })
            )

          addTitle(title)
          updateLegend(newData);

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

            line.y(function(d) { return yZommed(d.value); })

            svg.selectAll('.point')
              .attr('cx', function(d) { return xZommed(parseDate(d.label)); })
              .attr("cy", function (d) { return yZommed(d.value); })
          }

          svg.selectAll('.point')
            .attr('cx', function(d) { return xZommed(parseDate(d.label)); })

          svg.selectAll('.line')
              .attr('d', function(d) {return line(d.series)});
        }

        if(options.externalFilter){
          var filterSubCategories = d3v5.selectAll(options.externalFilter);
          filterSubCategories.nodes()[0].checked = true;
          var catSelected = filterSubCategories.nodes().filter(x => {
                              if(x.checked === true) {return x}
                            })[0].value.replace(/\s/g, '')
            updateChartByFilter();
          filterSubCategories.on('change', function() {
            catSelected = this.value.replace(/\s/g, '');
            updateChartByFilter();
          });
        }

      }

      return {
          draw: draw
      }
    });

})
();

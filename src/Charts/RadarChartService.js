(function () {

  angular
    .module('ClientApp')
    .factory('RadarChartService', ['gettextCatalog', function (gettextCatalog){

      /*
      * Generate a grouped/stacked Vertical Bar Chart
      * @param tag : string  : tag where to put the svg
      * @param data : JSON  : The data for the graph
      * @param parameters : margin : {top: 20, right: 20, bottom: 30, left: 40}
      *                     width : int : width of the graph
      *                     height : int : height of the graph
      *                     barColor : array : colors pallete of series
      *
      */

      function draw(tag, data, parameters){
        options = {
           margin : {top: 150, right: 150, bottom: 150, left: 150},
           // radius: 5, //optional
           width: 650,
           height: 650,
           wrapWidth: 150,
           // factor: 1,
           factorLegend: 1.05,
           levels: 5,
           maxValue: 1,
           radians: -2 * Math.PI, // negative for clockwise
           opacityArea: 0.5,
           // toRight: 5, // optional
           translateX: 150,
           translateY: 80,
           deepData : true,
           // extraWidth: 500,
           // extraHeigth: 150,
           barColor: d3.scale.category10()
        };

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin,
            width = options.width - margin.left - margin.right,
            height = options.height - margin.top - margin.bottom;

        var maxValue = Math.max(options.maxValue,
              d3.max(data, function(d){
                return d3.max(d.series.map(function(d){
                  return d.value;
                }))
              })
            );

        var total = 0;
        var radians = options.radians;
        var radius = Math.min(width/2, height/2);
        var Format = d3.format('%');
        var levels = options.levels;
        var nameSeries = data.map(cat => cat.series).shift();
        var nameCategories = data.map(cat => cat.category);
        var total = nameSeries.length;
        var sections = radians/total;

        var color = options.barColor;

        data.map(function(cat){
          cat.series.forEach(function(d,i){
            d.category = cat.category;
            d.label = gettextCatalog.getString(d.label);
            d.coordX = width/2*(1-(parseFloat(d.value)/maxValue)*Math.sin(i*sections));
            d.coordY = height/2*(1-(parseFloat(d.value)/maxValue)*Math.cos(i*sections));
          })
        });

        var svg = d3.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

        //Circular segments
        for(var j=0; j< levels; j++){
          var levelFactor = radius * ((j+1)/levels);
          svg.selectAll(".levels")
             .data(nameSeries)
             .enter()
           .append("line")
             .attr("x1", function(d, i){return levelFactor * (1 - Math.sin(i*sections));})
             .attr("y1", function(d, i){return levelFactor * (1 - Math.cos(i*sections));})
             .attr("x2", function(d, i){return levelFactor * (1 - Math.sin((i+1)*sections));})
             .attr("y2", function(d, i){return levelFactor * (1 - Math.cos((i+1)*sections));})
             .attr("class", "line")
             .style("stroke", "grey")
             .style("stroke-opacity", "0.75")
             .style("stroke-width", "0.3px")
             .attr("transform", `translate(${(width/2-levelFactor)},${(height/2-levelFactor)})`);

           svg.selectAll(".levels")
             .data([1])
             .enter()
           .append("text")
             .attr("x", function(d){return levelFactor * (1 - Math.sin(0));})
             .attr("y", function(d){return levelFactor * (1 - Math.cos(0));})
             .attr("class", "legend")
             .style("font-family", "sans-serif")
             .style("font-size", "10px")
             .attr("transform", `translate(${(width/2-levelFactor)},${(height/2-levelFactor)})`)
             .attr("fill", "#737373")
             .text(Format((j+1) * maxValue / levels));
        }

        var axis = svg.selectAll(".axis")
             .data(nameSeries)
             .enter()
           .append("g")
             .attr("class", "axis");

        axis.append("line")
             .attr("x1", width/2)
             .attr("y1", height/2)
             .attr("x2", function(d, i){return width/2 * (1 - Math.sin(i*sections));})
             .attr("y2", function(d, i){return height/2 * (1 - Math.cos(i*sections));})
             .attr("class", "line")
             .style("stroke", "grey")
             .style("stroke-width", "1px");

        axis.append("text")
            .attr("class", "legend")
            .text(function(d){return d.label})
            .style("font-family", "sans-serif")
            .style("font-size", "11px")
            .attr("text-anchor", "middle")
            .attr("dy", "1.5em")
            .attr("transform", "translate(0, -10)")
            .attr("x", function(d, i){return width/2*(1-options.factorLegend*Math.sin(i*sections))-60*Math.sin(i*sections);})
            .attr("y", function(d, i){return height/2*(1-options.factorLegend*Math.cos(i*sections))-20*Math.cos(i*sections);})
            .call(wrap, options.wrapWidth)
            .on('mouseover', function() {
              (options.deepData) ?
                d3.select(this)
                  .style("cursor", "pointer")
                  .style("font-weight", "bold"):
                d3.select(this)
                  .style("cursor", "text")
                  .style("font-weight", "normal")
            })
            .on('mouseout', function() {
              d3.select(this)
              .style("cursor", "text")
              .style("font-weight", "normal")
            })
            .on("click", function(d){
              if (options.deepData) {
                d3.select(this).style("cursor", "pointer");
                // let controls = d[0].filter(controls => controls.id == d.id);
                // document.getElementById("goBack").style.visibility = 'visible';
                // RadarChart('#graphCompliance', optionsChartCompliance, controls[0]['controls']);
                // $scope.dashboard.deepGraph = true;
              }
          });

        svg.selectAll(".area")
           .data(data.map(cat => cat.series))
           .enter()
         .append("polygon")
           .attr("class", function(d,i) { return "radar-chart-serie" + i})
           .style("stroke-width", "2px")
           .style("stroke", function(d,i) { return color(i) })
           .attr("points",function(d) {
             var str="";
             d.forEach( function(serie){
               str = str + serie.coordX + "," + serie.coordY + " ";
             })
               return str;
            })
           .style("fill", function(d,i) { return color(i) })
           .style("fill-opacity", options.opacityArea)
           .on('mouseover', function (d){
                    z = "polygon."+d3.select(this).attr("class");
                    svg.selectAll("polygon")
                     .transition(200)
                     .style("fill-opacity", 0.1);
                    svg.selectAll(z)
                     .transition(200)
                     .style("fill-opacity", .7);
                    })
           .on('mouseout', function(){
                    svg.selectAll("polygon")
                     .transition(200)
                     .style("fill-opacity", options.opacityArea);
           });


        // d.forEach(function(y, x){
        svg.selectAll(".nodes")
           .data(data.map(cat => cat.series))
           .enter()
         .append("g")
            .each(function(d,i){
               svg.selectAll(".nodes")
                  .data(d)
                  .enter()
                .append("circle")
                 .attr("class", function() { return "radar-chart-serie" + i})
                 .attr('r', 5)
                 .attr("alt", function(d){ return d.value })
                 .attr("cx", function(d){ return d.coordX })
                 .attr("cy", function(d){ return d.coordY })
                 .attr("data-id", function(d){return d.label})
                 .style("fill", function() { return color(i) })
                 .style("fill-opacity", .9)
                 .on('mouseover', function (d){
                    newX =  parseFloat(d3.select(this).attr('cx')) - 10;
                    newY =  parseFloat(d3.select(this).attr('cy')) - 5;

                    tooltip
                      .attr('x', newX)
                      .attr('y', newY)
                      .text(Format(d.value))
                      .transition(200)
                      .style('opacity', 1);
                  })
                  .on('mouseout', function(){
                      tooltip
                        .transition(200)
                        .style('opacity', 0);
                      svg.selectAll("polygon")
                        .transition(200)
                        .style("fill-opacity", options.opacityArea);
                  })
                .append("title")
                  .text(function(d){ return d.value });
        });

        //Tooltip
          tooltip = svg.append('text')
                 .style('opacity', 0)
                 .style('font-family', 'sans-serif')
                 .style('font-size', '13px');

        //legend

          let legendZone = svg.append('g');
          let legend = legendZone.append("g")
            .attr("class", "legend")
            .attr("height", 100)
            .attr("width", 200)
            .attr('transform', `translate(${options.translateX},${options.translateY})`);
          legend.selectAll('rect')
            .data(nameCategories)
            .enter()
            .append("rect")
            .attr("x", width - 65)
            .attr("y", (d,i) => i * 20)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", (d,i) => color(i));
          legend.selectAll('text')
            .data(data.map(cat => cat.category))
            .enter()
            .append("text")
            .attr("x", width - 52)
            .attr("y", (d,i) => i * 20 + 9)
            .attr("font-size", "11px")
            .attr("fill", "#737373")
            .text(d => d);

        function wrap(text, width) {
            text.each(function () {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1, // ems
                    x = text.attr("x"),
                    y = text.attr("y"),
                    dy = 0, //parseFloat(text.attr("dy")),
                    tspan = text.text(null)
                                .append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", dy + "em");
                while (word = words.pop()) {
                    line.push(word);
                    tspan.text(line.join(" "));
                    if (tspan.node().getComputedTextLength() > width) {
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

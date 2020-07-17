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
      *                     color : array : colors pallete of series
      *
      */

      function draw(tag, data, parameters){
        var options = {
           margin : {top: 100, right: 200, bottom: 100, left: 200},
           width: 500,
           wrapWidth: 200,
           factorLegend: 1.05,
           levels: 5,
           maxValue: 1,
           radians: -2 * Math.PI, // negative for clockwise
           opacityArea: [0.5,0,2],
           fillCategories: [true,false],
           deepData : false,
           initialData : [],
           color: d3.schemeCategory10,
        };

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin;
        var width = options.width;

        d3.select(tag).select("svg").remove();

        var svg = d3.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", width + margin.top + margin.bottom)
              .style("user-select","none")
            .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

        if (data == undefined) {
          svg.append('text')
            .attr("x", (width / 2))
            .attr("y", (width * .1))
            .style("text-anchor", "middle")
            .style("font-size", 20)
            .style("font-weight", "bold")
            .text(gettextCatalog.getString('No Data Avalaible'));


          return;
        }

        if (options.deepData) {
          svg.append("text")
            .text("🡸 "+ gettextCatalog.getString("Go back"))
            .attr("transform", `translate(${20 - margin.left},${40 - margin.top})`)
            .style("font-weight", "bold")
            .style("fill", "#006FBA")
            .style("cursor", "pointer")
            .on("click", function(){
                options.deepData = false;
                draw(tag,options.initialData,options);
              });
        }

        var maxValue = Math.max(options.maxValue,
              d3.max(data, function(d){
                return d3.max(d.series.map(function(d){
                  return d.value;
                }))
              })
            );

        var total = 0;
        var radians = options.radians;
        var radius = width/2;
        var Format = d3.format('.0%');
        var levels = options.levels;
        var nameSeries = data.map(cat => cat.series).shift();
        var nameCategories = data.map(cat => cat.category);
        var total = nameSeries.length;
        var sections = radians/total;
        var color = d3.scaleOrdinal(options.color);
        var filtered = []; //to control legend selections

        data.map(function(cat){
          cat.series.forEach(function(d,i){
            d.label = d.label;
            d.coordX = radius*(1-(parseFloat(d.value)/maxValue)*Math.sin(i*sections));
            d.coordY = radius*(1-(parseFloat(d.value)/maxValue)*Math.cos(i*sections));
          })
        });

        //Circular segments
        for(var j=0; j< levels; j++){
          var levelFactor = radius * ((j+1)/levels);
          svg.selectAll(".levels")
             .data(nameSeries)
             .enter()
           .append("line")
             .attr("x1", (d, i) => levelFactor * (1 - Math.sin(i*sections)))
             .attr("y1", (d, i) => levelFactor * (1 - Math.cos(i*sections)))
             .attr("x2", (d, i) => levelFactor * (1 - Math.sin((i+1)*sections)))
             .attr("y2", (d, i) => levelFactor * (1 - Math.cos((i+1)*sections)))
             .attr("class", "line")
             .style("stroke", "grey")
             .style("stroke-opacity", "0.75")
             .style("stroke-width", "0.3px")
             .attr("transform", `translate(${(radius-levelFactor)},${(radius-levelFactor)})`);

           svg.selectAll(".levels")
             .data([1])
             .enter()
           .append("text")
             .attr("x", levelFactor * (1 - Math.sin(0)))
             .attr("y", levelFactor * (1 - Math.cos(0)))
             .attr("class", "legend")
             .style("font-family", "sans-serif")
             .style("font-size", "10px")
             .attr("transform", `translate(${(radius-levelFactor) + 5 },${(radius-levelFactor)})`)
             .attr("fill", "#737373")
             .text(Format((j+1) * maxValue / levels));
        }

        var axis = svg.selectAll(".axis")
             .data(nameSeries)
             .enter()
           .append("g")
             .attr("class", "axis");

        axis.append("line")
             .attr("x1", radius)
             .attr("y1", radius)
             .attr("x2", (d, i) => radius * (1 - Math.sin(i*sections)))
             .attr("y2", (d, i) => radius * (1 - Math.cos(i*sections)))
             .attr("class", "line")
             .style("stroke", "grey")
             .style("stroke-width", "1px");

        axis.append("text")
            .attr("class", "legend")
            .text((d) => d.label)
            .style("font-family", "sans-serif")
            .style("font-size", "11px")
            .attr("text-anchor", "middle")
            .attr("dy", "1.5em")
            .attr("transform", "translate(0, -10)")
            .attr("x", (d, i) => radius*(1-options.factorLegend*Math.sin(i*sections))-60*Math.sin(i*sections))
            .attr("y", (d, i) => radius*(1-options.factorLegend*Math.cos(i*sections))-20*Math.cos(i*sections))
            .call(wrap, (options.wrapWidth - total*5))
            .on('mouseover', function(d) {
              if (d.data && d.data.length > 0)
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
            .on("click", function(d){
              if (d.data && d.data.length > 0) {
                options.initialData = data;
                deepData = data.map(x => x.series).flatMap(x => x).filter(x => x.label == d.label).flatMap(x => x.data);
                d3.select(this).style("cursor", "pointer");
                options.deepData = true;
                draw(tag,deepData,options);
              }
          });

        svg.selectAll(".area")
           .data(data.map(cat => cat.series))
           .enter()
         .append("polygon")
           .attr("class", (d,i)  => "radar-chart-serie" + i)
           .style("fill", function(d,i) {
             if (options.fillCategories[i]){
               return color(i);
             }else{
               return 'none'
             }
           })
           .style("stroke-width", "2px")
           .style("stroke", (d,i)  => color(i))
           .attr("points",function(d) {
             var str="";
             d.forEach( function(serie){
               str = str + serie.coordX + "," + serie.coordY + " ";
             })
               return str;
            })
           .style("fill-opacity",(d,i) => options.opacityArea[i])
           .on('mouseover', function (d){
                    z = "polygon."+d3.select(this).attr("class");
                    svg.selectAll("polygon")
                     .transition(200)
                     .style("fill-opacity", (d,i) => options.opacityArea[i] * 0.1);
                    svg.selectAll(z)
                     .transition(200)
                     .style("fill-opacity", (d,i) => options.opacityArea[i] * 0.7);
                    })
           .on('mouseout', function(){
                    svg.selectAll("polygon")
                     .transition(200)
                     .style("fill-opacity",(d,i) => options.opacityArea[i]);
           });

        svg.selectAll(".nodes")
           .data(data.map(cat => cat.series))
           .enter()
         .append("g")
            .each(function(d,i){
               svg.selectAll(".nodes")
                  .data(d)
                  .enter()
                .append("circle")
                 .attr("class", "radar-chart-serie" + i)
                 .attr('r', 5)
                 .attr("alt", (d) => d.value )
                 .attr("cx", (d) => d.coordX )
                 .attr("cy", (d) => d.coordY )
                 .attr("data-id", (d) => d.label )
                 .style("fill", color(i))
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
                        .style("fill-opacity", (d,i) => options.opacityArea[i]);
                  })
                .append("title")
                  .text((d) => d.value );
        });

        //Tooltip
          tooltip = svg.append('text')
                 .attr('opacity', 0)
                 .attr('font-family', 'sans-serif')
                 .attr('font-size', '13px');

        //legend

          var legend = svg.selectAll(".legendZone")
                .data(nameCategories)
                .enter().append("g")
                .attr("class", "legendZone")
                .attr("transform", `translate(${margin.right - 100},${40 - margin.top})`)

          legend.append('rect')
                .attr("x", width - 65)
                .attr("y", (d,i) => i * 20)
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", (d,i) => color(i))
                .attr("stroke", (d,i) => color(i))
                .attr("id", function (d) {
                  return d.replace(/\s/g, '');
                })
                .attr("index",(d,i) =>  i)
                .on("click",function(d,i){
                  getNewSeries(d,i);
                });

          legend.append("text")
                .attr("x", width - 52)
                .attr("y", (d,i) => i * 20 + 9)
                .attr("font-size", "11px")
                .attr("fill", "#737373")
                .text(d => d);

        function getNewSeries(d,i){
          id = d.replace(/\s/g, '');

          if (filtered.indexOf(id) == -1) {
           filtered.push(id);
          }
          else {
            filtered.splice(filtered.indexOf(id), 1);
          }

          if (filtered.length == nameCategories.length) {
            filtered = [];
            svg.selectAll("[class^='radar-chart-serie']")
              .transition()
              .style("visibility","visible")
              .duration(500);
          }else {
            var categories = svg.selectAll(".radar-chart-serie" + i);
            if (categories.style('visibility') == 'visible') {
              categories
                .style("visibility","hidden");
            }else{
              categories
                .transition()
                .style("visibility","visible")
                .duration(500);
            }
          }

          legend.selectAll("rect")
                  .transition()
                  .attr("fill",function(d) {
                    if (filtered.length) {
                      if (filtered.indexOf(d.replace(/\s/g, '')) == -1) {
                        return color(this.getAttribute('index'));
                      }
                       else {
                        return "white";
                      }
                    }
                    else {
                     return color(this.getAttribute('index'));
                    }
                  })
                  .duration(100);
        };

        function wrap(text, width) {
            text.each(function () {
                var text = d3.select(this),
                    words = text.text().split(/\s+/).reverse(),
                    word,
                    line = [],
                    lineNumber = 0,
                    lineHeight = 1.1,
                    x = text.attr("x"),
                    y = text.attr("y"),
                    dy = 0,
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

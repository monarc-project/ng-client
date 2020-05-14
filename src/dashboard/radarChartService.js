(function () {

  angular
    .module('ClientApp')
    .factory('radarChartService', ['gettextCatalog', function (gettextCatalog){

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
           radius: 5, //optional
           width: 650,
           height: 650,
           wrapWidth: 150,
           // factor: 1,
           factorLegend: 1.05,
           levels: 5,
           maxValue: 1,
           radians: -2 * Math.PI, // negative for clockwise
           opacityArea: 0.5,
           toRight: 5,
           translateX: 200,
           translateY: 80,
           // extraWidth: 500,
           // extraHeigth: 150,
           legend: [gettextCatalog.getString("Current level"), gettextCatalog.getString("Applicable target level")],
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
        var series = data.map(function(cat){ return cat.series}).shift();
        var total = series.length;
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

        // cfg.maxValue = Math.max(cfg.maxValue, d3.max(data, function(d){return d3.max(d.series.map(function(d){return d.value;}))}));
        // var allAxis = (data[0].map(function(i, j){return {axis :i.axis, id: i.id}}));
        // var total = allAxis.length;
        // var Format = d3.format('%');

        // d3.select(id).select("svg").remove();

        var svg = d3.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
            .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        // var tooltip;

        //Circular segments
        for(var j=0; j< levels; j++){
          var levelFactor = radius * ((j+1)/levels);
          svg.selectAll(".levels")
             .data(series)
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
             .attr("transform", "translate(" + (width/2-levelFactor) + ", " + (height/2-levelFactor) + ")");

           svg.selectAll(".levels")
             .data([1])
             .enter()
           .append("text")
             .attr("x", function(d){return levelFactor * (1 - Math.sin(0));})
             .attr("y", function(d){return levelFactor * (1 - Math.cos(0));})
             .attr("class", "legend")
             .style("font-family", "sans-serif")
             .style("font-size", "10px")
             .attr("transform", "translate(" + (width/2 - levelFactor) + ", " + (height/2-levelFactor) + ")")
             .attr("fill", "#737373")
             .text(Format((j+1) * maxValue / levels));
        }


        // series = 0;

        var axis = svg.selectAll(".axis")
             .data(series)
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
            .attr("transform", function(d, i){return "translate(0, -10)"})
            .attr("x", function(d, i){return width/2*(1-options.factorLegend*Math.sin(i*sections))-60*Math.sin(i*sections);})
            .attr("y", function(d, i){return height/2*(1-options.factorLegend*Math.cos(i*sections))-20*Math.cos(i*sections);})
            .call(wrap, options.wrapWidth);
          //   .on('mouseover', function(d) {(deepData) ?
          //                               d3.select(this).style("cursor", "pointer") .style("font-weight", "bold"):
          //                               d3.select(this).style("cursor", "text") .style("font-weight", "normal")
          //                               })
          // .on('mouseout', function(d) {d3.select(this).style("cursor", "text") .style("font-weight", "normal")})
          // .on("click", function(e){
          //   if (deepData) {
          //     d3.select(this).style("cursor", "pointer");
          //     let controls = d[0].filter(controls => controls.id == e.id);
          //     document.getElementById("goBack").style.visibility = 'visible';
          //     RadarChart('#graphCompliance', optionsChartCompliance, controls[0]['controls']);
          //     $scope.dashboard.deepGraph = true;
          //   }
          // });

        // d.forEach(function(y, x){
        //   dataValues = [];
        //   g.selectAll(".nodes")
        //   .data(y, function(j, i){
        //     dataValues.push([
        //     width/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*sections)),
        //     height/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*sections))
        //     ]);
        //   });
        //   dataValues.push(dataValues[0]);

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


        d.forEach(function(y, x){
          g.selectAll(".nodes")
          .data(y).enter()
          .append("svg:circle")
          .attr("class", "radar-chart-serie"+series)
          .attr('r', cfg.radius)
          .attr("alt", function(j){return Math.max(j.value, 0)})
          .attr("cx", function(j, i){
            dataValues.push([
            width/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.sin(i*sections)),
            height/2*(1-(parseFloat(Math.max(j.value, 0))/cfg.maxValue)*cfg.factor*Math.cos(i*sections))
          ]);
          return width/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.sin(i*sections));
          })
          .attr("cy", function(j, i){
            return height/2*(1-(Math.max(j.value, 0)/cfg.maxValue)*cfg.factor*Math.cos(i*sections));
          })
          .attr("data-id", function(j){return j.axis})
          .style("fill", cfg.color(series)).style("fill-opacity", .9)
          .on('mouseover', function (d){
                newX =  parseFloat(d3.select(this).attr('cx')) - 10;
                newY =  parseFloat(d3.select(this).attr('cy')) - 5;

                tooltip
                  .attr('x', newX)
                  .attr('y', newY)
                  .text(Format(d.value))
                  .transition(200)
                  .style('opacity', 1);

                z = "polygon."+d3.select(this).attr("class");
                g.selectAll("polygon")
                  .transition(200)
                  .style("fill-opacity", 0.1);
                g.selectAll(z)
                  .transition(200)
                  .style("fill-opacity", .7);
                })
          .on('mouseout', function(){
                tooltip
                  .transition(200)
                  .style('opacity', 0);
                g.selectAll("polygon")
                  .transition(200)
                  .style("fill-opacity", cfg.opacityArea);
                })
          .append("svg:title")
          .text(function(j){return Math.max(j.value, 0)});

          series++;
        });
        //Tooltip
          tooltip = g.append('text')
                 .style('opacity', 0)
                 .style('font-family', 'sans-serif')
                 .style('font-size', '13px');

        //legend

        if (cfg.legend) {
          let legendZone = g.append('g');
          let names = cfg.legend;

          let legend = legendZone.append("g")
            .attr("class", "legend")
            .attr("height", 100)
            .attr("width", 200)
            .attr('transform', `translate(${cfg.TranslateX},${cfg.TranslateY})`);
          // Create rectangles markers
          legend.selectAll('rect')
            .data(names)
            .enter()
            .append("rect")
            .attr("x", width - 65)
            .attr("y", (d,i) => i * 20)
            .attr("width", 10)
            .attr("height", 10)
            .style("fill", (d,i) => cfg.color(i));
          // Create labels
          legend.selectAll('text')
            .data(names)
            .enter()
            .append("text")
            .attr("x", width - 52)
            .attr("y", (d,i) => i * 20 + 9)
            .attr("font-size", "11px")
            .attr("fill", "#737373")
            .text(d => d);
        }

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

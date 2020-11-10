(function () {

  angular
    .module('ClientApp')
    .factory('MultiHorizontalBarChartService', ['gettextCatalog', function (gettextCatalog){

      /**
      * Generate a grouped/stacked Horizontal Bar Chart
      * @param {string} tag - tag where to put the svg
      * @param {object} data - The data for the graph
      * @param {object} parameters - options of chart
      *        {object}   margin - top: 20, right: 20, bottom: 30, left: 40
      *        {int}      width - width of the graph
      *        {int}      height - height of the graph
      *        {array}    color - colors pallete of series
      *        {string}   externalFilter - class of external filter prefixed by a point
      *        {string}   radioButton - class of input button prefixed by a point
      *        {string}   forceChartMode -  grouped/stacked
      *        {boolean}  showValues - show labels of values
      *        {boolean}  showLegend - show legend
      *        {string}   nameValue - define key to set as value
      * @return {svg} chart svg
      */

      function draw(tag, data, parameters){
        var options = {
          margin : {top: 15, right: 120, bottom: 30, left: 40},
          width : 400,
          height : 300,
          color : ["#D6F107","#FFBC1C","#FD661F"],
          showValues : true,
          showLegend : true,
          nameValue : 'value'
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin,
            width = options.width - margin.left - margin.right,
            height = options.height - margin.top - margin.bottom;

        var x = d3.scaleLinear()
            .range([0, width]);

        var y1 = d3.scaleBand();

        var y0 = d3.scaleBand()
            .range([height, 0])
            .padding(0.1);

        var xAxis = d3.axisBottom(x)
            .tickSize(-height)
            .tickSizeOuter(0);

        var yAxis =  d3.axisLeft(y0);

        var color = d3.scaleOrdinal()
            .range(options.color);

        d3.select(tag).select("svg").remove();
        d3.selectAll(".tooltip" + tag.substring(1)).remove();

        var svg = d3.select(tag).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("user-select","none")
          .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

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

        data.map(function(cat){
          cat.series.forEach(function(d){
            if (d.translationLabelKey == undefined) {
              d.translationLabelKey = d.label;
            }
            d.category = cat.category;
            d.label = gettextCatalog.getString(d.translationLabelKey);
          })
        });

        var newCategories = [];
        var newSeries = [];
        var newData = [];
        var filtered = []; //to control legend selections
        var chartMode = 'grouped'; //by default the mode is grouped
        sortData(data);
        var categoriesNames = data.map(function(d) { return d.category; });
        var seriesNames = data[0].series.map(function(d) { return d.label; });

        if (options.externalFilter) {
          var filterCategories = d3.selectAll(options.externalFilter).nodes();
          filterCategories.forEach(function(cat){
            if (cat.getAttribute('selected')) {
              newCategories.push(cat.value);
            }
            cat.addEventListener('click', function(){updateCategories(this.value)});
          });
          updateCategories();
        }

        y0.domain(categoriesNames);
        y1.domain(seriesNames).range([0, y0.bandwidth()]);
        x.domain([0, d3.max(data, function(category) { return d3.max(category.series.map(function(d){return d[options.nameValue];}))})]).nice();

        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        svg.append("g")
            .attr("class", "yAxis")
            .call(yAxis)

        svg.selectAll(".yAxis").selectAll("text")
          .call(wrap, margin.left);

        customizeTicks();

        var category = svg.selectAll(".category")
            .data(data)
          .enter().append("g")
            .attr("class", function(d) { return "category " + d.category.replace(/\s/g, '')})
            .attr("transform",function(d) { return `translate(1,${y0(d.category)})`; })
            .on("mouseover", function() { mouseover() })
            .on("mousemove", function(d) { mousemove(d,this) })
            .on("mouseleave", function() { mouseleave() });

        category.selectAll("rect")
            .data(function(d) { return d.series; })
          .enter().append("rect")
            .attr("height", y1.bandwidth())
            .attr("y", function(d) { return y1(d.label); })
            .style("fill", function(d) { return color(d.label) })
            .attr("x", function() { return x(0); })
            .attr("width", function() { return x(0); });

        category.selectAll("rect")
            .transition()
            .attr("x", function() { return x(0); })
            .attr("width", function(d) { return x(d[options.nameValue]); })
            .duration(500);

        if (options.showValues) {
          category.selectAll("text")
              .data(function(d) { return d.series; })
            .enter().append("text")
              .attr("dx", ".75em")
              .attr("transform", d => { return `translate(${x(d[options.nameValue])},${y1(d.label)})`; })
              .attr("y", y1.bandwidth()/2)
              .attr("text-anchor", "middle")
              .attr("dominant-baseline", "middle")
              .attr("font-size",10)
              .attr("font-weight","bold")
              .text(d =>  d[options.nameValue] );
        }

        if (options.showLegend) {
          var dataLength = 0;
          var legend = svg.selectAll(".legend")
              .data(seriesNames.slice().reverse())
            .enter().append("g")
              .attr("class", "legend")
              .attr("transform", function(d,i) {
                let textLength = getWidth(d);
                if (i == 0) {
                  dataLength = textLength + 30;
                  return `translate(0,-40)`;
                } else {
                  let preDataLength = dataLength;
                  dataLength += textLength + 30;
                  return `translate(${preDataLength},${-40})`;
                }
              })

          legend.append("rect")
              .attr("x", width - dataLength)
              .attr("width", 18)
              .attr("height", 18)
              .attr("fill", color)
              .attr("stroke", color)
              .attr("id", function (d) {
                return "id" + d.replace(/\s/g, '');
              })
              .on("click",function(){
                  newSeries = getNewSeries(this);
                  updateChart ();
                });

          legend.append("text")
              .attr("x", width - dataLength + 25)
              .attr("y", 9)
              .attr("dy", ".35em")
              .style("font-size",10)
              .text(function(d) {return d; });
        }

        function customizeTicks(){
          var yTicks = svg.selectAll(".xAxis").selectAll(".tick")
          yTicks.selectAll("line")
              .attr("opacity", 0.7)
              .attr("stroke", "lightgrey");
        }

        function sortData(data){
          let sum = el => el.map(function(d){
              if (filtered.indexOf(d.label.replace(/\s/g, '')) == -1 ) {
                return d[options.nameValue]
              }else{return 0}
          }).reduce((a, b) => a + b, 0);

          data.sort((a,b) => sum(a.series) - sum(b.series));
          categoriesOrdered = data.map(d => d.category);
          return categoriesOrdered;
        };

        function getNewSeries(d){
          id = d.id.split("id").pop();

          if (filtered.indexOf(id) == -1) {
           filtered.push(id);
          }
          else {
            filtered.splice(filtered.indexOf(id), 1);
          }

          var newSeries = [];
          seriesNames.forEach(function(d) {
            if (filtered.indexOf(d.replace(/\s/g, '')) == -1 ) {
              newSeries.push(d);
            }
          })

          if (newSeries.length < 1) {
            newSeries = seriesNames;
            filtered = [];
          }

          legend.selectAll("rect")
                .transition()
                .attr("fill",function(d) {
                  if (filtered.length) {
                    if (filtered.indexOf(d.replace(/\s/g, '')) == -1) {
                      return color(d);
                    }
                     else {
                      return "white";
                    }
                  }
                  else {
                   return color(d);
                  }
                })
                .duration(100);

          return newSeries;
        };

        function updateGroupedChart(newSeries,newCategories,newData) {
            y0.domain(sortData(newData));
            y1.domain(newSeries).range([0, y0.bandwidth()]);
            x.domain([0, d3.max(newData, function(category) {
                return d3.max(category.series.map(function(d){
                  if (filtered.indexOf(d.label.replace(/\s/g, '')) == -1)
                  return d[options.nameValue];
                }))
              })])
              .nice();

            svg.select(".xAxis")
              .transition()
              .call(xAxis)
              .duration(500);

            svg.select(".yAxis")
              .call(yAxis);

            svg.selectAll(".yAxis").selectAll("text")
              .call(wrap, margin.left);

            customizeTicks();

            var categories = svg.selectAll(".category");

            categories.filter(function(d) {
                    return newCategories.indexOf(d.category) == -1;
                 })
                 .style("visibility","hidden");

            categories.filter(function(d) {
                    return newCategories.indexOf(d.category) > -1;
                 })
                 .transition()
                 .style("visibility","visible")
                 .attr("transform",function(d) { return `translate(1,${y0(d.category)})`; })
                 .duration(500);

            var categoriesBars = categories.selectAll("rect");
            var categoriesText = categories.selectAll("text")

            categoriesBars.filter(function(d) {
                    return filtered.indexOf(d.label.replace(/\s/g, '')) > -1;
                 })
                 .transition()
                 .attr("x", function() { return x(0); })
                 .attr("width",0)
                 .attr("y", function() {
                   return (+d3.select(this).attr("y")) + (+d3.select(this).attr("height"))/2;
                 })
                 .attr("height",0)
                 .duration(500);

             categoriesText.filter(function(d) {
                    return filtered.indexOf(d.label.replace(/\s/g, '')) > -1;
                 })
                 .transition()
                 .style("opacity",0)
                 .duration(500);

            categoriesBars.filter(function(d) {
                  return filtered.indexOf(d.label.replace(/\s/g, '')) == -1;
                })
                .transition()
                .attr("x", function() { return x(0); })
                .attr("width", function(d) { return x(d[options.nameValue]); })
                .attr("y", function(d) { return y1(d.label); })
                .attr("height", y1.bandwidth())
                .style("opacity", 1)
                .duration(500);

            categoriesText.filter(function(d) {
                   return filtered.indexOf(d.label.replace(/\s/g, '')) == -1;
                })
                .transition()
                .attr("transform", d => { return `translate(${x(d[options.nameValue])},${y1(d.label)})`; })
                .attr("y", y1.bandwidth()/2)
                .style("opacity",1)
                .text(function(d) {return d[options.nameValue]; })
                .duration(500);
        }

        function updateStackedChart(newCategories,newData) {
          y0.domain(sortData(newData));
          var dataFiltered = newData.map(function(cat){
                        return cat.series.filter(function(serie){
                          return filtered.indexOf(serie.label.replace(/\s/g, '')) == -1
                        })
                      });

          var maxValues = dataFiltered.map(x => x.map(d => d[options.nameValue]).reduce((a, b) => a + b, 0));

          x.domain([0, d3.max(maxValues)]).nice();

          svg.select(".xAxis")
            .transition()
            .call(xAxis)
            .duration(500);


          svg.select(".yAxis")
            .call(yAxis);

          svg.selectAll(".yAxis").selectAll("text")
            .call(wrap, margin.left);

          customizeTicks();

          var categories = svg.selectAll(".category");

          categories.filter(function(d) {
                  return newCategories.indexOf(d.category) == -1;
               })
               .style("visibility","hidden");

          categories.filter(function(d) {
                  return newCategories.indexOf(d.category) > -1;
               })
               .style("visibility","visible")
               .attr("transform","translate(1,0)")

          var categoriesBars = svg.selectAll(".category").selectAll("rect");
          var categoriesText = svg.selectAll(".category").selectAll("text").filter(function(d){
            return this.parentNode.style.visibility !== 'hidden';
          })

          categoriesBars.filter(function(d) {
                  return filtered.indexOf(d.label.replace(/\s/g, '')) > -1;
               })
               .transition()
               .style("opacity", 0)
               .duration(500);

           categoriesText.filter(function(d) {
                 return filtered.indexOf(d.label.replace(/\s/g, '')) > -1;
               })
               .transition()
               .style("opacity",0)
               .attr("transform", d => { return `translate(${x(d.x1)},${y0(d.category)})`; })
               .attr("y", y0.bandwidth()/2)
               .duration(500);

          var categoriesSelected = categoriesBars.filter(function(d) {
                                return filtered.indexOf(d.label.replace(/\s/g, '')) == -1;
                                })

          categoriesSelected.each(function(d,i){
            if (i == 0) x0 = 0;
              d.x0 = x0;
              d.x1 = x0 += +d[options.nameValue];
            d3.select(this)
              .transition()
              .attr("y",function(d) { return y0(d.category); })
              .attr("height", y0.bandwidth())
              .attr("x", function(d) { return x(d.x0); })
              .attr("width", function(d) { return  x(d.x1) - x(d.x0); })
              .style("opacity", 1)
              .duration(500);
          })

          categoriesText.filter(function(d) {
                  return filtered.indexOf(d.label.replace(/\s/g, '')) == -1;
              })
              .each(function (d,i){
                if (i == seriesNames.length - filtered.length - 1) {
                  d3.select(this)
                  .transition()
                  .attr("transform", d => { return `translate(${x(d.x1)},${y0(d.category)})`; })
                  .attr("y", y0.bandwidth()/2)
                  .style("opacity",1)
                  .text(function(d) {return d.x1; })
                  .duration(500);
                }else {
                  d3.select(this)
                  .transition()
                  .style("opacity",0)
                  .attr("transform", d => { return `translate(${x(d.x1)},${y0(d.category)})`; })
                  .attr("y", y0.bandwidth()/2)
                  .duration(500);
                }
              });
        }

        function mouseover() {
           tooltip
              .style("z-index", "100")
              .style("opacity", 0.9);
        }

        function mousemove(d,element) {
          let elementRect = element.getBoundingClientRect();
          let tooltipText = "";
          d.series.forEach(function(serie){
            if (filtered.indexOf(serie.label.replace(/\s/g, '')) == -1) {
              tooltipText =
                      tooltipText +
                      ("<tr><td><div style=width:10px;height:10px;background-color:"+ color(serie.label) +
                      "></div></td><td>"+ serie.label +
                      "</td><td><b>"+ serie[options.nameValue] + "</td></tr>");
            }
          })
          tooltip
            .html("<table><tbody>"+ tooltipText + "</tbody></table>")
            .style("left", elementRect.right + 10 + "px")
            .style("top", elementRect.top + (elementRect.height/2) - tooltip.property('clientHeight')/2 + "px")

        }

        function mouseleave() {
          tooltip
            .style("z-index", "-100")
            .style("opacity", 0)
        }

        function updateCategories(cat) {
          if (newCategories.indexOf(cat) > -1) {
            let index = newCategories.indexOf(cat);
            newCategories.splice(index,1);
          }else if (cat) {
            newCategories.push(cat);
          }

          newData = data.filter(function(d){return newCategories.includes(d.category);});

          updateChart();

        }

        function updateChart() {
          if (newData.length == 0) newData = data
          if (newCategories.length == 0) newCategories = categoriesNames
          if (chartMode == 'grouped') {
            if (newSeries.length == 0) newSeries = seriesNames
            updateGroupedChart(newSeries,newCategories,newData);
          } else{
            updateStackedChart(newCategories,newData);
          }
        }

        function wrap(text, width) {
          var maxLines = Math.round(y0.bandwidth()/11.5);
          text.each(function() {
            let text = d3.select(this),
              maxLinesTextSplited = Math.ceil(text.node().getComputedTextLength()/(width - 20)),
              words = text.text().split(/\s+/).reverse(),
              word,
              numberChar = Math.round((width -10)/4),
              line = [],
              lineNumber = 0,
              x = text.attr("x"),
              y = 0,
              dy = 0.3,
              tspan = text.text(null)
              .append("tspan")
              .attr("x", x)
              .attr("y", y)
              .attr("dy", dy + "em");

            while (word = words.pop()) {
              line.push(word);

              if (lineNumber == maxLines - 1) {
                tspan.text(line.join(" "));
                if (tspan.text().length > numberChar - 3) {
                    tspan.text(line.join(" ").substring(0,numberChar - 3) + " ...");
                }
                continue;
              } else {
                tspan.text(line.join(" "));
              }
              if (tspan.node().getComputedTextLength() > width - 10) {
                line.pop();
                dy = -0.5 * Math.min(maxLinesTextSplited,maxLines)/2;
                tspan.text(line.join(" "));
                tspan.attr("dy", lineNumber + dy + "em");
                numberChar = tspan.text().length;
                line = [word];
                tspan = text.append("tspan")
                  .attr("x", x)
                  .attr("y", y)
                  .attr("dy", ++lineNumber + dy + "em")
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

        if (options.radioButton && options.forceChartMode == null) {
          var radioButton = d3.selectAll(options.radioButton);
          var chartMode = radioButton.nodes().filter(x => { if(x.checked === true) {return x}})[0].value
          radioButton.on('change', function() {
            chartMode = this.value;
            updateChart();
          });
          updateChart();
        }

        if(options.forceChartMode){
          var chartMode = options.forceChartMode;
          updateChart()
        }

      }

      return {
          draw: draw
      }
    }]);

})
();

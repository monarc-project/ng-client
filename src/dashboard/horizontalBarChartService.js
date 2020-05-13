(function () {

  angular
    .module('ClientApp')
    .factory('horizontalBarChartService', ['gettextCatalog', function (gettextCatalog){

      /*
      * Generate a grouped/stacked Horizontal Bar Chart
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
          margin : {top: 15, right: 100, bottom: 30, left: 40},
          width : 400,
          height : 300,
          barColor : ["#D6F107","#FFBC1C","#FD661F"],
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin,
            width = options.width - margin.left - margin.right,
            height = options.height - margin.top - margin.bottom;

        var x = d3.scale.linear()
            .range([0, width]);

        var y1 = d3.scale.ordinal();

        var y0 = d3.scale.ordinal()
            .rangeRoundBands([height, 0], .1);

        var xAxis = d3.svg.axis()
            .scale(x)
            .orient("bottom")
            .tickSize(-height, 0, 0);

        var yAxis = d3.svg.axis()
            .scale(y0)
            .orient("left");


        var color = d3.scale.ordinal()
            .range(options.barColor);

        var svg = d3.select(tag).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

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

        data.map(function(cat){
         cat.series.forEach(function(d){
           d.category = cat.category;
           d.label = gettextCatalog.getString(d.label)
         });
        });

        var newCategories = [];
        var newSeries = [];
        var newData = [];
        var filtered = []; //to control legend selections
        sortData(data);
        var categoriesNames = data.map(function(d) { return d.category; });
        var seriesNames = data[0].series.map(function(d) { return d.label; });
        const radioButton = d3.selectAll('input[name="chartMode-' + tag.slice(1) + '"]');
        var filterCategories = d3.selectAll(".filter-categories-" + tag.slice(1));


        y0.domain(categoriesNames);
        y1.domain(seriesNames).rangeRoundBands([0, y0.rangeBand()]);
        x.domain([0, d3.max(data, function(category) { return d3.max(category.series.map(function(d){return d.value;}))})]).nice();

        svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

        svg.append("g")
            .attr("class", "y axis")
            .style('fill', 'black')
            .style('stroke', '#000')
            .style('stroke-width', 0.4)
            .style('shape-rendering', 'crispEdges')
            .call(yAxis)
            .select(".domain").remove()
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        svg.selectAll(".tick").selectAll("line")
            .attr("opacity", 0.7)
            .attr("stroke", "lightgrey");

        var category = svg.selectAll(".category")
            .data(data)
          .enter().append("g")
            .attr("class", function(d) { return "category " + d.category.replace(/\s/g, '')})
            .attr("transform",function(d) { return "translate(0," + y0(d.category) + ")"; })
            .on("mouseover", function() { mouseover() })
            .on("mousemove", function(d) { mousemove(d,this) })
            .on("mouseleave", function() { mouseleave() });

        category.selectAll("rect")
            .data(function(d) { return d.series; })
          .enter().append("rect")
            .attr("height", y1.rangeBand())
            .attr("y", function(d) { return y1(d.label); })
            .style("fill", function(d) { return color(d.label) })
            .attr("x", function() { return x(0); })
            .attr("width", function() { return x(0); });

        category.selectAll("rect")
            .transition()
            .attr("x", function() { return x(0); })
            .attr("width", function(d) { return x(d.value); })
            .duration(500);

        var legend = svg.selectAll(".legend")
            .data(seriesNames.slice().reverse())
          .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d,i) { return "translate("+ margin.right +"," + i * 20 + ")"; })

        legend.append("rect")
            .attr("x", width - 18)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", color)
            .attr("stroke", color)
            .attr("id", function (d) {
              return "id" + d.replace(/\s/g, '');
            })
            .on("click",function(){
                newSeries = getNewSeries(this);
                chartMode = d3.selectAll('input[name="chartMode-' + tag.slice(1) + '"]:checked').node().value;
                updateChart (chartMode);
              });

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) {return d; });

        function sortData(data){
          let sum = el => el.map(function(d){
              if (filtered.indexOf(d.label.replace(/\s/g, '')) == -1 ) {
                return d.value
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
            y1.domain(newSeries).rangeRoundBands([0, y0.rangeBand()]);
            x.domain([0, d3.max(newData, function(category) {
                return d3.max(category.series.map(function(d){
                  if (filtered.indexOf(d.label.replace(/\s/g, '')) == -1)
                  return d.value;
                }))
              })])
              .nice();

            svg.select(".x")
              .transition()
              .call(xAxis)
              .duration(500);


            svg.select(".y")
              .call(yAxis)
              .select(".domain").remove();


            svg.selectAll(".tick").selectAll("line")
                .attr("opacity", 0.7)
                .attr("stroke", "lightgrey");

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
                 .attr("transform",function(d) { return "translate(0," + y0(d.category) + ")"; })
                 .duration(500);

            var categoriesBars = categories.selectAll("rect");

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

            categoriesBars.filter(function(d) {
                  return filtered.indexOf(d.label.replace(/\s/g, '')) == -1;
                })
                .transition()
                .attr("x", function() { return x(0); })
                .attr("width", function(d) { return x(d.value); })
                .attr("y", function(d) { return y1(d.label); })
                .attr("height", y1.rangeBand())
                .attr("fill", function(d) { return color(d.label); })
                .style("opacity", 1)
                .duration(500);
        }

        function updateStackedChart(newCategories,newData) {
          y0.domain(sortData(newData));
          var dataFiltered = newData.map(function(cat){
                        return cat.series.filter(function(serie){
                          return filtered.indexOf(serie.label.replace(/\s/g, '')) == -1
                        })
                      });

          var maxValues = dataFiltered.map(x => x.map(d => d.value).reduce((a, b) => a + b, 0));

          x.domain([0, d3.max(maxValues)]).nice();

          svg.select(".x")
            .transition()
            .call(xAxis)
            .duration(500);


          svg.select(".y")
            .call(yAxis)
            .select(".domain").remove();

          svg.selectAll(".tick").selectAll("line")
              .attr("opacity", 0.7)
              .attr("stroke", "lightgrey");

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
               .attr("transform",function() { return "translate(" + "0" + ",0)"; })
               .duration(500);

          var categoriesBars = svg.selectAll(".category").selectAll("rect");

          categoriesBars.filter(function(d) {
                  return filtered.indexOf(d.label.replace(/\s/g, '')) > -1;
               })
               .transition()
               .style("opacity", 0)
               .duration(500);

          var categoriesSelected = categoriesBars.filter(function(d) {
                                return filtered.indexOf(d.label.replace(/\s/g, '')) == -1;
                                })

          categoriesSelected.each(function(d,i){
            if (i == 0) x0 = 0;
              d.x0 = x0;
              d.x1 = x0 += +d.value;
            d3.select(this)
              .transition()
              .attr("y",function(d) { return y0(d.category); })
              .attr("height", y0.rangeBand())
              .attr("x", function(d) { return x(d.x0); })
              .attr("width", function(d) { return  x(d.x1) - x(d.x0); })
              .style("opacity", 1)
              .duration(500);
          })
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
                      "</td><td><b>"+ serie.value + "</td></tr>");
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

        function updateCategories() {
          newCategories = []
          let catSelected = []
          d3.selectAll(".filter-categories-" + tag.slice(1)).each(function(){
            cat = d3.select(this);
            if(cat.property("checked")){
              catSelected.push(cat.attr("value"));
            }
          });

          if(catSelected.length > 0){
            newData = data.filter(function(d){
              if (catSelected.includes(d.category)) {
                newCategories.push(d.category);
                return true;
              }
            });
          }else {
            newData = data;
          }

          chartMode = d3.selectAll('input[name="chartMode-' + tag.slice(1) + '"]:checked').node().value;
          updateChart(chartMode);

        }

        function updateChart(chartMode) {
          if (newData.length == 0) newData = data
          if (newCategories.length == 0) newCategories = categoriesNames
          if (chartMode == 'grouped') {
            if (newSeries.length == 0) newSeries = seriesNames
            updateGroupedChart(newSeries,newCategories,newData);
          } else{
            updateStackedChart(newCategories,newData);
          }
        }


        filterCategories.on('change', function() {updateCategories()});

        radioButton.on('change', function() {
          let chartMode = this.value;
          updateChart(chartMode) });
      }

      return {
          draw: draw
      }
    }]);

})
();

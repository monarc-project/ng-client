(function () {

  angular
    .module('ClientApp')
    .factory('VerticalBarChartService', ['gettextCatalog', function (gettextCatalog){

      /*
      * Generate a grouped/stacked Vertical Bar Chart
      * @param tag : string  : tag where to put the svg
      * @param data : JSON  : The data for the graph
      * @param parameters : margin : {top: 20, right: 20, bottom: 30, left: 40}
      *                     width : int : width of the graph
      *                     height : int : height of the graph
      *                     barColor : array : colors pallete of series
      *                     externalFilter : class of external filter prefixed by a point
      *                     radioButton :  class of input button prefixed by a point
      *                     forceChartMode :  grouped/stacked
      *
      */

      function draw(tag, data, parameters){
        options = {
          margin : {top: 15, right: 100, bottom: 30, left: 40},
          width : 400,
          height : 300,
          barColor : ["#D6F107","#FFBC1C","#FD661F"],
          externalFilter: null,
          radioButton : null,
          forceChartMode: null
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin,
            width = options.width - margin.left - margin.right,
            height = options.height - margin.top - margin.bottom;

        var x0 = d3v5.scaleBand()
            .range([0, width])
            .padding(0.1);

        var x1 = d3v5.scaleBand();

        var y = d3v5.scaleLinear()
            .range([height, 0]);

        var xAxis = d3v5.axisBottom(x0);

        var yAxis = d3v5.axisLeft(y)
            .tickSize(-width)
            .tickSizeOuter(0);

        var color = d3v5.scaleOrdinal()
            .range(options.barColor);

        d3.select(tag).select("svg").remove();

        var svg = d3v5.select(tag).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

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

        data.map(function(cat){
          cat.series.forEach(function(d){
            d.category = cat.category;
            d.label = gettextCatalog.getString(d.label)
          })
        });

        var newCategories = [];
        var newSeries = [];
        var newData = [];
        var filtered = []; //to control legend selections
        var categoriesNames = data.map(function(d) { return d.category; });
        var seriesNames = data[0].series.map(function(d) { return d.label; });


        if (options.externalFilter) {
          var filterCategories = d3v5.selectAll(options.externalFilter);
          filterCategories.on('change', function() {updateCategories()});
        }

        if (options.radioButton && options.forceChartMode == null) {
          var radioButton = d3v5.selectAll(options.radioButton);
          var chartMode = radioButton.nodes().filter(x => { if(x.checked === true) {return x}})[0].value
          radioButton.on('change', function() {
            chartMode = this.value;
            updateChart()
          });
        }

        x0.domain(categoriesNames);
        x1.domain(seriesNames).range([0, x0.bandwidth()]);
        y.domain([0, d3v5.max(data, function(category) { return d3v5.max(category.series.map(function(d){return d.value;}))})]).nice();

        svg.append("g")
            .attr("class", "xAxis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis)

        svg.append("g")
            .attr("class", "yAxis")
            .call(yAxis)
          .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end");

        svg.selectAll(".yAxis").selectAll(".tick")
          .nodes().shift()
          .remove();
        customizeTicks();

        var category = svg.selectAll(".category")
            .data(data)
          .enter().append("g")
            .attr("class", function(d) { return "category " + d.category.replace(/\s/g, '')})
            .attr("transform",function(d) { return `translate(${x0(d.category)},0)`; })
            .on("mouseover", function() { mouseover() })
            .on("mousemove", function(d) { mousemove(d,this) })
            .on("mouseleave", function() { mouseleave() });

        category.selectAll("rect")
            .data(function(d) { return d.series; })
          .enter().append("rect")
            .attr("width", x1.bandwidth())
            .attr("x", function(d) { return x1(d.label); })
            .style("fill", function(d) { return color(d.label) })
            .attr("y", function() { return y(0); })
            .attr("height", function() { return height - y(0); });

        category.selectAll("rect")
            .transition()
            .attr("y", function(d) { return y(d.value); })
            .attr("height", function(d) { return height - y(d.value); })
            .duration(500);

        var legend = svg.selectAll(".legend")
            .data(seriesNames.slice().reverse())
          .enter().append("g")
            .attr("class", "legend")
            .attr("transform", function(d,i) { return `translate(${margin.right},${i * 20})`; })

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
                updateChart ();
              });

        legend.append("text")
            .attr("x", width - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(function(d) {return d; });

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

        function customizeTicks(){
          var yTicks = svg.selectAll(".yAxis").selectAll(".tick")
          yTicks.selectAll("line")
              .attr("opacity", 0.7)
              .attr("transform", `translate(1,0)`)
              .attr("stroke", "lightgrey");
        }

        function updateGroupedChart(newSeries,newCategories,newData) {
            x0.domain(newCategories);
            x1.domain(newSeries).range([0, x0.bandwidth()]);
            y.domain([0, d3v5.max(newData, function(category) {
                return d3v5.max(category.series.map(function(d){
                  if (filtered.indexOf(d.label.replace(/\s/g, '')) == -1)
                  return d.value;
                }))
              })])
              .nice();

            svg.select(".xAxis")
              .call(xAxis);

            svg.select(".yAxis")
              .transition()
              .call(yAxis)
              .duration(500);

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
                 .attr("transform",function(d) { return `translate(${x0(d.category)},0)`; })
                 .duration(500);

            var categoriesBars = categories.selectAll("rect");

            categoriesBars.filter(function(d) {
                    return filtered.indexOf(d.label.replace(/\s/g, '')) > -1;
                 })
                 .transition()
                 .attr("x", function() {
                   return (+d3v5.select(this).attr("x")) + (+d3v5.select(this).attr("width"))/2;
                 })
                 .attr("height",0)
                 .attr("width",0)
                 .attr("y", function() { return height; })
                 .duration(500);

            categoriesBars.filter(function(d) {
                  return filtered.indexOf(d.label.replace(/\s/g, '')) == -1;
                })
                .transition()
                .attr("x", function(d) { return x1(d.label); })
                .attr("width", x1.bandwidth())
                .attr("y", function(d) { return y(d.value); })
                .attr("height", function(d) { return height - y(d.value); })
                .attr("fill", function(d) { return color(d.label); })
                .style("opacity", 1)
                .duration(500);
        }

        function updateStackedChart(newCategories,newData) {
          x0.domain(newCategories);
          var dataFiltered = newData.map(function(cat){
                        return cat.series.filter(function(serie){
                          return filtered.indexOf(serie.label.replace(/\s/g, '')) == -1
                        })
                      });

          var maxValues = dataFiltered.map(x => x.map(d => d.value).reduce((a, b) => a + b, 0));

          y.domain([0, d3v5.max(maxValues)]).nice();

          svg.select(".xAxis")
            .call(xAxis)

          svg.select(".yAxis")
            .transition()
            .call(yAxis)
            .duration(500)

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
               .attr("transform","translate(0,0)")
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
            if (i == 0) y0 = 0;
              d.y0 = y0;
              d.y1 = y0 += +d.value;
            d3v5.select(this)
              .transition()
              .attr("x",function(d) { return x0(d.category); })
              .attr("width", x0.bandwidth())
              .attr("y", function(d) { return y(d.y1); })
              .attr("height", function(d) { return y(d.y0) - y(d.y1); })
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
            .style("left", elementRect.left + (elementRect.width/2) - (tooltip.property('clientWidth')/2) + "px")
            .style("top", elementRect.top - tooltip.property('clientHeight') - 10 + "px")

        }

        function mouseleave() {
          tooltip
            .style("z-index", "-100")
            .style("opacity", 0)
        }

        function updateCategories() {

          newCategories = []
          filterCategories.each(function(){
            cat = d3v5.select(this);
            if(cat.property("checked")){
              newCategories.push(cat.attr("value"));
            }
          });

          if(newCategories.length > 0){
            newData = data.filter(function(d){return newCategories.includes(d.category);});
          }else {
            newData = data;
          }

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

        if(options.forceChartMode){
          var chartMode = options.chartMode;
          updateChart()
        }

      }
      return {
          draw: draw
      }
    }]);

})
();

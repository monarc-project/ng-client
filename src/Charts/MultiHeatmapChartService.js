(function () {

  angular
    .module('ClientApp')
    .factory('MultiHeatmapChartService', ['gettextCatalog', function (gettextCatalog){

      /*
      * Generate a grouped/stacked Vertical Bar Chart
      * @param tag : string  : tag where to put the svg
      * @param data : JSON  : The data for the graph
      * @param parameters : margin : {top: 20, right: 20, bottom: 30, left: 40}
      *                     width : int : width of the graph
      *                     color : array : transition between colors
      *        {int}        legendSize - width of the graph for the legend
      *                     threshold : array : threshold values related to color array
      *                     xLabel : string : x axis label
      *                     yLabel : string : y axis label
      *
      */

      function draw(tag, data, parameters){
        var options = {
          margin : {top: 50, right: 50, bottom: 30, left: 40},
          width : 500,
          legendSize : 250,
          color : d3.schemeCategory10,
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin,
            width = options.width - margin.left - margin.right - options.legendSize;

        var seriesMerged = mergeData(data);
        var categoriesUuids = data.map(d => d.uuid);
        var maxValue = d3.max(seriesMerged.map(d => d.value));
        var xTicks = [...new Set(seriesMerged.map(d => d.x))];
        var yTicks = [...new Set(seriesMerged.map(d => d.y))];
        var gridSize = width / xTicks.length;
        var height = gridSize * yTicks.length;

        d3.select(tag).select("svg").remove();

        var svg = d3.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right + options.legendSize)
              .attr("height", height + margin.top + margin.bottom)
              .style("user-select","none")
            .append("g")
              .attr("transform", `translate(${margin.left},${margin.top})`);

        var tooltip = d3.select("body").append("div")
          .style("opacity", 0)
          .style("position", "absolute")
          .style("background-color", "white")
          .style("color", "rgba(0,0,0,0.87)")
          .style("border", "solid black")
          .style("border-width", "1px")
          .style("border-radius", "5px")
          .style("padding", "5px")
          .style("font-size", "10px");

        if (maxValue == undefined) {
          svg.append('text')
            .attr("x", (width / 2))
            .attr("y", (height / 2))
            .style("text-anchor", "middle")
            .style("font-size", 20)
            .style("font-weight", "bold")
            .text(gettextCatalog.getString('No Data Avalaible'))
          return;
        }

        var x = d3.scaleBand()
          .range([0,width])
          .domain(xTicks)

        var y = d3.scaleBand()
          .range([0,height])
          .domain(yTicks)

        var xAxis = d3.axisTop(x)
          .tickSize(0)
          .tickValues([])

        var yAxis = d3.axisLeft(y)
          .tickSize(0)
          .tickValues([])

        if (options.threshold) {
          var  color = d3.scaleThreshold()
              .domain(options.threshold.map(d => d + 1))
              .range(options.color)
        }else {
          var color = d3.scaleLinear()
              .domain(d3.extent(data.map(d => d.value)))
              .range(options.color)
        }

        svg.append("g")
          .attr("transform", "translate(0,0)")
          .call(xAxis)
          .select(".domain").remove();

        if (options.xLabel) {
          svg.append("text")
            .attr("x", width/2)
            .attr("dy","-2em")
            .attr("font-size",10)
            .style("text-anchor", "middle")
            .text(options.xLabel);
        }

        svg.append("g")
          .call(yAxis)
          .select(".domain").remove();

        if (options.yLabel) {
          svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height + margin.bottom)/2)
            .attr("dy","-2em")
            .attr("dx","2em")
            .attr("font-size",10)
            .style("text-anchor", "middle")
            .text(options.yLabel);
        }

        var cellsGroup = svg.append('g')
        .attr("class",'cells')

        var cells = cellsGroup.selectAll('cell')
            .data(seriesMerged);

        cells.enter().append("rect")
          .attr("x", d => { return x(d.x) })
          .attr("y", d => { return y(d.y) })
          .attr("width", gridSize)
          .attr("height",gridSize)
          .style("fill", d => {
            if (options.threshold) {
              return color(d.x * d.y);
            }else {
              return color(d.value);
            }
          })
          .style("fill-opacity", 0.2)

          var circlesGroup = svg.append('g')
          .attr("class",'circles')

          var circles = circlesGroup.selectAll('circle')
          .data(seriesMerged);

          circles.enter().append("circle")
            .attr("transform", d => { return `translate(${x(d.x)},${y(d.y)})`})
            .attr("cx", gridSize/2)
            .attr("cy", gridSize/2)
            .attr("r", d => gridSize/2 * (d.value /maxValue))
            .style("fill", d => color(d.x * d.y))
            .style("fill-opacity", 0.35)
            .style("stroke", d => color(d.x * d.y))
            .style("stroke-width", 1)
            .on("mouseover", function() { mouseover() })
            .on("mousemove", function(d) { mousemove(d,this) })
            .on("mouseleave", function() { mouseleave() });

            var legend = svg.selectAll(".legend")
                  .data(data)
                .enter().append('g')
                  .attr("class", "legend")
                  .attr("transform", (d,i) => `translate(0,${i * 20})`)

            legend.append("rect")
                  .attr("x", width + 20)
                  .attr("width", 18)
                  .attr("height", 18)
                  .style("fill", 'none')
                  .style("stroke", 'black')

            legend.append("rect")
                  .attr("class","checkbox")
                  .attr("x", width + 20)
                  .attr("transform", 'translate(3,3)')
                  .attr("width", 12)
                  .attr("height", 12)
                  .style("fill-opacity", 0.6)
                  .on('click', function(d){ updateChart(this,d) });


            legend.append("text")
                  .attr("x", width + 45)
                  .attr("y", 12)
                  .style("font-size",10)
                  .attr("height",30)
                  .attr("width",100)
                  .text(d => d.category);


            function mergeData(data) {
              let dataMerged = []

              data.forEach((category) => {
                category.series.forEach(d => {
                  let serieFound = dataMerged.findIndex(function(serie) {
                    return serie.y == d.y && serie.x == d.x
                  });
                  if (serieFound == -1) {
                    dataMerged.push({
                      y: d.y,
                      x: d.x,
                      category: [{
                        name: category.category,
                        uuid: category.uuid,
                        value: d.value
                      }],
                      value: d.value,
                    })
                  } else if (d.value !== null) {
                    dataMerged[serieFound].category.push({
                      name: category.category,
                      uuid: category.uuid,
                      value: d.value
                    });
                    dataMerged[serieFound].value += d.value;
                  }
                })
              });

              return dataMerged;
            }

            function updateChart(element,d) {
              let checkbox = d3.select(element);
              let uuid = d.uuid;
              if (checkbox.style("fill-opacity") == 0.6) {
                checkbox.style("fill-opacity",0)
                categoriesUuids.splice(categoriesUuids.indexOf(uuid), 1);
              }else{
                checkbox.style("fill-opacity",0.6)
                categoriesUuids.push(uuid);
              }
              if (categoriesUuids.length < 1) {
                categoriesUuids = data.map(d => d.uuid);
                svg.selectAll('.checkbox').style("fill-opacity",0.6);
              }

              let newData = data.filter((d) => {
                  return categoriesUuids.indexOf(d.uuid) > -1;
                })

              seriesMerged = mergeData(newData);

              maxValue = d3.max(seriesMerged.map(d => d.value));

              let newCircles = svg.selectAll('.circles').selectAll('circle')
              .data(seriesMerged);

              newCircles
                .attr("r", d => gridSize/2 * (d.value /maxValue))
                .transition().duration(500);

              newCircles.exit().remove();

            }

            function mouseover() {
              tooltip
                .style("z-index", "100")
                .style("opacity", 0.9);
            }

            function mousemove(d, element) {
              let elementRect = element.getBoundingClientRect();
              let tooltipText = "<tr><td><b>"+ gettextCatalog.getString("Total") +
                                "</td><td><b>"+ d.value + "</td></tr><tr><td></td></tr>"
              d.category.forEach(function(category){
                  if (category.value) {
                    tooltipText =
                            tooltipText +
                            ("<tr><td>"+ category.name +
                            "</td><td><b>"+ category.value + "</td></tr>");
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

      }
      return {
          draw: draw
      }
    }]);

})
();

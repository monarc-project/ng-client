(function() {

  angular
    .module('ClientApp')
    .factory('HorizontalBarChartService', ['gettextCatalog', function (gettextCatalog){

      /**
       * Generate a grouped/stacked Vertical Bar Chart
       * @param {string} tag - tag where to put the svg
       * @param {object} data - The data for the graph
       * @param {object} parameters - options of chart
       *        {object}   margin - top: 20, right: 20, bottom: 30, left: 40
       *        {int}      width - width of the graph
       *        {int}      height - height of the graph
       *        {boolean}  sort - sort data in descending order
       *        {array}    color - colors pallete of series
       *        {boolean}  colorGradient - get color pallete on gradient range
       *        {boolean}  showValues - show labels of values
       *        {boolean}  showLegend - show legend
       *        {string}   xLabel - x axis label
       *        {object}   forceDomainX - Force min and max of y axis, ex. min: 0, max: 10
       * @return {svg} chart svg
       */

      function draw(tag, data, parameters) {
        var options = {
          margin: {
            top: 15,
            right: 100,
            bottom: 30,
            left: 40
          },
          width: 400,
          height: 300,
          sort: false,
          color: d3.schemeCategory10,
          colorGradient: false,
          showValues: true,
          showLegend: true,
        } //default options for the graph

        options = $.extend(options, parameters); //merge the parameters to the default options

        var margin = options.margin,
          width = options.width - margin.left - margin.right,
          height = options.height - margin.top - margin.bottom;

        var x = d3.scaleLinear()
          .range([0, width]);

        var y = d3.scaleBand()
          .range([height, 0])
          .padding(0.1);

        var xAxis = d3.axisBottom(x)
          .tickSize(-height)
          .tickSizeOuter(0);

        var yAxis = d3.axisLeft(y)

        var numberFormat = d3.format(".3");

        d3.select(tag).select("svg").remove();
        d3.selectAll(".tooltip" + tag.substring(1)).remove();

        var svg = d3.select(tag).append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom)
          .style("user-select", "none")
          .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);

        var tooltip = d3.select("body").append("div")
          .attr("class", "tooltip" + tag.substring(1))
          .style("opacity", 0)
          .style("position", "absolute")
          .style("background-color", "white")
          .style("color", "rgba(0,0,0,0.87)")
          .style("border", "solid black")
          .style("border-width", "1px")
          .style("border-radius", "5px")
          .style("padding", "5px")
          .style("font-size", "10px");

        if (data.length === 0) {
          svg.append('text')
            .attr("x", (width * .3))
            .attr("y", (height * .3))
            .style("text-anchor", "middle")
            .style("font-size", 20)
            .style("font-weight", "bold")
            .text(gettextCatalog.getString('No Data Avalaible'))
          return;
        }

        if (options.sort) {
          data.sort(function(a, b) {
            return a['value'] - b['value']
          })
        }

        var newCategories = [];
        var filtered = []; //to control legend selections
        var categoriesNames = data.map((d) => {
          return d.category;
        });
        var values = data.map((d) => {
          return d.value;
        });
        var color = d3.scaleOrdinal()
          .range(options.color)

        if (options.colorGradient) {
          color = d3.scaleLinear()
            .range(options.color)
            .domain(d3.extent(values))
            .interpolate(d3.interpolateHcl)
        }

        y.domain(categoriesNames);
        x.domain([0, d3.max(values)]).nice();
        if (options.forceDomainX) {
          x.domain([options.forceDomainX.min, options.forceDomainX.max]).nice()
        }

        svg.append("g")
          .attr("class", "xAxis")
          .attr("transform", `translate(0,${height})`)
          .call(xAxis);

        if (options.xLabel) {
          svg.append("text")
            .attr("x", width / 2)
            .attr("y", height)
            .attr("dy", "3em")
            .attr("font-size", 10)
            .style("text-anchor", "middle")
            .text(options.xLabel);
        }

        svg.append("g")
          .attr("class", "yAxis")
          .call(yAxis)

        svg.selectAll(".yAxis").selectAll("text")
          .call(wrap, margin.left);

        customizeTicks();

        var category = svg.selectAll(".category")
          .data(data)
          .enter().append("g")
          .attr("class", (d) => {
            return "category " + d.category.replace(/\s/g, '')
          })
          .attr("transform", function(d) {
            return `translate(1,0)`;
          })
          .on("mouseover", mouseover)
          .on("mousemove", function(d) {
            mousemove(d, this)
          })
          .on("mouseleave", mouseleave);

        if(options.onClickFunction){
          category
              .on("mousedown", function() { mouseleave() })
              .on("click", options.onClickFunction);
        }

        category.append("rect")
          .attr("height", y.bandwidth())
          .attr("y", (d) => {
            return y(d.category);
          })
          .style("fill", (d) => {
            return setColor(d)
          })
          .attr("x", () => {
            return x(0);
          })
          .attr("width", () => {
            return x(0);
          });

        category.selectAll("rect")
          .transition()
          .attr("width", (d) => {
            return x(d.value);
          })
          .duration(500);


        if (options.showValues) {
          category.append("text")
            .attr("dx", "1em")
            .attr("transform", d => {
              return `translate(${x(0)},${y(d.category)})`;
            })
            .attr("y", y.bandwidth() / 2)
            .attr("text-anchor", "start")
            .attr("font-size", 10)
            .attr("font-weight", "bold")
            .attr("opacity", 0)
            .text((d) => {
              return numberFormat(d.value);
            });

          category.selectAll("text")
            .transition()
            .attr("transform", d => {
              return `translate(${x(d.value)},${y(d.category)})`;
            })
            .attr("opacity", 1)
            .duration(500);
        }

        if (options.showLegend) {
          var legend = svg.selectAll(".legend")
            .data(data.reverse())
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => {
              return `translate(${margin.right},${i * 20})`;
            })

          legend.append("rect")
            .attr("x", width - margin.right + 10)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", (d) => {
              return setColor(d)
            })
            .attr("stroke", (d) => {
              return setColor(d)
            })
            .attr("id", (d) => {
              return d.category.replace(/\s/g, '');
            })
            .on("click", function() {
              newCategories = getNewCategories(this);
              updateChart(newCategories);
            });

          legend.append("text")
            .attr("x", width - margin.right + 35)
            .attr("y", 9)
            .attr("dy", ".35em")
            .attr("font-size", 10)
            .text((d) => {
              return d.category
            });
        }

        function setColor(d) {
          if (options.colorGradient) {
            let hexColor = d3.color(color(d.value)).formatHex()
            return hexColor
          } else {
            let hexColor = d3.color(color(d.value)).formatHex()
            return hexColor
          }
        }

        function getNewCategories(d) {
          id = d.id;

          if (filtered.indexOf(id) == -1) {
            filtered.push(id);
          } else {
            filtered.splice(filtered.indexOf(id), 1);
          }

          var newCategories = [];
          categoriesNames.forEach((d) => {
            if (filtered.indexOf(d.replace(/\s/g, '')) == -1) {
              newCategories.push(d);
            }
          })

          if (newCategories.length < 1) {
            newCategories = categoriesNames;
            filtered = [];
          }

          legend.selectAll("rect")
            .transition()
            .attr("fill", (d) => {
              if (filtered.length) {
                if (filtered.indexOf(d.category.replace(/\s/g, '')) == -1) {
                  return setColor(d);
                } else {
                  return "white";
                }
              } else {
                return setColor(d);
              }
            })
            .duration(100);

          return newCategories;
        };

        function customizeTicks() {
          var yTicks = svg.selectAll(".xAxis").selectAll(".tick")
          yTicks.selectAll("line")
            .attr("opacity", 0.7)
            .attr("transform", `translate(1,0)`)
            .attr("stroke", "lightgrey");
        }

        function updateChart(newCategories) {
          y.domain(newCategories);
          x.domain([0, d3.max(data, (d) => {
              if (filtered.indexOf(d.category.replace(/\s/g, '')) == -1)
                return d.value;
            })])
            .nice();

          if (options.forceDomainX) {
            x.domain([options.forceDomainX.min, options.forceDomainX.max]).nice()
          }

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

          categories.filter((d) => {
              return newCategories.indexOf(d.category) == -1;
            })
            .style("visibility", "hidden");

          categories.filter((d) => {
              return newCategories.indexOf(d.category) > -1;
            })
            .transition()
            .style("visibility", "visible")
            .duration(500);

          var categoriesBars = categories.selectAll("rect");
          var categoriesText = categories.selectAll("text")

          categoriesBars.filter((d) => {
              return filtered.indexOf(d.category.replace(/\s/g, '')) > -1;
            })
            .transition()
            .attr("x", function() {
              return (+d3.select(this).attr("y")) + (+d3.select(this).attr("height")) / 2;
            })
            .attr("height", 0)
            .attr("width", 0)
            .attr("x", () => {
              return x(0)
            })
            .duration(500);

          categoriesText.filter((d) => {
              return filtered.indexOf(d.category.replace(/\s/g, '')) > -1;
            })
            .transition()
            .style("opacity", 0)
            .duration(500);

          categoriesBars.filter((d) => {
              return filtered.indexOf(d.category.replace(/\s/g, '')) == -1;
            })
            .transition()
            .attr("x", (d) => {
              return x(0);
            })
            .attr("height", y.bandwidth())
            .attr("y", (d) => {
              return y(d.category);
            })
            .attr("width", (d) => {
              return x(d.value);
            })
            .style("opacity", 1)
            .duration(500);

          categoriesText.filter((d) => {
              return filtered.indexOf(d.category.replace(/\s/g, '')) == -1;
            })
            .transition()
            .attr("transform", d => {
              return `translate(${x(d.value)},${y(d.category)})`;
            })
            .attr("y", y.bandwidth() / 2)
            .style("opacity", 1)
            .text((d) => {
              return numberFormat(d.value);
            })
            .duration(500);
        }

        function mouseover() {
          tooltip
            .style("z-index", "100")
            .style("opacity", 0.9);
        }

        function mousemove(d, element) {
          let elementRect = element.getBoundingClientRect();
          let tooltipText = "";
          if (filtered.indexOf(d.category.replace(/\s/g, '')) == -1) {
            tooltipText =
              tooltipText +
              ("<tr><td><div style=width:10px;height:10px;background-color:" + setColor(d) +
                "></div></td><td>" + d.category +
                "</td><td><b>" + numberFormat(d.value) + "</td></tr>");
          }
          tooltip
            .html("<table><tbody>" + tooltipText + "</tbody></table>")
            .style("left", elementRect.right + 10 + "px")
            .style("top", elementRect.top + (elementRect.height / 2) - tooltip.property('clientHeight') / 2 + "px")
        }

        function mouseleave() {
          tooltip
            .style("z-index", "-100")
            .style("opacity", 0)
        }

        function wrap(text, width) {
          var maxLines = Math.round(y.bandwidth()/11.5);
          text.each(function() {
            var text = d3.select(this),
              maxLinesTextSplited = Math.ceil(text.node().getComputedTextLength()/(width - 20)),
              words = text.text().split(/\s+/).reverse(),
              word,
              numberChar = Math.round((width - 10)/4),
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
                dy = -0.3 * Math.min(maxLinesTextSplited,maxLines)/2;
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

      }
      return {
        draw: draw
      }
    }]);

})
();

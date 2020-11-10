(function () {

  angular
    .module('ClientApp')
    .factory('DonutChartService', ['gettextCatalog', function (gettextCatalog){

      /*
      * Generate a donut Chart
      * @param tag : string  : tag where to put the svg
      * @param data : JSON  : The data for the graph
      * @param parameters : margin : {top: 20, right: 20, bottom: 30, left: 40}
      *                     width : int : width of the graph
      *                     color : array : colors pallete of series
      *
      */

      function draw(tag, data, parameters){
        var options = {
          margin : {top: 0, right: 0, bottom: 0, left: 0},
          width : 400,
          height : 300,
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin,
            width = options.width - margin.left - margin.right,
            height = options.height - margin.top - margin.bottom;

        d3.select(tag).select("svg").remove();
        d3.selectAll(".tooltip" + tag.substring(1)).remove();

        var svg = d3.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", width + margin.top + margin.bottom)
              .style("user-select","none")
            .append("g")
              .attr("transform", `translate(${width / 2}, ${height / 2})`);

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

        var radius = Math.min(width, height) / 2;
        var color = null;

        var pie = d3.pie()
            .value(function(d) {return d.value; })
            .sort(null);

        var arc = d3.arc()
            .innerRadius(radius - 100)
            .outerRadius(radius - 20);

        //prepare the data
        function prepareData(dataToPrepared){
          if(dataToPrepared.length==1){
            dataToPrepared = dataToPrepared[0];
          }
          else{
            dataToPrepared.forEach(function (d){
              getNodeValue(d);
            });
          }
          return dataToPrepared;
        }

        function drawArcs(dataShown,parent = null, colorOptions = options.colorArcs){
          svg.selectAll("path").remove();
          svg.selectAll("text").remove();
          dataToDisplay = dataShown; //get just the value of arcs without modifiying initial data
          if(parent != true) //add parent to the data to go through the tree
            dataShown['parent']=parent;
          if(dataShown.series)
            dataToDisplay = dataShown.series;
          const  path = svg.selectAll("path").data(pie(dataToDisplay));

          if(dataShown['parent'] !=null){
            svg.append("text")
              .text("🡸 "+ gettextCatalog.getString("Go back"))
              .attr("transform", `translate(${-30},${margin.top})`)
              .style("font-weight", "bold")
              .style("fill", "#006FBA")
              .style("cursor", "pointer")
              .on("click", function(){
                  drawArcs(dataShown['parent'],true); //we call the parent and in the parent data its parent is present
                });
            }
          color =  d3.scaleSequential(d3.interpolateTurbo)
                      .domain([0,dataToDisplay.length]);

          if (options.color) {
            color = d3.scaleOrdinal()
              .range(options.color)
          }

          // Enter new arcs
          path.enter().append("path")
              .attr("fill", (d, i) => color(i))
              .attr("d", arc)
              .attr("stroke", "white")
              .attr("stroke-width", "6px")
              .on("click",function(d) {
                if(d.data.series !== undefined)
                  drawArcs(dataShown[d.index],dataShown)
              })
              .on("mouseover", function() { mouseover() })
              .on("mousemove", function(d) { mousemove(d,this) })
              .on("mouseleave", function() { mouseleave() });
        }
        data = prepareData(data); //first prepared of data
        drawArcs(data); //first drawArcs

        //get the total of each series from a cat
        function getNodeValue(dataToPrepared){
            var count = 0;
            if(dataToPrepared.value===undefined){
              dataToPrepared['value']= 0
              for (var j = 0; j < dataToPrepared.series.length; j++) {
                  dataToPrepared['value'] += getNodeValue(dataToPrepared.series[j]);
              }
            }
            return dataToPrepared.value;
        }

        //tooltip function
        function mouseover() {
           tooltip
              .style("z-index", "100")
              .style("opacity", 0.9);
        }

        function mousemove(d,element) {
          let elementRect = element.getBoundingClientRect();
          let tooltipText = "";
          let label =   d.data.category===undefined ?  d.data['label'] : d.data.category;

          tooltipText =
                  tooltipText +
                  ('<tr><td><div style="width:10px;height:10px;background-color:'+ color(d.index) +
                  '"></div></td><td>'+ label +
                  '</td><td><b>'+ d.value + '</td></tr>');

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


      }
      return {
          draw: draw
      }
    }]);

})
();

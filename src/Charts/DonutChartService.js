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
      *                     barColor : array : colors pallete of series
      *
      */

      function draw(tag, data, parameters){
        options = {
          margin : {top: 15, right: 15, bottom: 30, left: 40},
          width : 400,
          height : 300,
          barColor : ["#D6F107","#FFBC1C","#FD661F"],
        } //default options for the graph

        options=$.extend(options,parameters); //merge the parameters to the default options

        var margin = options.margin,
            width = options.width - margin.left - margin.right,
            height = options.height - margin.top - margin.bottom;

        d3.select(tag).select("svg").remove();

        var svg = d3v5.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", width + margin.top + margin.bottom)
            .append("g")
              .attr("transform", `translate(${width / 2}, ${height / 2})`);

        var radius = Math.min(width, height) / 2;

        var pie = d3v5.pie()
            .value(function(d) {return d.value; })
            .sort(null);

        var arc = d3v5.arc()
            .innerRadius(radius - 100)
            .outerRadius(radius - 20);

        //prepare the data
        function prepareData(dataToPrepared){
          dataToPrepared.forEach(function (d){
            getNodeValue(d);
          });
        }

        function drawArcs(dataShown, colorOptions = options.colorArcs){
          console.log(dataShown);
          svg.selectAll("path").remove()
          const path = svg.selectAll("path").data(pie(dataShown));
          var color =  d3v5.scaleSequential(d3v5.interpolateTurbo)
                      .domain([0,dataShown.length]);

          // Enter new arcs
          path.enter().append("path")
              .attr("fill", (d, i) => color(i))
              .attr("d", arc)
              .attr("stroke", "white")
              .attr("stroke-width", "6px")
              .on("click",function(d) {
                if(dataShown[d.index].series !== undefined)
                  drawArcs(dataShown[d.index].series)
              });
        }
        prepareData(data); //first prepared of data
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

      }
      return {
          draw: draw
      }
    }]);

})
();

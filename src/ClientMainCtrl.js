(function () {

    angular
        .module('ClientApp')
        .controller('ClientMainCtrl', [
            '$scope', '$rootScope', '$state', '$mdSidenav', '$mdMedia', '$mdDialog', 'gettextCatalog', 'UserService',
            'ClientAnrService', 'toastr',
            ClientMainCtrl
        ]);

    /**
     * Main Controller for the Client module
     */
    function ClientMainCtrl($scope, $rootScope, $state, $mdSidenav, $mdMedia, $mdDialog, gettextCatalog, UserService,
                            ClientAnrService, toastr) {
        if (!UserService.isAuthenticated() && !UserService.reauthenticate()) {
            setTimeout(function () {
                $state.transitionTo('login');
            }, 1);

            return;
        }

        $rootScope.appVersionCheckingTimestamp = new Date().getTime();

        $rootScope.BreadcrumbAnrHackLabel = '_';
        $rootScope.isAllowed = UserService.isAllowed;
        gettextCatalog.debug = true;

        $scope.sidenavIsOpen = $mdMedia('gt-md');
        $scope.isLoggingOut = false;

        // Translations helper
        $scope.setLang = function (lang) {
            gettextCatalog.setCurrentLanguage(lang);
        };

        // Toolbar helpers
        $scope.openToolbarMenu = function ($mdOpenMenu, ev) {
            $mdOpenMenu(ev);
        };

        $scope.logout = function () {
            $scope.isLoggingOut = true;

            UserService.logout().then(
                function () {
                    $scope.isLoggingOut = false;
                    $state.transitionTo('login');
                },

                function () {
                    // TODO
                    $scope.isLoggingOut = false;
                }
            )
        };

        // Sidenav helpers
        $scope.closeLeftSidenav = function () {
            $scope.sidenavIsOpen = false;
            $mdSidenav('left').close();
        };
        $scope.openLeftSidenav = function () {
            if ($mdMedia('gt-md')) {
                $scope.sidenavIsOpen = true;
            }
            $mdSidenav('left').open();
        };

        // Menu actions
        $scope.sidebarCreateNewANR = function (ev) {
            $mdDialog.show({
                controller: ['$scope', '$mdDialog', '$http', '$q', 'ConfigService', 'ModelService',
                    'ClientAnrService', 'ReferentialService', CreateRiskAnalysisDialog],
                templateUrl: 'views/dialogs/create.anr.html',
                clickOutsideToClose: false,
                targetEvent: ev,
                scope: $rootScope.$dialogScope.$new()
            })
                .then(function (anr) {
                    $scope.clientAnrIsCreating = true;

                    if (anr.sourceType == 1) {
                        // SMILE model
                        ClientAnrService.createAnrFromModel(anr, function (data) {
                            updateMenuANRs();

                            // Redirect to ANR
                            $state.transitionTo('main.project.anr', {modelId: data.id});
                            toastr.success(gettextCatalog.getString('The risk analysis has been successfully created from the model.'), gettextCatalog.getString('Creation successful'));
                        });
                    } else if (anr.sourceType == 2) {
                        // Existing source
                        ClientAnrService.duplicateAnr(anr, function (data) {
                            updateMenuANRs();

                            // Redirect to ANR
                            $state.transitionTo('main.project.anr', {modelId: data.id});
                            toastr.success(gettextCatalog.getString('The risk analysis has been successfully duplicated.'), gettextCatalog.getString('Duplication successful'));
                        });
                    }
                });
        };

        $scope.deleteClientAnrGlobal = function (ev, anr, cb) {
            var confirm = $mdDialog.confirm()
                .title(gettextCatalog.getString('Are you sure you want to delete the risk analysis?',
                    {label: $scope._langField(anr,'label')}))
                .textContent(gettextCatalog.getString('This operation is irreversible.'))
                .targetEvent(ev)
                .ok(gettextCatalog.getString('Delete'))
                .theme('light')
                .cancel(gettextCatalog.getString('Cancel'));
            $mdDialog.show(confirm).then(function() {
                ClientAnrService.deleteAnr(anr.id,
                    function () {
                        updateMenuANRs();
                        toastr.success(gettextCatalog.getString('The risk analysis has been deleted.'), gettextCatalog.getString('Deletion successful'));

                        if (cb) {
                            cb();
                        }
                    }
                );
            });
        };

        $rootScope.$on('fo-anr-changed', function () {
            updateMenuANRs();
        })

        // Menu ANRs preloading
        var updateMenuANRs = function () {
            ClientAnrService.getAnrs().then(function (data) {
                $scope.clientAnrIsCreating = false;
                $scope.clientAnrs = [];

                for (var i = 0; i < data.anrs.length; ++i) {
                    var anr = data.anrs[i];
                    if (anr.rwd >= 0) {
                        $scope.clientAnrs.push(anr);
                    }
                }

                $scope.clientAnrs.sort(function (a, b) {
                    let anrLabelA = a['label' + a['language']].toLowerCase()
                    let anrLabelB = b['label' + b['language']].toLowerCase();
                    if (anrLabelA < anrLabelB)  {return -1;}
                    if (anrLabelA > anrLabelB)  {return 1;}
                    return 0;
                });

                $scope.clientCurrentAnr = null;
                for (var i = 0; i < $scope.clientAnrs.length; ++i) {
                    if ($scope.clientAnrs[i].isCurrentAnr) {
                        $scope.clientCurrentAnr = $scope.clientAnrs[i];
                        break;
                    }
                }
            });
        };

        updateMenuANRs();

        /**
        * Exemple Data
        */

        dataSample = [
          {category:'ANR 1',
            series: [
              {label:"Low risks", value:50},
              {label:"Medium risks",value:30},
              {label:"High risks", value:10}
            ]
          },
          {category:'ANR 2',
            series: [
              {label:"Low risks", value:40},
              {label:"Medium risks", value:20},
              {label:"High risks", value:5}
            ]
          },
          {category:'ANR 3',
            series: [
              {label:"Low risks", value:20},
              {label:"Medium risks", value:12},
              {label:"High risks", value:45}
            ]
          },
          {category:'ANR 4',
            series: [
              {label:"Low risks", value:35},
              {label:"Medium risks", value:20},
              {label:"High risks", value:16}
            ]
          },
          {category:'ANR 5',
            series: [
              {label:"Low risks", value:17},
              {label:"Medium risks", value:23},
              {label:"High risks", value:16}
            ]
          },
          {category:'ANR 6',
            series: [
              {label:"Low risks", value:32},
              {label:"Medium risks", value:27},
              {label:"High risks", value:2}
            ]
          },
          {category:'ANR 7',
            series: [
              {label:"Low risks", value:32},
              {label:"Medium risks", value:5},
              {label:"High risks",value:1}
            ]
          }
        ];

        dataSampleTimeGraphForOneAnr = [
          {
            category:'ANR 1',
            series : [
              {
                category:"low risks",
                series:[
                  {label:"2019-05-04", value:50},
                  {label:"2020-05-05",value:40},
                  {label:"2020-05-06", value:30}
                ]
              },
              {
                category:"medium risks",
                series:[
                  {label:"2019-05-04", value:40},
                  {label:"2020-05-05",value:30},
                  {label:"2020-05-06", value:20}
                ]
              },
              {
                category:"high risks",
                series:[
                  {label:"2019-05-04", value:30},
                  {label:"2020-05-05",value:20},
                  {label:"2020-05-06", value:10}
                ]
              }
            ]
          },
          {
            category:'ANR2',
            series : [
              {
                category:"low risks",
                series:[
                  {label:"2019-05-04", value:10},
                  {label:"2020-05-05",value:30},
                  {label:"2020-05-06", value:50}
                ]
              },
              {
                category:"medium risks",
                series:[
                  {label:"2019-05-04", value:20},
                  {label:"2020-05-05",value:30},
                  {label:"2020-05-06", value:40}
                ]
              },
              {
                category:"high risks",
                series:[
                  {label:"2019-05-04", value:30},
                  {label:"2020-05-05",value:40},
                  {label:"2020-05-06", value:50}
                ]
              }
            ]
          }
        ];

        /***
        * GRAPH PARTS
        */


        /*
        * Generate a groupedBarChart
        * @param tag : string  : tag where to put the svg
        * @param data : JSON  : The data for the graph
        * @param parameters : margin : {top: 20, right: 20, bottom: 30, left: 40}
        *                     width : int : width of the graph
        *                     height : int of the graph
        *
        */

        function barChart(tag, data, parameters){
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

          var x0 = d3.scale.ordinal()
              .rangeRoundBands([0, width], .1);

          var x1 = d3.scale.ordinal();

          var y = d3.scale.linear()
              .range([height, 0]);

          var xAxis = d3.svg.axis()
              .scale(x0)
              .orient("bottom");

          var yAxis = d3.svg.axis()
              .scale(y)
              .orient("left")
              .tickSize(-width, 0, 0);

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
             .style("z-index", "100")
             .style("background-color", "white")
             .style("color","rgba(0,0,0,0.87)")
             .style("border", "solid black")
             .style("border-width", "1px")
             .style("border-radius", "5px")
             .style("padding", "5px")
             .style("font-size", "10px");

          var categoriesNames = data.map(function(d) { return d.category; });
          var seriesNames = data[0].series.map(function(d) { return d.label; });
          const radioButton = d3.selectAll('input[name="chartMode"]');
          var filterCategories = d3.selectAll(".filter-categories");
          var filtered = []; //to control legend selections
          var newCategories = [];
          var newSeries = [];
          var newData = [];

          data.map(function(cat){
            cat.series.forEach(function(d){
              d.category = cat.category;
            });
          });

          x0.domain(categoriesNames);
          x1.domain(seriesNames).rangeRoundBands([0, x0.rangeBand()]);
          y.domain([0, d3.max(data, function(category) { return d3.max(category.series.map(function(d){return d.value;}))})]).nice();

          svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis)
              .select(".domain").remove();

          svg.append("g")
              .attr("class", "y axis")
              .style('fill', 'black')
              .style('stroke', '#000')
              .style('stroke-width', 0.4)
              .style('shape-rendering', 'crispEdges')
              .call(yAxis)
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
              .attr("transform",function(d) { return "translate(" + x0(d.category) + ",0)"; })
              .on("mouseover", function() { mouseover() })
              .on("mousemove", function(d) { mousemove(d,this) })
              .on("mouseleave", function() { mouseleave() });

          category.selectAll("rect")
              .data(function(d) { return d.series; })
            .enter().append("rect")
              .attr("width", x1.rangeBand())
              .attr("x", function(d) { return x1(d.label); })
              .style("fill", function(d) { return color(d.label) })
              .attr("y", function() { return y(0); })
              .attr("height", function() { return height - y(0); });

          category.selectAll("rect")
              .transition()
              .delay(function () {return Math.random()*1000;})
              .duration(1000)
              .attr("y", function(d) { return y(d.value); })
              .attr("height", function(d) { return height - y(d.value); });

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
                  chartMode = d3.selectAll('input:checked').node().value;
                  updateChart (chartMode);
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
              x0.domain(newCategories);
              x1.domain(newSeries).rangeRoundBands([0, x0.rangeBand()]);
              y.domain([0, d3.max(newData, function(category) {
                  return d3.max(category.series.map(function(d){
                    if (filtered.indexOf(d.label.replace(/\s/g, '')) == -1)
                    return d.value;
                  }))
                })])
                .nice();

              svg.select(".x")
                .call(xAxis)
                .select(".domain").remove();

              svg.select(".y")
                .transition()
                .call(yAxis)
                .duration(500);

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
                   .attr("transform",function(d) { return "translate(" + x0(d.category) + ",0)"; })
                   .duration(500);

              var categoriesBars = categories.selectAll("rect");

              categoriesBars.filter(function(d) {
                      return filtered.indexOf(d.label.replace(/\s/g, '')) > -1;
                   })
                   .transition()
                   .attr("x", function() {
                     return (+d3.select(this).attr("x")) + (+d3.select(this).attr("width"))/2;
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
                  .attr("y", function(d) { return y(d.value); })
                  .attr("height", function(d) { return height - y(d.value); })
                  .attr("width", x1.rangeBand())
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

            y.domain([0, d3.max(maxValues)]).nice();

            svg.select(".x")
              .call(xAxis)
              .select(".domain").remove();

            svg.select(".y")
              .transition()
              .call(yAxis)
              .duration(500)

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
                 .attr("transform",function(d) { return "translate(" + "0" + ",0)"; })
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
              d3.select(this)
                .transition()
                .attr("x",function(d) { return x0(d.category); })
                .attr("width", x0.rangeBand())
                .attr("y", function(d) { return y(d.y1); })
                .attr("height", function(d) { return y(d.y0) - y(d.y1); })
                .style("opacity", 1)
                .duration(500);
            })
          }

          function mouseover() {
             tooltip
                .style("opacity", 0.9);
          }

          function mousemove(d,element) {
            var tooltipText = "";
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
              .style("left", element.getBoundingClientRect().left - tooltip.property('clientWidth')/3 + "px")
              .style("top", element.getBoundingClientRect().top - tooltip.property('clientHeight') + "px")

          }

          function mouseleave() {
            tooltip
              .style("opacity", 0)
          }

          function updateCategories() {
            newCategories = []
            d3.selectAll(".filter-categories").each(function(){
              cat = d3.select(this);
              if(cat.property("checked")){
                newCategories.push(cat.attr("value"));
              }
            });

            $scope.categoriesSelected = newCategories;

            if(newCategories.length > 0){
              newData = data.filter(function(d){return newCategories.includes(d.category);});
            }else {
              newData = data;
            }

            chartMode = d3.selectAll('input:checked').node().value;
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

        /*
        * Generate a lineBarChart
        * @param tag : string  : tag where to put the svg
        * @param data : JSON  : The data for the graph
        * @param parameters : margin : {top: 20, right: 20, bottom: 30, left: 40}
        *                     width : int : width of the graph
        *                     height : int of the graph
        *                     lineColor : set of Color to draw the line
        *                     legendSize : width of the graph for the legend
        *
        */
        function lineChart(tag, data, parameters){
          options = {
            margin : {top: 30, right: 100, bottom: 30, left: 40},
            width : 400,
            height : 300,
            lineColor : ["#D6F107","#FFBC1C","#FD661F"],
            legendSize : 80,
            externalFilter : null,
          } //default options for the graph

          options=$.extend(options,parameters); //merge the parameters to the default options
          var margin = options.margin;
              width = options.width - margin.left - margin.right,
              height = options.height - margin.top - margin.bottom;

          var svg = d3.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");


          var x = d3.time.scale()
              .range([0, width -options.legendSize]);

          var y = d3.scale.linear()
              .range([height, 0]);

          var xAxis = d3.svg.axis()
              .scale(x)
              //.ticks(d3.time.month,1)
              .tickSize(1)
              .orient("bottom");

          var yAxis = d3.svg.axis()
              .scale(y)
              .orient("left")
              .tickSize(1);
          var parseDate = d3.time.format("%Y-%m-%d");

          var line = d3.svg.line()
              .x(function(d) { return x(parseDate.parse(d.label)); })
              .y(function(d) { return y(d.value); });


          // Set the scales range
          var maxY = 0; // the max for Y axis
          var rangeX = []; // the date range for X axis
          var subCategories = []; //list of all subcategories
          var numberOfCategories = 0; // if there is only one category the filter can be different
          var categories = []; //list of all the categories
          var categoriesFilter = []; //list of filter for categories
          //prepare the initial data
          data.map(function(cat){
            numberOfCategories++;
            //categories.push(cat.category);
            cat.series.forEach(function(subcat){
              categories[cat.category]= [];
              categoriesFilter[cat.category]=[];
              if(subCategories.indexOf(subcat.category)===-1)
                subCategories.push(subcat.category);
              subcat.series.forEach(function(d){
                if(maxY<d.value)
                  maxY = d.value;
                if(rangeX.indexOf(d.label)===-1)
                  rangeX.push(d.label);
              });
            categories[cat.category]=subCategories.slice();
            categoriesFilter[cat.category]=subCategories.slice();
            });
          });

          //convert the text to date
          rangeX = rangeX.map(function(elt){
            return parseDate.parse(elt);
          })
          // if we don't have enough color we add some
          if(subCategories.length > options.lineColor.length && numberOfCategories==1)
            for(i=options.lineColor.length; i <= subCategories.length; i++)
            {
              options.lineColor.push('#'+(Math.random()*0xFFFFFF<<0).toString(16));
            }
          if(numberOfCategories !=1 && Object.keys(categories).length > options.lineColor.length){
            console.log(Object.keys(categories).length )
            for(i=options.lineColor.length; i <= subCategories.length; i++)
            {
              options.lineColor.push('#'+(Math.random()*0xFFFFFF<<0).toString(16));
            }
          }

          y.domain([0,maxY]);
        //  x.domain(d3.extent(rangeX, function(d) { return parseDate(d.label); }));
          x.domain(rangeX);

          //manage the ledend and the layout
          var legend = svg.append("g")
               .attr("class", "legend")
               .attr("x",width -50)
               .attr("y", 25)
               .attr("height", 100)
               .attr("width", 100);

              var subIndex = 0;
              legend.selectAll('g').data(Object.keys(categories))
                 .enter()
                 .append('g')
                 .each(function(d, i) {
                    var g = d3.select(this);
                    g.append("rect")
                       .attr("x", width - 65)
                       .attr("y", (i+subIndex)*25)
                       .attr("width", 18)
                       .attr("height", 18)
                       .on('click', function(){
                         legendOnClick(Object.keys(categories)[i],null);
                       })
                       .style("fill", options.lineColor[i]);

                    g.append("text")
                       .attr("x", width - 45)
                       .attr("y", (i+subIndex) * 25 + 15)
                       .attr("height",30)
                       .attr("width",100)
                       .style("fill", 'black')
                       .text(Object.keys(categories)[i]);

                    categories[Object.keys(categories)[i]].forEach(function(sc,j) {
                      subIndex++;
                      indexColor = i;
                      opacityIndex = 1;
                      if(numberOfCategories==1){//if there is only one category, dispatch the predefine color for subCat
                        indexColor = j;
                      }
                      else{ //make a gradiant in the color
                        opacityIndex = (j+1)/categories[Object.keys(categories)[i]].length;
                      }
                      g.append("rect")
                         .attr("x", width - 40)
                         .attr("y", (i+subIndex)*25)
                         .attr("width", 18)
                         .attr("height", 18)
                         .on('click', function(){
                           legendOnClick(Object.keys(categories)[i],sc);
                         })
                         .style("opacity", opacityIndex)
                         .style("fill", options.lineColor[indexColor]);

                      g.append("text")
                         .attr("x", width - 15)
                         .attr("y", (i+subIndex) * 25 + 15)
                         .attr("height",30)
                         .attr("width",100)
                         .style("fill", 'black')
                         .text(sc);
                    });
                  });

        function legendOnClick(categClick,subCategClick, checkedInput = null) {
          if(subCategClick == null)//we want to hide/show categ totally
          {
              if(categoriesFilter[categClick].length>0)
                categoriesFilter[categClick] = [];
              else
                categoriesFilter[categClick]=categories[categClick].slice();
          }else if(categClick == null){ //we want to hide/show a subcateg
            for (var cle in categoriesFilter) {
                if (categoriesFilter.hasOwnProperty(cle)) {
                  presentSubCateg = categoriesFilter[cle].indexOf(subCategClick);
                  if(presentSubCateg>-1 && checkedInput === false){
                    categoriesFilter[cle].splice(presentSubCateg,1);
                  }else if(presentSubCateg==-1 && checkedInput === true){
                    categoriesFilter[cle].push(subCategClick);
                  }
                }
            }
          }
          else { //we just want to hide/show a specific subcatef for one catef
              presentSubCateg = categoriesFilter[categClick].indexOf(subCategClick);
              if(presentSubCateg>-1){
                categoriesFilter[categClick].splice(presentSubCateg,1);
              }else{
                categoriesFilter[categClick].push(subCategClick);
              }
          }
          drawLine(categoriesFilter);
        }

          //draw the lines
          function drawLine(inputFilter){
            d3.select(tag).selectAll('.line').remove();
            data.map(function(cat,catIndex){
                if(Object.keys(inputFilter).indexOf(cat.category ) > -1){
                  cat.series.forEach(function(subcat, index){
                    if(inputFilter[cat.category].indexOf(subcat.category ) > -1 && numberOfCategories ==1)
                      svg.append("path")
                      //.append("path_"+cat.category.replace(/ /g,"")+'_'+subcat.category.replace(/ /g,""))
                          .attr("class", "line")
                          .style("fill","none")
                          .attr("stroke", options.lineColor[index])
                          .attr("stroke-width", 2)
                          .attr("d", line(subcat.series));
                    if(inputFilter[cat.category].indexOf(subcat.category ) > -1 && numberOfCategories !=1){
                      opacityIndex = (index+1)/cat.series.length;
                      svg.append("path")
                      //.append("path_"+cat.category.replace(/ /g,"")+'_'+subcat.category.replace(/ /g,""))
                          .attr("class", "line")
                          .style("fill","none")
                          .style("opacity", opacityIndex)
                          .attr("stroke", options.lineColor[catIndex])
                          .attr("stroke-width", 2)
                          .attr("d", line(subcat.series));
                      }
                  });
                }
            });
          }

          if(options.externalFilter){ // check if we have set an external filter
            var filterSubCategories = d3.selectAll(options.externalFilter);
            filterSubCategories.on('change', function() {
              legendOnClick(null,this.value,this.checked);
            });
          }

          //draw other stuff
          svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .attr("opacity", 0.7)
              .attr("stroke", "lightgrey")
              .style('fill', 'black')
              .style('stroke', '#000')
              .style('shape-rendering', 'crispEdges')
              .style('stroke-width', 0.4)
              .call(xAxis
                //.tickFormat(d3.time.format("%B %y"))
              );
              //.select(".domain").remove();

          svg.append("g")
              .attr("class", "y axis")
              .attr("opacity", 0.7)
              .attr("stroke", "lightgrey")
              .style('fill', 'black')
              .style('stroke', '#000')
              .style('shape-rendering', 'crispEdges')
              .style('stroke-width', 0.4)
              .call(yAxis);

          drawLine(categories);

        }

        $scope.categoriesSelected = [];
        $scope.categories = dataSample.map(function(d) { return d.category; });
        $scope.subCategories = [];
        dataSampleTimeGraphForOneAnr.map(function(cat){
          cat.series.forEach(function(subcat){
            if($scope.subCategories.indexOf(subcat.category)===-1)
              $scope.subCategories.push(subcat.category);
          });
        });

        $scope.selectGraphRisks = function () {
            options = {'width':450,'height':300}

            barChart('#graphGlobalRisk',dataSample,options);
        };

        $scope.selectGraphThreats = function () {
            options2 = {'width':1000,'height':500,'lineColor':["#1d19eb"],'externalFilter':".filter-subCategories"}
            lineChart('#graphLineChart',dataSampleTimeGraphForOneAnr,options2);
        };


    }

})();

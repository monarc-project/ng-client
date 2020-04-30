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
              {label:"Low risks", value:60},
              {label:"Medium risks", value:37},
              {label:"High risks", value:8}
            ]
          },
          {category:'ANR 4',
            series: [
              {label:"Low risks", value:25},
              {label:"Medium risks", value:5},
              {label:"High risks",value:1}
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
            margin : {top: 30, right: 100, bottom: 30, left: 40},
            width : 400,
            height : 300,
            barColor : ["#D6F107","#FFBC1C","#FD661F"],
          } //default options for the graph

          options=$.extend(options,parameters); //merge the parameters to the default options

          var margin = options.margin,
              width = options.width - margin.left - margin.right,
              height = options.height - margin.top - margin.bottom;

          var x = d3.scale.ordinal()
              .rangeRoundBands([0, width], .1);

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

          var categoriesNames = data.map(function(d) { return d.category; });
          var seriesNames = data[0].series.map(function(d) { return d.label; });
          const radioButton = d3.selectAll('input[name="chartMode"]');
          var filtered = []; //to control legend selections
          var newSeries = [];

          data.map(function(cat){
            cat.series.forEach(function(d){
              d.category = cat.category;
            });
          });

          x.domain(categoriesNames);
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
              .style('fill', 'none')
              .style('stroke', '#000')
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
              .attr("class", "category")
              .attr("transform",function(d) { return "translate(" + x0(d.category) + ",0)"; });

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
                if (chartMode == 'grouped') {
                  updateGroupedChart(newSeries)
                }else{
                  updateStackedChart()
                }});

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

          function updateGroupedChart(newSeries) {
              x1.domain(newSeries).rangeRoundBands([0, x0.rangeBand()]);
              y.domain([0, d3.max(data, function(category) {
                  return d3.max(category.series.map(function(d){
                    if (filtered.indexOf(d.label.replace(/\s/g, '')) == -1)
                    return d.value;
                  }))
                })])
                .nice();

              svg.select(".y")
                .transition()
                .call(yAxis)
                .duration(500);

              svg.selectAll(".tick").selectAll("line")
                  .attr("opacity", 0.7)
                  .attr("stroke", "lightgrey");

              svg.selectAll(".category")
                .transition()
                .attr("transform",function(d) { return "translate(" + x0(d.category) + ",0)"; })
                .duration(500);

              var categories = svg.selectAll(".category").selectAll("rect");

              categories.filter(function(d) {
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

              categories.filter(function(d) {
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

          function updateStackedChart() {
            var dataFiltered = data.map(function(cat){
                          return cat.series.filter(function(serie){
                            return filtered.indexOf(serie.label.replace(/\s/g, '')) == -1
                          })
                        });
                        
            var maxValues = dataFiltered.map(x => x.map(d => d.value).reduce((a, b) => a + b, 0));

            y.domain([0, d3.max(maxValues)]).nice();

            svg.select(".y")
              .transition()
              .call(yAxis)
              .duration(500)

            svg.selectAll(".tick").selectAll("line")
                .attr("opacity", 0.7)
                .attr("stroke", "lightgrey");

            svg.selectAll(".category")
                  .transition()
                  .attr("transform", function() { return "translate(" + "0" + ",0)"; })
                  .duration(500);

            var categories = svg.selectAll(".category").selectAll("rect");

            categories.filter(function(d) {
                    return filtered.indexOf(d.label.replace(/\s/g, '')) > -1;
                 })
                 .transition()
                 .style("opacity", 0)
                 .duration(500);

            var categoriesSelected = categories.filter(function(d) {
                                  return filtered.indexOf(d.label.replace(/\s/g, '')) == -1;
                                  })

            categoriesSelected.each(function(d,i){
              if (i == 0) y0 = 0;
                d.y0 = y0;
                d.y1 = y0 += +d.value;
              d3.select(this)
                .transition()
                .attr("x",function(d) { return x(d.category); })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return y(d.y1); })
                .attr("height", function(d) { return y(d.y0) - y(d.y1); })
                .style("opacity", 1)
                .duration(500);
            })
          }

          radioButton.on('change', function() {
            var chartMode = this.value;
            if (chartMode == 'grouped') {
              if (newSeries.length == 0) newSeries = seriesNames
              updateGroupedChart(newSeries);
            } else{
              updateStackedChart();
            }
          });
        }

        options = {'width':450,'height':300}

        $scope.selectGraphRisks = function () {
            barChart('#graphGlobalRisk',dataSample,options);
        };



    }

})();

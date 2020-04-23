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
                    // console.log("Error while logging out!");
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

        dataSample1 =
        [
          {
              "categorie": "Analysis 1",
              "values": [
                  {
                      "value": 1,
                      "rate": "High"
                  },
                  {
                      "value": 4,
                      "rate": "Medium"
                  },
                  {
                      "value": 12,
                      "rate": "Low"
                  }
              ]
          },
          {
              "categorie": "Analysis 2",
              "values": [
                  {
                      "value": 1,
                      "rate": "High"
                  },
                  {
                      "value": 21,
                      "rate": "Medium"
                  },
                  {
                      "value": 13,
                      "rate": "Low"
                  }
              ]
          },
          {
              "categorie": "Analysis 3",
              "values": [
                  {
                      "value": 3,
                      "rate": "High"
                  },
                  {
                      "value": 22,
                      "rate": "Medium"
                  },
                  {
                      "value": 6,
                      "rate": "Low"
                  }
              ]
          }
      ];

        dataSample2 = [
          {yLabel:'ANR 1', "Low risks": 50, "Medium risk": 30, "High risk": 10},
          {yLabel:'ANR 2', "Low risks": 40, "Medium risk": 20, "High risk": 5},
          {yLabel:'ANR 3', "Low risks": 60, "Medium risk": 37, "High risk": 8},
          {yLabel:'ANR 4', "Low risks": 25, "Medium risk": 5, "High risk": 1}
        ];

        dataSample3 = [
          {yLabel:'Low risks', "ANR 1": 50, "ANR 2": 80, "ANR 3": 60, 'ANR 4':25},
          {yLabel:'Medium risk', "ANR 1": 30, "ANR 2": 20, "ANR 3": 37, 'ANR 4':5},
          {yLabel:'High risk', "ANR 1": 10, "ANR 2": 5, "ANR 3": 8, 'ANR 4':1}
        ];


        /***
        * GRAPH PARTS
        */


        /*
        * Generate a grouppedBarChart
        * @param tag : string  : tag where to put the svg
        * @param dataForTheGraph : JSON  : The data for the graph
        * @param parameters : margin : {top: 20, right: 20, bottom: 30, left: 40}
        *                     width : int : width of the graph
        *                     height : int of the graph
        *
        */

        function grouppedBarChart(tag, dataForTheGraph, parameters){
          options = {'margin' : {top: 0, right: 0, bottom: 0, left: 0},
            'width' : 500,
            'height' : 500,
            'barColor' : ["#FD661F","#FFBC1C","#D6F107"]
          } //default options for the graph
          options=$.extend(options,parameters); //merge the parameters to the default options

          var margin = options['margin'];
              width = options['width']- margin.left - margin.right;
              height = options['height'] - margin.top - margin.bottom;

          var x0 = d3.scale.ordinal()
              .rangeRoundBands([0, width], .1);

          var x1 = d3.scale.ordinal();

          var y = d3.scale.linear()
              .range([height, 0]);

          var xAxis = d3.svg.axis()
              .scale(x0)
              .tickSize(0)
              .orient("bottom");

          var yAxis = d3.svg.axis()
              .scale(y)
              .orient("left");

          var color = d3.scale.ordinal()
              .range(options['barColor']);

            var svg = d3.select(tag).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var categoriesNames = dataForTheGraph.map(function(d) { return d.categorie; });
            var rateNames = dataForTheGraph[0].values.map(function(d) { return d.rate; });

            x0.domain(categoriesNames);
            x1.domain(rateNames).rangeRoundBands([0, x0.rangeBand()]);
            y.domain([0, d3.max(dataForTheGraph, function(categorie) { return d3.max(categorie.values, function(d) { return d.value; }); })]);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .style('opacity','0')
                .call(yAxis)
            .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .style('font-weight','bold')
                .text("Value");

            svg.select('.y').transition().duration(500).delay(1300).style('opacity','1');

            var slice = svg.selectAll(".slice")
                .data(dataForTheGraph)
                .enter().append("g")
                .attr("class", "g")
                .attr("transform",function(d) { return "translate(" + x0(d.categorie) + ",0)"; });

            slice.selectAll("rect")
                .data(function(d) { return d.values; })
            .enter().append("rect")
                .attr("width", x1.rangeBand())
                .attr("x", function(d) { return x1(d.rate); })
                .style("fill", function(d) { return color(d.rate) })
                .attr("y", function(d) { return y(0); })
                .attr("height", function(d) { return height - y(0); })
                .on("mouseover", function(d) {
                    d3.select(this).style("fill", d3.rgb(color(d.rate)).darker(2));
                })
                .on("mouseout", function(d) {
                    d3.select(this).style("fill", color(d.rate));
                });

            slice.selectAll("rect")
                .transition()
                .delay(function (d) {return Math.random()*1000;})
                .duration(1000)
                .attr("y", function(d) { return y(d.value); })
                .attr("height", function(d) { return height - y(d.value); });

            //Legend
            var legend = svg.selectAll(".legend")
                .data(dataForTheGraph[0].values.map(function(d) { return d.rate; }).reverse())
            .enter().append("g")
                .attr("class", "legend")
                .attr("transform", function(d,i) { return "translate(0," + i * 20 + ")"; })
                .style("opacity","0");

            legend.append("rect")
                .attr("x", width - 18)
                .attr("width", 18)
                .attr("height", 18)
                .style("fill", function(d) { return color(d); });

            legend.append("text")
                .attr("x", width - 24)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "end")
                .text(function(d) {return d; });

            legend.transition().duration(500).delay(function(d,i){ return 1300 + 100 * i; }).style("opacity","1");
          }

        function stackedBarChart(tag,data){
          var margin = {top: 20, right: 20, bottom: 30, left: 40},
              width = 400 - margin.left - margin.right,
              height = 300 - margin.top - margin.bottom;

          var x = d3.scale.ordinal()
              .rangeRoundBands([0, width], .1);

          var y = d3.scale.linear()
              .rangeRound([height, 0]);

          var color = d3.scale.ordinal()
              .range(["#D6F107","#FFBC1C","#FD661F"]);

          var xAxis = d3.svg.axis()
              .scale(x)
              .orient("bottom");

          var yAxis = d3.svg.axis()
              .scale(y)
              .orient("left")
              .tickFormat(d3.format(".2s"));

          var svg = d3.select(tag).append("svg")
              .attr("width", width + margin.left + margin.right)
              .attr("height", height + margin.top + margin.bottom)
              .append("g")
              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

          var filtered = []; //to control legend selections
          var legendClassArray = []; //store legend classes to select bars in plotSingle()



          color.domain(d3.keys(data[0]).filter(function(key) { return key !== "yLabel"; }));

          data.forEach(function(d) {
            var myyLabel = d.yLabel; //add to stock code
            var y0 = 0;
            d.values = color.domain().map(function(name) { return {myyLabel:myyLabel, name: name, y0: y0, y1: y0 += +d[name]}; });
            d.total = d.values[d.values.length - 1].y1;

          });

          //data.sort(function(a, b) { return b.total - a.total; });

          x.domain(data.map(function(d) { return d.yLabel; }));
          y.domain([0, d3.max(data, function(d) { return d.total; })]);

          svg.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0," + height + ")")
              .call(xAxis);

          svg.append("g")
              .attr("class", "y axis")
              .call(yAxis)
            .append("text")
              .attr("transform", "rotate(-90)")
              .attr("y", 6)
              .attr("dy", ".71em")
              .style("text-anchor", "end");
              //.text("Population");

          var yLabel = svg.selectAll(".yLabel")
              .data(data)
            .enter().append("g")
              .attr("class", "g")
              .attr("transform", function() { return "translate(" + "0" + ",0)"; });

          yLabel.selectAll("rect")
              .data(function(d) {
                return d.values;
              })
            .enter().append("rect")
              .attr("width", x.rangeBand())
              .attr("y", function(d) { return y(d.y1); })
              .attr("x",function(d) { //add to stock code
                  return x(d.myyLabel)
                })
              .attr("height", function(d) { return y(d.y0) - y(d.y1); })
              .attr("class", function(d) {
                classLabel = d.name.replace(/\s/g, ''); //remove spaces
                return "class" + classLabel;
              })
              .style("fill", function(d) { return color(d.name); });

          yLabel.selectAll("rect")
               .on("mouseover", function(d){

                  var delta = d.y1 - d.y0;
                  var xPos = parseFloat(d3.select(this).attr("x"));
                  var yPos = parseFloat(d3.select(this).attr("y"));
                  var height = parseFloat(d3.select(this).attr("height"))

                  d3.select(this).attr("stroke","blue").attr("stroke-width",0.8);

                  svg.append("text")
                  .attr("x",xPos)
                  .attr("y",yPos +height/2)
                  .attr("class","tooltip")
                  .text(d.name +": "+ delta);

               })
               .on("mouseout",function(){
                  svg.select(".tooltip").remove();
                  d3.select(this).attr("stroke","pink").attr("stroke-width",0.2);

                })


          var legend = svg.selectAll(".legend")
              .data(color.domain().slice().reverse())
            .enter().append("g")
              .attr("class", function (d) {
                legendClassArray.push(d.replace(/\s/g, '')); //remove spaces
                return "legend";
              })
              .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

          //reverse order to match order in which bars are stacked
          legendClassArray = legendClassArray.reverse();

          legend.append("rect")
              .attr("x", width - 18)
              .attr("width", 18)
              .attr("height", 18)
              .style("fill", color)
              .attr("id", function (d) {
                return "id" + d.replace(/\s/g, '');
              })
              .on("click",function(){

                  if (filtered.indexOf(this) == -1) {
                   filtered.push(this);
                  }
                  else {
                    filtered.splice(filtered.indexOf(this), 1);
                  }

                  d3.select(this)
                    .style("stroke", "black")
                    .style("stroke-width", 2);

                  let difference = legendClassArray.filter(x => !filtered.map(y => y.id.split("id").pop()).includes(x));
                  plot(filtered,difference);

                    //gray out the others
                  for (i = 0; i < difference.length; i++) {
                      d3.select("#id" + difference[i])
                        .style("opacity", 0.5)
                        .style("stroke", "none");
                  }

                  for (i = 0; i < filtered.length; i++) {
                      d3.select("#id" + filtered[i].id.split("id").pop())
                        .style("opacity", 1);
                  }
              });

          legend.append("text")
              .attr("x", width - 24)
              .attr("y", 9)
              .attr("dy", ".35em")
              .style("text-anchor", "end")
              .text(function(d) { return d; });

          function plot(selected, difference) {
            let idx = [];

            //erase all but selected bars by setting opacity to 0
            for (i = 0; i < difference.length; i++) {
                d3.selectAll(".class" + difference[i])
                  .transition()
                  .duration(1000)
                  .style("opacity", 0);
            }

            for (i = 0; i < selected.length; i++) {

                class_keep = selected[i].id.split("id").pop();
                idx.push(legendClassArray.indexOf(class_keep));
                idx.sort();

                d3.selectAll(".class" + class_keep)
                  .transition()
                  .duration(1000)
                  .style("opacity", 1);
            }
                //lower the bars to start on x-axis
            y_orig = [];
            yLabel.selectAll("rect").forEach(function (d, i) {

              h_base = d3.select(d[0]).attr("height");
              y_base = d3.select(d[0]).attr("y");

              for (var i = 0; i < idx.length; i++) {

                //get height of base bar and selected bar
                h_keep = d3.select(d[idx[i]]).attr("height");

                h_shift = h_keep - h_base;
                y_new = y_base - h_shift;

                h_base -= h_keep;

                //reposition selected bars
                d3.select(d[idx[i]])
                  .transition()
                  .ease("bounce")
                  .duration(1000)
                  .delay(750)
                  .attr("y", y_new);
              }
            })
          }
        }

        options = {'width':400,'height':300}

        $scope.selectGraphRisks = function () {
            grouppedBarChart('#graphGlobalRisk',dataSample1,options);
            stackedBarChart('#graphGlobalRisk2',dataSample2);
        };



    }

})();

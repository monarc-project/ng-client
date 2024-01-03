(function() {
	angular
		.module('ClientApp')
		.controller('ClientDashboardCtrl', [
			'$scope', '$mdMedia', '$mdDialog', '$http', 'gettextCatalog', '$q', '$timeout',
			'$stateParams', 'AnrService', 'ClientAnrService', 'ReferentialService', 'SOACategoryService',
			'ClientSoaService', 'ClientRecommendationService', 'ChartService', ClientDashboardCtrl
		]);

	function ClientDashboardCtrl($scope, $mdMedia, $mdDialog, $http, gettextCatalog, $q, $timeout,
		$stateParams, AnrService, ClientAnrService, ReferentialService, SOACategoryService,
		ClientSoaService, ClientRecommendationService, ChartService) {

		$scope.dashboard = {
			currentTabIndex: 0,
			export: false
		};

		window.onresize = function() {
			$scope.dashboard.width = window.innerWidth;
		}

		var anr = null;
		var cartoCurrent = null;
		var cartoTarget = null;
		var threatScale = null;
		var vulnerabilityScale = null;
		var firstRefresh = true;

		// OPTIONS CHARTS ==============================================================

		//Options of the chart that displays current risks by level
		const optionsRisksByLevel = {
			height: 500,
			width: 500,
			margin: {
				top: 20,
				right: 50,
				bottom: 50,
				left: 30
			},
			color: ["#D6F107", "#FFBC1C", "#FD661F"],
			showLegend: false,
			multipleYaxis: true,
			forceDomainY: {
				min: 0,
				max: 0
			},
			yLabel: 'Number of risks',
			y2Label: 'Average of the max. risk value',
			onClickFunction: function(d) {
				let [field, order, kindOfTreatment, functionGetRisks] = getFilterParams(d.kindOfRisk);

				AnrService[functionGetRisks](anr.id, {
					order: order,
					order_direction: 'desc',
					limit: -1,
				}).then(function(data) {
					let key = functionGetRisks == 'getAnrRisks' ? 'risks' : 'oprisks';
					let risks = data[key].filter(function(risk) {
						if (risk['cacheTargetedRisk'] && risk['cacheTargetedRisk'] == -1) {
							risk['cacheTargetedRisk'] = risk['cacheNetRisk'];
						}

						if (kindOfTreatment == 'all') {
							return risk[field] > -1 &&
								risk[field] >= d.threshold[0] &&
								risk[field] <= d.threshold[1]
						}
						if (kindOfTreatment == 'treated') {
							return risk[field] > -1 &&
								risk[field] >= d.threshold[0] &&
								risk[field] <= d.threshold[1] &&
								risk.kindOfMeasure !== 5;
						}
						return risk[field] > -1 &&
							risk[field] >= d.threshold[0] &&
							risk[field] <= d.threshold[1] &&
							risk.kindOfMeasure == kindOfTreatment;
					});
					key == 'risks' ? risksTable(risks) : risksTable(null, risks)
				});
			}
		};

		//Options of the chart that displays current risks by kind of treatment
		const optionsRisksByTreatment = {
			height: 500,
			width: 500,
			margin: {
				top: 40,
				right: 50,
				bottom: 50,
				left: 30
			},
			showLegend: true,
			multipleYaxis: true,
			forceDomainY: {
				min: 0,
				max: 0
			},
			yLabel: 'Number of risks',
			y2Label: 'Average of the max. risk value',
			onClickFunction: function(d) {
				let [field, order, kindOfTreatment, functionGetRisks] = getFilterParams(d.kindOfRisk);

				switch (d.translationLabelKey) {
					case 'Reduction':
						kindOfTreatment = 1
						break;
					case 'Denied':
						kindOfTreatment = 2
						break;
					case 'Accepted':
						kindOfTreatment = 3
						break;
					case 'Shared':
						kindOfTreatment = 4
						break;
					default:
						kindOfTreatment = 5
				}

				AnrService[functionGetRisks](anr.id, {
					order: order,
					order_direction: 'desc',
					limit: -1,
				}).then(function(data) {
					let key = functionGetRisks == 'getAnrRisks' ? 'risks' : 'oprisks';
					let risks = data[key].filter(function(risk) {
						if (risk['cacheTargetedRisk'] && risk['cacheTargetedRisk'] == -1) {
							risk['cacheTargetedRisk'] = risk['cacheNetRisk'];
						}
						return risk[field] > -1 &&
							risk.kindOfMeasure == kindOfTreatment;
					});
					key == 'risks' ? risksTable(risks) : risksTable(null, risks)
				});
			}
		};

		//Options for the chart that displays the current risks by asset
		const optionsRisksByAsset = {
			height: 650,
			width: 650,
			margin: {
				top: 50,
				right: 100,
				bottom: 200,
				left: 30
			},
			showValues: true,
			multipleYaxis: true,
			color: ["#D6F107", "#FFBC1C", "#FD661F"],
			forceChartMode: 'stacked',
			rotationXAxisLabel: 45,
			offsetXAxisLabel: 0.9,
			yLabel: 'Number of risks',
			y2Label: 'Average of the max. risk value',
			onClickFunction: function(d) {
				let [field, order, kindOfTreatment, functionGetRisks] = getFilterParams(d.kindOfRisk);

				AnrService.getInstanceRisks(anr.id, d.uuid, {
					limit: -1
				}).then(function(data) {
					let risks = data.risks.filter(function(risk) {
						if (kindOfTreatment == 'all') {
							return risk.max_risk > -1;
						}
						if (kindOfTreatment == 'treated') {
							return risk.max_risk > -1 &&
								risk.kindOfMeasure !== 5;
						}
						return risk.max_risk > -1 &&
							risk.kindOfMeasure == kindOfTreatment;
					});
					risksTable(risks)
				});
			}
		};

		//Options for the chart that displays the current risks by treatment and assets
		const optionsRisksByTreatmentAndAsset = angular.extend(
			angular.copy(optionsRisksByAsset), {
				color: undefined,
				onClickFunction: undefined
			}
		);

		//Options for the charts that display the risks by parent asset
		const optionsCurrentRisksByParent = angular.extend(
			angular.copy(optionsRisksByAsset), {
				onClickFunction: async function(d) {
					if (d.child.length > 0) {
						dataCurrentRisksByParent = [];
						dataCurrentRisksByParentAndTreatment = {
							treated: [],
							not_treated: [],
							reduction: [],
							denied: [],
							accepted: [],
							shared: []
						}

						d.child.sort((a, b) => sortByLabel(a, b, 'name'));

						for (let [i, instance] of d.child.entries()) {
							await AnrService.getInstanceRisks(anr.id, instance.id, {}).then(function(data) {
								updateRisksByParentAsset(data.risks, instance, d.kindOfRisk);
							})
						}
						let label = d.category;
						if (d.category.length > 20) {
							label = d.category.substring(0, 20) + "...";
						}
						$scope.currentRisksBreadcrumb.push(label);
						$scope.currentRisksMemoryTab.push([dataCurrentRisksByParent, dataCurrentRisksByParentAndTreatment]);
						drawCurrentRisk();
					} else {
						let kindOfTreatment = getFilterParams(d.kindOfRisk)[2];

						AnrService.getInstanceRisks(anr.id, d.uuid, {}).then(function(data) {
							let risks = data.risks.filter(function(risk) {
								if (kindOfTreatment == 'all') {
									return risk.max_risk > -1;
								}
								if (kindOfTreatment == 'treated') {
									return risk.max_risk > -1 &&
										risk.kindOfMeasure !== 5;
								}
								return risk.max_risk > -1 &&
									risk.kindOfMeasure == kindOfTreatment;
							});
							risksTable(risks)
						});
					}
				}
			}
		);

		const optionsTargetRisksByParent = angular.extend(
			angular.copy(optionsCurrentRisksByParent), {
				onClickFunction: async function(d) { //on click go one child deeper (node) or go to MONARC (leaf)
					if (d.child.length > 0) {
						dataTargetRisksByParent = [];
						dataTargetRisksByParentAndTreatment = {
							treated: [],
							not_treated: [],
							reduction: [],
							denied: [],
							accepted: [],
							shared: []
						}

						d.child.sort((a, b) => sortByLabel(a, b, 'name'));

						for (let [i, instance] of d.child.entries()) {
							await AnrService.getInstanceRisks(anr.id, instance.id, {}).then(function(data) {
								updateRisksByParentAsset(data.risks, instance, d.kindOfRisk);
							})
						}
						let label = d.category;
						if (d.category.length > 20) {
							label = d.category.substring(0, 20) + "...";
						}
						$scope.targetRisksBreadcrumb.push(label);
						$scope.targetRisksMemoryTab.push([dataTargetRisksByParent, dataTargetRisksByParentAndTreatment]);
						drawTargetRisk();
					} else {
						let kindOfTreatment = getFilterParams(d.kindOfRisk)[2];

						AnrService.getInstanceRisks(anr.id, d.uuid, {}).then(function(data) {
							let risks = data.risks.filter(function(risk) {
								if (kindOfTreatment == 'all') {
									return risk.max_risk > -1;
								}
								if (kindOfTreatment == 'treated') {
									return risk.max_risk > -1 &&
										risk.kindOfMeasure !== 5;
								}
								return risk.max_risk > -1 &&
									risk.kindOfMeasure == kindOfTreatment;
							});
							risksTable(risks)
						});
					}
				}
			}
		);

		//Options of the chart that displays current Operational risks by level
		const optionsOpRisksByLevel = angular.extend(
			angular.copy(optionsRisksByLevel)
		);

		//Options for the chart that displays the current Operational risks by asset
		const optionsOpRisksByAsset = angular.extend(
			angular.copy(optionsRisksByAsset), {
				onClickFunction: function(d) {
					let [field, order, kindOfTreatment, functionGetRisks] = getFilterParams(d.kindOfRisk);

					AnrService.getInstanceRisksOp(anr.id, d.uuid, {
						limit: -1
					}).then(function(data) {
						let opRisks = data.oprisks.filter(function(risk) {
							if (kindOfTreatment == 'all') {
								return risk.cacheNetRisk > -1;
							}
							if (kindOfTreatment == 'treated') {
								return risk.cacheNetRisk > -1 &&
									risk.kindOfMeasure !== 5;
							}
							return risk.cacheNetRisk > -1 &&
								risk.kindOfMeasure == kindOfTreatment;
						});
						risksTable(null, opRisks)
					});
				}
			}
		);

		//Options for the charts that display the Operational risks by parent asset
		const optionsCurrentOpRisksByParent = angular.extend(
			angular.copy(optionsCurrentRisksByParent), {
				onClickFunction: async function(d) {
					if (d.child.length > 0) {
						dataCurrentOpRisksByParent = [];
						dataCurrentOpRisksByParentAndTreatment = {
							treated: [],
							not_treated: [],
							reduction: [],
							denied: [],
							accepted: [],
							shared: []
						}

						d.child.sort((a, b) => sortByLabel(a, b, 'name'));

						for (let [i, instance] of d.child.entries()) {
							await AnrService.getInstanceRisksOp(anr.id, instance.id, {}).then(function(data) {
								updateRisksByParentAsset(data.oprisks, instance, d.kindOfRisk);
							})
						}

						let label = d.category;
						if (d.category.length > 20) {
							label = d.category.substring(0, 20) + "...";
						}
						$scope.currentOpRisksBreadcrumb.push(label);
						$scope.currentOpRisksMemoryTab.push([dataCurrentOpRisksByParent, dataCurrentOpRisksByParentAndTreatment]);
						drawCurrentOpRisk();
					} else {
						let kindOfTreatment = getFilterParams(d.kindOfRisk)[2];

						AnrService.getInstanceRisksOp(anr.id, d.uuid, {}).then(function(data) {
							let opRisks = data.oprisks.filter(function(risk) {
								if (kindOfTreatment == 'all') {
									return risk.cacheNetRisk > -1;
								}
								if (kindOfTreatment == 'treated') {
									return risk.cacheNetRisk > -1 &&
										risk.kindOfMeasure !== 5;
								}
								return risk.cacheNetRisk > -1 &&
									risk.kindOfMeasure == kindOfTreatment;
							});
							risksTable(null, opRisks)
						});
					}
				}
			}
		);

		const optionsTargetOpRisksByParent = angular.extend(
			angular.copy(optionsCurrentRisksByParent), {
				onClickFunction: async function(d) {
					if (d.child.length > 0) {
						dataTargetOpRisksByParent = [];
						dataTargetOpRisksByParentAndTreatment = {
							treated: [],
							not_treated: [],
							reduction: [],
							denied: [],
							accepted: [],
							shared: []
						}

						d.child.sort((a, b) => sortByLabel(a, b, 'name'));

						for (let [i, instance] of d.child.entries()) {
							await AnrService.getInstanceRisksOp(anr.id, instance.id, {}).then(function(data) {
								updateRisksByParentAsset(data.oprisks, instance, d.kindOfRisk);
							})
						}

						let label = d.category;
						if (d.category.length > 20) {
							label = d.category.substring(0, 20) + "...";
						}
						$scope.targetOpRisksBreadcrumb.push(label);
						$scope.targetOpRisksMemoryTab.push([dataTargetOpRisksByParent, dataTargetOpRisksByParentAndTreatment]);
						drawTargetOpRisk();
					} else {
						let kindOfTreatment = getFilterParams(d.kindOfRisk)[2];

						AnrService.getInstanceRisksOp(anr.id, d.uuid, {}).then(function(data) {
							let opRisks = data.oprisks.filter(function(risk) {
								if (kindOfTreatment == 'all') {
									return risk.cacheNetRisk > -1;
								}
								if (kindOfTreatment == 'treated') {
									return risk.cacheNetRisk > -1 &&
										risk.kindOfMeasure !== 5;
								}
								return risk.cacheNetRisk > -1 &&
									risk.kindOfMeasure == kindOfTreatment;
							});
							risksTable(null, opRisks)
						});
					}
				}
			}
		);

		//Options for the chart that displays threats
		const optionsHorizontalThreats = {
			height: 600,
			width: 1400,
			margin: {
				top: 30,
				right: 30,
				bottom: 50,
				left: 140
			},
			colorGradient: true,
			color: ["#D6F107", "#FD661F"],
			showLegend: false,
			sort: true,
			xLabel: 'Number of risks',
		};

		const optionsVerticalThreats = angular.extend(
			angular.copy(optionsHorizontalThreats), {
				margin: {
					top: 30,
					right: 100,
					bottom: 200,
					left: 30
				},
				rotationXAxisLabel: 45,
				offsetXAxisLabel: 0.9,
				yLabel: 'Number of risks',
			}
		);

		//Options for the chart that displays vulnerabilities
		const optionsHorizontalVulnerabilities = angular.extend(
			angular.copy(optionsHorizontalThreats), {
				margin: {
					top: 30,
					right: 30,
					bottom: 50,
					left: 300
				},
			}
		);

		const optionsVerticalVulnerabilities = angular.extend(
			angular.copy(optionsHorizontalVulnerabilities), {
				margin: {
					top: 30,
					right: 100,
					bottom: 200,
					left: 30
				},
				rotationXAxisLabel: 45,
				offsetXAxisLabel: 0.9,
				yLabel: 'Number of risks',
			}

		);

		//Options for the chart that displays the cartography
		const optionsCartography = {
			xLabel: 'Likelihood',
			yLabel: 'Impact',
			color: ["#D6F107", "#FFBC1C", "#FD661F"],
			threshold: [],
			onClickFunction: function(d) {
				let field = null;

				if (d.amvsCurrent || d.amvsTarget) {
					if (d.amvsCurrent) {
						field = 'max_risk';
					} else {
						field = 'target_risk';
					}

					AnrService.getAnrRisks(anr.id, {
						order: 'instance',
						order_direction: 'asc',
						limit: -1,
					}).then(function(data) {
						let risks = data.risks.filter(function(risk) {
							let impactMax = Math.max(
								risk.c_impact * risk.c_risk_enabled,
								risk.i_impact * risk.i_risk_enabled,
								risk.d_impact * risk.d_risk_enabled
							);
							return impactMax == d.y &&
								risk[field] == d.x * d.y;
						});
						risksTable(risks)
					});
				} else if (d.rolfRisksCurrent || d.rolfRisksTarget) {
					if (d.rolfRisksCurrent) {
						field = 'cacheNetRisk';
					} else {
						field = 'cacheTargetedRisk';
					}

					AnrService.getAnrRisksOp(anr.id, {
						order: 'instance',
						order_direction: 'asc',
						limit: -1,
					}).then(function(data) {
						let opRisks = data.oprisks.filter(function(risk) {
							if (risk['cacheTargetedRisk'] == -1) {
								risk['cacheTargetedRisk'] = risk['cacheNetRisk'];
							}
							return risk[field] == d.x * d.y
						});
						risksTable(null, opRisks)
					});
				}
			}
		};

		//Options for the chart that displays the compliance
		const optionsChartCompliance = {
			width: 650
		};

		//Options for the chart that displays recommendations
		const optionsHorizontalRecommendations = {
			height: 600,
			width: 1400,
			margin: {
				top: 30,
				right: 30,
				bottom: 30,
				left: 300
			},
			colorGradient: true,
			color: ["#D6F107", "#FD661F"],
			showLegend: false,
			sort: true,
			onClickFunction: async function(d) {
				let risks = [];
				let opRisks = [];

				if (d.amvs.length > 0) {
					await AnrService.getAnrRisks(anr.id, {
						order: 'instance',
						order_direction: 'asc',
						limit: -1,
					}).then(function(data) {
						risks = data.risks.filter(function(risk) {
							return risk.max_risk > -1 &&
								risk.recommendations.includes(d.id)
						});
					});
				}

				if (d.rolfRisks.length > 0) {
					await AnrService.getAnrRisksOp(anr.id, {
						order: 'instance',
						order_direction: 'asc',
						limit: -1,
					}).then(function(data) {
						opRisks = data.oprisks.filter(function(risk) {
							return risk.cacheNetRisk > -1 &&
								risk.recommendations.includes(d.id)
						});
					});
				}

				risksTable(risks, opRisks)
			}
		};

		const optionsVerticalRecommendations = angular.extend(
			angular.copy(optionsHorizontalRecommendations), {
				margin: {
					top: 30,
					right: 100,
					bottom: 200,
					left: 30
				},
				rotationXAxisLabel: 45,
				offsetXAxisLabel: 0.9,
			}
		);

		// DATA MODELS =================================================================

		var dataCurrentRisksByLevel = [];
		var dataCurrentRisksByLevelAndTreatment = [];
		var dataTargetRisksByLevel = [];
		var dataTargetRisksByLevelAndTreatment = [];
		var dataCurrentRisksByTreatment = [];
		var dataTargetRisksByTreatment = [];
		var dataCurrentRisksByTreatmentAndAsset = [];
		var dataTargetRisksByTreatmentAndAsset = [];
		var dataCurrentRisksByTreatmentAndParentAsset = [];
		var dataTargetRisksByTreatmentAndParentAsset = [];
		var dataCurrentRisksByAsset = [];
		var dataCurrentRisksByAssetAndTreatment = [];
		var dataTargetRisksByAsset = [];
		var dataTargetRisksByAssetAndTreatment = [];
		var dataCurrentRisksByParent = [];
		var dataCurrentRisksByParentAndTreatment = [];
		var dataTargetRisksByParent = [];
		var dataTargetRisksByParentAndTreatment = [];
		var dataCurrentOpRisksByLevel = [];
		var dataCurrentOpRisksByLevelAndTreatment = [];
		var dataTargetOpRisksByLevel = [];
		var dataTargetOpRisksByLevelAndTreatment = [];
		var dataCurrentOpRisksByTreatment = [];
		var dataTargetOpRisksByTreatment = [];
		var dataCurrentOpRisksByTreatmentAndAsset = [];
		var dataTargetOpRisksByTreatmentAndAsset = [];
		var dataCurrentOpRisksByTreatmentAndParentAsset = [];
		var dataTargetOpRisksByTreatmentAndParentAsset = [];
		var dataCurrentOpRisksByAsset = [];
		var dataCurrentOpRisksByAssetAndTreatment = [];
		var dataTargetOpRisksByAsset = [];
		var dataTargetOpRisksByAssetAndTreatment = [];
		var dataCurrentOpRisksByParent = [];
		var dataCurrentOpRisksByParentAndTreatment = [];
		var dataTargetOpRisksByParent = [];
		var dataTargetOpRisksByParentAndTreatment = []
		var dataThreats = [];
		var dataThreatsByRootInstances = [];
		var dataAllVulnerabilities = [];
		var dataVulnerabilitiesByRootInstances = [];
		var dataCurrentCartography = [];
		var dataTargetCartography = [];
		var dataCurrentCartographyRiskOp = [];
		var dataTargetCartographyRiskOp = [];
		var dataCompliance = [];
		var dataRecommendationsByOccurrence = [];
		var dataRecommendationsByImportance = [];
		var dataRecommendationsByAsset = [];

		function initDataModels() {
			//Data Model for the graph for the current/target information risk by level of risk
			dataCurrentRisksByLevel = [];
			dataCurrentRisksByLevelAndTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			}

			dataTargetRisksByLevel = [];
			dataTargetRisksByLevelAndTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			}

			//Data Model for the graph for the current/target information risk by kind of treatment
			dataCurrentRisksByTreatment = [];
			dataTargetRisksByTreatment = [];

			dataCurrentRisksByTreatmentAndAsset = [];
			dataTargetRisksByTreatmentAndAsset = [];

			dataCurrentRisksByTreatmentAndParentAsset = [];
			dataTargetRisksByTreatmentAndParentAsset = [];

			//Data model for the graph of current/target risk by asset
			dataCurrentRisksByAsset = [];
			dataCurrentRisksByAssetAndTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			}
			dataTargetRisksByAsset = [];
			dataTargetRisksByAssetAndTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			}

			//Data model for the graph of current/target risk by parent asset
			dataCurrentRisksByParent = [];
			dataCurrentRisksByParentAndTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			}
			dataTargetRisksByParent = [];
			dataTargetRisksByParentAndTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			}

			//Data Model for the graph for the current/target operational risk by level of risk
			dataCurrentOpRisksByLevel = [];
			dataCurrentOpRisksByLevelAndTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			}
			dataTargetOpRisksByLevel = [];
			dataTargetOpRisksByLevelAndTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			}

			//Data Model for the graph for the current/target operational risk by kind of treatment
			dataCurrentOpRisksByTreatment = [];
			dataTargetOpRisksByTreatment = [];

			dataCurrentOpRisksByTreatmentAndAsset = [];
			dataTargetOpRisksByTreatmentAndAsset = [];

			dataCurrentOpRisksByTreatmentAndParentAsset = [];
			dataTargetOpRisksByTreatmentAndParentAsset = [];

			//Data model for the graph of current/target operational risk by asset
			dataCurrentOpRisksByAsset = [];
			dataCurrentOpRisksByAssetAndTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			}
			dataTargetOpRisksByAsset = [];
			dataTargetOpRisksByAssetAndTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			}

			//Data model for the graph of current/target operational risk by parent asset
			dataCurrentOpRisksByParent = [];
			dataCurrentOpRisksByParentAndTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			}
			dataTargetOpRisksByParent = [];
			dataTargetOpRisksByParentAndTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			}

			//Data for the graph for the number of threats by threat type
			dataThreats = [];
			dataThreatsByRootInstances = [];

			//Data for the graph for all/spliced vulnerabilities
			dataAllVulnerabilities = [];
			dataVulnerabilitiesByRootInstances = [];

			//Data for the graph for Information/Operational risks cartography
			dataCurrentCartography = [];
			dataTargetCartography = [];
			dataCurrentCartographyRiskOp = [];
			dataTargetCartographyRiskOp = [];

			//Data for the graph for the compliance
			dataCompliance = [];

			//Data for the graph for the recommendations
			dataRecommendationsByOccurrence = [];
			dataRecommendationsByImportance = [];
			dataRecommendationsByAsset = [];
		}

		// GET ALL DATA CHARTS FUNCTION=================================================

		$scope.updateGraphs = function() {
			initDataModels();

			$scope.currentRisksBreadcrumb = [gettextCatalog.getString("Overview")];
			$scope.targetRisksBreadcrumb = [gettextCatalog.getString("Overview")];
			$scope.currentRisksMemoryTab = [];
			$scope.targetRisksMemoryTab = [];
			$scope.currentOpRisksBreadcrumb = [gettextCatalog.getString("Overview")];
			$scope.targetOpRisksBreadcrumb = [gettextCatalog.getString("Overview")];
			$scope.currentOpRisksMemoryTab = [];
			$scope.targetOpRisksMemoryTab = [];
			if (!$scope.displayCurrentRisksBy) {
				$scope.displayCurrentRisksBy = "level";
			}
			if (!$scope.displayTargetRisksBy) {
				$scope.displayTargetRisksBy = "level";
			}

			if (!$scope.currentRisksOptions) {
				$scope.currentRisksOptions = 'vertical';
			}
			if (!$scope.targetRisksOptions) {
				$scope.targetRisksOptions = 'vertical';
			}

			if (!$scope.currentRisksTreatmentOptions) {
				$scope.currentRisksTreatmentOptions = 'all';
			}
			if (!$scope.targetRisksTreatmentOptions) {
				$scope.targetRisksTreatmentOptions = 'all';
			}

			if (!$scope.currentRisksTreatmentAndAssetOptions) {
				$scope.currentRisksTreatmentAndAssetOptions = 'all';
			}
			if (!$scope.targetRisksTreatmentAndAssetOptions) {
				$scope.targetRisksTreatmentAndAssetOptions = 'all';
			}

			if (!$scope.currentOpRisksOptions) {
				$scope.currentOpRisksOptions = 'vertical';
			}
			if (!$scope.targetOpRisksOptions) {
				$scope.targetOpRisksOptions = 'vertical';
			}

			if (!$scope.currentOpRisksTreatmentOptions) {
				$scope.currentOpRisksTreatmentOptions = 'all';
			}
			if (!$scope.targetOpRisksTreatmentOptions) {
				$scope.targetOpRisksTreatmentOptions = 'all';
			}

			if (!$scope.currentOpRisksTreatmentAndAssetOptions) {
				$scope.currentOpRisksTreatmentAndAssetOptions = 'all';
			}
			if (!$scope.targetOpRisksTreatmentAndAssetOptions) {
				$scope.targetOpRisksTreatmentAndAssetOptions = 'all';
			}

			if (!$scope.displayThreatsBy) {
				$scope.displayThreatsBy = 'occurrence';
			}
			if (!$scope.threatsOptions) {
				$scope.threatsOptions = 'vertical';
			}
			if (!$scope.threatsParentAssetsOptions) {
				$scope.threatsParentAssetsOptions = 5
			}

			if (!$scope.displayVulnerabilitiesBy) {
				$scope.displayVulnerabilitiesBy = 'occurrence';
			}
			if (!$scope.vulnerabilitiesOptions) {
				$scope.vulnerabilitiesOptions = 'vertical';
			}
			if (!$scope.vulnerabilitiesDisplayed) {
				$scope.vulnerabilitiesDisplayed = 20;
			}

			if (!$scope.cartographyRisksType) {
				$scope.cartographyRisksType = 'info_risks';
			}

			if (!$scope.displayRecommendationsBy) {
				$scope.displayRecommendationsBy = 'occurrence';
			}
			if (!$scope.recommendationsOptions) {
				$scope.recommendationsOptions = 'vertical';
			}

			$scope.dashboardUpdated = false;
			$scope.loadingPptx = false;

			ClientAnrService.getAnr($stateParams.modelId).then(function(data) {
				anr = data;
				$http.get("api/client-anr/" + anr.id + "/carto-risks-dashboard").then(function(data) {
					cartoCurrent = data.data.carto.real;
					cartoTarget = data.data.carto.targeted;
					if (Object.values(cartoCurrent.riskInfo.distrib).length > 0 ||
						Object.values(cartoCurrent.riskOp.distrib).length > 0
					) {
						$scope.dashboard.export = true;
					}
					try {
						// cartography of risks - first tab
						updateCartoRisks();
						updateRisksbyTreatment();
					} catch {
						console.log('Error when retrieving data for the risks tab.');
					}
					try {
						// cartography - fourth tab
						updateCartography(data);
						drawCartography();
					} catch {
						console.log('Error when retrieving data for the cartography.');
					}

					AnrService.getScales(anr.id).then(function(data) {
						threatScale = data.scales.find(d => {
							return d.type == "threat"
						});
						vulnerabilityScale = data.scales.find(d => {
							return d.type == "vulnerability"
						});

						AnrService.getInstances(anr.id).then(function(data) {
							let instances = data.instances;

							instances.sort((a, b) => sortByLabel(a, b, 'name'));

							AnrService.getAnrRisks(anr.id, {
								limit: -1,
								order: 'instance',
								order_direction: 'asc'
							}).then(async function(data) {
								let risks = data.risks.filter(x => x.max_risk != -1);
								if (risks.length) {
									updateRisksByAsset(risks, 'currentRisk');
									updateRisksByAsset(risks, 'targetRisk');
									updateRisksbyTreatmentAndAsset(risks, 'currentRisk')
									updateRisksbyTreatmentAndAsset(risks, 'targetRisk')
									updateThreats(risks);
									updateVulnerabilities(risks);

									for (let [i, instance] of instances.entries()) {
										await AnrService.getInstanceRisks(anr.id, instance.id, {}).then(function(data) {
											let risks = data.risks.filter(x => x.max_risk != -1);
											updateRisksByParentAsset(risks, instance, 'currentRisk');
											updateRisksByParentAsset(risks, instance, 'targetRisk');
											updateRisksByTreatmentParentAsset(risks, instance, 'currentRisk');
											updateRisksByTreatmentParentAsset(risks, instance, 'targetRisk');
											updateThreatsByRootInstances(risks, instance);
											updateVulnerabilitiesByRootInstances(risks, instance);
										})
									}

									$scope.currentRisksMemoryTab.push([dataCurrentRisksByParent, dataCurrentRisksByParentAndTreatment]);
									$scope.targetRisksMemoryTab.push([dataTargetRisksByParent, dataTargetRisksByParentAndTreatment]);

									drawThreats();
									drawVulnerabilities();
								}
								drawCurrentRisk();
								drawTargetRisk();

								firstRefresh = false;
							});

							AnrService.getAnrRisksOp(anr.id, {
								limit: -1,
								order: 'instance',
								order_direction: 'asc'
							}).then(async function(data) {
								let opRisks = data.oprisks.filter(x => x.cacheNetRisk != -1);
								if (opRisks.length) {
									updateRisksByAsset(opRisks, 'currentOpRisk');
									updateRisksByAsset(opRisks, 'targetOpRisk');
									updateRisksbyTreatmentAndAsset(opRisks, 'currentOpRisk')
									updateRisksbyTreatmentAndAsset(opRisks, 'targetOpRisk')

									for (let [i, instance] of instances.entries()) {
										await AnrService.getInstanceRisksOp(anr.id, instance.id, {}).then(function(data) {
											let opRisks = data.oprisks.filter(x => x.cacheNetRisk != -1);
											updateRisksByParentAsset(opRisks, instance, 'currentOpRisk');
											updateRisksByParentAsset(opRisks, instance, 'targetOpRisk');
											updateRisksByTreatmentParentAsset(opRisks, instance, 'currentOpRisk');
											updateRisksByTreatmentParentAsset(opRisks, instance, 'targetOpRisk');
										})
									}

									$scope.currentOpRisksMemoryTab.push([dataCurrentOpRisksByParent, dataCurrentOpRisksByParentAndTreatment]);
									$scope.targetOpRisksMemoryTab.push([dataTargetOpRisksByParent, dataTargetOpRisksByParentAndTreatment]);
								}
								drawCurrentOpRisk();
								drawTargetOpRisk();

							});
						});
					});
				});
			});
			ClientRecommendationService.getRecommendationRisks().then(function(data) {
				let recommendations = data['recommendations-risks'];
				updateRecommendations(recommendations);
				drawRecommendations();
			});
			ReferentialService.getReferentials({
				order: 'createdAt'
			}).then(function(data) {
				$scope.dashboard.referentials = [];
				data.referentials.forEach(function(ref) {
					if (Array.isArray(ref.measures)) {
						$scope.dashboard.referentials.push(ref);
					}
				})
				SOACategoryService.getCategories().then(function(data) {
					let categories = data.categories;
					ClientSoaService.getSoas().then(function(data) {
						let soa = data.soaMeasures;
						updateCompliance($scope.dashboard.referentials, categories, soa);
						if ($scope.dashboard.referentials[0] && !$scope.referentialSelected) {
							$scope.referentialSelected = $scope.dashboard.referentials[0].uuid;
						}
						drawCompliance();
						$timeout(function() {
							$scope.dashboardUpdated = true;
						}, 1000);
					});
				});
			});
		}

		$scope.$on('Dashboard', function() {
			if (!firstRefresh) {
				$scope.updateGraphs();
			}
		});

		// WATCHERS ====================================================================
		$scope.$watchGroup(['sidenavIsOpen', 'dashboard.width', '$root.uiLanguage'],
			function(newValue, oldValue) {
				if (newValue !== oldValue) {
					if (newValue[2] !== oldValue[2]) {
						$scope.currentRisksBreadcrumb[0] = gettextCatalog.getString("Overview");
						$scope.targetRisksBreadcrumb[0] = gettextCatalog.getString("Overview");
						$scope.currentOpRisksBreadcrumb[0] = gettextCatalog.getString("Overview");
						$scope.targetOpRisksBreadcrumb[0] = gettextCatalog.getString("Overview");
					}

					$timeout(function() {
						drawCurrentRisk();
						drawTargetRisk();
						drawCurrentOpRisk();
						drawTargetOpRisk();
						drawThreats();
						drawVulnerabilities();
						drawCartography();
						drawCompliance();
						drawRecommendations();
					}, 150);
				}
			});

		$scope.$watchGroup(['displayCurrentRisksBy', 'currentRisksOptions', 'currentRisksTreatmentOptions', 'currentRisksTreatmentAndAssetOptions'], function(newValue, oldValue) {
			if (newValue !== oldValue) {
				drawCurrentRisk();
			}
		});

		$scope.$watchGroup(['displayTargetRisksBy', 'targetRisksOptions', 'targetRisksTreatmentOptions', 'targetRisksTreatmentAndAssetOptions'], function(newValue, oldValue) {
			if (newValue !== oldValue) {
				drawTargetRisk();
			}
		});

		$scope.$watchGroup(['displayCurrentOpRisksBy', 'currentOpRisksOptions', 'currentOpRisksTreatmentOptions', 'currentOpRisksTreatmentAndAssetOptions'], function() {
			drawCurrentOpRisk();
		});

		$scope.$watchGroup(['displayTargetOpRisksBy', 'targetOpRisksOptions', 'targetOpRisksTreatmentOptions', 'targetOpRisksTreatmentAndAssetOptions'], function() {
			drawTargetOpRisk();
		});

		$scope.$watchGroup(['displayThreatsBy', 'threatsOptions', 'threatsParentAssetsOptions'], function() {
			drawThreats();
		});

		$scope.$watchGroup(['displayVulnerabilitiesBy', 'vulnerabilitiesDisplayed', 'vulnerabilitiesOptions', 'vulnerabilitiesParentAssetsOptions'], function() {
			drawVulnerabilities();
		});

		$scope.$watch('cartographyRisksType', function() {
			drawCartography();
		});

		$scope.$watch('referentialSelected', function(newValue, oldValue) {
			if (newValue !== oldValue) {
				drawCompliance();
			}
		});

		$scope.$watchGroup(['displayRecommendationsBy', 'recommendationsOptions'], function() {
			drawRecommendations();
		});


		// UPDATE CHART FUNCTIONS ======================================================

		function updateCartoRisks() {
			if (Object.keys(cartoCurrent.riskInfo.distrib).length > 0) {
				dataCurrentRisksByLevel = [{
						category: "Low risks",
						value: (cartoCurrent.riskInfo.distrib[0]) ?
							cartoCurrent.riskInfo.distrib[0] : null,
						sum: cartoCurrent.riskInfo.riskMaxSum[0],
						kindOfRisk: 'currentRisk',
						threshold: [
							Math.min(...cartoCurrent.Impact) * Math.min(...cartoCurrent.MxV),
							anr.seuil1
						]
					},
					{
						category: "Medium risks",
						value: (cartoCurrent.riskInfo.distrib[1]) ?
							cartoCurrent.riskInfo.distrib[1] : null,
						sum: cartoCurrent.riskInfo.riskMaxSum[1],
						kindOfRisk: 'currentRisk',
						threshold: [anr.seuil1 + 1, anr.seuil2]
					},
					{
						category: "High risks",
						value: (cartoCurrent.riskInfo.distrib[2]) ?
							cartoCurrent.riskInfo.distrib[2] : null,
						sum: cartoCurrent.riskInfo.riskMaxSum[2],
						kindOfRisk: 'currentRisk',
						threshold: [
							anr.seuil2 + 1,
							Math.max(...cartoCurrent.Impact) * Math.max(...cartoCurrent.MxV)
						]
					}
				];

				for (var kindOfTreatment in dataCurrentRisksByLevelAndTreatment) {
					dataCurrentRisksByLevelAndTreatment[kindOfTreatment] = angular.copy(dataCurrentRisksByLevel)
					for (let i = 0; i < dataCurrentRisksByLevel.length; i++) {
						dataCurrentRisksByLevelAndTreatment[kindOfTreatment][i].value = null;
						dataCurrentRisksByLevelAndTreatment[kindOfTreatment][i].sum = null;

						if (cartoCurrent.riskInfo.byTreatment[kindOfTreatment][i]) {
							dataCurrentRisksByLevelAndTreatment[kindOfTreatment][i].value = cartoCurrent.riskInfo.byTreatment[kindOfTreatment][i].count;
							dataCurrentRisksByLevelAndTreatment[kindOfTreatment][i].sum = cartoCurrent.riskInfo.byTreatment[kindOfTreatment][i].sum;
						}
					}
				}

				let risksValues = dataCurrentRisksByLevel.map(d => d.value);
				optionsRisksByLevel.forceDomainY.max = risksValues.reduce((sum, d) => {
					return sum + d
				})

			}

			if (Object.keys(cartoTarget.riskInfo.distrib).length > 0) {
				dataTargetRisksByLevel = [{
						category: "Low risks",
						value: (cartoTarget.riskInfo.distrib[0]) ?
							cartoTarget.riskInfo.distrib[0] : null,
						sum: cartoTarget.riskInfo.riskMaxSum[0],
						kindOfRisk: 'targetRisk',
						threshold: [
							Math.min(...cartoTarget.Impact) * Math.min(...cartoTarget.MxV),
							anr.seuil1
						]
					},
					{
						category: "Medium risks",
						value: (cartoTarget.riskInfo.distrib[1]) ?
							cartoTarget.riskInfo.distrib[1] : null,
						sum: cartoTarget.riskInfo.riskMaxSum[1],
						kindOfRisk: 'targetRisk',
						threshold: [anr.seuil1 + 1, anr.seuil2]
					},
					{
						category: "High risks",
						value: (cartoTarget.riskInfo.distrib[2]) ?
							cartoTarget.riskInfo.distrib[2] : null,
						sum: cartoTarget.riskInfo.riskMaxSum[2],
						kindOfRisk: 'targetRisk',
						threshold: [
							anr.seuil2 + 1,
							Math.max(...cartoTarget.Impact) * Math.max(...cartoTarget.MxV)
						]
					}
				];

				for (var kindOfTreatment in dataTargetRisksByLevelAndTreatment) {
					dataTargetRisksByLevelAndTreatment[kindOfTreatment] = angular.copy(dataTargetRisksByLevel)
					for (let i = 0; i < dataTargetRisksByLevel.length; i++) {
						dataTargetRisksByLevelAndTreatment[kindOfTreatment][i].value = null;
						dataTargetRisksByLevelAndTreatment[kindOfTreatment][i].sum = null;

						if (cartoTarget.riskInfo.byTreatment[kindOfTreatment][i]) {
							dataTargetRisksByLevelAndTreatment[kindOfTreatment][i].value = cartoTarget.riskInfo.byTreatment[kindOfTreatment][i].count;
							dataTargetRisksByLevelAndTreatment[kindOfTreatment][i].sum = cartoTarget.riskInfo.byTreatment[kindOfTreatment][i].sum;
						}
					}
				}
			}

			if (Object.keys(cartoCurrent.riskOp.distrib).length > 0) {
				dataCurrentOpRisksByLevel = [{
						category: "Low risks",
						value: (cartoCurrent.riskOp.distrib[0]) ?
							cartoCurrent.riskOp.distrib[0] : null,
						sum: cartoCurrent.riskOp.riskOpMaxSum[0],
						kindOfRisk: 'currentOpRisk',
						threshold: [
							Math.min(...cartoCurrent.Impact) * Math.min(...cartoCurrent.Probability),
							anr.seuilRolf1
						]
					},
					{
						category: "Medium risks",
						value: (cartoCurrent.riskOp.distrib[1]) ?
							cartoCurrent.riskOp.distrib[1] : null,
						sum: cartoCurrent.riskOp.riskOpMaxSum[1],
						kindOfRisk: 'currentOpRisk',
						threshold: [anr.seuilRolf1 + 1, anr.seuilRolf2]
					},
					{
						category: "High risks",
						value: (cartoCurrent.riskOp.distrib[2]) ?
							cartoCurrent.riskOp.distrib[2] : null,
						sum: cartoCurrent.riskOp.riskOpMaxSum[2],
						kindOfRisk: 'currentOpRisk',
						threshold: [
							anr.seuilRolf2 + 1,
							Math.max(...cartoCurrent.Impact) * Math.max(...cartoCurrent.Probability)
						]
					}
				];

				for (var kindOfTreatment in dataCurrentOpRisksByLevelAndTreatment) {
					dataCurrentOpRisksByLevelAndTreatment[kindOfTreatment] = angular.copy(dataCurrentOpRisksByLevel)
					for (let i = 0; i < dataCurrentOpRisksByLevel.length; i++) {
						dataCurrentOpRisksByLevelAndTreatment[kindOfTreatment][i].value = null;
						dataCurrentOpRisksByLevelAndTreatment[kindOfTreatment][i].sum = null;

						if (cartoCurrent.riskOp.byTreatment[kindOfTreatment][i]) {
							dataCurrentOpRisksByLevelAndTreatment[kindOfTreatment][i].value = cartoCurrent.riskOp.byTreatment[kindOfTreatment][i].count;
							dataCurrentOpRisksByLevelAndTreatment[kindOfTreatment][i].sum = cartoCurrent.riskOp.byTreatment[kindOfTreatment][i].sum;
						}
					}
				}

				let risksValues = dataCurrentOpRisksByLevel.map(d => d.value);
				optionsOpRisksByLevel.forceDomainY.max = risksValues.reduce((sum, d) => {
					return sum + d
				})

			}

			if (Object.keys(cartoTarget.riskOp.distrib).length > 0) {
				dataTargetOpRisksByLevel = [{
						category: "Low risks",
						value: (cartoTarget.riskOp.distrib[0]) ?
							cartoTarget.riskOp.distrib[0] : null,
						sum: cartoTarget.riskOp.riskOpMaxSum[0],
						kindOfRisk: 'targetOpRisk',
						threshold: [
							Math.min(...cartoTarget.Impact) * Math.min(...cartoTarget.Probability),
							anr.seuilRolf1
						]

					},
					{
						category: "Medium risks",
						value: (cartoTarget.riskOp.distrib[1]) ?
							cartoTarget.riskOp.distrib[1] : null,
						sum: cartoTarget.riskOp.riskOpMaxSum[1],
						kindOfRisk: 'targetOpRisk',
						threshold: [anr.seuilRolf1 + 1, anr.seuilRolf2]
					},
					{
						category: "High risks",
						value: (cartoTarget.riskOp.distrib[2]) ?
							cartoTarget.riskOp.distrib[2] : null,
						sum: cartoTarget.riskOp.riskOpMaxSum[2],
						kindOfRisk: 'targetOpRisk',
						threshold: [
							anr.seuilRolf2 + 1,
							Math.max(...cartoTarget.Impact) * Math.max(...cartoTarget.Probability)
						]

					}
				];

				for (var kindOfTreatment in dataTargetOpRisksByLevelAndTreatment) {
					dataTargetOpRisksByLevelAndTreatment[kindOfTreatment] = angular.copy(dataTargetOpRisksByLevel)
					for (let i = 0; i < dataTargetOpRisksByLevel.length; i++) {
						dataTargetOpRisksByLevelAndTreatment[kindOfTreatment][i].value = null;
						dataTargetOpRisksByLevelAndTreatment[kindOfTreatment][i].sum = null;

						if (cartoTarget.riskOp.byTreatment[kindOfTreatment][i]) {
							dataTargetOpRisksByLevelAndTreatment[kindOfTreatment][i].value = cartoTarget.riskOp.byTreatment[kindOfTreatment][i].count;
							dataTargetOpRisksByLevelAndTreatment[kindOfTreatment][i].sum = cartoTarget.riskOp.byTreatment[kindOfTreatment][i].sum;
						}
					}
				}
			}
		};

		function updateRisksbyTreatment() {
			let dataSetTemplate = {
				category: null,
				value: null,
				sum: null,
				kindOfRisk: null,
			};
			if (Object.keys(cartoCurrent.riskInfo.distrib).length > 0) {
				for (var kindOfTreatment in cartoCurrent.riskInfo.byTreatment.all) {
					let categoryLabel = (kindOfTreatment == 'not_treated') ?
						'Not treated' :
						kindOfTreatment.charAt(0).toUpperCase() + kindOfTreatment.slice(1);

					let dataSet = angular.copy(dataSetTemplate);

					dataSet.category = categoryLabel;
					dataSet.kindOfRisk = 'currentRisk';

					if (!Array.isArray(cartoCurrent.riskInfo.byTreatment.all[kindOfTreatment])) {
						dataSet.value = cartoCurrent.riskInfo.byTreatment.all[kindOfTreatment].count;
						dataSet.sum = cartoCurrent.riskInfo.byTreatment.all[kindOfTreatment].sum;
					}
					dataCurrentRisksByTreatment.push(dataSet);
				}

				optionsRisksByTreatment.forceDomainY.max = optionsRisksByLevel.forceDomainY.max;
			}

			if (Object.keys(cartoTarget.riskInfo.distrib).length > 0) {
				for (var kindOfTreatment in cartoTarget.riskInfo.byTreatment.all) {
					let categoryLabel = (kindOfTreatment == 'not_treated') ?
						'Not treated' :
						kindOfTreatment.charAt(0).toUpperCase() + kindOfTreatment.slice(1);

					let dataSet = angular.copy(dataSetTemplate);

					dataSet.category = categoryLabel;
					dataSet.kindOfRisk = 'targetRisk';

					if (!Array.isArray(cartoTarget.riskInfo.byTreatment.all[kindOfTreatment])) {
						dataSet.value = cartoTarget.riskInfo.byTreatment.all[kindOfTreatment].count;
						dataSet.sum = cartoTarget.riskInfo.byTreatment.all[kindOfTreatment].sum;
					}
					dataTargetRisksByTreatment.push(dataSet);
				}

				optionsRisksByTreatment.forceDomainY.max = optionsRisksByLevel.forceDomainY.max;
			}

			if (Object.keys(cartoCurrent.riskOp.distrib).length > 0) {
				for (var kindOfTreatment in cartoCurrent.riskOp.byTreatment.all) {
					let categoryLabel = (kindOfTreatment == 'not_treated') ?
						'Not treated' :
						kindOfTreatment.charAt(0).toUpperCase() + kindOfTreatment.slice(1);

					let dataSet = angular.copy(dataSetTemplate);

					dataSet.category = categoryLabel;
					dataSet.kindOfRisk = 'currentOpRisk';

					if (!Array.isArray(cartoCurrent.riskOp.byTreatment.all[kindOfTreatment])) {
						dataSet.value = cartoCurrent.riskOp.byTreatment.all[kindOfTreatment].count;
						dataSet.sum = cartoCurrent.riskOp.byTreatment.all[kindOfTreatment].sum;
					}
					dataCurrentOpRisksByTreatment.push(dataSet);
				}
			}

			if (Object.keys(cartoTarget.riskOp.distrib).length > 0) {
				for (var kindOfTreatment in cartoTarget.riskOp.byTreatment.all) {
					let categoryLabel = (kindOfTreatment == 'not_treated') ?
						'Not treated' :
						kindOfTreatment.charAt(0).toUpperCase() + kindOfTreatment.slice(1);

					let dataSet = angular.copy(dataSetTemplate);

					dataSet.category = categoryLabel;
					dataSet.kindOfRisk = 'targetOpRisk';

					if (!Array.isArray(cartoTarget.riskOp.byTreatment.all[kindOfTreatment])) {
						dataSet.value = cartoTarget.riskOp.byTreatment.all[kindOfTreatment].count;
						dataSet.sum = cartoTarget.riskOp.byTreatment.all[kindOfTreatment].sum;
					}
					dataTargetOpRisksByTreatment.push(dataSet);
				}
			}
		};

		function updateRisksbyTreatmentAndAsset(risks, kindOfRisk) {
			let maxRisk = getFilterParams(kindOfRisk)[0];
			let dataByAsset = getDataModel(kindOfRisk, 'risksbyTreatmentAndAsset');
			risks.forEach(function(risk) {
				if (risk.cacheTargetedRisk && risk.cacheTargetedRisk == -1) {
					risk.cacheTargetedRisk = risk.cacheNetRisk;
				}
				let InstanceName = risk.instance ?
					$scope._langField(risk, 'instanceName') :
					$scope._langField(risk.instanceInfos, 'name');

				let InstanceUuid = risk.instance ?
					risk.instance :
					risk.instanceInfos.id;

				let assetFound = dataByAsset.find(function(asset) {
					return asset.uuid == InstanceUuid
				});

				if (assetFound == undefined) {
					let dataSet = {
						uuid: InstanceUuid,
						category: InstanceName,
						series: [{
								label: "Reduction",
								value: risk.kindOfMeasure == 1 ? 1 : 0,
								sum: risk.kindOfMeasure == 1 ? risk[maxRisk] : 0,
							},
							{
								label: "Denied",
								value: risk.kindOfMeasure == 2 ? 1 : 0,
								sum: risk.kindOfMeasure == 2 ? risk[maxRisk] : 0,
							},
							{
								label: "Accepted",
								value: risk.kindOfMeasure == 3 ? 1 : 0,
								sum: risk.kindOfMeasure == 3 ? risk[maxRisk] : 0,
							},
							{
								label: "Shared",
								value: risk.kindOfMeasure == 4 ? 1 : 0,
								sum: risk.kindOfMeasure == 4 ? risk[maxRisk] : 0,
							},
							{
								label: "Not treated",
								value: risk.kindOfMeasure == 5 ? 1 : 0,
								sum: risk.kindOfMeasure == 5 ? risk[maxRisk] : 0,
							}
						],
					};
					dataByAsset.push(angular.copy(dataSet));
				} else {
					for (let i = 1; i <= assetFound.series.length; i++) {
						if (risk.kindOfMeasure == i) {
							assetFound.series[i - 1].value += 1;
							assetFound.series[i - 1].sum += risk[maxRisk];
						}
					}
				}
			})
		}

		function updateRisksByTreatmentParentAsset(risks, instance, kindOfRisk) {
			let maxRisk = getFilterParams(kindOfRisk)[0];
			let [treshold1, treshold2] = getFilterParams(kindOfRisk)[4];
			let dataByParent = getDataModel(kindOfRisk, 'risksByTreatmentParentAsset');
			let parent = {
				uuid: instance.id,
				category: $scope._langField(instance, 'name'),
				isparent: (instance.parent == 0) ? true : false,
				child: instance.child,
				kindOfRisk: kindOfRisk,
				series: [{
						label: "Reduction",
						value: 0,
						sum: 0,
					},
					{
						label: "Denied",
						value: 0,
						sum: 0,
					},
					{
						label: "Accepted",
						value: 0,
						sum: 0,
					},
					{
						label: "Shared",
						value: 0,
						sum: 0,
					},
					{
						label: "Not treated",
						value: 0,
						sum: 0,
					}
				],
			}

			risks.forEach(function(risk) {
				if (risk.cacheTargetedRisk && risk.cacheTargetedRisk == -1) {
					risk.cacheTargetedRisk = risk.cacheNetRisk;
				}

				for (let i = 1; i <= parent.series.length; i++) {
					if (risk.kindOfMeasure == i) {
						parent.series[i - 1].value += 1;
						parent.series[i - 1].sum += risk[maxRisk];
					}
				}
			});

			dataByParent.push(parent);
		}

		function updateRisksByAsset(risks, kindOfRisk) {
			let maxRisk = getFilterParams(kindOfRisk)[0];
			let [treshold1, treshold2] = getFilterParams(kindOfRisk)[4];
			let [dataByAsset, dataByAssetAndTreatment] = getDataModel(kindOfRisk, 'risksByAsset');
			risks.forEach(function(risk) {
				if (risk.cacheTargetedRisk && risk.cacheTargetedRisk == -1) {
					risk.cacheTargetedRisk = risk.cacheNetRisk;
				}
				let InstanceName = risk.instance ?
					$scope._langField(risk, 'instanceName') :
					$scope._langField(risk.instanceInfos, 'name');

				let InstanceUuid = risk.instance ?
					risk.instance :
					risk.instanceInfos.id;

				let riskFilter = [
					(risk[maxRisk] >= 0 && risk[maxRisk] <= treshold1) ? true : false,
					(risk[maxRisk] <= treshold2 && risk[maxRisk] > treshold1) ? true : false,
					(risk[maxRisk] > treshold2) ? true : false,
				]

				let assetFound = dataByAsset.find(function(asset) {
					return asset.uuid == InstanceUuid
				});

				if (assetFound == undefined) {
					let dataSet = {
						uuid: InstanceUuid,
						category: InstanceName,
						kindOfRisk: kindOfRisk,
						series: [{
								label: "Low risks",
								value: riskFilter[0] ? 1 : 0,
								sum: riskFilter[0] ? risk[maxRisk] : 0,
							},
							{
								label: "Medium risks",
								value: riskFilter[1] ? 1 : 0,
								sum: riskFilter[1] ? risk[maxRisk] : 0,
							},
							{
								label: "High risks",
								value: riskFilter[2] ? 1 : 0,
								sum: riskFilter[2] ? risk[maxRisk] : 0,
							}
						],
					};
					dataByAsset.push(angular.copy(dataSet));

					for (let kindOfTreatment in dataByAssetAndTreatment) {
						let treatment = getKindOfTreatment(kindOfTreatment);
						let conditionKindOfMesure = risk.kindOfMeasure == treatment ? true : false;
						if (treatment == 'treated') {
							conditionKindOfMesure = risk.kindOfMeasure !== 5 ? true : false;
						}

						for (let i = 0; i < dataSet.series.length; i++) {
							dataSet.series[i].value = riskFilter[i] && conditionKindOfMesure ? 1 : 0;
							dataSet.series[i].sum = riskFilter[i] && conditionKindOfMesure ? risk[maxRisk] : 0;
						}

						dataByAssetAndTreatment[kindOfTreatment].push(angular.copy(dataSet));
					}
				} else {
					for (let i = 0; i < assetFound.series.length; i++) {
						if (riskFilter[i]) {
							assetFound.series[i].value += 1;
							assetFound.series[i].sum += risk[maxRisk];
						}
					}

					for (let kindOfTreatment in dataByAssetAndTreatment) {
						let treatment = getKindOfTreatment(kindOfTreatment);
						let conditionKindOfMesure = risk.kindOfMeasure == treatment ? true : false;
						if (treatment == 'treated') {
							conditionKindOfMesure = risk.kindOfMeasure !== 5 ? true : false;
						}
						let assetFoundByTreatment = dataByAssetAndTreatment[kindOfTreatment].find(function(asset) {
							return asset.uuid == InstanceUuid
						});
						if (assetFoundByTreatment) {
							for (let i = 0; i < assetFoundByTreatment.series.length; i++) {
								if (riskFilter[i] && conditionKindOfMesure) {
									assetFoundByTreatment.series[i].value += 1;
									assetFoundByTreatment.series[i].sum += risk[maxRisk];
								}
							}
						}
					}
				}
			})
		};

		function updateRisksByParentAsset(risks, instance, kindOfRisk) {
			let maxRisk = getFilterParams(kindOfRisk)[0];
			let [treshold1, treshold2] = getFilterParams(kindOfRisk)[4];
			let [dataByParent, dataByParentAndTreatment] = getDataModel(kindOfRisk, 'risksByParentAsset');
			let parentByTreatment = {
				treated: [],
				not_treated: [],
				reduction: [],
				denied: [],
				accepted: [],
				shared: []
			};
			let parent = {
				uuid: instance.id,
				category: $scope._langField(instance, 'name'),
				isparent: (instance.parent == 0) ? true : false,
				child: instance.child,
				kindOfRisk: kindOfRisk,
				series: [{
						label: "Low risks",
						value: 0,
						sum: 0
					},
					{
						label: "Medium risks",
						value: 0,
						sum: 0
					},
					{
						label: "High risks",
						value: 0,
						sum: 0
					}
				]
			}
			for (let kindOfTreatment in parentByTreatment) {
				parentByTreatment[kindOfTreatment] = angular.copy(parent);
			}

			risks.forEach(function(risk) {
				if (risk.cacheTargetedRisk && risk.cacheTargetedRisk == -1) {
					risk.cacheTargetedRisk = risk.cacheNetRisk;
				}

				let riskFilter = [
					(risk[maxRisk] >= 0 && risk[maxRisk] <= treshold1) ? true : false,
					(risk[maxRisk] <= treshold2 && risk[maxRisk] > treshold1) ? true : false,
					(risk[maxRisk] > treshold2) ? true : false,
				]

				for (let i = 0; i < parent.series.length; i++) {
					if (riskFilter[i]) {
						parent.series[i].value += 1;
						parent.series[i].sum += risk[maxRisk];
					}
				}

				for (let kindOfTreatment in parentByTreatment) {
					let treatment = getKindOfTreatment(kindOfTreatment);
					let conditionKindOfMesure = risk.kindOfMeasure == treatment ? true : false;
					if (treatment == 'treated') {
						conditionKindOfMesure = risk.kindOfMeasure !== 5 ? true : false;
					}

					for (let i = 0; i < parentByTreatment[kindOfTreatment].series.length; i++) {
						parentByTreatment[kindOfTreatment].series[i].value += riskFilter[i] && conditionKindOfMesure ? 1 : 0;
						parentByTreatment[kindOfTreatment].series[i].sum += riskFilter[i] && conditionKindOfMesure ? risk[maxRisk] : 0;
					}
				}
			});

			dataByParent.push(parent);
			for (let kindOfTreatment in dataByParentAndTreatment) {
				dataByParentAndTreatment[kindOfTreatment].push(parentByTreatment[kindOfTreatment]);
			}
		}

		function updateThreats(risks) {
			risks.sort(function(a, b) {
				return b['max_risk'] - a['max_risk']
			})

			risks.forEach(function(risk) {
				let threatFound = dataThreats.find(function(threat) {
					return threat.id == risk.threat
				});
				if (threatFound == undefined) {
					dataThreats.push({
						id: risk.threat,
						category: $scope._langField(risk, 'threatLabel'),
						occurrence: 1,
						value: null,
						average: risk.threatRate,
						max_risk: risk.max_risk
					})
				} else {
					threatFound.occurrence += 1;
					threatFound.average *= (threatFound.occurrence - 1);
					threatFound.average += risk.threatRate;
					threatFound.average = threatFound.average / threatFound.occurrence;
				}
			});
		};

		function updateThreatsByRootInstances(risks, instance) {
			let dataSet = [];
			if (risks.length) {
				let sortByCurrentMaxRisk = angular.copy(risks)
					.map(threat => ({
						uuid: threat.threat,
						value: threat.max_risk,
						asset: $scope._langField(instance, 'name'),
						probability: threat.threatRate,
						title: $scope._langField(instance, 'name') + ' - ' + gettextCatalog.getString('Current risks'),
						category: $scope._langField(threat, 'threatLabel'),
					}))
					.sort((a, b) => {
						return b.value - a.value || a.category.localeCompare(b.category)
					})
					.reduce((acc, threat) => {
						const duplicate = acc.find(item => item.uuid == threat.uuid);
						if (!duplicate) {
							return acc.concat([threat])
						};
						return acc;
					}, []);

				let sortByTargetMaxRisk = angular.copy(risks)
					.map(threat => ({
						uuid: threat.threat,
						value: threat.target_risk,
						asset: $scope._langField(instance, 'name'),
						probability: threat.threatRate,
						title: $scope._langField(instance, 'name') + ' - ' + gettextCatalog.getString('Residual risks'),
						category: $scope._langField(threat, 'threatLabel'),
					}))
					.sort((a, b) => {
						return b.value - a.value || a.category.localeCompare(b.category)
					})
					.reduce((acc, threat) => {
						const duplicate = acc.find(item => item.uuid == threat.uuid);
						if (!duplicate) {
							return acc.concat([threat])
						};
						return acc;
					}, []);

				dataSet = {
					current: sortByCurrentMaxRisk,
					target: sortByTargetMaxRisk,
				};
			}

			dataThreatsByRootInstances.push(dataSet);
		};

		function updateVulnerabilities(risks) {
			risks.forEach(function(risk) {
				let vulnerabilityFound = dataAllVulnerabilities.find(function(vulnerability) {
					return vulnerability.id == risk.vulnerability
				});
				if (vulnerabilityFound == undefined) {
					dataAllVulnerabilities.push({
						id: risk.vulnerability,
						category: $scope._langField(risk, 'vulnLabel'),
						occurrence: 1,
						value: null,
						average: risk.vulnerabilityRate,
						max_risk: risk.max_risk
					})
				} else {
					vulnerabilityFound.occurrence += 1;
					vulnerabilityFound.average *= (vulnerabilityFound.occurrence - 1);
					vulnerabilityFound.average += risk.vulnerabilityRate;
					vulnerabilityFound.average = vulnerabilityFound.average / vulnerabilityFound.occurrence;
				}
			});
		};

		function updateVulnerabilitiesByRootInstances(risks, instance) {
			let dataSet = [];
			if (risks.length) {
				let sortByCurrentMaxRisk = angular.copy(risks)
					.map(vulnerability => ({
						uuid: vulnerability.vulnerability,
						value: vulnerability.max_risk,
						asset: $scope._langField(instance, 'name'),
						qualification: vulnerability.vulnerabilityRate,
						title: $scope._langField(instance, 'name') + ' - ' + gettextCatalog.getString('Current risks'),
						category: $scope._langField(vulnerability, 'vulnLabel'),
					}))
					.sort((a, b) => {
						return b.value - a.value || a.category.localeCompare(b.category)
					})
					.reduce((acc, vulnerability) => {
						const duplicate = acc.find(item => item.uuid == vulnerability.uuid);
						if (!duplicate) {
							return acc.concat([vulnerability])
						};
						return acc;
					}, []);

				let sortByTargetMaxRisk = angular.copy(risks)
					.map(vulnerability => ({
						uuid: vulnerability.vulnerability,
						value: vulnerability.target_risk,
						asset: $scope._langField(instance, 'name'),
						qualification: vulnerability.vulnerabilityRate,
						title: $scope._langField(instance, 'name') + ' - ' + gettextCatalog.getString('Residual risks'),
						category: $scope._langField(vulnerability, 'vulnLabel'),
					}))
					.sort((a, b) => {
						return b.value - a.value || a.category.localeCompare(b.category)
					})
					.reduce((acc, vulnerability) => {
						const duplicate = acc.find(item => item.uuid == vulnerability.uuid);
						if (!duplicate) {
							return acc.concat([vulnerability])
						};
						return acc;
					}, []);

				dataSet = {
					current: sortByCurrentMaxRisk,
					target: sortByTargetMaxRisk,
				};
			}

			dataVulnerabilitiesByRootInstances.push(dataSet);
		};

		function updateCartography() {
			let impacts = cartoCurrent.Impact;
			let opRiskimpacts = cartoCurrent.OpRiskImpact;
			let likelihoods = cartoCurrent.MxV;
			let probabilities = cartoCurrent.Likelihood;
			let countersCurrent = cartoCurrent.riskInfo.counters;
			let countersTarget = cartoTarget.riskInfo.counters;
			let countersRiskOpCurrent = cartoCurrent.riskOp.counters;
			let countersRiskOpTarget = cartoTarget.riskOp.counters;

			impacts.forEach(function(impact) {
				likelihoods.forEach(function(likelihood) {
					dataCurrentCartography.push({
						y: impact,
						x: likelihood,
						value: (countersCurrent[impact] !== undefined && countersCurrent[impact][likelihood] !== undefined) ?
							countersCurrent[impact][likelihood] : null,
						amvsCurrent: (countersCurrent[impact] !== undefined && countersCurrent[impact][likelihood] !== undefined) ?
							countersCurrent[impact][likelihood] : null
					})

					dataTargetCartography.push({
						y: impact,
						x: likelihood,
						value: (countersTarget[impact] !== undefined && countersTarget[impact][likelihood] !== undefined) ?
							countersTarget[impact][likelihood] : null,
						amvsTarget: (countersTarget[impact] !== undefined && countersTarget[impact][likelihood] !== undefined) ?
							countersTarget[impact][likelihood] : null
					})
				});
			})

			opRiskimpacts.forEach(function(impact) {
				probabilities.forEach(function(likelihood) {
					dataCurrentCartographyRiskOp.push({
						y: impact,
						x: likelihood,
						value: (countersRiskOpCurrent[impact] !== undefined && countersRiskOpCurrent[impact][likelihood] !== undefined) ?
							countersRiskOpCurrent[impact][likelihood] : null,
						rolfRisksCurrent: (countersRiskOpCurrent[impact] !== undefined && countersRiskOpCurrent[impact][likelihood] !== undefined) ?
							countersRiskOpCurrent[impact][likelihood] : null
					})

					dataTargetCartographyRiskOp.push({
						y: impact,
						x: likelihood,
						value: (countersRiskOpTarget[impact] !== undefined && countersRiskOpTarget[impact][likelihood] !== undefined) ?
							countersRiskOpTarget[impact][likelihood] : null,
						rolfRisksTarget: (countersRiskOpTarget[impact] !== undefined && countersRiskOpTarget[impact][likelihood] !== undefined) ?
							countersRiskOpTarget[impact][likelihood] : null
					})
				});
			});
		};

		function updateCompliance(referentials, categories, data) {
			let categoriesIds = data.map(soa => soa.measure.category.id);

			referentials.forEach(function(ref) {
				dataCompliance[ref.uuid] = [{
						category: "Current level",
						series: []
					},
					{
						category: "Applicable target level",
						series: []
					}
				];
				categories
					.filter(category => category.referential.uuid == ref.uuid && categoriesIds.includes(category.id))
					.forEach(function(cat) {
						let catCurrentData = {
							label: $scope._langField(cat, 'label'),
							value: null,
							data: []
						}
						let catTargetData = {
							label: $scope._langField(cat, 'label'),
							value: null,
							data: []
						}
						let currentSoas = data.filter(soa => soa.measure.category.id == cat.id);
						let targetSoas = data.filter(soa => soa.measure.category.id == cat.id && soa.EX != 1);
						let controlCurrentData = [];
						let controlTargetData = [];
						let ratioOfComplianceLevel = 1 / ($scope.soaScale.levels.max - 1);

						currentSoas.forEach(function(soa) {
							if (soa.EX == 1 || soa.soaScaleComment == null || soa.soaScaleComment.isHidden) {
								soa.soaScaleComment = {
									scaleIndex: 0
								}
							}
							controlCurrentData.push({
								label: soa.measure.code,
								value: (soa.soaScaleComment.scaleIndex * ratioOfComplianceLevel).toFixed(2)
							})
							controlTargetData.push({
								label: soa.measure.code,
								value: ((soa.EX == 1) ? 0 : 1)
							})
						});

						catCurrentData.data.push({
							category: "Current level",
							series: controlCurrentData
						});

						catTargetData.data.push({
							category: "Applicable target level",
							series: controlTargetData
						});

						let complianceCurrentValues = currentSoas.map(soa => soa.soaScaleComment.scaleIndex);
						let sum = complianceCurrentValues.reduce(function(a, b) {
							return a + b;
						}, 0);
						let currentAvg = (sum / complianceCurrentValues.length) * ratioOfComplianceLevel;
						let targetAvg = (targetSoas.length / complianceCurrentValues.length);
						catCurrentData.value = currentAvg.toFixed(2);
						catTargetData.value = targetAvg.toFixed(2);

						dataCompliance[ref.uuid][0].series.push(catCurrentData);
						dataCompliance[ref.uuid][1].series.push(catTargetData);
					})
			});
		}

		function updateRecommendations(recs) {
			recs.forEach(function(rec) {
				let newObjAmvKey = null;
				let recFound = dataRecommendationsByOccurrence.find(function(r) {
					return r.id == rec.recommendation.uuid
				});
				if (recFound == undefined) {
					let recommendation = {
						id: rec.recommendation.uuid,
						category: rec.recommendation.code,
						amvs: [],
						rolfRisks: [],
						value: 1,
					}

					if (rec.instanceRisk) {
						newObjAmvKey = rec.instance.object.uuid +
							rec.instanceRisk.threat.uuid +
							rec.instanceRisk.vulnerability.uuid;
						recommendation.amvs.push(newObjAmvKey);
					} else {
						recommendation.rolfRisks.push(rec.instanceRiskOp.rolfRisk.id);
					}

					dataRecommendationsByOccurrence.push(recommendation)
				} else {
					if (rec.instanceRisk) {
						newObjAmvKey = rec.instance.object.uuid +
							rec.instanceRisk.threat.uuid +
							rec.instanceRisk.vulnerability.uuid;
						if (!recFound.amvs.includes(newObjAmvKey)) {
							recFound.amvs.push(newObjAmvKey);
							recFound.value += 1
						}
					} else if (rec.instanceRiskOp) {
						recFound.rolfRisks.push(rec.instanceRiskOp.rolfRisk.id);
						recFound.value += 1;
					}
				}

				let assetFound = dataRecommendationsByAsset.find(function(asset) {
					return asset.id == rec.instance.object.uuid
				});
				if (assetFound == undefined) {
					dataRecommendationsByAsset.push({
						id: rec.instance.object.uuid,
						category: $scope._langField(rec.instance, 'name'),
						value: 1,
					})
				} else {
					assetFound.value += 1;
				}

				let importanceFound = dataRecommendationsByImportance.find(function(importance) {
					return importance.importance == rec.recommendation.importance
				});
				if (importanceFound == undefined) {
					dataRecommendationsByImportance.push({
						uuid: [rec.recommendation.uuid],
						importance: rec.recommendation.importance,
						category: (rec.recommendation.importance == 3) ?
							'Urgent (•••)' : (rec.recommendation.importance == 2) ?
							'Important (••)' : 'Optional (•)',
						value: 1,
					})
				} else {
					if (!importanceFound.uuid.includes(rec.recommendation.uuid)) {
						importanceFound.value += 1;
						importanceFound.uuid.push(rec.recommendation.uuid);
					}
				}
			});

			dataRecommendationsByOccurrence.sort(function(a, b) {
				return b.value - a.value
			})

			dataRecommendationsByAsset.sort(function(a, b) {
				return b.value - a.value
			})

			dataRecommendationsByImportance.sort(function(a, b) {
				return b.importance - a.importance
			})
		};

		// DRAW CHART FUNCTIONS ========================================================

		function drawCurrentRisk() {
			let chartType = 'verticalBarChart';
			let chartId = '#graphCurrentRisks';
			let chartData = dataCurrentRisksByLevel;
			let chartOptions = optionsRisksByLevel;

			if ($scope.displayCurrentRisksBy == "level") {
				optionsRisksByLevel.width = getParentWidth('graphCurrentRisks');
				chartOptions = optionsRisksByLevel;
				chartType = $scope.currentRisksOptions == 'vertical' ?
					'verticalBarChart' :
					'donutChart';
				chartData = $scope.currentRisksTreatmentOptions == 'all' ?
					dataCurrentRisksByLevel :
					dataCurrentRisksByLevelAndTreatment[$scope.currentRisksTreatmentOptions];
			}
			if ($scope.displayCurrentRisksBy == "treatment") {
				if ($scope.currentRisksTreatmentAndAssetOptions == "all") {
					optionsRisksByTreatment.width = getParentWidth('graphCurrentRisks');
					chartOptions = optionsRisksByTreatment;
					chartType = 'verticalBarChart';
					chartData = dataCurrentRisksByTreatment;
				}
				if ($scope.currentRisksTreatmentAndAssetOptions == "asset") {
					optionsRisksByTreatmentAndAsset.width = getParentWidth('graphCurrentRisks');
					chartOptions = optionsRisksByTreatmentAndAsset;
					chartType = 'multiVerticalBarChart';
					chartData = dataCurrentRisksByTreatmentAndAsset;
				}
				if ($scope.currentRisksTreatmentAndAssetOptions == "parentAsset") {
					optionsRisksByTreatmentAndAsset.width = getParentWidth('graphCurrentRisks');
					chartOptions = optionsRisksByTreatmentAndAsset;
					chartType = 'multiVerticalBarChart';
					chartData = dataCurrentRisksByTreatmentAndParentAsset;
				}
			}
			if ($scope.displayCurrentRisksBy == "asset") {
				optionsRisksByAsset.width = getParentWidth('graphCurrentRisks');
				chartOptions = optionsRisksByAsset;
				chartType = 'multiVerticalBarChart';
				chartData = $scope.currentRisksTreatmentOptions == 'all' ?
					dataCurrentRisksByAsset :
					dataCurrentRisksByAssetAndTreatment[$scope.currentRisksTreatmentOptions];
			}
			if ($scope.displayCurrentRisksBy == "parentAsset") {
				optionsCurrentRisksByParent.width = getParentWidth('graphCurrentRisks');
				chartType = 'multiVerticalBarChart';
				chartData = dataCurrentRisksByParent;
				chartOptions = optionsCurrentRisksByParent;
				chartData = $scope.currentRisksTreatmentOptions == 'all' ?
					dataCurrentRisksByParent :
					dataCurrentRisksByParentAndTreatment[$scope.currentRisksTreatmentOptions];
			}
			drawChart(chartId, chartType, chartData, chartOptions);
		};

		function drawTargetRisk() {
			let chartType = 'verticalBarChart';
			let chartId = '#graphTargetRisks';
			let chartData = dataTargetRisksByLevel;
			let chartOptions = optionsRisksByLevel;

			if ($scope.displayTargetRisksBy == "level") {
				optionsRisksByLevel.width = getParentWidth('graphTargetRisks');
				chartOptions = optionsRisksByLevel;
				chartType = $scope.targetRisksOptions == 'vertical' ?
					'verticalBarChart' :
					'donutChart';
				chartData = $scope.targetRisksTreatmentOptions == 'all' ?
					dataTargetRisksByLevel :
					dataTargetRisksByLevelAndTreatment[$scope.targetRisksTreatmentOptions];
			}
			if ($scope.displayTargetRisksBy == "treatment") {
				if ($scope.targetRisksTreatmentAndAssetOptions == "all") {
					optionsRisksByTreatment.width = getParentWidth('graphTargetRisks');
					chartOptions = optionsRisksByTreatment;
					chartType = 'verticalBarChart';
					chartData = dataTargetRisksByTreatment;
				}
				if ($scope.targetRisksTreatmentAndAssetOptions == "asset") {
					optionsRisksByTreatmentAndAsset.width = getParentWidth('graphCurrentRisks');
					chartOptions = optionsRisksByTreatmentAndAsset;
					chartType = 'multiVerticalBarChart';
					chartData = dataTargetRisksByTreatmentAndAsset;
				}
				if ($scope.targetRisksTreatmentAndAssetOptions == "parentAsset") {
					optionsRisksByTreatmentAndAsset.width = getParentWidth('graphCurrentRisks');
					chartOptions = optionsRisksByTreatmentAndAsset;
					chartType = 'multiVerticalBarChart';
					chartData = dataTargetRisksByTreatmentAndParentAsset;
				}
			}
			if ($scope.displayTargetRisksBy == "asset") {
				optionsRisksByAsset.width = getParentWidth('graphTargetRisks');
				chartOptions = optionsRisksByAsset;
				chartType = 'multiVerticalBarChart';
				chartData = $scope.targetRisksTreatmentOptions == 'all' ?
					dataTargetRisksByAsset :
					dataTargetRisksByAssetAndTreatment[$scope.targetRisksTreatmentOptions];
			}
			if ($scope.displayTargetRisksBy == "parentAsset") {
				optionsTargetRisksByParent.width = getParentWidth('graphTargetRisks');
				chartType = 'multiVerticalBarChart';
				chartData = dataTargetRisksByParent;
				chartOptions = optionsTargetRisksByParent;
				chartData = $scope.targetRisksTreatmentOptions == 'all' ?
					dataTargetRisksByParent :
					dataTargetRisksByParentAndTreatment[$scope.targetRisksTreatmentOptions];
			}
			drawChart(chartId, chartType, chartData, chartOptions);
		};

		function drawCurrentOpRisk() {
			let chartType = 'verticalBarChart';
			let chartId = '#graphCurrentOpRisks';
			let chartData = dataCurrentOpRisksByLevel;
			let chartOptions = optionsRisksByLevel;

			if ($scope.displayCurrentOpRisksBy == "level") {
				optionsOpRisksByLevel.width = getParentWidth('graphCurrentOpRisks');
				chartOptions = optionsRisksByLevel;
				chartType = $scope.currentOpRisksOptions == 'vertical' ?
					'verticalBarChart' :
					'donutChart';
				chartData = $scope.currentOpRisksTreatmentOptions == 'all' ?
					dataCurrentOpRisksByLevel :
					dataCurrentOpRisksByLevelAndTreatment[$scope.currentOpRisksTreatmentOptions];
			}
			if ($scope.displayCurrentOpRisksBy == "treatment") {
				if ($scope.currentOpRisksTreatmentAndAssetOptions == "all") {
					optionsRisksByTreatment.width = getParentWidth('graphCurrentOpRisks');
					chartOptions = optionsRisksByTreatment;
					chartType = 'verticalBarChart';
					chartData = dataCurrentOpRisksByTreatment;
				}
				if ($scope.currentOpRisksTreatmentAndAssetOptions == "asset") {
					optionsRisksByTreatmentAndAsset.width = getParentWidth('graphCurrentOpRisks');
					chartOptions = optionsRisksByTreatmentAndAsset;
					chartType = 'multiVerticalBarChart';
					chartData = dataCurrentOpRisksByTreatmentAndAsset;
				}
				if ($scope.currentOpRisksTreatmentAndAssetOptions == "parentAsset") {
					optionsRisksByTreatmentAndAsset.width = getParentWidth('graphCurrentOpRisks');
					chartOptions = optionsRisksByTreatmentAndAsset;
					chartType = 'multiVerticalBarChart';
					chartData = dataCurrentOpRisksByTreatmentAndParentAsset;
				}
			}
			if ($scope.displayCurrentOpRisksBy == "asset") {
				optionsOpRisksByAsset.width = getParentWidth('graphCurrentOpRisks');
				chartOptions = optionsOpRisksByAsset;
				chartType = 'multiVerticalBarChart';
				chartData = $scope.currentOpRisksTreatmentOptions == 'all' ?
					dataCurrentOpRisksByAsset :
					dataCurrentOpRisksByAssetAndTreatment[$scope.currentOpRisksTreatmentOptions];
			}
			if ($scope.displayCurrentOpRisksBy == "parentAsset") {
				optionsCurrentOpRisksByParent.width = getParentWidth('graphCurrentRisks');
				chartType = 'multiVerticalBarChart';
				chartData = dataCurrentOpRisksByParent;
				chartOptions = optionsCurrentOpRisksByParent;
				chartData = $scope.currentOpRisksTreatmentOptions == 'all' ?
					dataCurrentOpRisksByParent :
					dataCurrentOpRisksByParentAndTreatment[$scope.currentOpRisksTreatmentOptions];
			}
			drawChart(chartId, chartType, chartData, chartOptions);
		};

		function drawTargetOpRisk() {
			let chartType = 'verticalBarChart';
			let chartId = '#graphTargetOpRisks';
			let chartData = dataTargetOpRisksByLevel;
			let chartOptions = optionsRisksByLevel;

			if ($scope.displayTargetOpRisksBy == "level") {
				optionsOpRisksByLevel.width = getParentWidth('graphTargetOpRisks');
				chartOptions = optionsRisksByLevel;
				chartType = $scope.targetOpRisksOptions == 'vertical' ?
					'verticalBarChart' :
					'donutChart';
				chartData = $scope.targetOpRisksTreatmentOptions == 'all' ?
					dataTargetOpRisksByLevel :
					dataTargetOpRisksByLevelAndTreatment[$scope.targetOpRisksTreatmentOptions];
			}
			if ($scope.displayTargetOpRisksBy == "treatment") {
				if ($scope.targetOpRisksTreatmentAndAssetOptions == "all") {
					optionsRisksByTreatment.width = getParentWidth('graphCurrentOpRisks');
					chartOptions = optionsRisksByTreatment;
					chartType = 'verticalBarChart';
					chartData = dataTargetOpRisksByTreatment;
				}
				if ($scope.targetOpRisksTreatmentAndAssetOptions == "asset") {
					optionsRisksByTreatmentAndAsset.width = getParentWidth('graphCurrentOpRisks');
					chartOptions = optionsRisksByTreatmentAndAsset;
					chartType = 'multiVerticalBarChart';
					chartData = dataTargetOpRisksByTreatmentAndAsset;
				}
				if ($scope.targetOpRisksTreatmentAndAssetOptions == "parentAsset") {
					optionsRisksByTreatmentAndAsset.width = getParentWidth('graphCurrentOpRisks');
					chartOptions = optionsRisksByTreatmentAndAsset;
					chartType = 'multiVerticalBarChart';
					chartData = dataTargetOpRisksByTreatmentAndParentAsset;
				}
			}
			if ($scope.displayTargetOpRisksBy == "asset") {
				optionsOpRisksByAsset.width = getParentWidth('graphTargetOpRisks');
				chartOptions = optionsOpRisksByAsset;
				chartType = 'multiVerticalBarChart';
				chartData = $scope.targetOpRisksTreatmentOptions == 'all' ?
					dataTargetOpRisksByAsset :
					dataTargetOpRisksByAssetAndTreatment[$scope.targetOpRisksTreatmentOptions];
			}
			if ($scope.displayTargetOpRisksBy == "parentAsset") {
				optionsTargetOpRisksByParent.width = getParentWidth('graphCurrentRisks');
				chartType = 'multiVerticalBarChart';
				chartData = dataTargetOpRisksByParent;
				chartOptions = optionsTargetOpRisksByParent;
				chartData = $scope.targetOpRisksTreatmentOptions == 'all' ?
					dataTargetOpRisksByParent :
					dataTargetOpRisksByParentAndTreatment[$scope.targetOpRisksTreatmentOptions];
			}
			drawChart(chartId, chartType, chartData, chartOptions);
		};

		function drawThreats() {
			let chartType = 'horizontalBarChart';
			let chartId = '#graphThreats';
			let chartData = dataThreats;
			let chartOptions = angular.copy(optionsHorizontalThreats);

			if ($scope.threatsOptions == 'horizontal') {
				chartType = 'horizontalBarChart';
				chartOptions = angular.copy(optionsHorizontalThreats);
				chartOptions.width = getParentWidth('graphThreats', 0.9);
				chartOptions.margin.left = chartOptions.width * 0.15;
			}

			if ($scope.threatsOptions == 'vertical') {
				chartType = 'verticalBarChart';
				chartOptions = angular.copy(optionsVerticalThreats);
				chartOptions.width = getParentWidth('graphThreats', 0.9);
			}

			if ($scope.displayThreatsBy == "occurrence") {
				chartData.map(d => {
					d.value = d.occurrence;
					return d
				});
			}

			if ($scope.displayThreatsBy == "probability") {
				chartData.map(d => {
					d.value = d.average;
					return d
				});

				chartOptions.forceDomainX = chartOptions.forceDomainY = {
					min: threatScale.min,
					max: threatScale.max
				};

				chartOptions.xLabel = chartOptions.yLabel = "Probability";
			}

			if ($scope.displayThreatsBy == "max_associated_risk") {
				chartData.map(d => {
					d.value = d.max_risk;
					return d
				});

				chartOptions.xLabel = chartOptions.yLabel = "Max. risk value";

			}

			if ($scope.displayThreatsBy == "parentAsset") {
				chartOptions = angular.copy(optionsHorizontalThreats);
				chartOptions.width = getParentWidth('graphThreats', 0.9) / 2;
				chartOptions.height = 300;
				chartOptions.xLabel = "Max. risk value";
				chartType = 'minihorizontalBarCharts';
				chartData = dataThreatsByRootInstances.flatMap(x => {
					if (x && x.current && x.target) {
						let top = $scope.threatsParentAssetsOptions;
						return [
							x.current.slice(0, top),
							x.target.slice(0, top)
						]
					}
				});
			}

			drawChart(chartId, chartType, chartData, chartOptions);
		};

		function drawVulnerabilities() {
			let chartType = 'horizontalBarChart';
			let chartId = '#graphVulnerabilities';
			let chartData = dataAllVulnerabilities;
			let chartOptions = angular.copy(optionsHorizontalVulnerabilities);

			if (chartData.length >= $scope.vulnerabilitiesDisplayed && $scope.vulnerabilitiesDisplayed !== "all") {
				dataAllVulnerabilities.sort((a, b) => {
					return b.value - a.value
				});
				chartData = dataAllVulnerabilities.slice(0, $scope.vulnerabilitiesDisplayed);
			}

			if ($scope.vulnerabilitiesOptions == 'horizontal') {
				chartType = 'horizontalBarChart';
				chartOptions = angular.copy(optionsHorizontalVulnerabilities);
				if (chartData.length > 30) {
					chartOptions.height += (chartData.length - 30) * 30;
				}
				chartOptions.width = getParentWidth('graphVulnerabilities', 0.9);
				chartOptions.margin.left = chartOptions.width * 0.2;
			}

			if ($scope.vulnerabilitiesOptions == 'vertical') {
				chartType = 'verticalBarChart';
				chartOptions = angular.copy(optionsVerticalVulnerabilities);
				chartOptions.width = getParentWidth('graphVulnerabilities', 0.9);
				if (chartData.length > 30) {
					let maxWidth = getParentWidth('graphVulnerabilities', 0.9);
					let resizeWidth = chartOptions.width + (chartData.length - 30) * 10;
					chartOptions.width = Math.min(resizeWidth, maxWidth);
				}
			}

			if ($scope.displayVulnerabilitiesBy == "occurrence") {
				chartData.map(d => {
					d.value = d.occurrence;
					return d
				});
			}

			if ($scope.displayVulnerabilitiesBy == "qualification") {
				chartData.map(d => {
					d.value = d.average;
					return d
				});
				chartOptions.forceDomainX = chartOptions.forceDomainY = {
					min: vulnerabilityScale.min,
					max: vulnerabilityScale.max
				};
				chartOptions.xLabel = chartOptions.yLabel = "Qualification";

			}

			if ($scope.displayVulnerabilitiesBy == "max_associated_risk") {
				chartData.map(d => {
					d.value = d.max_risk;
					return d
				});
				chartOptions.xLabel = chartOptions.yLabel = "Max. risk value";
			}

			if ($scope.displayVulnerabilitiesBy == "parentAsset") {
				chartOptions = angular.copy(optionsHorizontalVulnerabilities);
				chartOptions.width = getParentWidth('graphVulnerabilities', 0.9) / 2;
				chartOptions.height = 300;
				chartOptions.xLabel = "Max. risk value";
				chartType = 'minihorizontalBarCharts';
				chartData = dataVulnerabilitiesByRootInstances.flatMap(x => {
					if (x && x.current && x.target) {
						let top = $scope.vulnerabilitiesParentAssetsOptions;
						return [
							x.current.slice(0, top),
							x.target.slice(0, top)
						]
					}
				});
			}

			drawChart(chartId, chartType, chartData, chartOptions);
		};

		function drawCartography() {
			let chartType = 'heatmapChart';
			let chartOptions = angular.copy(optionsCartography);
			let chartCurrentData = dataCurrentCartography;
			let chartTargetData = dataTargetCartography;

			if ($scope.cartographyRisksType == "info_risks" && anr) {
				chartOptions.xLabel = 'Likelihood';
				chartOptions.threshold = [anr.seuil1, anr.seuil2];
				chartOptions.width = getParentWidth('graphCartographyCurrent');
				chartCurrentData = dataCurrentCartography;
				chartTargetData = dataTargetCartography;
			} else if (anr) {
				chartOptions.xLabel = 'Probability';
				chartOptions.width = getParentWidth('graphCartographyCurrent', 0.6);
				chartOptions.threshold = [anr.seuilRolf1, anr.seuilRolf2];
				chartCurrentData = dataCurrentCartographyRiskOp;
				chartTargetData = dataTargetCartographyRiskOp;
			}
			drawChart('#graphCartographyCurrent', chartType, chartCurrentData, chartOptions);
			drawChart('#graphCartographyTarget', chartType, chartTargetData, chartOptions);
		};

		function drawCompliance() {
			let chartData = dataCompliance[$scope.referentialSelected] ? dataCompliance[$scope.referentialSelected] : dataCompliance;
			let chartOptions = angular.copy(optionsChartCompliance);

			chartOptions.width = getParentWidth('graphCompliance', 0.45);
			drawChart('#graphCompliance', 'radarChart', chartData, chartOptions);
		};

		function drawRecommendations() {
			let chartType = 'horizontalBarChart';
			let chartId = '#graphRecommendations';
			let chartData = dataRecommendationsByOccurrence;
			let chartOptions = angular.copy(optionsHorizontalRecommendations);

			if ($scope.recommendationsOptions == 'horizontal') {
				chartType = 'horizontalBarChart';
				chartOptions = angular.copy(optionsHorizontalRecommendations);
				chartOptions.width = getParentWidth('graphRecommendations', 0.9);
				chartOptions.margin.left = chartOptions.width * ($scope.displayRecommendationsBy == "importance" ? 0.1 : 0.2);
			} else {
				chartType = 'verticalBarChart';
				chartOptions = angular.copy(optionsVerticalRecommendations);
				chartOptions.width = getParentWidth('graphRecommendations', 0.9);
			}

			if ($scope.displayRecommendationsBy == "occurrence") {
				chartData = dataRecommendationsByOccurrence;
			}

			if ($scope.displayRecommendationsBy == "asset") {
				chartData = dataRecommendationsByAsset;
			}

			if ($scope.displayRecommendationsBy == "importance") {
				chartOptions.width = getParentWidth('graphRecommendations', 0.5);
				chartOptions.sort = false;
				delete chartOptions.rotationXAxisLabel;
				delete chartOptions.offsetXAxisLabel;
				chartData = dataRecommendationsByImportance;
			}
			drawChart(chartId, chartType, chartData, chartOptions);
		};

		function drawChart(id, type, data, options) {
			ChartService[type](
				id,
				data,
				options
			);
		}

		// BREADCRUMB MANAGE FUNCTIONS =================================================

		//function triggered by 'return' button : loads graph data in memory tab then deletes it
		$scope.goBackCurrentRisks = function() {
			$scope.currentRisksBreadcrumb.pop();
			$scope.currentRisksMemoryTab.pop();
			dataCurrentRisksByParent = $scope.currentRisksMemoryTab[$scope.currentRisksMemoryTab.length - 1][0];
			dataCurrentRisksByParentAndTreatment = $scope.currentRisksMemoryTab[$scope.currentRisksMemoryTab.length - 1][1];
			drawCurrentRisk();
		}

		//function triggered with the interactive breadcrumb : id is held by the button
		$scope.breadcrumbGoBackCurrentRisks = function(id) {
			if ($scope.currentRisksBreadcrumb.length > 4) {
				dataCurrentRisksByParent = $scope.currentRisksMemoryTab[id + $scope.currentRisksBreadcrumb.length - 4][0];
				dataCurrentRisksByParentAndTreatment = $scope.currentRisksMemoryTab[id + $scope.currentRisksBreadcrumb.length - 4][1];
				$scope.currentRisksMemoryTab = $scope.currentRisksMemoryTab.slice(0, id + $scope.currentRisksBreadcrumb.length - 3); //only keep elements before the one we display
				$scope.currentRisksBreadcrumb = $scope.currentRisksBreadcrumb.slice(0, id + $scope.currentRisksBreadcrumb.length - 3);
			} else {
				dataCurrentRisksByParent = $scope.currentRisksMemoryTab[id][0];
				dataCurrentRisksByParentAndTreatment = $scope.currentRisksMemoryTab[id][1];
				$scope.currentRisksMemoryTab = $scope.currentRisksMemoryTab.slice(0, id + 1); //only keep elements before the one we display
				$scope.currentRisksBreadcrumb = $scope.currentRisksBreadcrumb.slice(0, id + 1);
			}
			drawCurrentRisk();
		}

		//function triggered by 'return' button : loads graph data in memory tab then deletes it
		$scope.goBackTargetRisks = function() {
			$scope.targetRisksBreadcrumb.pop();
			$scope.targetRisksMemoryTab.pop();
			dataTargetRisksByParent = $scope.targetRisksMemoryTab[$scope.targetRisksMemoryTab.length - 1][0];
			dataTargetRisksByParentAndTreatment = $scope.targetRisksMemoryTab[$scope.targetRisksMemoryTab.length - 1][1];
			drawTargetRisk();
		}

		//function triggered with the interactive breadcrumb : id is held by the button
		$scope.breadcrumbGoBackTargetRisks = function(id) {
			if ($scope.targetRisksBreadcrumb.length > 4) {
				dataTargetRisksByParent = $scope.targetRisksMemoryTab[id + $scope.targetRisksBreadcrumb.length - 4][0];
				dataTargetRisksByParentAndTreatment = $scope.targetRisksMemoryTab[id + $scope.targetRisksBreadcrumb.length - 4][1];
				$scope.targetRisksMemoryTab = $scope.targetRisksMemoryTab.slice(0, id + $scope.targetRisksBreadcrumb.length - 3); //only keep elements before the one we display
				$scope.targetRisksBreadcrumb = $scope.targetRisksBreadcrumb.slice(0, id + $scope.targetRisksBreadcrumb.length - 3);
				drawTargetRisk();
			} else {
				dataTargetRisksByParent = $scope.targetRisksMemoryTab[id][0];
				dataTargetRisksByParentAndTreatment = $scope.targetRisksMemoryTab[id][1];
				$scope.targetRisksMemoryTab = $scope.targetRisksMemoryTab.slice(0, id + 1); //only keep elements before the one we display
				$scope.targetRisksBreadcrumb = $scope.targetRisksBreadcrumb.slice(0, id + 1);
				drawTargetRisk();
			}
		}

		//function triggered by 'return' button : loads graph data in memory tab then deletes it
		$scope.goBackCurrentOpRisks = function() {
			$scope.currentOpRisksBreadcrumb.pop();
			$scope.currentOpRisksMemoryTab.pop();
			dataCurrentOpRisksByParent = $scope.currentOpRisksMemoryTab[$scope.currentOpRisksMemoryTab.length - 1][0];
			dataCurrentOpRisksByParentAndTreatment = $scope.currentOpRisksMemoryTab[$scope.currentOpRisksMemoryTab.length - 1][1];
			drawCurrentOpRisk();
		}

		//function triggered with the interactive breadcrumb : id is held by the button
		$scope.breadcrumbGoBackCurrentOpRisks = function(id) {
			if ($scope.currentOpRisksBreadcrumb.length > 4) {
				dataCurrentOpRisksByParent = $scope.currentOpRisksMemoryTab[id + $scope.currentOpRisksBreadcrumb.length - 4][0];
				dataCurrentOpRisksByParentAndTreatment = $scope.currentOpRisksMemoryTab[id + $scope.currentOpRisksBreadcrumb.length - 4][1];
				$scope.currentOpRisksMemoryTab = $scope.currentOpRisksMemoryTab.slice(0, id + $scope.currentOpRisksBreadcrumb.length - 3); //only keep elements before the one we display
				$scope.currentOpRisksBreadcrumb = $scope.currentOpRisksBreadcrumb.slice(0, id + $scope.currentOpRisksBreadcrumb.length - 3);
			} else {
				dataCurrentOpRisksByParent = $scope.currentOpRisksMemoryTab[id][0];
				dataCurrentOpRisksByParentAndTreatment = $scope.currentOpRisksMemoryTab[id][1];
				$scope.currentOpRisksMemoryTab = $scope.currentOpRisksMemoryTab.slice(0, id + 1); //only keep elements before the one we display
				$scope.currentOpRisksBreadcrumb = $scope.currentOpRisksBreadcrumb.slice(0, id + 1);
			}
			drawCurrentOpRisk();
		}

		//function triggered by 'return' button : loads graph data in memory tab then deletes it
		$scope.goBackTargetOpRisks = function() {
			$scope.targetOpRisksBreadcrumb.pop();
			$scope.targetOpRisksMemoryTab.pop();
			dataTargetOpRisksByParent = $scope.targetOpRisksMemoryTab[$scope.targetOpRisksMemoryTab.length - 1][0];
			dataTargetOpRisksByParentAndTreatment = $scope.targetOpRisksMemoryTab[$scope.targetOpRisksMemoryTab.length - 1][1];
			drawTargetOpRisk();
		}

		//function triggered with the interactive breadcrumb : id is held by the button
		$scope.breadcrumbGoBackTargetOpRisks = function(id) {
			if ($scope.targetOpRisksBreadcrumb.length > 4) {
				dataTargetOpRisksByParent = $scope.targetOpRisksMemoryTab[id + $scope.targetOpRisksBreadcrumb.length - 4][0];
				dataTargetOpRisksByParentAndTreatment = $scope.targetOpRisksMemoryTab[id + $scope.targetOpRisksBreadcrumb.length - 4][1];
				$scope.targetOpRisksMemoryTab = $scope.targetOpRisksMemoryTab.slice(0, id + $scope.targetOpRisksBreadcrumb.length - 3); //only keep elements before the one we display
				$scope.targetOpRisksBreadcrumb = $scope.targetOpRisksBreadcrumb.slice(0, id + $scope.targetOpRisksBreadcrumb.length - 3);
			} else {
				dataTargetOpRisksByParent = $scope.targetOpRisksMemoryTab[id][0];
				dataTargetOpRisksByParentAndTreatment = $scope.targetOpRisksMemoryTab[id][1];
				$scope.targetOpRisksMemoryTab = $scope.targetOpRisksMemoryTab.slice(0, id + 1); //only keep elements before the one we display
				$scope.targetOpRisksBreadcrumb = $scope.targetOpRisksBreadcrumb.slice(0, id + 1);
			}
			drawTargetOpRisk();
		}

		// DIALOGS =====================================================================

		function risksTable(risks = [], opRisks = []) {
			var useFullScreen = ($mdMedia('sm') || $mdMedia('xs'));

			$mdDialog.show({
				controller: risksTableDialogCtrl,
				templateUrl: 'views/anr/anr.dashboard.risks.html',
				preserveScope: true,
				scope: $scope,
				clickOutsideToClose: false,
				fullscreen: useFullScreen,
				locals: {
					'risks': risks,
					'opRisks': opRisks
				}
			})
		};

		function risksTableDialogCtrl($scope, $mdDialog, risks, opRisks) {
			$scope.risks = risks;
			$scope.opRisks = opRisks;
			$scope.cancel = function() {
				$mdDialog.cancel();
			};
		}

		// EXPORT FUNCTIONS  ===========================================================

		$scope.generateXlsxData = function() {

			let wb = XLSX.utils.book_new();
			let mergedCellsRisks = [{
					s: {
						r: 0,
						c: 0
					},
					e: {
						r: 2,
						c: 0
					}
				},
				{
					s: {
						r: 0,
						c: 1
					},
					e: {
						r: 0,
						c: 42
					}
				},
				{
					s: {
						r: 0,
						c: 43
					},
					e: {
						r: 0,
						c: 84
					}
				}
			];
			let kindOfTreatment = ["all"].concat(Object.keys(dataCurrentRisksByLevelAndTreatment));
			let risksLabels = [
				"Low risks",
				"Max. risk average",
				"Medium risks",
				"Max. risk average",
				"High risks",
				"Max. risk average"
			];
			let firstLevelHeadings = ['Asset', 'Current risks']
				.concat(new Array(risksLabels.length * kindOfTreatment.length - 1).fill(null))
				.concat(['Residual risks'])
				.concat(new Array(risksLabels.length * kindOfTreatment.length - 1).fill(null));

			let secondLevelHeadings = [];
			let thirdLevelHeadings = [];

			kindOfTreatment.forEach(treatment => {
				mergedCellsRisks.push({
					s: {
						r: 1,
						c: secondLevelHeadings.length + 1
					},
					e: {
						r: 1,
						c: secondLevelHeadings.length + risksLabels.length
					}
				})
				mergedCellsRisks.push({
					s: {
						r: 1,
						c: secondLevelHeadings.length + 43
					},
					e: {
						r: 1,
						c: secondLevelHeadings.length + risksLabels.length + 42
					}
				})

				secondLevelHeadings = secondLevelHeadings
					.concat([treatment])
					.concat(new Array(risksLabels.length - 1).fill(null));

				thirdLevelHeadings = thirdLevelHeadings
					.concat(risksLabels);

			});

			let headingsRisks = [
				firstLevelHeadings,
				[null].concat(secondLevelHeadings.concat(secondLevelHeadings)),
				[null].concat(thirdLevelHeadings.concat(thirdLevelHeadings))
			];

			let xlsxData = {
				['Info. Risks - Level']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Info. Risks - Treatment']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Info. Risks - All assets']: {
					data: [],
					headings: headingsRisks,
					mergedCells: mergedCellsRisks
				},
				['Info. Risks - Parent asset']: {
					data: [],
					headings: headingsRisks,
					mergedCells: mergedCellsRisks
				},
				['Oper. Risks - Level']: {
					data: [],
					headings: [],
					mergedCells: [],
				},
				['Oper. Risks - Treatment']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Oper. Risks - All assets']: {
					data: [],
					headings: headingsRisks,
					mergedCells: mergedCellsRisks
				},
				['Oper. Risks - Parent asset']: {
					data: [],
					headings: headingsRisks,
					mergedCells: mergedCellsRisks
				},
				['Threats']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Threats by parent asset - current']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Threats by parent asset - residual']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Vulnerabilities']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Vulns by parent asset - current']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Vulns by parent asset - residual']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Cartography - Info. Risks']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Cartography - Oper. Risks']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Recs. - Occurrence']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Recs. - Asset']: {
					data: [],
					headings: [],
					mergedCells: []
				},
				['Recs. - Importance']: {
					data: [],
					headings: [],
					mergedCells: []
				}
			};

			//Informational risks by level
			let byLevel = angular.copy(dataCurrentRisksByLevel).map((level, i) =>
				({
					[gettextCatalog.getString('Level')]: level.category,
					[gettextCatalog.getString('Current risks')]: (level.value) ?
						level.value : 0,
					[gettextCatalog.getString('Max. current risk average')]: (level.value) ?
						level.sum / level.value : 0,
					[gettextCatalog.getString('Residual risks')]: (dataTargetRisksByLevel[i].value) ?
						dataTargetRisksByLevel[i].value : 0,
					[gettextCatalog.getString('Max. residual risk average')]: (dataTargetRisksByLevel[i].value) ?
						dataTargetRisksByLevel[i].sum / dataTargetRisksByLevel[i].value : 0,
				})
			);
			xlsxData['Info. Risks - Level'].data = byLevel;

			//Informational risks by treatment
			let byTreatment = angular.copy(dataCurrentRisksByTreatment).map((treatment, i) =>
				({
					[gettextCatalog.getString('Treatment')]: treatment.category,
					[gettextCatalog.getString('Risks')]: (treatment.value) ?
						treatment.value : 0,
					[gettextCatalog.getString('Max. current risk average')]: (treatment.value) ?
						treatment.sum / treatment.value : 0,
					[gettextCatalog.getString('Max. residual risk average')]: (dataTargetRisksByTreatment[i].value) ?
						dataTargetRisksByTreatment[i].sum / dataTargetRisksByTreatment[i].value : 0,
				})
			);
			xlsxData['Info. Risks - Treatment'].data = byTreatment;

			//Informational risks by assets
			xlsxData['Info. Risks - All assets'].data = formattingData('Risk', 'risksByAsset');

			//Informational risks by parent asset
			xlsxData['Info. Risks - Parent asset'].data = formattingData('Risk', 'risksByParentAsset');

			//Operational Risks by level
			let byLevelOpRisks = angular.copy(dataCurrentOpRisksByLevel).map((level, i) =>
				({
					[gettextCatalog.getString('Level')]: level.category,
					[gettextCatalog.getString('Current risks')]: (level.value) ?
						level.value : 0,
					[gettextCatalog.getString('Max. current risk average')]: (level.value) ?
						level.sum / level.value : 0,
					[gettextCatalog.getString('Residual risks')]: (dataTargetOpRisksByLevel[i].value) ?
						dataTargetOpRisksByLevel[i].value : 0,
					[gettextCatalog.getString('Max. residual risk average')]: (dataTargetOpRisksByLevel[i].value) ?
						dataTargetOpRisksByLevel[i].sum / dataTargetOpRisksByLevel[i].value : 0,
				})
			);
			xlsxData['Oper. Risks - Level'].data = byLevelOpRisks;

			//Operational risks by treatment
			let byTreatmentOpRisks = angular.copy(dataCurrentOpRisksByTreatment).map((treatment, i) =>
				({
					[gettextCatalog.getString('Treatment')]: treatment.category,
					[gettextCatalog.getString('Risks')]: (treatment.value) ?
						treatment.value : 0,
					[gettextCatalog.getString('Max. current risk average')]: (treatment.value) ?
						treatment.sum / treatment.value : 0,
					[gettextCatalog.getString('Max. residual risk average')]: (dataTargetOpRisksByTreatment[i].value) ?
						dataTargetOpRisksByTreatment[i].sum / dataTargetOpRisksByTreatment[i].value : 0,
				})
			);
			xlsxData['Oper. Risks - Treatment'].data = byTreatmentOpRisks;

			//Operational Risks by Assets
			xlsxData['Oper. Risks - All assets'].data = formattingData('OpRisk', 'risksByAsset');


			//Operational Risks by parent assets
			xlsxData['Oper. Risks - Parent asset'].data = formattingData('OpRisk', 'risksByParentAsset');

			//Threats
			let byThreats = dataThreats.map(threat =>
				({
					[gettextCatalog.getString('Threat')]: threat.category,
					[gettextCatalog.getString('Occurrence')]: threat.occurrence,
					[gettextCatalog.getString('Probability')]: threat.average,
					[gettextCatalog.getString('Max risk')]: threat.max_risk,
				})
			);
			xlsxData['Threats'].data = byThreats;


			//Threats by parent Asset
			let byThreatsAndParentAssetsCurrent = [];
			let byThreatsAndParentAssetsTarget = [];
			dataThreatsByRootInstances.forEach(rootInstance => {
				if (rootInstance && rootInstance.current) {
					byThreatsAndParentAssetsCurrent.push(
						rootInstance.current
						.slice(0, 10)
						.map(threat =>
							({
								[gettextCatalog.getString('Asset')]: threat.asset,
								[gettextCatalog.getString('Threat')]: threat.category,
								[gettextCatalog.getString('Max risk')]: threat.value,
								[gettextCatalog.getString('Probability')]: threat.probability,
							})
						)
					)
				}

				if (rootInstance && rootInstance.target) {
					byThreatsAndParentAssetsTarget.push(
						rootInstance.target
						.slice(0, 10)
						.map(threat =>
							({
								[gettextCatalog.getString('Asset')]: threat.asset,
								[gettextCatalog.getString('Threat')]: threat.category,
								[gettextCatalog.getString('Max risk')]: threat.value,
								[gettextCatalog.getString('Probability')]: threat.probability,
							})
						)
					)
				}
			});

			xlsxData['Threats by parent asset - current'].data = byThreatsAndParentAssetsCurrent.flat();
			xlsxData['Threats by parent asset - residual'].data = byThreatsAndParentAssetsTarget.flat();

			//Vulnerabilities
			let byVulnerabilities = dataAllVulnerabilities.map(vulnerability =>
				({
					[gettextCatalog.getString('Vulnerability')]: vulnerability.category,
					[gettextCatalog.getString('Occurrence')]: vulnerability.occurrence,
					[gettextCatalog.getString('Qualification')]: vulnerability.average,
					[gettextCatalog.getString('Max risk')]: vulnerability.max_risk,
				})
			);
			xlsxData['Vulnerabilities'].data = byVulnerabilities;

			//Vulnerabilities by parent Asset
			let byVulnerabilitiesAndParentAssetsCurrent = [];
			let byVulnerabilitiesAndParentAssetsTarget = [];
			dataVulnerabilitiesByRootInstances.forEach(rootInstance => {
				if (rootInstance && rootInstance.current) {
					byVulnerabilitiesAndParentAssetsCurrent.push(
						rootInstance.current
						.slice(0, 10)
						.map(vulnerability =>
							({
								[gettextCatalog.getString('Asset')]: vulnerability.asset,
								[gettextCatalog.getString('Threat')]: vulnerability.category,
								[gettextCatalog.getString('Max risk')]: vulnerability.value,
								[gettextCatalog.getString('Qualification')]: vulnerability.qualification,
							})
						)
					)
				}

				if (rootInstance && rootInstance.target) {
					byVulnerabilitiesAndParentAssetsTarget.push(
						rootInstance.target
						.slice(0, 10)
						.map(vulnerability =>
							({
								[gettextCatalog.getString('Asset')]: vulnerability.asset,
								[gettextCatalog.getString('Threat')]: vulnerability.category,
								[gettextCatalog.getString('Max risk')]: vulnerability.value,
								[gettextCatalog.getString('Qualification')]: vulnerability.qualification,
							})
						)
					)
				}
			});

			xlsxData['Vulns by parent asset - current'].data = byVulnerabilitiesAndParentAssetsCurrent.flat();
			xlsxData['Vulns by parent asset - residual'].data = byVulnerabilitiesAndParentAssetsTarget.flat();

			//Cartography
			let byCartographyRiskInfo = dataCurrentCartography.map((cartography, i) =>
				({
					[gettextCatalog.getString('Impact')]: cartography.y,
					[gettextCatalog.getString('Likelihood')]: cartography.x,
					[gettextCatalog.getString('Current risk')]: (cartography.value) ?
						cartography.value : 0,
					[gettextCatalog.getString('Residual risk')]: (dataTargetCartography[i].value) ?
						dataTargetCartography[i].value : 0,
				})
			);
			xlsxData['Cartography - Info. Risks'].data = byCartographyRiskInfo;

			let byCartographyRiskOp = dataCurrentCartographyRiskOp.map((cartography, i) =>
				({
					[gettextCatalog.getString('Impact')]: cartography.y,
					[gettextCatalog.getString('Likelihood')]: cartography.x,
					[gettextCatalog.getString('Current risk')]: (cartography.value) ?
						cartography.value : 0,
					[gettextCatalog.getString('Residual risk')]: (dataTargetCartographyRiskOp[i].value) ?
						dataTargetCartographyRiskOp[i].value : 0,
				})
			);
			xlsxData['Cartography - Oper. Risks'].data = byCartographyRiskOp;

			//Compliance
			let byCompliance = [];
			$scope.dashboard.referentials.forEach(function(ref) {
				byCompliance[ref.uuid] = [];
				dataCompliance[ref.uuid][0].series.map((serie, i) => {
					byCompliance[ref.uuid].push({
						[gettextCatalog.getString('Category')]: serie.label,
						[gettextCatalog.getString('Current level')]: serie.value,
						[gettextCatalog.getString('Applicable target level')]: dataCompliance[ref.uuid][1].series[i].value
					})
				});
				xlsxData['Compliance' + " - " + ref['label' + anr.language]] = {
					data: byCompliance[ref.uuid],
					headings: [],
					mergedCells: []
				};
			})

			//Recommendations
			let byRecsOccurrence = dataRecommendationsByOccurrence.map(recommendation =>
				({
					[gettextCatalog.getString('Recommendation')]: recommendation.category,
					[gettextCatalog.getString('Occurrence')]: recommendation.value,
				})
			);
			xlsxData['Recs. - Occurrence'].data = byRecsOccurrence;

			let byRecsAsset = dataRecommendationsByAsset.map(recommendation =>
				({
					[gettextCatalog.getString('Asset')]: recommendation.category,
					[gettextCatalog.getString('Occurrence')]: recommendation.value,
				})
			);
			xlsxData['Recs. - Asset'].data = byRecsAsset;

			let byRecsImportance = dataRecommendationsByImportance.map(recommendation =>
				({
					[gettextCatalog.getString('Importance')]: recommendation.category,
					[gettextCatalog.getString('Occurrence')]: recommendation.value,
				})
			);
			xlsxData['Recs. - Importance'].data = byRecsImportance;

			/* Add sheets on workbook*/
			for (data in xlsxData) {
				let params = {};
				let sheet = XLSX.utils.aoa_to_sheet(xlsxData[data].headings);
				sheet['!merges'] = xlsxData[data].mergedCells;
				if (xlsxData[data].headings.length > 1) {
					params = {
						origin: 3,
						skipHeader: true
					};
				}
				XLSX.utils.sheet_add_json(sheet, xlsxData[data].data, params);
				XLSX.utils.book_append_sheet(wb, sheet, data.substring(0, 31).replace(/[:?*/[\]\\]+/g, ''));
			}

			/* write workbook and force a download */
			XLSX.writeFile(wb, "dashboard.xlsx");

			function formattingData(kindOfRisk, chart) {
				let [risksCurrentData, risksCurrentDataByTreatment] = getDataModel('current' + kindOfRisk, chart);
				let [risksTargetData, risksTargetDataByTreatment] = getDataModel('target' + kindOfRisk, chart);

				let formattedData = angular.copy(risksCurrentData).map(risksData =>
					({
						category: risksData.category,
						series: risksData.series,
					})
				);
				makeDataExportableForByAsset(formattedData);

				for (let kindOfTreatment in risksCurrentDataByTreatment) {
					makeDataExportableForByAsset(risksCurrentDataByTreatment[kindOfTreatment], formattedData);
				}

				makeDataExportableForByAsset(risksTargetData, formattedData);

				for (let kindOfTreatment in risksTargetDataByTreatment) {
					makeDataExportableForByAsset(risksTargetDataByTreatment[kindOfTreatment], formattedData);
				}

				return formattedData;
			}

			/*
			 * Prepare the array and the objects of risks by assets to be properly export in XLSX
			 * @param mappedData, the source of the Data e.g. angular.copy(dataCurrentRisksByAsset).map(({key,values}) => ({key,values}));
			 * @param brotherData : the Brotherdata to be merged with mappedData
			 */
			function makeDataExportableForByAsset(mappedData, brotherData) {
				if (brotherData) {
					brotherData.forEach(function(obj, index) {
						let initialIndex = Object.keys(brotherData[index]).length;
						brotherData[index][initialIndex] = mappedData[index].series[0].value;
						brotherData[index][initialIndex + 1] =
							mappedData[index].series[0].value > 0 && mappedData[index].series[0].sum > 0 ?
							mappedData[index].series[0].sum / mappedData[index].series[0].value :
							0;
						brotherData[index][initialIndex + 2] = mappedData[index].series[1].value;
						brotherData[index][initialIndex + 3] =
							mappedData[index].series[1].value > 0 && mappedData[index].series[1].sum > 0 ?
							mappedData[index].series[1].sum / mappedData[index].series[1].value :
							0;
						brotherData[index][initialIndex + 4] = mappedData[index].series[2].value;
						brotherData[index][initialIndex + 5] =
							mappedData[index].series[2].value > 0 && mappedData[index].series[2].sum > 0 ?
							mappedData[index].series[2].sum / mappedData[index].series[2].value :
							0;
						delete obj.category; // in case of child of risk by parent asset
						delete obj.series; // in case of child of risk by parent asset
					});
				} else {
					mappedData.forEach(function(obj) {
						obj[0] = obj.category;
						obj[1] = obj.series[0].value;
						obj[2] = obj.series[0].value > 0 && obj.series[0].sum > 0 ?
							obj.series[0].sum / obj.series[0].value :
							0;
						obj[3] = obj.series[1].value;
						obj[4] = obj.series[1].value > 0 && obj.series[1].sum > 0 ?
							obj.series[1].sum / obj.series[1].value :
							0;
						obj[5] = obj.series[2].value;
						obj[6] = obj.series[2].value > 0 && obj.series[2].sum > 0 ?
							obj.series[2].sum / obj.series[2].value :
							0;
						delete obj.category; // in case of child of risk by parent asset
						delete obj.series; // in case of child of risk by parent asset
					});
				}
			}
		}

		$scope.generatePptxSildes = async function() {
			$scope.loadingPptx = true;

			let charts = [{
					slide: 1,
					title: gettextCatalog.getString('Information risks'),
					subtitle: gettextCatalog.getString('Current risks'),
					chart: function() {
						ChartService.verticalBarChart(
							'#loadPptx',
							dataCurrentRisksByLevel,
							optionsRisksByLevel,
						)
					},
					x: 0.60,
					y: 2.00,
					offsetX: 0,
					offsetY: -1.00,
					w: 4.00,
					h: 4.00
				},
				{
					slide: 1,
					subtitle: gettextCatalog.getString('Residual risks'),
					chart: function() {
						ChartService.verticalBarChart(
							'#loadPptx',
							dataTargetRisksByLevel,
							optionsRisksByLevel,
						)
					},
					x: 5.40,
					y: 2.00,
					offsetX: 0,
					offsetY: -1.00,
					w: 4.00,
					h: 4.00
				},
				{
					slide: 2,
					title: gettextCatalog.getString('Information risks'),
					subtitle: gettextCatalog.getString('Current risks'),
					chart: function() {
						ChartService.multiVerticalBarChart(
							'#loadPptx',
							dataCurrentRisksByAsset,
							optionsRisksByAsset,
						)
					},
					x: 0.60,
					y: 2.00,
					offsetX: -0.20,
					offsetY: -1.00,
					w: 4.50,
					h: 5.00
				},
				{
					slide: 2,
					subtitle: gettextCatalog.getString('Residual risks'),
					chart: function() {
						ChartService.multiVerticalBarChart(
							'#loadPptx',
							dataTargetRisksByAsset,
							optionsRisksByAsset,
						)
					},
					x: 5.10,
					y: 2.00,
					offsetX: -0.20,
					offsetY: -1.00,
					w: 4.50,
					h: 5.00
				},
				{
					slide: 3,
					title: gettextCatalog.getString('Information risks'),
					subtitle: gettextCatalog.getString('Current risks'),
					chart: function() {
						ChartService.multiVerticalBarChart(
							'#loadPptx',
							dataCurrentRisksByParent,
							optionsCurrentRisksByParent,
						)
					},
					x: 0.60,
					y: 2.00,
					offsetX: -0.20,
					offsetY: -1.00,
					w: 4.50,
					h: 5.00
				},
				{
					slide: 3,

					subtitle: gettextCatalog.getString('Residual risks'),
					chart: function() {
						ChartService.multiVerticalBarChart(
							'#loadPptx',
							dataTargetRisksByParent,
							optionsTargetRisksByParent
						)
					},
					x: 5.10,
					y: 2.00,
					offsetX: -0.20,
					offsetY: -1.00,
					w: 4.50,
					h: 5.00
				},
				{
					slide: 4,
					title: gettextCatalog.getString('Operational risks'),
					subtitle: gettextCatalog.getString('Current risks'),
					chart: function() {
						ChartService.verticalBarChart(
							'#loadPptx',
							dataCurrentOpRisksByLevel,
							optionsOpRisksByLevel,
						)
					},
					x: 0.60,
					y: 2.00,
					offsetX: 0,
					offsetY: -1.00,
					w: 4.00,
					h: 4.00
				},
				{
					slide: 4,
					subtitle: gettextCatalog.getString('Residual risks'),
					chart: function() {
						ChartService.verticalBarChart(
							'#loadPptx',
							dataTargetOpRisksByLevel,
							optionsOpRisksByLevel,
						)
					},
					x: 5.40,
					y: 2.00,
					offsetX: 0,
					offsetY: -1.00,
					w: 4.00,
					h: 4.00
				},
				{
					slide: 5,
					title: gettextCatalog.getString('Operational risks'),
					subtitle: gettextCatalog.getString('Current risks'),
					chart: function() {
						ChartService.multiVerticalBarChart(
							'#loadPptx',
							dataCurrentOpRisksByAsset,
							optionsOpRisksByAsset,
						)
					},
					x: 0.60,
					y: 2.00,
					offsetX: -0.20,
					offsetY: -1.00,
					w: 4.50,
					h: 5.00
				},
				{
					slide: 5,
					subtitle: gettextCatalog.getString('Residual risks'),
					chart: function() {
						ChartService.multiVerticalBarChart(
							'#loadPptx',
							dataTargetOpRisksByAsset,
							optionsOpRisksByAsset,
						)
					},
					x: 5.10,
					y: 2.00,
					offsetX: -0.20,
					offsetY: -1.00,
					w: 4.50,
					h: 5.00
				},
				{
					slide: 6,
					title: gettextCatalog.getString('Operational risks'),
					subtitle: gettextCatalog.getString('Current risks'),
					chart: function() {
						ChartService.multiVerticalBarChart(
							'#loadPptx',
							dataCurrentOpRisksByParent,
							optionsCurrentOpRisksByParent,
						)
					},
					x: 0.60,
					y: 2.00,
					offsetX: -0.20,
					offsetY: -1.00,
					w: 4.50,
					h: 5.00
				},
				{
					slide: 6,

					subtitle: gettextCatalog.getString('Residual risks'),
					chart: function() {
						ChartService.multiVerticalBarChart(
							'#loadPptx',
							dataTargetOpRisksByParent,
							optionsTargetOpRisksByParent
						)
					},
					x: 5.10,
					y: 2.00,
					offsetX: -0.20,
					offsetY: -1.00,
					w: 4.50,
					h: 5.00
				},
				{
					slide: 7,
					title: gettextCatalog.getString('Threats'),
					subtitle: gettextCatalog.getString('Occurrence'),
					chart: function() {
						ChartService.horizontalBarChart(
							'#loadPptx',
							dataThreats.map(d => {
								d.value = d.occurrence;
								return d
							}),
							optionsHorizontalThreats
						);
					},
					x: 0.60,
					y: 0.90,
					offsetX: 0,
					offsetY: -0.05,
					w: 8.80,
					h: 6.00
				},
				{
					slide: 8,
					title: gettextCatalog.getString('Threats'),
					subtitle: gettextCatalog.getString('Probability'),
					chart: function() {
						optionsHorizontalThreats.forceDomainX = {
							min: threatScale.min,
							max: threatScale.max
						};
						ChartService.horizontalBarChart(
							'#loadPptx',
							dataThreats.map(d => {
								d.value = d.average;
								return d
							}),
							optionsHorizontalThreats
						);
						delete optionsHorizontalThreats.forceDomainX;
					},
					x: 0.60,
					y: 0.90,
					offsetX: 0,
					offsetY: -0.05,
					w: 8.80,
					h: 6.00
				},
				{
					slide: 9,
					title: gettextCatalog.getString('Threats'),
					subtitle: gettextCatalog.getString('Max. associated risk level'),
					chart: function() {
						ChartService.horizontalBarChart(
							'#loadPptx',
							dataThreats.map(d => {
								d.value = d.max_risk;
								return d
							}),
							optionsHorizontalThreats
						);
					},
					x: 0.60,
					y: 0.90,
					offsetX: 0,
					offsetY: -0.05,
					w: 8.80,
					h: 6.00
				},
				{
					slide: 10,
					title: gettextCatalog.getString('Vulnerabilities'),
					subtitle: gettextCatalog.getString('Occurrence'),
					chart: function() {
						ChartService.horizontalBarChart(
							'#loadPptx',
							dataAllVulnerabilities
							.map(d => {
								d.value = d.occurrence;
								return d
							})
							.sort(function(a, b) {
								return b['value'] - a['value']
							})
							.slice(0, $scope.vulnerabilitiesDisplayed),
							optionsHorizontalVulnerabilities
						);
					},
					x: 0.60,
					y: 0.90,
					offsetX: 0,
					offsetY: -0.05,
					w: 8.80,
					h: 6.00
				},
				{
					slide: 11,
					title: gettextCatalog.getString('Vulnerabilities'),
					subtitle: gettextCatalog.getString('Qualification'),
					chart: function() {
						optionsHorizontalVulnerabilities.forceDomainX = {
							min: vulnerabilityScale.min,
							max: vulnerabilityScale.max
						};

						ChartService.horizontalBarChart(
							'#loadPptx',
							dataAllVulnerabilities
							.map(d => {
								d.value = d.average;
								return d
							})
							.sort(function(a, b) {
								return b['value'] - a['value']
							})
							.slice(0, $scope.vulnerabilitiesDisplayed),
							optionsHorizontalVulnerabilities
						);

						delete optionsHorizontalVulnerabilities.forceDomainX;
					},
					x: 0.60,
					y: 0.90,
					offsetX: 0,
					offsetY: -0.05,
					w: 8.80,
					h: 6.00
				},
				{
					slide: 12,
					title: gettextCatalog.getString('Vulnerabilities'),
					subtitle: gettextCatalog.getString('Max. associated risk level'),
					chart: function() {
						ChartService.horizontalBarChart(
							'#loadPptx',
							dataAllVulnerabilities
							.map(d => {
								d.value = d.max_risk;
								return d
							})
							.sort(function(a, b) {
								return b['value'] - a['value']
							})
							.slice(0, $scope.vulnerabilitiesDisplayed),
							optionsHorizontalVulnerabilities
						);
					},
					x: 0.60,
					y: 0.90,
					offsetX: 0,
					offsetY: -0.05,
					w: 8.80,
					h: 6.00
				},
				{
					slide: 13,
					title: gettextCatalog.getString('Cartography') + ' - ' + gettextCatalog.getString('Information risks'),
					subtitle: gettextCatalog.getString('Current risks'),
					chart: function() {
						optionsCartography.xLabel = 'Likelihood';
						optionsCartography.width = getParentWidth('graphCartographyCurrent');
						optionsCartography.threshold = [anr.seuil1, anr.seuil2];
						ChartService.heatmapChart(
							'#loadPptx',
							dataCurrentCartography,
							optionsCartography
						);
					},
					x: 0.05,
					y: 2.50,
					offsetX: 0,
					offsetY: -0.40,
					w: 5.00,
					h: 2.50
				},
				{
					slide: 13,
					subtitle: gettextCatalog.getString('Residual risks'),
					chart: function() {
						optionsCartography.xLabel = 'Likelihood';
						optionsCartography.width = getParentWidth('graphCartographyTarget');
						optionsCartography.threshold = [anr.seuil1, anr.seuil2];
						ChartService.heatmapChart(
							'#loadPptx',
							dataTargetCartography,
							optionsCartography
						);
					},
					x: 4.95,
					y: 2.50,
					offsetX: 0,
					offsetY: -0.40,
					w: 5.00,
					h: 2.50
				},
				{
					slide: 14,
					title: gettextCatalog.getString('Cartography') + ' - ' + gettextCatalog.getString('Operational risks'),
					subtitle: gettextCatalog.getString('Current risks'),
					chart: function() {
						optionsCartography.xLabel = 'Probability';
						optionsCartography.width = 400;
						optionsCartography.threshold = [anr.seuilRolf1, anr.seuilRolf2];
						ChartService.heatmapChart(
							'#loadPptx',
							dataCurrentCartographyRiskOp,
							optionsCartography
						);
					},
					x: 0.60,
					y: 2.00,
					offsetX: 0,
					offsetY: -0.40,
					w: 4.00,
					h: 4.00
				},
				{
					slide: 14,
					subtitle: gettextCatalog.getString('Residual risks'),
					chart: function() {
						optionsCartography.xLabel = 'Probability';
						optionsCartography.width = 400;
						optionsCartography.threshold = [anr.seuilRolf1, anr.seuilRolf2];
						ChartService.heatmapChart(
							'#loadPptx',
							dataTargetCartographyRiskOp,
							optionsCartography
						);
					},
					x: 5.50,
					y: 2.00,
					offsetX: 0,
					offsetY: -0.40,
					w: 4.00,
					h: 4.00
				},
				{
					slide: 15,
					title: gettextCatalog.getString('Recommendations'),
					subtitle: gettextCatalog.getString('Occurrence'),
					chart: function() {
						dataRecommendations = dataRecommendationsByOccurrence;
						ChartService.horizontalBarChart(
							'#loadPptx',
							dataRecommendations,
							optionsHorizontalRecommendations
						);
					},
					x: 0.60,
					y: 0.90,
					offsetX: 0,
					offsetY: -0.05,
					w: 8.80,
					h: 6.00
				},
				{
					slide: 16,
					title: gettextCatalog.getString('Recommendations'),
					subtitle: gettextCatalog.getString('Asset'),
					chart: function() {
						dataRecommendations = dataRecommendationsByAsset;
						ChartService.horizontalBarChart(
							'#loadPptx',
							dataRecommendations,
							optionsHorizontalRecommendations
						);
					},
					x: 0.60,
					y: 0.90,
					offsetX: 0,
					offsetY: -0.05,
					w: 8.80,
					h: 6.00
				},
				{
					slide: 17,
					title: gettextCatalog.getString('Recommendations'),
					subtitle: gettextCatalog.getString('Importance'),
					chart: function() {
						optionsVerticalRecommendations.width = 700;
						optionsVerticalRecommendations.sort = false;
						delete optionsVerticalRecommendations.rotationXAxisLabel;
						delete optionsVerticalRecommendations.offsetXAxisLabel;
						dataRecommendations = dataRecommendationsByImportance;
						ChartService.verticalBarChart(
							'#loadPptx',
							dataRecommendations,
							optionsVerticalRecommendations
						);
						optionsVerticalRecommendations.sort = true;
						optionsVerticalRecommendations.rotationXAxisLabel = 45;
						optionsVerticalRecommendations.offsetXAxisLabel = 0.9;
					},
					x: 1.97,
					y: 1.90,
					offsetX: -0.37,
					offsetY: -1.00,
					w: 6.80,
					h: 5.50
				},
			];

			if ($scope.dashboard.referentials.length > 0) {
				slideIndex = angular.copy(charts).pop().slide + 1;
				$scope.dashboard.referentials.forEach(function(ref) {
					charts.push({
						slide: slideIndex,
						title: gettextCatalog.getString('Compliance'),
						subtitle: ref['label' + anr.language],
						chart: function() {
							ChartService.radarChart(
								'#loadPptx',
								dataCompliance[ref.uuid],
								optionsChartCompliance
							);
						},
						x: 1.35,
						y: 1.20,
						offsetX: 0,
						offsetY: -0.30,
						w: 7.30,
						h: 5.80
					});
					slideIndex++;
				});
			}

			let pptx = new PptxGenJS();
			let slide = [];
			let lastSlide = 0;
			let date = new Date();

			pptx.layout = 'LAYOUT_4x3';

			pptx.defineSlideMaster({
				title: 'TITLE_SLIDE',
				objects: [{
						'rect': {
							x: 0.00,
							y: 4.60,
							w: '100%',
							h: 1.75,
							fill: '006fba'
						}
					},
					{
						'line': {
							x: 0.00,
							y: 6.35,
							w: '100%',
							h: 0.00,
							line: 'FFC107',
							lineSize: 5
						}
					},
					{
						'image': {
							x: 7.0,
							y: 5.10,
							w: 1.50,
							h: 0.65,
							path: 'img/logo-monarc.png'
						}
					}
				]
			});

			pptx.defineSlideMaster({
				title: 'MASTER_SLIDE',
				bkgd: 'FFFEFE',
				slideNumber: {
					x: 9.00,
					y: 7.0,
					color: 'FFFFFF'
				},
				objects: [{
						'rect': {
							x: 0,
							y: 6.9,
							w: '100%',
							h: 0.6,
							fill: '006fba'
						}
					},
					{
						'image': {
							x: 0.60,
							y: 7.0,
							w: 0.98,
							h: 0.4,
							path: 'img/logo-monarc.png'
						}
					},
					{
						'text': {
							text: anr['label' + anr.language],
							options: {
								x: 0,
								y: 6.9,
								w: '100%',
								h: 0.6,
								align: 'c',
								valign: 'm',
								color: 'FFFEFE',
								fontSize: 12
							}
						}
					},
					{
						'line': {
							x: 0.60,
							y: 0.80,
							w: 8.80,
							h: 0.00,
							line: 'FFC107',
							lineSize: 1
						}
					},
					{
						'placeholder': {
							options: {
								name: 'slideTitle',
								type: 'title',
								x: 0.00,
								y: 0.30,
								w: '100%',
								color: '006fba',
								bold: true,
								fontSize: 28,
								align: 'center'
							}
						}
					}
				]
			});

			slide[lastSlide] = pptx.addNewSlide('TITLE_SLIDE');
			slide[lastSlide].addText(gettextCatalog.getString('Dashboard'), {
				x: 0.00,
				y: 2.50,
				w: '100%',
				color: '006fba',
				bold: true,
				fontSize: 44,
				align: 'center'
			});
			slide[lastSlide].addText(anr['label' + anr.language] + '\n' +
				anr['description' + anr.language] + '\n' +
				date.getDate() + "-" + (date.getMonth() + 1) + "-" + date.getFullYear(), {
					x: 1.50,
					y: 5.25,
					w: 5.5,
					h: 0.75,
					color: 'FFFEFE',
					fontSize: 20,
					valign: 'm'
				});

			for (chart of charts) {
				await addChart(chart)
			};

			$scope.loadingPptx = false;
			pptx.writeFile();

			function addChart(chart) {
				let promise = $q.defer();
				if (chart.slide !== lastSlide) {
					slide[chart.slide] = pptx.addNewSlide('MASTER_SLIDE');
					slide[chart.slide].addText(chart.title, {
						placeholder: 'slideTitle'
					});
				}
				chart.chart();
				$timeout(function() {
					let node = d3.select('#loadPptx').select("svg")
					svgAsPngUri(node.node(), {
						fonts: [],
						backgroundColor: 'transparent'
					}, function(uri) {
						slide[chart.slide].addImage({
							data: uri,
							x: chart.x,
							y: chart.y,
							w: chart.w,
							h: chart.h
						});
						slide[chart.slide].addText(chart.subtitle, {
							x: chart.x + chart.offsetX,
							y: chart.y + chart.offsetY,
							w: chart.w,
							align: 'center'
						});
					});
					lastSlide = chart.slide;
					promise.resolve();
				}, 600)
				return promise.promise;
			}
		}

		$scope.exportAsPNG = function(idOfGraph, name, parametersAction = {
			fonts: [],
			backgroundColor: 'white'
		}) {
			let node = d3.select('#' + idOfGraph).select("svg");
			saveSvgAsPng(node.node(), name + '.png', parametersAction);
		}

		// MISC FUNCTIONS  ===========================================================

		function getParentWidth(id, rate = 1) {
			return document.getElementById(id).parentElement.clientWidth * rate;
		}

		/**
		* Get params by kind of risk
		* @param {String} kindOfRisk
		* @return {Array} [
		    max risk key,
		    Order field,
		    kindOfTreatment,
		    function to get risks,
		    thresholds
		]
		*/
		function getFilterParams(kindOfRisk) {
			switch (kindOfRisk) {
				case 'currentRisk':
					return [
						'max_risk',
						'maxRisk',
						getKindOfTreatment($scope.currentRisksTreatmentOptions),
						'getAnrRisks',
						[anr.seuil1, anr.seuil2],
					];
				case 'targetRisk':
					return [
						'target_risk',
						'targetRisk',
						getKindOfTreatment($scope.targetRisksTreatmentOptions),
						'getAnrRisks',
						[anr.seuil1, anr.seuil2],
					];
				case 'currentOpRisk':
					return [
						'cacheNetRisk',
						'cacheNetRisk',
						getKindOfTreatment($scope.currentOpRisksTreatmentOptions),
						'getAnrRisksOp',
						[anr.seuilRolf1, anr.seuilRolf2],
					];
				case 'targetOpRisk':
					return [
						'cacheTargetedRisk',
						'cacheTargetedRisk',
						getKindOfTreatment($scope.targetOpRisksTreatmentOptions),
						'getAnrRisksOp',
						[anr.seuilRolf1, anr.seuilRolf2],
					];
			}
		}

		function getDataModel(kindOfRisk, chart) {
			switch (kindOfRisk) {
				case 'currentRisk':
					if (chart == 'risksByAsset') {
						return [dataCurrentRisksByAsset, dataCurrentRisksByAssetAndTreatment]
					}
					if (chart == 'risksbyTreatmentAndAsset') {
						return dataCurrentRisksByTreatmentAndAsset
					}
					if (chart == 'risksByTreatmentParentAsset') {
						return dataCurrentRisksByTreatmentAndParentAsset
					}
					return [dataCurrentRisksByParent, dataCurrentRisksByParentAndTreatment];
				case 'targetRisk':
					if (chart == 'risksByAsset') {
						return [dataTargetRisksByAsset, dataTargetRisksByAssetAndTreatment]
					}
					if (chart == 'risksbyTreatmentAndAsset') {
						return dataTargetRisksByTreatmentAndAsset
					}
					if (chart == 'risksByTreatmentParentAsset') {
						return dataTargetRisksByTreatmentAndParentAsset
					}
					return [dataTargetRisksByParent, dataTargetRisksByParentAndTreatment];
				case 'currentOpRisk':
					if (chart == 'risksByAsset') {
						return [dataCurrentOpRisksByAsset, dataCurrentOpRisksByAssetAndTreatment]
					}
					if (chart == 'risksbyTreatmentAndAsset') {
						return dataCurrentOpRisksByTreatmentAndAsset
					}
					if (chart == 'risksByTreatmentParentAsset') {
						return dataCurrentOpRisksByTreatmentAndParentAsset
					}
					return [dataCurrentOpRisksByParent, dataCurrentOpRisksByParentAndTreatment];
				case 'targetOpRisk':
					if (chart == 'risksByAsset') {
						return [dataTargetOpRisksByAsset, dataTargetOpRisksByAssetAndTreatment]
					}
					if (chart == 'risksbyTreatmentAndAsset') {
						return dataTargetOpRisksByTreatmentAndAsset
					}
					if (chart == 'risksByTreatmentParentAsset') {
						return dataTargetOpRisksByTreatmentAndParentAsset
					}
					return [dataTargetOpRisksByParent, dataTargetOpRisksByParentAndTreatment];
			}
		}

		function getKindOfTreatment(treatment) {
			let kindOfTreatment = null;
			switch (treatment) {
				case 'reduction':
					kindOfTreatment = 1
					break;
				case 'denied':
					kindOfTreatment = 2
					break;
				case 'accepted':
					kindOfTreatment = 3
					break;
				case 'shared':
					kindOfTreatment = 4
					break;
				case 'not_treated':
					kindOfTreatment = 5
					break;
				case 'treated':
					kindOfTreatment = 'treated'
					break;
				default:
					kindOfTreatment = 'all'
			}

			return kindOfTreatment;
		}

		function sortByLabel(a, b, field) {
			return $scope._langField(a, field).localeCompare($scope._langField(b, field))
		}
	}
})();

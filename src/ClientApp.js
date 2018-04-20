angular
    .module('ClientApp', ['ngMaterial', 'ngAnimate', 'toastr', 'ui.router', 'gettext', 'ngResource',
        'LocalStorageModule', 'md.data.table', 'ncy-angular-breadcrumb', 'ngFileUpload', 'angularInlineEdit',
        'ui.tree', 'ngMessages', 'angularTrix', 'AnrModule', 'ng-sortable','ng-countryflags'])
    .config(['$mdThemingProvider', '$stateProvider', '$urlRouterProvider', '$resourceProvider',
        'localStorageServiceProvider', '$httpProvider', '$breadcrumbProvider', '$provide', 'gettext', '$mdAriaProvider',
        '$mdDateLocaleProvider', '$locationProvider',
        function ($mdThemingProvider, $stateProvider, $urlRouterProvider, $resourceProvider, localStorageServiceProvider,
                  $httpProvider, $breadcrumbProvider, $provide, gettext, $mdAriaProvider, $mdDateLocaleProvider, $locationProvider) {
            // Store the state provider to be allow controllers to inject their routes
            window.$stateProvider = $stateProvider;

            $mdThemingProvider.definePalette('monarcfo',{
                '50': '#c4e7ff',
                '100': '#78c8ff',
                '200': '#40b2ff',
                '300': '#0094f7',
                '400': '#0081d9',
                '500': '#006fba',
                '600': '#005d9b',
                '700': '#004a7d',
                '800': '#00385e',
                '900': '#002640',
                'A100': '#c4e7ff',
                'A200': '#78c8ff',
                'A400': '#0081d9',
                'A700': '#004a7d',
                'contrastDefaultColor': 'light',
                'contrastDarkColors': '50 100 200 A100 A200'
            });

            $mdThemingProvider.theme('default')
                .primaryPalette('monarcfo')
                .accentPalette('amber')
                .dark();

            $mdThemingProvider.theme('light')
                .backgroundPalette('grey')
                .primaryPalette('monarcfo')
                .accentPalette('amber');

            $mdThemingProvider.theme('orange')
                .backgroundPalette('orange')
                .primaryPalette('amber')
                .accentPalette('green')
                .dark();

            $urlRouterProvider.otherwise('/');

            // Globally disables all ARIA warnings.
            $mdAriaProvider.disableWarnings();

            // Date pickers
            $mdDateLocaleProvider.months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
            $mdDateLocaleProvider.shortMonths = ['jan', 'fév', 'mars', 'avr', 'mai', 'juin', 'jui', 'aoû', 'sep', 'oct', 'nov', 'déc'];
            $mdDateLocaleProvider.days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
            $mdDateLocaleProvider.shortDays = ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'];
            $mdDateLocaleProvider.firstDayOfWeek = 1;
            $mdDateLocaleProvider.formatDate = function (date) {
                var m = moment(date);
                return m.isValid() ? m.format('DD/MM/Y') : ''
            };
            $mdDateLocaleProvider.parseDate = function (dateString) {
                var m = moment(dateString, 'DD/MM/Y', true);
                return m.isValid() ? m.toDate() : new Date(NaN);
            }


            localStorageServiceProvider
                .setStorageType('sessionStorage');

            $breadcrumbProvider.setOptions({
                //template: '<div><span ng-repeat="step in steps" ng-class="{active: $last}" ng-switch="$last || !!step.abstract"><a ng-switch-when="false" href="{{step.ncyBreadcrumbLink}}">{{step.ncyBreadcrumbLabel}}</a><span ng-switch-when="false"> <md-icon ng-if="!$last">chevron_right</md-icon> </span><span ng-switch-when="true" ng-if="step.ncyBreadcrumbLabel != \'_\' && step.name != \'main.project.anr\'">{{step.ncyBreadcrumbLabel}}</span></span></div>'
                templateUrl: 'views/_breadcrumb.html'
            });

            $locationProvider.hashPrefix('');

            $stateProvider.state('login', {
                url: "/",
                views: {
                    "main": {templateUrl: "views/login.html"}
                }
            }).state('passwordforgotten', {
                url: "/passwordforgotten/:token",
                views: {
                    "main": {templateUrl: "views/passwordforgotten.html"}
                }
            }).state('main', {
                url: "/client",
                views: {
                    "main": {
                        templateUrl: "views/client.index.html"
                    }
                },
                ncyBreadcrumb: {
                    label: '{{"Home"|translate}}'
                },
            }).state('main.account', {
                url: "/account",
                views: {
                    "main@main": {templateUrl: "views/client.account.html"}
                },
                ncyBreadcrumb: {
                    label: '{{"Account"|translate}}'
                }
            }).state('main.dashboard', {
                url: "/dashboard",
                views: {
                    "main@main": {templateUrl: "views/client.dashboard.html"}
                },
                ncyBreadcrumb: {
                    label: '{{"Dashboard"|translate}}'
                }
            }).state('main.admin', {
                url: "/admin",
                ncyBreadcrumb: {
                    label: '{{"Administration"|translate}}'
                }
            }).state('main.admin.accesslog', {
                url: "/accesslog",
                views: {
                    "main@main": {templateUrl: "views/client.admin.accesslog.html"}
                },
                ncyBreadcrumb: {
                    label: '{{"Access log"|translate}}'
                }
            }).state('main.admin.organization', {
                url: "/organization",
                views: {
                    "main@main": {templateUrl: "views/client.admin.organization.html"}
                },
                ncyBreadcrumb: {
                    label: '{{"Organization"|translate}}'
                }
            }).state('main.admin.deliveries_models', {
                url: "/deliveriesmodels",
                views: {
                    "main@main": {templateUrl: "views/client.admin.deliveriesmodels.html"}
                },
                ncyBreadcrumb: {
                    label: '{{"Deliverable templates"|translate}}'
                }
            }).state('main.admin.users', {
                url: "/users",
                views: {
                    "main@main": {templateUrl: "views/client.admin.users.html"}
                },
                ncyBreadcrumb: {
                    label: '{{"Users"|translate}}'
                }
            }).state('main.project', {
                url: "/project",
                views: {
                    "main@main": {templateUrl: "views/client.project.html"}
                },
                ncyBreadcrumb: {
                    skip: true,
                    label: '{{"Risk analyses"|translate}}'
                },
                onEnter: function($timeout, $state){
                    if ($state.current.name == 'main.project') {
                        $state.go('main.dashboard');
                    }
                }
            }).state('main.project.anr', {
                url: "/:modelId/anr",
                views: {
                    "main@main": {templateUrl: "views/anr/anr.layout.html"},
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    label: '{{$scope.model.anr?(_langField($scope.model.anr,\'label\')):(_langField($parent.model.anr,\'label\'))}}'
                }
            }).state('main.project.anr.scales',{
                url: "/scales",
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Evaluation scales"|translate}}'
                }
            }).state('main.project.anr.knowledge',{
                url: "/knowledge",
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Knowledge base"|translate}}'
                }
            }).state('main.project.anr.risk',{
                url: "/risk/:riskId",
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Risk sheet"|translate}}'
                }
            }).state('main.project.anr.riskop',{
                url: "/riskop/:riskopId",
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Risk sheet"|translate}}'
                }
            }).state('main.project.anr.object', {
                url: '/object/:objectId',
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/object.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Library"|translate}}'
                }
            }).state('main.project.anr.instance', {
                url: '/inst/:instId',
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.instance.html'}
                },
                ncyBreadcrumb: {
                    skip: true,
                    label: '{{_langField($scope.instance,\'name\')}}'
                }
            }).state('main.project.anr.instance.risk',{
                url: "/risk/:riskId",
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.instance.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Risk sheet"|translate}}'
                }
            }).state('main.project.anr.instance.riskop',{
                url: "/riskop/:riskopId",
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.instance.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Risk sheet"|translate}}'
                }
            }).state('main.project.anr.risksplan', {
                url: '/risksplan',
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.risksplan.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Implementation of the risk treatment plan"|translate}}'
                }
            }).state('main.project.anr.risksplan.history', {
                url: '/history',
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.risksplan.history.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Risk sheet"|translate}}'
                }
            }).state('main.project.anr.risksplan.sheet', {
                url: '/:recId',
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.risksplan.sheet.html'}
                },
                ncyBreadcrumb: {
                    label: '{{"Recommendation"|translate}}'
                }

            });

            $provide.factory('monarcHttpInter', ['$injector', function ($injector) {
                return {
                    'request': function (config) {
                        // UserService depends on $http, which causes a circular dependency inside a $http interceptor
                        var UserService = $injector.get('UserService');
                        var $http = $injector.get('$http');

                        if (!UserService.isAuthenticated()) {
                            UserService.reauthenticate();
                        }


                        if (UserService.isAuthenticated()) {
                            config.headers.token = UserService.getToken();
                        }

                        return config;
                    },

                    'responseError': function (response) {
                        var ErrorService = $injector.get('ErrorService');

                        if (response.status == 401) {
                            var $state = $injector.get('$state');
                            $state.transitionTo('login');
                        } else if (response.status == 412) {
                            // Human-readable error, with translation support
                            for (var i = 0; i < response.data.errors.length; ++i) {
                                ErrorService.notifyError(response.data.errors[i].message);
                            }
                        } else if (response.status >= 400 && response.config.url != 'auth') {
                            var message = response.status;
                            var url = response.config.url;

                            // Either get our own custom error message, or Zend default error message
                            if (response.data && response.data.message) {
                                message = response.data.message;
                            } else if (response.data && response.data.errors && response.data.errors.length > 0) {
                                message = response.data.errors[0].message;
                            }

                            if (url.indexOf('?') > 0) {
                                url = url.substring(0, url.indexOf('?'));
                            }

                            ErrorService.notifyFetchError(url, message + " (" + response.status + ")");
                        }

                        var $q = $injector.get('$q');
                        return $q.reject(response);
                    }
                }
            }]);
            $httpProvider.interceptors.push('monarcHttpInter');
        }]).
    run(['ConfigService', 'UserService', 'gettextCatalog', '$rootScope', '$stateParams', '$injector', '$transitions',
        function (ConfigService, UserService, gettextCatalog, $rootScope, $stateParams, $injector, $transitions) {

        $rootScope.OFFICE_MODE = 'FO';

        ConfigService.loadConfig(function () {
            $rootScope.appVersion = ConfigService.getVersion();
            var languages = ConfigService.getLanguages();
            var uiLang = UserService.getUiLanguage();

            if (uiLang === undefined || uiLang === null) {
                gettextCatalog.setCurrentLanguage('en');
            } else {
                gettextCatalog.setCurrentLanguage(ISO6391.getCode(languages[uiLang]));
            }

            $rootScope.updatePaginationLabels();
        });

        $rootScope._langField = function (obj, field, forceDefault) {
            if(!obj){
                return '';
            }else{
                if(!field){
                    if ($rootScope.getAnrLanguage() > 0) {
                        return obj + $rootScope.getAnrLanguage();
                    } else {
                        return obj + ConfigService.getDefaultLanguageIndex();
                    }
                }else{
                    var anrLang = $rootScope.getAnrLanguage();
                    if (anrLang > 0 && obj[field + anrLang] && obj[field + anrLang] != '' && !forceDefault) {
                        return obj[field + anrLang];
                    }else{
                        var uiLang = UserService.getUiLanguage();
                        if(!obj[field + uiLang] || obj[field + uiLang] == ''){
                            return obj[field + ConfigService.getDefaultLanguageIndex()];
                        }else{
                            return obj[field + uiLang];
                        }
                    }
                }
            }
        };

        $rootScope.range = function (x,y) {
            var out = [];
            for (var i = x; i <= y; ++i) {
                out.push(i);
            }
            return out;
        };

        $rootScope.getUrlAnrId = function () {
            return $stateParams.modelId;
        };

        $rootScope.__AnrLanguage = {idx: 0};
        $rootScope.setAnrLanguage = function (lang) {
            $rootScope.__AnrLanguage.idx = lang;
        }
        $rootScope.getAnrLanguage = function () {
            return $rootScope.__AnrLanguage.idx;
        }

        // Setup dialog-specific scope based on the rootScope. This is mostly used to have access to _langField
        // in dialog views as well without having to manually declare it every time. We clone the scope so that
        // dialog have their distinct scope and avoid editing the parent one.
        $rootScope.$dialogScope = $rootScope.$new();

        // Update services ANR ID
        var lastKnownAnrId;
        $rootScope.$on('$locationChangeStart', function () {
            if ($rootScope.getUrlAnrId() != lastKnownAnrId) {
                var services = ['AmvService', 'AssetService', 'CategoryService', 'MeasureService', 'ObjlibService', 'RiskService', 'TagService', 'ThreatService', 'VulnService', 'ClientSnapshotService', 'QuestionService'];
                for (var i = 0; i < services.length; ++i) {
                    $injector.get(services[i]).makeResource();
                }
                lastKnownAnrId = $rootScope.getUrlAnrId();
            }
        });

        $transitions.onStart({to: 'main'}, function (trans) {
            return trans.router.stateService.target('main.dashboard');
        });

        // Safari filtering method
        $rootScope.isSafari = function () {
            var ua = navigator.userAgent.toLowerCase();
            return (ua.indexOf('safari') != -1 && ua.indexOf('chrome') < 0);
        };

        // Method to update pagination labels globally when switching language in account settings
        $rootScope.updatePaginationLabels = function () {
            $rootScope.paginationLabels = {
                page: gettextCatalog.getString('Page:'),
                rowsPerPage: gettextCatalog.getString('Rows per page:'),
                of: gettextCatalog.getString('of')
            }
        }

        $rootScope.updatePaginationLabels();
    }
    ]);

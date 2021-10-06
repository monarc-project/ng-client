angular
    .module('ClientApp', ['ngMaterial', 'ngAnimate', 'toastr', 'ui.router', 'gettext', 'ngResource',
        'LocalStorageModule', 'md.data.table', 'ncy-angular-breadcrumb', 'ngFileUpload',
        'ui.tree', 'ngMessages', 'angularTrix', 'AnrModule', 'ng-sortable','ng-countryflags'])
    .config(['$mdThemingProvider', '$stateProvider', '$urlRouterProvider', '$resourceProvider',
        'localStorageServiceProvider', '$httpProvider', '$breadcrumbProvider', '$provide', 'gettext', '$mdAriaProvider',
        '$mdDateLocaleProvider', '$locationProvider','$sceDelegateProvider',
        function ($mdThemingProvider, $stateProvider, $urlRouterProvider, $resourceProvider, localStorageServiceProvider,
                  $httpProvider, $breadcrumbProvider, $provide, gettext, $mdAriaProvider, $mdDateLocaleProvider, $locationProvider,
                  $sceDelegateProvider) {
            // Store the state provider to be allow controllers to inject their routes
            window.$stateProvider = $stateProvider;

            $sceDelegateProvider.resourceUrlWhitelist([
                // Allow same origin resource loads.
                'self',
                // Allow loading from our assets domain.  Notice the difference between * and **.
                'https://objects.monarc.lu/**'
            ]);

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
            $mdDateLocaleProvider.months = [
                gettext('January'),
                gettext('February'),
                gettext('March'),
                gettext('April'),
                gettext('May'),
                gettext('June'),
                gettext('July'),
                gettext('August'),
                gettext('September'),
                gettext('October'),
                gettext('November'),
                gettext('December')
            ];
            $mdDateLocaleProvider.shortMonths = [
                gettext('Jan'),
                gettext('Feb'),
                gettext('Mar'),
                gettext('Apr'),
                gettext('May'),
                gettext('Jun'),
                gettext('Jul'),
                gettext('Aug'),
                gettext('Sep'),
                gettext('Oct'),
                gettext('Nov'),
                gettext('Dec')
            ];
            $mdDateLocaleProvider.days = [
                gettext('Monday'),
                gettext('Tuesday'),
                gettext('Wednesday'),
                gettext('Thursday'),
                gettext('Friday'),
                gettext('Saturday'),
                gettext('Sunday')
            ];
            $mdDateLocaleProvider.shortDays = [
                gettext('Mon'),
                gettext('Tue'),
                gettext('Wed'),
                gettext('Thu'),
                gettext('Fri'),
                gettext('Sat'),
                gettext('Sun')
            ];
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
                .setStorageType('localStorage');

            $breadcrumbProvider.setOptions({
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
                    label: gettext('Home')
                },
            }).state('main.account', {
                url: "/account",
                views: {
                    "main@main": {templateUrl: "views/client.account.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Account')
                }
            }).state('main.admin', {
                url: "/admin",
                ncyBreadcrumb: {
                    label: gettext('Administration')
                }
            }).state('main.admin.accesslog', {
                url: "/accesslog",
                views: {
                    "main@main": {templateUrl: "views/client.admin.accesslog.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Access log')
                }
            }).state('main.admin.settings', {
                url: "/settings",
                views: {
                    "main@main": {templateUrl: "views/client.admin.settings.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('General settings')
                }
            }).state('main.admin.deliveries_models', {
                url: "/deliveriesmodels",
                views: {
                    "main@main": {templateUrl: "views/client.admin.deliveriesmodels.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Deliverable templates')
                }
            }).state('main.admin.users', {
                url: "/users",
                views: {
                    "main@main": {templateUrl: "views/client.admin.users.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Users')
                }
            }).state('main.project', {
                url: "/project",
                views: {
                    "main@main": {templateUrl: "views/client.project.html"}
                },
                ncyBreadcrumb: {
                    skip: true,
                    label: gettext('Risk analyses')
                },
                onEnter: function($timeout, $state){
                    if ($state.current.name == 'main.project') {
                        $state.go('main.project');
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
            }).state('main.project.anr.dashboard', {
                url: "/dashboard",
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Dashboard')
                }
            }).state('main.project.anr.scales',{
                url: "/scales",
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Evaluation scales')
                }
            }).state('main.project.anr.knowledge',{
                url: "/knowledge",
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Knowledge base')
                }
            }).state('main.project.anr.risk',{
                url: "/risk/:riskId",
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Risk sheet')
                }
            }).state('main.project.anr.riskop',{
                url: "/riskop/:riskopId",
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Risk sheet')
                }
            }).state('main.project.anr.object', {
                url: '/object/:objectId',
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/object.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Library')
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
                    label: gettext('Risk sheet')
                }
            }).state('main.project.anr.instance.riskop',{
                url: "/riskop/:riskopId",
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.instance.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Risk sheet')
                }
            }).state('main.project.anr.risksplan', {
                url: '/risksplan',
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.risksplan.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Implementation of the risk treatment plan')
                }
            }).state('main.project.anr.risksplan.history', {
                url: '/history',
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.risksplan.history.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Implementation history')
                }
            }).state('main.project.anr.risksplan.sheet', {
                url: '/:recId',
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.risksplan.sheet.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Recommendation')
                }

            }).state('main.project.anr.ropa', {
                url: '/ropa',
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.ropa.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Record of processing activities')
                }
            }).state('main.project.anr.soa', {
                url: '/soa',
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.soa.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Statement of applicability')
                }
            }).state('main.project.anr.soa.sheet', {
                url: '/control',
                data: null,
                views: {
                    'anr@main.project.anr': {templateUrl: 'views/anr/anr.soa.sheet.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Risks')
                },
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
                            const state = $injector.get('$state');
                            state.transitionTo('login');
                        } else if (response.status == 403) {
                            const resourceUrl = response.config.url;
                            if (resourceUrl) {
                                ErrorService.notifyError('This resource is forbidden: ' + resourceUrl);
                            } else {
                                ErrorService.notifyError('Unauthorized operation occurred.');
                            }
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
            $rootScope.encryptedAppVersion = ConfigService.getEncryptedVersion();
            $rootScope.checkVersion = ConfigService.getCheckVersion();
            $rootScope.appCheckingURL = ConfigService.getAppCheckingURL();
            $rootScope.mospApiUrl = ConfigService.getMospApiUrl();
            $rootScope.terms = ConfigService.getTerms();
            $rootScope.languages = ConfigService.getLanguages();
            var uiLang = UserService.getUiLanguage();

            if (uiLang === undefined || uiLang === null) {
                gettextCatalog.setCurrentLanguage('en');
                $rootScope.uiLanguage = 'gb';
            } else {
                gettextCatalog.setCurrentLanguage($rootScope.languages[uiLang].code);
                $rootScope.uiLanguage = $rootScope.languages[uiLang].flag;
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
                var services = ['AmvService', 'AssetService', 'CategoryService', 'MeasureService',
                    'ObjlibService', 'RiskService', 'TagService', 'ThreatService',
                    'VulnService', 'ClientSnapshotService', 'QuestionService', 'RecordService',
                    'ReferentialService', 'SOACategoryService', 'MeasureMeasureService',
                    'ClientSoaService'];
                for (var i = 0; i < services.length; ++i) {
                    $injector.get(services[i]).makeResource();
                }
                lastKnownAnrId = $rootScope.getUrlAnrId();
            }
        });

        $transitions.onStart({to: 'main'}, function (trans) {
            $rootScope.appVersionCheckingTimestamp = new Date().getTime();
            return trans.router.stateService.target('main.project');
        });

        // Filter to convert a string to base 64
        $rootScope.convertToBase64 = function(value) {
            return btoa(value);
        }

        // Method to update pagination labels globally when switching language in account settings
        $rootScope.updatePaginationLabels = function () {
            $rootScope.paginationLabels = {
                page: gettextCatalog.getString('Page:'),
                rowsPerPage: gettextCatalog.getString('Rows per page:'),
                of: gettextCatalog.getString('of')
            }
        }

        $rootScope.updatePaginationLabels();

        //Handle rejection when close/ESC a $mdDialog
        $rootScope.handleRejectionDialog = function(reject) {
          if(reject !== undefined) throw reject;
        }
    }
]);

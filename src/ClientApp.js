angular
    .module('ClientApp', ['ngMaterial', 'ngAnimate', 'toastr', 'ui.router', 'gettext', 'ngResource',
        'LocalStorageModule', 'md.data.table', 'ncy-angular-breadcrumb', 'ngFileUpload', 'angularInlineEdit',
        'ui.tree', 'ngMessages', 'AnrModule'])
    .config(['$mdThemingProvider', '$stateProvider', '$urlRouterProvider', '$resourceProvider',
        'localStorageServiceProvider', '$httpProvider', '$breadcrumbProvider', '$provide', 'gettext', '$mdAriaProvider',
        function ($mdThemingProvider, $stateProvider, $urlRouterProvider, $resourceProvider, localStorageServiceProvider,
                  $httpProvider, $breadcrumbProvider, $provide, gettext, $mdAriaProvider) {
            // Store the state provider to be allow controllers to inject their routes
            window.$stateProvider = $stateProvider;

            $mdThemingProvider.theme('default')
                .primaryPalette('cyan')
                .accentPalette('amber')
                .dark();

            $mdThemingProvider.theme('light')
                .backgroundPalette('grey')
                .primaryPalette('cyan')
                .accentPalette('amber');

            $mdThemingProvider.theme('orange')
                .backgroundPalette('orange')
                .primaryPalette('amber')
                .accentPalette('green')
                .dark();

            $urlRouterProvider.otherwise('/');

            // Globally disables all ARIA warnings.
            $mdAriaProvider.disableWarnings();

            localStorageServiceProvider
                .setStorageType('sessionStorage');

            $breadcrumbProvider.setOptions({
                template: '<div><span ng-repeat="step in steps" ng-class="{active: $last}" ng-switch="$last || !!step.abstract"><a ng-switch-when="false" href="{{step.ncyBreadcrumbLink}}">{{step.ncyBreadcrumbLabel}}</a><span ng-switch-when="false"> <md-icon>chevron_right</md-icon> </span><span ng-switch-when="true">{{step.ncyBreadcrumbLabel}}</span></span></div>'
            });

            $stateProvider.state('login', {
                url: "/",
                views: {
                    "main": {templateUrl: "/views/login.html"}
                }
            }).state('passwordforgotten', {
                url: "/passwordforgotten/:token",
                views: {
                    "main": {templateUrl: "/views/passwordforgotten.html"}
                }
            }).state('main', {
                url: "/client",
                views: {
                    "main": {templateUrl: "/views/client.index.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Home')
                }
            }).state('main.account', {
                url: "/account",
                views: {
                    "main@main": {templateUrl: "/views/client.account.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Account')
                }
            }).state('main.dashboard', {
                url: "/dashboard",
                views: {
                    "main@main": {templateUrl: "/views/client.dashboard.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Dashboard')
                }
            }).state('main.admin', {
                url: "/admin",
                ncyBreadcrumb: {
                    label: gettext('Administration')
                }
            }).state('main.admin.accesslog', {
                url: "/accesslog",
                views: {
                    "main@main": {templateUrl: "/views/client.admin.accesslog.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Access log')
                }
            }).state('main.project', {
                url: "/project",
                views: {
                    "main@main": {templateUrl: "/views/client.project.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Risk analyses')
                }
            }).state('main.project.anr', {
                url: "/:modelId/anr",
                views: {
                    "main@main": {templateUrl: "/views/anr/anr.layout.html"},
                    'anr@main.project.anr': {templateUrl: '/views/anr/anr.home.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Risk analysis details')
                }
            }).state('main.project.anr.object', {
                url: '/object/:objectId',
                views: {
                    'anr@main.project.anr': {templateUrl: '/views/object.info_risk.kb_mgmt.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Object information')
                }
            }).state('main.project.anr.instance', {
                url: '/inst/:instId',
                views: {
                    'anr@main.project.anr': {templateUrl: '/views/anr/anr.instance.html'}
                },
                ncyBreadcrumb: {
                    label: gettext('Object instance')
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
                        } else if (response.status >= 400 && response.config.url != '/auth') {
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
    run(['ConfigService', 'UserService', 'gettextCatalog', '$rootScope', function (ConfigService, UserService, gettextCatalog, $rootScope) {

        $rootScope.OFFICE_MODE = 'FO';

        ConfigService.loadConfig(function () {
            var languages = ConfigService.getLanguages();
            var uiLang = UserService.getUiLanguage();

            if (uiLang === undefined || uiLang === null) {
                gettextCatalog.setCurrentLanguage('en');
            } else {
                gettextCatalog.setCurrentLanguage(languages[uiLang].substring(0, 2).toLowerCase());
            }

            $rootScope.updatePaginationLabels();
        });

        $rootScope._langField = function (field) {
            return field + ConfigService.getDefaultLanguageIndex();
        };

        $rootScope.range = function (x,y) {
            var out = [];
            for (var i = x; i <= y; ++i) {
                out.push(i);
            }
            return out;
        };

        // Setup dialog-specific scope based on the rootScope. This is mostly used to have access to _langField
        // in dialog views as well without having to manually declare it every time. We clone the scope so that
        // dialog have their distinct scope and avoid editing the parent one.
        $rootScope.$dialogScope = $rootScope.$new();

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
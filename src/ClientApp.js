angular
    .module('ClientApp', ['ngMaterial', 'ngAnimate', 'toastr', 'ui.router', 'gettext', 'ngResource',
        'LocalStorageModule', 'md.data.table', 'ncy-angular-breadcrumb', 'ngFileUpload', 'angularInlineEdit',
        'ui.tree', 'ngMessages'])
    .config(['$mdThemingProvider', '$stateProvider', '$urlRouterProvider', '$resourceProvider',
        'localStorageServiceProvider', '$httpProvider', '$breadcrumbProvider', '$provide', 'gettext',
        function ($mdThemingProvider, $stateProvider, $urlRouterProvider, $resourceProvider, localStorageServiceProvider,
                  $httpProvider, $breadcrumbProvider, $provide, gettext) {
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
            }).state('main.project', {
                url: "/project/:id",
                ncyBreadcrumb: {
                    label: gettext('Project')
                }
            }).state('main.project.anr', {
                url: "/anr",
                views: {
                    "main@main": {templateUrl: "/views/client.project.anr.html"}
                },
                ncyBreadcrumb: {
                    label: gettext('Risk analysis')
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
    run(['ConfigService', 'gettext', '$rootScope', function (ConfigService, gettext, $rootScope) {
        ConfigService.loadConfig();

        // Method to update pagination labels globally when switching language in account settings
        $rootScope.updatePaginationLabels = function () {
            $rootScope.paginationLabels = {
                page: gettext('Page:'),
                rowsPerPage: gettext('Rows per page:'),
                of: gettext('of')
            }
        }

        $rootScope.updatePaginationLabels();
    }
    ]);
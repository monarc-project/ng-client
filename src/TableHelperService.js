(function () {

    angular
        .module('ClientApp')
        .factory('TableHelperService', [
            TableHelperService
        ]);

    function TableHelperService() {
        var self = this;
        self.bookmarks = {};

        var build = function (order, limit, page, filter) {
            return {
                items: [],
                promise: null,
                selected: [],
                query: {
                    order: order ? order : null,
                    limit: limit ? limit : 10,
                    page: page ? page : 10,
                    filter: filter ? filter : ''
                },
                filter: {
                    show: false,
                    options: {
                        debounce: 500
                    }
                }
            };
        };

        var removeFilter = function (struct, form) {
            struct.activeFilter = 1;
            struct.filter.show = false;
            struct.query.filter = '';

            if (form && form.$dirty) {
                form.$setPristine();
            }
        };

        var watchSearch = function ($clientScope, variable, queryVariable, updateFct, struct) {
            var unregister = $clientScope.$watch(variable, function (newValue, oldValue) {
                if (!oldValue) {
                    self.bookmarks[variable] = queryVariable.page;
                }

                if (newValue !== oldValue) {
                    queryVariable.page = 1;
                }

                if (!newValue) {
                    queryVariable.page = self.bookmarks[variable];
                }

                updateFct();
            });

            if (struct) {
                struct.watchUnregister = unregister;
            }
        };

        var unwatchSearch = function (struct) {
            if (struct.watchUnregister) {
                struct.watchUnregister();
            }
        }

        var resetBookmarks = function () {
            self.bookmarks = {};
        };

        return {
            build: build,
            removeFilter: removeFilter,
            watchSearch: watchSearch,
            unwatchSearch: unwatchSearch,
            resetBookmarks: resetBookmarks
        };
    }

})
();
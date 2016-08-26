(function () {

    angular
        .module('ClientApp')
        .factory('ErrorService', [ 'toastr', 'gettextCatalog', ErrorService ]);

    function ErrorService(toastr, gettextCatalog) {
        var self = this;

        var notifyFetchError = function (thing, status) {
            toastr.error(gettextCatalog.getString('An error occurred while fetching {{ thing }}: {{status}}',
                { thing: thing, status: status }));
        };

        var notifyError = function (thing) {
            toastr.error(gettextCatalog.getString(thing));
        };

        return {
            notifyFetchError: notifyFetchError,
            notifyError: notifyError
        };
    }

})();
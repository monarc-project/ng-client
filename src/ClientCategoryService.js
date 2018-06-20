(function () {

    angular
        .module('ClientApp')
        .factory('ClientCategoryService', [ '$resource', ClientCategoryService ]);

    function ClientCategoryService($resource) {
        var self = this;



                self.ClientCategoryResource = $resource('api/client-anr/:anr/category/:id', { 'id': '@id', 'anr': '@anr' }, {
                    'update': {
                        method: 'PATCH'
                    },
                    'query': {
                        isArray: false
                    }
                });


                var getCategories = function (params) {
                    return self.ClientCategoryResource.query(params).$promise;
                };

                var getCategory = function (params) {
                    return self.ClientCategoryResource.query({'anr': params.anr, 'id': params.id}).$promise;
                };


                return {
                    getCategories: getCategories,
                    getCategory: getCategory,

                };



    }

})
();

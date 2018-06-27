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

                var createCategory = function (params, success, error) {
                    new self.CategoryResource(params).$save(success, error);
                };

                var updateCategory = function (params, success, error) {
                    self.CategoryResource.update(params, success, error);
                };

                var deleteCategory = function (id, success, error) {
                    self.CategoryResource.delete({categoryId: id}, success, error);
                };
                return {
                    getCategories: getCategories,
                    getCategory: getCategory,
                    createCategory: createCategory,
                    deleteCategory: deleteCategory,
                    updateCategory: updateCategory

                };



    }

})
();

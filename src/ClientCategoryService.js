(function () {

    angular
        .module('ClientApp')
        .factory('ClientCategoryService', [ '$resource', '$rootScope', 'MassDeleteService', ClientCategoryService ]);

    function ClientCategoryService($resource, $rootScope, MassDeleteService) {
        var self = this;



        var makeResource = function () {
           var anr =  "client-anr/:urlAnrId/" ; // '@anr'

            self.ClientCategoryResource = $resource('api/' + anr + 'category/:categoryId', {
                    categoryId: '@id',
                    urlAnrId: $rootScope.getUrlAnrId()
                },
                {
                    'update': {
                        method: 'PUT'
                    },
                    'patch': {
                        method: 'PATCH'
                    },
                    'query': {
                        isArray: false
                    }
                });
        }
        makeResource();



                var getCategories = function (params) {
                    makeResource();
                    return self.ClientCategoryResource.query(params).$promise;
                };

                var getCategory = function (params) {
                    makeResource();
                    return self.ClientCategoryResource.query({'anr': params.anr, 'id': params.id}).$promise;
                };

                var createCategory = function (params, success, error) {
                    new self.ClientCategoryResource(params).$save(success, error);
                };

                var updateCategory = function (params, success, error) {
                    self.ClientCategoryResource.update(params, success, error);
                };

                var deleteCategory = function (id, success, error) {
                    self.ClientCategoryResource.delete({categoryId: id}, success, error);
                };


                var deleteMassCategory = function (ids, success, error) {

                    if ($rootScope.OFFICE_MODE == 'FO') {
                        MassDeleteService.deleteMass('api/client-anr/' + $rootScope.getUrlAnrId() + '/category', ids, success, error);
                    } else {
                        MassDeleteService.deleteMass('api/category', ids, success, error);
                    }
                }

                var patchCategory = function (id, params, success, error) {

                    self.ClientCategoryResource.patch({categoryId: id}, params, success, error);
                }

                return {
                    getCategories: getCategories,
                    getCategory: getCategory,
                    createCategory: createCategory,
                    deleteCategory: deleteCategory,
                    updateCategory: updateCategory,
                    deleteMassCategory:deleteMassCategory,
                    patchCategory:patchCategory

                };



    }

})
();

(function () {

    angular
        .module('ClientApp')
        .factory('DeliveriesModelsService', [ '$resource', 'gettextCatalog', DeliveriesModelsService ]);

    function DeliveriesModelsService($resource, gettextCatalog) {
        var self = this;

        self.DeliveryModelResource = $resource('api/deliveriesmodels/:deliveryModelId', { deliveryModelId: '@id' },
            {
                'update': {
                    method: 'PUT'
                },
                'query': {
                    isArray: false
                }
            });

        var getDeliveriesModels = function (params) {
            return self.DeliveryModelResource.query(params).$promise;
        };

        var getDeliveryModel = function (id) {
            return self.DeliveryModelResource.query({deliveryModelId: id}).$promise;
        };

        var createDeliveryModel = function (params, success, error) {
            new self.DeliveryModelResource(params).$save(success, error);
        };

        var updateDeliveryModel = function (params, success, error) {
            self.DeliveryModelResource.update(params, success, error);
        };

        var deleteDeliveryModel = function (id, success, error) {
            self.DeliveryModelResource.delete({deliveryModelId: id}, success, error);
        };

        const categoriesLabels = {
            1: "Deliverable template for context validation", // NOTE: add translations in ng_anr/views/_gettext_caveats.html
            2: "Deliverable template for model validation",
            3: "Deliverable template for final report",
            4: "Deliverable template for Implementation plan",
            5: "Deliverable template for Statement of applicability",
            6: "Deliverable template for record of processing activities",
            7: "Deliverable template for all record of processing activities"
        }

        const categories = [
            {
                id: 1,
                label: categoriesLabels[1]
            },
            {
                id: 2,
                label: categoriesLabels[2]
            },
            {
                id: 3,
                label: categoriesLabels[3]
            },
            {
                id: 4,
                label: categoriesLabels[4]
            },
            {
                id: 5,
                label: categoriesLabels[5]
            },
            {
                id: 6,
                label: categoriesLabels[6]
            },
            {
                id: 7,
                label: categoriesLabels[7]
            }
        ];

        return {
            getDeliveriesModels: getDeliveriesModels,
            getDeliveryModel: getDeliveryModel,
            createDeliveryModel: createDeliveryModel,
            updateDeliveryModel: updateDeliveryModel,
            deleteDeliveryModel: deleteDeliveryModel,

            getCategories: function () { return categories; },
            getCategoryLabel: function (id) { return categoriesLabels[id]; }
        };
    }

})
();

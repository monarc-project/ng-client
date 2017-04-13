(function () {

    angular
        .module('ClientApp')
        .factory('UserProfileService', [ '$resource', UserProfileService ]);

    function UserProfileService($resource) {
        var self = this;

        self.UserProfileResource = $resource('api/user/profile', { }, {
            'update': {
                method: 'PATCH'
            },
            'query': {
                isArray: false
            }
        });

        var getProfile = function (id) {
            return self.UserProfileResource.query({clientId: id}).$promise;
        };

        var updateProfile = function (params, success, error) {
            self.UserProfileResource.update(params, success, error);
        };

        return {
            getProfile: getProfile,
            updateProfile: updateProfile,
        };
    }

})
();
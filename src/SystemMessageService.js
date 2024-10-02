(function () {
  angular.module('ClientApp').factory('SystemMessageService', ['$resource', SystemMessageService]);

  function SystemMessageService($resource) {
    let self = this;
    self.SystemMessagesResource = $resource('api/system-messages/:id', {'id': '@id'}, {'query': {isArray: false}});

    let getActiveSystemMessages = function (params) {
      return self.SystemMessagesResource.query(params).$promise;
    };

    let hideSystemMessage = function (id, success, error) {
      self.SystemMessagesResource.delete({id: id}, success, error);
    };

    return {
      getActiveSystemMessages: getActiveSystemMessages,
      hideSystemMessage: hideSystemMessage
    };
  }
})();

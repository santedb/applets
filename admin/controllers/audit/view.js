/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('AuditViewController', ["$scope", "$rootScope", "$stateParams", function ($scope, $rootScope, $stateParams) {

    // Fetch audit
    async function fetchAudit(auditId) {

        try {
            $scope.audit = await SanteDB.resources.audit.getAsync(auditId);
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    // Fetch audit
    fetchAudit($stateParams.id).then(()=>$scope.$apply());

}]);
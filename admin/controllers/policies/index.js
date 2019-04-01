angular.module('santedb').controller('PolicyIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {

    /**
     * @summary Delete the specified user
     */
    $scope.delete = function (id, index) {
        if (confirm(SanteDB.locale.getString("ui.admin.policy.confirmDelete"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash").removeClass("fa-trash").addClass("fa-circle-notch fa-spin");
            SanteDB.resources.securityPolicy.deleteAsync(id)
                .then(function (e) {
                    $("#SecurityPolicyTable table").DataTable().draw();
                })
                .catch($rootScope.errorHandler);
        }
    }

    /**
     * @summary Render updated by
     */
    $scope.renderUpdatedBy = function (policy) {
        if (policy.updatedBy != null)
            return `<span ng-bind-html="'${policy.updatedBy}' | provenance: '${policy.updatedTime}':'#!/security/session/'"></span>`;
        else if (policy.createdBy != null)
            return `<span ng-bind-html="'${policy.createdBy}' | provenance: '${policy.creationTime}':'#!/security/session/'"></span>`;
        return "";
    }

    /**
     * @summary Render the lockout status
     */
    $scope.renderState = function (policy) {
        return policy.obsoletionTime ? `<i title="${SanteDB.locale.getString("ui.state.obsolete")}" class="fa fa-trash"></i>` :
            `<i title="${SanteDB.locale.getString("ui.state.active")}" class="fa fa-check"></i>`;
    }

    
}]);

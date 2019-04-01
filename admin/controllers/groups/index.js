angular.module('santedb').controller('GroupIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {

    /**
     * @summary Delete the specified user
     */
    $scope.delete = function (id, index) {
        if (confirm(SanteDB.locale.getString("ui.admin.groups.confirmDelete"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash").removeClass("fa-trash").addClass("fa-circle-notch fa-spin");
            SanteDB.resources.securityRole.deleteAsync(id)
                .then(function (e) {
                    $("#SecurityRoleTable table").DataTable().draw();
                })
                .catch($rootScope.errorHandler);
        }
    }

    /**
     * @summary Render updated by
     */
    $scope.renderUpdatedBy = function (role) {
        if (role.updatedBy != null)
            return `<span ng-bind-html="'${role.updatedBy}' | provenance: '${role.updatedTime}':'#!/security/session/'"></span>`;
        else if (role.createdBy != null)
            return `<span ng-bind-html="'${role.createdBy}' | provenance: '${role.creationTime}':'#!/security/session/'"></span>`;
        return "";
    }

    /**
     * @summary Render the lockout status
     */
    $scope.renderState = function (role) {
        return role.obsoletionTime ? `<i title="${SanteDB.locale.getString("ui.state.obsolete")}" class="fa fa-trash"></i>` :
            `<i title="${SanteDB.locale.getString("ui.state.active")}" class="fa fa-check"></i>`;
    }

    
}]);

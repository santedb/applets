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
            return `<provenance provenance-id="'${policy.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${policy.updatedTime}'"></provenance>`;
        else if (policy.createdBy != null)
            return `<provenance provenance-id="'${policy.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${policy.creationTime}'"></provenance>`;
        return "";
    }

    /**
     * @summary Render the lockout status
     */
    $scope.renderState = function (policy) {
        
        // Render the specified object 
        if(policy.obsoletionTime)
            return `<i title="${SanteDB.locale.getString("ui.state.obsolete")}" class="fa fa-trash"></i> <span class="badge badge-pill badge-danger"> ${SanteDB.locale.getString("ui.state.obsolete")}</span>` ;
        else if(policy.canOverride)
            return `<i title='${SanteDB.locale.getString("ui.model.securityPolicy.canOverride.true")}' class="fas fa-shield-alt"></i><span class="indicator-overlay"><i class="fas fa-circle text-warning"></i></span> <span class="badge badge-pill badge-warning"> ${SanteDB.locale.getString("ui.model.securityPolicy.canOverride.true.summary")}</span>`;
        else if(!policy.isPublic) 
            return `<i title="${SanteDB.locale.getString("ui.state.readonly")}" class="fas fa-lock"></i> <span class="badge badge-pill badge-dark"> ${SanteDB.locale.getString("ui.state.readonly")}</span>`;
        else
            return `<i title="${SanteDB.locale.getString("ui.state.active")}" class="fa fa-check"></i> <span class="badge badge-pill badge-success"> ${SanteDB.locale.getString("ui.state.active")}</span>` ;
        
    }


    
}]);

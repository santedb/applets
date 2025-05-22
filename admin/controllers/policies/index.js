/// <reference path="../../../core/js/santedb.js"/>
/*
 * Copyright (C) 2021 - 2025, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Portions Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
 * Portions Copyright (C) 2015-2018 Mohawk College of Applied Arts and Technology
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you 
 * may not use this file except in compliance with the License. You may 
 * obtain a copy of the License at 
 * 
 * http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
 * License for the specific language governing permissions and limitations under 
 * the License.
 */
angular.module('santedb').controller('PolicyIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {

   /**
     * @summary Delete the specified policy
     */
    $scope.delete = function (id, index) {
        var data = $("#SecurityPolicyTable table").DataTable().row(index).data();

        if (!data.obsoletionTime && confirm(SanteDB.locale.getString("ui.admin.policy.confirmDelete"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash").removeClass("fa-trash").addClass("fa-circle-notch fa-spin");
            SanteDB.resources.securityPolicy.deleteAsync(id)
                .then(function (e) {
                    $("#SecurityPolicyTable").attr("newQueryId", true);
                    $("#SecurityPolicyTable table").DataTable().draw();
                })
                .catch($rootScope.errorHandler);
        }
        else if (data.obsoletionTime && confirm(SanteDB.locale.getString("ui.admin.policy.confirmUnDelete"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash-restore").removeClass("fa-trash-restore").addClass("fa-circle-notch fa-spin");

            // Patch the user
            var patch = new Patch({
                change: [
                    new PatchOperation({
                        op: PatchOperationType.Remove,
                        path: 'obsoletionTime',
                        value: null
                    }),
                    new PatchOperation({
                        op: PatchOperationType.Remove,
                        path: 'obsoletedBy',
                        value: null
                    })
                ]
            });

            SanteDB.resources.securityPolicy.patchAsync(id, null, patch)
                .then(function (e) {
                    $("#SecurityPolicyTable").attr("newQueryId", true);
                    $("#SecurityPolicyTable table").DataTable().draw();
                })
                .catch(function (e) {
                    $("#action_grp_" + index + " a").removeClass("disabled");
                    $("#action_grp_" + index + " a i.fa-circle-notch").removeClass("fa-circle-notch fa-spin").addClass("fa-trash-restore");
                    $rootScope.errorHandler(e);
                });

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

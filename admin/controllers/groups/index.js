/*
 * Portions Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * Portions Copyright 2019-2019 SanteSuite Contributors (See NOTICE)
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
 * 
 * User: Justin Fyfe
 * Date: 2019-8-8
 */
angular.module('santedb').controller('GroupIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {

    /**
     * @summary Delete the specified user
     */
    $scope.delete = function (id, index) {
        var data = $("#SecurityRoleTable table").DataTable().row(index).data();

        if (!data.obsoletionTime && confirm(SanteDB.locale.getString("ui.admin.groups.confirmDelete"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash").removeClass("fa-trash").addClass("fa-circle-notch fa-spin");
            SanteDB.resources.securityRole.deleteAsync(id)
                .then(function (e) {
                    $("#SecurityRoleTable").attr("newQuery", true);
                    $("#SecurityRoleTable table").DataTable().draw();
                })
                .catch($rootScope.errorHandler);
        }
        else if (data.obsoletionTime && confirm(SanteDB.locale.getString("ui.admin.groups.confirmUnDelete"))) {
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

            SanteDB.resources.securityRole.patchAsync(id, null, patch)
                .then(function (e) {
                    $("#SecurityRoleTable").attr("newQuery", true);
                    $("#SecurityRoleTable table").DataTable().draw();
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
    $scope.renderUpdatedBy = function (role) {
        if (role.obsoletedBy != null)
            return `<provenance provenance-id="'${role.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${role.obsoletedBy}'"></provenance>`;
        else if (role.updatedBy != null)
            return `<provenance provenance-id="'${role.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${role.updatedTime}'"></provenance>`;
        else if (role.createdBy != null)
            return `<provenance provenance-id="'${role.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${role.creationTime}'"></provenance>`;
        return "";
    }

    /**
     * @summary Render the lockout status
     */
    $scope.renderState = function (role) {
        return role.obsoletionTime ? `<i title="${SanteDB.locale.getString("ui.state.obsolete")}" class="fa fa-trash"></i>  <span class="badge badge-pill badge-danger"> ${SanteDB.locale.getString("ui.state.obsolete")}</span>` :
            `<i title="${SanteDB.locale.getString("ui.state.active")}" class="fa fa-check"></i>  <span class="badge badge-pill badge-success"> ${SanteDB.locale.getString("ui.state.active")}</span>`;
    }

    /**
     * @summary Display session information
     */
    $scope.sessionFunction = function (id) {

    }

}]);

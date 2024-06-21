/*
 * Copyright (C) 2021 - 2024, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
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
 * 
 * User: fyfej
 * Date: 2023-5-19
 */
angular.module('santedb').controller('ApplicationIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {

    /**
     * @summary Delete the specified application
     */
    $scope.delete = function (id, index) {

        var data = $("#SecurityApplicationTable table").DataTable().row(index).data();
        if (!data.obsoletionTime && confirm(SanteDB.locale.getString("ui.admin.applications.confirmDelete"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash").removeClass("fa-trash").addClass("fa-circle-notch fa-spin");
            SanteDB.resources.securityApplication.deleteAsync(id)
                .then(function (e) {
                    $("#SecurityApplicationTable").attr("newQueryId", true);
                    $("#SecurityApplicationTable table").DataTable().draw();
                })
                .catch($rootScope.errorHandler);
        }
        else if (data.obsoletionTime && confirm(SanteDB.locale.getString("ui.admin.applications.confirmUnDelete"))) {
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

            SanteDB.resources.securityApplication.patchAsync(id, data.securityStamp, patch)
                .then(function (e) {
                    $("#SecurityApplicationTable").attr("newQueryId", true);
                    $("#SecurityApplicationTable table").DataTable().draw();
                })
                .catch(function (e) {
                    $("#action_grp_" + index + " a").removeClass("disabled");
                    $("#action_grp_" + index + " a i.fa-circle-notch").removeClass("fa-circle-notch fa-spin").addClass("fa-trash-restore");
                    $rootScope.errorHandler(e);
                });
        }
    }

    /**
     * @summary Lock the specified device
     */
    $scope.lock = function (id, index) {
        var data = $("#SecurityApplicationTable table").DataTable().row(index).data();
        if (confirm(SanteDB.locale.getString(data.lockout ? "ui.admin.applications.confirmUnlock" : "ui.admin.applications.confirmLock"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-lock").removeClass("fa-lock").addClass("fa-circle-notch fa-spin");
            $("#action_grp_" + index + " a i.fa-unlock").removeClass("fa-unlock").addClass("fa-circle-notch fa-spin");
            if (data.lockout) {
                SanteDB.resources.securityApplication.unLockAsync(id)
                    .then(function (e) {
                        $("#SecurityApplicationTable table").DataTable().draw();
                    })
                    .catch($rootScope.errorHandler);
            }
            else {
                SanteDB.resources.securityApplication.lockAsync(id)
                    .then(function (e) {
                        $("#SecurityApplicationTable table").DataTable().draw();
                    })
                    .catch($rootScope.errorHandler);
            }
        }
    }

    /**
     * @summary Render the lockout status
     */
    $scope.renderLockout = function (device) {
        return device.obsoletionTime ? `<i title="${SanteDB.locale.getString("ui.state.obsolete")}" class="fa fa-trash"></i>  <span class="badge badge-pill badge-danger"> ${SanteDB.locale.getString("ui.state.obsolete")}</span>` :
            device.lockout > new Date() ? `<i title="${SanteDB.locale.getString("ui.state.locked")}" class="fa fa-lock"></i>  <span class="badge badge-pill badge-warning"> ${SanteDB.locale.getString("ui.state.locked")} (${moment(device.lockout).format(SanteDB.locale.dateFormats.second)})</span>` :
                `<i title="${SanteDB.locale.getString("ui.state.active")}" class="fa fa-check"></i> <span class="badge badge-pill badge-success"> ${SanteDB.locale.getString("ui.state.active")}</span>`;
    }

    /**
     * @summary Render updated by
     */
    $scope.renderUpdatedBy = function (device) {
        if (device.obsoletedBy != null)
            return `<provenance provenance-id="'${device.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.obsoletionTime}'"></provenance>`;
        else if (device.updatedBy != null)
            return `<provenance provenance-id="'${device.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.updatedTime}'"></provenance>`;
        else if (device.createdBy != null)
            return `<provenance provenance-id="'${device.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.creationTime}'"></provenance>`;
        return "";
    }
}]);

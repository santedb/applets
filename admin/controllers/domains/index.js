/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
angular.module('santedb').controller('IdentityDomainIndexController', ["$scope", "$rootScope", function ($scope, $rootScope) {

     /**
     * @summary Render updated by
     */
    $scope.renderUpdatedBy = function (identityDomain) {
        if (identityDomain.obsoletedBy != null)
            return `<provenance provenance-id="'${identityDomain.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${identityDomain.obsoletedBy}'"></provenance>`;
        else if (identityDomain.updatedBy != null)
            return `<provenance provenance-id="'${identityDomain.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${identityDomain.updatedTime}'"></provenance>`;
        else if (identityDomain.createdBy != null)
            return `<provenance provenance-id="'${identityDomain.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${identityDomain.creationTime}'"></provenance>`;
        return "";
    }

    // Render whether AA is unique
    $scope.renderIsUnique = function(identityDomain) {
        if(identityDomain.isUnique)
            return '<i class="fas fa-check"></i>';
    }
    
    $scope.delete = async function(id, index) {
        
        var data = $("#IdentityDomainTable table").DataTable().row(index).data();
        if (!data.obsoletionTime && confirm(SanteDB.locale.getString("ui.admin.domain.confirmDelete", { domain: data.name }))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash").removeClass("fa-trash").addClass("fa-circle-notch fa-spin");
            try {
                await SanteDB.resources.identityDomain.deleteAsync(id);
                $("#IdentityDomainTable").attr("newQueryId", true);
                $("#IdentityDomainTable table").DataTable().draw();
            } catch(e) { $rootScope.errorHandler(e); };

        }
        else if (data.obsoletionTime && confirm(SanteDB.locale.getString("ui.admin.domain.confirmUnDelete", { domain: data.name }))) {
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

            try {
                await  SanteDB.resources.identityDomain.patchAsync(id, null, patch);
                $("#IdentityDomainTable").attr("newQueryId", true);
                $("#IdentityDomainTable table").DataTable().draw();
            } catch(e) {
                    $("#action_grp_" + index + " a").removeClass("disabled");
                    $("#action_grp_" + index + " a i.fa-circle-notch").removeClass("fa-circle-notch fa-spin").addClass("fa-trash-restore");
                    $rootScope.errorHandler(e);
            };
        }
    }


    // Download as a place
    $scope.download = async function () {
        if (confirm(SanteDB.locale.getString("ui.action.export.confirm"))) {
            try {
                window.location = `/hdsi/IdentityDomain/_export?_exclude=assigningAuthority`;
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        
        }
    }
}]);
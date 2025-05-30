/// <reference path="../../../../core/js/santedb.js"/>
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
angular.module('santedb').controller('ConceptIndexController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

     /**
     * @summary Render updated by
     */
     $scope.renderUpdatedBy = function (concept) {
        if (concept.obsoletedBy != null)
            return `<provenance provenance-id="'${concept.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${concept.obsoletionTime}'"></provenance>`;
        else if (concept.updatedBy != null)
            return `<provenance provenance-id="'${concept.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${concept.updatedTime}'"></provenance>`;
        else if (concept.createdBy != null)
            return `<provenance provenance-id="'${concept.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${concept.creationTime}'"></provenance>`;
        return "";
    }

    $scope.delete = async function(id, index) {
        if(confirm(SanteDB.locale.getString("ui.admin.concept.concept.delete.confirm"))) {
            try {
                await SanteDB.resources.concept.deleteAsync(id);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.concept.delete.success"));
                $("#ConceptTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.concept.concept.delete.error", { e: e.message }));
            }
        }
    }

    $scope.renderName = function(concept) {
        return SanteDB.display.renderConcept(concept);
    }

    $scope.unDelete = async function(id, index) {
        if(confirm(SanteDB.locale.getString("ui.admin.concept.concept.unDelete.confirm"))) {
            try {
                // Patch the code system
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

                await SanteDB.resources.concept.patchAsync(id, null, patch);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.concept.unDelete.success"));
                $("#ConceptTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.concept.concept.unDelete.error", { e: e.message }));
            }
        }
     

    }
}]);

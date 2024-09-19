/// <reference path="../../../../core/js/santedb.js"/>
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
 */
angular.module('santedb').controller('ConceptSetIndexController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

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

    $scope.delete = async function(id, index) {
        if(confirm(SanteDB.locale.getString("ui.admin.concept.conceptSet.delete.confirm"))) {
            try {
                await SanteDB.resources.conceptSet.deleteAsync(id);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.conceptSet.delete.success"));
                $("#ConceptSetTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.concept.conceptSet.delete.error", { e: e.message }));
            }
        }
    }

    $scope.unDelete = async function(id, index) {
        if(confirm(SanteDB.locale.getString("ui.admin.concept.conceptSet.unDelete.confirm"))) {
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

                await SanteDB.resources.conceptSet.patchAsync(id, null, patch);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.conceptSet.unDelete.success"));
                $("#ConceptSetTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.concept.conceptSet.unDelete.error", { e: e.message }));
            }
        }
     

    }
}]);

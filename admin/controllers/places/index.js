/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
 * Date: 2019-9-20
 */
angular.module('santedb').controller('PlaceIndexController', ["$scope", "$rootScope", "$state", function ($scope, $rootScope, $state) {

    const isFacility = $state.current.name.indexOf("facili") > -1;
    $scope.isFacility = isFacility;

    /**
    * @summary Render updated by
    */
    $scope.renderUpdatedBy = function (place) {
        return `<provenance provenance-id="'${place.createdBy}'" provenance-time="'${place.creationTime}'"></provenance>`;
    }

    /**
     * @summary Render the type concept
     */
    $scope.renderTypeConcept = function (place) {
        if (place.typeConceptModel)
            return SanteDB.display.renderConcept(place.typeConceptModel);
    }

    /**
     * @summary Render type of place
     */
    $scope.renderTypeConcept = function (place) {
        if (place.typeConceptModel)
            return SanteDB.display.renderConcept(place.typeConceptModel);
    }

    /**
     * @summary Render class of place
     */
    $scope.renderClassConcept = function (place) {
        if (place.classConceptModel)
            return SanteDB.display.renderConcept(place.classConceptModel);
    }

    /**
     * @summary Render entity name
     */
    $scope.renderName = function (place) {
        return SanteDB.display.renderEntityName(place.name, 'OfficialRecord');
    }

    $scope.renderAddress = function (place) {
        return SanteDB.display.renderEntityAddress(place.address);
    }

    /**
     * 
     * @param {*} id The id of the place to delete / obsolete
     * @param {*} index The index of the place
     */
    $scope.delete = async function (id, index) {

        var data = $("#PlaceTable table").DataTable().row(index).data();

        if (data.statusConcept != StatusKeys.Obsolete && confirm(SanteDB.locale.getString(isFacility ? "ui.admin.facility.confirmDelete" : "ui.admin.place.confirmDelete"))) {
            try {
                $("#action_grp_" + index + " a").addClass("disabled");
                $("#action_grp_" + index + " a i.fa-trash").removeClass("fa-trash").addClass("fa-circle-notch fa-spin");
                await SanteDB.resources.place.deleteAsync(id);
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
            finally {
                $("#PlaceTable").attr("newQueryId", true);
                $("#PlaceTable table").DataTable().draw();
            }

        }
        else if (data.statusConcept == StatusKeys.Obsolete && confirm(SanteDB.locale.getString(isFacility ? "ui.admin.facility.confirmUnDelete" : "ui.admin.place.confirmUnDelete"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash-restore").removeClass("fa-trash-restore").addClass("fa-circle-notch fa-spin");
            try {
                var existing = await SanteDB.resources.place.getAsync(id);

                // Patch the user
                var patch = new Patch({
                    change: [
                        new PatchOperation({
                            op: PatchOperationType.Replace,
                            path: 'statusConcept',
                            value: StatusKeys.Active
                        })
                    ]
                });

                await SanteDB.resources.place.patchAsync(id, existing.etag, patch);

            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
            finally {
                $("#PlaceTable").attr("newQueryId", true);
                $("#PlaceTable table").DataTable().draw();
            }

        }

    }

    $scope.renderStatusConcept = function (place) {
        switch (place.statusConcept) {
            case StatusKeys.Active:
                return `<span class="badge badge-info"><i class="fas fa-check"></i> ${SanteDB.locale.getString('ui.state.active')}</span>`;
            case StatusKeys.Obsolete:
                return `<span class="badge badge-danger"><i class="fas fa-trash"></i> ${SanteDB.locale.getString('ui.state.obsolete')}</span>`;
            case StatusKeys.Nullified:
                return `<span class="badge badge-secondary"><i class="fas fa-eraser"></i> ${SanteDB.locale.getString('ui.state.nullified')}</span>`;
            case StatusKeys.New:
                return `<span class="badge badge-secondary"><i class="fas fa-asterisk"></i> ${SanteDB.locale.getString('ui.state.new')}</span>`;

        }
    }

}]);
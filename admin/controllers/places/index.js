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
angular.module('santedb').controller('PlaceIndexController', ["$scope", "$rootScope", "$state", function ($scope, $rootScope, $state) {


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

        if (data.obsoletionTime == null && confirm(SanteDB.locale.getString("ui.admin.place.confirmDelete"))) {
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
        else if (data.obsoletionTime != null && confirm(SanteDB.locale.getString("ui.admin.place.confirmUnDelete"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash-restore").removeClass("fa-trash-restore").addClass("fa-circle-notch fa-spin");
            try {
                await SanteDB.resources.place.touchAsync(id);

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

    // Download as a place
    $scope.download = async function () {
        if (confirm(SanteDB.locale.getString("ui.action.export.confirm"))) {
            try {

                window.location = `/hdsi/Place/_export?classConcept=!ff34dfa7-c6d3-4f8b-bc9f-14bcdc13ba6c&statusConcept=${StatusKeys.Active}`;
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        
        }
    }

    
    // Download as a place
    $scope.downloadFacilities = async function () {
        if (confirm(SanteDB.locale.getString("ui.action.export.confirm"))) {
            try {

                window.location = `/hdsi/Place/_export?classConcept=ff34dfa7-c6d3-4f8b-bc9f-14bcdc13ba6c&statusConcept=${StatusKeys.Active}&_include=Place:relationship[CommunityServiceDeliveryLocation].target.classConcept=ff34dfa7-c6d3-4f8b-bc9f-14bcdc13ba6c`;
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        
        }
    }

    $scope.renderStatusConcept = function (place) {
        return SanteDB.display.renderStatus(place.statusConcept);
    }

}]);
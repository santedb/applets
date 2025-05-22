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
angular.module('santedb').controller('MaterialIndexController', ["$scope", "$rootScope", function ($scope, $rootScope) {


    /**
    * @summary Render updated by
    */
    $scope.renderUpdatedBy = function (matl) {
        return `<provenance provenance-id="'${matl.createdBy}'" provenance-time="'${matl.creationTime}'"></provenance>`;
    }

    /**
     * @summary Render type of material
     */
    $scope.renderTypeConcept = function (matl) {
        if (matl.typeConceptModel)
            return SanteDB.display.renderConcept(matl.typeConceptModel);
    }

    /**
     * @summary Render class of material
     */
    $scope.renderClassConcept = function (matl) {
        return SanteDB.display.renderConcept(matl.classConceptModel);
    }

    /** 
     * @summary Renders the name
     */
    $scope.renderName = function (matl) {
        return SanteDB.display.renderEntityName(matl.name);
    }

    /**
     * @summary Render the form concept
     */
    $scope.renderFormConcept = function (matl) {
        if (matl.formConceptModel) {
            var retVal = "";
            switch (matl.formConceptModel.mnemonic) {
                case "AdministrableDrugForm-Applicatorful":
                case "AdministrableDrugForm-Drops":
                case "AdministrableDrugForm-NasalDrops":
                    retVal += "<i class='fas fa-tint'></i> ";
                    break;
                case "AdministrableDrugForm-OphthalmicDrops":
                case "AdministrableDrugForm-OralDrops":
                case "AdministrableDrugForm-OticDrops":
                    retVal += "<i class='fas fa-eye-dropper'></i> ";
                    break;

                case "AdministrableDrugForm-Puff":
                    retVal += "<i class='fas fa-info-circle'></i> ";
                    break;
                case "AdministrableDrugForm-Scoops":
                    retVal += "<i class='fas fa-utensil-spoon'></i> ";
                    break;
                case "AdministrableDrugForm-Sprays":
                    retVal += "<i class='fas fa-sptra-can'></i> ";
                    break;
                case "AdministrableDrugForm-Injection":
                    retVal += "<i class='fas fa-syringe'></i> ";
                    break;
                case "AdministrableDrugForm-Pill":
                    retVal += "<i class='fas fa-capsules'></i> ";
                    break;
            }

            retVal += SanteDB.display.renderConcept(matl.formConceptModel);
            return retVal;
        }
    };

    /**
     * @summary Render status
     */
    $scope.renderStatusConcept = function (place) {
        return SanteDB.display.renderStatus(place.statusConcept);
    }

    
    /**
     * 
     * @param {*} id The id of the place to delete / obsolete
     * @param {*} index The index of the place
     */
    $scope.delete = async function (id, index) {

        var data = $("#MaterialTable table").DataTable().row(index).data();

        if (data.obsoletionTime == null && confirm(SanteDB.locale.getString("ui.admin.material.confirmDelete"))) {
            try {
                $("#action_grp_" + index + " a").addClass("disabled");
                $("#action_grp_" + index + " a i.fa-trash").removeClass("fa-trash").addClass("fa-circle-notch fa-spin");
                await SanteDB.resources.material.deleteAsync(id);
                toastr.success(SanteDB.locale.getString("ui.admin.material.delete.success"));
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
            finally {
                $("#MaterialTable").attr("newQueryId", true);
                $("#MaterialTable table").DataTable().draw();
            }

        }
        else if (data.obsoletionTime != null && confirm(SanteDB.locale.getString("ui.admin.material.confirmUnDelete"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash-restore").removeClass("fa-trash-restore").addClass("fa-circle-notch fa-spin");
            try {
                await SanteDB.resources.material.touchAsync(id);
                toastr.success(SanteDB.locale.getString("ui.admin.material.undelete.success"));

            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
            finally {
                $("#MaterialTable").attr("newQueryId", true);
                $("#MaterialTable table").DataTable().draw();
            }

        }

    }

    // Download as a place
    $scope.download = async function () {
        if (confirm(SanteDB.locale.getString("ui.action.export.confirm"))) {
            try {

                window.location = `/hdsi/Material/_export?classConcept=${EntityClassKeys.Material}&statusConcept=${StatusKeys.Active}&_include=Organization:relationship[ManufacturedProduct].target.classConcept=fafec286-89d5-420b-9085-054aca9d1eef`;
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        
        }
    }

}]);
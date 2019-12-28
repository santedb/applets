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
        if (matl.$type == 'ManufacturedMaterial')
            return `<i class="fas fa-prescription"></i> MMAT`;
        else
            return `<i class="fas fa-file"></i> MAT`;
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
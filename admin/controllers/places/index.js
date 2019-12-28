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
angular.module('santedb').controller('PlaceIndexController', ["$scope", "$rootScope", function ($scope, $rootScope) {

     /**
     * @summary Render updated by
     */
    $scope.renderUpdatedBy = function (place) {
        return `<provenance provenance-id="'${place.createdBy}'" provenance-time="'${place.creationTime}'"></provenance>`;
    }

    /**
     * @summary Render type of place
     */
    $scope.renderTypeConcept = function(place) {
        if(place.typeConceptModel)
            return SanteDB.display.renderConcept(place.typeConceptModel);
    }

    /**
     * @summary Render class of place
     */
    $scope.renderClassConcept = function(place) {
        if(place.classConceptModel)
            return SanteDB.display.renderConcept(place.classConceptModel);
    }

    $scope.renderName = function(place) {
        return SanteDB.display.renderEntityName(place.name);
    }

    $scope.renderAddress = function(place) {
        return SanteDB.display.renderEntityAddress(place.address);
    }

    $scope.renderStatusConcept = function(place) {
        switch(place.statusConcept) {
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
/// <reference path="../../../core/js/santedb.js"/>
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
angular.module('santedb').controller('ProvenanceIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {


    // Render the information for the specified object
    $scope.renderInfo = function(prov) {
        return `<provenance provenance-id="'${prov.id}'" sessionfn="$parent.sessionFunction" provenance-time="'${prov.creationTime}'"></provenance>`;
    }

    // Render the type
    $scope.renderType = function(prov) {
        if(prov.user)
            return `<i class="fas fa-user"></i> ${SanteDB.locale.getString("ui.model.securityProvenance.type.user")}`;
        else if(prov.device)
            return `<i class="fas fa-tablet"></i> ${SanteDB.locale.getString("ui.model.securityProvenance.type.device")}`;
        else
            return `<i class="fas fa-window-maximize"></i> ${SanteDB.locale.getString("ui.model.securityProvenance.type.application")}`;
    }

    
}]);

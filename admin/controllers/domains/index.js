/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
}]);
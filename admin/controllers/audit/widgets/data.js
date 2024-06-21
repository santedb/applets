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
 * 
 * User: fyfej
 * Date: 2023-5-19
 */
angular.module('santedb').controller('AuditDataController', ["$scope", "$state", function ($scope, $state) {


    $scope.navigateObject = function (code, id) {
        var type = "IdentifiedData";
        switch (code) {
            case "PAT":
            case "Patient":
                type = "Patient";
                break;
            case "PLC":
            case "Place":
                type = "Place";
                break;
            case "MAT":
            case "Material":
            case "MMAT":
            case "ManufacturedMaterial":
                type = "Material";
                break;
            case "ORG":
            case "Organization":
                type = "Organization";
                break;
            case "PSN":
            case "Person":
                type = "Person";
                break;
            default:
                return;
        }

        SanteDB.application.callResourceViewer(type, $state, { id: id });
    }
}]);
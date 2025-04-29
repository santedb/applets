/// <reference path="../../../core/js/santedb.js"/>
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
angular.module('santedb').controller('SecurityDashboardController', ["$scope", function ($scope) {

    $scope.dashboard = {
        sessions : { 
            "from-date": new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()-15),
            "to-date": new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()+1)
        }
    };

    async function fetchStats() {
        try {
            $scope.dashboard.users = (await SanteDB.resources.securityUser.findAsync({_count:0,_includeTotal:true})).size;
            $scope.dashboard.groups = (await SanteDB.resources.securityRole.findAsync({_count:0,_includeTotal:true})).size;
            $scope.dashboard.devices = (await SanteDB.resources.securityDevice.findAsync({_count:0,_includeTotal:true})).size;
            $scope.dashboard.applications = (await SanteDB.resources.securityApplication.findAsync({_count:0,_includeTotal:true})).size;
        }
        catch(e) {
            console.error(e);
        }
    }
    fetchStats().then(() => $scope.$apply());
}]);
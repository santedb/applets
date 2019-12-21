/// <reference path="../../../core/js/santedb.js"/>
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
 * Date: 2019-11-13
 */
angular.module('santedb').controller('SecurityDashboardController', ["$scope", function ($scope) {

    $scope.dashboard = {
        sessions : { 
            "from-date" : new Date(new Date().getFullYear(), 0, 1),
            "to-date": new Date(new Date().getFullYear(), 11, 31)
        }
    };

    async function fetchStats() {
        try {
            $scope.dashboard.users = (await SanteDB.resources.securityUser.findAsync({_count:0})).size;
            $scope.dashboard.groups = (await SanteDB.resources.securityRole.findAsync({_count:0})).size;
            $scope.dashboard.devices = (await SanteDB.resources.securityDevice.findAsync({_count:0})).size;
            $scope.dashboard.applications = (await SanteDB.resources.securityApplication.findAsync({_count:0})).size;
        }
        catch(e) {
            console.error(e);
        }
    }
    fetchStats().then(() => $scope.$apply());
}]);
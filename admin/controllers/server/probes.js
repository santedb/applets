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
 * Date: 2019-10-5
 */
angular.module('santedb').controller('ProbeAdminController', ["$scope", "$rootScope", '$interval', '$timeout', function ($scope, $rootScope, $interval, $timeout) {

    $scope.source = { _upstream: 'false' };

    // Initialize the view
    async function initializeView() {
        try {
            var probeList = await SanteDB.resources.probe.findAsync({ _upstream: $scope.source._upstream });
            probeList.resource.forEach((p) => p.component.forEach((c) => c._id = c.id.replaceAll('-', '')));
            $timeout(() => {
                $scope.probeList = probeList.resource;
            });
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
    }

    function refreshView() {

        for (var p in $scope.probeList) {
            var pid = $scope.probeList[p];
            SanteDB.resources.probe.getAsync(pid, null, { _upstream: $scope.source._upstream }).then(reading => {
                if(reading.value) {
                    reading.value.forEach((v) => {
    
                        if(Number.isFinite(v.value) && v.value.toString().indexOf(".") > -1) {
                            v.value = v.value.toFixed(2);    
                        }
                        $(`#ban${v.probe.replaceAll("-","")}`).html(v.value);
    
                    });
                }
            })
            .catch();
            
        }
    };

    initializeView();

    $scope.refreshView = () => {
        $scope.probeList = null;
        initializeView();
    };

    var refreshInterval = $interval(() => refreshView(), 3000);
    refreshView();
    $scope.$on("$destroy", function () {
        if (refreshInterval) {
            $interval.cancel(refreshInterval);
        }
    });
}]);
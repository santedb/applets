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
angular.module('santedb').controller('SystemInfoController', ["$scope", "$rootScope", "$state", "$interval", function ($scope, $rootScope, $state, $interval) {


    $scope.isRemoteLoading = true;
    $scope.isLocalLoading = true;

    // Get application information
    SanteDB.application.getAppInfoAsync({ updates: false, _upstream: false })
        .then(function(d) {
            $scope.info = d;
            $scope.isLocalLoading = false;
            $scope.$apply();
        })
        .catch($rootScope.errorHandler);

    // Get application information
    SanteDB.application.getAppInfoAsync({ remote: true, _upstream: true })
    .then(function(d) {
        $scope.server = d;
        $scope.isRemoteLoading = false;
        $scope.$apply();
    })
    .catch(function(e) { 
        toastr.error(e.message, SanteDB.locale.getString("ui.error.remote.error"));
        $scope.isRemoteLoading = false;
        
    });


    $scope.enableService = async function(serviceId) {
        if(confirm(SanteDB.locale.getString("ui.admin.system.confirm.enableService"))) {
            try {
                serviceId = serviceId.substr(0, serviceId.indexOf(','));
                await SanteDB.api.app.postAsync({
                    resource: `Configuration/Service/${serviceId}`,
                    data: {},
                    contentType: 'application/json'
                });
                $scope.info = await SanteDB.application.getAppInfoAsync({ updates: false });
                alert(SanteDB.locale.getString('ui.admin.system.confirm.serviceChange'));
                try {
                    $scope.$apply();
                } catch(e) {}
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        }
    }

    $scope.disableService = async function(serviceId) {
        if(confirm(SanteDB.locale.getString("ui.admin.system.confirm.disableService"))) {
            try {
                serviceId = serviceId.substr(0, serviceId.indexOf(','));
                await SanteDB.api.app.deleteAsync({
                    resource: `Configuration/Service/${serviceId}`,
                });

                $scope.info = await SanteDB.application.getAppInfoAsync({ updates: false });
                alert(SanteDB.locale.getString('ui.admin.system.confirm.serviceChange'));
                try {
                    $scope.$apply();
                } catch(e) {}
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        }
    }
}]);
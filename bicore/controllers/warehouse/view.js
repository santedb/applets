/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../js/santedb-bi.js"/>
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
angular.module('santedb').controller('WarehouseViewController', ["$scope", "$rootScope", "$state", "$stateParams", "$timeout", function ($scope, $rootScope, $state, $stateParams, $timeout) {

    // Initialize the view
    async function initializeView(martId) {
        try {
            var dataMart = await SanteDBBi.resources.datamart.getAsync(martId);
            var warehouseReg = await SanteDBBi.resources.warehouse.getAsync(martId);

            $timeout(_ => {
                $scope.dataMart = dataMart;
                $scope.dataMart.warehouse = warehouseReg;
            });
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    if($stateParams.id) {
        initializeView($stateParams.id);
    } else {
        $state.go("santedb-admin.bi.warehouse.index");
    }

    $scope.refresh = async function() {
        try {

            SanteDB.display.buttonWait('#btnRefresh', true);
            await SanteDBBi.resources.datamart.invokeOperationAsync($scope.dataMart.id, "refresh");
            toastr.success(SanteDB.locale.getString("ui.bi.marts.refresh.success", {id: $scope.dataMart.id}));
            $state.reload();
        }  
        catch (e) {
            $rootScope.errorHandler(e);
            toastr.error(SanteDB.locale.getString("ui.bi.marts.refresh.fail", { id: $scope.dataMart.id, e: e.message }));
        }
        finally {
            SanteDB.display.buttonWait('#btnRefresh', false);
        }
    }

    $scope.unRegister = async function() {
        if (confirm(SanteDB.locale.getString('ui.bi.marts.unregister.confirm', { id: $scope.dataMart.id }))) {
            try {

                SanteDB.display.buttonWait('#btnUnregister', true);
                await SanteDBBi.resources.datamart.invokeOperationAsync($scope.dataMart.id, "unregister");
                toastr.success(SanteDB.locale.getString("ui.bi.marts.unregister.success", {id: $scope.dataMart.id}));
                $state.go("santedb-admin.bi.warehouse.index");
            }  
            catch (e) {
                $rootScope.errorHandler(e);
                toastr.error(SanteDB.locale.getString("ui.bi.marts.unregister.fail", { id: $scope.dataMart.id, e: e.message }));
            }
            finally {
                SanteDB.display.buttonWait('#btnUnregister', false);
            }
        }
    }
}]);

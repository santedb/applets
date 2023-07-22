/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../js/santedb-bi.js"/>

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

}]);

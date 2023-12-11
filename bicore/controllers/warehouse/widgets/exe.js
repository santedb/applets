/// <reference path="../../../../core/js/santedb.js"/>
/// <reference path="../../../js/santedb-bi.js"/>

angular.module('santedb').controller('DataMartExecutionController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {


    
    $scope.openDetail = async function(execution, i) {

        try {
            SanteDB.display.buttonWait(`#btnViewExec${i}`, true);
            var execution = await SanteDBBi.resources.warehouse.invokeOperationAsync($scope.scopedObject.id, "gather", { "execution" : execution });
            execution.startedByModel = await SanteDB.resources.securityUser.getAsync(execution.startedBy);
            $timeout(() => {
                $scope.executionDetail = execution;
                $("#viewExecutionModal").modal("show");
            })
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait(`#btnViewExec${i}`, false);
        }
    }

}]);

angular.module("santedb").controller("SanteDBOverrideOneTimeController", [ "$scope", "$timeout", "$rootScope", "$state", function($scope, $timeout, $rootScope, $state) {


    $scope.consentOverride = function(objectType, objectId) {
        
        async function loadActFn() {
            try {
                
                const act = await SanteDB.resources[objectType.toCamelCase()].getAsync(objectId, "full", null, null, null, {
                "X-SanteDB-EmitPrivacyError" : "Redact,Nullify,Hash,Hide"
                });
                $timeout(() => {
                    $scope.overrideAct = act;
                    $state.reload();
                } );
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
            finally {
                $timeout(() => $scope.isLoading = false);
            }
        }

        $scope.isLoading = true;
        SanteDB.authentication.setElevator(new SanteDBElevator(loadActFn, true));
        loadActFn();
    }
}]);
angular.module('santedb').controller('NavController', ["$scope", "$state", "$stateParams", "$timeout", function ($scope, $state, $stateParams, $timeout) {
    
    if($stateParams.type && $stateParams.id)
    {
        $scope.target = $stateParams.type;
        
        $timeout(() => SanteDB.application.callResourceViewer($stateParams.type, $state, { id: $stateParams.id }), 500);
    }
    else {
        window.location = "#!/";
    }
}]);

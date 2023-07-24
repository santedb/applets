/// <reference path="../../../../core/js/santedb.js"/>
angular.module('santedb').controller('EditCodeSystemController', ["$scope", "$rootScope", "$stateParams", "$timeout", function ($scope, $rootScope, $stateParams, $timeout) {


    // Initialize the view
    async function initializeView(id) {

    }

    if($stateParams.id) {
        initializeView($stateParams.id);
    }
    else {
        $scope.codeSystem = new CodeSystem();
    }
}]);

angular.module('santedb').controller('MadxDashboardController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

    async function initializeView() {

    }

    initializeView().then(() => $scope.$apply());
}]);
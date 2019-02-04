angular.module('santedb').controller('ApplicationIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {

    $scope.delete = function(id) { alert(id); }
}]);

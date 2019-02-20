angular.module('santedb').controller('ApplicationIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {

    $scope.delete = function(id) { alert(id); }
    
    $scope.renderCreatedBy = function(application) {
        if(application.createdBy != null)
            return `<span ng-bind-html="'${application.createdBy}' | provenance"></span>`;
        return "";
    }
}]);

/// <reference path="../../core/js/santedb.js"/>

angular.module('santedb').controller('AdminLayoutController', ["$scope", "$rootScope", "$state", function ($scope, $rootScope, $state) {


    // Load menus for the current user
    function loadMenus() {
        SanteDB.application.getMenusAsync("org.santedb.admin")
            .then(function (res) {
                $scope.menuItems = res;
                $scope.$applyAsync();
            })
            .catch($rootScope.errorHandler);
    }

    $rootScope.$watch('session', function (nv, ov) {
        if (nv && nv.user) {
            // Add menu items
            loadMenus();
        }
        else
            $scope.menuItems = null;
    });
    if($rootScope.session)
        loadMenus();

}]);
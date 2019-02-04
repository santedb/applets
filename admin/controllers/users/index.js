angular.module('santedb').controller('UserIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {

    /**
     * @summary Delete the specified user
     */
    $scope.delete = function(id) { alert(id); }

    /**
     * @summary Render the lockout status
     */
    $scope.renderLockout = function(user) {
        return user.lockout > new Date() ? `<i class="fa fa-lock"></i> ${moment(d).format(SanteDB.locale.dateFormats.second)}` : '<i class="fa fa-lock-open"></i>';
    }
}]);

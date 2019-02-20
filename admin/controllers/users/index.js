angular.module('santedb').controller('UserIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {

    /**
     * @summary Delete the specified user
     */
    $scope.delete = function(id) { alert(id); }

    /**
     * @summary Render the lockout status
     */
    $scope.renderLockout = function(user) {
        return user.lockout > new Date() ? `<i class="fa fa-lock"></i> ${moment(user.lockout).format(SanteDB.locale.dateFormats.second)}` : '<i class="fa fa-lock-open"></i>';
    }

    /**
     * @summary Render updated by
     */
    $scope.renderUpdatedBy = function(user) {
        if(user.updatedBy != null)
            return `<span ng-bind-html="'${user.updatedBy}' | provenance: '${user.updatedTime}':'#!/security/session/'"></span>`;
    return "";
    }

    /**
     * @summary Render the created by column
     */
    $scope.renderCreatedBy = function(user) {
        if(user.createdBy != null)
            return `<span ng-bind-html="'${user.createdBy}' | provenance: '${user.creationTime}':'#!/security/session/'"></span>`;
        return "";
    }
}]);

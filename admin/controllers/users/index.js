angular.module('santedb').controller('UserIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {

    /**
     * @summary Delete the specified user
     */
    $scope.delete = function (id, index) {
        if (id === SanteDB.authentication.SYSTEM_USER || id === SanteDB.authentication.ANONYMOUS_USER)
            alert(SanteDB.locale.getString("ui.admin.users.systemUser"));
        else if (confirm(SanteDB.locale.getString("ui.admin.users.confirmDelete"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash").removeClass("fa-trash").addClass("fa-circle-notch fa-spin");
            SanteDB.resources.securityUser.deleteAsync(id)
                .then(function (e) {
                    $("#SecurityUserTable table").DataTable().draw();
                })
                .catch($rootScope.errorHandler);
        }
    }

    /**
     * @summary Lock the specified user
     */
    $scope.lock = function (id, index) {
        if (id === SanteDB.authentication.SYSTEM_USER || id === SanteDB.authentication.ANONYMOUS_USER)
            alert(SanteDB.locale.getString("ui.admin.users.systemUser"));
        else {
            var data = $("#SecurityUserTable table").DataTable().row(index).data();
            if (confirm(SanteDB.locale.getString(data.lockout ? "ui.admin.users.confirmUnlock" : "ui.admin.users.confirmLock"))) {
                $("#action_grp_" + index + " a").addClass("disabled");
                $("#action_grp_" + index + " a i.fa-lock").removeClass("fa-lock").addClass("fa-circle-notch fa-spin");
                if (data.lockout) {
                    SanteDB.resources.securityUser.unLockAsync(id)
                        .then(function (e) {
                            $("#SecurityUserTable table").DataTable().draw();
                        })
                        .catch($rootScope.errorHandler);
                }
                else {
                    SanteDB.resources.securityUser.lockAsync(id)
                        .then(function (e) {
                            $("#SecurityUserTable table").DataTable().draw();
                        })
                        .catch($rootScope.errorHandler);
                }
            }
        }
    }

    /**
     * @summary Reset password for the specified user
     */
    $scope.resetPassword = function (id, index) {
        if (id === SanteDB.authentication.SYSTEM_USER || id === SanteDB.authentication.ANONYMOUS_USER)
            alert(SanteDB.locale.getString("ui.admin.users.systemUser"));
        else {
            // Show wait
            $("#action_grp_" + index + " a").addClass("disabled");
            $(".btn-grp a i.fa-asterisk").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-asterisk").removeClass("fa-asterisk").addClass("fa-circle-notch fa-spin");
            SanteDB.resources.securityUser.getAsync(id)
                .then(function (userData) {

                    $scope.password = userData;
                    $scope.password.passwordOnly = true;

                    $scope.$apply();
                    $("#passwordModal").modal({ backdrop: 'static' });

                    // User has pressed save or cancelled
                    $("#passwordModal").on('hidden.bs.modal', function () {
                        $scope.password = null;
                        $("#SecurityUserTable table").DataTable().draw();
                    });

                })
                .catch($rootScope.errorHandler);
        }

    }

    /**
     * @summary Render the lockout status
     */
    $scope.renderLockout = function (user) {
        return user.obsoletionTime ? `<i title="${SanteDB.locale.getString("ui.state.obsolete")}" class="fa fa-trash"></i>` :
            user.lockout > new Date() ? `<i title="${SanteDB.locale.getString("ui.state.locked")}" class="fa fa-lock"></i> ${moment(user.lockout).format(SanteDB.locale.dateFormats.second)}` : 
            `<i title="${SanteDB.locale.getString("ui.state.active")}" class="fa fa-check"></i>`;
    }

    /**
     * @summary Render updated by
     */
    $scope.renderUpdatedBy = function (user) {
        if (user.updatedBy != null)
            return `<span ng-bind-html="'${user.updatedBy}' | provenance: '${user.updatedTime}':'#!/security/session/'"></span>`;
        else if (user.createdBy != null)
            return `<span ng-bind-html="'${user.createdBy}' | provenance: '${user.creationTime}':'#!/security/session/'"></span>`;
        return "";
    }
}]);

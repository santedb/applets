angular.module('santedb').controller('DeviceIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {

    /**
     * @summary Delete the specified user
     */
    $scope.delete = function (id, index) {
        if (confirm(SanteDB.locale.getString("ui.admin.devices.confirmDelete"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-trash").removeClass("fa-trash").addClass("fa-circle-notch fa-spin");
            SanteDB.resources.securityDevice.deleteAsync(id)
                .then(function (e) {
                    $("#SecurityDeviceTable table").DataTable().draw();
                })
                .catch($rootScope.errorHandler);
        }
    }

    /**
     * @summary Lock the specified device
     */
    $scope.lock = function (id, index) {
        var data = $("#SecurityDeviceTable table").DataTable().row(index).data();
        if (confirm(SanteDB.locale.getString(data.lockout ? "ui.admin.devices.confirmUnlock" : "ui.admin.devices.confirmLock"))) {
            $("#action_grp_" + index + " a").addClass("disabled");
            $("#action_grp_" + index + " a i.fa-lock").removeClass("fa-lock").addClass("fa-circle-notch fa-spin");
            if (data.lockout) {
                SanteDB.resources.securityDevice.unLockAsync(id)
                    .then(function (e) {
                        $("#SecurityDeviceTable table").DataTable().draw();
                    })
                    .catch($rootScope.errorHandler);
            }
            else {
                SanteDB.resources.securityDevice.lockAsync(id)
                    .then(function (e) {
                        $("#SecurityDeviceTable table").DataTable().draw();
                    })
                    .catch($rootScope.errorHandler);
            }
        }
    }

    /**
     * @summary Render the lockout status
     */
    $scope.renderLockout = function (device) {
        return device.obsoletionTime ? `<i title="${SanteDB.locale.getString("ui.state.obsolete")}" class="fa fa-trash"></i>  <span class="badge badge-pill badge-danger"> ${SanteDB.locale.getString("ui.state.obsolete")}</span>` :
            device.lockout > new Date() ? `<i title="${SanteDB.locale.getString("ui.state.locked")}" class="fa fa-lock"></i>  <span class="badge badge-pill badge-warning"> ${SanteDB.locale.getString("ui.state.locked")} (${moment(device.lockout).format(SanteDB.locale.dateFormats.second)})</span>` :
                `<i title="${SanteDB.locale.getString("ui.state.active")}" class="fa fa-check"></i> <span class="badge badge-pill badge-success"> ${SanteDB.locale.getString("ui.state.active")}</span>`;
    }

    /**
     * @summary Render updated by
     */
    $scope.renderUpdatedBy = function (device) {
        if(device.obsoletedBy != null)
            return `<provenance provenance-id="'${device.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.obsoletedBy}'"></provenance>`;
        else if (device.updatedBy != null)
            return `<provenance provenance-id="'${device.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.updatedTime}'"></provenance>`;
        else if (device.createdBy != null)
            return `<provenance provenance-id="'${device.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.creationTime}'"></provenance>`;
        return "";
    }
}]);

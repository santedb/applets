/// <reference path="../../../../core/js/santedb.js"/>
angular.module('santedb').controller('CodeSystemIndexController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

     /**
     * @summary Render updated by
     */
     $scope.renderUpdatedBy = function (device) {
        if (device.obsoletedBy != null)
            return `<provenance provenance-id="'${device.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.obsoletedTime}'"></provenance>`;
        else if (device.updatedBy != null)
            return `<provenance provenance-id="'${device.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.updatedTime}'"></provenance>`;
        else if (device.createdBy != null)
            return `<provenance provenance-id="'${device.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.creationTime}'"></provenance>`;
        return "";
    }

    $scope.delete = async function(id, index) {
        if(confirm(SanteDB.locale.getString("ui.admin.concept.codeSystem.delete.confirm"))) {
            try {
                await SanteDB.resources.codeSystem.deleteAsync(id);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.codeSystem.delete.success"));
                $("#CodeSystemTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.concept.codeSystem.delete.error", { e: e.message }));
            }
        }
    }

    $scope.unDelete = async function(id, index) {
        if(confirm(SanteDB.locale.getString("ui.admin.concept.codeSystem.unDelete.confirm"))) {
            try {
                // Patch the code system
                var patch = new Patch({
                    change: [
                        new PatchOperation({
                            op: PatchOperationType.Remove,
                            path: 'obsoletionTime',
                            value: null
                        }),
                        new PatchOperation({
                            op: PatchOperationType.Remove,
                            path: 'obsoletedBy',
                            value: null
                        })
                    ]
                });

                await SanteDB.resources.codeSystem.patchAsync(id, null, patch);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.codeSystem.unDelete.success"));
                $("#CodeSystemTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.concept.codeSystem.unDelete.error", { e: e.message }));
            }
        }
     

    }
}]);

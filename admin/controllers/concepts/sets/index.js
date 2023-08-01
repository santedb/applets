/// <reference path="../../../../core/js/santedb.js"/>
angular.module('santedb').controller('ConceptSetIndexController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

     /**
     * @summary Render updated by
     */
     $scope.renderUpdatedBy = function (device) {
        if (device.obsoletedBy != null)
            return `<provenance provenance-id="'${device.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.obsoletionTime}'"></provenance>`;
        else if (device.updatedBy != null)
            return `<provenance provenance-id="'${device.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.updatedTime}'"></provenance>`;
        else if (device.createdBy != null)
            return `<provenance provenance-id="'${device.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${device.creationTime}'"></provenance>`;
        return "";
    }

    $scope.delete = async function(id, index) {
        if(confirm(SanteDB.locale.getString("ui.admin.concept.conceptSet.delete.confirm"))) {
            try {
                await SanteDB.resources.conceptSet.deleteAsync(id);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.conceptSet.delete.success"));
                $("#ConceptSetTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.concept.conceptSet.delete.error", { e: e.message }));
            }
        }
    }

    $scope.unDelete = async function(id, index) {
        if(confirm(SanteDB.locale.getString("ui.admin.concept.conceptSet.unDelete.confirm"))) {
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

                await SanteDB.resources.conceptSet.patchAsync(id, null, patch);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.conceptSet.unDelete.success"));
                $("#ConceptSetTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.concept.conceptSet.unDelete.error", { e: e.message }));
            }
        }
     

    }
}]);

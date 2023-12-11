/// <reference path="../../../../core/js/santedb.js"/>
angular.module('santedb').controller('ConceptIndexController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

     /**
     * @summary Render updated by
     */
     $scope.renderUpdatedBy = function (concept) {
        if (concept.obsoletedBy != null)
            return `<provenance provenance-id="'${concept.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${concept.obsoletionTime}'"></provenance>`;
        else if (concept.updatedBy != null)
            return `<provenance provenance-id="'${concept.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${concept.updatedTime}'"></provenance>`;
        else if (concept.createdBy != null)
            return `<provenance provenance-id="'${concept.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${concept.creationTime}'"></provenance>`;
        return "";
    }

    $scope.delete = async function(id, index) {
        if(confirm(SanteDB.locale.getString("ui.admin.concept.concept.delete.confirm"))) {
            try {
                await SanteDB.resources.concept.deleteAsync(id);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.concept.delete.success"));
                $("#ConceptTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.concept.concept.delete.error", { e: e.message }));
            }
        }
    }

    $scope.renderName = function(concept) {
        return SanteDB.display.renderConcept(concept);
    }

    $scope.unDelete = async function(id, index) {
        if(confirm(SanteDB.locale.getString("ui.admin.concept.concept.unDelete.confirm"))) {
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

                await SanteDB.resources.concept.patchAsync(id, null, patch);
                toastr.success(SanteDB.locale.getString("ui.admin.concept.concept.unDelete.success"));
                $("#ConceptTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.concept.concept.unDelete.error", { e: e.message }));
            }
        }
     

    }
}]);

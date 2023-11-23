/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('CdssDashboardController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {

    /**
     * @summary Render updated by
     */
    $scope.renderModifiedOn = function (library) {
        if (library.obsoletedBy != null)
            return `<provenance provenance-id="'${library.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${library.obsoletedBy}'"></provenance>`;
        else if (library.updatedBy != null)
            return `<provenance provenance-id="'${library.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${library.updatedTime}'"></provenance>`;
        else if (library.createdBy != null)
            return `<provenance provenance-id="'${library.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${library.creationTime}'"></provenance>`;
        return "";
    }

    $scope.renderName = function(result) {
        return `<span title="${result.library.meta.documentation}">${result.library.name} <small class="d-block text-muted">${result.library.oid || ''}</small></span>`;
    }

    $scope.renderVersion = (result) => result.library.meta.version;

    $scope.deleteCdssLibraryDefinition = async function(id) {
        if(confirm(SanteDB.locale.getString("ui.admin.cdssLibrary.delete.confirm"))) {
            try {
                await SanteDB.resources.cdssLibraryDefinition.deleteAsync(id, true);
                toastr.success(SanteDB.locale.getString("ui.admin.cdssLibrary.delete.success"));
                $("#CdssLibraryDefinitionTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.cdssLibrary.delete.error", { e: e.message }));
            }
        }
    }
}]);

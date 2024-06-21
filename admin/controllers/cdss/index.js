/// <reference path="../../.ref/js/santedb.js"/>
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

    $scope.renderName = function (result) {
        return `<span title="${result.library.meta.documentation}">${result.library.name} <small class="d-block text-muted mr-2">${result.library.id || ''}</small> <small class="d-block text-muted">${result.library.oid || ''}</small></span>`;
    }

    $scope.renderStatus = function (result) {
        switch (result.library.status) {
            case "Active":
                return "<span class='badge badge-success'>active</span>";
            case "TrialUse":
                return "<span class='badge badge-primary'>trial-use</span>";
            case "DontUse":
                return "<span class='badge badge-danger'>dont-use</span>";
            case "Retired":
                return "<span class='badge badge-warning'>retired</span>";
            case "Unknown":
                return "<span class='badge badge-secondary'>unknown</span>";

        }
    }

    $scope.renderVersion = (result) => result.library.meta.version;

    $scope.deleteCdssLibraryDefinition = async function (id) {
        if (confirm(SanteDB.locale.getString("ui.admin.cdssLibrary.delete.confirm"))) {
            try {
                await SanteDB.resources.cdssLibraryDefinition.deleteAsync(id, true);
                toastr.success(SanteDB.locale.getString("ui.admin.cdssLibrary.delete.success"));
                $("#CdssLibraryDefinitionTable table").DataTable().draw();
            }
            catch (e) {
                toastr.error(SanteDB.locale.getString("ui.admin.cdssLibrary.delete.error", { e: e.message }));
            }
        }
    }

    $scope.downloadCdssLibraryDefinition = function (id) {
        var win = window.open(`/ami/CdssLibraryDefinition/${id}?_format=xml&_upstream=true`, '_blank');
        win.onload = function (e) {
            win.close();
        };
    }
}]);

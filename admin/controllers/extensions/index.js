/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
angular.module('santedb').controller('ExtensionTypeIndexController', ["$scope", "$rootScope", "$timeout", function($scope, $rootScope, $timeout) {

    var _handlers = [];

    async function initializeView() {
        try {
            var hdlrType = await SanteDB.resources.extensionType.invokeOperationAsync(null, "handlers");
            _handlers = hdlrType.parameter;
        }
        catch(e) {
            console.warn(e);
        }
    }
    initializeView();

    $scope.renderModifiedOn = function(r){
        if (r.obsoletedBy != null)
            return `<provenance provenance-id="'${r.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.obsoletionTime}'"></provenance>`;
        else if (r.updatedBy != null)
            return `<provenance provenance-id="'${r.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.updatedTime}'"></provenance>`;
        else if (r.createdBy != null)
            return `<provenance provenance-id="'${r.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.creationTime}'"></provenance>`;
        return "";
    }

    $scope.renderScope = function(r) {
        if(r.scopeModel) {
            return Object.keys(r.scopeModel).join(",");
        }
        return "*";
    }

    $scope.renderHandler = function(r) {
        var hdlr = _handlers.find(o=>o.value == r.handlerClass);
        return hdlr ? hdlr.name : SanteDB.locale.getString("ui.unknown");
    }

    
    $scope.deleteExtensionType = async function(id) {
        if(confirm(SanteDB.locale.getString("ui.admin.cdr.extensionType.delete.confirm"))) {
            try {
                await SanteDB.resources.extensionType.deleteAsync(id);
                $("#ExtensionTypeTable").attr("newQueryId", true);
                $("#ExtensionTypeTable table").DataTable().draw();
                taostr.success(SanteDB.locale.getString("ui.admin.cdr.extensionType.delete.success"));
            }
            catch(e) {
                taostr.error(SanteDB.locale.getString("ui.admin.cdr.extensionType.delete.error", {error: e.message}));
            }
        }
    }

    $scope.restoreExtensionType = async function(id) {
        if(confirm(SanteDB.locale.getString("ui.admin.cdr.extensionType.restore.confirm"))) {
            try {
                var patch = new Patch({
                    appliesTo: new PatchTarget({
                        type: "EntityExtension",
                        id: id
                    }),
                    change: [
                        new PatchOperation({
                            op: PatchOperationType.Remove,
                            path: "obsoletionTime",
                            value: null
                        }),
                        new PatchOperation({
                            op: PatchOperationType.Remove,
                            path: "obsoletedBy",
                            value: null
                        })
                    ]
                });
                await SanteDB.resources.extensionType.patchAsync(id, null, patch, true);
                $("#ExtensionTypeTable").attr("newQueryId", true);
                $("#ExtensionTypeTable table").DataTable().draw();
                toastr.success(SanteDB.locale.getString("ui.admin.cdr.extensionType.restore.success"));
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.cdr.extensionType.restore.error", {error: e.message}));
            }
        }
    }
    // Download as a list of extension types
    $scope.download = async function () {
        if (confirm(SanteDB.locale.getString("ui.action.export.confirm"))) {
            try {
                window.location = `/hdsi/ExtensionType/_export`;
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        
        }
    }
}]);
angular.module('santedb').controller('NotificationInstanceIndexController', ["$scope", "$rootScope", "$state", "$templateCache", function ($scope, $rootScope, $state, $templateCache) {
    async function initializeView() {
        
        $scope.renderCreationTime = function(r) {
            if (r.createdBy != null && r.creationTime != null)
                return `<provenance provenance-id="'${r.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.creationTime}'"></provenance>`;
            return "";
        }

        $scope.renderObsoletionTime = function(r) {
            if (r.obsoletedBy != null && r.obsoletionTime != null)
                return `<provenance provenance-id="'${r.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.obsoletionTime}'"></provenance>`;
            return "";
        }

        $scope.renderUpdatedTime = function(r) {
            if (r.obsoletedBy != null)
                return `<provenance provenance-id="'${r.obsoletedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.obsoletionTime}'"></provenance>`;
            else if (r.updatedBy != null)
                return `<provenance provenance-id="'${r.updatedBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.updatedTime}'"></provenance>`;
            else if (r.createdBy != null)
                return `<provenance provenance-id="'${r.createdBy}'" sessionfn="$parent.sessionFunction" provenance-time="'${r.creationTime}'"></provenance>`;
            return "";
        }

        $scope.clone = async function(id, t) {
            const instance = await SanteDB.resources.notificationInstance.getAsync(id, 'full', null, true);
    
            delete (instance.id);
            instance.name += '-clone';
            instance.mnemonic += '-clone';

            if ('instanceParameter' in instance) {
                for (i = 0; i < instance.instanceParameter.length; i++) {
                    delete (instance.instanceParameter[i].id);
                    delete (instance.instanceParameter[i].notificationInstance);
                }
            }
    
            try {
                await SanteDB.resources.notificationInstance.insertAsync(instance, true);
                toastr.success(SanteDB.locale.getString("ui.admin.notifications.instance.clone.success"));
                $("#NotificationInstanceTable table").DataTable().ajax.reload();
            } catch (e) {
                toastr.error(SanteDB.locale.getString("ui.admin.notifications.instance.clone.error", { e: e.message }));
            }
        }

        $scope.delete = async function(id, index) {
            if(confirm(SanteDB.locale.getString("ui.admin.notifications.instances.delete.confirm"))) {
                try {
                    await SanteDB.resources.notificationInstance.deleteAsync(id, true);
                    toastr.success(SanteDB.locale.getString("ui.admin.notifications.instances.delete.success"));
                    $("#NotificationInstanceTable table").DataTable().ajax.reload();
                }
                catch(e) {
                    toastr.error(SanteDB.locale.getString("ui.admin.notifications.instances.delete.error", { e: e.message }));
                }
            }
        }

    }

    initializeView();
}]);
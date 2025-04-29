angular.module('santedb').controller('NotificationTemplateTableController', ["$scope", "$timeout", function ($scope, $timeout) {

    $scope.delete = async function(id, index) {
        if(confirm(SanteDB.locale.getString("ui.admin.notifications.template.delete.confirm"))) {
            try {
                await SanteDB.resources.notificationTemplate.deleteAsync(id, true);
                toastr.success(SanteDB.locale.getString("ui.admin.notifications.template.delete.success"));
                $("#NotificationTemplateTable table").DataTable().ajax.reload();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.notifications.template.delete.error", { e: e.message }));
            }
        }
    }

    $scope.clone = async function(id, t) {
        let template = await SanteDB.resources.notificationTemplate.getAsync(id, 'full', null, true);

        delete (template.id);
        template.name += '-clone';
        template.mnemonic += '-clone';
        
        for (i = 0; i < template.contents.length; i++) {
            delete (template.contents[i].id);
            delete (template.contents[i].template);
        }

        for (i = 0; i < template.parameters.length; i++) {
            delete (template.parameters[i].id);
            delete (template.parameters[i].template);
        }

        try {
            await SanteDB.resources.notificationTemplate.insertAsync(template, true);
            toastr.success(SanteDB.locale.getString("ui.admin.notifications.template.clone.success"));
            $("#NotificationTemplateTable table").DataTable().ajax.reload();
        } catch (e) {
            toastr.error(SanteDB.locale.getString("ui.admin.notifications.template.clone.error", { e: e.message }));
        }
    }

    async function initializeView() { }

    initializeView();
}]);
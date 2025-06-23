angular.module('santedb').controller('NotificationTemplateTableController', ["$scope", "$timeout", "$state", function ($scope, $timeout, $state) {

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

    $scope.renderStatus = function(r) {
        if (r.statusModel) {
            return SanteDB.display.renderConcept(r.statusModel);
        }
        return r.status || "";
    }

    $scope.delete = async function(id, index) {
        if (confirm(SanteDB.locale.getString("ui.admin.notifications.template.delete.confirm"))) {
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

    $scope.restore = async function(id, index) {
        if (confirm(SanteDB.locale.getString("ui.admin.notifications.template.restore.confirm"))) {
            try {
                const template = await SanteDB.resources.notificationTemplate.getAsync(id, null, null, true);

                template.obsoletionTime = null;
                template.obsoletedBy = null;

                await SanteDB.resources.notificationTemplate.updateAsync(id, template, true);

                toastr.success(SanteDB.locale.getString("ui.admin.notifications.template.restore.success"));
                
                $("#NotificationInstanceTable table").attr("newQueryId", true);
                $("#NotificationInstanceTable table").DataTable().ajax.reload();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.notifications.template.restore.error", { e: e.message }));
            }
        }
    }

    $scope.clone = async function(id, t) {
        const template = await SanteDB.resources.notificationTemplate.getAsync(id, 'full', null, true);

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
            const clonedTemplate = await SanteDB.resources.notificationTemplate.insertAsync(template, true);
            toastr.success(SanteDB.locale.getString("ui.admin.notifications.template.clone.success"));
            $state.transitionTo("santedb-admin.notifications.templates.edit", { id: clonedTemplate.id });
        } catch (e) {
            toastr.error(SanteDB.locale.getString("ui.admin.notifications.template.clone.error", { e: e.message }));
        }
    }

    $scope.purge = async function(id) {
        if (confirm(SanteDB.locale.getString("ui.admin.notifications.template.purge.confirm"))) {
            try {
                await SanteDB.resources.notificationTemplate.deleteAsync(id, true);

                $("#NotificationTemplateTable").attr("newQueryId", true);
                $("#NotificationTemplateTable table").DataTable().ajax.reload();
                
                toastr.success(SanteDB.locale.getString("ui.admin.notifications.template.purge.success"));
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.notifications.template.purge.error", { e: e.message }));
            }

        }
    }

    $scope.loadStatus = async function(r) {
        if (r.status)
            r.statusModel = await SanteDB.resources.concept.getAsync(r.status);
        return r;
    }

    async function initializeView() { }

    initializeView();
}]);
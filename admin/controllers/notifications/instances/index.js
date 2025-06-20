angular.module('santedb').controller('NotificationInstanceIndexController', ["$scope", "$rootScope", "$state", "$templateCache", "$timeout", function ($scope, $rootScope, $state, $templateCache, $timeout) {

    const NotificationSendingJob_GUID = "A5C97883-A21E-4C33-B428-E69002B7A453";
    
    async function initializeView() {
        $scope.totalSentCount;
        $scope.succeededSentCount;

        try {
            const jobInfo = await SanteDB.resources.jobInfo.getAsync(NotificationSendingJob_GUID, "full", true);
            $timeout(() => {
                if (jobInfo && jobInfo.schedule.length) {
                    let schedule = jobInfo.schedule;
                    $scope.jobSchedule = "<ul class='p-0 m-0 list-unstyled'>" + schedule.map(o => {
                        if (o.type == "Scheduled") {
                            return `<li><i class='fas fa-calendar'></i> ${o.repeat.map(d => d.substring(0, 2)).join(",")} <br/>@ ${moment(o.start).format("HH:mm")}<br/>starting ${moment(o.start).format("YYYY-MM-DD")}</li>`;
                        }
                        else {
                            return `<li><i class='fas fa-clock'></i> repeat ${moment.duration(o.interval).humanize(true)}</li>`;
                        }
                    }) + "</ul>";
                }
            });
        }
        catch(e) {
            toastr.error(SanteDB.locale.getString("ui.admin.notifications.instance.schedule.error", { error: e.message }));
        }
    }

    initializeView();

    $scope.renderState = function(r) {
        if (r.stateModel)
            return SanteDB.display.renderConcept(r.stateModel);
        return r.state || "";
    }

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

    $scope.renderLastSentAt = function(r) {
        if (r.lastSentAt != null)
            return SanteDB.display.renderDate(r.lastSentAt);
        return "";
    }

    $scope.renderSchedule = function() {
        return $scope.jobSchedule ? $scope.jobSchedule : "";
    }

    $scope.enable = async function(id) {
        if (confirm(SanteDB.locale.getString("ui.admin.notifications.instance.enable.confirm", {id: id}))) {
            try {
                await SanteDB.resources.notificationInstance.invokeOperationAsync(id, "configure", { "isEnableState": true }, true);
                $("#NotificationInstanceTable table").DataTable().ajax.reload();
                toastr.success(SanteDB.locale.getString("ui.admin.notifications.instance.enable.success", { id: id }));
            }
            catch (e) {
                toastr.error(SanteDB.locale.getString("ui.admin.notifications.instance.enable.error", { id: id, e: e.message }));
            }
        }
    }

    $scope.disable = async function(id) {
        if (confirm(SanteDB.locale.getString("ui.admin.notifications.instance.disable.confirm", {id: id}))) {
            try {
                await SanteDB.resources.notificationInstance.invokeOperationAsync(id, "configure", { "isEnableState": false }, true);
                $("#NotificationInstanceTable table").DataTable().ajax.reload();
                toastr.success(SanteDB.locale.getString("ui.admin.notifications.instance.disable.success", { id: id }));
            }
            catch (e) {
                toastr.error(SanteDB.locale.getString("ui.admin.notifications.instance.disable.error", { id: id, e: e.message }));
            }
        }
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
            const clonedInstance = await SanteDB.resources.notificationInstance.insertAsync(instance, true);
            toastr.success(SanteDB.locale.getString("ui.admin.notifications.instance.clone.success"));
            $state.transitionTo("santedb-admin.notifications.instances.edit", { id: clonedInstance.id });
        } catch (e) {
            toastr.error(SanteDB.locale.getString("ui.admin.notifications.instance.clone.error", { e: e.message }));
        }
    }

    $scope.delete = async function(id, index) {
        if (confirm(SanteDB.locale.getString("ui.admin.notifications.instances.delete.confirm"))) {
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

    $scope.restore = async function(id) {
        if (confirm(SanteDB.locale.getString("ui.admin.notifications.instance.restore.confirm"))) {
            try {
                var instance = await SanteDB.resources.notificationInstance.getAsync(id, null, null, true);
                instance.obsoletionTime = null;
                instance.obsoletedBy = null;
                await SanteDB.resources.notificationInstance.updateAsync(id, instance, true);
                $("#NotificationInstanceTable").attr("newQueryId", true);
                $("#NotificationInstanceTable table").DataTable().ajax.reload();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.notifications.instance.restore.error", { error: e.message }));
            }
        }
    }

    $scope.purge = async function(id) {
        if (confirm(SanteDB.locale.getString("ui.admin.notifications.instance.purge.confirm"))) {
            try {
                await SanteDB.resources.notificationInstance.deleteAsync(id, true);
                $("#NotificationInstanceTable").attr("newQueryId", true);
                $("#NotificationInstanceTable table").DataTable().ajax.reload();
                toastr.success(SanteDB.locale.getString("ui.admin.notifications.instance.purge.success"));
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.notifications.instance.purge.error", { error: e.message }));
            }

        }
    }

    $scope.loadState = async function(r) {
        if (r.state)
            r.stateModel = await SanteDB.resources.concept.getAsync(r.state);
        return r;
    }

    $scope.handleLastRunModal = async function(r) {
        try {
            const lastRunData = await SanteDB.resources.jobInfo.getAsync(NotificationSendingJob_GUID, "full", true);
            $timeout(() => {
                $scope.lastRunState = lastRunData.state;
                $scope.lastRunStatus = lastRunData.status;
                $("#lastRunModal").modal("show");
            });
        }
        catch(e) {
            toastr.error(SanteDB.locale.getString("ui.admin.notifications.instance.modal.error", { error: e.message }));
        }  
    }
}]);
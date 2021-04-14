angular.module('santedb').controller('EditGroupPropertiesController', ["$scope", "$rootScope", "$state", "$templateCache", "$stateParams", "$compile", '$timeout', function ($scope, $rootScope, $state, $templateCache, $stateParams, $compile, $timeout) {

    /**
     * @summary Reactivate Inactive Group
     */
    $scope.reactivateGroup = async function (group) {
        if (!confirm(SanteDB.locale.getString("ui.admin.group.reactivate.confirm")))
            return;

        try {
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

            // Send the patch
            SanteDB.display.buttonWait("#reactivateRoleButton", true);
            await SanteDB.resources.securityRole.patchAsync($stateParams.id, group.securityRole.etag, patch);
            group.securityRole.obsoletionTime = null;
            group.securityRole.obsoletedBy = null;
            toastr.success(SanteDB.locale.getString("ui.admin.group.reactivate.success"));
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#reactivateRoleButton", false);
        }

    }

    /**
     * @summary Save the specified role
     * @param {any} roleForm The form to use for validation
     * @param {SecurityRole} group The group to save
     */
    $scope.saveGroup = async function (roleForm, group) {

        if (!roleForm.$valid) return;

        // Show wait state
        SanteDB.display.buttonWait("#saveGroupButton", true);

        try {

            // Just post the security role 
            var patch = new Patch({
                appliesTo: {
                    id: group.securityRole.id,
                    etag: group.securityRole.tag
                },
                change: [
                    new PatchOperation({
                        op: PatchOperationType.Replace,
                        path: "description",
                        value: group.securityRole.description
                    })
                ]
            });
            var role = await SanteDB.resources.securityRole.patchAsync(group.securityRole.id, group.securityRole.etag, patch);
            toastr.success(SanteDB.locale.getString("ui.model.securityRole.saveSuccess"));
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveGroupButton", false);
        }

    }
}]);
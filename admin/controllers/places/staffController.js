/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
/*
 * Copyright (C) 2021 - 2024, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
 * Portions Copyright (C) 2015-2018 Mohawk College of Applied Arts and Technology
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); you 
 * may not use this file except in compliance with the License. You may 
 * obtain a copy of the License at 
 * 
 * http://www.apache.org/licenses/LICENSE-2.0 
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the 
 * License for the specific language governing permissions and limitations under 
 * the License.
 * 
 * User: fyfej
 * Date: 2023-5-19
 */
angular.module('santedb').controller('FacilityStaffController', ["$scope", "$rootScope", "$state", "$timeout", function ($scope, $rootScope, $state, $timeout) {

    const LOCAL_ADMINISTRATORS_GID = '67606be0-cb99-4cfb-8658-8d0c006116ac';

    $scope.assignUser = {};
    $scope.renderName = (r) => SanteDB.display.renderEntityName(r.holderModel.name);
    $scope.renderUser = function(r) {
        if(r.holderModel && r.holderModel.securityUserModel) {
            return `<i class="fas fa-fw fa-shield-alt"></i> ${r.holderModel.securityUserModel.userName}`;
        }
        else {
            return SanteDB.locale.getString("ui.model.userEntity.securityUser.none");
        }
    }

    $scope.removeManager = async function(id, row) {
        var user = $("#ManagerStaffTable table").DataTable().row(row).data();
        if(confirm(SanteDB.locale.getString("ui.admin.facility.staff.manager.remove.confirm", { user: SanteDB.display.renderEntityName(user.holderModel.name) }))) {
            try {
                await SanteDB.resources.entityRelationship.deleteAsync(id);
                toastr.success(SanteDB.locale.getString("ui.admin.facility.staff.manager.remove.success"));
                $("#ManagerStaffTable").attr("newQueryId", true);
                $("#ManagerStaffTable table").DataTable().draw();
            }
            catch(e) {
                taostr.error(SanteDB.locale.getString("ui.admin.facility.staff.manager.remove.error", {error: e.message}));
            }
        }
    }

    $scope.removeStaffMember = async function(id, row) {
        var user = $("#AssignedStaffTable table").DataTable().row(row).data();
        if(confirm(SanteDB.locale.getString("ui.admin.facility.staff.remove.confirm", { user: SanteDB.display.renderEntityName(user.holderModel.name) }))) {
            try {
                // Is the user also a manager? if so we need to delete that too
                var mgr = await SanteDB.resources.entityRelationship.findAsync({ source: user.holder, target: $scope.scopedObject.id, relationshipType: EntityRelationshipTypeKeys.MaintainedEntity, _count: 1, _includeTotal: false });
                if(mgr.resource) {
                    await SanteDB.resources.entityRelationship.deleteAsync(mgr.resource[0].id);
                }
                await SanteDB.resources.entityRelationship.deleteAsync(id);
                toastr.success(SanteDB.locale.getString("ui.admin.facility.staff.remove.success"));
                $("#ManagerStaffTable").attr("newQueryId", true);
                $("#ManagerStaffTable table").DataTable().draw();
                $("#AssignedStaffTable").attr("newQueryId", true);
                $("#AssignedStaffTable table").DataTable().draw();
                
            }
            catch(e) {
                taostr.error(SanteDB.locale.getString("ui.admin.facility.staff.remove.error", {error: e.message}));
            }
        }
    }

    $scope.makeManager = async function(id, row) {
        var user = $("#AssignedStaffTable table").DataTable().row(row).data();
        if(confirm(SanteDB.locale.getString("ui.admin.facility.staff.manager.promote.confirm", { user: SanteDB.display.renderEntityName(user.holderModel.name) })))
        {
            try {
                // Check if they're a local administrator and prompt if we want to make them
                var userInfo = await SanteDB.resources.securityUser.getAsync(user.holderModel.securityUser);
                if(userInfo.role.indexOf('LOCAL_ADMINISTRATORS') == -1 && confirm(SanteDB.locale.getString("ui.admin.facility.staff.manager.promote.administrator"))) {
                    await SanteDB.resources.securityRole.addAssociatedAsync(LOCAL_ADMINISTRATORS_GID, 'user', userInfo.entity);
                }
                await SanteDB.resources.entityRelationship.insertAsync(new EntityRelationship({
                    source: user.holder,
                    target: $scope.scopedObject.id,
                    relationshipType: EntityRelationshipTypeKeys.MaintainedEntity
                }));
                toastr.success(SanteDB.locale.getString("ui.admin.facility.staff.manager.promote.success"));
                $("#ManagerStaffTable").attr("newQueryId", true);
                $("#ManagerStaffTable table").DataTable().draw();
            }
            catch(e) {
                toastr.error(SanteDB.locale.getString("ui.admin.facility.staff.manager.promote.error", { error: e.message }));
            }
            finally {
                SanteDB.display.buttonWait("#btnAssignManager", false);
            }         
        }
    }

    $scope.navSourceUser = async function(id) {
        try {
            var usr = await SanteDB.resources.entityRelationship.getAsync(id, "reverseRelationship");
            SanteDB.application.callResourceViewer("SecurityUser", $state, { id: usr.holderModel.securityUser });
        }
        catch(e) {
            console.warn(e);
        }
    }

    $scope.assignManager = async function(form) {
        if(form.$invalid || !confirm(SanteDB.locale.getString("ui.admin.facility.staff.manager.promote.confirm"))) return;

        try {

            SanteDB.display.buttonWait("#btnAssignManager", true);
            await SanteDB.resources.entityRelationship.insertAsync(new EntityRelationship({
                source: $scope.assignUser.id,
                target: $scope.scopedObject.id,
                relationshipType: EntityRelationshipTypeKeys.MaintainedEntity
            }));
            toastr.success(SanteDB.locale.getString("ui.admin.facility.staff.manager.promote.success"));
            $("#ManagerStaffTable").attr("newQueryId", true);
            $("#ManagerStaffTable table").DataTable().draw();

            $timeout(() => $scope.assignUser.id = "");
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnAssignManager", false);
        }
    }

    $scope.assignStaff = async function(form) {
        if(form.$invalid) return;

        try {
            SanteDB.display.buttonWait("#btnAssignStaff", true);
            await SanteDB.resources.entityRelationship.insertAsync(new EntityRelationship({
                source: $scope.assignUser.id,
                target: $scope.scopedObject.id,
                relationshipType: EntityRelationshipTypeKeys.DedicatedServiceDeliveryLocation
            }));
            toastr.success(SanteDB.locale.getString("ui.admin.facility.staff.add.success"));
            $("#AssignedStaffTable").attr("newQueryId", true);
            $("#AssignedStaffTable table").DataTable().draw();

            $timeout(() => $scope.assignUser.id = "");
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnAssignStaff", false);
        }

    }

}]);
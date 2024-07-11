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
angular.module('santedb').controller('ForeignDataIndexController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {


    // Render entity information
    $scope.renderModified = function (entity) {
        return `<provenance provenance-id="'${entity.updatedBy || entity.createdBy}'"  provenance-time="'${entity.updatedTime || entity.creationTime}'"></provenance>`;
    }

    // Render filename
    $scope.renderFileName = function (entity) {
        return `${entity.description} (<i class='fas fa-file'></i> ${entity.name})`
    }

    // Render status
    $scope.renderStatus = function (entity) {
        var status = "";
        switch (entity.status) {
            case "Scheduled":
            case "Staged":
                status += "<span class='text-secondary'><i class='fas fa-clock'></i> ";
                break;
            case "Running":
                status += "<span class='text-primary'><i class='fas fa-play'></i> ";
                break;
            case "Rejected":
                status += "<span class='text-danger'><i class='fas fa-exclamation-triangle'></i> ";
                break;
            case "CompletedSuccessfully":
                status += "<span class='text-success'><i class='fas fa-check'></i> ";
                break;
            case "CompletedWithErrors":
                status += "<span class='text-warning'><i class='fas fa-exclamation-circle'></i> ";
                break;
        }
        status += SanteDB.locale.getString(`ui.model.alien.submission.status.${entity.status}`);
        return status;
    }

    // Delete 
    $scope.delete = async function (id) {

        if (confirm(SanteDB.locale.getString("ui.admin.alien.delete.confirm"))) {
            try {
                var deleted = await SanteDB.resources.foreignData.deleteAsync(id);
                toastr.success(SanteDB.locale.getString("ui.admin.alien.delete.success"));
                $("#ForeignDataTable").attr("newQueryId", true);
                $("#ForeignDataTable table").DataTable().draw();
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        }
    }

    // Reschedule job
    $scope.reschedule = async function(id) {
        if (confirm(SanteDB.locale.getString("ui.admin.alien.reschedule.confirm"))) { 
            try {
                var deleted = await SanteDB.resources.foreignData.invokeOperationAsync(id, "schedule");
                toastr.success(SanteDB.locale.getString("ui.admin.alien.reschedule.success"));
                $("#ForeignDataTable").attr("newQueryId", true);
                $("#ForeignDataTable table").DataTable().draw();
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        }

    }

    // Run scheduled
    $scope.runJobs = async function() {
        try {
            await SanteDB.resources.foreignData.invokeOperationAsync(null, "execute", null);
            toastr.success(SanteDB.locale.getString("ui.admin.alien.runAll.success"));
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }
}]);
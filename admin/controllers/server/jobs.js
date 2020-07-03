/// <reference path="../../../core/js/santedb.js"/>
/*
 * Portions Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * Portions Copyright 2019-2019 SanteSuite Contributors (See NOTICE)
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
 * User: Justin Fyfe
 * Date: 2019-10-5
 */
angular.module('santedb').controller('JobAdminController', ["$scope", "$rootScope",function ($scope, $rootScope) {

    // Render state
    $scope.renderState = function (job) {
        switch (job.state) {
            case "Completed":
                return `<span class="badge badge-success badge-pill"><i class="fas fa-check"></i> ${SanteDB.locale.getString("ui.state.complete")}</span>`;
            case "Running":
                return `<span class="badge badge-primary badge-pill"><i class="fas fa-play"></i> ${SanteDB.locale.getString("ui.state.running")}</span>`;
            case "Cancelled":
                return `<span class="badge badge-warning badge-pill"><i class="fas fa-info-circle"></i> ${SanteDB.locale.getString("ui.state.cancelled")}</span>`;
            case "Aborted":
                return `<span class="badge badge-danger badge-pill"><i class="fas fa-exlamation-triange"></i> ${SanteDB.locale.getString("ui.state.abort")}</span>`;
            case "Stopped":
                return `<span class="badge badge-danger badge-pill"><i class="fas fa-exlamation-triange"></i> ${SanteDB.locale.getString("ui.state.stop")}</span>`;
            default:
                    return `<span class="badge badge-info badge-pill"><i class="fas fa-clock"></i> ${SanteDB.locale.getString("ui.state.notrun")}</span>`;
        }
    }

    // Rende last run
    $scope.renderLastRun = function(job) {

        var retVal = "";
        if(job.lastStart) {
            retVal += SanteDB.display.renderDate(job.lastStart, 'F');
            if(job.lastFinish) {
                var diff = moment(job.lastFinish).diff(job.lastStart, 'seconds');
                if(diff >= 0)
                    retVal += ` <span class="badge badge-info"><i class='fas fa-clock'></i> ${ diff } s</span>`;
            }
        }
        else 
            retVal = `<span class='badge badge-info'><i class="fas fa-info-circle'></i> ${SanteDB.locale.getString("ui.admin.job.neverRun")}</span>`;
        return retVal;
    }

    // Render run
    $scope.runJob = async function(id) {
        if(confirm(SanteDB.locale.getString("ui.admin.job.runJob.confirm"))) 
        {
            try {
                await SanteDB.resources.jobInfo.updateAsync(id, { "$type" : "JobInfo" });
                $("#jobsTable table").DataTable().ajax.reload();

            }   
            catch(e) {
                $rootScope.errorHandler(e);
            }
        }
    }

    // Cancel a job
    $scope.cancelJob = async function(id) {
        if(confirm(SanteDB.locale.getString("ui.admin.job.cancelJob.confirm"))) 
        {
            try {
                await SanteDB.resources.jobInfo.deleteAsync(id);
            }   
            catch(e) {
                $rootScope.errorHandler(e);
            }
        }
    }
}]);
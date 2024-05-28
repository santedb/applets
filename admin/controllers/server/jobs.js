/// <reference path="../../../core/js/santedb.js"/>
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
angular.module('santedb').controller('JobAdminController', ["$scope", "$rootScope", "$timeout", function ($scope, $rootScope, $timeout) {


    // Render schedule
    $scope.renderSchedule = function (job) {
        if (job.schedule) {
            return "<ul class='p-0 m-0 list-unstyled'>" + job.schedule.map(o => {
                if (o.type == "Scheduled") {
                    return `<li><i class='fas fa-calendar'></i> ${o.repeat.map(d => d.substring(0, 2)).join(",")} <br/>@ ${moment(o.start).format("HH:mm")}<br/>starting ${moment(o.start).format("YYYY-MM-DD")}</li>`;
                }
                else {
                    return `<li><i class='fas fa-clock'></i> repeat ${moment.duration(o.interval).humanize(true)}</li>`;
                }
            }) + "</ul>";
        }
    }

    // Render state
    $scope.renderState = function (job) {
        switch (job.state) {
            case "Completed":
                return `<span class="badge badge-success badge-pill"><i class="fas fa-check"></i> ${SanteDB.locale.getString("ui.state.complete")}</span>`;
            case "Running":
                if (job.status) {
                    return `<span class="badge badge-primary badge-pill"><i class="fas fa-play"></i> ${SanteDB.locale.getString("ui.state.running")} (${Math.round(job.progress * 100)}%)</span><br/><small>${job.status}</small>`;
                }
                else {
                    return `<span class="badge badge-primary badge-pill"><i class="fas fa-play"></i> ${SanteDB.locale.getString("ui.state.running")}</span>`;
                }
            case "Cancelled":
                return `<span class="badge badge-warning badge-pill"><i class="fas fa-info-circle"></i> ${SanteDB.locale.getString("ui.state.cancelled")}</span>`;
            case "Aborted":
                return `<span class="badge badge-danger badge-pill"><i class="fas fa-exlamation-triange"></i> ${SanteDB.locale.getString("ui.state.abort")}</span><br/><small>${job.status}</small>`;
            case "Stopped":
                return `<span class="badge badge-danger badge-pill"><i class="fas fa-exlamation-triange"></i> ${SanteDB.locale.getString("ui.state.stop")}</span>`;
            default:
                return `<span class="badge badge-info badge-pill"><i class="fas fa-clock"></i> ${SanteDB.locale.getString("ui.state.notrun")}</span>`;
        }
    }

    $scope.renderName = function(job) {
        retVal = job.name;
        if(job.description) {
            retVal += `<br/><small class='text-secondary'>${job.description}</small>`;
        }
        return retVal;
    }

    // Rende last run
    $scope.renderLastRun = function (job) {

        var retVal = "";
        if (job.lastStart) {
            retVal += SanteDB.display.renderDate(job.lastStart, 'F');
            if (job.lastFinish) {
                var diff = moment(job.lastFinish).diff(job.lastStart, 'seconds');
                if (diff >= 0)
                    retVal += ` <span class="badge badge-info"><i class='fas fa-clock'></i> ${diff} s</span>`;
            }
        }
        else
            retVal = `<span class='badge badge-info'><i class="fas fa-info-circle'></i> ${SanteDB.locale.getString("ui.admin.job.neverRun")}</span>`;
        return retVal;
    }

    // Schedule the job
    $scope.scheduleJob = async function(id) {
        try {
            var jobInfo = await SanteDB.resources.jobInfo.getAsync(id);

            $timeout(_=> {
                if(!jobInfo.schedule || jobInfo.schedule.length == 0) {
                    jobInfo.schedule = [{ type: "Never" }];
                }
                if(jobInfo.schedule[0].start) {
                    jobInfo.schedule[0].time = new Date(1970, 0, 0, jobInfo.schedule[0].start.getHours(), jobInfo.schedule[0].start.getMinutes(), 0, 0);
                }
                $scope.currentJob = jobInfo; 
                $("#jobScheduleDialog").modal('show');
            });
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    $scope.saveJob = async function(form) {

        if(!form.$valid) { return; }

        try {

            SanteDB.display.buttonWait("#saveJobButton", true);

            $scope.currentJob.$type = "JobInfo";
            switch($scope.currentJob.schedule[0].type) {
                case "Never":
                    $scope.currentJob.schedule = [];
                    break;
                case "Interval":
                    $scope.currentJob.schedule = [ {
                        type: "Interval",
                        interval: $scope.currentJob.schedule[0].interval
                    }];
                    break;
                case "Scheduled":
                    $scope.currentJob.schedule = [ {
                        type: "Scheduled",
                        start: new Date(`${moment($scope.currentJob.schedule[0].startDate).format("YYYY-MM-DD")}T${moment($scope.currentJob.schedule[0].time).format("HH:mm:00.000Z")}`),
                        repeat: $scope.currentJob.schedule[0].repeat
                    }];
                    break;
            }

            await SanteDB.resources.jobInfo.updateAsync($scope.currentJob.id, $scope.currentJob);

            $("#jobScheduleDialog").modal('hide');

            $("#jobsTable table").DataTable().ajax.reload();

        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveJobButton", false);

        }

    }

    // Render run
    $scope.runJob = async function (id, index, jobParameters) {

        // Get the job 
        try {

            var jobInfo = await SanteDB.resources.jobInfo.getAsync(id);
            if (!jobParameters && jobInfo.parameters && jobInfo.parameters.length > 0) {
                $scope.currentJob = jobInfo;
                $("#jobParameterDialog").modal('show');
                try { $scope.$applyAsync(); }
                catch (e) { }
                return;
            }


        }
        catch (e) {
            $rootScope.errorHandler(e);
            return;
        }

        $("#jobParameterDialog").modal('hide');
        if (confirm(SanteDB.locale.getString("ui.admin.job.runJob.confirm"))) {
            try {
                var parms = {};
                if (jobParameters) {
                    jobParameters.forEach(o => parms[o.key] = o.value);
                }
                await SanteDB.resources.jobInfo.invokeOperationAsync(id, "start", parms);
                toastr.success(SanteDB.locale.getString("ui.admin.job.runJob.success"));
                $("#jobsTable table").DataTable().ajax.reload();

            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        }
    }

    // Cancel a job
    $scope.cancelJob = async function (id) {
        if (confirm(SanteDB.locale.getString("ui.admin.job.cancelJob.confirm"))) {
            try {
                await SanteDB.resources.jobInfo.invokeOperationAsync(id, "cancel");
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        }
    }

    $scope.registerJob = async function(jobType) {

        if(jobType) {
            // register job
            if(confirm(SanteDB.locale.getString("ui.admin.job.register.confirm", { job: jobType.type }))) {
                try {
                    var ji = {
                        $type: "JobInfo",
                        jobType: jobType.type
                    };
                    await SanteDB.resources.jobInfo.insertAsync(ji);
                    toastr.success(SanteDB.locale.getString("ui.admin.job.register.success", { job: jobType.type }));
                    $("#jobsTable table").DataTable().ajax.reload();

                }
                catch(e) {
                    $rootScope.errorHandler(e);
                    toastr.error(SanteDB.locale.getString("ui.admin.job.register.error", { error: e.message, job: jobType.type }));

                }
                finally {
                    $("#addJobDialog").modal('hide');
                }
            }
        }
        else {
            var unconfiguredJobs = await SanteDB.resources.jobInfo.findAsync({ _unconfigured: true });
            $timeout(() => {
                $scope.unregisteredJobs = unconfiguredJobs.resource;
                $("#addJobDialog").modal('show');
            });
        }

    }
}]);
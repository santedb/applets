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
angular.module('santedb').controller('SubmitBugController', ["$scope", "$rootScope", "$state", function($scope, $rootScope, $state) {

    $scope.info = {
        errorDataSize: $rootScope.error ? Math.round(JSON.stringify($rootScope.error).length / 1024) : 0
    };
    $scope.report = {
        attachLog: true,
        attachConfig: true,
        attachDetail: $rootScope.error !== null
    };


    // Initialize the view
    async function initialize() {
        try {
            var logs = await SanteDB.application.getLogInfoAsync();
            if(logs.resource) {
                var log = logs.resource[0];
                $scope.info.logSize = Math.round(log.size / 1024);
            }
            $scope.report.lastError = angular.copy($rootScope.error);
            $scope.$apply();
        }
        catch(e) {

        }
    }

    initialize();

    // Submit the bug report
    $scope.submitBug = async function(form) {

        if(!form.$valid) return;

        try{
            SanteDB.display.buttonWait("#btnSubmitBug", true);

            // IS this user a LOCAL user?
            if($rootScope.session.method == "LOCAL") // Local session so elevate to use the principal elevator
            {
                var elevator = new ApplicationPrincipalElevator();
                await elevator.elevate($rootScope.session);
                SanteDB.authentication.setElevator(elevator);
            }

            var noteText = `## Note \r\n\r\n ${$scope.report.description} \r\n\r\n ## Steps to Reproduce \r\n\r\n ${$scope.report.reproduction}\r\n\r\n\r\nEnvironment: ${navigator.userAgent}`;
            
            var submission = {
                $type: "DiagnosticReport",
                note: noteText,
                attach: []
            };
            if($scope.report.attachConfig)
                submission.attach.push({ file: "SanteDB.config" });
            if($scope.report.attachLog)
                submission.attach.push({ file: "SanteDB.log" });
            if($scope.report.attachDetail) {
                submission.attach.push({
                    "$type" : "SanteDB.Core.Model.AMI.Diagnostics.DiagnosticBinaryAttachment, SanteDB.Core.Model.AMI",
                    "file" : "last-error.json",
                    "description":"Last Error Message Contents",
                    "data": btoa(JSON.stringify($scope.report.lastError)),
                    "contentType": "application/json"
                });
            }                
            var result = await SanteDB.application.submitBugReportAsync(submission);
            toastr.info(`${SanteDB.locale.getString("ui.admin.bug.success")} #${result.ticketId}`, null, { preventDuplicates: true });
            $state.go("santedb-admin.dashboard");
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSubmitBug", false);

        }

    }   
}]);
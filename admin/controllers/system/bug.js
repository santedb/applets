/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
                var log = logs.resource.find(o=>o.name == "SanteDB.log");
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
            $state.transitionTo("santedb-admin.dashboard");
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSubmitBug", false);

        }

    }   
}]);
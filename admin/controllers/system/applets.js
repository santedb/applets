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
 */
angular.module("santedb").controller("AppletManagerController", ["$scope", "$rootScope", "$timeout", function($scope, $rootScope, $timeout) {

    async function initializeView() {
        try {
            var solutions = await SanteDB.resources.appletSolution.findAsync({}, null, true);
            // Determine whether the applets or solutions are being used 
            $timeout(() => {
                $scope.solutions = solutions.resource;
            });
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    initializeView();

    async function uploadSolution(form) {
        return new Promise(function (fulfill, reject) {

        var file_data = $(form.source.$$element).prop('files')[0];
            var form_data = new FormData();
            form_data.append('solution', file_data);
            $.ajax({
                cache: false,
                contentType: false,
                processData: false,
                headers: {
                    "X-SanteDB-Upstream": true
                },
                method: 'POST',
                url: `/ami/AppletSolution`,
                data: form_data,
                success: function (data) {
                    fulfill(data);
                },
                error: function (xhr, status, error) {
                    var errorJson = JSON.parse(xhr.responseText);
                    reject(errorJson);
                }
            });
        });
    }

    $scope.removeSolution = async function (id) {
        if(confirm(SanteDB.locale.getString("ui.admin.system.applet.remove.confirm", { id: id }))) {
            try {
                await SanteDB.resources.appletSolution.deleteAsync(id);
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        }
    }
    // Add an authentication certificate
    $scope.uploadSolution = async function (form) {
        try {
            SanteDB.display.buttonWait("#btnUploadApplet", true);
            await uploadSolution(form);
            toastr.success(SanteDB.locale.getString('ui.admin.system.applet.upload.success'));
            $timeout(() => $scope.solutions = null);
            initializeView();
        }
        catch(e) {
            toastr.error(SanteDB.locale.getString('ui.admin.system.applet.upload.error', { error: e.message }));
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnUploadApplet", false);
        }
    }
}]);
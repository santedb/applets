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
 * Date: 2023-7-22
 */
angular.module('santedb').controller('EditSecurityCertificatesController', ["$scope", "$rootScope", function ($scope, $rootScope) {

    function downloadCert(certificateData, certPath) {
        var win = window.open(`/ami/${$scope.scopedObject.$refType}/${$scope.scopedObject.id}/${certPath}/${certificateData}`, '_blank');
        win.onload = function (e) {
            win.close();
        };
    }
    // Download certificate
    $scope.downloadAuthenticationCertificate = function (certificateData) {
        downloadCert(certificateData, "auth_cert");
    }
    // Download certificate
    $scope.downloadSigningCertificate = function (certificateData) {
        downloadCert(certificateData, "dsig_cert");
    }

    async function deleteCert(certificateData, index, certPath) {
        if (confirm(SanteDB.locale.getString("ui.admin.application.cert.remove.confirm"))) {
            try {
                $("#action_grp_" + index + " a").addClass("disabled");
                $("#action_grp_" + index + " a i.fa-trash").removeClass("fa-trash").addClass("fa-circle-notch fa-spin");
                await SanteDB.resources[$scope.scopedObject.$refType.toCamelCase()].removeAssociatedAsync($scope.scopedObject.id, certPath, certificateData);
            }
            catch (e) {
                $rootScope.errorHandler(e);
            }
        }
    }

    // Delete auth cert
    $scope.deleteAuthenticationCert = async function (certificateData, index) {
        await deleteCert(certificateData, index, "auth_cert");
        $("#AuthenticationCertificatesTable table").DataTable().draw();

    }

    // Delete sign cert
    $scope.deleteSigningCert = async function (certificateData, index) {
        await deleteCert(certificateData, index, "dsig_cert");
        $("#SigningCertificatesTable table").DataTable().draw();
    }

    function addCertificate(form, certPath) {

        if (form.$invalid) { return; }
        return new Promise(function (fulfill, reject) {
            var file_data = $(form.uploadCert.$$element).prop('files')[0];
            var form_data = new FormData();
            form_data.append('certificate', file_data);
            $.ajax({
                cache: false,
                contentType: false,
                processData: false,
                method: 'POST',
                url: `/ami/${$scope.scopedObject.$refType}/${$scope.scopedObject.id}/${certPath}`,
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

    // Add an authentication certificate
    $scope.addAuthenticationCertificate = async function (form) {
        try {
            SanteDB.display.buttonWait("#btnSubmitAuthenticationCert", true);

            await addCertificate(form, "auth_cert");
            console.log('Success');
            toastr.success(SanteDB.locale.getString('ui.admin.security.cert.upload.success'));
            $("#AuthenticationCertificatesTable table").DataTable().draw();
        }
        catch(e) {
            toastr.error(SanteDB.locale.getString('ui.admin.security.cert.upload.error', { error: e.message }));
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSubmitAuthenticationCert", false);
        }
    }

    // Add an signing  certificate
    $scope.addSigningCertificate = async function (form) {
        try {
            SanteDB.display.buttonWait("#btnSubmitSigningCert", true);

            await addCertificate(form, "dsig_cert");
            console.log('Success');
            toastr.success(SanteDB.locale.getString('ui.admin.security.cert.upload.success'));
            $("#SigningCertificatesTable table").DataTable().draw();
        }
        catch(e) {
            toastr.error(SanteDB.locale.getString('ui.admin.security.cert.upload.error', { error: e.message }));
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSubmitSigningCert", false);
        }
    }
}]);
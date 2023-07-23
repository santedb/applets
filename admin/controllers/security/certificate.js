/// <reference path="../../../core/js/santedb.js"/>
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
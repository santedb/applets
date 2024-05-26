angular.module("santedb").controller("AppletManagerController", ["$scope", "$rootScope", "$timeout", function($scope, $rootScope, $timeout) {

    async function initializeView() {
        try {
            var solutions = await SanteDB.resources.appletSolution.findAsync();
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
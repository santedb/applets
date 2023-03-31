/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
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
 * Date: 2019-9-20
 */
angular.module('santedb').controller('ForeignDataUploadController', ["$scope", "$rootScope", "$timeout", "$state", function ($scope, $rootScope, $timeout, $state) {

    $scope.submission = {};

    async function initialize() {
        try {
            var maps = await SanteDB.resources.foreignDataMap.findAsync();
            $timeout(() => $scope.mappings = maps.resource);
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }

    initialize();

    $scope.submit = function() {


        var file_data = $('#source-file').prop('files')[0];
        var form_data = new FormData();
        form_data.append('source', file_data);
        form_data.append('description', $scope.submission.description);
        form_data.append('map', $scope.submission.map || '671bf90b-019d-4843-8e77-69f84ce12689');
        SanteDB.display.buttonWait("#btnSubmit", true);
        $.ajax({
            cache: false,
            contentType: false,
            processData: false,
            method: 'POST',
            url: "/ami/ForeignData",
            data: form_data,
            success: function (data) {
                console.log('Success');
                toastr.success(SanteDB.locale.getString('ui.admin.alien.upload.success'));
                $state.go('santedb-admin.data.import.index');
            },
            error: function (xhr, status, error) {
                console.log('error');
                toastr.error(SanteDB.locale.getString('ui.admin.alien.upload.error', { status: status, error: error }));
                SanteDB.display.buttonWait("#btnSubmit", false);

            }
        });
    }

}]);
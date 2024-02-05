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
angular.module('santedb').controller('LogViewController', ["$scope", "$rootScope", "$stateParams", "$timeout", function ($scope, $rootScope, $stateParams, $timeout) {


    var size = 0;
    var _isEof = false;
    var _isLoading = false;
    async function getLogChunk(offset, count) {
        if(_isLoading) return;

        try {
            _isLoading = true;
            var logContents = await SanteDB.application.getLogInfoAsync($stateParams.id, { _upstream: $stateParams._upstream, _offset: offset, _count: count});
            size = offset + logContents.length;
            _isEof = logContents.length == 0;
            $timeout(() => {
                var existingContent = $scope.log ? $scope.log.content : "";
                $scope.log = {
                    content: existingContent + logContents,
                    name: $stateParams.id
                };
                _isLoading = false;
            });
        }    
        catch(e) {
            $rootScope.errorHandler(e);
            _isLoading = false;
        }
    }
    getLogChunk(0, 4096);

    // Get download link
    $scope.getDownloadLink = function () {
        return `/ami/Log/${$stateParams.id}?_download=true&_upstream=${$stateParams._upstream}`; //?_sessionId=${window.sessionStorage.getItem("token")}`;
    }

    document.title = document.title + " - " + $stateParams.id;

    // We use timeout here to wait for the DOM
    $timeout(function () {
        $("#logContent").on('scroll', function (e) {
            var o = e.currentTarget;
            if (o.offsetHeight + o.scrollTop >= o.scrollHeight - 500 && !_isEof) {
                getLogChunk(size, 4096);
            }
        });
    }
        , 500);


}]);

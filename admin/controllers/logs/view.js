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
 * Date: 2019-10-3
 */
angular.module('santedb').controller('LogViewController', ["$scope", "$rootScope", "$stateParams", "$timeout", function ($scope, $rootScope, $stateParams, $timeout) {


    $scope.isLoading = true;
    var size = 0;
    SanteDB.application.getLogInfoAsync($stateParams.id, { _count: 4096 })
        .then(function (d) {
            $scope.isLoading = false;
            $scope.log = d;
            $scope.log.content = atob(d.text);
            size = $scope.log.content.length;
            $scope.$apply();
        })
        .catch(function (e) {
            $scope.isLoading = false;
            $rootScope.errorHandler(e);
            $scope.$apply();
        });

    // Get download link
    $scope.getDownloadLink = function() {
        return `/ami/Log/Stream/${$stateParams.id}`; //?_sessionId=${window.sessionStorage.getItem("token")}`;
    }

    $timeout(function() {
            $("#logContent").on('scroll', function (e) {
                var o = e.currentTarget;
                if (o.offsetHeight + o.scrollTop >= o.scrollHeight - 500 && $scope.log.size > size) {
                    if ($scope.isLoading) return;
                    $scope.isLoading = true;
                    SanteDB.application.getLogInfoAsync($stateParams.id, { _offset: size })
                        .then(function (d) {
                            $scope.isLoading = false;
                            $scope.log.content += atob(d.text);
                            size = $scope.log.content.length;
                            $scope.$apply();
                        })
                        .catch(function (e) {
                            $scope.isLoading = false;
                            $rootScope.errorHandler(e);
                            $scope.$apply();
                        });
                }
            });
        }
    , 500);


}]);

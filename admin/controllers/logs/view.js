/// <reference path="../../../core/js/santedb.js"/>
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
        return `/ami/Log/Stream/${$stateParams.id}?_sessionId=${window.sessionStorage.getItem("token")}`;
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

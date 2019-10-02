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


    $scope.downloadLog = function() {
        SanteDB.display.buttonWait("#downloadLog", true);
        SanteDB.application.getLogInfoAsync($stateParams.id, { _offset : 0, _count : $scope.log.size})
        .then(function (d) {
            SanteDB.display.buttonWait("#downloadLog", false);
            var element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(atob(d.text)));
            element.setAttribute('download', d.name + ".txt");
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        })
        .catch(function (e) {
            SanteDB.display.buttonWait("#downloadLog", false);

            $rootScope.errorHandler(e);
            $scope.$apply();
        });
    };

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

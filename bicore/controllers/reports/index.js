/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../js/santedb-bi.js"/>

angular.module('santedb').controller('ReportCenterController', ["$scope", "$rootScope", "$state", "$timeout", function ($scope, $rootScope, $state, $timeout) {

  
    $scope.renderDescription = function(r) {
        if(r.meta && r.meta.doc) 
        {
            return r.meta.doc.doc;
        }
    }
   
    
    $scope.renderAuthor = function(r) {
        if(r.meta && r.meta.authors) {
            return r.meta.authors.join(",");
        }
    }
}]);
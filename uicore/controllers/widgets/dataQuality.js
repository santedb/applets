/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('DataQualityWidgetController', ['$scope', '$rootScope', function ($scope, $rootScope) {
    
    $scope.$watch("scopedObject", function(n, o) {
        if(n && n.extension['http://santedb.org/extensions/core/detectedIssue'] && !n.dataQualityIssues)
            try {
                n.dataQualityIssues = n.extension['http://santedb.org/extensions/core/detectedIssue'][0].hexDecodeJson();
                n.dataQualityIssues.forEach((issue) => {
                    issue.typeModel = Object.keys(DetectedIssueKeys).find((o)=> DetectedIssueKeys[o] == issue.type);
                });
            }
            catch(e) {
                console.warn("Cannot parse DQ value");
            }
    })
}]);

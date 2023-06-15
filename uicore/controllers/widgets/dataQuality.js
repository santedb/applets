/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('DataQualityWidgetController', ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {
    

    async function loadTypes() {
        var types = await SanteDB.resources.concept.findAsync({ 'conceptSet' : '9167DDAF-D29A-4448-9F72-887DF3A5BD3E' });
        $timeout(_ => {
            $scope.detectedIssueTypes = {};
            types.resource.forEach(t=> $scope.detectedIssueTypes[t.id] = t);
        });
    }

    loadTypes();

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

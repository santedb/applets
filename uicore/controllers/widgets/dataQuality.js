/// <reference path="../../../core/js/santedb.js"/>
/*
 * Copyright (C) 2021 - 2025, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Portions Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
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
 */
angular.module('santedb').controller('DataQualityWidgetController', ['$scope', '$rootScope', function ($scope, $rootScope) {
    

    async function loadTypes() {
        var types = await SanteDB.resources.concept.findAsync({ 'conceptSet' : '9167DDAF-D29A-4448-9F72-887DF3A5BD3E' });
        $timeout(_ => {
            $scope.detectedIssueTypes = {};
            types.resource.forEach(t=> $scope.detectedIssueTypes[t.id] = t);
        });
    }

    loadTypes();

    $scope.$watch("scopedObject", function(n, o) {
        if(n && n._issues && (n.extension['http://santedb.org/extensions/core/detectedIssue'] || n._issues) && !n.dataQualityIssues)
            try {
                n.dataQualityIssues = n._issues || n.extension['http://santedb.org/extensions/core/detectedIssue'][0].b64DecodeJson();
                n.dataQualityIssues.forEach((issue) => {
                    issue.typeModel = Object.keys(DetectedIssueKeys).find((o)=> DetectedIssueKeys[o] == issue.type);
                });
            }
            catch(e) {
                console.warn("Cannot parse DQ value", e);
            }
    })
}]);

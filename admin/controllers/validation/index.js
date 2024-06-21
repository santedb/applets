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
angular.module('santedb').controller('ValidationRuleIndexController', ["$scope", function ($scope) {

    var cacheType = {};

    $scope.renderSourceClass = function(d){
        if(d.sourceClassModel) {
            return d.sourceClassModel.mnemonic;
        }
        return d.sourceClass || "*";
    }
    $scope.renderTargetClass = function(d){
        if(d.targetClassModel) {
            return d.targetClassModel.mnemonic;
        }
        return d.targetClass || "*";
    }
    $scope.renderRelationshipType = function(d){
        if(d.relationshipTypeModel) {
            return d.relationshipTypeModel.mnemonic;
        }
        return d.relationshipType || "*";
    }
    $scope.loadProperties = async function(r) {
        r.sourceClassModel = cacheType[r.sourceClass];
        r.targetClassModel = cacheType[r.targetClass];
        r.relationshipTypeModel = cacheType[r.relationshipType];
        if(!r.sourceClassModel && r.sourceClass) {
            r.sourceClassModel = await SanteDB.resources.concept.getAsync(r.sourceClass);
            cacheType[r.sourceClass] = r.sourceClassModel;
        }
        if(!r.targetClassModel && r.targetClass) {
            r.targetClassModel = await SanteDB.resources.concept.getAsync(r.targetClass);
            cacheType[r.targetClass] = r.targetClassModel;
        }
        if(!r.relationshipTypeModel) {
            r.relationshipTypeModel = await SanteDB.resources.concept.getAsync(r.relationshipType);
            cacheType[r.relationshipType] = r.relationshipTypeModel;
        }
        return r;
    }
}]);

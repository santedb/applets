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

angular.module('santedb').controller('PatientDemographicsWidgetController', ['$scope', '$rootScope', function ($scope, $rootScope) {
    

  
    $scope.$watch("scopedObject", function(n, o) {
        if(n && n != null) {
            n.relationshipModel = Object.keys(n.relationship).map((k) => n.relationship[k] ).flat();
            n.relationshipModel.forEach(async function(rel) {
                if(rel.source && rel.source != n.id || rel.holder && !rel.holder == n.id) {
                    rel.sourceModel = await SanteDB.resources.entity.getAsync(rel.source || rel.holder);
                    rel.inverse = true;
                    rel.relatedPersonModel = rel.sourceModel;
                }
                else if(!rel.targetModel) 
                    rel.relatedPersonModel = rel.targetModel = await SanteDB.resources.entity.getAsync(rel.target);
                else
                    rel.relatedPersonModel = rel.targetModel;

                if(!rel.relationshipTypeModel)
                    rel.relationshipTypeModel = await SanteDB.resources.concept.getAsync(rel.relationshipType);
            });
        }
    });
}]);
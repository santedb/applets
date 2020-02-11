angular.module('santedb').controller('PatientDemographicsWidgetController', ['$scope', '$rootScope', function ($scope, $rootScope) {
    
    $scope.updatePatient = function(form) {

        // TODO: Update the address to the targetAddressId if it is present in the address.
        alert(form.$valid);
    };

    // Watch will look for scoped object to load and will set necessary shortcut objects for the view 
    $scope.$watch("scopedObject", function(n, o) {
        if(n && n != null) {

            delete($scope.editObject); // Delete the current edit object
            $scope.editObject = angular.copy(n);
            n.identifierModel = Object.keys(n.identifier).map((k)=> n.identifier[k]).flat();
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
            
            // Look up domicile
            if($rootScope.system.config.application.setting['input.address'] == "select" && n.address) {
                Object.keys(n.address).forEach(async function(prop) {
                    var addr = n.address[prop];
                    // query by census tract if possible
                    var query = {
                        _count: 2
                    };
                    if(addr.component && addr.component.CensusTract)
                        query["address.component[CensusTract].value"] = addr.component.CensusTract;
                    else {
                        // Query by full address
                        Object.keys(addr.component).forEach(function(prop) 
                        {
                            if(addr.component[prop] != "" && addr.component[prop] != "?")
                                query[`address.component[${prop}].value`] = addr.component[prop];
                        });
                    }

                    // Now query 
                    var results = await SanteDB.resources.place.findAsync(query);
                    if(results.total == 1 || results.item.length == 1)
                    {
                        addr.targetId = results.item[0].id;
                        addr.component = results.item[0].component;                        
                    }
                });
            }
        }
    });
}]);
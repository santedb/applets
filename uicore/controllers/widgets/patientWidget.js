/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('PatientDemographicsWidgetController', ['$scope', '$rootScope', function ($scope, $rootScope) {

    $scope.update = async function (form) {

        var submissionObject = angular.copy($scope.editObject);
        // TODO: Update the address to the targetAddressId if it is present in the address.
        if (form.$invalid) {
            return false;
        }

        // Update target identifiers with the original
        if (submissionObject.address)  {
            var promises = Object.keys(submissionObject.address).map(async function (k) {
                try {
                    var addr = submissionObject.address[k];
                    addr.use = addr.useModel.id;
                    addr.component = addr.component || {};
                    delete(addr.useModel);
                    if (addr.targetId) {
                        var addrComponents = (await SanteDB.resources.place.getAsync(addr.targetId)).address.Direct.component;
                        addr.component.Country = addrComponents.Country;
                        addr.component.CensusTract = addrComponents.CensusTract;
                        addr.component.County = addrComponents.County;
                        addr.component.State = addrComponents.State;
                        addr.component.Precinct = addrComponents.Precinct;
                        addr.component.City = addrComponents.City;
                    }
                }
                catch(e) {
                }
            });
            await Promise.all(promises);
        }
        
        // Now post the changed update object 
        try {
            $scope.scopedObject = await SanteDB.resources.patient.updateAsync(submissionObject.id, submissionObject);
            $scope.scopedObject = await SanteDB.resources.patient.getAsync(submissionObject.id); // re-fetch the patient
            toastr.success(SanteDB.locale.getString("ui.model.patient.saveSuccess"));
            form.$valid = true;
        }
        catch(e) 
        {
            $rootScope.errorHandler(e);
            form.$valid = false;
        }
    };

    // Watch will look for scoped object to load and will set necessary shortcut objects for the view 
    $scope.$watch("scopedObject", async function (n, o) {
        if (n && n != null) {

            delete ($scope.editObject); // Delete the current edit object

            if (n.tag && n.tag['$mdm.type'] == 'M') // Attempt to find a ROT
            {
                var recordOfTruth = await SanteDB.resources.patient.findAsync({
                    "relationship[MDM-RecordOfTruth].source": n.id,
                    "_count": 1
                });

                if (recordOfTruth.total == 0 || !recordOfTruth.resource)
                    $scope.editObject = angular.copy(n);
                else 
                    $scope.editObject = recordOfTruth.resource[0];
                
            }
            else
                $scope.editObject = angular.copy(n);

            n.identifierModel = Object.keys(n.identifier).map((k) => n.identifier[k]).flat();
            if (n.relationship) {
                n.relationshipModel = Object.keys(n.relationship).map((k) => n.relationship[k]).flat();
                n.relationshipModel.forEach(async function (rel) {
                    if (rel.source && rel.source != n.id || rel.holder && !rel.holder == n.id) {
                        rel.sourceModel = await SanteDB.resources.entity.getAsync(rel.source || rel.holder);
                        rel.inverse = true;
                        rel.relatedPersonModel = rel.sourceModel;
                    }
                    else if (!rel.targetModel)
                        rel.relatedPersonModel = rel.targetModel = await SanteDB.resources.entity.getAsync(rel.target);
                    else
                        rel.relatedPersonModel = rel.targetModel;

                    if (!rel.relationshipTypeModel)
                        rel.relationshipTypeModel = await SanteDB.resources.concept.getAsync(rel.relationshipType);
                });
            }

            // Look up domicile
            if ($rootScope.system.config.application.setting['input.address'] == "select" && $scope.editObject.address) {
                var promises = Object.keys($scope.editObject.address).map(async function (prop) {
                    var addr = $scope.editObject.address[prop];
                    // query by census tract if possible
                    var query = {
                        _count: 2
                    };
                    if (addr.component && addr.component.CensusTract)
                        query["identifier.value"] = addr.component.CensusTract;
                    else {
                        // Query by full address
                        Object.keys(addr.component).forEach(function (prop) {
                            if (addr.component[prop] != "" && addr.component[prop] != "?")
                                query[`address.component[${prop}].value`] = addr.component[prop];
                        });
                    }

                    // Now query 
                    var results = await SanteDB.resources.place.findAsync(query);
                    if (results.total == 1 || results.resource.length == 1) {
                        addr.targetId = results.resource[0].id;
                    }
                });
                await Promise.all(promises);
            }
            else if(!$scope.editObject.address) {
                $scope.editObject.address = {
                    "HomeAddress" : {
                        "useModel": {
                            "id" :AddressUseKeys.HomeAddress,
                            "mnemonic":"HomeAddress"
                        }
                    }
                }
            }
        }
    });
}]);
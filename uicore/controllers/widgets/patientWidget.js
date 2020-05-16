/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('PatientDemographicsWidgetController', ['$scope', '$rootScope', function ($scope, $rootScope) {

    $scope.update = async function (form) {

        var submissionObject = angular.copy($scope.editObject);
        // TODO: Update the address to the targetAddressId if it is present in the address.
        if (form.$invalid) {
            return false;
        }

        // Update target identifiers with the original
        if (submissionObject.address) {
            var addressList = [];
            var promises = Object.keys(submissionObject.address).map(async function (k) {
                try {
                    var addr = submissionObject.address[k];
                    if(!Array.isArray(addr))
                        addr = [addr];

                    var intlPromises = addr.map(async function(addrItem){
                        addrItem.use = addrItem.useModel.id;
                        addrItem.component = addrItem.component || {};
                        delete (addrItem.useModel);
                        if (addrItem.targetId) {
                            var addrComponents = (await SanteDB.resources.place.getAsync(addrItem.targetId)).address.Direct.component;
                            addrItem.component.Country = addrComponents.Country;
                            addrItem.component.CensusTract = addrComponents.CensusTract;
                            addrItem.component.County = addrComponents.County;
                            addrItem.component.State = addrComponents.State;
                            addrItem.component.Precinct = addrComponents.Precinct;
                            addrItem.component.City = addrComponents.City;
                        }
                        addressList.push(addrItem);
                    });
                    await Promise.all(intlPromises);
                }
                catch (e) {
                }
            });
            await Promise.all(promises);
            submissionObject.address = { "$other": addressList };
        }
        if (submissionObject.name) {
            var nameList = [];
            Object.keys(submissionObject.name).forEach(function (k) {

                var name = submissionObject.name[k];
                if (!Array.isArray(name))
                    name = [name];

                name.forEach(function (nameItem) {
                    nameItem.use = nameItem.useModel.id;
                    delete (nameItem.useModel);
                    nameList.push(nameItem);
                })

            });
            submissionObject.name = { "$other": nameList };
        }

        // Now post the changed update object 
        try {
            if (submissionObject.tag && submissionObject.tag["$generated"]) {
                submissionObject.tag["$mdm.type"] = "T"; // Set a ROT tag
                submissionObject.determinerConcept = '6b1d6764-12be-42dc-a5dc-52fc275c4935'; // set update as a ROT
            }
            $scope.scopedObject = await SanteDB.resources.patient.updateAsync(submissionObject.id, submissionObject);
            $scope.scopedObject = await SanteDB.resources.patient.getAsync(submissionObject.id, "full"); // re-fetch the patient
            toastr.success(SanteDB.locale.getString("ui.model.patient.saveSuccess"));
            form.$valid = true;
        }
        catch (e) {
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
                if (n.relationship["MDM-RecordOfTruth"] &&
                    n.relationship["MDM-RecordOfTruth"].target) {
                    $scope.editObject = await SanteDB.resources.entity.getAsync(n.relationship["MDM-RecordOfTruth"].target, "full"); //angular.copy(n.relationship["MDM-RecordOfTruth"].targetModel);
                }
                else {
                    var recordOfTruth = await SanteDB.resources.patient.findAsync({
                        "relationship[MDM-RecordOfTruth].source": n.id,
                        "_count": 1
                    });

                    if (recordOfTruth.total == 0 || !recordOfTruth.resource)
                        $scope.editObject = angular.copy(n);
                    else
                        $scope.editObject = recordOfTruth.resource[0];
                }
            }
            else
                $scope.editObject = angular.copy(n);

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
            else if (!$scope.editObject.address) {
                $scope.editObject.address = {
                    "HomeAddress": {
                        "useModel": {
                            "id": AddressUseKeys.HomeAddress,
                            "mnemonic": "HomeAddress"
                        }
                    }
                }
            }
        }
    });
}]);
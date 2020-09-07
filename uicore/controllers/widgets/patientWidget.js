/// <reference path="../../../core/js/santedb.js"/>
angular.module('santedb').controller('PatientDemographicsWidgetController', ['$scope', '$rootScope', function ($scope, $rootScope) {

    async function correctEntityInformation(entity) {
        // Update the address - Correcting any linked addresses to the strong addresses
        // TODO: 
        if (entity.address) {
            var addressList = [];
            var promises = Object.keys(entity.address).map(async function (k) {
                try {
                    var addr = entity.address[k];
                    if (!Array.isArray(addr))
                        addr = [addr];

                    var intlPromises = addr.map(async function (addrItem) {
                        addrItem.use = addrItem.useModel.id;
                        addrItem.component = addrItem.component || {};
                        delete (addrItem.useModel);
                        addressList.push(addrItem);
                    });
                    await Promise.all(intlPromises);
                }
                catch (e) {
                }
            });
            await Promise.all(promises);
            entity.address = { "$other": addressList };
        }
        if (entity.name) {
            var nameList = [];
            Object.keys(entity.name).forEach(function (k) {

                var name = entity.name[k];
                if (!Array.isArray(name))
                    name = [name];

                name.forEach(function (nameItem) {
                    nameItem.use = nameItem.useModel.id;
                    delete (nameItem.useModel);
                    nameList.push(nameItem);
                })

            });
            entity.name = { "$other": nameList };
        }

    }

    $scope.update = async function (form) {

        // TODO: Update the address to the targetAddressId if it is present in the address.
        if (form.$invalid) {
            return false;
        }

        // Now post the changed update object 
        try {
            var submissionObject = angular.copy($scope.editObject);
            await correctEntityInformation(submissionObject);

            if (submissionObject.tag && submissionObject.tag["$generated"]) {
                submissionObject.tag["$mdm.type"] = "T"; // Set a ROT tag
                submissionObject.determinerConcept = '6b1d6764-12be-42dc-a5dc-52fc275c4935'; // set update as a ROT
            }

            // Bundle to be submitted
            var bundle = new Bundle({ resource: [ submissionObject ]});

            // Now have any of our relationships changed?
            if(submissionObject.relationship) {
                var changedRels = Object.keys(submissionObject.relationship).map(o=>submissionObject.relationship[o].targetModel).flat();
                changedRels.filter(o=>o && o.$edited).forEach(function(object) {
                    correctEntityInformation(object);
                    bundle.resource.push(object);
                })
            }

            await SanteDB.resources.bundle.insertAsync(bundle);
            $scope.scopedObject = await SanteDB.resources.patient.getAsync($scope.scopedObject.id, "full"); // re-fetch the patient
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

            // Correct identifiers to all be arrays
            if(n.identifier)
                Object.keys(n.identifier).forEach(function(key) {
                    if(!Array.isArray(n.identifier[key]))
                        n.identifier[key] = [n.identifier[key]];
                });
                
            // Attempt to load family relationship types
            if ($scope.panel.name == 'org.santedb.widget.patient.nok') // for NOK we want to load more data 
            {
                try {
                    $scope.familyRelationTypes = (await SanteDB.resources.concept.findAsync({ "conceptSet.mnemonic": "FamilyMember" })).resource;
                }
                catch (e) {
                    console.error(`Could not fetch family relations concept set: ${e}`);
                }

                if (n.relationship) {
                    try {

                        var displayRelationships = Object.keys(n.relationship).map(o => n.relationship[o]).flat();
                        var editRelationships = Object.keys($scope.editObject.relationship).map(o => $scope.editObject.relationship[o]).flat();
                        displayRelationships.forEach(async function (rel) {
                            if($scope.familyRelationTypes.map(o=>o.id).indexOf(rel.relationshipType) == -1) return;
                            var editRel = editRelationships.filter(o=>o.relationshipType == rel.relationshipType && o.source == rel.source && o.target == rel.target);
                            
                            if (rel.source && rel.source != n.id || rel.holder && !rel.holder == n.id) {
                                editRel[0].sourceModel = rel.sourceModel = await SanteDB.resources.entity.getAsync(rel.source || rel.holder, "full");
                                editRel[0].inverse = rel.inverse = true;
                            }
                            else //if (!rel.targetModel) 
                            {
                                editRel[0].targetModel = rel.targetModel = await SanteDB.resources.entity.getAsync(rel.target, "full");
                                editRel[0].targetModel.relationship = rel.targetModel.relationship = rel.targetModel.relationship || {};
                            }

                            if (!rel.relationshipTypeModel)
                                rel.relationshipTypeModel = await SanteDB.resources.concept.getAsync(rel.relationshipType);

                        });
                        
                    }
                    catch (e) {
                        console.error(`Cannot load family members: ${e}`)
                    }
                }
            }
            else if ($scope.panel.name == 'org.santedb.widget.patient.base') {
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
        }
    });

    /**
     * Convert the specified person (reclass it) to a full patient
     */
    $scope.convertToPatient = async function(personToConvert) {

        if(!personToConvert.$converting)
            personToConvert.$converting = true;
        else if(confirm(SanteDB.locale.getString("ui.model.reclass.confirm")))
        {
            try {
                var patient = new Patient(personToConvert);

                patient.tag = patient.tag || {};
                patient.classConcept = EntityClassKeys.Patient;
                delete(patient.classConceptModel);
                patient.tag["$sys.reclass"] = "true";
                
                var updatedPerson = await SanteDB.resources.patient.updateAsync(personToConvert.id, patient);
                personToConvert.$type = "Patient";
            }
            catch(e) {
                $rootScope.errorHandler(e);
            }
        }
    }


}]);
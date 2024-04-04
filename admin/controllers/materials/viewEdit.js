/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
angular.module("santedb").controller("MaterialViewEditController", ["$scope", "$rootScope", "$stateParams", "$timeout", "$state", function($scope, $rootScope, $stateParams, $timeout, $state) {

    const entityTemplate = new Material({
        determinerConcept: DeterminerKeys.Described,
        relationship: {
            Parent: []
        },
        name: {
            OfficialRecord: [{
                component: {
                    $other: []
                },
                use: NameUseKeys.OfficialRecord
            }],
            Assigned: [{
                component: {
                    $other: []
                },
                use: NameUseKeys.Assigned
            }]
        },
        note: [
            {
                text: ""
            }
        ],
        statusConcept: StatusKeys.Active,
    });

    async function initialize(materialId) {
        try {

            var material = null;
            if(materialId) {
                material = await SanteDB.resources.material.getAsync(materialId, "full");
            }
            else {
                material = angular.copy(entityTemplate);
                $scope.$watch("entity.typeConcept", async function(n, o) {
                    if(n && n != o) {
                        try {
                            var concept = await SanteDB.resources.concept.getAsync(n, 'min');

                            $timeout(() =>  {
                                $scope.entity._isVaccine = concept.conceptSet.find(o=>o == "ab16722f-dcf5-4f5a-9957-8f87dbb390d5") != null;
                                $scope.entity.name.OfficialRecord = [{ component: { $other: [ SanteDB.display.renderConcept(concept) ] } }];
                            });
                        }
                        catch(e){
                            console.error(e);
                        }
                    }
                })

            }

            if(material.extension && material.extension['http://santedb.org/extensions/core/targetCondition']) {
                // convert to values
                material.extension['http://santedb.org/extensions/core/targetCondition'] =
                    material.extension['http://santedb.org/extensions/core/targetCondition'].map(o=>atob(o).split('^')[1]);
            }
            var idDomains = await SanteDB.resources.identityDomain.findAsync({ scope: EntityClassKeys.Material });
            $timeout(() => {
                $scope.entity = material;
                $scope.idDomains = idDomains.resource.map(d=> {
                    if(d.validation) {
                        d._exampleValue = new RandExp(new RegExp(d.validation)).gen();
                    }
                    return d;
                });
            });
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
    }
    
    if($scope.$parent.scopedObject) { // don't reload
        $scope.entity = $scope.$parent.scopedObject;
        return;
    }
    else  {
        initialize($stateParams.id);
    }
    

    // Save the material definition to the server
    $scope.saveMaterial = async function(form) {
        if(form.$invalid) {
            return;
        }

        // Save the data
        try {
            SanteDB.display.buttonWait("#btnSaveMaterial", true);
            var submissionObject = new Material($scope.entity || $scope.editObject);
            // Prepare the object for submission
            submissionObject = await prepareEntityForSubmission(submissionObject);

            if(submissionObject.extension && submissionObject.extension['http://santedb.org/extensions/core/targetCondition']) {
                // Correct for references
                submissionObject.extension['http://santedb.org/extensions/core/targetCondition'] = 
                    submissionObject.extension['http://santedb.org/extensions/core/targetCondition'].map(ext => {
                        return btoa(`2^${ext}`);
                    });
            }

            submissionObject.note = submissionObject.note.filter(o=>o.text !== '');
            if($stateParams.id) {
                submissionObject = await SanteDB.resources.material.updateAsync($stateParams.id, submissionObject)
                submissionObject = await SanteDB.resources.material.getAsync(submissionObject.id, 'full');
                SanteDB.display.cascadeScopeObject($rootScope, ['entity', 'scopedObject'], submissionObject);
                toastr.success(SanteDB.locale.getString("ui.admin.material.save.success"));
            }
            else {
                submissionObject = await SanteDB.resources.material.insertAsync(submissionObject);
                $state.go("santedb-admin.data.material.view", {id: submissionObject.id });
            }
        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSaveMaterial", false);
        }
    }

}]);
/// <reference path="../../../core/js/santedb.js"/>
/// <reference path="../../../core/js/santedb-model.js"/>
angular.module('santedb').controller('OrganizationViewEditController', ["$scope", "$rootScope", "$stateParams", "$state", "$timeout", function ($scope, $rootScope, $stateParams, $state, $timeout) {


     // initialize the view
     async function initialize(id) {
        try {
            var place = await SanteDB.resources.organization.getAsync(id, "full");

            place.relationship = place.relationship || {};
            if(!place.relationship.Parent) {
                place.relationship.Parent = [{}]
            }
            document.title = document.title + " - " + SanteDB.display.renderEntityName(place.name);
            return place;
        }
        catch(e) {
            $rootScope.errorHandler(e);
            return null;
        }
    }

    if($scope.$parent.scopedObject) { // don't reload
        $scope.entity = $scope.$parent.scopedObject;
        return;
    }
    else if($stateParams.id) {
        initialize($stateParams.id).then((place) => {
            $timeout(() => {
                $scope.entity = place;
            });
        })
    }
    else {
        $scope.entity = new Organization({
            relationship: {
                Parent: []
            },
            name: {
                OfficialRecord: [{
                    component: {
                        $other: []
                    },
                    use: NameUseKeys.OfficialRecord
                }]
            },
            statusConcept: StatusKeys.Active,
            address: {
                PostalAddress: [
                    {
                        component: {
                            City: [],
                            Country: [],
                            State: [],
                            County: [],
                            Precinct: [],
                            StreetAddressLine: [],
                            PostalCode: [],
                            PostBox: [],
                            CareOf: []
                        },
                        use: AddressUseKeys.PostalAddress
                    }
                ]
            }
        });
    }

    
    // Save the org
    $scope.saveOrganization = async function(form) {
        if(!form.$valid) return;

        try {
            SanteDB.display.buttonWait("#saveOrgButton", true);
            
            var organization = await prepareEntityForSubmission(angular.copy($scope.entity));
            
            if(!$stateParams.id) {
                organization = await SanteDB.resources.organization.insertAsync(organization);
                toastr.success(SanteDB.locale.getString("ui.model.organization.saveSuccess"));
            }
            else {
                organization = await SanteDB.resources.organization.updateAsync($stateParams.id, organization);
                toastr.success(SanteDB.locale.getString("ui.model.organization.saveSuccess"));
            }
            $state.go("santedb-admin.data.organization.view", { id: organization.id });

        }
        catch(e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#saveOrgButton", false);
        }
    }


    // Set the active state
    $scope.setState = async function (status) {
        try {
            SanteDB.display.buttonWait("#btnSetState", true);
            await setEntityState($scope.entity.id, $scope.entity.etag, status);
            toastr.info(SanteDB.locale.getString("ui.model.organization.saveSuccess"));

            $state.reload();
            
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnSetState", false);
        }
    }

    
    // Set the active state
    $scope.setTag = async function (tagName, tagValue) {
        try {
            SanteDB.display.buttonWait("#btnClearTag", true);
            await setEntityTag($stateParams.id, tagName, tagValue);
            toastr.info(SanteDB.locale.getString("ui.model.organization.saveSuccess"));
            
            var updated = await SanteDB.resources.place.getAsync($stateParams.id, "full"); // re-fetch the place
            $timeout(() => {
                SanteDB.display.cascadeScopeObject(SanteDB.display.getRootScope($scope), ['scopedObject', 'entity'], updated);
            });
            
        }
        catch (e) {
            $rootScope.errorHandler(e);
        }
        finally {
            SanteDB.display.buttonWait("#btnClearTag", false);
        }
    }

}]);
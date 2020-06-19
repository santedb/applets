/*
 * Copyright 2015-2019 Mohawk College of Applied Arts and Technology
 * 
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
 * User: Justin Fyfe
 * Date: 2019-8-8
 */

/// <reference path="../../santedb-ui.js"/>
/// <reference path="../../../../core/js/santedb.js"/>


angular.module('santedb-lib')
    /**
     * @summary Entity Address Editing
     * @memberof Angular
     * @method addressEdit
     */
    .directive('addressEdit', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/addressEdit.html',
            scope: {
                address: '='
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {


                $scope.removeAddress = function (index) {
                    $scope.addressEdit.splice(index, 1);
                }

                $scope.addAddress = function () {
                    $scope.addressEdit.push(new EntityAddress());
                }

                // Watch for structured addresses and populate the structured address' components
                $scope.fillAddress = async function(addr) {
                    var addrComponents = (await SanteDB.resources.place.getAsync(addr.targetId)).address.Direct.component;
                    addr.component.Country = addrComponents.Country;
                    addr.component.CensusTract = addrComponents.CensusTract;
                    addr.component.County = addrComponents.County;
                    addr.component.State = addrComponents.State;
                    addr.component.Precinct = addrComponents.Precinct;
                    addr.component.City = addrComponents.City;
                    addr.component.AdditionalLocator = addrComponents.AdditionalLocator;
                }
            }],
            link: function (scope, element, attrs) {

                if (!scope.address)
                    SanteDB.resources.concept.getAsync(AddressUseKeys.HomeAddress)
                        .then(function (d) {
                            scope.addressEdit = [{ useModel: d }];
                            scope.address = {
                                "$other": scope.addressEdit
                            };
                            try {
                                scope.$apply();
                            }
                            catch (e) { }
                        })
                        .catch(function (e) { });
                else  // address exists so let's move everything over to $other
                {
                    var flatAddressList = [];
                    Object.keys(scope.address).forEach(function (key) {
                        var address = scope.address[key];
                        if (Array.isArray(address))
                            address.forEach((n) => flatAddressList.push(n));
                        else
                            flatAddressList.push(address);
                    });
                    scope.address = { "$other": flatAddressList };
                    scope.addressEdit = flatAddressList;
                }
            }
        }
    }])
    /**
    * @summary Entity Name Editing
    * @memberof Angular
    * @method nameEdit
    */
    .directive('nameEdit', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/nameEdit.html',
            scope: {
                name: '=',
                simpleName: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                $scope.removeName = function (index) {
                    $scope.nameEdit.splice(index, 1);
                }

                $scope.addName = function () {
                    $scope.nameEdit.push(new EntityName());
                }

            }],
            link: function (scope, element, attrs) {

                if (!scope.name)
                    SanteDB.resources.concept.getAsync(NameUseKeys.Legal)
                        .then(function (d) {
                            scope.nameEdit = [{ useModel: d }];
                            scope.name = {
                                "$other": scope.nameEdit
                            };
                            try {
                                scope.$apply();
                            }
                            catch (e) { }
                        })
                        .catch(function (e) { });
                else  // Name exists so let's move everything over to $other
                {
                    var flatNameList = [];
                    Object.keys(scope.name).forEach(function (key) {
                        var name = scope.name[key];
                        if (Array.isArray(name))
                            name.forEach((n) => flatNameList.push(n));
                        else
                            flatNameList.push(name);
                    });
                    scope.name = { "$other": flatNameList };
                    scope.nameEdit = flatNameList;
                }
            }
        }
    }])
    /**
    * @summary Entity Telecom Editing
    * @memberof Angular
    * @method telecomEdit
    */
    .directive('telecomEdit', ['$rootScope', function ($rootScope) {

        var keys = Object.keys(TelecomAddressUseKeys);
        keys.push("NullFlavor-NoInformation");
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/telecomEdit.html',
            scope: {
                telecom: '='
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {


            }],
            link: function (scope, element, attrs) {

                if (!scope.telecom)
                    scope.telecom = {};

                keys.forEach((k) => {
                    if (!scope.telecom[k])
                        scope.telecom[k] = {};
                    if (!scope.telecom[k].type)
                        scope.telecom[k].type = /^mailto:.*$/i.test(scope.telecom[k].value) ? "c1c0a4e9-4238-4044-b89b-9c9798995b93" : "c1c0a4e9-4238-4044-b89b-9c9798995b99";

                    if (scope.telecom[k].value)
                        scope.telecom[k].editValue = scope.telecom[k].value.replace(/(tel:|mailto:)/i, '');
                });

                scope.$watch((s) => Object.keys(s.telecom).map((o) => s.telecom[o].editValue).join(";"), function (n, o) {
                    Object.keys(scope.telecom).forEach((k) => {
                        if (scope.telecom[k].editValue)
                            switch (scope.telecom[k].type) {
                                case "c1c0a4e9-4238-4044-b89b-9c9798995b93":
                                    scope.telecom[k].value = "mailto:" + scope.telecom[k].editValue;
                                    break;
                                default:
                                    scope.telecom[k].value = "tel:" + scope.telecom[k].editValue;
                                    break;
                            }
                    });
                })
            }
        }
    }])
    /**
    * @summary Entity Identifier
    * @memberof Angular
    * @method identifierEdit
    */
    .directive('identifierEdit', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/identifierEdit.html',
            scope: {
                identifier: '=',
                editForm: '<',
                containerClass: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                $scope.removeIdentifier = function (domain) {
                    if (confirm(SanteDB.locale.getString("ui.model.entity.identifier.authority.remove.confirm")))
                        delete ($scope.identifier[domain]);
                }

                $scope.addIdentifier = function (newId) {
                    if ($scope.editForm.$invalid || !$scope.authorities[newId.authority.domainName]) return;

                    newId.authority = $scope.authorities[newId.authority.domainName];
                    $scope.identifier[newId.authority.domainName] = [angular.copy(newId)];
                    delete ($scope.authorities[newId.authority.domainName]);
                    delete(newId.authority);
                    delete(newId.value);

                }

                $scope.generateId = function (idDomain) {
                    var authority = idDomain.authority;
                    if (!authority.generator)
                        authority = $scope.authorities[idDomain.authority.domainName];
                    try {
                        idDomain.value = authority.generator();
                    } catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }
            }],
            link: function (scope, element, attrs) {

                if (!scope.identifier)
                    scope.identifier = {};

                scope.authorities = {};

                Object.keys(scope.identifier).forEach(function (key) { 
                    if(!Array.isArray(scope.identifier[key]))
                        scope.identifier[key] = [scope.identifier[key]];
                    
                    scope.identifier[key].forEach(function(v) { v.readonly = true; }); 
                });
                // Get a list of identity domains available for our scope and emit them to the identifier array
                SanteDB.resources.assigningAuthority.findAsync({ scope: scope.containerClass })
                    .then(function (bundle) {
                        if (bundle.resource) {
                            bundle.resource.forEach(function (authority) {

                                authority.generator = SanteDB.application.getIdentifierGenerator(authority.domainName);
                                if (scope.identifier[authority.domainName]) {
                                    scope.identifier[authority.domainName].forEach(v=>v.authority = authority);
                                    delete (scope.identifier[authority.domainName].readonly)
                                }
                                else if (!authority.assigningApplication || authority.assigningAuthority == $rootScope.session.claim.appid)
                                    scope.authorities[authority.domainName] = authority;


                            });

                        }

                        try { scope.$apply(); }
                        catch (e) { }
                    })
                    .catch(function (e) { console.error(e); });
            }
        }
    }])
    /**
    * @summary Administrative relationship editing
    * @memberof Angular
    * @method adminRelationEdit
    */
    .directive('adminRelationEdit', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/adminRelationEdit.html',
            scope: {
                relationship: '=',
                containerClass: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                $scope.adminRelationTypes = {
                    Caregiver : {
                        applyTo: [ EntityClassKeys.Patient, EntityClassKeys.Person ],
                        entityType: "Organization",
                        filter: { classConcept: [ EntityClassKeys.Organization ], statusConcept: StatusKeys.Active },
                        multiple : true
                    },
                    Citizen: {
                        applyTo: [ EntityClassKeys.Patient, EntityClassKeys.Person ],
                        entityType: "Place",
                        filter: { classConcept: [ EntityClassKeys.Country ], statusConcept: StatusKeys.Active },
                        multiple : true
                    },
                    CoverageSponsor : {
                        applyTo: [ EntityClassKeys.Patient ],
                        entityType: "Organization",
                        filter: { classConcept: [ EntityClassKeys.Organization ], statusConcept: StatusKeys.Active },
                        multiple : true // TODO: Add insurance or sponsor
                    },
                    DedicatedServiceDeliveryLocation : {
                        applyTo: [ EntityClassKeys.Patient ],
                        entityType: "Place",
                        filter: { classConcept: [ EntityClassKeys.ServiceDeliveryLocation ], statusConcept: StatusKeys.Active } 
                    },
                    Employee : {
                        applyTo: [ EntityClassKeys.Patient, EntityClassKeys.Person ],
                        entityType: "Organization",
                        filter: { classConcept: [ EntityClassKeys.Organization ], statusConcept: StatusKeys.Active },
                        multiple : true
                    },
                    HealthcareProvider : {
                        applyTo: [ EntityClassKeys.Patient ],
                        entityType: "Entity",
                        filter: { classConcept: [ EntityClassKeys.Organization, EntityClassKeys.Provider ], "industryConcept.mnemonic": "Industry-HealthDelivery", statusConcept: StatusKeys.Active },
                        multiple : true
                    },
                    Student : {
                        applyTo: [ EntityClassKeys.Patient ],
                        entityType: "Organization",
                        filter: { statusConcept: StatusKeys.Active } // TODO: Filter on industry code
                    }
                }

              
            }],
            link: function (scope, element, attrs) {


            }
        }
    }]);
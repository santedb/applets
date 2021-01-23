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
                address: '=',
                noAdd: '<',
                noType: '<',
                simpleEntry: '<',
                isRequired: '<',
                ownerForm: '<',
                controlPrefix: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {


                $scope.removeAddress = function (index) {
                    $scope.addressEdit.splice(index, 1);
                }

                $scope.addAddress = function () {
                    $scope.addressEdit.push(new EntityAddress());
                }

                // Watch for structured addresses and populate the structured address' components
                $scope.fillAddress = async function (addr) {
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

                if (!scope.controlPrefix)
                    scope.controlPrefix = '';

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

                        if (!address.useModel || !address.useModel.id)
                            SanteDB.resources.concept.findAsync({ mnemonic: key })
                                .then(function (bundle) {
                                    if (bundle.resource && bundle.resource.length > 0)
                                        address.useModel = bundle.resource[0];
                                });

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
                simpleName: '<',
                noAdd: '<',
                noType: '<',
                simpleEntry: '<',
                isRequired: '<',
                ownerForm: '<',
                controlPrefix: '<'
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

                // Scan and find the form to which this belongs
                if (!scope.controlPrefix)
                    scope.controlPrefix = '';

                // Flatten name
                var flattenName = function() {
                    bound = true;
                    var flatNameList = [];
                    Object.keys(scope.name).forEach(function (key) {
                        var name = scope.name[key];

                        if (!name.useModel || !name.useModel.id)
                            SanteDB.resources.concept.findAsync({ mnemonic: key })
                                .then(function (bundle) {
                                    if (bundle.resource && bundle.resource.length > 0)
                                        name.useModel = bundle.resource[0];
                                });

                        if (Array.isArray(name))
                            name.forEach((n) => flatNameList.push(n));
                        else
                            flatNameList.push(name);
                    });

                    if(scope.simpleEntry)
                        flatNameList = [ flatNameList[0] ] ; // simple entry, only edit first name

                        scope.nameEdit = flatNameList;
                        scope.name = { "$other": flatNameList };

                }

                if (!scope.name)
                    SanteDB.resources.concept.getAsync(NameUseKeys.Legal)
                        .then(function (d) {
                            scope.nameEdit = [{ useModel: d }];
                            scope.name = {
                                "$other": scope.nameEdit
                            };
                        })
                        .catch(function (e) { });
                else  // Name exists so let's move everything over to $other
                {
                    flattenName();
                }

                scope.$watch("name", function (n, o) {
                    if (n && !n.$other) {
                        flattenName();
                    }
                })
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
        // are there settings which prevent a type of edit from ocurring
        try {
            keys = keys.filter(o => 
                !($rootScope && 
                $rootScope.system && 
                $rootScope.system.config && 
                $rootScope.system.config.application && 
                $rootScope.system.config.application.setting && 
                $rootScope.system.config.application.setting[`forbid.patient.telecom.${o}`]));
        }
        catch(e) {
            console.warn(e);
        }
        keys.push("NullFlavor-NoInformation");
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/telecomEdit.html',
            scope: {
                telecom: '=',
                singleEdit: '<',
                ownerForm: '<',
                noLabel: '<'
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
    .directive('identifierListEdit', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/identifierListEdit.html',
            scope: {
                identifier: '=',
                ownerForm: '<',
                containerClass: '<',
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                $scope.removeIdentifier = function (domain) {
                    if (confirm(SanteDB.locale.getString("ui.model.entity.identifier.authority.remove.confirm")))
                        delete ($scope.identifier[domain]);
                }

                $scope.addIdentifier = function (newId) {
                    if ($scope.ownerForm.$invalid || !$scope.authorities[newId.authority.domainName]) return;

                    newId.authority = $scope.authorities[newId.authority.domainName];
                    $scope.identifier[newId.authority.domainName] = [angular.copy(newId)];
                    delete ($scope.authorities[newId.authority.domainName]);
                    delete (newId.authority);
                    delete (newId.value);

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
                    if (!Array.isArray(scope.identifier[key]))
                        scope.identifier[key] = [scope.identifier[key]];

                    scope.identifier[key].forEach(function (v) { v.readonly = true; });
                });
                // Get a list of identity domains available for our scope and emit them to the identifier array
                SanteDB.resources.assigningAuthority.findAsync({ scope: scope.containerClass })
                    .then(function (bundle) {
                        if (bundle.resource) {
                            bundle.resource.forEach(function (authority) {

                                authority.generator = SanteDB.application.getIdentifierGenerator(authority.domainName);
                                if (scope.identifier[authority.domainName]) {
                                    scope.identifier[authority.domainName].forEach(v => v.authority = authority);
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
    * @summary Entity Identifier
    * @memberof Angular
    * @method identifierEdit
    */
    .directive('identifierEdit', ['$rootScope', function ($rootScope) {

        var authorities;

        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/identifierEdit.html',
            scope: {
                identifier: '=',
                ownerForm: '<',
                containerClass: '<',
                noDomain: '<',
                isRequired: '<',
                removeFn: '<',
                addFn: '<',
                noScan: '<',
                noLabel: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                $scope.generateId = function () {
                    var authority = $scope.identifier.authority;
                    if (!authority.generator)
                        authority = $scope.authorities[authority.domainName];
                    try {
                        $scope.identifier.value = authority.generator();
                    } catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }

                $scope.scanId = async function () {
                    try {
                        var data = await SanteDB.application.scanBarcodeAsync();

                        // Is there a parser?
                        var parser = SanteDB.application.getIdentifierParser($scope.identifier.authority.domainName);
                        if(parser)
                            data = parser(data);
                        $scope.identifier.value = data;
                        try { $scope.$apply(); }
                        catch (e) { }
                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }
            }],
            link: function (scope, element, attrs) {

                //var hintRegex = 
                if (!scope.identifier)
                    scope.identifier = new EntityIdentifier();

                if(!scope.identifier.id)
                    scope.identifier.id = SanteDB.application.newGuid();

                // Get a list of identity domains available for our scope and emit them to the identifier array
                if (!authorities) {
                    authorities = {};
                    SanteDB.resources.assigningAuthority.findAsync({ scope: scope.containerClass })
                        .then(function (bundle) {
                            if (bundle.resource) {
                                bundle.resource.forEach(function (authority) {
                                    authority.generator = SanteDB.application.getIdentifierGenerator(authority.domainName);
                                    if (!authority.assigningApplication || authority.assigningAuthority == $rootScope.session.claim.appid) {
                                        authorities[authority.domainName] = authority;

                                        if(authority.validation) {
                                            var rExp = new RandExp(new RegExp(authority.validation));
                                            var hint = rExp.gen();
                                            hint = hint.replace(/[A-Z]/g, 'A').replace(/[0-9]/g,'9').replace(/[a-z]/g,'a');
                                            authorities[authority.domainName].validationHint = hint;
                                        }
                                    }
                                });
                            }
                            scope.authorities = authorities;
                            try { scope.$apply(); }
                            catch (e) { }
                        })
                        .catch(function (e) { console.error(e); });
                }
                else {
                    scope.authorities = authorities;
                }
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
                    Caregiver: {
                        applyTo: [EntityClassKeys.Patient, EntityClassKeys.Person],
                        entityType: "Organization",
                        filter: { classConcept: [EntityClassKeys.Organization], statusConcept: StatusKeys.Active },
                        multiple: true
                    },
                    Citizen: {
                        applyTo: [EntityClassKeys.Patient, EntityClassKeys.Person],
                        entityType: "Place",
                        filter: { classConcept: [EntityClassKeys.Country], statusConcept: StatusKeys.Active },
                        multiple: true
                    },
                    CoverageSponsor: {
                        applyTo: [EntityClassKeys.Patient],
                        entityType: "Organization",
                        filter: { classConcept: [EntityClassKeys.Organization], statusConcept: StatusKeys.Active },
                        multiple: true // TODO: Add insurance or sponsor
                    },
                    DedicatedServiceDeliveryLocation: {
                        applyTo: [EntityClassKeys.Patient],
                        entityType: "Place",
                        filter: { classConcept: [EntityClassKeys.ServiceDeliveryLocation], statusConcept: StatusKeys.Active }
                    },
                    Employee: {
                        applyTo: [EntityClassKeys.Patient, EntityClassKeys.Person],
                        entityType: "Organization",
                        filter: { classConcept: [EntityClassKeys.Organization], statusConcept: StatusKeys.Active },
                        multiple: true
                    },
                    HealthcareProvider: {
                        applyTo: [EntityClassKeys.Patient],
                        entityType: "Entity",
                        filter: { classConcept: [EntityClassKeys.Organization, EntityClassKeys.Provider], "industryConcept.mnemonic": "Industry-HealthDelivery", statusConcept: StatusKeys.Active },
                        multiple: true
                    },
                    Student: {
                        applyTo: [EntityClassKeys.Patient],
                        entityType: "Organization",
                        filter: { statusConcept: StatusKeys.Active } // TODO: Filter on industry code
                    }
                }


            }],
            link: function (scope, element, attrs) {


            }
        }
    }]);
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
     * 
     * @param {EntityAddress} address The address which is the be edited by this control
     * @param {boolean} noAdd When true, don't allow for adding of new addresses to the address collection
     * @param {boolean} noType When true, dont display the type of address selection
     * @param {boolean} simpleEntry When true, only allow simple entry (text boxes only)
     * @param {boolean} isRequired When true, the fields in the address will be marked as required
     * @param {form} ownerForm The angular form which hosts this control
     * @param {string} controlPrefix The prefix to add to all inputs which allow validation and access by other JavaScript
     * @example
     * <form novalidate="novalidate" name="myForm">
     *      <address-edit address="scopedObject.address" no-add="true" no-type="false" simple-entry="true" 
     *          owner-form="myForm" />
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


                $scope.removeAddress = function (addr) {
                    addr.operation = BatchOperationType.Delete;
                }

                $scope.addAddress = function () {
                    var newAddr = new EntityAddress({ 
                        id: SanteDB.application.newGuid() ,
                        component: {
                            Country: [],
                            State: [],
                            City: [],
                            County: [],
                            Precinct: [],
                            StreetAddressLine: [],
                            PostalCode: []
                        }
                    });
                    $scope.addressEdit.push(newAddr);
                    $scope.address["$other"].push(newAddr);
                }

                // Watch for structured addresses and populate the structured address' components
                $scope.fillAddress = async function (addr) {
                    var addrComponents = (await SanteDB.resources.place.getAsync(addr.targetId)).address.PhysicalVisit.component;
                    addr.component.Country = addrComponents.Country || [];
                    addr.component.CensusTract = addrComponents.CensusTract || [];
                    addr.component.County = addrComponents.County || [];
                    addr.component.State = addrComponents.State || [];
                    addr.component.Precinct = addrComponents.Precinct || [];
                    addr.component.City = addrComponents.City || [];
                    addr.component.AdditionalLocator = addrComponents.AdditionalLocator || [];
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
                    var flatAddressList = scope.address.$other || [];
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
                    //scope.address = { "$other": flatAddressList };
                    scope.addressEdit = flatAddressList;
                    scope.address["$other"] = scope.address["$other"] || [];
                }
            }
        }
    }])
    /**
     * 
     */
    .directive('geoEdit', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/geoEdit.html',
            scope: {
                geo: '=',
                isRequired: '<',
                ownerForm: '<',
                controlPrefix: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

            }],
            link: function (scope, element, attrs) {

                // Scan and find the form to which this belongs
                if (!scope.controlPrefix)
                    scope.controlPrefix = '';

                if (!scope.geo) {
                    scope.geo = new GeoTag({
                        lat: 0,
                        lng: 0
                    });
                }

            }
        }
    }])
    /**
    * @summary Allows for the editing of a name
    * @memberof Angular
    * @method nameEdit
    * @param {EntityName} name The name which is the be edited by this control
     * @param {boolean} noAdd When true, don't allow for adding of new names to the names collection
     * @param {boolean} noType When true, dont display the type of names selection
     * @param {boolean} simpleEntry When true, only allow simple entry (text boxes for first name part of first name only)
     * @param {boolean} isRequired When true, the fields in the name will be marked as required
     * @param {form} ownerForm The angular form which hosts this control
     * @param {string} controlPrefix The prefix to add to all inputs which allow validation and access by other JavaScript
     * @param {string} allowedComponents The allowed name components that should be displayed. Separate multiple components by comma. Valid values are prefix, given, family, suffix, $other.
     * @example
      * <form novalidate="novalidate" name="myForm">
     *      <name-edit name="scopedObject.name" no-add="true" no-type="false" simple-entry="true" 
     *          owner-form="myForm" allowed-components="given,family" />
     */
    .directive('nameEdit', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/nameEdit.html',
            scope: {
                name: '=',
                noAdd: '<',
                noType: '<',
                simpleEntry: '<',
                isRequired: '<',
                ownerForm: '<',
                controlPrefix: '<',
                inputStyle: '<',
                allowedComponents: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                $scope.removeName = function (name) {
                    name.operation = BatchOperationType.Delete;
                }

                $scope.addName = function () {
                    var newName = new EntityName(
                    { 
                        component: {
                            Given: [],
                            Family: [],
                            Prefix: [],
                            Suffix: [],
                            $other: []
                        },
                        id: SanteDB.application.newGuid()
                    });
                    $scope.nameEdit.push(newName);
                    $scope.name["$other"].push(newName);
                }

                $scope.isComponentAllowed = function (component) {
                    console.info(component);
                    return $scope.allowedComponents.indexOf(component) > -1;
                }

            }],
            link: function (scope, element, attrs) {

                // Scan and find the form to which this belongs
                if (!scope.controlPrefix)
                    scope.controlPrefix = '';

                if (!scope.allowedComponents || scope.allowedComponents === '' || scope.allowedComponents === ' ') {
                    scope.allowedComponents = "prefix,given,family,suffix"; //Default for compatability.
                }

                // Flatten name
                var flattenName = function () {
                    bound = true;
                    var flatNameList = [];
                    Object.keys(scope.name).forEach(function (key) {
                        var name = scope.name[key];

                        if ((!name.useModel || !name.useModel.id) && key != "$other")
                            SanteDB.resources.concept.findAsync({ mnemonic: key })
                                .then(function (bundle) {
                                    if (bundle.resource && bundle.resource.length > 0) {
                                        name.forEach(n=>n.useModel = bundle.resource[0]);
                                    }
                                });

                        if (Array.isArray(name))
                            name.forEach((n) => flatNameList.push(n));
                        else
                            flatNameList.push(name);
                    });

                    if (scope.simpleEntry && scope.noAdd)
                        flatNameList = [flatNameList[0]]; // simple entry, only edit first name

                    scope.nameEdit = flatNameList;
                    scope.name["$other"] = scope.name["$other"] || [];
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
                });
                
            }
        }
    }])
    /**
    * @summary Entity Telecom Editing
    * @memberof Angular
    * @method telecomEdit
    * @param {Telecom} telecom The telecommunications address which is being edited
    * @param {bool} singleEdit When true, only allow editing of a single telecom address
    * @param {form} ownerForm The name of the form which owns this input 
    * @param {boolean} noLabel When true, don't display labels on each address type 
    * @example
    *   <form name="myForm" novalidate="novalidate">
    *       <telecom-edit telecom="scopedObject.telecom" single-edit="false" owner-form="myForm" />
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
        catch (e) {
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
                        scope.telecom[k] = [];
                    if (!scope.telecom[k][0])
                        scope.telecom[k].push({});
                    if (!scope.telecom[k][0].type)
                        scope.telecom[k][0].type = /^mailto:.*$/i.test(scope.telecom[k][0].value) ? "c1c0a4e9-4238-4044-b89b-9c9798995b93" : "c1c0a4e9-4238-4044-b89b-9c9798995b99";

                    if (scope.telecom[k][0].value)
                        scope.telecom[k][0].editValue = scope.telecom[k][0].value.replace(/(tel:|mailto:)/i, '');
                });

                scope.$watch((s) => Object.keys(s.telecom).map((o) => s.telecom[o][0].editValue).join(";"), function (n, o) {
                    Object.keys(scope.telecom).forEach((k) => {
                        if (scope.telecom[k][0].editValue)
                            switch (scope.telecom[k][0].type) {
                                case "c1c0a4e9-4238-4044-b89b-9c9798995b93":
                                    scope.telecom[k][0].value = "mailto:" + scope.telecom[k][0].editValue;
                                    break;
                                default:
                                    scope.telecom[k][0].value = "tel:" + scope.telecom[k][0].editValue;
                                    break;
                            }
                    });
                })
            }
        }
    }])
    /**
    * @summary Entity Identifier edit control as a collection
    * @memberof Angular
    * @method identifierEdit
    * @param {EntityIdentifier} identifier The identifier collection to be edited
    * @param {form} ownerForm The form which owns this
    * @param {UUID} containerClass The classifier which should be used to filter the identity domains in the edit list
    * @example
    *   <form name="myForm" novalidate="novalidate">
    *       <identifier-list-edit identifier="scopedObject.identifier" owner-form="myForm"
    *           container-class="scopedObject.classConcept" />
    */
    .directive('identifierListEdit', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
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
                    if (confirm(SanteDB.locale.getString("ui.model.entity.identifier.authority.remove.confirm", {domain: domain}))) {
                        //delete ($scope.identifier[domain]);
                        $scope.identifier[domain].forEach(o=> o.operation = BatchOperationType.Delete );
                    }
                }

                $scope.addIdentifier = function (newId) {
                    if ($scope.ownerForm.$invalid || !$scope.authorities[newId.domainModel.domainName]) return;

                    newId.domainModel = $scope.authorities[newId.domainModel.domainName];
                    newId.operation = BatchOperationType.Insert;
                    $scope.identifier[newId.domainModel.domainName] = $scope.identifier[newId.domainModel.domainName] || [];
                    $scope.identifier[newId.domainModel.domainName].push(angular.copy(newId));
                    delete (newId.authority);
                    delete (newId.value);
                    delete (newId.domainModel);

                }

                $scope.generateId = function (idDomain) {
                    var authority = idDomain.authority;
                    if (!authority.generator)
                        authority = $scope.authorities[idDomain.domainModel.domainName];
                    try {
                        idDomain.value = authority.generator();
                    } catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }
            }],
            link: function (scope, element, attrs) {

                var identifier = {};
                if (scope.identifier)
                    identifier = scope.identifier;

                scope.identifier = identifier;
                var authorities = {};
                scope.authorities = authorities;

                Object.keys(identifier).forEach(function (key) {
                    if (!Array.isArray(identifier[key]))
                        identifier[key] = [identifier[key]];
                    identifier[key].forEach(function (v) { v.readonly = true; });
                });
                // Get a list of identity domains available for our scope and emit them to the identifier array
                SanteDB.resources.identityDomain.findAsync()
                    .then(function (bundle) {
                        if (bundle.resource) {
                            bundle.resource.filter(o => o.scope == null || o.scope.length == 0 || o.scope.indexOf(scope.containerClass) > -1).forEach(function (authority) {

                                authority.generator = SanteDB.application.getIdentifierGenerator(authority.domainName);
                                if (identifier[authority.domainName]) {
                                    identifier[authority.domainName].forEach(v => v.authority = authority);
                                }
                                if (!authority.assigningApplication || authority.identityDomain == $rootScope.session.claim.appid)
                                {
                                    authorities[authority.domainName] = authority;
                                    if(identifier[authority.domainName]) 
                                    {
                                        identifier[authority.domainName].forEach(i=>i.readonly = false);
                                    }
                                }

                            });
                        }

                        // $timeout(() => {
                        //     scope.identifier = identifier;
                        //     scope.authorities = authorities;
                        // });

                    })
                    .catch(function (e) { console.error(e); });
            }
        }
    }])
    /**
    * @summary Entity Identifier edit for a single identifier
    * @memberof Angular
    * @method identifierEdit
    * @param {EntityIdentifier} identifier The identifier to edit
    * @param {form} ownerForm The form which owns this control (used for validation)
    * @param {UUID} containerClass The classification code which identifier domains must belong to
    * @param {boolean} noDomain When true, don't show an identity domain selector
    * @param {boolean} isRequired When true, indicate that the inputs should be required
    * @param {boolean} noScan When true, don't show the QR code / identity scanner
    * @param {boolean} noLabel When true, don't show labels on the inputs
    * @example 
    *   <form name="myForm" novalidate="novalidate">
    *       <identifier-edit identifier="scopedObject.identifier[NID]"
    *           owner-form="myForm"
    *           container-class="scopedObject.classConcept"
    *           no-scan="true" />
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
                        if (parser)
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

                if (!scope.identifier.id)
                    scope.identifier.id = SanteDB.application.newGuid();

                // Get a list of identity domains available for our scope and emit them to the identifier array
                if (!authorities) {
                    authorities = {};
                    SanteDB.resources.identityDomain.findAsync({ scope: scope.containerClass })
                        .then(function (bundle) {
                            if (bundle.resource) {
                                bundle.resource.forEach(function (authority) {
                                    authority.generator = SanteDB.application.getIdentifierGenerator(authority.domainName);
                                    if (!authority.assigningApplication || authority.identityDomain == $rootScope.session.claim.appid) {
                                        authorities[authority.domainName] = authority;

                                        if (authority.validation) {
                                            var rExp = new RandExp(new RegExp(authority.validation));
                                            var hint = rExp.gen();
                                            hint = hint.replace(/[A-Z]/g, 'A').replace(/[0-9]/g, '9').replace(/[a-z]/g, 'a');
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
    * @param {EntityRelationship} relationship The relationship instance to edit.
    * @param {string} containerClass The type of relationship entity to search for.
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




            }],
            link: function (scope, element, attrs) {
                // The types of relationships which are used to drive the inputs for lookup
                scope.adminRelationTypes = {
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

            }
        }
    }])
    /**
     * @summary Service Schedule Editor
     * @memberof Angular
     * @method scheduleEdit
     * @param {string} schedule The JSON schedule to be edited.
     */
    .directive('scheduleEdit', ['$rootScope', function ($rootScope) {

        let days = {
            sunday: 0,
            monday: 1,
            tuesday: 2,
            wednesday: 3,
            thursday: 4,
            friday: 5,
            saturday: 6
        };

        let daykeys = Object.keys(days);

        const toInternalModel = function (serviceSchedule) {

            let model = {};

            if (serviceSchedule && serviceSchedule.schedule && serviceSchedule.schedule.forEach) {
                daykeys.forEach((day, idx) => {
                    let scheduleelement = serviceSchedule.schedule.filter(se => (se && se.days && se.days.indexOf && se.days.indexOf(days[day]) > -1));
                    
                    if (scheduleelement && scheduleelement.length > 0) {
                        model[day] = {
                            start: scheduleelement[0].start,
                            stop: scheduleelement[0].stop,
                            capacity: scheduleelement[0].capacity
                        };
                    }
                    else {
                        model[day] = {
                            start: null,
                            stop: null,
                            capacity: null
                        };
                    }
                });
            }
            else {
                daykeys.forEach(day => model[day] = { start: '', stop: '', capacity: 0 });
            }

            return model;
        };

        const toServiceSchedule = function (model) {
            if (typeof model === 'undefined') {
                return {};
            }
            
            var schedule = [];

            daykeys.forEach((day, idx) => {
                let d = model[day];

                if (!d || !d.start || !d.stop || !d.capacity){
                    return;
                }

                schedule.push({
                    days: [days[day]],
                    start: d.start,
                    stop: d.stop,
                    capacity: d.capacity
                });
            });

            return {
                schedule
            };
        }

        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/scheduleEdit.html',
            scope: {
                jsonSchedule: '='
            },
            controller: ['$scope', '$rootScope', '$window', function ($scope, $rootScope, $win) {

            }],
            link: function (scope, element, attrs) {
                scope.model = toInternalModel(JSON.parse(scope.jsonSchedule ? scope.jsonSchedule : "{}"));

                scope.$watch((s) => s ? JSON.stringify(s.model) : "null", function(n, o){
                    scope.jsonSchedule = JSON.stringify(toServiceSchedule(scope.model));
                });
            }
        }
    }]);
/*
 * Copyright (C) 2021 - 2024, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
 * Portions Copyright (C) 2015-2018 Mohawk College of Applied Arts and Technology
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
 * User: fyfej
 * Date: 2023-5-19
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
     *      <address-edit model="scopedObject.address" no-add="true" no-type="false" simple-entry="true" 
     *          owner-form="myForm" />
     */
    .directive('addressEdit', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/addressEdit.html',
            scope: {
                model: '=',
                noAdd: '<',
                noType: '<',
                simpleEntry: '<',
                isRequired: '<',
                ownerForm: '<',
                controlPrefix: '<',
                requiredTypes: '<',
                catchmentAreaFor: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {


                $scope.removeAddress = function (addr) {
                    addr.operation = BatchOperationType.Delete;
                }

                $scope.addAddress = function () {
                    var newAddr = new EntityAddress({
                        id: SanteDB.application.newGuid(),
                        component: {
                            Country: [],
                            State: [],
                            City: [],
                            County: [],
                            Precinct: [],
                            StreetAddressLine: [],
                            PostalCode: [],
                            PostBox: [],
                            CareOf: [],
                            UnitIdentifier: [],
                            _AddressPlaceRef: []
                        }
                    });
                    $scope.addressEdit.push(newAddr);
                    $scope.model["$other"].push(newAddr);
                }

            }],
            link: function (scope, element, attrs) {

                scope.controlPrefix = scope.controlPrefix || attrs.name;

                if (!scope.model) {
                    scope.model = {
                        HomeAddress: [new EntityAddress({
                            component: {
                                Country: [],
                                State: [],
                                County: [],
                                Precinct: [],
                                City: [],
                                PostBox: [],
                                UnitIdentifier: [],
                                AddressLine: [],
                                CareOf: [],
                                AdditionalLocator: [],
                                _AddressPlaceRef: []
                            }
                        })]
                    };
                }

                //else  // address exists so let's move everything over to $other
                //{
                var flatAddressList = scope.model.$other || [];
                Object.keys(scope.model).filter(key => key != "$other").forEach(function (key) {
                    var address = scope.model[key];

                    if ((!address.useModel || !address.useModel.id) && key != '$other')
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

                flatAddressList.forEach(a => {
                    a.component = a.component || {};
                    a.component.Country = a.component.Country || [],
                        a.component.State = a.component.State || [],
                        a.component.City = a.component.City || [],
                        a.component.County = a.component.County || [],
                        a.component.Precinct = a.component.Precinct || [],
                        a.component.StreetAddressLine = a.component.StreetAddressLine || [],
                        a.component.PostalCode = a.component.PostalCode || [],
                        a.component.PostBox = a.component.PostBox || [],
                        a.component.CareOf = a.component.CareOf || [],
                        a.component.UnitIdentifier = a.component.UnitIdentifier || [],
                        a.component._AddressPlaceRef = a.component._AddressPlaceRef || []
                })
                //scope.address = { "$other": flatAddressList };


                scope.addressEdit = flatAddressList;
                scope.model["$other"] = scope.model["$other"] || [];
                //}
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
                model: '=',
                isRequired: '<',
                ownerForm: '<',
                controlPrefix: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                $scope.$watch((s) => s.geo.lat + s.geo.lng, function (n, o) {
                    if (n != o && n && o) {
                        delete ($scope.geo.id); // force a change
                    }
                })
            }],
            link: function (scope, element, attrs) {

                scope.controlPrefix = scope.controlPrefix || attrs.name;
                if (!scope.model) {
                    scope.model = { _supplied: false };
                }
                else {
                    scope.model._supplied = true;
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
                model: '=',
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
                    $scope.model["$other"].push(newName);
                }

                $scope.isComponentAllowed = function (component) {
                    console.info(component);
                    return $scope.allowedComponents.indexOf(component) > -1;
                }

            }],
            link: function (scope, element, attrs) {

                scope.controlPrefix = scope.controlPrefix || attrs.name;
                if (!scope.allowedComponents || scope.allowedComponents === '' || scope.allowedComponents === ' ') {
                    scope.allowedComponents = "prefix,given,family,suffix"; //Default for compatability.
                }


                // Flatten name
                var flattenName = function () {
                    bound = true;
                    var flatNameList = scope.model.$other || [];
                    Object.keys(scope.model).filter(key => key != "$other").forEach(function (key) {
                        var name = scope.model[key];

                        if ((!name.useModel || !name.useModel.id) && key != "$other")
                            SanteDB.resources.concept.findAsync({ mnemonic: key })
                                .then(function (bundle) {
                                    if (bundle.resource && bundle.resource.length > 0) {
                                        name.forEach(n => n.useModel = bundle.resource[0]);
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
                    scope.model["$other"] = scope.model["$other"] || [];
                }

                if (!scope.model) {
                    scope.model = {
                        OfficialRecord: [
                            new EntityName(
                                {
                                    component: {
                                        Given: [],
                                        Family: [],
                                        Prefix: [],
                                        Suffix: [],
                                        $other: []
                                    },
                                    id: SanteDB.application.newGuid()
                                })
                        ]
                    };
                }

                flattenName();

                scope.$watch("model", function (n, o) {
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
                model: '=',
                singleEdit: '<',
                ownerForm: '<',
                noLabel: '<',
                allowedTypes: '<',
                controlPrefix: '<',
                requiredTypes: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {


            }],
            link: function (scope, element, attrs) {

                scope.controlPrefix = scope.controlPrefix || attrs.name;
                if (!scope.controlPrefix)
                    scope.controlPrefix = attrs.name || '';

                if (!scope.model)
                    scope.model = {};

                keys.forEach((k) => {
                    if (!scope.model[k])
                        scope.model[k] = [];
                    if (!scope.model[k][0])
                        scope.model[k].push({});
                    if (!scope.model[k][0].type)
                        scope.model[k][0].type = /^mailto:.*$/i.test(scope.model[k][0].value) ? "c1c0a4e9-4238-4044-b89b-9c9798995b93" : "c1c0a4e9-4238-4044-b89b-9c9798995b99";

                    if (scope.model[k][0].value)
                        scope.model[k][0].editValue = scope.model[k][0].value.replace(/(tel:|mailto:)/i, '');
                });

                scope.$watch((s) => Object.keys(s.model).map((o) => (s.model[o][0].editValue || s.model[o][0].value)).join(";"), function (n, o) {
                    Object.keys(scope.model).forEach((k) => {
                        if (scope.model[k][0].editValue) {
                            switch (scope.model[k][0].type) {
                                case "c1c0a4e9-4238-4044-b89b-9c9798995b93":
                                    scope.model[k][0].value = "mailto:" + scope.model[k][0].editValue;
                                    break;
                                default:
                                    scope.model[k][0].value = "tel:" + scope.model[k][0].editValue;
                                    break;
                            }
                        } else if(scope.model[k][0].value){
                            scope.model[k][0].editValue = scope.model[k][0].value.replace(/(tel:|mailto:)/i, '');

                        }
                    });
                })
            }
        }
    }])
    /**
    * @summary Entity Identifier edit control as a collection represented in a table
    * @memberof Angular
    * @method identifierEdit
    * @param {EntityIdentifier} identifier The identifier collection to be edited
    * @param {form} ownerForm The form which owns this
    * @param {UUID} containerClass The classifier which should be used to filter the identity domains in the edit list
    * @example
    *   <form name="myForm" novalidate="novalidate">
    *       <identifier-table-edit identifier="scopedObject.identifier" owner-form="myForm"
    *           container-class="scopedObject.classConcept" />
    */
    .directive('identifierTableEdit', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/identifierTableEdit.html',
            scope: {
                model: '=',
                ownerForm: '<',
                containerClass: '<',
                noAdd: '<',
                controlPrefix: '<'
            },
            controller: ['$scope', '$rootScope', function ($scope, $rootScope) {

                $scope.newId = {};

                $scope.removeIdentifier = function (domain) {
                    if (confirm(SanteDB.locale.getString("ui.model.entity.identifier.authority.remove.confirm", { domain: domain }))) {
                        //delete ($scope.model[domain]);
                        $scope.model[domain].forEach(o => o.operation = BatchOperationType.Delete);
                    }
                }

                $scope.addIdentifier = function (newId) {
                    if ($scope.ownerForm.$invalid || !$scope.authorities[newId.domainModel.domainName]) return;

                    newId.domainModel = $scope.authorities[newId.domainModel.domainName];
                    newId.operation = BatchOperationType.Insert;
                    $scope.model[newId.domainModel.domainName] = $scope.model[newId.domainModel.domainName] || [];
                    $scope.model[newId.domainModel.domainName].push(angular.copy(newId));
                    delete (newId.authority);
                    delete (newId.value);
                    delete (newId.domainModel);

                }

                $scope.generateId = function (idDomain) {
                    var authority = idDomain;
                    if (!authority.generator)
                        authority = $scope.authorities[idDomain.domainModel.domainName];
                    try {
                        var generated = authority.generator();
                        $scope.newId.value = generated.value;
                        $scope.newId.checkDigit = generated.checkDigit;
                    } catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }
            }],
            link: function (scope, element, attrs) {
                scope.controlPrefix = scope.controlPrefix || attrs.name;

                var identifier = {};
                if (scope.model)
                    identifier = scope.model;

                scope.model = identifier;
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
                                if (!authority.assigningApplication || authority.identityDomain == $rootScope.session.claim.appid) {
                                    authorities[authority.domainName] = authority;
                                    if (identifier[authority.domainName]) {
                                        identifier[authority.domainName].forEach(i => i.readonly = false);
                                    }
                                }

                            });
                        }

                        $timeout(() => {
                            scope.model = identifier;
                            scope.authorities = authorities;
                        });

                    })
                    .catch(function (e) { console.error(e); });
            }
        }
    }])
    .directive('identifierListEdit', ["$rootScope", "$timeout", function ($rootScope, $timeout) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: "./org.santedb.uicore/directives/identifierListEdit.html",
            scope: {
                model: '=',
                ownerForm: '<',
                containerClass: '<',
                noScan: '<',
                onScanId: '<',
                allowedDomains: '<',
                requiredDomains: '<',
                controlPrefix: '<',
                createMode: '<'
            },
            controller: ["$scope", function ($scope) {

                // Validate checkdigit
                $scope.validateCheckDigit = function (domain, index) {
                    if (domain._customValidator) {
                        var result = domain._customValidator($scope.model[domain.domainName][index]);
                        $scope.ownerForm[($scope.controlPrefix || '') + 'id' + domain.domainName + index].$setValidity('checkDigit', result);
                    }
                }

                // Generate an id
                $scope.generateId = function (domain, index) {
                    if (!domain._generator)
                        return;
                    try {
                        var generated = domain._generator();
                        $scope.model[domain.domainName][index].value = generated.value;
                        $scope.model[domain.domainName][index].checkDigit = generated.checkDigit;
                    } catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }

                $scope.scanId = async function (domain, index) {
                    try {
                        var data = await SanteDB.application.scanBarcodeAsync();

                        // Is there a parser?
                        if (domain._parser)
                            data = domain._parser(data);

                        if ($scope.onScanId) {
                            await $scope.onScanId(domain, data);
                        }
                        $timeout(() => {
                            if (data.value) {
                                $scope.model[domain.domainName][index].value = data.value;
                                $scope.model[domain.domainName][index].checkDigit = data.checkDigit;
                            }
                            else {
                                $scope.model[domain.domainName][index].value = data;
                            }
                        });
                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }

            }],
            link: function (scope, element, attrs) {

                scope.controlPrefix = scope.controlPrefix || attrs.name;

                // Scope identifier
                var identifier = scope.model = scope.model || {};

                async function initializeView() {
                    try {
                        var idDomains = await SanteDB.resources.identityDomain.findAsync();
                        idDomains.resource = idDomains.resource || []; // For not found conditions

                        // Get the identity domain generator
                        idDomains = idDomains.resource
                            .filter(o => !o.scope || o.scope.length == 0 || o.scope.indexOf(scope.containerClass) > -1)
                            .map(domain => {
                                domain._generator = SanteDB.application.getIdentifierGenerator(domain.domainName);
                                domain._parser = SanteDB.application.getIdentifierParser(domain.domainName);
                                domain._assignable = !domain.assigningApplication || domain.identityDomain == $rootScope.session.claim.appid;
                                domain._customValidator = SanteDB.application.getCheckDigitValidator(domain.checkDigitAlgorithm || domain.customValidator);

                                // Is there a validator?
                                if (domain.validation) {
                                    var rExp = new RandExp(new RegExp(domain.validation));
                                    var hint = rExp.gen();
                                    hint = hint.replace(/[A-Z]/g, 'A').replace(/[0-9]/g, '9').replace(/[a-z]/g, 'a');
                                    domain._validationHint = hint;
                                }

                                identifier[domain.domainName] = identifier[domain.domainName] || [{}];
                                // Create a newid
                                return domain;
                            }).sort((a, b) => a.domainName < b.domainName ? -1 : 1);

                        $timeout(s => scope.idDomains = idDomains);
                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }

                initializeView();
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
                model: '=',
                ownerForm: '<',
                containerClass: '<',
                noDomain: '<',
                isRequired: '<',
                noScan: '<',
                noLabel: '<'
            },
            controller: ['$scope', '$rootScope', '$timeout', function ($scope, $rootScope, $timeout) {

                $scope.generateId = function () {
                    var authority = $scope.model.authority;
                    if (!authority.generator)
                        authority = $scope.authorities[authority.domainName];
                    try {
                        var generated = authority.generator();
                        $scope.model.value = generated.value;
                        $scope.model.checkDigit = generated.checkDigit;
                    } catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }

                $scope.scanId = async function () {
                    try {
                        var data = await SanteDB.application.scanBarcodeAsync();

                        // Is there a parser?
                        var parser = SanteDB.application.getIdentifierParser($scope.model.authority.domainName);
                        if (parser)
                            data = parser(data);

                        $timeout(() => {
                            if (data.value) {
                                $scope.model.value = data.value;
                                $scope.model.checkDigit = data.checkDigit;
                            }
                            else {
                                $scope.model.value = data;
                            }
                        });
                    }
                    catch (e) {
                        $rootScope.errorHandler(e);
                    }
                }
            }],
            link: function (scope, element, attrs) {

                //var hintRegex = 
                if (!scope.model)
                    scope.model = new EntityIdentifier();

                if (!scope.model.id)
                    scope.model.id = SanteDB.application.newGuid();

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
                            start: moment(scheduleelement[0].start).toDate(),
                            stop: moment(scheduleelement[0].stop).toDate(),
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

                if (!d || !d.start || !d.stop) {
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
                scheduleFor: '='
            },
            controller: ['$scope', '$rootScope', '$window', function ($scope, $rootScope, $win) {

            }],
            link: function (scope, element, attrs) {
                scope.model = toInternalModel(JSON.parse(scope.scheduleFor.serviceSchedule ? scope.scheduleFor.serviceSchedule : "{}"));
                scope.$watch((s) => JSON.stringify(s.model), function (n, o) {
                    scope.scheduleFor.serviceSchedule = JSON.stringify(toServiceSchedule(scope.model));
                });
            }
        }
    }]);
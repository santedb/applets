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

/// <reference path="../../core/js/santedb.js"/>
/// <reference path="./santedb-ui.js"/>

angular.module('santedb-lib')
    /**
     * @method i18n
     * @memberof Angular
     * @summary Renders a localized string
     */
    .filter('i18n', function () {
        return function (value, parmObject) {
            return SanteDB.locale.getString(value, parmObject);
        }
    })
   
     /**
     * @method rightEllipsis
     * @memberof Angular
     * @summary Shows the rightmost n characters prefixing an elipsis 
     * @param {number} nCharacters The number of characters to show
     * @example
     *      <div class="col-md-2">{{ identifier.authority.name | rightEllipsis: 20 }}</div>
     */
    .filter('rightEllipsis', function () {
        return function (modelValue, nCharacters) {
            nCharacters = nCharacters || 20;
            if(modelValue.length < nCharacters)
                return modelValue;
            else {
                return `...${modelValue.substring(modelValue.length - nCharacters)}`;
            }
        };
    })
     /**
     * @method leftEllipsis
     * @memberof Angular
     * @summary Shows the leftmost n characters prefixing an elipsis 
     * @param {number} nCharacters The number of characters to show
     * @example
     *      <div class="col-md-2">{{ identifier.authority.name | leftEllipsis: 20 }}</div>
     */
    .filter('leftEllipsis', function () {
        return function (modelValue, nCharacters) {
            nCharacters = nCharacters || 20;
            if(modelValue.length < nCharacters)
                return modelValue;
            else {
                return `${modelValue.substring(0, nCharacters)}...`;
            }
        };
    })
    /**
     * @method identifier
     * @memberof Angular
     * @summary Renders a model value which is an EntityIdentifier in a standard way
     * @see {SanteDBModel.EntityIdentifier}
     * @example
     *      <div class="col-md-2">{{ patient.identifier | identifier }}</div>
     */
    .filter('identifier', function () {
        return function (modelValue, domain) {
            return SanteDB.display.renderIdentifier(modelValue, domain);
        };
    })
    /**
     * @method concept
     * @memberof Angular
     * @summary Renders a model concept into a standard display using the concept's display name
     * @see {SanteDBModel.Concept}
     * @example
     *      <div class="col-md-2">Gender:</div>
     *      <div class="col-md-2">{{ patient.genderConceptModel | concept }}</div>
     */
    .filter('concept', function () {
        return function (modelValue) {
            return SanteDB.display.renderConcept(modelValue);
        }
    })
    /**
     * @method refTerm
     * @memberof Angular
     * @summary Renders a model refTerm into a standard display using the term's display name
     * @see {SanteDBModel.Concept}
     * @example
     *      <div class="col-md-2">Gender:</div>
     *      <div class="col-md-2">{{ patient.genderConceptModel | refTerm }}</div>
     */
    .filter('refTerm', function () {
        return function (modelValue) {
            return SanteDB.display.renderConcept(modelValue);
        }
    })
    /**
     * @method base64decode
     * @memberof Angular
     * @summary Decode 
     */
     .filter('base64decode', function() {
        return function(modelValue) {
            return atob(modelValue);
        }
    })
    /**
     * @method name
     * @memberof Angular
     * @summary Renders an entity name to the display
     * @see {SanteDBModel.EntityName}
     * @param {string} nameType The type of name to render if the name is an array of names
     * @example
     *      <div class="col-md-2">Common Name:</div>
     *      <div class="col-md-2">{{ patient.name | name: 'OfficialRecord' }}</div>
     */
    .filter('name', function () {
        return function (modelValue, type) {
            return SanteDB.display.renderEntityName(modelValue, type);
        }
    })
    /**
     * @method nameType
     * @memberof Angular
     * @summary Renders an entity name type concept to the display
     * @param {string} type The type of name to render if the name is an array of names
     * @see {SanteDBModel.EntityName}
     */
    .filter('nameType', function () {
        return function (modelValue, type) {

            var candidateKey = Object.keys(modelValue)[0];
            var name = modelValue[candidateKey];
            if(type)
                name = modelValue[type];

            if(name.useModel)
                return SanteDB.display.renderConcept(name.useModel);
            else if(name.$type) 
                return candidateKey;
            return 'TODO';
        }
    })
    /**
     * @method address
     * @memberof Angular
     * @summary Renders an entity address to the display
     * @see {SanteDBModel.EntityAddress}
     * @param {string} type The type of address to render if the name is an array of names
     * @example
     *      <div class="col-md-2">Home Address:</div>
     *      <div class="col-md-2">{{ patient.address | address: 'Home' }}</div>
     */
    .filter('address', function () {
        return function (modelValue, type) {
            return SanteDB.display.renderEntityAddress(modelValue, type);
        }
    })
    /**
     * @method extDate
     * @memberof Angular
     * @summary Renders an extended date with a specified precision
     * @param {string} precision The precision of the date to render
     * @example
     *      <div class="col-md-2">Date Of Birth:</div>
     *      <div class="col-md-2">{{ patient.dateOfBirth | extDate: patient.dateOfBirthPrecision }}</div>
     */
    .filter('extDate', function () {
        return function (date, precision) {
            return SanteDB.display.renderDate(date, precision);
        }
    })
    /**
     * @method age
     * @memberof Angular
     * @summary Renders the age from the date
     * @param {string} display The age to display (let this choose)
     */
    .filter('age', function () {
        return function (date, display, other) {

            var source = other ? moment(other) : moment();
            var diff = source.diff(date, 'days');
            if(display == 'D' || diff < 45)
                return diff + ' ' + SanteDB.locale.getString('ui.model.patient.age.suffix.daysOld');
            diff = source.diff(date, 'months');
            if(display == 'M' || diff < 18)
                return diff + ' ' + SanteDB.locale.getString('ui.model.patient.age.suffix.monthsOld');
            return source.diff(date, 'years') + ' ' + SanteDB.locale.getString('ui.model.patient.age.suffix.yearsOld');
        }
    })
    /**
     * @method dotNetType
     * @memberof Angular
     * @summary Renders a .NET assembly qualified name
     */
    .filter('dotNetType', function () {
        return function (aqm) {
            if(!aqm)
                return '';
            else 
            {
                var aqmPattern = /^([A-Za-z0-9\.]*?),\s?([A-Za-z0-9\.]*?),?\s?.*$/i;
                var aqmMatch = aqmPattern.exec(aqm);
                if(aqmMatch !== null)
                    aqm = aqmMatch[1]; // Get full name
                aqm = aqm.substring(aqm.lastIndexOf('.') + 1);
                return aqm;                
            }
        }
    })
    /**
     * @method rawValueSummary
     * @memberof Angular
     * @summary Renders a raw value summary
     */
    .filter('rawValueSummary', function () {
        return function (v) {
            
            if(Array.isArray(v))
                return `[${(v[0] || {}).$type}] - size = ${v.length}`;
            else if(v.value)
                return v.value;
            else if(v.$type)
                return `${v.$type}`;
            else 
                return v;
        }
    })
    /**
     * @method exception
     * @memberof Angular
     * @summary Renders exception data
     */
    .filter('exceptionType', function () {
        return function (v) {
            
            // Is there a server exception?
            var parseResult = SanteDB.application.parseException(v);

            if(parseResult.rules && parseResult.rules.length > 0)
                return parseResult.rules[0].text;
            else 
                return parseResult.$type;
        }
    })
    /**
     * @method exceptionDetail
     * @memberof Angular
     * @summary Renders exception details
     */
    .filter('exceptionDetail', function () {
        return function (v) {
            
            var rawValue = atob(v);
            // Is there a server exception?
            var parseResult = SanteDB.application.parseException(rawValue);

            if(parseResult.rules && parseResult.rules.length > 0)
                return parseResult.rules[0].text;
            else 
                return parseResult.message;
        }
    })
    /**
     * @method geo
     * @memberof Angular
     * @summary Renders a decimal representation of a geographic coordinate as a degrees/minutes
     */
    .filter('geo', function () {
        return function (geo) {
            
            var lat = SanteDB.display.convertToDegrees(geo.lat);
            var lng = SanteDB.display.convertToDegrees(geo.lng);
            
            return `${lat.deg}\xB0 ${lat.min}' ${lat.sec}" ${geo.lat < 0 ? 'S' : 'N'} / ${lng.deg}\xB0 ${lng.min}' ${lng.sec}" ${geo.lng < 0 ? 'W' : 'E'} ` 
        }
    })
    /**
     * @method scheduleJson
     * @memberof Angular
     * @summary Renders a structured JSON schedule into text
     */
    .filter('scheduleJson', function() {

        var dayStrings = [
            'ui.date.day.sunday',
            'ui.date.day.monday',
            'ui.date.day.tuesday',
            'ui.date.day.wednesday',
            'ui.date.day.thursday',
            'ui.date.day.friday',
            'ui.date.day.saturday'
        ];

        return function (sched) {
            
            if(typeof sched === 'string') 
            {
                sched = JSON.parse(sched);
            }
            
            if(sched.schedule) {
                sched = sched.schedule;
            }

            if(sched.length == 0) {
                return SanteDB.locale.getString("ui.unknown");
            }
            else {
                return sched.map(o=> `${SanteDB.locale.getString(dayStrings[o.days[0]])} ${moment(o.start).format('HH:mm')} - ${moment(o.stop).format('HH:mm')}` + (o.capacity ? ` (max: ${o.capacity})` : '')).join(' , ');
            }
        }
    });
    
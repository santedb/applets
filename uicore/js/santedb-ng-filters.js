/// <reference path="../../core/js/santedb.js"/>
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

/// <reference path="./santedb-ui.js"/>

angular.module('santedb-lib')
    /**
     * @method i18n
     * @memberof Angular
     * @summary Renders a localized string
     */
    .filter('i18n', function () {
        return function (value) {
            return SanteDB.locale.getString(value);
        }
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
            if (modelValue === undefined)
                return "";
            if (domain && modelValue[domain])
                return modelValue[domain].value;
            else
                for (var k in modelValue)
                    return modelValue[k].value;
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
            var dateFormat;

            if(!SanteDB.locale.dateFormats)
                SanteDB.resources.locale.findAsync().then(function (locale) {
                    var localeAsset = locale[SanteDB.locale.getLocale()];
                    if(localeAsset)
                        localeAsset.forEach(function (l) {
                            $.getScript(l);
                        });
                }).catch(function (e) {
                   console.error(e);
                });
                
            switch (precision) {
                case 1:   // Year     "Y"
                case 'Y':
                    dateFormat = SanteDB.locale.dateFormats.year;
                    break;
                case 2:   // Month    "m"
                case 'm':
                    dateFormat = SanteDB.locale.dateFormats.month;
                    break;
                case 3:   // Day      "D"
                case 'D':
                    dateFormat = SanteDB.locale.dateFormats.day;
                    break;
                case 4:   // Hour     "H"
                case 'H':
                    dateFormat = SanteDB.locale.dateFormats.hour;
                    break;
                case 5:   // Minute   "M"
                case 'M':
                    dateFormat = SanteDB.locale.dateFormats.minute;
                    break;
                case 6:   // Second   "S"
                case 'S':
                case 0:   // Full     "F"
                case 'F':
                default:
                    dateFormat = SanteDB.locale.dateFormats.second;
                    break;
            }

            if (date) {
                // Non timed
                switch (dateFormat) {
                    case 1:   // Year, Month, Day always expressed in UTC for Javascript will take the original server value and adjust.
                    case 'Y':
                    case 2:
                    case 'm':
                    case 3:
                    case 'D':
                        return moment(date).utc().format(dateFormat);
                    default:
                        return moment(date).format(dateFormat);
                }
            }

            return null;
        }
    });
    
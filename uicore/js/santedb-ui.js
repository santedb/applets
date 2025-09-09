/// <reference path="../../core/js/santedb.js"/>
/*
 * Copyright (C) 2021 - 2025, SanteSuite Inc. and the SanteSuite Contributors (See NOTICE.md for full copyright notices)
 * Portions Copyright (C) 2019 - 2021, Fyfe Software Inc. and the SanteSuite Contributors
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
 */
var ___originalButtonTexts = {};

// Add render of concept name
SanteDBWrapper.prototype.display = new function () {

    var __preferredName = "OfficialRecord";

    function __cascadeScopeObject(scope, objectNames, value, processList) {

        // Make sure we don't double process
        processList = processList || [];
        if (processList.indexOf(scope.$id) > -1) {
            return;
        }
        processList.push(scope.$id);

        objectNames.forEach(n => {
            if (scope[n] !== undefined) {
                scope[n] = value;
            }
        });

        // Traverse siblings
        if (scope.$$nextSibling) {
            __cascadeScopeObject(scope.$$nextSibling, objectNames, value, processList);
        }

        // Traverse children
        if (scope.$$childHead) {
            __cascadeScopeObject(scope.$$childHead, objectNames, value, processList);
        }
    }


    /**
     * @summary Sets the preferred name type for rendering names
     * @param {string} nameType The name type preferred
     */
    this.setPreferredNameType = function (nameType) {
        __preferredName = nameType;
    }

    /**
     * 
     * @param {*} date The date for the age computation
     * @param {*} otherDate The other date for the age computation
     * @param {*} units The units (M or D)
     * @returns The formatted age
     */
    this.renderAge = function (date, otherDate, units) {

        var source = otherDate ? moment(otherDate) : moment();
        var diff = source.diff(date, 'days');
        if (units == 'D' || diff < 45)
            return diff + ' ' + SanteDB.locale.getString('ui.model.patient.age.suffix.daysOld');
        diff = source.diff(date, 'months');
        if (units == 'M' || diff < 18)
            return diff + ' ' + SanteDB.locale.getString('ui.model.patient.age.suffix.monthsOld');
        return source.diff(date, 'years') + ' ' + SanteDB.locale.getString('ui.model.patient.age.suffix.yearsOld');
    };

    /**
     * @method
     * @summary Render one or more entity telecom values
     * @param {Object} telecomValue The telecom value or collection of telecoms
     */
    this.renderEntityTelecom = function(telecomValue) {
        const telRegex = /^(?:tel:)?(.*)$/i;
        if(telecomValue.value) // simple telecom 
        {
            return telRegex.exec(telecomValue)[1];
        }
        else if(typeof telecomValue === "string")
        {
            return telecomValue;
        }
        else {
            var firstKey = Object.keys(telecomValue);
            return telecomValue[firstKey].map(o => telRegex.exec(o.value)[1]).join(" / ");
        }
    }
    /**
     * @method
     * @memberof SanteDBWrapper.display
     * @summary Replaces the content of the button with a defined wait state
     * @param {String} target The target of the wait button
     * @param {boolean} state True if the object is loading, false if not
     * @param {boolean} onlyGlyph True if only a wait glyph should be shown
     */
    this.buttonWait = function (target, state, onlyGlyph) {
        var btn = $(target);
        if (btn) {
            if (state) {
                btn.attr('disabled', 'disabled');
                if (!___originalButtonTexts[target])
                    ___originalButtonTexts[target] = btn.html();
                if (!onlyGlyph)
                    btn.html(`<i class="fas fa-circle-notch fa-spin"></i> ${SanteDB.locale.getString("ui.wait")}`);
                else
                    btn.html('<i class="fas fa-circle-notch fa-spin"></i>');
            }
            else {
                btn.removeAttr('disabled');

                btn.html(___originalButtonTexts[target]);
                delete (___originalButtonTexts[target]);
            }
        }
    };
    /**
     * @method
     * @memberof SanteDBWrapper.display
     * @summary Renders a date in the specified format
     * @param {Date} date The date to be rendered
     * @param {String} precision The precision of the date
     * @param {boolean} inHumanFormat True if the date should be in human format
     */
    this.renderDate = function (date, precision, inHumanFormat) {
        var dateFormat;

        if (date && date !== "" && !(date instanceof Date)) {
            date = new Date(date);
        }
        if (!SanteDB.locale.dateFormats) {
            SanteDB.resources.locale.findAsync().then(function (locale) {
                var localeAsset = locale[SanteDB.locale.getLocale()];
                if (localeAsset)
                    localeAsset.forEach(function (l) {
                        $.getScript(l);
                    });
            }).catch(function (e) {
                console.error(e);
            });
        }

        var root = inHumanFormat ? SanteDB.locale.dateFormats.human || SanteDB.locale.dateFormats : SanteDB.locale.dateFormats;
        switch (precision) {
            case 1:   // Year     "Y"
            case 'Y':
                dateFormat = root.year;
                break;
            case 2:   // Month    "m"
            case 'm':
                dateFormat = root.month;
                break;
            case 3:   // Day      "D"
            case 'D':
                dateFormat = root.day;
                break;
            case 4:   // Hour     "H"
            case 'H':
                dateFormat = root.hour;
                break;
            case 5:   // Minute   "M"
            case 'M':
                dateFormat = root.minute;
                break;
            case 6:   // Second   "S"
            case 'S':
            case 0:   // Full     "F"
            case 'F':
            default:
                dateFormat = root.second;
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
    };
    /**
     * @method
     * @memberof SanteDBWrapper.display
     * @summary Renders the specified concept name
     * @returns The appropriate display name for the concept
     * @param {SanteDBModel.Concept} concept The concept to be rendered
     */
    this.renderConcept = function (concept) {
        var retVal = "";
        if (!concept)
            retVal = "";
        else if (typeof (concept) === "string")
            retVal = concept;
        else if (concept.name && concept.name[SanteDB.locale.getLanguage()])
            retVal = concept.name[SanteDB.locale.getLanguage()];
        else if (concept.name)
            retVal = concept.name[Object.keys(concept.name)[0]];
        else if (concept.mnemonic)
            retVal = concept.mnemonic;
        else if (concept[SanteDB.locale.getLanguage()])
            retVal = concept[SanteDB.locale.getLanguage()];
        else
            retVal = concept[Object.keys(concept)[0]];

        if (Array.isArray(retVal)) {
            var name = retVal[0];
            return name[0].toUpperCase() + name.substring(1);
        }
        else
            return retVal;
    };
    /**
     * @method
     * @member SanteDBWrapper.display
     * @summary Renders an entity or act identifier
     * @param {EntityIdentifier} id The identifier to be rendered
     * @param {String} domain The domain to render
     * @param {boolean} emitDomain True if the domain in which the identifier belongs should be emitted
     */
    this.renderIdentifier = function (id, domain, emitDomain) {
        var retVal = "";
        if (id === undefined)
            return "";
        if (domain && id[domain])
            retVal = id[domain][0].value;
        else
            for (var k in id) {
                retVal = id[k][0].value;
                domain = k;
                break;
            }

        if (emitDomain) {
            retVal += ` <small>${domain}</small>`;
        }

        return retVal;
    };
    /**
     * @method
     * @memberof SanteDBWrapper.display
     * @summary Renders the specified entity name
     * @returns The appropriate display name for the entity
     * @param {SanteDBModel.EntityName} name The name of the entity to render
     * @param {string} type The type of name to render (Legal, Official Record, etc.)
     */
    this.renderEntityName = function (name, type) {

        if (!name)
            return "";
        else if (typeof (name) === "string")
            return name;
        // Get the type of name to render
        if (type) {
            name = name[type];
        }
        else if (name[__preferredName])
            name = name[__preferredName];
        else if (!name.component) {
            name = name[Object.keys(name)[0]]
        }

        // Is the name actually an array? If so, take the first
        if (Array.isArray(name))
            name = name[0];

        // Render name
        if (!name)
            return "";
        else if (name.component) {
            var nameStr = "";

            // Prefix?
            if (name.component.Prefix) {
                if (name.component.Prefix.join)
                    nameStr += name.component.Prefix.join(" ");
                else
                    nameStr += name.component.Prefix;
                nameStr += " ";

            }
            // Given names
            if (name.component.Given) {
                if (name.component.Given.join)
                    nameStr += name.component.Given.join(" ");
                else
                    nameStr += name.component.Given;
                nameStr += " ";
            }
            // Family names
            if (name.component.Family) {
                if (name.component.Family.join)
                    nameStr += name.component.Family.join(" ");
                else
                    nameStr += name.component.Family;
                nameStr += " ";
            }
            // Suffix?
            if (name.component.Suffix) {
                if (name.component.Suffix.join)
                    nameStr += name.component.Suffix.join(" ");
                else
                    nameStr += name.component.Suffix;
                nameStr += " ";
            }
            // Other
            if (name.component.$other !== undefined) {
                if (name.component.$other.join)
                    nameStr += name.component.$other.join(' ');
                else if (name.component.$other.value)
                    nameStr += name.component.$other.value;
                else
                    nameStr += name.component.$other;
            }
            return nameStr;
        }
        else if (typeof (name) === 'string')
            return name;
        else
            return "N/A";
    },
        /**
         * @method
         * @memberof SanteDBWrapper.display
         * @summary Renders the specified entity address
         * @returns The appropriate display address for the entity
         * @param {SanteDBModel.EntityAddress} address The address of the entity to render
         * @param {string} type The type of name to render (Legal, Official Record, etc.)
         */
        this.renderEntityAddress = function (address, type) {

            if (!address)
                return "N/A";
            if (type)
                address = address[type];
            else if (!address.component)
                address = address[Object.keys(address)[0]]

            // Is the address actually an array? If so, take the first
            if (Array.isArray(address))
                address = address[0];

            // Render address
            if (!address)
                return "";
            else if (address.component) {
                var addrStr = "";
                if (address.component.CareOf)
                    addrStr += `C/O ${address.component.CareOf}, `;
                if (address.component.PostBox)
                    addrStr += `P.O. Box ${address.component.PostBox}, `;
                if (address.component.AdditionalLocator)
                    addrStr += address.component.AdditionalLocator + ", ";
                if (address.component.UnitIdentifier)
                    addrStr += address.component.UnitIdentifier + ", ";
                if (address.component.StreetAddressLine)
                    addrStr += address.component.StreetAddressLine + ", ";
                if (address.component.AddressLine)
                    addrStr += address.component.AddressLine + ", ";
                if (address.component.Precinct)
                    addrStr += address.component.Precinct + ", ";
                if (address.component.City)
                    addrStr += address.component.City + ", ";
                if (address.component.County != null)
                    addrStr += address.component.County + ", ";
                if (address.component.State != null)
                    addrStr += address.component.State + ", ";
                if (address.component.Country != null)
                    addrStr += address.component.Country + ", ";

                return addrStr.substring(0, addrStr.length - 2);
            }
        };



    /**
     * @method
     * @memberof SanteDB.display
     * @param {Patient} patient The patient to be rendered as a string
     * @param {String} preferredDomain The preferred identity domain for identity rendering
     */
    this.renderPatientAsString = function (patient, preferredDomain) {
        var retVal = '';

        retVal += "<span class='mr-1'>";
        if (patient.name) {
            retVal += SanteDB.display.renderEntityName(patient.name);
        }

        retVal += "</span><span class='mr-1 badge badge-secondary'>";

        if (patient.identifier) {
            if (preferredDomain && patient.identifier[preferredDomain])
                retVal += `<i class="fas fa-id-card"></i> ${SanteDB.display.renderIdentifier(patient.identifier, preferredDomain)}`;
            else {
                var key = Object.keys(patient.identifier)[0];
                retVal += `<i class="far fa-id-card"></i> ${SanteDB.display.renderIdentifier(patient.identifier, key)}`;
            }
        }

        retVal += "</span><span class='mr-1'>";

        if (patient.dateOfBirth)
            retVal += `<br/><i class='fas fa-birthday-cake'></i> ${SanteDB.display.renderDate(patient.dateOfBirth, patient.dateOfBirthPrecision)} `;
        // Deceased?
        if (patient.deceasedDate)
            retVal += `<span class='badge badge-dark'>${SanteDB.locale.getString("ui.model.patient.deceasedIndicator")}</span>`;

        retVal += "</span><span class='mr-1'>";

        // Gender
        if (patient.genderConceptModel) {
            switch (patient.genderConceptModel.mnemonic) {
                case 'Male':
                    retVal += `<i class='fas fa-male' title="${SanteDB.display.renderConcept(patient.genderConceptModel)}"></i> ${SanteDB.display.renderConcept(patient.genderConceptModel)}`;
                    break;
                case 'Female':
                    retVal += `<i class='fas fa-female' title="${SanteDB.display.renderConcept(patient.genderConceptModel)}"></i> ${SanteDB.display.renderConcept(patient.genderConceptModel)}`;
                    break;
                default:
                    retVal += `<i class='fas fa-restroom' title="${SanteDB.display.renderConcept(patient.genderConceptModel)}"></i> ${SanteDB.display.renderConcept(patient.genderConceptModel)}`;
                    break;
            }
        }
        retVal += "</span>";

        if (patient.address) {
            retVal += "<br/><span class='mr-1'><i class='fas fa-fw fa-house'></i> ";
            retVal += SanteDB.display.renderEntityAddress(patient.address);
            retVal += "</span>";
        }

        if (patient.determinerConcept == "6b1d6764-12be-42dc-a5dc-52fc275c4935") {
            retVal += `<span class='badge badge-success' title='${SanteDB.locale.getString("ui.mdm.rot")}'><i class='fas fa-gavel'></i> </span>`
        }
        return retVal;
    };


    /**
     * @method
     * @memberof SanteDB.display
     * @param {Guid} statusConcept The status concept to render
     * @returns {string} The HTML rendering of the status concept
     */
    this.renderStatus = function (statusConcept) {
        switch (statusConcept) {
            case StatusKeys.Active:
                return `<span class="badge badge-primary"><i class="fas fa-circle"></i> ${SanteDB.locale.getString('ui.state.active')}</span>`;
            case StatusKeys.Obsolete:
                return `<span class="badge badge-danger"><i class="fas fa-circle"></i> ${SanteDB.locale.getString('ui.state.obsolete')}</span>`;
            case StatusKeys.Nullified:
                return `<span class="badge badge-dark"><i class="fas fa-circle"></i> ${SanteDB.locale.getString('ui.state.nullified')}</span>`;
            case StatusKeys.New:
                return `<span class="badge badge-info"><i class="fas fa-circle"></i> ${SanteDB.locale.getString('ui.state.new')}</span>`;
            case StatusKeys.Inactive:
                return `<span class="badge badge-warning"><i class="fas fa-circle"></i> ${SanteDB.locale.getString('ui.state.inactive')}</span>`;

        }
    }

    /**
     * 
     * @param {number} decimal The degrees expressed as a decimal
     * @returns {Object} A structure with degrees, minutes, and seconds
     */
    this.convertToDegrees = function (decimal) {
        return {
            deg: 0 | (decimal < 0 ? (decimal = -decimal) : decimal),
            min: 0 | (((decimal += 1e-9) % 1) * 60),
            sec: (0 | (((decimal * 60) % 1) * 6000)) / 100,
        };
    }

    /**
     * 
     * @param {*} scope The scope to traverse up the scope tree for
     * @returns The root scope on the tree
     */
    this.getRootScope = function (scope) {
        while (scope.$parent) {
            scope = scope.$parent;
        }
        return scope;
    }



    /**
     * 
     * @param {*} scope The scope to traverse up the scope tree for
     * @returns The root scope on the tree
     */
    this.getRootScope = function (scope) {
        while (scope.$parent) {
            scope = scope.$parent;
        }
        return scope;
    }

    /**
     * @summary Render a date difference
     * @param {Date} date1 The date which serves as the source date
     * @param {Date} date2 The date on which the date1 is to be differenced
     * @param {string} units The units (days, weeks, etc.)
     * @param {string} prefix The UI prefix
     */
    this.renderDateDifference = function (date1, date2, units, prefix) {

        var diff = null, suffix = null;
        switch (units) {
            case 'h':
                diff = date2.diff(date1, 'minutes');
                suffix = `${prefix}.hours`;
                break;
            case 'D':
                diff = date2.diff(date1, 'days');
                suffix = `${prefix}.days`;
                break;
            case 'M':
                diff = date2.diff(date1, 'months');
                suffix = `${prefix}.months`;
                break;
            case 'Y':
                diff = date2.diff(date1, 'years');
                suffix = `${prefix}.years`;
                break;
            case 'm':
                diff = date2.diff(date1, 'minutes');
                suffix = `${prefix}.minutes`;
                break;
            default:
                ___uomprec.forEach(p => {
                    var pdf = date2.diff(date1, p);
                    if (pdf > 0) {
                        diff = pdf;
                        suffix = `${prefix}.${p}`;
                    }
                });

        }
        return `${diff} ${SanteDB.locale.getString(suffix)}`;

    }

    /**
     * @method
     * @summary Iterates up the parent scope via scope.$parent until {see: nameOfVariable} is encountered
     * @param {*} scope The Angular scope that is in the current controller
     * @param {string} nameOfVariable The name of the variable to fetch from the scope
     * @returns {object} The object with nameOfVariable
     */
    this.getParentScopeVariable = function (scope, nameOfVariable) {
        var retVal = null;
        do {
            retVal = scope[nameOfVariable] || scope.$eval(nameOfVariable);
            scope = scope.$parent;
        } while (!retVal && scope)
        return retVal;
    }

    /**
     * @method
     * @summary Copies an object scross scopes (useful for updating all objects)
     * @param {*} scope The angularJS scope to cascade the object to
     * @param {*} objectNames The names to propogate on the scope 
     * @param {*} value The value to set on the @param objectNames
     */
    this.cascadeScopeObject = function (scope, objectNames, value) {
        // Ensure objects are an array
        if (!Array.isArray(objectNames)) {
            objectNames = [objectNames];
        }
        __cascadeScopeObject(scope, objectNames, value, []);
    }

};


// Set the sticky style
function attachStickyScrollEvent() {

    var contentWrapper = $(".content-wrapper");

    if (contentWrapper.length) {
        contentWrapper.scroll(() => {
            $(".scroll-sticky").each((i, ele) => {
                if (CSS.supports && CSS.supports('position', 'sticky')) {
                    var cOfs = ele.getBoundingClientRect().top;
                    var cwOfs = contentWrapper[0].getBoundingClientRect().top;
                    var stuck = (cOfs - cwOfs) < 50;
                    ele.classList.toggle('is-sticky', stuck);
                }
            })
        });
    }
    else {

        setTimeout(attachStickyScrollEvent, 50);
    }
}
$(document).ready(attachStickyScrollEvent);

$(".content-wrapper").ready(() => {
    $(".content-wrapper").scroll(e => {

    })
});
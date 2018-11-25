/// <reference path="../../core/js/santedb.js"/>
/*
 * Copyright 2015-2018 Mohawk College of Applied Arts and Technology
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
 * User: justin
 * Date: 2018-7-26
 */
var ___originalButtonTexts = {};

// Add render of concept name
SanteDBWrapper.prototype.display = {
    /**
     * @method
     * @memberof SanteDBWrapper.display
     * @summary Replaces the content of the button with a defined wait state
     * @param {String} target The target of the wait button
     * @param {boolean} state True if the object is loading, false if not
     */
    buttonWait: function(target, state) {
        var btn = $(target);
        if(btn) {
            if(state)  {
                btn.attr('disabled', 'disabled');
                if(!___originalButtonTexts[target])
                    ___originalButtonTexts[target] = btn.html();
                btn.html(`<i class="fas fa-circle-notch fa-spin"></i> ${SanteDB.locale.getString("ui.wait")}`);
            }
            else {
                btn.removeAttr('disabled');

                btn.html(___originalButtonTexts[target]);
                delete(___originalButtonTexts[target]);
            }
        }
    },
    /**
     * @method
     * @memberof SanteDBWrapper.display
     * @summary Renders the specified concept name
     * @returns The appropriate display name for the concept
     * @param {SanteDBModel.Concept} concept The concept to be rendered
     */
    renderConcept: function (concept) {
        if (!concept)
            return "";
        else if (typeof (concept) === "String")
            return concept;
        else if (concept.name && concept.name[SanteDB.locale.getLanguage()])
            return concept.name[SanteDB.locale.getLanguage()];
        else if (concept.name)
            return concept.name[Object.keys(concept.name)[0]];
        else if (concept[SanteDB.locale.getLanguage()])
            return concept[SanteDB.locale.getLanguage()];
        else
            return concept[Object.keys(modelValue)[0]];
    },
    /**
     * @method
     * @memberof SanteDBWrapper.display
     * @summary Renders the specified entity name
     * @returns The appropriate display name for the entity
     * @param {SanteDBModel.EntityName} name The name of the entity to render
     * @param {string} type The type of name to render (Legal, Official Record, etc.)
     */
    renderEntityName: function (name, type) {
        // Get the type of name to render
        if (type) {
            name = name[type];
        }
        else if (!name.component)
            name = name[Object.keys(name)[0]]

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
    },
    /**
     * @method
     * @memberof SanteDBWrapper.display
     * @summary Renders the specified entity address
     * @returns The appropriate display address for the entity
     * @param {SanteDBModel.EntityAddress} address The address of the entity to render
     * @param {string} type The type of name to render (Legal, Official Record, etc.)
     */
    renderEntityAddress: function (address, type) {

        if (type)
            address = address[type];
        else if (!address.component)
            address = address[Object.keys(address)[0]]

        // Render address
        if (!address)
            return "";
        else {
            var addrStr = "";
            if (address.component.AdditionalLocator)
                addrStr += address.component.AdditionalLocator + ", ";
            if (address.component.StreetAddressLine)
                addrStr += address.component.StreetAddressLine + ", ";
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

    }
};
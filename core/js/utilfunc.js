/// <reference path="./santedb-model.js"/>
/// <reference path="./santedb.js"/>

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

/**
 * @method
 * @memberof Date
 * @summary Get the week of the year
 */
Date.prototype.getWeek = function () {
    var oneJan = this.getFirstDayOfYear();
    return Math.ceil((((this - oneJan) / 86400000) + oneJan.getDay() + 1) / 7);
}

/**
 * @method
 * @memberof Date
 * @summary Get the week of the year
 */
Date.prototype.getUTC = function () {
    return new Date(this.toUTCString());
}

/** 
 * @method
 * @memberof Date
 * @summary Get the first day of the year
 */
Date.prototype.getFirstDayOfYear = function () {
    return new Date(this.getFullYear(), 0, 1);
}

/**
 * @method 
 * @memberof Date
 * @summary Get the first day of the following week
 */
Date.prototype.nextMonday = function () {
    var retVal = this.getFirstDayOfYear();
    retVal.setDate(retVal.getDate() + (new Date().getWeek() * 7));
    return retVal;
}


/**
 * @summary Gets the date on the next day
 * @method
 * @memberof Date
 * @param {Number} days The number of days to add
 */
Date.prototype.addDays = function (days) {
    var retVal = new Date(this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
    retVal.setDate(retVal.getDate() + days);
    return retVal;
}


/**
 * @summary Adds the specified number of seconds to the date
 * @method
 * @memberof Date
 * @param {Number} seconds The number of seconds to add
 */
Date.prototype.addSeconds = function (seconds) {
    var retVal = new Date(this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
    retVal.setSeconds(retVal.getSeconds() + seconds);
    return retVal;
}

/**
 * @summary Add the specified seconds to the date
 * @method
 * @memberof Date
 * @param {Number} seconds The number of seconds to add
 */
Date.prototype.addSeconds = function (seconds) {
    var retVal = new Date(this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
    retVal.setSeconds(retVal.getSeconds() + seconds);
    return retVal;
}

/**
 * @summary Truncates the specified date
 * @method
 * @memberof Date
 */
Date.prototype.trunc = function () {
    var retVal = new Date(this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
    retVal.setSeconds(0);
    retVal.setMinutes(0);
    retVal.setHours(0);
    retVal.setMilliseconds(0);
    return retVal;
}

/**
 * @summary Gets the date on the next day
 * @memberof Date
 * @method
 */
Date.prototype.tomorrow = function () {
    return this.addDays(1);
}

/** 
 * @summary Truncates date to day
 * @memberof Date
 * @method
 */
Date.prototype.trunc = function () {
    var retVal = new Date(this.getFullYear(), this.getMonth(), this.getDate(), this.getHours(), this.getMinutes(), this.getSeconds(), this.getMilliseconds());
    retVal.setSeconds(0);
    retVal.setHours(0);
    retVal.setMinutes(0);
    retVal.setMilliseconds(0);
    return retVal;
}

/**
 * @summary Gets the date on the previous day
 * @method
 * @memberof Date
 */
Date.prototype.yesterday = function () {
    return this.addDays(-1);
}

/** 
 * @summary Last Week Day
 * @memberof Date
 * @method
 * @param {int} year The year for the date to get the end of week
 * @param {int} month The month for which to gather tha last date
 */
Date.prototype.lastWeekDay = function (month, year) {
    if (!day && !month && !year) {
        var date = new Date();
        year = date.getYear();
        month = date.getMonth();
    }

    var lastDay = new Date(year, month + 1, 0);
    switch (lastDay.getDay()) {
        case 0:
            lastDay.setDate(lastDay.getDate() - 2);
            break;
        case 6:
            lastDay.setDate(lastDay.getDate() - 1);
            break;
    }
    return lastDay;
}

/** 
 * @summary Decodes a hex string
 * @method
 */
String.prototype.hexDecode = function () {
    return this.replace(/([0-9A-Fa-f]{2})/g, function (i, a) {
        return String.fromCharCode(parseInt(a, 16));
    });
}

/** 
 * @summary Decodes a hex string and parses it as JSON
 * @method
 */
String.prototype.hexDecodeJson = function () {
    return JSON.parse(this.replace(/([0-9A-Fa-f]{2})/g, function (i, a) {
        return String.fromCharCode(parseInt(a, 16));
    }));
}

/** 
 * @summary Encodes a hex string
 * @method
 */
String.prototype.hexEncode = function () {
    var hex, i;

    var result = "";
    for (i = 0; i < this.length; i++) {
        hex = this.charCodeAt(i).toString(16);
        result += ("0" + hex).slice(-2);
    }

    return result
}

/** 
 * @summary Turns a string into a byte array
 * @method
 */
String.prototype.toByteArray = function () {
    var result = [];
    for (var i = 0; i < this.length; i++) {
        result.push(this.charCodeAt(i));
    }

    return result
}


/** Android 4.4 Hacks **/
if (!String.prototype.startsWith)
    String.prototype.startsWith = function (start) {
        return this.indexOf(start) == 0;
    };

if(!Array.prototype.flat)
    Array.prototype.flat = function() {
        return this.reduce((acc, val) => acc.concat(val), []);
    }


/**
 * Return the string as a camel case
 * @param {String} str The String
 */
String.prototype.toCamelCase = function () {
    return this
        .replace(/\s(.)/g, function ($1) { return $1.toUpperCase(); })
        .replace(/\s/g, '')
        .replace(/^(.)/, function ($1) { return $1.toLowerCase(); });
}


/**
 * Pad the specified string
 * @param {String} str The String
 */
String.prototype.pad = function (char, len) {
    var pad = char.repeat(len);
    return (pad + this).slice(-len);
}    

/** 
 * @summary Copy object data stripping out identifiers
 * @param {string} fromObject The object to copy from
 * @param {boolean} deepCopy True if sub-objects should be copied
 * @returns {Object} The copied object
 */
function copyObject(fromObject, deepCopy) {

    if(fromObject && typeof(fromObject) !== "string") {
        var obj = angular.copy(fromObject);
        delete(obj.id);
        delete(obj.versionId);
        
        if(deepCopy)
            Object.keys(obj).forEach(function(k) {
                if(obj[k])
                    obj[k] = copyObject(obj[k]);
            });
        return obj;
    }
    return obj;
}


/**
 * @summary Scrubs an object from Model 
 * @param {*} source The object from which the Model properties should be scrubbed
 * @returns {Array} The model objects which were scrubbed
 */
function scrubModelProperties(source) {

    if (!Array.isArray(source))
        source = [source];

    source.forEach(function (object) {
        Object.keys(object).forEach(function (key) {
            var rawValue = object[key];

            if (!Array.isArray(rawValue))
                rawValue = [rawValue];

            rawValue.forEach(function (value) {
                if (value && key.endsWith("Model")) {


                    // Get the key property
                    var keyProperty = key.substring(0, key.length - 5);
                    var keyValue = object[keyProperty];

                    // Set the key property to the selected / item value if present
                    if (value.id) {
                        object[keyProperty] = value.id;
                        // Remove the detail object
                        delete (object[key]);
                    }
                }

                // Scan down 
                if (value && typeof (value) == "object" && !(value instanceof Date))
                    scrubModelProperties(value);
            });
        });

    });
    return source;
}

/**
 * @summary Ensures that the entity being submitted doesn't have any odd or nasty data - also ensures that the 
 * @param {Entity} entity The entity to be corrected
 */
async function prepareEntityForSubmission(entity) {

    if (entity.tag && entity.tag["$generated"]) {
        entity.tag["$mdm.type"] = "T"; // Set a ROT tag
        entity.determinerConcept = '6b1d6764-12be-42dc-a5dc-52fc275c4935'; // set update as a ROT
    }
    else  // Not a MDM so just update the determiner to be specific
    {
        entity.determinerConcept = DeterminerKeys.Specific;
    }

    // Update the address - Correcting any linked addresses to the strong addresses
    // TODO: 
    if (entity.address) {
        var addressList = [];
        var promises = Object.keys(entity.address).map(async function (k) {
            try {
                var addr = entity.address[k];
                if (!Array.isArray(addr))
                    addr = [addr];

                var intlPromises = addr.map(async function (addrItem) {
                    if(addrItem.useModel) // have to load use
                        addrItem.use = addrItem.useModel.id;
                    if(!addrItem.use) 
                        addrItem.use = AddressUseKeys[k]
                    addrItem.component = addrItem.component || {};
                    

                    delete (addrItem.useModel);
                    addressList.push(addrItem);
                });
                await Promise.all(intlPromises);
            }
            catch (e) {
            }
        });
        await Promise.all(promises);
        entity.address = { "$other": addressList };
    }
    if (entity.name) {
        var nameList = [];
        Object.keys(entity.name).forEach(function (k) {

            var name = entity.name[k];
            if (!Array.isArray(name))
                name = [name];

            name.forEach(function (nameItem) {
                if(nameItem.useModel) // have to load use
                    nameItem.use = nameItem.useModel.id;
                if(!nameItem.use) 
                    nameItem.use = NameUseKeys[k]

                delete (nameItem.useModel);
                nameList.push(nameItem);
            })

        });
        entity.name = { "$other": nameList };
    }
    
    // Clear out the relationships of their MDM keys
    if(entity.relationship) {
        Object.keys(entity.relationship).forEach((k) => {
            if(!Array.isArray(entity.relationship[k]))
            {
                entity.relationship[k] = [ entity.relationship[k] ];
            }
            entity.relationship[k] = entity.relationship[k].map((r) => {
                if(r.targetModel && r.targetModel.id) {
                    r.target = r.targetModel.id;
                    delete r.targetModel;
                }
                if(r.holderModel && r.holderModel.id) {
                    r.holder = r.holderModel.id;
                    delete r.holderModel;
                }
                delete r.relationshipTypeModel;
                delete r.relationshipRoleModel;
                delete r.classificationModel;
                return r;
            });
        });

    }
    
    // Remove any MDM keys
    if(entity.relationship) {
        delete entity.relationship['MDM-Duplicate'];
        delete entity.relationship['MDM-Master'];
        delete entity.relationship['MDM-Ignore'];
        delete entity.relationship['MDM-RecordOfTruth'];
        delete entity.relationship['Replaces'];
    }

}

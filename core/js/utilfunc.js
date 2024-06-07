/// <reference path="./santedb-model.js"/>
/// <reference path="./santedb.js"/>
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
 * @returns The decoded base64 data as a JSON object
 */
String.prototype.b64DecodeJson = function() {
    return JSON.parse(atob(this));
}

/**
 * @summary Parses a string from base64 into a buffer
 */
String.prototype.b64DecodeBuffer = function(isUrlEncoded) {
    var source = this;
    while(source.length % 4 != 0) source += '='; // re-add padding
    var e={},i,b=0,c,x,l=0,a,w=String.fromCharCode,L=source.length, oi=0;
    var r = new Uint8Array(L);
    var A= isUrlEncoded ?
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for(i=0;i<64;i++){e[A.charAt(i)]=i;}

    for(x=0;x<L;x++){
        c=e[source.charAt(x)];
        b=(b<<6)+c;
        l+=6;
        while(l>=8)
        {
            if((a=(b>>>(l-=8)) & 0xff) || (x < (L-2))) {
                r[oi++] = a;
            }
        }
    }
    var retVal = new Uint8Array(oi);
    for(var i = 0; i < oi; i++) {
        retVal[i] = r[i];
    }
    return retVal.buffer;
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

if (!Array.prototype.flat)
    Array.prototype.flat = function () {
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

    if (fromObject && typeof (fromObject) !== "string") {
        var obj = angular.copy(fromObject);
        delete (obj.id);
        delete (obj.versionId);

        if (deepCopy)
            Object.keys(obj).forEach(function (k) {
                if (obj[k])
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
                    if (addrItem.useModel) // have to load use
                        addrItem.use = addrItem.useModel.id;
                    if (!addrItem.use)
                        addrItem.use = AddressUseKeys[k]
                    addrItem.component = addrItem.component || {};

                    if (addrItem.component) {
                        Object.keys(addrItem.component).forEach(o => {
                            if (!Array.isArray(addrItem.component[o])) {
                                if (typeof addrItem.component[o] === 'string') {
                                    addrItem.component[o] = [addrItem.component[o]]
                                }
                                else if (typeof addrItem.component[o] === 'object' || addrItem.component[o]['0']) // Sometimes AngularJS will represent new objects as an object with property 0
                                {
                                    addrItem.component[o] = Object.keys(addrItem.component[o]).map(k => addrItem.component[o][k]);
                                }
                                else {
                                    addrItem.component[o] = [addrItem.component[o]]
                                }
                            }
                        });
                    }

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
                if (nameItem.useModel) // have to load use
                    nameItem.use = nameItem.useModel.id;
                if (!nameItem.use)
                    nameItem.use = NameUseKeys[k]

                if (nameItem.component) {
                    Object.keys(nameItem.component).forEach(o => {
                        if (!Array.isArray(nameItem.component[o])) {
                            if (typeof nameItem.component[o] === 'string') {
                                nameItem.component[o] = [nameItem.component[o]]
                            }
                            else if (typeof nameItem.component[o] === 'object' || nameItem.component[o]['0']) // Sometimes AngularJS will represent new objects as an object with property 0
                            {
                                nameItem.component[o] = Object.keys(nameItem.component[o]).map(k => nameItem.component[o][k]);
                            }
                            else {
                                nameItem.component[o] = [nameItem.component[o]]
                            }
                        }
                    });
                }
                delete (nameItem.useModel);
                nameList.push(nameItem);
            })

        });
        entity.name = { "$other": nameList };
    }

    // Clear out the relationships of their MDM keys
    if (entity.relationship) {
        Object.keys(entity.relationship).forEach((k) => {
            if (!Array.isArray(entity.relationship[k])) {
                entity.relationship[k] = [entity.relationship[k]];
            }
            entity.relationship[k] = entity.relationship[k].map((r) => {
                if (r.targetModel && r.targetModel.id) {
                    r.target = r.targetModel.id;
                    delete r.targetModel;
                }
                if (r.holderModel && r.holderModel.id) {
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
    if (entity.relationship) {
        delete entity.relationship['MDM-Duplicate'];
        delete entity.relationship['MDM-Master'];
        delete entity.relationship['MDM-Ignore'];
        delete entity.relationship['MDM-RecordOfTruth'];
        delete entity.relationship['Replaces'];
    }

    return entity;
}

/**
 * 
 * @param {Guid} entityId The id of the entity to set the tag on
 * @param {String} tagName The name of the tag
 * @param {String} tagValue The value of the tag
 */
async function setEntityTag(entityId, tagName, tagValue) {

    var parameters = {};
    parameters[tagName] = tagValue;
    return await SanteDB.resources.entity.invokeOperationAsync(entityId, "tag", parameters);

}

/**
 * Set the status of the entity
 * @param {Guid} entityId The identifier of the entity
 * @param {Guid} newStatus The identifier of the state to set
 * @param {String} entityTag The ETAG of the object which this method is attempting to patch
 */
async function setEntityState(entityId, entityTag, newStatus) {

    // Set the status and update
    var patch = new Patch({
        appliesTo: new PatchTarget({
            id: entityId
        }),
        change: [
            new PatchOperation({
                op: PatchOperationType.Replace,
                path: "statusConcept",
                value: newStatus
            })
        ]
    });
    await SanteDB.resources.entity.patchAsync(entityId, entityTag, patch);
}


/**
 * Remove all properties which are delay loaded models
 * @param {Any} objectToRemove The object to remove properties from 
 */
function deleteModelProperties(objectToRemove) {

    if (typeof objectToRemove === 'object') {
        Object.keys(objectToRemove).forEach(p => {
            if (p.endsWith("Model")) {
                delete objectToRemove[p];
            }
            else if (Array.isArray(objectToRemove[p])) {
                objectToRemove[p].forEach(e=>deleteModelProperties(objectToRemove[p][e]));
            }
        });
    }

}

/**
 * Bundle all related properties into a new Bundle
 * @param {Any} object The object which is to be bundled
 */
async function bundleRelatedObjects(object) {
    
    var retVal = new Bundle({ resource: [ await prepareEntityForSubmission(angular.copy(object)) ], focal: [ object.id ]});

    if(object.relationship) {

        await Promise.all(Object.keys(object.relationship).map(async function(relationshipType) {
            var relationships = object.relationship[relationshipType];
            if(!Array.isArray(relationships)) {
                relationships = [relationships];
            }
            await Promise.all(relationships
                .filter(o => o && o.targetModel)
                .map(async function(rel) {
                    var entity = await prepareEntityForSubmission(angular.copy(rel.targetModel));
                    rel.target = entity.id = SanteDB.application.newGuid();
                    retVal.resource.push(entity);
                    delete rel.targetModel;
                }));
            relationships.forEach(rel => {
                rel.holder = object.id;
                delete rel.holderModel;
                delete rel.targetModel;
            });
        }));
    }

    if(object.participation) {
        await Promise.all(Object.keys(object.participation).map(async function(participationType) {
            var participations = object.participation[participationType];
            if(!Array.isArray(participations)) {
                participations = [participations];
            }
            participations.forEach(ptcpt => {
                rel.act = object.id;
                delete rel.playerModel;
            })
        }))
    }

    retVal.resource.forEach(res => deleteModelProperties(res));
    return retVal;
}

/**
 * Validate check digit using mod97
 */
function validateMod97CheckDigit(value, checkDigit) {
    if(!value || !checkDigit) return false;

    // Compute the mod97 - extract digits
    var source = value.match(/[0-9]/g);
    source.splice(0, 0, 0);
    var seed = source.map(o=>parseInt(o)).reduce(function (a, v, i) { return ((a + v) * 10) % 97; });
    seed *= 10; seed %= 97;
    var expectedCheckDigit = (97 - seed + 1) % 97;
    return expectedCheckDigit == checkDigit;
}
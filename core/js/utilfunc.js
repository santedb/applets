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
 */

/**
 * Group the array into an object by the keySelector
 * @param {Function} keySelector The function predicate that returns the key for grouping
 * @param {Function} valueSelector The function predicate that returns the value for the groupin
 * @returns {Object} An object whose keys represent the delegate returned by {keySelector}
 */
Object.defineProperty(Array.prototype, 'groupBy', { value: function(keySelector, valueSelector) {
    var retVal = {};
    this.forEach(itm => {
        var keyValue = keySelector(itm);
        if(retVal[keyValue]) {
            retVal[keyValue].push(valueSelector(itm));
        }
        else {
            retVal[keyValue] = [valueSelector(itm)];
        }
    });
    return retVal;
}, enumerable: false });

/**
 * @method
 * @memberof Exception
 * @summary Get the root cause of the exception
 */
Exception.prototype.getRootCause = function() {

    var retVal = this;
    while(retVal.cause) {
        retVal = retVal.cause; 
    }
    return retVal;
    
}

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
 * @summary Gets the age of the date
 * @param {string} measure The unit of measure
 * @returns The difference between the date and this date
 */
Date.prototype.age = function(measure) {
    return moment().diff(this, measure || 'years', false);
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

    var tSource = source;
    if (!Array.isArray(tSource))
        tSource = [tSource];

    tSource.forEach(function (object) {
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
 * @summary Ensures that the object provided is an array, correcting any angularJS issues
 * @param {any} objectToMakeArray The object to ensure is an array
 */
function ensureIsArray(objectToMakeArray) {

    if(!Array.isArray(objectToMakeArray)) {
        if(objectToMakeArray[0]) // not an array but has a '0' element so we convert
        {
            var arr = [];
            Object.keys(objectToMakeArray).forEach(k => arr.push(objectToMakeArray[k]));
            return arr;
        }
        else {
            return [objectToMakeArray];
        }
    }
    else 
        return objectToMakeArray;
}

/**
 * @summary Ensures that the act being submitted doesn't have any odd or nasty data which may cause erorrs in the API
 * @param {Act} act The act which is to be corrected
 */
async function prepareActForSubmission(act) {

    // Convert AngularJS' odd identifier.0.value to identifier[0].value (i.e. make it an array)
    if(act.identifier) {
        Object.keys(act.identifier).forEach(function(k) {
            var id = ensureIsArray(act.identifier[k]);
            id = id.filter(o=>o.value && o.value !== "");
            act.identifier[k] = id;
        });
    }
 
    // Remove and correct identifiers on the relationships and participations
    if (act.relationship) {
        Object.keys(act.relationship).forEach((k) => {
           
            act.relationship[k] = ensureIsArray(act.relationship[k]);
            act.relationship[k] = act.relationship[k].map((r) => {
                if (r.targetModel) {
                    r.target = r.targetModel.id = r.targetModel.id || r.target || SanteDB.application.newGuid();
                    r.targetModel = applyCascadeInstructions(r.targetModel);
                }
                if (r.holderModel && r.holderModel.id) {
                    r.holder = r.holderModel.id = r.holderModel.id || r.holder || SanteDB.application.newGuid();
                }
                delete r.relationshipTypeModel;
                delete r.relationshipRoleModel;
                delete r.classificationModel;

                return r;
            }).filter(r => r && (r.source || r.holder || r.target));
        });
    }

    // Remove and correct keys on participations
    if(act.participation) {
        Object.keys(act.participation).forEach((k) => {
            act.participation[k] = ensureIsArray(act.participation[k]);
            act.participation[k] = act.participation[k].map((p) => {
                if(p.playerModel) {
                    p.player = p.playerModel.id = p.playerModel.id || p.player || SanteDB.application.newGuid();
                }
                if(p.actModel) {
                    p.act = p.actModel.id = p.actModel.id || p.act || SanteDB.application.newGuid();
                }
                delete p.participationRoleModel;
                delete p.classificationModel;
                return p;
            }).filter(r => r && (r.act || r.player || r.source));
        });
    }

    return applyCascadeInstructions(act);
}

/**
 * @summary Apply any act cascade instructions
 * @param {Act} source The act on which the cascade instructions should be applied
 */
function applyCascadeInstructions(source) {
    
    // If the act has cascade instructions for context conduction then enforce them
    source.tag = source.tag || {};
    source.tag["$cascade:*:*"] = ["Location","Authororiginator","RecordTarget"];
    source.relationship = source.relationship || {};
    
    var cascadeInstructions = Object.keys(source.tag).filter(o => o.indexOf("$cascade:") == 0);

    cascadeInstructions.forEach(function (instruction) {
        var targetTemplate = instruction.split(':');
        var cascadeInstructions = source.tag[instruction];

        if (targetTemplate.length != 3) {
            console.error("Cascade control tag should be in format: $cascade:RelationshipType:template-id");
            return;
        }
        // Find the participation with that template
        if (targetTemplate[1] == "*") {
            searchRelationship = Object.keys(source.relationship).map(key => source.relationship[key]).flat();
        }
        else {
            var searchRelationship = source.relationship[targetTemplate[1]];
            if (searchRelationship == null) {
                console.warn("Cannot find indicated path", targetTemplate[1]);
                return;
            }
        }

        // Find the object with the specified template
        if (!Array.isArray(searchRelationship))
            searchRelationship = [searchRelationship];

        searchRelationship
            .filter(o => o.targetModel != null && (o.targetModel.templateModel != null && o.targetModel.templateModel.mnemonic == targetTemplate[2] || targetTemplate[2] == "*"))
            .forEach(function (relationship) {

                if (!relationship.targetModel.participation)
                    relationship.targetModel.participation = {};

                cascadeInstructions.map(function (instruction) {
                    var data = instruction.split('=');
                    if (data.length == 1)
                        return { sourceRole: data[0], targetRole: data[0] };
                    else if (data.length == 2)
                        return { sourceRole: data[1], targetRole: data[0] };
                })
                    .forEach(function (instruction) {
                        
                        // Apply the cascade for actTime, startTime, stopTime
                        relationship.targetModel.actTime = relationship.targetModel.actTime || source.actTime;
                        relationship.targetModel.moodConcept = relationship.targetModel.moodConcept || source.moodConcept;

                        if (!relationship.targetModel.participation[instruction.targetRole]
                        ) // Only cascade if not specified
                        {
                            relationship.targetModel.participation[instruction.targetRole] = source.participation[instruction.sourceRole];
                        }
                        else if(!relationship.targetModel.participation[instruction.targetRole][0].player) {
                            relationship.targetModel.participation[instruction.targetRole][0].player =  source.participation[instruction.sourceRole][0].player;
                            delete relationship.targetModel.participation[instruction.targetRole][0].playerModel;
                        }
                    });

            });
    });

    return source;
}

/**
 * @summary Ensures that the entity being submitted doesn't have any odd or nasty data - also ensures that the 
 * @param {Entity} entity The entity to be corrected
 * @param {boolean} splitCompoundNames When true, instructs the function to split any compound names like "John Jacob Jinglehiemer" into an array
 */
async function prepareEntityForSubmission(entity, splitCompoundNames) {

    if (entity.tag && entity.tag["$generated"]) {
        entity.tag["$mdm.type"] = "T"; // Set a ROT tag
        entity.determinerConcept = '6b1d6764-12be-42dc-a5dc-52fc275c4935'; // set update as a ROT
    }
    else  // Not a MDM so just update the determiner to be specific
    {
        entity.determinerConcept = entity.determinerConcept || DeterminerKeys.Specific;
    }

    // Update the address - Correcting any linked addresses to the strong addresses
    // TODO: 
    if (entity.address) {
        var addressList = [];
        var promises = Object.keys(entity.address).map(async function (k) {
            try {
                var addr = ensureIsArray(entity.address[k]);

                var intlPromises = addr.map(async function (addrItem) {
                    if (addrItem.useModel) // have to load use
                        addrItem.use = addrItem.useModel.id;
                    if (!addrItem.use)
                        addrItem.use = AddressUseKeys[k]
                    addrItem.component = addrItem.component || {};

                    if (addrItem.component) {
                        // If the component contains a reference to a place copy the place data elements
                        if(addrItem.component._AddressPlaceRef && addrItem.component._AddressPlaceRef.length > 0 &&
                            addrItem.component._AddressPlaceRef[0] !== "")
                        {
                            try {
                                var pr = await SanteDB.resources.place.getAsync(addrItem.component._AddressPlaceRef[0], 'fastview');
                                var copyAddress = pr.address.Direct || pr.address.PhysicalVisit;
                                Object.keys(copyAddress[0].component).forEach(k => {
                                    if(!addrItem.component[k] || addrItem.component[k].length == 0) {
                                        addrItem.component[k] = copyAddress[0].component[k];
                                    }
                                });
                            }
                            catch(e) {
                                console.warn("Error cascading address place reference ", e);
                            }
                        }
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

        // Ensure that the addresses are placed back in the correct paths
        entity.address = {};
        addressList.forEach(addr => {
            var useKey = Object.keys(AddressUseKeys).find(o=>AddressUseKeys[o] == addr.use) || '$other';
            entity.address[useKey] = entity.address[useKey] || [];
            entity.address[useKey].push(addr);
        });
    }
    if (entity.name) {
        var nameList = [];
        Object.keys(entity.name).forEach(function (k) {

            var name = ensureIsArray(entity.name[k]);
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

                        if(splitCompoundNames) {
                            var compoundArray = [];
                            nameItem.component[o].forEach(name => {
                                name.split(' ').forEach(c=>compoundArray.push(c));
                            });
                            nameItem.component[o] = compoundArray; 
                        }
                    });
                }
                delete (nameItem.useModel);
                nameList.push(nameItem);
            })

        });
        entity.name = { };
        nameList.forEach(name => {
            var useKey = Object.keys(NameUseKeys).find(o=>NameUseKeys[o] == name.use) || '$other';
            entity.name[useKey] = entity.name[useKey] || [];
            entity.name[useKey].push(name);
        });
    }
    if(entity.identifier) // strip out empty identifiers
    {
        Object.keys(entity.identifier).forEach(function(k) {
            var id = ensureIsArray(entity.identifier[k]);
            id = id.filter(o=>o.value && o.value !== "");
            entity.identifier[k] = id;
        });
    }

    // Clear out the relationships of their MDM keys
    if (entity.relationship) {
        Object.keys(entity.relationship).forEach((k) => {
            entity.relationship[k] = ensureIsArray(entity.relationship[k]);

            entity.relationship[k] = entity.relationship[k].map((r) => {
                if (r.targetModel) {
                    r.target = r.targetModel.id = r.targetModel.id || r.target || SanteDB.application.newGuid();
                }
                if (r.holderModel) {
                    r.holder = r.holderModel.id = r.holderModel.id || r.holder || SanteDB.application.newGuid();
                }
                delete r.relationshipTypeModel;
                delete r.relationshipRoleModel;
                delete r.classificationModel;
                return r;
            }).filter(r => r.source || r.holder || r.target);
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

    // Strip entity relationships with no source or no target

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
 * Set the status of the act
 * @param {Guid} actId The identifier of the act
 * @param {Guid} newStatus The identifier of the state to set
 * @param {String} eTag The ETAG of the object which this method is attempting to patch
 */
async function setActState(actId, eTag, newStatus) {

    // Set the status and update
    var patch = new Patch({
        appliesTo: new PatchTarget({
            id: actId
        }),
        change: [
            new PatchOperation({
                op: PatchOperationType.Replace,
                path: "statusConcept",
                value: newStatus
            })
        ]
    });
    await SanteDB.resources.act.patchAsync(actId, eTag, patch);
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
 * @deprecated Use {@link:scrubModelProperties}
 */
function deleteModelProperties(objectToRemove) {
    scrubModelProperties(objectToRemove);

}

/**
 * Bundle all related properties into a new Bundle
 * @param {Any} object The object which is to be bundled
 * @param {Array} ignoreRelations The relationship types to ignore when pushing to the bundle
 * @param {Bundle} existingBundle If the results should be added to an existing bundle
 */
function bundleRelatedObjects(object, ignoreRelations, existingBundle) {
    
    ignoreRelations = ignoreRelations || [];
    if(!Array.isArray(ignoreRelations)) {
        ignoreRelations = [ignoreRelations];
    }

    object = angular.copy(object);
    var retVal = existingBundle || new Bundle({ resource: [ object ], focal: [ object.id ]});

    if(object.relationship) {

        Object.keys(object.relationship).filter(k=>ignoreRelations.indexOf(k) == -1).forEach(k => {
            var relationship = object.relationship[k] = ensureIsArray(object.relationship[k]);
            relationship.filter(r=> r).forEach(rel => {
                if(rel.targetModel) {
                    var relatedObject = angular.copy(rel.targetModel);
                    rel.target = relatedObject.id = relatedObject.id || SanteDB.application.newGuid();
                    retVal.resource.push(relatedObject);
                    bundleRelatedObjects(relatedObject, ignoreRelations, retVal);
                    delete rel.targetModel;
                }
                if(rel.holderModel) {
                    var relatedObject = angular.copy(rel.holderModel);
                    rel.holder = rel.source = relatedObject.id = relatedObject.id || SanteDB.application.newGuid();
                    retVal.resource.push(relatedObject);
                    delete rel.holderModel;
                }
                
                rel.holder = rel.holder || object.id;
            });
            object.relationship[k] = relationship.filter(o=>o && (o.target || o.holder || o.source));
        });
    }

    if(object.participation) {
        Object.keys(object.participation).filter(k=>ignoreRelations.indexOf(k) == -1).forEach(k => {
            var participations = object.participation[k] = ensureIsArray(object.participation[k]);
            participations.filter(p=>p).forEach(ptcpt => {
                if(ptcpt.playerModel) {
                    var relatedObject = angular.copy(ptcpt.playerModel);
                    ptcpt.player = relatedObject.id = relatedObject.id || SanteDB.application.newGuid();

                    if(!relatedObject.version) {
                        retVal.resource.push(relatedObject);
                    }

                    delete ptcpt.playerModel;
                }
                if(ptcpt.actModel) {
                    var relatedObject = angular.copy(ptcpt.actModel);
                    ptcpt.act = relatedObject.id = relatedObject.id || SanteDB.application.newGuid();

                    if(!relatedObject.version) {
                        retVal.resource.push(relatedObject);
                    }

                    delete ptcpt.actModel;
                }

                ptcpt.act = ptcpt.act || object.id;
            });
            object.participation[k] = participations.filter(o=>o && (o.player || o.act));
        })
    }

    if(!existingBundle) {
        retVal.resource.forEach(res => deleteModelProperties(res));
    }
    return retVal;
}

/**
 * Validate check digit using the a simple Mod-97 check digit algorithm
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

/**
 * Validate check digit using the standard ISO/IEC 7064 Check Digit Algorithm
 */
function validateIso7064Mod97CheckDigit(value, checkDigit) {
    if(!value || !checkDigit) return false;

    // Compute the mod97 - extract digits
    var source = value.match(/[0-9]/g);
    var checkDigit = "" + source + checkDigit
}

/**
 * @summary Copies details about a product to a lot number
 * @param {ManufacturedMaterial} lot The material representing the lot instance
 * @param {ManufacturedMaterial} product The material representing the generic product
 * @param {string} statusConcept The status of the lot to set
 * @param {boolean} copyGtin True if GTIN should be copied from the product to the lot
 * @param {boolean} copyName True if the name of the product should be copied to the lot
 */
function copyMaterialInstance(lot, product, statusConcept, copyGtin, copyName) {
    lot.determinerConcept = DeterminerKeys.Specific;
    lot.formConcept = product.formConcept;
    lot.typeConcept = product.typeConcept;
    lot.quantityConcept = product.quantityConcept;
    lot.statusConcept = statusConcept;
    lot.quantity = 1;
    lot.identifier = lot.identifier || {};
    lot.identifier.GTIN = lot.identifier.GTIN || [{}];
    if (product.identifier && product.identifier.GTIN && copyGtin) {
        lot.identifier.GTIN[0].value = product.identifier.GTIN[0].value;
    }
    lot.name = lot.name || {};
    lot.name.Assigned = lot.name.Assigned || [{ component: { $other: [""] } }];
    if (copyName) {
        lot.name.Assigned[0].component.$other[0] = product.name.Assigned[0].component.$other[0];
    }
}



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



// JWS Pattern
var jwsDataPattern = /^(.*?)\.(.*?)\.(.*?)$/;

/**
 * @summary Performs a search
 * @param {string} qrCodeData Existing qrCode data
 * @param {boolean} noValidate True if no validation should be performed
 * @param {boolean} upstream Search upstream service
 * @returns {IdentifiedData} Either a bundle or the discrete resource (what the barcode points at)
 */
async function searchByBarcode(qrCodeData, noValidate, upstream) {
    try {
        if (!qrCodeData)
            qrCodeData = await SanteDB.application.scanBarcodeAsync();

        // QR Code is a signed code
        if (jwsDataPattern.test(qrCodeData)) {
            var result = await SanteDB.application.ptrSearchAsync(qrCodeData, !noValidate, upstream || false);
            result.$novalidate = noValidate;
            result.$upstream = upstream;
            return result;
        }
        else {

            var idDomain = SanteDB.application.classifyIdentifier(qrCodeData);
            if(idDomain.length == 1)
            {
                var parser = SanteDB.application.getIdentifierParser(idDomain[0]);
                if(parser) qrCodeData = parser(qrCodeData);
            }
            var result = await SanteDB.resources.entity.findAsync({ "identifier.value" : qrCodeData});
            result.$search = qrCodeData;
            return result;
        }
    }
    catch (e) {
        if(!e) // No error
            return null;
        // Error was with validating the code
        else if (e.rules && e.rules.length > 0 && e.rules.filter(o => o.id == "jws.verification" || o.id == "jws.app" || o.id == "jws.key").length == e.rules.length) {
            return await searchByBarcode(qrCodeData, true, upstream);
        }
        else if(!upstream && (e.$type == "KeyNotFoundException" || e.cause && e.cause.$type == "KeyNotFoundException")  && confirm(SanteDB.locale.getString("ui.emr.search.online"))) {
            // Ask the user if they want to search upstream, only if they are allowed
            var session = await SanteDB.authentication.getSessionInfoAsync();

            if(session.method == "LOCAL") // Local session so elevate to use the principal elevator
            {
                var elevator = new ApplicationPrincipalElevator();
                await elevator.elevate(session);
                SanteDB.authentication.setElevator(elevator);
            }
            return await searchByBarcode(qrCodeData, true, true);
        }
        throw e;
    }
    finally {
        SanteDB.authentication.setElevator(null);
    }
}

// Correct information such as addresses and other information on the patient profile
async function correctEntityInformation(entity) {
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
                    addrItem.use = addrItem.useModel.id;
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
                nameItem.use = nameItem.useModel.id;
                delete (nameItem.useModel);
                nameList.push(nameItem);
            })

        });
        entity.name = { "$other": nameList };
    }

}

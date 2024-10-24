/// <reference path="./santedb-model.js"/>
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

// Interactive SHIM between host environment and browser
var __SanteDBAppService = window.SanteDBAppService || {};

// Backing of execution environment
const ExecutionEnvironment = {
    Unknown: 0,
    Server: 1,
    Mobile: 2,
    Other: 3,
    Test: 4,
    Gateway: 5
};

const BooleanExtensionValues = {
    true: `AQ==`,
    false: `AA==`
}

/**
* @class
* @constructor
* @summary SanteDB HDSI implementation that uses HTTP (note, other implementations may provide alternates)
* @param {any} _config The configuration of the service
* @param {string} _config.base The base URL for the service
* @param {boolean} _config.idByQuery When true, indicates the wrapper wants to pass IDs by query
*/
function APIWrapper(_config) {

    var _viewModelJsonMime = "application/x.santedb.rim.viewModel+json"; //"application/json+sdb-viewmodel";

    /**
     * @method
     * @private
     * @summary Resolves all $ref in the object with the $id data ensuring the model is ready for display
     * @param {any} object The object which should be resolved
     */
    function _resolveObjectRefs(object, referenceDictionary, resolveStack) {

        referenceDictionary = referenceDictionary || {};
        resolveStack = resolveStack || [];
        if (object && object.$id) {
            resolveStack.push(object.$id);
        }

        try {
            // This is not really an object but a reference to an object
            if (object == null) {
                return null;
            }
            else if (object.$ref !== undefined) {
                if (!resolveStack.indexOf(object.$ref)) {
                    return referenceDictionary[object.$ref];
                }
            }
            else if (Array.isArray(object)) {
                return object.map(o => _resolveObjectRefs(o, referenceDictionary));
            }
            else if (typeof (object) == 'object' &&
                !(object instanceof Date)) {
                if (object.$id !== undefined) {
                    referenceDictionary[`#${object.$id}`] = object;
                }

                Object.keys(object).forEach(p => {
                    object[p] = _resolveObjectRefs(object[p], referenceDictionary);
                });
                return object;
            }
            else {
                return object;
            }
        }
        finally {
            if (object && object.$id) {
                resolveStack.splice(resolveStack.length, 1);
            }
        }
    }

    /**
     * @method
     * @public
     * @summary Gets the base url of the API
     * @memberof APIWrapper
     */
    this.getUrl = function () {
        return _config.base;
    };

    /**
        * @method
        * @summary Reconfigures this instance of the API wrapper
        * @memberof APIWrapper
        * @param {any} config The configuration of the service
        * @param {string} config.base The base URL for the service
        * @param {boolean} config.idByQuery When true, indicates the wrapper wants to pass IDs by query
        */
    this.configure = function (config) {
        _config = config;
    };

    /**
        * @method postAsync
        * @memberof APIWrapper
        * @summary Creates a new item on the instance
        * @param {any} configuration The configuration object
        * @param {string} configuration.resource The resource that is to be posted
        * @param {any} configuration.data The data that is to be posted
        * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
        * @param {boolean} configuration.sync When true, executes the request in synchronous mode
        * @param {string} configuration.contentType Identifies the content type of the data
        * @returns {Promise} The promise for the operation
        */
    this.postAsync = function (configuration) {
        return new Promise(function (fulfill, reject) {
            $.ajax({
                method: 'POST',
                url: _config.base + configuration.resource,
                data: configuration.data && configuration.contentType.indexOf('json') != -1 ? JSON.stringify(SanteDB._reorderProperties(configuration.data)) : configuration.data,
                dataType: configuration.dataType || 'json',
                contentType: configuration.contentType || 'application/json',
                headers: configuration.headers,
                async: !configuration.sync,
                success: function (xhr, status, response) {
                    try {
                        if (xhr && response.getResponseHeader("etag"))
                            xhr.etag = response.getResponseHeader("etag");
                        if (fulfill) {
                            if (configuration.headers && configuration.headers["Accept"] == _viewModelJsonMime) {
                                fulfill(_resolveObjectRefs(xhr), configuration.state);
                            }
                            else {
                                fulfill(xhr, configuration.state);
                            }
                        }
                    }
                    catch (e) {
                        if (reject) reject(e.responseJSON || e, configuration.state);
                    }
                },
                error: function (e, data, setting) {
                    if (SanteDB._globalErrorHandler(e, data, setting))
                        return;
                    var error = e.responseJSON;

                    if (reject) {
                        if (error && error.error !== undefined) // oauth2
                            reject(new Exception(error.type, error.error, error.error_description, error.caused_by, null, null, null, null, error), configuration.state);
                        else if (error && (error.$type === "Exception" || error.$type))
                            reject(new Exception(error.$type, error.message, error.detail, error.cause, error.stack, error.policyId, error.policyOutcome, error.rules, error.data || error), configuration.state);
                        else
                            reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                    }
                    else
                        console.error("UNHANDLED PROMISE REJECT: " + JSON.stringify(e));
                }
            });
        });
    };

    /**
        * @method putAsync
        * @memberof APIWrapper
        * @summary Updates an existing item on the instance
        * @param {any} configuration The configuration object
        * @param {string} configuration.resource The resource that is to be posted
        * @param {any} configuration.data The data that is to be posted
        * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
        * @param {boolean} configuration.sync When true, executes the request in synchronous mode
        * @param {string} configuration.id The identifier of the object on the interface to update
        * @param {string} configuration.contentType Identifies the content type of the data
        * @returns {Promise} The promise for the operation
        */
    this.putAsync = function (configuration) {
        return new Promise(function (fulfill, reject) {
            $.ajax({
                method: 'PUT',
                url: _config.base + configuration.resource + (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id),
                data: configuration.contentType.indexOf('json') != -1 ? JSON.stringify(SanteDB._reorderProperties(configuration.data)) : configuration.data,
                dataType: configuration.dataType || 'json',
                contentType: configuration.contentType || 'application/json',
                headers: configuration.headers,
                async: !configuration.sync,
                success: function (xhr, status, response) {
                    try {
                        if (xhr && response.getResponseHeader("etag"))
                            xhr.etag = response.getResponseHeader("etag");
                        if (fulfill) {
                            if (configuration.headers && configuration.headers["Accept"] == _viewModelJsonMime) {
                                fulfill(_resolveObjectRefs(xhr), configuration.state);
                            }
                            else {
                                fulfill(xhr, configuration.state);
                            }
                        }

                    }
                    catch (e) {
                        if (reject) reject(e.responseJSON || e, configuration.state);
                    }
                },
                error: function (e, data, setting) {
                    if (SanteDB._globalErrorHandler(e, data, setting))
                        return;
                    var error = e.responseJSON;

                    if (reject) {
                        if (error && error.error !== undefined) // oauth2
                            reject(new Exception(error.type, error.error, error.error_description, error.caused_by, null, null, null, null, error), configuration.state);
                        else if (error && (error.$type === "Exception" || error.$type))
                            reject(new Exception(error.$type, error.message, error.detail, error.cause, error.stack, error.policyId, error.policyOutcome, error.rules, error.data || error), configuration.state);
                        else
                            reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                    }
                    else
                        console.error("UNHANDLED PROMISE REJECT: " + JSON.stringify(e));
                }
            });
        });
    };

    /**
    * @method searchAsync
    * @memberof APIWrapper
    * @summary Performs an HTTP SEARCH operation with the payload being a long query string
    * @param {any} configuration The configuration object
    * @param {string} configuration.resource The resource that is to be searched
    * @param {any} configuration.query The query to be posted 
    * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
    * @param {boolean} configuration.sync When true, executes the request in synchronous mode
    * @returns {Promise} The promise for the operation
    */
    this.searchAsync = function (configuration) {
        return new Promise(function (fulfill, reject) {
            $.ajax({
                method: 'SEARCH',
                url: _config.base + configuration.resource,
                data: configuration.query,
                dataType: 'json',
                contentType: 'application/x-www-form-urlencoded',
                headers: configuration.headers,
                async: !configuration.sync,
                success: function (xhr, status, response) {
                    try {
                        if (xhr && response.getResponseHeader("etag"))
                            xhr.etag = response.getResponseHeader("etag");
                        if (fulfill) {
                            if (configuration.headers && configuration.headers["Accept"] == _viewModelJsonMime) {
                                fulfill(_resolveObjectRefs(xhr), configuration.state);
                            }
                            else {
                                fulfill(xhr, configuration.state);
                            }
                        }

                    }
                    catch (e) {
                        if (reject) reject(e.responseJSON || e, configuration.state);
                    }
                },
                error: function (e, data, setting) {
                    if (SanteDB._globalErrorHandler(e, data, setting))
                        return;
                    var error = e.responseJSON;

                    if (reject) {
                        if (error && error.error !== undefined) // oauth2
                            reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                        else if (error && (error.$type === "Exception" || error.$type))
                            reject(new Exception(error.$type, error.message, error.detail, error.cause, error.stack, error.policyId, error.policyOutcome, error.rules, error.data || error), configuration.state);
                        else
                            reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                    }
                    else
                        console.error("UNHANDLED PROMISE REJECT: " + JSON.stringify(e));
                }
            });
        });
    };

    /**
        * @method patchAsync
        * @memberof APIWrapper
        * @summary Patches an existing item on the instance
        * @param {any} configuration The configuration object
        * @param {string} configuration.resource The resource that is to be posted
        * @param {any} configuration.data The data that is to be posted
        * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
        * @param {boolean} configuration.sync When true, executes the request in synchronous mode
        * @param {string} configuration.id The identifier of the object on the interface to update
        * @param {string} configuration.contentType Identifies the content type of the data
        * @returns {Promise} The promise for the operation
        */
    this.patchAsync = function (configuration) {
        return new Promise(function (fulfill, reject) {
            $.ajax({
                method: 'PATCH',
                url: _config.base + configuration.resource + (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id),
                data: configuration.contentType.indexOf('json') != -1 ? JSON.stringify(SanteDB._reorderProperties(configuration.data)) : configuration.data,
                dataType: configuration.dataType || 'json',
                contentType: configuration.contentType || 'application/json',
                headers: configuration.headers,
                async: !configuration.sync,
                success: function (xhr, status, response) {
                    try {
                        if (fulfill) {
                            if (configuration.headers && configuration.headers["Accept"] == _viewModelJsonMime) {
                                fulfill(_resolveObjectRefs(xhr), configuration.state);
                            }
                            else {
                                fulfill(xhr, configuration.state);
                            }
                        }
                    }
                    catch (e) {
                        if (reject) reject(e.responseJSON || e, configuration.state);
                    }
                },
                error: function (e, data, setting) {
                    if (SanteDB._globalErrorHandler(e, data, setting))
                        return;
                    var error = e.responseJSON;

                    if (reject) {
                        if (error && error.error !== undefined) // oauth2
                            reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                        else if (error && (error.$type === "Exception" || error.$type))
                            reject(new Exception(error.$type, error.message, error.detail, error.cause, error.stack, error.policyId, error.policyOutcome, error.rules, error.data || error), configuration.state);
                        else
                            reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                    }
                    else
                        console.error("UNHANDLED PROMISE REJECT: " + JSON.stringify(e));
                }
            });
        });
    };

    /**
        * @method getAsync
        * @memberof APIWrapper
        * @summary Performs a GET on an existing item on the instance
        * @param {any} configuration The configuration object
        * @param {string} configuration.resource The resource that is to be fetched
        * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
        * @param {boolean} configuration.sync When true, executes the request in synchronous mode
        * @param {any} configuration.query The query to be applied to the get
        * @returns {Promise} The promise for the operation
        */
    this.getAsync = function (configuration) {
        return new Promise(function (fulfill, reject) {
            $.ajax({
                method: 'GET',
                url: _config.base + configuration.resource,
                data: configuration.query,
                dataType: configuration.dataType || 'json',
                headers: configuration.headers,
                async: !configuration.sync,
                success: function (xhr, status, response) {
                    try {
                        if (xhr && response.getResponseHeader("etag"))
                            xhr.etag = response.getResponseHeader("etag");
                        if (fulfill) {
                            if (xhr && configuration.state != null) {
                                xhr.$state = configuration.state;
                            }
                            if (configuration.headers && configuration.headers["Accept"] == _viewModelJsonMime) {
                                fulfill(_resolveObjectRefs(xhr));
                            }
                            else {
                                fulfill(xhr);
                            }
                        }
                    }
                    catch (e) {
                        if (reject) {
                            var result = e.responseJSON || e;
                            try {
                                result.$state = configuration.state;
                                reject(e.responseJSON || e);
                            }
                            catch (ex) {
                                reject(e.responseJSON || e);
                            }
                        }
                    }
                },
                error: function (e, data, setting) {
                    if (SanteDB._globalErrorHandler(e, data, setting))
                        return;
                    var error = {};
                    if (e.responseJSON)
                        error = e.responseJSON;
                    else if (e.responseText)
                        try { error = JSON.parse(e.responseText); }
                        catch (e) { };

                    if (error && configuration.state != null) {
                        error.$state = configuration.state;
                    }
                    if (reject) {
                        if (error && error.error !== undefined) // oauth2
                            reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                        else if (error && (error.$type === "Exception" || error.$type))
                            reject(new Exception(error.$type, error.message, error.detail, error.cause, error.stack, error.policyId, error.policyOutcome, error.rules), configuration.state);
                        else
                            reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                    }
                    else
                        console.error("UNHANDLED PROMISE REJECT: " + JSON.stringify(e));
                }
            });
        });
    };

    /**
        * @method copyAsync
        * @memberof APIWrapper
        * @summary Performs a COPY operation against the specified object
        * @param {any} configuration The configuration object
        * @param {string} configuration.resource The resource that is to be fetched
        * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
        * @param {boolean} configuration.sync When true, executes the request in synchronous mode
        * @param {any} configuration.id The id of the resource to copy to the server
        * @returns {Promise} The promise for the operation
        */
    this.copyAsync = function (configuration) {
        return new Promise(function (fulfill, reject) {
            $.ajax({
                method: 'COPY',
                url: _config.base + configuration.resource + (configuration.id ? (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id) : ""),
                dataType: configuration.dataType || 'json',
                contentType: configuration.contentType || 'application/json',
                async: !configuration.sync,
                success: function (xhr, status, response) {
                    try {
                        if (xhr && response.getResponseHeader("etag"))
                            xhr.etag = response.getResponseHeader("etag");
                        if (fulfill) {
                            if (configuration.headers && configuration.headers["Accept"] == _viewModelJsonMime) {
                                fulfill(_resolveObjectRefs(xhr), configuration.state);
                            }
                            else {
                                fulfill(xhr, configuration.state);
                            }
                        }
                    }
                    catch (e) {
                        if (reject) reject(e.responseJSON || e, configuration.state);
                    }
                },
                error: function (e, data, setting) {
                    if (SanteDB._globalErrorHandler(e, data, setting))
                        return;
                    var error = {};
                    if (e.responseJSON)
                        error = e.responseJSON;
                    else if (e.responseText)
                        try { error = JSON.parse(e.responseText); }
                        catch (e) { };

                    if (reject) {
                        if (error && error.error !== undefined) // oauth2
                            reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                        else if (error && (error.$type === "Exception" || error.$type))
                            reject(new Exception(error.$type, error.message, error.detail, error.cause, error.stack, error.policyId, error.policyOutcome, error.rules), configuration.state);
                        else
                            reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                    }
                    else
                        console.error("UNHANDLED PROMISE REJECT: " + JSON.stringify(e));
                }
            });
        });
    };

    /**
        * @method deleteAsync
        * @memberof APIWrapper
        * @summary Performs a DELETE on an existing item on the instance
        * @param {any} configuration The configuration object
        * @param {string} configuration.resource The resource that is to be deleted
        * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
        * @param {boolean} configuration.sync When true, executes the request in synchronous mode
        * @param {any} configuration.id The object that is to be deleted on the server
        * @param {any} configuration.data The additional data that should be sent for the delete command
        * @param {string} configuration.mode The mode in which the delete should occur. Can be NULLIFY, CANCEL or OBSOLETE (default)
        * @param {string} configuration.contentType Identifies the content type of the data
        * @returns {Promise} The promise for the operation
        */
    this.deleteAsync = function (configuration) {
        return new Promise(function (fulfill, reject) {
            var hdr = configuration.headers || {};
            hdr["X-Delete-Mode"] = configuration.mode;
            $.ajax({
                method: 'DELETE',
                url: _config.base + configuration.resource + (configuration.id ? (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id) : ""),
                data: configuration.contentType == 'application/json' && configuration.data ? JSON.stringify(SanteDB._reorderProperties(configuration.data)) : configuration.data,
                headers: hdr,
                dataType: configuration.dataType || 'json',
                contentType: configuration.contentType || 'application/json',
                async: !configuration.sync,
                success: function (xhr, status, response) {
                    try {
                        if (xhr && response.getResponseHeader("etag"))
                            xhr.etag = response.getResponseHeader("etag");
                        if (fulfill) {
                            if (configuration.headers && configuration.headers["Accept"] == _viewModelJsonMime) {
                                fulfill(_resolveObjectRefs(xhr), configuration.state);
                            }
                            else {
                                fulfill(xhr, configuration.state);
                            }
                        }
                    }
                    catch (e) {
                        if (reject) reject(e.responseJSON || e, configuration.state);
                    }
                },
                error: function (e, data, setting) {
                    if (SanteDB._globalErrorHandler(e, data, setting))
                        return;
                    var error = e.responseJSON;

                    if (reject) {
                        if (error && error.error !== undefined) // oauth2
                            reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                        else if (error && (error.$type === "Exception" || error.$type))
                            reject(new Exception(error.$type, error.message, error.detail, error.cause, error.stack, error.policyId, error.policyOutcome, error.rules), configuration.state);
                        else
                            reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                    }
                    else
                        console.error("UNHANDLED PROMISE REJECT: " + JSON.stringify(e));
                }
            });
        });
    };

    /**
        * @method lockAsync
        * @memberof APIWrapper
        * @summary Performs a LOCK on an existing item on the instance
        * @param {any} configuration The configuration object
        * @param {string} configuration.resource The resource that is to be locked
        * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
        * @param {boolean} configuration.sync When true, executes the request in synchronous mode
        * @param {any} configuration.id The object that is to be locked on the server
        * @param {any} configuration.data The additional data that should be sent for the delete command
        * @param {string} configuration.contentType Identifies the content type of the data
        * @returns {Promise} The promise for the operation
        */
    this.lockAsync = function (configuration) {
        return new Promise(function (fulfill, reject) {
            $.ajax({
                method: 'LOCK',
                url: _config.base + configuration.resource + (configuration.id ? (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id) : ""),
                headers: configuration.headers,
                async: !configuration.sync,
                success: function (xhr, status, response) {
                    try {
                        if (xhr && response.getResponseHeader("etag"))
                            xhr.etag = response.getResponseHeader("etag");
                        if (fulfill) {
                            if (configuration.headers && configuration.headers["Accept"] == _viewModelJsonMime) {
                                fulfill(_resolveObjectRefs(xhr), configuration.state);
                            }
                            else {
                                fulfill(xhr, configuration.state);
                            }
                        }
                    }
                    catch (e) {
                        if (reject) reject(e.responseJSON || e, configuration.state);
                    }
                },
                error: function (e, data, setting) {
                    if (SanteDB._globalErrorHandler(e, data, setting))
                        return;
                    var error = e.responseJSON;

                    if (reject) {
                        if (error && error.error !== undefined) // oauth2
                            reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                        else if (error && (error.$type === "Exception" || error.$type))
                            reject(new Exception(error.$type, error.message, error.detail, error.cause, error.stack, error.policyId, error.policyOutcome, error.rules), configuration.state);
                        else
                            reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                    }
                    else
                        console.error("UNHANDLED PROMISE REJECT: " + JSON.stringify(e));
                }
            });
        });
    };

    /**
        * @method unLockAsync
        * @memberof APIWrapper
        * @summary Performs a UNLOCK on an existing item on the instance
        * @param {any} configuration The configuration object
        * @param {string} configuration.resource The resource that is to be locked
        * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
        * @param {boolean} configuration.sync When true, executes the request in synchronous mode
        * @param {any} configuration.id The object that is to be locked on the server
        * @param {any} configuration.data The additional data that should be sent for the delete command
        * @param {string} configuration.contentType Identifies the content type of the data
        * @returns {Promise} The promise for the operation
        */
    this.unLockAsync = function (configuration) {
        return new Promise(function (fulfill, reject) {
            $.ajax({
                method: 'UNLOCK',
                url: _config.base + configuration.resource + (configuration.id ? (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id) : ""),
                headers: configuration.headers,
                async: !configuration.sync,
                success: function (xhr, status, response) {
                    try {
                        if (xhr)
                            xhr.etag = response.getResponseHeader("etag");
                        if (fulfill) {
                            if (configuration.headers && configuration.headers["Accept"] == _viewModelJsonMime) {
                                fulfill(_resolveObjectRefs(xhr), configuration.state);
                            }
                            else {
                                fulfill(xhr, configuration.state);
                            }
                        }
                    }
                    catch (e) {
                        if (reject) reject(e.responseJSON || e, configuration.state);
                    }
                },
                error: function (e, data, setting) {
                    if (SanteDB._globalErrorHandler(e, data, setting))
                        return;
                    var error = e.responseJSON;

                    if (reject) {
                        if (error && error.error !== undefined) // oauth2
                            reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                        else if (error && (error.$type === "Exception" || error.$type))
                            reject(new Exception(error.$type, error.message, error.detail, error.cause, error.stack, error.policyId, error.policyOutcome, error.rules), configuration.state);
                        else
                            reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                    }
                    else
                        console.error("UNHANDLED PROMISE REJECT: " + JSON.stringify(e));
                }
            });
        });
    };

    /**
        * @method checkoutAsync
        * @memberof APIWrapper
        * @summary Performs a CHECKOUT on an existing item on the instance which locks the resource from modifications by others
        * @param {any} configuration The configuration object
        * @param {string} configuration.resource The resource that is to be locked
        * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
        * @param {boolean} configuration.sync When true, executes the request in synchronous mode
        * @param {any} configuration.id The object that is to be locked on the server
        * @param {any} configuration.data The additional data that should be sent for the delete command
        * @param {string} configuration.contentType Identifies the content type of the data
        * @returns {Promise} The promise for the operation
        */
    this.checkoutAsync = function (configuration) {
        return new Promise(function (fulfill, reject) {
            $.ajax({
                method: 'CHECKOUT',
                url: _config.base + configuration.resource + (configuration.id ? (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id) : ""),
                headers: configuration.headers,
                async: !configuration.sync,
                success: function (xhr, status, response) {
                    try {
                        if (xhr && response.getResponseHeader("etag"))
                            xhr.etag = response.getResponseHeader("etag");
                        if (fulfill) {
                            if (configuration.headers && configuration.headers["Accept"] == _viewModelJsonMime) {
                                fulfill(_resolveObjectRefs(xhr), configuration.state);
                            }
                            else {
                                fulfill(xhr, configuration.state);
                            }
                        }
                    }
                    catch (e) {
                        if (reject) reject(e.responseJSON || e, configuration.state);
                    }
                },
                error: function (e, data, setting) {
                    if (SanteDB._globalErrorHandler(e, data, setting))
                        return;
                    var error = e.responseJSON;

                    if (reject) {
                        if (error && error.error !== undefined) // oauth2
                            reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                        else if (error && (error.$type === "Exception" || error.$type))
                            reject(new Exception(error.$type, error.message, error.detail, error.cause, error.stack, error.policyId, error.policyOutcome, error.rules), configuration.state);
                        else
                            reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                    }
                    else
                        console.error("UNHANDLED PROMISE REJECT: " + JSON.stringify(e));
                }
            });
        });
    };

    /**
        * @method checkinAsync
        * @memberof APIWrapper
        * @summary Performs a CHECKIN on an existing item on the instance
        * @param {any} configuration The configuration object
        * @param {string} configuration.resource The resource that is to be locked
        * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
        * @param {boolean} configuration.sync When true, executes the request in synchronous mode
        * @param {any} configuration.id The object that is to be locked on the server
        * @param {any} configuration.data The additional data that should be sent for the delete command
        * @param {string} configuration.contentType Identifies the content type of the data
        * @returns {Promise} The promise for the operation
        */
    this.checkinAsync = function (configuration) {
        return new Promise(function (fulfill, reject) {
            $.ajax({
                method: 'CHECKIN',
                url: _config.base + configuration.resource + (configuration.id ? (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id) : ""),
                headers: configuration.headers,
                async: !configuration.sync,
                success: function (xhr, status, response) {
                    try {
                        if (xhr)
                            xhr.etag = response.getResponseHeader("etag");
                        if (fulfill) {
                            if (configuration.headers && configuration.headers["Accept"] == _viewModelJsonMime) {
                                fulfill(_resolveObjectRefs(xhr), configuration.state);
                            }
                            else {
                                fulfill(xhr, configuration.state);
                            }
                        }
                    }
                    catch (e) {
                        if (reject) reject(e.responseJSON || e, configuration.state);
                    }
                },
                error: function (e, data, setting) {
                    if (SanteDB._globalErrorHandler(e, data, setting))
                        return;
                    var error = e.responseJSON;

                    if (reject) {
                        if (error && error.error !== undefined) // oauth2
                            reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                        else if (error && (error.$type === "Exception" || error.$type))
                            reject(new Exception(error.$type, error.message, error.detail, error.cause, error.stack, error.policyId, error.policyOutcome, error.rules), configuration.state);
                        else
                            reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                    }
                    else
                        console.error("UNHANDLED PROMISE REJECT: " + JSON.stringify(e));
                }
            });
        });
    };

    /**
        * @method touchAsync
        * @memberof APIWrapper
        * @summary Performs a TOUCH on an existing item on the instance
        * @param {any} configuration The configuration object
        * @param {string} configuration.resource The resource that is to be locked
        * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
        * @param {boolean} configuration.sync When true, executes the request in synchronous mode
        * @param {any} configuration.id The object that is to be locked on the server
        * @param {any} configuration.data The additional data that should be sent for the delete command
        * @param {string} configuration.contentType Identifies the content type of the data
        * @returns {Promise} The promise for the operation
        */
    this.touchAsync = function (configuration) {
        return new Promise(function (fulfill, reject) {
            $.ajax({
                method: 'TOUCH',
                url: _config.base + configuration.resource + (configuration.id ? (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id) : ""),
                headers: configuration.headers,
                async: !configuration.sync,
                success: function (xhr, status, response) {
                    try {
                        if (xhr && response.getResponseHeader("etag"))
                            xhr.etag = response.getResponseHeader("etag");
                        if (fulfill) {
                            if (configuration.headers && configuration.headers["Accept"] == _viewModelJsonMime) {
                                fulfill(_resolveObjectRefs(xhr), configuration.state);
                            }
                            else {
                                fulfill(xhr, configuration.state);
                            }
                        }
                    }
                    catch (e) {
                        if (reject) reject(e.responseJSON || e, configuration.state);
                    }
                },
                error: function (e, data, setting) {
                    if (SanteDB._globalErrorHandler(e, data, setting))
                        return;
                    var error = e.responseJSON;

                    if (reject) {
                        if (error && error.error !== undefined) // oauth2
                            reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                        else if (error && (error.$type === "Exception" || error.$type))
                            reject(new Exception(error.$type, error.message, error.detail, error.cause, error.stack, error.policyId, error.policyOutcome, error.rules), configuration.state);
                        else
                            reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                    }
                    else
                        console.error("UNHANDLED PROMISE REJECT: " + JSON.stringify(e));
                }
            });
        });
    };
};

/**
* @class
* @constructor
* @summary Represents a wrapper for a SanteDB resource
* @param {any} _config The configuration object
* @param {string} _config.resource The resource that is being wrapped
* @param {APIWrapper} _config.api The API to use for this resource
* @description A static instance of this API can be accessed on the SanteDB.resource property. This provides a convenient way to use this wrapper with all the 
*               built-in SanteDB resource types. Constructing this class should only be used when you are accessing a custom resource or extended resource which is 
*               not in the default SanteDB REST API.
*/
function ResourceWrapper(_config) {

    /**
     * @method getUrl
     * @summary Gets the URL to this resource base
     * @memberof ResourceWrapper
     */
    this.getUrl = function () {
        return `${_config.api.getUrl()}${_config.resource}`;
    };

    /**
        * @method getAsync
        * @memberof ResourceWrapper
        * @summary Retrieves a specific instance of the resource this wrapper wraps
        * @param {string} id The unique identifier of the resource to retrieve
        * @param {string} viewModel A unique state object which is passed back to the caller
        * @param {any} parms Extra parameters to pass to the get function
        * @param {any} state A unique state object which is passed back to the caller
        * @param {boolean} upstream True if the get should be directly submitted to the upstream iCDR server
        * @returns {Promise} The promise for the operation
        * @example Fetch a patient by ID
        *   async function fetchPatient(id) {
        *       try {
        *           // fetch from local dCDR repository
        *           var local = await SanteDB.resource.patient.getAsync(id, "_full", null, false);
        *           // fetch from remote dCDR repository
        *           var remote = await SanteDB.resource.patient.getAsync(id, "_fall", null, true);
        *           console.info({ "local" : local, "remote" : remote });
        *       }
        *       catch(e) {
        *           console.error(e);
        *       }
        *   }
        */
    this.getAsync = function (id, viewModel, query, upstream, state) {

        var headers = {
            Accept: _config.accept
        };

        // Prepare query
        var url = null;
        if (id) {
            if (id.id)
                url = `${_config.resource}/${id.id}`;
            else
                url = `${_config.resource}/${id}`;

            if (id.version)
                url += `/_history/${id.version}`;
        }
        else
            url = _config.resource;

        if (id && id._upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = id._upstream;
        }

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        if (viewModel)
            headers["X-SanteDB-ViewModel"] = viewModel;
        else if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;
        else if (id && id.viewModel)
            headers["X-SanteDB-ViewModel"] = id.viewModel;

        return _config.api.getAsync({
            headers: headers,
            state: state,
            resource: url,
            query: query
        });
    };

    /**
        * @method findAsync
        * @memberof ResourceWrapper
        * @summary Queries for instances of the resource this wrapper wraps
        * @param {any} query The HDSI query to filter on
        * @param {any} viewModel The view model definition to use when loading
        * @param {any} state A unique state object which is passed back to the caller
        * @param {boolean} upstream True if the query should be directly submitted to the upstream iCDR server
        * @returns {Promise} The promise for the operation
        * @description This method will execute a full HDSI or AMI query against the SanteDB REST API. The HDSI query {@link https://help.santesuite.org/developers/service-apis/health-data-service-interface-hdsi/hdsi-query-syntax}
        *                is represented as a JavaScript object with the property path being the key and filter value being the value. Multiple values for the filter property can be expressed as an array. The 
        *                result of this is a {@link Bundle}.
        * @example Query for John or Jane Smith
        *   async function queryForJohnOrJane() {
        *       try {
        *           var results = await SanteDB.resources.patient.findAsync({
        *               "name.component[Given].value" : [ 'John', 'Jane' ],
        *               "name.component[Family].value" : 'Smith'
        *           }, 'full', false);
        *           console.info("Found " + results.total + " matching results");
        *           results.resource.forEach(r => console.info(r)); // output results
        *       }
        *       catch(e) {
        *           console.error(e);
        *       }
        *   }
        */
    this.findAsync = function (query, viewModel, upstream, state) {

        var headers = {
            Accept: _config.accept
        };
        query = query || {};

        if (viewModel)
            headers["X-SanteDB-ViewModel"] = viewModel;
        else if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        if (query._includeTotal === undefined) {
            query._includeTotal = true;
        }

        return _config.api.getAsync({
            headers: headers,
            query: query,
            state: state,
            resource: _config.resource
        });
    };

    /**
     * @method find
     * @memberof ResourceWrapper
     * @param {any} query The query for the object that you are looking for
     * @summary Queries for instances of the resource this wrapper wraps in a synchronous fashion
     * @see {SanteDBWrapper.findAsync} For asynchronous method
     * @return {Promise} A promise which is blocked and not executed until the operation is complete
     */
    this.find = function (query) {

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        return _config.api.getAsync({
            headers: headers,
            sync: true,
            resource: _config.resource,
            query: query
        });
    }

    /**
        * @method insertAsync
        * @memberof ResourceWrapper
        * @summary Inserts a specific instance of the wrapped resource
        * @param {any} data The data / resource which is to be created
        * @param {any} state A unique state object which is passed back to the caller
        * @param {boolean} upstream True if the registration should be directly submitted to the upstream iCDR server
        * @returns {Promise} The promise for the operation
        * @description When inserting data into the CDR, it is important that the object passed into {@param data} has an appropriate $type which matches the type of data being 
        *               sent. This check is done to ensure that a {@link Patient} is not submitted to the {@link Act} endpoint.
        * @example Register a new Place
        * async function registerNewPlace(name) {
        *   try {
        *       var place = await SanteDB.resources.place.insertAsync(new Place({
        *           classConcept: EntityClassKeys.CityOrTown,
        *           name : {    
        *               OfficialRecord : [
        *                   {
        *                       component : {   
        *                           $other : [
        *                               name
        *                           ]
        *                       }
        *                   }
        *               ]
        *           }
        *       }));
        *       console.info("Registered place successfully!", place);
        *   }
        *   catch (e) {
        *       console.error(e);
        *   }
        * }
        */
    this.insertAsync = function (data, upstream, state) {

        if (data.$type !== _config.resource && data.$type !== `${_config.resource}Info` && data.$type !== `${_config.resource}Definition`)
            throw new Exception("ArgumentException", "error.invalidType", `Invalid type, resource wrapper expects ${_config.resource} however ${data.$type} specified`);

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        var resource = _config.resource;
        // Does the resource have an ID? If so then do CreateOrUpdate
        if (data.id)
            resource += "/" + data.id;

        if (data.createdBy)
            delete (data.createdBy);
        if (data.creationTime)
            delete (data.creationTime);

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        // Perform post
        return _config.api.postAsync({
            headers: headers,
            data: data,
            state: state,
            contentType: _config.accept,
            resource: resource
        });
    };

    /**
     * @method patchAsync
     * @memberof ResourceWrapper
     * @summary Sends a patch to the service
     * @param {string} id The identifier of the object to patch
     * @param {string} etag The e-tag to assert
     * @param {boolean} upstream True if the registration should be directly submitted to the upstream iCDR server
     * @param {Patch} patch The patch to be applied
     * @param {any} state A unique state object which is passed back to the caller
     * @returns {Promise} The promise for the operation
     * @description The patching operation is used to update a portion of the resource without subimtting the entirety of the object to the dCDR or iCDR 
     *               server ({@link https://help.santesuite.org/developers/service-apis/health-data-service-interface-hdsi/patching})
     */
    this.patchAsync = function (id, etag, patch, force, upstream, state) {
        if (patch.$type !== "Patch")
            throw new Exception("ArgumentException", "error.invalidType", `Invalid type, resource wrapper expects ${_config.resource} however ${data.$type} specified`);

        var headers = {};
        if (etag) {
            headers['If-Match'] = etag;
        }

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        if (force) {
            headers['X-Patch-Force'] = true;
        }

        patch.appliesTo = patch.appliesTo || {};
        patch.appliesTo.id = patch.appliesTo.id || id;
        patch.appliesTo.type = patch.appliesTo.type || _config.resource;

        // Send PUT
        return _config.api.patchAsync({
            headers: headers,
            data: patch,
            id: id,
            state: state,
            contentType: "application/x.santedb.patch+json",
            resource: _config.resource
        });
    }

    /**
        * @method updateAsync
        * @memberof ResourceWrapper
        * @summary Updates the identified instance of the wrapped resource
        * @param {string} id The unique identifier for the object to be updated
        * @param {any} data The data / resource which is to be updated
        * @param {any} state A unique state object which is passed back to the caller
        * @param {boolean} upstream True if the update should be directly submitted to the upstream iCDR server
        * @returns {Promise} The promise for the operation
        */
    this.updateAsync = function (id, data, upstream, state) {

        if (data.id && data.id !== id)
            throw new Exception("ArgumentException", "error.invalidValue", `Identifier mismatch, PUT identifier  ${id} doesn't match ${data.id}`);

        if (data.updatedBy)
            delete (data.updatedBy);
        if (data.updatedTime)
            delete (data.updatedTime);

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        // Send PUT
        return _config.api.putAsync({
            headers: headers,
            data: data,
            id: id,
            state: state,
            contentType: _config.accept,
            resource: _config.resource
        });
    };

    /**
    * @method deleteAsync
    * @memberof ResourceWrapper
    * @summary Performs an obsolete (delete) operation on the server
    * @param {string} id The unique identifier for the object to be deleted
    * @param {any} state A unique state object which is passed back to the caller
    * @param {boolean} upstream True if the delete should be directly submitted to the upstream iCDR server
    * @returns {Promise} The promise for the operation
    */
    this.deleteAsync = function (id, upstream, state) {

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        return _config.api.deleteAsync({
            headers: headers,
            id: id,
            state: state,
            contentType: _config.accept,
            resource: _config.resource
        });
    };

    /**
    * @method lockAsync
    * @memberof ResourceWrapper
    * @summary Performs the specified LOCK operation on the server
    * @param {string} id The unique identifier for the object on which the invokation is to be called
    * @param {any} state A unique state object which is passed back to the caller
    * @param {boolean} upstream True if the registration should be directly submitted to the upstream iCDR server
    * @returns {Promise} The promise for the operation
    */
    this.lockAsync = function (id, upstream, state) {

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        return _config.api.lockAsync({
            headers: headers,
            id: id,
            state: state,
            resource: _config.resource
        });
    };

    /**
    * @method unLockAsync
    * @memberof ResourceWrapper
    * @summary Performs the specified UNLOCK operation on the server
    * @param {string} id The unique identifier for the object on which the invokation is to be called
    * @param {any} state A unique state object which is passed back to the caller
    * @param {boolean} upstream True if the registration should be directly submitted to the upstream iCDR server
    * @returns {Promise} The promise for the operation
    */
    this.unLockAsync = function (id, upstream, state) {

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        return _config.api.unLockAsync({
            headers: headers,
            id: id,
            state: state,
            resource: _config.resource
        });
    };

    /**
    * @method lockAsync
    * @memberof ResourceWrapper
    * @summary Performs the specified CHECKOUT operation on the server
    * @param {string} id The unique identifier for the object on which the invokation is to be called
    * @param {any} state A unique state object which is passed back to the caller
    * @param {boolean} upstream True if the registration should be directly submitted to the upstream iCDR server
    * @returns {Promise} The promise for the operation
    * @description The checkout and {@link checkinAsync} methods  are used to control concurrent editing of a resource. It is typically recommended to checkout a resource when a user 
    *               begins editing an object and perform a checkin when the operation is complete. The iCDR and dCDR will do this automatically when a PUT request is submitted, however
    *               this occurs after the data is submitted. By performing interactive CHECKOUT and CHECKIN commands you can add an indicator to your user interface to inform th euser
    *               that another user is editing the object.
    * @example Checkout / Update / Checkin
    * 
    * async loadPatient(id) {
    *   try {
    *       await SanteDB.resource.patient.checkoutAsync(id); // attempt to get a lock - this will throw an exception if unsuccessful
    *       var patient = await SanteDB.resources.patient.getAsync(id); // get the latest version no we're checked out
    *       $timeout(s => s.patient = patient); // Add to scope    
    *   }
    *   catch(e) {
    *       $timeout(s => s.isLockedOut = true);
    *   }
    * }
    * 
    * async savePatient(id, patient) {
    *   try {
    *       var patient = await SanteDB.resources.patient.updateAsync(id, patient);
    *       await SanteDB.resources.checkinAsync(id);
    *   }
    *   catch(e) {
    *       console.error(e);
    *   }
    * }
    */
    this.checkoutAsync = function (id, upstream, state) {

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        return _config.api.checkoutAsync({
            headers: headers,
            id: id,
            state: state,
            resource: _config.resource
        });
    };

    /**
    * @method unLockAsync
    * @memberof ResourceWrapper
    * @summary Performs the specified CHECKIN operation on the server
    * @param {string} id The unique identifier for the object on which the invokation is to be called
    * @param {any} state A unique state object which is passed back to the caller
    * @param {boolean} upstream True if the registration should be directly submitted to the upstream iCDR server
    * @returns {Promise} The promise for the operation
    */
    this.checkinAsync = function (id, upstream, state) {

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        return _config.api.checkinAsync({
            headers: headers,
            id: id,
            state: state,
            resource: _config.resource
        });
    };

    /**
    * @method touchAsync
    * @memberof ResourceWrapper
    * @summary Performs a TOUCH operation on the specified resource (updating it's modfiedOn time)
    * @param {string} id The unique identifier for the object on which the invokation is to be called
    * @param {boolean} upstream True if the registration should be directly submitted to the upstream iCDR server
    * @param {any} state A unique state object which is passed back to the caller
    * @returns {Promise} The promise for the operation
    * @description The touch method is useful when a user or administrator wants to force the modifiedOn time to be changed on the dCDR or iCDR service. Any subsequenet synchronization
    *                request will see the object as changed, and will re-download the resource. This is especially useful if the data was updated using the database and SQL.
    */
    this.touchAsync = function (id, state) {

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        return _config.api.touchAsync({
            headers: headers,
            id: id,
            state: state,
            resource: _config.resource
        });
    };

    /**
   * @method copyAsync
   * @memberof ResourceWrapper
   * @summary Performs a COPY operation on the specified resource (creating a copy from remote)
   * @param {string} id The unique identifier for the object on which the invokation is to be called
   * @param {any} state A unique state object which is passed back to the caller
   * @returns {Promise} The promise for the operation
   * @description The copy method is used by the dCDR to download a resource which has been fetched from an upstream iCDR server and create a local dCDR instance of the object.
   */
    this.copyAsync = function (id, state) {

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        return _config.api.copyAsync({
            headers: headers,
            id: id,
            state: state,
            resource: _config.resource
        });
    };

    /**
        * @method nullifyAsync
        * @memberof ResourceWrapper
        * @summary Performs a nullify on the specified object
        * @description A nullify differs from a delete in that a nullify marks an object as "never existed"
        * @param {string} id The unique identifier for the object to be nullified
        * @param {any} state A unique state object which is passed back to the caller
        * @param {boolean} upstream True if the registration should be directly submitted to the upstream iCDR server
        * @returns {Promise} The promise for the operation
        */
    this.nullifyAsync = function (id, upstream, state) {

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        return _config.api.deleteAsync({
            headers: headers,
            id: id,
            mode: "NULLIFY",
            state: state,
            resource: _config.resource
        });
    };

    /**
        * @method cancelAsync
        * @memberof ResourceWrapper
        * @summary Performs a cancel on the specified object
        * @description A cancel differs from a delete in that a cancel triggers a state change from NORMAL>CANCELLED
        * @param {string} id The unique identifier for the object to be cancelled
        * @param {any} state A unique state object which is passed back to the caller
        * @returns {Promise} The promise for the operation
        * @param {boolean} upstream True if the registration should be directly submitted to the upstream iCDR server
        */
    this.cancelAsync = function (id, upstream, state) {
        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        return _config.api.deleteAsync({
            headers: headers,
            id: id,
            mode: "CANCEL",
            state: state,
            resource: _config.resource

        });
    };


    /**
        * @method cancelAsync
        * @memberof ResourceWrapper
        * @summary Performs an obsolete on the specified object
        * @description An obsolete differs from a delete in that a cancel triggers a state change from NORMAL>OBSOLETE
        * @param {string} id The unique identifier for the object to be cancelled
        * @param {boolean} upstream True if the registration should be directly submitted to the upstream iCDR server
        * @param {any} state A unique state object which is passed back to the caller
        * @returns {Promise} The promise for the operation
        */
    this.obsoleteAsync = function (id, upstream, state) {
        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        return _config.api.deleteAsync({
            headers: headers,
            id: id,
            mode: "OBSOLETE",
            state: state,
            resource: _config.resource

        });
    };

    /**
     * @method findAssociatedAsync
     * @memberof ResourceWrapper
     * @summary Performs a find operation on an associated object
     * @description Some resources allow you to chain queries which automatically scopes the results to the container
     * @param {string} id The identifier of the object whose children you want query 
     * @param {string} property The property path you would like to filter on 
     * @param {any} query The query you want to execute
     * @param {boolean} upstream True if the registration should be directly submitted to the upstream iCDR server
     * @param {string} viewModel The viewmodel asset to use to render the response
     * @returns {Promise} A promise for when the request completes
     * @description In the HDSI REST interface, an "associated" object is a sub-property or chained property on a parent resource. The resource has to support this type 
     *               of relationship, and must have a registered child property. This method will allow the JavaScript API to access these chained resources. Like the findAsync
     *              method, the result of this operation is usually a {@link Bundle}
     * @example Get Groups a User belongs to
     * async getGroups(userName) {
     *  try {
     *      var users = await SanteDB.resources.securityUser.findAsync({ "userName" : userName });
     *      var userId = users.resource[0].id;
     *      // Fetch the groups
     *      var groups = await SanteDB.resources.securityUser.findAssociatedAsync(userId, 'groups');
     *      console.info(groups.resource)
     *  }
     *  catch(e) {
     *      console.error(e);
     *  }
     * }
     * @see https://help.santesuite.org/developers/service-apis/health-data-service-interface-hdsi/http-request-verbs#associated-resources
     */
    this.findAssociatedAsync = function (id, property, query, viewModel, upstream, state) {

        if (!property)
            throw new Exception("ArgumentNullException", "Missing scoping property");

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;
        else if (viewModel)
            headers["X-SanteDB-ViewModel"] = viewModel;

        // Prepare query
        var url = null;
        if (!id)
            url = `${_config.resource}/${property}`;
        else if (id.id)
            url = `${_config.resource}/${id.id}/${property}`;
        else
            url = `${_config.resource}/${id}/${property}`;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        return _config.api.getAsync({
            headers: headers,
            query: query,
            state: state,
            resource: url
        });
    };

    /**
     * @method addAssociatedAsync
     * @memberof ResourceWrapper
     * @summary Adds a new association to the specified parent object at the specified path
     * @param {string} id The identifier of the container
     * @param {string} property The associative property you want to add the value to
     * @param {any} data The data to be added as an associative object (note: Most resources require that this object already exist)
     * @param {any} state A stateful object for callback correlation
     * @param {boolean} upstream True if the registration should be directly submitted to the upstream iCDR server
     * @returns {Promise} A promise which is fulfilled when the request is complete
     * @see ResourceWrapper.findAssociatedAsync
     * @see https://help.santesuite.org/developers/service-apis/health-data-service-interface-hdsi/http-request-verbs#associated-resources
     */
    this.addAssociatedAsync = function (id, property, data, upstream, state) {

        if (!property)
            throw new Exception("ArgumentNullException", "Missing scoping property");

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        // Prepare path
        var url = null;
        if (!id)
            url = `${_config.resource}/${property}`;
        else if (id.id)
            url = `${_config.resource}/${id.id}/${property}`;
        else
            url = `${_config.resource}/${id}/${property}`;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        return _config.api.postAsync({
            headers: headers,
            data: data,
            state: state,
            resource: url,
            contentType: _config.accept

        });
    };

    /**
     * @method removeAssociatedAsync
     * @memberof ResourceWrapper
     * @summary Removes an existing associated object from the specified scoper
     * @param {string} id The identifier of the container object
     * @param {string} property The property path from which the object is to be removed
     * @param {string} associatedId The identifier of the sub-object to be removed
     * @param {any} state A state for correlating multiple requests
     * @param {Boolean} upstream True if the query should be sent to upstream service
     * @returns {Promise} A promise which is fulfilled when the request comletes
     * @see ResourceWrapper.findAssociatedAsync
     * @see https://help.santesuite.org/developers/service-apis/health-data-service-interface-hdsi/http-request-verbs#associated-resources
     */
    this.removeAssociatedAsync = function (id, property, associatedId, upstream, state) {
        if (!property)
            throw new Exception("ArgumentNullException", "Missing scoping property");
        else if (!associatedId)
            throw new Exception("ArgumentNullException", "Missing associated object id");

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        // Prepare path
        var url = null;
        if (!id)
            url = `${_config.resource}/${property}`;
        else if (id.id)
            url = `${_config.resource}/${id.id}/${property}`;
        else
            url = `${_config.resource}/${id}/${property}`;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        return _config.api.deleteAsync({
            headers: headers,
            id: associatedId,
            state: state,
            resource: url,
            contentType: _config.accept
        });
    }

    /**
     * @method getAssociatedAsync
     * @memberof ResourceWrapper
     * @summary Retrieves an existing associated object from the specified scoper
     * @param {string} id The identifier of the container object
     * @param {string} property The property path from which the object is to be retrieved
     * @param {string} associatedId The identifier of the sub-object to be retrieved
     * @param {any} state A state for correlating multiple requests
     * @returns {Promise} A promise which is fulfilled when the request comletes
     * @see ResourceWrapper.findAssociatedAsync
     * @see https://help.santesuite.org/developers/service-apis/health-data-service-interface-hdsi/http-request-verbs#associated-resources
     */
    this.getAssociatedAsync = function (id, property, associatedId, query, upstream, state) {
        if (!id)
            throw new Exception("ArgumentNullException", "Missing scoping identifier");
        else if (!property)
            throw new Exception("ArgumentNullException", "Missing scoping property");
        else if (!associatedId)
            throw new Exception("ArgumentNullException", "Missing associated object id");

        var headers = {
            Accept: _config.accept
        };
        if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        // Prepare path
        var url = null;
        if (id.id)
            url = `${_config.resource}/${id.id}/${property}`;
        else
            url = `${_config.resource}/${id}/${property}`;

        if (associatedId.id)
            url += `/${encodeURI(associatedId.id)}`;
        else
            url += `/${encodeURI(associatedId)}`;

        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        return _config.api.getAsync({
            query: query,
            headers: headers,
            state: state,
            resource: url,
            contentType: _config.accept
        });
    }

    /**
    * @method invokeOperationAsync
    * @memberof ResourceWrapper
    * @summary Invokes the specified method on the specified object
    * @param {string} id The identifier of the container (null if global execute)
    * @param {string} operation The operation you want to execute
    * @param {any} parameters The parameters to the operation being executes (example: { clear: true, softFind: true })
    * @param {bool} upstream True if the operation shold be executed opstream 
    * @param {string} viewModel The view model which should be used to load data
    * @param {object} state A tracking state to send to the callback
    * @param {string} viewModel The view model to use to load returned properties
    * @returns {Promise} A promise which is fulfilled when the request is complete
    * @description SanteDB's iCDR and dCDR HDSI interfaces allow for the invokation of operations ({@link https://help.santesuite.org/developers/service-apis/health-data-service-interface-hdsi/http-request-verbs#operations}). 
    *               Operations aren't resources per-se, rather they are remote procedure calls where a caller can pass parameters to the operation. Invokable operations can be bound to specific instances 
    *               (they operate on a single instance of an object, in which case the id parameter is required), or on a class (in which case id should be undefined).
    * @example Start all Jobs
    * async function startAllJobs() {
    *   try {
    *       var jobs = await SanteDB.resources.jobInfo.findAsync();
    *       await Promise.all(jobs.resource.map(j => SanteDB.resources.jobInfo.invokeOperationAsync(j.id, "start")));
    *   }
    *   catch(e) {
    *       console.error(e);
    *   }
    * }
    */
    this.invokeOperationAsync = function (id, operation, parameters, upstream, viewModel, state) {


        if (!operation)
            throw new Exception("ArgumentNullException", "Missing scoping property");

        var headers = {
            Accept: _config.accept
        };
        if (viewModel)
            headers["X-SanteDB-ViewModel"] = viewModel;
        else if (_config.viewModel)
            headers["X-SanteDB-ViewModel"] = _config.viewModel;

        // Prepare path
        var url = null;
        if (!id)
            url = `${_config.resource}/$${operation}`;
        else if (id.id)
            url = `${_config.resource}/${id.id}/$${operation}`;
        else
            url = `${_config.resource}/${id}/$${operation}`;


        if (upstream !== undefined) {
            headers["X-SanteDB-Upstream"] = upstream;
        }

        // Prepare parameters object 
        var requestParms = { parameter: [] };
        if (parameters) {
            Object.keys(parameters).forEach(p => requestParms.parameter.push({ name: p, value: parameters[p] }));
        }

        return _config.api.postAsync({
            headers: headers,
            data: requestParms,
            state: state,
            resource: url,
            contentType: _config.accept

        });
    }
};

//if (!SanteDB) 
/**
 * @class
 * @static
 * @constructor
 * @summary SanteDB Binding Class
 * @description This class exists as a simple interface which is implemented by host implementations of the SanteDB hostable core. This interface remains the same even though the 
 *              implementations of this file on each platform (Admin, BRE, Client, etc.) are different.
 * @property {SanteDBWrapper.ApplicationApi} application Functions for accessing the core application API
 * @property {SanteDBWrapper.ResourceApi} resources Functions for accessing resource APIs
 * @property {SanteDBWrapper.ConfigurationApi} configuration Functions for accessing application configuration
 * @property {SanteDBWrapper.AuthenticationApi} authentication Functions for authentication 
 * @property {SanteDBWrapper.LocalizationApi} localization Functions related to localization
    * @property {*} api Provides direct access to API instances
    * @property {SanteDBWrapper.APIWrapper} api.hdsi Reference to the configured Health Data Service Interface helper
    * @property {SanteDBWrapper.APIWrapper} api.ami Reference to the configured Administration Management Interface helper
 */
function SanteDBWrapper() {
    "use strict";

    var _viewModelJsonMime = "application/x.santedb.rim.viewModel+json"; // "application/json+sdb-viewmodel";

    // JWS Pattern
    var jwsDataPattern = /^([A-Za-z0-9-_\+\/]+?)\.([A-Za-z0-9-_\+\/]+?)\.([A-Za-z0-9-_\+\/]+?)$/;
    var svrpPattern = /^svrp\:\/\/([A-Za-z0-9-_\+\/]+?)\.([A-Za-z0-9-_\+\/]+?)\.([A-Za-z0-9-_\+\/]+?)$/;

    // Get the version of this API Wrapper
    this.getVersion = function () {
        return __SanteDBAppService.GetVersion();
    }

    /**
     * @public
     * @summary Convert an object to parameters
     * @param {any} object The JavaScript object to convert to a parameters
     * @return {Parameters} The parameters
     */
    this.convertToParameters = function (object) {
        return { parameter: Object.keys(object).map(k => { return { name: k, value: object[k] } }) };
    }

    /**
     * @public
     * @summary Convert parameters to an object
     * @param {Parameters} parms The parameters to convert
     * @return {any} The JavaScript object 
     */
    this.convertFromParameters = function (parms) {
        if (!parms.parameter) {
            return null;
        }

        var retVal = {};
        parms.parameter.forEach(p => retVal[p.name] = p.value);
        return retVal;
    }

    /**
     * @private
     * @summary Policy violation exception handler
     * @param {*} faultJson The Fault message
     * @returns {bool} True if the fault JSON inidcates a policy violation
     */
    var _getPolicyException = function (faultJson) {
        do {
            if (faultJson.$type == "PolicyViolationException") {
                return faultJson;
            }
            faultJson = faultJson.cause;
        } while (faultJson)
        return null;
    }

    /**
     * @private
     * @summary Global error handler
     * @param {xhr} e The Errored request
     * @param {*} data 
     * @param {*} setting 
     * @param {*} err 
     */
    var _globalErrorHandler = function (data, setting, err) {
        if (data.status == 401 && data.getResponseHeader("WWW-Authenticate")) {
            if (_session &&
                _session.exp > Date.now() && // User has a session that is valid, but is still 401 hmm... elevation!!!
                _elevator &&
                !_elevator.getToken() ||
                (_session == null || !_session.access_token) && _elevator) {

                var pve = _getPolicyException(data.responseJSON);
                // Was the response a security policy exception where the back end is asking for elevation on the same user account?
                if (data.responseJSON &&
                    pve &&
                    data.getResponseHeader("WWW-Authenticate").indexOf("insufficient_scope") > -1)
                    _elevator.elevate(angular.copy(_session), [pve.policyId, "*"]);
                else
                    _elevator.elevate(null);
                return true;
            }
        }
        else
            console.warn(new Exception("Exception", "error.general", err, null));
        return false;
    };

    /**
     * @private
     * @summary Re-orders the JSON object properties so that $type appears as the first property
     * @param {any} object The object whose properites should be reordered
     * @returns {any} The appropriately ordered object
     */
    var _reorderProperties = function (object) {

        // Object has $type and $type is not the first property
        if (object.$type) {
            var retVal = { $type: object.$type };
            Object.keys(object).filter(function (d) { return d != "$type" && !d.endsWith("Model") })
                .forEach(function (k) {
                    retVal[k] = object[k];
                    if (!retVal[k] || k.startsWith("_"));
                    else if (retVal[k].$type) // reorder k
                        retVal[k] = _reorderProperties(retVal[k]);
                    else if (Array.isArray(retVal[k]))
                        for (var i in retVal[k])
                            if (retVal[k][i].$type)
                                retVal[k][i] = _reorderProperties(retVal[k][i]);
                });
            return retVal;
        }
        return object;
    };

    this._reorderProperties = _reorderProperties;
    this._globalErrorHandler = _globalErrorHandler;

    // hdsi internal
    var _hdsi = new APIWrapper({
        idByQuery: false,
        base: "/hdsi/"
    });
    // ami internal
    var _ami = new APIWrapper({
        idByQuery: false,
        base: "/ami/"
    });
    // auth internal
    var _auth = new APIWrapper({
        idByQuery: false,
        base: "/auth/"
    });
    // Backing data for app API
    var _app = new APIWrapper({
        base: "/app/",
        idByQuery: false
    });

    /**
     * @class
     * @constructor
     * @memberof SanteDBWrapper
     * @summary Common functions for accessing SanteDB application processes
     */
    function ApplicationApi() {

        const _skipCopy = ["$type", "$objId", "$id", "previousVersion", "holder", "source", "act", "creationTime", "createdBy", "updatedBy", "updatedTime", "id", "version", "sequence", "effectiveVersionSequence", "obsoleteVersionSequence"];
        var _idGenerators = {};
        var _resourceStates = {};
        var _idParsers = {};
        var _idClassifiers = {};
        var _templateCache = undefined;
        var _identifierValidator = {};

        /**
         * @summary Attempts to parse te JWS data contained in a scanned barcode into logical identifier structure
         * @param {*} jwsData The data to be parsed in SVRP format
         * @returns {object} The entity which is described in the SVRP
         */
        async function _extractJwsData(jwsData) {
            try {
                var jwsHeaderData = atob(jwsData[1]);

                var jwsBody = null;
                var jwsHeader = JSON.parse(jwsHeaderData);
                if (jwsHeader.zip) {
                    var decompress = null;
                    switch (jwsHeader.zip) {
                        case "DEF":
                            decompress = new DecompressionStream("deflate-raw");
                            break;
                        case "GZ":
                            decompress = new DecompressionStream("gzip");
                            break;
                    }
                    var buffer = jwsData[2].b64DecodeBuffer(true);
                    var blob = new Blob([buffer]);
                    var reader = blob.stream().pipeThrough(decompress).getReader();
                    var data = await reader.read();
                    jwsBody = JSON.parse(new TextDecoder().decode(data.value));
                }
                else {
                    var jwsBodyData = jwsData[2].b64DecodeBuffer();
                    jwsBody = JSON.parse(new TextDecoder().decode(jwsBodyData));
                }

                // Return the data element
                return {
                    header: jwsHeader,
                    body: jwsBody
                }
            }
            catch (e) {
                throw new Exception("JwsParseError", e);
            }
        }

        /**
         * @summary Copies objects from @fromObject to @toObject stripping any identification data
         * @param {any} toObject The object to which the values are copied
         * @param {any} fromObject The object from which the values are to be copied 
         * @param {bool} overwrite When true overwrite existing values in @toObject
         */
        function copyValues(toObject, fromObject) {

            if (Array.isArray(fromObject)) {
                for (var i = 0; i < fromObject.length; i++) {
                    var copyElement = toObject[i] || {};
                    if (fromObject[i] == copyElement) continue; // No need to process same value
                    else if (!copyValues(copyElement, fromObject[i])) {
                        copyElement = fromObject[i];
                    }

                    if (toObject.length <= i) {
                        toObject.push(copyElement);
                    } else {
                        toObject[i] = copyElement;
                    }
                }
                return true;
            }
            else if (angular.isObject(fromObject) && !angular.isDate(fromObject)) {
                Object.keys(fromObject).filter(k => _skipCopy.indexOf(k) == -1).forEach(k => {
                    if (!fromObject[k]) {
                        return; // no copy
                    }

                    if (Array.isArray(fromObject[k])) {
                        toObject[k] = toObject[k] || [];
                    }
                    else {
                        toObject[k] = toObject[k] || {};
                    }
                    if (!copyValues(toObject[k], fromObject[k])) {
                        toObject[k] = fromObject[k];
                    }
                });
                return true;
            }
            else {
                return false;
            }
        }

        this.copyValues = copyValues;
        /**
         * @summary Fetches sub-templates 
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {*} collection The participation or relationship property to be fetched
         * @param {*} parms The parameters to fill the template with
         * @description In some templates, sub objects will have no $type, and just a reference to a template mnemonic. This method will take a template
         *              object and will resolve these references to other templates. {@link https://help.santesuite.org/santedb/data-and-information-architecture/conceptual-data-model#templates}
         */
        async function getSubTemplates(collection, parms) {
            var promises = Object.keys(collection).map(function (key) {
                try {
                    var relationships = collection[key];

                    if (!Array.isArray(relationships))
                        collection[key] = relationships = [relationships];

                    // Actually fill out model
                    return relationships.map(async function (rel) {
                        try {

                            var targetProperty = rel.playerModel || rel.targetModel;

                            if (targetProperty && !targetProperty.classConcept && targetProperty.templateModel) {
                                var object = await _resources.template.getAsync(targetProperty.templateModel.mnemonic, "full", parms);

                                // Initialize the template 
                                if (object.tag) {
                                    Object.keys(object.tag).filter(o => o.indexOf("$copy") == 0).forEach(function (k) {
                                        var target = k.substring(6);
                                        var source = object.tag[k];

                                        // Analyze
                                        var scopedValue = object;
                                        source.split('.').forEach(function (s) { if (scopedValue) scopedValue = scopedValue[s]; });

                                        object[target] = copyObject(scopedValue, true);

                                    })
                                }

                                if (object.relationship)
                                    object.relationship = await getSubTemplates(object.relationship, parms);

                                if (rel.playerModel) {
                                    rel.playerModel = object;
                                    Object.keys(targetProperty).forEach(subKey => rel.playerModel[subKey] = rel.playerModel[subKey] || targetProperty[subKey]);
                                }
                                else {
                                    rel.targetModel = object;
                                    Object.keys(targetProperty).forEach(subKey => rel.targetModel[subKey] = rel.targetModel[subKey] || targetProperty[subKey]);
                                }

                                return true;
                            }
                            return false;
                        }
                        catch (e) {
                            console.error(`Error filling ${rel}`, e);
                        }
                    });
                }
                catch (e) {
                    console.error(`Error filling ${key}`, e);
                }
            }).flat();
            await Promise.all(promises);
            return collection;
        }

        /**
         * @summary Encode an extension reference
         * @param {string} type The type of reference being created
         * @param {guid} key The key of the reference or the object
         * @returns {string} An appropriately formatted reference extension
         */
        this.encodeReferenceExtension = function (type, key) {
            switch (type) {
                case Entity.name:
                case Patient.name:
                case Person.name:
                case Place.name:
                case UserEntity.name:
                case Organization.name:
                case DeviceEntity.name:
                case ApplicationEntity.name:
                    return btoa(`0^${key}`);
                case Act.name:
                case PatientEncounter.name:
                case SubstanceAdministration.name:
                case Observation.name:
                case Narrative.name:
                case Procedure.name:
                    return btoa(`1^${key}`);
                case Concept.name:
                    return btoa(`2^${key}`);
                default:
                    throw Exception("ArgumentOutOfRangeException", "Unknown reference type");
            }
        }

        /**
         * @summary Resolves the object which is referenced in the extension
         * @param {string} extensionValue The value of the reference extension
         * @returns {IdentifiedData} The resolved object
         */
        this.resolveReferenceExtensionAsync = function (extensionValue) {
            var valPart = atob(extensionValue).split('^');
            switch (valPart[0]) {
                case '0':
                    return SanteDB.resources.entity.getAsync(valPart[1], "fastview");
                case '1':
                    return SanteDB.resources.act.getAsync(valPart[1], "fastview");
                case '2':
                    return SanteDB.resources.concept.getAsync(valPart[1], "fastview");
                default:
                    throw new Exception("InvalidOperationException", "Unknown reference type");
            }
        }

        /**
         * @memberof SanteDBWrapper.ApplicationApi
        * @summary Wraps native printing functionality for the host operating system
        */
        this.printView = function () {
            __SanteDBAppService.Print();
        }

        /**
         * @method scanIdentifierAsync
         * @memberof SanteDBWrapper.ApplicationApi
         * @summary Scans a barcode using {@link scanBarcodeAsync} however interprets the identifier rather than returning the raw data
         * @returns {string} The interpreted barcode identifier information
         * @see https://help.santesuite.org/developers/service-apis/health-data-service-interface-hdsi/digitally-signed-visual-code-api
         */
        this.scanIdentifierAsync = async function () {
            var data = await SanteDB.application.scanBarcodeAsync();

            if (svrpPattern.test(data)) {
                var jwsData = svrpPattern.exec(data);
                var rawJwsData = await _extractJwsData(jwsData);
                rawJwsData.body.data.id = rawJwsData.body.sub;
                return rawJwsData.body.data;
            }
            else if (jwsDataPattern.test(data)) {
                var jwsData = jwsDataPattern.exec(data);
                var rawJwsData = await _extractJwsData(jwsData);
                rawJwsData.body.data.id = rawJwsData.body.sub;
                return rawJwsData.body.data;
            }
            else {
                var idDomain = SanteDB.application.classifyIdentifier(data);
                if (idDomain.length == 1) {
                    var parser = SanteDB.application.getIdentifierParser(idDomain[0]);
                    if (parser) data = parser(data);
                }
                return data;
            }
        }

        /**
         * @method searchByBarcodeAsync
         * @summary Performs a search using barcode data
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {*} qrCodeData The QR Code data already scanned
         * @param {*} noValidate True if the barcode should not be validated
         * @param {*} upstream True if search upstream
         * @param {bool} noExec When true, don't execute the search just return the search parameters
         * @description This method will use the barcode providers referenced to parse information from the barcode and will search the HDSI for the object which the 
         *                barcode represents. This method works best with the SanteDB VRP API {@link https://help.santesuite.org/developers/service-apis/health-data-service-interface-hdsi/digitally-signed-visual-code-api}
         */
        this.searchByBarcodeAsync = async function (qrCodeData, noValidate, upstream, noExec) {
            try {
                if (!qrCodeData)
                    qrCodeData = await SanteDB.application.scanBarcodeAsync();

                // QR Code is a signed code
                if (svrpPattern.test(qrCodeData) || jwsDataPattern.test(qrCodeData)) {
                    var match = svrpPattern.exec(qrCodeData) || jwsDataPattern.exec(qrCodeData);
                    var jwsData = await _extractJwsData(match);
                    // The issuer for the QR code data trumps the upstream setting
                    var result = await SanteDB.application.ptrSearchAsync(match[0], !noValidate, upstream || false);
                    result.$novalidate = noValidate;
                    result.$upstream = upstream;
                    return result;
                }
                else {

                    var idDomain = SanteDB.application.classifyIdentifier(qrCodeData);
                    if (idDomain.length == 1) {
                        var parser = SanteDB.application.getIdentifierParser(idDomain[0]);
                        if (parser) qrCodeData = parser(qrCodeData);
                    }

                    var query = {};
                    if (qrCodeData.value) {
                        query = {
                            "identifier.value": qrCodeData.value,
                            "identifier.checkDigit": qrCodeData.checkDigit
                        };
                    }
                    else {
                        query = {
                            "identifier.value": qrCodeData
                        }
                    }

                    var result = {};
                    if (!noExec) result = await SanteDB.resources.entity.findAsync(query);
                    result.$search = qrCodeData;
                    return result;
                }
            }
            catch (e) {
                if (!e) // No error
                    return null;
                // Error was with validating the code
                else if (e.rules && e.rules.length > 0 && e.rules.filter(o => o.id == "jws.verification" || o.id == "jws.app" || o.id == "jws.key").length == e.rules.length) {
                    return await SanteDB.application.searchByBarcodeAsync(qrCodeData, true, upstream);
                }
                else if (e.rules && e.rules.length > 0 && e.rules.filter(o => o.id == "jws.algorithm" || o.id == "jws.format").length == e.rules.length &&
                    confirm(SanteDB.locale.getString("ui.error.vrp.invalidFormat"))) {
                    return await SanteDB.application.searchByBarcodeAsync(qrCodeData, true, upstream);
                }

                var rootCause = e.getRootCause();
                if (!upstream && rootCause.$type == "KeyNotFoundException" && confirm(SanteDB.locale.getString("ui.emr.search.online"))) {
                    // Ask the user if they want to search upstream, only if they are allowed
                    var session = await SanteDB.authentication.getSessionInfoAsync();
                    if (session.authType == "LOCAL") // Local session so elevate to use the principal elevator
                    {
                        var elevator = new ApplicationPrincipalElevator();
                        await elevator.elevate(session);
                        SanteDB.authentication.setElevator(elevator);
                    }
                    return await SanteDB.application.searchByBarcodeAsync(qrCodeData, noValidate, true);
                }
                throw e;
            }
            finally {
                SanteDB.authentication.setElevator(null);
            }
        }

        /**
         * @method addResourceViewer
         * @summary Adds a new resource state to let other apps know where to go to view a resource
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {string} resourceType The type of resource which the redirectCallback should be called for
         * @param {function} redirectCallback A function that directs to the appropriate state. Shoudl return true
         * @description Each redirectCallback is a function which accepts a state parameter (containing the current AngularJS state service) and a series of routing parameters. The
         *               redirect callback should determine whether it can handle the passed entity and should perform the redirect and return true.
         * @example Viewer for patients with no gender only
         * SanteDB.app.addResourceViewer("Patient", 
         *      function(state, parms) { 
         *         if(!parms.genderConcept || parms.genderConcept == NullReasonKeys.NoInformation) {
         *              state.go("my-view.patient". parms); 
         *              return true; 
         *          }
         *          return false;
         *      });
         */
        this.addResourceViewer = function (resourceType, redirectCallback) {
            if (!_resourceStates[resourceType])
                _resourceStates[resourceType] = [];
            _resourceStates[resourceType].push(redirectCallback);
        }

        /**
         * @method getResourceViewer
         * @summary Gets a generator if one is registered for the specified domain
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {string} resourceType The type of resource to retrieve the viewer for
         * @example Redirect to any resource returned by the Entity API
         * 
         * async viewEntity(id) {
         *  try {
         *      var entity = await SanteDB.resources.entity.getAsync(id);
         *      var viewer = SanteDB.application.getResourceViewer(entity.$type);
         *      if(viewer) {
         *          // we have a viewer so call it
         *          viewer($state, entity)
         *      }
         *      else {
         *          console.warn("Cannot find a viewer for this type of data");
         *      }
         *  }
         *  catch(e) {
         *      console.error(e);
         *  }
         * }
         */
        this.getResourceViewer = function (resourceType) {
            return _resourceStates[resourceType];
        }

        /**
         * @method callResourceViewer
         * @summary Call the resource viewer(s) which are registered for the specified type
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {*} resourceType The type of resource to call the viewers for
         * @param {*} parms The parameters to pass to the viewer (testing if they can handle the resource)
         * @param {*} state The AngularJS state service to user
         * @returns {boolean} True if the resource redirect was successful
         * @example Redirect to appropriate resource handler for entity
         * 
         * async viewEntity(id) {
         *  try {
         *      var entity = await SanteDB.resources.entity.getAsync(id);
         *      if(SanteDB.application.callResourceViewer(entity.$type, $state, entity))
         *      {
         *          console.info("Redirect successful!");
         *      }
         *      else {
         *          console.warn("Can't find a resource handler", entity);
         *      }    
         *  }
         *  catch(e) {
         *      console.error(e);
         *  }
         * }
         */
        this.callResourceViewer = function (resourceType, state, parms) {
            var callList = _resourceStates[resourceType];
            if (callList) {
                for (var c in callList)
                    if (callList[c](state, parms)) return true;
            }
            return false;
        }

        /**
         * @method addIdentifierValidator
         * @memberof SanteDBWrapper.ApplicationApi
         * @summary Adds a new check digit validator. Note that this can be either a validator for the entire identifier or a check digit
         * @param {*} algorithmName The name of the algorithm
         * @param {*} validator The validator callback
         */
        this.addCheckDigitValidator = function (algorithmName, validator) {
            _identifierValidator[algorithmName] = validator;
        }

        /**
         * @method getIdentifierValidator
         * @memberof SanteDBWrapper.ApplicationApi
         * @summary Get the specified identifier validator
         * @param {*} algorithmName The name of the algorithm
         */
        this.getCheckDigitValidator = function (algorithmName) {
            if (_identifierValidator[algorithmName]) {
                return _identifierValidator[algorithmName];
            }
            else {
                return () => true;
            }
        }

        /**
         * @method addIdentifierClassifier
         * @summary Adds a new classification map for an  identifier 
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {string} domain The domain which is being classified
         * @param {RegExp} regexClassification The classification regex
         * @description Whenever a random barcode is scanned, it could contain any number of fields and information. This function allows implementers to register a regular expression
         *               which the SanteDB plugins can use to determine which domain a particular identifier scanned from an arbitrary data source might contain. 
         * @see SanteDBWrapper.ApplicationApi.classifyIdentifier
         */
        this.addIdentifierClassifier = function (domain, regexClassification) {
            _idClassifiers[domain] = regexClassification;

            if (!_idParsers[domain]) // We can implement a parser by returning the first capture group of the regex
                _idParsers[domain] = function (value) {
                    var matchData = regexClassification.exec(value);
                    if (matchData) {
                        if (matchData.length > 1)
                            return matchData[1];
                        return matchData[0];
                    }
                    return value;
                }
        }

        /**
         * @method classifyIdentifier
         * @summary Attempts to guess the identifier domains to which an identifier belongs based on its format
         * @memberof SanteDBWrapper.ApplicationApi
         * @description This method is useful when you're scanning an identifier and need to know which identity domain it may belong to
         * @param {string} value The value of the identifier
         * @returns {Array} An array of potential identity domains which the value could belong to
         * @see SanteDBWrapper.ApplicationApi.addIdentifierClassifier
         */
        this.classifyIdentifier = function (value) {
            return Object.keys(_idClassifiers).filter(o => _idClassifiers[o].test(value));
        }

        /**
         * @method addIdentifierParser
         * @memberof SanteDBWrapper.ApplicationApi
         * @summary Adds a new identifier parser
         * @param {string} domain The domain to which the parser belongs
         * @param {function} parserCallback The callback function used to parse the identifier
         * @description Some identifiers scanned from barcodes may contain more than a simple identifier. For example, a WHO DDCC QR code contains other information about the 
         *               patient such as basic demographics, vaccines, etc. This method allows SanteDB plugins to register and call custom parsing logic for an identity domain.
         * @example
         *  SanteDB.application.addIdentifierParser("DLN", function(dln, context) { 
         *      return dln.subString(0, 10);
         *  });
         * @see SanteDBWrapper.ApplicationApi.getIdentifierParser
         */
        this.addIdentifierParser = function (domain, parserCallback) {
            _idParsers[domain] = parserCallback;
        }

        /**
         * @method getIdentifierParser
         * @memberof SanteDBWrapper.ApplicationApi
         * @summary Retrieve identifier parser for the specified domain
         * @param {string} domain The domain to which the parser belongs
         * @returns {function} The parser function which can be used to parse identifiers in the specified domain into their component parts
         */
        this.getIdentifierParser = function (domain) {
            return _idParsers[domain];
        }

        /**
         * @method addIdentifierGenerator
         * @summary Adds a new identifier generator 
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {string} domain The domain which the generator will create identifiers for
         * @param {function} generatorCallback A function for the generator which returns the new identifier and (optionally) takes the entity for which the identifier is being generated
         * @description An identifier generator function allows SanteDB common controls to generate new, unique identifiers based on custom identity domain logic. For example, if a user
         *               wishes to expose to users an option to auto-generate a new unique registration # or input an exisitng one, this function would allow this capability.
         */
        this.addIdentifierGenerator = function (domain, generatorCallback) {
            _idGenerators[domain] = generatorCallback;
        }

        /**
         * @method getIdentifierGenerator
         * @summary Gets a generator if one is registered for the specified domain
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {string} domain The domain to get the generator for
         */
        this.getIdentifierGenerator = function (domain) {
            return _idGenerators[domain];
        }

        /**
         * @method parseException
         * @summary Parses an exception string into a {@link Exception} object
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {string} exceptionString The exception string to be parsed
         */
        this.parseException = function (exceptionString) {
            var retVal = new Exception();
            try {
                // Server Exceptions
                var exceptionRegex = new RegExp("--SERVER\\sFAULT--(.*?)--END SERVER FAULT--", "gs");
                var result = exceptionRegex.exec(exceptionString);

                if (result) {
                    return JSON.parse(result[1]);
                }
                else {
                    exceptionRegex = new RegExp("(\\w*?Exception)\\s*?\\:(.*)", "gs");
                    var result = exceptionRegex.exec(exceptionString);
                    return new Exception(result[1], result[2]);
                }
            }
            catch (e) {
                return new Exception("JavaScript", e);
            }
        }
        /**
         * @method getAppletAssetAsync
         * @summary Gets an applet manifest object from the server
         * @param {string} appletId The identifier of the applet from which you want to fetch something
         * @param {string} assetPath The path within that asset to the content
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {Promise} A promise representing the fetch operation
         */
        this.getAppletAssetAsync = function (appletId, assetPath, state) {
            return new Promise(function (fulfill, reject) {
                $.ajax({
                    method: 'GET',
                    url: `/${appletId}/${assetPath}`,
                    dataType: 'text',
                    success: function (xhr, status, response) {
                        try {
                            fulfill(xhr, state);
                        }
                        catch (e) {
                            if (reject) reject(e);
                        }
                    },
                    error: function (e, data, setting) {
                        if (_globalErrorHandler(e, data, setting))
                            return;
                        reject(e);
                    }
                });
            });
        }
        /**
         * @summary Calculates the strength of the supplied password
         * @param {*} password The password
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {number} The strength of the password between 0 and 5
         * @method calculatePasswordStrength
         */
        this.calculatePasswordStrength = function (password) {
            var strength = 0;
            if (password.length >= 6) {
                strength++;
                if (password.length > 10)
                    strength++;
                if (/(?=.*[a-z])(?=.*[A-Z])/.test(password))
                    strength++;
                if (/(?:[^A-Za-z0-9]{1,})/.test(password))
                    strength++;
                if (/(?:[0-9]{1,})/.test(password))
                    strength++;
            }
            return strength;
        }
        /**
         * @summary Get the specified widgets for the specified context
         * @param context The context to fetch widgets for
         * @memberof SanteDBWrapper.ApplicationApi
         * @method getWidgetsAsync
         * @param type The type of widget to fetch registration information for (panel or tab)
         * @description This function allows rendering controls to fetch the widgets registered by all plugins for a particular context. 
         * @see https://help.santesuite.org/developers/applets/assets/html-widgets
         */
        this.getWidgetsAsync = function (context, type) {
            return new Promise(function (fulfill, reject) {
                _app.getAsync({
                    resource: "Widgets",
                    query: {
                        context: context,
                        type: type
                    }
                }).then(function (widgets) {
                    widgets.forEach(function (w) {
                        w.htmlId = w.name.replace(/\./g, "_");
                    });
                    fulfill(widgets);
                }).catch(function (e) { reject(e); });
            });
        }
        /**
         * @summary Gets solutions that can be installed on this appliccation
         * @method getAppSolutionsAsync
         * @memberof SanteDBWrapper.ApplicationApi
         */
        this.getAppSolutionsAsync = function () {
            return _ami.getAsync({
                resource: "AppletSolution",
                query: "_upstream=true"
            });
        }
        /**
         * @summary Closes the application or restarts it in the case of the mobile
         * @method close
         * @memberof SanteDBWrapper.ApplicationApi
         */
        this.close = function () {
            __SanteDBAppService.Close();
        }
        /**
         * @summary Instructs the back-end service to perform a system upgrade
         * @returns {Promise} A promise representing the fulfillment or rejection of update
         * @method doUpdateAsync
         * @memberof SanteDBWrapper.ApplicationApi
         */
        this.doUpdateAsync = function () {
            return _app.postAsync({
                resource: "Update",
                contentType: 'application/json'
            });
        }
        /**
         * @summary Instructs the back-end service to perform a compact
         * @param {boolean} takeBackup When true, instructs the back end to take a backup of data
         * @returns {Promise} A promise representing the fulfillment or rejection of update
         * @method compactAsync
         * @memberof SanteDBWrapper.ApplicationApi
         */
        this.compactAsync = function (takeBackup) {
            return _app.post({
                resource: "Data",
                data: { backup: takeBackup },
                contentType: 'application/x-www-form-urlencoded'
            });
        }
        /**
         * @summary Instructs the back-end service to perform a purge of all data
         * @param {boolean} takeBackup True if the back-end should take a backup before purge
         * @returns {Promise} The promise representing the fulfillment or rejection
         * @method purgeAsync
         * @memberof SanteDBWrapper.ApplicationApi
         */
        this.purgeAsync = function (takeBackup) {
            return _app.deleteAsync({
                resource: "Data",
                data: { backup: takeBackup },
                contentType: 'application/x-www-form-urlencoded'
            });
        }
        /**
         * @summary Instructs the backend to restore the data from the most recent backup
         * @returns {Promise} The promise representing the fulfillment or rejection
         * @method restoreAsync
         * @memberof SanteDBWrapper.ApplicationApi
         */
        this.restoreAsync = function () {
            return _app.postAsync({
                resource: "Data/Restore"
            });
        }
        /**
         * @summary Create a backup of current assets on the dCDR (databases, applets, etc.)
         * @returns {Promise}
         * @param {boolean} makePublic Instruct the API to store the back in an unsecured, public location (for example, when migrating to another tablet) 
         * @method createBackupAsync
         * @memberof SanteDBWrapper.ApplicationApi
         */
        this.createBackupAsync = function (makePublic) {
            return _app.postAsync({
                resource: "Data/Backup",
                data: { makePublic: makePublic },
                contentType: 'application/x-www-form-urlencoded'
            });
        }
        /**
         * @summary Get all backups and backup information
         * @method getBackupAsync
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {Promise} The promise representing the fulfillment or rejection
         */
        this.getBackupAsync = function () {
            return _app.getAsync({
                resource: "Data/Backup",
            });
        }
        /**
         * @summary Load a data asset from an applet's Data/ directory
         * @method loadDataAsset
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {string} dataId The identifier of the data asset to load
         * @returns {string} The data asset
         */
        this.loadDataAsset = function (dataId) {
            return atob(__SanteDBAppService.GetDataAsset(dataId));
        }
        /**
         * @summary Submits a user entered bug report 
         * @method submitBugReportAsync
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {any} bugReport The structured bug report to be submitted
         * @returns {Promise} The promise to fulfill or reject the request
         */
        this.submitBugReportAsync = function (bugReport) {
            return _ami.postAsync({
                contentType: "application/json",
                resource: "Sherlock",
                data: bugReport
            });
        }
        /**
         * @summary Gets a list of all logs and their information from the server
         * @method getLogInfoAsync
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {string} _id The id of the log file to fetch contents of
         * @param {any} query The query filters to use / apply
         * @returns {Promise} The promise representing the async request
         */
        this.getLogInfoAsync = function (_id, query) {
            var resource = "Log";
            var dataType = "json";
            if (_id) {
                resource += "/" + _id;
                dataType = "text";
            }

            return _ami.getAsync({
                resource: resource,
                query: query,
                dataType: dataType
            });
        }
        /**
         * @summary Generates a new random password
         * @method generatePassword
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {string} A new random password
         */
        this.generatePassword = function () {
            var specChars = ['@', '_', '-', '~', '!', '#', '$'];
            var secret = SanteDB.application.newGuid().replace(/-/g, function () {
                return specChars[Math.trunc(Math.random() * specChars.length)];
            });

            var repl = "";
            for (var i = 0; i < secret.length; i++)
                if (secret[i] >= 'a' && secret[i] <= 'f')
                    repl += String.fromCharCode(97 + Math.trunc(Math.random() * 24));
                else if (i % 2 == 1)
                    repl += String.fromCharCode(65 + Math.trunc(Math.random() * 24));
                else
                    repl += secret[i];

            return repl;
        }
        /**
         * @summary Create a new UUID
         * @method newGuid
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {string} A new unique UUID
         */
        this.newGuid = function () {
            return __SanteDBAppService.NewGuid();
        }
        /**
         * @summary Get application version information 
         * @method getAppInfoAsync
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {Promise} The promise from the async representation
         * @param {any} settings The settings to use for the server diagnostic report
         * @param {boolean} settings._upstream When true check the remote server
         */
        this.getAppInfoAsync = function (settings) {
            settings = settings || {};
            return _ami.getAsync({
                resource: "Sherlock/me",
                query: { _upstream: settings._upstream }
            });
        }
        /**
         * @summary Get the online status of the application
         * @method getOnlineState
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {boolean} True if the application is online
         */
        this.getOnlineState = function () {
            return __SanteDBAppService.GetOnlineState();
        }
        /**
         * @summary Indicates whether the server's AMI is available
         * @description This command actually sends a lightweight PING function to the AMI server
         * @method isAdminAvailable
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {boolean} True if the AMI is available
         */
        this.isAdminAvailable = function () {
            return __SanteDBAppService.IsAdminAvailable();
        }
        /**
         * @summary Indicates whether the HDSI is available
         * @description This command actually sends a lightweight PING function to the HDSI server
         * @method isClinicalAvailable
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {boolean} True if the HDSI is available
         */
        this.isClinicalAvailable = function () {
            return __SanteDBAppService.IsClinicalAvailable();
        }
        /**
         * @summary Resolves the HTML summary view for the specified template
         * @method resolveTemplateSummary
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {string} The HTML content of the sumary form for the specified template
         * @param {string} templateId The id of the template for which HTML summary should be gathered
         * @description This method allows a plugin to resolve a template identifier (like: entity.tanzania.child) to an actual HTML summary
         */
        this.resolveTemplateSummary = function (templateId) {
            var entry = (_templateCache || []).find(o => o.mnemonic == templateId);
            if (entry) {
                return entry.summaryView;
            }
            else {
                return null;
            }
        }

        /**
         * @summary Resolves the HTML input form for the specified template
         * @method resolveTemplateForm
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {string} The HTML content of the input form for the specified template
         * @param {string} templateId The id of the template for which HTML input should be gathered
         * @description This method allows a plugin to resolve a template identifier (like: entity.tanzania.child) to an actual HTML input form
         */
        this.resolveTemplateBackentry = function(templateId) {
            var entry = (_templateCache || []).find(o => o.mnemonic == templateId);
            if (entry) {
                return entry.backEntry;
            }
            else {
                return null;
            }
        }
        /**
         * @summary Resolves the HTML input form for the specified template
         * @method resolveTemplateForm
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {string} The HTML content of the input form for the specified template
         * @param {string} templateId The id of the template for which HTML input should be gathered
         * @description This method allows a plugin to resolve a template identifier (like: entity.tanzania.child) to an actual HTML input form
         */
        this.resolveTemplateForm = function (templateId) {
            var entry = (_templateCache || []).find(o => o.mnemonic == templateId);
            if (entry) {
                return entry.form;
            }
            else {
                return null;
            }
        }
        /**
         * @summary Resolves the HTML view for the specified template
         * @method resolveTemplateView
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {string} The HTML content of the view for the specified template
         * @param {string} templateId The id of the template for which HTML view should be gathered
         * @description This method allows a plugin to resolve a template view (to display informaton from the template)
         */
        this.resolveTemplateView = function (templateId) {
            var entry = (_templateCache || []).find(o => o.mnemonic == templateId);
            if (entry) {
                return entry.view;
            }
            else {
                return null;
            }
        }
        /**
         * @summary
         * @method getTemplateMetadata
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {string} templateId The template mnemonic to fetch data for
         * @returns {object} The template definition metadata
         */
        this.getTemplateMetadata = function (templateId) {
            return (_templateCache || []).find(o => o.mnemonic == templateId);
        }

        /**
         * @summary Get a list of all installed template definitions
         * @method getTemplateDefinitionsAsync
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {any} query The filter to apply to templates
         * @returns {Array<string>} The list of template definitions
         */
        this.getTemplateDefinitionsAsync = async function (query) {
            if (!query) {
                if (_templateCache) {
                    return _templateCache;
                }
                else {
                    _templateCache = await _resources.template.findAsync(query);
                    return _templateCache;
                }
            }
            else {
                return _resources.template.findAsync(query);
            }
        }
        /**
         * @summary Get a list of all installed template definitions
         * @method getTemplateContentAsync
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {string} templateId The ID of the template to fetch
         * @param {any} parms The parameters to pass to the template
         * @returns {any} The templated object
         */
        this.getTemplateContentAsync = async function (templateId, parms) {
            var template = await _resources.template.getAsync(templateId, "full", parms);
            if (template.relationship) { // Find relationship templates
                template.relationship = await getSubTemplates(template.relationship, parms);
            }
            if (template.participation) {
                template.participation = await getSubTemplates(template.participation, parms);
            }
            return template;
        }
        /**
         * @summary Get the version of the application host
         * @method getVersion
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {string} The version of the host this applet is running in
         */
        this.getVersion = function () {
            return __SanteDBAppService.GetVersion();
        }
        /**
         * @summary Get all available user interface menus for the current user
         * @method getMenusAsync
         * @memberof SanteDBWrapper.ApplicationApi
         * @param {string} contextName The name of the context to retrieve
         * @returns {any} A structure of menus the user is allowed to access
         */
        this.getMenusAsync = function (contextName) {
            return _app.getAsync({
                resource: "Menu",
                query: { context: contextName }
            });
        }
        /**
         * @summary Launches the camera on the device to take a picture of a barcode
         * @method scanBarcode
         * @memberof SanteDBWrapper.ApplicationApi
         * @returns {string} The scanned barcode
         * @description This method will call the local operating system's implementation of the camera function to scan and decode a barcode. If using SanteDB
         *               dCDR Web Access Gateway or dCDR Disconnected Gateway then the HTML5 camera object is used, on Android this calls the Android system camera
         *               and ZXing.
         */
        this.scanBarcodeAsync = function () {
            try {
                var value = __SanteDBAppService.BarcodeScan();
                if (value instanceof Promise)
                    return value;
                else
                    return new Promise(function (resolve, error) {
                        resolve(value);
                    });
            }
            catch (e) {
                console.error(e);
                throw new Exception("Exception", "error.general", e);
            }
        }
        /**
         * @method
         * @memberof SanteDBWrapper.ApplicationApi
         * @summary Show a toast to the user
         * @param {string} text The text of the toast
         * @description This method is used to trigger an operating system TOAST. If you're using the AngularJS interface (like in the administrative or SanteEMR framework)
         *               it is recommended to use the toastr interface.
         */
        this.showToast = function (text) {
            try {
                __SanteDBAppService.ShowToast(text);
            }
            catch (e) {
            }
        }
        /**
         * @method
         * @memberof SanteDBWrapper.ApplicationApi
         * @summary Perform a search operation on a signed codified search. 
         * @description This search operation uses signed parameter information (acquired from barcode, message, etc.) to perform a retrieve operation if the signature has not been tampered.
         * @param {*} jwsData The JSON Web Signature data to search
         * @param {boolean} validateSignature True if the service should validate the data
         * @param {boolean} upstream True if the search should be performed against the upstream server
         * @see https://help.santesuite.org/developers/service-apis/health-data-service-interface-hdsi/digitally-signed-visual-code-api
         */
        this.ptrSearchAsync = function (jwsData, validateSignature, upstream) {
            try {


                var configuration = {
                    resource: "_ptr",
                    headers: {
                        accept: _viewModelJsonMime,
                        "X-SanteDB-Upstream": upstream
                    },
                    query: { code: jwsData, validate: validateSignature }
                };
                return _hdsi.searchAsync(configuration);
            }
            catch (e) {
                console.error(e);
                throw new Exception("Exception", "error.codeSearch", e);
            }
        }

    }

    /**
     * @class
     * @constructor
     * @memberof SanteDBWrapper
     * @summary Represents a wrapper for various resources on the SanteDB API
     * @property {ResourceWrapper} bundle Functions for interacting with {@link Bundle}
     * @property {ResourceWrapper} act Functions for interacting with {@link Act}
     * @property {ResourceWrapper} applicationEntity Functions for interacting with  {@link ApplicationEntity}
     * @property {ResourceWrapper} identityDomain Functions for interacting with {@link identityDomain}
     * @property {ResourceWrapper} carePlan Functions for interacting with {@link CarePlan} 
     * @property {ResourceWrapper} codeSystem Functions for interacting with {@link CodeSystem}
     * @property {ResourceWrapper} concept Functions for interacting with {@link Concept}
     * @property {ResourceWrapper} conceptSet Functions for interacting with {@link ConceptSet}
     * @property {ResourceWrapper} configuration Functions for interacting with {@link Configuration}
     * @property {ResourceWrapper} deviceEntity Functions for interacting with {@link DeviceEntity}
     * @property {ResourceWrapper} entityRelationship Functions for interacting with {@link EntityRelationship}
     * @property {ResourceWrapper} locale Functions for interacting with {@link Locale}
     * @property {ResourceWrapper} mail Functions for interacting with {@link Mail}
     * @property {ResourceWrapper} manufacturedMaterial Functions for interacting with {@link ManufacturedMaterial}
     * @property {ResourceWrapper} material Functions for interacting with {@link Material}
     * @property {ResourceWrapper} observation Functions for interacting with {@link Observation}
     * @property {ResourceWrapper} organization Functions for interacting with {@link Organization}
     * @property {ResourceWrapper} patient Functions for interacting with {@link Patient}
     * @property {ResourceWrapper} entityRelationship Functions for interacting with {@link EntityRelationship}
     * @property {ResourceWrapper} entity Functions for interacting with {@link Entity}
     * @property {ResourceWrapper} place Functions for interacting with {@link Place}
     * @property {ResourceWrapper} provider Functions for interacting with {@link Provider}
     * @property {ResourceWrapper} queue Functions for interacting with {@link Queue}
     * @property {ResourceWrapper} referenceTerm Functions for interacting with {@link ReferenceTerm}
     * @property {ResourceWrapper} substanceAdministration Functions for interacting with {@link SubstanceAdministration}
     * @property {ResourceWrapper} task Functions for interacting with {@link Task}
     * @property {ResourceWrapper} tickle Functions for interacting with {@link Tickle}
     * @property {ResourceWrapper} pubSubSubscriptionDefinition Functions for interacting with {@link SubscriptionDefinition}
     * @property {ResourceWrapper} pubSubChannelDefinition Functions for interacting with {@link PubSubChannel}
     * @property {ResourceWrapper} userEntity Functions for interacting with {@link UserEntity}
     * @property {ResourceWrapper} extensionType Functions for interacting with {@link ExtensionType}
     * @property {ResourceWrapper} matchConfiguration Functions for interacting with {@link MatchConfiguration}
     * @property {ResourceWrapper} configuration Functions for interacting with {@link Configuration}
     * @property {ResourceWrapper} dispatcherQueue Functions for interacting with {@link DispatcherQueueInfo}
     * @property {ResourceWrapper} sessionInfo Functions for interacting with {@link SessionInfo}
     * @property {ResourceWrapper} probe Functions for interacting with {@link Probe}
     * @property {ResourceWrapper} dispatcherQueue Functions for interacting with system synchronization queues
     * @property {ResourceWrapper} conceptReferenceTerm Functions for interacting with {@link ConceptReferenceTerm}
     * @property {ResourceWrapper} foreignData Functions for interacting with foreign data uploades
     * @property {ResourceWrapper} foreignDataMap Functions for interacting with {@link ForeignDataMap}
     * @property {ResourceWrapper} appletSolution Functions for interacting with system applet solutions
     * @property {ResourceWrapper} applet Functions for interacting with system applets
     * @property {ResourceWrapper} conceptRelationship Functions for interacting with concept relationships
     * 
     */
    function ResourceApi() {

        // Reference to this
        var _me = this;

        /**
         * @method
         * @summary Sometimes when a link is retrieved it is a base class - this function ensures that the @value is of type @desiredType if not it will fetch
         * @param {any} value The current value of the object which should be the desired type
         * @param {String} desiredType The type of resource that the value should be or else the resource is fetched
         * @returns {Promise} A promise for the fulfillment of the check
         */
        this.ensureTypeAsync = function (value, desiredType) {
            if (value == null || value.$type === undefined || value.$type === desiredType) {
                return value;
            }
            else if (value.id) {
                return _me[desiredType.toCamelCase()].getAsync(value.id);
            }
        }

        /**
        * @type {ResourceWrapper}
        * @memberof SanteDBWrapper.ResourceApi
        * @summary Represents a resource wrapper that persists bundles
        */
        this.bundle = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Bundle",
            api: _hdsi
        });

        /**
        * @type {ResourceWrapper}
        * @memberof SanteDBWrapper.ResourceApi
        * @summary Represents a resource wrapper that persists care pathway definitions
        */
        this.carePathwayDefinition = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: 'CarePathwayDefinition',
            api: _hdsi
        });

        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents an resource wrapper that interoperates with the care planner
            */
        this.carePlan = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "CarePlan",
            api: _hdsi
        });
        /**
        * @type {ResourceWrapper}
        * @memberof SanteDBWrapper.ResourceApi
        * @summary Represents the Patient Resource
        */
        this.patient = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Patient",
            api: _hdsi
        });

        /**
        * @type {ResourceWrapper}
        * @memberof SanteDBWrapper.ResourceApi
        * @summary Represents the PatientEncounter Resource
        */
        this.patientEncounter = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "PatientEncounter",
            api: _hdsi
        });

        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the PubSubChannel Resource
            */
        this.pubSubChannelDefinition = new ResourceWrapper({
            accept: "application/json",
            resource: "PubSubChannelDefinition",
            api: _ami
        });

        /**
        * @type {ResourceWrapper}
        * @memberof SanteDBWrapper.ResourceApi
        * @summary Represents the PubSubSubscription Resource
        */
        this.pubSubSubscriptionDefinition = new ResourceWrapper({
            accept: "application/json",
            resource: "PubSubSubscriptionDefinition",
            api: _ami
        });

        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the Patient Resource
            */
        this.extensionType = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "ExtensionType",
            api: _hdsi
        });

        /**
         * @type {ResourceWrapper}
         * @memberof SanteDBWrapper.ResourceApi
         * @summary Match configuration API
         */
        this.matchConfiguration = new ResourceWrapper({
            accept: "application/json",
            resource: "MatchConfiguration",
            api: _ami
        });

        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the SubstanceAdministration Resource
            */
        this.substanceAdministration = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "SubstanceAdministration",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the Act Resource
            */
        this.act = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Act",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @summary Represents the entity resource
            * @memberof SanteDBWrapper.ResourceApi
            */
        this.entity = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Entity",
            api: _hdsi
        });
        /**
         * @type {ResourceWrapper}
         * @summary A resource wrapper for Assigning Authorities
         * @memberof SanteDBWrapper.ResourceApi
         */
        this.identityDomain = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "IdentityDomain",
            api: _ami
        });
        /**
            * @type {ResourceWrapper}
            * @summary Represents the entity relationship resource
            * @memberof SanteDBWrapper.ResourceApi
            */
        this.entityRelationship = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "EntityRelationship",
            api: _hdsi
        });


        /**
         * @type {ResourceWrapper}
         * @summary Represents the act relationship resource
         * @memberof SanteDBWrapper.ResourceApi
         */
        this.actRelationship = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "ActRelationship",
            api: _hdsi
        });

        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the Observation Resource
            */
        this.observation = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Observation",
            api: _hdsi
        });

        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the CodedObservation Resource
            */
        this.codedObservation = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "CodedObservation",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the procedure Resource
            */
        this.procedure = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Procedure",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the quantity observation Resource
            */
        this.quantityObservation = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "QuantityObservation",
            api: _hdsi
        });

        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the TextObservation Resource
            */
        this.textObservation = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "TextObservation",
            api: _hdsi
        });

        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the Place Resource
            */
        this.place = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Place",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the Provider Resource
            */
        this.provider = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Provider",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the UserEntity Resource
            */
        this.userEntity = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "UserEntity",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the Organization Resource
            */
        this.organization = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Organization",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the Material Resource
            */
        this.material = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Material",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the ManufacturedMaterial Resource
            */
        this.manufacturedMaterial = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "ManufacturedMaterial",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the ManufacturedMaterial Resource
            */
        this.concept = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Concept",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the ConceptClass Resource
            */
        this.conceptClass = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "ConceptClass",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the ConceptSet Resource
            */
        this.conceptSet = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "ConceptSet",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the ReferenceTerm Resource
            */
        this.referenceTerm = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "ReferenceTerm",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the CodeSystem Resource
            */
        this.codeSystem = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "CodeSystem",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the DeviceEntity Resource
            */
        this.deviceEntity = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "DeviceEntity",
            api: _hdsi
        });
        /**
           * @type {ResourceWrapper}
           * @memberof SanteDBWrapper.ResourceApi
           * @summary Represents the UserEntity Resource
           */
        this.userEntity = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "UserEntity",
            api: _hdsi
        });
        /**
         * @type {ResourceWrapper}
         * @memberof SanteDBWrapper.ResourceApi
         * @summary Represents the Person Resource
         */
        this.person = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Person",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Represents the ApplicationEntity Resource
            */
        this.applicationEntity = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "ApplicationEntity",
            api: _hdsi
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Gets the configuration resource
            */
        this.configuration = new ResourceWrapper({
            accept: "application/json",
            resource: "Configuration",
            api: _app
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Gets the queue control resource
            */
        this.queue = new ResourceWrapper({
            accept: "application/json",
            resource: "Queue",
            api: _app
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary Resource wrapper which interacts with the administrative task scheduler
            */
        this.task = new ResourceWrapper({
            accept: "application/json",
            resource: "Task",
            api: _ami
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary A resource wrapper for alerts which are messages between users
            */
        this.mail = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Mailbox",
            api: _ami
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary A wrapper which is used for fetching user notifications
            **/
        this.tickle = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Tickle",
            api: _app
        });
        /**
            * @type {ResourceWrapper}
            * @memberof SanteDBWrapper.ResourceApi
            * @summary A wrapper for locale information which comes from the server
            */
        this.locale = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "Locale",
            api: _app
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for Security USers
         */
        this.securityUser = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "SecurityUser",
            api: _ami
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for Security Roles
         */
        this.securityRole = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "SecurityRole",
            api: _ami
        });
        /**
        * @type {ResourceWrapper}
        * @memberOf SanteDBWrapper.resources
        * @summary Wrapper for session information
        */
        this.sessionInfo = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "SessionInfo",
            api: _ami
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for Security Devices
         */
        this.securityDevice = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "SecurityDevice",
            api: _ami
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for Security Applications
         */
        this.securityApplication = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "SecurityApplication",
            api: _ami
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for Security Policies
         */
        this.securityPolicy = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "SecurityPolicy",
            api: _ami
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for Security Challenges
         */
        this.securityChallenge = new ResourceWrapper({
            accept: _viewModelJsonMime,
            resource: "SecurityChallenge",
            api: _ami
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for provenance
         */
        this.securityProvenance = new ResourceWrapper({
            resource: "SecurityProvenance",
            api: _ami,
            accept: _viewModelJsonMime,
            viewModel: 'base'
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for audit API
         */
        this.audit = new ResourceWrapper({
            resource: "Audit",
            accept: "application/json",
            api: _ami
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for probe API
         */
        this.probe = new ResourceWrapper({
            resource: "Probe",
            accept: _viewModelJsonMime,
            api: _ami
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for dispatch queue management API
         */
        this.dispatcherQueue = new ResourceWrapper({
            resource: "DispatcherQueueInfo",
            accept: "application/json",
            api: _ami
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for sync log API
         */
        this.sync = new ResourceWrapper({
            resource: "Sync",
            accept: _viewModelJsonMime,
            api: _app
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for subscription definition API
         */
        this.subscriptionDefinition = new ResourceWrapper({
            resource: "SubscriptionDefinition",
            accept: "application/json",
            api: _ami
        });
        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for subscription definition API
         */
        this.jobInfo = new ResourceWrapper({
            resource: "JobInfo",
            accept: "application/json",
            api: _ami
        });
        /**
        * @type {ResourceWrapper}
        * @memberOf SanteDBWrapper.resources
        * @summary Wrapper for templates definition API
        */
        this.template = new ResourceWrapper({
            resource: "Template",
            accept: _viewModelJsonMime,
            api: _app
        });
        /**
        * @type {ResourceWrapper}
        * @memberOf SanteDBWrapper.resources
        * @summary Wrapper for certificates definition API
        */
        this.certificates = new ResourceWrapper({
            resource: "Certificate",
            accept: "application/json",
            api: _ami
        });

        /**
        * @type {ResourceWrapper}
        * @memberOf SanteDBWrapper.resources
        * @summary Wrapper for alien data
        */
        this.foreignData = new ResourceWrapper({
            resource: "ForeignData",
            accept: "application/json",
            api: _ami
        });

        /**
       * @type {ResourceWrapper}
       * @memberOf SanteDBWrapper.resources
       * @summary Wrapper for alien data mappings
       */
        this.foreignDataMap = new ResourceWrapper({
            resource: "ForeignDataMap",
            accept: "application/json",
            api: _ami
        });

        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for relationship validation rules
         */
        this.validationRule = new ResourceWrapper({
            resource: "RelationshipValidationRule",
            accept: "application/json",
            api: _ami
        });

        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for relationship validation rules
         */
        this.dataQuality = new ResourceWrapper({
            resource: "DataQualityRulesetConfiguration",
            accept: "application/json",
            api: _ami
        });

        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for applets 
         */
        this.applet = new ResourceWrapper({
            resource: "Applet",
            accept: "application/json",
            api: _ami
        });

        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for appletSolution 
         */
        this.appletSolution = new ResourceWrapper({
            resource: "AppletSolution",
            accept: "application/json",
            api: _ami
        });

        /**
       * @type {ResourceWrapper}
       * @memberOf SanteDBWrapper.resources
       * @summary Wrapper for reference term <> concept mapping 
       */
        this.conceptReferenceTerm = new ResourceWrapper({
            resource: 'ConceptReferenceTerm',
            accept: _viewModelJsonMime,
            api: _hdsi
        });

        /** 
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for CDSS Library Definitions
         */
        this.cdssLibraryDefinition = new ResourceWrapper({
            resource: "CdssLibraryDefinition",
            accept: "application/json",
            api: _ami
        });

        /** 
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for backup media
         */
        this.backup = new ResourceWrapper({
            resource: "Backup",
            accept: "application/json",
            api: _ami
        });

        /** 
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for concept relationships
         */
        this.conceptRelationship = new ResourceWrapper({
            resource: "ConceptRelationship",
            accept: _viewModelJsonMime,
            api: _hdsi
        });

        /**
         * @type {ResourceWrapper}
         * @memberOf SanteDBWrapper.resources
         * @summary Wrapper for containers
         */
        this.container = new ResourceWrapper({
            resource: "Container",
            accept: _viewModelJsonMime,
            api: _hdsi
        });

    };

    // HACK: Wrapper pointer facility = place
    var _resources = new ResourceApi();
    _resources.facility = _resources.place;

    // master configuration closure
    var _masterConfig = null;

    /**
     * @class
     * @constructor
     * @summary API For interacting with configuration
     * @memberof SanteDBWrapper
     */
    function ConfigurationApi() {

        // Check whether a guard is applicable to the reference objects
        function _checkGuard(filter, referenceObjects) {

            if (!referenceObjects || referenceObjects.length == 0) {
                return false;
            }

            var retVal = true;
            filter.guards.forEach(function (oldGuard) {
                if (!retVal) return;

                // Rewrite guard
                var guardFilterRegex = /^([\!\sA-Za-z\.&|]*?)\[([A-Za-z]*?)\](.*)$/;
                var valueRegex = /^(\w+?)\=(.*)$/;
                var newGuard = "";
                while (oldGuard.length > 0) {
                    var match = guardFilterRegex.exec(oldGuard);
                    if (!match) {
                        newGuard += oldGuard;
                        break;
                    }
                    else {
                        newGuard += `${match[1]}.${match[2]}`;
                        oldGuard = match[3];
                    }
                }
                referenceObjects
                    .forEach(function (subscribed) {
                        var match = valueRegex.exec(newGuard);
                        if (match) {
                            var op = "==", value = match[2];
                            if (value.startsWith("!")) {
                                op = "!=";
                                value = value.substring(1);
                            }
                            switch (value) {
                                case "null":
                                case "true":
                                case "false":
                                    newGuard = `subscribed.${match[1]}${op}${value}`;
                                    break;
                                default:
                                    newGuard = `subscribed.${match[1]}${op}'${value}'`;
                                    break;
                            }
                        }
                        var e = angular.element('body').scope().$eval(newGuard, { "subscribed": subscribed });
                        retVal &= (e != null) && (e !== false);
                    });
            });
            return retVal
        }

        /**
         * @method getDataProvidersAsync
         * @memberof SanteDBWrapper.ConfigurationApi
         * @return {Promise} The data providers
         * @summary Gets a list of data providers available on this offline provider mode
         */
        this.getDataProvidersAsync = function () {
            return _app.getAsync({
                resource: "DataProviders"
            });
        }

        /**
         * @method getIntegrationPatternsAsync
         * @memberof SanteDBWrapper.ConfigurationApi
         * @return {Promise} The data integration modes
         * @summary Gets a list of data integration modes which are supported by this server
         */
        this.getIntegrationPatternsAsync = function () {
            return _app.getAsync({
                resource: "IntegrationPatterns"
            });
        }
        /**
            * @method getAsync
         * @memberof SanteDBWrapper.ConfigurationApi
            * @summary Get the configuration, nb: this caches the configuration
            * @param {bool} forceServerRefresh True if the cache should be discarded and the configuration re-fetched
            * @returns {Promise} The configuration
            */
        this.getAsync = function (forceServerRefresh) {
            return new Promise(function (fulfill, reject) {
                try {
                    if (_masterConfig && !forceServerRefresh)
                        fulfill(_masterConfig);
                    else {
                        _resources.configuration.getAsync()
                            .then(function (d) {
                                _masterConfig = d.values;
                                _masterConfig._isConfigured = d._isConfigured;
                                if (fulfill) fulfill(angular.copy(_masterConfig));
                            })
                            .catch(function (e) {
                                if (reject) reject(e.responseJSON || e);
                            });
                    }
                }
                catch (e) {
                    if (reject) reject(e.responseJSON || e);
                }
            });
        }

        /**
            * @method getAppSetting
            * @memberof SanteDBWrapper.ConfigurationApi
            * @summary Get the specified configuration key
            * @returns {string} The application key setting
            * @param {string} key The key of the setting to find
            */
        this.getAppSetting = function (key) {
            try {
                if (_masterConfig && _masterConfig.application && _masterConfig.application.setting) {
                    var _setting = _masterConfig.application.setting[key];
                    if (_setting)
                        return _setting;
                    else
                        return null;
                }
                else {
                    return null;
                }
            }
            catch (e) {
                if (!e.$type)
                    throw new Exception("Exception", "error.unknown", e.detail, e);
                else
                    throw e;
            }
        }

        /**
         * @method getAppSettingAsync
         * @summary Retrieve the specified application setting directly from the configuration API
         * @param {string} key The key of the setting to retrieve
         * @memberof SanteDBWrapper.ConfigurationApi
         * @returns {String} The value of the setting
         */
        this.getAppSettingAsync = function (key) {
            return _resources.configuration.getAssociatedAsync("global", "setting", key)[0];
        }

        /**
         * @method getAppSettingAsync
         * @memberof SanteDBWrapper.ConfigurationApi
         * @summary Retrieve the specified application setting directly from the configuration API
         * @param {string} key The key of the setting to retrieve
         * @returns {String} The value of the setting
         */
        this.setAppSettingAsync = function (key, value) {
            return _resources.configuration.addAssociatedAsync("global", "setting", [{ key: key, value: value }]);
        }

        /**
            * @method  setAppSetting
            * @memberof SanteDBWrapper.ConfigurationApi
            * @summary Sets the specified application setting
            * @param {string} key The key of the setting to set
            * @param {string} value The value of the application setting
            * @see SanteDB.configuration.save To save the updated configuration
            */
        this.setAppSetting = function (key, value) {
            try {
                if (!_masterConfig) throw new Exception("Exception", "error.invalidOperation", "You need to call configuration.getAsync() before calling getAppSetting()");
                _masterConfig.application.setting[key] = value;
            }
            catch (e) {
                if (!e.$type)
                    throw new Exception("Exception", "error.unknown", e.detail, e);
                else
                    throw e;
            }
        }

        /**
         * @method getClientId
         * @memberof SanteDBWrapper.ConfigurationApi
         * @summary Get the OAUTH client identifier 
         * @returns {string} The name of the client Id
         */
        this.getClientId = function () {
            return __SanteDBAppService.GetClientId();
        }

        /**
         * @method getDeviceId
         * @memberof SanteDBWrapper.ConfigurationApi
         * @summary Get the device identifier 
         * @returns {string} The name of the device
         */
        this.getDeviceId = function () {
            return __SanteDBAppService.GetDeviceId();
        }

        /**
         * @method getAssignedFacilityId
         * @memberof SanteDBWrapper.ConfigurationApi
         * @summary Get the configured facility identifier
         * @returns {string} The identifier of the facility
         */
        this.getAssignedFacilityId = function () {
            return __SanteDBAppService.GetAssignedFacilityId();
        }

        /**
         * @method getOwnerId
         * @memberof SanteDBWrapper.ConfigurationApi
         * @summary Get the configured owner of this device
         * @returns {string} The identifier of the device
         */
        this.getOwnerId = function () {
            return __SanteDBAppService.GetAssignedOwnerId();
        }

        /**
            * @method getRealm
            * @memberof SanteDBWrapper.ConfigurationApi
            * @summary Gets the currently configured realm
            * @returns {string} The name of the security realm
            */
        this.getRealm = function () {
            return __SanteDBAppService.GetRealm();
        }

        /**
            * @method getSection
         * @memberof SanteDBWrapper.ConfigurationApi
            * @summary Gets the specified section name
            * @param {any} name The name of the configuration section
            * @returns {any} A JSON object representing the configuration setting section
            */
        this.getSection = function (name) {
            try {
                if (!_masterConfig) throw new Exception("Exception", "error.invalidOperation", "You need to call configuration.getAsync() before calling getAppSetting()");
                return _masterConfig[name];
            }
            catch (e) {
                if (!e.$type)
                    throw new Exception("Exception", "error.unknown", e.detail, e);
                else
                    throw e;
            }
        }

        /**
        * @method joinRealmAsync
        * @summary Instructs the current system to join a realm
        * @memberof SanteDBWrapper.ConfigurationApi
        * @returns {Promise} The configuration file after joining the realm
        * @param {any} configData The configuration data for the realm
        * @param {string} configData.address The domain to which the application is to be joined
        * @param {string} configData.device The name of the device to join as
        * @param {boolean} configData.replaceExisting When true, instructs the application to replace an existing registration
        * @param {boolean} configData.enableTrace When true, enables log file tracing of requests
        * @param {boolean} configData.enableSSL When true, enables HTTPS
        * @param {boolean} configData.noTimeout When true, removes all timeouts from the configuration
        * @param {number} configData.port The port number to connect to the realm on
        * @param {boolean} overwrite Overwrites the existing configuration if needed
        */
        this.joinRealmAsync = function (configData, overwrite) {
            return new Promise(function (fulfill, reject) {
                try {
                    configData.override = overwrite;
                    var parms = SanteDB.convertToParameters(configData);

                    _app.postAsync({
                        resource: "Realm/$join",
                        contentType: 'application/json',
                        data: parms
                    }).then(function (d) {
                        d = SanteDB.convertFromParameters(d);
                        if (d.joined) {
                            __SanteDBAppService.GetStatus().then(() => fulfill(d));
                        }
                        else reject(d);
                    }).catch(function (e) {
                        console.error(`Error joining realm: ${e}`, e);
                        if (reject) reject(e.responseJSON || e);
                    });
                }
                catch (e) {
                    var ex = e.responseJSON || e;
                    if (!ex.$type)
                        ex = new Exception("Exception", "error.general", e);
                    if (reject) reject(ex);
                }
            });
        }
        /**
            * @method leaveRealmAsync
         * @memberof SanteDBWrapper.ConfigurationApi
            * @summary Instructs the application to remove realm configuration
            * @returns {Promise} A promise that is fulfilled when the leave operation succeeds
            */
        this.leaveRealmAsync = function () {
            return _app.deleteAsync({
                resource: "Configuration/Realm"
            });
        }
        /**
            * @method saveAsync
         * @memberof SanteDBWrapper.ConfigurationApi
            * @summary Save the configuration object
            * @param {any} configuration The configuration object to save
            * @returns {Promise} A promise object indicating whether the save was successful
            */
        this.saveAsync = function (configuration) {
            return _resources.configuration.insertAsync(configuration || _masterConfig);
        }
        /**
            * @method getUserSettingsAsync
            * @memberof SanteDBWrapper.ConfigurationApi
            * @summary Gets the user specific preferences
            * @returns {Promise} A promise representing the retrieval of the user settings
            */
        this.getUserSettingsAsync = async function () {
            return _resources.configuration.findAssociatedAsync("me", "settings");
        }

        /**
            * @method saveUserPreferencesAsync
         * @memberof SanteDBWrapper.ConfigurationApi
            * @summary Saves the user preferences
            * @param {any} preferences A dictionary of preferences to be saved
            * @returns {Promise} A promise which indicates when preferences were saved
            * @example Save user preference for color
            * SanteDB.configuration.saveUserPreferences([
            *  { key: "color", value: "red" }
            * ]);
            */
        this.saveUserSettingsAsync = function (preferences) {
            return _resources.configuration.addAssociatedAsync("me", "settings", preferences);
        }

        /** 
         * @method canSelectSubscription
         * @memberof SanteDBWrapper.ConfigurationApi
         * @summary Determines whether the subscription definition can be selected based on the subscribed objects
         * @returns {boolean} True if the subscription definition can be selected
         * @param {SubscriptionDefinition} subscriptionDefinition  The subscription definition
         * @param {object} subscribedObjects The objects for which the subscription check is being performed
         */
        this.canSelectSubscription = function (subscriptionDefinition, subscribedObjects, syncMode) {
            return subscriptionDefinition.definitions.find(filter => (!filter.guards || filter.guards.length == 0 || _checkGuard(filter, subscribedObjects)) && (syncMode == filter.mode || filter.mode == 'FullOrPartial'));
        }

    };

    // Session and auth data
    var _oauthSession = null;
    var _session = null;
    var _elevator = null;

    var _authentication = new AuthenticationApi();

    /**
     * @class
     * @memberof SanteDBWrapper
     * @constructor
     * @summary Authentication API 
     */
    function AuthenticationApi() {

        // Demands that are cached
        var _cacheDemand = {};
        setInterval(() => _cacheDemand = {}, 15000); // clear the cache every 10 seconds
        // Extract JWT data
        var _extractJwtData = function (jwtData) {
            if (jwsDataPattern.test(jwtData)) {
                var match = jwsDataPattern.exec(jwtData);
                var idData = JSON.parse(atob(match[2]));
                return idData;
            }
            else {
                throw new Exception("InvalidDataException", "Invalid JWT");
            }
        }

        // Process oauth response session data
        var _afterAuthenticate = function (oauthResponse, fulfill, reject) {
            _oauthSession = oauthResponse;
            //if (oauthResponse.access_token) window.sessionStorage.setItem('token', oauthResponse.access_token || oauthResponse.token);
            //if (oauthResponse.refresh_token) window.sessionStorage.setItem('refresh_token', oauthResponse.refresh_token);
            if (oauthResponse.id_token)
                try {
                    var tokenData = _extractJwtData(oauthResponse.id_token);
                    // Set the locale
                    if (tokenData.lang)
                        __SanteDBAppService.SetLocale(tokenData.lang);
                    else if (tokenData['urn:santedb:org:lang'])
                        __SanteDBAppService.SetLocale(tokenData['urn:santedb:org:lang']);
                    else
                        __SanteDBAppService.SetLocale(navigator.language || navigator.userLanguage); // default locale

                }
                catch (e) {
                }
            _authentication.getSessionInfoAsync().then(fulfill).catch(reject);
        }

        /**
         * @summary SID for SYSTEM USER
         * @constant
         * @memberof SanteDBWrapper.AuthenticationApi
         */
        this.SYSTEM_USER = "fadca076-3690-4a6e-af9e-f1cd68e8c7e8";
        /**
         * @summary SID for ANONYMOUS user
         * @constant
         * @memberof SanteDBWrapper.AuthenticationApi
         */
        this.ANONYMOUS_USER = "c96859f0-043c-4480-8dab-f69d6e86696c";
        /** 
         * @enum {numeric} PolicyDecision
         * @static 
         * @memberof SanteDBWrapper.AuthenticationApi
         * @summary Policy decision structure
         */
        this.PolicyDecision = {
            Deny: 0,
            Elevate: 1,
            Grant: 2
        };
        /**
         * @method parseJwt
         * @summary Parses a JWT token data into a JSON object
         * @param {string} jwtData The JWT data (typically from an id_token)
         * @returns {Object} The parsed object
         */
        this.parseJwt = _extractJwtData;

        /**
         * @method demandAsync
         * @memberof SanteDBWrapper.AuthenticationApi
         * @summary Demand permission for the specified policy
         * @param {string} policy The policy which is being demanded
         * @returns {Promise} A promise representing the fulfillment or rejection of the demand
         */
        this.demandAsync = function (policy) {
            return new Promise(function (fulfill, reject) {
                try {
                    if (_cacheDemand[policy] !== undefined) {
                        fulfill(_cacheDemand[policy]);
                    }
                    else {
                        _auth.getAsync({
                            resource: `pdp/${policy}`
                        })
                            .then(function () {
                                _cacheDemand[policy] = _authentication.PolicyDecision.Grant;
                                fulfill(_authentication.PolicyDecision.Grant);
                            }) // fulfillment for the PDP means grant success
                            .catch(function (e) {
                                if (e.policyOutcome) {
                                    _cacheDemand[policy] = e.policyOutcome;
                                    fulfill(_authentication.PolicyDecision[e.policyOutcome]);
                                }
                                else
                                    reject(e);
                            });
                    }
                }
                catch (e) {
                    reject(e);
                }
            });
        }
        /**
         * @method setElevator
         * @summary Sets the elevator function
         * @param {any} elevator An elevation implementation
         * @param {function():String} elevator.getToken A function to get the current token
         * @param {function(boolean):void} elevator.elevate A function to perform elevation
         * @memberof SanteDBWrapper.AuthenticationApi
         */
        this.setElevator = function (elevator) {
            _elevator = elevator;
        }
        /**
            * @method getSessionInfoAsync
            * @memberof SanteDBWrapper.AuthenticationApi
            * @returns {Promise} A promise representing the fulfillment or rejection of the get request
            * @param {boolean} forceServer When true (or supplied) instructs the function to force a server fetch of the session
            * @summary Gets the extended session information
            */
        this.getSessionInfoAsync = function (forceServer) {
            return new Promise(function (fulfill, reject) {
                if (_session && !forceServer)
                    fulfill(angular.copy(_session));
                else
                    try {
                        _app.getAsync({
                            resource: "SessionInfo"
                        })
                            .then(function (s) {
                                _session = s;
                                if (fulfill) fulfill(s);
                            })
                            .catch(function (e) {

                                if (e.detail.status <= 204) {
                                    _session = null;
                                    fulfill(null);
                                }
                                else if (reject) reject(e.responseJSON || e);

                            });
                    }
                    catch (e) {
                        var ex = e.responseJSON || e;
                        if (!ex.$type)
                            ex = new Exception("Exception", "error.general", e);
                        if (reject) reject(ex);
                    }
            });
        }
        /**
         * @method initiateChallengeFlowAsync
         * @sumamry Initiates a challenge reset flow (either TFA or appropriate security challenge)
         * @param {string} userName The name of the user to initiate the flow for
         * @param {bool} upstream When true contact the upstream
         * @returns {Promise} The promise for the reset
         */
        this.initiateChallengeFlowAsync = function (userName, upstream) {
            return _ami.postAsync({
                resource: "SecurityUser/$reset",
                contentType: "application/json",
                headers: {
                    "X-SanteDB-Upstream": upstream
                },
                data: { parameter: [{ name: "userName", value: userName }] }
            })
        }
        /**
            * @method setupTfaSecretAsync
            * @memberof SanteDBWrapper.AuthenticationApi
            * @summary Initiates the setup of a TFA secret for the current user
            * @param {string} mechanism The mode of two-factor authentication (email, sms, etc.)
            * @param {string} code When specified, the validation code to complete the setup
            * @param {boolean} upstream True if the request should be executed upstream
            * @returns {Promise} A promise representing the outcome of the TFA secret send
            */
        this.setupTfaSecretAsync = function (mechanism, code, upstream) {

            return _ami.postAsync({
                resource: `Tfa/${mechanism}/$setup`,
                headers: {
                    "X-SanteDB-Upstream": upstream
                },
                contentType: "application/json",
                data: {
                    "parameter": [
                        { name: "code", value: code }
                    ]
                }
            })
        }
        /**
            * @method getTfaModesAsync
            * @memberof SanteDBWrapper.AuthenticationApi
            * @param {boolean} upstream True if the request should be forwarded to the upstream
            * @summary Retrieves information about the two-factor authentication modes supported by the server
            * @returns {Promise} The promise representing the fulfillment or rejection of the get request
            */
        this.getTfaModesAsync = function (upstream) {
            return _ami.getAsync({
                headers: {
                    "X-SanteDB-Upstream": upstream
                },
                resource: "Tfa"
            });
        }
        /**
        * @method challengeLoginAsync
        * @memberof SanteDBWrapper.AuthenticationApi
        * @summary Performs an extended login for the purpose of password reset (using a challenge and response)
        * @param {string} userName The name of the user which is logging in
        * @param {string} challenge The selected user challenge which is being answered
        * @param {string} response The user's response to the challenge offerred
        * @param {string} tfaSecret The two-factor secret if provided
        * @returns {Promise} A promise representing the login request
        * @description This type of grant is an extension of the oauth grants. The resulting session is only valid for changing the user's own password. No other functions will work with this token
            * @see https://help.santesuite.org/developers/service-apis/openid-connect
        */
        this.challengeLoginAsync = function (userName, challenge, response, tfaSecret) {
            return new Promise(function (fulfill, reject) {
                try {
                    var headers = {};
                    var claims = {};
                    claims["urn:oasis:names:tc:xacml:2.0:action:purpose"] = '8b18c8ce-916a-11ea-bb37-0242ac130002'; // Security Admin
                    claims["urn:santedb:org:claim:temporary"] = "true";
                    headers["X-SanteDBClient-Claim"] =
                        btoa(Object.keys(claims).map(o => `${o}=${claims[o]}`).join(";"));

                    _auth.postAsync({
                        resource: "oauth2_token",
                        data: {
                            client_id: SanteDB.configuration.getClientId(),
                            username: userName,
                            challenge: challenge,
                            response: response,
                            grant_type: 'x_challenge',
                            x_mfa: tfaSecret,
                            scope: '*'
                        },
                        headers: headers,
                        contentType: 'application/x-www-form-urlencoded'
                    })
                        .then(function (d) {
                            fulfill(d);
                        })
                        .catch(reject);
                }
                catch (e) {
                    var ex = e.responseJSON || e;
                    if (!ex.$type)
                        ex = new Exception("Exception", "error.general", e);
                    if (reject) reject(ex);
                }
            });
        }
        /**
            * @method passwordLoginAsync
            * @memberof SanteDBWrapper.AuthenticationApi
            * @summary Performs a OAUTH password login
            * @param {string} userName The name of the user which is logging in
            * @param {string} password The password of the user
            * @param {string} tfaSecret The two-factor secret if provided
            * @param {string} scope When true indicates that there should not be a persistent session (i.e. one time authentication)
            * @param {boolean} uacPrompt True if the authentication is part of a UAC prompt and no perminant session is to be 
            * @param {String} purposeOfUse The identifier of the purpose of use for the access
            * @returns {Promise} A promise representing the login request
            * @param {any} claims The claims which are to be appended to the OAUTH request
            * @see https://help.santesuite.org/developers/service-apis/openid-connect
            */
        this.passwordLoginAsync = function (userName, password, tfaSecret, uacPrompt, purposeOfUse, scope, claims) {
            return new Promise(function (fulfill, reject) {
                try {
                    var headers = {};
                    claims = claims || {};

                    if (!Array.isArray(scope)) {
                        scope = [scope];
                    }

                    if (purposeOfUse) {
                        claims["urn:santedb:org:claim:override"] = "true";
                        claims["urn:oasis:names:tc:xacml:2.0:action:purpose"] = purposeOfUse;
                    }
                    if (uacPrompt) {
                        claims["urn:santedb:org:claim:temporary"] = "true";
                    }

                    if (Object.keys(claims).length > 0) {
                        headers["X-SanteDBClient-Claim"] =
                            btoa(Object.keys(claims).map(o => `${o}=${claims[o]}`).join(";"));
                    }

                    _auth.postAsync({
                        resource: "oauth2_token",
                        data: {
                            client_id: SanteDB.configuration.getClientId(),
                            username: userName,
                            password: password,
                            no_session: uacPrompt,
                            x_mfa: tfaSecret,
                            grant_type: 'password',
                            scope: (scope || ["*"]).join(" ")
                        },
                        headers: headers,
                        contentType: 'application/x-www-form-urlencoded'
                    })
                        .then(function (d) {
                            if (!uacPrompt) {
                                _afterAuthenticate(d, fulfill, reject);
                            }
                            else if (fulfill) fulfill(d);
                        })
                        .catch(reject);
                }
                catch (e) {
                    var ex = e.responseJSON || e;
                    if (!ex.$type)
                        ex = new Exception("Exception", "error.general", e);
                    if (reject) reject(ex);
                }
            });
        }
        /**
            * @method pinLoginAsync
            * @memberof SanteDBWrapper.AuthenticationApi
            * @summary Performs a local pin login
            * @param {string} userName The name of the user which is logging in
            * @param {string} password The password of the user
            * @param {string} tfaSecret The two-factor secret if provided
            * @param {boolean} noSession When true indicates that there should not be a persistent session (i.e. one time authentication)
            * @param {String} purposeOfUse The reason the authentication is happening
            * @param {Array} scope The requested scope of the session
            * @returns {Promise} A promise representing the login request
            * @see https://help.santesuite.org/developers/service-apis/openid-connect
            */
        this.pinLoginAsync = function (userName, pin, uacPrompt, purposeOfUse, tfaSecret, scope) {
            return new Promise(function (fulfill, reject) {
                try {
                    _auth.postAsync({
                        resource: "oauth2_token",
                        data: {
                            client_id: SanteDB.configuration.getClientId(),
                            username: userName,
                            pin: pin,
                            x_mfa: tfaSecret,
                            grant_type: 'pin',
                            scope: (scope || ["*"]).join(" ")
                        },
                        headers: {
                            "X-SanteDBClient-Claim":
                                btoa("urn:santedb:org:override=true;" +
                                    "urn:oasis:names:tc:xacml:2.0:action:purpose=" + purposeOfUse)
                        },
                        contentType: 'application/x-www-form-urlencoded'
                    })
                        .then(function (d) {
                            if (!uacPrompt) {
                                _afterAuthenticate(d, fulfill, reject);
                            }
                            else if (fulfill) fulfill(d);
                        })
                        .catch(reject);
                }
                catch (e) {
                    var ex = e.responseJSON || e;
                    if (!ex.$type)
                        ex = new Exception("Exception", "error.general", e);
                    if (reject) reject(ex);
                }
            });
        }
        /**
            * @method clientCredentialLoginAsync
            * @memberof SanteDBWrapper.AuthenticationApi
            * @summary Performs an OAUTH client credentials login
            * @description A client credentials login is a login principal which only has an application principal. This is useful for password resets, etc.
            * @returns {Promise} A promise representing the login request
            * @param {boolean} noSession When true, indicates that a session should not be replaced that the request is a one time use token
            * @param {Array} scope The list of scopes for this session
            * @see https://help.santesuite.org/developers/service-apis/openid-connect
            */
        this.clientCredentialLoginAsync = function (noSession, scope) {
            return new Promise(function (fulfill, reject) {
                try {
                    var claims = {};
                    var headers = {};
                    if (noSession) {
                        claims["urn:santedb:org:claim:temporary"] = "true";
                    }

                    if (Object.keys(claims).length > 0) {
                        headers["X-SanteDBClient-Claim"] =
                            btoa(Object.keys(claims).map(o => `${o}=${claims[o]}`).join(";"));
                    }

                    _auth.postAsync({
                        resource: "oauth2_token",
                        data: {
                            grant_type: 'client_credentials',
                            client_id: SanteDB.configuration.getClientId(),
                            scope: (scope || ["*"]).join(" "),
                            no_session: noSession
                        },
                        headers: headers,
                        contentType: 'application/x-www-form-urlencoded'
                    })
                        .then(function (d) {
                            if (!noSession) {
                                _afterAuthenticate(d, fulfill, reject);
                            }
                            else if (fulfill) fulfill(d);
                        })
                        .catch(reject);
                }
                catch (e) {
                    var ex = e.responseJSON || e;
                    if (!ex.$type)
                        ex = new Exception("Exception", "error.general", e);
                    if (reject) reject(ex);
                }
            });
        }
        /**
            * @method authorizationCodeLoginAsync
            * @memberof SanteDBWrapper.AuthenticationApi
            * @summary Performs an OAUTH authorization code grant
            * @description This function should be called *after* the authorization code has been obtained from the authorization server
            * @param {boolean} noSession When true, indicates that there should not be a persistent session created
            * @returns {Promise} A promise representing the session request
            * @see https://help.santesuite.org/developers/service-apis/openid-connect
            */
        this.authorizationCodeLoginAsync = function (code, redirect_uri, noSession) {
            return new Promise(function (fulfill, reject) {
                try {
                    _auth.postAsync({
                        resource: "oauth2_token",
                        data: {
                            grant_type: 'authorization_code',
                            code: code,
                            redirect_uri: redirect_uri,
                            scope: "*"
                        },
                        contentType: 'application/x-www-form-urlencoded'
                    })
                        .then(function (d) {
                            if (!noSession) {
                                _oauthSession = d;
                                //if (d.access_token) window.sessionStorage.setItem('token', d.access_token || d.token);
                                //if (d.refresh_token) window.sessionStorage.setItem('refresh_token', d.refresh_token);
                                _authentication.getSessionInfoAsync().then(fulfill).catch(reject);
                            }
                            else if (fulfill) fulfill(d);
                        })
                        .catch(reject);
                }
                catch (e) {
                    var ex = e.responseJSON || e;
                    if (!ex.$type)
                        ex = new Exception("Exception", "error.general", e);
                    if (reject) reject(ex);
                }
            });
        }
        /**
            * @method refreshLoginAsync
            * @memberof SanteDBWrapper.AuthenticationApi
            * @summary Performs a refresh token grant
            * @param {boolean} noSession True if no session should be setup
            * @see https://help.santesuite.org/developers/service-apis/openid-connect
            * @returns {Promise} A promise representing the session refresh request
            */
        this.refreshLoginAsync = function () {
            return new Promise(function (fulfill, reject, noSession) {
                try {

                    var refreshToken = window.sessionStorage.getItem("refresh_token");
                    _auth.postAsync({
                        resource: "oauth2_token",
                        data: {
                            grant_type: 'x-refresh-cookie',
                            refresh_token: refreshToken || 'cookie',
                            scope: "*",
                            client_id: SanteDB.configuration.getClientId()
                        },
                        contentType: 'application/x-www-form-urlencoded'
                    })
                        .then(function (d) {
                            if (!noSession) {
                                _oauthSession = d;
                                _session = null;
                                //if (d.access_token) window.sessionStorage.setItem('token', d.access_token || d.token);
                                //if (d.refresh_token) window.sessionStorage.setItem('refresh_token', d.refresh_token);
                                _authentication.getSessionInfoAsync().then(fulfill).catch(reject);
                            }
                            else if (fulfill) fulfill(d);
                        })
                        .catch(reject);
                }
                catch (e) {
                    var ex = e.responseJSON || e;
                    if (!ex.$type)
                        ex = new Exception("Exception", "error.general", e);
                    if (reject) reject(ex);
                }
            });
        }


        /**
            * @method setPasswordAsync
            * @memberof SanteDBWrapper.AuthenticationApi
            * @summary Sets the password of the specified user
            * @param {string} sid The security identifier of the user which is being updated
            * @param {string} userName The name of the user to set the password to
            * @param {string} passwd The password to set the currently logged in user to
            * @param {bool} upstream True if the request should be routed to the upstream
            * @returns {Promise} The promise representing the fulfillment or rejection of the password change
            */
        this.setPasswordAsync = function (sid, userName, passwd, upstream) {
            if (!_session && !(_elevator && _elevator.getToken()))
                throw new Exception("SecurityException", "error.security", "Can only set password with active session");
            return _ami.putAsync({
                id: sid,
                resource: "SecurityUser",
                contentType: _viewModelJsonMime,
                headers: {
                    "X-SanteDB-Upstream": upstream
                },
                data: {
                    $type: "SecurityUserInfo",
                    passwordOnly: true,
                    entity: new SecurityUser({
                        userName: userName,
                        password: passwd
                    })
                }
            });
        }

        /**
         * @memberof SanteDBWrapper.AuthenticationApi
         * @summary Immediately expire the user's password
         * @param {string} sid The security user for which the password should be expired
         * @param {string} userName The name of the user which is to be expired
         * @param {bool} upstream True if the request should be sent to the upstream
         */
        this.expirePasswordAsync = function (sid, userName, upstream) {
            if (!_session && !(_elevator && _elevator.getToken()))
                throw new Exception("SecurityException", "error.security", "Can only set password with active session");
            return _ami.putAsync({
                id: sid,
                resource: "SecurityUser",
                contentType: _viewModelJsonMime,
                headers: {
                    "X-SanteDB-Upstream": upstream
                },
                data: {
                    $type: "SecurityUserInfo",
                    expirePassword: true,
                    entity: new SecurityUser({
                        userName: userName
                    })
                }
            });
        }

        /**
            * @method logoutAsync
            * @memberof SanteDBWrapper.AuthenticationApi
            * @summary Abandons the current SanteDB session
            * @returns {Promise} The promise representing the fulfillment or rejection of the logout request
            */
        this.logoutAsync = function () {
            return new Promise(function (fulfill, reject) {
                try {
                    _auth.postAsync({
                        resource: "signout",
                        contentType: 'application/x-www-form-urlencoded',
                        data: {
                            logout_hint: _session.username,
                            client_id: SanteDB.configuration.getClientId()
                        }
                    })
                        .then(function (d) {
                            _oauthSession = _session = null;
                            window.sessionStorage.removeItem('token');
                            window.sessionStorage.removeItem('refresh_token');
                            window.sessionStorage.removeItem('lang');
                            SanteDB.locale.setLocale(null);
                            if (fulfill) fulfill(d);
                        })
                        .catch(reject);
                }
                catch (e) {
                    var ex = e.responseJSON || e;
                    if (!ex.$type)
                        ex = new Exception("Exception", "error.general", e);
                    if (reject) reject(ex);
                }
            });
        }

        /**
         * @summary Gets the current CDR facility identifier from either (1) the user's session assertion (the facility the user is assigned to and/or selected on login) or (2) the configured facility 
         * @memberof SanteDBWrapper.AuthenticationApi
         * @returns {String} The UUID of the current facility identifier
         */
        this.getCurrentFacilityId = async function () {
            try {
                var sessionInfo = await SanteDB.authentication.getSessionInfoAsync();
                var sessionFacility = sessionInfo.claims["urn:oasis:names:tc:xspa:1.0:subject:facility"];
                return sessionFacility ? sessionFacility.value || sessionFacility : SanteDB.configuration.getAssignedFacilityId();
            }
            catch (e) {
                console.warn(e);
                return SanteDB.configuration.getAssignedFacilityId();
            }
        }

        /**
         * @summary Get the currently logged in user's CDR entity id
         * @memberof SanteDBWrapper.AuthenticationApi
         * @returns {String} The UUID of the current user's CDR entity id
         */
        this.getCurrentUserEntityId = async function () {
            try {
                var sessionInfo = await SanteDB.authentication.getSessionInfoAsync();
                if (sessionInfo.entity) {
                    return sessionInfo.entity.id;
                }
                else {
                    var ue = await SanteDB.resources.userEntity.findAsync({ securityUser: sessionInfo.user.id, _includeTotal: false, _count: 1 });
                    if (ue.resource) {
                        return ue.resource[0].id;
                    }
                }
            }
            catch (e) {
                console.warn(e);
            }
        }
    };

    // Provides localization support functions
    var _localeCache = {};
    /**
     * @class
     * @constructor
     * @protected
     * @memberof SanteDBWrapper
     * @summary Functions related to the localization of santedb
     */
    function LocalizationApi() {
        /**
         * @summary Default date formats
         * @enum
         * @memberof SanteDBWrapper.LocalizationApi
         * @property {string} year The format of year precision dates
         * @property {string} month The format of month precision dates
         * @property {string} day The format of day precision dates
         * @property {string} hour The format of hour precision dates
         * @property {string} minute The format of minute precision dates
         * @property {string} second The format of second precision dates
         */
        this.dateFormats = {
            year: 'YYYY',
            month: 'YYYY-MM',
            day: 'YYYY-MM-DD',
            hour: 'YYYY-MM-DD HH',
            minute: 'YYYY-MM-DD HH:mm',
            second: 'YYYY-MM-DD HH:mm:ss'
        };


        /**
            * @summary Gets a string from the current user interface localization
            * @memberof SanteDBWrapper.LocalizationApi
            * @method getString
            * @param {string} stringId The id of the localization string to get
            * @param {any} parameters The parameters used to substitute the string value
            * @returns {string} The localized string
            */
        this.getString = function (stringId, parameters) {
            try {
                var retVal = __SanteDBAppService.GetString(stringId);

                if (retVal && retVal.replace) {
                    retVal = retVal.replace(/\{.*?\}/ig, function (s) {
                        if (typeof s === 'string' && parameters) {
                            return parameters[s.substring(1, s.length - 1)];
                        }
                        else {
                            return s;
                        }
                    });
                }
                return retVal || stringId;
            }
            catch (e) {
                console.error(e);
                return stringId;
            }
        }
        /**
            * @summary Get the currently configured locale
            * @memberof SanteDBWrapper.LocalizationApi
            * @method getLocale
            * @return {string} The ISO language code and country code of the application
            */
        this.getLocale = function () {
            var retVal = __SanteDBAppService.GetLocale().toLowerCase();
            return retVal;
        }
        /**
            * @summary Get the currently configured language
            * @memberof SanteDBWrapper.LocalizationApi
            * @method getLanguage
            * @return {string} The ISO language code
            */
        this.getLanguage = function () {
            return __SanteDBAppService.GetLocale().substr(0, 2);
        };
        /**
            * @summary Get the currently configured country code
            * @memberof SanteDBWrapper.LocalizationApi
            * @method getCountry
            * @return {string} The 2 digit ISO country code
            */
        this.getCountry = function () {
            return __SanteDBAppService.GetLocale().substr(4, 2);
        };
        /**
            * @summary Set the current locale of the application
            * @memberof SanteDBWrapper.LocalizationApi
            * @method setLocale
            * @param {string} locale The ISO locale (i.e. en-US, en-CA, sw-TZ to set)
            */
        this.setLocale = function (locale) {
            return __SanteDBAppService.SetLocale(locale);
        }
        /**
            * @summary Get localization format information for the specified locale
            * @memberof SanteDBWrapper.LocalizationApi
            * @method getFormatInformationAsync
            * @param {string} locale The locale for which the format information should be retrieved
            * @returns {Promise} The promise representing the operation to fetch locale
            * @description The localization information contains formatting for currency, formatting for dates, and formatting for numbers
            */
        this.getFormatInformationAsync = function (locale) {
            return new Promise(function (fulfill, reject) {
                try {
                    if (_localeCache[locale])
                        fulfill(_localeCache[locale]);
                    else {
                        _resources.locale.getAsync(locale)
                            .then(function (d) {
                                _localeCache[locale] = d;
                                if (fulfill) fulfill(d);
                            })
                            .catch(reject);
                    }
                }
                catch (e) {
                    var ex = e.responseJSON || e;
                    if (!ex.$type)
                        ex = new Exception("LocalizationException", "error.general", e);
                    if (reject) reject(ex);
                }
            });
        };

    }

    // Public bindings
    /**
     * @member api
     * @property {SanteDBWrapper.APIWrapper} hdsi Reference to the configured Health Data Service Interface helper
     * @property {SanteDBWrapper.APIWrapper} ami Reference to the configured Administration Management Interface helper
     * @property {SanteDBWrapper.APIWrapper} auth Reference to the configured Authentication API
     * @property {SanteDBWrapper.APIWrapper} app Reference to the configured Application API
     */
    this.api = {
        /**
        * @type {APIWrapper}
        * @summary Represents a property which wraps the HDSI interface
        */
        hdsi: _hdsi,
        /**
        * @type {APIWrapper}
        * @summary Represents a property which communicates with the AMI
        */
        ami: _ami,
        /**
            * @type {APIWrapper}
            * @summary Represents a property which communicates with the AUTH service
            */
        auth: _auth,
        /**
            * @type {APIWrapper}
            * @summary Represents a property which communicates with the application service
         */
        app: _app
    };

    /**
     * @memberof SanteDBWrapper
     * @summary Provide access to localization data
        * @public
     * @type {LocalizationApi}
     */
    this.locale = new LocalizationApi();
    /**
        * @type {ResourceApi}
        * @memberof SanteDBWrapper
        * @summary Provides access to resource handlers
        * @public
        */
    this.resources = _resources;
    /**
        * @summary Configuration routines for SanteDB
        * @memberof SanteDBWrapper
        * @type {ConfigurationApi}
        */
    this.configuration = new ConfigurationApi();
    /**
        * @summary Authentication functions for SanteDB
        * @memberof SanteDBWrapper
        * @public
        * @type {AuthenticationApi}
        */
    this.authentication = _authentication;

    /**
     * @type {ApplicationApi}
     */
    this.application = new ApplicationApi();

    // Application magic 
    var _magic = null;

    // Setup JQuery to send up authentication and cookies!
    if (jQuery) {
        $.ajaxSetup({
            cache: false,
            beforeSend: function (data, settings) {

                if (!settings.noAuth) {
                    var elevatorToken = _elevator ? _elevator.getToken() : null;
                    if (elevatorToken) {
                        data.setRequestHeader("Authorization", "BEARER " +
                            elevatorToken);
                    }
                    // else if (window.sessionStorage.getItem('token'))
                    //     data.setRequestHeader("Authorization", "BEARER " +
                    //         window.sessionStorage.getItem("token"));
                    if (!_magic)
                        _magic = __SanteDBAppService.GetMagic();

                }
                data.setRequestHeader("X-SdbLanguage", SanteDB.locale.getLocale()); // Set the UI locale
                data.setRequestHeader("X-SdbMagic", _magic);
            },
            converters: {
                "text json": function (data) {
                    return $.parseJSON(data, true);
                }
            }
        });
    }
};

/**
 * @type {SanteDBWrapper}
 * @global
 */
var SanteDB = new SanteDBWrapper();

/**
 * @enum {CertificateStoreName}
 * @memberof SanteDB
 * @summary Certificate store names
 */
SanteDB.CertificateStoreName = {
    ServiceUser: "CurrentUser",
    EntireMachine: "LocalMachine"
};


/**
 * @summary Represents an elevator implementation that authenticates as the device principal
 * @constructor
 * @class
 */
function ApplicationPrincipalElevator(multiuse) {

    var _token = null;
    var _consumed = false;
    /**
     * @method
     * @returns {String} The current elevation token
     * @summary Gets the elevation token
     */
    this.getToken = function () {
        if (!multiuse && _consumed) return null;
        else {
            _consumed = true;
            return _token;
        }
    }

    /**
     * @method
     * @summary Shows the elevation dialog and then performs the continueWith
     * @param {any} useSession The current session, passed when and if a pou is required and not a change of login
     */
    this.elevate = function (sessionToUse) {
        if (!sessionToUse)
            throw new Exception("SecurityException", "err.nosession");

        // The application credential can only be used when we already have a session
        return SanteDB.authentication.clientCredentialLoginAsync(true)
            .then(function (session) {
                _token = session.access_token || session.token;
            });
    }
}


// Add default check digit handlers
SanteDB.application.addCheckDigitValidator("SanteDB.Core.Model.DataTypes.CheckDigitAlgorithms.InlineMod97Validator, SanteDB.Core.Model", function (id) {
    if (!id.value) {
        return false;
    }

    return validateMod97CheckDigit(id.value.substring(0, id.value.length - 2), id.value.substring(id.value.length - 2, id.value.length));
});

// Add default check digit handlers
SanteDB.application.addCheckDigitValidator("SanteDB.Core.Model.DataTypes.CheckDigitAlgorithms.Mod97CheckDigitAlgorithm, SanteDB.Core.Model", function (id) {
    return validateMod97CheckDigit(id.value, id.checkDigit);
});



// Add default check digit handlers
SanteDB.application.addCheckDigitValidator("SanteDB.Core.Model.DataTypes.CheckDigitAlgorithms.InlineMod97Validator, SanteDB.Core.Model", function (id) {
    if (!id.value) {
        return false;
    }

    return validateIso7064Mod97CheckDigit(id.value.substring(0, id.value.length - 2), id.value.substring(id.value.length - 2, id.value.length));
});

// Add default check digit handlers
SanteDB.application.addCheckDigitValidator("SanteDB.Core.Model.DataTypes.CheckDigitAlgorithms.Mod97CheckDigitAlgorithm, SanteDB.Core.Model", function (id) {
    return validateIso7064Mod97CheckDigit(id.value, id.checkDigit);
});

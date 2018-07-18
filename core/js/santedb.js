/// <reference path="./santedb-model.js"/>
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
 * User: justi
 * Date: 2018-7-17
 */

// Interactive SHIM between host environment and browser
var __SanteDBAppService = window.SanteDBAppService || {};

/**
 * @callback SanteDB~Promise
 * @summary The callback from which a promise can be constructed in the calling implementation
 * @param {function} success The callback to be executed when the operation is successful
 * @param {function} reject The callback to be executed when the operation is rejected
 * @param {function} always The callback that is always executed at the end of the operation
 */

var SanteDB =
    /**
     * @class
     * @constructor
     * @summary SanteDB Binding Class
     * @description This class exists as a simple interface which is implemented by host implementations of the SanteDB hostable core. This interface remains the same even though the 
     *              implementations of this file on each platform (Admin, BRE, Client, etc.) are different.
     */
    new function () {
        "use strict";

        /**
         * @class APIWrapper
         * @constructor
         * @memberof SanteDB
         * @summary SanteDB HDSI implementation that uses HTTP (note, other implementations may provide alternates)
         * @param {any} _config The configuration of the service
         * @param {string} _config.base The base URL for the service
         * @param {bool} _config.idByQuery When true, indicates the wrapper wants to pass IDs by query
         */
        var APIWrapper = function (_config) {

            /**
             * @method
             * @summary Reconfigures this instance of the API wrapper
             * @memberof SanteDB.APIWrapper
             * @param {any} config The configuration of the service
             * @param {string} config.base The base URL for the service
             * @param {bool} config.idByQuery When true, indicates the wrapper wants to pass IDs by query
             */
            this.configure = function (config) {
                _config = config;
            };

            /**
             * @method
             * @memberof SanteDB.APIWrapper
             * @summary Creates a new item on the instance
             * @param {any} configuration The configuration object
             * @param {string} configuration.resource The resource that is to be posted
             * @param {any} configuration.data The data that is to be posted
             * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
             * @param {bool} configuration.sync When true, executes the request in synchronous mode
             * @returns {Promise} The promise for the operation
             */
            this.postAsync = function (configuration) {
                return new Promise(function (fulfill, reject) {
                    $.ajax({
                        method: 'POST',
                        url: _config.base + configuration.resource,
                        data: JSON.stringify(configuration.data),
                        dataType: 'json',
                        contentType: 'application/json',
                        async: !configuration.sync,
                        success: function (xhr) {
                            try {
                                if (fulfill) fulfill(xhr, configuration.state);
                            }
                            catch (e) {
                                if (reject) reject(e, configuration.state);
                            }
                        },
                        error: function (e) {
                            var error = e.responseJSON;

                            if (reject) {
                                if (error.error !== undefined) // oauth2
                                    reject(new SanteDBModel.Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                                else if (error.$type === "Exception" || error.type)
                                    reject(new SanteDBModel.Exception(error.type, error.message, error.detail, error.caused_by), configuration.state);
                                else
                                    reject(new SanteDBModel.Exception("Exception", "error.general." + error, e, null), configuration.state);
                            }
                            else
                                console.error("UNHANDLED PROMISE REJECT: " + JSON.stringif(e));
                        }
                    });
                });
            };

            /**
             * @method
             * @memberof SanteDB.APIWrapper
             * @summary Updates an existing item on the instance
             * @param {any} configuration The configuration object
             * @param {string} configuration.resource The resource that is to be posted
             * @param {any} configuration.data The data that is to be posted
             * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
             * @param {bool} configuration.sync When true, executes the request in synchronous mode
             * @param {string} configuration.id The identifier of the object on the interface to update
             * @returns {Promise} The promise for the operation
             */
            this.putAsync = function (configuration) {
                return new Promise(function (fulfill, reject) {
                    $.ajax({
                        method: 'PUT',
                        url: _config.base + configuration.resource + (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id),
                        data: JSON.stringify(configuration.data),
                        dataType: 'json',
                        contentType: 'application/json',
                        async: !configuration.sync,
                        success: function (xhr) {
                            try {
                                if (fulfill) fulfill(xhr, configuration.state);
                            }
                            catch (e) {
                                if (reject) reject(e, configuration.state);
                            }
                        },
                        error: function (e) {

                            var error = e.responseJSON;

                            if (reject) {
                                if (error.error !== undefined) // oauth2
                                    reject(new SanteDBModel.Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                                else if (error.$type === "Exception" || error.type)
                                    reject(new SanteDBModel.Exception(error.type, error.message, error.detail, error.caused_by), configuration.state);
                                else
                                    reject(new SanteDBModel.Exception("Exception", "error.general." + error, e, null), configuration.state);
                            }
                            else
                                console.error("UNHANDLED PROMISE REJECT: " + JSON.stringif(e));
                        }
                    });
                });
            };

            /**
             * @method
             * @memberof SanteDB.APIWrapper
             * @summary Performs a GET on an existing item on the instance
             * @param {any} configuration The configuration object
             * @param {string} configuration.resource The resource that is to be fetched
             * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
             * @param {bool} configuration.sync When true, executes the request in synchronous mode
             * @param {any} configuration.query The query to be applied to the get
             * @returns {Promise} The promise for the operation
             */
            this.getAsync = function (configuration) {
                return new Promise(function (fulfill, reject) {
                    $.ajax({
                        method: 'GET',
                        url: _config.base + configuration.resource,
                        data: configuration.query,
                        dataType: 'json',
                        accept: 'application/json',
                        contentType: 'application/json',
                        async: !configuration.sync,
                        success: function (xhr) {
                            try {
                                if (fulfill) fulfill(xhr, configuration.state);
                            }
                            catch (e) {
                                if (reject) reject(e, configuration.state);
                            }
                        },
                        error: function (e) {

                            var error = e.responseJSON;

                            if (reject) {
                                if (error.error !== undefined) // oauth2
                                    reject(new SanteDBModel.Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                                else if (error.$type === "Exception" || error.type)
                                    reject(new SanteDBModel.Exception(error.type, error.message, error.detail, error.caused_by), configuration.state);
                                else
                                    reject(new SanteDBModel.Exception("Exception", "error.general." + error, e, null), configuration.state);
                            }
                            else
                                console.error("UNHANDLED PROMISE REJECT: " + JSON.stringif(e));
                        }
                    });
                });
            };

            /**
             * @method
             * @memberof SanteDB.APIWrapper
             * @summary Performs a DELETE on an existing item on the instance
             * @param {any} configuration The configuration object
             * @param {string} configuration.resource The resource that is to be deleted
             * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
             * @param {bool} configuration.sync When true, executes the request in synchronous mode
             * @param {any} configuration.id The object that is to be deleted on the server
             * @param {any} configuration.data The additional data that should be sent for the delete command
             * @param {string} configuration.mode The mode in which the delete should occur. Can be NULLIFY, CANCEL or OBSOLETE (default)
             * @returns {Promise} The promise for the operation
             */
            this.deleteAsync = function (configuration) {
                return new Promise(function (fulfill, reject) {
                    $.ajax({
                        method: 'DELETE',
                        url: _config.base + configuration.resource + (configuration.id ? (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id) : ""),
                        data: JSON.stringify(configuration.data),
                        headers: { "X-Delete-Mode": configuration.mode || "OBSOLETE" },
                        dataType: 'json',
                        accept: 'application/json',
                        contentType: 'application/json',
                        async: !configuration.sync,
                        success: function (xhr) {
                            try {
                                if (fulfill) fulfill(xhr, configuration.state);
                            }
                            catch (e) {
                                if (reject) reject(e, configuration.state);
                            }
                        },
                        error: function (e) {

                            var error = e.responseJSON;

                            if (reject) {
                                if (error.error !== undefined) // oauth2
                                    reject(new SanteDBModel.Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                                else if (error.$type === "Exception" || error.type)
                                    reject(new SanteDBModel.Exception(error.type, error.message, error.detail, error.caused_by), configuration.state);
                                else
                                    reject(new SanteDBModel.Exception("Exception", "error.general." + error, e, null), configuration.state);
                            }
                            else
                                console.error("UNHANDLED PROMISE REJECT: " + JSON.stringif(e));
                        }
                    });
                });
            };

        };

        /**
         * @class ResourceWrapper
         * @memberof SanteDB
         * @constructor
         * @summary Represents a wrapper for a SanteDB resource
         * @param {any} _config The configuration object
         * @param {string} _config.resource The resource that is being wrapped
         * @param {SanteDB.APIWrapper} _config.api The API to use for this resource
         */
        var ResourceWrapper = function (_config) {

            /**
             * @method
             * @memberof SanteDB.ResourceWrapper
             * @summary Retrieves a specific instance of the resource this wrapper wraps
             * @param {string} id The unique identifier of the resource to retrieve
             * @param {any} state A unique state object which is passed back to the caller
             * @returns {Promise} The promise for the operation
             */
            this.getAsync = function (id, state) {

                // Prepare query
                var _query = {};
                if (id) _query.id = id;

                return _config.api.getAsync({
                    query: _query,
                    state: state,
                    resource: _config.resource
                });
            };

            /**
             * @method
             * @memberof SanteDB.ResourceWrapper
             * @summary Queries for instances of the resource this wrapper wraps
             * @param {any} query The HDSI query to filter on
             * @param {any} state A unique state object which is passed back to the caller
             * @returns {Promise} The promise for the operation
             */
            this.findAsync = function (query, state) {
                return _config.api.getAsync({
                    query: query,
                    state: state,
                    resource: _config.resource
                });
            };

            /**
             * @method
             * @memberof SanteDB.ResourceWrapper
             * @summary Inserts a specific instance of the wrapped resource
             * @param {any} data The data / resource which is to be created
             * @param {any} state A unique state object which is passed back to the caller
             * @returns {Promise} The promise for the operation
             */
            this.insertAsync = function (data, state) {

                if (data.$type !== _config.resource)
                    throw new SanteDBModel.Exception("ArgumentException", "error.invalidType", `Invalid type, resource wrapper expects ${_config.resource} however ${data.$type} specified`);

                // Perform post
                return _config.api.postAsync({
                    data: data,
                    state: state,
                    resource: _config.resource
                });
            };

            /**
             * @method
             * @memberof SanteDB.ResourceWrapper
             * @summary Updates the identified instance of the wrapped resource
             * @param {string} id The unique identifier for the object to be updated
             * @param {any} data The data / resource which is to be updated
             * @param {any} state A unique state object which is passed back to the caller
             * @returns {Promise} The promise for the operation
             */
            this.updateAsync = function (id, data, state) {

                if (data.$type !== _config.resource)
                    throw new SanteDBModel.Exception("ArgumentException", "error.invalidType", `Invalid type, resource wrapper expects ${_config.resource} however ${data.$type} specified`);
                else if (data.id && data.id !== id)
                    throw new SanteDBModel.Exception("ArgumentException", "error.invalidValue", `Identifier mismatch, PUT identifier  ${id} doesn't match ${data.id}`);

                // Send PUT
                return _config.api.putAsync({
                    data: data,
                    id: id,
                    state: state,
                    resource: _config.resource
                });
            };

            /**
            * @method
            * @memberof SanteDB.ResourceWrapper
            * @summary Performs an obsolete (delete) operation on the server
            * @param {string} id The unique identifier for the object to be deleted
            * @param {any} state A unique state object which is passed back to the caller
            * @returns {Promise} The promise for the operation
            */
            this.deleteAsync = function (id, state) {
                return _config.api.deleteAsync({
                    id: id,
                    state: state,
                    resource: _config.resource
                });
            };


            /**
             * @method
             * @memberof SanteDB.ResourceWrapper
             * @summary Performs a nullify on the specified object
             * @description A nullify differs from a delete in that a nullify marks an object as "never existed"
             * @param {string} id The unique identifier for the object to be nullified
             * @param {any} state A unique state object which is passed back to the caller
             * @returns {Promise} The promise for the operation
             */
            this.nullifyAsync = function (id, state) {
                return _config.api.deleteAsync({
                    id: id,
                    mode: "NULLIFY",
                    state: state,
                    resource: _config.resource
                });
            };

            /**
             * @method
             * @memberof SanteDB.ResourceWrapper
             * @summary Performs a cancel on the specified object
             * @description A cancel differs from a delete in that a cancel triggers a state change from NORMAL>CANCELLED
             * @param {string} id The unique identifier for the object to be cancelled
             * @param {any} state A unique state object which is passed back to the caller
             * @returns {Promise} The promise for the operation
             */
            this.cancelAsync = function (id, state) {
                return _config.api.deleteAsync({
                    id: id,
                    mode: "CANCEL",
                    state: state,
                    resource: _config.resource
                });
            };
        };

        // Public exposeing
        this.APIWrapper = APIWrapper;
        this.ResourceWrapper = ResourceWrapper;

        // hdsi internal
        var _hdsi = new APIWrapper({
            idByQuery: true,
            base: "/__imsi/"
        });
        // ami internal
        var _ami = new APIWrapper({
            idByQuery: true,
            base: "/__ami/"
        });

        // Resources internal
        var _resources = {
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the Patient Resource
             */
            patient: new ResourceWrapper({
                resource: "Patient",
                api: _hdsi
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the SubstanceAdministration Resource
             */
            substanceAdministration: new ResourceWrapper({
                resource: "SubstanceAdministration",
                api: _hdsi
            }),
            /**
             * @property {SanteDB.ResourceWrapper}
             * @memberof SanteDB.resources
             * @summary Represents the Act Resource
             */
            act: new ResourceWrapper({
                resource: "Act",
                api: _hdsi
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @summary Represents the entity resource
             * @memberof SanteDB.resources
             */
            entity: new ResourceWrapper({
                resource: "Entity",
                api: _hdsi
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @summary Represents the entity relationship resource
             * @memberof SanteDB.resources
             */
            entityRelationship: new ResourceWrapper({
                resource: "EntityRelationship",
                api: _hdsi
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the Observation Resource
             */
            observation: new ResourceWrapper({
                resource: "Observation",
                api: _hdsi
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the Place Resource
             */
            place: new ResourceWrapper({
                resource: "Place",
                api: _hdsi
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the Provider Resource
             */
            provider: new ResourceWrapper({
                resource: "Provider",
                api: _hdsi
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the UserEntity Resource
             */
            userEntity: new ResourceWrapper({
                resource: "UserEntity",
                api: _hdsi
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the Organization Resource
             */
            organization: new ResourceWrapper({
                resource: "Organization",
                api: _hdsi
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the Material Resource
             */
            material: new ResourceWrapper({
                resource: "Material",
                api: _hdsi
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the ManufacturedMaterial Resource
             */
            manufacturedMaterial: new ResourceWrapper({
                resource: "ManufacturedMaterial",
                api: _hdsi
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the ManufacturedMaterial Resource
             */
            concept: new ResourceWrapper({
                resource: "Concept",
                api: _ami
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the ConceptSet Resource
             */
            conceptSet: new ResourceWrapper({
                resource: "ConceptSet",
                api: _ami
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the ReferenceTerm Resource
             */
            referenceTerm: new ResourceWrapper({
                resource: "ReferenceTerm",
                api: _ami
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the CodeSystem Resource
             */
            codeSystem: new ResourceWrapper({
                resource: "CodeSystem",
                api: _ami
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the DeviceEntity Resource
             */
            deviceEntity: new ResourceWrapper({
                resource: "DeviceEntity",
                api: _ami
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Represents the ApplicationEntity Resource
             */
            applicationEntity: new ResourceWrapper({
                resource: "ApplicationEntity",
                api: _ami
            }),
            /**
             * @property {SanteDB.ResourceWrapper} 
             * @memberof SanteDB.resources
             * @summary Gets the configuration resource
             */
            configuration: new ResourceWrapper({
                resource: "Configuration",
                api: _ami
            }),
            /**
             * @property {SanteDB.ResourceWrapper}
             * @memberof SanteDB.resources
             * @summary Gets the queue control resource
             */
            queue: new ResourceWrapper({
                resource: "Queue",
                api: _ami
            })
        };

        // master configuration closure
        var _masterConfig = null;
        var _configuration = {

            /**
             * @method
             * @memberof SanteDB.configuration
             * @summary Get the configuration, nb: this caches the configuration
             * @returns {Promise} The configuration
             */
            getAsync: function () {
                return new Promise(function (fulfill, reject) {
                    try {
                        if (_masterConfig)
                            fulfill(_masterConfig);
                        else {
                            _resources.configuration.getAsync()
                                .then(function (d) {
                                    fulfill(_masterConfig);
                                })
                                .catch(function (e) {
                                    reject(e);
                                });
                        }
                    }
                    catch (e) {
                        reject(e);
                    }
                });
            },

            /**
             * @method
             * @memberof SanteDB.configuration
             * @summary Get the specified configuration key
             * @returns {string} The application key setting
             * @param {string} key The key of the setting to find
             */
            getAppSetting: function (key) {
                try {
                    if (!_masterConfig) throw new SanteDBModel.Exception("Exception", "error.invalidOperation", "You need to call configuration.getAsync() before calling getAppSetting()");
                    var _setting = _masterConfig.application.setting.find((k) => k.key === key);
                    if (_setting)
                        return _setting.value;
                    else
                        return null;
                }
                catch (e) {
                    if (!e.$type)
                        throw new SanteDBModel.Exception("Exception", "error.unknown", e.detail, e);
                    else
                        throw e;
                }
            },

            /**
             * @method 
             * @memberof SanteDB.configuration
             * @summary Sets the specified application setting
             * @param {string} key The key of the setting to set
             * @param {string} value The value of the application setting
             * @see SanteDB.configuration.save To save the updated configuration
             */
            setAppSetting: function (key, value) {
                try {
                    if (!_masterConfig) throw new SanteDBModel.Exception("Exception", "error.invalidOperation", "You need to call configuration.getAsync() before calling getAppSetting()");
                    var _setting = _masterConfig.application.setting.find((k) => k.key === key);
                    if (_setting)
                        _setting.value = value;
                    else
                        _masterConfig.application.setting.push({ key: key, value: value });
                }
                catch (e) {
                    if (!e.$type)
                        throw new SanteDBModel.Exception("Exception", "error.unknown", e.detail, e);
                    else
                        throw e;
                }
            },

            /**
             * @method
             * @memberof SanteDB.configuration
             * @summary Gets the currently configured realm
             * @returns {string} The name of the security realm
             */
            getRealm: function() {
                try {
                    if (!_masterConfig) throw new SanteDBModel.Exception("Exception", "error.invalidOperation", "You need to call configuration.getAsync() before calling getAppSetting()");
                    return _masterConfig.realmName;
                }
                catch (e) {
                    if (!e.$type)
                        throw new SanteDBModel.Exception("Exception", "error.unknown", e.detail, e);
                    else
                        throw e;
                }
            },

            /**
             * @method 
             * @summary Gets the specified section name
             * @memberof SanteDB.configuration
             * @param {any} name The name of the configuration section
             * @returns {any} A JSON object representing the configuration setting section
             */
            getSection: function(name) {
                try {
                    if (!_masterConfig) throw new SanteDBModel.Exception("Exception", "error.invalidOperation", "You need to call configuration.getAsync() before calling getAppSetting()");
                    return _masterConfig[name];
                }
                catch (e) {
                    if (!e.$type)
                        throw new SanteDBModel.Exception("Exception", "error.unknown", e.detail, e);
                    else
                        throw e;
                }
            },

            /**
             * @method
             * @summary Instructs the current system to join a realm
             * @memberof SanteDB.configuration
             * @returns {Promise} The configuration file after joining the realm
             * @param {any} configData The configuration data for the realm
             * @param {string} configData.domain The domain to which the application is to be joined
             * @param {string} configData.deviceName The name of the device to join as
             * @param {boolean} configData.replaceExisting When true, instructs the application to replace an existing registration
             * @param {boolean} configData.enableTrace When true, enables log file tracing of requests
             * @param {boolean} configData.enableSSL When true, enables HTTPS
             * @param {number} configData.port The port number to connect to the realm on
             */
            joinRealmAsync: function(configData) {
                return new Promise(function (fulfill, reject) {
                    try {
                        _ami.postAsync({
                            resource: "Configuration/Realm",
                            data: {
                                realmUri: configData.domain,
                                deviceName: configData.deviceName,
                                replaceExisting: configData.replaceExisting,
                                enableTrace: configData.enableTrace,
                                enableSSL: configData.enableSSL,
                                port: configData.port
                            }
                        }).then(function (d) {
                            _masterConfig = d;
                            fulfill(d);
                        }).catch(function (e) {
                            console.error(`Error joining realm: ${e}`);
                            reject(e);
                        });
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new SanteDBModel.Exception("Exception", "error.general", e);
                        reject(ex);
                    }
                });
            },
            /**
             * @method
             * @memberof SanteDB.configuration
             * @summary Instructs the application to remove realm configuration
             * @returns {Promise} A promise that is fulfilled when the leave operation succeeds
             */
            leaveRealmAsync: function() {
                return new Promise(function (fulfill, reject) {
                    try {
                        _ami.deleteAsync({
                            resource: "Configuration/Realm"
                        })
                            .then(function (d) { fulfill(d); })
                            .catch(function (e) { reject(e); });
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new SanteDBModel.Exception("Exception", "error.general", e);
                        reject(ex);
                    }
                });
            },
            /**
             * @method
             * @memberof SanteDB.configuration
             * @summary Save the configuration object
             * @param {any} configuration The configuration object to save
             * @returns {Promise} A promise object indicating whether the save was successful
             */
            saveAsync: function (configuration) {
                return new Promise(function (fulfill, reject) {
                    try {
                        _resources.configuration.insertAsync(configuration)
                            .then(function (d) { fulfill(d); })
                            .catch(function (e) { reject(e); });
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new SanteDBModel.Exception("Exception", "error.general", e);
                        reject(ex);
                    }
                });
            },
            /**
             * @method
             * @memberof SanteDB.configuration
             * @summary Gets the user specific preferences
             * @returns {Promise} A promise representing the retrieval of the user settings
             */
            getUserPreferencesAsync: function () {
                return new Promise(function (fulfill, reject) {
                    try {
                        _ami.getAsync({
                            resource: "Configuration/User"
                        })
                            .then(function (d) { fulfill(d); })
                            .catch(function (e) { reject(e); });
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new SanteDBModel.Exception("Exception", "error.general", e);
                        reject(ex);
                    }
                });
            },
            /**
             * @method
             * @memberof SanteDB.configuration
             * @summary Saves the user preferences
             * @param {any} preferences A dictionary of preferences to be saved
             * @returns {Promise} A promise which indicates when preferences were saved
             * @example Save user preference for color
             * SanteDB.configuration.saveUserPreferences([
             *  { key: "color", value: "red" }
             * ]);
             */
            saveUserPreferencesAsync: function (preferences) {
                return new Promise(function (fulfill, reject) {
                    try {
                        _ami.postAsync({
                            resource: "Configuration/User",
                            data: preferences
                        })
                            .then(function (d) { fulfill(d); })
                            .catch(function (e) { reject(e); });
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new SanteDBModel.Exception("Exception", "error.general", e);
                        reject(ex);
                    }
                });
            }
        };

        // Public bindings
        /**
        * @property {SanteDB.APIWrapper}
        * @summary Represents a property which wraps the HDSI interface
        * @memberof SanteDB
        */
        this.hdsi = _hdsi;
        /**
        * @property {SanteDB.APIWrapper}
        * @memberof SanteDB
        * @summary Represents a property which communicates with the AMI
        */
        this.ami = _ami;
        /**
         * @property
         * @memberof SanteDB
         * @summary Provides access to resource handlers
         */
        this.resources = _resources;
        /**
         * @summary Configuration routines for SanteDB
         * @class
         * @static
         * @memberof SanteDB
         */
        this.configuration = _configuration;
    }();


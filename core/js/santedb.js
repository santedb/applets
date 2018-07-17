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
new function() {
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
        }

        /**
         * @method
         * @memberof SanteDB.APIWrapper
         * @summary Creates a new item on the instance
         * @param {any} configuration The configuration object
         * @param {string} configuration.resource The resource that is to be posted
         * @param {any} configuration.data The data that is to be posted
         * @param {any} configuration.state A piece of state data which is passed back to the caller for state tracking
         * @param {bool} configuration.sync When true, executes the request in synchronous mode
         * @return {Promise} The promise for the operation
         */
        this.post = function (configuration) {
            return new Promise(function(fulfill, reject) {
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
         * @return {Promise} The promise for the operation
         */
        this.put = function (configuration) {
            return new Promise(function(fulfill, reject) {
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
         * @return {Promise} The promise for the operation
         */
        this.get = function (configuration) {
            return new Promise(function(fulfill, reject) {
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
         * @return {Promise} The promise for the operation
         */
        this.delete = function (configuration) {
            return new Promise(function(fulfill, reject) {
                $.ajax({
                    method: 'DELETE',
                    url: _config.base + configuration.resource + (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id),
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

    }

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
         * @return {Promise} The promise for the operation
         */
        this.get = function (id, state) {
            return _config.api.get({
                query: { _id: id },
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
         * @return {Promise} The promise for the operation
         */
        this.find = function (query, state) {
            return _config.api.get({
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
        this.insert = function (data, state) {

            if (data.$type !== _config.resource)
                throw new SanteDBModel.Exception("ArgumentException", "Invalid Argument Type", `Invalid type, resource wrapper expects ${_config.resource} however ${data.$type} specified`);

            // Perform post
            return _config.api.post({
                data: data,
                state: state,
                resource: _config.resource
            });
        }

        /**
         * @method
         * @memberof SanteDB.ResourceWrapper
         * @summary Updates the identified instance of the wrapped resource
         * @param {string} id The unique identifier for the object to be updated
         * @param {any} data The data / resource which is to be updated
         * @param {any} state A unique state object which is passed back to the caller
         * @return {Promise} The promise for the operation
         */
        this.update = function (id, data, state) {

            if (data.$type !== _config.resource)
                throw new SanteDBModel.Exception("ArgumentException", "Invalid Argument Type", `Invalid type, resource wrapper expects ${_config.resource} however ${data.$type} specified`);
            else if (data.id && data.id !== id)
                throw new SanteDBModel.Exception("ArgumentException", "Invalid Argument Value", `Identifier mismatch, PUT identifier  ${id} doesn't match ${data.id}`);

            // Send PUT
            return _config.api.put({
                data: data,
                id: id,
                state: state,
                resource: _config.resource
            });
        }

        /**
        * @method
        * @memberof SanteDB.ResourceWrapper
        * @summary Performs an obsolete (delete) operation on the server
        * @param {string} id The unique identifier for the object to be deleted
        * @param {any} state A unique state object which is passed back to the caller
        * @return {Promise} The promise for the operation
        */
        this.delete = function (id, state) {
            return _config.api.delete({
                id: id,
                state: state,
                resource: _config.resource
            });
        }


        /**
         * @method
         * @memberof SanteDB.ResourceWrapper
         * @summary Performs a nullify on the specified object
         * @description A nullify differs from a delete in that a nullify marks an object as "never existed"
         * @param {string} id The unique identifier for the object to be nullified
         * @param {any} state A unique state object which is passed back to the caller
         * @return {Promise} The promise for the operation
         */
        this.nullify = function (id, state) {
            return _config.api.delete({
                id: id,
                mode: "NULLIFY",
                state: state,
                resource: _config.resource
            });
        }

        /**
         * @method
         * @memberof SanteDB.ResourceWrapper
         * @summary Performs a cancel on the specified object
         * @description A cancel differs from a delete in that a cancel triggers a state change from NORMAL>CANCELLED
         * @param {string} id The unique identifier for the object to be cancelled
         * @param {any} state A unique state object which is passed back to the caller
         * @returns {Promise} The promise for the operation
         */
        this.cancel = function (id, state) {
            return _config.api.delete({
                id: id,
                mode: "CANCEL",
                state: state,
                resource: _config.resource
            });
        }
    };

    // Public exposeing
    this.APIWrapper = APIWrapper;
    this.ResourceWrapper = ResourceWrapper;

    /**
    * @property {SanteDB.APIWrapper} Hdsi
    * @summary Represents a property which wraps the HDSI interface
    * @memberof SanteDB
    */
    this.Hdsi = new APIWrapper({
        idByQuery: true,
        base: "/__imsi/",
    });

    /**
    * @property {SanteDB.APIWrapper} Ami
    * @memberof SanteDB
    * @summary Represents a property which communicates with the AMI
    */
    this.Ami = new APIWrapper({
        idByQuery: true,
        base: "/__ami/"
    });

        /**
         * @property {SanteDB.ResourceWrapper} Patient
         * @memberof SanteDB
         * @summary Represents the Patient Resource
         */
        this.Patient = new ResourceWrapper({
            resource: "Patient",
            api: this.Hdsi
        });

        /**
         * @property {SanteDB.ResourceWrapper} SubstanceAdministration
         * @memberof SanteDB
         * @summary Represents the SubstanceAdministration Resource
         */
        this.SubstanceAdministration = new ResourceWrapper({
            resource: "SubstanceAdministration",
            api: this.Hdsi
        });

        /**
         * @property {SanteDB.ResourceWrapper} Act
         * @memberof SanteDB
         * @summary Represents the Act Resource
         */
        this.Act = new ResourceWrapper({
            resource: "Act",
            api: this.Hdsi
        });

        /**
         * @property {SanteDB.ResourceWrapper} Observation
         * @memberof SanteDB
         * @summary Represents the Observation Resource
         */
        this.Observation = new ResourceWrapper({
            resource: "Observation",
            api: this.Hdsi
        });

        /**
         * @property {SanteDB.ResourceWrapper} Place
         * @memberof SanteDB
         * @summary Represents the Place Resource
         */
        this.Observation = new ResourceWrapper({
            resource: "Place",
            api: this.Hdsi
        });

        /**
         * @property {SanteDB.ResourceWrapper} Provider
         * @memberof SanteDB
         * @summary Represents the Provider Resource
         */
        this.Provider = new ResourceWrapper({
            resource: "Provider",
            api: this.Hdsi
        });

        /**
         * @property {SanteDB.ResourceWrapper} UserEntity
         * @memberof SanteDB
         * @summary Represents the UserEntity Resource
         */
        this.UserEntity = new ResourceWrapper({
            resource: "UserEntity",
            api: this.Hdsi
        });

        /**
         * @property {SanteDB.ResourceWrapper} Organization
         * @memberof SanteDB
         * @summary Represents the Organization Resource
         */
        this.Organization = new ResourceWrapper({
            resource: "Organization",
            api: this.Hdsi
        });

        /**
         * @property {SanteDB.ResourceWrapper} Material
         * @memberof SanteDB
         * @summary Represents the Material Resource
         */
        this.Material = new ResourceWrapper({
            resource: "Material",
            api: this.Hdsi
        });

        /**
         * @property {SanteDB.ResourceWrapper} ManufacturedMaterial
         * @memberof SanteDB
         * @summary Represents the ManufacturedMaterial Resource
         */
        this.ManufacturedMaterial = new ResourceWrapper({
            resource: "ManufacturedMaterial",
            api: this.Hdsi
        });

        /**
         * @property {SanteDB.ResourceWrapper} Concept
         * @memberof SanteDB
         * @summary Represents the ManufacturedMaterial Resource
         */
        this.Concept = new ResourceWrapper({
            resource: "Concept",
            api: this.Ami
        });

        /**
         * @property {SanteDB.ResourceWrapper} ConceptSet
         * @memberof SanteDB
         * @summary Represents the ConceptSet Resource
         */
        this.ConceptSet = new ResourceWrapper({
            resource: "ConceptSet",
            api: this.Ami
        });

        /**
         * @property {SanteDB.ResourceWrapper} ReferenceTerm
         * @memberof SanteDB
         * @summary Represents the ReferenceTerm Resource
         */
        this.ReferenceTerm = new ResourceWrapper({
            resource: "ReferenceTerm",
            api: this.Ami
        });


        /**
         * @property {SanteDB.ResourceWrapper} CodeSystem
         * @memberof SanteDB
         * @summary Represents the CodeSystem Resource
         */
        this.CodeSystem = new ResourceWrapper({
            resource: "CodeSystem",
            api: this.Ami
        });


        /**
         * @property {SanteDB.ResourceWrapper} DeviceEntity
         * @memberof SanteDB
         * @summary Represents the DeviceEntity Resource
         */
        this.DeviceEntity = new ResourceWrapper({
            resource: "DeviceEntity",
            api: this.Ami
        });

        /**
         * @property {SanteDB.ResourceWrapper} ApplicationEntity
         * @memberof SanteDB
         * @summary Represents the ApplicationEntity Resource
         */
        this.ApplicationEntity = new ResourceWrapper({
            resource: "ApplicationEntity",
            api: this.Ami
        });
}();


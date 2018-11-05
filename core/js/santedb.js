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

// Backing of execution environment
var ExecutionEnvironment = {
    Unknown: 0,
    Server: 1,
    Mobile: 2,
    UserInterface: 3
};

if(!SanteDBWrapper)
    /**
     * @class
     * @constructor
     * @summary SanteDB Binding Class
     * @description This class exists as a simple interface which is implemented by host implementations of the SanteDB hostable core. This interface remains the same even though the 
     *              implementations of this file on each platform (Admin, BRE, Client, etc.) are different.
     */
    function SanteDBWrapper() {
        "use strict";

        /**
            * @class APIWrapper
            * @constructor
            * @memberof SanteDBWrapper
            * @summary SanteDB HDSI implementation that uses HTTP (note, other implementations may provide alternates)
            * @param {any} _config The configuration of the service
            * @param {string} _config.base The base URL for the service
            * @param {boolean} _config.idByQuery When true, indicates the wrapper wants to pass IDs by query
            */
        function APIWrapper(_config) {

            /**
                * @method
                * @summary Reconfigures this instance of the API wrapper
                * @memberof SanteDBWrapper.APIWrapper
                * @param {any} config The configuration of the service
                * @param {string} config.base The base URL for the service
                * @param {boolean} config.idByQuery When true, indicates the wrapper wants to pass IDs by query
                */
            this.configure = function (config) {
                _config = config;
            };

            /**
                * @method
                * @memberof SanteDBWrapper.APIWrapper
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
                        data: configuration.contentType == 'application/json' ? JSON.stringify(configuration.data) : configuration.data,
                        dataType: 'json',
                        contentType: configuration.contentType || 'application/json',
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
                                if (error && error.error !== undefined) // oauth2
                                    reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                                else if (error && (error.$type === "Exception" || error.type))
                                    reject(new Exception(error.type, error.message, error.detail, error.caused_by), configuration.state);
                                else
                                    reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                            }
                            else
                                console.error("UNHANDLED PROMISE REJECT: " + JSON.stringif(e));
                        }
                    });
                });
            };

            /**
                * @method
                * @memberof SanteDBWrapper.APIWrapper
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
                        data: configuration.contentType == 'application/json' ? JSON.stringify(configuration.data) : configuration.data,
                        dataType: 'json',
                        contentType: configuration.contentType || 'application/json',
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
                                if (error && error.error !== undefined) // oauth2
                                    reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                                else if (error && (error.$type === "Exception" || error.type))
                                    reject(new Exception(error.type, error.message, error.detail, error.caused_by), configuration.state);
                                else
                                    reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                            }
                            else
                                console.error("UNHANDLED PROMISE REJECT: " + JSON.stringif(e));
                        }
                    });
                });
            };

            /**
                * @method
                * @memberof SanteDBWrapper.APIWrapper
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
                        dataType: 'json',
                        accept: 'application/json',
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
                                if (error && error.error !== undefined) // oauth2
                                    reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                                else if (error && (error.$type === "Exception" || error.type))
                                    reject(new Exception(error.type, error.message, error.detail, error.caused_by), configuration.state);
                                else
                                    reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
                            }
                            else
                                console.error("UNHANDLED PROMISE REJECT: " + JSON.stringif(e));
                        }
                    });
                });
            };

            /**
                * @method
                * @memberof SanteDBWrapper.APIWrapper
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
                    $.ajax({
                        method: 'DELETE',
                        url: _config.base + configuration.resource + (configuration.id ? (_config.idByQuery ? "?_id=" + configuration.id : "/" + configuration.id) : ""),
                        data: configuration.contentType == 'application/json' ? JSON.stringify(configuration.data) : configuration.data,
                        headers: { "X-Delete-Mode": configuration.mode || "OBSOLETE" },
                        dataType: 'json',
                        accept: 'application/json',
                        contentType: configuration.contentType || 'application/json',
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
                                if (error && error.error !== undefined) // oauth2
                                    reject(new Exception(error.type, error.error, error.error_description, error.caused_by), configuration.state);
                                else if (error && (error.$type === "Exception" || error.type))
                                    reject(new Exception(error.type, error.message, error.detail, error.caused_by), configuration.state);
                                else
                                    reject(new Exception("HttpException", "error.http." + e.status, e, null), configuration.state);
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
            * @memberof SanteDBWrapper
            * @constructor
            * @summary Represents a wrapper for a SanteDB resource
            * @param {any} _config The configuration object
            * @param {string} _config.resource The resource that is being wrapped
            * @param {APIWrapper} _config.api The API to use for this resource
            */
        function ResourceWrapper (_config) {

            /**
                * @method
                * @memberof SanteDBWrapper.ResourceWrapper
                * @summary Retrieves a specific instance of the resource this wrapper wraps
                * @param {string} id The unique identifier of the resource to retrieve
                * @param {any} state A unique state object which is passed back to the caller
                * @returns {Promise} The promise for the operation
                */
            this.getAsync = function (id, state) {

                // Prepare query
                var _query = {};
                if (id) _query._id = id;

                return _config.api.getAsync({
                    query: _query,
                    state: state,
                    resource: _config.resource
                });
            };

            /**
                * @method
                * @memberof SanteDBWrapper.ResourceWrapper
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
             * @memberof SanteDBWrapper.ResourceWrapper
             * @param {any} query The query for the object that you are looking for
             * @summary Queries for instances of the resource this wrapper wraps in a synchronous fashion
             * @see {SanteDBWrapper.findAsync} For asynchronous method
             * @return {Promise} A promise which is blocked and not executed until the operation is complete
             */
            this.find = function (query) {
                return _config.api.getAsync({
                    sync: true,
                    resource: _config.resource,
                    query: query
                });
            }

            /**
                * @method
                * @memberof SanteDBWrapper.ResourceWrapper
                * @summary Inserts a specific instance of the wrapped resource
                * @param {any} data The data / resource which is to be created
                * @param {any} state A unique state object which is passed back to the caller
                * @returns {Promise} The promise for the operation
                */
            this.insertAsync = function (data, state) {

                if (data.$type !== _config.resource)
                    throw new Exception("ArgumentException", "error.invalidType", `Invalid type, resource wrapper expects ${_config.resource} however ${data.$type} specified`);

                // Perform post
                return _config.api.postAsync({
                    data: data,
                    state: state,
                    contentType: "application/json",
                    resource: _config.resource
                });
            };

            /**
                * @method
                * @memberof SanteDBWrapper.ResourceWrapper
                * @summary Updates the identified instance of the wrapped resource
                * @param {string} id The unique identifier for the object to be updated
                * @param {any} data The data / resource which is to be updated
                * @param {any} state A unique state object which is passed back to the caller
                * @returns {Promise} The promise for the operation
                */
            this.updateAsync = function (id, data, state) {

                if (data.$type !== _config.resource)
                    throw new Exception("ArgumentException", "error.invalidType", `Invalid type, resource wrapper expects ${_config.resource} however ${data.$type} specified`);
                else if (data.id && data.id !== id)
                    throw new Exception("ArgumentException", "error.invalidValue", `Identifier mismatch, PUT identifier  ${id} doesn't match ${data.id}`);

                // Send PUT
                return _config.api.putAsync({
                    data: data,
                    id: id,
                    state: state,
                    contentType: "application/json",
                    resource: _config.resource
                });
            };

            /**
            * @method
            * @memberof SanteDBWrapper.ResourceWrapper
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
                * @memberof SanteDBWrapper.ResourceWrapper
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
                * @memberof SanteDBWrapper.ResourceWrapper
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
            base: "/__hdsi/"
        });
        // ami internal
        var _ami = new APIWrapper({
            idByQuery: true,
            base: "/__ami/"
        });
        // auth internal
        var _auth = new APIWrapper({
            idByQuery: true,
            base: "/__auth/"
        });
        // Backing data for app API
        var _app = new APIWrapper({
            base: "/__app/",
            idByQuery: true
        });

        // App controller internal
        var _application = {
            /**
             * @summary Gets the solution
             * @method
             * @memberof SnateDBWrapper.app
             */
            getAppSolutionsAsync: function() {
                return _app.getAsync({
                    resource: "solutions"
                });
            },
            /**
             * @summary Closes the application or restarts it in the case of the mobile
             * @method
             * @memberof SanteDBWrapper.app
             */
            close: function() {
                __SanteDBAppService.Close();
            },
            /**
             * @summary Instructs the back end service to perform a system upgrade
             * @param {string} appId The id of the applet which should be updated
             * @returns {Promise} A promise representing the fulfillment or rejection of update
             * @method
             * @memberof SanteDBWrapper.app
             */
            doUpdateAsync: function (appId) {
                return _app.postAsync({
                    resource: "update"
                });
            },
            /**
             * @summary Instructs the back end service to perform a compact
             * @param {boolean} takeBackup When true, instructs the back end to take a backup of data
             * @returns {Promise} A promise representing the fulfillment or rejection of update
             * @method
             * @memberof SanteDBWrapper.app
             */
            compactAsync: function (takeBackup) {
                return _app.post({
                    resource: "data",
                    data: { backup: takeBackup },
                    contentType: 'application/x-www-urlform-encoded'
                });
            },
            /**
             * @summary Instructs the back end service to perform a purge of all data
             * @param {boolean} takeBackup True if the back-end should take a backup before purge
             * @returns {Promise} The promise representing the fulfillment or rejection
             * @method
             * @memberof SanteDBWrapper.app
             */
            purgeAsync: function (takeBackup) {
                return _app.deleteAsync({
                    resource: "data",
                    data: { backup: takeBackup },
                    contentType: 'application/x-www-urlform-encoded'
                });
            },
            /**
             * @summary Instructs the backend to restore the data from a backup
             * @returns {Promise} The promise representing the fulfillment or rejection
             * @method
             * @memberof SanteDBWrapper.app
             */
            restoreAsync: function () {
                return _app.postAsync({
                    resource: "data/restore"
                });
            },
            /**
             * @summary Create a backup of current assets
             * @returns {Promise}
             * @param {boolean} makePublic Make the backup public 
             * @method
             * @memberof SanteDBWrapper.app
             */
            createBackupAsync: function (makePublic) {
                return _app.postAsync({
                    resource: "data/backup",
                    data: { makePublic: makePublic },
                    contentType: 'application/x-www-urlform-encoded'
                });
            },
            /**
             * @summary Get all backups and backup information
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {Promise} The promise representing the fulfillment or rejection
             */
            getBackupAsync: function () {
                return _app.getAsync({
                    resource: "data/backup",
                });
            },
            /**
             * @summary Load a data asset from an applet's Data/ directory
             * @method
             * @memberof SanteDBWrapper.app
             * @param {string} dataId The identifier of the data asset to load
             * @returns {string} The data asset
             */
            loadDataAsset: function (dataId) {
                return atob(__SanteDBAppService.GetDataAsset(dataId));
            },
            /**
             * @summary Submits a user entered bug report 
             * @method
             * @memberof SanteDBWrapper.app
             * @param {any} bugReport The structured bug report to be submitted
             * @returns {Promise} The promise to fulfill or reject the request
             */
            submitBugReportAsync: function (bugReport) {
                return _app.postAsync({
                    resource: "bug",
                    data: bugReport
                });
            },
            /**
             * @summary Gets a list of all logs and their information from the server
             * @method
             * @memberof SanteDBWrapper.app
             * @param {string} _id The id of the log file to fetch contents of
             * @returns {Promise} The promise representing the async request
             */
            getLogInfoAsync: function (_id) {
                var query;
                if (_id)
                    query = { _id: _id };
                return _app.getAsync({
                    resource: "log",
                    query: query
                });
            },
            /**
             * @summary Create a new UUID
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {string} A new unique UUID
             */
            newGuid: function () {
                return __SanteDBAppService.NewGuid();
            },
            /**
             * @summary Get application version information 
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {Promise} The promise from the async representation
             * @param {boolean} checkForUpdates When true, check the master server for updates
             */
            getAppInfoAsync: function (checkForUpdates) {
                return _app.getAsync({
                    resource: "info",
                    query: { _updates: true }
                });
            },
            /**
             * @summary Get the health of the application (current utilization)
             * @method 
             * @memberof SanteDBWrapper.app
             * @returns {Promise} The promise from the async operation
             */
            getHealthAsync: function () {
                return _app.getAsync({
                    resource: "health"
                });
            },
            /**
             * @summary Get the online status of the application
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {boolean} True if the application is online
             */
            getOnlineState: function () {
                return __SanteDBAppService.GetOnlineState();
            },
            /**
             * @summary Indicates whether the server's AMI is available
             * @description This command actually sends a lightweight PING function to the AMI server
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {boolean} True if the AMI is available
             */
            isAdminAvailable: function () {
                return __SanteDBAppService.IsAdminAvailable();
            },
            /**
             * @summary Indicates whether the HDSI is available
             * @description This command actually sends a lightweight PING function to the HDSI server
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {boolean} True if the HDSI is available
             */
            isClinicalAvailable: function () {
                return __SanteDBAppService.IsClinicalAvailable
            },
            /**
             * @summary Resolves the HTML input form for the specified template
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {string} The HTML content of the input form for the specified template
             * @param {string} templateId The id of the template for which HTML input should be gathered
             */
            resolveTemplateForm: function (templateId) {
                return __SanteDBAppService.GetTemplateForm(templateId);
            },
            /**
             * @summary Resolves the HTML view for the specified template
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {string} The HTML content of the view for the specified template
             * @param {string} templateId The id of the template for which HTML view should be gathered
             */
            resolveTemplateView: function (templateId) {
                return __SanteDBAppService.GetTemplateView(templateId);
            },
            /**
             * @summary Get a list of all installed template definitions
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {Array<string>} The list of template definitions
             */
            getTemplateDefinitions: function () {
                return JSON.parse(__SanteDBAppService.GetTemplates());
            },
            /**
             * @summary Get the version of the application host
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {string} The version of the host this applet is running in
             */
            getVersion: function () {
                return __SanteDBAppService.GetVersion();
            },
            /**
             * @summary Get all available user interface menus for the current user
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {any} A structure of menus the user is allowed to access
             */
            getMenusAsync: function () {
                return _app.getAsync({
                    resource: "menu"
                });
            },
            /**
             * @summary Indicates whether the application host can scan barcodes
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {boolean} True if the application supports a camera
             */
            canScanBarcode: function () {
                return __SanteDBAppService.HasCamera();
            },
            /**
             * @summary Launches the camera on the device to take a picture of a barcode
             * @method
             * @memberof SanteDBWrapper.app
             * @returns {string} The scanned barcode
             */
            scanBarcode: function () {
                try {
                    var value = __SanteDBAppService.ScanBarcode();
                    return value;
                }
                catch (e) {
                    console.error(e);
                    throw new Exception("Exception", "error.general", e);
                }
            }
        }

        // Resources internal
        var _resources = {
            /**
                * @property {SanteDBWrapper.ResourceWrapper} bundle The bundle resource handler
                * @memberof SanteDBWrapper.resources
                * @summary Represents a resource wrapper that persists bundles
                */
            bundle: new ResourceWrapper({
                resource: "bundle",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper}
                * @memberof SanteDBWrapper.resources
                * @summary Represents an resource wrapper that interoperates with the care planner
                */
            carePlan: new ResourceWrapper({
                resource: "careplan",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the Patient Resource
                */
            patient: new ResourceWrapper({
                resource: "patient",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the SubstanceAdministration Resource
                */
            substanceAdministration: new ResourceWrapper({
                resource: "substanceadministration",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper}
                * @memberof SanteDBWrapper.resources
                * @summary Represents the Act Resource
                */
            act: new ResourceWrapper({
                resource: "act",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @summary Represents the entity resource
                * @memberof SanteDBWrapper.resources
                */
            entity: new ResourceWrapper({
                resource: "entity",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @summary Represents the entity relationship resource
                * @memberof SanteDBWrapper.resources
                */
            entityRelationship: new ResourceWrapper({
                resource: "entityrelationship",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the Observation Resource
                */
            observation: new ResourceWrapper({
                resource: "observation",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the Place Resource
                */
            place: new ResourceWrapper({
                resource: "place",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the Provider Resource
                */
            provider: new ResourceWrapper({
                resource: "provider",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the UserEntity Resource
                */
            userEntity: new ResourceWrapper({
                resource: "userentity",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the Organization Resource
                */
            organization: new ResourceWrapper({
                resource: "organization",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the Material Resource
                */
            material: new ResourceWrapper({
                resource: "material",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the ManufacturedMaterial Resource
                */
            manufacturedMaterial: new ResourceWrapper({
                resource: "manufacturedmaterial",
                api: _hdsi
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the ManufacturedMaterial Resource
                */
            concept: new ResourceWrapper({
                resource: "concept",
                api: _ami
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the ConceptSet Resource
                */
            conceptSet: new ResourceWrapper({
                resource: "conceptset",
                api: _ami
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the ReferenceTerm Resource
                */
            referenceTerm: new ResourceWrapper({
                resource: "referenceterm",
                api: _ami
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the CodeSystem Resource
                */
            codeSystem: new ResourceWrapper({
                resource: "codesystem",
                api: _ami
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the DeviceEntity Resource
                */
            deviceEntity: new ResourceWrapper({
                resource: "deviceentity",
                api: _ami
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Represents the ApplicationEntity Resource
                */
            applicationEntity: new ResourceWrapper({
                resource: "applicationentity",
                api: _ami
            }),
            /**
                * @property {SanteDB.ResourceWrapper} 
                * @memberof SanteDBWrapper.resources
                * @summary Gets the configuration resource
                */
            configuration: new ResourceWrapper({
                resource: "configuration",
                api: _ami
            }),
            /**
                * @property {SanteDB.ResourceWrapper}
                * @memberof SanteDBWrapper.resources
                * @summary Gets the queue control resource
                */
            queue: new ResourceWrapper({
                resource: "queue",
                api: _ami
            }),
            /**
                * @property {SanteDB.ResourceWrapper}
                * @memberof SanteDBWrapper.resources
                * @summary Resource wrapper which interacts with the administrative task scheduler
                */
            task: new ResourceWrapper({
                resource: "task",
                api: _ami
            }),
            /**
                * @property {SanteDB.ResourceWrapper}
                * @memberof SanteDBWrapper.resources
                * @summary A resource wrapper for alerts which are messages between users
                */
            mail: new ResourceWrapper({
                resource: "mail",
                api: _ami
            }),
            /**
                * @property {SanteDB.ResourceWrapper}
                * @memberof SanteDBWrapper.resources
                * @summary A wrapper which is used for fetching user notifications
                **/
            tickle: new ResourceWrapper({
                resource: "notification",
                api: _ami
            }),
            /**
                * @property {SanteDB.ResourceWrapper}
                * @memberof SanteDBWrapper.resources
                * @summary A wrapper for locale information which comes from the server
                */
            locale: new ResourceWrapper({
                resource: "locale",
                api: _app
            })
        };

        // master configuration closure
        var _masterConfig = null;
        var _configuration = {
            /**
             * @method
             * @memberof SanteDBWrapper.configuration
             * @return {Promise}
             * @summary Get a complete list of filter providers asynchronously
             */
            getSubscriptionDefinitionsAsync : function() {
                return _ami.getAsync({
                    resource: "subscriptionDefinition"
                });
            },
            /**
             * @method
             * @memberof SanteDBWrapper.configuration
             * @return {Promise} The data providers
             * @summary Gets a list of data providers available on this offline provider mode
             */
            getDataProvidersAsync: function() {
                return _ami.getAsync({
                    resource: "dbp"
                });
            },
            /**
                * @method
                * @memberof SanteDBWrapper.configuration
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
                                    _masterConfig = d;
                                    if (fulfill) fulfill(_masterConfig);
                                })
                                .catch(function (e) {
                                    if (reject) reject(e);
                                });
                        }
                    }
                    catch (e) {
                        if (reject) reject(e);
                    }
                });
            },

            /**
                * @method
                * @memberof SanteDBWrapper.configuration
                * @summary Get the specified configuration key
                * @returns {string} The application key setting
                * @param {string} key The key of the setting to find
                */
            getAppSetting: function (key) {
                try {
                    if (!_masterConfig) throw new Exception("Exception", "error.invalidOperation", "You need to call configuration.getAsync() before calling getAppSetting()");
                    var _setting = _masterConfig.application.setting.find((k) => k.key === key);
                    if (_setting)
                        return _setting.value;
                    else
                        return null;
                }
                catch (e) {
                    if (!e.$type)
                        throw new Exception("Exception", "error.unknown", e.detail, e);
                    else
                        throw e;
                }
            },

            /**
                * @method 
                * @memberof SanteDBWrapper.configuration
                * @summary Sets the specified application setting
                * @param {string} key The key of the setting to set
                * @param {string} value The value of the application setting
                * @see SanteDB.configuration.save To save the updated configuration
                */
            setAppSetting: function (key, value) {
                try {
                    if (!_masterConfig) throw new Exception("Exception", "error.invalidOperation", "You need to call configuration.getAsync() before calling getAppSetting()");
                    var _setting = _masterConfig.application.setting.find((k) => k.key === key);
                    if (_setting)
                        _setting.value = value;
                    else
                        _masterConfig.application.setting.push({ key: key, value: value });
                }
                catch (e) {
                    if (!e.$type)
                        throw new Exception("Exception", "error.unknown", e.detail, e);
                    else
                        throw e;
                }
            },

            /**
                * @method
                * @memberof SanteDBWrapper.configuration
                * @summary Gets the currently configured realm
                * @returns {string} The name of the security realm
                */
            getRealm: function() {
                try {
                    if (!_masterConfig) throw new Exception("Exception", "error.invalidOperation", "You need to call configuration.getAsync() before calling getAppSetting()");
                    return _masterConfig.realmName;
                }
                catch (e) {
                    if (!e.$type)
                        throw new Exception("Exception", "error.unknown", e.detail, e);
                    else
                        throw e;
                }
            },

            /**
                * @method 
                * @summary Gets the specified section name
                * @memberof SanteDBWrapper.configuration
                * @param {any} name The name of the configuration section
                * @returns {any} A JSON object representing the configuration setting section
                */
            getSection: function(name) {
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
            },

            /**
                * @method
                * @summary Instructs the current system to join a realm
                * @memberof SanteDBWrapper.configuration
                * @returns {Promise} The configuration file after joining the realm
                * @param {any} configData The configuration data for the realm
                * @param {string} configData.domain The domain to which the application is to be joined
                * @param {string} configData.deviceName The name of the device to join as
                * @param {boolean} configData.replaceExisting When true, instructs the application to replace an existing registration
                * @param {boolean} configData.enableTrace When true, enables log file tracing of requests
                * @param {boolean} configData.enableSSL When true, enables HTTPS
                * @param {boolean} configData.noTimeout When true, removes all timeouts from the configuration
                * @param {number} configData.port The port number to connect to the realm on
                * @param {boolean} overwrite Overwrites the existing configuration if needed
                */
            joinRealmAsync: function(configData, overwrite) {
                return new Promise(function (fulfill, reject) {
                    try {
                        _ami.postAsync({
                            resource: "configuration/realm",
                            contentType: 'application/json',
                            data: {
                                realmUri: configData.domain,
                                deviceName: configData.deviceName,
                                enableTrace: configData.enableTrace || false,
                                enableSSL: configData.enableSSL || false,
                                port: configData.port,
                                noTimeout : false,
                                replaceExisting: overwrite || false,
                                client_secret: configData.client_secret,
                                domainSecurity: configData.domainSecurity
                            }
                        }).then(function (d) {
                            _masterConfig = d;
                            if (fulfill) fulfill(d);
                        }).catch(function (e) {
                            console.error(`Error joining realm: ${e}`);
                            if (reject) reject(e);
                        });
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new Exception("Exception", "error.general", e);
                            if (reject) reject(ex);
                    }
                });
            },
            /**
                * @method
                * @memberof SanteDBWrapper.configuration
                * @summary Instructs the application to remove realm configuration
                * @returns {Promise} A promise that is fulfilled when the leave operation succeeds
                */
            leaveRealmAsync: function() {
                return _ami.deleteAsync({
                    resource: "configuration/realm"
                });
            },
            /**
                * @method
                * @memberof SanteDBWrapper.configuration
                * @summary Save the configuration object
                * @param {any} configuration The configuration object to save
                * @returns {Promise} A promise object indicating whether the save was successful
                */
            saveAsync: function (configuration) {
                return _resources.configuration.insertAsync(configuration);
            },
            /**
                * @method
                * @memberof SanteDBWrapper.configuration
                * @summary Gets the user specific preferences
                * @returns {Promise} A promise representing the retrieval of the user settings
                */
            getUserPreferencesAsync: function () {
                return _ami.getAsync({
                    resource: "configuration/user"
                });
            },
            /**
                * @method
                * @memberof SanteDBWrapper.configuration
                * @summary Saves the user preferences
                * @param {any} preferences A dictionary of preferences to be saved
                * @returns {Promise} A promise which indicates when preferences were saved
                * @example Save user preference for color
                * SanteDB.configuration.saveUserPreferences([
                *  { key: "color", value: "red" }
                * ]);
                */
            saveUserPreferencesAsync: function (preferences) {
                return _ami.postAsync({
                    resource: "configuration/user",
                    data: preferences
                });
            }
        };

        // Session and auth data
        var _session = null;
        var _sessionInfo = null;
        var _elevator = null;
        var _authentication = {
            /**
             * @method 
             * @summary Sets the elevator function
             * @param {any} elevator An elevation implementation
             * @param {function():String} elevator.getToken A function to get the current token
             * @param {function(boolean):void} elevator.elevate A function to perform elevation
             * @memberof SanteDBWrapper.authentication
             */
            setElevator: function(elevator){
                _elevator = elevator;
            },
            /**
                * @method
                * @memberof SanteDBWrapper.authentication
                * @returns {any} The oauth session response with an access token, etc.
                * @summary Gets the current session 
                */
            getSession: function () {
                return _session ? {
                    access_token: _session.access_token,
                    expires_in: _session.expires_in
                } : null;
            },
            /**
                * @method
                * @memberof SanteDBWrapper.authentication
                * @returns {Promise} A promise representing the fulfillment or rejection of the get request
                * @summary Gets the extended session information
                */
            getSessionInfoAsync: function () {
                return new Promise(function (fulfill, reject) {
                    if (_sessionInfo)
                        fulfill(_sessionInfo);
                    else
                        try {
                            _auth.getAsync({
                                resource: "session"
                            })
                                .then(function (s) {
                                    _sessionInfo = s;
                                    if(fulfill) fulfill(s);
                                })
                                .catch(function(e) {

                                    if(e.details.status <= 204) {
                                        _sessionInfo = null;
                                        fulfill(null);
                                    }
                                    else if(reject) reject(e);
                                    
                                });
                        }
                        catch (e) {
                            var ex = e;
                            if (!ex.$type)
                                ex = new Exception("Exception", "error.general", e);
                            if (reject) reject(ex);
                        }
                });
            },
            /**
                * @method
                * @memberof SanteDBWrapper.authentication
                * @summary Requests a two-factor authentication secret to be sent
                * @param {string} mode The mode of two-factor authentication (email, sms, etc.)
                * @returns {Promise} A promise representing the outcome of the TFA secret send
                */
            sendTfaSecretAsync: function (mode) {
                return _auth.postAsync({
                    resource: "tfa",
                    data: { mode: mode }
                })
            },
            /**
                * @method
                * @memberof SanteDBWrapper.authentication
                * @summary Retrieves information about the two-factor authentication modes supported by the server
                * @returns {Promise} The promise representing the fulfillment or rejection of the get request
                */
            getTfaModeAsync: function () {
                return _auth.getAsync({
                    resource: "tfa"
                });
            },
            /**
                * @method 
                * @memberof SanteDBWrapper.authentication
                * @summary Performs a OAUTH password login
                * @param {string} userName The name of the user which is logging in
                * @param {string} password The password of the user
                * @param {string} tfaSecret The two-factor secret if provided
                * @param {boolean} noSession When true indicates that there should not be a persistent session (i.e. one time authentication)
                * @param {String} purposeOfUse The identifier of the purpose of use for the access
                * @returns {Promise} A promise representing the login request
                */
            passwordLoginAsync: function (userName, password, tfaSecret, noSession, purposeOfUse) {
                return new Promise(function (fulfill, reject) {
                    try {
                        _auth.postAsync({
                            resource: "authenticate",
                            data: {
                                username: userName,
                                password: password,
                                tfaSecret: tfaSecret,
                                grant_type: 'password',
                                scope: noSession ? "elevate" : "*",
                                purposeOfUse: purposeOfUse
                            },
                            contentType: 'application/x-www-urlform-encoded'
                        })
                            .then(function (d) {
                                if (!noSession) {
                                    _session = d;
                                }
                                if(fulfill) fulfill(d);                                
                            })
                            .catch(reject);
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new Exception("Exception", "error.general", e);
                        if (reject) reject(ex);
                    }
                });
            },
            /**
                * @method 
                * @memberof SanteDBWrapper.authentication
                * @summary Performs a local pin login
                * @param {string} userName The name of the user which is logging in
                * @param {string} password The password of the user
                * @param {string} tfaSecret The two-factor secret if provided
                * @param {boolean} noSession When true indicates that there should not be a persistent session (i.e. one time authentication)
                * @param {String} purposeOfUse The reason the authentication is happening
                * @returns {Promise} A promise representing the login request
                */
            pinLoginAsync: function (userName, pin, noSession, purposeOfUse) {
                return new Promise(function (fulfill, reject) {
                    try {
                        _auth.postAsync({
                            resource: "authenticate",
                            data: {
                                username: userName,
                                pin: pin,
                                grant_type: 'pin',
                                scope: noSession ? "elevate" : "*",
                                purposeOfUse: purposeOfUse
                            },
                            contentType: 'application/x-www-urlform-encoded'
                        })
                            .then(function (d) {
                                if (!noSession) {
                                    _session = d;
                                }
                                if(fulfill) fulfill(d);
                            })
                            .catch(reject);
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new Exception("Exception", "error.general", e);
                        if (reject) reject(ex);
                    }
                });
            },
            /**
                * @method
                * @memberof SanteDBWrapper.authentication
                * @summary Performs an OAUTH client credentials login
                * @description A client credentials login is a login principal which only has an application principal. This is useful for password resets, etc.
                * @returns {Promise} A promise representing the login request
                * @param {boolean} noSession When true, indicates that a session should not be replaced that the request is a one time use token
                */
            clientCredentialLoginAsync: function (noSession) {
                return new Promise(function (fulfill, reject) {
                    try {
                        _auth.postAsync({
                            resource: "authenticate",
                            data: {
                                grant_type: 'client_credentials',
                                scope: "*"
                            },
                            contentType: 'application/x-www-urlform-encoded'
                        })
                            .then(function (d) {
                                if (!noSession) {
                                    _session = d;
                                }
                                if (fulfill) fulfill(d);
                            })
                            .catch(reject);
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new Exception("Exception", "error.general", e);
                            if (reject) reject(ex);
                    }
                });
            },
            /**
                * @method
                * @memberof SanteDBWrapper.authentication
                * @summary Performs an OAUTH authorization code grant
                * @description This function should be called *after* the authorization code has been obtained from the authorization server
                * @param {boolean} noSession When true, indicates that there should not be a persistent session created
                * @returns {Promise} A promise representing the session request
                */
            authorizationCodeLoginAsync: function (code, redirect_uri, noSession) {
                return new Promise(function (fulfill, reject) {
                    try {
                        _auth.postAsync({
                            resource: "authenticate",
                            data: {
                                grant_type: 'authorization_code',
                                code: code,
                                redirect_uri: redirect_uri,
                                scope: "*"
                            },
                            contentType: 'application/x-www-urlform-encoded'
                        })
                            .then(function (d) {
                                if (!noSession) {
                                    _session = d;
                                }
                                if(fulfill) fulfill(d);
                            })
                            .catch(reject);
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new Exception("Exception", "error.general", e);
                            if (reject) reject(ex);
                    }
                });
            },
            /**
                * @method
                * @memberof SanteDBWrapper.authentication
                * @summary Performs a refresh token grant
                * @returns {Promise} A promise representing the session refresh request
                */
            refreshLoginAsync: function () {
                return new Promise(function (fullfill, reject) {
                    try {

                        if (_session) {
                            _auth.postAsync({
                                resource: "authenticate",
                                data: {
                                    grant_type: 'refresh_token',
                                    refresh_token: _session.refresh_token,
                                    scope: "*"
                                },
                                contentType: 'application/x-www-urlform-encoded'
                            })
                                .then(function (d) {
                                    if (!noSession) {
                                        _session = d;
                                        _authentication.getSessionInfoAsync().then(fulfill).catch(reject);
                                    }
                                    if(fulfill) fulfill(d);
                                })
                                .catch(reject);
                        }
                        else {
                            if (reject) reject(new Exception("SecurityException", "error.security", "Cannot refresh a null session"));
                        }
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new Exception("Exception", "error.general", e);
                            if (reject) reject(ex);
                    }
                });
            },
            /**
                * @method
                * @memberof SanteDBWrapper.authentication
                * @summary Sets the password of the currently logged in user
                * @param {string} passwd The password to set the currently logged in user to
                * @returns {Promise} The promise representing the fulfillment or rejection of the password change
                */ 
            setPasswordAsync: function (passwd) {
                if (!_sessionInfo || !_session)
                    throw new Exception("SecurityException", "error.security", "Can only set password with active session");
                return _ami.postAsync({
                    resource: "SecurityUser",
                    data: {
                        passwordOnly: true,
                        entity: new SecurityUser({
                            userName: _sessionInfo.securityUser.userName,
                            password: passwd
                        })
                    }
                });
            },
            /**
                * @method
                * @memberof SanteDBWrapper.authentication
                * @summary Abandons the current SanteDB session
                * @returns {Promise} The promise representing the fulfillment or rejection of the logout request
                */
            logoutAsync: function () {
                return new Promise(function (fulfill, reject) {
                    if (!_session) {
                        if (reject) reject(new Exception("SecurityException", "error.security", "Cannot logout of non-existant session"));
                    }
                    try {
                        _auth.deleteAsync({
                            resource: "session"
                        })
                            .then(function (d) {
                                _session = null;
                                _sessionInfo = null;
                                if (fulfill) fulfill(d);
                            })
                            .catch(reject);
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new Exception("Exception", "error.general", e);
                        if(reject) reject(ex);
                    }
                });
            }
        };

        // Provides localization support functions
        var _localeCache = {};
        var _localization = {
            /**
                * @summary Gets a string from the current user interface localization
                * @memberof SanteDBWrapper.localiztion
                * @method
                * @param {string} stringId The id of the localization string to get
                * @returns {string} The localized string
                */
            getString: function (stringId) {
                try {
                    var retVal = __SanteDBAppService.GetString(stringId);
                    return retVal || stringId;
                }
                catch (e) {
                    console.error(e);
                    return stringId;
                }
            },
            /**
                * @summary Get the currently configured locale
                * @memberof SanteDBWrapper.localization
                * @method
                * @return {string} The ISO language code and country code of the application
                */
            getLocale: function () {
                var retVal = __SanteDBAppService.GetLocale();
                return retVal;
            },
            /**
                * @summary Get the currently configured language
                * @memberof SanteDBWrapper.localization
                * @method
                * @return {string} The ISO language code
                */
            getLanguage: function () {
                return __SanteDBAppService.GetLocale().substr(0, 2);
            },
            /**
                * @summary Get the currently configured country code
                * @memberof SanteDBWrapper.localization
                * @method
                * @return {string} The 2 digit ISO country code
                */
            getCountry: function () {
                return __SanteDBAppService.GetLocale().substr(4, 2);
            },
            /**
                * @summary Set the current locale of the application
                * @memberof SanteDBWrapper.localization
                * @method
                * @param {string} locale The ISO locale (i.e. en-US, en-CA, sw-TZ to set)
                */
            setLocale: function (locale) {
                return __SanteDBAppService.SetLocale(locale);
            },
            /**
                * @summary Get localization format information for the specified locale
                * @memberof SanteDBWrapper.localization
                * @method
                * @param {string} locale The locale for which the format information should be retrieved
                * @returns {Promise} The promise representing the operation to fetch locale
                * @description The localization information contains formatting for currency, formatting for dates, and formatting for numbers
                */
            getFormatInformationAsync: function (locale) {
                return new Promise(function (reject, fulfill) {
                    try {
                        if (_localeCache[locale])
                            fulfill(_localeCache[locale]);
                        else {
                            _resources.locale.getAsync(locale)
                                .then(function (d) {
                                    _localeCache[locale] = d;
                                    if(fulfill) fulfill(d);
                                })
                                .catch(reject);
                        }
                    }
                    catch (e) {
                        var ex = e;
                        if (!ex.$type)
                            ex = new Exception("LocalizationException", "error.general", e);
                        if(reject) reject(ex);
                    }
                });
            },

        }

        // Public bindings
        this.api = {
            /**
            * @type {APIWrapper}
            * @summary Represents a property which wraps the HDSI interface
            * @memberof SanteDBWrapper
            */
            hdsi : _hdsi,
            /**
            * @type {APIWrapper}
            * @memberof SanteDBWrapper
            * @summary Represents a property which communicates with the AMI
            */
            ami : _ami,
            /**
                * @type {APIWrapper}
                * @memberof SanteDBWrapper
                * @summary Represents a property which communicates with the AUTH service
                */
            auth : _auth
        };

        /**
         * @property 
         * @memberof SanteDBWrapper
         * @summary Provide access to localization data
         */
        this.locale = _localization;
        /**
            * @property
            * @memberof SanteDBWrapper
            * @summary Provides access to resource handlers
            */
        this.resources = _resources;
        /**
            * @summary Configuration routines for SanteDB
            * @class
            * @static
            * @memberof SanteDBWrapper
            */
        this.configuration = _configuration;
        /**
            * @summary Authentication functions for SanteDB
            * @class
            * @static
            * @memberof SanteDBWrapper
            */
        this.authentication = _authentication;

        /**
         * @summary Application functions for SanteDB
         * @class
         * @static
         * @memberof SanteDBWrapper
         */
        this.application = _application;

        // Application magic 
        var _magic = null;

        // Setup JQuery to send up authentication and cookies!
        $.ajaxSetup({
            cache: false,
            beforeSend: function (data, settings) {
                if (_elevator  && _elevator.getToken()) {
                    data.setRequestHeader("Authorization", "BEARER " +
                        _elevator.getToken());
                }
                if (!_magic)
                    _magic = __SanteDBAppService.GetMagic();
                data.setRequestHeader("X-SdbMagic", _magic);
            },
            converters: {
                "text json": function (data) {
                    return $.parseJSON(data, true);
                }
            }
        });

        // Handles error conditions related to expiration of tokens and to authentication problems
        $(document).ajaxError(function (e, data, setting, err) {
            if ((data.status == 401 || data.status == 403)) {
                if (_session && _session.exp > Date.now // User has a session that is valid, but is still 401 hmm... elevation!!!
                    && _elevator
                    && !_elevator.getToken() ||
                    _session == null && _elevator) {

                        // Was the response a security policy exception where the back end is asking for elevation on the same user account?
                        if(data.responseJSON &&
                            data.responseJSON.type == "SecurityPolicyException" &&
                            data.responseJSON.message == "error.elevate")
                            _elevator.elevate(_session);
                        else
                            _elevator.elevate(null);
                }
            }
            else
                console.warn(new Exception("Exception", "error.general", err, null));
        });
    };

if(!SanteDB) 
    var SanteDB = new SanteDBWrapper();


SanteDB.resources.mail
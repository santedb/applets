// ^(\w+)((?:\[\w+\|?[\w\|]+?)\]|(?:@\w+)|\??\.?)(.*)$
// Read capture group 
// Last capture group is the next statement to be processed

angular.module('santedb-lib')


    /**
     * @method tagInput
     * @memberof Angular
     * @summary Creates a tagged input
     */
    .directive("hdsiExpression", function () {


        function closeAllLists(except) {
            $(".hdsi-autocomplete-items").each((i, o) => {
                $(o).remove();
            });
        }
        function addActive(ele, currentFocus) {
            /*a function to classify an item as "active":*/
            if (!ele) return false;
            /*start by removing the "active" class on all items:*/
            removeActive(ele);
            if (currentFocus >= ele.length) currentFocus = 0;
            if (currentFocus < 0) currentFocus = (ele.length - 1);
            /*add class "autocomplete-active":*/
            $(ele[currentFocus]).addClass("hdsi-autocomplete-active");
            ele[currentFocus].scrollIntoView();
            return currentFocus;
        }
        function removeActive(ele) {
            /*a function to remove the "active" class from all autocomplete items:*/
            $(ele).removeClass("hdsi-autocomplete-active");
        }

        return {
            require: 'ngModel',
            restrict: 'E',
            replace: true,
            templateUrl: './org.santedb.uicore/directives/hdsiEditor.html',
            scope: {
                focalType: "<", // The type to provide HDSI expression auto-complete data for
                defVariables: "<", // Any variables (triggered by $) to show autocomplete data for
                includeRhs: "<", // The expression should include the right hand side
                simpleInput: "<" // The value in ng-model is a simple string variable
            },
            link: function (scope, element, attrs, ngModel) {


                var tokens = scope.includeRhs ? /^.*[\[\|\.\?\@\=\$\:\()]$/i : /^.*[\[\|\.\?\@\$\:\()]$/i;
                var filterExtract = scope.includeRhs ? /^(.*[\[\]\|\.\?\@\=\$\:\()])(.*)$/i : /^(.*[\[\]\|\.\?\@\$\:\()])(.*)$/i;

                var autoCompleteData = null;
                var currentFocus = -1;

                var input = $('input', element);
                // when input is pressed
                input.on('input', async (o) => {
                    var val = $(o.currentTarget).val().substring(0, o.currentTarget.selectionStart);
                    closeAllLists();

                    // Create a DIV for the auto-complete
                    var divElement = document.createElement("div");
                    divElement.setAttribute("class", "hdsi-autocomplete-items");
                    $(element).append(divElement);


                    var scopedFilter = val.match(filterExtract);


                    if (autoCompleteData == null || scopedFilter && scopedFilter[1] != autoCompleteData.scope || val == "") {
                        autoCompleteData = {};
                        autoCompleteData = await SanteDB.resources[scope.focalType.toCamelCase()].invokeOperationAsync(null, "schema-complete", { expression: val, vars: scope.defVariables });
                        autoCompleteData.scope = scopedFilter ? scopedFilter[1] : '';
                        currentFocus = -1;
                    }
                    val = scopedFilter ? scopedFilter[2] : val;

                    // Auto-complete data is a type or array?
                    if (Array.isArray(autoCompleteData)) {
                        // Emit the properties
                        autoCompleteData.forEach((p) => {
                            if (p.startsWith(val)) {
                                var itemElement = document.createElement("div");
                                itemElement.setAttribute("class", "hdsi-autocomplete-item");
                                itemElement.setAttribute("data-value", p);

                                $(itemElement).html(`<i class="fas fa-circle"></i> <strong>${p.substring(0, val.length)}</strong>${p.substring(val.length)}`);
                                $(divElement).append(itemElement);
                            }
                        })
                    }
                    else if (autoCompleteData.classifierType) {
                        var autoData = autoCompleteData.classifierValues;
                        if (!autoData) {
                            if (autoCompleteData.classifierType == "AssigningAuthority") {
                                autoData = (await SanteDB.resources.assigningAuthority.findAsync({ "domainName": `~${val}%` })).resource.map(o => {
                                    return {
                                        val: o.domainName,
                                        text: o.name
                                    }
                                });
                            }
                            else if (autoCompleteData.classifierType == "ExtensionType") {
                                autoData = (await SanteDB.resources.extensionType.findAsync({ "name": `~${val}%` })).resource.map(o => {
                                    return {
                                        val: o.name
                                    }
                                });
                            }
                            else {
                                autoData = (await SanteDB.resources.concept.findAsync({ "mnemonic": `~${val}*` })).resource.map(o => { val: o.mnemonic });
                            }
                        }
                        // Emit the properties
                        autoData.forEach((p) => {
                            if (p.val.startsWith(val)) {
                                var itemElement = document.createElement("div");
                                itemElement.setAttribute("class", "hdsi-autocomplete-item");
                                itemElement.setAttribute("data-value", p.val);
                                $(itemElement).html(`<i class="fas fa-search"></i> <strong>${p.val.substring(0, val.length)}</strong>${p.val.substring(val.length)} <small class="text-muted">${p.text || ''}</small>`);
                                $(divElement).append(itemElement);
                            }
                        })
                    }
                    else if (autoCompleteData.properties) {
                        // Emit the properties
                        autoCompleteData.properties.forEach((p) => {
                            if (p.name.startsWith(val)) {
                                var itemElement = document.createElement("div");
                                itemElement.setAttribute("data-value", p.name);
                                itemElement.setAttribute("class", "hdsi-autocomplete-item");
                                $(itemElement).html(`<i class="fas fa-code"></i> <strong>${p.name.substring(0, val.length)}</strong>${p.name.substring(val.length)} <small class="badge badge-secondary">${p.type}</small> <small class="text-subtle">${p.documentation || ''}</small>`);
                                $(divElement).append(itemElement);
                            }
                        })
                    }

                    $("div.hdsi-autocomplete-item").on("click", (o) => {
                        var value = $(o.currentTarget).attr("data-value");
                        var newExpressionPre = $(input).val(), newExpressionPost = '';
                        if(input[0].selectionStart) {
                            newExpressionPre = $(input).val().substring(0, input[0].selectionStart);
                            newExpressionPost = $(input).val().substring(input[0].selectionStart);
                        }
                        var expressionMatch = newExpressionPre.match(filterExtract), 
                            postExpressionMatch = newExpressionPost.match(/^(.*?([\[\]\|\.\?\@\$\:\()]))(.*)$/i);
                        if (expressionMatch) { // value 
                            value = `${expressionMatch[1]}${value}`;
                            if(postExpressionMatch) {
                                value += `${postExpressionMatch[2]}${postExpressionMatch[3]}`;
                            }
                        }
                        else {
                            value = `${value}${newExpressionPost}`;
                        }
                        $(input).val(value);

                        closeAllLists();
                        currentFocus = -1;
                        $(input).focus();
                    });
                });

                input.on('blur', (o) => {

                    var newExpression = $(input).val();
                    var propertyName = newExpression.match(filterExtract);

                    if (!propertyName) {
                        propertyName = newExpression;
                    }
                    else {
                        propertyName = propertyName[2];
                    }

                    scope.$apply(() => {
                        ngModel.$setValidity('hdsiProperty', true);
                        ngModel.$setValidity('hdsiNeedsRhs', true);

                        var property = autoCompleteData.properties.find(o => o.name == propertyName);
                        if(propertyName == "") {
                            if (scope.simpleInput) {
                                ngModel.$setViewValue(newExpression);
                            }
                            else {
                                ngModel.$setViewValue({
                                    expression: newExpression
                                });
                            }
                            closeAllLists();
                            currentFocus = -1;
                        }
                        else if (!property && newExpression.indexOf('=') == -1 && !scope.includeRhs) {
                            ngModel.$setValidity('hdsiProperty', false);
                        }
                        else if (newExpression.indexOf('=') == -1 && scope.includeRhs) {
                            ngModel.$setValidity('hdsiNeedsRhs', false);
                        }
                        else {

                            if (scope.simpleInput) {
                                ngModel.$setViewValue(newExpression);
                            }
                            else {
                                ngModel.$setViewValue({
                                    expression: newExpression,
                                    type: propertyName == "id" ? autoCompleteData.type : property.type,
                                    values: property.values
                                });
                            }
                            closeAllLists();
                            currentFocus = -1;
                        }

                        
                    });
                });
                input.on('keydown', (e) => {

                    var ele = $('div.hdsi-autocomplete-item');
                    if (e.keyCode == 40) {
                        /*If the arrow DOWN key is pressed,
                        increase the currentFocus variable:*/
                        currentFocus++;
                        /*and and make the current item more visible:*/
                        currentFocus = addActive(ele, currentFocus);
                    } else if (e.keyCode == 38) { //up
                        /*If the arrow UP key is pressed,
                        decrease the currentFocus variable:*/
                        currentFocus--;
                        /*and and make the current item more visible:*/
                        currentFocus = addActive(ele, currentFocus);
                    } else if (e.keyCode == 13 || e.keyCode == 9) {
                        if (currentFocus > -1) {
                            e.preventDefault();
                            /*and simulate a click on the "active" item:*/
                            if (ele) ele[currentFocus].click();
                        }
                    }
                });


                ngModel.$render = function () {
                    var viewValue = ngModel.$viewValue;

                    if (viewValue) {
                        if (viewValue.expression) {
                            $(input).val(viewValue.expression);
                        }
                        else {
                            $(input).val(viewValue);
                        }
                    }
                };
            }
        }
    })
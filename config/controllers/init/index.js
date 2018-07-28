/// <reference path="../../../core/js/santedb.js"/>

angular.module('santedb').controller('InitialSettingsController', ['$scope', '$rootScope', function($scope, $rootScope) {

    // Reference data
    $scope.reference = {
        places: []
    };

    // Get configuration from the server
    SanteDB.configuration.getAsync().then(function(config) {
        $scope.config = config;
        $scope.config.security.port = 8080;
        $scope.config.network.useProxy = $scope.config.network.proxyAddress != null;
        $scope.config.network.optimize = "gzip";
        $scope.config.sync.mode = "sync";
        $scope.config.log.mode = $scope.config.log.trace[0].filter || "Warning";
        $scope.config.sync.subscribe = [];
        $scope.config.data = {
            provider: "sqlite"
        };

        var configuredHasher =  $scope.config.application.service.find(function(e) { return e.indexOf('PasswordHasher') > -1 });
        if(configuredHasher) {
            configuredHasher = configuredHasher.replace("SanteDB.DisconnectedClient.Xamarin.Security.", "");
            configuredHasher = configuredHasher.substr(0, configuredHasher.indexOf(","));
            $scope.config.security.hasher = configuredHasher;
        }
        else
            $scope.config.security.hasher = "SHA256PasswordHasher";
    
        $scope.config.security.offline = { enable: true };
        $scope.$apply();
    }).catch($rootScope.errorHandler);

    // Get subscription reference
    SanteDB.configuration.getSubscriptionDefinitionsAsync().then(function(d) {
        $scope.reference.subscriptions = d;
    }).catch($rootScope.errorHandler);

    // Watch for change in data provider
    $scope.$watch('config.data.provider', function (n, o) {
        if(n && $scope.reference.dataProviders) 
            $scope.reference.providerData = $scope.reference.dataProviders.find(function(o) { return o.invariant == n});
    });

    // Watch scope and refresh list of subscriptions
    $scope.$watch('config.sync.subscribe.length', function(n, o) {
        // Find in new
        if(n)
            n.foreach(function(sid) {
                var existingInfo = $scope.referece.places.find(function(p) { return p.id === sid});
                if(!existingInfo)
                    SanteDB.resources.place.getAsync(sid).then(function(placeInfo) {
                        $scope.reference.places.push(placeInfo);
                        try {
                            $scope.$apply(); // Apply scope to refresh the check guard conditions
                        }
                        catch(e) {}
                    });
            });
    });

    // Verifies that a guard condition on a filter passes
    $scope.checkGuard = function(filter) {
        var retVal = true;
        $scope.reference.places.forEach(function(subscribed) {
             retVal &= eval(filter.guard); 
        });
        return retVal
    }

    // Get data providers asynchronously
    SanteDB.configuration.getDataProvidersAsync().then(function(d) {
        $scope.reference.dataProviders = d;
        if($scope.config.data.provider)
            $scope.reference.providerData = $scope.reference.dataProviders.find(function(o) { return o.invariant == $scope.config.data.provider });
    }).catch($rootScope.errorHandler);
}]);
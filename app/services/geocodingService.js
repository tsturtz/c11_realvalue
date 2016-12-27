/**
 * Created by danh on 12/14/16.
 */
angular.module('realValue')
    .service('geoCodingService', function ($q, $http) {

        var self = this;
        /**
         *  This is our Angular service that uses the HTTP (AJAX) call to our proxy PHP script for google's geocoding API
         * @param param
         * @returns {Promise}
         */
        this.getAPI = function(param) {
            //console.log("param ",param);
            var deferred = $q.defer();

            //TODO fixed this for uploading to github/server
            $http.get("https://realvalue.io/prototypes/geocoding_get.php?s="+param)
                .then(function(response) {
                    //console.log(response);
                    deferred.resolve(response);
                });

            return deferred.promise;
        }
    });
angular.module('realValue')

    .controller("mapController", [ '$scope', '$http', 'leafletData', 'leafletMapEvents', 'checkboxService','dataService','$mdDialog', '$q', '$mdToast', 'geoCodingService', '$compile', '$timeout', function($scope, $http, leafletData, leafletMapEvents, checkboxService,dataService, $mdDialog, $q, $mdToast, geoCodingService, $compile, $timeout) {
        var mc = this;
        mc.varMap;
        //mc.gjLayer;

        setTimeout(function(){ leafletData.getMap().then(function(map) {
            mc.varMap = map;
            ////console.log("resize");
            // This code helps the map not get sized before it is finish loading
            map.invalidateSize(false);
            // This code below removes the zoom control that's present on the map
            map.removeControl(map.zoomControl);
            map.options.minZoom = 9;
        });
        }, 400);

        $scope.$on("leafletDirectiveMarker.move", function(event, args){
            var leafEvent = args.leafletEvent;
            ////console.log("event", leafEvent);
            $timeout(function(){
                var restaurantContainer = $('.icon-restaurant-class');
                var restaurantIcon = $("<md-button class='md-fab md-accent md-mini icon-restaurant-class'><md-icon md-font-set='material-icons'>restaurant</md-icon></md-button>");
                restaurantContainer.html('');
                restaurantContainer.append($compile(restaurantIcon)($scope));
                var schoolContainer = $('.icon-school-class');
                var schoolIcon = $("<md-button class='md-fab md-accent md-mini icon-school-class'><md-icon md-font-set='material-icons'>school</md-icon></md-button>");
                schoolContainer.html('');
                schoolContainer.append($compile(schoolIcon)($scope));
                $scope.$apply();
            });
        });

        var divIcon = {
            type: 'div',
            iconSize: [40, 40],
            popupAnchor:  [0, 0],
            html: "<div class='icon-restaurant-class'></div>"
        };

        var schoolIcon = {
            type: 'div',
            iconSize: [40, 40],
            popupAnchor:  [0, 0],
            html: "<div class='icon-restaurant-class'></div>"
        };

        ////console.log("icon ", divIcon);
        mc.gjLayer = L.geoJson(tammy_geojson, {
            style: style
        });

        dataService.weikuan_init();
        //console.log("init map");

        // fixed issue when map is shown after the map container has been resized by css
        // http://stackoverflow.com/questions/24412325/resizing-a-leaflet-map-on-container-resize
        $scope.$on('leafletDirectiveMarker.click', function(e, args) {

            //console.log("model",args);

            // places dialog
            $mdDialog.show({
                controller: detailsCtrl,
                controllerAs: 'dc',
                templateUrl: './app/dialogs/details.html',
                parent: angular.element(document.body),
                clickOutsideToClose: true,
                escapeToClose: true,
                fullscreen: true,
                targetEvent: null, // weird angular material bug - this should be 'e' but for some reason it throws an error. setting targetEvent to null is a fix. refer to https://github.com/angular/material/issues/5363
                onComplete: afterShowAnimation
            });

            // focus after dialog
            function afterShowAnimation(scope, element, options) {
                //console.log('after focus');
            }

            // dialog controller
            function detailsCtrl($mdDialog) {
                var deets = this;

                this.cancel = function () {
                    $mdDialog.hide();
                };

                deets.remaining = 0;

                this.starsRemaining = function(remaining) {
                    return new Array(remaining);
                };

                this.starRange = function(stars) {
                    deets.remaining = 5 - stars;
                    return new Array(stars);
                };

                this.getPlaceDetails = function () {
                    // google places API call
                    this.callPlace = function(key) {

                        this.service = new google.maps.places.PlacesService($('#data-here').get(0));

                        ////console.log('args', args.model);
                        //console.log('passed in key: ', key);

                        if (key) {
                            this.service.getDetails({
                                placeId: key // key is passed in place ID. Here's a real place id for testing: 'ChIJl_N4tlno3IARWDJLc0k1zX0'
                            }, function(place){
                                //console.log('%c actual place ID call: ', 'background: green; color: white; display: block;', place);
                                //console.log('just before placeObj definition: ', args.model);
                                deets.placeObj = {
                                    type : place.types[0],
                                    icon :
                                        (args.model["Place Type"] === "airport") ? 'local_airport' :
                                        (args.model["Place Type"] === "bar") ? 'local_bar' :
                                        (args.model["Place Type"] === "gas") ? 'gas_station' :
                                        (args.model["Place Type"] === "gym") ? 'fitness_center' :
                                        (args.model["Place Type"] === "hospital") ? 'local_hospital' :
                                        (args.model["Place Type"] === "library") ? 'local_library' :
                                        (args.model["Place Type"] === "park") ? 'nature_people' :
                                        (args.model["Place Type"] === "restaurant") ? 'restaurant' :
                                        (args.model["Place Type"] === "school") ? 'school' :
                                        (args.model["Place Type"] === "university") ? 'school' :
                                        'place',
                                    name : place.name,
                                    address : place.formatted_address,
                                    phone : place.formatted_phone_number,
                                    openNow : (place.hasOwnProperty('opening_hours')) ? place.opening_hours.open_now : false, // boolean
                                    hours : (place.hasOwnProperty('opening_hours')) ? place.opening_hours.weekday_text : ['Store hours unavailable'], // all days array
                                    photos : place.photos, // all photos array
                                    reviews : place.reviews // all reviews array
                                };
                            });
                        } else {
                            //console.warn('you didn\'t pass in a place id');
                        }
                    };
                    //console.log(args.model);
                    this.callPlace(args.model['Place ID']); // passed in place ID from event args
                };
                this.getPlaceDetails();
            }
        });

        this.county_zoom = function() {
            mc.zipLayer = false;
            mc.cityLayer = false;
            mc.countyLayer = true;
            //console.log("extend county");
            angular.extend($scope, {
                center: {
                    lat: 33.8247936182649,
                    lng: -118.03985595703125
                    //zoom: 8
                },
                tiles: {
                    //url: "http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
                    url: "https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png",
                    options: {
                        //attribution: ''
                    }
                },
                geojson : {
                    data: [county_los_angeles,county_orange],
                    style: county_style,
                    onEachFeature: function (feature, layer) {
                        // fixed issue with referencing layer inside our reset Highlight function
                        ////console.log("layer",layer);
                        //layer.bindPopup(feature.properties.popupContent);

                        layer.on({
                            mouseover: highlightFeature,
                            mouseout: resetHighlight,
                            click: zoomToFeature
                        });
                    }
                }
            });
        };

        this.city_zoom = function(zoom) {
            mc.countyLayer = false;
            mc.zipLayer = false;
            mc.cityLayer = true;
            //console.log("extend city");
            angular.extend($scope, {
                center: {
                    lat: 33.8247936182649,
                    lng: -118.03985595703125,
                    zoom: zoom
                },
                defaults: {
                    zoomAnimation: true
                },
                legend: {
                    position: 'bottomright',
                    colors: [ '#1a9850', '#a6d96a', '#ffffbf', '#fdae61','#d73027', '#888888' ],
                    labels: [ 'Best', 'Good', 'Average', 'Bad', 'Worst', 'No Data']
                },
                maxbounds: {
                    southWest: {
                        lat:32.98,
                        lng: -116.011
                    },
                    northEast: {
                        lat:35.32,
                        lng:-120.324
                    }

                },
                tiles: {
                    url: "https://stamen-tiles-{s}.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png",
                    options: {
                        //attribution: 'All maps &copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, map data &copy; <a href="http://www.openstreetmap.org">OpenStreetMap</a> (<a href="http://www.openstreetmap.org/copyright">ODbL</a>'
                    }
                },
                controls: {},
                layers: {
                    overlays: {
                        restaurant: {
                            name: 'restaurant',
                            type: 'markercluster',
                            visible: true,
                            layerOptions: {
                                showCoverageOnHover: false,
                                disableClusteringAtZoom: 17
                            }
                        }
                    }
                },
                geojson : {
                    data: [cities],
                    style: style,
                    onEachFeature: function (feature, layer) {

                        layer.on({
                            mouseover: highlightFeature,
                            mouseout: resetHighlight,
                            click: zoomToFeature
                        });
                    }
                }
            });
        };

        function roughSizeOfObject( object ) {
            var objectList = [];
            var recurse = function( value ) {
                var bytes = 0;

                if ( typeof value === 'boolean' ) {
                    bytes = 4;
                } else if ( typeof value === 'string' ) {
                    bytes = value.length * 2;
                } else if ( typeof value === 'number' ) {
                    bytes = 8;
                } else if (typeof value === 'object'
                    && objectList.indexOf( value ) === -1) {
                    objectList[ objectList.length ] = value;
                    for( i in value ) {
                        bytes+= 8; // assumed existence overhead
                        bytes+= recurse( value[i] )
                    }
                }
                return bytes;
            };
            return recurse( object );
        }

        this.zipcode_zoom = function(param) {
            mc.countyLayer = false;
            mc.cityLayer = false;
            mc.zipLayer = true;
            //console.log("extend zip");
            if(mc.varMap === undefined) {
                var varcenter = {
                    lat: 34.138,
                    lng: -118.296,
                    zoom: param
                }
            }
            ////console.log("center", varMap.getCenter());
            angular.extend($scope, {
                center: varcenter,
                geojson : {
                    data: [ tammy_geojson,
                            losangeles_geojson
                            ],
                    style: style,
                    onEachFeature: function (feature, layer) {
                        mc.ziphighlight = layer;
                        layer.on({
                            mouseover: highlightFeature,
                            mouseout: resetHighlight,
                            click: zoomToFeature
                        });
                    }
                }
            });
        };

        mc.city_zoom(9);
        mc.zipcode_zoom(9);

        angular.extend($scope, {
            progress: true
        });
        dataService.init_promise().then(function(response){
            angular.extend($scope, {
                progress: false
            });
        });

        this.markers_zoom = function() {
            //console.log("clear marker");

            angular.extend($scope, {
                markers: {}
            });
        };

        this.zoom_out = function() {
            ////console.log("zoom out");
            ////console.log(varMap.getZoom());
            var center = {
                lat: mc.varMap.getCenter().lat,
                lng: mc.varMap.getCenter().lng,
                zoom: mc.varMap.getZoom() - 1
            };

            angular.extend($scope, {
                center: center
            });
        };

        this.zoom_in = function() {
            ////console.log("zoom in");
            ////console.log(varMap.getZoom());
            var center = {
                lat: mc.varMap.getCenter().lat,
                lng: mc.varMap.getCenter().lng,
                zoom: mc.varMap.getZoom() + 1
            };

            angular.extend($scope, {
                center: center
            });
        };

        /**
         *  This function looks up zip codes that people type and finds the associated polygon.  There's a bug where
         *  a zipcode that's a mulit-polygon where it will not return a correct result (ie. 92705)
         * @param zip
         */
        this.submit_zoom = function(zip) {
            var calculated_center;
            var match = false;
            ////console.log("zoomed on: ", zip);
            if (zip != undefined) {
                ////console.log("zooming");
                var city = dataService.find_city_based_on_zip_code(zip);
                ////console.log("zooming on ", city);
                ////console.log("zip is ", zip);

                for(var i = 0; i<tammy_geojson.features.length;i++) {
                    //searchObj(tammy_geojson.features[i]);
                    ////console.log(tammy_geojson.features[i]);
                    if(tammy_geojson.features[i].properties.name === zip) {
                        //console.log("match!!!");
                        ////console.log(tammy_geojson.features[i]);
                        calculated_center = this.findCenterFromCoordinatesArray(tammy_geojson.features[i].geometry.coordinates[0]);
                        //match = true;
                    }
                }

                if(match) {
                    //console.log(calculated_center);
                    var center = {
                        lat: calculated_center.x,
                        lng: calculated_center.y,
                        zoom: 13
                    };

                    if(city.length) {
                        angular.extend($scope, {
                            center: center
                        });
                    }

                    //console.log(mc.ziphighlight);
                    mc.ziphighlight.setStyle({
                        weight: 5,
                        color: '#666',
                        dashArray: '',
                        fillOpacity: 0.7
                    });
                } else {

                    geoCodingService.getAPI(zip).then(function(response){
                        ////console.log("response",response);

                        if(response.data.results.length){
                            var components = response.data.results[0].address_components;
                            var matched_state;
                            var matched_county;
                            var postal_code;
                            for(var i =0;i<components.length;i++){
                                ////console.log(components[i]);
                                if(components[i].types[0] === 'postal_code') {
                                    postal_code = true;
                                }
                                if(components[i].short_name === 'CA') {
                                    //console.log("match state!");
                                    matched_state = components[i].short_name;
                                }
                                if(components[i].short_name === 'Orange County' || components[i].short_name === 'Los Angeles County') {
                                    //console.log("match county!");
                                    matched_county = components[i].short_name;
                                }
                            }
                            var boundsObj = response.data.results[0].geometry.bounds;
                            var southWest = L.latLng(boundsObj.southwest.lat, boundsObj.southwest.lng);
                            var northEast = L.latLng(boundsObj.northeast.lat, boundsObj.northeast.lng);

                            var bounds = L.latLngBounds(southWest, northEast);

                            //console.log("matched state", matched_state);
                            //console.log("matched county", matched_county);
                            //console.log("postal search", postal_code);
                            if(matched_state === 'CA' && (matched_county === 'Orange County' || matched_county === 'Los Angeles County')) {
                                var geocoding = response.data.results[0].geometry.location;
                                mc.centerToCoordinates(geocoding,bounds,postal_code);
                            } else {
                                // Results not in LA or OC
                                mc.showToastyToast('Sorry, please search in Orange or Los Angeles County.');
                            }
                        } else {
                            //No results at all
                            mc.showSimpleToast();
                        }

                    });
                }
            mc.zip = ''; // resets input field
            }
        };

        this.centerToCoordinates = function(obj,bounds,boolean) {
            //console.log("coords",obj);
            var center = {
                lat: obj.lat,
                lng: obj.lng,
                zoom: mc.varMap.getZoom()
            };

            angular.extend($scope, {
                center: center
            });

            mc.varMap.fitBounds(bounds,{padding: [150, 150]});

            if(boolean) {
                this.zipcode_zoom();
            }
        };

        this.findMinMaxNumber = function(arr) {
            var l = arr.length;
            var max = -Infinity;
            var min = Infinity;
            var i;
            for (i = 0; l > i; i++) {
                if (arr[i] > max) {
                    max = arr[i];
                }
                if (arr[i] < min) {
                    min = arr[i];
                }
            }

            return {
                min: min,
                max: max
            };
        };

        this.findCenterFromCoordinatesArray = function(array) {

            var array_x = [];
            var array_y = [];
            for(var i=0;i<array.length;i++){
                array_x.push(array[i][1]);
                array_y.push(array[i][0]);
            }
            // //console.log(array_x);
            // //console.log(array_y);
            var maxmin_x = this.findMinMaxNumber(array_x);
            var maxmin_y = this.findMinMaxNumber(array_y);

            ////console.log(maxmin_x);
            ////console.log(maxmin_y);
            var center_x = maxmin_x.min + ((maxmin_x.max - maxmin_x.min) / 2);
            var center_y = maxmin_y.min + ((maxmin_y.max - maxmin_y.min) / 2);

            return {
                x:center_x,
                y:center_y
            };
            ////console.log(center_x);
            ////console.log(center_y);
        };


        function searchObj (obj, query) {

            for (var key in obj) {
                var value = obj[key];
                if (typeof value === 'object') {
                    searchObj(value, query);
                }

                if (value === query) {
                    //console.log('property=' + key + ' value=' + value);
                }

            }

        }

        function highlightFeature(e) {

            var layer = e.target;
            var zip_code_name = e.target.feature.properties.name;
            var zip_code_city_name = e.target.feature.properties.city;
            var county_name = e.target.feature.properties.county;
            var zip_code_score = e.target.feature.properties.score;
            var zip_code_crimes = e.target.feature.properties.crimes;
            var zip_code_jobs = e.target.feature.properties.jobs;
            var zip_code_crimes_zscore = e.target.feature.properties.crime_zscore;
            var zip_code_jobs_zscore = e.target.feature.properties.job_zscore;
            var zip_code_housing = e.target.feature.properties.housing;
            var zip_code_house_zscore = e.target.feature.properties.house_zscore;


            layer.setStyle({
                weight: 3,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.7
            });

            if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
                layer.bringToFront();
            }
            ////console.log(e.target.feature.properties.name);
            mc.information = {
                name: zip_code_name,
                city: zip_code_city_name,
                county: county_name,
                score: zip_code_score,
                crimes: zip_code_crimes,
                jobs: zip_code_jobs,
                jobs_zscore: zip_code_jobs_zscore,
                crimes_zscore: zip_code_crimes_zscore,
                house_zscore: zip_code_house_zscore,
                housing: zip_code_housing
            };

            ////console.info("info ", mc.information);
            //info.update(layer.feature.properties);
        }

        function resetHighlight(e) {
            /* had to custom edit this for angular from interactive choropleth example */
            ////console.log(e);
            var layer = e.target;
            layer.setStyle({
                weight: 1,
                opacity: 1,
                color: 'white',
                dashArray: ''
            });
        }

        // share method between controllers through obj prototypical inheritance
        $scope.openSidenav = {};

        function InitChart(barData,id) {
            mc.showSVG = true;
            $(".pre-visualisation").empty();
            $(id).empty();
            $("#pre-data").empty();
            var vis = d3.select(id),
                WIDTH = 250,
                HEIGHT = 250,
                MARGINS = {
                    top: 20,
                    right: 0,
                    bottom: 20,
                    left: 45
                },
                xRange = d3.scale.ordinal().rangeRoundBands([MARGINS.left, WIDTH - MARGINS.right], 0.1).domain(barData.map(function (d) {
                    return d.x;
                })),

                yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([0,
                    d3.max(barData, function (d) {
                        return d.y;
                    })
                ]),
                xAxis = d3.svg.axis()
                    .scale(xRange)
                    .tickSize(2)
                    .tickSubdivide(true),

                yAxis = d3.svg.axis()
                    .scale(yRange)
                    .tickSize(2)
                    .orient("left")
                    .tickSubdivide(true);
            vis.append('svg:g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + 230 + ')')
                .call(xAxis);

            vis.append('svg:g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
                .call(yAxis);

            vis.selectAll('rect')
                .data(barData)
                .enter()
                .append('rect')
                .attr('x', function (d) {
                    return xRange(d.x);
                })
                .attr('y', function (d) {
                    return yRange(d.y);
                })
                .attr('width', 15)
                .attr('height', function (d) {
                    return ((HEIGHT - MARGINS.bottom) - yRange(d.y));
                })
                .attr('fill', 'rgba(0,150,136,.5)')
                .on('mouseover',function(d){
                    d3.select(this)
                        .attr('fill','rgba(0,150,136,1)');
                })
                .on('mouseout',function(d){
                    d3.select(this)
                        .attr('fill','rgba(0,150,136,.5)');
                });
            $scope.openSidenav.open();
        }

        function InitChart2(barData,id) {
            $(".pre-visualisation").empty();
            $(id).empty();
            $("#pre-data").empty();
            var vis = d3.select(id),
                WIDTH = 250,
                HEIGHT = 250,
                MARGINS = {
                    top: 20,
                    right: 0,
                    bottom: 20,
                    left: 45
                },
                xRange = d3.scale.ordinal().rangeRoundBands([MARGINS.left, WIDTH - MARGINS.right], 0.1).domain(barData.map(function (d) {
                    return d.x;
                })),

                yRange = d3.scale.linear().range([HEIGHT - MARGINS.top, MARGINS.bottom]).domain([0,
                    d3.max(barData, function (d) {
                        return d.y;
                    })
                ]),
                xAxis = d3.svg.axis()
                    .scale(xRange)
                    .tickSize(2)
                    .tickSubdivide(true),

                yAxis = d3.svg.axis()
                    .scale(yRange)
                    .tickSize(2)
                    .orient("left")
                    .tickSubdivide(true);
            vis.append('svg:g')
                .attr('class', 'x axis')
                .attr('transform', 'translate(0,' + 230 + ')')
                .call(xAxis);

            vis.append('svg:g')
                .attr('class', 'y axis')
                .attr('transform', 'translate(' + (MARGINS.left) + ',0)')
                .call(yAxis);

            vis.selectAll('rect')
                .data(barData)
                .enter()
                .append('rect')
                .attr('x', function (d) {
                    return xRange(d.x);
                })
                .attr('y', function (d) {
                    return yRange(d.y);
                })
                .attr('width', 45)
                .attr('height', function (d) {
                    return ((HEIGHT - MARGINS.bottom) - yRange(d.y));
                })
                .attr("fill", function(d) {
                    ////console.log('WHAT IS D? ---> ', d);
                    if (d['x'] !== 'City' && d['x'] !== 'County' && d['x'] !== 'State') {
                        return "rgba(0,150,136,.5)";
                    } else {
                        return "rgba(66,66,66,.5)";
                    }
                })

                //('fill', 'rgba(66,66,66,.5)')
                .on('mouseover',function(d){
                    d3.select(this)
                        .attr("fill", function(d) {
                            ////console.log('WHAT IS D? ---> ', d);
                            if (d['x'] !== 'City' && d['x'] !== 'County' && d['x'] !== 'State') {
                                return "rgba(0,150,136,1)";
                            } else {
                                return "rgba(66,66,66,.8)";
                            }
                        })
                })
                .on('mouseout',function(d){
                    d3.select(this)
                        .attr('fill',function(d) {
                            ////console.log('WHAT IS D? ---> ', d);
                            if (d['x'] !== 'City' && d['x'] !== 'County' && d['x'] !== 'State') {
                                return "rgba(0,150,136,.5)";
                            } else {
                                return "rgba(66,66,66,.5)";
                            }
                        })
                });
        }

        function job_pie_chart(dataset){
            $("#chart").empty();
            var width = 250;
            var height = 250;
            var radius = Math.min(width, height) / 2.3;

            var color = d3.scale.ordinal()
                .range(['rgba(0,150,136,.5)','rgba(0,150,136,.8)' ]);

            var svg = d3.select('#chart')
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('transform', 'translate(' + (width / 2) +
                    ',' + (height / 2) + ')');

            var arc = d3.svg.arc()
                .innerRadius(0)
                .outerRadius(radius);

            var pie = d3.layout.pie()
                .value(function(d) { return d.count; })
                .sort(null);

            var path = svg.selectAll('path')
                .data(pie(dataset))
                .enter()
                .append('path')
                .attr('d', arc)
                .attr('fill', function(d) {
                    return color(d.data.label);
                });
            path.append("text")
                .attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
                .text(function(d) { return d.data.label;})
                .style("fill", "rgb(66,66,66)");

        }

        function zoomToFeature(e) {
            mc.currentInfo = mc.information;
            //console.log(mc.currentInfo);
            mc.area_click_on=e.target.feature.properties.name;
            mc.county_click_on=e.target.feature.properties.county;
            ////console.log("zip obj ",e.target.feature.properties);
            ////console.log("zip ", area_click_on);
            if(mc.area_click_on==="Los Angeles County"){
                mc.information=county_los_angeles.features[0].properties;
            }
            else if(mc.area_click_on==="Orange County"){
                mc.information=county_orange.features[0].properties;
            }
            else{
                if(dataService.firebase.hasOwnProperty(mc.area_click_on)){
                    var temp={};
                    for(var key in dataService.firebase[mc.area_click_on]){
                        if(key!=="zip_codes"){
                            temp[key]=dataService.firebase[mc.area_click_on][key];
                        }
                    }
                    mc.information=temp;
                }
                else {
                    var city=dataService.find_city_based_on_zip_code(mc.area_click_on);
                    var county;
                    if(oc_cities.indexOf(city[0])!==-1){
                        county="O";
                    }
                    else{
                        county="L";
                    }
                    dataService.indexMarkerInZip(mc.area_click_on);
                    var crime_and_job={};
                    //console.log("dataService.firebase", dataService.firebase);
                    //console.info("info ", mc.information);
                    //console.info("city ", city[i]);
                    if(city.length!==0){
                        for(var i=0;i<city.length;i++){
                            if(dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]!==undefined)
                                try{
                                    crime_and_job["2005 Violent Sum"]=dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                        ["crime"]["2005"]["Violent_sum"];
                                    crime_and_job["2006 Violent Sum"]=dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                        ["crime"]["2006"]["Violent_sum"];
                                    crime_and_job["2007 Violent Sum"]=dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                        ["crime"]["2007"]["Violent_sum"];
                                    crime_and_job["2008 Violent Sum"]=dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                        ["crime"]["2008"]["Violent_sum"];
                                    crime_and_job["2009 Violent Sum"]=dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                        ["crime"]["2009"]["Violent_sum"];
                                    crime_and_job["2010 Violent Sum"]=dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                        ["crime"]["2010"]["Violent_sum"];
                                    crime_and_job["2011 Violent Sum"]=dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                        ["crime"]["2011"]["Violent_sum"];
                                    crime_and_job["2012 Violent Sum"]=dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                        ["crime"]["2012"]["Violent_sum"];
                                    crime_and_job["2013 Violent Sum"]=dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                        ["crime"]["2013"]["Violent_sum"];
                                    crime_and_job["2014 Violent Sum"]=dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                        ["crime"]["2014"]["Violent_sum"];
                                    crime_and_job["Total_Jobs"]=dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]["total jobs"];
                                    //mc.information=crime_and_job;
                                    var barData = [{
                                        'x': "'05",
                                        'y': dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                            ["crime"]["2005"]["Violent_sum"]
                                    }, {
                                        'x': "'06",
                                        'y': dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                            ["crime"]["2006"]["Violent_sum"]
                                    }, {
                                        'x': "'07",
                                        'y': dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                            ["crime"]["2007"]["Violent_sum"]
                                    }, {
                                        'x': "'08",
                                        'y': dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                            ["crime"]["2008"]["Violent_sum"]
                                    }, {
                                        'x': "'09",
                                        'y': dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                            ["crime"]["2009"]["Violent_sum"]
                                    }, {
                                        'x': "'10",
                                        'y': dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                            ["crime"]["2010"]["Violent_sum"]
                                    }, {
                                        'x': "'11",
                                        'y': dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                            ["crime"]["2011"]["Violent_sum"]
                                    }, {
                                        'x': "'12",
                                        'y': dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                            ["crime"]["2012"]["Violent_sum"]
                                    }, {
                                        'x': "'13",
                                        'y': dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                            ["crime"]["2013"]["Violent_sum"]
                                    }, {
                                        'x': "'14",
                                        'y': dataService.firebase[city[i]]["zip_codes"][mc.area_click_on]
                                            ["crime"]["2014"]["Violent_sum"]
                                    }];
                                    var pie=[];
                                    for (var data in dataService.firebase[city[i]]["Number of job openings"]){
                                        var temp={};
                                        if(data!=="all") {
                                            temp["label"] = data;
                                            temp["count"] = dataService.firebase[city[i]]["Number of job openings"][data];
                                            pie.push(temp);
                                        }
                                    }
                                    ////console.log(pie);
                                    var z_bar_chart_data=[];
                                    if(county==="O"){
                                        //console.log(dataService.all["zillow"]["oc"][mc.area_click_on]);
                                        var object1={"x":mc.area_click_on,"y":dataService.all["zillow"]["oc"][mc.area_click_on]};
                                        var object2={"x":"City","y":dataService.all["zillow_city"]["oc"][city]};
                                        var object3={"x":"County","y":dataService.all["crime-and-job-data-analysis"]["oc"]["zindexAverage"]};
                                        var object4={"x":"State","y":479600};
                                        z_bar_chart_data.push(object1);
                                        z_bar_chart_data.push(object2);
                                        z_bar_chart_data.push(object3);
                                        z_bar_chart_data.push(object4);
                                    }
                                    else{
                                        //console.log(dataService.all["zillow"]["oc"][mc.area_click_on]);
                                        var object1={"x":mc.area_click_on,"y":dataService.all["zillow"]["lc"][mc.area_click_on]};
                                        var object2={"x":"City","y":dataService.all["zillow_city"]["lc"][city]};
                                        var object3={"x":"County","y":dataService.all["crime-and-job-data-analysis"]["lc"]["zindexAverage"]};
                                        var object4={"x":"State","y":479600};
                                        z_bar_chart_data.push(object1);
                                        z_bar_chart_data.push(object2);
                                        z_bar_chart_data.push(object3);
                                        z_bar_chart_data.push(object4);
                                    }
                                    mc.information=InitChart(barData,"#visualisation");
                                    job_pie_chart(pie);
                                    InitChart2(z_bar_chart_data,"#visualisation1");
                                    mc.crimejob=1;
                                }
                                catch(err){
                                    //console.info(err);
                                }
                            else{
                                mc.information={};
                                mc.information[city[i]]=dataService.firebase[city[i]]["zip_codes"];
                                mc.crimejob=0;
                            }
                        }
                    }
                    else{
                        mc.information={name:mc.area_click_on};
                    }
                }
            }

            leafletData.getMap().then(function(map) {
                mc.that = e;
                //console.log("event",e.target.feature.properties.name);
                var paramClick = e.target.feature.properties.name;
                    //mc.gjLayer = L.geoJson(tammy_geojson);
                    ////console.log("layer",gjLayer);
                angular.extend($scope, {
                    progress: true
                });
                dataService.makePlacesGeojson(paramClick).then(function(response) {

                    if(response === true) {
                        //console.log("TRUE!");
                        mc.scanDatabaseMarkers();
                    } else {
                        //console.log("FALSE");
                        mc.scanObjectMarkers();
                    }

                    angular.extend($scope, {
                        progress: false
                    });
                });

                map.fitBounds(e.target.getBounds(),{padding: [140, 140]});

            });
        }

        this.scanDatabaseMarkers = function() {
            var zipCodeClicked = mc.that.target.feature.properties.name;
            var res_markers = {};
            ////console.log("geojson", dataService.placesGeojson);

            for(var i=0;i<dataService.placesGeojson.length;i++){
                var place_id = dataService.placesGeojson[i].place_id;

                res_markers[place_id.substr(place_id.length-5).replace("-","_")] = {
                    "layer": "restaurant",
                    "Place ID": place_id,
                    "Place Type": dataService.placesGeojson[i].type,
                    "lat": dataService.placesGeojson[i].lat,
                    "lng": dataService.placesGeojson[i].lng,
                    "zipCode": zipCodeClicked,
                    "icon": divIcon
                }

            }
            angular.extend($scope, {
                markers: res_markers
            });
            //console.log("markers", res_markers);
        };
        /**
         * This function looks for downloaded Google places tied to coordinates and search if it's within the bounds
         * of the current clicked on polygon (zip code)
         */
        this.scanObjectMarkers = function() {

            var zipCodeClicked = mc.that.target.feature.properties.name;

            var matched_data = {
                "type": "FeatureCollection",
                "features": []
            };

            var res_markers = {};
            console.log('places geojson: ', dataService.placesGeojson2);
            if (!isNaN(mc.area_click_on) && mc.county_click_on==="Orange") {
                //console.log(mc.area_click_on, 'is a number');
                if (dataService.placesGeojson2.hasOwnProperty("zipCode")) {
                    dataService.placesGeojson2.zipCode[zipCodeClicked] = [];
                } else {
                    dataService.placesGeojson2.zipCode = {};
                    dataService.placesGeojson2.zipCode[zipCodeClicked] = [];
                }
                for (var rest in dataService.placesGeojson2.restaurant) {
                    ////console.log(rest);
                    ////console.log(dataService.placesGeojson2.restaurant[rest].geometry.coordinates[1]);
                    var res = leafletPip.pointInLayer(
                        [dataService.placesGeojson2.restaurant[rest].geometry.coordinates[1], dataService.placesGeojson2.restaurant[rest].geometry.coordinates[0]], mc.gjLayer);
                    if (res.length) {
                        ////console.log(rest);
                        ////console.log("name", res[0].feature.properties.name);
                        if (zipCodeClicked === res[0].feature.properties.name) {

                            // create a function for this, this uses the match library and assigns our object with a zip code
                            var temp_obj = {
                                "place_id":rest,
                                "lat": dataService.placesGeojson2.restaurant[rest].geometry.coordinates[0],
                                "lng": dataService.placesGeojson2.restaurant[rest].geometry.coordinates[1],
                                "type": dataService.placesGeojson2.restaurant[rest].properties.type
                            }
                            dataService.placesGeojson2.zipCode[zipCodeClicked].push(temp_obj);
                            ////console.log("name", res[0].feature.properties.name);
                            //matched_data.features.push(data.features[i]);
                            res_markers[rest.substr(rest.length-5).replace("-","_")] = {
                                "layer": "restaurant",
                                "Place ID": dataService.placesGeojson2.restaurant[rest].properties.placeId,
                                "Place Type": dataService.placesGeojson2.restaurant[rest].properties.type,
                                "lat": dataService.placesGeojson2.restaurant[rest].geometry.coordinates[0],
                                "lng": dataService.placesGeojson2.restaurant[rest].geometry.coordinates[1],
                                "zipCode": zipCodeClicked,
                                "icon": divIcon
                            }
                        }
                    }
                }
            }
            //console.log("markers", Object.size(res_markers));

            if(!isNaN(mc.area_click_on) && Object.size(res_markers) === 0){
                mc.showToastyToast('Sorry, there are no place markers in this area.');
            }
            ////console.log("markers", res_markers);
            ////console.log("geoJson2", dataService.placesGeojson2);

            angular.extend($scope, {
                markers: res_markers
            });

            //console.log('More markers:', res_markers);
        };

        function style(feature) {
            return {
                fillColor: getColor(feature.properties.score),
                weight: 1,
                opacity: 1,
                color: 'white',
                dashArray: '',
                fillOpacity: 0.7
            };
        }

        function county_style(feature) {
            return {
                fillColor: getCountyColor(feature.properties.score),
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '',
                fillOpacity: 0.7
            };
        }

        function getColor(d) {
            return d > 5 ? '#006837' :
                d > 4.25  ? '#1a9850' :
                d > 3  ? '#66bd63' :
                d > 2  ? '#a6d96a' :
                d > 1.75   ? '#d9ef8b' :
                d > 1.5  ? '#ffffbf' :
                d > 1.25  ? '#fee08b' :
                d > 1   ? '#fdae61' :
                d > 0   ? '#f46d43' :
                d > -1   ? '#d73027' :
                d > -2   ? '#a50026' : '#888888';
        }

        function getCountyColor(d) {
            return d > 3 ? '#006837' :
                d > 1  ? '#1a9850' :
                d > .15  ? '#66bd63' :
                d > .10  ? '#a6d96a' :
                d > .08   ? '#d9ef8b' :
                d > .05   ? '#ffffbf' :
                d > .03  ? '#fee08b' :
                d > .01   ? '#fdae61' :
                d > 0   ? '#f46d43' :
                d > -1   ? '#d73027' :
                    d > -3   ? '#a50026' : '#888888';
        }

        Object.size = function(obj) {
            var size = 0, key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        };

        leafletData.getMap().then(function (map) {

            map.on('zoomend', function (event) {
                //console.log(map.getZoom());

                ////console.log('overlay', map.getPanes().overlayPane);

                if (map.getZoom() <= 8) {
                    //mc.county_zoom();
                }

                if (map.getZoom() > 8 && map.getZoom() <=9 ) {
                    //mc.city_zoom();
                    //mc.city_geojson();
                }

                if (map.getZoom() <10 ) {
                    //mc.zipcode_zoom();
                    mc.markers_zoom();
                }

                if (map.getZoom() > 10) {

                }

            });
        });

        mc.checkZoom = function (zoomLevel) {
            if (mc.varMap !== undefined && mc.varMap.getZoom() === zoomLevel) {
                return true;
            }
        };

        // TOAST!

        mc.toastPos = {
            bottom: true,
            top: false,
            left: false,
            right: true
        };

        mc.toastPosition = angular.extend({}, mc.toastPos);

        mc.getToastPosition = function() {
            return Object.keys(mc.toastPosition)
                .filter(function(pos) { return mc.toastPosition[pos]; })
                .join(' ');
        };

        mc.showSimpleToast = function() {
            var pinTo = mc.getToastPosition();

            $mdToast.show(
                $mdToast.simple()
                    .textContent('No Search Results Found')
                    .position(pinTo)
                    .hideDelay(4000)
            );
        };

        mc.showToastyToast = function(paramText) {
            var pinTo = mc.getToastPosition();
            var toast = $mdToast.simple()
                .textContent(paramText)
                .action('OK')
                .highlightAction(true)
                .highlightClass('md-primary')
                .position(pinTo);

            $mdToast.show(toast).then(function(response) {
                if ( response == 'ok' ) {
                    // whatever happens after toast 'OK' click
                }
            });
        };

        mc.closeToast = function() {
            $mdToast.hide();
        };

    }]);

// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.services' is found in services.js
// 'starter.controllers' is found in controllers.js

var api_url = "http://www.airejeux.com/api/";
var icon = 'http://www.airejeux.com/bundles/applisunairejeux/images/playground-3.png';
var new_icon = 'http://www.airejeux.com/bundles/applisunairejeux/images/playground.png';
var map;
var GeoMarker;

ionic.Platform.isFullScreen = true;

angular.module('starter', ['ionic', 'ionicLazyLoad', 'starter.controllers', 'starter.services', 'starter.directives', 'ngCordova'])

.run(function($ionicPlatform, $ionicLoading, $rootScope, $cordovaGeolocation, Favorites, $ionicPopup, $cordovaSplashscreen) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    $cordovaSplashscreen.show();
    if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleLightContent();
    }
    
    $rootScope.img_url = "http://www.airejeux.com/uploads/aires/";
    $rootScope.avatar_url = "http://www.airejeux.com/uploads/avatars/";
    
    $rootScope.$on('loading:show', function() {
        $ionicLoading.show({template: '<ion-spinner class="spinner-energized" icon="android"></ion-spinner>',
            duration : 30000, noBackdrop:true, hideOnStateChange:true});
    });

    $rootScope.$on('loading:hide', function() {
      $ionicLoading.hide();
    });
    
    $rootScope.perimeter = 0.08;
    $rootScope.latitude = 0;
    $rootScope.longitude = 0;
    $rootScope.limitPlay = 8;
    
     $rootScope.loadMore = function(){
                $rootScope.limitPlay += 8;
                //alert($rootScope.limit);
                $rootScope.$broadcast('scroll.infiniteScrollComplete');
            };
    
    $rootScope.update = function(){
                for (var i = 0; i < $rootScope.close_playgrounds.length; i++) {                             
                            playground = $rootScope.close_playgrounds[i];
                            latLng = new google.maps.LatLng(playground.latitude, playground.longitude);
                            $rootScope.close_playgrounds[i].distance = MapUtils.getDistance(latLng).distance;
                            $rootScope.close_playgrounds[i].distanceKm = parseFloat(MapUtils.getDistance(latLng).km);
                        }
            }  
    
    /*navigator.geolocation.getCurrentPosition(function(position){
        alert('position ok');
        $rootScope.latitude = position.coords.latitude;
        $rootScope.longitude = position.coords.longitude;  
        
    }, function(error){
        alert(error);
    }, {maximumAge: 0, timeout: 15000, enableHighAccuracy: true});
    
      
    //NEED this because of geolocation marker ?  
    /*var watchId = navigator.geolocation.watchPosition( function(position){
        console.log('position ok');
        $rootScope.latitude = position.coords.latitude;
        $rootScope.longitude = position.coords.longitude;
    }, function(error){
        alert(error);
    }, {maximumAge: 1000, timeout: 20000, enableHighAccuracy: true});
    */
   
   //popup for forbidden area
   $rootScope.showPopupLogin = function(){
       var myPopup = $ionicPopup.show({
                    template: '<label class="item item-input">' +
                            '<i class="icon ion-search placeholder-icon"></i><input type="search" ng-model="dataSearch.query" ng-keypress="searchByQuery(dataSearch.query)">' +
                            '</label> ',
                    title: 'Entrer le nom d\'une ville',
                    subTitle: 'les 3 premières lettres suffisent',
                    scope: $scope,
                    buttons: [
                        {text: 'Annuler'},
                        {
                            text: '<b>Rechercher</b>',
                            type: 'button-orange',
                            onTap: function (e) {
                                if (!$scope.dataSearch.query) {
                                    e.preventDefault();
                                } else {
                                    return $scope.dataSearch.query;
                                }
                            }
                        }
                    ]
                });
   };
    
    //get zones
    Favorites.getFavorites().then(function (returnedData) {
                    $rootScope.favorites = returnedData;
                }, function (error) {
                    console.error('get zones failed');
                    try {
                        $rootScope.favorites = JSON.parse(localStorage.getItem('favorites'));
                    } catch(e) {
                        console.error("Exception: " + e);
                        return false;
                    }                    
                });
                
        //map
        
  });
})

.config(function($stateProvider, $urlRouterProvider) {

  // Ionic uses AngularUI Router which uses the concept of states
  // Learn more here: https://github.com/angular-ui/ui-router
  // Set up the various states which the app can be in.
  // Each state's controller can be found in controllers.js
  $stateProvider

  // setup an abstract state for the tabs directive
    .state('tab', {
    url: "/tab",
    abstract: true,
    templateUrl: "templates/tabs.html"
  })

  // Each tab has its own nav history stack:

  .state('tab.map', {
    url: '/map',
    views: {
      'tab-map': {
        templateUrl: 'templates/tab-map.html',
        controller: 'MapCtrl'
      }
    }
  })
  
  .state('tab.closePlayground', {
    url: '/closePlayground',
    views: {
      'tab-map': {
        templateUrl: 'templates/tab-closePlayground.html',
        controller: 'MapCtrl'
      }
    }
  })

  .state('tab.add', {
      url: '/add',
      views: {
        'tab-add': {
          templateUrl: 'templates/tab-add.html',
          controller: 'AddCtrl'
        }
      }
    })
    
    .state('playground', {
      url: '/playground/:playgroundId',
      abstract: false,
      cache: false,
      templateUrl: "templates/playground.html",
      controller: 'PlaygroundCtrl'
    })
    
    .state('tab.search', {
      url: '/search',
      cache: false,
      views: {
        'tab-favorites': {
          templateUrl: 'templates/search.html',
          controller: 'SearchCtrl'
        }
      }
    })
    
    .state('tab.playgrounds', {
      url: '/playgrounds/:cityId',
      views: {
        'tab-favorites': {
          templateUrl: 'templates/playgrounds.html',
          controller: 'PlaygroundsCtrl'
        }
      }
    })
    
    .state('tab.favorites', {
    url: '/favorites',
    views: {
      'tab-favorites': {
        templateUrl: 'templates/tab-favorites.html',
        controller: 'FavoritesCtrl'
      }
    }
  })
  
  .state('tab.cities', {
      url: '/cities/:zoneId',
      views: {
        'tab-favorites': {
          templateUrl: 'templates/cities.html',
          controller: 'CitiesCtrl'
        }
      }
    })

  .state('tab.compte', {
    url: '/compte',
    views: {
      'tab-compte': {
        templateUrl: 'templates/tab-compte.html',
        controller: 'CompteCtrl'
      }
    }
  });

  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/tab/map');

})

.config(['$httpProvider', function($httpProvider) {        
        $httpProvider.defaults.timeout = 30000;

        //display spinner for every http request
        $httpProvider.interceptors.push(function($q, $rootScope) {
    return {
      request: function(config) {
        $rootScope.$broadcast('loading:show');
        return config;
      },
      requestError: function(rejection) {
        $rootScope.$broadcast('loading:hide');
        return $q.reject(rejection);
    },
      
      response: function(response) {
        $rootScope.$broadcast('loading:hide');
        return response;
      },
      responseError: function(rejection) {
        $rootScope.$broadcast('loading:hide');
        return $q.reject(rejection);
    }
    };
        });
    }
])

.filter('orderObjectBy', function() {
  return function(items, field, reverse) {
    var filtered = [];
    angular.forEach(items, function(item) {
      filtered.push(item);
    });
    filtered.sort(function (a, b) {
      return (a[field] > b[field] ? 1 : -1);
    });
    if(reverse) filtered.reverse();
    return filtered;
  };
})

.filter('to_trusted', ['$sce', function($sce){
        return function(text) {
            text = text.replace(new RegExp('\r?\n','g'), '<br />');
            return $sce.trustAsHtml(text);
        };
    }])

.filter('truncate_text', function(){
       return function(text, length) {
           if (text.length <= parseInt(length)){
               return text;
           }
           else{
               return text.substring(0,parseInt(length))+'...';
           }
       } 
});



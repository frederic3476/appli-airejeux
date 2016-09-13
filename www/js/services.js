angular.module('starter.services', [])


.factory('Account', function($http, $cordovaDialogs, $cordovaToast){
    return {
        resetting: function(username){
            promise = $http({
                url: api_url+"passwords/resetting.json?username="+username,
                method: "GET"
            }).then(function(response){
                $cordovaToast.show('Un e-mail a été envoyé avec votre nouveau mot de passe', 'long', 'center'); 
            },function(error){
                $cordovaDialogs.alert(JSON.stringify(error.data), 'Erreur'); 
            }
                    );
            return promise;
        },
        
        register: function(dataPost){
            promise = $http({
                url: api_url+"registers.json",
                method: "POST",
                data: dataPost
            }).then(function(response){
                $cordovaToast.show('Vous vous êtes enregistré avec succés !', 'short', 'center');
                return response;
            },function(error){                
                $cordovaDialogs.alert(JSON.stringify(error.data), 'Erreur');  
                console.log(JSON.stringify(error));
                return error;
            }
                    );
            return promise;
        }
    };
})

.factory('Playgrounds', function($rootScope, $http, $state, $cordovaToast, $cordovaDialogs, MapUtils) {
    
    var playgrounds = [];
    var close_playgrounds = [];

  return {
    new: function(dataPost, header){
        promise = $http({
                url: api_url+"aires",
                method: "POST",
                data: dataPost,
                headers: header
            }).then(function(response){
                $rootScope.$broadcast('new-playground');
                $state.go('tab.map');
                $cordovaToast.show('Aire de jeux ajouté avec succés !', 'short', 'center');
                return response;
            },function(error){                
                $cordovaDialogs.alert('Erreur: merci de recommencer l\'opération', 'Erreur');  
                console.log(JSON.stringify(error));
                return error;
            }
                    );
            return promise;
    },
    getPlaygroundsByCity: function(cityId){
        var data = [];
        promise = $http({
                url: api_url+"cities/"+cityId,
                method: "GET"
            }).then(function(response){
                playgrounds = response.data;                
                return playgrounds;
            },function(error){
                alert(JSON.stringify(error));
            }
                    );
            return promise;
    },
    
    getNearPlaygrounds: function(lat, lng, perimeter){
        promise = $http({
                url: api_url+"near?latitude=" + lat + "&longitude=" + lng + "&perimeter=" + perimeter,
                method: "GET"
            }).then(function(response){
                close_playgrounds = response.data;
                for (i in close_playgrounds) {
                            latLng = new google.maps.LatLng(close_playgrounds[i].latitude, close_playgrounds[i].longitude);
                            close_playgrounds[i].distance = MapUtils.getDistance(latLng).distance;
                            close_playgrounds[i].distanceKm = parseFloat(MapUtils.getDistance(latLng).km);
                        }
                return close_playgrounds;
            },function(error){
                $cordovaDialogs.alert('Merci de recommencer l\'opération', 'Erreur réseau');
            }
                    );
            return promise;
    },
    
    get: function(playgroundId) {
      for (var i = 0; i < playgrounds.length; i++) {
        if (playgrounds[i].id === parseInt(playgroundId)) {
          playgrounds[i].img_name = (playgrounds[i].file_name ? $rootScope.img_url + '500-'+playgrounds[i].file_name : 'img/imagedefaut.png');
          return playgrounds[i];
        }
      }
      for (var i = 0; i < close_playgrounds.length; i++) {
        if (close_playgrounds[i].id === parseInt(playgroundId)) {
          close_playgrounds[i].img_name = (close_playgrounds[i].file_name ? $rootScope.img_url + '500-'+close_playgrounds[i].file_name : 'img/imagedefaut.png');  
          return close_playgrounds[i];
        }
      }
      return null;
    },
    
    getPlaygroundById: function(playgroundId){
        promise = $http({
                url: api_url+"playgrounds/" + playgroundId + ".json",
                method: "GET"
            }).then(function(response){
                for (var i = 0; i < playgrounds.length; i++) {
                if (playgrounds[i].id === parseInt(playgroundId)) {
                   playgrounds[i] = response.data;
                   playgrounds[i].img_name = (response.data.file_name ? $rootScope.img_url + '500-'+response.data.file_name : 'img/imagedefaut.png');
                    }
                }
                //return response.data;
            },function(error){
                alert(JSON.stringify(error));
            }
                    );
            return promise;
    },
    
    
    comment: function(dataComment, header){
        promise = $http({
                url: api_url+"comments.json",
                method: "POST",
                data: dataComment,
                headers: header
            }).then(function(response){
                $cordovaToast.show('Merci pour votre commentaire', 'short', 'center');
                return response;
            },function(error){
                $cordovaDialogs.alert(error.data, 'erreur');           
                console.log(JSON.stringify(error));
                return error;
            }
                    );
            return promise;
    },
    vote: function(dataVote, header){
        promise = $http({
                url: api_url+"votes.json",
                method: "POST",
                data: dataVote,
                headers: header
            }).then(function(response){
                $cordovaToast.show('Merci pour votre vote', 'short', 'center');
                return response;
            },function(error){
                $cordovaDialogs.alert(error.data, 'erreur');
                console.log(JSON.stringify(error));
                return error;                
            }
                    );
            return promise;
    },
    
    changePicture: function(dataImg, header){
        promise = $http({
                url: api_url+"uploads/pictures.json",
                method: "POST",
                data: dataImg,
                headers: header
            }).then(function(response){
                $cordovaToast.show('Merci pour l\'image', 'short', 'center');
                return response;
            },function(error){
                $cordovaDialogs.alert(error.data, 'erreur');
                console.log(JSON.stringify(error));
                return error;                
            }
                    );
            return promise;
    }
  };
})

.factory('Favorites', function($http) {
    return {
        getDeparts: function(){
            
            promise = $http({
                url: api_url+"departement/list.json",
                method: "GET"
            }).then(function(response){
                return response.data;
            },function(error){
                console.log(JSON.stringify(error));
            }
                    );
            return promise;
        }
    };
})

.factory('Cities', function($rootScope, $http) {
    var cities = [];
    var cityFavorites = [] || JSON.parse(localStorage.getItem('cityFavorites'));
    
    return {
        getCloseCities: function(){
            promise = $http({
                url: api_url+"close/city.json?latitude="+$rootScope.latitude+"&longitude="+$rootScope.longitude,
                method: "GET"
            }).then(function(response){
                cities = response.data;
                return cities;
            },function(error){
                alert(JSON.stringify(error));
            }
                    );
            return promise;
        },
        
        getCitiesByZone: function(zoneId){
            promise = $http({
                url: api_url+"town/list.json?departId="+zoneId,
                method: "GET"
            }).then(function(response){
                cities = response.data;
                return cities;
            },function(error){
                alert(JSON.stringify(error));
            }
                    );
            return promise;
        },
        
        searchCity: function(query){
            promise = $http({
                url: api_url+"villes/"+query+".json",
                method: "GET"
            }).then(function(response){
                cities = response.data;
                return cities;
            },function(error){
                alert(JSON.stringify(error));
            }
                    );
            return promise;
        },
        
        getCitiesByFavorite: function(){
                data = JSON.parse(localStorage.getItem('cityFavorites'));
                ids = "";
                for (i in data){
                    ids += data[i].id+"|";
                }
                
                promise = $http({
                    url: api_url+"favorites/cities.json",
                    method: "POST",
                    data: {'favorite':ids}
                }).then(function(response){
                    cityFavorites = response.data
                    return cityFavorites;
                },function(error){
                    return getAllFavorites();
                }
                        );
                return promise;
        },
        
        getAllFavorites: function(){
            if (localStorage.getItem('cityFavorites')){
                cityFavorites = JSON.parse(localStorage.getItem('cityFavorites'));
            }
            return cityFavorites;            
        },
        
        addCity: function(city){
                newCity = {};
                newCity.id = city.id;
                newCity.nom = city.nom;
                newCity.code = city.code;
                newCity.value = city.value;
                cityFavorites.push(newCity);
                localStorage.setItem('cityFavorites', JSON.stringify(cityFavorites));
        },
        
        deleteCity: function(cityId){
                for (var i = cityFavorites.length - 1; i >= 0; i--) {
                    if (parseInt(cityFavorites[i].id) === cityId) {
                        cityFavorites.splice(i, 1);
                    }
                }
                localStorage.setItem('cityFavorites', JSON.stringify(cityFavorites));
        },
        
        isFavorite: function(cityId){
            if (!localStorage.getItem('cityFavorites')) {
                    return false;
                }
                else {
                    for (i in cityFavorites) {
                        if (parseInt(cityFavorites[i].id) === cityId) {
                            return true;
                        }
                    }
                    return false;
                }
        }
    };
})

.factory('Photo', ['$q', function($q) {

      return {
        getPicture: function(options) {
          //use promise manager
          var q = $q.defer();

          navigator.camera.getPicture(function(result) {
            q.resolve(result);
          }, function(err) {
            q.reject(err);
          }, options);

          return q.promise;
        },
        
        toBase64Image: function (img_path) {
            var q = $q.defer();
            window.imageResizer.resizeImage(function (success_resp) {
                console.log('success, img toBase64Image: ' + JSON.stringify(success_resp));
                q.resolve(success_resp);
            }, function (fail_resp) {
                console.log('fail, img toBase64Image: ' + JSON.stringify(fail_resp));
                q.reject(fail_resp);
            }, img_path, 500, 500, {
                imageDataType: ImageResizer.IMAGE_DATA_TYPE_URL,
                resizeType: ImageResizer.RESIZE_TYPE_PIXEL,
                format: 'png',
                quality : 40
            });

            return q.promise;
        }
      };
}])

.factory('dataFactory', [function($q, $cordovaSQLite){ 
    var db_;

  // private methods - all return promises

  var openDB_ = function(dbName){
     var q = $q.defer();
     $cordovaSQLite.openDB({ name: dbName }).then (function(result){q.resolve(result);});  
     return q.promise;  
  };

  var createTable_ = function(db_, table_name, schema){
    var q = $q.defer();
    $cordovaSQLite.execute(db_,'CREATE TABLE IF NOT EXISTS '+table_name+' '+schema).then(function(result){q.resolve(result);});
    return q.promise;               
  };
  
  var initDB = function(){

    var q = $q.defer();
    // successively call private methods, chaining to next with .then()
    openDB_("MyDB").then(function(db){
      schema = "(id integer primary key, \n\
                        ville_id, \n\
                        nom text,\n\
                        description text,\n\
                        surface text,\n\
                        longitude float,\n\
                        latitude float,\n\
                        age_min integer,\n\
                        age_max integer,\n\
                        nbr_jeux integer,\n\
                        file_name text,\n\
                        average float)";
      createTable_(db, 'aire', schema).then(function(result){        
        q.resolve(result);
      });
    });
    return q.promise;
  };
  
  var insertData = function(db, data){
      var q = $q.defer();
      $cordovaSQLite.execute(db,"REPLACE INTO aire (id, ville_id, nom, description, surface, longitude, latitude, age_min, age_max, nbr_jeux, file_name, average) \n\
                                            VALUES (?,?,?,?,?,?,?,?,?,?,?)",
                                    [data.id,
                                        data.ville_id,
                                        data.nom,
                                        data.description,
                                        data.surface,
                                        data.longitude,
                                        data.latitude,
                                        data.age_min,
                                        data.age_max,
                                        data.nbr_jeux,
                                        data.file_name,
                                        data.average]).then(function(result){        
        q.resolve(result);
      }); 
      return q.promise;
  };
  
  var deleteData = function(db, id){
      var q = $q.defer();
      $cordovaSQLite.execute(db,"DELETE INTO aire WHERE ville_id="+id,[]).then(function(result){        
        q.resolve(result);
      return q.promise;
  });
  };
  
  var getPlaygroundsByCity = function(db, cityId){
      var q = $q.defer();
      $cordovaSQLite.execute(db,"SELECT * FROM aire WHERE ville_id="+cityId,[]).then(function(result){        
        q.resolve(result);
      return q.promise;
  });
  };
  
  var getPlaygroundById = function(db, Id){
      var q = $q.defer();
      $cordovaSQLite.execute(db,"SELECT * FROM aire WHERE id="+id,[]).then(function(result){        
        q.resolve(result);
      return q.promise;
  });
  };
  
  return {
    initDB: initDB,
    insertData: insertData,
    deleteData: deleteData,
    getPlaygroundsByCity: getPlaygroundsByCity,
    getPlaygroundById: getPlaygroundById
  };
  
 }])
 
.factory('MapUtils', function($q, $rootScope) {
    return {
        getDistance: function(latLng) {
            var myLatLng = new google.maps.LatLng($rootScope.latitude, $rootScope.longitude);
            var distance = google.maps.geometry.spherical.computeDistanceBetween(myLatLng, latLng);
            
            return {'distance':((distance/1000)>1?(distance/1000).toFixed(2)+' km': distance.toFixed(0)+ ' mètres'), 'km': (distance/1000).toFixed(2)};
        },
        getAdresse: function () {
            var q = $q.defer();
            var myLng = new google.maps.LatLng($rootScope.latitude, $rootScope.longitude);
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode( {'latLng': myLng},
            function(results, status) {
              if(status == google.maps.GeocoderStatus.OK) {
                if(results[0]) {
                   if (results[0].address_components[6] != undefined){ 
                       
                       q.resolve({'ville':results[0].address_components[2].short_name, 'code':results[0].address_components[6].short_name});
                      //return results[0].address_components[2].short_name+'|'+results[0].address_components[6].short_name;
                   }
                }
                else {
                    q.reject("No results");
                  //return "No results";
                }
              }
              else {
                q.reject("No results");
                //return status;
              }
            });
            return q.promise;
          }
    };
 });



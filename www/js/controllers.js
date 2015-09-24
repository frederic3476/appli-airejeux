angular.module('starter.controllers', [])

        .controller('MapCtrl', function ($scope, $rootScope, $state, $ionicLoading, $ionicHistory, $cordovaDialogs, $compile, Playgrounds, MapUtils, $cordovaSplashscreen) {            
            var infowindow;
            var markers =[];
          

            $scope.$on('$ionicView.beforeEnter', function (viewInfo, state) {
                if (map) {
                    setTimeout(function () {
                        google.maps.event.trigger(map, "resize");
                    }, 500);
                }
            });
            
            $scope.$on('new-playground', function(event, args) { 
               console.log('new playground'); 
               $scope.doRefresh();
            });
            function initialize() {
                $ionicLoading.show({
                    template: '<span class="loading_map">Chargement de la carte...</span>',
                    showBackDrop: true
                });
                
                
                map = new google.maps.Map(document.getElementById("map"));
                
                map.addListener('google-map-ready', function () {
                        $ionicLoading.hide();
                    });
                    
                navigator.geolocation.getCurrentPosition(function (pos) {
                    $rootScope.latitude = pos.coords.latitude;
                    $rootScope.longitude = pos.coords.longitude;
                    //alert('ok1');
                   
                    var myLatlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                    var mapOptions = {
                        center: myLatlng,
                        zoom: 14,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        minZoom: 12
                    };
                    
                    //alert('ok2');    
                    //my position
                    GeoMarker = new GeolocationMarker();
                    GeoMarker.setCircleOptions({fillColor: '#808080'});
                    
                    //watchPosition include
                    GeoMarker.setMap(map);
                    
                    map.setOptions(mapOptions);                    
                    //alert('ok3');
                    
                    google.maps.event.addListener(GeoMarker, 'position_changed', function () {       
                        
                        $scope.nbrChange++; 
                        position = this.getPosition();                        
                        $rootScope.latitude = position.lat();
                        $rootScope.longitude = position.lng();
                        //alert(position.lat()+"/"+position.lng());
                        //map.setCenter(position);
                        this.marker.setPosition(position);
                        $scope.position = $rootScope.latitude +"/"+$rootScope.longitude;
                    });
                        
                    
                    
                    $ionicLoading.hide();
                    $cordovaSplashscreen.hide();
                    //alert('ok4');
                    Playgrounds.getNearPlaygrounds($rootScope.latitude, $rootScope.longitude, $rootScope.perimeter).then(function (data) {
                        for (i in data) {
                            latLng = new google.maps.LatLng(data[i].latitude, data[i].longitude);
                            //TODO use directive for distance
                            data[i].distance = MapUtils.getDistance(latLng).distance;
                            data[i].distanceKm = parseFloat(MapUtils.getDistance(latLng).km);
                        }
                        $rootScope.close_playgrounds = data;
                        setMarkers(map, data);
                    });

                    $rootScope.map = map;
                    //$rootScope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
                }, function (error) {
                    $cordovaDialogs.alert(error.message, 'Erreur de localisation');
                }, {maximumAge: 60000, timeout: 30000, enableHighAccuracy: true});
                
                document.addEventListener("resume", function() {$scope.doRefresh();}, false);

            }
            if ($ionicHistory.currentStateName() !== 'tab.closePlayground') {
                ionic.Platform.ready(initialize);
            }                        
            
            $scope.clickMarker = function (playgroundId) {
                $state.go('playground', {playgroundId: playgroundId});
                infowindow.close();
            };

            function setMarkers(map, playgrounds)
            {
                var myLatLng = new google.maps.LatLng($rootScope.latitude, $rootScope.longitude);
                for (var i = 0; i < playgrounds.length; i++) {

                    var playground = playgrounds[i];
                    var latLng = new google.maps.LatLng(playground.latitude, playground.longitude);
                    //var distance = google.maps.geometry.spherical.computeDistanceBetween(myLatLng, latLng);
                    srcImg = (playground.file_name ? $rootScope.img_url + '100-'+ playground.file_name : 'img/imagedefaut.png');
                    var contentString =
                            '<div class="content" nav-transition="android" ng-click=\'clickMarker(' + playground.id + ')\'>' +
                            '<img ng-src="' + srcImg + '"/>' +
                            '<div class="bodyContent">' +
                            '<h4 id="playground-' + playground.id + '" class="headingContent">' + playground.nom.substring(0,19) + (playground.nom.length>19?"...":"") + '</h4>' +
                            '<p><span class="average" note-transform average="' + (playground.average?parseFloat(playground.average).toFixed(1):'') + '"></span> <span class="distance">' + playground.distance + '</span></p>' +
                            '</div>' +
                            '</div>';
                    var compiled = $compile(contentString)($scope);
                    
                    //TODO make service
                    var marker = new google.maps.Marker({
                        position: latLng,
                        map: map,
                        title: playground.nom,
                        animation: google.maps.Animation.DROP,
                        icon: icon
                    });
                    
                    markers.push(marker);

                    google.maps.event.addListener(marker, 'click', getInfoCallback(map, compiled[0]));
                }
            }

            function getInfoCallback(map, content) {
                if (infowindow)
                    infowindow.close();
                infowindow = new google.maps.InfoWindow({content: content});
                return function () {
                    infowindow.setContent(content);
                    infowindow.open(map, this);
                };
            }
            
             $scope.doRefresh = function() {
                 $rootScope.limitPlay = 8;
                 //center map
                 if (map){
                     map.setCenter({lat: $rootScope.latitude, lng: $rootScope.longitude});
                 }
                 
                 $rootScope.close_playgrounds = [];
                 deleteMarkers();
                 Playgrounds.getNearPlaygrounds($rootScope.latitude, $rootScope.longitude, $rootScope.perimeter).then(function (data) {
                        for (i in data) {
                            latLng = new google.maps.LatLng(data[i].latitude, data[i].longitude);
                            data[i].distance = MapUtils.getDistance(latLng).distance;
                            data[i].distanceKm = parseFloat(MapUtils.getDistance(latLng).km);
                        }
                        $rootScope.close_playgrounds = data;
                        setMarkers(map, data);
                    });
             };
             
             //TODO make service
             function setAllMap(map) {
                for (var i = 0; i < markers.length; i++) {
                  markers[i].setMap(map);
                }
              }
            
            //TODO make service
            function clearMarkers() {
                setAllMap(null);
              }
            
            //TODO make service
            function deleteMarkers() {
                clearMarkers();
                markers = [];
            }
        })
        .controller('AddCtrl', function ($scope, $rootScope, $state, Playgrounds, Cities, Camera, $cordovaDialogs) {      

            $scope.$on('$ionicView.beforeEnter', function (viewInfo, state) {
                if (!sessionStorage.getItem('token')) {
                    //TODO : add button to go to account or use broadcast $rootScope.broadcast("interdiction");
                    $cordovaDialogs.alert('Vous devez être identifié pour ajouter une aire de jeux !', 'Interdiction');
                    $state.go('tab.compte');
                }
                else {
                    //get closest cities
                    $scope.options = [];

                    Cities.getCloseCities().then(function (returnedData) {
                        for (i in returnedData) {
                            $scope.options.push({id: returnedData[i].nom + "|" + returnedData[i].code, label: returnedData[i].nom, value: returnedData[i].nom + "|" + returnedData[i].code});
                        }
                    });
                }
            });

            $scope.playgroundData = {};
            $scope.playgroundData.latitude = $rootScope.latitude;
            $scope.playgroundData.longitude = $rootScope.longitude;
            $scope.playgroundData.age_min = 1;
            $scope.playgroundData.age_max = 6;
            $scope.playgroundData.nbr_jeux = 1;
            $scope.playgroundData.is_picnic = { "checked": false }; 
            $scope.playgroundData.is_sport = { "checked": false }; 
            $scope.playgroundData.is_shadow = { "checked": false }; 
            $scope.playgroundData.img64 = "";
            $scope.lastPhoto = "";

            $scope.addPlayground = function () {
                message = "";
                
                if (!this.addForm.nom.$valid){
                    message = 'Le nom de l\'aire doit contenir au moins 5 caractères\n';
                }
                
                if (!this.addForm.ville_str.$valid){
                    message+='Merci de choisir une ville\n';
                }
                
                if (!this.addForm.surface.$valid){
                    message+='Merci de choisir une surface\n';
                }
                
                if (this.addForm.$valid){
                    dataPost = {
                        nom: $scope.playgroundData.nom,
                        ville_str: $scope.playgroundData.ville_str,
                        description: $scope.playgroundData.description,
                        surface: $scope.playgroundData.surface,
                        longitude: $rootScope.longitude,
                        latitude: $rootScope.latitude,
                        age_min: $scope.playgroundData.age_min,
                        age_max: $scope.playgroundData.age_max,
                        nbr_jeux: $scope.playgroundData.nbr_jeux,
                        is_picnic: $scope.playgroundData.is_picnic.checked,
                        is_sport: $scope.playgroundData.is_sport.checked,
                        is_shadow: $scope.playgroundData.is_shadow.checked,
                        img64: $scope.playgroundData.img64
                    };

                    console.log("add new playground");
                    Playgrounds.new(dataPost, {"X-WSSE": sessionStorage.getItem('token')}).then(function (resp) {
                        //$state.go('tab.map');
                    }, function (err) {
                    });
                }
                else{
                    $cordovaDialogs.alert(message, 'Erreur formulaire');
                }
            };

            //take picture
            $scope.getPhoto = function () {
                Camera.getPicture({quality:40, targetWidth: 500}).then(function (imageURI) {
                    console.log(imageURI);
                    $scope.lastPhoto = imageURI;
                    Camera.toBase64Image(imageURI).then(function (resp) {
                        $scope.playgroundData.img64 = resp.imageData;
                    });

                }, function (err) {
                    console.err(err);
                });
            };



            $scope.cancel = function ()
            {
                $scope.playgroundData = {};
                $scope.playgroundData.latitude = $rootScope.latitude;
                $scope.playgroundData.longitude = $rootScope.longitude;
                $scope.playgroundData.age_min = 1;
                $scope.playgroundData.age_max = 6;
                $scope.playgroundData.nbr_jeux = 1;
                $scope.playgroundData.is_picnic = { "checked": false }; 
                $scope.playgroundData.is_sport = { "checked": false }; 
                $scope.playgroundData.is_shadow = { "checked": false }; 
                $scope.playgroundData.img64 = "";
                $scope.lastPhoto = "";
            };
        })

        .controller('PlaygroundCtrl', function ($scope, $rootScope, $stateParams, $ionicSlideBoxDelegate, $cordovaToast, 
                                                $ionicModal, $cordovaDialogs, $ionicHistory, Playgrounds, Camera, 
                                                $ionicPopup, $state, $cordovaSocialSharing) {
            //$scope.slideIndex = 1;

            $scope.next = function () {
                $ionicSlideBoxDelegate.next();
            };
            $scope.previous = function () {
                $ionicSlideBoxDelegate.previous();
            };
            $scope.slideChanged = function (index) {
                $scope.slideIndex = index;
            };

            $scope.dataPlayground = [];
            
            var playgroundId = $stateParams.playgroundId;

            $scope.dataPlayground = Playgrounds.get(playgroundId);
            //$scope.dataPlayground.img_name = ($scope.dataPlayground.file_name ? $rootScope.img_url + '500-'+$scope.dataPlayground.file_name : 'img/imagedefaut.png');

            //modal vote
            $scope.voteData = {};
            $scope.voteData.score = 2.5;
            $scope.voteData.aire_id = playgroundId;
            $ionicModal.fromTemplateUrl('templates/vote_modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal_vote = modal;
            });

            $scope.closeVote = function () {
                $scope.modal_vote.hide();
            };

            // Open the login modal
            $scope.vote = function () {
                if (!sessionStorage.getItem('token')) {
                    $cordovaDialogs.alert('Vous devez être identifié pour noter cette aire de jeux !', 'Interdiction');
                }
                else {
                    $scope.modal_vote.show();
                }
            };

            // Perform the vote action when the user submits the vote form
            $scope.doVote = function () {
                console.log('Doing vote', $scope.voteData);
                dataVote = {
                    aire_id: $scope.voteData.aire_id,
                    score: $scope.voteData.score
                };
                console.log("note playground");
                Playgrounds.vote(dataVote, {"X-WSSE": sessionStorage.getItem('token')}).then(function (resp) {
                }, function (err) {
                }).finally(function () {
                    $scope.loading = false;
                    $scope.doRefresh($scope.dataPlayground.id);
                    $scope.modal_vote.hide();
                });

            };

            //modal comment
            $scope.commentData = {};
            $scope.commentData.aire_id = playgroundId;
            $ionicModal.fromTemplateUrl('templates/comment_modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            }).then(function (modal) {
                $scope.modal_comment = modal;
            });

            // Triggered in the comment modal to close it
            $scope.closeComment = function () {
                $scope.modal_comment.hide();
            };

            // Open the comment modal
            $scope.comment = function () {
                if (!sessionStorage.getItem('token')) {
                    $cordovaDialogs.alert('Vous devez être identifié pour poster un commentaire !', 'Interdiction');
                }
                else {
                    $scope.modal_comment.show();
                }
            };

            // Perform the comment action when the user submits the comment form
            $scope.doComment = function () {
                console.log('Doing comment', $scope.commentData);
                dataComment = {
                    aire_id: $scope.commentData.aire_id,
                    texte: $scope.commentData.texte
                };
                console.log("add new comment");
                Playgrounds.comment(dataComment, {"X-WSSE": sessionStorage.getItem('token')}).then(function (resp) {
                }).catch(function (err) {
                }).finally(function () {
                    $scope.loading = false;
                    $scope.doRefresh($scope.dataPlayground.id);
                    $scope.modal_comment.hide();
                });

            };
            
            //change picture
            $scope.changePicture = function () {
                if (!sessionStorage.getItem('token')) {
                    $cordovaDialogs.alert('Vous devez être identifié pour changer la photo !', 'Interdiction');
                }
                else if($scope.dataPlayground.file_name){
                    $cordovaDialogs.alert('Il existe déjà une photo de cette aire', 'Interdiction');
                }
                else{
                    Camera.getPicture({quality:40, targetWidth: 500}).then(function (imageURI) {
                    console.log(imageURI);
                    //$scope.lastPhoto = imageURI;
                    Camera.toBase64Image(imageURI).then(function (resp) { 
                        dataImg = {
                                  aire_id: $scope.dataPlayground.id,
                                  img64: resp.imageData,
                                  imageURI: imageURI
                                };
                        $scope.showConfirm(dataImg);        
                    });

                }, function (err) {
                    console.err(err);
                });
                }
            };
            
            //share
            $scope.share = function () {
                img_name = ($scope.dataPlayground.file_name ? $rootScope.img_url + '500-'+$scope.dataPlayground.file_name : null);

                $cordovaSocialSharing.share('Bonjour, \n Je recommande l\'aire de jeux "'+$scope.dataPlayground.nom+'" à '+$scope.dataPlayground.ville.nom+'.\n Suivez ce lien:', 
                                            'Aire de jeux', 
                                            img_name, 
                                            'http://www.airejeux.com/aire/'+$scope.dataPlayground.id+'/'+$scope.dataPlayground.id)
                    .then(function(result) {
                        if (result){
                            $cordovaToast.show('Message envoyé', 'short', 'center');
                        }
                    }, function(err) {
                      console.log('erreur de partage');
                    });
            }
            
            $scope.showConfirm = function(dataImg) {
                            var confirmPopup = $ionicPopup.confirm({
                              title: 'Confirmation',
                              template: 'Etes-vous sûr d\'envoyer cette photo?'
                            });
                            confirmPopup.then(function(res) {
                              if(res) {
                                console.log('ok photo');
                                //$scope.lastPhoto = dataImg.imageURI;
                                //$scope.playgroundData.img64 = resp.imageData;
                                
                                //send image                                
                                Playgrounds.changePicture(dataImg, {"X-WSSE": sessionStorage.getItem('token')}).then(function (resp) {})
                                .finally(function () {
                                    $scope.doRefresh($scope.dataPlayground.id);
                                });
                              } else {
                                console.log('not ok photo');
                              }
                            });
                          };
            

            $scope.goBack = function () {
                $ionicHistory.goBack();
            };

            $scope.doRefresh = function (playgroundId) {
                //$scope.dataPlayground = [];
                Playgrounds.getPlaygroundById(playgroundId).then(function (result) {
                    //$scope.dataPlayground = result;
                    //$scope.dataPlayground.img_name = ($scope.dataPlayground.file_name ? $rootScope.img_url + '500-'+ $scope.dataPlayground.file_name : 'img/imagedefaut.png');
                    $scope.$broadcast('scroll.refreshComplete');
                }).finally(function () {$state.go($state.current, {playgroundId:$scope.dataPlayground.id}, {reload:true});});
            };
        })

        .controller('PlaygroundsCtrl', function ($scope, $rootScope, $stateParams, Playgrounds) {
            $scope.$on('$ionicView.beforeLeave', function (viewInfo, state) {
                $rootScope.limitPlay = 8;
            });
            
            $scope.playgrounds = [];
            var cityId = $stateParams.cityId;

            Playgrounds.getPlaygroundsByCity(cityId).then(function (returnedData) {
                for (i in returnedData) {
                    $scope.playgrounds = returnedData;
                }
            });
        })

        .controller('CitiesCtrl', function ($scope, $rootScope, $stateParams, Cities) {
            //get cities
            $scope.cities = [];
            var zoneId = $stateParams.zoneId;

            Cities.getCitiesByZone(zoneId).then(function (returnedData) {
                $scope.cities = returnedData;
            });

            $scope.addCity = Cities.addCity;

            $scope.deleteCity = Cities.deleteCity;

            $scope.isFavorite = Cities.isFavorite;
        })

        .controller('FavoritesCtrl', function ($scope, $rootScope, $stateParams, Favorites, $cordovaToast) {
            $scope.$on('$ionicView.beforeEnter', function (viewInfo, state) {
                if (localStorage.getItem('departs')) {
                    $scope.favorites = JSON.parse(localStorage.getItem('departs'));
                }
                //$scope.doRefresh();
            });

            $scope.record = function () {
                localStorage.setItem('favorites', JSON.stringify($scope.favorites));
                $cordovaToast.show('Enregistrement réussi', 'short', 'center');
            };

            $scope.doRefresh = function () {
                Favorites.getFavorites().then(function (returnedData) {
                    $scope.favorites = returnedData;
                    localStorage.setItem('departs', JSON.stringify(returnedData));
                    $scope.$broadcast('scroll.refreshComplete');
                }, function (error) {
                    console.error('get zones failed');
                    try {
                        $scope.favorites = JSON.parse(localStorage.getItem('departs'));
                    } catch (e) {
                        console.error("Exception: " + e);
                        return false;
                    }
                });
            };

        })

        .controller('CompteCtrl', function ($scope, $rootScope, $http, $cordovaInAppBrowser, $cordovaToast, $cordovaDialogs) {

            $scope.loginData = {};

            if (localStorage.getItem('username')) {
                $scope.loginData.username = localStorage.getItem('username');
                $scope.loginData.password = localStorage.getItem('password');
            }

            $scope.doLogin = function () {
                if (this.login_form.$valid){
                    $http.get(api_url + "users/" + $scope.loginData.username).then(function (resp) {
                        console.log('Success', resp);
                        if ($scope.loginData.remember) {
                            localStorage.setItem('username', $scope.loginData.username);
                            localStorage.setItem('password', $scope.loginData.password);
                        }
                        data = {
                            username: $scope.loginData.username,
                            password: $scope.loginData.password,
                            salt: resp.data.salt
                        };

                        $http.post(api_url + 'tokens', data, {}).success(function (data, status, headers, config) {
                            var str = data.replace('"', '');
                            str = str.split('||');
                            digest = str[0];
                            nonce = str[1];
                            created = str[2];
                            token = "UsernameToken Username=\"" + $scope.loginData.username + "\", PasswordDigest=\"" + digest + "\", Nonce=\"" + nonce + "\", Created=\"" + created + "\"";
                            sessionStorage.setItem("token", token);
                            $cordovaToast.show('Identification réussie', 'short', 'center');
                            console.log('success identification');
                        })
                                .error(function (err, status) {
                                    $cordovaDialogs.alert('Login ou mot de passe incorrect', 'Erreur');
                                    console.log('error');
                                });
                    }, function (err) {
                        $cordovaDialogs.alert('Login inconnu', 'Erreur');
                        console.error('ERR', err);
                    });
                }
                else{
                    $cordovaDialogs.alert('Merci de renseigner votre login et votre mot de passe ', 'Erreur');
                }
            };

            $scope.openBrowser = function (url) {
                $cordovaInAppBrowser.open(url, '_blank').then(function (event) {
                    // success
                }, function (event) {
                    alert(event);
                });
            };
        })

        .controller('SearchCtrl', function ($scope, $rootScope, $http, $ionicPopup, Cities, $cordovaKeyboard, $ionicHistory) {
            $scope.dataSearch = {};
            $scope.cities_search = [];
            $scope.showPopup = function () {
                $scope.dataSearch = [];
                $cordovaKeyboard.show();
                var myPopup = $ionicPopup.show({
                    template: '<label class="item item-input">' +
                            '<i class="icon ion-search placeholder-icon"></i><input type="search" ng-model="dataSearch.query" ng-keypress="searchByQuery(dataSearch.query)">' +
                            '</label> ',
                    title: 'Entrer le nom d\'une ville',
                    subTitle: 'les 3 premières lettres suffisent',
                    scope: $scope,
                    buttons: [
                        {text: 'Annuler',
                          onTap: function (e) {
                              $ionicHistory.goBack();
                          }  },
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
                myPopup.then(function (res) {
                    Cities.searchCity(res).then(function (resp) {
                        $scope.cities_search = resp;
                        //myPopup.close();
                    });
                    console.log('Resultat : ', res);
                });
            };

            $scope.searchByQuery = function (query) {
                if (query.length > 1) {
                    Cities.searchCity(query).then(function (resp) {
                        $scope.cities_search = resp;
                    });
                }
            };

            $scope.addCity = Cities.addCity;

            $scope.deleteCity = Cities.deleteCity;

            $scope.isFavorite = Cities.isFavorite;

            $scope.showPopup();
        });



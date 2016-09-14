angular.module('starter.controllers', [])

        .controller('MapCtrl', function ($scope, $rootScope, $state, $ionicLoading, $ionicModal,
                                            $cordovaDialogs, $compile, Playgrounds, $cordovaSplashscreen, $ionicSlideBoxDelegate) {            
            var infowindow;
            var markers =[];
            
            $rootScope.distance = 5;
            
            $scope.slideIndex = 0;
            
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
               if (map){
                        map.setCenter({lat: $rootScope.latitude, lng: $rootScope.longitude});
                    }
               //todo push new playground and marker
            });
            
            $scope.next = function () {                
                $ionicSlideBoxDelegate.next(1000);
                $scope.slideIndex = 1;
            };
            
            $scope.previous = function () {
                $ionicSlideBoxDelegate.previous(1000);
                $scope.slideIndex = 0;
            };
            
            $scope.slideChanged = function (index) {
                $scope.slideIndex = index;
            };
            
            $scope.disableSwipe = function() {
                $ionicSlideBoxDelegate.enableSlide(false);
            };
            
            $scope.message = "Chargement de la carte...";
            $scope.classSpinner = "";
            
            function initialize() {
                
                /*$ionicLoading.show({
                    template: '<ion-spinner class="spinner max-index" icon="ios"></ion-spinner>',
                    duration: 5000,
                    showBackDrop: true
                });*/
                $scope.$on('$ionicView.loaded', function (viewInfo, state) {
                map = map || new google.maps.Map(document.getElementById("map"));
                google.maps.event.addListenerOnce(map, 'idle', function(){
                    //$cordovaSplashscreen.hide();
                    //$ionicLoading.hide();
                    $scope.message = "";
                    $scope.classSpinner = "hide";
                    
                    setTimeout(function() {
                        //$cordovaSplashscreen.hide()
                    }, 5000)
                    
                });
                });
                navigator.geolocation.getCurrentPosition(function (pos) {
                    $rootScope.latitude = pos.coords.latitude;
                    $rootScope.longitude = pos.coords.longitude;
                   
                    var myLatlng = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                    var mapOptions = {
                        center: myLatlng,
                        zoom: 15,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        minZoom: 12
                    };
                      
                    //my position
                    GeoMarker = new GeolocationMarker();
                    GeoMarker.setCircleOptions({fillColor: '#808080'});
                    
                    //watchPosition include
                    GeoMarker.setMap(map);
                        
                    map.setOptions(mapOptions); 
                    
                    google.maps.event.addListener(GeoMarker, 'position_changed', function () {    
                        position = this.getPosition();                        
                        $rootScope.latitude = position.lat();
                        $rootScope.longitude = position.lng();
                        this.marker.setPosition(position);
                    });
                                                                                    
                    Playgrounds.getNearPlaygrounds($rootScope.latitude, $rootScope.longitude, $rootScope.perimeter).then(function (data) {
                        $rootScope.close_playgrounds = data;
                        //todo make a factory
                        createMarkers(map, data);
                        setMarkers(map, $rootScope.distance);
                    });

                    $rootScope.map = map;
                }, function (error) {
                    //center to paris
                    $rootScope.latitude = 48.857482;
                    $rootScope.longitude = 2.349272;
                    var mapOptions = {
                        center: new google.maps.LatLng(48.857482, 2.349272),
                        zoom: 12,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        minZoom: 12
                    };
                    map.setOptions(mapOptions);   
                    $cordovaDialogs.alert(error.message, 'Erreur de localisation');
                }, {maximumAge: 60000, timeout: 20000, enableHighAccuracy: true});
                
                document.addEventListener("resume", function() {
                    if (map){
                        map.setCenter({lat: $rootScope.latitude, lng: $rootScope.longitude});
                    }
                }, false);
            }
            ionic.Platform.ready(initialize);
            
            $scope.clickMarker = function (playgroundId) {
                $state.go('playground', {playgroundId: playgroundId});
                window.plugins.nativepagetransitions.slide({"type": "slide","direction": "up", "androiddelay": 800, "duration": 600, "triggerTransitionEvent": '$ionicView.beforeEnter', // internal ionic-native-transitions option 
                          "backInOppositeDirection": true}, function(){}, function(){});
                infowindow.close();
            };
            
            //todo make a factory
            function createMarkers(map, playgrounds, distance)
            {
                var myLatLng = new google.maps.LatLng($rootScope.latitude, $rootScope.longitude);
                for (var i = 0; i < playgrounds.length; i++) {                        
                    var playground = playgrounds[i];
                    
                        var latLng = new google.maps.LatLng(playground.latitude, playground.longitude);
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
                            map: null,
                            title: playground.nom,
                            icon: icon,
                            distance: playground.distanceKm
                        });

                        markers.push(marker);

                        google.maps.event.addListener(marker, 'click', getInfoCallback(map, compiled[0]));
                }
            }
            
            function setMarkers(map, distance){
                for (var i = 0; i < markers.length; i++) {
                    mark = markers[i];
                    if (mark.distance<distance){
                        mark.setMap(map);
                    }
                    else{
                        mark.setMap(null);
                    }
                }
            }
            
            //todo make a factory
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
                 $rootScope.limitPlay = 15;
                 //center map
                 if (map){
                     map.setCenter({lat: $rootScope.latitude, lng: $rootScope.longitude});
                 }
                 $rootScope.close_playgrounds = [];
                 deleteMarkers();
                 Playgrounds.getNearPlaygrounds($rootScope.latitude, $rootScope.longitude, $rootScope.perimeter).then(function (data) {
                        $rootScope.close_playgrounds = data;
                        createMarkers(map, data);
                        setMarkers(map, $rootScope.distance);
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
            //modal window for parameters
            $ionicModal.fromTemplateUrl('templates/parameter_modal.html', {
                scope: $scope
            }).then(function (modal) {
                $scope.modal_parameter = modal;
            });

            $scope.closeParameter = function () {
                $scope.modal_parameter.hide();
            };

            // Open the parameter modal
            $scope.parameter = function () {
               $scope.modal_parameter.show();
            };
            
            $scope.doParameter = function(distance) {
                $scope.modal_parameter.hide();
                $rootScope.distance = distance;
                setMarkers(map, distance);                
            };
        })
        .controller('AddCtrl', function ($scope, $rootScope, $state, Playgrounds, Cities, $cordovaDialogs, $cordovaCamera, MapUtils) {      
            
            $scope.$on('$ionicView.beforeEnter', function (viewInfo, state) {
                if (!sessionStorage.getItem('token')) {
                    //TODO : add button to go to account or use broadcast $rootScope.broadcast("interdiction");
                    $cordovaDialogs.alert('Vous devez être identifié pour ajouter une aire de jeux !', 'Interdiction').then(function(){$state.go('tab.compte');});
                    
                }
                else {
                    //get closest cities by directive ville-selected
                    /*$scope.options = [];

                    Cities.getCloseCities().then(function (returnedData) {
                        for (i in returnedData) {
                            $scope.options.push({id: returnedData[i].nom + "|" + returnedData[i].code, 
                                                label: returnedData[i].nom, 
                                                value: returnedData[i].nom + "|" + returnedData[i].code});
                        }
                        $scope.finishSearch = true;
                    });
                    $scope.finishSearch = false;*/
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
            MapUtils.getAdresse().then(function(returnData){
                $scope.playgroundData.ville_str = returnData.ville+'|'+returnData.code;
                $scope.playgroundData.ville = returnData.ville+' ('+returnData.code+')';
            });

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
                    Playgrounds.new(dataPost, {"X-WSSE": sessionStorage.getItem('token')});
                }
                else{
                    $cordovaDialogs.alert(message, 'Erreur formulaire');
                }
            };

            //take picture
            $scope.getPhoto = function () {
                var options = {
                    quality: 50,
                    destinationType: Camera.DestinationType.DATA_URL,
                    encodingType: Camera.EncodingType.JPEG,
                    targetWidth: 500,
                    targetHeight: 500,
                    popoverOptions: CameraPopoverOptions,
                    correctOrientation: true,
                    saveToPhotoAlbum: false
                  };

                  $cordovaCamera.getPicture(options).then(function(imageData) {
                    $scope.lastPhoto = "data:image/jpeg;base64," + imageData;
                    $scope.playgroundData.img64 = imageData;
                    $rootScope.$broadcast('scroll:bottom');
                  }, function(err) {
                    console.log(err);
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
                                                $ionicModal, $cordovaDialogs, $ionicHistory, Playgrounds, $cordovaCamera,
                                                $ionicPopup, $state, $cordovaSocialSharing, $ionicScrollDelegate) {            
            
            $scope.slideIndex = 0;
            $ionicScrollDelegate.resize();
            $scope.next = function () {
                $ionicSlideBoxDelegate.next();
                $scope.slideIndex = 1;
            };
            $scope.previous = function () {
                $ionicSlideBoxDelegate.previous();
                $scope.slideIndex = 0;
                $ionicScrollDelegate.resize();
            };
            $scope.slideChanged = function (index) {
                $scope.slideIndex = index;
                $ionicSlideBoxDelegate.update();
                $ionicScrollDelegate.scrollTop(true);
            };

            $scope.dataPlayground = [];
            
            var playgroundId = $stateParams.playgroundId;

            $scope.dataPlayground = Playgrounds.get(playgroundId);
            
            $ionicSlideBoxDelegate.update();

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
                focusFirstInput: true
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
                    var options = {
                    quality: 50,
                    destinationType: Camera.DestinationType.DATA_URL,
                    encodingType: Camera.EncodingType.JPEG,
                    correctOrientation: true,
                    targetWidth: 500,
                    targetHeight: 500,
                    popoverOptions: CameraPopoverOptions,
                    saveToPhotoAlbum: false
                  };

                  $cordovaCamera.getPicture(options).then(function(imageData) {
                      dataImg = {
                                  aire_id: $scope.dataPlayground.id,
                                  img64: imageData
                                };
                        $scope.showConfirm(dataImg); 
                  }, function(err) {
                      alert(err);
                    console.log(err);
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
                                //send image                                
                                Playgrounds.changePicture(dataImg, {"X-WSSE": sessionStorage.getItem('token')}).then(function (resp) {})
                                .finally(function () {
                                    $scope.doRefresh($scope.dataPlayground.id);
                                    //TODO change src image and NOT refresh
                                });
                              } else {
                                console.log('not ok photo');
                              }
                            });
                          };
            

            $scope.goBack = function () {
                if ($scope.slideIndex == 1){
                    $scope.previous();
                }
                else{
                    $ionicHistory.goBack();
                }
            };

            $scope.doRefresh = function (playgroundId) {
                //$scope.dataPlayground = [];
                Playgrounds.getPlaygroundById(playgroundId).then(function (result) {
                   $scope.$broadcast('scroll.refreshComplete');
                   $state.go($state.current, {playgroundId:playgroundId}, {reload:true});
               });
            };
        })

        .controller('PlaygroundsCtrl', function ($scope, $rootScope, $stateParams, Playgrounds) {
            $scope.$on('$ionicView.beforeLeave', function (viewInfo, state) {
                $rootScope.limitPlay = 15;
            });
            
            $scope.playgrounds = [];
            var cityId = $stateParams.cityId;

            Playgrounds.getPlaygroundsByCity(cityId).then(function (returnedData) {
                for (i in returnedData) {
                    $scope.playgrounds = returnedData;
                }
            });
        })

        .controller('CitiesCtrl', function ($scope, $stateParams, Cities, $ionicHistory) {
            //get cities
            $scope.cities = [];
            $scope.cities_favorites = [];
            var zoneId = $stateParams.zoneId;
            $scope.search = '';
            
            if ($ionicHistory.currentStateName() === 'tab.cities') {
                Cities.getCitiesByZone(zoneId).then(function (returnedData) {
                    $scope.cities = returnedData;
                });
                
                $scope.cities_favorites = Cities.getAllFavorites();
            }
            else{
                Cities.getCitiesByFavorite().then(function (returnedData) {
                    $scope.cities_favorites = returnedData;
                });
            }
            
            $scope.addCity = Cities.addCity;

            $scope.deleteCity = Cities.deleteCity;

            $scope.isFavorite = Cities.isFavorite;
            
            $scope.goBack = function () {
                $ionicHistory.goBack();
            };
        })

        .controller('FavoritesCtrl', function ($scope, Favorites, $cordovaToast, $ionicPopover) {
            
            $scope.departs = [];
            
            data = JSON.parse(localStorage.getItem('departs'));
                         
            for (var i in data) {
                $scope.departs[i]={
                    id: data[i].id,
                    'value': data[i].value,
                    'code': data[i].code,
                    'nom': data[i].nom
                }                 
            };
            
            $scope.record = function () {
                localStorage.setItem('favorites', JSON.stringify($scope.favorites));
                $cordovaToast.show('Enregistrement réussi', 'short', 'center');
            };

            $scope.doRefresh = function () {
                Favorites.getDeparts().then(function (returnedData) {
                    $scope.departs = returnedData;
                    localStorage.setItem('departs', JSON.stringify(returnedData));
                    $scope.$broadcast('scroll.refreshComplete');
                }, function (error) {
                    console.error('get zones failed');
                    try {
                        $scope.departs = JSON.parse(localStorage.getItem('departs'));
                    } catch (e) {
                        console.error("Exception: " + e);
                        return false;
                    }
                });
            };
                        
            $ionicPopover.fromTemplateUrl('templates/favorite_popover.html', {
                scope: $scope,
              }).then(function(popover) {
                $scope.popover = popover;
            });

        })

        .controller('CompteCtrl', function ($scope, $http, $cordovaToast, $cordovaDialogs, Account, $ionicModal, $cordovaCamera) {

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
            
            $scope.resetting = function() {
                if ($scope.loginData.username && $scope.loginData.username != ''){
                        Account.resetting($scope.loginData.username);
                }                
                else{
                   $cordovaDialogs.alert('Merci de renseigner votre login ou votre email ', 'Erreur'); 
                }
            };
            
            
            $scope.registerData = {username:'', email:'', password:''};
            $ionicModal.fromTemplateUrl('templates/register_modal.html', {
                scope: $scope,
                animation: 'slide-in-left',
                hideDelay:1020,
                focusFirstInput: true
            }).then(function (modal) {
                $scope.register_modal = modal;
            });

            // Triggered in the comment modal to close it
            $scope.closeRegister = function () {
                $scope.register_modal.hide();                
            };

            // Open the comment modal
            $scope.register = function () {
                $scope.register_modal.show();
            };

            // Perform the register action when the user submits the register form
            $scope.doRegister = function () {
                if (this.register_form.$valid){
                console.log('Doing comment', $scope.registerData);
                dataRegister = {
                    username: $scope.registerData.username,
                    email: $scope.registerData.email,
                    password: $scope.registerData.password,
                    img64: $scope.registerData.avatar64
                };
                console.log("add new user");
                Account.register(dataRegister).then(function (resp) {
                }).catch(function (err) {
                }).finally(function () {
                    $scope.register_modal.hide();
                });
                }
                else{
                   $cordovaDialogs.alert('Merci de remplir tous les champs', 'Erreur du formulaire');  
                }
                
            };
            
            //$scope.lastAvatar = 'img/avatar_default.png';
            /*var ctx = document.querySelector('#avatar').getContext('2d');
            var img = new Image();
            img.src = "img/avatar_default.png";
            img.onload = function(){
                ctx.drawImage(img, 0, 0);};*/
            $scope.choiceList = [
                { text: "Appareil photo", value: "0", icon:"ion-camera" },
                { text: "Librairie", value: "1", icon:"ion-images" }
              ];
            $scope.data = { choiceModel: "1"};              
            
            $scope.lastAvatar = "img/avatar_default.png";
            
            $scope.getAvatar = function() {                
                var options = {
                    quality: 80,
                    destinationType: Camera.DestinationType.DATA_URL,
                    encodingType: Camera.EncodingType.JPEG,
                    sourceType: ($scope.data.choiceModel == "0"? Camera.PictureSourceType.CAMERA: Camera.PictureSourceType.PHOTOLIBRARY),
                    correctOrientation: true,
                    targetWidth: 200,
                    targetHeight: 200,
                    popoverOptions: CameraPopoverOptions,
                    saveToPhotoAlbum: false
                  };

                  $cordovaCamera.getPicture(options).then(function(imageData) {
                     $scope.lastAvatar = "data:image/jpeg;base64," + imageData;
                     $scope.registerData.avatar64 = imageData;
                  }, function(err) {                      
                    console.log(err);
                  });
            };
        })

        .controller('SearchCtrl', function ($scope, $ionicPopup, Cities, $ionicHistory, $timeout) {
            $scope.dataSearch = {};
            $scope.cities_search = [];
            $scope.showPopup = function () {
                $scope.dataSearch = [];
                $timeout(function() {
                if(window.cordova && window.cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.show();
                }
                }, 150);
                var myPopup = $ionicPopup.show({
                    template: '<label class="item item-input">' +
                            '<i class="icon ion-search placeholder-icon"></i><input type="search" autofocus ng-model="dataSearch.query" ng-keypress="searchByQuery(dataSearch.query)">' +
                            '</label> ',
                    title: 'Entrer le nom d\'une ville',
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
                                cordova.plugins.Keyboard.close();
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



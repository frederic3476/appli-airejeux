angular.module('starter.directives', [])

        .directive('textarea', function () {
            return {
                restrict: 'E',
                link: function (scope, element, attr) {
                    var update = function () {
                        //element.css("height", "auto");
                        var height = element[0].scrollHeight;
                        element.css("height", element[0].scrollHeight + "px");
                    };
                    scope.$watch(attr.ngModel, function () {
                        update();
                    });
                }
            };
        })
        
        .directive('noteDisplay', function(){
           return{
               restrict: 'E',
               replace: true,
               scope:{ average:"@average"},
               
               link: function(scope, elem, attr){
                   scope.notes = [];
                   for (var i = 0; i<5; i+=0.5){
                       scope.notes.push({left:(i%1)==0, full:i+0.5<=scope.average});
                   }
               },
               
               template: '<span ng-repeat="note in notes"'+ 
                       ' ng-class="{\'left\':note.left, \'right\':!note.left, \'empty\': !note.full, \'full\': note.full}"'+
                       ' class="casquette big" </span>'
            };
        })
        
        .directive('imageonload', function() {
            return {
              restrict: 'A',
              link: function(scope, element, attrs) {
                  element.bind('load', function() {
                      this.src= attrs.loadingSrc;
                      if (attrs.loadingClass){
                          this.className= attrs.loadingClass;
                      }
                  });
                  element.bind('error', function(){
                       cosole.log('image could not be loaded');
                  });
              }
            };
          })
          
         .directive('noteTransform', function(){
             return {
                 restrict: 'A',
                 replace: false,
                 template: "{{ newAverage }}",
                 scope: {average:"@"},
                 link: function(scope, element, attrs) {                      
                     scope.newAverage = scope.average.toString().replace('.', ',');
                 }
             };
             
          })
          
        .directive('villeSelected', function(Cities) {
            return {
                restrict: 'E',
                require: 'ngModel',
                scope: { items: '=', val: '=ngModel'},
                template:'<div><span ng-if="!finishSearch">Recherche en cours...</span>'+
                    '<select ng-if="finishSearch" name="ville_str" ng-options="opt.id as opt.label for opt in options" ng-model="val" required>'+
                    '</select></div>',
                replace: true,
                link: function(scope, element, attrs){
                        scope.finishSearch = true;
                    }
                };
        })
        /*.directive('getAdress', ['MapUtils',function(mapUtils){
            return {
                restrict: 'E',
                replace: true,
                template: '<span>ville: {{city}}</span>',
                link: function (scope, element, attrs) {
                   
                  scope.city = mapUtils.getAdress();
                   alert(mapUtils.getAdress());
                }
            }
        }])*/
        .directive('goNative', ['$ionicGesture', '$ionicPlatform', function($ionicGesture, $ionicPlatform) {
            return {
            restrict: 'A',

            link: function(scope, element, attrs) {

              $ionicGesture.on('tap', function(e) {

                var direction = attrs.direction;
                var transitiontype = attrs.transitiontype;
                var delay = attrs.delay || 300;
                var duration = attrs.duration || 400;

                $ionicPlatform.ready(function() {

                  switch (transitiontype) {
                    case "slide":
                      window.plugins.nativepagetransitions.slide({
                          "direction": direction,
                          "androiddelay": delay,
                          "duration": duration,
                          "triggerTransitionEvent": '$ionicView.beforeEnter', // internal ionic-native-transitions option 
                          "backInOppositeDirection": true
                        },
                        function(msg) {
                          console.log("success: " + msg)
                        },
                        function(msg) {
                          alert("error: " + msg)
                        }
                      );
                      break;
                    case "flip":
                      window.plugins.nativepagetransitions.flip({
                          "direction": direction
                        },
                        function(msg) {
                          console.log("success: " + msg)
                        },
                        function(msg) {
                          alert("error: " + msg)
                        }
                      );
                      break;

                    case "fade":
                      window.plugins.nativepagetransitions.fade({
                        },
                        function(msg) {
                          console.log("success: " + msg)
                        },
                        function(msg) {
                          alert("error: " + msg)
                        }
                      );
                      break;

                    case "drawer":
                      window.plugins.nativepagetransitions.drawer({
                          "origin"         : direction,
                          "action"         : "open"
                        },
                        function(msg) {
                          console.log("success: " + msg)
                        },
                        function(msg) {
                          alert("error: " + msg)
                        }
                      );
                      break;

                    case "curl":
                      window.plugins.nativepagetransitions.curl({
                          "direction": direction
                        },
                        function(msg) {
                          console.log("success: " + msg)
                        },
                        function(msg) {
                          alert("error: " + msg)
                        }
                      );
                      break;              

                    default:
                      window.plugins.nativepagetransitions.slide({
                          "direction": direction
                        },
                        function(msg) {
                          console.log("success: " + msg)
                        },
                        function(msg) {
                          alert("error: " + msg)
                        }
                      );
                  }


                });
              }, element);
            }
  };
}]);
  

        



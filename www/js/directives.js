angular.module('starter.directives', [])

        .directive('textarea', function () {
            return {
                restrict: 'E',
                link: function (scope, element, attr) {
                    var update = function () {
                        element.css("height", "auto");
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
                  //element.src="img/spinner.gif";
                  element.bind('load', function() {
                      //alert(this.src);
                      //alert('image is loaded');
                      //this.className="zoomIn";
                      this.src= attrs.loadingSrc;
                      if (attrs.loadingClass){
                          this.className= attrs.loadingClass;
                      }
                  });
                  element.bind('error', function(){
                       //alert('image could not be loaded');
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

        .directive('distance', function($rootScope, MapUtils){
           return{
               restrict: 'E',
               scope: false,
               link: function(scope, element, attrs) {
                   $rootScope.$watch('latitude', function(newValue, oldValue){
                       scope.update();                        
                   });
               }
           };
          })
          
        .directive('distance2', function($rootScope, MapUtils){  
            return{
               restrict: 'E',
               scope:{distance:"@distance"},
               template:'',
               link: function(scope, element, attrs) {
                   $rootScope.$watch('latitude', function(newValue, oldValue){
                       
                   });
               } 
            };
        })
          
         ;  

        



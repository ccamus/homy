
/**************** CONTROLLER DE L'ACCUEIL *********************/
function accueilController($scope,$http,$window){
	$scope.creUser=function(){
		$http.post('/addUser',$scope.userCreate)
			.success(function(data){
				$scope.userCreate="";
			})
			.error(function(data){
			})
	}
	$scope.login=function(){
		$http.post('/login', $scope.loginUser)
			.success(function(data){
				$scope.loginUser="";
				$scope.logged=true;
				$scope.user=data;
				
				$window.location.href="/homy";
			})
			.error(function(data){
			})
		$route.reload();
	}
	
	$http.get('/alreadyauthenticated')
		.success(function(data){
			// On est loggé, donc on redirige
			$window.location.href="/homy";
		})
		.error(function(data){
			// Pas loggé
		})
	var r = Math.floor((Math.random() * 2) + 1);
	$scope.img="/image/accueil00"+r+".jpg";
	$('#popover').popover();

}

/**************** CONTROLLER DU MENU **************************/
function headController($scope,$http,$route,$window){

	$scope.alreadyLogged=function(){
		$http.get('/alreadyauthenticated')
			.success(function(data){
				$scope.logged=false;
				if(data.nom!=null){
					$scope.logged=true;
					$scope.user=data;
				}
			})
			.error(function(data){
				$window.location.href="/";
			})
	}
	$scope.logoff=function(){
		$http.get('/logoff')
			.success(function(data){
				$scope.logged=false;
				$window.location.href="/";
			})
			.error(function(data){
			})
	}
	$scope.alreadyLogged();
}

/**************** CONTROLLER DE L'ACCUEIL *********************/
function homeController($scope,$http){
		
	$scope.listAccueil=function(){
		// Enchainement d'actions
		// On test si l'utilisateur est connecté
		$http.get('/alreadyauthenticated')
		.then(function(retour0){
			$scope.logged=true;
			// Si il l'est on le retiend et on lance l'opération suivante, la recherche de paramètres
			return $http.get('/findParams');
		},function(retour0){
			$scope.logged=false;
			// Sinon on s'arrête là
			throw(401);
		})
		.then(function(retour1){
			// Si tout est bon, on stock les paramètres et on liste les habitats
			$scope.params=retour1.data;
			return $http.get('/listHabitats');
		})
		.then(function(retour2){
			// Enfin on stock les habitats			
			var listHabitats =[];
			var lesHabitats = retour2.data;
			for (var key in lesHabitats) {
				var habitat = lesHabitats[key];
				if(habitat.prix>$scope.params.budget){
					habitat.color='list-group-item-danger';
					habitat.alert='Budget dépassé';
				}
				listHabitats.push(habitat);
			}
			$scope.listHabitats=listHabitats;
		})
	}
	
	
	$scope.listAccueil();
}

/**************** CONTROLLER DU PARAMETRAGE *******************/
function paramController($scope,$http){
	
	$scope.messageAlert="";
	$scope.success=false;
	$scope.error=false;
	
	$scope.saveParams=function(){
		$http.post('/saveParams',$scope.paramEdit)
			.success(function(data){
				
				$scope.messageAlert="Paramètres enregistrés.";
				$scope.success=true;
			})
			.error(function(data){
				$scope.messageAlert="Erreur lors de la sauvegarde.";
				$scope.error=true;
			})
	}
	
	$http.get('/findParams')
		.success(function(data){
			$scope.paramEdit=data;
		})
	
}

/**************** CONTROLLER DE L'EDITION D'HABITAT ***********/
function editHabitatController($scope,$http,$route){
				
	$scope.messageAlert="";
	$scope.success=false;
	$scope.error=false;
	
	$scope.saveHabitat=function(){
		$http.post('/saveHabitat',$scope.habitatEdit)
			.success(function(data){
				
				$scope.messageAlert="Habitat enregistré.";
				$scope.success=true;
			})
			.error(function(data){
				$scope.messageAlert="Erreur lors de la sauvegarde.";
				$scope.error=true;
			})
	}
	
	var idHabit = $route.current.params.idHabit;
	if(idHabit!=null){
		$http.get('/findHabitat/'+idHabit)
			.success(function(data){
				$scope.habitatEdit=data;
			})
	}
}

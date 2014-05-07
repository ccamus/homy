/**************** INCLUDES ************************************/
var express = require('express');
var connect = require('connect');
var nStore = require('nstore');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
nStore = nStore.extend(require('nstore/query')());

/**************** DEFINITION DE L'APPLICATION *****************/
var app = express();
app.use(bodyParser.urlencoded())
app.use(bodyParser.json())
app.use(cookieParser('homy'));
app.use(session({secret: "homy"}));
app.use('/javaScript', express.static(__dirname + '/app/javascript'));
app.use('/lib', express.static(__dirname + '/app/lib'));
app.use('/image', express.static(__dirname + '/app/image'));
app.use('/css', express.static(__dirname + '/app/css'));
app.use('/template', express.static(__dirname + '/app/template'));

/**************** CHARGEMENT DE LA BDD ************************/
users = nStore.new('data/user.db');
habitats = nStore.new('data/habitats.db');
params = nStore.new('data/params.db');
var connectedUsers = [];

/*-----------------------------------------------------
 *************  DEFINITION DES ROUTES  ****************
 ----------------------------------------------------*/
app.get('/', function (req, res) {
	res.sendfile(__dirname + '/app/home.html');
});
app.get('/homy', function (req, res) {
	res.sendfile(__dirname + '/app/app.html');
});

/**************** GESTIONS DES UTILISATEURS *******************/
app.post('/addUser', function (req, res) {
	var codeRetour = 200;
	var user = req.body;
	users.save(null, user, function(err, key) {
        if (err) {
			codeRetour=409;
            console.log("Erreur : ", err);
        } else {
            user.id = key;
        }
    });
	res.send(codeRetour);
});
app.get('/listUsers', function(req, res){
	users.all(function(err, results) {
		if (err) {
			console.log("Erreur : ", err);
			res.json(err);
		} else {
			var listUsers = [];
			for (var key in results) {
				var user = results[key];
				user.id = key;
				listUsers.push(user);
			}
			res.json(listUsers);
		}
	});
});
app.post('/login', function(req, res){
	var user = req.body;
	if (findUserByMail(user.mail)) {
		res.json({infos: "Utilisateur déjà connecté"})
	} else {
		 //Je cherche l'utilisateur dans la base de données
		users.find({mail: user.mail, mdp: user.mdp},
		function(err, results) {
			if (err) {
				res.json(err);
			} else {
				//J'ai trouvé l'utilisateur
				var key = Object.keys(results)[0];
				if (key) {
					var authenticatedUser = results[key];
					//Je rajoute l'id de session à l'objet utilisateur

					authenticatedUser.key = key;
					authenticatedUser.sessionID = req.sessionID;

					//Ajouter l'utilisateur authentifié à la liste des utilisateurs connectés
					connectedUsers.push(authenticatedUser);

					//Je renvoie au navigateur les informations de l'utilisateur
					res.json({
						mail: authenticatedUser.mail,
						nom: authenticatedUser.nom,
						prenom: authenticatedUser.prenom
					});
				} else {
					res.send(401);
				}
			}
		});
	}
});
app.get('/logoff', function(req, res) {

	//Je recherche l'utilisateur courant parmi les utilisateurs connectés
	var alreadyAuthenticatedUser = findUserBySession(req.sessionID);

	if (alreadyAuthenticatedUser) {
		//Je l'ai trouvé, je le supprime de la liste des utilisateurs connectés
		var posInArray = connectedUsers.indexOf(alreadyAuthenticatedUser);
		connectedUsers.splice(posInArray, 1);
		res.json({state: "disconnected"});
	} else {
		res.json({});
	}

});

app.get('/alreadyauthenticated', function(req, res) {

	var alreadyAuthenticatedUser = findUserBySession(req.sessionID);

	//Si je suis déjà authentifié, renvoyer les informations utilisateur
	if (alreadyAuthenticatedUser) {
		res.json({
			nom: alreadyAuthenticatedUser.nom,
			prenom: alreadyAuthenticatedUser.prenom,
			mail: alreadyAuthenticatedUser.mail
		});
	} else {
		res.send(401);
	}

});

/**************** GESTIONS DES HABITATS ***********************/
app.post('/saveHabitat', function(req, res){
	var user = findUserBySession(req.sessionID);
	
	if(user==null){
		res.send(401);
	}else{
	
		var habitat = req.body;		
		habitat.userKey=user.key;
		
		habitats.save(habitat.id, habitat, function(err, key) {
			if (err) {
				console.log("Erreur : ", err);
				res.send(409);
			} else {
				res.send(200);
			}
		});
	}
});

app.get('/listHabitats', function(req, res){
	var user = findUserBySession(req.sessionID);
	
	if(user==null){
		res.send(401);
	}else{
	
		habitats.find({userKey:user.key},
			function(err, results) {
				if (err) {
					res.json(err);
				} else {
					var listHabitats = [];
					for (var key in results) {
						var habitat = results[key];
						habitat.id = key;
						habitat.haveLink = habitat.linkAnnonce!="";
						listHabitats.push(habitat);
					}
					res.json(listHabitats);
				}
		});
	}
});

app.get('/findHabitat/:id', function(req, res){
	var user = findUserBySession(req.sessionID);
	var habitatId = req.params.id;
	
	if(user==null){
		res.send(401);
	}else{
		habitats.get(habitatId,
			function(err, result, key) {
				if (err) {
					res.json(err);
				} else {
					if (result.userKey == user.key) {
						var habitat = result;
						habitat.id=key;
						res.json(habitat);
					}else {
						res.send(401);
					}
				}
			});
	}
});

/**************** GESTIONS DES PARAMETRES *********************/
app.post('/saveParams', function(req, res){
	var user = findUserBySession(req.sessionID);
	
	if(user==null){
		res.send(401);
	}else{
	
		var paramsToSave = req.body;
		params.save(user.key, paramsToSave, function(err, key) {
			if (err) {
				console.log("Erreur : ", err);
				res.send(409);
			} else {
				res.send(200);
			}
		});
	}
});

app.get('/findParams', function(req, res){
	var user = findUserBySession(req.sessionID);
	
	if(user==null){
		res.send(401);
	}else{
		params.get(user.key,
			function(err, result, key) {
				if (err) {
					console.log("Erreur : ", err);
					res.json(err);
				} else {
					res.json(result);
				}
			});
	}
});

/*-----------------------------------------------------
 ******************************************************
 ----------------------------------------------------*/
 // Production
//app.listen(3000);
 // Dev
app.listen(8080);



function findUserByMail(email) {
    /*
     Permet de vérifier si un utilisateur est déjà loggé
     */
    return connectedUsers.filter(function(user) {
        return user.email == email;
    })[0];
}

function findUserBySession(sessionID) {
    /*
     Permet de retrouver un utilisateur par son id de session
     */
    return connectedUsers.filter(function(user) {
        return user.sessionID == sessionID;
    })[0];

}

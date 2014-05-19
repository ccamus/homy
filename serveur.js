/**************** INCLUDES ************************************/
var express = require('express');
var connect = require('connect');
var nStore = require('nstore');
var async = require('async');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var session = require('express-session');
var bigInt = require("big-integer");

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

app.get('/delHabitat/:id', function(req, res){
	var user = findUserBySession(req.sessionID);
	var habitatId = req.params.id;
	
	if(user==null){
		res.send(401);
	}else{
		var canDelete = false;
		habitats.get(habitatId,
			function(err, result, key) {
				if (err) {
					res.json(err);
				} else {
					if (result.userKey == user.key) {
						// Ici on peut supprimer car l'enregistrement existe et qu'il est bien associé à l'utilisateur
						habitats.remove(habitatId,function(err){
								if (err) {
									res.json(err);
								}else{
									res.send(200);
								}
							});
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

app.get('/reloadNotes', function(req, res){
	var user = findUserBySession(req.sessionID);
	async.waterfall(
		[
			function(callback) {findParam(user.key, callback)},// Recherche des paramètres
			function(arg1, arg2,callback) {remplitY(arg1, arg2, callback)}, // Création du Y
			function(arg1, arg2,arg3,callback){calculNoteHabitats(arg1, arg2,arg3,callback)},// Calcul des notes des habitats
			function(callback) {res.send(200);}// Si tout s'est bien passé, on envoie ok
		],function (err, result) {
			// Errreur, on affiche et on envoie KO
			console.log(err);
			res.send(409);
		});
});
	

/*-----------------------------------------------------
 ******************************************************
 ----------------------------------------------------*/
 // Production
//app.listen(3000);
 // Dev
app.listen(8080);

/**
 * Calcul la note pour l'habitat donné, aves les paramètres données
 * @param habitat l'habitat dont il faut calculer la note
 * @param param les paramètres de l'utilisateur
 * @leY table des extrêmes
 * @return l'habitat avec la nouvelle note
 */
function calculNoteHabitats(cleUtilisateur,param,leY,callback){
	// On commence par rechercher tous les habitats de l'utilisateur
	habitats.find({userKey:cleUtilisateur},
		function (err, results) {
			if(err){
				// Une erreur ? KABOOM !
				callback(err);
			}else{
				try{
					for (var key in results) {
						var habitat = results[key];	
						var totRes = bigInt();
						var totPourcentage = bigInt();
						
						// Note personelle
						if(habitat.note != null
							&& param.prefNotePers!=null && param.prefNotePers>0){
							var res1 = bigInt(10 * habitat.note);
							totRes=totRes.add(res1.multiply(bigInt(param.prefNotePers)));
							totPourcentage=totPourcentage.add(bigInt(param.prefNotePers));
						}
						
						// Année de construction
						if(leY.annee!=null && leY.annee>0 && habitat.annee!=null && habitat.annee > 0
							&& param.prefAnneeCons!=null && param.prefAnneeCons>0){
							var y = getUnsigned(param.anneeSouhaite - habitat.annee);
							var res2 = bigInt(parseInt(100 - (y * (100/leY.annee))));
							totRes=totRes.add(res2.multiply(bigInt(param.prefAnneeCons)));
							totPourcentage=totPourcentage.add(bigInt(param.prefAnneeCons));
						}
						
						// Surface habitable
						if(habitat.surfH != null && habitat.surfH >0
							&& leY.surfH!=null && leY.surfH>0
							&& param.prefSurfH!=null && param.prefSurfH>0){
							var res3 = bigInt(parseInt(habitat.surfH * (100 / leY.surfH)));
							totRes=totRes.add(res3.multiply(bigInt(param.prefSurfH)));
							totPourcentage=totPourcentage.add(bigInt(param.prefSurfH));
						}
						
						// Surface de terrain
						if(habitat.surfT!=null
							&& leY.surfT!=null && leY.surfT>0
							&& param.prefSurfT!=null && param.prefSurfT>0){
							var y = getUnsigned(param.surfTSouhaite - habitat.surfT);
							var res4 = bigInt(parseInt(100 - (y*(100/leY.surfT))));
							totRes=totRes.add(res4.multiply(bigInt(param.prefSurfT)));
							totPourcentage=totPourcentage.add(bigInt(param.prefSurfT));
						}
						
						// Nombre d'étages
						if(habitat.nbEtage!=null
							&& leY.nbEtages!=null && leY.nbEtages>0
							&& param.prefEtages!=null && param.prefEtages>0){
							var y = getUnsigned(param.nbEtagesSouhaite - habitat.nbEtage);
							var res5 = bigInt(parseInt(100 - (y*(100/leY.nbEtages))));
							totRes=totRes.add(res5.multiply(bigInt(param.prefEtages)));
							totPourcentage=totPourcentage.add(bigInt(param.prefEtages));
						}
						
						// Nombre de pièces
						if(habitat.nbPiece!=null && habitat.nbPiece>0
							&& leY.nbPieces!=null && leY.nbPieces>0
							&& param.prefNbPieces!=null && param.prefNbPieces>0){
							var res6 = bigInt(parseInt(habitat.nbPiece*(100/leY.nbPieces)));
							totRes=totRes.add(res6.multiply(bigInt(param.prefNbPieces)));
							totPourcentage=totPourcentage.add(bigInt(param.prefNbPieces));
						}
						
						// Nombre de chambres
						if(habitat.nbCh!=null
							&& leY.nbCh!=null && leY.nbCh>0
							&& param.prefNbCh!=null && param.prefNbCh>0){
							var y = getUnsigned(param.nbChSouhaite - habitat.nbCh);
							var res7 = bigInt(parseInt(100 - (y*(100/leY.nbCh))));
							totRes=totRes.add(res7.multiply(bigInt(param.nbChSouhaite)));
							totPourcentage=totPourcentage.add(bigInt(param.nbChSouhaite));
						}
						
						// Nombre de salles de bain
						if(habitat.sdb!=null
							&& leY.nbSdb!=null && leY.nbSdb>0
							&& param.prefNbSdb!=null && param.prefNbSdb>0){
							var res8 = bigInt(parseInt(habitat.sdb*(100/leY.nbSdb)));
							totRes=totRes.add(res8.multiply(bigInt(param.prefNbSdb)));
							totPourcentage=totPourcentage.add(bigInt(param.prefNbSdb));
						}
						
						// Nombre de WC
						if(habitat.wc!=null
							&& leY.nbWc!=null && leY.nbWc>0
							&& param.prefNbWc!=null && param.prefNbWc>0){
							var res9 = bigInt(parseInt(habitat.wc*(100/leY.nbWc)));
							totRes=totRes.add(res9.multiply(bigInt(param.prefNbWc)));
							totPourcentage=totPourcentage.add(bigInt(param.prefNbWc));
						}
						
						// Indice DPE
						if(habitat.dpe!=null && habitat.dpe>0
							&& param.prefDpe!=null && param.prefDpe>0){
							var res10 = bigInt(parseInt((7-habitat.dpe)*(100/7)));
							totRes=totRes.add(res10.multiply(bigInt(param.prefDpe)));
							totPourcentage=totPourcentage.add(bigInt(param.prefDpe));
						}
						
						// Indice GES
						if(habitat.ges!=null && habitat.ges>0
							&& param.prefGes!=null && param.prefGes>0){
							var res11 = bigInt(parseInt((7-habitat.ges)*(100/7)));
							totRes=totRes.add(res11.multiply(bigInt(param.prefGes)));
							totPourcentage=totPourcentage.add(bigInt(param.prefGes));
						}
						
						// Coût de l'énergie
						if(habitat.coutEnergie!=null
							&& leY.energie!=null && leY.energie>0
							&& param.prefCoutEnergie!=null && param.prefCoutEnergie>0){
							var res12 = bigInt(parseInt(100 - (habitat.coutEnergie*(100/leY.energie))));
							totRes=totRes.add(res12.multiply(bigInt(param.prefCoutEnergie)));
							totPourcentage=totPourcentage.add(bigInt(param.prefCoutEnergie));
						}
						
						// Taxe d'habitation
						if(habitat.tHab!=null
							&& leY.txHab!=null && leY.txHab>0
							&& param.prefTxHab!=null && param.prefTxHab>0){
							var res13 = bigInt(parseInt(100 - (habitat.tHab*(100/leY.txHab))));
							totRes=totRes.add(res13.multiply(bigInt(param.prefTxHab)));
							totPourcentage=totPourcentage.add(bigInt(param.prefTxHab));
						}
						
						if(totPourcentage!=null && totPourcentage.greater(0)){
							// Ici, on peut calculer la note, on la calcul donc, et on sauvegarde
							var finalResult = totRes.divide(totPourcentage);
							habitat.noteCalcul = finalResult.toString();
							habitats.save(key, habitat, function(err, key) {
								if (err) {
									console.log("Erreur : ", err);
									callback(err);
								}
							});
						}
					}
					callback();
				}catch(err){
					console.log(err);
					callback(err);
				}
			}
		});
}

/**
 * Méthode de remplissage des Y.
 * @param cleUtilisateur clé de l'utilisateur
 * @param param les paramètres utilisateur
 * @return leY
 */
function remplitY(cleUtilisateur, param,callback){
	// On commence par rechercher tous les habitats de l'utilisateur
	habitats.find({userKey:cleUtilisateur},
		function (err, results) {
			if(err){
				// Une erreur ? KABOOM !
				callback(err);
			}else{
				var leY = {};
				for (var key in results) {
					var habitat = results[key];
					// On va scruter chaque habitat, et remplir les y en fonction de ceux-ci
					
					if(param.anneeSouhaite != null && habitat.annee != null &&
						(leY.annee == null ||
							leY.annee < getUnsigned(param.anneeSouhaite-habitat.annee))){
						/*
						 * Si le paramètre ainsi que l'habitat sont correctement remplis
						 * et que le y est null ou inférieur au calcul du y de l'habitat,
						 * alors on enregistre
						 */
						leY.annee=getUnsigned(param.anneeSouhaite-habitat.annee);
					}
					
					if(habitat.surfH!=null && (leY.surfH == null ||
						leY.surfH < habitat.surfH)){
						/*
						 * Si l'habitat est correctement remplit, et
						 * si le y est null ou s'il est inférieur à la surface de l'habitat, on enregistre
						 */
						leY.surfH=habitat.surfH;
					}
					
					if(param.surfTSouhaite != null && habitat.surfT != null &&
						(leY.surfT == null ||
							leY.surfT < getUnsigned(param.surfTSouhaite-habitat.surfT))){
						leY.surfT=getUnsigned(param.surfTSouhaite-habitat.surfT);
					}
					
					if(param.nbEtagesSouhaite != null && habitat.nbEtage != null &&
						(leY.nbEtages == null ||
							leY.nbEtages < getUnsigned(param.nbEtagesSouhaite-habitat.nbEtage))){
						leY.nbEtages=getUnsigned(param.nbEtagesSouhaite-habitat.nbEtage);
					}
					
					if(habitat.nbPiece!=null && (leY.nbPieces == null ||
						leY.nbPieces < habitat.nbPiece)){
						leY.nbPieces=habitat.nbPiece;
					}
					
					if(param.nbChSouhaite != null && habitat.nbCh != null &&
						(leY.nbCh == null ||
							leY.nbCh < getUnsigned(param.nbChSouhaite-habitat.nbCh))){
						leY.nbCh=getUnsigned(param.nbChSouhaite-habitat.nbCh);
					}
					
					if(habitat.sdb!=null && (leY.nbSdb == null ||
						leY.nbSdb < habitat.sdb)){
						leY.nbSdb=habitat.sdb;
					}
					
					if(habitat.wc!=null && (leY.nbWc == null ||
						leY.nbWc < habitat.wc)){
						leY.nbWc=habitat.wc;
					}
					
					if(habitat.coutEnergie!=null && (leY.energie == null ||
						leY.energie < habitat.coutEnergie)){
						leY.energie=habitat.coutEnergie;
					}
					
					if(habitat.tHab!=null && (leY.txHab == null ||
						leY.txHab < habitat.tHab)){
						leY.txHab=habitat.tHab;
					}
				}
				callback(err,cleUtilisateur,param,leY);				
			}			
		}
	);
}

/**
 * Récupère les paramètres d'un utilisateur
 * @param userKey clé de l'utilisateur
 * @param callback callback
 * @return callback contenant la clé user ainsi que les paramètres
 */
function findParam(userKey,callback){
	params.get(userKey,
		function(err, result, key) {
			var param = result;
			param.key=key;
			callback(err, userKey, param);
		});
}

/*
 * Récupère un entier non signé 
 */
function getUnsigned(x){
	if(x<0){
		x = -1 * x;
	}
	return x;
}

/*
 Permet de vérifier si un utilisateur est déjà loggé
 */
function findUserByMail(email) {
    return connectedUsers.filter(function(user) {
        return user.email == email;
    })[0];
}

/*
 Permet de retrouver un utilisateur par son id de session
 */
function findUserBySession(sessionID) {
    return connectedUsers.filter(function(user) {
        return user.sessionID == sessionID;
    })[0];

}

# Définition du système de note #

## Introduction ##
Le système de note va permettre à un utilisateur d'ordonner la liste des habitats créés en fonction de paramètres qu'il aurait définit en amont.

## Définition ##
### Périmètre ###
Le système de note sera utilisable pour les champs suivants :
  * Note personnelle
  * Année de construction
  * Surface habitable
  * Surface de terrain
  * Nombre d'étages
  * Nombre de pièces
  * Nombre de chambres
  * Nombre de salles de bain
  * Nombre de WC
  * Indice DPE
  * Indice GES
  * Coût de l'énergie
  * Taxe d'habitation
### Paramétrage ###
On paramètre en pourcentage, 0% indique qu'on s'en moque, 100% indique que c'est très important.
Pour la plupart des notes, plus c'est grand ou petit, et mieux c'est, c'est une évidence. Mais pour certaines notes, il faudra paramétrer de la valeur dont laquelle on veut se rapprocher. Voici la liste exhaustive de ces paramètres :
  * Année de construction
  * Surface de terrain
  * Nombre d'étages
  * Nombre de chambres
### Calcul ###
L'idée est, dans un premier temps, de tout ramener sur 100 : (ici x est la valeur à rapporter sur 100)
  * Res1 = 10 `*` x (Note personnelle)
  * Res2 = 100 - (y`*`(100/(plus grand y))) avec y = unsigned(Année pramétrée - x) (Année de construction)
  * Res3 = x`*`(100/(plus grand x)) (Surface habitable)
  * Res4 = 100 - (y`*`(100/(plus grand y))) avec y = unsigned(Terrain paramétré - x) (Surface de terrain)
  * Res5 = 100 - (y`*`(100/(plus grand y))) avec y = unsigned(Etages paramétré - x) (Nombre d'étages)
  * Res6 = x`*`(100/(plus grand x)) (Nombre de pièces)
  * Res7 = 100 - (y`*`(100/(plus grand y))) avec y = unsigned(Chambres paramétré - x) (Nombre de chambres)
  * Res8 = x`*`(100/(plus grand x)) (Nombre de salles de bain)
  * Res9 = x`*`(100/(plus grand x)) (Nombre de WC)
  * Res10 = (7 - x) `*` (100/7) (Indice DPE)
  * Res11 = (7 - x) `*` (100/7) (Indice GES)
  * Res12 = 100 - (x`*`(100/(plus grand x))) (Coût de l'énergie)
  * Res13 = 100 - (x`*`(100/(plus grand x))) (Taxe d'habitation)
Ensuite, on multiplie par les pourcentage, et on ramène à une base 100 :
RESULTAT FINAL = (Res1 `*` %1 + Res2 `*` %2 + Res3 `*` %3 + Res4 `*` %4 + Res5 `*` %5 + Res6 `*` %6 + Res7 `*` %7 + Res8 `*` %8 + Res9 `*` %9 + Res10 `*` %10 + Res11 `*` %11 + Res12 `*` %12 + Res13 `*` %13) / ( %1 + %2 + %3 + %4 + %5 + %6 + %7 + %8 + %9 + %10 + %11 + %12 + %13)
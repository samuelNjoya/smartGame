# Navigation
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npm install react-native-reanimated react-native-screens
npm install react-native-gesture-handler

# Animations et Icônes
npx expo install moti lottie-react-native
npx expo install react-native-vector-icons
npx expo install @expo/vector-icons
# (Pour MaterialCommunityIcons, suivez la configuration dans le lien de la doc expo)
# Pour les effets de flou (optionnel mais recommandé)
expo install expo-blur

# Persistance
npx expo install @react-native-async-storage/async-storage

# audio
npx expo install expo-av

# Utilitaires (pour les tests) 
npm install --save-dev jest @types/jest

#
Allez sur le site LottieFiles.com.

Dans la barre de recherche, tapez "trophy" ou "winner".

Trouvez une animation gratuite qui vous plaît.

Cliquez dessus, puis trouvez le bouton de téléchargement et sélectionnez "Download JSON" (ou "Lottie JSON").


rmdir /s /q node_modules
del package-lock.json

npm install --legacy-peer-deps // ne t'inquete pas des sous dependances installe seulement ce qui est dans mon package.json
npx expo install --fix-deps //lire la version d'expo et installer les choses mises a jour

npx expo-doctor
npx expo-doctor --fix-dependencies

rmdir /s /q node_modules && del package-lock.json
 supprime le node_module et package json et npm install pour encore tout installer

 npm cache clean --force 
 npm install --legacy-peer-deps
 npx expo install --check
 npx expo-doctor
 npx expo doctor

 Félicitations ! 🎉 C'est un succès majeur !

Le processus de nettoyage et de réinstallation a fonctionné. L'étape clé (npm install --legacy-peer-deps) a pris 7 minutes et a installé 719 paquets sans erreur critique ni blocage réseau.

L'erreur concernant node_modules est mineure : elle signifie simplement que le dossier avait déjà été supprimé ou renommé lors d'une tentative précédente, mais cela n'a pas empêché la suite.

✅ Vérification Finale de l'État du Projet

Maintenant que toutes vos dépendances sont installées et synchronisées (grâce aux versions enregistrées dans votre package.json par expo install --check et installées par npm install --legacy-peer-deps

# react est en rouge Crtl + Shift + P et tu tape Reload Window puis entrer 

modifier et ajouter les icone sur les boutons d'actions et ajouter aussi un bouton pour quitter

# pour les icones et gradien
npm install expo-linear-gradient react-native-vector-icons
# pour netoyer / gerer le splash
npx expo start --clear
npx expo install expo-splash-screen

# pour les sons et vibration 
https://pixabay.com +
https://mixkit.co/free-sound-effects/ +++++++

import { Audio } from 'expo-av';  npx expo install expo-av
import * as Haptics from 'expo-haptics'; // Optionnel pour les vibrations
expo install expo-haptics vibration

# expo notification 
afficher les informations sur l'ecran via expo-notifications
integration d'une lampe torche et d'un stroboscope via expo-camera
utilisation du GPS de l'appareil via expo-location et affichage de la localisation react-native-maps

Stockage Local : Utilisez expo-sqlite pour des données structurées complexes (liste de produits, notes, parcours) ou expo-file-system pour des fichiers (images, exports). AsyncStorage est bien pour de petites données simples.

# pour compresser les images 
Optimizilla (compresse JPEG, PNG, GIF, jusqu'à 20 images simultanément) :
https://imagecompressor.com/fr/
pour creer les images et vidéos 
https://www.seaart.ai/fr

Compressor.io (compresse JPEG, PNG, GIF avec haute qualité) :
https://compressor.io

TinyPNG (compresse PNG et JPG, téléchargements groupés au format zip) :
https://tinypng.com

# graph plus dependance
npx expo install react-native-chart-kit react-native-svg

# Analyse la taille du bundle
npx expo-analyzer
# pour verifier ce qui prend de la place
npm install -g expo-analyzer

# Voir les plus gros modules
npx expo-analyzer --size
# Arbre des dépendances
npx expo-analyzer --tree
# Suggestions d'optimisation
npx expo-analyzer --suggest
# Voir les dépendances les plus lourdes
npx expo-analyzer --tree

# pour reduire la taille
npx expo install expo-build-properties
dans app.json ajouter
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "enableProguardInReleaseBuilds": true, //optimisation du code et performance pour -20% taille
            "enableShrinkResourcesInReleaseBuilds": true, //supprimeles ressources unitilisées-10% taille
            "useLegacyPackaging": true // +compatibilité, -taille
            // Ton APK devient BEAUCOUP plus gros
            "useLegacyPackaging": true → APK: 35-40MB impossible de publier sur play store et telechargL
            "useLegacyPackaging": false → AAB: 15-25MB (download)
          }
        }
      ]
    ]
  }
}

dans app.json  "newArchEnabled": false, pour reduire la taille entre 40 et 50 Mo de 81 a 41 mais cause pb

# supprime le node_module et package json et npm install pour encore tout installer
rmdir /s /q node_modules && del package-lock.json

# pour installer  EAS expo application service
npm install -g eas-cli
eas login //se connecter a expo samuel24 et mon mot de passe
eas build:configure //configurer le projet une seule fois cree le fichier eas.json
eas whoami se rassurer d'etre connecter

<!-- lien final expire le 29/12 -->
https://expo.dev/accounts/samuel24/projects/smart-games/builds/90e39452-84bb-4a42-8635-de09a5b21246
eas build -p android --profile preview  //lancer la generation d'un apk installable partout
eas build -p android --profile production  // en production 
npx expo prebuild --clean
apres avoir ajouter "android": {
        "buildType": "app-bundle"
      } dans eas.json


eas build --platform android --local //bluid local beacoups plus rapide Nécessite Android SDK / Java installé sur ton PC Rapide, gratuit, mais ça nécessite Android Studio installé.

# bluidia.space
pour coder les apps https://play.google.com/console/signup





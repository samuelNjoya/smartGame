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


# Plan de Migration vers une PWA avec Next.js

Ce guide détaille les étapes pour transformer ce projet Next.js en Progressive Web App (PWA) à l’aide de la librairie `next-pwa`.

---

## 1. Installer la librairie `next-pwa`

Utilisez votre gestionnaire de paquets préféré :

```bash
pnpm add next-pwa
# ou
npm install next-pwa
```

---

## 2. Configurer `next.config.js` ou `next.config.ts`

Ajoutez la configuration suivante :

```js
// next.config.js ou next.config.ts
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  // disable: process.env.NODE_ENV === 'development', // Optionnel : désactive le SW en dev
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ...votre configuration Next.js existante
};

module.exports = withPWA(nextConfig);
```

---

## 3. Créer le fichier `manifest.json`

Dans le dossier `public/`, ajoutez un fichier `manifest.json` :

```json
{
  "name": "Nom de votre application",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 4. Ajouter les icônes de l’application

Placez vos icônes dans `public/icons/` :
- `icon-192x192.png`
- `icon-512x512.png`

Vous pouvez générer ces icônes à partir d’un logo avec des outils en ligne (ex : [https://realfavicongenerator.net/](https://realfavicongenerator.net/)).

---

## 5. Lier le manifest dans le layout principal

Dans `app/layout.tsx` (ou `_app.js` selon votre structure) :

```jsx
// ...
<link rel="manifest" href="/manifest.json" />
// ...
```

Ajoutez aussi :
```jsx
<meta name="theme-color" content="#2563eb" />
```

---

## 6. Tester la PWA

- Lancez votre app en production :
  ```bash
  pnpm build && pnpm start
  # ou
  npm run build && npm start
  ```
- Ouvrez dans Chrome, puis :
  - Outils de développement > Application > PWA
  - Vérifiez l’installation, le mode hors-ligne, et le manifest

---

## 7. Conseils pratiques

- **Désactivez le Service Worker en développement** pour éviter les problèmes de cache.
- **Personnalisez la page offline** si besoin (voir la doc `next-pwa`).
## 7.5. Expérience Utilisateur : Comment installer la PWA sur mobile ?

L'installation d'une PWA sur l'écran d'accueil varie selon le système d'exploitation mobile.

### Sur Android (Navigateur Chrome) - Expérience Proactive

Chrome est très proactif pour suggérer l'installation d'une PWA :
- **Mini-infobar :** Après un certain engagement avec le site, Chrome affiche automatiquement une petite bannière en bas de l'écran proposant "Ajouter [Nom de votre App] à l'écran d'accueil".
- **Option dans le menu :** L'utilisateur peut aussi trouver l'option "Installer l'application" ou "Ajouter à l'écran d'accueil" dans le menu de Chrome (les trois points verticaux).

### Sur iPhone (Navigateur Safari) - Expérience Manuelle

Apple est plus réservé, l'installation est entièrement manuelle :
- **Pas de bannière automatique :** Safari ne propose jamais d'installer la PWA.
- **Via le bouton "Partager" :** L'utilisateur doit :
    1. Appuyer sur l'icône "Partager" (le carré avec une flèche vers le haut).
    2. Faire défiler les options et sélectionner "Sur l'écran d'accueil" ("Add to Home Screen").

### Guider l'utilisateur (Bonne Pratique)

Puisque l'installation n'est pas toujours évidente, il est recommandé d'ajouter votre propre bouton "Installer" dans l'interface de votre application.
- **Détection :** Utilisez l'événement `beforeinstallprompt` (sur Android) pour afficher ce bouton.
- **Action :** Au clic, déclenchez l'invite d'installation native (`prompt()`).
- **Pour iOS :** Si l'événement n'est pas supporté, affichez des instructions visuelles expliquant comment utiliser le bouton "Partager" de Safari.

---

## 8. Prochaines Étapes & Améliorations

Une fois la PWA de base fonctionnelle, vous pouvez l'enrichir avec des fonctionnalités avancées pour une expérience encore plus proche du natif.

### a. Stratégie de Cache pour les Données (API)

Par défaut, `next-pwa` met en cache les pages et les assets. Pour les données dynamiques, vous pouvez définir une stratégie de cache explicite. La plus courante est `StaleWhileRevalidate`:

1.  L'utilisateur demande des données (ex: la liste des factures).
2.  Le Service Worker sert **instantanément** les données depuis le cache (si disponibles).
3.  En même temps, il envoie une requête au réseau pour récupérer les données à jour.
4.  Quand les nouvelles données arrivent, il met à jour le cache pour la prochaine visite.

**Comment ?** Dans `next.config.js`, ajoutez une configuration `runtimeCaching` dans les options de `next-pwa`.

### b. Notifications Push

Engagez vos utilisateurs en leur envoyant des notifications, même quand l'application est fermée.

- **Cas d'usage :** "Une nouvelle facture a été créée", "Rappel : la facture #123 arrive à échéance".
- **Comment ?** Nécessite de mettre en place une logique pour demander la permission de l'utilisateur, de souscrire aux notifications push, et un serveur pour envoyer les messages (ce qui peut être fait via une API Route Next.js).

### c. Synchronisation en Arrière-Plan (Background Sync)

Permettez à vos utilisateurs d'effectuer des actions même sans connexion internet.

- **Cas d'usage :** Un utilisateur remplit le formulaire de création de facture en étant hors ligne. L'application sauvegarde la requête. Dès que la connexion est rétablie, le Service Worker envoie automatiquement les données au serveur.
- **Comment ?** Utilisation de l'API `BackgroundSyncManager` dans votre Service Worker.

### d. Interface Utilisateur Adaptative

Améliorez l'UX en informant l'utilisateur de l'état de la connexion.

- **Comment ?**
  - Utilisez les événements `online` et `offline` du navigateur pour détecter les changements de connexion.
  - Affichez un petit bandeau "Vous êtes actuellement hors ligne. Certaines fonctionnalités peuvent être limitées."
  - Désactivez les boutons d'action qui nécessitent une connexion si la synchronisation en arrière-plan n'est pas implémentée.

---

**Félicitations !** Votre application Next.js est maintenant une PWA 🚀 

---

## 9. Exemple : Bouton d'installation PWA (Android/Chrome)

Sur Android/Chrome, il est possible d'afficher un bouton personnalisé pour proposer l'installation de la PWA. Voici un exemple de composant React :

```jsx
import React, { useEffect, useState } from 'react';

export default function InstallPwaButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    // Optionnel : gérer le résultat ("accepted" ou "dismissed")
    setDeferredPrompt(null);
    setShowButton(false);
  };

  if (!showButton) return null;

  return (
    <button onClick={handleInstallClick} style={{ padding: '1em', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px' }}>
      Installer l'application
    </button>
  );
}
```

**À placer dans un composant global ou dans le layout.**

### Pour iOS (Safari)
Sur iOS, il n'est pas possible de déclencher l'installation par code. Affichez plutôt un message d'aide, par exemple :

```jsx
// Pseudo-code
if (isIos && !isInStandaloneMode) {
  // Afficher une bannière :
  // "Pour installer l'application, cliquez sur 'Partager' puis 'Sur l'écran d'accueil'"
}
```

---

**Astuce :**
- Utilisez une librairie comme `react-device-detect` pour détecter la plateforme et adapter l'affichage du bouton ou du message d'aide.
- Testez sur plusieurs navigateurs et appareils pour garantir la meilleure expérience utilisateur. 
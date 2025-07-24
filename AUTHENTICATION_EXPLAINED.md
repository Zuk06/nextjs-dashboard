# Architecture d'Authentification avec NextAuth.js

Ce document explique le fonctionnement du système d'authentification mis en place dans ce projet. Le but est de clarifier le rôle de chaque fichier et de montrer comment ils interagissent pour sécuriser l'application.

## Les Acteurs Principaux (Le rôle de chaque fichier)

L'authentification repose sur l'interaction de plusieurs fichiers clés. Voici qui fait quoi :

### 1. `auth.config.ts`
- **Rôle :** Les règles de base et la configuration de la redirection.
- **Utilité :** C'est ici que l'on définit les "règles du jeu". La partie la plus importante est la section `callbacks.authorized`. C'est elle qui contient la logique pour décider si un utilisateur est autorisé à accéder à une page. C'est cette configuration qui sera utilisée par le middleware.

### 2. `middleware.ts`
- **Rôle :** Le **portier** ou le **videur** de votre application.
- **Utilité :** Ce fichier est le point d'entrée pour la sécurité. **Il s'exécute avant que la page ne soit rendue**. Son travail est très simple :
    1. Il intercepte une requête vers une page protégée (définie par le `matcher`).
    2. Il prend la session de l'utilisateur et la passe à la fonction `authorized` de votre `auth.config.ts`.
    3. Si `authorized` renvoie `true`, le middleware laisse l'utilisateur passer.
    4. Si `authorized` renvoie `false`, le middleware **redirige l'utilisateur** vers la page de connexion.
- **Le middleware ne gère PAS la connexion lui-même.** Il ne fait que vérifier si l'utilisateur a un "ticket valide" (une session).

#### La Magie du Middleware : Comment est-il activé ?

C'est le point le plus important à comprendre : **vous n'appelez jamais ce fichier directement**.

Next.js a une convention spéciale : **s'il trouve un fichier nommé `middleware.ts` à la racine du projet, il l'active automatiquement comme un "gardien" pour l'ensemble de votre site.**

C'est donc le **nom et l'emplacement du fichier** qui le rendent actif. Il se place entre l'utilisateur et vos pages, et vérifie chaque requête qui correspond aux règles du `matcher`.

### 3. `app/lib/actions/users.actions.ts`
- **Rôle :** La logique métier de la connexion.
- **Utilité :** Ce fichier contient la fonction `authenticate`. C'est une **Server Action** qui est appelée **uniquement** lorsque l'utilisateur soumet le formulaire de connexion. Son travail est de :
    1. Recevoir l'email et le mot de passe.
    2. Appeler la fonction `signIn` de NextAuth pour tenter de créer une session.
    3. Gérer les erreurs spécifiques (ex: "Mauvais identifiants") et les renvoyer au formulaire.

### 4. `auth.ts`
- **Rôle :** Le moteur principal de NextAuth.js.
- **Utilité :** C'est ici que l'on initialise NextAuth avec toutes ses "stratégies". La partie la plus importante est la stratégie `credentials`. C'est elle qui :
    1. Définit comment vérifier un email et un mot de passe.
    2. Interroge la base de données pour trouver l'utilisateur.
    3. Vérifie si le mot de passe est correct avec `bcrypt`.
    4. Si tout est bon, elle renvoie l'objet `user`, que NextAuth utilisera pour créer la session.

### 5. `app/ui/login-form.tsx`
- **Rôle :** La porte d'entrée.
- **Utilité :** C'est le composant React que l'utilisateur voit. Il utilise le hook `useActionState` pour appeler la Server Action `authenticate` et afficher les messages d'erreur si la connexion échoue.

---

## Comment tout cela fonctionne ensemble ? Le Scénario Complet

Voici le déroulement, étape par étape, qui explique comment le middleware "gère tout".

**Scénario : Un utilisateur non connecté essaie d'accéder à `/dashboard/invoices`.**

1.  **La Requête Arrive :** L'utilisateur tape l'URL ou clique sur un lien.
2.  **Le Middleware Intervient :** Avant même que Next.js ne commence à construire la page, le `middleware.ts` s'exécute car l'URL correspond au `matcher`.
3.  **Vérification de l'Autorisation :** Le middleware appelle la logique de `auth.config.ts`. Il constate qu'il n'y a pas de session utilisateur valide. La fonction `authorized` renvoie `false`.
4.  **Redirection :** Le middleware bloque le rendu de la page `/dashboard/invoices` et renvoie une instruction de redirection vers `/login`. Le navigateur de l'utilisateur charge alors la page de connexion.
5.  **L'Utilisateur se Connecte :** L'utilisateur remplit le formulaire (`login-form.tsx`) et clique sur "Se connecter".
6.  **L'Action est Appelée :** Le formulaire déclenche la Server Action `authenticate` dans `users.actions.ts`.
7.  **La Magie de `signIn` :** L'action `authenticate` appelle `signIn('credentials', ...)`. Cette fonction déclenche à son tour la logique définie dans `auth.ts` : elle cherche l'utilisateur, vérifie son mot de passe.
8.  **Création de la Session :** Si les identifiants sont corrects, NextAuth crée une session et envoie un **cookie de session `HttpOnly`** sécurisé au navigateur.
9.  **Redirection Post-Connexion :** Par défaut, après un `signIn` réussi, NextAuth redirige l'utilisateur vers la page qu'il essayait d'accéder initialement (`/dashboard/invoices`).
10. **Nouvelle Tentative d'Accès :** Le navigateur fait une nouvelle requête pour `/dashboard/invoices`.
11. **Le Middleware Intervient (encore) :** Le middleware s'exécute à nouveau.
12. **Autorisation Accordée :** Cette fois, le middleware voit le cookie de session valide. Il appelle la logique de `auth.config.ts` qui, cette fois, renvoie `true`.
13. **Accès à la Page :** Le middleware laisse passer la requête. Next.js rend la page `/dashboard/invoices` et l'envoie à l'utilisateur.

### Conclusion : Le Rôle du Middleware

Le `middleware.ts` ne gère pas tout, mais il est le **chef d'orchestre de la sécurité des pages**. Son rôle n'est pas d'authentifier, mais de **protéger**. Il se contente de poser la question "As-tu le droit d'être ici ?" à chaque requête et de rediriger si la réponse est non.

C'est la combinaison du **middleware (pour la protection des routes)** et des **Server Actions (pour la logique de connexion)** qui crée un système d'authentification complet, sécurisé et efficace.

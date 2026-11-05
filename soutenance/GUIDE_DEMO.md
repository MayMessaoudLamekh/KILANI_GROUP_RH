# Guide de démonstration — Kilani HR

Vous avez **deux options** pour la démo (slide 12 « Démonstration ») :

- **Option A — la vidéo** : `soutenance/Demo_Kilani_HR.mp4` (4 min 25 s, sans son). Vous la lancez et vous parlez par-dessus. C'est la solution la plus sûre.
- **Option B — en direct** : vous suivez le scénario ci-dessous. Gardez la vidéo prête comme plan B.

---

## 1. Avant la soutenance (15 minutes avant)

1. Brancher le chargeur et activer le mode « Ne pas déranger ».
2. Lancer tout l'environnement :

```bash
zsh ~/kilani_hr_app/soutenance/lancer_demo.sh
```

Ce script démarre Docker, SQL Server, le serveur API (port 5050), le back-office (http://localhost:5173) et l'application sur le simulateur iPhone.

3. Remettre les données à zéro (le solde de Youssef revient à 9,75 jours) :

```bash
node ~/kilani_hr_app/soutenance/reset_demo.js
```

### Comptes de démonstration

Le mot de passe est le même pour tous : `password123`. Sur l'écran de connexion mobile, il y a des **boutons de sélection rapide**.

| Rôle | Matricule | Nom |
|---|---|---|
| Employé | EMP001 | Youssef Trabelsi |
| Manager (N+1) | MGR001 | Karim Ben Salah |
| RH | RH001 | Monia Ben Ahmed |

---

## 2. Le scénario (le même que dans la vidéo)

### Étape 1 — L'employé demande un congé (avec l'IA)
- **Je fais :** connexion **EMP001** → je montre le solde (**9,8 j**) → **Demander congé** → Congé annuel, Journée.
- **Je dis :** « L'application calcule toute seule : 1 jour, 8 heures. Le solde passera de 9,75 à 8,75 jours. »
- **Je fais :** **Vérifier la demande avec l'IA**.
- **Je dis :** « Avant l'envoi, l'IA vérifie mon solde et les collègues déjà absents dans mon service. » Ensuite, **Enregistrer et envoyer**.

### Étape 2 — Demande de mission
- **Je fais :** **Nouvelle mission** → objet « Réunion client », destination « Tunis », dates, transport → **Soumettre**.

### Étape 3 — Demande d'attestation
- **Je fais :** onglet **Attests** → **Nouvelle demande** → **Attestation de travail** → **Envoyer**. Puis déconnexion.

### Étape 4 — Le manager valide
- **Je fais :** connexion **MGR001** → carte **Validation Congés** → **Valider**. Puis retour à l'accueil → carte **Validation Missions** → **Valider**.
- **Je dis :** « Le manager valide, mais le solde ne bouge pas encore : il faut l'accord des RH. »

### Étape 5 — Les RH font la validation finale
- **Je fais :** connexion **RH001** → carte **Validation Congés** → **Valider**. Ensuite, menu **☰** → **Valider les attestations** → **Générer**.
- **Je dis :** « C'est la validation finale. Le solde est mis à jour automatiquement, et l'attestation PDF est créée. »

### Étape 6 — Résultat pour l'employé
- **Je fais :** connexion **EMP001** → le solde affiche **8,8 j** → onglet **Attests** → **Télécharger le document PDF** → **Aperçu** (le PDF officiel s'ouvre) → retour à l'app.
- **Je fais :** icône ✨ **Assistant RH** → « Combien de jours de congé me reste-t-il ? » → réponse : **8,75 jours**.

### Étape 7 — Le back-office RH (navigateur)
- **Je fais :** connexion **RH001** sur http://localhost:5173 → **Tableau de bord** → **Congés** (filtre Statut) → export **Excel : Tous** et **PDF : Tous** → **Missions** → **Excel** → **Attestations** → **Demandées (XLS)** et **Historique (PDF)**.
- **Je dis :** « Côté RH, on suit toutes les demandes, on filtre et on exporte en Excel ou en PDF. »

Les fichiers exportés pendant l'enregistrement sont dans `soutenance/exports_demo/` (vous pouvez les montrer si on vous les demande).

---

## 3. Plan B

- **L'IA ne répond pas** : le modèle Gemini est parfois surchargé (erreur 503). Je réessaie une fois. Si cela ne marche toujours pas, je lance la vidéo.
- **Le simulateur plante** : je lance la vidéo `Demo_Kilani_HR.mp4`.
- **Manque de temps** : je montre seulement les étapes 1, 5 et 6, ou la vidéo en accéléré.

---

## 4. Questions possibles du jury (réponses simples)

**Pourquoi Node.js et pas ASP.NET, comme dans le cahier des charges ?**
Le cahier dit « recommandé ». J'ai gardé SQL Server et Flutter comme demandé. Pour le serveur, Node.js est rapide pour une API REST, et pratique pour appeler l'IA et envoyer des e-mails en arrière-plan. Avec 8 semaines seule, c'était le choix le plus productif.

**Comment le solde reste-t-il correct ?**
Le solde baisse seulement à la validation RH, dans une transaction SQL. Si un congé est annulé, les jours sont rendus automatiquement.

**Comment est gérée la sécurité ?**
La connexion utilise un jeton JWT valable 24 h. Chaque route vérifie le rôle (RBAC) : un employé ne peut pas valider une demande.

**Comment l'IA évite-t-elle de dire des bêtises ?**
Je donne à Gemini le contexte exact de l'employé (nom, solde, règles, collègues absents). Je lui demande aussi des réponses courtes. Les conversations sont enregistrées dans la base.

**Qu'est-ce qui n'est pas encore fait ?**
- l'ordre de mission officiel en PDF (aujourd'hui, le back-office exporte seulement la liste des missions validées) ;
- les notifications push ;
- l'ajout automatique du droit mensuel au début de chaque mois.

---

## 5. Points techniques à connaître

### Corrections faites le 5 novembre (pour que la démo marche)
1. **Validation RH des congés** : le bouton n'existait nulle part. L'API était prête, mais l'écran mobile cachait le bouton après la validation du manager. Corrigé dans `mobile/lib/screens/validation_screen.dart`.
2. **Carte « Validation Congés »** de l'accueil manager/RH : elle ouvrait l'onglet Attestations au lieu de l'onglet Validation. Corrigé dans `mobile/lib/screens/dashboard_screen.dart`.
3. **Exports PDF du back-office** : ils ne marchaient pas du tout (`doc.autoTable is not a function` avec jspdf-autotable v5). Corrigé dans `backoffice/src/utils/exportUtils.js`.
4. **Affichage** : textes des boutons coupés (validation des attestations) et débordement de la liste des missions. Corrigé.

### Points qu'un jury technique peut remarquer
- **Mots de passe** : ils sont hachés en SHA-256, et non avec bcrypt comme le dit le rapport.
- **Mot de passe de test** : `password123` est accepté pour tous les comptes. C'est pratique pour la démo, mais à retirer en production.
- **Requêtes SQL** : certaines sont construites avec du texte collé, ce qui expose à l'injection SQL. Il faudrait des requêtes paramétrées.
- **Docker** : le rapport parle de Docker Compose, mais il n'y a pas de `docker-compose.yml` dans le projet.
- **Petits détails visibles** : le prénom de la RH est écrit « Moniaa » dans la base (on le voit sur le PDF). L'assistant affiche les `**` du gras au lieu de mettre le texte en gras. Le pied de page de l'attestation PDF tombe sur une 2e page.

Bonne réponse si on vous pose la question : « C'est une version de démonstration. Pour la production, je prévois bcrypt, les requêtes paramétrées et la suppression du mot de passe de test. »

Le readme suivant a été créé avec l'aide de GPT-3 en utilisant Collabi AI Studio
# Collabi AI Studio

Collabi AI Studio est une plateforme collaborative conçue pour améliorer le brainstorming et le partage d'idées entre les utilisateurs. Développée lors de Hack The North 2023, cette application permet aux utilisateurs de travailler ensemble en temps réel sur des prompts LLM (Language Model). De plus, elle permet aux utilisateurs d'insérer facilement les prompts développés dans un pipeline DevOps à l'aide de webhooks.
                                                                                                                        
![Capture d'écran de Collabi AI Studio](screenshot.png)
## Fonctionnalités
- **Collaboration en temps réel** : Plusieurs utilisateurs peuvent travailler simultanément sur des prompts LLM, ce qui rend le brainstorming plus efficace et attrayant.
- **Partage de prompts** : Les utilisateurs peuvent facilement partager des prompts avec leurs membres d'équipe, favorisant ainsi l'échange de connaissances et la génération d'idées.
- **Intégration DevOps** : Collabi AI Studio s'intègre parfaitement aux pipelines DevOps via des webhooks, permettant l'insertion de prompts pour un développement et un déploiement ultérieurs.
- **Interface conviviale** : L'interface utilisateur intuitive et réactive facilite la navigation et la collaboration.
                                                                                                                        
## Comment utiliser

### Prérequis
- [Bun](https://bun.sh)
- Expo
### Installation
1. Clonez le dépôt.
```bash
git clone https://github.com/espisesh-hacks/northhacking2023-penguin.git
```
2. Installez les dépendances requises.
```bash
cd northhacking2023-penguin/backend
bun install
```

3. Créez un fichier `.env` à la racine du répertoire du projet et ajoutez les variables d'environnement suivantes :
```bash
OPENAI_API_KEY==<OpenAI_Key>
PGUSER=<PostGres_User>
PGHOST=<PostGres_ServerIP>
PGDATABASE=collabi
PGPORT=<PostGres_-_port>```

4. Lancez le serveur.
```bash
bun run index.ts
```

5. Le serveur Back-end s'exécute maintenant à l'adresse : `http://localhost:3000`.

### Ajout de collaborateurs

1. Partagez votre ID de salle personnalisé avec les membres de votre équipe (par exemple, `collabi-devs`).

2. Une fois qu'ils ont rejoint la session, vous pouvez voir leurs curseurs et leurs modifications en temps réel.

### Insertion de prompts dans le pipeline DevOps
1. Configurez une URL de webhook vers votre pipeline DevOps.

2. Choisissez ou créez un projet dans Collabi AI Studio.

3. Sélectionnez le prompt souhaité et cliquez sur le bouton **Insérer dans le pipeline**.

4. Confirmez l'insertion en cliquant sur le bouton **Soumettre**.

## Technologies utilisées

- Node.js
- Express.js
- CockroachDB
- Expo
- Webhooks

## Contribution

Collabi AI Studio est un projet open-source et les contributions sont toujours les bienvenues ! Si vous avez des suggestions, des rapports de bug ou des demandes de fonctionnalités, veuillez soumettre une issue ou ouvrir une pull request.

## Auteurs

- Aron Ravikumar
- Seshan Ravikumar

## Licence

Ce projet est sous licence GNU AGPL. Voir le fichier [LICENSE](LICENSE) pour plus de détails.
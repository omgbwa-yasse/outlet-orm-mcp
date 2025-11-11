# Outlet ORM MCP Server - Guide de contribution

Merci de votre intérêt pour contribuer au serveur MCP Outlet ORM !

## Comment contribuer

### Signaler des bugs

Si vous trouvez un bug, veuillez ouvrir une issue avec :

1. Une description claire du problème
2. Les étapes pour reproduire
3. Le comportement attendu vs le comportement observé
4. Votre environnement (OS, version de Node.js, base de données)
5. Les logs d'erreur pertinents

### Proposer des fonctionnalités

Pour proposer une nouvelle fonctionnalité :

1. Vérifiez qu'elle n'existe pas déjà dans les issues
2. Ouvrez une issue décrivant :
   - Le cas d'usage
   - Le comportement souhaité
   - Des exemples d'utilisation
   - Pourquoi c'est utile

### Soumettre des Pull Requests

1. Forkez le projet
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Pushez vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

### Standards de code

- Utilisez des noms de variables descriptifs
- Commentez le code complexe
- Suivez les conventions JavaScript modernes (ES6+)
- Assurez-vous que le code fonctionne avec Node.js >= 18

### Tester vos changements

Avant de soumettre :

1. Testez avec l'inspecteur MCP :
   ```bash
   npx @modelcontextprotocol/inspector node index.js
   ```

2. Testez avec Claude Desktop
3. Vérifiez que tous les outils fonctionnent
4. Testez avec différentes bases de données si possible

### Documentation

Si vous ajoutez une fonctionnalité :

- Mettez à jour le README.md
- Ajoutez des exemples dans EXAMPLES.js
- Mettez à jour CHANGELOG.md

## Code de conduite

- Soyez respectueux et professionnel
- Acceptez les critiques constructives
- Concentrez-vous sur ce qui est meilleur pour la communauté
- Faites preuve d'empathie envers les autres

## Questions ?

N'hésitez pas à ouvrir une issue pour poser des questions !

Merci pour votre contribution ! 🙏

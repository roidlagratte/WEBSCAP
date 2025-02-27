require('dotenv').config();

const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');
const readline = require('readline');
const crypto = require('crypto');
const { Client } = require('ldapts');
const jwt = require("jsonwebtoken");
const app = express();

const PORT = process.env.PORT || 5000;
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'nobody';
const DB_PASS = process.env.DB_PASS || 'nobody';
const DB_NAME = process.env.DB_NAME || 'nobody';

const LDAP_URL = process.env.LDAP_URL || 'null';
const LDAP_BIND = process.env.LDAP_BIND || 'null';
const LDAP_SEARCH = process.env.LDAP_SEARCH || 'null';
const LDAP_FILTER = process.env.LDAP_FILTER || 'null';
const LDAP_PASS = process.env.LDAP_PASS || 'null';
const LDAP_ACTIVE = process.env.LDAP_ACTIVE || '0';

const JWT_SECRET = process.env.JWT_SECRET;
const USERS_FILE =  process.env.USERS_FILE;
// Middleware
app.use(cors());
app.use(express.json());

function sha512(password) {
  return crypto.createHash('sha512').update(password).digest('base64');
}

// Connexion à la base de données
const db = mysql.createConnection({
  host: `${DB_HOST}`,
  user: `${DB_USER}`,
  password: `${DB_PASS}`,
  database: `${DB_NAME}`,
});

db.connect((err) => {
  if (err) {
    console.error("Erreur de connexion à la base de données:", err);
    return;
  }
  console.log("Connecté à la base de données.");
});


function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) {
    return res.status(401).json({ error: "Token manquant" });
  }

  jwt.verify(token.split(" ")[1], JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token invalide" });
    }
    req.user = decoded; // Ajoute les données du token dans req.user
    next();
  });
}



// Fonction d'authentification LDAP avec débogage amélioré
async function authenticateUserLDAP(username, password) {
  console.log(`Tentative d'authentification LDAP pour l'utilisateur: ${username}`);
  const client = new Client({
    url: `${LDAP_URL}`,
    tlsOptions: { 
	    rejectUnauthorized: false,
	    ca: [fs.readFileSync('ca.pem')]
    }
  });

  try {
    console.log(`Connexion au serveur LDAP: ${LDAP_URL}`);
    await client.bind(`${LDAP_BIND}`, `${LDAP_PASS}`);
    console.log('Connexion réussie au serveur LDAPS');

    // Affichage du filtre de recherche LDAP
    const filterTemplate = process.env.LDAP_FILTER;  // Charger LDAP_FILTER depuis .env
    const searchFilter = filterTemplate.replace('${username}', username);  // Substitution dynamique
    // console.log(`Requête LDAP - Filtre de recherche: ${searchFilter}`);

    // Effectuer la recherche LDAP
    // console.log(`Exécution de la recherche LDAP à l'adresse: ${LDAP_SEARCH}`);
    const searchResult = await client.search(`${LDAP_SEARCH}`, {
      scope: 'sub',
      filter: searchFilter,
    });

    // Affichage des résultats de la recherche LDAP
    // console.log(`Résultats de la recherche LDAP - Nombre d'entrées: ${searchResult.searchEntries.length}`);

    if (searchResult.searchEntries.length === 0) {
      console.log('Utilisateur non trouvé dans LDAP');
      return false;
    }

    const userDN = searchResult.searchEntries[0].dn;
    //console.log(`Utilisateur trouvé avec DN: ${userDN}`);

    // Tentative de bind avec le DN de l'utilisateur
    console.log(`Tentative de bind avec DN utilisateur: ${userDN}`);
    await client.bind(userDN, password);
    console.log('Authentification LDAP réussie');
    
    return true;
  } catch (error) {
    // Gestion des erreurs avec détails
    console.error('Erreur lors de l\'authentification LDAP:');
    //console.error(`Message d'erreur: ${error.message}`);
    //console.error(`Stack trace: ${error.stack}`);
    return false;
  } finally {
    // Déconnexion du serveur LDAP
    //console.log('Déconnexion du serveur LDAP');
    await client.unbind();
    //console.log('Déconnexion réussie');
  }
}

const hashPass = (password) => {
  return crypto.createHash("sha512").update(password).digest("base64");
};


// Route pour récupérer les serveurs
app.get("/api/evaluation", (req, res) => {
  db.query(`
    WITH ranked_evaluations AS (
      SELECT
        e.*,
        ROW_NUMBER() OVER (PARTITION BY serveur, type ORDER BY datetest DESC) AS rank
      FROM evaluation e
      WHERE type IN ('conformite', 'vulnerabilites')
    )
    SELECT *
    FROM ranked_evaluations
    WHERE rank <= 5
    ORDER BY serveur, type, rank;
  `, (err, results) => {
    if (err) {
      console.error("Erreur SQL:", err);
      res.status(500).json({ error: "Erreur serveur" });
    } else {
      res.json(results);
    }
  });
});

// Route pour récupérer les détails d'une évaluation spécifique
app.get("/api/evaluation/:id", (req, res) => {
  const evaluationId = req.params.id;

  db.query("SELECT * FROM details WHERE eval = ?", [evaluationId], (err, results) => {
    if (err) {
      console.error("Erreur SQL:", err);
      res.status(500).json({ error: "Erreur serveur" });
    } else {
      res.json(results);
    }
  });
});

// Route pour récupérer les vulnérabilités
app.get("/api/vulnerability/:id", (req, res) => {
  const evaluationId = req.params.id;

  db.query("SELECT * FROM vulnerability WHERE eval = ?", [evaluationId], (err, results) => {
    if (err) {
      console.error("Erreur SQL:", err);
      res.status(500).json({ error: "Erreur serveur" });
    } else {
      res.json(results);
    }
  });
});

// Route pour récupérer les SI
app.get('/api/stats-get-si', (req, res) => {
  const query = 'SELECT DISTINCT SI FROM evaluation';
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results.map(row => row.SI));
  });
});

// Route pour récupérer les serveurs en fonction du SI
app.get('/api/stats-get-servers', (req, res) => {
  const { si } = req.query;
  if (!si || typeof si !== 'string' || si.length > 30) { // Exemple de validation: 'si' doit être une chaîne de caractères non vide et de longueur maximale 30
  	return res.status(400).json({ error: "Le paramètre 'si' est invalide." });
  }
  const query = 'SELECT DISTINCT serveur FROM evaluation WHERE SI = ?';
  db.query(query, [si], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results.map(row => row.serveur));
  });
});

// Route pour récupérer les données
app.get('/api/stats-get-data', (req, res) => {
  const { SI, serveur } = req.query;

  const query = `SELECT datetest, score, type, nb_vuln FROM evaluation WHERE SI=? AND serveur=? ORDER BY datetest ASC`;
  db.query(query, [SI, serveur], (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).send('Erreur lors de la récupération des données');
    } else {
      res.json(results);
    }
  });
});


// Route pour récupérer l'agrégation des évaluations par serveur
// Renvoie une seule ligne par serveur avec la dernière date pour chaque type (conformite et vulnerabilites)
// Si une des informations est absente pour un serveur, les colonnes correspondantes seront à NULL.
app.get('/api/aggregated-evaluation', (req, res) => {
  const { si } = req.query;
  
  if (!si) {
    return res.status(400).json({ error: "Le paramètre 'si' est requis" });
  }

  const query = `
    SELECT
      s.serveur,
      c.conformite_date AS conformite,
      v.vulnerabilites_date AS vulnerabilites,
      s.SI,
      c.resultats_conformite,
      v.resultats_vulnerabilites,
      c.id_conformite,
      v.id_vulnerabilites,
      c.profil
    FROM (
      -- Liste distincte des serveurs avec le SI fourni
      SELECT DISTINCT serveur, SI
      FROM evaluation
      WHERE SI = ?
    ) AS s
    LEFT JOIN (
      -- Sous-requête pour récupérer le dernier enregistrement de type 'conformite'
      SELECT 
        e1.serveur,
        e1.SI,
        e1.datetest AS conformite_date, 
        e1.score    AS resultats_conformite, 
        e1.id       AS id_conformite,
	e1.profil
      FROM evaluation e1
      WHERE e1.type = 'conformite'
        AND e1.SI = ?
        AND e1.datetest = (
            SELECT MAX(e2.datetest)
            FROM evaluation e2
            WHERE e2.serveur = e1.serveur
              AND e2.type = 'conformite'
              AND e2.SI = ?
        )
    ) AS c ON s.serveur = c.serveur AND s.SI = c.SI
    LEFT JOIN (
      -- Sous-requête pour récupérer le dernier enregistrement de type 'vulnerabilites'
      SELECT 
        e1.serveur,
        e1.SI,
        e1.datetest AS vulnerabilites_date, 
        e1.nb_vuln  AS resultats_vulnerabilites, 
        e1.id       AS id_vulnerabilites
      FROM evaluation e1
      WHERE e1.type = 'vulnerabilites'
        AND e1.SI = ?
        AND e1.datetest = (
            SELECT MAX(e2.datetest)
            FROM evaluation e2
            WHERE e2.serveur = e1.serveur
              AND e2.type = 'vulnerabilites'
              AND e2.SI = ?
        )
    ) AS v ON s.serveur = v.serveur AND s.SI = v.SI
    ORDER BY s.serveur;
  `;

  // On utilise cinq fois le paramètre "si" : 
  // pour la sous-requête principale, puis 2 fois dans la jointure conformite et 2 fois dans la jointure vulnerabilites.
  db.query(query, [si, si, si, si, si], (err, results) => {
    if (err) {
      console.error("Erreur SQL dans l'aggregated evaluation:", err);
      res.status(500).json({ error: "Erreur serveur" });
    } else {
      res.json(results);
    }
  });
});

app.get('/api/oscap-profiles', (req, res) => {
  exec('/usr/bin/oscap info --fetch-remote-resources /usr/share/xml/scap/ssg/content/ssg-almalinux9-ds.xml', (err, stdout, stderr) => {
    if (err) {
      console.error("Erreur lors de l'exécution de la commande oscap info:", err);
      return res.status(500).json({ error: "Erreur lors de l'exécution de la commande oscap info" });
    }

    // Filtrer les messages non critiques dans stderr (par exemple, ceux commençant par "Downloading:")
    const filteredStderr = stderr
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '' && !line.startsWith('Downloading:'))
      .join('\n');

    if (filteredStderr) {
      console.error("Erreur standard de la commande oscap info:", filteredStderr);
      return res.status(500).json({ error: "Erreur standard de la commande oscap info" });
    }

    // Diviser stdout en lignes, en retirant les lignes vides
    let lines = stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '');

    console.log("Paramètres lignes :", { lines });
    const profiles = [];
    let currentTitle = "";
    let currentId = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith("Title:")) {
        currentTitle = line.substring("Title:".length).trim();
        while (i + 1 < lines.length && !lines[i + 1].startsWith("Id:") && !lines[i + 1].startsWith("Title:")) {
          currentTitle += " " + lines[i + 1];
          i++;
        }
      } else if (line.startsWith("Id:")) {
        currentId = line.substring("Id:".length).trim();
        if (currentTitle) {
          profiles.push({ Title: currentTitle, Id: currentId });
        }
        currentTitle = "";
        currentId = "";
      }
    }

    // Renvoi des profils au format JSON
    res.json(profiles);
  });
});







app.get('/execute-runscan', (req, res) => {
  const { nom_si, server, interactive_mode, scan_type, profil } = req.query;

  // Vérification des paramètres requis
  if (!nom_si || !server) {
    return res.status(400).send("Les paramètres <MON_SI> et <MON_SERVEUR> sont requis");
  }

  console.log("Paramètres reçus :", { nom_si, server, interactive_mode, scan_type, profil });

  let scriptPath;
  let command;

  // Détermination du script et de la commande en fonction du type de scan
  if (scan_type === 'conformity') {
    scriptPath = '/opt/oscap/start-scan-conformity.sh';

    // Construction de la commande pour conformity
    if (interactive_mode === 'yes' && profil) {
      // Si le mode interactif est activé, on utilise le profil spécifié
      command = `${scriptPath} "${nom_si}" "${server}" --interactive-mode=yes --profil="${profil}"`;
    } else {
      // Si non, on utilise le profil par défaut (ANSSI-BP-028) avec --interactive-mode=no
      command = `${scriptPath} "${nom_si}" "${server}" --interactive-mode=no --profil="ANSSI-BP-028"`;
    }

  } else if (scan_type === 'vulnerability') {
    scriptPath = '/opt/oscap/start-scan-vulnerability.sh';
    
    // Construction de la commande pour vulnerability
    command = `${scriptPath} "${nom_si}" "${server}"`;
  } else {
    return res.status(400).send("Le type de scan spécifié est invalide");
  }

  // Vérification de l'existence du fichier de script
  if (!fs.existsSync(scriptPath)) {
    console.error(`Le fichier ${scriptPath} est introuvable`);
    return res.status(500).send('Le fichier de script est introuvable');
  }

  console.log("Commande exécutée : ", command);

  // En-têtes pour le streaming
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Exécution de la commande
  const child = exec(command);

  child.stdout.on('data', (data) => {
    console.log(data); // Log des données pour le suivi
    res.write(`data: ${JSON.stringify({ progress: data.trim() })}\n\n`);
  });

  child.stderr.on('data', (error) => {
    console.error(error);
    res.write(`data: ${JSON.stringify({ error: error.trim() })}\n\n`);
  });

  child.on('close', (code) => {
    console.log(`Process terminé avec le code : ${code}`);
    res.write(`data: ${JSON.stringify({ finished: true, code })}\n\n`);
    res.end();
  });
});

app.post("/api/login", async (req, res) => { 
  try {
    const { login, password } = req.body;
    if (!login || !password) {
      return res.status(400).json({ error: "Login et mot de passe sont requis." });
    }

    // Recherche dans le fichier si FILE_ACTIVE est activé
    if (process.env.FILE_ACTIVE === "1") {
      console.log('Try local file authentication');
      const fileStream = fs.createReadStream(process.env.USERS_FILE);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });

      let loginFound = false;

      for await (const line of rl) {
        const [storedLogin, storedHash] = line.split(':').map(str => str.trim());
        console.log('Login reçu:[', login.trim(), ']');
        console.log('Mot de passe comparé:[', sha512(password), ']');
        console.log('Login trouvé:[', storedLogin, ']');
        console.log('Mot de passe trouvé:[', storedHash, ']');
        if (storedLogin === login && storedHash === sha512(password)) {
          loginFound = true;
          break;
        }
      }

      if (loginFound) {
        const token = jwt.sign({ login }, JWT_SECRET, { expiresIn: "1h" });
        console.log('Authentification locale réussie');
        return res.status(200).json({ message: "Login successful", token });
      } else {
        console.log('Utilisateur non trouvé localement');
      }
    } else {
      console.log('Authentification par fichier désactivée');
    }

    // Si LDAP_ACTIVE est activé, on tente l'authentification LDAP
    if (process.env.LDAP_ACTIVE === "1") {
      console.log('Try LDAP');
      const isLdapAuthenticated = await authenticateUserLDAP(login, password);
      if (isLdapAuthenticated) {
        const token = jwt.sign({ login }, JWT_SECRET, { expiresIn: "1h" });
        console.log('Authentification LDAP réussie');
        return res.status(200).json({ message: "Login successful", token });
      } else {
        console.log('Authentification LDAP échouée');
        return res.status(401).json({ error: "Invalid credentials" });
      }
    } else {
      console.log('LDAP désactivé, échec d\'authentification');
      return res.status(401).json({ error: "Invalid credentials" });
    }

  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// Endpoint pour récupérer les utilisateurs
app.get("/users", (req, res) => {
  fs.readFile(USERS_FILE, "utf8", (err, data) => {
    if (err) return res.status(500).send("Erreur de lecture du fichier");
    res.send(data);
  });
});


// Endpoint pour enregistrer les modifications
app.post("/users/update", (req, res) => {
  let { data } = req.body;

  // Lire les utilisateurs existants
  fs.readFile(USERS_FILE, "utf8", (err, fileData) => {
    if (err) return res.status(500).send("Erreur de lecture du fichier");

    let existingUsers = fileData.trim().split("\n").reduce((acc, line) => {
      const [login, password, profile] = line.split(":");
      acc[login] = { login, password, profile };
      return acc;
    }, {});

    let newUsers = data.trim().split("\n").map(line => {
      let [login, password, profile] = line.split(":");

      // Si l'utilisateur existait déjà, on garde son mot de passe
      if (existingUsers[login]) {
        password = existingUsers[login].password;
      } else {
        // Si c'est un nouvel utilisateur, on hash son mot de passe
        password = hashPass(password);
      }

      return `${login}:${password}:${profile}`;
    });

    // Écriture du fichier mis à jour
    fs.writeFile(USERS_FILE, newUsers.join("\n") + "\n", "utf8", (err) => {
      if (err) return res.status(500).send("Erreur d'écriture du fichier");
      res.send("Modifications enregistrées");
    });
  });
});




// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
});


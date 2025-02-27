#!/bin/bash

# Chemin vers le fichier .env
ENV_FILE="/opt/backend/.env"

# Vérification de l'existence du fichier .env
if [ ! -f "$ENV_FILE" ]; then
    echo "Le fichier $ENV_FILE n'existe pas. Impossible de continuer."
    exit 1
fi

# Lecture des variables depuis le fichier .env
source "$ENV_FILE"

# Vérification de la présence des variables nécessaires
if [ -z "$DB_USER" ] || [ -z "$DB_PASS" ] || [ -z "$DB_NAME" ]; then
    echo "Les variables DB_USER, DB_PASS ou DB_NAME ne sont pas définies dans $ENV_FILE. Impossible de continuer."
    exit 1
fi

# Variables
ROOT_PASSWORD="" # Remplacez par le mot de passe root de MariaDB

# Vérification si mariadb est installé
if ! command -v mysql &> /dev/null
then
    echo "MariaDB n'est pas installé. Veuillez l'installer avant d'exécuter ce script."
    exit 1
fi

# Création de la base de données et de l'utilisateur
mysql -u root -p"$ROOT_PASSWORD" <<EOF
CREATE DATABASE IF NOT EXISTS $DB_NAME;
CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';
FLUSH PRIVILEGES;
EOF

if [ $? -eq 0 ]; then
    echo "Base de données '$DB_NAME' et utilisateur '$DB_USER' créés avec succès."
else
    echo "Erreur lors de la création de la base de données ou de l'utilisateur."
    exit 1
fi

mysql -u $DB_USER -p"$DB_PASS" $DB_NAME < database.sql

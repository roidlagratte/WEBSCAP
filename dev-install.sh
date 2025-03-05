#!/bin/bash
set -x
function install_oscap {
if ! rpm -q scap-security-guide; then
        dnf install -y openscap scap-security-guide openscap-utils openscap-scanner
fi
}

function install_python_and_modules {
if ! rpm -q python39; then
        dnf install -y python39
        echo "telecharger :  pip3.9 download mysql-connector-python lxml"
        echo "Installer manuellement  pip3.9 install lxml-5.3.1-cp39-cp39-manylinux_2_17_x86_64.manylinux2014_x86_64.whl mysql_connector_python-9.2.0-py2.py3-none-any.whl"
fi
}

function install_database {
if ! rpm -q mariadb-server; then
        dnf install -y mariadb-server
        systemctl enable mariadb
        systemctl start mariadb
fi
}

function prepare_database {
    echo "WARNING !!! before continue, configure /opt/WEBSCAP/backend/.env for USER and PASSWORD Database OSCAP. Ready to continue? (y/n)"
    read -r value
    case "${value,,}" in
        y|yes)
            if [ -f "/opt/WEBSCAP/prepare_database/create_database.sh" ]; then
                if bash /opt/WEBSCAP/prepare_database/create_database.sh; then
                    echo "Database preparation completed successfully."
                else
                    echo "Error: Database preparation script failed."
                    return 1
                fi
            else
                echo "Error: Database preparation script not found."
                return 1
            fi
            ;;
        n|no)
            echo "Database preparation cancelled."
            return 0
            ;;
        *)
            echo "Invalid input. Please enter 'y' for yes or 'n' for no."
            return 1
            ;;
    esac
}

function download_git {
DEST_DIR="/opt/WEBSCAP"
# Git installed ?
if ! command -v git &> /dev/null; then
    echo "Git not present. Install..."
    dnf install -y git
fi

# download in /opt
if [ -d "$DEST_DIR" ]; then
    echo "directory $DEST_DIR exist. Remove..."
    sudo rm -rf "$DEST_DIR"
fi

echo "Cloning project WEBSCAP in /opt..."
git clone https://github.com/roidlagratte/WEBSCAP.git "$DEST_DIR"

# Verifying cloning
if [ $? -eq 0 ]; then
    echo "Cloning ok !"
else
    echo "cloning failed."
    exit 1
fi

echo "project ready in $DEST_DIR."
}

function create_services {

SERVICE_DIR="/opt/WEBSCAP"

SERVICES=("WEBSCAP.service" "WEBSCAP-backend.service")

echo "WARNING !!! before continue, configure /opt/WEBSCAP/WEBSCAP/.env for URL of backend. Ready to continue? (y/n)"
    read -r value
    case "${value,,}" in
        y|yes)

for SERVICE in "${SERVICES[@]}"; do
    SRC_FILE="$SERVICE_DIR/$SERVICE"
    DEST_FILE="/etc/systemd/system/$SERVICE"

    # File exist ?
    if [ ! -f "$SRC_FILE" ]; then
        echo "Error:  File $SRC_FILE not found..."
        continue
    fi

    echo "copy $SERVICE to /etc/systemd/system/"
    cp "$SRC_FILE" "$DEST_FILE"

    echo "reload systemd"
    systemctl daemon-reload

    echo "Activate and starting $SERVICE"
    systemctl enable "$SERVICE"
    systemctl start "$SERVICE"

    echo "check status $SERVICE"
    systemctl status "$SERVICE" --no-pager
done
esac

echo "Installation et activation endend."
}

function install_nodejs {
dnf install -y wget
VERSION=23.9.0
NODE_DIR=/opt/WEBSCAP/node-v$VERSION-linux-x64
echo "Install NODEJS v$VERSION"
sleep 2
cd /opt/WEBSCAP
wget https://nodejs.org/dist/latest/node-v$VERSION-linux-x64.tar.gz
wget https://nodejs.org/dist/latest/SHASUMS256.txt
tar -xzf "node-v$VERSION-linux-x64.tar.gz"
SHA256=$(grep "node-v$VERSION-linux-x64.tar.gz" SHASUMS256.txt | awk '{print $1}')
SHA256_FILE=$(sha256sum node-v$VERSION-linux-x64.tar.gz | awk '{print $1}')

    if [[ "$SHA256" != "$SHA256_FILE" ]]; then
        echo "Checksum incorrect : $SHA256 vs $SHA256_FILE. Stop installation."
        exit 1
    else
        echo "Checksum OK, continue."
    fi

export PATH="$NODE_DIR/bin:$PATH"

echo "Create symlink for node, npm and npx and install vite in local"
ln -s $NODE_DIR/bin/node /usr/bin/node
ln -s $NODE_DIR/bin/npm /usr/bin/npm
ln -s $NODE_DIR/bin/npx /usr/bin/npx
cd /opt/WEBSCAP/WEBSCAP
 npm install -D vite tailwindcss postcss autoprefixer sass react-icons react-select crypto-js axios react-chartjs-2 chart.js lucide-react

if ! command -v npm &> /dev/null; then
    echo "Erreur : npm not found."
    exit 1
fi
    echo "download and install modules ..."
    cd /opt/WEBSCAP/backend
    npm init -y
    npm install -D express mysql cors jsonwebtoken ldapts dotenv

}

function cleanup {
    echo "Cleaning up temporary files..."

    # Supprimez les fichiers temporaires téléchargés
    if [ -f "/opt/WEBSCAP/node-v$VERSION-linux-x64.tar.gz" ]; then
        rm -f "/opt/WEBSCAP/node-v$VERSION-linux-x64.tar.gz"
    fi

    if [ -f "/opt/WEBSCAP/SHASUMS256.txt" ]; then
        rm -f "/opt/WEBSCAP/SHASUMS256.txt"
    fi

    echo "Cleanup completed."
}


    download_git
    install_database
     prepare_database
    install_python_and_modules
install_nodejs
    install_oscap
   create_services
cleanup


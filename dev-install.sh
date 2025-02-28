#!/bin/bash

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

    #download_git
#    install_database
    prepare_database
exit
    install_python_and_modules
    install_oscap
else
    echo "Le fichier n'existe pas."
fi

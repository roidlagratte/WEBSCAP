# Welcome on my project WEBSCAP 

Tested successfully on AlmaLinux 8 and 9. Probably OK on RedhaT and Rocky Linux

Components :
- MariaDB
- NODEJS (REACT and BACKEND)
- OSCAP (dnf install -y scap-security-guide openscap-utils openscap-scanner openscap)

## Description

This application use oscap to generate a XML report, parse this report to update data in MariaDB. You can use crontab or ansible to generate reports (oscap/start-scan-vulnerability.sh and oscap/start-scan-conformity.sh can be launch manually or with ansible or crontab to generate report and store in MariaDB).

It can work on remote system with SSH key.

Support a LDAP like FreeIPA to authenticate users.

<img src="https://raw.githubusercontent.com/roidlagratte/WEBSCAP/main/screenshots/login.png" width="300">
<img src="https://raw.githubusercontent.com/roidlagratte/WEBSCAP/main/screenshots/details.png" width="300">
<img src="https://raw.githubusercontent.com/roidlagratte/WEBSCAP/main/screenshots/details2.png" width="300">
<img src="https://raw.githubusercontent.com/roidlagratte/WEBSCAP/main/screenshots/details3.png" width="300">
<img src="https://raw.githubusercontent.com/roidlagratte/WEBSCAP/main/screenshots/scan.png" width="300">
<img src="https://raw.githubusercontent.com/roidlagratte/WEBSCAP/main/screenshots/adduser.png" width="300">
<img src="https://raw.githubusercontent.com/roidlagratte/WEBSCAP/main/screenshots/cvss.png" width="300">

### Installation 

Download dev-install.sh script, chmod u+x and execute it as root. it will automatically :

During script execution your are prompted to configure :

a) the backend : /opt/WEBSCAP/backend/.env


PORT=5000   <= Database backend listening
DB_HOST=localhost
DB_USER=oscap
DB_PASS=oscap
DB_NAME=oscap   <= change password database
JWT_SECRET="MyBigSecret"
FILE_ACTIVE="1"
USERS_FILE="/opt/WEBSCAP/backend/users.txt"  <= local file account

LDAP_URL="ldaps://127.0.0.1:636"
LDAP_BIND="uid=admin,cn=users,cn=accounts,dc=domain,dc=com"
LDAP_SEARCH="dc=domain,dc=com"
LDAP_FILTER="(&(uid=${username})(memberOf=cn=ipausers,cn=groups,cn=accounts,dc=domain,dc=com))"
LDAP_PASS="<LDAP PASSWORD>"
LDAP_ACTIVE="0"    <= here to active LDAP connection


b) the frontend : /opt/WEBSCAP/WEBSCAP/.env
VITE_BACKEND_URL=http://192.168.0.124:5000  <= replace with IP backend and port (normally 5000)



All steps the script is doing : 

1. Clone the project

2. Change configuration in /opt/backend/.env

3. Install python 

dnf install python3-pip
pip install mysql-connector-python lxml

4. Install Mariadb

5. Install NODEJS
cd /opt/backend
npm init -y
npm install express
npm install mysql
npm install cors
npm install dotenv
npm install jsonwebtoken
npm install ldapts


cd /opt/prepare_database
 ./create_database.sh 


download on NODEJS latest version and install it:  https://nodejs.org/dist/latest/
wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh


cd WEBSCAP
npm create vite@latest WEBSCAP -- --template react
npm install -D tailwindcss postcss autoprefixer sass 
npm install react-icons
npm install react-select
 npx tailwindcss init -p
npm i react-router-dom
npm install crypto-js axios react-chartjs-2 chart.js
npm install lucide-react


After installation all services are started and ready : 
check witch 
systemctl status WEBSCAP-backend
systemctl status WEBSCAP

Open on a browser https://<SERVEUR>:3000
Default login : admin/admin

launch manual scan to populate servers and SYSTEM on database witch :
/opt/WEBSCAP/oscap/start-scan-conformity.sh SYSTEM servername  --interactive-mode=no 
/opt/WEBSCAP/oscap/start-scan-vulnerability.sh  SYSTEM servername2

Be carrefull : Not again tested with selinux.

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

1. Clone project

2. Change configuration in /opt/backend/.env

3. Install python 

dnf install python3-pip
pip install mysql-connector-python lxml


i5. Install Mariadb
4. Install NODEJS
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



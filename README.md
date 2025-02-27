# Welcome on my project WEBSCAP 

Tested successfully on AlmaLinux 8 and 9. Probably OK on RedhaT and Rocky Linux

Components :
- MariaDB
- NODEJS (REACT and BACKEND)
- OSCAP (dnf install -y scap-security-guide openscap-utils openscap-scanner openscap)

## Description

![login](sreenshots/login.png)  
![detail](sreenshots/details.png)  
![detail2](sreenshots/details2.png)  
![detail3](sreenshots/details3.png)  
![scan](sreenshots/scan.png)  
![adduser](sreenshots/adduser.png)  
![cvss](sreenshots/cvss.png)  


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



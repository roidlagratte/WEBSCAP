import { createRoot } from "react-dom/client";
import "./assets/style/index.css";
import "./assets/style/custom.css";

import AppAccueil from "./AppAccueil.jsx";
import AppAccueil2 from "./AppAccueil2.jsx";
import AppConformity from "./AppConformity.jsx";
import AppVulnerability from "./AppVulnerability.jsx";
import AppStats from "./AppStats.jsx"; 
import AppRunscan from "./AppRunscan.jsx";
import Login from "./AppLogin.jsx";
import AppUsers from "./AppUsers.jsx";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrivateRoute from "./PrivateRoute"; // Import du composant PrivateRoute

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      {/* Route par défaut redirige vers /Accueil */}
      <Route path="/" element={<Login />} />

      {/* Route de connexion */}
      <Route path="/login" element={<Login />} />

      
      {/* Routes protégées */}
      <Route 
        path="/accueil" 
        element={
          <PrivateRoute>
            <AppAccueil />
          </PrivateRoute>
        }
      />  
      <Route 
        path="/list" 
        element={
          <PrivateRoute>
            <AppAccueil2 />
          </PrivateRoute>
        }
      />
      <Route 
        path="/stats" 
        element={
          <PrivateRoute>
            <AppStats />
          </PrivateRoute>
        }
      />
      <Route 
        path="/conformity" 
        element={
          <PrivateRoute>
            <AppConformity />
          </PrivateRoute>
        }
      />
      <Route 
        path="/vulnerability" 
        element={
          <PrivateRoute>
            <AppVulnerability />
          </PrivateRoute>
        }
      />
      <Route 
        path="/runscan" 
        element={
          <PrivateRoute>
            <AppRunscan />
          </PrivateRoute>
        }
      />
            <Route 
        path="/users" 
        element={
          <PrivateRoute>
            <AppUsers />
          </PrivateRoute>
        }
      />
    </Routes>
  </BrowserRouter>
);

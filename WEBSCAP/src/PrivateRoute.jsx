import { Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

const PrivateRoute = ({ children }) => {
  const [sessionValid, setSessionValid] = useState(null);  // Modifié pour gérer l'état 'loading'
  const [loading, setLoading] = useState(true);  // Ajout d'un état de chargement

  const checkSessionValidity = () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    const sessionStart = localStorage.getItem('sessionStart');
    console.log('Vérification de la session:', { isAuthenticated, sessionStart });
    
    // Vérifie si la session existe et si elle est encore valide
    if (
      isAuthenticated &&
      sessionStart &&
      new Date().getTime() - sessionStart < 15 * 60 * 1000 // 15 minutes
    ) {
      console.log('Session valide');
      setSessionValid(true);
    } else {
      console.log('Session invalide');
      setSessionValid(false);
    }
    setLoading(false); // Une fois la vérification terminée, on désactive le chargement
  };

  const resetSessionTimeout = () => {
    // Réinitialiser le début de la session à chaque événement d'activité
    localStorage.setItem('sessionStart', new Date().getTime().toString());
  };

  useEffect(() => {
    checkSessionValidity();

    // Ecouter les événements d'activité utilisateur (clic, souris, clavier)
    const events = ['click', 'mousemove', 'keydown'];
    events.forEach(event => {
      window.addEventListener(event, resetSessionTimeout);
    });

    // Vérification de la session à intervalles réguliers
    const sessionCheckInterval = setInterval(checkSessionValidity, 10000); // Vérifie toutes les 10 secondes

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetSessionTimeout);
      });
      clearInterval(sessionCheckInterval);
    };
  }, []);

  if (loading) {
    return <div>Chargement...</div>;  // Affiche un message de chargement pendant la vérification
  }

  if (!sessionValid) {
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('sessionStart');
    console.log('Session invalide redirection vers login');
    return <Navigate to="/login" />;
  }

  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PrivateRoute;

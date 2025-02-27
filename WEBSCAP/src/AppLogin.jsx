import React, { useState } from 'react';
import CryptoJS from 'crypto-js';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Fonction exécutée lors de la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Hash du mot de passe
    const hashedPassword = CryptoJS.SHA512(password).toString(CryptoJS.enc.Base64);

    // URL du backend stockée dans le fichier `.env`
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    try {
      const response = await fetch(`${backendUrl}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: username, password: password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Enregistrement des données utilisateur dans le localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('sessionStart', new Date().getTime().toString());
        // Redirection vers la page d'accueil
        navigate('/accueil');
      } else {
        setError(data.error || "Authentication error");
      }
    } catch (error) {
      setError('Error to connect to server');
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f4f6f8]">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow-lg">
      <h2 className="title-header">Connection</h2>

        <form onSubmit={handleSubmit}>
          {/* Champ Nom d'utilisateur */}
          <div className="mb-4">
            <label htmlFor="username" className="block text-gray-700 font-medium mb-2">
              Login :
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7a848a]"
              placeholder="Enter login"
            />
          </div>

          {/* Champ Mot de passe */}
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Password :
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7a848a]"
              placeholder="Enter password"
            />
          </div>

          {/* Bouton de connexion */}
          <button
            type="submit"
            className="w-full bg-[#687075] text-white py-2 rounded-lg font-semibold hover:bg-[#7a849a] focus:outline-none focus:ring-2 focus:ring-[#7a848a]"
          >
            Se connecter
          </button>
        </form>

        {/* Message d'erreur */}
        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
};

export default Login;

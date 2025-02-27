import { useEffect, useState } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import axios from "axios";

function AppAccueil() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [users, setUsers] = useState([]);
  const [newLogin, setNewLogin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isModified, setIsModified] = useState(false);

  // Charger les utilisateurs depuis users.txt
  useEffect(() => {
    axios.get(`${backendUrl}/users`)
      .then(response => {
        const parsedUsers = response.data.trim().split("\n").map(line => {
          const [login, password, profile] = line.split(":");
          return { login, password, profile };
        }).filter(user => user.login);
        setUsers(parsedUsers);
      })
      .catch(error => console.error("Erreur de chargement des utilisateurs :", error));
  }, []);

  // Ajouter un nouvel utilisateur
  const addUser = () => {
    if (!newLogin || !newPassword) return;

    const newUser = { login: newLogin, password: newPassword, profile: "admin" };
    setUsers([...users, newUser]);
    setIsModified(true);

    setNewLogin("");
    setNewPassword("");
  };

  // Supprimer un utilisateur de la liste
  const deleteUser = (index) => {
    const updatedUsers = users.filter((_, i) => i !== index);
    setUsers(updatedUsers);
    setIsModified(true);
  };

  // Enregistrer les modifications dans le fichier
  const saveChanges = () => {
    const updatedData = users.map(user => `${user.login}:${user.password}:${user.profile}`).join("\n");

    axios.post(`${backendUrl}/users/update`, { data: updatedData })
      .then(() => {
        setIsModified(false);
        console.log("Modifications enregistrées");
      })
      .catch(error => console.error("Erreur d'enregistrement :", error));
  };

  return (
    <div className="flex">
      <Navbar />
      <main className="main-content">
        <section className="flex-grow p-4">
        <h2 className="title-header">
            Compliance and Vulnerabilities
          </h2>

          <div className="bg-white p-4 rounded-lg shadow-md">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Login</th>
                  <th className="border p-2">Profil</th>
                  <th className="border p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={index} className="border-b">
                    <td className="border p-2">{user.login}</td>
                    <td className="border p-2">{user.profile}</td>
                    <td className="border p-2">
                      <button
                        onClick={() => deleteUser(index)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Ajout d'un nouvel utilisateur */}
            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                placeholder="Nouveau login"
                value={newLogin}
                onChange={(e) => setNewLogin(e.target.value)}
                className="border p-2 rounded w-1/3"
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border p-2 rounded w-1/3"
              />
              <button
                onClick={addUser}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                +
              </button>
            </div>

            {/* Bouton Enregistrer */}
            {isModified && (
              <div className="mt-4">
                <button
                  onClick={saveChanges}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Enregistrer
                </button>
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </div>
  );
}

export default AppAccueil;

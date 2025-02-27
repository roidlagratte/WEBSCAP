import { useEffect, useState, useMemo } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CardAccueil from "./components/CardAccueil";
import axios from "axios";

function AppAccueil() {
  const [servers, setServers] = useState([]);
  const [sis, setSis] = useState([]); // Liste des SI disponibles
  const [selectedSi, setSelectedSi] = useState(""); // SI sélectionné
  const [isLoading, setIsLoading] = useState(false); // Gestion du chargement des serveurs
  const [sortConfig, setSortConfig] = useState({
    key: "serveur", // tri par défaut par nom de serveur
    direction: "ascending",
  });

  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // Fonction de récupération des évaluations agrégées pour un SI donné
  const fetchServers = async (si) => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${backendUrl}/api/aggregated-evaluation?si=${si}`);
      setServers(response.data);
      console.log("Réponse agrégée reçue:", response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des évaluations agrégées :", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de récupération des SI disponibles
  const fetchSis = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/stats-get-si`);
      setSis(response.data); // Charger la liste des SI
    } catch (error) {
      console.error("Erreur lors de la récupération des SI :", error);
    }
  };

  useEffect(() => {
    fetchSis(); // Charger les SI au montage du composant
  }, []);

  // Recharger les serveurs lorsque le SI sélectionné change
  useEffect(() => {
    if (selectedSi) {
      fetchServers(selectedSi);
    }
  }, [selectedSi]);

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    } else if (sortConfig.key === key && sortConfig.direction === "descending") {
      direction = "ascending";
    }
    setSortConfig({ key, direction });
  };

  const sortedServers = useMemo(() => {
    return [...servers].sort((a, b) => {
      if (a[sortConfig.key] === null || a[sortConfig.key] === undefined) return 1;
      if (b[sortConfig.key] === null || b[sortConfig.key] === undefined) return -1;
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  }, [servers, sortConfig]);

  return (
    <div className="flex">
      <Navbar />
      <main className="main-content">
        <section className="flex-grow">
          <h2 className="title-header">
          compliance and vulnerability
          </h2>

          {/* Sélection du SI */}
          <div className="p-4">
            <div className="mb-4">
              <label htmlFor="si-select" className="block mb-2 text-sm font-medium text-gray-700">
                Select system :
              </label>
              <select
                id="si-select"
                value={selectedSi}
                onChange={(e) => setSelectedSi(e.target.value)}
                className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:border-blue-300">
                <option value="">-- select system --</option>
                {sis.map((si) => (
                  <option key={si} value={si}>
                    {si}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Affichage conditionnel */}
          {selectedSi ? (
            isLoading ? (
              <p>Loading data...</p>
            ) : (
              <div className="principal">
                {servers.length > 0 ? (
                  <table className="table-fixed w-full">
                    <thead className="bg-gray-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2 w-[120px]">System</th>
                        <th className="px-4 py-2 cursor-pointer w-[220px]" onClick={() => handleSort("serveur")}>
                          Server
                        </th>
                        <th className="px-4 py-2 cursor-pointer w-[220px]" onClick={() => handleSort("conformite")}>
                          Date (compliance test)
                        </th>
                        <th className="px-4 py-2 cursor-pointer w-[220px]" onClick={() => handleSort("vulnerabilites")}>
                        Date (vulnerability test)
                        </th>
                        <th className="px-4 py-2 w-[160px]">Compliance level</th>
                        <th className="px-4 py-2 w-[160px]">Vulnerability found</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedServers.map((server) => (
                        <CardAccueil key={server.serveur} EvaluationData={server} />
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No data for system.</p>
                )}
              </div>
            )
          ) : (
            <p className="text-center text-gray-500 mt-8">Select a system.</p>
          )}
        </section>
        <Footer />
      </main>
    </div>
  );
}

export default AppAccueil;

import { useEffect, useState, useMemo } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CardAccueil2 from "./components/CardAccueil2";
import axios from "axios";

function AppAccueil2() {
  const [servers, setServers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState({
    key: 'datetest', // Par défaut, trier par 'datetest'
    direction: 'descending', // Par défaut, ordre décroissant
  });

  // Fonction de récupération des serveurs
  const fetchServers = async () => {
    try {
      setIsLoading(true);
      // Lire l'URL de base depuis la variable d'environnement
      const backendUrl = import.meta.env.VITE_BACKEND_URL;  // URL du backend
      const response = await axios.get(`${backendUrl}/api/evaluation`);
      setServers(response.data);
      console.log("Réponse reçue:", response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des serveurs  :", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServers(); // Appeler uniquement l'API des serveurs
  }, []);

  const handleSort = (key) => {
    let direction = 'ascending';
    // Inverser la direction si c'est la même clé
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const groupedServers = useMemo(() => {
    const groups = {};
    servers.forEach(server => {
      const key = `${server.type}-${server.SI}-${server.serveur}`;
      if (!groups[key] || new Date(server.datetest) > new Date(groups[key][0].datetest)) {
        groups[key] = [server];
      } else {
        groups[key].push(server);
      }
    });
    return Object.values(groups).map(group => ({
      ...group[0],
      olderEntries: group.slice(1)
    }));
  }, [servers]);

  const sortedServers = useMemo(() => {
    return [...groupedServers].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [groupedServers, sortConfig]);

  return (
    <div className="flex">
      <Navbar />
      <main className="main-content">
        <section className="flex-grow">
        <h2 className="title-header">
          compliance and vulnerability
          </h2>

          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <div className="border-2 rou-xl customShadow overflow-hidden p-4 principal">
              <table className="table-fixed w-full">
                <thead className="bg-gray-200 sticky top-0 z-10">
                  <tr className="bg-gray-200 sticky top-0 z-10">
                    <th className="px-4 py-2 w-[200px] cursor-pointer" onClick={() => handleSort('datetest')}>
                      Date
                      <span className="ml-2">
                        <button onClick={() => handleSort('datetest')} className={`px-1 ${sortConfig.key === 'datetest' && sortConfig.direction === 'ascending' ? 'text-blue-500' : ''}`}>↑</button>
                        <button onClick={() => handleSort('datetest')} className={`px-1 ${sortConfig.key === 'datetest' && sortConfig.direction === 'descending' ? 'text-blue-500' : ''}`}>↓</button>
                      </span>
                    </th>
                    <th className="px-4 py-2 w-[180px]">Compliance test</th>
                    <th className="px-4 py-2 cursor-pointer w-[200px]" onClick={() => handleSort("serveur")}>
                      System
                    </th>
                    <th className="px-4 py-2 cursor-pointer w-[220px]" onClick={() => handleSort("conformite")}>
                      Server
                    </th>
                    <th className="px-4 py-2 cursor-pointer w-[220px]" onClick={() => handleSort("vulnerabilites")}>
                      Compliance/Vulnerability
                    </th>
                    <th className="px-4 py-2 w-[220px]">Historic</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedServers.map((server) => (
                    <CardAccueil2 key={server.id} EvaluationData={server} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <Footer />
      </main>
    </div>
  );
}

export default AppAccueil2;

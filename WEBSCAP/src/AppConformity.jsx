import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CardConformity from "./components/CardConformity";
import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";

function AppConformity() {
  const [ConformityData, setConformityData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'rule', direction: 'ascending' });
  const location = useLocation();
  const { id, serveur, formattedDate, score, profil } = location.state || {};

  const backendUrl = import.meta.env.VITE_BACKEND_URL; // Utilisation de la variable d'environnement

  const ScoreBar = ({ score }) => {
    const greenWidth = `${score}%`;
    const redWidth = `${100 - score}%`;
    return (
      <div className="w-80 h-10 bg-red-500 rounded-full overflow-hidden flex items-center">
        <div
          className="h-full bg-green-500 flex items-center justify-end pr-2 text-white score-text-principal text-4xl"
          style={{ width: greenWidth }}
        >
          {score}%
        </div>
        <div className="h-full" style={{ width: redWidth }}></div>
      </div>
    );
  };

  const summary = useMemo(() => {
    const total = ConformityData.length;
    const passCount = ConformityData.filter(item => item.test === 'pass').length;
    const failCount = ConformityData.filter(item => item.test === 'fail').length;
    const notSelectedCount = ConformityData.filter(item => item.test === 'notselected').length;
    return { total, passCount, failCount, notSelectedCount };
  }, [ConformityData]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${backendUrl}/api/evaluation/${id}`); // Utilisation de l'URL dynamique
      setConformityData(response.data);
    } catch (error) {
      console.error("Erreur lors de la récupération des données :", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sortedData = useMemo(() => {
    let sortableData = [...ConformityData];
    if (sortConfig.key !== null) {
      sortableData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }
    return sortableData;
  }, [ConformityData, sortConfig]);

  const filteredData = useMemo(() => {
    const dataToFilter = sortedData;
    if (filter === 'all') return dataToFilter;
    return dataToFilter.filter(item => item.test === filter);
  }, [sortedData, filter]);

  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        return { key, direction: prevConfig.direction === 'ascending' ? 'descending' : 'ascending' };
      }
      return { key, direction: 'ascending' };
    });
  };

  const extractProfile = (profile) => {
    return profile.replace("xccdf_org.open-scap_testresult_xccdf_org.ssgproject.content_profile_", "");
  };

  useEffect(() => {
    if (id) {
      fetchData();
    } else {
      console.error("Aucun ID trouvé.");
    }
  }, [id]);

  return (
    <main className="main-content">
      <Navbar />
      <section className="flex-grow-0">
      <h2 className="title-header">
          <div className="flex justify-center">
            <span className="text-4xl text-center w-full">{serveur}</span>
          </div>
          <div className="text-sm mt-2 w-full flex justify-between items-center">
            <span className="text-xl" style={{ width: "30%" }}>Test : {formattedDate}</span>
            <div className="w-1/3">
              <ScoreBar score={score} />
            </div>
            <span className="text-2xl" style={{ width: "30%" }}>Profile : {extractProfile(profil)}</span>
          </div>
        </h2>
        <div className="mb-4">
          <button onClick={() => setFilter('all')} className="mr-2 px-4 py-2 bg-blue-500 text-white rounded">All</button>
          <button onClick={() => setFilter('pass')} className="mr-2 px-4 py-2 bg-green-500 text-white rounded">Pass</button>
          <button onClick={() => setFilter('fail')} className="px-4 py-2 bg-red-500 text-white rounded">Fail</button>
        </div>
      </section>
      {isLoading ? (
        <p>Loading data...</p>
      ) : filteredData.length > 0 ? (
        <div className="border-2 rou-xl customShadow overflow-hidden p-4 principal">
          <table className="table-fixed w-full border-collapse">
            <thead className="bg-gray-200 sticky top-0 z-10">
              <tr>
                <th
                  className="border border-gray-400 px-4 py-2 w-[300px] cursor-pointer"
                  onClick={() => handleSort('rule')}
                >
                Evaluation type
                <span className="ml-2">
                  {sortConfig.key === 'rule' && (
                  <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>

              <th className="border border-gray-400 px-4 py-2 w-[540px] cursor-pointer"
                onClick={() => handleSort('titre')}
              >
                Title
                <span className="ml-2">
                  {sortConfig.key === 'titre' && (
                  <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>

              <th className="border border-gray-400 px-4 py-2 w-[120px] cursor-pointer"
                onClick={() => handleSort('severity')}
              >
                Gravity
                <span className="ml-2">
                  {sortConfig.key === 'severity' && (
                  <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>

              <th className="border border-gray-400 px-4 py-2 w-[120px] cursor-pointer"
                onClick={() => handleSort('test')}
              >
                Results
                <span className="ml-2">
                  {sortConfig.key === 'test' && (
                  <span>{sortConfig.direction === 'ascending' ? '↑' : '↓'}</span>
                  )}
                </span>
              </th>

              <th className="border border-gray-400 px-4 py-2 w-[120px]">
                Actions
              </th>

              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => (
                <CardConformity key={item.id} EvaluationData={item} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Aucune donnée à afficher.</p>
      )}
      <Footer />
    </main>
  );
}

export default AppConformity;

import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function AppStats() {
  const [sis, setSis] = useState([]);
  const [servers, setServers] = useState([]);
  const [selectedSi, setSelectedSi] = useState('');
  const [selectedServer, setSelectedServer] = useState('');
  const [chartData, setChartData] = useState(null);
  const backendUrl = import.meta.env.VITE_BACKEND_URL; 
  // Fonction pour calculer les limites de l'axe Y
  const getYScaleLimits = (data) => {
    const maxValue = Math.max(...data);

    if (maxValue <= 50) {
      return { min: 0, max: 50 };
    } else if (maxValue <= 100) {
      return { min: 0, max: 100 };
    } else {
      return { min: 0, max: 200 };
    }
  };

  // Charger les SI lors du chargement de la page
  useEffect(() => {
    const fetchSis = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/stats-get-si`);
        setSis(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des SI :', error);
      }
    };
    fetchSis();
  }, []);

  // Charger les serveurs lorsqu'un SI est sélectionné
  useEffect(() => {
    if (selectedSi) {
      const fetchServers = async () => {
        try {
          const response = await axios.get(`${backendUrl}/api/stats-get-servers`, {
            params: { si: selectedSi },
          });
          console.log('Données récupérées pour les serveurs :', response);
          setServers(response.data);
        } catch (error) {
          console.error('Erreur lors de la récupération des serveurs :', error);
        }
      };
      fetchServers();
    }
  }, [selectedSi]);

  // Charger les données pour le graphique lorsqu'un serveur est sélectionné
  useEffect(() => {
    if (selectedSi && selectedServer) {
      const fetchStats = async () => {
        try {
          const response = await axios.get(`${backendUrl}/api/stats-get-data`, {
            params: { SI: selectedSi, serveur: selectedServer },
          });
          const data = response.data;
          console.log('Paramètres envoyés à l\'API stats-get-data :', { SI: selectedSi, serveur: selectedServer });

          console.log('Données récupérées pour le graphique :', data);
          // Préparer les données pour le graphique
          const labels = data.map((row) => row.datetest);
          const conformityScores = data.map((row) => row.type === 'conformite' ? row.score : null);
          const vulnerabilities = data.map((row) => row.type === 'vulnerabilites' ? row.nb_vuln : null);

          // Calculer les limites de l'axe Y pour chaque jeu de données
          const conformityYScaleLimits = getYScaleLimits(conformityScores.filter(Boolean));
          const vulnerabilitiesYScaleLimits = getYScaleLimits(vulnerabilities.filter(Boolean));

          setChartData({
            labels,
            datasets: [
              {
                label: 'Compliance',
                data: conformityScores,
                borderColor: 'blue',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                yAxisID: 'y1',
              },
              {
                label: 'Vulnerability',
                data: vulnerabilities,
                borderColor: 'red',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                yAxisID: 'y2',
              },
            ],
            yScaleLimits: {
              conformity: conformityYScaleLimits,
              vulnerabilities: vulnerabilitiesYScaleLimits,
            },
          });
        } catch (error) {
          console.error('Erreur lors de la récupération des données statistiques :', error);
        }
      };
      fetchStats();
    }
  }, [selectedSi, selectedServer]);

  return (
    <div className="flex">
      <Navbar />
      <main className="main-content">
        <section className="flex-grow">
        <h2 className="title-header">
            Statistics
          </h2>

          <div className="p-4">
            {/* Sélection du SI */}
            <div className="mb-4">
              <label htmlFor="si-select" className="block mb-2 text-sm font-medium text-gray-700">
                Selct system :
              </label>
              <select
                id="si-select"
                value={selectedSi}
                onChange={(e) => setSelectedSi(e.target.value)}
                className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:border-blue-300"
              >
                <option value="">-- Select system --</option>
                {sis.map((si) => (
                  <option key={si} value={si}>
                    {si}
                  </option>
                ))}
              </select>
            </div>

            {/* Sélection du serveur */}
            {selectedSi && (
              <div className="mb-4">
                <label htmlFor="server-select" className="block mb-2 text-sm font-medium text-gray-700">
                  Select server :
                </label>
                <select
                  id="server-select"
                  value={selectedServer}
                  onChange={(e) => setSelectedServer(e.target.value)}
                  className="block w-full px-3 py-2 border rounded-md shadow-sm focus:ring focus:border-blue-300"
                >
                  <option value="">-- select server --</option>
                  {servers.map((server) => (
                    <option key={server} value={server}>
                      {server}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Affichage du graphique */}
            {chartData && (
              <div className="mt-8">
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: true, text: 'Statistic' },
                    },
                    scales: {
                      y1: {
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'ConfCompliance' },
                        min: chartData.yScaleLimits.conformity.min,
                        max: chartData.yScaleLimits.conformity.max,
                      },
                      y2: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: 'Vulnerability' },
                        min: chartData.yScaleLimits.vulnerabilities.min,
                        max: chartData.yScaleLimits.vulnerabilities.max,
                      },
                    },
                  }}
                />
              </div>
            )}
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}

export default AppStats;

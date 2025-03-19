import { useEffect, useState, useMemo } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CardAccueil from "./components/CardAccueil";
import axios from "axios";

function AppAccueil() {
    const [servers, setServers] = useState([]);
    const [sis, setSis] = useState([]); // Liste des SI disponibles
    const [selectedSi, setSelectedSi] = useState(() => localStorage.getItem('selectedSi') || "");
    const [isLoading, setIsLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: "serveur", direction: "ascending" });

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const fetchServers = async (si) => {
        try {
            setIsLoading(true);
            const response = await axios.get(`${backendUrl}/api/aggregated-evaluation?si=${si}`);
            const serverList = response.data;
            setServers(serverList);
            console.log("Réponse agrégée reçue:", serverList);

            if (serverList.length > 0) {
                fetchAliases(serverList); // Récupérer les alias après avoir les serveurs
            }
        } catch (error) {
            console.error("Erreur lors de la récupération des évaluations agrégées :", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Fonction pour récupérer les alias
    const fetchAliases = async (serverList) => {
        try {
            const aliasRequests = serverList.map(server =>
                axios.get(`${backendUrl}/api/get-alias?serveur=${server.serveur}`)
                    .then(response => ({ serveur: server.serveur, alias: response.data[0]?.alias || "N/A" }))
                    .catch(() => ({ serveur: server.serveur, alias: "N/A" }))
            );

            const aliasResults = await Promise.all(aliasRequests);

            setServers(prevServers =>
                prevServers.map(server => {
                    const aliasEntry = aliasResults.find(a => a.serveur === server.serveur);
                    return { ...server, alias: aliasEntry ? aliasEntry.alias : "N/A" };
                })
            );
        } catch (error) {
            console.error("Erreur lors de la récupération des alias :", error);
        }
    };

    const fetchSis = async () => {
        try {
            const response = await axios.get(`${backendUrl}/api/stats-get-si`);
            setSis(response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des SI :", error);
        }
    };

    useEffect(() => {
        fetchSis();
    }, []);

    useEffect(() => {
        localStorage.setItem('selectedSi', selectedSi);
    }, [selectedSi]);

    useEffect(() => {
        if (selectedSi) {
            fetchServers(selectedSi);
            const intervalId = setInterval(() => fetchServers(selectedSi), 3600000);
            return () => clearInterval(intervalId);
        }
    }, [selectedSi]);

    const handleSort = (key) => {
        let direction = sortConfig.key === key && sortConfig.direction === "ascending" ? "descending" : "ascending";
        setSortConfig({ key, direction });
    };

    const sortedServers = useMemo(() => {
        return [...servers].sort((a, b) => {
            if (!a[sortConfig.key]) return 1;
            if (!b[sortConfig.key]) return -1;
            return a[sortConfig.key] < b[sortConfig.key]
                ? sortConfig.direction === "ascending" ? -1 : 1
                : sortConfig.direction === "ascending" ? 1 : -1;
        });
    }, [servers, sortConfig]);

    return (
        <div className="flex">
            <Navbar />
            <main className="main-content">
                <section className="flex-grow">
                    <h2 className="title-header">compliance and vulnerability</h2>
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
                                {sis.map(si => (
                                    <option key={si} value={si}>{si}</option>
                                ))}
                            </select>
                        </div>
                    </div>
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
                                                <th className="px-4 py-2 cursor-pointer w-[220px]" onClick={() => handleSort("alias")}>
                                                    Alias
                                                </th>
                                                <th className="px-4 py-2 cursor-pointer w-[220px]" onClick={() => handleSort("conformite")}>
                                                    Date (compliance test)
                                                </th>
                                                <th className="px-4 py-2 cursor-pointer w-[220px]" onClick={() => handleSort("vulnerabilites")}>
                                                    Date (vulnerability test)
                                                </th>
                                                <th className="px-4 py-2 w-[180px]">Compliance level</th>
                                                <th className="px-4 py-2 w-[140px]">Vulnerability found</th>
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

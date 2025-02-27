import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import axios from "axios";
import Select from 'react-select';

function AppRunscan() {
  const [scriptResult, setScriptResult] = useState("");
  const [error, setError] = useState("");
  const [siList, setSiList] = useState([]);
  const [titleList, setTitleList] = useState([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  // État pour la section Conformity
  const [conformityTitle, setConformityTitle] = useState(null);
  const [conformitySI, setConformitySI] = useState(null);
  const [conformityServer, setConformityServer] = useState(null);
  const [conformityServers, setConformityServers] = useState([]);
  const [isConformityRunning, setIsConformityRunning] = useState(false);

  // État pour la section Vulnerability
  const [vulnerabilityTitle, setVulnerabilityTitle] = useState(null);
  const [vulnerabilitySI, setVulnerabilitySI] = useState(null);
  const [vulnerabilityServer, setVulnerabilityServer] = useState(null);
  const [vulnerabilityServers, setVulnerabilityServers] = useState([]);
  const [isVulnerabilityRunning, setIsVulnerabilityRunning] = useState(false);

  useEffect(() => {
    const fetchSIList = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/stats-get-si`);
        if (Array.isArray(response.data)) {
          setSiList(response.data.map(si => ({ value: si, label: si })));
        } else {
          setError("La réponse n'est pas un tableau.");
        }
      } catch (err) {
        console.error("Erreur lors de la récupération de la liste des SI:", err);
        setError("Erreur lors de la récupération des SI.");
      }
    };
    fetchSIList();
  }, [backendUrl]);

  useEffect(() => {
    const fetchTitles = async () => {
      try {
        const response = await axios.get(`${backendUrl}/api/oscap-profiles`);
        if (Array.isArray(response.data)) {
          setTitleList(response.data.map(title => ({ value: title.Id, label: title.Title })));
        } else {
          setError("Erreur lors de la récupération des titres.");
        }
      } catch (err) {
        console.error("Error get profiles:", err);
        setError("Error get profiles.");
      }
    };
    fetchTitles();
  }, [backendUrl]);

  const handleSIChange = async (selectedOption, setSI, setServer, setServers) => {
    setSI(selectedOption);
    setServer(null);
    setError("");
    try {
      const response = await axios.get(`${backendUrl}/api/stats-get-servers`, { params: { si: selectedOption.value } });
      setServers(response.data.map(server => ({ value: server, label: server })));
    } catch (err) {
      console.error("Error get servers:", err);
      setError("Error get servers.");
    }
  };

  const executeScan = async (si, server, scanType, selectedProfile) => {
    const setIsRunning = scanType === "conformity" ? setIsConformityRunning : setIsVulnerabilityRunning;
    setIsRunning(true);
    setError("");
    setScriptResult("");
    setElapsedTime(0);

    const timer = setInterval(() => {
      setElapsedTime((prevTime) => prevTime + 1);
    }, 1000);

    try {
      const response = await axios.get(`${backendUrl}/execute-runscan`, {
        params: {
          nom_si: si,
          server: server,
          interactive_mode: "yes",
          scan_type: scanType,
          profil: selectedProfile,
        },
      });
      setScriptResult(response.data);
    } catch (err) {
      console.error("Erreur lors de l'exécution du script:", err);
      setError("Erreur lors de l'exécution du script");
    } finally {
      clearInterval(timer);
      setIsRunning(false);
    }
  };

  return (
    <div className="flex">
      <Navbar />
      <main className="flex-1 ml-[200px] min-h-screen flex flex-col">
        <section className="flex-grow">
          <h2 className="title-header">
            Execute scan
          </h2>

          {error && <div className="text-red-500">{error}</div>}

          {/* Section Conformity */}
          <div className="border-2 rounded-xl customShadow p-4 mb-4">
            <h3 className="text-xl font-bold mb-4">Conformity Scan</h3>
            <div className="mb-4">
              <h4 className="text-lg font-semibold">Select profile</h4>
              <Select
                value={conformityTitle}
                onChange={setConformityTitle}
                options={titleList}
                placeholder="Select profile"
                isDisabled={vulnerabilitySI}
              />
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold">Select system</h4>
              <Select
                value={conformitySI}
                onChange={(option) => handleSIChange(option, setConformitySI, setConformityServer, setConformityServers)}
                options={siList}
                placeholder="Select system"
                isDisabled={!conformityTitle}
              />
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold">Select server</h4>
              <Select
                value={conformityServer}
                onChange={setConformityServer}
                options={conformityServers}
                placeholder="Select server"
                isDisabled={!conformitySI}
              />
            </div>

            <button
              onClick={() => executeScan(conformitySI?.value, conformityServer?.value, "conformity", conformityTitle?.value)}
              className="px-2 py-1 border rounded-md bg-blue-500 text-white hover:bg-blue-600"
              disabled={isConformityRunning || !conformityTitle || !conformitySI || !conformityServer}
            >
              {isConformityRunning ? "Executing..." : "Run Conformity Scan"}
            </button>
          </div>

          {/* Section Vulnerability */}
          <div className="border-2 rounded-xl customShadow p-4">
            <h3 className="text-xl font-bold mb-4">Vulnerability Scan</h3>
            <div className="mb-4">
              <h4 className="text-lg font-semibold">Select system</h4>
              <Select
                value={vulnerabilitySI}
                onChange={(option) => handleSIChange(option, setVulnerabilitySI, setVulnerabilityServer, setVulnerabilityServers)}
                options={siList}
                placeholder="Select system"
                isDisabled={conformityTitle}
              />
            </div>

            <div className="mb-4">
              <h4 className="text-lg font-semibold">Select server</h4>
              <Select
                value={vulnerabilityServer}
                onChange={setVulnerabilityServer}
                options={vulnerabilityServers}
                placeholder="Select server"
                isDisabled={!vulnerabilitySI}
              />
            </div>

            <button
              onClick={() => executeScan(vulnerabilitySI?.value, vulnerabilityServer?.value, "vulnerability", "null")}
              className="px-2 py-1 border rounded-md bg-green-500 text-white hover:bg-green-600"
              disabled={isVulnerabilityRunning || !vulnerabilitySI || !vulnerabilityServer}
            >
              {isVulnerabilityRunning ? "Executing..." : "Run Vulnerability Scan"}
            </button>
          </div>
        </section>
        <Footer />
      </main>
    </div>
  );
}

export default AppRunscan;

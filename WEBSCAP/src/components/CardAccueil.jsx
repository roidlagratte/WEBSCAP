import React from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

// Fonction de formatage d'une date
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date)) return "Date invalide";
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} (${hours}:${minutes})`;
};

// Fonction pour calculer le nombre de jours écoulés
const calculateDaysDifference = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now - date;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

export default function CardAccueil({ EvaluationData }) {
  // Pour les évaluations agrégées, on attend :
  // EvaluationData = { serveur, conformite, vulnerabilites, SI, resultats_conformite, resultats_vulnerabilites, id_conformite, id_vulnerabilites }
  const {
    serveur,
    conformite,
    vulnerabilites,
    SI,
    resultats_conformite,
    resultats_vulnerabilites,
    id_conformite,
    id_vulnerabilites,
    profil
  } = EvaluationData;

  // Colonne "conformite"
  const formattedConformite = formatDate(conformite);
  const conformiteDaysElapsed = conformite ? calculateDaysDifference(conformite) : null;
  const conformiteDaysClass =
    conformiteDaysElapsed === null
      ? "bg-black text-white px-2 py-1 rounded"
      : conformiteDaysElapsed > 20
        ? "bg-red-500 text-white px-2 py-1 rounded"
        : conformiteDaysElapsed > 10
          ? "bg-orange-500 text-white px-2 py-1 rounded"
          : "bg-green-500 text-white px-2 py-1 rounded";

  // Colonne "vulnerabilites"
  const formattedVulnerabilites = formatDate(vulnerabilites);
  const vulnerabilitesDaysElapsed = vulnerabilites ? calculateDaysDifference(vulnerabilites) : null;
  const vulnerabilitesDaysClass =
    vulnerabilitesDaysElapsed === null
      ? "bg-black text-white px-2 py-1 rounded"
      : vulnerabilitesDaysElapsed > 20
        ? "bg-red-500 text-white px-2 py-1 rounded"
        : vulnerabilitesDaysElapsed > 10
          ? "bg-orange-500 text-white px-2 py-1 rounded"
          : "bg-green-500 text-white px-2 py-1 rounded";

  const ScoreBar = ({ score }) => {
    const greenWidth = `${score}%`;
    const redWidth = `${100 - score}%`;
    return (
      <div className="w-full h-6 bg-red-500 rounded-full overflow-hidden flex items-center">
        <div
          className="h-full bg-green-500 flex items-center justify-end pr-2 text-white score-text"
          style={{ width: greenWidth }}
        >
          {score}%
        </div>
        <div className="h-full" style={{ width: redWidth }}></div>
      </div>
    );
  };
  const getVulnerabilityColor = (nbVuln) => {
    if (nbVuln < 5) return 'text-green-500';
    if (nbVuln < 20) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <tr>
      <td className="table-cell"><div className="table-cell-content">{SI || <span className="table-cell-na">N/A</span>}</div></td>
      <td className="table-cell"><div className="table-cell-content">{serveur || <span className="table-cell-na">N/A</span>}</div></td>
  
      {/* Colonne Conformité */}
      <td className="table-cell">
        <div className="table-cell-content">
          {conformite ? (
            <>
              <Link
                to="/conformity/"
                state={{
                  id: id_conformite,
                  serveur,
                  formattedDate: formattedConformite,
                  score: resultats_conformite,
                  profil,
                }}
                className="text-gray-900 hover:text-blue-500" style={{ textDecoration: 'underline' }}> 
                {formattedConformite}
              </Link>
              <div className={`mt-2 ${conformiteDaysClass} days-elapsed days-box`}>
                {conformiteDaysElapsed} days passed
              </div>
            </>
          ) : (
            <span className="table-cell-na days-elapsed days-box">Not yet</span>
          )}
        </div>
      </td>
  
      {/* Colonne Vulnérabilités */}
      <td className="table-cell">
        <div className="table-cell-content">
          {vulnerabilites ? (
            <>
              <Link
                to={`/vulnerability/`}
                state={{ id: id_vulnerabilites, serveur, formattedDate: formattedVulnerabilites, nb_vuln: resultats_vulnerabilites }}
                className="text-gray-900 hover:text-blue-500" style={{ textDecoration: 'underline' }}> 
                {formattedVulnerabilites}
              </Link>
              <div className={`mt-2 ${vulnerabilitesDaysClass} days-elapsed days-box`}>
                {vulnerabilitesDaysElapsed} days passed
              </div>
            </>
          ) : (
            <span className="table-cell-na days-elapsed days-box">Not yet</span>
          )}
        </div>
      </td>
  
      <td className="table-cell">
        <div className="table-cell-content">
          {resultats_conformite !== null && resultats_conformite !== undefined ? (
            <ScoreBar score={resultats_conformite} />
          ) : (
            <span className="table-cell-na days-elapsed days-box">N/A</span>
          )}
        </div>
      </td>
  
      <td className="table-cell">
        <div className="table-cell-content">
          {resultats_vulnerabilites !== null && resultats_vulnerabilites !== undefined ? (
            <span className={`${getVulnerabilityColor(resultats_vulnerabilites)} font-bold text-lg`}>
              {resultats_vulnerabilites}
            </span>
          ) : (
            <span className="table-cell-na days-elapsed days-box">N/A</span>
          )}
        </div>
      </td>
    </tr>
  );
}  

CardAccueil.propTypes = {
  EvaluationData: PropTypes.shape({
    serveur: PropTypes.string.isRequired,
    conformite: PropTypes.string,
    vulnerabilites: PropTypes.string,
    SI: PropTypes.string,
    profil: PropTypes.string,
    resultats_conformite: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    resultats_vulnerabilites: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    id_conformite: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    id_vulnerabilites: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }).isRequired,
};

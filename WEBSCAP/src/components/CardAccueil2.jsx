import React, { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

export default function CardAccueil2({ EvaluationData }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) return "Date invalide";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${day}/${month}/${year} (${hours}:${minutes})`;
  };

  const calculateDaysDifference = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const { id, serveur, datetest, score, type, nb_vuln, profil, SI, olderEntries } = EvaluationData;
  const formattedDate = formatDate(datetest);
  const daysElapsed = calculateDaysDifference(datetest);

  const daysClass =
    daysElapsed > 20
      ? "bg-red-500 text-white px-2 py-1 rounded"
      : daysElapsed > 10
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


  const extractProfileName = (fullProfileName) => {
    const prefix = "xccdf_org.open-scap_testresult_xccdf_org.ssgproject.content_profile_";
    return fullProfileName.startsWith(prefix)
      ? fullProfileName.slice(prefix.length)
      : fullProfileName;
  };

  const VulnerabilityBar = ({ nbVuln }) => {
    let textColor;
  
    if (nbVuln < 5) {
      textColor = 'text-green-500';
    } else if (nbVuln < 20) {
      textColor = 'text-orange-500';
    } else {
      textColor = 'text-red-500';
    }
  
    return (
      <div className="w-full h-6 flex items-center justify-center">
        <span className={`${textColor} font-bold text-lg`}>{nbVuln}</span>
      </div>
    );
  };
  




  return (
    <>
      <tr key={id} className="text-center">
        <td className="px-4 py-2">
          <div>{formattedDate}</div>
          <div className={`mt-2 ${daysClass} days-elapsed days-box`}>{daysElapsed} jours écoulés</div>
        </td>
        <td className="px-4 py-2">
          <Link
            to={type === "conformite" ? "/conformity" : "/vulnerability"}
            state={{ id, serveur, formattedDate, score, profil, nb_vuln, SI }}
          >
            <span className="text-gray-900 hover:text-blue-500" style={{ textDecoration: 'underline' }}>
              {type === "conformite" ? (
                <>
                  Compliance
                  {profil && (
                    <>
                      <br />
                      <span className="ml-2">({extractProfileName(profil)})</span>
                    </>
                  )}
                </>

              ) : (
                "Vulnerability"
              )}
            </span>
          </Link>
        </td>

        <td className="px-4 py-2">{SI}</td>
        <td className="px-4 py-2">{serveur}</td>
        <td className="px-4 py-2">
          {type === "conformite" ? (
            <ScoreBar score={score} />
          ) : (
            <VulnerabilityBar nbVuln={nb_vuln} />
          )}
        </td>

        <td className="px-4 py-2">
          {olderEntries && olderEntries.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
            >
              {isExpanded ? 'Reduce' : `${olderEntries.length} old records`}
            </button>
          )}
        </td>
      </tr>
      {isExpanded && olderEntries && olderEntries.map((entry) => (
        <tr key={entry.id} className="text-center bg-gray-100">
          <td className="px-4 py-2">{formatDate(entry.datetest)}</td>

          <td className="px-4 py-2">
            <Link
              to={entry.type === "conformite" ? "/conformity" : "/vulnerability"}
              state={{ id: entry.id, serveur: entry.serveur, formattedDate: formatDate(entry.datetest), score: entry.score, profil: entry.profil, nb_vuln: entry.nb_vuln, SI: entry.SI }}
            >
              <span className="hover:text-blue-500" style={{ textDecoration: 'underline' }}>
                {entry.type === "conformite" ? (
                  <div className="flex flex-col">
                    <span>Compliance</span>
                    {entry.profil && (
                      <span className="ml-2">({extractProfileName(entry.profil)})</span>
                    )}
                  </div>
                ) : (
                  "Vulnerability"
                )}
              </span>
            </Link>
          </td>
          <td className="px-4 py-2">{entry.SI}</td>
          <td className="px-4 py-2">{entry.serveur}</td>
          <td className="px-4 py-2">
            {entry.type === "conformite" ? (
              <ScoreBar score={entry.score} />
            ) : (
              <VulnerabilityBar nbVuln={entry.nb_vuln} />
            )}
          </td>
          <td></td>
        </tr>
      ))}

    </>
  );
}

CardAccueil2.propTypes = {
  EvaluationData: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    serveur: PropTypes.string.isRequired,
    datetest: PropTypes.string,
    profil: PropTypes.string,
    score: PropTypes.number,
    type: PropTypes.string,
    nb_vuln: PropTypes.number,
    SI: PropTypes.string,
    olderEntries: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
      datetest: PropTypes.string,
      type: PropTypes.string,
      SI: PropTypes.string,
      serveur: PropTypes.string,
      score: PropTypes.number,
      nb_vuln: PropTypes.number,
    })),
  }).isRequired,
};

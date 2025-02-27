// LES IMPORTS
import PropTypes from "prop-types";
import { useState } from "react";

export default function CardConformity({ EvaluationData = { id:"0", rule:"na", severity:"na", test:"na", titre:"na", description:"na", rationale:"na" } }) {

    // LA LOGIQUE
    const { id, rule, severity, test, titre, description, rationale } = EvaluationData; 
    const [isExpanded, setIsExpanded] = useState(false);
    const getSeverityStyle = (severity) => {
        switch (severity) {
            case "high":
                return "text-red-500 font-bold";
            case "medium":
                return "text-orange-500 font-bold";
            case "low":
                return "text-yellow-500 font-bold";
            default:
                return "text-black";
        }
  };

  const getTestStyle = (test) => {
    switch (test) {
      case "fail":
        return "text-red-500 font-bold";
      case "pass":
        return "text-green-500 font-bold";
      default:
        return "text-black";
    }
  };

  const formatRule = (rule) =>
    rule.replace("xccdf_org.ssgproject.content_rule_", "").replace(/_/g, " ");


    return (
      <>
      

                    <tr key={id} className="text-center">
                        <td className="px-4 py-2">
                            {formatRule(rule)}
                        </td>
                        <td className="px-4 py-2">
                            {formatRule(titre)}
                        </td>
                        <td className={`px-4 py-2  ${getSeverityStyle(severity)}`}>
                            {severity}
                        </td>
                        <td className={`px-4 py-2 ${getTestStyle(test)}`}>
                            {test}
                        </td>

                        <td className="px-4 py-2">
                          <button 
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                            >
                            {isExpanded ? 'Reduce' : 'Details'}
                          </button>
                        </td>
                    </tr>
     
                    {isExpanded && (
                      <tr>
                        <td colSpan="5" className="px-4 py-2 bg-gray-100">
                          <div className="text-left">
                            <p className="font-bold">Description:</p>
                            <p>{description}</p>
                            <p className="font-bold mt-2">Justification:</p>
                            <p>{rationale}</p>
                          </div>
                        </td>
                      </tr>
                    )}
      </>

    )
}

CardConformity.propTypes = {
    EvaluationData: PropTypes.shape({
      id: PropTypes.number.isRequired,
      rule: PropTypes.string,
      score: PropTypes.string,
      severity: PropTypes.string,
      test: PropTypes.string,
      title: PropTypes.string,
      description: PropTypes.string,
      rationale: PropTypes.string
    }).isRequired,
  };
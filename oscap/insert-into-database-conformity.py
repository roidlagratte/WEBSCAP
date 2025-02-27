import mysql.connector
from lxml import etree
from datetime import datetime
import sys

# Vérification des arguments
if len(sys.argv) != 4:
    print("Usage: python3 insert-into-database-conformity.py <NOM_SI> <NOM_SERVEUR> <Fichier XML>")
    sys.exit(1)

nom_si = sys.argv[1]
nom_serveur = sys.argv[2]
file_path = sys.argv[3]

# Connexion à la base de données MySQL
db_connection = mysql.connector.connect(
    host="localhost",
    user="oscap",  # Remplacez par votre utilisateur MySQL
    password="oscap",  # Remplacez par votre mot de passe MySQL
    database="oscap"  # Remplacez par le nom de votre base de données
)

cursor = db_connection.cursor()


# Charger le fichier XML
tree = etree.parse(file_path)
root = tree.getroot()
benchmark = tree.getroot()
# Définir les namespaces utilisés dans le fichier XML
namespaces = {
    'xccdf': 'http://checklists.nist.gov/xccdf/1.2',
}

# Recherche des balises <Group> et création d'un mapping des rules vers leurs groupes et descriptions
group_mapping = {}
for group in root.findall('.//xccdf:Group', namespaces):
    group_id = group.get('id')
    if group_id:
        rules = group.findall('.//xccdf:Rule', namespaces)
        for rule in rules:
            rule_id = rule.get('id')
            if rule_id:
                group_mapping[rule_id] = {
                    'group_id': group_id,
                    'description': group.findtext('.//xccdf:description', namespaces=namespaces)
                }

# Recherche des balises <TestResult>
test_results = root.findall('.//xccdf:TestResult', namespaces)

# Parcours des résultats de TestResult
for test_result in test_results:
    test_id = test_result.get('id')
    start_time = test_result.get('start-time')

    try:
        start_time = datetime.fromisoformat(start_time.replace("Z", "+00:00")).strftime('%Y-%m-%d %H:%M:%S')
    except ValueError:
        print(f"Invalid start-time format: {start_time}")
        continue

    target = test_result.find('.//xccdf:target', namespaces)
    target_text = target.text if target is not None else 'Not found'

    score_element = test_result.find('.//xccdf:score', namespaces)
    score_value = score_element.text if score_element is not None else 'Not found'

    evaluation_type = "conformite"

    insert_eval_query = """
        INSERT INTO evaluation (serveur, datetest, profil, score, type, SI)
        VALUES (%s, %s, %s, %s, %s, %s)
    """
    cursor.execute(insert_eval_query, (target_text, start_time, test_id, score_value, evaluation_type, nom_si))
    db_connection.commit()

    eval_id = cursor.lastrowid

    rule_results = test_result.findall('.//xccdf:rule-result', namespaces)
    for rule_result in rule_results:
        rule_idref = rule_result.get('idref')
        severity = rule_result.get('severity')
        title_element = benchmark.find(f".//xccdf:Rule[@id='{rule_idref}']/xccdf:title", namespaces)
        titre = title_element.text.strip() if title_element is not None else 'Title not found'
        description_element = benchmark.find(f".//xccdf:Rule[@id='{rule_idref}']/xccdf:description", namespaces)
        #description = description_element.text.strip() if description_element is not None else 'description not found'
        if description_element is not None:
            # Extraire tout le texte, y compris celui des sous-éléments
            description = ' '.join(description_element.itertext()).strip()
        else:
            description = 'Description not found'
        
        rationale_element = benchmark.find(f".//xccdf:Rule[@id='{rule_idref}']/xccdf:rationale", namespaces)
        if rationale_element is not None:
           rationale = ' '.join(rationale_element.itertext()).strip()
        else:
            rationale = 'Rationale not found'
        
        result_element = rule_result.find('xccdf:result', namespaces)
        result_value = result_element.text if result_element is not None else 'Not found'

        group_info = group_mapping.get(rule_idref, {})
        group_id = group_info.get('group_id', 'Not found')

        # Affichage sur la sortie standard
        #print(f"Rule ID: {rule_idref}")
        #print(f"Group ID: {group_id}")
        #print(f"Titre: {titre}")
        #print(f"Description: {description}")
        #print("-" * 80)

        insert_details_query = """
            INSERT INTO details (eval, rule, severity, test, titre, description, rationale)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_details_query, (eval_id, rule_idref, severity, result_value, titre, description, rationale))
        db_connection.commit()

# Fermer la connexion à la base de données
cursor.close()
db_connection.close()
print("FIN EXECUTION")

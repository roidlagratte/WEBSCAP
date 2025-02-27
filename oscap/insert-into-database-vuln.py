import sys
import xml.etree.ElementTree as ET
import re
import mysql.connector
from datetime import datetime

# Vérification des arguments
if len(sys.argv) != 4:
    print("Usage: python3 insert-into-database-conformity.py <NOM_SI> <NOM_SERVEUR> <RESULT_FILE>")
    sys.exit(1)

nom_si = sys.argv[1]
nom_serveur = sys.argv[2]
xml_file = sys.argv[3] 



def analyze_xml_and_patch(xml_file):
    try:

        conn = mysql.connector.connect(
            host='localhost',  # Remplacez par votre hôte
            user='oscap',  # Remplacez par votre utilisateur
            password='oscap',  # Remplacez par votre mot de passe
            database='oscap'  # Remplacez par le nom de votre base
        )
        cursor = conn.cursor()
        # Charger et analyser le fichier XML
        tree = ET.parse(xml_file)
        root = tree.getroot()
        # Définir les namespaces pour la recherche

        # Tableau pour stocker les valeurs trouvées
        definitions_found = []
        definitions_false = []
        patch_definitions_found = []
        patch_definitions_false = []

        # 0. récuperation des informations de base 
        namespaces = {
            'oval': 'http://oval.mitre.org/XMLSchema/oval-common-5',
            'unix-sys': 'http://oval.mitre.org/XMLSchema/oval-system-characteristics-5#unix',
            'ind-sys': 'http://oval.mitre.org/XMLSchema/oval-system-characteristics-5#independent',
            'lin-sys': 'http://oval.mitre.org/XMLSchema/oval-system-characteristics-5#linux',
            'win-sys': 'http://oval.mitre.org/XMLSchema/oval-system-characteristics-5#windows',
            '': 'http://oval.mitre.org/XMLSchema/oval-system-characteristics-5',
        }

        # Extraction des éléments nécessaires
        primary_host_name = root.find('.//system_info/primary_host_name', namespaces)
        #timestamp = root.find('.//generator/oval:timestamp', namespaces)
        timestamp = datetime.now().strftime("%Y-%m-%dT%H:%M:%S")


        # Affichage des résultats
        if timestamp is not None and primary_host_name is not None:
            #timestamp = timestamp.text
            nom = primary_host_name.text
        else:
            print("erreur: Date ou Nom du serveur non trouve")
            exit()

        namespaces = {
            '': 'http://oval.mitre.org/XMLSchema/oval-results-5',  # Espace de noms par défaut
        }

        # 1. Recherche des balises <definition> contenant l'attribut result="true"
        for definition in root.findall('.//definition[@result="true"]', namespaces):
            definition_id = definition.get('definition_id')
            version = definition.get('version')
            result = definition.get('result')
            #Stockage dans tableau
            if definition_id and version and result == "true":
                definitions_found.append({
                    'definition_id': definition_id,
                    'version': version,
                    'result': result
                })

        if definitions_found:
            print("Définitions trouvées avec result='true' :")
            for item in definitions_found:
                print(f"  ID: {item['definition_id']}, Version: {item['version']}, Result: {item['result']}")
        else:
            print("Aucune définition avec result='true' n'a été trouvée.")


        # 1.BIS Recherche des balises <definition> contenant l'attribut result="fale"
        for definition in root.findall('.//definition[@result="false"]', namespaces):
            definition_id = definition.get('definition_id')
            version = definition.get('version')
            result = definition.get('result')
            # Stockage dans tableau
            if definition_id and version and result == "false":
                definitions_false.append({
                    'definition_id': definition_id,
                    'version': version,
                    'result': result
                })

        if definitions_false:
            print("\nDéfinitions trouvées avec result='false' :")
            # ARNO for item in definitions_false:
                 # ARNO print(f"  ID: {item['definition_id']}, Version: {item['version']}, Result: {item['result']}")
        else:
            print("\nAucune définition avec result='false' n'a été trouvée.")



        # 2. Recherche des balises <definition> avec class="patch" et correspondances de definition_id
        score = 0
        nb_vuln = 0
        namespaces2 = {
            '': 'http://oval.mitre.org/XMLSchema/oval-definitions-5',  # Espace de noms par défaut
        }



        for definition in root.findall('.//definitions/definition[@class="patch"]', namespaces2):
            definition_id = definition.get('id')
            version = definition.get('version')
            class_attr = definition.get('class')

            for item in definitions_false:
                if item['definition_id'] == definition_id:
                    title = None
                    description = None
                    severity = None
                    cvss = []
                    references = []
                    for child in definition:
                        if child.tag.endswith('metadata'):
                            for metadata_child in child:
                                if metadata_child.tag.endswith('title'):
                                    title = metadata_child.text
                                    match = re.search(r'\((.*?)\)', title)
                                    if match:
                                        severity = match.group(1)

                                if metadata_child.tag.endswith('reference'):
                                    source = metadata_child.get('source')
                                    ref_id = metadata_child.get('ref_id')
                                    references.append(f"[{source};{ref_id}]")
                                
                                if metadata_child.tag.endswith('advisory'):
                                    for advisory_child in metadata_child:
                                        if advisory_child.tag.endswith('cve'):
                                            cvss3 = advisory_child.get('cvss3')
                                            if cvss3:
                                                cvss.append(f"[{cvss3}]")



                    references_str = ''.join(references) 
                    cvss_str = ''.join(cvss) 
                    # COMMENTAIRE CAR TROP DE LIGNES print(f"Définition trouvée si patch=false: ID={definition_id}, Title={title}, Severity={severity}, References={references_str}")
                    patch_definitions_false.append({
                        'definition_id': definition_id,
                        'version': version,
                        'class': class_attr,
                        'titre': title,
                        'description': description,
                        'severity': severity,
                        'references': references_str,
                        'cvss': cvss_str,
                        'patch': False,
                    })



            for item in definitions_found:
                if item['definition_id'] == definition_id:
                    title = None
                    description = None
                    severity = None
                    cvss = []
                    references = []
                    for child in definition:
                        if child.tag.endswith('metadata'):
                            for metadata_child in child:
                                if metadata_child.tag.endswith('title'):
                                    title = metadata_child.text
                                    match = re.search(r'\((.*?)\)', title)
                                    if match:
                                        severity = match.group(1)
                                        nb_vuln +=1
                                        if severity == "Low":
                                            score += 1
                                        elif severity == "Medium":
                                            score += 2
                                        elif severity == "Important":
                                            score += 3
                                        elif severity == "Critical":
                                            score += 4


                                if metadata_child.tag.endswith('description'):
                                    description = metadata_child.text

                                if metadata_child.tag.endswith('reference'):
                                    source = metadata_child.get('source')
                                    ref_id = metadata_child.get('ref_id')
                                    references.append(f"[{source};{ref_id}]")
                                
                                if metadata_child.tag.endswith('advisory'):
                                    for advisory_child in metadata_child:
                                        if advisory_child.tag.endswith('cve'):
                                            cvss3 = advisory_child.get('cvss3')
                                            if cvss3:
                                                cvss.append(f"[{cvss3}]")

                    references_str = ''.join(references)
                    cvss_str = ''.join(cvss) 
                    print(f"Définition trouvée si patch=true: ID={definition_id}, Title={title}, Severity={severity}, CVSS={cvss_str}, References={references_str}")
                    patch_definitions_found.append({
                        'definition_id': definition_id,
                        'version': version,
                        'class': class_attr,
                        'titre': title,
                        'description': description,
                        'severity': severity,
                        'references': references_str,
                        'cvss': cvss_str,
                        'patch': True,
                    })


        print("PREPARATION INSERTION")
        print("SERVEUR:" + nom)
        print("Date :" + timestamp)
        print("SCORE:" + str(score))
        print("NOMBRE VULN:" + str(nb_vuln))
        print("NOM SI:" + nom_si)
        score_moyenne = round(score / nb_vuln,1) if nb_vuln else 0
        print("SCORE MOYEN:" + str(score_moyenne))

        # Insertion des données dans la base
        insert_query = """
            INSERT INTO evaluation (serveur, datetest, profil, score, type, nb_vuln, SI)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(insert_query, (nom, timestamp, "oscap-oval", score, "vulnerabilites", nb_vuln, nom_si))
        conn.commit()


        # Récupération de l'ID de l'évaluation
        select_query = """
            SELECT id FROM evaluation WHERE serveur = %s AND datetest = %s
        """
        cursor.execute(select_query, (nom, timestamp))
        result = cursor.fetchone()
        if  result:
            print("TROUVE ID:" + str(result[0]))
            eval_id = result[0]
        else:
            print("Erreur de récuperation de ID lors de la requete SQL")
            exit


        if patch_definitions_found:
            for item in patch_definitions_found:
                try:
                    print(f"ID DEFINITION FOUND:{item['definition_id']}, Version: {item['version']}, "
                        f"Class: {item['class']}, Severity {item['severity']}, CVSS {item['cvss']},"
                        f"References: {item['references']}")
                except KeyError as e:
                    print(f"Erreur dans l'affichage des références pour l'élément {item['definition_id']}: {e}")

                insert_patch_query = """
                    INSERT INTO vulnerability (eval, titre, severity, description, reference, patch, cvss)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(insert_patch_query, (eval_id, item['titre'], item['severity'], item['description'], item['references'], item['patch'], item['cvss']))
                conn.commit()
                # DEBUG print(f"INSERTION DE:{eval_id}, Severity  {item['severity']}, Desciption {item['description']},  References: {item['references']},  Patch:  {item['patch']}")
        else:
            print("\nAucune définition avec class='patch' n'a été trouvée.")



        if patch_definitions_false:
            for item in patch_definitions_false:
                try:
                    print(f"ID DEFENITION FALSE:{item['definition_id']}, Version: {item['version']}, "
                        f"Class: {item['class']}, Severity {item['severity']}, CVSS {item['cvss']}, "
                        f"References: {item['references']}")
                except KeyError as e:
                    print(f"Erreur dans l'affichage des références pour l'élément {item['definition_id']}: {e}")

                insert_patch_query = """
                    INSERT INTO vulnerability (eval, titre, severity, description, reference, patch, cvss)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """
                cursor.execute(insert_patch_query, (eval_id, item['titre'], item['severity'], item['description'], item['references'], item['patch'], item['cvss']))
                conn.commit()
                # DEBUG print(f"INSERTION DE:{eval_id}, Severity  {item['severity']}, Desciption {item['description']},  References: {item['references']},  Patch:  {item['patch']}")
        else:
            print("\nAucune définition avec class='patch false' n'a été trouvée.")






    except FileNotFoundError:
        print(f"Le fichier {xml_file} est introuvable.")
    except ET.ParseError:
        print(f"Le fichier {xml_file} est mal formé.")
    except Exception as e:
        print(f"Erreur inattendue : {e}")

# Exemple d'appel de la fonction
analyze_xml_and_patch(xml_file)


#!/bin/bash

function show_help {
    echo "Usage: $0 <NOM_SI> <NOM_SERVEUR> [--interactive-mode=yes|no] [--profil=<profil>] [--ansible]"
    echo "  <NOM_SI>               : Nom du SI (obligatoire)"
    echo "  <NOM_SERVEUR>          : Nom du serveur (obligatoire)"
    echo "  --interactive-mode=yes : Permet à l'utilisateur de choisir un profil"
    echo "  --interactive-mode=no  : Lance le scan avec le profil ANSSI-BP-028 (minimal)"
    echo "  --profil=<profil>      : Spécifie le profil à utiliser (si l'option interactive-mode est à yes, cette option empêche le menu)"
    echo "  --ansible              : Utiliser Ansible au lieu de SSH"
    echo "  Sans option ou avec une option invalide : Affiche cette aide"
}

USE_ANSIBLE=false

function get_os_version {
    if [[ "$USE_ANSIBLE" == true ]]; then
        ansible "$1" -i /opt/ansible/hosts -m shell -a "grep '^VERSION_ID' /etc/os-release | cut -d'=' -f2 | tr -d '\"' | cut -d'.' -f1" | sed -n '$p'
    else
        ssh root@"$1" "grep '^VERSION_ID' /etc/os-release | cut -d'=' -f2 | tr -d '\"' | cut -d'.' -f1"
    fi
}

function list_profiles {
    if [[ "$NOM_SERVEUR" == "localhost" || "$NOM_SERVEUR" == "localhost.localdomain" ]]; then
        profiles=($(oscap info /usr/share/xml/scap/ssg/content/ssg-almalinux9-ds.xml | grep "Id:" | awk '{print $2}'))
    else
        os_version=$(get_os_version "$NOM_SERVEUR")
        if [[ "$USE_ANSIBLE" == true ]]; then
            profiles=($(ansible "$NOM_SERVEUR" -i /opt/ansible/hosts -m shell -a "oscap info /usr/share/xml/scap/ssg/content/ssg-almalinux${os_version}-ds.xml | grep 'Id:' | awk '{print \$2}'" | sed -n '$p'))
        else
            profiles=($(ssh root@"$NOM_SERVEUR" "oscap info /usr/share/xml/scap/ssg/content/ssg-almalinux${os_version}-ds.xml | grep 'Id:' | awk '{print \$2}'"))
        fi
    fi

    if [ -z "$profil" ]; then
        echo "Choisissez un profil :"
        for i in "${!profiles[@]}"; do
            echo "$((i+1)). ${profiles[$i]}"
        done

        read -p "Entrez le numéro du profil : " choice
        if [[ $choice =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#profiles[@]}" ]; then
            selected_profile="${profiles[$((choice-1))]}"
            run_scan "$selected_profile" "$NOM_SI" "$NOM_SERVEUR"
        else
            echo "Choix invalide. Fin du script."
            exit 1
        fi
    else
        selected_profile="$profil"
        run_scan "$selected_profile" "$NOM_SI" "$NOM_SERVEUR"
    fi
}

function run_scan {
    profile="$1"
    nom_si="$2"
    nom_serveur="$3"

    echo "Début du scan avec le profil $profile"

    if [[ "$nom_serveur" == "localhost" || "$nom_serveur" == "localhost.localdomain" ]]; then
        os_version=$(cat /etc/os-release | grep '^VERSION_ID' | cut -d'=' -f2 | cut -d'.' -f1 | tr -d '"')
        oscap xccdf eval --fetch-remote-resources --results "/opt/WEBSCAP/oscap/results/oscap-xccdf-result-localhost.xml" --profile "$profile" /usr/share/xml/scap/ssg/content/ssg-almalinux"$os_version"-ds.xml
        result_path="/opt/WEBSCAP/oscap/results/oscap-xccdf-result-localhost.xml"
    else
        os_version=$(get_os_version "$nom_serveur")
        if [[ "$USE_ANSIBLE" == true ]]; then
            ansible-playbook -i "$nom_serveur," -e "profile=$profile os_version=$os_version" /opt/ansible/scan_oval_compliance.yaml
            result_path="/opt/WEBSCAP/oscap/results/oscap-xccdf-result-$nom_serveur.xml"
        else
            ssh root@"$nom_serveur" "oscap xccdf eval --fetch-remote-resources --results /tmp/oscap-xccdf-result.xml --profile \"$profile\" /usr/share/xml/scap/ssg/content/ssg-almalinux${os_version}-ds.xml"
            scp root@"$nom_serveur":/tmp/oscap-xccdf-result.xml /opt/WEBSCAP/oscap/results/oscap-xccdf-result-"$nom_serveur".xml
            result_path="/opt/WEBSCAP/oscap/results/oscap-xccdf-result-$nom_serveur.xml"
        fi
    fi

    python3 /opt/WEBSCAP/oscap/insert-into-database-conformity.py "$nom_si" "$nom_serveur" "$result_path"
}

# Vérifier si le nom du SI et le serveur sont fournis
if [ $# -lt 2 ]; then
    show_help
    exit 1
fi

NOM_SI="$1"
NOM_SERVEUR="$2"
shift 2

# Traiter les options
profil=""
interactive_mode=""
while [ $# -gt 0 ]; do
    case "$1" in
        --interactive-mode=yes) interactive_mode="yes" ;;
        --interactive-mode=no) interactive_mode="no" ;;
        --profil=*) profil="${1#--profil=}" ;;
        --ansible) USE_ANSIBLE=true ;;
        *) show_help; exit 1 ;;
    esac
    shift
done

# Si --interactive-mode est à yes et --profil n'est pas défini, on lance le menu
if [ "$interactive_mode" == "yes" ]; then
    list_profiles
elif [ "$interactive_mode" == "no" ]; then
    if [ -n "$profil" ]; then
        run_scan "$profil" "$NOM_SI" "$NOM_SERVEUR"
    else
        run_scan "xccdf_org.ssgproject.content_profile_anssi_bp28_minimal" "$NOM_SI" "$NOM_SERVEUR"
    fi
else
    show_help
    exit 1
fi


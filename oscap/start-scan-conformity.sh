#!/bin/bash

function show_help {
    echo "Usage: $0 <NOM_SI> <NOM_SERVEUR> [--interactive-mode=yes|no] [--profil=<profil>]"
    echo "  <NOM_SI>               : Nom du SI (obligatoire)"
    echo "  <NOM_SERVEUR>          : Nom du serveur (obligatoire)"
    echo "  --interactive-mode=yes : Permet à l'utilisateur de choisir un profil"
    echo "  --interactive-mode=no  : Lance le scan avec le profil ANSSI-BP-028 (minimal)"
    echo "  --profil=<profil>       : Spécifie le profil à utiliser (si l'option interactive-mode est à yes, cette option empêche le menu)"
    echo "  Sans option ou avec une option invalide : Affiche cette aide"
}

function get_os_version {
    # Détecter la version d'AlmaLinux (8 ou 9) en se basant sur /etc/os-release
    os_version=$(ssh root@"$1" "cat /etc/os-release | grep '^VERSION_ID' | cut -d'=' -f2 | cut -d'.' -f1" | tr -d '"')
    echo "$os_version"
}

function list_profiles {
    # Déterminer si c'est un scan local ou distant
    if [[ "$NOM_SERVEUR" == "localhost" || "$NOM_SERVEUR" == "localhost.localdomain" ]]; then
        profiles=($(oscap info /usr/share/xml/scap/ssg/content/ssg-almalinux9-ds.xml | grep "Id:" | awk '{print $2}'))
    else
        os_version=$(get_os_version "$NOM_SERVEUR")
        if [ "$os_version" == "8" ]; then
            profiles=($(ssh root@"$NOM_SERVEUR" "oscap info /usr/share/xml/scap/ssg/content/ssg-almalinux8-ds.xml | grep 'Id:' | awk '{print \$2}'"))
        elif [ "$os_version" == "9" ]; then
            profiles=($(ssh root@"$NOM_SERVEUR" "oscap info /usr/share/xml/scap/ssg/content/ssg-almalinux9-ds.xml | grep 'Id:' | awk '{print \$2}'"))
        else
            echo "Version AlmaLinux inconnue ($os_version)."
            exit 1
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
        # Si un profil est passé en argument, on l'utilise directement
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
        oscap xccdf eval --results "/opt/WEBSCAP/oscap/results/oscap-xccdf-result-localhost.xml" --profile "$profile" /usr/share/xml/scap/ssg/content/ssg-almalinux"$os_version"-ds.xml
        result_path="/opt/WEBSCAP/oscap/results/oscap-xccdf-result-localhost.xml"
    else
        os_version=$(get_os_version "$nom_serveur")
        if [ "$os_version" == "8" ]; then
            ssh root@"$nom_serveur" "oscap xccdf eval --results /tmp/oscap-xccdf-result.xml --profile \"$profile\" /usr/share/xml/scap/ssg/content/ssg-almalinux8-ds.xml"
            scp root@"$nom_serveur":/tmp/oscap-xccdf-result.xml /opt/WEBSCAP/oscap/results/oscap-xccdf-result-"$nom_serveur".xml
            result_path="/opt/WEBSCAP/oscap/results/oscap-xccdf-result-$nom_serveur.xml"
        elif [ "$os_version" == "9" ]; then
            ssh root@"$nom_serveur" "oscap xccdf eval --results /tmp/oscap-xccdf-result.xml --profile \"$profile\" /usr/share/xml/scap/ssg/content/ssg-almalinux9-ds.xml"
            scp root@"$nom_serveur":/tmp/oscap-xccdf-result.xml /opt/WEBSCAP/oscap/results/oscap-xccdf-result-"$nom_serveur".xml
            result_path="/opt/WEBSCAP/oscap/results/oscap-xccdf-result-$nom_serveur.xml"
        else
            echo "Version AlmaLinux inconnue ($os_version)."
            exit 1
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
while [ $# -gt 0 ]; do
    case "$1" in
        --interactive-mode=yes) interactive_mode="yes" ;;
        --interactive-mode=no) interactive_mode="no" ;;
        --profil=*) profil="${1#--profil=}" ;;
        *) show_help; exit 1 ;;
    esac
    shift
done

# Si --interactive-mode est à yes et --profil n'est pas défini, on lance le menu
if [ "$interactive_mode" == "yes" ]; then
    list_profiles
elif [ "$interactive_mode" == "no" ]; then
    run_scan "xccdf_org.ssgproject.content_profile_anssi_bp28_minimal" "$NOM_SI" "$NOM_SERVEUR"
else
    show_help
    exit 1
fi


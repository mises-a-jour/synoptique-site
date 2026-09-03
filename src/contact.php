<?php
/**
 * Traitement du formulaire de contact — Éditions Synoptique
 *
 * Reçoit les champs de la page « Nous écrire », valide, puis expédie le message
 * à la boîte de la maison. Aucune adresse n'apparaît dans le site public.
 *
 * Protection contre les robots : un champ « site » invisible (pot de miel).
 * Un humain ne le voit pas et le laisse vide ; un robot le remplit.
 */

$DESTINATAIRE = 'info-ssjf@editions-synoptique.com';
$EXPEDITEUR   = 'info-ssjf@editions-synoptique.com'; // doit rester sur le domaine
$RETOUR       = '/nous-ecrire/';

function retour($etat) {
    global $RETOUR;
    header('Location: ' . $RETOUR . '?envoi=' . $etat);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    retour('erreur');
}

// Pot de miel : rempli = robot. On feint le succès pour ne rien lui apprendre.
if (!empty($_POST['site'])) {
    retour('ok');
}

$nom      = trim($_POST['nom']      ?? '');
$courriel = trim($_POST['courriel'] ?? '');
$objet    = trim($_POST['objet']    ?? '');
$message  = trim($_POST['message']  ?? '');

if ($nom === '' || $courriel === '' || $message === '') {
    retour('incomplet');
}

if (!filter_var($courriel, FILTER_VALIDATE_EMAIL)) {
    retour('courriel');
}

// Un saut de ligne dans ces champs permettrait d'injecter des en-têtes.
$nom      = str_replace(["\r", "\n"], ' ', $nom);
$courriel = str_replace(["\r", "\n"], ' ', $courriel);
$objet    = str_replace(["\r", "\n"], ' ', $objet);

$objets_permis = ['Manuscrit', 'Demande de presse', 'Demande libraire', 'Question générale'];
if (!in_array($objet, $objets_permis, true)) {
    $objet = 'Question générale';
}

$sujet = '[Site] ' . $objet . ' — ' . $nom;

$corps = "Nouveau message envoyé depuis editions-synoptique.com\n"
       . "----------------------------------------------------\n\n"
       . "Nom      : $nom\n"
       . "Courriel : $courriel\n"
       . "Objet    : $objet\n\n"
       . "Message :\n\n"
       . $message . "\n\n"
       . "----------------------------------------------------\n"
       . "Reçu le " . date('d/m/Y à H:i') . "\n";

$entetes = [
    'From: Éditions Synoptique <' . $EXPEDITEUR . '>',
    'Reply-To: ' . $nom . ' <' . $courriel . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'X-Mailer: PHP/' . phpversion(),
];

$envoye = @mail(
    $DESTINATAIRE,
    '=?UTF-8?B?' . base64_encode($sujet) . '?=',
    $corps,
    implode("\r\n", $entetes)
);

retour($envoye ? 'ok' : 'erreur');

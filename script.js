/**
 * Liste de tâches : état en mémoire, affichage au DOM, copie dans localStorage.
 * Le texte saisi n'est jamais injecté via innerHTML.
 */

const CLE_TACHES = "todo-taches";
const CLE_THEME = "todo-theme";

const el = {
  formulaire: document.getElementById("formulaire"),
  champ: document.getElementById("champ-tache"),
  liste: document.getElementById("liste"),
  vide: document.getElementById("vide"),
  compteur: document.getElementById("compteur"),
  message: document.getElementById("message"),
  boutonPurger: document.getElementById("bouton-purger"),
  boutonTheme: document.getElementById("bouton-theme"),
  iconeTheme: document.getElementById("icone-theme"),
  filtres: document.querySelectorAll("[data-filtre]"),
};

/** @type {{ id: string, texte: string, terminee: boolean }[]} */
let taches = [];
let filtreActif = "toutes";
let idEnEdition = null;
let timerMessage = 0;

/** Identifiant unique pour chaque tâche. */
function identifiant() {
  if (window.crypto && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `t-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function estTacheValide(valeur) {
  return Boolean(
    valeur &&
      typeof valeur.id === "string" &&
      typeof valeur.texte === "string" &&
      typeof valeur.terminee === "boolean"
  );
}

/** Affiche un message d'erreur court, annoncé par les lecteurs d'écran. */
function signaler(texte) {
  el.message.textContent = texte;
  window.clearTimeout(timerMessage);
  timerMessage = window.setTimeout(() => {
    el.message.textContent = "";
  }, 3500);
}

/** Lit les tâches enregistrées. Retourne un tableau vide si la lecture échoue. */
function charger() {
  try {
    const brut = localStorage.getItem(CLE_TACHES);
    if (!brut) return [];
    const donnees = JSON.parse(brut);
    if (!Array.isArray(donnees)) return [];
    return donnees.filter(estTacheValide);
  } catch (erreur) {
    signaler("Les tâches enregistrées n'ont pas pu être lues.");
    return [];
  }
}

/** Enregistre les tâches. L'échec (quota, mode privé) n'interrompt pas l'usage. */
function sauvegarder() {
  try {
    localStorage.setItem(CLE_TACHES, JSON.stringify(taches));
  } catch (erreur) {
    signaler("Impossible d'enregistrer les tâches sur cet appareil.");
  }
}

function lireThemeMemorise() {
  try {
    const theme = localStorage.getItem(CLE_THEME);
    if (theme === "clair" || theme === "sombre") return theme;
  } catch (erreur) {
    /* Pas de préférence exploitable. */
  }
  return null;
}

function themeSysteme() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "sombre" : "clair";
}

function themeActuel() {
  const impose = document.documentElement.getAttribute("data-theme");
  if (impose === "clair" || impose === "sombre") return impose;
  return themeSysteme();
}

function mettreAJourControleTheme(theme) {
  const sombre = theme === "sombre";
  el.boutonTheme.setAttribute(
    "aria-label",
    sombre ? "Activer le thème clair" : "Activer le thème sombre"
  );
  el.boutonTheme.setAttribute("aria-pressed", sombre ? "true" : "false");
  el.iconeTheme.textContent = sombre ? "☀" : "☾";
}

function appliquerTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  mettreAJourControleTheme(theme);
}

/** Bascule clair/sombre et mémorise le choix. */
function basculerTheme() {
  const prochain = themeActuel() === "sombre" ? "clair" : "sombre";
  appliquerTheme(prochain);
  try {
    localStorage.setItem(CLE_THEME, prochain);
  } catch (erreur) {
    signaler("Impossible d'enregistrer le thème sur cet appareil.");
  }
}

function nombreRestant() {
  return taches.filter((tache) => !tache.terminee).length;
}

function libelleRestant(nombre) {
  if (nombre === 0) return "Aucune tâche restante";
  if (nombre === 1) return "1 tâche restante";
  return `${nombre} tâches restantes`;
}

function tachesVisibles() {
  if (filtreActif === "actives") return taches.filter((tache) => !tache.terminee);
  if (filtreActif === "terminees") return taches.filter((tache) => tache.terminee);
  return taches;
}

function messageVide() {
  if (filtreActif === "actives") return "Aucune tâche active.";
  if (filtreActif === "terminees") return "Aucune tâche terminée.";
  return "Aucune tâche pour le moment.";
}

/** Change le filtre d'affichage sans modifier les données. */
function filtrer(nom) {
  if (nom !== "toutes" && nom !== "actives" && nom !== "terminees") return;
  filtreActif = nom;
  el.filtres.forEach((bouton) => {
    bouton.setAttribute("aria-pressed", bouton.dataset.filtre === nom ? "true" : "false");
  });
  afficher();
}

function selecteurId(id) {
  const echappe = window.CSS && typeof CSS.escape === "function" ? CSS.escape(id) : id;
  return `[data-id="${echappe}"]`;
}

/** Construit une ligne. Le texte utilisateur passe uniquement par textContent. */
function creerLigne(tache, animer) {
  const ligne = document.createElement("li");
  ligne.className = "tache";
  ligne.dataset.id = tache.id;
  ligne.setAttribute("role", "listitem");
  if (tache.terminee) ligne.classList.add("tache--terminee");
  if (animer) ligne.classList.add("tache--entree");

  const coche = document.createElement("input");
  coche.type = "checkbox";
  coche.className = "tache__case";
  coche.checked = tache.terminee;
  coche.setAttribute(
    "aria-label",
    `${tache.terminee ? "Marquer comme active" : "Marquer comme terminée"} : ${tache.texte}`
  );

  const texte = document.createElement("span");
  texte.className = "tache__texte";
  texte.tabIndex = 0;
  texte.textContent = tache.texte;
  texte.setAttribute("role", "button");
  texte.setAttribute(
    "aria-label",
    `Modifier « ${tache.texte} ». Double-clic ou touche Entrée.`
  );

  const supprimer = document.createElement("button");
  supprimer.type = "button";
  supprimer.className = "tache__supprimer";
  supprimer.dataset.action = "supprimer";
  supprimer.textContent = "Supprimer";
  supprimer.setAttribute("aria-label", `Supprimer « ${tache.texte} »`);

  ligne.append(coche, texte, supprimer);
  return ligne;
}

/**
 * Redessine la liste selon le filtre courant.
 * @param {{ animerId?: string }} [options]
 */
function afficher(options) {
  const animerId = options && options.animerId;
  const visibles = tachesVisibles();
  const fragment = document.createDocumentFragment();

  visibles.forEach((tache) => {
    fragment.append(creerLigne(tache, tache.id === animerId));
  });

  el.liste.replaceChildren(fragment);
  el.compteur.textContent = libelleRestant(nombreRestant());

  const aucune = visibles.length === 0;
  el.vide.hidden = !aucune;
  el.vide.textContent = messageVide();
  el.boutonPurger.disabled = !taches.some((tache) => tache.terminee);
}

/** Ajoute une tâche. Refuse le texte vide ou composé d'espaces. */
function ajouterTache(texte) {
  const propre = texte.trim();
  if (!propre) {
    signaler("La tâche ne peut pas être vide.");
    el.champ.focus();
    return;
  }

  const tache = { id: identifiant(), texte: propre, terminee: false };
  taches.push(tache);
  sauvegarder();
  if (filtreActif === "terminees") filtreActif = "toutes";
  filtrer(filtreActif);
  afficher({ animerId: tache.id });
  el.champ.value = "";
  el.champ.focus();
}

/** Inverse l'état terminé / actif d'une tâche. */
function basculerTache(id) {
  const tache = taches.find((item) => item.id === id);
  if (!tache) return;
  tache.terminee = !tache.terminee;
  sauvegarder();
  afficher();
}

function mouvementReduit() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Joue la disparition, puis appelle ensuite une seule fois. */
function animerSortie(ligne, ensuite) {
  if (!ligne || mouvementReduit()) {
    ensuite();
    return;
  }

  let termine = false;
  const fin = () => {
    if (termine) return;
    termine = true;
    ensuite();
  };

  ligne.classList.add("tache--sortie");
  ligne.addEventListener("animationend", (evenement) => {
    if (evenement.target === ligne) fin();
  });
  window.setTimeout(fin, 280);
}

/** Supprime une tâche après l'animation de sortie. */
function supprimerTache(id) {
  const ligne = el.liste.querySelector(selecteurId(id));
  const suivante = ligne && (ligne.nextElementSibling || ligne.previousElementSibling);
  const idSuivant = suivante ? suivante.dataset.id : "";

  animerSortie(ligne, () => {
    taches = taches.filter((tache) => tache.id !== id);
    sauvegarder();
    afficher();
    const bouton = idSuivant
      ? el.liste.querySelector(`${selecteurId(idSuivant)} .tache__supprimer`)
      : null;
    if (bouton) bouton.focus();
    else el.champ.focus();
  });
}

/** Enregistre le nouveau libellé, déjà validé comme non vide. */
function modifierTache(id, texte) {
  const tache = taches.find((item) => item.id === id);
  if (!tache) return;
  tache.texte = texte;
  sauvegarder();
  afficher();
}

/** Ouvre l'édition au double-clic ou à la touche Entrée. */
function commencerEdition(id) {
  if (idEnEdition) return;
  const tache = taches.find((item) => item.id === id);
  const ligne = el.liste.querySelector(selecteurId(id));
  if (!tache || !ligne) return;

  const span = ligne.querySelector(".tache__texte");
  const champ = document.createElement("input");
  champ.type = "text";
  champ.className = "tache__edition";
  champ.value = tache.texte;
  champ.maxLength = 200;
  champ.setAttribute("aria-label", "Texte de la tâche");

  idEnEdition = id;
  span.replaceWith(champ);
  champ.focus();
  champ.select();

  let fermee = false;

  const fermerSansChangement = () => {
    if (fermee) return;
    fermee = true;
    idEnEdition = null;
    afficher();
  };

  const valider = () => {
    if (fermee) return;
    const valeur = champ.value.trim();
    if (!valeur) {
      fermee = true;
      idEnEdition = null;
      signaler("La tâche ne peut pas être vide.");
      afficher();
      return;
    }
    fermee = true;
    idEnEdition = null;
    modifierTache(id, valeur);
  };

  champ.addEventListener("keydown", (evenement) => {
    if (evenement.key === "Enter") {
      evenement.preventDefault();
      valider();
    } else if (evenement.key === "Escape") {
      evenement.preventDefault();
      fermerSansChangement();
    }
  });

  champ.addEventListener("blur", () => {
    if (idEnEdition === id) valider();
  });
}

/** Retire toutes les tâches cochées, avec fondu pour celles qui sont visibles. */
function supprimerTerminees() {
  const ids = new Set(taches.filter((tache) => tache.terminee).map((tache) => tache.id));
  if (ids.size === 0) return;

  const lignes = [...el.liste.querySelectorAll(".tache")].filter((ligne) =>
    ids.has(ligne.dataset.id)
  );

  const appliquer = () => {
    taches = taches.filter((tache) => !tache.terminee);
    sauvegarder();
    afficher();
    el.champ.focus();
  };

  if (lignes.length === 0) {
    appliquer();
    return;
  }

  let reste = lignes.length;
  lignes.forEach((ligne) => {
    animerSortie(ligne, () => {
      reste -= 1;
      if (reste === 0) appliquer();
    });
  });
}

function initTheme() {
  const memoire = lireThemeMemorise();
  if (memoire) appliquerTheme(memoire);
  else mettreAJourControleTheme(themeSysteme());

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (!lireThemeMemorise()) mettreAJourControleTheme(themeSysteme());
  });
}

function init() {
  taches = charger();
  initTheme();
  afficher();

  el.formulaire.addEventListener("submit", (evenement) => {
    evenement.preventDefault();
    ajouterTache(el.champ.value);
  });

  el.liste.addEventListener("change", (evenement) => {
    const coche = evenement.target.closest(".tache__case");
    if (!coche) return;
    const ligne = coche.closest(".tache");
    if (ligne) basculerTache(ligne.dataset.id);
  });

  el.liste.addEventListener("click", (evenement) => {
    const bouton = evenement.target.closest("[data-action='supprimer']");
    if (!bouton) return;
    const ligne = bouton.closest(".tache");
    if (ligne) supprimerTache(ligne.dataset.id);
  });

  el.liste.addEventListener("dblclick", (evenement) => {
    const texte = evenement.target.closest(".tache__texte");
    if (!texte) return;
    const ligne = texte.closest(".tache");
    if (ligne) commencerEdition(ligne.dataset.id);
  });

  el.liste.addEventListener("keydown", (evenement) => {
    const texte = evenement.target.closest(".tache__texte");
    if (!texte || evenement.key !== "Enter") return;
    evenement.preventDefault();
    const ligne = texte.closest(".tache");
    if (ligne) commencerEdition(ligne.dataset.id);
  });

  el.filtres.forEach((bouton) => {
    bouton.addEventListener("click", () => filtrer(bouton.dataset.filtre));
  });

  el.boutonPurger.addEventListener("click", supprimerTerminees);
  el.boutonTheme.addEventListener("click", basculerTheme);
}

init();
# RUKN — Brief de développement (à lire par Claude Code)

> **Nom de code provisoire : RUKN.** Application web de *diagnostic de résilience* pour le mid-market de la région MENA.
> Ce document est ta source de vérité. Lis-le en entier avant d'écrire la moindre ligne de code.

---

## 0. À FAIRE EN PREMIER — lis le deck

Le pitch investisseur complet est dans **`./RUKN_Deck.pptx`** (place le fichier à la racine du repo).

1. Extrais le texte du `.pptx` (`python-pptx`, ou `unzip RUKN_Deck.pptx` puis lis les `ppt/slides/slideN.xml`).
2. Internalise surtout ces slides :
   - **Le problème** : les boîtes MENA subissent des chocs FX / politiques / de liquidité que les outils occidentaux ne modélisent pas. Le mid-market (importateurs, distributeurs, industriels, 10–200 M$ de CA) est le plus exposé et le moins outillé.
   - **L'insight** : *« identifier un risque est une vitamine ; la résilience est l'anti-douleur »*. On ne s'arrête pas au constat, on quantifie l'impact cash et on donne le plan.
   - **Les 3 moteurs** : bibliothèque de scénarios → modèle d'exposition → playbook de mitigation. Le tout converge vers **un seul chiffre : le Resilience Score**.
   - **Le mock produit** (slide « The product ») : c'est l'écran qu'on construit en premier. Reproduis-en l'esprit.
3. Si un détail du code et du deck divergent, **ce README fait foi**.

---

## 1. Ce qu'on construit (périmètre v1)

Un **prototype web frontend-only**, démo-able immédiatement, qui matérialise **le diagnostic payant** :

> L'utilisateur décrit l'exposition de son entreprise → l'app calcule un **Resilience Score**, chiffre l'impact (€) des chocs les plus probables, et affiche un **playbook de leviers priorisés**. Marquer un levier « fait » fait remonter le score.

C'est tout. Pas de backend, pas de comptes, pas de base de données pour la v1. L'objectif est de pouvoir le **mettre devant 3 prospects cette semaine**, pas de bâtir une plateforme.

---

## 2. Principe directeur (NON-NÉGOCIABLE)

### ✅ Ce que c'est
Un outil de **résilience financière et géopolitique**. Les dimensions d'exposition, par ordre d'importance :

1. **FX / devises** (le cœur) — décalage entre devise des revenus et devise des coûts, dévaluation, pénurie de dollars.
2. **Liquidité** — capacité à encaisser un choc de 90 jours (trésorerie + lignes de crédit).
3. **Concentration** — dépendance à un seul marché, un seul pays, un seul fournisseur/corridor.
4. **Politique / réglementaire** — contrôle des changes, taxes/restrictions à l'import, retrait de subvention, exposition aux sanctions.

### ❌ Ce que ce N'EST PAS
- **Ce n'est PAS un outil de supply-chain mapping** façon Interos / Everstream / Prewave. La supply-chain n'est **qu'UNE sous-dimension** (« concentration des sources / corridor »), pas la colonne vertébrale. **N'over-indexe pas dessus.** Si tu te retrouves à construire un graphe de fournisseurs multi-tiers, tu as dévié — arrête.
- Ce n'est pas un terminal de marché, ni un outil de hedging/exécution.
- Ce n'est pas du conseil en investissement personnalisé (voir §6, garde-fous).

---

## 3. Les écrans (user flow)

**Écran 1 — Profil d'exposition** (formulaire, avec sliders et selects, pas un mur de champs)
- CA annuel, marge brute %
- Mix devises : % du CA en devise locale vs devise forte ; % des coûts en devise forte (USD/EUR)
- Taux de couverture (hedge ratio) % — souvent ~0 en marché frontière, c'est attendu
- Buffer de liquidité (mois d'OPEX couverts par cash + lignes engagées)
- Concentration géographique (part du 1er marché %)
- Concentration sourcing (part du 1er fournisseur/corridor %)
- Pays d'opération (multi-select → active des flags politiques : risque de contrôle des changes, subventions, adjacence sanctions)

**Écran 2 — Dashboard de résilience** (l'écran héros, inspiré du mock du deck)
- **Resilience Score** 0–100 en gros (jauge circulaire), avec libellé qualitatif (« résilience modérée ») et delta vs état initial.
- **4 sous-scores** : FX · Liquidité · Concentration · Politique.
- **Impact des scénarios** : pour chaque choc, l'impact chiffré en € sur la marge ET sur le cash, trié par sévérité (bar chart).
- **Playbook** : leviers priorisés (impact €/an, effort, sous-score amélioré). Chaque levier est cochable → recalcule le score en live.

**Écran 3 (optionnel v1) — Méthodologie**
- Affiche en clair les pondérations et formules (transparence = argument de vente, cf. deck). Un CFO doit pouvoir auditer le chiffre.

---

## 4. Modèle de données

```ts
type CompanyProfile = {
  name: string;
  annualRevenue: number;          // €
  grossMarginPct: number;         // 0–100
  revenueHardCcyPct: number;      // % du CA en devise forte
  costHardCcyPct: number;         // % des coûts en devise forte
  hedgeRatioPct: number;          // 0–100
  liquidityBufferMonths: number;  // mois d'OPEX couverts
  topMarketPct: number;           // concentration géo (0–100)
  topSourcePct: number;           // concentration sourcing (0–100)
  countries: string[];            // active les flags politiques
};

type Scenario = {
  id: string;
  label: string;                  // ex. "Dévaluation de la monnaie locale (-30%)"
  category: 'fx' | 'liquidity' | 'concentration' | 'policy';
  probability: number;            // 0–1, fourchette annuelle indicative
  shockMagnitude: number;         // ex. 0.30 pour -30%
  hits: ('fx'|'liquidity'|'concentration'|'policy')[];
};

type Action = {                   // un levier du playbook
  id: string;
  label: string;
  improves: 'fx'|'liquidity'|'concentration'|'policy';
  scoreUplift: number;            // points de sous-score si appliqué
  annualImpactEur: number;        // gain € modélisé
  effort: 'low'|'medium'|'high';
  done: boolean;
};
```

---

## 5. Moteur de scoring v1 (transparent et paramétré)

> **Garde le moteur dans un module pur, sans dépendance UI** (`src/engine/`), pour qu'on puisse le porter vers un backend Python plus tard. Toutes les constantes vivent dans `src/engine/config.ts` et sont commentées.

**Sous-scores (chacun 0–100, 100 = très résilient) :**

- `fxScore` — pénalise l'exposition en devise forte non couverte par des revenus en devise forte :
  ```
  unmatched = max(0, costHardCcyPct - revenueHardCcyPct) / 100 * (1 - hedgeRatioPct/100)
  fxScore   = 100 * (1 - clamp(unmatched / FX_THRESHOLD, 0, 1))   // FX_THRESHOLD ≈ 0.5
  ```
- `liquidityScore` — buffer vs cible (6 mois) :
  ```
  liquidityScore = 100 * clamp(liquidityBufferMonths / LIQ_TARGET_MONTHS, 0, 1)  // LIQ_TARGET = 6
  ```
- `concentrationScore` — plus c'est concentré, plus c'est fragile :
  ```
  conc = max(topMarketPct, topSourcePct) / 100
  concentrationScore = 100 * (1 - clamp((conc - 0.3) / 0.6, 0, 1))  // 30% ok, 90%+ critique
  ```
- `policyScore` — part de 100, chaque flag pays retire des points (capital controls −25, subvention exposée −15, adjacence sanctions −20, etc., bornés à 0).

**Score global (pondérations affichées, modifiables) :**
```
overall = 0.40*fxScore + 0.25*liquidityScore + 0.20*concentrationScore + 0.15*policyScore
```

**Impact d'un scénario (€) :** applique le choc à la base exposée, pas à tout le CA.
```
ex. Dévaluation -30% :
  hardCostEur   = annualRevenue * (1 - grossMarginPct/100) * costHardCcyPct/100
  unmatchedEur  = hardCostEur * (1 - revenueHardCcyPct/100) * (1 - hedgeRatioPct/100)
  marginHitEur  = unmatchedEur * shockMagnitude
  cashHitEur    = marginHitEur (v1, raffiner plus tard)
```
Affiche `marginHitEur` ET le % de marge annuelle que ça représente (c'est ce qui parle au CFO).

**Bibliothèque de scénarios v1** (FX/politique d'abord, supply-chain volontairement minoritaire = 1 sur 6) :
1. Dévaluation de la monnaie locale (-20% / -40%) — *fx*
2. Pénurie de devises / contrôle des changes (imports bloqués) — *fx + liquidity*
3. Nouvelle taxe ou restriction à l'import — *policy*
4. Retrait d'une subvention (énergie/carburant) — *policy*
5. Perturbation d'un corridor logistique (mer Rouge/Suez, fermeture de port) — *concentration* ← le seul « supply chain »
6. Exposition à des sanctions / contrepartie sanctionnée — *policy*

---

## 6. Garde-fous produit (important — cf. deck)

- **Information, pas conseil.** Le playbook présente des **leviers que des entreprises dans cette situation considèrent souvent** (« diversifier la devise d'achat », « pré-négocier une ligne stand-by »). On **ne** dit jamais « vous devez acheter tel produit financier » ni « investissez dans X ». Formulation neutre, informative, jamais prescriptive nominative. (C'est la frontière MiFID information/conseil — on reste du bon côté.)
- **Transparence des chiffres.** Tout impact € doit être traçable jusqu'aux inputs et aux formules (§5). Pas de boîte noire. C'est notre crédibilité.
- **Pas de drift « recommandation ».** Si une future couche IA est ajoutée, elle *interprète et explique*, elle ne *recommande pas* d'actes financiers. Garde cette discipline dès la v1.

---

## 7. Stack & contraintes

- **Frontend-only**, **Vite + React + TypeScript + Tailwind**. Charts via **Recharts** (jauge = arc/radial, impacts = bar chart).
- **Aucun backend, aucun compte, aucune donnée serveur** en v1. Persistance locale via `localStorage` (un seul profil suffit).
- **Moteur de scoring = module pur** (`src/engine/`), testable, framework-agnostic, sans import React. Ajoute quelques tests unitaires sur les formules.
- Léger : démarrage rapide, pas d'usine à gaz. Si tu hésites entre « ajouter une feature » et « shipper la démo », **shippe la démo**.
- Mono-écran responsive correct (desktop d'abord ; ça se présente sur un laptop en rendez-vous).

---

## 8. Structure de fichiers proposée

```
src/
  engine/
    config.ts        // toutes les constantes & pondérations, commentées
    scenarios.ts     // la bibliothèque de scénarios v1
    scoring.ts       // sous-scores, score global, impacts €  (PUR, sans UI)
    playbook.ts      // génération des leviers à partir du profil
    scoring.test.ts  // tests des formules
  ui/
    ProfileForm.tsx
    Dashboard.tsx
    ScoreGauge.tsx
    SubScores.tsx
    ScenarioImpacts.tsx
    Playbook.tsx
    Methodology.tsx
  data/
    seed.ts          // profil démo (voir §9)
  App.tsx
  theme.ts           // palette & typo (voir §10)
RUKN_Deck.pptx
README.md
```

---

## 9. Données de démo (pour que ça montre de la valeur tout de suite)

Pré-charge un profil démo réaliste — **un importateur/distributeur égyptien** :
- CA ~ 40 M€, marge brute ~ 22 %
- 5 % du CA en devise forte, **70 % des coûts en USD**, hedge ratio 0 %
- buffer liquidité ~ 2,5 mois
- 1er marché 80 %, 1er fournisseur/corridor 65 %
- pays : Égypte (flags : contrôle des changes, subventions)

→ Ce profil doit produire un score médiocre côté FX et liquidité, un impact € douloureux sur le scénario « dévaluation » et « pénurie de devises », et un playbook où les 2 premiers leviers sont à fort impact. C'est exactement l'histoire du deck.

---

## 10. Design system (cohérent avec le deck)

Palette (réutilise les hex du pitch) :
- Fond sombre / titres : **`#12233D`** (navy)
- Primaire : **`#0E5A63`** (petrol teal)
- Accent : **`#D98A3D`** (ambre)
- Danger : **`#C2452F`** · Positif : **`#3E7C5A`**
- Surfaces claires : `#FFFFFF`, `#F6F8F8`, `#EDF1F2` · Texte secondaire : `#51606F`

Direction :
- **Le Resilience Score est le héros** : grande jauge, gros chiffre, lisible à 3 mètres.
- Cartes à coins arrondis + ombres douces. **Pas de barres/stripes d'accent** sur les bords (ça fait template IA).
- Titres en serif (Cambria/Georgia-like), corps en sans (Inter/Calibri-like). Sobre, « finance sérieuse ».
- Aéré, contrasté, jamais centré pour le corps de texte.

---

## 11. Definition of Done (v1) & ce qu'on NE fait PAS encore

**Done quand :**
- [ ] On saisit/édite un profil d'exposition.
- [ ] Le dashboard affiche score, 4 sous-scores, impacts € par scénario, playbook priorisé.
- [ ] Cocher un levier recalcule le score en live.
- [ ] Le profil démo égyptien est pré-chargé et raconte une histoire claire.
- [ ] Les formules sont visibles (écran méthodo) et couvertes par quelques tests.

**Pas maintenant (hors périmètre v1) :** comptes utilisateurs, backend/API, multi-profils, couche IA/LLM, ingestion de fichiers, graphe de supply-chain, monitoring temps réel, alertes. On valide d'abord que le diagnostic a de la valeur.

---

## 12. Première tâche

1. Lis `RUKN_Deck.pptx` (§0).
2. Scaffold Vite + React + TS + Tailwind + Recharts.
3. Implémente `src/engine/` (config, scenarios, scoring, playbook) **avant** l'UI, avec tests.
4. Branche le profil démo (§9) puis construis le Dashboard, ensuite le ProfileForm.
5. Montre-moi un premier rendu jouable. On itère ensuite.

> Rappel : on n'ajoute pas de feature avant d'avoir validé le diagnostic auprès de vrais prospects. Reste simple, reste honnête sur les chiffres, garde la résilience (FX/liquidité/politique) au centre — pas la supply-chain.

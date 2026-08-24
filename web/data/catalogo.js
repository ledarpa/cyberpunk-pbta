/** Catálogo de ficha: Cromos + Chapería (armas, herramientas, etc.). */
window.PBTA_CATALOGO = (() => {
  const Q = ["impro", "corr", "hitech", "mil"];
  const Q_LABEL = {
    impro: "Improvisada",
    corr: "Corriente",
    hitech: "Hi-Tech",
    mil: "Militar",
  };
  /** Texto en corchetes del ledger (minúsculas). */
  const Q_TAG = {
    impro: "improvisada",
    corr: "corriente",
    hitech: "hi-tech",
    mil: "militar",
  };
  /** Solo cuando el texto completo no entra en la línea del ledger. */
  const Q_SHORT = { impro: "Imp", corr: "Corr", hitech: "Hi-T", mil: "Mil" };
  const SAI_SLOTS = { impro: 0, corr: 1, hitech: 2, mil: 3 };

  const sai = (id, name, shortName, detail) => ({
    id,
    name,
    short: shortName || name,
    detail: detail || "",
  });
  const acc = (id, name, shortName, detail) => ({
    id,
    name,
    short: shortName || name,
    detail: detail || "",
  });
  const bal = (id, name, shortName, detail) => ({
    id,
    name,
    short: shortName || name,
    detail: detail || "",
  });

  const SAI_COMMON = [
    sai(
      "acelerador",
      "Acelerador iónico",
      "Acel",
      "Proyectiles/energía: +1 daño por impacto (rifle y lanzamisiles: +3 donde el arma lo indique)."
    ),
    sai(
      "apuntado",
      "Apuntado asistido",
      "Apunt",
      "Con HUD visual: info del objetivo en tiempo real. Ventaja en RC."
    ),
    sai(
      "flujo",
      "Flujo balístico",
      "Flujo",
      "Sin tiempos de recarga (munición movilizada por el SAI)."
    ),
  ];
  const SAI_ESTAB = sai(
    "estabilizador",
    "Estabilizador",
    "Estab",
    "Arma usable a una mano (fusil; rifle usa estabilizador y decompresor)."
  );
  const SAI_ESTAB_DEC = sai(
    "estab-decomp",
    "Estabilizador y decompresor",
    "Est+Dec",
    "Estabilización + expulsar casquillo/celda → disparar todos los turnos."
  );
  const SAI_MIRA_MISIL = sai(
    "mira-proyectil",
    "Mira para proyectiles",
    "Mira",
    "Con HUD, curvar trayectoria del misil. Ventaja RC."
  );

  /** Munición especial — proyectiles / celdas (armas de fuego o energía). */
  const BAL_PROYECTILES = [
    bal("carbono", "Balas de carbono", "Carb", "Pistola y fusil +1 daño; escopeta y rifle +3."),
    bal(
      "entrelazado",
      "Celdas entrelazado cuántico",
      "Entrel",
      "Disparos atraviesan al primer objetivo (rifle: hasta 3 objetivos)."
    ),
    bal(
      "sobrecargadas",
      "Celdas sobrecargadas",
      "Sobrec",
      "Disparar 2 veces al mismo objetivo en el turno (segundo disparo: RC con −1)."
    ),
    bal(
      "goma",
      "Proyectiles de goma y descarga",
      "Goma",
      "Daño no letal a tejido biológico y cibernética."
    ),
    bal(
      "rastreador",
      "Rastreador",
      "Rast",
      "Sin daño; 1 proyectil por cargador (resto = transmisor/receptor)."
    ),
  ];
  const BAL_MISILES = [
    bal("misil-explosivo", "Explosivo", "Expl", "+1d6 daño, radio 3 m."),
    bal(
      "misil-criogenico",
      "Criogénico",
      "Crio",
      "Supervivientes congelados 1d6/2 turnos, radio 3 m; mitad de acciones."
    ),
    bal("misil-pem", "PEM", "PEM", "Anula cibernética/electrónica en 15 m durante 2d6 turnos."),
    bal(
      "misil-teletaladro",
      "Teletaladro",
      "Taladro",
      "Tras impacto, taladro a 90° + corrosión; en 1d6+1 turnos, agujero para una persona."
    ),
  ];
  const BAL_DARDOS = [
    bal(
      "dardo-psico",
      "@Psico",
      "Psico",
      "Episodio de cyberpsicosis 1d6 turnos si el blanco tiene algún cromo. Sin cromos: inmune."
    ),
    bal("dardo-alucinogeno", "Alucinógeno", "Aluc", "Desventaja en todas las tiradas 1d6 turnos."),
    bal(
      "dardo-nanocontrolador",
      "Nanocontrolador",
      "Nano",
      "Nanobots controlan cyberware del afectado (y artefactos). Sin cromos: inmune."
    ),
    bal(
      "dardo-veneno",
      "Veneno letal",
      "Veneno",
      "Muerte en 6 turnos si un biohacker no lo trata. No afecta cyberware."
    ),
    bal("dardo-paralizante", "Paralizante", "Paral", "Inmovilizado 1d6 turnos."),
  ];

  function arma(def) {
    return {
      kind: "arma",
      column: "chaperia",
      attachable: false,
      hasQuality: true,
      lockedQuality: null,
      saiSlots: SAI_SLOTS,
      accessories: [],
      sai: [],
      ballistics: [],
      countsAsCromo: false,
      ...def,
    };
  }

  function cromo(def) {
    return {
      kind: "cromo",
      column: "cromos",
      attachable: true,
      hasQuality: true,
      lockedQuality: null,
      saiSlots: null,
      accessories: [],
      sai: [],
      modules: [],
      moduleSlots: null,
      neurodataOpts: [],
      neurodataSlots: null,
      countsAsCromo: true,
      statsByQuality: null,
      statPoolByQuality: null,
      statPoolKeys: null,
      ...def,
    };
  }

  function herramienta(def) {
    return {
      kind: "herramienta",
      column: "chaperia",
      attachable: false,
      hasQuality: true,
      lockedQuality: null,
      saiSlots: null,
      accessories: [],
      sai: [],
      countsAsCromo: false,
      ...def,
    };
  }

  function vestimenta(def) {
    return {
      kind: "vestimenta",
      column: "chaperia",
      attachable: false,
      hasQuality: true,
      lockedQuality: null,
      saiSlots: null,
      accessories: [],
      sai: [],
      countsAsCromo: false,
      ...def,
    };
  }

  function neurodata(def) {
    return {
      kind: "neurodata",
      column: "chaperia",
      attachable: false,
      hasQuality: false,
      lockedQuality: null,
      saiSlots: null,
      accessories: [],
      sai: [],
      countsAsCromo: false,
      ...def,
    };
  }

  const armas = [
    arma({
      id: "pistola",
      name: "Pistola",
      detail:
        "Cargas 15 · Alcance 60 m · Manual 1d6 · Semi ráfaga 3 (ventaja RC) 1d6. Hasta 1 por brazo. SAI: Imp 0 / Corr 1 / Hi-T 2 / Mil 3.",
      accessories: [
        acc("cargador-amp", "Cargador ampliado", "Carg+", "21 cargas."),
        acc("silenciador", "Silenciador", "Sil", "Disparos sin sonido."),
      ],
      sai: [...SAI_COMMON],
      ballistics: [...BAL_PROYECTILES],
    }),
    arma({
      id: "pistola-improvisada",
      name: "Pistola",
      lockedQuality: "impro",
      hasQuality: true,
      saiSlots: { impro: 0, corr: 0, hitech: 0, mil: 0 },
      detail: "Variante improvisada de pistola. Sin SAI. Misma ficha básica de combate que pistola.",
      accessories: [],
      sai: [],
      ballistics: [...BAL_PROYECTILES],
    }),
    arma({
      id: "escopeta",
      name: "Escopeta",
      detail:
        "Cargas 6 · Alcance 10 m · Cono 45° 1d6/enemigo · Quemarropa ≤3 m: 3d6 a un objetivo. 2 manos (salvo estabilizador). SAI: 0/1/2/3.",
      accessories: [
        acc("canon-largo", "Cañón largo", "CañónL", "Dispersión 23° (mitad); alcance ×2."),
        acc("canon-doble", "Cañón doble", "Cañón2", "2 proyectiles a la vez → daño ×2."),
        acc("cargador-amp", "Cargador ampliado", "Carg+", "10 cargas."),
        acc("estab-acc", "Estabilizador (accesorio)", "Estab", "Usable a una mano."),
      ],
      sai: [...SAI_COMMON],
      ballistics: [...BAL_PROYECTILES],
    }),
    arma({
      id: "fusil",
      name: "Fusil",
      detail:
        "Cargas 30 · Alcance 30 m · Manual 1d6 · Semi 3 (ventaja) 1d6 · Auto: vacía cargador, cono 45°, 1d6 por éxito. 2 manos salvo estabilizador.",
      accessories: [
        acc("mira", "Mira telescópica", "Mira", "Alcance ×2; con cyberóptica zoom: ×3."),
        acc("cargador-amp", "Cargador ampliado", "Carg+", "45 cargas."),
        acc("silenciador", "Silenciador", "Sil", "Sin sonido."),
      ],
      sai: [...SAI_COMMON, SAI_ESTAB],
      ballistics: [...BAL_PROYECTILES],
    }),
    arma({
      id: "rifle",
      name: "Rifle",
      detail:
        "Cargas 4 · Alcance 100 m · Daño 3d6 · 1 disparo cada 2 turnos (descarga+carga). 2 manos o 2 cyberextremidades.",
      accessories: [
        acc("mira", "Mira telescópica", "Mira", "Alcance ×3; con zoom óptico: ×4."),
        acc("cargador-amp", "Cargador ampliado", "Carg+", "7 cargas."),
        acc("silenciador", "Silenciador", "Sil", "Sin sonido; daño baja a 2d6; −50 m de alcance."),
      ],
      sai: [
        sai("acelerador", "Acelerador iónico", "Acel", "Proyectiles/energía: +3 daño (rifle)."),
        sai("apuntado", "Apuntado asistido", "Apunt", "Con HUD visual: info del objetivo. Ventaja en RC."),
        SAI_ESTAB_DEC,
        sai("flujo", "Flujo balístico", "Flujo", "Sin tiempos de recarga (munición movilizada por el SAI)."),
      ],
      ballistics: [...BAL_PROYECTILES],
    }),
    arma({
      id: "lanzadardos",
      name: "Lanzadardos",
      detail:
        "Cargas 1 · Alcance 15 m · Daño 1 pt con 10+ (7–9 sin daño) · Silenciosa · Turno disparo + turno recarga. SAI: 0/1/2/3.",
      accessories: [],
      sai: [
        sai("acelerador", "Acelerador iónico", "Acel", "Alcance ×2, +1 daño."),
        sai("apuntado", "Apuntado asistido", "Apunt", "Con HUD visual: info del objetivo. Ventaja en RC."),
        sai("flujo", "Flujo balístico", "Flujo", "1 dardo por turno sin tiempo de recarga."),
      ],
      ballistics: [...BAL_DARDOS],
    }),
    arma({
      id: "lanzamisiles",
      name: "Lanzamisiles",
      detail:
        "Cargas 1 · Alcance 150 m · Daño 4d6 · Disparo cada 2 turnos. 2 manos salvo Minimal. SAI: 0/1/2/3.",
      accessories: [
        acc("minimal", "Minimal", "Min", "Versión reducida: 2d6, 50 m, una mano o una cyberextremidad."),
        acc("lanzagranadas", "Lanzagranadas", "LG", "Lanza granadas en lugar de misiles, +1d6 daño; con Minimal, sin esa bonificación."),
        acc("recamara-doble", "Recámara doble", "Rec2", "2 misiles al mismo objetivo en un disparo; efectos combinados."),
      ],
      sai: [
        SAI_MIRA_MISIL,
        sai("flujo", "Flujo balístico", "Flujo", "Sin tiempos de recarga."),
        sai("acelerador", "Acelerador iónico", "Acel", "+3 daño."),
      ],
      ballistics: [...BAL_MISILES],
    }),
    arma({
      id: "granada-acida",
      name: "Granada ácida",
      short: "Gr. ácida",
      hasQuality: false,
      saiSlots: null,
      detail: "Caja de 8. 1d6 corrosivo, radio 1 m. Si daño 5+: destruye un segundo cromo o chapería.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "granada-aturdidora",
      name: "Granada aturdidora",
      short: "Gr. aturdidora",
      hasQuality: false,
      saiSlots: null,
      detail: "Caja de 8. Anula oído/radar ultrasónico 1d6 turnos, radio 10 m. Sin TM: pierde la acción al detonar.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "granada-criogenica",
      name: "Granada criogénica",
      short: "Gr. criogénica",
      hasQuality: false,
      saiSlots: null,
      detail: "Caja de 8. 1d6 congelante, radio 3 m; 1d6 turnos a mitad de movimiento; afecta tejido y cromos.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "granada-fragmentacion",
      name: "Granada fragmentación",
      short: "Gr. fragmentación",
      hasQuality: false,
      saiSlots: null,
      detail: "Caja de 8. 3d6 explosivo, radio 5 m.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "granada-gas",
      name: "Granada gas",
      short: "Gr. gas",
      hasQuality: false,
      saiSlots: null,
      detail: "Caja de 8. Nube tóxica 5 m, 1d6 turnos; 1d6 daño/turno dentro del radio.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "granada-humo",
      name: "Granada humo y partículas",
      short: "Gr. humo y partículas",
      hasQuality: false,
      saiSlots: null,
      detail: "Caja de 8. Anula visión orgánica, cyberóptica y radar EM 1d6 turnos, radio 5 m.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "granada-pem",
      name: "Granada PEM",
      short: "Gr. PEM",
      hasQuality: false,
      saiSlots: null,
      detail: "Caja de 8. Anula cibernética y electrónica en 5 m durante 1d6 turnos.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "balas-carbono",
      name: "Balas de carbono",
      hasQuality: false,
      saiSlots: null,
      detail: "Munición especial. Pistola y fusil +1 daño; escopeta y rifle +3. 4 cargadores = 1 Estrella.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "celdas-cuantico",
      name: "Celdas entrelazado cuántico",
      hasQuality: false,
      saiSlots: null,
      detail: "Munición especial. Disparos atraviesan al primer objetivo (rifle: hasta 3). 4 cargadores = 1 Estrella.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "celdas-sobrecarga",
      name: "Celdas sobrecargadas",
      hasQuality: false,
      saiSlots: null,
      detail: "Munición especial. 2 disparos al mismo objetivo (2.º con RC −1). 4 cargadores = 1 Estrella.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "proyectiles-goma",
      name: "Proyectiles de goma y descarga",
      hasQuality: false,
      saiSlots: null,
      detail: "Munición especial. Daño no letal a tejido biológico y cibernética. 4 cargadores = 1 Estrella.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "rastreador",
      name: "Rastreador",
      hasQuality: false,
      saiSlots: null,
      detail: "Munición especial. Sin daño; 1 proyectil/cargador (resto transmisor/receptor). 4 cargadores = 1 Estrella.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "misil-explosivo",
      name: "Misil explosivo",
      hasQuality: false,
      saiSlots: null,
      detail: "Misil especial. +1d6 daño, radio 3 m.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "misil-criogenico",
      name: "Misil criogénico",
      hasQuality: false,
      saiSlots: null,
      detail: "Misil especial. Congela supervivientes 1d6/2 turnos, radio 3 m; mitad de acciones.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "misil-pem",
      name: "Misil PEM",
      hasQuality: false,
      saiSlots: null,
      detail: "Misil especial. Anula cibernética/electrónica en 15 m durante 2d6 turnos.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "misil-teletaladro",
      name: "Misil teletaladro",
      hasQuality: false,
      saiSlots: null,
      detail: "Misil especial. Tras impacto, taladro + corrosión; en 1d6+1 turnos, agujero para una persona.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "dardo-psico",
      name: "Dardo @Psico",
      hasQuality: false,
      saiSlots: null,
      detail: "Dardo especial. Cyberpsicosis 1d6 turnos si el blanco tiene cromo. Sin cromos: inmune.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "dardo-alucinogeno",
      name: "Dardo alucinógeno",
      hasQuality: false,
      saiSlots: null,
      detail: "Dardo especial. Desventaja en todas las tiradas 1d6 turnos.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "dardo-nanocontrol",
      name: "Dardo nanocontrolador",
      hasQuality: false,
      saiSlots: null,
      detail: "Dardo especial. Nanobots controlan cyberware (y artefactos). Sin cromos: inmune.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "dardo-veneno",
      name: "Dardo veneno letal",
      hasQuality: false,
      saiSlots: null,
      detail: "Dardo especial. Muerte en 6 turnos si un biohacker no lo trata. No afecta cyberware.",
      accessories: [],
      sai: [],
    }),
    arma({
      id: "dardo-paralizante",
      name: "Dardo paralizante",
      hasQuality: false,
      saiSlots: null,
      detail: "Dardo especial. Inmovilizado 1d6 turnos.",
      accessories: [],
      sai: [],
    }),
  ];

  const neurodatas = [
    neurodata({
      id: "base-datos",
      name: "Base de datos",
      ndataPrompt: "Descripción breve:",
    }),
    neurodata({
      id: "memoria-blanco",
      name: "Memoria en blanco",
    }),
    neurodata({
      id: "neuroexperiencia",
      name: "Neuroexperiencia",
      ndataPrompt: "Descripción breve:",
    }),
    neurodata({
      id: "protocolo-velo",
      name: "Protocolo velo",
    }),
  ];

  const cromos = [
    cromo({
      id: "conexion-arma-inteligente",
      name: "Conexión de arma inteligente",
      short: "SAI-link",
      statsByQuality: { impro: {}, corr: { rc: 1 }, hitech: { rc: 2 }, mil: { rc: 3 } },
    }),
    cromo({
      id: "conexion-neuronal",
      name: "Conexión neuronal",
      short: "Conex.neur",
      statsByQuality: { impro: {}, corr: { en: 1 }, hitech: { en: 2 }, mil: { en: 3 } },
    }),
    cromo({
      id: "neurochip-conocimiento",
      name: "Neurochip — Adquisición de conocimiento",
      short: "Nchip·Know",
    }),
    cromo({
      id: "neurochip-anulador",
      name: "Neurochip — Anulador de sistemas biológicos",
      short: "Nchip·Anul",
      hasQuality: false,
    }),
    cromo({
      id: "neurochip-asistente",
      name: "Neurochip — Asistente de procesos",
      short: "Nchip·Asist",
      statPoolByQuality: { impro: 1, corr: 2, hitech: 3, mil: 4 },
      statPoolKeys: ["en", "mc", "rc"],
    }),
    cromo({
      id: "neurochip-receptor",
      name: "Neurochip — Receptor de data",
      short: "Nchip·Rx",
    }),
    cromo({
      id: "neurochip-sensores",
      name: "Neurochip — Sensores de estado",
      short: "Nchip·Sens",
    }),
    cromo({
      id: "neuroranura",
      name: "Neuroranura",
      short: "Ranura",
      countsAsCromo: false, // no suma @Psique
      neurodataSlots: { impro: 1, corr: 4, hitech: 8, mil: 16 },
      neurodataOpts: neurodatas.map((n) => ({
        id: n.id,
        name: n.name,
        short: n.short,
        detail: n.detail,
        ndataPrompt: n.ndataPrompt,
      })),
    }),
    cromo({
      id: "ojo-bionico",
      name: "Ojo biónico",
      short: "Ojo",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("colorimetria", "Colorimetría de banda ancha", "Color+MC"),
        acc("fotosensor", "Fotosensor", "Foto+RC"),
        acc("filmadora", "Filmadora", "Film"),
        acc("inalambrico", "Inalámbrico", "WiFi"),
        acc("pelicula", "Película protectora", "Film+TM"),
        acc("reconocimiento", "Reconocimiento facial", "Face+MC"),
        acc("captura3d", "Captura 3D", "3D+EN"),
        acc("vision-ir", "Visión IR/térmica/EM/UV/X", "Visión"),
        acc("microexp", "Seguimiento de microexpresiones", "Micro+MC"),
        acc("zoom", "Zoom óptico", "Zoom"),
      ],
    }),
    cromo({
      id: "oido-bionico",
      name: "Oído biónico",
      short: "Oído",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("db", "Adecuador de dB", "dB+RC"),
        acc("movimiento", "Detector de movimiento", "Mov+RC"),
        acc("grabadora", "Grabadora", "Rec"),
        acc("inalambrico", "Inalámbrico", "WiFi"),
        acc("micro-laser", "Micrófono láser", "Láser+EN"),
        acc("radar", "Radar", "Radar+RC"),
        acc("banda", "Receptor de banda ancha", "Banda+EN"),
      ],
    }),
    cromo({
      id: "digestivo-modular",
      name: "Aparato digestivo modular",
      short: "Digest",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("amp-db", "Amplificador de dB", "Amp+MC"),
        acc("emisor", "Emisor de banda ancha", "Emis+MC"),
        acc("filtro", "Filtro de toxinas", "Filt+TM"),
        acc("voz-humana", "Sintetizador de voz humana", "Voz+MC"),
        acc("voz-noone", "Sintetizador No-one", "No-one"),
        acc("turbina", "Turbina de aliento", "Turbina"),
      ],
    }),
    cromo({
      id: "respiratorio-modular",
      name: "Aparato respiratorio modular",
      short: "Resp",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("olfato", "Amplificador olfativo", "Olf+EN"),
        acc("pulmon", "Capacidad pulmonar ampliada", "Pulm+TM"),
        acc("branquias", "Cyberbranquias", "Branq+TM"),
        acc("filtro", "Filtro de toxinas", "Filt+TM"),
        acc("oxigeno", "Inyector de oxígeno", "O2+TM"),
      ],
    }),
    cromo({
      id: "membrana-acorazada",
      name: "Membrana acorazada",
      short: "Membrana",
      statsByQuality: {
        impro: { tm: 1 },
        corr: { tm: 1 },
        hitech: { tm: 1 },
        mil: { tm: 1 },
      },
    }),
    cromo({
      id: "nanoplastia",
      name: "Nanoplastía",
      short: "Nanoplast",
      statsByQuality: { impro: {}, corr: {}, hitech: { mc: 1 }, mil: { mc: 2 } },
    }),
    cromo({
      id: "piel-perfecta",
      name: "Piel perfecta",
      short: "Piel",
      statsByQuality: { impro: { mc: 1 }, corr: { mc: 2 }, hitech: { mc: 3 }, mil: { mc: 4 } },
    }),
    cromo({
      id: "cybervertebras",
      name: "Cybervértebras",
      short: "Vértebras",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("extremidad-extra", "Cyberextremidad adicional", "Extra"),
        acc("reflejos", "Reflejos servoasistidos", "Refl+RC"),
        acc("vuelo", "Vuelo controlado", "Vuelo"),
      ],
    }),
    cromo({
      id: "corazon-bionico",
      name: "Corazón biónico",
      short: "Corazón",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("adrenalina", "Inyector de adrenalina", "Adren+RC"),
        acc("nanocirujanos", "Nanocirujanos", "Nano"),
        acc("circulatorio", "Aparato circulatorio auxiliar", "Circ+TM"),
      ],
    }),
    cromo({
      id: "aracnogarfio",
      name: "Aracnogarfio",
      short: "Garfio",
      hasQuality: false,
      statsByQuality: { impro: { tm: 1 }, corr: { tm: 1 }, hitech: { tm: 1 }, mil: { tm: 1 } },
    }),
    cromo({
      id: "brazo-combate",
      name: "Brazo de combate",
      short: "BrazoC",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("sable-mantis", "Sable Mantis", "Mantis+TM"),
        acc("ranura-arma", "Ranura para arma de fuego", "Ranura+RC"),
        acc("descarga", "Descarga de fluidos", "Fluid+RC"),
        acc("magnetoescudo", "Magnetoescudo", "Escudo+TM"),
      ],
    }),
    cromo({
      id: "extremidad-balistica",
      name: "Extremidad balística",
      short: "Ext.bal",
      hasQuality: false,
      statsByQuality: { impro: { rc: 1 }, corr: { rc: 1 }, hitech: { rc: 1 }, mil: { rc: 1 } },
    }),
    cromo({
      id: "tecnoherramienta",
      name: "Tecnoherramienta",
      short: "TecnoH",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("kit-montaje", "Kit de montaje", "Mont+EN"),
        acc("kit-salud", "Kit de salud", "Salud+EN"),
        acc("multitactil", "Multitáctil", "Multi+EN"),
        acc("teclado", "Teclado injertado", "Tecl+EN"),
      ],
    }),
    cromo({
      id: "piernas-acorazado",
      name: "Cyberpiernas — Acorazado",
      short: "Piernas·Acor",
      statsByQuality: {
        impro: { tm: 1 },
        corr: { tm: 2 },
        hitech: { tm: 3 },
        mil: { tm: 4 },
      },
    }),
    cromo({
      id: "piernas-cuadrupedo",
      name: "Cyberpiernas — Cuadrúpedo",
      short: "Piernas·4",
      statsByQuality: {
        impro: { rc: 1 },
        corr: { tm: 1, rc: 1 },
        hitech: { tm: 1, rc: 2 },
        mil: { tm: 2, rc: 2 },
      },
    }),
    cromo({
      id: "piernas-velocista",
      name: "Cyberpiernas — Velocista",
      short: "Piernas·Vel",
      statsByQuality: {
        impro: { rc: 1 },
        corr: { rc: 2 },
        hitech: { rc: 3 },
        mil: { rc: 4 },
      },
    }),
  ];

  const herramientas = [
    herramienta({ id: "autointerprete", name: "Autointérprete", hasQuality: false }),
    herramienta({
      id: "drone",
      name: "Drone",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("centinela", "Centinela", "Cent"),
        acc("kamikaze", "Kamikaze", "Kami"),
        acc("ligero", "Ligero", "Lig"),
        acc("protocolo", "Protocolo", "Prot"),
        acc("robusto", "Robusto", "Rob"),
        acc("silencioso", "Silencioso", "Sil"),
        acc("vigilante", "Vigilante", "Vig"),
      ],
    }),
    herramienta({ id: "emulador-biometrico", name: "Emulador biométrico", hasQuality: false }),
    herramienta({ id: "kit-conectividad", name: "Kit de conectividad" }),
    herramienta({ id: "kit-primeros-auxilios", name: "Kit de primeros auxilios" }),
    herramienta({ id: "kit-reparaciones", name: "Kit de reparaciones" }),
    herramienta({ id: "pistola-garfio", name: "Pistola garfio", hasQuality: false }),
    herramienta({ id: "torreta-movil", name: "Torreta móvil", hasQuality: false }),
    herramienta({ id: "trauma-card", name: "Trauma card", hasQuality: false }),
  ];

  const vestimentas = [
    vestimenta({
      id: "corposuit",
      name: "Corposuit",
      statsByQuality: {
        impro: {},
        corr: {},
        hitech: { tm: 1 },
        mil: {},
      },
    }),
    vestimenta({ id: "mascara-fantasma", name: "Máscara fantasma", hasQuality: false }),
    vestimenta({
      id: "tecnoarmadura",
      name: "Tecnoarmadura",
      statsByQuality: {
        impro: {},
        corr: { tm: 1 },
        hitech: { tm: 1 },
        mil: { tm: 1 },
      },
    }),
  ];

  const sections = {
    chaperia: [
      { id: "armas", title: "Armas", items: armas },
      { id: "herramientas", title: "Herramientas", items: herramientas },
      { id: "vestimenta", title: "Vestimenta", items: vestimentas },
    ],
    cromos: [
      {
        id: "implantes-cerebrales",
        title: "Implantes cerebrales",
        items: cromos.filter((c) =>
          ["conexion-arma-inteligente", "conexion-neuronal", "neuroranura"].includes(c.id)
        ),
      },
      {
        id: "neurochip",
        title: "Neurochip",
        optClass: "is-neurochip",
        stripNeurochipPrefix: true,
        items: cromos.filter((c) => c.id.startsWith("neurochip-")),
      },
      {
        id: "cyberopticas",
        title: "Cyberópticas",
        items: cromos.filter((c) => c.id === "ojo-bionico"),
      },
      {
        id: "cyberoido",
        title: "Cyberoído",
        items: cromos.filter((c) => c.id === "oido-bionico"),
      },
      {
        id: "cyberbucales",
        title: "Cyberbucales",
        items: cromos.filter((c) => c.id === "digestivo-modular"),
      },
      {
        id: "cybernasales",
        title: "Cybernasales",
        items: cromos.filter((c) => c.id === "respiratorio-modular"),
      },
      {
        id: "sintetica",
        title: "Sintética superficial",
        items: cromos.filter((c) =>
          ["membrana-acorazada", "nanoplastia", "piel-perfecta"].includes(c.id)
        ),
      },
      {
        id: "cyberorganos",
        title: "Cyberórganos",
        items: cromos.filter((c) => ["cybervertebras", "corazon-bionico"].includes(c.id)),
      },
      {
        id: "cyberextremidades",
        title: "Cyberextremidades",
        items: cromos.filter((c) =>
          [
            "aracnogarfio",
            "brazo-combate",
            "extremidad-balistica",
            "tecnoherramienta",
            "piernas-acorazado",
            "piernas-cuadrupedo",
            "piernas-velocista",
          ].includes(c.id)
        ),
      },
    ],
  };

  const byId = new Map();
  for (const col of Object.values(sections)) {
    for (const sec of col) {
      for (const item of sec.items) byId.set(item.id, item);
    }
  }
  for (const item of neurodatas) byId.set(item.id, item);

  return {
    Q,
    Q_LABEL,
    Q_TAG,
    Q_SHORT,
    SAI_SLOTS,
    sections,
    byId,
    get(id) {
      return byId.get(id) || null;
    },
  };
})();

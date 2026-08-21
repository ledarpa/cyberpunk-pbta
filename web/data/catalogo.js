/** Catálogo de ficha: Cromos + Chapería (armas, herramientas, etc.). */
window.PBTA_CATALOGO = (() => {
  const Q = ["impro", "corr", "hitech", "mil"];
  const Q_LABEL = { impro: "Imp", corr: "Corr", hitech: "Hi-T", mil: "Mil" };
  const SAI_SLOTS = { impro: 0, corr: 1, hitech: 2, mil: 3 };

  const sai = (id, name, shortName) => ({ id, name, short: shortName || name });
  const acc = (id, name, shortName) => ({ id, name, short: shortName || name });

  const SAI_COMMON = [
    sai("acelerador", "Acelerador iónico", "Acel"),
    sai("apuntado", "Apuntado asistido", "Apunt"),
    sai("flujo", "Flujo balístico", "Flujo"),
  ];
  const SAI_ESTAB = sai("estabilizador", "Estabilizador", "Estab");
  const SAI_ESTAB_DEC = sai("estab-decomp", "Estabilizador y decompresor", "Est+Dec");
  const SAI_MIRA_MISIL = sai("mira-proyectil", "Mira para proyectiles", "Mira");

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
      countsAsCromo: true,
      statsByQuality: null,
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
      accessories: [
        acc("cargador-amp", "Cargador ampliado", "Carg+"),
        acc("silenciador", "Silenciador", "Sil"),
      ],
      sai: [...SAI_COMMON],
    }),
    arma({
      id: "pistola-improvisada",
      name: "Pistola Improvisada",
      lockedQuality: "impro",
      hasQuality: true,
      saiSlots: { impro: 0, corr: 0, hitech: 0, mil: 0 },
      accessories: [],
      sai: [],
    }),
    arma({
      id: "escopeta",
      name: "Escopeta",
      accessories: [
        acc("canon-largo", "Cañón largo", "CañónL"),
        acc("canon-doble", "Cañón doble", "Cañón2"),
        acc("cargador-amp", "Cargador ampliado", "Carg+"),
        acc("estab-acc", "Estabilizador (accesorio)", "Estab"),
      ],
      sai: [...SAI_COMMON],
    }),
    arma({
      id: "fusil",
      name: "Fusil",
      accessories: [
        acc("mira", "Mira telescópica", "Mira"),
        acc("cargador-amp", "Cargador ampliado", "Carg+"),
        acc("silenciador", "Silenciador", "Sil"),
      ],
      sai: [...SAI_COMMON, SAI_ESTAB],
    }),
    arma({
      id: "rifle",
      name: "Rifle",
      accessories: [
        acc("mira", "Mira telescópica", "Mira"),
        acc("cargador-amp", "Cargador ampliado", "Carg+"),
        acc("silenciador", "Silenciador", "Sil"),
      ],
      sai: [
        sai("acelerador", "Acelerador iónico", "Acel"),
        sai("apuntado", "Apuntado asistido", "Apunt"),
        SAI_ESTAB_DEC,
        sai("flujo", "Flujo balístico", "Flujo"),
      ],
    }),
    arma({
      id: "lanzadardos",
      name: "Lanzadardos",
      accessories: [],
      sai: [
        sai("acelerador", "Acelerador iónico", "Acel"),
        sai("apuntado", "Apuntado asistido", "Apunt"),
        sai("flujo", "Flujo balístico", "Flujo"),
      ],
    }),
    arma({
      id: "lanzamisiles",
      name: "Lanzamisiles",
      accessories: [
        acc("minimal", "Minimal", "Min"),
        acc("lanzagranadas", "Lanzagranadas", "LG"),
        acc("recamara-doble", "Recámara doble", "Rec2"),
      ],
      sai: [SAI_MIRA_MISIL, sai("flujo", "Flujo balístico", "Flujo"), sai("acelerador", "Acelerador iónico", "Acel")],
    }),
    arma({
      id: "granada-acida",
      name: "Granada ácida",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "granada-aturdidora",
      name: "Granada aturdidora",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "granada-criogenica",
      name: "Granada criogénica",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "granada-fragmentacion",
      name: "Granada fragmentación",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "granada-gas",
      name: "Granada gas",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "granada-humo",
      name: "Granada humo y partículas",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "granada-pem",
      name: "Granada PEM",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "balas-carbono",
      name: "Balas de carbono",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "celdas-cuantico",
      name: "Celdas entrelazado cuántico",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "celdas-sobrecarga",
      name: "Celdas sobrecargadas",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "proyectiles-goma",
      name: "Proyectiles de goma y descarga",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "rastreador",
      name: "Rastreador",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "misil-explosivo",
      name: "Misil explosivo",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "misil-criogenico",
      name: "Misil criogénico",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "misil-pem",
      name: "Misil PEM",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "misil-teletaladro",
      name: "Misil teletaladro",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "dardo-psico",
      name: "Dardo @Psico",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "dardo-alucinogeno",
      name: "Dardo alucinógeno",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "dardo-nanocontrol",
      name: "Dardo nanocontrolador",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "dardo-veneno",
      name: "Dardo veneno letal",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
    }),
    arma({
      id: "dardo-paralizante",
      name: "Dardo paralizante",
      hasQuality: false,
      saiSlots: null,
      accessories: [],
      sai: [],
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
      // puntos de mejora a repartir: se anotan; efecto base vacío hasta elegir
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

  const neurodatas = [
    neurodata({ id: "base-datos", name: "Base de datos" }),
    neurodata({ id: "memoria-blanco", name: "Memoria en blanco" }),
    neurodata({ id: "neuroexperiencia", name: "Neuroexperiencia" }),
    neurodata({ id: "protocolo-velo", name: "Protocolo velo" }),
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
      { id: "neurodata", title: "Neurodata", items: neurodatas },
      { id: "vestimenta", title: "Vestimenta", items: vestimentas },
    ],
    cromos: [
      {
        id: "implantes-cerebrales",
        title: "Implantes cerebrales",
        items: cromos.filter((c) =>
          [
            "conexion-arma-inteligente",
            "conexion-neuronal",
            "neurochip-conocimiento",
            "neurochip-anulador",
            "neurochip-asistente",
            "neurochip-receptor",
            "neurochip-sensores",
            "neuroranura",
          ].includes(c.id)
        ),
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

  return {
    Q,
    Q_LABEL,
    SAI_SLOTS,
    sections,
    byId,
    get(id) {
      return byId.get(id) || null;
    },
  };
})();

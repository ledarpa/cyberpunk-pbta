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
  const acc = (id, name, shortName, detailOrOpts) => {
    if (detailOrOpts && typeof detailOrOpts === "object") {
      return {
        id,
        name,
        short: shortName || name,
        detail: "",
        ...detailOrOpts,
      };
    }
    return {
      id,
      name,
      short: shortName || name,
      detail: detailOrOpts || "",
    };
  };
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
        "Cargas 15 · Alcance 60 m · Manual 1d6 · Semi ráfaga 3 (ventaja RC) 1d6. Hasta 1 por brazo.",
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
        "Cargas 6 · Alcance 10 m · Cono 45° 1d6/enemigo · Quemarropa ≤3 m: 3d6 a un objetivo. 2 manos (salvo estabilizador).",
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
        "Cargas 1 · Alcance 15 m · Daño 1 pt con 10+ (7–9 sin daño) · Silenciosa · Turno disparo + turno recarga.",
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
        "Cargas 1 · Alcance 150 m · Daño 4d6 · Disparo cada 2 turnos. 2 manos salvo Minimal.",
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
  ];

  const neurodatas = [
    neurodata({
      id: "base-datos",
      name: "Base de datos",
      ndataPrompt: "Descripción breve:",
      detail:
        "Contenido variable: código, redes, técnicas de combate para asistir cyberware, VIP, audio, etc. Ventaja en EN, MC, RC o TM cuando la tarea use esos datos (hackeo, emular voz/rostro, discurso, aguantar respiración, etc.).",
    }),
    neurodata({
      id: "memoria-blanco",
      name: "Memoria en blanco",
      detail: "Espacio para guardar datos que descargues en juego.",
    }),
    neurodata({
      id: "neuroexperiencia",
      name: "Neuroexperiencia",
      ndataPrompt: "Descripción breve:",
      detail:
        "Grabación tasada de una vivencia; moneda de intercambio (las propias valen más). Uso de aprendizaje o recreación.",
    }),
    neurodata({
      id: "protocolo-velo",
      name: "Protocolo velo",
      detail:
        "Anula la desventaja al entrar en la antigua red y enlaces remotos.\nImplementarlo es muy difícil incluso para netrunners veteranos.\nSi fallas al implementarlo, sigues expuesto a las IA de la red antigua.\nDoble 1: el protocolo se desactiva; IA pueden minar/invasar el procesador cerebral → consecuencias catastróficas (Director).",
    }),
  ];

  const cromos = [
    cromo({
      id: "conexion-arma-inteligente",
      name: "Conexión de arma inteligente",
      short: "SAI-link",
      detail: "Terminales nerviosas artificiales entre cerebro y palma. Permite usar cualquier tecnología de arma inteligente.",
      statsByQuality: { impro: {}, corr: { rc: 1 }, hitech: { rc: 2 }, mil: { rc: 3 } },
      detailByQuality: {
        impro: "Sin mejoras a características.",
        corr: "Enlace SAI operativo.",
        hitech: "Enlace SAI operativo.",
        mil: "Enlace SAI operativo.",
      },
    }),
    cromo({
      id: "conexion-neuronal",
      name: "Conexión neuronal",
      short: "Conex.neur",
      detail: "Enlace del cerebro con redes y sistemas. Cableada + inalámbrica a la vez = un solo cromo.",
      statsByQuality: { impro: {}, corr: { en: 1 }, hitech: { en: 2 }, mil: { en: 3 } },
      detailByQuality: {
        impro: "Cableada: acceso a la red. Inalámbrica: control remoto a 10 m.",
        corr: "Cableada: combina con otros cromos. Inalámbrica: combina con cromos; 25 m.",
        hitech: "Cableada: combina con chapería. Inalámbrica: combina con chapería; 50 m.",
        mil: "Cableada e inalámbrica: desconexión segura y anti-saturación; alcance inalámbrico 100 m.",
      },
    }),
    cromo({
      id: "neurochip-conocimiento",
      name: "Neurochip — Adquisición de conocimiento",
      short: "Nchip·Know",
      detail: "Librerías y bases de datos sobre un tema.",
      detailByQuality: {
        impro: "Conocimiento general, por encima de la media.",
        corr: "Conocimiento específico y técnico.",
        hitech: "Alto desarrollo / técnico doctoral.",
        mil: "Conocimiento secreto del área.",
      },
    }),
    cromo({
      id: "neurochip-anulador",
      name: "Neurochip — Anulador de sistemas biológicos",
      short: "Nchip·Anul",
      hasQuality: false,
      detail:
        "Activa o desactiva a voluntad: dolor, frío, sed, hambre, etc. Solo anula la sensación, no la causa. Elimina el penalizador por daño.",
    }),
    cromo({
      id: "neurochip-asistente",
      name: "Neurochip — Asistente de procesos",
      short: "Nchip·Asist",
      detail: "Procesos en segundo plano que anticipan y reaccionan; bonifica EN, MC o RC (repartibles).",
      statPoolByQuality: { impro: 1, corr: 2, hitech: 3, mil: 4 },
      statPoolKeys: ["en", "mc", "rc"],
      detailByQuality: {
        impro: "1 punto de mejora repartible.",
        corr: "2 puntos de mejora repartibles.",
        hitech: "3 puntos de mejora repartibles.",
        mil: "4 puntos de mejora repartibles.",
      },
    }),
    cromo({
      id: "neurochip-receptor",
      name: "Neurochip — Receptor de data",
      short: "Nchip·Rx",
      detail: "Una recepción configurada vía protocolo de velo (bolsa en tiempo real, sensores del refugio, etc.).",
      detailByQuality: {
        impro: "Texto plano, información acotada.",
        corr: "Varios datos a la vez.",
        hitech: "Mejoras gráficas y sonoras.",
        mil: "Además: una señal de salida por el mismo canal (alarma, detonación, etc.).",
      },
    }),
    cromo({
      id: "neurochip-sensores",
      name: "Neurochip — Sensores de estado",
      short: "Nchip·Sens",
      detail: "Signos vitales y estado de cromos/chapería; transmisión local o inalámbrica para monitoreo remoto.",
      detailByQuality: {
        impro: "Constantes vitales.",
        corr: "Estado de cromos.",
        hitech: "Estado de chapería portada.",
        mil: "Protocolo de velo integrado; transmisión por la vieja red.",
      },
    }),
    cromo({
      id: "neuroranura",
      name: "Neuroranura",
      short: "Ranura",
      countsAsCromo: false,
      detail: "Ranuras para contenido digital (neurodata). No suma para @Psique. Incluida en el cyberware inicial (1 improvisada).",
      neurodataSlots: { impro: 1, corr: 4, hitech: 8, mil: 16 },
      neurodataOpts: neurodatas.map((n) => ({
        id: n.id,
        name: n.name,
        short: n.short,
        detail: n.detail,
        ndataPrompt: n.ndataPrompt,
      })),
      detailByQuality: {
        impro: "1 ranura.",
        corr: "4 ranuras.",
        hitech: "8 ranuras.",
        mil: "16 ranuras.",
      },
    }),
    cromo({
      id: "ojo-bionico",
      name: "Ojo biónico",
      short: "Ojo",
      detail:
        "Glóbulo + músculos + chip de asistencia. Con el ojo apagado pero funcional, enciende pasivo el colorimétrico convencional. Cada ojo = un cromo. Módulos del mismo ojo funcionan juntos.",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("colorimetria", "Colorimetría de banda ancha", "Color+MC", {
          detail: "Más colores; detecta láseres de seguridad.",
          stats: { mc: 1 },
        }),
        acc("fotosensor", "Fotosensor", "Foto+RC", {
          detail: "Evita ceguera por luz extrema; adaptación rápida a penumbra.",
          stats: { rc: 1 },
        }),
        acc("filmadora", "Filmadora", "Film", {
          detail: "Vídeo en la cyberóptica.",
        }),
        acc("inalambrico", "Inalámbrico", "WiFi", {
          detail: "Ojo desmontable a distancia; rango 10 m (mejora con conexión neuronal inalámbrica).",
        }),
        acc("pelicula", "Película protectora", "Film+TM", {
          detail: "Protege cavidad; vista digital en paralelo (una, otra o ambas).",
          stats: { tm: 1 },
        }),
        acc("reconocimiento", "Reconocimiento facial", "Face+MC", {
          detail: "Info de BD cargada + estadísticas al observar.",
          stats: { mc: 1 },
        }),
        acc("captura3d", "Captura 3D", "3D+EN", {
          detail: "Reconstrucción de escenas para holograma o PC.",
          stats: { en: 1 },
        }),
        acc("vision-ir", "Visión IR/térmica/EM/UV/X", "Visión", {
          detail: "Sustituye colorimétrico; un sensor = un módulo (puedes llevar varios).",
        }),
        acc("microexp", "Seguimiento de microexpresiones", "Micro+MC", {
          detail: "Detección asistida de microexpresiones. Redundancia: +1 módulo y +1 mejora MC por redundancia.",
          stats: { mc: 1 },
        }),
        acc("zoom", "Zoom óptico", "Zoom", {
          detail: "×10 por módulo; duplica alcance de disparos.",
        }),
      ],
    }),
    cromo({
      id: "oido-bionico",
      name: "Oído biónico",
      short: "Oído",
      detail:
        "Reemplazo del sistema auditivo. Con todos los módulos apagados y el oído operativo, enciende pasivo el audiométrico convencional.",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("db", "Adecuador de dB", "dB+RC", {
          detail: "Protege oído del daño por volumen; sensibilidad manual a sonidos mínimos.",
          stats: { rc: 1 },
        }),
        acc("movimiento", "Detector de movimiento", "Mov+RC", {
          detail: "Vibraciones del entorno en 10 m²; +10 m² por módulo extra de cyberoído dedicado.",
          stats: { rc: 1 },
        }),
        acc("grabadora", "Grabadora", "Rec", {
          detail: "Audio integrado.",
        }),
        acc("inalambrico", "Inalámbrico", "WiFi", {
          detail: "Oído remoto; 10 m (mejora con conexión neuronal inalámbrica).",
        }),
        acc("micro-laser", "Micrófono láser", "Láser+EN", {
          detail: "Conversaciones hasta 500 m.",
          stats: { en: 1 },
        }),
        acc("radar", "Radar", "Radar+RC", {
          detail: "«Audición» tipo murciélago; movimiento normal en oscuridad total.",
          stats: { rc: 1 },
        }),
        acc("banda", "Receptor de banda ancha", "Banda+EN", {
          detail: "Frecuencias sub y supersónicas.",
          stats: { en: 1 },
        }),
      ],
    }),
    cromo({
      id: "digestivo-modular",
      name: "Aparato digestivo modular",
      short: "Digest",
      detail:
        "Órganos sintéticos modulares. Sin módulos: modo reposo = digestivo orgánico sin mejoras. Solo uno en todo el cuerpo.",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("amp-db", "Amplificador de dB", "Amp+MC", {
          detail: "Grito tipo megáfono.",
          stats: { mc: 1 },
        }),
        acc("emisor", "Emisor de banda ancha", "Emis+MC", {
          detail: "Voz: entonación, rango amplio, sub/supersónico.",
          stats: { mc: 1 },
        }),
        acc("filtro", "Filtro de toxinas", "Filt+TM", {
          detail: "Detecta tóxicos orales; los expulsa a recipiente removible.",
          stats: { tm: 1 },
        }),
        acc("voz-humana", "Sintetizador de voz humana", "Voz+MC", {
          detail: "Emula tono humano (oír la voz o neurodata con tonos).",
          stats: { mc: 1 },
        }),
        acc("voz-noone", "Sintetizador No-one", "No-one", {
          detail: "Voz 100 % genérica e irreconocible.",
        }),
        acc("turbina", "Turbina de aliento", "Turbina", {
          detail:
            "Cápsulas de gas; al activar, corte respiratorio hasta salir de la zona o acabar el gas. Un uso por cápsula.\nGases: adormecedor (1d6 turnos, desventaja RC), cegador (1d6 turnos), tóxico (1d6 daño; gas 1d6 turnos en el aire).",
        }),
      ],
    }),
    cromo({
      id: "respiratorio-modular",
      name: "Aparato respiratorio modular",
      short: "Resp",
      detail: "Sin módulos = respiratorio orgánico en reposo. Solo uno en el cuerpo.",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("olfato", "Amplificador olfativo", "Olf+EN", {
          detail: "Olor con más precisión.",
          stats: { en: 1 },
        }),
        acc("pulmon", "Capacidad pulmonar ampliada", "Pulm+TM", {
          detail: "Aguante de respiración ×10.",
          stats: { tm: 1 },
        }),
        acc("branquias", "Cyberbranquias", "Branq+TM", {
          detail: "Respirar bajo el agua con normalidad.",
          stats: { tm: 1 },
        }),
        acc("filtro", "Filtro de toxinas", "Filt+TM", {
          detail: "Tóxicos por vía respiratoria; aire limpio.",
          stats: { tm: 1 },
        }),
        acc("oxigeno", "Inyector de oxígeno", "O2+TM", {
          detail: "Tubos a alta presión; 10 min por tubo; hasta 2 tubos por módulo.",
          stats: { tm: 1 },
        }),
      ],
    }),
    cromo({
      id: "membrana-acorazada",
      name: "Membrana acorazada",
      short: "Membrana",
      detail: "Dermis de tejido de carbono; tono pálido; protección extra. Incompatible con piel perfecta.",
      statsByQuality: {
        impro: { tm: 1 },
        corr: { tm: 1 },
        hitech: { tm: 1 },
        mil: { tm: 1 },
      },
      detailByQuality: {
        impro: "1 punto absorbido o +1 TM (elige).",
        corr: "1 punto absorbido.",
        hitech: "2 puntos absorbidos y +1 TM, o 1 absorbido y +2 TM (elige).",
        mil: "3 puntos absorbidos y +1 TM, o 2 absorbidos y +2 TM (elige).",
      },
    }),
    cromo({
      id: "nanoplastia",
      name: "Nanoplastía",
      short: "Nanoplast",
      detail:
        "Nanobots faciales en red neuronal. Requiere ver el rostro a emular o neurodata con BD de rostros. Pigmentan piel cercana, no todo el cuerpo.",
      statsByQuality: { impro: {}, corr: {}, hitech: { mc: 1 }, mil: { mc: 2 } },
      detailByQuality: {
        impro: "Cambio de rostro: 1 minuto.",
        corr: "Cambio de rostro: 1 turno.",
        hitech: "Cambio de rostro: 1 turno.",
        mil: "Cambio de rostro: 1 turno.",
      },
    }),
    cromo({
      id: "piel-perfecta",
      name: "Piel perfecta",
      short: "Piel",
      detail:
        "Dermis sintética adaptable (color, poros, vello, marcas, tatuajes…). Estética, no camuflaje; el reconocimiento sigue identificándote. Puede ocultar cromos sutiles. Incompatible con membrana acorazada.",
      statsByQuality: { impro: { mc: 1 }, corr: { mc: 2 }, hitech: { mc: 3 }, mil: { mc: 4 } },
      detailByQuality: {
        impro: "Estética adaptable.",
        corr: "Estética adaptable.",
        hitech: "Estética adaptable.",
        mil: "Estética adaptable.",
      },
    }),
    cromo({
      id: "cybervertebras",
      name: "Cybervértebras",
      short: "Vértebras",
      detail: "Columna y nervios reemplazados por control corporal automatizado. Modular.",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("extremidad-extra", "Cyberextremidad adicional", "Extra", {
          detail: "Cada módulo añade una extremidad (antropomórfica o función específica).",
        }),
        acc("reflejos", "Reflejos servoasistidos", "Refl+RC", {
          detail: "Ventaja en RC para evitar daño. Redundantes: +1 RC por módulo extra.",
          stats: { rc: 1 },
        }),
        acc("vuelo", "Vuelo controlado", "Vuelo", {
          detail: "Jetpack/magnetopack: vuelo 6 turnos; 2 h de carga por turno de uso (12 h carga completa).",
        }),
      ],
    }),
    cromo({
      id: "corazon-bionico",
      name: "Corazón biónico",
      short: "Corazón",
      detail:
        "Multi-bomba de 4 cavidades; evita fallos cardíacos naturales o por estrés; conduce fluidos sintéticos. Hasta 2 corazones biónicos por personaje.",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("adrenalina", "Inyector de adrenalina", "Adren+RC", {
          detail:
            "Activación por voz, botón, sensor, rutina, etc. Anula dolor temporalmente; segunda acción en el mismo turno durante 1d6 turnos. Recarga del fluido ~24 h. Varios inyectores en un corazón.",
          stats: { rc: 1 },
        }),
        acc("nanocirujanos", "Nanocirujanos", "Nano", {
          detail: "Reparación en flujo sanguíneo según calidad del corazón.",
          detailByQuality: {
            impro: "1 punto/turno; al instalar elegís: solo cyberware o solo tejido orgánico.",
            corr: "1 punto/turno cyberware y orgánico.",
            hitech: "2 puntos/turno, o 1 punto/turno + refuerzo corporal (+1 TM).",
            mil: "2 puntos/turno y refuerzo corporal (+1 TM).",
          },
        }),
        acc("circulatorio", "Aparato circulatorio auxiliar", "Circ+TM", {
          detail:
            "En lesión superficial: corta sangrado; bombea fluido por venas auxiliares. 1 módulo por tipo de fluido.\nFluidos: ácido (1d6 daño 1d6 turnos), criogénico (superficie congelada 1d6 turnos), combustible (duplica daño por fuego/explosión).",
          stats: { tm: 1 },
        }),
      ],
    }),
    cromo({
      id: "aracnogarfio",
      name: "Aracnogarfio",
      short: "Garfio",
      hasQuality: false,
      detail: "Cuatro ganchos; escalar y agarrar. Escalar sin tirada; agarres/presas con ventaja.",
      statsByQuality: { impro: { tm: 1 }, corr: { tm: 1 }, hitech: { tm: 1 }, mil: { tm: 1 } },
    }),
    cromo({
      id: "brazo-combate",
      name: "Brazo de combate",
      short: "BrazoC",
      detail: "Brazo de combate modular. Los módulos heredan la calidad del brazo.",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("sable-mantis", "Sable Mantis", "Mantis+TM", {
          detail: "Hojas hasta 1 m.",
          stats: { tm: 1 },
          detailByQuality: {
            impro: "Daño: 1d6.",
            corr: "Daño: 1d6 con ventaja.",
            hitech: "Daño: 6.",
            mil: "Daño: 6+TM.",
          },
        }),
        acc("ranura-arma", "Ranura para arma de fuego", "Ranura+RC", {
          detail: "Arma oculta desplegable.",
          stats: { rc: 1 },
          detailByQuality: {
            impro: "Oculta.",
            corr: "Enlace permanente a SAI.",
            hitech: "Armas auto/semiautomáticas plegables.",
            mil: "Alto calibre o munición especial (p. ej. lanzamisiles).",
          },
        }),
        acc("descarga", "Descarga de fluidos circulatorios", "Fluid+RC", {
          detail: "Requiere aparato circulatorio auxiliar.",
          stats: { rc: 1 },
          detailByQuality: {
            impro: "Alcance: 3 m personal.",
            corr: "Alcance: 6 m personal.",
            hitech: "Alcance: 6 m cono 90°.",
            mil: "Alcance: 12 m cono 90°.",
          },
        }),
        acc("magnetoescudo", "Magnetoescudo", "Escudo+TM", {
          detail: "Escudo magnético desplegable.",
          stats: { tm: 1 },
          detailByQuality: {
            impro: "Escudo personal; bloquea 1d6; tirada RC vs ataque.",
            corr: "Escudo personal; bloquea 1d6 con ventaja; tirada RC vs ataque.",
            hitech:
              "Escudo zonal cuerpo entero; no te mueves; bloquea sin RC. Modo baja energía = escudo personal.",
            mil: "Zona 3 m²; protege otros/equipo. Modo baja energía = escudo personal.",
          },
        }),
      ],
    }),
    cromo({
      id: "extremidad-balistica",
      name: "Extremidad balística",
      short: "Ext.bal",
      hasQuality: false,
      detail: "Solo en módulo de cybervértebra. Arma inteligente integrada + enlace SAI automático.",
      statsByQuality: { impro: { rc: 1 }, corr: { rc: 1 }, hitech: { rc: 1 }, mil: { rc: 1 } },
    }),
    cromo({
      id: "tecnoherramienta",
      name: "Tecnoherramienta",
      short: "TecnoH",
      detail: "Brazo para cyberimplantes y trabajo de netrunner.",
      moduleSlots: SAI_SLOTS,
      modules: [
        acc("kit-montaje", "Kit de montaje", "Mont+EN", {
          detail: "Reparación de emergencia en cyberware.",
          stats: { en: 1 },
        }),
        acc("kit-salud", "Kit de salud", "Salud+EN", {
          detail: "Cauterizar/desinfectar heridas biológicas superficiales.",
          stats: { en: 1 },
        }),
        acc("multitactil", "Multitáctil", "Multi+EN", {
          detail: "Dedos multiplexados; escritura ×1000.",
          stats: { en: 1 },
        }),
        acc("teclado", "Teclado injertado", "Tecl+EN", {
          detail: "Holoteclas/táctil en el brazo; interfaces urbanas y cyberware.",
          stats: { en: 1 },
        }),
      ],
    }),
    cromo({
      id: "piernas-acorazado",
      name: "Acorazado",
      short: "Acorazado",
      statsByQuality: {
        impro: { tm: 1 },
        corr: { tm: 2 },
        hitech: { tm: 3 },
        mil: { tm: 4 },
      },
      detailByQuality: {
        impro: "Protege 1 de daño; nunca cansado.",
        corr: "+ golpe 1d6.",
        hitech: "Golpe 1d6 con ventaja.",
        mil: "Golpe 1d6 con ventaja + TM.",
      },
    }),
    cromo({
      id: "piernas-cuadrupedo",
      name: "Cuadrúpedo",
      short: "Cuadrúpedo",
      detail: "Modo potencia 1d6 turnos; 12 h para recargar.",
      statsByQuality: {
        impro: { rc: 1 },
        corr: { tm: 1, rc: 1 },
        hitech: { tm: 1, rc: 2 },
        mil: { tm: 2, rc: 2 },
      },
      detailByQuality: {
        impro: "+50 % velocidad (3 acciones cada 2 turnos); salto 3 m.",
        corr: "+100 % (2 acciones/turno); salto 6 m.",
        hitech: "+150 % (5 acciones cada 2 turnos); salto 12 m.",
        mil: "+200 % (3 acciones/turno); salto 20 m.",
      },
    }),
    cromo({
      id: "piernas-velocista",
      name: "Velocista",
      short: "Velocista",
      detail:
        "Solo en módulo de cybervértebra (orugas plegables o cuadrúpedo equivalente). En reposo: tamaño mochila pequeña.",
      statsByQuality: {
        impro: { rc: 1 },
        corr: { rc: 2 },
        hitech: { rc: 3 },
        mil: { rc: 4 },
      },
      detailByQuality: {
        impro: "×2 velocidad.",
        corr: "×3 velocidad.",
        hitech: "×4 velocidad.",
        mil: "×5 velocidad.",
      },
    }),
  ];

  const herramientas = [
    herramienta({
      id: "autointerprete",
      name: "Autointérprete",
      hasQuality: false,
      detail:
        "Presentación variable (instrumento, caja de sonido, etc.). Colocado en un punto; control remoto. Al activar, reproduce voces o música creíble para atraer atención.",
    }),
    herramienta({
      id: "drone",
      name: "Drone",
      detail: "Movimiento: 5 m/turno. Vida: 5 puntos de daño.",
      moduleSlots: { impro: 1, corr: 2, hitech: 3, mil: 4 },
      modules: [
        acc("centinela", "Centinela", "Cent", "Arma de celdas: 1d6/turno."),
        acc("kamikaze", "Kamikaze", "Kami", "Autodestrucción: 3d6 fuego + PEM 1d6 turnos."),
        acc("ligero", "Ligero", "Lig", "Velocidad ×2."),
        acc("protocolo", "Protocolo", "Prot", "Transceptor para hackeo avanzado vía dron."),
        acc("robusto", "Robusto", "Rob", "10 puntos de daño."),
        acc("silencioso", "Silencioso", "Sil", "Casi inaudible; solo en silencio total."),
        acc(
          "vigilante",
          "Vigilante",
          "Vig",
          "Cámara/micrófono + almacenamiento; enlace a HUD de implantes si lo tienes."
        ),
      ],
      detailByQuality: {
        impro: "1 subsistema.",
        corr: "2 subsistemas.",
        hitech: "3 subsistemas.",
        mil: "4 subsistemas.",
      },
    }),
    herramienta({
      id: "emulador-biometrico",
      name: "Emulador biométrico",
      hasQuality: false,
      detail: "Conecta a terminal de acceso; burla reconocimiento biométrico.",
    }),
    herramienta({
      id: "kit-conectividad",
      name: "Kit de conectividad",
      detail: "Usuario <-> terminal\nventaja EN en la red.\n12 h de recarga antes de reutilizar el kit.",
      detailByQuality: {
        impro: "3 turnos para conectar; 2 usos",
        corr: "1 turno para conectar; 3 usos",
        hitech:
          "Extensión del cromo de conexión neuronal: conexión instantánea; 4 usos",
        mil:
          "Extensión del cromo de conexión neuronal: conexión instantánea; 4 usos.\nherramientas inalámbricas en terminales no vivas; 6 usos",
      },
    }),
    herramienta({
      id: "kit-primeros-auxilios",
      name: "Kit de primeros auxilios",
      detail:
        "Ventaja EN para curar tejido biológico. Un uso puede quitar efectos de toxinas en lugar de curar.",
      detailByQuality: {
        impro: "1d6; 2 usos",
        corr: "1d6+3; 3 usos",
        hitech: "2d6+3; 4 usos",
        mil: "2d6+6; 6 usos",
      },
    }),
    herramienta({
      id: "kit-reparaciones",
      name: "Kit de reparaciones",
      detail:
        "Ventaja EN para reparar cyberware implantado, portado, vehículos, etc. Un uso puede quitar anulación de sistemas en lugar de reparar.\nRepara hasta (Impro / Corr / Hi-T / Mil); el penalizador es el umbral máximo de pieza que repara bien.",
      detailByQuality: {
        impro: "Repara hasta +0 / −1 / −2 / −3; 2 usos",
        corr: "Repara hasta +1 / +0 / −1 / −2; 3 usos",
        hitech: "Repara hasta +2 / +1 / +0 / −1; 4 usos",
        mil: "Repara hasta +3 / +2 / +1 / +0; 6 usos",
      },
    }),
    herramienta({
      id: "pistola-garfio",
      name: "Pistola garfio",
      hasQuality: false,
      detail:
        "Gancho por presión o imán; cable retrae (objetivo hacia ti o tú hacia el punto, según peso). Alcance 50 m. Puede capturar personas.",
    }),
    herramienta({
      id: "torreta-movil",
      name: "Torreta móvil",
      hasQuality: false,
      detail:
        "Lista blanca precargada; dispara al enemigo más cercano: 1d6/turno. Tirada de actuación de la torreta: 2d6+0.",
    }),
    herramienta({
      id: "trauma-card",
      name: "Trauma card",
      qualitySection: "Nivel",
      qualityLabels: {
        impro: "Cliente",
        corr: "Miembro",
        hitech: "Preferencial",
        mil: "VIP",
      },
      qualityShort: {
        impro: "Cli",
        corr: "Mie",
        hitech: "Pref",
        mil: "VIP",
      },
      qualityTags: {
        impro: "cliente",
        corr: "miembro",
        hitech: "preferencial",
        mil: "vip",
      },
      detail:
        "Membresía Trauma Team en el bolsillo; monitoriza biológico y cibernético. Si caes, llega transporte aéreo con biohackers y escolta militar.\nPago mensual; cada activación gasta la tarjeta (hay que renovar membresía).",
      detailByQuality: {
        impro: "Llega en 15 min; te dejan en el domicilio de la suscripción tras estabilizar",
        corr: "Llega en 5 min; te dejan en el domicilio de la suscripción tras estabilizar",
        hitech:
          "Llega en 5 min; te dejan en el domicilio de la suscripción tras estabilizar + 1 día de terapia: curado y reparado al 50%",
        mil: "Llega en 5 min; Cubren 100% de gastos y tiempo de tratamiento necesario (salud y cibernética)",
      },
    }),
  ];

  const vestimentas = [
    vestimenta({
      id: "corposuit",
      name: "Corposuit",
      attachable: true,
      menuInfoTitle: "Traje actual",
      detail: "Traje de alta gama; oculta cyberware y armas pequeñas.",
      statsByQuality: {
        impro: {},
        corr: {},
        hitech: { tm: 1 },
        mil: { tm: 1 },
      },
      detailByQuality: {
        impro: "Ocultación de cyberware.",
        corr: "Ocultación de cyberware. Ventaja MC.",
        hitech: "Ocultación de cyberware. Ventaja MC. +1 TM (solo daño físico).",
        mil: "Ocultación de cyberware. Ventaja MC. +1 TM. Tras activar protocolo, pierde capacidades anteriores y gana modo militar.",
      },
      variantRequiredFromQuality: "mil",
      variantSection: "Variante",
      variants: [
        {
          id: "ghost",
          name: "Ghost",
          detail:
            "Camuflaje fotoreflectivo; casi invisible 1 h o hasta apagar. 3 usos; recarga 2 h por uso.",
        },
        {
          id: "vip-box",
          name: "VIP box",
          detail:
            "Armadura bloque macizo; cámaras/sensores miran fuera; sin movimiento; protege de todo daño. Recarga 6 h tras uso.",
        },
        {
          id: "rapaz",
          name: "Rapaz",
          detail: "Magnetopacks en manos/pies: vuelo controlado 1 h. 3 usos; recarga 2 h por uso.",
        },
      ],
    }),
    vestimenta({
      id: "mascara-fantasma",
      name: "Máscara fantasma",
      hasQuality: false,
      detail:
        "Irreconocible para sistemas ópticos (físicos u holográficos). Ventaja MC vs reconocimiento facial. No engaña a quien tenga la misma capacidad.",
    }),
    vestimenta({
      id: "tecnoarmadura",
      name: "Tecnoarmadura",
      attachable: true,
      menuInfoTitle: "Armadura actual",
      detail: "Servomotores y placas.",
      statsByQuality: {
        impro: {},
        corr: { tm: 1 },
        hitech: { tm: 1 },
        mil: { tm: 1 },
      },
      detailByQuality: {
        impro: "Ventaja TM para absorber cualquier daño (físico, químico, energético…).",
        corr: "Ventaja TM para absorber cualquier daño.",
        hitech: "Absorbe 1 nivel de daño automáticamente.",
        mil: "Absorbe 2 niveles de daño automáticamente.",
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
        id: "cyberbrazos",
        title: "Cyberbrazos",
        items: cromos.filter((c) =>
          ["aracnogarfio", "brazo-combate", "extremidad-balistica", "tecnoherramienta"].includes(c.id)
        ),
      },
      {
        id: "cyberpiernas",
        title: "Cyberpiernas",
        items: cromos.filter((c) =>
          ["piernas-acorazado", "piernas-cuadrupedo", "piernas-velocista"].includes(c.id)
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
    sections,
    get(id) {
      return byId.get(id) || null;
    },
  };
})();

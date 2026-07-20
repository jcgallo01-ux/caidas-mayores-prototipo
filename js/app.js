// ===============================
// Caídas Mayores - Prototipo estable
// ===============================

// ---------- Estado ----------
let cameraRunning = false;
let stream = null;
let animationId = null;
let videoFrameCallbackId = null;
let processing = false;
let availableVideoDevices = [];
let renderMode = "privacy";
let sourceMode = "camera";
let uploadedVideoUrl = null;
let uploadedVideoName = "";
let currentPatientId = null;
let lastCompletedTestRecord = null;
let patientRegistry = {
  patients: [],
  tests: []
};

let testRunning = false;
let testStartTime = null;
let timerInterval = null;

let baselineFootY = null;
let esperandoInicio = false;
let triggerActivo = false;
let pieActivo = null;
let baselineFrames = 0;
let stableStartFrames = 0;
let startReady = false;
let readyCameraCentered = false;
let lastDelta = 0;

let framesElevado = 0;
let framesApoyado = 0;
let framesContactoPiernas = 0;
let instanteInicioApoyo = null;
let instanteInicioContactoPiernas = null;
let analisisMonopedia = null;
let analisisVideoCaida = null;
let analisisSitToStand = null;

// Ajustes calibrables
const UMBRAL_INICIO = 0.009;
const UMBRAL_FIN = 0.028;
const FRAMES_INICIO = 1;
const FRAMES_FIN = 2;
const BASELINE_FRAMES_MIN = 12;
const VISIBILIDAD_MINIMA = 0.6;
const VISIBILIDAD_MINIMA_VIDEO = 0.45;
const MIN_TEST_SECONDS = 3;
const FRAMES_EVENTO = 4;
const FRAMES_ESTABILIDAD_INICIO = 4;
const UMBRAL_DIFERENCIA_PIES_INICIO = 0.012;
const UMBRAL_DIFERENCIA_PIES_FIN = 0.035;
const UMBRAL_SEPARACION_PIERNAS = 0.18;
const UMBRAL_MOVIMIENTO_PREVIO_INICIO = 0.015;
const UMBRAL_BALANCEO_TRONCO = 0.045;
const UMBRAL_CAIDA_PELVIS = 0.03;
const UMBRAL_BRAZOS_ABIERTOS = 1.75;
const UMBRAL_CONTACTO_PIERNAS = 0.12;
const BASELINE_VIDEO_FRAMES_MIN = 5;
const UMBRAL_CAIDA_VIDEO_VELOCIDAD = 0.01;
const UMBRAL_CAIDA_VIDEO_DESCENSO = 0.1;
const UMBRAL_CAIDA_VIDEO_HORIZONTAL = 45;
const UMBRAL_CAIDA_VIDEO_HORIZONTAL_MODERADA = 24;
const UMBRAL_CAIDA_VIDEO_POSTURA_BAJA = 0.62;
const UMBRAL_CAIDA_VIDEO_DESCENSO_FUERTE = 0.055;
const UMBRAL_CAIDA_VIDEO_CAMBIO_ANGULO_MODERADO = 14;
const FRAMES_CAIDA_VIDEO = 3;
const UMBRAL_CAIDA_VIDEO_ANGULO_SEDESTACION = 105;
const UMBRAL_CAIDA_VIDEO_CAMBIO_ANGULO = 35;
const UMBRAL_CAIDA_VIDEO_VELOCIDAD_SEDESTACION = 0.045;
const FRAMES_PERDIDA_TRACKING = 2;
const UMBRAL_CAIDA_VIDEO_ANGULO_RETROCESO = 95;
const UMBRAL_CAIDA_VIDEO_CAMBIO_ANGULO_RETROCESO = 22;
const UMBRAL_CAIDA_VIDEO_VELOCIDAD_RETROCESO = 0.02;
const UMBRAL_CAIDA_VIDEO_POSTURA_BAJA_MODERADA = 0.57;
const UMBRAL_CAIDA_VIDEO_DESCENSO_MODERADO = 0.045;
const UMBRAL_CAIDA_VIDEO_CAMBIO_ANGULO_SUAVE = 10;
const VIDEO_FRAME_STEP_SECONDS = 1 / 30;
const SIT_TO_STAND_REPETICIONES_OBJETIVO = 5;
const SIT_TO_STAND_FRAMES_ESTABLES = 3;
const SIT_TO_STAND_ANGULO_RODILLA_SENTADO_MIN = 55;
const SIT_TO_STAND_ANGULO_RODILLA_SENTADO_MAX = 140;
const SIT_TO_STAND_ANGULO_RODILLA_PARADO_MIN = 150;
const SIT_TO_STAND_TRONCO_MAXIMO = 55;
const SIT_TO_STAND_CADERA_CERCA_RODILLA_MAX = 0.18;
const SIT_TO_STAND_CADERA_SOBRE_RODILLA_MIN = 0.08;
const SIT_TO_STAND_CENTRO_MIN = 0.3;
const SIT_TO_STAND_CENTRO_MAX = 0.7;
const SIT_TO_STAND_ALTURA_MINIMA = 0.24;
const SIT_TO_STAND_TOLERANCIA_CENTRO = 0.16;
const SIT_TO_STAND_TOLERANCIA_ALTURA = 0.7;
const SIT_TO_STAND_ASCENSO_CADERA_MIN = 0.045;
const SIT_TO_STAND_ASCENSO_HOMBROS_MIN = 0.035;
const SIT_TO_STAND_DELTA_CADERA_RODILLA_INICIO = 0.09;

function crearAnalisisMonopedia() {
  return {
    ladoElevado: null,
    baselineShoulderWidth: null,
    earliestCompensationTime: null,
    maxDeltaPieActivo: 0,
    piernaSeparadaDetectada: false,
    instantePrimeraSeparacion: null,
    eventos: {
      brazosAbiertos: null,
      caidaPelvis: null,
      balanceoTronco: null,
      toqueSuelo: null,
      apoyoPierna: null
    },
    rachas: {
      brazosAbiertos: 0,
      caidaPelvis: 0,
      balanceoTronco: 0
    }
  };
}

function crearAnalisisVideoCaida() {
  return {
    baselineHipY: null,
    baselineHipX: null,
    baselineHeadOffsetX: null,
    baselineTrunkAngle: null,
    baselineFrames: 0,
    previousHipY: null,
    maxHipDropSpeed: 0,
    maxHipDropFromBaseline: 0,
    maxHipLateralShift: 0,
    maxTrunkAngleDelta: 0,
    maxHeadOffsetFromAxis: 0,
    lastTrunkAngle: 0,
    lastHeadOffsetX: 0,
    lastCenterX: null,
    lastCenterY: null,
    lastHeadX: null,
    lastHeadY: null,
    lastHipX: null,
    lastHipY: null,
    lastShoulderX: null,
    lastShoulderY: null,
    lowPostureFrames: 0,
    horizontalFrames: 0,
    fallDetectedAt: null,
    fallReasons: [],
    detectionHipDrop: null,
    detectionTrunkAngle: null,
    detectionLateralShift: 0,
    detectionHeadOffset: 0,
    detectionLowPostureFrames: 0,
    detectionHorizontalFrames: 0,
    lostTrackingFrames: 0,
    strongMotionCandidateAt: null,
    seatedBackwardPattern: false,
    bestFallScore: 0,
    analysisCompleted: false
  };
}

function crearAnalisisSitToStand() {
  return {
    repeticionesCompletadas: 0,
    repeticionesObjetivo: SIT_TO_STAND_REPETICIONES_OBJETIVO,
    estadoActual: "desconocido",
    fase: "esperando_sentado",
    framesSentado: 0,
    framesParado: 0,
    inicioDetectadoEn: null,
    finalizadoEn: null,
    baselineHipKneeDelta: null,
    baselineHipY: null,
    baselineShoulderY: null,
    ultimaPostura: null,
    targetCenterX: null,
    targetBodyHeight: null,
    targetLocked: false
  };
}

// ---------- DOM ----------
const videoElement = document.getElementById("video");
const canvasElement = document.getElementById("canvas");
const canvasCtx = canvasElement.getContext("2d");

const toggleButton = document.getElementById("toggleCam");
const startTestButton = document.getElementById("startTest");
const stopTestButton = document.getElementById("stopTest");
const nuevoTestButton = document.getElementById("nuevoTest");
const saveCsvButton = document.getElementById("saveCsv");
const cameraModeEl = document.getElementById("cameraMode");
const cameraDeviceEl = document.getElementById("cameraDevice");
const framingModeEl = document.getElementById("framingMode");
const renderModeEl = document.getElementById("renderMode");
const refreshCamerasButton = document.getElementById("refreshCameras");
const loadVideoButton = document.getElementById("loadVideo");
const cameraHelpEl = document.getElementById("cameraHelp");
const videoHelpEl = document.getElementById("videoHelp");
const videoAnalysisModeEl = document.getElementById("videoAnalysisMode");
const videoSubjectRoleEl = document.getElementById("videoSubjectRole");
const videoPersonSelectionEl = document.getElementById("videoPersonSelection");
const videoExpectedDirectionEl = document.getElementById("videoExpectedDirection");
const videoHeadFocusEl = document.getElementById("videoHeadFocus");
const applyVideoModeButton = document.getElementById("applyVideoMode");
const patientSearchNameEl = document.getElementById("patientSearchName");
const patientSearchIdEl = document.getElementById("patientSearchId");
const patientSearchCenterEl = document.getElementById("patientSearchCenter");
const patientSelectEl = document.getElementById("patientSelect");
const newPatientButton = document.getElementById("newPatient");
const savePatientButton = document.getElementById("savePatient");
const savePendingPatientButton = document.getElementById("savePendingPatient");
const importCsvButton = document.getElementById("importCsv");
const csvFileInputEl = document.getElementById("csvFileInput");
const videoFileInputEl = document.getElementById("videoFileInput");
const patientHelpEl = document.getElementById("patientHelp");
const historyPanelEl = document.getElementById("historyPanel");
const testPhaseHelpEl = document.getElementById("testPhaseHelp");
const toggleSidebarButton = document.getElementById("toggleSidebar");

const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");
const fallAlertChip = document.getElementById("fallAlertChip");
const reviewResultButton = document.getElementById("reviewResult");
const replayEventButton = document.getElementById("replayEvent");
const prevFrameButton = document.getElementById("prevFrame");
const nextFrameButton = document.getElementById("nextFrame");
const resumenEl = document.getElementById("resumen");
const patientCodeEl = document.getElementById("patientCode");
const nombrePacienteEl = document.getElementById("nombrePaciente");
const fechaNacimientoDesktopEl = document.getElementById("fechaNacimientoDesktop");
const fechaNacimientoMobileEl = document.getElementById("fechaNacimientoMobile");
let fechaNacimientoEl = null;
const patientIdentifierEl = document.getElementById("patientIdentifier");
const edadCalculadaEl = document.getElementById("edadCalculada");
const sexoPacienteEl = document.getElementById("sexoPaciente");
const centroEl = document.getElementById("centro");
const pruebaEl = document.getElementById("prueba");
const observacionesEl = document.getElementById("observaciones");

// ---------- Persistencia / paciente ----------
const STORAGE_KEY = "caidasMayoresRegistroV1";
const RENDER_MODE_STORAGE_KEY = "caidasMayoresRenderModeV1";
const FRAMING_MODE_STORAGE_KEY = "caidasMayoresFramingModeV1";
const SIDEBAR_COLLAPSED_STORAGE_KEY = "caidasMayoresSidebarCollapsedV1";

function normalizeText(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getVideoAnalysisMode() {
  const mode = videoAnalysisModeEl?.value || "fall";
  return ["fall", "analysis", "ukemi"].includes(mode) ? mode : "fall";
}

function isTechnicalVideoAnalysisMode() {
  return getVideoAnalysisMode() === "analysis";
}

function isUkemiVideoMode() {
  return getVideoAnalysisMode() === "ukemi";
}

function usesDescriptiveVideoMode() {
  return isTechnicalVideoAnalysisMode() || isUkemiVideoMode();
}

function getVideoSubjectRole() {
  return videoSubjectRoleEl?.value || "visible";
}

function getVideoSubjectRoleLabel() {
  switch (getVideoSubjectRole()) {
    case "student":
      return "alumno";
    case "teacher":
      return "profesor";
    default:
      return "protagonista visible";
  }
}

function getVideoPersonSelection() {
  return videoPersonSelectionEl?.value || "auto";
}

function getVideoPersonSelectionLabel() {
  if (typeof UkemiSelection?.getSelectionLabel === "function") {
    return UkemiSelection.getSelectionLabel(getVideoPersonSelection(), "Auto");
  }
  return "Auto";
}

function getVideoPersonSelectionHint() {
  if (typeof UkemiSelection?.getSelectionHint === "function") {
    return UkemiSelection.getSelectionHint(getVideoPersonSelection());
  }
  return "Análisis automático del protagonista visible.";
}

function getVideoExpectedDirection() {
  return videoExpectedDirectionEl?.value || "";
}

function getVideoExpectedDirectionLabel() {
  switch (getVideoExpectedDirection()) {
    case "forward":
      return "hacia adelante";
    case "backward":
      return "hacia atrás";
    case "lateral":
      return "hacia un costado";
    case "rotation":
      return "con rotación";
    default:
      return "sin especificar";
  }
}

function getVideoHeadFocus() {
  return videoHeadFocusEl?.value?.trim() || "";
}

function createId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatPatientCode(sequenceNumber) {
  return `P-${String(sequenceNumber).padStart(4, "0")}`;
}

function isPendingPatient(patient) {
  return Boolean(patient?.pending);
}

function getPatientDisplayName(patient) {
  if (!patient) return "Paciente";
  if (patient.nombre) return patient.nombre;
  if (isPendingPatient(patient)) return "Pendiente de completar";
  return "Paciente sin nombre";
}

function parseStoredRegistry(rawValue) {
  if (!rawValue) return { patients: [], tests: [] };

  try {
    const parsed = JSON.parse(rawValue);
    return {
      patients: Array.isArray(parsed.patients) ? parsed.patients : [],
      tests: Array.isArray(parsed.tests) ? parsed.tests : []
    };
  } catch (error) {
    console.error("No se pudo leer el registro local", error);
    return { patients: [], tests: [] };
  }
}

function loadRegistry() {
  patientRegistry = parseStoredRegistry(localStorage.getItem(STORAGE_KEY));
  patientRegistry.patients = patientRegistry.patients.map((patient, index) => ({
    ...patient,
    patientCode: patient.patientCode || formatPatientCode(index + 1),
    edad: Number.isFinite(Number(patient.edad)) ? Number(patient.edad) : null,
    pending: Boolean(patient.pending)
  }));
}

function saveRegistry() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patientRegistry));
}

function calculateAgeFromBirthDate(fechaNacimiento) {
  if (!fechaNacimiento) return null;

  const birthDate = new Date(`${fechaNacimiento}T12:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let edad = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();

  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    edad -= 1;
  }

  return edad >= 0 ? edad : null;
}

function parseFlexibleBirthDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }

  const normalized = raw.replace(/\./g, "/").replace(/-/g, "/");
  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (!match) return "";

  const day = Number(match[1]);
  const month = Number(match[2]);
  let year = Number(match[3]);

  if (year < 100) {
    year += year >= 30 ? 1900 : 2000;
  }

  if (!day || !month || !year || month > 12 || day > 31) return "";

  const isoDate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const parsedDate = new Date(`${isoDate}T12:00:00`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() + 1 !== month ||
    parsedDate.getDate() !== day
  ) {
    return "";
  }

  return isoDate;
}

function formatBirthDateInput(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatBirthDateForDisplay(fechaNacimiento) {
  const isoDate = parseFlexibleBirthDate(fechaNacimiento);
  if (!isoDate) return String(fechaNacimiento || "").trim();

  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
}

function prefersNativeBirthDatePicker() {
  return !isDesktopComputer();
}

function getBirthDateInputValue() {
  return fechaNacimientoEl?.value || "";
}

function setBirthDateInputValue(value) {
  if (!fechaNacimientoEl) return;

  const normalizedDate = parseFlexibleBirthDate(value);

  if (fechaNacimientoEl === fechaNacimientoMobileEl) {
    fechaNacimientoEl.value = normalizedDate || "";
    return;
  }

  fechaNacimientoEl.value = normalizedDate
    ? formatBirthDateForDisplay(normalizedDate)
    : String(value || "").trim();
}

function syncBirthDateInputMode() {
  const useNativePicker = prefersNativeBirthDatePicker();
  const currentValue = parseFlexibleBirthDate(
    fechaNacimientoEl?.value
    || fechaNacimientoDesktopEl?.value
    || fechaNacimientoMobileEl?.value
    || ""
  );

  if (fechaNacimientoDesktopEl) {
    fechaNacimientoDesktopEl.hidden = useNativePicker;
  }

  if (fechaNacimientoMobileEl) {
    fechaNacimientoMobileEl.hidden = !useNativePicker;
  }

  fechaNacimientoEl = useNativePicker ? fechaNacimientoMobileEl : fechaNacimientoDesktopEl;
  setBirthDateInputValue(currentValue);
}

function getStoredPatientAge(patient) {
  const edad = Number(patient?.edad);
  return Number.isFinite(edad) && edad >= 0 ? edad : null;
}

function getPatientAge(patient) {
  if (!patient) return null;
  return calculateAgeFromBirthDate(patient.fechaNacimiento) ?? getStoredPatientAge(patient);
}

function getEdadPaciente() {
  const edadPorFecha = calculateAgeFromBirthDate(parseFlexibleBirthDate(getBirthDateInputValue()));
  if (edadPorFecha !== null) return edadPorFecha;

  const selectedPatient = getSelectedPatient();
  if (!selectedPatient) return null;

  const ageFallback = getStoredPatientAge(selectedPatient);
  const sameName = normalizeText(selectedPatient.nombre) === normalizeText(nombrePacienteEl?.value || "");
  const sameIdentifier = normalizeText(selectedPatient.identificador) === normalizeText(patientIdentifierEl?.value || "");
  const sameCenter = normalizeText(selectedPatient.centro) === normalizeText(centroEl?.value || "");

  return sameName && sameIdentifier && sameCenter ? ageFallback : null;
}

function updateCalculatedAge() {
  if (!edadCalculadaEl) return;

  const edad = getEdadPaciente();
  edadCalculadaEl.value = edad === null ? "" : `${edad} años`;
}

function getPatientPayloadFromForm() {
  const selectedPatient = getSelectedPatient();
  const fechaNacimiento = parseFlexibleBirthDate(getBirthDateInputValue());
  return {
    id: currentPatientId,
    patientCode: patientCodeEl?.value || selectedPatient?.patientCode || "",
    nombre: nombrePacienteEl?.value?.trim() || "",
    fechaNacimiento,
    identificador: patientIdentifierEl?.value?.trim() || selectedPatient?.identificador || "",
    edad: getEdadPaciente(),
    sexo: sexoPacienteEl?.value || "",
    centro: centroEl?.value?.trim() || "",
    observaciones: observacionesEl?.value?.trim() || ""
  };
}

function hasPatientFormDraft() {
  return Boolean(
    nombrePacienteEl?.value?.trim() ||
    getBirthDateInputValue().trim() ||
    patientIdentifierEl?.value?.trim() ||
    centroEl?.value?.trim() ||
    observacionesEl?.value?.trim()
  );
}

function hasUnsavedPatientDraft() {
  return !currentPatientId && hasPatientFormDraft();
}

function validatePatientData(options = {}) {
  const { allowPending = false } = options;
  const patient = getPatientPayloadFromForm();

  if (!patient.nombre) {
    if (allowPending && patient.centro) {
      return { ok: true, patient: { ...patient, pending: true } };
    }
    return { ok: false, message: "Antes de iniciar el test, cargue el nombre del paciente." };
  }

  if (!patient.fechaNacimiento && patient.edad === null) {
    if (allowPending && patient.centro) {
      return { ok: true, patient: { ...patient, pending: true } };
    }
    return {
      ok: false,
      message: "Antes de iniciar el test, cargue la fecha de nacimiento o importe una edad válida para el paciente."
    };
  }

  if (patient.fechaNacimiento && patient.edad === null) {
    return {
      ok: false,
      message: "La fecha de nacimiento no es válida. Revísela antes de iniciar el test."
    };
  }

  return { ok: true, patient };
}

function findPatientById(patientId) {
  return patientRegistry.patients.find((patient) => patient.id === patientId) || null;
}

function findPatientByCode(patientCode, center = "") {
  const normalizedCode = normalizeText(patientCode);
  if (!normalizedCode) return null;
  const normalizedCenter = normalizeText(center);
  if (normalizedCenter) {
    const byCenter = patientRegistry.patients.find(
      (patient) =>
        normalizeText(patient.patientCode) === normalizedCode &&
        normalizeText(patient.centro) === normalizedCenter
    );
    if (byCenter) return byCenter;
  }
  return patientRegistry.patients.find((patient) => normalizeText(patient.patientCode) === normalizedCode) || null;
}

function findPatientByIdentifier(identifier) {
  const normalizedIdentifier = normalizeText(identifier);
  if (!normalizedIdentifier) return null;
  return patientRegistry.patients.find((patient) => normalizeText(patient.identificador) === normalizedIdentifier) || null;
}

function getNextPatientCode(center = "") {
  const normalizedCenter = normalizeText(center);
  if (normalizedCenter) {
    const maxSequenceByCenter = patientRegistry.patients.reduce((maxValue, patient) => {
      if (normalizeText(patient.centro) !== normalizedCenter) return maxValue;
      const match = String(patient.patientCode || "").match(/(\d+)$/);
      const numericValue = match ? Number(match[1]) : 0;
      return Math.max(maxValue, Number.isFinite(numericValue) ? numericValue : 0);
    }, 0);

    return String(maxSequenceByCenter + 1);
  }

  const maxSequence = patientRegistry.patients.reduce((maxValue, patient) => {
    const match = String(patient.patientCode || "").match(/(\d+)$/);
    const numericValue = match ? Number(match[1]) : 0;
    return Math.max(maxValue, Number.isFinite(numericValue) ? numericValue : 0);
  }, 0);

  return formatPatientCode(maxSequence + 1);
}

function findMatchingPatient(patientData) {
  const normalizedName = normalizeText(patientData.nombre);
  const fechaNacimiento = patientData.fechaNacimiento || "";
  const patientCode = patientData.patientCode || patientData.codigoPaciente || "";
  const identificador = patientData.identificador || patientData.documento || patientData.dni || patientData.hc || "";
  const edad = Number.isFinite(Number(patientData.edad)) ? Number(patientData.edad) : null;
  const sexo = patientData.sexo || "";
  const centro = normalizeText(patientData.centro || "");

  if (patientData.id) {
    const byId = findPatientById(patientData.id);
    if (byId) return byId;
  }

  if (patientCode) {
    const byCode = findPatientByCode(patientCode, center);
    if (byCode) return byCode;
  }

  if (identificador) {
    const byIdentifier = findPatientByIdentifier(identificador);
    if (byIdentifier) return byIdentifier;
  }

  if (normalizedName && fechaNacimiento) {
    const byBirthDate = patientRegistry.patients.find(
      (patient) =>
        normalizeText(patient.nombre) === normalizedName &&
        (patient.fechaNacimiento || "") === fechaNacimiento
    );
    if (byBirthDate) return byBirthDate;
  }

  if (!normalizedName) return null;

  const candidates = patientRegistry.patients.filter((patient) => normalizeText(patient.nombre) === normalizedName);
  if (candidates.length !== 1) return null;

  const candidate = candidates[0];
  const candidateAge = getPatientAge(candidate);
  const ageMatches = edad !== null && candidateAge !== null ? Number(candidateAge) === Number(edad) : false;
  const sexMatches = sexo && candidate.sexo ? sexo === candidate.sexo : false;
  const centerMatches = centro && candidate.centro ? normalizeText(candidate.centro) === centro : false;
  const strongMatches = [ageMatches, sexMatches, centerMatches].filter(Boolean).length;

  return strongMatches >= 2 ? candidate : null;
}

function upsertPatient(patientData) {
  const existingPatient = findMatchingPatient(patientData);
  const edad = Number.isFinite(Number(patientData.edad))
    ? Number(patientData.edad)
    : getPatientAge(existingPatient);

  const mergedPatient = {
    id: existingPatient?.id || patientData.id || createId("patient"),
    patientCode: existingPatient?.patientCode || patientData.patientCode || getNextPatientCode(patientData.centro),
    nombre: patientData.nombre,
    fechaNacimiento: patientData.fechaNacimiento || "",
    edad,
    identificador: patientData.identificador || existingPatient?.identificador || "",
    sexo: patientData.sexo || "",
    centro: patientData.centro || "",
    observaciones: patientData.observaciones || "",
    pending: Boolean(patientData.pending && !patientData.nombre),
    updatedAt: new Date().toISOString()
  };

  if (existingPatient) {
    const index = patientRegistry.patients.findIndex((patient) => patient.id === existingPatient.id);
    patientRegistry.patients[index] = { ...existingPatient, ...mergedPatient };
  } else {
    patientRegistry.patients.push(mergedPatient);
  }

  currentPatientId = mergedPatient.id;
  if (patientCodeEl) {
    patientCodeEl.value = mergedPatient.patientCode || "";
  }
  saveRegistry();
  return mergedPatient;
}

function getRangoReferenciaPorEdad(edad) {
  if (edad === null) {
    return {
      etiqueta: "Edad no informada",
      minimoEsperado: null,
      descripcion: "No se pudo ajustar el resultado por grupo etario."
    };
  }

  if (edad < 50) {
    return {
      etiqueta: "20-49 años",
      minimoEsperado: 30,
      descripcion: "Valores habituales: más de 30 a 45 segundos por pierna."
    };
  }

  if (edad < 60) {
    return {
      etiqueta: "50-59 años",
      minimoEsperado: 20,
      descripcion: "Valores habituales: alrededor de 20 a 30 segundos."
    };
  }

  if (edad < 70) {
    return {
      etiqueta: "60-69 años",
      minimoEsperado: 15,
      descripcion: "Valores habituales: alrededor de 15 a 20 segundos."
    };
  }

  if (edad < 80) {
    return {
      etiqueta: "70-79 años",
      minimoEsperado: 10,
      descripcion: "Valores habituales: alrededor de 10 a 15 segundos."
    };
  }

  return {
    etiqueta: "80+ años",
    minimoEsperado: 8,
    descripcion: "Valores habituales: generalmente menores a 10 segundos."
  };
}

function getPruebaActual() {
  return pruebaEl?.value || "monopedia";
}

function getNombrePrueba(prueba) {
  switch (prueba) {
    case "sit_to_stand":
      return "Sit to Stand";
    case "tug":
      return "TUG";
    case "otros":
      return "Otros";
    default:
      return "Monopedia";
  }
}

function getRangoReferenciaSitToStandPorEdad(edad) {
  if (edad === null) {
    return {
      etiqueta: "Edad no informada",
      umbralNormal: null,
      descripcion: "No se pudo ajustar el tiempo por grupo etario."
    };
  }

  if (edad < 50) {
    return {
      etiqueta: "Menor de 50 años",
      umbralNormal: 10,
      descripcion: "No hay una referencia cargada en este prototipo para este grupo; se usa 10 s como orientación clínica inicial."
    };
  }

  if (edad < 60) {
    return {
      etiqueta: "50-59 años",
      umbralNormal: 10,
      descripcion: "Rango de referencia: 9.4 a 10.0 segundos para 5 repeticiones."
    };
  }

  if (edad < 70) {
    return {
      etiqueta: "60-69 años",
      umbralNormal: 11.4,
      descripcion: "Valor de referencia: alrededor de 11.4 segundos para 5 repeticiones."
    };
  }

  if (edad < 80) {
    return {
      etiqueta: "70-79 años",
      umbralNormal: 12.6,
      descripcion: "Valor de referencia: alrededor de 12.6 segundos para 5 repeticiones."
    };
  }

  if (edad < 90) {
    return {
      etiqueta: "80-89 años",
      umbralNormal: 14.8,
      descripcion: "Valor de referencia: alrededor de 14.8 segundos; tiempos mayores a 15 s sugieren fragilidad."
    };
  }

  return {
    etiqueta: "90+ años",
    umbralNormal: 15,
    descripcion: "Sin referencia local más fina en este prototipo; se toma 15 s como umbral orientativo."
  };
}

function getSelectedPatient() {
  return currentPatientId ? findPatientById(currentPatientId) : null;
}

function getPotentialDuplicatePatients(patientData) {
  const normalizedName = normalizeText(patientData.nombre);
  const fechaNacimiento = patientData.fechaNacimiento || "";
  const identificador = normalizeText(patientData.identificador || "");
  if (!normalizedName) return [];

  return patientRegistry.patients.filter((patient) => {
    if (patient.id === currentPatientId) return false;
    if (normalizeText(patient.nombre) !== normalizedName) return false;

    const sameBirthDate = fechaNacimiento && patient.fechaNacimiento && patient.fechaNacimiento === fechaNacimiento;
    const sameIdentifier =
      identificador &&
      patient.identificador &&
      normalizeText(patient.identificador) === identificador;

    return !sameBirthDate && !sameIdentifier;
  });
}

function fillPatientForm(patient) {
  if (!patient) return;

  currentPatientId = patient.id;
  if (patientCodeEl) patientCodeEl.value = patient.patientCode || "";
  nombrePacienteEl.value = isPendingPatient(patient) ? "" : patient.nombre || "";
  setBirthDateInputValue(patient.fechaNacimiento || "");
  if (patientIdentifierEl) patientIdentifierEl.value = patient.identificador || "";
  sexoPacienteEl.value = patient.sexo || "";
  centroEl.value = patient.centro || centroEl.value || "";
  observacionesEl.value = patient.observaciones || "";
  updateCalculatedAge();
  renderPatientSelect();
}

function clearPatientForm() {
  currentPatientId = null;
  if (patientSelectEl) patientSelectEl.value = "";
  if (patientCodeEl) patientCodeEl.value = "";
  nombrePacienteEl.value = "";
  setBirthDateInputValue("");
  if (patientIdentifierEl) patientIdentifierEl.value = "";
  edadCalculadaEl.value = "";
  sexoPacienteEl.value = "";
  observacionesEl.value = "";
  renderPatientHelp();
  renderPatientHistory();
  updateControls();
}

function renderPatientHelp(message = null) {
  if (!patientHelpEl) return;

  const pruebaActual = getPruebaActual();
  const validation = validatePatientData();
  const duplicatePatients = getPotentialDuplicatePatients(getPatientPayloadFromForm());
  const guiaPrueba =
    pruebaActual === "sit_to_stand"
      ? " Sit to Stand: usar silla sin brazos, brazos cruzados y completar 5 repeticiones."
      : pruebaActual === "tug"
        ? " TUG: esta prueba todavía no tiene análisis automático en esta versión."
        : "";
  const duplicateText = duplicatePatients.length
    ? ` Posibles homónimos detectados: ${duplicatePatients
      .slice(0, 2)
      .map((patient) => `${patient.patientCode || "Sin ID"}${patient.identificador ? ` / ${patient.identificador}` : ""}`)
      .join(", ")}. Si corresponde, complete DNI/HC antes de seguir.`
    : "";
  const draftText =
    hasUnsavedPatientDraft() && validation.ok
      ? " La ficha todavía no está guardada: use 'Guardar ficha' para que aparezca en la búsqueda e historial."
      : "";
  const selectedPatient = getSelectedPatient();
  const text = message
    || (
      selectedPatient && isPendingPatient(selectedPatient)
        ? `Ficha pendiente ${selectedPatient.patientCode || ""} seleccionada. Puede tomar estudios ahora y completar los datos del paciente más tarde.${guiaPrueba}`
        : validation.ok
          ? `Paciente listo${currentPatientId ? ` (${findPatientById(currentPatientId)?.patientCode || ""})` : ""}. Ya puede iniciar la prueba y guardar el resultado.${guiaPrueba}${draftText}`
          : `Complete nombre y fecha de nacimiento para habilitar la prueba, o use 'Asignar ID pendiente' para trabajo de campo.${guiaPrueba}`
    );

  patientHelpEl.textContent = `${text}${duplicateText}`;
}

function getSearchablePatientText(patient) {
  return normalizeText([
    patient.patientCode,
    patient.identificador,
    patient.nombre,
    patient.centro,
    patient.fechaNacimiento ? formatBirthDateForDisplay(patient.fechaNacimiento) : "",
    getPatientAge(patient) !== null ? `${getPatientAge(patient)} anos` : ""
  ].filter(Boolean).join(" "));
}

function matchesSearchTokens(haystack, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

function renderPatientSelect() {
  if (!patientSelectEl) return;

  const searchName = normalizeText(patientSearchNameEl?.value || "");
  const searchId = normalizeText(patientSearchIdEl?.value || "");
  const searchCenter = normalizeText(patientSearchCenterEl?.value || "");
  const options = ['<option value="">Nuevo paciente</option>'];
  const patients = [...patientRegistry.patients].sort((a, b) =>
    getPatientDisplayName(a).localeCompare(getPatientDisplayName(b), "es")
  );

  const filteredPatients = patients
    .filter((patient) => {
      const nameMatches = matchesSearchTokens(getSearchablePatientText(patient), searchName);
      const idMatches = matchesSearchTokens(getSearchablePatientText(patient), searchId);
      const centerMatches = matchesSearchTokens(normalizeText(patient.centro), searchCenter);
      return nameMatches && idMatches && centerMatches;
    });

  filteredPatients
    .forEach((patient) => {
      const edad = getPatientAge(patient);
      const identificadorLabel = patient.identificador ? ` | ${patient.identificador}` : "";
      const label = `${patient.patientCode || "Sin ID"}${identificadorLabel} | ${getPatientDisplayName(patient)}${edad !== null ? ` (${edad} años)` : ""}${isPendingPatient(patient) ? " [pendiente]" : ""}`;
      const selected = patient.id === currentPatientId ? " selected" : "";
      options.push(`<option value="${escapeHtml(patient.id)}"${selected}>${escapeHtml(label)}</option>`);
    });

  if (!filteredPatients.length) {
    options.push('<option value="" disabled>Sin coincidencias</option>');
  }

  patientSelectEl.innerHTML = options.join("");

  if (currentPatientId && findPatientById(currentPatientId)) {
    patientSelectEl.value = currentPatientId;
  }
}

function getTestsForPatient(patientId) {
  return patientRegistry.tests
    .filter((test) => test.patientId === patientId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

function getRiskScore(test) {
  if (test.resultadoNivel === "alto" || test.resultadoColor === "rojo") return 3;
  if (test.resultadoNivel === "moderado" || test.resultadoColor === "amarillo") return 2;
  return 1;
}

function getAggregateRiskForPatient(tests) {
  if (!tests.length) {
    return {
      color: "gris",
      titulo: "Sin datos suficientes",
      detalle: "Todavía no hay estudios para estimar un riesgo aproximado."
    };
  }

  const scores = tests.map(getRiskScore);
  const averageScore = scores.reduce((sum, value) => sum + value, 0) / scores.length;
  const highCount = scores.filter((value) => value === 3).length;
  const moderateCount = scores.filter((value) => value === 2).length;

  if (highCount >= 1 || averageScore >= 2.4) {
    return {
      color: "rojo",
      titulo: "Riesgo global aproximado alto",
      detalle: "Hay al menos un estudio en zona roja o una combinación de resultados consistentemente comprometidos."
    };
  }

  if (moderateCount >= 1 || averageScore >= 1.6) {
    return {
      color: "amarillo",
      titulo: "Riesgo global aproximado moderado",
      detalle: "Los estudios muestran alertas intermedias o un rendimiento por debajo del esperado en parte de la evaluación."
    };
  }

  return {
    color: "verde",
    titulo: "Riesgo global aproximado bajo",
    detalle: "Los estudios cargados se ubican, en conjunto, dentro de rangos más favorables para este tamizaje."
  };
}

function getComparisonHighlights(tests) {
  if (!tests.length) return [];

  const byTest = tests.reduce((accumulator, test) => {
    const key = test.prueba || "monopedia";
    if (!accumulator[key]) accumulator[key] = [];
    accumulator[key].push(test);
    return accumulator;
  }, {});

  return Object.values(byTest)
    .filter((group) => group.length >= 2)
    .map((group) => {
      const ordered = [...group].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      const first = ordered[0];
      const last = ordered[ordered.length - 1];
      const delta = Number(last.tiempoSegundos) - Number(first.tiempoSegundos);
      const trendLabel =
        Math.abs(delta) < 0.2
          ? "sin cambios relevantes"
          : delta > 0
            ? `cambio de +${delta.toFixed(1)} s`
            : `cambio de ${delta.toFixed(1)} s`;

      return `${getNombrePrueba(last.prueba)}: ${ordered.length} registros, ${trendLabel} entre el primer y el último estudio cargado.`;
    });
}

function renderPatientHistory() {
  if (!historyPanelEl) return;

  const patient = getSelectedPatient();

  if (!patient) {
    historyPanelEl.innerHTML = `
      <h3>Resultados previos</h3>
      <div class="history-empty">Seleccione un paciente para ver el historial.</div>
    `;
    return;
  }

  const tests = getTestsForPatient(patient.id);

  if (!tests.length) {
    historyPanelEl.innerHTML = `
      <h3>Resultados previos de ${escapeHtml(getPatientDisplayName(patient))}</h3>
      <div class="history-summary">
        <p><span class="history-id">ID paciente: ${escapeHtml(patient.patientCode || "Sin ID")}</span></p>
        <p><strong>DNI / HC:</strong> ${escapeHtml(patient.identificador || "No informado")}</p>
        <p>${isPendingPatient(patient) ? "Ficha pendiente creada. Puede cargar datos definitivos cuando los tenga." : "La ficha está creada, pero todavía no hay estudios guardados."}</p>
      </div>
      <div class="history-empty">Sin resultados previos cargados.</div>
    `;
    return;
  }

  const aggregateRisk = getAggregateRiskForPatient(tests);
  const comparisonHighlights = getComparisonHighlights(tests);
  const riskLabel = aggregateRisk.color === "gris" ? "SIN DATO" : aggregateRisk.color.toUpperCase();

  historyPanelEl.innerHTML = `
    <h3>Resultados previos de ${escapeHtml(getPatientDisplayName(patient))}</h3>
    <div class="history-summary">
      <p><span class="history-id">ID paciente: ${escapeHtml(patient.patientCode || "Sin ID")}</span></p>
      <p><strong>DNI / HC:</strong> ${escapeHtml(patient.identificador || "No informado")}</p>
      <p><strong>${escapeHtml(aggregateRisk.titulo)}</strong> <span class="history-risk ${escapeHtml(aggregateRisk.color)}">${escapeHtml(riskLabel)}</span></p>
      <p>${escapeHtml(aggregateRisk.detalle)}</p>
      ${comparisonHighlights.length
        ? `<p>${escapeHtml(comparisonHighlights.join(" "))}</p>`
        : ""}
    </div>
    <div class="history-table-wrap">
      <table class="history-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Estudio</th>
            <th>Resultado</th>
            <th>Tiempo</th>
            <th>Riesgo</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          ${tests
            .map(
              (test) => `
                <tr>
                  <td>${escapeHtml(formatDateTime(test.timestamp))}</td>
                  <td>${escapeHtml(getNombrePrueba(test.prueba || "monopedia"))}</td>
                  <td>${escapeHtml(test.resultadoTitulo || "Sin clasificación")}</td>
                  <td>${escapeHtml(formatSeconds(test.tiempoSegundos))}</td>
                  <td><span class="history-risk ${escapeHtml(test.resultadoColor || "")}">${escapeHtml((test.resultadoColor || "sin dato").toUpperCase())}</span></td>
                  <td>${escapeHtml(test.observaciones || "Sin observaciones")}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </div>
    <div class="history-note">Estimación orientativa: el riesgo global se calcula a partir de los estudios cargados en este prototipo y no reemplaza la interpretación del profesional tratante ni una valoración clínica integral.</div>
  `;
}

function formatDateTime(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString || "";

  return date.toLocaleString("es-AR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function csvEscape(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCsv() {
  if (!patientRegistry.tests.length) {
    setStatus("Todavía no hay resultados guardados para exportar.");
    return;
  }

  const header = [
    "timestamp",
    "patient_id",
    "patient_code",
    "patient_identifier",
    "paciente",
    "fecha_nacimiento",
    "edad",
    "sexo",
    "centro",
    "prueba",
    "observaciones",
    "tiempo_segundos",
    "resultado_nivel",
    "resultado_color",
    "resultado_titulo",
    "motivo_fin"
  ];

  const rows = patientRegistry.tests.map((test) =>
    [
      test.timestamp,
      test.patientId,
      test.patientCode || "",
      test.patientIdentifier || "",
      test.patientName,
      test.fechaNacimiento,
      test.edad,
      test.sexo,
      test.centro,
      test.prueba,
      test.observaciones,
      Number(test.tiempoSegundos).toFixed(1),
      test.resultadoNivel,
      test.resultadoColor,
      test.resultadoTitulo,
      test.motivoFin
    ]
      .map(csvEscape)
      .join(",")
  );

  const csvContent = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);

  link.href = url;
  link.download = `monopedia_historial_${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  setStatus("CSV exportado con el historial de pacientes y resultados.");
}

function splitCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  result.push(current);
  return result;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((header) => normalizeText(header));

  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    return headers.reduce((row, header, index) => {
      row[header] = values[index] ?? "";
      return row;
    }, {});
  });
}

function getCsvValue(row, aliases = []) {
  for (const alias of aliases) {
    const value = row[normalizeText(alias)];
    if (value !== undefined && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return "";
}

function parseImportedNumber(value) {
  if (value === null || value === undefined) return null;

  const normalized = String(value).trim().replace(",", ".");
  if (!normalized) return null;

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseImportedDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return parseFlexibleBirthDate(raw.split(",")[0].trim());
}

function normalizeImportedSex(value) {
  const normalized = normalizeText(value);
  if (!normalized) return "";
  if (["f", "femenino", "mujer", "female"].includes(normalized)) return "F";
  if (["m", "masculino", "varon", "varón", "hombre", "male"].includes(normalized)) return "M";
  return String(value || "").trim().toUpperCase().slice(0, 1);
}

function extractPatientDataFromRow(row) {
  const nombre = getCsvValue(row, [
    "paciente",
    "nombre",
    "nombre y apellido",
    "nombre completo",
    "apellido y nombre",
    "apellidos y nombres"
  ]);
  const fechaNacimiento = parseImportedDate(getCsvValue(row, [
    "fecha_nacimiento",
    "fecha de nacimiento",
    "nacimiento",
    "fecha nac",
    "fecnac"
  ]));
  const edad = parseImportedNumber(getCsvValue(row, ["edad", "age"]));
  const sexo = normalizeImportedSex(getCsvValue(row, ["sexo", "genero", "género"]));
  const centro = getCsvValue(row, ["centro", "lugar", "sede", "institucion", "institución"]);
  const observaciones = getCsvValue(row, ["observaciones", "comentarios", "notas"]);
  const patientCode = getCsvValue(row, ["patient_code", "codigo_paciente", "codigo paciente", "id_paciente"]);
  const identificador = getCsvValue(row, [
    "patient_identifier",
    "identificador",
    "documento",
    "dni",
    "hc",
    "historia clinica",
    "historia clínica"
  ]);

  return {
    id: getCsvValue(row, ["patient_id", "id"]),
    patientCode,
    identificador,
    nombre,
    fechaNacimiento,
    edad,
    sexo,
    centro,
    observaciones
  };
}

function rowLooksLikeTest(row) {
  const prueba = getCsvValue(row, ["prueba"]);
  const tiempo = getCsvValue(row, ["tiempo_segundos", "tiempo", "duracion", "duración"]);
  const resultado = getCsvValue(row, ["resultado_nivel", "resultado_color", "resultado_titulo", "valido", "valido"]);
  return Boolean(prueba || tiempo || resultado);
}

function importPatientsFromRows(rows) {
  let imported = 0;
  let updated = 0;
  let skipped = 0;
  let lastPatientId = null;

  rows.forEach((row) => {
    const patientData = extractPatientDataFromRow(row);
    if (!patientData.nombre.trim()) {
      skipped += 1;
      return;
    }

    const existingPatient = findMatchingPatient(patientData);
    const patient = upsertPatient(patientData);
    lastPatientId = patient.id;

    if (existingPatient) {
      updated += 1;
    } else {
      imported += 1;
    }
  });

  if (lastPatientId) {
    currentPatientId = lastPatientId;
    fillPatientForm(findPatientById(lastPatientId));
  }

  saveRegistry();
  renderPatientSelect();
  renderPatientHistory();
  renderPatientHelp(
    `Importación de pacientes finalizada. Nuevos: ${imported}. Actualizados: ${updated}. Omitidos: ${skipped}.`
  );
  updateControls();
  setStatus(`Pacientes importados: ${imported} nuevos, ${updated} actualizados.`);
}

function importTestsFromRows(rows) {
  let imported = 0;
  let ambiguous = 0;
  let lastPatientId = null;

  rows.forEach((row) => {
    const patientData = extractPatientDataFromRow(row);
    const nombre = patientData.nombre;

    if (!nombre.trim()) return;

    const beforeMatch = findMatchingPatient({
      id: patientData.id || "",
      patientCode: patientData.patientCode,
      identificador: patientData.identificador,
      nombre: nombre.trim(),
      fechaNacimiento: patientData.fechaNacimiento,
      edad: patientData.edad,
      sexo: patientData.sexo,
      centro: patientData.centro
    });
    const homonymCandidates = patientRegistry.patients.filter(
      (patient) => normalizeText(patient.nombre) === normalizeText(nombre.trim())
    );
    if (!beforeMatch && homonymCandidates.length) {
      ambiguous += 1;
    }

    const patient = upsertPatient({
      ...patientData,
      nombre: nombre.trim()
    });
    lastPatientId = patient.id;

    const prueba = getCsvValue(row, ["prueba"]) || "monopedia";
    const tiempoSegundos = parseImportedNumber(
      getCsvValue(row, ["tiempo_segundos", "tiempo", "duracion", "duración"])
    ) ?? 0;
    const edad = getPatientAge(patient);
    const resultado = getResultadoSegunPrueba(prueba, tiempoSegundos, edad);

    patientRegistry.tests.push({
      id: createId("imported"),
      patientId: patient.id,
      patientCode: patient.patientCode || "",
      patientIdentifier: patient.identificador || "",
      patientName: patient.nombre,
      fechaNacimiento: patient.fechaNacimiento,
      edad,
      sexo: patient.sexo || patientData.sexo || "",
      centro: patient.centro || patientData.centro || "",
      prueba,
      observaciones: patientData.observaciones || "",
      tiempoSegundos,
      resultadoNivel: getCsvValue(row, ["resultado_nivel"]) || resultado.nivel,
      resultadoColor: getCsvValue(row, ["resultado_color"]) || resultado.color,
      resultadoTitulo: getCsvValue(row, ["resultado_titulo"]) || resultado.titulo,
      resultadoDetalle: getCsvValue(row, ["resultado_detalle"]) || resultado.detalle,
      motivoFin: getCsvValue(row, ["motivo_fin", "motivo"]) || "",
      timestamp: getCsvValue(row, ["timestamp", "fecha"]) || new Date().toISOString()
    });

    imported += 1;
  });

  saveRegistry();
  if (lastPatientId) {
    currentPatientId = lastPatientId;
    fillPatientForm(findPatientById(lastPatientId));
  }
  renderPatientSelect();
  renderPatientHistory();
  setStatus(
    ambiguous
      ? `Importación finalizada. Se cargaron ${imported} registros. ${ambiguous} filas quedaron como pacientes separados para evitar mezclar posibles homónimos; conviene revisar o usar el ID paciente en próximos CSV.`
      : `Importación finalizada. Se cargaron ${imported} registros desde CSV.`
  );
}

function clasificarRiesgoMonopedia(tiempoSegundos, edad) {
  const referencia = getRangoReferenciaPorEdad(edad);

  if (tiempoSegundos < 5) {
    return {
      nivel: "alto",
      color: "rojo",
      titulo: "Riesgo alto de caídas",
      detalle:
        "Un tiempo menor a 5 segundos se asocia con mayor riesgo de caídas en personas mayores.",
      referencia
    };
  }

  if (referencia.minimoEsperado !== null && tiempoSegundos >= referencia.minimoEsperado) {
    return {
      nivel: "bajo",
      color: "verde",
      titulo: "Riesgo bajo",
      detalle:
        "El rendimiento se encuentra dentro de los valores esperados para la edad en esta prueba de tamizaje.",
      referencia
    };
  }

  return {
    nivel: "moderado",
    color: "amarillo",
    titulo: "Riesgo moderado",
    detalle:
      referencia.minimoEsperado === null
        ? "El tiempo quedó por encima del umbral crítico, pero falta la edad para compararlo con valores esperados."
        : "El tiempo quedó por debajo del valor esperado para la edad, sin ingresar en el umbral de mayor riesgo.",
    referencia
  };
}

function clasificarRiesgoSitToStand(tiempoSegundos, edad) {
  const referencia = getRangoReferenciaSitToStandPorEdad(edad);

  if (referencia.umbralNormal !== null && tiempoSegundos <= referencia.umbralNormal) {
    return {
      nivel: "bajo",
      color: "verde",
      titulo: "Rendimiento funcional dentro de rango",
      detalle:
        "Completó las 5 repeticiones en un tiempo compatible con el rango de referencia para la edad.",
      referencia
    };
  }

  if (edad !== null && edad >= 80 && tiempoSegundos > 15) {
    return {
      nivel: "alto",
      color: "rojo",
      titulo: "Tiempo elevado con posible fragilidad",
      detalle:
        "En mayores de 80 años, un tiempo superior a 15 segundos sugiere fragilidad funcional y mayor riesgo de caídas.",
      referencia
    };
  }

  if (referencia.umbralNormal !== null && tiempoSegundos <= referencia.umbralNormal + 2) {
    return {
      nivel: "moderado",
      color: "amarillo",
      titulo: "Rendimiento levemente enlentecido",
      detalle:
        "El tiempo quedó por encima del valor esperado para la edad, aunque sin ubicarse en el rango más comprometido de esta guía inicial.",
      referencia
    };
  }

  return {
    nivel: "alto",
    color: "rojo",
    titulo: "Rendimiento funcional disminuido",
    detalle:
      referencia.umbralNormal === null
        ? "El tiempo fue alto para esta prueba, pero falta la edad para compararlo con mayor precisión."
        : "El tiempo quedó claramente por encima del valor esperado para la edad, lo que puede reflejar menor fuerza funcional y mayor riesgo de caídas.",
    referencia
  };
}

function limpiarResumen() {
  if (!resumenEl) return;
  resumenEl.innerHTML = "Sin datos todavía.";
  resumenEl.style.display = "none";
  updateReviewResultButton();
  updateFallAlertChip();
  updateReplayEventButton();
  updateFrameStepButtons();
}

function registrarEventoAnalisis(clave, tiempoSegundos) {
  if (!analisisMonopedia || analisisMonopedia.eventos[clave] !== null) return;

  analisisMonopedia.eventos[clave] = tiempoSegundos;

  if (
    analisisMonopedia.earliestCompensationTime === null ||
    tiempoSegundos < analisisMonopedia.earliestCompensationTime
  ) {
    analisisMonopedia.earliestCompensationTime = tiempoSegundos;
  }
}

function actualizarEventoSostenido(clave, condicion, tiempoSegundos) {
  if (!analisisMonopedia) return;

  if (!condicion) {
    analisisMonopedia.rachas[clave] = 0;
    return;
  }

  analisisMonopedia.rachas[clave] += 1;

  if (analisisMonopedia.rachas[clave] >= FRAMES_EVENTO) {
    registrarEventoAnalisis(clave, Math.max(0, tiempoSegundos));
  }
}

function wasStoppedByLegSupport(motivoFin = "") {
  return normalizeText(motivoFin).includes("pierna de apoyo");
}

function getInterpretacionesCompensaciones(eventos, motivoFin = "") {
  const interpretaciones = [];

  if (eventos.brazosAbiertos !== null) {
    interpretaciones.push(
      `Brazos abiertos desde ${formatSeconds(eventos.brazosAbiertos)}: sugiere inestabilidad global o intento de evitar la caída.`
    );
  }

  if (eventos.caidaPelvis !== null) {
    interpretaciones.push(
      `Caída de la pelvis opuesta desde ${formatSeconds(eventos.caidaPelvis)}: orienta a debilidad del glúteo medio o déficit de control de cadera.`
    );
  }

  if (eventos.balanceoTronco !== null) {
    interpretaciones.push(
      `Balanceo marcado del tronco desde ${formatSeconds(eventos.balanceoTronco)}: compatible con menor control central o fatiga.`
    );
  }

  if (eventos.toqueSuelo !== null) {
    interpretaciones.push(
      `El pie elevado tocó el suelo a los ${formatSeconds(eventos.toqueSuelo)}: se interpreta como error de ejecución o límite de la capacidad estática.`
    );
  }

  if (eventos.apoyoPierna !== null && wasStoppedByLegSupport(motivoFin)) {
    interpretaciones.push(
      `La pierna elevada se apoyó sobre la opuesta a los ${formatSeconds(eventos.apoyoPierna)}: desde el punto de vista técnico el test se detiene en ese instante porque dejó de sostenerse estrictamente sobre un solo pie.`
    );
  }

  return interpretaciones;
}

function getNotasCompensacion(eventos, tiempoSegundos, motivoFin = "") {
  const notas = [];
  const tiemposEventos = [
    eventos.brazosAbiertos,
    eventos.caidaPelvis,
    eventos.balanceoTronco,
    eventos.toqueSuelo,
    wasStoppedByLegSupport(motivoFin) ? eventos.apoyoPierna : null
  ].filter((valor) => valor !== null);
  const primerEvento = tiemposEventos.length ? Math.min(...tiemposEventos) : null;

  if (primerEvento !== null) {
    if (primerEvento < 5) {
      notas.push(
        "Las oscilaciones aparecieron antes de los 5 segundos, lo que se asocia con un riesgo de caída significativamente mayor en la vida diaria."
      );
    } else if (primerEvento < 10) {
      notas.push(
        "Las oscilaciones aparecieron antes de los 10 segundos, un patrón que también incrementa el riesgo funcional de caída."
      );
    }
  }

  if (eventos.apoyoPierna !== null && wasStoppedByLegSupport(motivoFin)) {
    notas.push(
      `El tiempo contabilizado se cerró en ${formatSeconds(
        tiempoSegundos
      )}, correspondiente al primer contacto de la pierna elevada con la de apoyo.`
    );
  }

  return notas;
}

function saveCompletedTestRecord(record) {
  patientRegistry.tests.push(record);
  lastCompletedTestRecord = record;
  saveRegistry();
  renderPatientSelect();
  renderPatientHistory();
  updateReviewResultButton();
}

function savePatientFromForm(options = {}) {
  const validation = validatePatientData();
  if (!validation.ok) {
    renderPatientHelp(validation.message);
    setStatus(validation.message);
    updateControls();
    return null;
  }

  const patient = upsertPatient(validation.patient);
  fillPatientForm(patient);
  renderPatientHelp(options.message || `Ficha guardada para ${patient.nombre}. Ya aparece en la búsqueda e historial.`);
  renderPatientHistory();
  updateControls();
  setStatus(options.status || `Ficha guardada: ${patient.patientCode || patient.nombre}.`);
  return patient;
}

function savePendingPatientFromForm() {
  const patientData = getPatientPayloadFromForm();

  if (!patientData.centro) {
    const message = "Indique el centro antes de asignar un ID pendiente.";
    renderPatientHelp(message);
    setStatus(message);
    updateControls();
    return null;
  }

  const patient = upsertPatient({
    ...patientData,
    pending: true,
    nombre: "",
    fechaNacimiento: "",
    edad: null,
    identificador: ""
  });

  fillPatientForm(patient);
  renderPatientHelp(`ID pendiente ${patient.patientCode || ""} asignado. Ya puede iniciar el test y completar los datos del paciente más tarde.`);
  renderPatientHistory();
  updateControls();
  setStatus(`Ficha pendiente creada: ${patient.patientCode || "Sin ID"}.`);
  return patient;
}

function confirmSavePatientDraftIfNeeded() {
  if (!hasUnsavedPatientDraft()) return true;

  const validation = validatePatientData();
  if (!validation.ok) return true;

  const shouldSave = window.confirm(
    "Hay una ficha cargada sin guardar. ¿Desea guardarla antes de continuar?"
  );

  if (!shouldSave) return true;

  return Boolean(savePatientFromForm());
}

function updateReviewResultButton() {
  if (!reviewResultButton) return;

  const hasRenderedSummary =
    resumenEl &&
    resumenEl.style.display !== "none" &&
    normalizeText(resumenEl.textContent || "") !== "sin datos todavia.";

  reviewResultButton.hidden = !(lastCompletedTestRecord || hasRenderedSummary);
}

function updateReplayEventButton() {
  if (!replayEventButton) return;

  replayEventButton.hidden = !(
    sourceMode === "file" &&
    analisisVideoCaida &&
    analisisVideoCaida.fallDetectedAt !== null
  );
}

function updateFallAlertChip() {
  if (!fallAlertChip) return;

  fallAlertChip.hidden = !(
    sourceMode === "file" &&
    getVideoAnalysisMode() === "fall" &&
    analisisVideoCaida &&
    analisisVideoCaida.fallDetectedAt !== null
  );
}

function updateFrameStepButtons() {
  const show = sourceMode === "file" && Boolean(videoElement?.src || uploadedVideoUrl);
  if (prevFrameButton) prevFrameButton.hidden = !show;
  if (nextFrameButton) nextFrameButton.hidden = !show;
}

function updateApplyVideoModeButton() {
  if (!applyVideoModeButton) return;
  applyVideoModeButton.disabled = !(sourceMode === "file" && Boolean(uploadedVideoUrl || videoElement?.src));
}

function stepVideoFrame(direction = 1) {
  if (sourceMode !== "file") return;
  videoElement.pause();
  const delta = VIDEO_FRAME_STEP_SECONDS * Math.sign(direction || 1);
  videoElement.currentTime = Math.max(0, (videoElement.currentTime || 0) + delta);
}

async function renderCurrentVideoFrame() {
  if (sourceMode !== "file") return;
  if (processing || videoElement.readyState < 2) return;

  processing = true;
  try {
    await pose.send({ image: videoElement });
  } finally {
    processing = false;
  }
}

function getVideoRotationLabel(angleDelta) {
  if (angleDelta >= 28) return "alta";
  if (angleDelta >= 14) return "moderada";
  if (angleDelta > 0) return "leve";
  return "no evidente";
}

function getVideoLateralShiftLabel(shift) {
  if (shift >= 0.08) return "marcado";
  if (shift >= 0.04) return "moderado";
  if (shift > 0) return "leve";
  return "no evidente";
}

function getHeadAlignmentLabel(offset) {
  const absOffset = Math.abs(offset);
  if (absOffset < 0.025) return "centrada";
  if (offset > 0) return "desplazada hacia la derecha";
  return "desplazada hacia la izquierda";
}

function getVideoContextNotes() {
  const notes = [];
  const subjectRole = getVideoSubjectRoleLabel();
  const expectedDirection = getVideoExpectedDirectionLabel();
  const headFocus = getVideoHeadFocus();

  if (isUkemiVideoMode()) {
    notes.push(`Protagonista seleccionado para seguimiento: ${subjectRole}.`);
    notes.push(`Persona activa para el análisis: ${getVideoPersonSelectionLabel()}.`);
    notes.push(getVideoPersonSelectionHint());
  }

  if (getVideoExpectedDirection()) {
    notes.push(`Dirección o tipo esperado informado por el usuario: ${expectedDirection}.`);
  }

  if (headFocus) {
    notes.push(`Foco adicional solicitado: ${headFocus}.`);
  }

  return notes;
}

function renderUkemiOverlay(landmarks) {
  if (sourceMode !== "file" || !isUkemiVideoMode() || !canvasCtx) return;

  const nose = landmarks?.[0];
  const leftShoulder = landmarks?.[11];
  const rightShoulder = landmarks?.[12];
  const leftHip = landmarks?.[23];
  const rightHip = landmarks?.[24];
  if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) return;

  const shoulderX = ((leftShoulder.x + rightShoulder.x) / 2) * canvasElement.width;
  const shoulderY = ((leftShoulder.y + rightShoulder.y) / 2) * canvasElement.height;
  const hipX = ((leftHip.x + rightHip.x) / 2) * canvasElement.width;
  const hipY = ((leftHip.y + rightHip.y) / 2) * canvasElement.height;
  const centerX = (shoulderX + hipX) / 2;
  const centerY = (shoulderY + hipY) / 2;
  const headX = nose.x * canvasElement.width;
  const headY = nose.y * canvasElement.height;

  canvasCtx.save();
  canvasCtx.strokeStyle = "#fbbf24";
  canvasCtx.lineWidth = 3;
  canvasCtx.setLineDash([8, 6]);
  canvasCtx.beginPath();
  canvasCtx.moveTo(shoulderX, shoulderY);
  canvasCtx.lineTo(hipX, hipY);
  canvasCtx.stroke();
  canvasCtx.setLineDash([]);

  canvasCtx.fillStyle = "#fbbf24";
  canvasCtx.beginPath();
  canvasCtx.arc(centerX, centerY, 7, 0, Math.PI * 2);
  canvasCtx.fill();

  canvasCtx.strokeStyle = "#60a5fa";
  canvasCtx.lineWidth = 3;
  canvasCtx.beginPath();
  canvasCtx.arc(headX, headY, 11, 0, Math.PI * 2);
  canvasCtx.stroke();

  canvasCtx.fillStyle = "rgba(10, 15, 20, 0.78)";
  canvasCtx.fillRect(18, canvasElement.height - 108, 290, 84);
  canvasCtx.fillStyle = "#f8fafc";
  canvasCtx.font = "bold 15px Arial";
  canvasCtx.fillText(`Ukemi: ${getVideoSubjectRoleLabel()}`, 30, canvasElement.height - 78);
  canvasCtx.font = "13px Arial";
  canvasCtx.fillText(`Persona activa: ${getVideoPersonSelectionLabel()}`, 30, canvasElement.height - 54);
  canvasCtx.fillText("CG aprox. y eje resaltados", 30, canvasElement.height - 34);
  canvasCtx.restore();
}

function rerenderVideoSummaryIfVisible() {
  if (
    sourceMode === "file" &&
    analisisVideoCaida &&
    resumenEl &&
    resumenEl.style.display !== "none"
  ) {
    renderResultadoVideoCaida();
  }
}

async function applyVideoAnalysis(options = {}) {
  const { autoplay = true } = options;
  if (sourceMode !== "file" || !(uploadedVideoUrl || videoElement?.src)) return;

  analisisVideoCaida = crearAnalisisVideoCaida();
  limpiarResumen();
  updateVideoHelp();
  videoElement.pause();
  videoElement.currentTime = 0;

  if (autoplay) {
    try {
      await videoElement.play();
      cameraRunning = true;
      processing = false;
      cancelAnimationFrame(animationId);
      scheduleVideoFrameProcessing();
      setStatus(
        isUkemiVideoMode()
          ? "Analizando video en modo ukemi. Podés pausar o revisar cuadro a cuadro."
          : isTechnicalVideoAnalysisMode()
          ? "Analizando video en modo técnico. Podés pausar o revisar cuadro a cuadro."
          : "Analizando video local. Podés pausar o volver a reproducir para revisar el tramo detectado."
      );
    } catch (error) {
      console.warn("La reproducción automática fue bloqueada al aplicar el análisis", error);
      setStatus("Video listo. Presioná reproducir para iniciar el análisis con el modo seleccionado.");
    }
  } else {
    await renderCurrentVideoFrame();
    setStatus("Modo de video actualizado. Presioná Aplicar análisis o reproducir para revisar.");
  }

  updateFallAlertChip();
  updateReplayEventButton();
  updateFrameStepButtons();
}

function renderResultadoMonopedia(patient, patientData, tiempoSegundos, motivoFin = null) {
  if (!resumenEl) return;

  const edad = patientData.edad;
  const nombrePaciente = patientData.nombre || getPatientDisplayName(patient);
  const resultado = clasificarRiesgoMonopedia(tiempoSegundos, edad);
  const eventos = analisisMonopedia?.eventos ?? crearAnalisisMonopedia().eventos;
  const interpretaciones = getInterpretacionesCompensaciones(eventos, motivoFin);
  const notasCompensacion = getNotasCompensacion(eventos, tiempoSegundos, motivoFin);
  const referenciaTexto =
    resultado.referencia.minimoEsperado === null
      ? resultado.referencia.descripcion
      : `Referencia ${resultado.referencia.etiqueta}: ${resultado.referencia.descripcion} Umbral esperado para semáforo verde: ${resultado.referencia.minimoEsperado} s o más.`;
  const detalleMotivoFin = motivoFin
    ? `<p><strong>Motivo de finalización:</strong> ${motivoFin}</p>`
    : "";
  const detalleCompensaciones = interpretaciones.length
    ? `
        <div class="resultado-detalle">
          <p><strong>Detalle observado desde el inicio del cronómetro:</strong></p>
          <ul>
            ${interpretaciones.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      `
    : `
        <p><strong>Detalle observado desde el inicio del cronómetro:</strong> no se detectaron compensaciones relevantes en los segmentos analizados.</p>
      `;
  const notasHtml = notasCompensacion.length
    ? `
        <div class="resultado-detalle">
          <p><strong>Notas clínicas:</strong></p>
          <ul>
            ${notasCompensacion.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
      `
    : "";

  resumenEl.innerHTML = `
    <div class="resultado resultado-${resultado.color}">
      <div class="resultado-badge">${resultado.color.toUpperCase()}</div>
      <div class="resultado-contenido">
        <h2>${resultado.titulo}</h2>
        <p><strong>${nombrePaciente}</strong>${edad !== null ? `, ${edad} años` : ""}</p>
        <p><strong>Tiempo registrado:</strong> ${formatSeconds(tiempoSegundos)}</p>
        ${detalleMotivoFin}
        <p><strong>Interpretación:</strong> ${resultado.detalle}</p>
        ${detalleCompensaciones}
        <p><strong>Referencia por edad:</strong> ${referenciaTexto}</p>
        ${notasHtml}
        <p class="resultado-nota">Nota: el test de apoyo monopedal es una herramienta de tamizaje y no constituye un diagnóstico definitivo. Los resultados deben interpretarse junto con la condición física general, antecedentes y evaluación profesional.</p>
      </div>
    </div>
  `;

  resumenEl.style.display = "block";
  smoothScrollToElement(resumenEl, "start");
  setStatus(`Informe generado: ${resultado.titulo}. Tiempo registrado ${formatSeconds(tiempoSegundos)}.`);
  updateReviewResultButton();

  if (patient) {
    saveCompletedTestRecord({
      id: createId("test"),
      patientId: patient.id,
      patientCode: patient.patientCode || "",
      patientIdentifier: patient.identificador || "",
      patientName: getPatientDisplayName(patient),
      fechaNacimiento: patient.fechaNacimiento,
      edad,
      sexo: patient.sexo || "",
      centro: centroEl?.value?.trim() || "",
      prueba: "monopedia",
      observaciones: observacionesEl?.value?.trim() || "",
      tiempoSegundos,
      resultadoNivel: resultado.nivel,
      resultadoColor: resultado.color,
      resultadoTitulo: resultado.titulo,
      resultadoDetalle: resultado.detalle,
      motivoFin: motivoFin || "",
      timestamp: new Date().toISOString()
    });
  }
}

function renderResultadoSitToStand(patient, patientData, tiempoSegundos, motivoFin = null) {
  if (!resumenEl) return;

  const edad = patientData.edad;
  const nombrePaciente = patientData.nombre || getPatientDisplayName(patient);
  const resultado = clasificarRiesgoSitToStand(tiempoSegundos, edad);
  const referenciaTexto =
    resultado.referencia.umbralNormal === null
      ? resultado.referencia.descripcion
      : `Referencia ${resultado.referencia.etiqueta}: ${resultado.referencia.descripcion} Umbral esperado: hasta ${resultado.referencia.umbralNormal} s.`;
  const repeticiones = analisisSitToStand?.repeticionesCompletadas ?? SIT_TO_STAND_REPETICIONES_OBJETIVO;
  const detalleMotivoFin = motivoFin
    ? `<p><strong>Motivo de finalización:</strong> ${motivoFin}</p>`
    : "";

  resumenEl.innerHTML = `
    <div class="resultado resultado-${resultado.color}">
      <div class="resultado-badge">${resultado.color.toUpperCase()}</div>
      <div class="resultado-contenido">
        <h2>${resultado.titulo}</h2>
        <p><strong>${nombrePaciente}</strong>${edad !== null ? `, ${edad} años` : ""}</p>
        <p><strong>Tiempo registrado:</strong> ${formatSeconds(tiempoSegundos)}</p>
        <p><strong>Repeticiones detectadas:</strong> ${repeticiones}/${SIT_TO_STAND_REPETICIONES_OBJETIVO}</p>
        ${detalleMotivoFin}
        <p><strong>Interpretación:</strong> ${resultado.detalle}</p>
        <div class="resultado-detalle">
          <p><strong>Protocolo usado en esta versión básica:</strong></p>
          <ul>
            <li>Silla sin brazos de aproximadamente 45 cm.</li>
            <li>Inicio en posición sentada con brazos cruzados sobre el pecho.</li>
            <li>Se contabilizan 5 puestas de pie completas, con retorno a sedestación entre repeticiones.</li>
          </ul>
        </div>
        <p><strong>Referencia por edad:</strong> ${referenciaTexto}</p>
        <p class="resultado-nota">Nota: esta implementación es una versión básica con heurística de pose en cámara. Sirve como tamizaje funcional inicial y debe interpretarse junto con la observación clínica y la calidad del encuadre.</p>
      </div>
    </div>
  `;

  resumenEl.style.display = "block";
  smoothScrollToElement(resumenEl, "start");
  setStatus(`Informe generado: ${resultado.titulo}. Tiempo registrado ${formatSeconds(tiempoSegundos)}.`);
  updateReviewResultButton();

  if (patient) {
    saveCompletedTestRecord({
      id: createId("test"),
      patientId: patient.id,
      patientCode: patient.patientCode || "",
      patientIdentifier: patient.identificador || "",
      patientName: getPatientDisplayName(patient),
      fechaNacimiento: patient.fechaNacimiento,
      edad,
      sexo: patient.sexo || "",
      centro: centroEl?.value?.trim() || "",
      prueba: "sit_to_stand",
      observaciones: observacionesEl?.value?.trim() || "",
      tiempoSegundos,
      resultadoNivel: resultado.nivel,
      resultadoColor: resultado.color,
      resultadoTitulo: resultado.titulo,
      resultadoDetalle: resultado.detalle,
      motivoFin: motivoFin || "",
      timestamp: new Date().toISOString()
    });
  }
}

function renderResultadoFinal(tiempoSegundos, motivoFin = null, prueba = getPruebaActual()) {
  if (!resumenEl) return;

  const validation = validatePatientData({ allowPending: true });
  const patientData = validation.ok ? validation.patient : getPatientPayloadFromForm();
  const patient = validation.ok ? upsertPatient(patientData) : null;

  if (prueba === "sit_to_stand") {
    renderResultadoSitToStand(patient, patientData, tiempoSegundos, motivoFin);
    return;
  }

  renderResultadoMonopedia(patient, patientData, tiempoSegundos, motivoFin);
}

function renderResultadoVideoCaida() {
  if (!resumenEl || !analisisVideoCaida) return;

  const technicalMode = isTechnicalVideoAnalysisMode();
  const ukemiMode = isUkemiVideoMode();
  const detected = analisisVideoCaida.fallDetectedAt !== null;
  const completed = analisisVideoCaida.analysisCompleted;
  const color = ukemiMode
    ? "amarillo"
    : technicalMode ? (detected ? "amarillo" : "verde") : (detected ? "rojo" : "verde");
  const titulo = ukemiMode
    ? detected
      ? completed
        ? "Análisis básico de ukemi con momento destacado"
        : "Análisis básico de ukemi en revisión"
      : completed
        ? "Análisis básico de ukemi completado"
        : "Analizando ukemi"
    : technicalMode
    ? detected
      ? completed
        ? "Análisis técnico con momento destacado"
        : "Análisis técnico en revisión"
      : completed
        ? "Análisis técnico completado"
        : "Analizando movimiento"
    : detected
      ? completed
        ? "Posible caída detectada"
        : "Posible caída en revisión"
      : completed
        ? "No se detectó una caída clara"
        : "Analizando video";
  const reasons = analisisVideoCaida.fallReasons.length
    ? analisisVideoCaida.fallReasons
    : ["No se combinaron suficientes señales fuertes de descenso, postura baja y tronco horizontal."];
  const contextNotes = getVideoContextNotes();
  const velocidad = analisisVideoCaida.maxHipDropSpeed.toFixed(3);
  const descensoMaximo = analisisVideoCaida.maxHipDropFromBaseline.toFixed(3);
  const lateralMaximo = analisisVideoCaida.maxHipLateralShift.toFixed(3);
  const anguloActual = analisisVideoCaida.lastTrunkAngle.toFixed(1);
  const rotacionMaxima = analisisVideoCaida.maxTrunkAngleDelta.toFixed(1);
  const anguloDeteccion = analisisVideoCaida.detectionTrunkAngle !== null
    ? analisisVideoCaida.detectionTrunkAngle.toFixed(1)
    : null;
  const descensoDeteccion = analisisVideoCaida.detectionHipDrop !== null
    ? analisisVideoCaida.detectionHipDrop.toFixed(3)
    : null;
  const lateralDeteccion = analisisVideoCaida.detectionLateralShift.toFixed(3);
  const headOffset = analisisVideoCaida.lastHeadOffsetX.toFixed(3);
  const headAlignmentLabel = getHeadAlignmentLabel(analisisVideoCaida.lastHeadOffsetX);
  const inicioRevision = detected
    ? Math.max(0, analisisVideoCaida.fallDetectedAt - 0.8)
    : null;
  const finRevision = detected ? analisisVideoCaida.fallDetectedAt + 0.4 : null;
  const rotacionLabel = getVideoRotationLabel(analisisVideoCaida.maxTrunkAngleDelta);
  const lateralLabel = getVideoLateralShiftLabel(analisisVideoCaida.maxHipLateralShift);
  const detailsHtml = ukemiMode
    ? `
        <p><strong>Modo:</strong> análisis básico de ukemi sobre el protagonista visible.</p>
        <p><strong>Rol elegido:</strong> ${getVideoSubjectRoleLabel()}.</p>
        <p><strong>Persona activa:</strong> ${getVideoPersonSelectionLabel()}.</p>
        <p><strong>Dirección esperada:</strong> ${getVideoExpectedDirectionLabel()}.</p>
        <p><strong>Descenso máximo respecto de la base:</strong> ${descensoMaximo}</p>
        <p><strong>Desvío lateral máximo:</strong> ${lateralMaximo} (${lateralLabel})</p>
        <p><strong>Cambio máximo del eje corporal:</strong> ${rotacionMaxima}° (${rotacionLabel})</p>
        <p><strong>Posición relativa de la cabeza:</strong> ${headAlignmentLabel} (${headOffset})</p>
        ${detected
          ? `
            <p><strong>Momento destacado para revisión:</strong> ${formatSeconds(analisisVideoCaida.fallDetectedAt)}</p>
            <p><strong>Ventana sugerida:</strong> ${formatSeconds(inicioRevision)} a ${formatSeconds(finRevision)}</p>
          `
          : completed
            ? `<p><strong>Resultado:</strong> no apareció un único pico dominante; conviene usar el cuadro a cuadro y las guías de vector para revisar la técnica.</p>`
            : `<p><strong>Estado:</strong> el video sigue en análisis.</p>`}
      `
    : technicalMode
    ? `
        <p><strong>Modo:</strong> análisis técnico de movimiento.</p>
        <p><strong>Contexto cargado:</strong> ${getVideoExpectedDirectionLabel()}.</p>
        <p><strong>Velocidad máxima de descenso de pelvis:</strong> ${velocidad}</p>
        <p><strong>Descenso máximo de pelvis respecto de la base:</strong> ${descensoMaximo}</p>
        <p><strong>Desvío lateral máximo:</strong> ${lateralMaximo} (${lateralLabel})</p>
        <p><strong>Cambio máximo de orientación del tronco:</strong> ${rotacionMaxima}° (${rotacionLabel})</p>
        <p><strong>Ángulo de tronco más reciente:</strong> ${anguloActual}°</p>
        ${detected
          ? `
            <p><strong>Momento destacado para revisión:</strong> ${formatSeconds(analisisVideoCaida.fallDetectedAt)}</p>
            <p><strong>Métricas en ese instante:</strong> descenso ${descensoDeteccion}, desvío lateral ${lateralDeteccion}, tronco ${anguloDeteccion}°, postura baja ${analisisVideoCaida.detectionLowPostureFrames} cuadros.</p>
            <p><strong>Ventana sugerida para revisión:</strong> ${formatSeconds(inicioRevision)} a ${formatSeconds(finRevision)}</p>
          `
          : completed
            ? `<p><strong>Resultado:</strong> no apareció un pico tan claro como para marcar un único momento dominante; conviene revisar el video completo con cuadro a cuadro.</p>`
            : `<p><strong>Estado:</strong> el movimiento sigue en análisis.</p>`}
      `
    : `
        <p><strong>Modo:</strong> análisis beta de video cargado manualmente.</p>
        <p><strong>Velocidad máxima de descenso de pelvis:</strong> ${velocidad}</p>
        <p><strong>Descenso máximo de pelvis respecto de la base:</strong> ${descensoMaximo}</p>
        <p><strong>Ángulo de tronco más reciente:</strong> ${anguloActual}°</p>
        <p><strong>Patrón compatible con caída hacia atrás en sedestación:</strong> ${analisisVideoCaida.seatedBackwardPattern ? "sí" : "no"}</p>
        <p><strong>Puntaje del mejor candidato:</strong> ${analisisVideoCaida.bestFallScore.toFixed(2)}</p>
        ${detected
          ? `
            <p><strong>${completed ? "Mejor instante compatible" : "Mejor candidato hasta ahora"}:</strong> ${formatSeconds(analisisVideoCaida.fallDetectedAt)}</p>
            <p><strong>Estado del análisis:</strong> ${completed ? "video completo analizado" : "el video sigue corriendo; esta marca puede mejorar."}</p>
            <p><strong>Métricas al detectar:</strong> descenso ${descensoDeteccion}, desvío lateral ${lateralDeteccion}, tronco ${anguloDeteccion}°, postura baja ${analisisVideoCaida.detectionLowPostureFrames} cuadros, horizontalidad ${analisisVideoCaida.detectionHorizontalFrames} cuadros, pérdida de tracking ${analisisVideoCaida.lostTrackingFrames} cuadros.</p>
            <p><strong>Ventana sugerida para revisión:</strong> ${formatSeconds(inicioRevision)} a ${formatSeconds(finRevision)}</p>
          `
          : completed
            ? `<p><strong>Resultado:</strong> no apareció un patrón sostenido compatible con caída según la heurística actual.</p>
               <p><strong>Lectura útil:</strong> aunque no disparó la alerta, podés revisar si hubo giro brusco del tronco o pérdida breve del sujeto por oclusión.</p>`
            : `<p><strong>Estado:</strong> todavía no hay una conclusión final porque el video sigue en análisis.</p>`}
      `;

  resumenEl.innerHTML = `
    <div class="resultado resultado-${color}">
      <div class="resultado-badge">${ukemiMode ? "UKEMI" : technicalMode ? "ANÁLISIS" : detected ? "ALERTA" : "OK"}</div>
      <div class="resultado-contenido">
        <h2>${titulo}</h2>
        ${detailsHtml}
        ${contextNotes.length
          ? `
            <div class="resultado-detalle">
              <p><strong>Contexto aportado por el usuario:</strong></p>
              <ul>
                ${contextNotes.map((item) => `<li>${item}</li>`).join("")}
              </ul>
            </div>
          `
          : ""}
        <div class="resultado-detalle">
          <p><strong>${usesDescriptiveVideoMode() ? "Señales útiles para revisión:" : "Señales observadas:"}</strong></p>
          <ul>
            ${reasons.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </div>
        <p class="resultado-nota">${ukemiMode
          ? `Nota: este modo de ukemi usa la persona activa seleccionada como foco principal. Si hay dos practicantes, podés elegir Persona A o Persona B para marcar el enfoque de revisión.`
          : technicalMode
          ? "Nota: este modo usa el mismo pose tracking para resumir el movimiento, pero no clasifica aprobación técnica ni interpreta el evento como caída clínica."
          : "Nota: este módulo es exploratorio. Sirve para revisar un video con pose tracking y una heurística inicial, pero no valida por sí solo una caída real ni reemplaza evaluación profesional."}</p>
      </div>
    </div>
  `;

  resumenEl.style.display = "block";
  updateFallAlertChip();
  updateReplayEventButton();
}

// ---------- Utilidades ----------
function setStatus(texto) {
  if (statusEl) statusEl.textContent = texto;
}

function getResultadoSegunPrueba(prueba, tiempoSegundos, edad) {
  return prueba === "sit_to_stand"
    ? clasificarRiesgoSitToStand(tiempoSegundos, edad)
    : clasificarRiesgoMonopedia(tiempoSegundos, edad);
}

function escapeHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (char) => {
    const mapa = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    };
    return mapa[char] || char;
  });
}

function isAppleMobile() {
  const agent = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(agent);
}

function isDesktopComputer() {
  const agent = navigator.userAgent || "";
  return !/Android|iPhone|iPad|iPod|Mobile/i.test(agent);
}

function isSecureCameraContext() {
  return window.isSecureContext || location.hostname === "localhost" || location.hostname === "127.0.0.1";
}

function updateCameraHelp() {
  if (!cameraHelpEl) return;

  const currentUrl = window.location.href;
  const secure = isSecureCameraContext();
  const appleMobile = isAppleMobile();
  const desktopComputer = isDesktopComputer();
  const framingMode = framingModeEl?.value || "standard";
  const cameraSuggestion =
    cameraModeEl?.value === "environment" || (cameraModeEl?.value === "auto" && appleMobile)
      ? "La trasera queda priorizada para trabajo de campo."
      : "Podés pasar a la trasera si necesitás más cuerpo en cuadro.";
  const framingAdvice =
    framingMode === "close_room"
      ? "<strong>Consultorio:</strong> optimiza distancia corta, hasta 2 m."
      : "<strong>Encuadre estándar:</strong> pensado para una distancia más amplia.";

  let message = `
    <strong>iPhone:</strong> abrí esta app en Safari, permití cámara y usá <strong>Trasera</strong>. ${cameraSuggestion}
  `;

  if (currentUrl.startsWith("http")) {
    message += ` URL actual: <a href="${escapeHtml(currentUrl)}">${escapeHtml(currentUrl)}</a>.`;
  }

  if (!secure) {
    message +=
      " Para habilitar cámara en iPhone, usá HTTPS o localhost.";
  }

  message += ` ${framingAdvice}`;

  if (desktopComputer) {
    message +=
      " <strong>Computadora:</strong> si a 2 metros entra medio cuerpo, el límite suele ser la webcam.";
  }

  message += renderMode === "privacy"
    ? ' <span class="privacy-note"><strong>Privacidad activa:</strong> en pantalla se muestran solo vectores sobre fondo oscuro.</span>'
    : ' <span class="privacy-note"><strong>Modo cámara:</strong> se muestra la imagen con vectores.</span>';

  cameraHelpEl.innerHTML = message;
}

function updateVideoHelp(message = null) {
  if (!videoHelpEl) return;

  if (message) {
    videoHelpEl.textContent = message;
    return;
  }

  if (sourceMode === "file") {
    videoHelpEl.textContent = isUkemiVideoMode()
      ? `Video cargado${uploadedVideoName ? `: ${uploadedVideoName}` : ""}. Modo Ukemi: elegí la persona activa (${getVideoPersonSelectionLabel()}) si hay dos practicantes, revisá cuadro a cuadro y usá los vectores, eje, CG aproximado y cabeza como guía básica.`
      : isTechnicalVideoAnalysisMode()
      ? `Video cargado${uploadedVideoName ? `: ${uploadedVideoName}` : ""}. Elegí el contexto y usá 'Aplicar análisis' para revisar el movimiento sin clasificarlo como caída.`
      : `Video cargado${uploadedVideoName ? `: ${uploadedVideoName}` : ""}. Usá 'Aplicar análisis' para correr la detección de caída con el modo seleccionado.`;
    return;
  }

  videoHelpEl.textContent =
    "Beta: cargá un video local para revisar una posible caída, hacer análisis técnico o una lectura básica de ukemi.";
}

function syncSourceModeUi() {
  document.body.classList.toggle("file-source", sourceMode === "file");
}

function syncSidebarButtonLabel() {
  if (!toggleSidebarButton) return;

  toggleSidebarButton.textContent = document.body.classList.contains("sidebar-collapsed")
    ? (isCompactViewport() ? "Mostrar ficha paciente" : "Mostrar panel lateral")
    : (isCompactViewport() ? "Ocultar ficha paciente" : "Ocultar panel lateral");
}

function isCompactViewport() {
  return window.matchMedia?.("(max-width: 760px)")?.matches || false;
}

function setSidebarCollapsed(collapsed, persist = true) {
  document.body.classList.toggle("sidebar-collapsed", collapsed);
  if (persist) {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? "true" : "false");
  }
  syncSidebarButtonLabel();
}

function applySidebarPreference() {
  const stored = localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY);
  const collapsed = stored === null ? false : stored === "true";
  setSidebarCollapsed(collapsed, false);
}

function collapseSidebarForMobileWork() {
  if (!isCompactViewport()) return;
  if (document.body.classList.contains("sidebar-collapsed")) return;
  setSidebarCollapsed(true, false);
}

function syncRenderModeControl() {
  if (renderModeEl) {
    renderModeEl.value = renderMode;
  }
}

function loadRenderModePreference() {
  const storedMode = localStorage.getItem(RENDER_MODE_STORAGE_KEY);
  renderMode = storedMode === "camera" ? "camera" : "privacy";
  syncRenderModeControl();
}

function saveRenderModePreference() {
  localStorage.setItem(RENDER_MODE_STORAGE_KEY, renderMode);
}

function getPreferredFacingMode() {
  const selectedMode = cameraModeEl?.value || "auto";

  if (selectedMode === "auto") {
    return isAppleMobile() ? "environment" : "user";
  }

  return selectedMode;
}

function getSelectedDeviceId() {
  return cameraDeviceEl?.value || "";
}

function getFramingMode() {
  return framingModeEl?.value === "close_room" ? "close_room" : "standard";
}

function rankVideoDevice(device, preferredFacingMode) {
  const label = normalizeText(device.label || "");
  let score = 0;

  if (!label) return score;

  if (preferredFacingMode === "environment") {
    if (/ultra\s*wide|ultrawide|super\s*wide|0\.5x|0,5x|wide angle|gran angular/.test(label)) score += 100;
    if (/back|rear|environment|trasera|posterior/.test(label)) score += 30;
    if (/tele|zoom|macro/.test(label)) score -= 60;
    if (/front|frontal|face|user/.test(label)) score -= 120;
  } else if (preferredFacingMode === "user") {
    if (/front|frontal|face|user/.test(label)) score += 100;
    if (/back|rear|environment|trasera|posterior/.test(label)) score -= 60;
  }

  return score;
}

function findRecommendedDeviceId(preferredFacingMode) {
  if (!availableVideoDevices.length) return "";

  const ranked = availableVideoDevices
    .map((device) => ({
      deviceId: device.deviceId,
      score: rankVideoDevice(device, preferredFacingMode)
    }))
    .sort((a, b) => b.score - a.score);

  if (!ranked.length || ranked[0].score <= 0) return "";
  return ranked[0].deviceId;
}

function getEffectiveDeviceId() {
  const selectedDeviceId = getSelectedDeviceId();
  if (selectedDeviceId) return selectedDeviceId;

  const preferredFacingMode = getPreferredFacingMode();
  if (getFramingMode() === "close_room" && preferredFacingMode === "environment") {
    return findRecommendedDeviceId(preferredFacingMode);
  }

  return "";
}

function getVideoConstraints() {
  const deviceId = getEffectiveDeviceId();
  const framingMode = getFramingMode();
  const constraints = {
    width: { ideal: 1280 },
    height: framingMode === "close_room" ? { ideal: 960 } : { ideal: 720 }
  };

  if (framingMode === "close_room") {
    constraints.aspectRatio = { ideal: 4 / 3 };
  } else {
    constraints.aspectRatio = { ideal: 16 / 9 };
  }

  if (deviceId) {
    constraints.deviceId = { exact: deviceId };
  } else {
    constraints.facingMode = { ideal: getPreferredFacingMode() };
  }

  return constraints;
}

async function optimizeActiveVideoTrack(activeStream) {
  const videoTrack = activeStream?.getVideoTracks?.()[0];
  if (!videoTrack?.getCapabilities || !videoTrack?.applyConstraints) return;

  try {
    const capabilities = videoTrack.getCapabilities();
    const advanced = [];

    if (getFramingMode() === "close_room" && capabilities.zoom) {
      advanced.push({ zoom: capabilities.zoom.min });
    }

    if (!advanced.length) return;

    await videoTrack.applyConstraints({ advanced });
  } catch (error) {
    console.warn("No se pudieron aplicar ajustes finos de encuadre", error);
  }
}

function renderCameraDeviceOptions() {
  if (!cameraDeviceEl) return;

  const selectedValue = cameraDeviceEl.value;
  const options = ['<option value="">Predeterminado</option>'];

  availableVideoDevices.forEach((device, index) => {
    const label = device.label || `Cámara ${index + 1}`;
    const selected = device.deviceId === selectedValue ? " selected" : "";
    options.push(
      `<option value="${escapeHtml(device.deviceId)}"${selected}>${escapeHtml(label)}</option>`
    );
  });

  cameraDeviceEl.innerHTML = options.join("");

  if (
    selectedValue &&
    availableVideoDevices.some((device) => device.deviceId === selectedValue)
  ) {
    cameraDeviceEl.value = selectedValue;
  }
}

async function refreshCameraDevices() {
  if (!navigator.mediaDevices?.enumerateDevices) return;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    availableVideoDevices = devices.filter((device) => device.kind === "videoinput");
    renderCameraDeviceOptions();
  } catch (error) {
    console.error("No se pudieron enumerar las cámaras", error);
  }
}

function loadFramingModePreference() {
  const storedMode = localStorage.getItem(FRAMING_MODE_STORAGE_KEY);
  const framingMode = storedMode === "close_room" ? "close_room" : "standard";
  if (framingModeEl) {
    framingModeEl.value = framingMode;
  }
}

function saveFramingModePreference() {
  if (!framingModeEl) return;
  localStorage.setItem(FRAMING_MODE_STORAGE_KEY, getFramingMode());
}

async function restartCameraWithCurrentSelection() {
  if (!cameraRunning || sourceMode !== "camera") return;
  stopCamera({ keepStatus: true });
  await startCamera();
}

function formatSeconds(segundos) {
  return Number(segundos).toFixed(1) + " s";
}

function calcularAnguloArticular(puntoA, puntoB, puntoC) {
  if (!puntoA || !puntoB || !puntoC) return null;

  const vectorBAx = puntoA.x - puntoB.x;
  const vectorBAy = puntoA.y - puntoB.y;
  const vectorBCx = puntoC.x - puntoB.x;
  const vectorBCy = puntoC.y - puntoB.y;
  const magnitudBA = Math.hypot(vectorBAx, vectorBAy);
  const magnitudBC = Math.hypot(vectorBCx, vectorBCy);

  if (!magnitudBA || !magnitudBC) return null;

  const coseno = ((vectorBAx * vectorBCx) + (vectorBAy * vectorBCy)) / (magnitudBA * magnitudBC);
  const valorSeguro = Math.min(1, Math.max(-1, coseno));
  return Math.acos(valorSeguro) * (180 / Math.PI);
}

function getSitToStandPoseState(landmarks) {
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];
  const puntosCriticos = [
    leftShoulder,
    rightShoulder,
    leftHip,
    rightHip,
    leftKnee,
    rightKnee
  ];

  if (
    puntosCriticos.some(
      (landmark) => !landmark || (landmark.visibility ?? 1) < VISIBILIDAD_MINIMA
    )
  ) {
    return { state: "desconocido" };
  }

  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipMidX = (leftHip.x + rightHip.x) / 2;
  const hipMidY = (leftHip.y + rightHip.y) / 2;
  const kneeMidY = (leftKnee.y + rightKnee.y) / 2;
  const bodyHeight = kneeMidY - shoulderMidY;
  const inclinacionTronco =
    Math.abs(Math.atan2(shoulderMidX - hipMidX, hipMidY - shoulderMidY)) * (180 / Math.PI);
  const deltaCaderaRodilla = hipMidY - kneeMidY;
  const shoulderToHip = hipMidY - shoulderMidY;

  const sentado =
    deltaCaderaRodilla >= -0.04 &&
    deltaCaderaRodilla <= SIT_TO_STAND_CADERA_CERCA_RODILLA_MAX &&
    inclinacionTronco <= SIT_TO_STAND_TRONCO_MAXIMO + 10;

  const parado =
    deltaCaderaRodilla <= -SIT_TO_STAND_CADERA_SOBRE_RODILLA_MIN &&
    shoulderToHip > 0.12 &&
    inclinacionTronco <= SIT_TO_STAND_TRONCO_MAXIMO;

  return {
    state: parado ? "parado" : sentado ? "sentado" : "transicion",
    inclinacionTronco,
    deltaCaderaRodilla,
    shoulderToHip,
    centerX: hipMidX,
    bodyHeight,
    hipMidY,
    shoulderMidY
  };
}

function isValidSitToStandCandidate(postura) {
  return (
    postura.centerX >= SIT_TO_STAND_CENTRO_MIN &&
    postura.centerX <= SIT_TO_STAND_CENTRO_MAX &&
    postura.bodyHeight >= SIT_TO_STAND_ALTURA_MINIMA
  );
}

function isLockedSitToStandTarget(postura) {
  if (!analisisSitToStand?.targetLocked) return true;

  const centerMatches =
    Math.abs(postura.centerX - analisisSitToStand.targetCenterX) <= SIT_TO_STAND_TOLERANCIA_CENTRO;
  const minimumHeight = analisisSitToStand.targetBodyHeight * SIT_TO_STAND_TOLERANCIA_ALTURA;
  const heightMatches = postura.bodyHeight >= minimumHeight;
  return centerMatches && heightMatches;
}

function drawSitToStandOverlay(landmarks) {
  if (getPruebaActual() !== "sit_to_stand" || sourceMode !== "camera" || !analisisSitToStand) return;

  const rightShoulder = landmarks?.[12];
  const rightHip = landmarks?.[24];
  const rightAnkle = landmarks?.[28];
  const leftShoulder = landmarks?.[11];
  const visiblePoints = [rightShoulder, rightHip, rightAnkle, leftShoulder].filter(Boolean);
  if (!visiblePoints.length) return;

  const xBase = Math.min(
    canvasElement.width - 190,
    Math.max(...visiblePoints.map((point) => point.x * canvasElement.width)) + 28
  );
  const yBase = Math.max(
    90,
    Math.min(...visiblePoints.map((point) => point.y * canvasElement.height)) + 10
  );
  const boxWidth = 220;
  const boxHeight = 138;
  const estadoTexto =
    analisisSitToStand.estadoActual === "parado"
      ? "PARADO"
      : analisisSitToStand.estadoActual === "sentado"
        ? "SENTADO"
        : analisisSitToStand.estadoActual === "transicion"
          ? "MOVIMIENTO"
          : "BUSCANDO";

  canvasCtx.save();
  canvasCtx.fillStyle = "rgba(18, 92, 63, 0.88)";
  canvasCtx.strokeStyle = "#4ef0b7";
  canvasCtx.lineWidth = 2;
  if (typeof canvasCtx.roundRect === "function") {
    canvasCtx.beginPath();
    canvasCtx.roundRect(xBase, yBase, boxWidth, boxHeight, 14);
    canvasCtx.fill();
    canvasCtx.stroke();
  } else {
    canvasCtx.fillRect(xBase, yBase, boxWidth, boxHeight);
    canvasCtx.strokeRect(xBase, yBase, boxWidth, boxHeight);
  }

  canvasCtx.fillStyle = "#f8fafc";
  canvasCtx.textAlign = "left";
  canvasCtx.textBaseline = "top";
  canvasCtx.font = "bold 22px Arial";
  canvasCtx.fillText("Sit to Stand", xBase + 12, yBase + 10);
  canvasCtx.font = "bold 46px Arial";
  canvasCtx.fillStyle = "#7dffae";
  canvasCtx.fillText(
    `${analisisSitToStand.repeticionesCompletadas}/${SIT_TO_STAND_REPETICIONES_OBJETIVO}`,
    xBase + 12,
    yBase + 42
  );
  canvasCtx.font = "bold 20px Arial";
  canvasCtx.fillStyle = "#d9fff0";
  canvasCtx.fillText(`Estado: ${estadoTexto}`, xBase + 12, yBase + 96);
  canvasCtx.restore();
}

function smoothScrollToElement(element, block = "start") {
  if (!element?.scrollIntoView) return;

  window.requestAnimationFrame(() => {
    element.scrollIntoView({ behavior: "smooth", block });
  });
}

function renderStandbyScreen(message = "Encendé la cámara para iniciar un nuevo test.") {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.fillStyle = "#000";
  canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.fillStyle = "#fff";
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "middle";
  canvasCtx.font = "bold 28px Arial";
  canvasCtx.fillText(message, canvasElement.width / 2, canvasElement.height / 2);
}

function drawPrivacyBackground() {
  canvasCtx.fillStyle = "#050505";
  canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
}

function drawPoseOverlay(landmarks) {
  drawConnectors(canvasCtx, landmarks, POSE_CONNECTIONS, {
    color: "#4ef0b7",
    lineWidth: 4
  });

  drawLandmarks(canvasCtx, landmarks, {
    color: "#f8fafc",
    lineWidth: 2,
    radius: 5
  });
}

function getLandmarkVisibility(landmark) {
  return landmark ? (landmark.visibility ?? 1) : 0;
}

function getFramingGuidance(landmarks) {
  if (!Array.isArray(landmarks) || !landmarks.length) {
    return {
      severity: "warn",
      messages: ["No se detecta el cuerpo completo todavía."]
    };
  }

  const nose = landmarks[0];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftFoot = landmarks[31];
  const rightFoot = landmarks[32];
  const messages = [];
  const pruebaActual = getPruebaActual();

  const headMissing =
    getLandmarkVisibility(nose) < VISIBILIDAD_MINIMA || (nose && nose.y < 0.03);

  const tobillosVisibles =
    getLandmarkVisibility(leftAnkle) >= VISIBILIDAD_MINIMA ||
    getLandmarkVisibility(rightAnkle) >= VISIBILIDAD_MINIMA;
  const piesVisibles =
    getLandmarkVisibility(leftFoot) >= VISIBILIDAD_MINIMA ||
    getLandmarkVisibility(rightFoot) >= VISIBILIDAD_MINIMA;
  const piesMuyAbajo =
    [leftFoot, rightFoot, leftAnkle, rightAnkle]
      .filter(Boolean)
      .every((landmark) => landmark.y > 0.985);
  const feetMissing = (!tobillosVisibles && !piesVisibles) || piesMuyAbajo;

  const leftHandMissing =
    getLandmarkVisibility(leftWrist) < VISIBILIDAD_MINIMA || (leftWrist && leftWrist.x < 0.02);
  const rightHandMissing =
    getLandmarkVisibility(rightWrist) < VISIBILIDAD_MINIMA || (rightWrist && rightWrist.x > 0.98);

  if (headMissing) messages.push("Falta cabeza");
  if (pruebaActual !== "sit_to_stand" && feetMissing) messages.push("Faltan pies");
  if (pruebaActual !== "sit_to_stand") {
    if (leftHandMissing && rightHandMissing) {
      messages.push("Faltan manos");
    } else if (leftHandMissing) {
      messages.push("Falta mano izquierda");
    } else if (rightHandMissing) {
      messages.push("Falta mano derecha");
    }
  }

  if (!messages.length) {
    return {
      severity: "ok",
      messages: ["Encuadre completo"]
    };
  }

  return {
    severity: "warn",
    messages
  };
}

function drawFramingGuidance(landmarks) {
  const guidance = getFramingGuidance(landmarks);
  const boxWidth = Math.min(canvasElement.width - 32, 520);
  const boxHeight = 54;
  const x = 16;
  const y = 16;

  canvasCtx.save();
  canvasCtx.fillStyle = guidance.severity === "ok" ? "rgba(18, 92, 63, 0.88)" : "rgba(122, 67, 20, 0.9)";
  canvasCtx.strokeStyle = guidance.severity === "ok" ? "#4ef0b7" : "#f7b267";
  canvasCtx.lineWidth = 2;
  if (typeof canvasCtx.roundRect === "function") {
    canvasCtx.beginPath();
    canvasCtx.roundRect(x, y, boxWidth, boxHeight, 12);
    canvasCtx.fill();
    canvasCtx.stroke();
  } else {
    canvasCtx.fillRect(x, y, boxWidth, boxHeight);
    canvasCtx.strokeRect(x, y, boxWidth, boxHeight);
  }

  canvasCtx.fillStyle = "#f8fafc";
  canvasCtx.textAlign = "left";
  canvasCtx.textBaseline = "middle";
  canvasCtx.font = "bold 24px Arial";
  canvasCtx.fillText(guidance.messages.join(" | "), x + 16, y + boxHeight / 2);
  canvasCtx.restore();
}

function renderPoseFrame(results) {
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  if (renderMode === "camera") {
    canvasCtx.drawImage(results.image, 0, 0);
  } else {
    drawPrivacyBackground();
  }

  if (results.poseLandmarks) {
    drawPoseOverlay(results.poseLandmarks);
    if (sourceMode === "file" && isUkemiVideoMode()) {
      renderUkemiOverlay(results.poseLandmarks);
    }
    if (sourceMode === "camera") {
      drawFramingGuidance(results.poseLandmarks);
    }
  }
}

function syncTestActionButtons() {
  if (startTestButton) {
    if (testRunning) {
      startTestButton.textContent = "Test en curso";
    } else if (startReady) {
      startTestButton.textContent = "Listo";
    } else if (esperandoInicio && !startReady) {
      startTestButton.textContent = "Preparando...";
    } else {
      startTestButton.textContent = "Preparar test";
    }
  }

  if (nuevoTestButton) {
    nuevoTestButton.textContent = cameraRunning
      ? "Reiniciar"
      : "Nuevo test";
  }
}

function updateControls() {
  const patientReady = validatePatientData({ allowPending: true }).ok;
  const cameraModeActive = cameraRunning && sourceMode === "camera";
  startTestButton.disabled = !cameraModeActive || !patientReady;
  nuevoTestButton.disabled = !cameraModeActive || !patientReady;
  stopTestButton.disabled = !cameraModeActive || !testRunning;
  if (savePatientButton) {
    savePatientButton.disabled = !validatePatientData().ok;
  }
  if (savePendingPatientButton) {
    savePendingPatientButton.disabled = !Boolean(centroEl?.value?.trim());
  }
  updateApplyVideoModeButton();
  syncTestActionButtons();
  renderTestPhaseHelp();
}

function renderTestPhaseHelp() {
  if (!testPhaseHelpEl) return;

  const patientReady = validatePatientData({ allowPending: true }).ok;
  const pruebaActual = getPruebaActual();
  const hiddenPatientHint =
    isCompactViewport() && document.body.classList.contains("sidebar-collapsed")
      ? " Use 'Mostrar ficha paciente' arriba para cargar o editar datos personales."
      : "";

  if (!cameraRunning || sourceMode !== "camera") {
    testPhaseHelpEl.textContent = `Encienda la camara para preparar la prueba.${hiddenPatientHint}`;
    return;
  }

  if (!patientReady) {
    testPhaseHelpEl.textContent = `Complete paciente y fecha de nacimiento, o asigne un ID pendiente para trabajo de campo.${hiddenPatientHint}`;
    return;
  }

  if (testRunning) {
    testPhaseHelpEl.textContent =
      pruebaActual === "sit_to_stand"
        ? `Test en curso. Mantenga al paciente centrado.${hiddenPatientHint}`
        : `Test en curso. Sostenga la posicion hasta el cierre.${hiddenPatientHint}`;
    return;
  }

  if (esperandoInicio && startReady) {
    testPhaseHelpEl.textContent =
      pruebaActual === "sit_to_stand"
        ? `Listo. Inicie el movimiento.${hiddenPatientHint}`
        : `Listo. Levante un pie.${hiddenPatientHint}`;
    return;
  }

  if (esperandoInicio) {
    testPhaseHelpEl.textContent =
      pruebaActual === "sit_to_stand"
        ? `Preparando. Ubique al paciente sentado y quieto.${hiddenPatientHint}`
        : `Preparando. Mire la camara y quedese quieto.${hiddenPatientHint}`;
    return;
  }

  testPhaseHelpEl.textContent = `Presione Preparar test para comenzar.${hiddenPatientHint}`;
}

// ---------- Timer ----------
function actualizarTimer() {
  if (!testRunning || !testStartTime) return;

  const ahora = Date.now();
  const transcurrido = (ahora - testStartTime) / 1000;
  timerEl.textContent = formatSeconds(transcurrido);
}

// ---------- Reset ----------
function resetTrigger() {
  baselineFootY = null;
  esperandoInicio = false;
  triggerActivo = false;
  pieActivo = null;
  baselineFrames = 0;
  stableStartFrames = 0;
  startReady = false;
  readyCameraCentered = false;
  lastDelta = 0;
  framesElevado = 0;
  framesApoyado = 0;
  framesContactoPiernas = 0;
  instanteInicioApoyo = null;
  instanteInicioContactoPiernas = null;
  analisisMonopedia = crearAnalisisMonopedia();
  analisisSitToStand = crearAnalisisSitToStand();
}

// ---------- Test ----------
function prepararTest() {
  if (!cameraRunning) {
    setStatus("Encendé la cámara primero.");
    return;
  }

  const validation = validatePatientData({ allowPending: true });
  if (!validation.ok) {
    renderPatientHelp(validation.message);
    setStatus(validation.message);
    updateControls();
    return;
  }

  upsertPatient(validation.patient);
  renderPatientHelp();
  renderPatientHistory();

  resetTrigger();
  esperandoInicio = true;
  limpiarResumen();
  syncTestActionButtons();

  timerEl.textContent = "0.0 s";
  if (getPruebaActual() === "tug" || getPruebaActual() === "otros") {
    esperandoInicio = false;
    syncTestActionButtons();
    setStatus(`La prueba ${getNombrePrueba(getPruebaActual())} todavía no tiene una lógica específica implementada.`);
    return;
  }

  if (getPruebaActual() === "sit_to_stand") {
    setStatus(
      "Preparando Sit to Stand. Ubique una silla sin brazos, siéntese con brazos cruzados y espere la detección de posición sentada."
    );
    return;
  }

  setStatus("Preparando...");
  updateControls();
}

function iniciarTest(landmarks) {
  if (testRunning) return;

  const pruebaActual = getPruebaActual();
  clearInterval(timerInterval);

  testRunning = true;
  testStartTime = Date.now();
  if (pruebaActual === "sit_to_stand") {
    analisisSitToStand = analisisSitToStand || crearAnalisisSitToStand();
    analisisSitToStand.fase = "en_curso";
    analisisSitToStand.inicioDetectadoEn = 0;
  } else {
    analisisMonopedia = crearAnalisisMonopedia();
    analisisMonopedia.ladoElevado = pieActivo;

    if (landmarks) {
      const leftShoulder = landmarks[11];
      const rightShoulder = landmarks[12];

      if (leftShoulder && rightShoulder) {
        analisisMonopedia.baselineShoulderWidth = Math.abs(leftShoulder.x - rightShoulder.x);
      }
    }
  }

  timerInterval = setInterval(actualizarTimer, 100);

  setStatus(pruebaActual === "sit_to_stand" ? "Sit to Stand en curso..." : "Test en curso...");
  updateControls();
}

function detenerTest(opciones = {}) {
  if (!testRunning) {
    setStatus("No hay test en curso.");
    return;
  }

  const tiempoFinal =
    typeof opciones.tiempoFinal === "number"
      ? opciones.tiempoFinal
      : testStartTime
        ? (Date.now() - testStartTime) / 1000
        : 0;

  testRunning = false;
  clearInterval(timerInterval);
  timerInterval = null;
  testStartTime = null;

  setStatus("Test finalizado.");
  if (tiempoFinal > 0) {
    timerEl.textContent = formatSeconds(tiempoFinal);
    renderResultadoFinal(tiempoFinal, opciones.motivoFin ?? null, opciones.prueba || getPruebaActual());
    if (sourceMode === "camera" && cameraRunning) {
      stopCamera({ keepStatus: true, preserveSummary: true });
    }
  }
  updateControls();
}

function analizarSitToStand(landmarks) {
  if (!analisisSitToStand) {
    analisisSitToStand = crearAnalisisSitToStand();
  }

  const postura = getSitToStandPoseState(landmarks);
  if (postura.state === "desconocido") {
    setStatus("Ajuste el encuadre para ver hombros, caderas, rodillas y tobillos.");
    return;
  }

  if (!isValidSitToStandCandidate(postura)) {
    analisisSitToStand.framesSentado = 0;
    analisisSitToStand.framesParado = 0;
    setStatus("Centre al paciente sentado en la imagen. El examinador debe quedar fuera o al borde del cuadro.");
    return;
  }

  if (!isLockedSitToStandTarget(postura)) {
    analisisSitToStand.framesSentado = 0;
    analisisSitToStand.framesParado = 0;
    setStatus("Se detectó otra persona o un cambio fuerte de posición. Mantenga al paciente centrado y al examinador fuera del cuadro.");
    return;
  }

  analisisSitToStand.estadoActual = postura.state;
  analisisSitToStand.ultimaPostura = postura;

  if (esperandoInicio && !testRunning) {
    if (postura.state === "sentado") {
      analisisSitToStand.framesSentado += 1;
      analisisSitToStand.targetCenterX =
        analisisSitToStand.targetCenterX === null
          ? postura.centerX
          : analisisSitToStand.targetCenterX * 0.85 + postura.centerX * 0.15;
      analisisSitToStand.targetBodyHeight =
        analisisSitToStand.targetBodyHeight === null
          ? postura.bodyHeight
          : analisisSitToStand.targetBodyHeight * 0.85 + postura.bodyHeight * 0.15;
      analisisSitToStand.baselineHipY =
        analisisSitToStand.baselineHipY === null
          ? postura.hipMidY
          : analisisSitToStand.baselineHipY * 0.85 + postura.hipMidY * 0.15;
      analisisSitToStand.baselineShoulderY =
        analisisSitToStand.baselineShoulderY === null
          ? postura.shoulderMidY
          : analisisSitToStand.baselineShoulderY * 0.85 + postura.shoulderMidY * 0.15;
      if (analisisSitToStand.baselineHipKneeDelta === null) {
        analisisSitToStand.baselineHipKneeDelta = postura.deltaCaderaRodilla;
      } else {
        analisisSitToStand.baselineHipKneeDelta =
          analisisSitToStand.baselineHipKneeDelta * 0.85 + postura.deltaCaderaRodilla * 0.15;
      }
      if (analisisSitToStand.framesSentado < BASELINE_FRAMES_MIN) {
        setStatus(
          `Detectando posición sentada... ${analisisSitToStand.framesSentado}/${BASELINE_FRAMES_MIN}`
        );
        return;
      }

      analisisSitToStand.fase = "listo_para_iniciar";
      analisisSitToStand.targetLocked = true;
      setStatus(
        "Paciente sentado verificado. Mantenga al examinador fuera del cuadro; el cronómetro arrancará al ponerse de pie."
      );
    } else {
      analisisSitToStand.framesSentado = 0;
      setStatus("Espere al paciente sentado y centrado para iniciar. Si el examinador aparece, quede al costado del cuadro.");
    }
  }

  if (esperandoInicio && !testRunning) {
    if (analisisSitToStand.fase !== "listo_para_iniciar") return;

    const ascensoCadera =
      analisisSitToStand.baselineHipY !== null
        ? analisisSitToStand.baselineHipY - postura.hipMidY
        : 0;
    const ascensoHombros =
      analisisSitToStand.baselineShoulderY !== null
        ? analisisSitToStand.baselineShoulderY - postura.shoulderMidY
        : 0;
    const extensionCaderaRodilla =
      analisisSitToStand.baselineHipKneeDelta !== null
        ? analisisSitToStand.baselineHipKneeDelta - postura.deltaCaderaRodilla
        : 0;
    const ascensoDetectado =
      (
        (postura.state === "transicion" || postura.state === "parado") &&
        ascensoCadera > SIT_TO_STAND_ASCENSO_CADERA_MIN &&
        ascensoHombros > SIT_TO_STAND_ASCENSO_HOMBROS_MIN &&
        extensionCaderaRodilla > SIT_TO_STAND_DELTA_CADERA_RODILLA_INICIO
      );

    if (ascensoDetectado) {
      analisisSitToStand.framesParado += 1;
    } else {
      analisisSitToStand.framesParado = 0;
    }

    if (analisisSitToStand.framesParado >= SIT_TO_STAND_FRAMES_ESTABLES) {
      esperandoInicio = false;
      iniciarTest(landmarks);
      analisisSitToStand.repeticionesCompletadas = 1;
      analisisSitToStand.fase = "esperando_sentado";
      analisisSitToStand.framesParado = 0;
      setStatus(`Repetición 1/${SIT_TO_STAND_REPETICIONES_OBJETIVO} completada. Vuelva a sentarse.`);
    }
    return;
  }

  if (!testRunning || !testStartTime) return;

  if (analisisSitToStand.fase === "esperando_sentado") {
    if (postura.state === "sentado") {
      analisisSitToStand.framesSentado += 1;
    } else {
      analisisSitToStand.framesSentado = 0;
    }

    if (analisisSitToStand.framesSentado >= SIT_TO_STAND_FRAMES_ESTABLES) {
      analisisSitToStand.fase = "esperando_parado";
      analisisSitToStand.framesSentado = 0;
      const siguiente = analisisSitToStand.repeticionesCompletadas + 1;
      if (siguiente <= SIT_TO_STAND_REPETICIONES_OBJETIVO) {
        setStatus(`Sentado detectado. Inicie la repetición ${siguiente}/${SIT_TO_STAND_REPETICIONES_OBJETIVO}.`);
      }
    }
    return;
  }

  if (analisisSitToStand.fase !== "esperando_parado") return;

  const ascensoDetectado =
    postura.state === "parado" ||
    (
      postura.state === "transicion" &&
      analisisSitToStand.baselineHipKneeDelta !== null &&
      postura.deltaCaderaRodilla < analisisSitToStand.baselineHipKneeDelta - 0.06
    );

  if (ascensoDetectado) {
    analisisSitToStand.framesParado += 1;
  } else {
    analisisSitToStand.framesParado = 0;
  }

  if (analisisSitToStand.framesParado < SIT_TO_STAND_FRAMES_ESTABLES) return;

  analisisSitToStand.framesParado = 0;
  analisisSitToStand.repeticionesCompletadas += 1;

  if (analisisSitToStand.repeticionesCompletadas >= SIT_TO_STAND_REPETICIONES_OBJETIVO) {
    const tiempoFinal = (Date.now() - testStartTime) / 1000;
    analisisSitToStand.finalizadoEn = tiempoFinal;
    detenerTest({
      tiempoFinal,
      motivoFin: "Se completaron 5 puestas de pie con retorno a la posición sentada entre repeticiones.",
      prueba: "sit_to_stand"
    });
    return;
  }

  analisisSitToStand.fase = "esperando_sentado";
  setStatus(
    `Repetición ${analisisSitToStand.repeticionesCompletadas}/${SIT_TO_STAND_REPETICIONES_OBJETIVO} completada. Vuelva a sentarse.`
  );
}

function analizarEstabilidadMonopedia(landmarks) {
  if (!testRunning || !testStartTime || !analisisMonopedia) return;

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftWrist = landmarks[15];
  const rightWrist = landmarks[16];
  const leftAnkle = landmarks[27];
  const rightAnkle = landmarks[28];
  const leftFoot = landmarks[31];
  const rightFoot = landmarks[32];

  if (
    !leftShoulder ||
    !rightShoulder ||
    !leftHip ||
    !rightHip ||
    !leftWrist ||
    !rightWrist ||
    !leftAnkle ||
    !rightAnkle ||
    !leftFoot ||
    !rightFoot
  ) {
    return;
  }

  const landmarksCriticos = [
    leftShoulder,
    rightShoulder,
    leftHip,
    rightHip,
    leftWrist,
    rightWrist,
    leftAnkle,
    rightAnkle,
    leftFoot,
    rightFoot
  ];

  if (landmarksCriticos.some((landmark) => (landmark.visibility ?? 1) < VISIBILIDAD_MINIMA)) {
    return;
  }

  const tiempoSegundos = (Date.now() - testStartTime) / 1000;
  const shoulderWidth = Math.max(
    analisisMonopedia.baselineShoulderWidth ?? Math.abs(leftShoulder.x - rightShoulder.x),
    0.1
  );
  const apoyoEsIzquierdo = analisisMonopedia.ladoElevado === "right";
  const hipElevada = analisisMonopedia.ladoElevado === "left" ? leftHip : rightHip;
  const hipApoyo = apoyoEsIzquierdo ? leftHip : rightHip;
  const pieElevado = analisisMonopedia.ladoElevado === "left" ? leftFoot : rightFoot;
  const pieApoyo = apoyoEsIzquierdo ? leftFoot : rightFoot;
  const tobilloElevado = analisisMonopedia.ladoElevado === "left" ? leftAnkle : rightAnkle;
  const tobilloApoyo = apoyoEsIzquierdo ? leftAnkle : rightAnkle;

  const pelvisDrop = hipElevada.y - hipApoyo.y;
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const pelvisMidX = (leftHip.x + rightHip.x) / 2;
  const pelvisMidY = (leftHip.y + rightHip.y) / 2;
  const trunkAngle =
    Math.abs(Math.atan2(shoulderMidX - pelvisMidX, pelvisMidY - shoulderMidY)) * (180 / Math.PI);
  const wristSpan = Math.abs(leftWrist.x - rightWrist.x);
  const contactoPiernas = Math.min(
    Math.hypot(tobilloElevado.x - tobilloApoyo.x, tobilloElevado.y - tobilloApoyo.y),
    Math.hypot(pieElevado.x - pieApoyo.x, pieElevado.y - pieApoyo.y)
  );

  if (!analisisMonopedia.piernaSeparadaDetectada && contactoPiernas > UMBRAL_SEPARACION_PIERNAS) {
    analisisMonopedia.piernaSeparadaDetectada = true;
    analisisMonopedia.instantePrimeraSeparacion = tiempoSegundos;
    setStatus("Pierna elevada detectada. Mantenga la posicion.");
  }

  actualizarEventoSostenido(
    "brazosAbiertos",
    wristSpan > shoulderWidth * UMBRAL_BRAZOS_ABIERTOS,
    tiempoSegundos
  );
  actualizarEventoSostenido("caidaPelvis", pelvisDrop > UMBRAL_CAIDA_PELVIS, tiempoSegundos);
  actualizarEventoSostenido(
    "balanceoTronco",
    trunkAngle > 10 || Math.abs(shoulderMidX - pelvisMidX) > UMBRAL_BALANCEO_TRONCO,
    tiempoSegundos
  );

  if (!analisisMonopedia.piernaSeparadaDetectada) {
    framesContactoPiernas = 0;
    instanteInicioContactoPiernas = null;
    return;
  }

  if (contactoPiernas < UMBRAL_CONTACTO_PIERNAS) {
    framesContactoPiernas += 1;
    if (instanteInicioContactoPiernas === null) {
      instanteInicioContactoPiernas = tiempoSegundos;
    }
  } else {
    framesContactoPiernas = 0;
    instanteInicioContactoPiernas = null;
  }

  if (
    framesContactoPiernas >= FRAMES_EVENTO &&
    instanteInicioContactoPiernas !== null &&
    tiempoSegundos >= MIN_TEST_SECONDS
  ) {
    registrarEventoAnalisis("apoyoPierna", instanteInicioContactoPiernas);
    detenerTest({
      tiempoFinal: instanteInicioContactoPiernas,
      motivoFin:
        "La pierna elevada se apoyó sobre la pierna de apoyo para recuperar estabilidad."
    });
  }
}

function analizarVideoCaida(landmarks) {
  if (sourceMode !== "file") return;

  if (!analisisVideoCaida) {
    analisisVideoCaida = crearAnalisisVideoCaida();
  }

  const nose = landmarks[0];
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];

  if (!nose || !leftShoulder || !rightShoulder || !leftHip || !rightHip) {
    analisisVideoCaida.lostTrackingFrames += 1;
    if (
      analisisVideoCaida.strongMotionCandidateAt !== null &&
      analisisVideoCaida.lostTrackingFrames >= FRAMES_PERDIDA_TRACKING
    ) {
      registrarCaidaVideo(
        analisisVideoCaida.strongMotionCandidateAt,
        analisisVideoCaida.detectionHipDrop ?? analisisVideoCaida.maxHipDropFromBaseline,
        analisisVideoCaida.detectionTrunkAngle ?? analisisVideoCaida.lastTrunkAngle,
        [
          `Movimiento brusco previo a la pérdida del sujeto (${analisisVideoCaida.maxHipDropSpeed.toFixed(3)} en velocidad vertical).`,
          `El pose tracking perdió el cuerpo durante ${analisisVideoCaida.lostTrackingFrames} cuadros seguidos tras el evento.`,
          "La pérdida de tracking puede acompañar una caída hacia atrás u oclusión por silla/respaldo."
        ],
        2.2 + analisisVideoCaida.lostTrackingFrames * 0.2
      );
    }
    return;
  }

  const landmarksCriticos = [nose, leftShoulder, rightShoulder, leftHip, rightHip];
  if (landmarksCriticos.some((landmark) => (landmark.visibility ?? 1) < VISIBILIDAD_MINIMA_VIDEO)) {
    analisisVideoCaida.lostTrackingFrames += 1;
    return;
  }
  analisisVideoCaida.lostTrackingFrames = 0;

  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  const hipMidY = (leftHip.y + rightHip.y) / 2;
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const hipMidX = (leftHip.x + rightHip.x) / 2;
  const headOffsetX = nose.x - hipMidX;
  const centerX = (shoulderMidX + hipMidX) / 2;
  const centerY = (shoulderMidY + hipMidY) / 2;
  const trunkAngle =
    Math.abs(Math.atan2(shoulderMidX - hipMidX, hipMidY - shoulderMidY)) * (180 / Math.PI);

  analisisVideoCaida.lastCenterX = centerX;
  analisisVideoCaida.lastCenterY = centerY;
  analisisVideoCaida.lastHeadX = nose.x;
  analisisVideoCaida.lastHeadY = nose.y;
  analisisVideoCaida.lastHipX = hipMidX;
  analisisVideoCaida.lastHipY = hipMidY;
  analisisVideoCaida.lastShoulderX = shoulderMidX;
  analisisVideoCaida.lastShoulderY = shoulderMidY;
  analisisVideoCaida.lastHeadOffsetX = headOffsetX;

  if (analisisVideoCaida.baselineHipY === null) {
    analisisVideoCaida.baselineHipY = hipMidY;
    analisisVideoCaida.baselineHipX = hipMidX;
    analisisVideoCaida.baselineHeadOffsetX = headOffsetX;
    analisisVideoCaida.baselineTrunkAngle = trunkAngle;
    analisisVideoCaida.baselineFrames = 1;
    analisisVideoCaida.previousHipY = hipMidY;
    return;
  }

  if (analisisVideoCaida.baselineFrames < BASELINE_VIDEO_FRAMES_MIN) {
    const hipDropSpeedEarly = hipMidY - (analisisVideoCaida.previousHipY ?? hipMidY);
    const trunkAngleDeltaEarly = Math.abs(trunkAngle - (analisisVideoCaida.baselineTrunkAngle ?? trunkAngle));
    if (
      analisisVideoCaida.baselineFrames >= 2 &&
      hipDropSpeedEarly > UMBRAL_CAIDA_VIDEO_VELOCIDAD_SEDESTACION &&
      trunkAngleDeltaEarly > UMBRAL_CAIDA_VIDEO_CAMBIO_ANGULO_SUAVE
    ) {
      analisisVideoCaida.strongMotionCandidateAt = videoElement.currentTime || 0;
      analisisVideoCaida.detectionHipDrop = hipMidY - analisisVideoCaida.baselineHipY;
      analisisVideoCaida.detectionTrunkAngle = trunkAngle;
    }
    analisisVideoCaida.baselineFrames += 1;
    analisisVideoCaida.baselineHipY = (analisisVideoCaida.baselineHipY * 0.85) + (hipMidY * 0.15);
    analisisVideoCaida.baselineHipX = ((analisisVideoCaida.baselineHipX ?? hipMidX) * 0.85) + (hipMidX * 0.15);
    analisisVideoCaida.baselineHeadOffsetX = ((analisisVideoCaida.baselineHeadOffsetX ?? headOffsetX) * 0.85) + (headOffsetX * 0.15);
    analisisVideoCaida.baselineTrunkAngle =
      ((analisisVideoCaida.baselineTrunkAngle ?? trunkAngle) * 0.85) + (trunkAngle * 0.15);
    analisisVideoCaida.previousHipY = hipMidY;
    return;
  }

  const hipDropFromBaseline = hipMidY - analisisVideoCaida.baselineHipY;
  const hipLateralShift = Math.abs(hipMidX - (analisisVideoCaida.baselineHipX ?? hipMidX));
  const headOffsetFromAxis = Math.abs(headOffsetX - (analisisVideoCaida.baselineHeadOffsetX ?? headOffsetX));
  const hipDropSpeed = hipMidY - (analisisVideoCaida.previousHipY ?? hipMidY);
  const trunkAngleDelta = Math.abs(trunkAngle - (analisisVideoCaida.baselineTrunkAngle ?? trunkAngle));
  analisisVideoCaida.previousHipY = hipMidY;
  analisisVideoCaida.maxHipDropSpeed = Math.max(analisisVideoCaida.maxHipDropSpeed, hipDropSpeed);
  analisisVideoCaida.maxHipDropFromBaseline = Math.max(
    analisisVideoCaida.maxHipDropFromBaseline,
    hipDropFromBaseline
  );
  analisisVideoCaida.maxHipLateralShift = Math.max(
    analisisVideoCaida.maxHipLateralShift,
    hipLateralShift
  );
  analisisVideoCaida.maxTrunkAngleDelta = Math.max(
    analisisVideoCaida.maxTrunkAngleDelta,
    trunkAngleDelta
  );
  analisisVideoCaida.maxHeadOffsetFromAxis = Math.max(
    analisisVideoCaida.maxHeadOffsetFromAxis,
    headOffsetFromAxis
  );
  analisisVideoCaida.lastTrunkAngle = trunkAngle;
  analisisVideoCaida.seatedBackwardPattern =
    hipDropSpeed > UMBRAL_CAIDA_VIDEO_VELOCIDAD_SEDESTACION &&
    trunkAngle > UMBRAL_CAIDA_VIDEO_ANGULO_SEDESTACION &&
    trunkAngleDelta > UMBRAL_CAIDA_VIDEO_CAMBIO_ANGULO;
  const backwardStandingPattern =
    hipDropSpeed > UMBRAL_CAIDA_VIDEO_VELOCIDAD_RETROCESO &&
    trunkAngle > UMBRAL_CAIDA_VIDEO_ANGULO_RETROCESO &&
    trunkAngleDelta > UMBRAL_CAIDA_VIDEO_CAMBIO_ANGULO_RETROCESO;
  const moderateHorizontal = trunkAngle > UMBRAL_CAIDA_VIDEO_HORIZONTAL_MODERADA;
  const moderateLowPosture =
    hipMidY > UMBRAL_CAIDA_VIDEO_POSTURA_BAJA_MODERADA ||
    hipDropFromBaseline > UMBRAL_CAIDA_VIDEO_DESCENSO_MODERADO;
  const strongFallCandidate =
    hipDropSpeed > UMBRAL_CAIDA_VIDEO_VELOCIDAD &&
    hipDropFromBaseline > UMBRAL_CAIDA_VIDEO_DESCENSO_FUERTE &&
    (
      trunkAngle > UMBRAL_CAIDA_VIDEO_HORIZONTAL ||
      trunkAngleDelta > UMBRAL_CAIDA_VIDEO_CAMBIO_ANGULO_MODERADO
    );

  if (
    hipDropSpeed > UMBRAL_CAIDA_VIDEO_VELOCIDAD_SEDESTACION &&
    (trunkAngle > UMBRAL_CAIDA_VIDEO_ANGULO_SEDESTACION ||
      trunkAngleDelta > UMBRAL_CAIDA_VIDEO_CAMBIO_ANGULO)
  ) {
    analisisVideoCaida.strongMotionCandidateAt = videoElement.currentTime || 0;
    analisisVideoCaida.detectionHipDrop = hipDropFromBaseline;
    analisisVideoCaida.detectionTrunkAngle = trunkAngle;
  }

  if (hipMidY > UMBRAL_CAIDA_VIDEO_POSTURA_BAJA || hipDropFromBaseline > UMBRAL_CAIDA_VIDEO_DESCENSO) {
    analisisVideoCaida.lowPostureFrames += 1;
  } else {
    analisisVideoCaida.lowPostureFrames = 0;
  }

  if (trunkAngle > UMBRAL_CAIDA_VIDEO_HORIZONTAL) {
    analisisVideoCaida.horizontalFrames += 1;
  } else {
    analisisVideoCaida.horizontalFrames = 0;
  }

  if (
    hipDropSpeed > UMBRAL_CAIDA_VIDEO_VELOCIDAD &&
    analisisVideoCaida.lowPostureFrames >= 1 &&
    analisisVideoCaida.horizontalFrames >= 1
  ) {
    registrarCaidaVideo(videoElement.currentTime || 0, hipDropFromBaseline, trunkAngle, [
      `Descenso rápido de la pelvis detectado en el video (${hipDropSpeed.toFixed(3)} en coordenadas normalizadas).`,
      `Postura baja sostenida durante ${analisisVideoCaida.lowPostureFrames} cuadros consecutivos.`,
      `Tronco cercano a posición horizontal (${trunkAngle.toFixed(1)}° respecto del eje vertical).`
    ], 3 + analisisVideoCaida.lowPostureFrames * 0.25 + analisisVideoCaida.horizontalFrames * 0.25);
    return;
  }

  if (
    strongFallCandidate &&
    (
      analisisVideoCaida.lowPostureFrames >= 1 ||
      moderateHorizontal ||
      analisisVideoCaida.lostTrackingFrames >= 1
    )
  ) {
    registrarCaidaVideo(videoElement.currentTime || 0, hipDropFromBaseline, trunkAngle, [
      `Descenso y velocidad compatibles con caída franca (${hipDropFromBaseline.toFixed(3)} de descenso, ${hipDropSpeed.toFixed(3)} de velocidad vertical).`,
      `Cambio del tronco respecto de la base (${trunkAngleDelta.toFixed(1)}°), aunque no haya llegado a una horizontalidad completa.`,
      analisisVideoCaida.lostTrackingFrames >= 1
        ? "Hubo pérdida parcial de tracking durante el evento, algo frecuente en caídas reales con oclusión."
        : `La postura quedó comprometida con tronco a ${trunkAngle.toFixed(1)}° respecto del eje vertical.`
    ], 2.9 + (trunkAngleDelta / 24) + analisisVideoCaida.lowPostureFrames * 0.15);
    return;
  }

  if (
    hipDropSpeed > UMBRAL_CAIDA_VIDEO_VELOCIDAD &&
    hipDropFromBaseline > UMBRAL_CAIDA_VIDEO_DESCENSO_MODERADO &&
    trunkAngleDelta > UMBRAL_CAIDA_VIDEO_CAMBIO_ANGULO_SUAVE &&
    (
      moderateLowPosture ||
      moderateHorizontal ||
      analisisVideoCaida.lostTrackingFrames >= 1
    )
  ) {
    registrarCaidaVideo(videoElement.currentTime || 0, hipDropFromBaseline, trunkAngle, [
      `Descenso corporal relevante detectado aunque el tronco no haya llegado a una horizontalidad completa (${hipDropFromBaseline.toFixed(3)} de descenso, ${hipDropSpeed.toFixed(3)} de velocidad).`,
      `Cambio postural brusco respecto de la base (${trunkAngleDelta.toFixed(1)}°).`,
      moderateLowPosture
        ? "La persona quedó en una postura más baja de la habitual tras el evento."
        : "El seguimiento corporal mostró un compromiso transitorio compatible con pérdida de estabilidad."
    ], 2.55 + (trunkAngleDelta / 30) + (moderateLowPosture ? 0.2 : 0));
    return;
  }

  if (
    analisisVideoCaida.seatedBackwardPattern &&
    (analisisVideoCaida.horizontalFrames >= 1 || trunkAngle > 120)
  ) {
    registrarCaidaVideo(videoElement.currentTime || 0, hipDropFromBaseline, trunkAngle, [
      `Cambio brusco del tronco respecto de la postura inicial (${trunkAngleDelta.toFixed(1)}°).`,
      `Patrón compatible con caída hacia atrás desde sedestación o silla de ruedas.`,
      `Movimiento vertical rápido detectado aunque el descenso absoluto de pelvis haya sido bajo (${hipDropFromBaseline.toFixed(3)}).`
    ], 2.8 + (trunkAngleDelta / 30));
  }

  if (
    backwardStandingPattern &&
    (analisisVideoCaida.horizontalFrames >= 1 || analisisVideoCaida.lostTrackingFrames >= 1 || trunkAngle > 110)
  ) {
    registrarCaidaVideo(videoElement.currentTime || 0, hipDropFromBaseline, trunkAngle, [
      `Retroceso brusco del tronco respecto de la postura inicial (${trunkAngleDelta.toFixed(1)}°).`,
      `Patrón compatible con caída hacia atrás desde bipedestación o tropiezo con pérdida de balance.`,
      `El evento combinó velocidad vertical ${hipDropSpeed.toFixed(3)} y tronco abierto a ${trunkAngle.toFixed(1)}°.`
    ], 2.6 + (trunkAngleDelta / 28) + analisisVideoCaida.horizontalFrames * 0.15);
  }
}

function registrarCaidaVideo(tiempo, hipDropFromBaseline, trunkAngle, reasons, score = 1) {
  if (!analisisVideoCaida) return;
  if (score < analisisVideoCaida.bestFallScore) return;

  analisisVideoCaida.bestFallScore = score;
  analisisVideoCaida.fallDetectedAt = tiempo;
  analisisVideoCaida.detectionHipDrop = hipDropFromBaseline;
  analisisVideoCaida.detectionTrunkAngle = trunkAngle;
  analisisVideoCaida.detectionLateralShift = analisisVideoCaida.maxHipLateralShift;
  analisisVideoCaida.detectionHeadOffset = analisisVideoCaida.lastHeadOffsetX;
  analisisVideoCaida.detectionLowPostureFrames = analisisVideoCaida.lowPostureFrames;
  analisisVideoCaida.detectionHorizontalFrames = analisisVideoCaida.horizontalFrames;
  analisisVideoCaida.fallReasons = reasons;
  analisisVideoCaida.analysisCompleted = false;

  setStatus(
    isTechnicalVideoAnalysisMode()
      ? `Momento destacado detectado cerca de ${formatSeconds(tiempo)}. El análisis sigue hasta el final del video.`
      : `Posible caída candidata cerca de ${formatSeconds(tiempo)}. El análisis sigue hasta el final del video.`
  );
}

function nuevoTest() {
  if (!cameraRunning) {
    timerEl.textContent = "0.0 s";
    resetTrigger();
    renderStandbyScreen();
    setStatus("Encendé la cámara para iniciar un nuevo test.");
    updateControls();
    return;
  }

  testRunning = false;
  testStartTime = null;
  clearInterval(timerInterval);
  timerInterval = null;

  resetTrigger();

  timerEl.textContent = "0.0 s";
  limpiarResumen();

  setStatus("Test reiniciado. Presione 'Preparar test' para calibrar y comenzar de nuevo.");
  updateControls();
}

// ---------- Mediapipe ----------
const pose = new Pose({
  locateFile: (file) =>
    `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({
  modelComplexity: 1,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
});

// ---------- Trigger ----------
function procesarTrigger(results) {
  if (!results.poseLandmarks) return;

  const leftFoot = results.poseLandmarks[31];
  const rightFoot = results.poseLandmarks[32];

  if (!leftFoot || !rightFoot) return;
  if (
    (leftFoot.visibility ?? 1) < VISIBILIDAD_MINIMA ||
    (rightFoot.visibility ?? 1) < VISIBILIDAD_MINIMA
  ) {
    return;
  }

  const footY = Math.min(leftFoot.y, rightFoot.y);
  const pieMasAlto = leftFoot.y <= rightFoot.y ? "left" : "right";

  // baseline inicial
  if (esperandoInicio && baselineFootY === null) {
    baselineFootY = footY;
    baselineFrames = 1;
    return;
  }

  if (baselineFootY === null) return;

  if (esperandoInicio && baselineFrames < BASELINE_FRAMES_MIN) {
    baselineFrames += 1;
    baselineFootY = (baselineFootY * 0.85) + (footY * 0.15);
    setStatus(`Calibrando postura inicial... ${baselineFrames}/${BASELINE_FRAMES_MIN}`);
    return;
  }

  const delta = baselineFootY - footY;
  const diferenciaEntrePies = Math.abs(leftFoot.y - rightFoot.y);
  lastDelta = delta;

  if (esperandoInicio) {
    baselineFootY = (baselineFootY * 0.98) + (footY * 0.02);
  }

  if (esperandoInicio && !triggerActivo && !startReady) {
    const posturaEstable =
      Math.abs(delta) < UMBRAL_MOVIMIENTO_PREVIO_INICIO &&
      diferenciaEntrePies < UMBRAL_DIFERENCIA_PIES_INICIO;

    if (posturaEstable) {
      stableStartFrames += 1;
    } else {
      stableStartFrames = 0;
    }

    if (stableStartFrames < FRAMES_ESTABILIDAD_INICIO) {
      setStatus("Quédese quieto");
      renderTestPhaseHelp();
      return;
    }

    startReady = true;
    updateControls();
    setStatus("Listo, levante un pie");
    if (!readyCameraCentered) {
      readyCameraCentered = true;
      smoothScrollToElement(canvasElement, "nearest");
    }
    return;
  }

  // ---------- Inicio ----------
  if (esperandoInicio && !triggerActivo) {
    if (delta > UMBRAL_INICIO && diferenciaEntrePies > UMBRAL_DIFERENCIA_PIES_INICIO) {
      framesElevado++;
    } else {
      framesElevado = 0;
      if (startReady) {
        setStatus("Listo. Levante un pie un poco más.");
      }
    }

    if (framesElevado >= FRAMES_INICIO) {
      triggerActivo = true;
      esperandoInicio = false;
      startReady = false;
      pieActivo = pieMasAlto;
      framesElevado = 0;
      iniciarTest(results.poseLandmarks);
    }
  }

  // ---------- Fin ----------
  if (testRunning && triggerActivo) {
    const tiempo = (Date.now() - testStartTime) / 1000;
    const deltaIzquierdo = baselineFootY - leftFoot.y;
    const deltaDerecho = baselineFootY - rightFoot.y;
    const deltaPieActivo =
      pieActivo === "left"
        ? deltaIzquierdo
        : pieActivo === "right"
        ? deltaDerecho
        : Math.min(deltaIzquierdo, deltaDerecho);
    analisisMonopedia.maxDeltaPieActivo = Math.max(
      analisisMonopedia.maxDeltaPieActivo || 0,
      deltaPieActivo
    );
    const umbralRetornoDinamico = Math.max(
      UMBRAL_FIN,
      (analisisMonopedia.maxDeltaPieActivo || 0) * 0.78
    );
    const ambosPiesApoyados =
      deltaIzquierdo < UMBRAL_FIN && deltaDerecho < UMBRAL_FIN;
    const piesVolvieronAJuntarse = diferenciaEntrePies < UMBRAL_DIFERENCIA_PIES_FIN;
    const pieActivoVolvio = deltaPieActivo < umbralRetornoDinamico;

    // evitar corte inmediato
    if (tiempo < MIN_TEST_SECONDS) return;

    if ((pieActivoVolvio && piesVolvieronAJuntarse) || ambosPiesApoyados) {
      framesApoyado++;
      if (instanteInicioApoyo === null) {
        instanteInicioApoyo = tiempo;
      }
    } else {
      framesApoyado = 0;
      instanteInicioApoyo = null;
      setStatus("Test en curso... baje el pie para finalizar.");
    }

    if (framesApoyado >= FRAMES_FIN) {
      framesApoyado = 0;
      const tiempoCierre = instanteInicioApoyo ?? tiempo;
      registrarEventoAnalisis("toqueSuelo", tiempoCierre);
      detenerTest({
        tiempoFinal: tiempoCierre,
        motivoFin: "El pie elevado perdió la condición de apoyo monopedal y tocó el suelo."
      });
    }
  }
}

// ---------- Render ----------
pose.onResults((results) => {
  if ((!cameraRunning && sourceMode !== "file") || !results.image) return;

  canvasElement.width = results.image.width;
  canvasElement.height = results.image.height;

  renderPoseFrame(results);

  if (results.poseLandmarks) {
    if (sourceMode === "camera") {
      if (getPruebaActual() === "sit_to_stand") {
        analizarSitToStand(results.poseLandmarks);
      } else {
        procesarTrigger(results);
        analizarEstabilidadMonopedia(results.poseLandmarks);
      }
    } else {
      analizarVideoCaida(results.poseLandmarks);
    }

    if (sourceMode === "camera") {
      drawSitToStandOverlay(results.poseLandmarks);
    }
  }

  // ---------- CRONÓMETRO ----------
  const timerBoxWidth = Math.min(280, canvasElement.width * 0.38);
  const timerBoxHeight = Math.min(88, canvasElement.height * 0.16);
  const timerFontSize = Math.max(42, Math.min(58, canvasElement.width * 0.055));

  canvasCtx.textAlign = "center";

  canvasCtx.fillStyle = "rgba(0,0,0,0.3)";
  canvasCtx.fillRect(
    canvasElement.width / 2 - timerBoxWidth / 2,
    20,
    timerBoxWidth,
    timerBoxHeight
  );

  canvasCtx.fillStyle = "white";
  canvasCtx.font = `bold ${timerFontSize}px Arial`;
  canvasCtx.fillText(timerEl.textContent, canvasElement.width / 2, 20 + timerBoxHeight * 0.68);
});

// ---------- Loop estable ----------
async function processFrame() {
  if (!cameraRunning) return;

  if (!processing && videoElement.readyState >= 2) {
    processing = true;
    await pose.send({ image: videoElement });
    processing = false;
  }

  animationId = requestAnimationFrame(processFrame);
}

function cancelVideoFrameProcessing() {
  if (
    videoFrameCallbackId !== null &&
    typeof videoElement?.cancelVideoFrameCallback === "function"
  ) {
    videoElement.cancelVideoFrameCallback(videoFrameCallbackId);
  }
  videoFrameCallbackId = null;
}

function scheduleVideoFrameProcessing() {
  if (!cameraRunning || sourceMode !== "file") return;

  if (typeof videoElement?.requestVideoFrameCallback !== "function") {
    cancelAnimationFrame(animationId);
    processFrame();
    return;
  }

  cancelVideoFrameProcessing();
  videoFrameCallbackId = videoElement.requestVideoFrameCallback(async () => {
    videoFrameCallbackId = null;

    if (!cameraRunning || sourceMode !== "file") return;

    if (!processing && videoElement.readyState >= 2) {
      processing = true;
      await pose.send({ image: videoElement });
      processing = false;
    }

    scheduleVideoFrameProcessing();
  });
}

// ---------- Cámara ----------
async function startCamera() {
  if (sourceMode === "file" || uploadedVideoUrl) {
    stopCamera({ keepStatus: true });
  }

  try {
    sourceMode = "camera";
    syncSourceModeUi();
    analisisVideoCaida = null;
    updateReplayEventButton();
    updateVideoHelp();
    setStatus("Solicitando permiso de cámara...");

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: getVideoConstraints(),
        audio: false
      });
    } catch (primaryError) {
      if (!getSelectedDeviceId()) {
        throw primaryError;
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: getPreferredFacingMode() }
        },
        audio: false
      });
    }

    videoElement.srcObject = stream;
    await videoElement.play();
    await refreshCameraDevices();
    await optimizeActiveVideoTrack(stream);

    cameraRunning = true;
    processing = false;
    resetTrigger();

    toggleButton.textContent = "Apagar cámara";
    updateControls();
    cancelVideoFrameProcessing();
    cancelAnimationFrame(animationId);
    processFrame();

    const facingMode = getSelectedDeviceId()
      ? "dispositivo seleccionado"
      : getPreferredFacingMode() === "environment"
        ? "cámara trasera"
        : "cámara frontal";

    setStatus(`Cámara encendida (${facingMode}). Presione 'Preparar test'.`);
  } catch (error) {
    console.error(error);
    cameraRunning = false;
    toggleButton.textContent = "Encender cámara";
    updateControls();
    setStatus("No se pudo iniciar la cámara. Revise permisos del navegador y use una URL segura.");
  }
}

async function startVideoAnalysis(file) {
  if (!file) return;

  stopCamera({ keepStatus: true });
  sourceMode = "file";
  syncSourceModeUi();
  analisisVideoCaida = crearAnalisisVideoCaida();
  uploadedVideoName = file.name || "";
  limpiarResumen();
  updateVideoHelp();

  if (uploadedVideoUrl) {
    URL.revokeObjectURL(uploadedVideoUrl);
  }

  uploadedVideoUrl = URL.createObjectURL(file);
  videoElement.srcObject = null;
  videoElement.src = uploadedVideoUrl;
  videoElement.muted = true;
  videoElement.controls = true;
  videoElement.loop = false;
  videoElement.pause();
  videoElement.currentTime = 0;

  cameraRunning = false;
  processing = false;
  toggleButton.textContent = "Encender cámara";
  updateControls();
  cancelAnimationFrame(animationId);
  cancelVideoFrameProcessing();
  setStatus("Video cargado. Elegí el modo y presioná 'Aplicar análisis'.");
  smoothScrollToElement(statusEl, "center");
  smoothScrollToElement(canvasElement, "center");
  updateFallAlertChip();
  updateReplayEventButton();
  updateFrameStepButtons();
  updateApplyVideoModeButton();
}

function stopCamera(options = {}) {
  const { keepStatus = false, preserveSummary = false } = options;
  cameraRunning = false;
  processing = false;
  testRunning = false;
  testStartTime = null;
  clearInterval(timerInterval);
  timerInterval = null;
  resetTrigger();

  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  cancelAnimationFrame(animationId);
  animationId = null;
  cancelVideoFrameProcessing();
  videoElement.pause();
  videoElement.srcObject = null;
  videoElement.removeAttribute("src");
  videoElement.load();
  if (uploadedVideoUrl) {
    URL.revokeObjectURL(uploadedVideoUrl);
    uploadedVideoUrl = null;
  }
  uploadedVideoName = "";
  timerEl.textContent = "0.0 s";
  if (!preserveSummary) {
    limpiarResumen();
  }
  toggleButton.textContent = "Encender cámara";
  sourceMode = "camera";
  syncSourceModeUi();
  analisisVideoCaida = null;
  updateFallAlertChip();
  updateReplayEventButton();
  updateFrameStepButtons();
  updateApplyVideoModeButton();
  updateVideoHelp();
  renderStandbyScreen(
    preserveSummary
      ? "Cámara apagada. Use 'Ver informe completo' para revisar el resultado."
      : undefined
  );

  if (!keepStatus) {
    setStatus("Cámara apagada.");
  }
  updateControls();
}

// ---------- Eventos ----------
toggleButton.onclick = () => {
  if (cameraRunning) stopCamera();
  else startCamera();
};

cameraModeEl?.addEventListener("change", async () => {
  updateCameraHelp();
  await restartCameraWithCurrentSelection();
});

cameraDeviceEl?.addEventListener("change", async () => {
  await restartCameraWithCurrentSelection();
});

framingModeEl?.addEventListener("change", async () => {
  saveFramingModePreference();
  updateCameraHelp();
  await restartCameraWithCurrentSelection();
});

renderModeEl?.addEventListener("change", () => {
  renderMode = renderModeEl.value === "camera" ? "camera" : "privacy";
  saveRenderModePreference();
  updateCameraHelp();

  if (!cameraRunning) {
    renderStandbyScreen();
    return;
  }

  setStatus(
    renderMode === "privacy"
      ? "Modo privado activo. Se muestran solo vectores."
      : "Modo cámara activo. Se muestra imagen con vectores."
  );
});

pruebaEl?.addEventListener("change", () => {
  renderPatientHelp();
  if (!testRunning) {
    setStatus(`Prueba seleccionada: ${getNombrePrueba(getPruebaActual())}.`);
  }
});

refreshCamerasButton?.addEventListener("click", async () => {
  await refreshCameraDevices();
  if (cameraRunning) {
    await restartCameraWithCurrentSelection();
  }
});

[patientSearchNameEl, patientSearchIdEl, patientSearchCenterEl].forEach((field) => {
  field?.addEventListener("input", () => {
    renderPatientSelect();
  });
});

toggleSidebarButton?.addEventListener("click", () => {
  const collapsed = !document.body.classList.contains("sidebar-collapsed");
  setSidebarCollapsed(collapsed);
});

patientSelectEl?.addEventListener("change", () => {
  if (!confirmSavePatientDraftIfNeeded()) {
    patientSelectEl.value = currentPatientId || "";
    return;
  }

  const selectedPatient = findPatientById(patientSelectEl.value);

  if (!selectedPatient) {
    clearPatientForm();
    centroEl.value = centroEl.value || "Patricios";
    return;
  }

  fillPatientForm(selectedPatient);
  renderPatientHelp();
  renderPatientHistory();
  updateControls();
  collapseSidebarForMobileWork();
});

newPatientButton?.addEventListener("click", () => {
  if (!confirmSavePatientDraftIfNeeded()) return;

  const currentCentro = centroEl.value;
  clearPatientForm();
  centroEl.value = currentCentro;
  setStatus("Formulario listo para cargar un nuevo paciente.");
  collapseSidebarForMobileWork();
});

savePatientButton?.addEventListener("click", () => {
  savePatientFromForm();
});

savePendingPatientButton?.addEventListener("click", () => {
  savePendingPatientFromForm();
});

importCsvButton?.addEventListener("click", () => {
  csvFileInputEl?.click();
});

loadVideoButton?.addEventListener("click", () => {
  videoFileInputEl?.click();
});

applyVideoModeButton?.addEventListener("click", async () => {
  await applyVideoAnalysis();
});

videoAnalysisModeEl?.addEventListener("change", async () => {
  updateVideoHelp();
  updateFallAlertChip();
  rerenderVideoSummaryIfVisible();
  if (sourceMode === "file" && (uploadedVideoUrl || videoElement?.src)) {
    await applyVideoAnalysis({ autoplay: false });
  }
});

videoExpectedDirectionEl?.addEventListener("change", () => {
  rerenderVideoSummaryIfVisible();
});

videoHeadFocusEl?.addEventListener("input", () => {
  rerenderVideoSummaryIfVisible();
});

videoSubjectRoleEl?.addEventListener("change", () => {
  updateVideoHelp();
  rerenderVideoSummaryIfVisible();
});

videoPersonSelectionEl?.addEventListener("change", () => {
  updateVideoHelp();
  rerenderVideoSummaryIfVisible();
});

csvFileInputEl?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.some(rowLooksLikeTest)) {
      importTestsFromRows(rows);
    } else {
      importPatientsFromRows(rows);
    }
  } catch (error) {
    console.error(error);
    setStatus("No se pudo importar el CSV seleccionado.");
  } finally {
    csvFileInputEl.value = "";
  }
});

videoFileInputEl?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    await startVideoAnalysis(file);
  } catch (error) {
    console.error(error);
    setStatus("No se pudo cargar el video seleccionado.");
  } finally {
    videoFileInputEl.value = "";
  }
});

videoElement?.addEventListener("play", () => {
  if (sourceMode !== "file") return;

  cameraRunning = true;
  processing = false;
  cancelAnimationFrame(animationId);
  scheduleVideoFrameProcessing();
  updateControls();
  setStatus(
    isUkemiVideoMode()
      ? "Analizando video de ukemi en reproducción."
      : isTechnicalVideoAnalysisMode()
      ? "Analizando video técnico en reproducción."
      : "Analizando video local en reproducción."
  );
  updateFallAlertChip();
  updateReplayEventButton();
  updateFrameStepButtons();
});

videoElement?.addEventListener("pause", () => {
  if (sourceMode !== "file") return;

  cameraRunning = false;
  cancelAnimationFrame(animationId);
  animationId = null;
  cancelVideoFrameProcessing();
  if (analisisVideoCaida) {
    analisisVideoCaida.analysisCompleted = false;
    renderResultadoVideoCaida();
  }
  updateControls();
  setStatus(
    isUkemiVideoMode()
      ? "Video de ukemi en pausa. Podés seguir cuadro a cuadro y revisar eje, CG aproximado y cabeza."
      : isTechnicalVideoAnalysisMode()
      ? "Video en pausa. Podés seguir analizando cuadro a cuadro o reanudar la reproducción."
      : "Video en pausa. Lo mostrado es un resultado parcial; podés reanudar para completar el análisis."
  );
  updateFallAlertChip();
  updateReplayEventButton();
  updateFrameStepButtons();
});

videoElement?.addEventListener("seeked", async () => {
  if (sourceMode !== "file") return;
  if (!videoElement.paused) return;
  await renderCurrentVideoFrame();
});

videoElement?.addEventListener("ended", () => {
  if (sourceMode !== "file") return;

  cameraRunning = false;
  cancelAnimationFrame(animationId);
  animationId = null;
  cancelVideoFrameProcessing();
  if (analisisVideoCaida) {
    analisisVideoCaida.analysisCompleted = true;
    renderResultadoVideoCaida();
    if (analisisVideoCaida.fallDetectedAt !== null) {
      videoElement.currentTime = Math.max(0, analisisVideoCaida.fallDetectedAt - 0.9);
      videoElement.pause();
    }
  }
  updateControls();
  setStatus(
    analisisVideoCaida?.fallDetectedAt !== null
      ? isUkemiVideoMode()
        ? "Análisis de ukemi finalizado. El video quedó pausado cerca del momento más útil para revisar."
        : isTechnicalVideoAnalysisMode()
        ? "Análisis del video finalizado. El video quedó pausado cerca del momento más útil para revisar."
        : "Análisis del video finalizado. El video quedó pausado cerca del mejor instante compatible con caída."
      : "Análisis del video finalizado."
  );
  updateFallAlertChip();
  updateReplayEventButton();
  updateFrameStepButtons();
});

saveCsvButton?.addEventListener("click", downloadCsv);

reviewResultButton?.addEventListener("click", () => {
  smoothScrollToElement(resumenEl, "start");
});

fallAlertChip?.addEventListener("click", async () => {
  if (sourceMode !== "file" || !analisisVideoCaida || analisisVideoCaida.fallDetectedAt === null) return;

  videoElement.currentTime = Math.max(0, analisisVideoCaida.fallDetectedAt - 1.2);
  smoothScrollToElement(canvasElement, "start");

  try {
    await videoElement.play();
  } catch (error) {
    console.error("No se pudo reproducir el video desde la alerta", error);
  }
});

replayEventButton?.addEventListener("click", async () => {
  if (sourceMode !== "file" || !analisisVideoCaida || analisisVideoCaida.fallDetectedAt === null) return;

  videoElement.currentTime = Math.max(0, analisisVideoCaida.fallDetectedAt - 1.2);
  smoothScrollToElement(canvasElement, "start");

  try {
    await videoElement.play();
  } catch (error) {
    console.error("No se pudo reproducir el video para revisar el evento", error);
  }
});

prevFrameButton?.addEventListener("click", () => {
  stepVideoFrame(-1);
});

nextFrameButton?.addEventListener("click", () => {
  stepVideoFrame(1);
});

[nombrePacienteEl, patientIdentifierEl, sexoPacienteEl, centroEl, observacionesEl].forEach((field) => {
  field?.addEventListener("input", () => {
    if (field === nombrePacienteEl) {
      currentPatientId = null;
      if (patientCodeEl) {
        patientCodeEl.value = "";
      }
      if (patientSelectEl) {
        patientSelectEl.value = "";
      }
    }

    renderPatientHelp();
    updateControls();
  });

  field?.addEventListener("blur", () => {
    if (field === fechaNacimientoEl) return;
    renderPatientSelect();
  });
});

fechaNacimientoDesktopEl?.addEventListener("input", () => {
  const formattedDate = formatBirthDateInput(fechaNacimientoDesktopEl.value || "");
  if (fechaNacimientoDesktopEl.value !== formattedDate) {
    fechaNacimientoDesktopEl.value = formattedDate;
  }
  currentPatientId = null;
  if (patientCodeEl) {
    patientCodeEl.value = "";
  }
  if (patientSelectEl) {
    patientSelectEl.value = "";
  }
  updateCalculatedAge();
  renderPatientHelp();
  updateControls();
});

fechaNacimientoDesktopEl?.addEventListener("blur", () => {
  const normalizedDate = parseFlexibleBirthDate(fechaNacimientoDesktopEl.value || "");
  if (normalizedDate) {
    fechaNacimientoDesktopEl.value = formatBirthDateForDisplay(normalizedDate);
  }
  updateCalculatedAge();
  renderPatientHelp();
  updateControls();
});

fechaNacimientoMobileEl?.addEventListener("input", () => {
  currentPatientId = null;
  if (patientCodeEl) {
    patientCodeEl.value = "";
  }
  if (patientSelectEl) {
    patientSelectEl.value = "";
  }
  updateCalculatedAge();
  renderPatientHelp();
  updateControls();
});

startTestButton.onclick = prepararTest;
stopTestButton.onclick = detenerTest;
nuevoTestButton.onclick = nuevoTest;

// ---------- Init ----------
if (cameraModeEl && isAppleMobile()) {
  cameraModeEl.value = "environment";
}

loadRegistry();
loadRenderModePreference();
loadFramingModePreference();
syncBirthDateInputMode();
window.addEventListener("resize", syncBirthDateInputMode);
renderPatientSelect();
renderPatientHistory();
updateCalculatedAge();

timerEl.textContent = "0.0 s";
limpiarResumen();
renderStandbyScreen();
updateControls();
updateCameraHelp();
syncSourceModeUi();
updateVideoHelp();
renderPatientHelp();
applySidebarPreference();
refreshCameraDevices();
updateReviewResultButton();
setStatus("Complete paciente o encienda cámara para empezar.");

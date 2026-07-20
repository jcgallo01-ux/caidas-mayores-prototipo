(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  root.UkemiSelection = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const VALID_SELECTIONS = ["auto", "persona_a", "persona_b"];

  function normalizeSelection(value) {
    const normalized = String(value || "").trim().toLowerCase();
    return VALID_SELECTIONS.includes(normalized) ? normalized : "auto";
  }

  function getSelectionLabel(value, fallback = "Auto") {
    switch (normalizeSelection(value)) {
      case "persona_a":
        return "Persona A";
      case "persona_b":
        return "Persona B";
      default:
        return fallback;
    }
  }

  function getSelectionHint(value) {
    switch (normalizeSelection(value)) {
      case "persona_a":
        return "Análisis enfocado en la Persona A.";
      case "persona_b":
        return "Análisis enfocado en la Persona B.";
      default:
        return "Análisis automático del protagonista visible.";
    }
  }

  return {
    VALID_SELECTIONS,
    normalizeSelection,
    getSelectionLabel,
    getSelectionHint
  };
});

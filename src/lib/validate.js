// Clientseitige Validierung – reine Funktionen, dadurch automatisiert testbar (siehe tests/).

export const rules = {
  required: (v) => (v !== undefined && v !== null && String(v).trim() !== '') || 'Pflichtfeld',
  email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '')) || 'Ungültige E-Mail-Adresse',
  minLength: (n) => (v) => String(v || '').trim().length >= n || `Mindestens ${n} Zeichen`,
  checked: (v) => v === true || 'Bitte bestätigen',
}

/**
 * @param {Record<string, unknown>} values
 * @param {Record<string, Array<(v: unknown) => true | string>>} schema
 * @returns {Record<string, string>} Fehlermeldungen pro Feld (leer = gültig)
 */
export function validate(values, schema) {
  const errors = {}
  for (const [field, fieldRules] of Object.entries(schema)) {
    for (const rule of fieldRules) {
      const result = rule(values[field])
      if (result !== true) {
        errors[field] = result
        break
      }
    }
  }
  return errors
}

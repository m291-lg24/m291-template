import { describe, expect, it } from 'vitest'
import { rules, validate } from '../src/lib/validate.js'

describe('validate', () => {
  const schema = {
    name: [rules.required],
    email: [rules.required, rules.email],
  }

  it('meldet leere Pflichtfelder', () => {
    expect(validate({ name: '', email: '' }, schema)).toEqual({
      name: 'Pflichtfeld',
      email: 'Pflichtfeld',
    })
  })

  it('erkennt ungültige E-Mail-Adressen', () => {
    expect(validate({ name: 'Anna', email: 'anna@' }, schema)).toEqual({
      email: 'Ungültige E-Mail-Adresse',
    })
  })

  it('akzeptiert gültige Eingaben', () => {
    expect(validate({ name: 'Anna', email: 'anna@example.ch' }, schema)).toEqual({})
  })

  it('prüft die Mindestlänge', () => {
    expect(rules.minLength(5)('abc')).toBe('Mindestens 5 Zeichen')
    expect(rules.minLength(5)('abcde')).toBe(true)
  })
})

import { describe, it, expect } from 'vitest'
import { checkPasswordCriteria, isPasswordStrong } from '../password'

describe('password utils', () => {
  it('returns all false for an empty password', () => {
    const result = checkPasswordCriteria('')

    expect(result).toEqual({
      hasMinLength: false,
      hasUppercase: false,
      hasLowercase: false,
      hasDigit: false,
      hasSpecialChar: false,
    })
    expect(isPasswordStrong('')).toBe(false)
  })

  it('detects each security criterion individually', () => {
    // Moins de 12 caractères
    expect(checkPasswordCriteria('Ab1!').hasMinLength).toBe(false)
    expect(checkPasswordCriteria('Ab1!56789012').hasMinLength).toBe(true)

    // Majuscule
    expect(checkPasswordCriteria('motdepasse123!').hasUppercase).toBe(false)
    expect(checkPasswordCriteria('Motdepasse123!').hasUppercase).toBe(true)

    // Minuscule
    expect(checkPasswordCriteria('MOTDEPASSE123!').hasLowercase).toBe(false)
    expect(checkPasswordCriteria('Motdepasse123!').hasLowercase).toBe(true)

    // Chiffre
    expect(checkPasswordCriteria('MotDePasseSpecial!').hasDigit).toBe(false)
    expect(checkPasswordCriteria('MotDePasseSpecial1!').hasDigit).toBe(true)

    // Caractère spécial
    expect(checkPasswordCriteria('MotDePasse12345').hasSpecialChar).toBe(false)
    expect(checkPasswordCriteria('MotDePasse12345!').hasSpecialChar).toBe(true)
  })

  it('validates a compliant password fulfilling all 5 criteria', () => {
    const validPassword = 'Password123!'
    expect(isPasswordStrong(validPassword)).toBe(true)
    expect(checkPasswordCriteria(validPassword)).toEqual({
      hasMinLength: true,
      hasUppercase: true,
      hasLowercase: true,
      hasDigit: true,
      hasSpecialChar: true,
    })
  })

  it('rejects a password missing just one criterion', () => {
    // 11 caractères (manque 1 caractère)
    expect(isPasswordStrong('Pass123456!')).toBe(false)
    // Manque caractère spécial
    expect(isPasswordStrong('Password12345')).toBe(false)
    // Manque majuscule
    expect(isPasswordStrong('password12345!')).toBe(false)
    // Manque minuscule
    expect(isPasswordStrong('PASSWORD12345!')).toBe(false)
    // Manque chiffre
    expect(isPasswordStrong('PasswordSpecial!')).toBe(false)
  })
})

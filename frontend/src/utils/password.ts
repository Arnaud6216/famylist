export interface PasswordCriteria {
  hasMinLength: boolean
  hasUppercase: boolean
  hasLowercase: boolean
  hasDigit: boolean
  hasSpecialChar: boolean
}

/**
 * Évalue les 5 critères de sécurité imposés pour les mots de passe Famylist :
 * 1. Au moins 12 caractères
 * 2. Au moins une majuscule
 * 3. Au moins une minuscule
 * 4. Au moins un chiffre
 * 5. Au moins un caractère spécial (@$!%*?&)
 */
export function checkPasswordCriteria(password: string): PasswordCriteria {
  return {
    hasMinLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasDigit: /[0-9]/.test(password),
    hasSpecialChar: /[@$!%*?&]/.test(password),
  }
}

/**
 * Indique si le mot de passe respecte simultanément l'ensemble des 5 critères requis.
 */
export function isPasswordStrong(password: string): boolean {
  const criteria = checkPasswordCriteria(password)
  return (
    criteria.hasMinLength &&
    criteria.hasUppercase &&
    criteria.hasLowercase &&
    criteria.hasDigit &&
    criteria.hasSpecialChar
  )
}

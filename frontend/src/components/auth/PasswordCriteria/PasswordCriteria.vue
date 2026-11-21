<template>
  <div
    v-if="visible"
    :id="id"
    class="password-criteria"
    aria-label="Critères de sécurité du mot de passe"
  >
    <div
      class="password-criteria__item"
      :class="{ 'password-criteria__item--valid': criteria.hasMinLength }"
    >
      <span class="password-criteria__icon" aria-hidden="true">{{ criteria.hasMinLength ? '✓' : '○' }}</span>
      <span>12 caractères minimum</span>
    </div>
    <div
      class="password-criteria__item"
      :class="{ 'password-criteria__item--valid': criteria.hasUppercase }"
    >
      <span class="password-criteria__icon" aria-hidden="true">{{ criteria.hasUppercase ? '✓' : '○' }}</span>
      <span>1 majuscule</span>
    </div>
    <div
      class="password-criteria__item"
      :class="{ 'password-criteria__item--valid': criteria.hasLowercase }"
    >
      <span class="password-criteria__icon" aria-hidden="true">{{ criteria.hasLowercase ? '✓' : '○' }}</span>
      <span>1 minuscule</span>
    </div>
    <div
      class="password-criteria__item"
      :class="{ 'password-criteria__item--valid': criteria.hasDigit }"
    >
      <span class="password-criteria__icon" aria-hidden="true">{{ criteria.hasDigit ? '✓' : '○' }}</span>
      <span>1 chiffre</span>
    </div>
    <div
      class="password-criteria__item"
      :class="{ 'password-criteria__item--valid': criteria.hasSpecialChar }"
    >
      <span class="password-criteria__icon" aria-hidden="true">{{ criteria.hasSpecialChar ? '✓' : '○' }}</span>
      <span>1 caractère spécial</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { checkPasswordCriteria } from '@/utils/password'

interface Props {
  password: string
  visible?: boolean
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  visible: true,
  id: 'password-criteria',
})

const criteria = computed(() => checkPasswordCriteria(props.password))
</script>

<style scoped lang="scss" src="./PasswordCriteria.scss"></style>

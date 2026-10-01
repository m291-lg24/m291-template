<script setup>
import { computed, reactive, ref } from 'vue'
import { rules, validate } from '@/lib/validate'

// Formspree-Endpunkt (oder eigener) aus der .env; leer = nur lokale Validierung
const endpoint = import.meta.env.VITE_FORM_ENDPOINT

const form = reactive({ name: '', email: '', topic: '', contact: 'email', message: '', consent: false })
const touched = reactive({})
const state = ref('idle') // idle | sending | sent | error

const schema = {
  name: [rules.required],
  email: [rules.required, rules.email],
  topic: [rules.required],
  message: [rules.required, rules.minLength(10)],
  consent: [rules.checked],
}

const errors = computed(() => validate(form, schema))
const isValid = computed(() => Object.keys(errors.value).length === 0)
const show = (field) => touched[field] && errors.value[field]

async function submit() {
  Object.keys(schema).forEach((f) => (touched[f] = true))
  if (!isValid.value) return

  if (!endpoint) {
    state.value = 'sent'
    return
  }
  state.value = 'sending'
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    state.value = res.ok ? 'sent' : 'error'
  } catch {
    state.value = 'error'
  }
}
</script>

<template>
  <section class="max-w-xl space-y-6">
    <h1 class="text-2xl font-bold">Kontakt</h1>

    <div v-if="state === 'sent'" class="card border-emerald-200 bg-emerald-50" role="status">
      Danke! Deine Nachricht wurde übermittelt.
    </div>

    <form v-else class="card space-y-4" novalidate @submit.prevent="submit">
      <div>
        <label for="name" class="mb-1 block font-medium">Name</label>
        <input id="name" v-model="form.name" class="input" autocomplete="name" @blur="touched.name = true" />
        <p v-if="show('name')" class="mt-1 text-sm text-red-700">{{ errors.name }}</p>
      </div>

      <div>
        <label for="email" class="mb-1 block font-medium">E-Mail</label>
        <input id="email" v-model="form.email" type="email" class="input" autocomplete="email" @blur="touched.email = true" />
        <p v-if="show('email')" class="mt-1 text-sm text-red-700">{{ errors.email }}</p>
      </div>

      <div>
        <label for="topic" class="mb-1 block font-medium">Thema</label>
        <select id="topic" v-model="form.topic" class="input" @blur="touched.topic = true">
          <option value="" disabled>Bitte wählen …</option>
          <option value="frage">Frage</option>
          <option value="feedback">Feedback</option>
          <option value="anderes">Anderes</option>
        </select>
        <p v-if="show('topic')" class="mt-1 text-sm text-red-700">{{ errors.topic }}</p>
      </div>

      <fieldset>
        <legend class="mb-1 font-medium">Bevorzugter Kontakt</legend>
        <label class="mr-4 inline-flex items-center gap-2">
          <input v-model="form.contact" type="radio" value="email" /> E-Mail
        </label>
        <label class="inline-flex items-center gap-2">
          <input v-model="form.contact" type="radio" value="telefon" /> Telefon
        </label>
      </fieldset>

      <div>
        <label for="message" class="mb-1 block font-medium">Nachricht</label>
        <textarea id="message" v-model="form.message" rows="4" class="input" @blur="touched.message = true" />
        <p v-if="show('message')" class="mt-1 text-sm text-red-700">{{ errors.message }}</p>
      </div>

      <div>
        <label class="inline-flex items-center gap-2">
          <input v-model="form.consent" type="checkbox" @change="touched.consent = true" />
          Ich bin einverstanden, dass meine Angaben gespeichert werden.
        </label>
        <p v-if="show('consent')" class="mt-1 text-sm text-red-700">{{ errors.consent }}</p>
      </div>

      <p v-if="state === 'error'" role="alert" class="rounded-lg bg-red-50 p-3 text-red-800">
        Senden fehlgeschlagen. Bitte später erneut versuchen.
      </p>

      <button class="btn-primary" :disabled="state === 'sending'">
        {{ state === 'sending' ? 'Wird gesendet …' : 'Absenden' }}
      </button>
    </form>
  </section>
</template>

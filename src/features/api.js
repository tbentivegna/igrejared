// src/features/api.js

import axios from 'axios'

// certifique-se de ter no .env.local:
// VITE_API_CHURCH_URL=/api-church
// VITE_API_PERSON_URL=/api-person
// VITE_API_AUTH_URL=/api-authorization
// VITE_JWT_TOKEN=<seu_token_sem_o_prefixo_Bearer>

export const churchApi = axios.create({
  baseURL: import.meta.env.VITE_API_CHURCH_URL,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_JWT_TOKEN}`
  }
})

export const personApi = axios.create({
  baseURL: import.meta.env.VITE_API_PERSON_URL,
  headers: {
    Authorization: `Bearer ${import.meta.env.VITE_JWT_TOKEN}`
  }
})

export const authorizationApi = axios.create({
  baseURL: import.meta.env.VITE_API_AUTH_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${import.meta.env.VITE_JWT_TOKEN}`
  }
})

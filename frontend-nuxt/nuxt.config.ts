// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@nuxt/image', '@nuxt/icon'],
  app: {
    pageTransition: { name: 'page', mode: 'out-in', duration: 500 },
  },
});

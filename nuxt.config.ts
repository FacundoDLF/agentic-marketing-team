// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  // ~/assets resolves to app/assets (srcDir = app/)
  css: ['~/assets/css/main.css'],

  // Ensure Nuxt auto-imports work for FSD layers outside app/
  // ~~ resolves to rootDir (project root)
  imports: {
    dirs: [
      '~~/shared/lib',
      '~~/shared/config',
      '~~/entities/**/model',
    ],
  },

  // Register shared/ui and widgets for auto-import
  // ~~ resolves to rootDir (project root)
  components: [
    { path: '~~/shared/ui', prefix: '' },
    { path: '~~/widgets', pathPrefix: false },
  ],

  // Extend the generated tsconfig to include FSD layers
  // so the IDE and compiler resolve Nuxt auto-imports and types seamlessly
  typescript: {
    tsConfig: {
      include: [
        '../shared/**/*',
        '../entities/**/*',
        '../widgets/**/*',
        '../features/**/*',
      ],
    },
  },
})




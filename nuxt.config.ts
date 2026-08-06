// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  srcDir: '.',
  dir: {
    app: 'app',
    assets: 'app/assets',
    layouts: 'app/layouts',
    middleware: 'app/middleware',
    pages: 'app/pages',
    plugins: 'app/plugins',
    shared: 'shared/lib',
  },

  css: ['~/app/assets/css/main.css'],

  // Ensure Nuxt auto-imports work for FSD layers outside app/
  // ~~ resolves to rootDir (project root)
  imports: {
    dirs: [
      '~~/shared/lib',
      '~~/shared/config',
      '~~/entities/**/model',
    ],
  },


  // Ensure Vite SSR bundles all project layers and lucide components
  build: {
    transpile: [
      '@lucide/vue',
      /shared/,
      /widgets/,
      /features/,
      /entities/,
    ],
  },
  vite: {
    ssr: {
      noExternal: true,
    },
  },

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




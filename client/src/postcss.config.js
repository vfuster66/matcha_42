export default {
    plugins: {
      tailwindcss: {
        config: './tailwind.config.ts', // Assurez-vous que Tailwind charge le bon fichier de config
      },
      autoprefixer: {},
      ...(process.env.NODE_ENV === 'production' && {
        cssnano: {}, // Minification pour la production
      }),
    },
  };
  
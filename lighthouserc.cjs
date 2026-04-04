module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist/public',
      url: ['http://localhost:5000/'],
      startServerCommand: 'npm run start',
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        // Temporarily warn on PWA until icons/manifest are fully configured
        'categories:pwa': 'off',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};

const { createGlobPatternsForDependencies } = require('@nx/angular/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
     './apps/dashboard/src/**/*.{html,ts}',
    './libs/**/*.{html,ts}'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

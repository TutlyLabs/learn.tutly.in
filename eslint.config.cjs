const eslint = require("@eslint/js");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tseslintParser = require("@typescript-eslint/parser");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const astroPlugin = require("eslint-plugin-astro");

module.exports = [
  eslint.configs.recommended,
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,tsx}"],
    ignores: ["src/**/*"],
    plugins: {
      "@typescript-eslint": tseslint,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        tsconfigRootDir: __dirname,
        sourceType: "module",
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    env: {
      browser: true,
      node: true,
      es2022: true,
    },
  },
  {
    files: ["**/*.astro"],
    plugins: {
      astro: astroPlugin,
    },
    languageOptions: {
      parser: require("astro-eslint-parser"),
      parserOptions: {
        parser: tseslintParser,
        extraFileExtensions: [".astro"],
      },
    },
    rules: {
      ...astroPlugin.configs.recommended.rules,
    },
  },
];

/*
 * The docs show this object exported anonymously. Assigned to a named const
 * instead, purely because eslint-config-next's `import/no-anonymous-default-export`
 * warns on the doc's version. Functionally identical.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;

const autoprefixer = require("autoprefixer");
const tailwindcss = require("tailwindcss");

module.exports = {
  plugins: [
    // Load these from the developer guide itself. With pnpm, passing the
    // package names to postcss-loader can resolve a different workspace's
    // Tailwind version instead of this guide's Tailwind 3 dependency.
    tailwindcss,
    autoprefixer,
    ...(process.env.NODE_ENV === "production" ? [{ cssnano: {} }] : []),
  ],
};

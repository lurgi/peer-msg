const typescript = require("@rollup/plugin-typescript");
const resolve = require("@rollup/plugin-node-resolve");
const commonjs = require("@rollup/plugin-commonjs");
const pkg = require("./package.json");

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
];

module.exports = {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.esm.js",
      format: "esm",
      sourcemap: true,
    },
    {
      file: "dist/index.cjs.js",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/index.browser.js",
      format: "iife",
      name: "PeerMsg",
      globals: {
        "simple-peer": "SimplePeer",
      },
      sourcemap: true,
    },
  ],
  external,
  plugins: [
    resolve({
      browser: true,
    }),
    typescript(),
    commonjs(),
  ],
};

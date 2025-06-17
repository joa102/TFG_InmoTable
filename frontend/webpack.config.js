const webpack = require('webpack');
const dotenv = require('dotenv');

// Cargar variables de entorno
const env = dotenv.config().parsed;

// Convertir a formato process.env
const envKeys = Object.keys(env || {}).reduce((prev, next) => {
  prev[`process.env.${next}`] = JSON.stringify(env[next]);
  return prev;
}, {});

module.exports = {
  plugins: [
    new webpack.DefinePlugin(envKeys)
  ]
};
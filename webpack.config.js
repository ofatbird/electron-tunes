const path = require('path')

module.exports = {
    entry: "./src/render/vue/index",
    output: {
        path: path.resolve(__dirname, "app"),
        filename: 'index.js'
    },
    target: 'electron-renderer'
}
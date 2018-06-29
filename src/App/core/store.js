const Store = require('electron-store')
const defaults = require('./default-config')

const store = new Store({ defaults })

module.exports = store

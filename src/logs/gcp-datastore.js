const uuid = require('uuid/v4')
const { curry } = require('ramda')
// Imports the Google Cloud client library
const Datastore = require('@google-cloud/datastore')

const defaultLogs = []

// Creates a client
const datastore = new Datastore({
  keyFilename: 'Sheets to PDF-c352f25c1508.json',
  projectId: 'sheets-to-pdf',
})

// 1. store all logs of a session in `store`
// 2. send all logs from the previous session at the beginning of the next session
// 3. on success, remove previous session's logs (by timestamp?)
module.exports = function createLoger(store) {
  const sessionId = uuid()
  const localStoreKey = 'logs'

  initLogs(store)
  initSession(store, sessionId)

  const addLog = (payload) => {
    if (typeof payload === 'string') {
      payload = {
        message: payload,
      }
    }

    if (typeof payload !== 'object') {
      throw new Error('You log must be an Object')
    }

    if (!payload.type) {
      throw new Error('A log must have a type!')
    }

    if (!('created' in payload)) {
      payload.created = Date.now()
    }

    payload.sessionId = sessionId
    const oldLogs = store.get(localStoreKey) || []
    store.set(localStoreKey, oldLogs.concat([payload]))
  }

  log.error = payload => addLog(Object.assign(payload, { type: 'error' }))
  log.event = payload => addLog(Object.assign(payload, { type: 'event' }))

  log.flush = function flushLogs() {
    const now = Date.now()
    const localLogs = store.get('logs')
    if (!localLogs || !localLogs.length) {
      console.warn('Attempting to flush logs when there are none.')
      return
    }

    const logs = {
      key: datastore.key(['Session', sessionId]),
      data: {
        logs: localLogs,
      },
    }

    datastore
      .save(logs)
      .then((response) => {
        console.log('GCP responded', response)
        const nextLogs = store.get('logs')
        store.set('logs', nextLogs.filter(nextLog => nextLog.created > now))
        log('Uploaded previous logs')
      })
      .catch((error) => {
        console.error('Oh man, looks like GCP had an error uploading logs')
        throw error
      })
  }

  return log

  function log(payload) {
    if (typeof payload === 'string') {
      payload = {
        message: payload,
      }
    }

    return addLog(Object.assign(payload, { type: 'info' }))
  }
}

function initSession(store, sessionId) {
  const isProd = false
  const user = isProd ? 'david' : 'dev'
  const userKey = datastore.key(['User', user])

  return datastore.get(userKey).then(([entity]) => {
    const lastSessionId = entity.sessions[entity.sessions.length - 1]
    return Promise.all([
      !!lastSessionId && storeLastLogsWithSession(store, lastSessionId),
      datastore.update(
        Object.assign(entity, {
          sessions: (entity.sessions || []).concat([sessionId]),
        }),
      ),
    ])
  })
}

function storeLastLogsWithSession(store, sessionId) {
  const logs = store.get('logs')
  if (logs.length <= 0) return Promise.resolve()
  store.set('oldLogs', logs)
  store.set('logs', defaultLogs)

  const sessionKey = datastore.key(['Session', sessionId])
  const sessionEntry = {
    key: sessionKey,
  }

  const session = {
    key: sessionKey,
    data: {
      logs,
    },
  }

  return datastore
    .get(sessionKey)
    .then(([sesh]) => {
      if (sesh) {
        sessionEntry.data.logs = sesh.logs.concat(logs)
      }
      return datastore.upsert(session)
    })
    .catch((err) => {
      console.warn('Resetting oldLogs to:', logs)
      store.set('logs', logs)
      store.delete('oldLogs')
      throw err
    })
}

function initLogs(store) {
  if (!store.get('logs')) store.set('logs', defaultLogs)
}

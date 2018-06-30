import uuid from 'uuid/v4'
import Datastore from '@google-cloud/datastore'

const defaultLogs = []
let logger

const isDev = process.env.NODE_ENV !== 'production'
!isDev && console.log('production!')

// Creates a client
const datastore = new Datastore({
  keyFilename: isDev
    ? 'secrets/Sheets to PDF-c352f25c1508.json'
    : 'resources/app/secrets/Sheets to PDF-c352f25c1508.json',
  projectId: 'sheets-to-pdf',
})

// TODO: store and submit logs grouped by 'session-id'
export default function createLoger(store) {
  const sessionId = uuid()
  const logKey = 'logs'

  initSession(store, sessionId)

  function log(payload) {
    if (typeof payload !== 'object') {
      throw new Error('You may only log Objects')
    }

    if (!payload.type) {
      throw new Error('A log must have a type!')
    }

    payload.created = Date.now()
    payload.sessionId = sessionId

    const oldLogs = store.get(logKey) || []
    store.set(logKey, oldLogs.concat([payload]))
  }

  log.error = payload => log(Object.assign(payload, { type: 'error' }))

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
      .then(() => {
        const nextLogs = store.get('logs')
        store.set('logs', nextLogs.filter(nextLog => nextLog.created > now))
        log('Uploaded previous logs')
      })
      .catch(error => {
        console.error('Oh man, looks like GCP had an error uploading logs')
        throw error
      })
  }

  logger = log
  return log
}

function initSession(store, sessionId) {
  // Hard-coded users for now. Leaving room to make it dynamic later.
  const isProd = process.env.NODE_ENV === 'production'
  const user = isProd ? 'david' : 'dev'
  const userKey = datastore.key(['User', user])

  return datastore.get(userKey).then(([entity]) => {
    const lastSessionId = entity.sessions[entity.sessions.length - 1]
    return Promise.all([
      !!lastSessionId && storeSession(store, lastSessionId),
      datastore.update(
        Object.assign(entity, {
          sessions: (entity.sessions || []).concat([sessionId]),
        })
      ),
    ])
  })
}

function storeSession(store, sessionId) {
  const logs = store.get('logs')
  if (logs.length <= 0) return Promise.resolve()
  store.set('logs', defaultLogs)

  const sessionKey = datastore.key(['Session', sessionId])
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
        // updating a session
        session.data.logs = sesh.logs.concat(logs)
      }
      return datastore.upsert(session)
    })
    .catch(error => {
      console.warn(
        "Failed to submit last session's logs. Resetting logs to:",
        logs
      )
      store.set('logs', logs)
      if (logger) {
        logger({
          type: 'save-session',
          error,
        })
      }

      throw error
    })
}

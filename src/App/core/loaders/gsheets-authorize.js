import fs from 'fs'
import { promisify } from 'util'
import { parse } from 'url'
import { google } from 'googleapis'

import electron from 'electron'
import { join } from 'path'

// Load client secrets from a local file.
import clientSecrets from './../../../../secrets/client_secret.json'
import { appDataPath } from './../util/util'

// If modifying these scopes, delete clientSecrets.json.
const TOKEN_PATH = join(appDataPath(), 'credentials.json')
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {function} callback The callback to call with the authorized client.
 */
export default promisify(auth)
function auth(callback) {
  const { client_secret, client_id, redirect_uris } = clientSecrets.installed
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  )

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback)

    console.log('found tokens in:', TOKEN_PATH)
    oAuth2Client.setCredentials(JSON.parse(token))
    return callback(null, oAuth2Client)
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })

  const authWindow = new electron.remote.BrowserWindow({
    width: 500,
    height: 600,
    frame: false,
    show: true,
    webPreferences: {
      nodeIntegration: false,
    },
  })

  authWindow.on('closed', () => {
    // TODO: Handle this smoothly
    throw new Error('Auth window was closed by user')
  })

  authWindow.webContents.on('will-navigate', (event, url) => {
    handleNavigation(url)
  })

  authWindow.webContents.on(
    'did-get-redirect-request',
    (event, oldUrl, newUrl) => {
      handleNavigation(newUrl)
    }
  )

  authWindow.loadURL(authUrl)

  function handleNavigation(url) {
    const query = parse(url, true).query
    if (query) {
      if (query.error) {
        throw new Error(`There was an error: ${query.error}`)
      } else if (query.approvalCode) {
        // Authentication accepted!
        authWindow.removeAllListeners('closed')
        setImmediate(() => authWindow.close())

        // This is the authorization code we need to request tokens
        oAuth2Client.getToken(query.approvalCode, (err, token) => {
          if (err) return callback(err)
          oAuth2Client.setCredentials(token)
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), error => {
            if (error) {
              throw error
            }
            console.log('Token stored to', TOKEN_PATH)
          })
          return callback(null, oAuth2Client)
        })
      }
    }
  }
}

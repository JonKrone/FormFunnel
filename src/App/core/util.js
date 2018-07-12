/* eslint-disable import/prefer-default-export */
import electron from 'electron'
import { resolve } from 'path'

export function appDataPath() {
  const savePath = (electron.remote || electron).app.getPath('userData')
  return resolve(savePath)
}

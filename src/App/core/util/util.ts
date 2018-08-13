/* eslint-disable import/prefer-default-export */
import electron from 'electron'
import { resolve } from 'path'

export function appDataPath(): string {
  const savePath: string = (electron.remote || electron).app.getPath('userData')
  return resolve(savePath)
}

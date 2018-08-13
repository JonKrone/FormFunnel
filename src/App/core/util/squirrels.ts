import { app } from 'electron'
import ChildProcess from 'child_process'
import path from 'path'

const INSTALL = '--squirrel-install'
const UPDATE = '--squirrel-updated'
const UNINSTALL = '--squirrel-uninstall'
const OBSOLETE = '--squirrel-obsolete'

export default function handleSquirrelEvent() {
  const isSquirrel = [INSTALL, UPDATE, UNINSTALL, OBSOLETE].includes(
    process.argv[1]
  )
  if (!isSquirrel) {
    // naive squirrel check, may conflict args in the future
    return false
  }

  const appFolder = path.resolve(process.execPath, '..')
  const rootAtomFolder = path.resolve(appFolder, '..')
  const squirrelExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'))
  const exeName = path.basename(process.execPath)

  const squirrelEvent = process.argv[1]
  switch (squirrelEvent) {
    case INSTALL:
    case UPDATE:
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawn(squirrelExe, ['--createShortcut', exeName])

      setTimeout(app.quit, 1000)
      return true
    case UNINSTALL:
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawn(squirrelExe, ['--removeShortcut', exeName])

      setTimeout(app.quit, 1000)
      return true

    case OBSOLETE:
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      app.quit()
      return true
  }

  return false
}

function spawn(command: string, args: string[]): void {
  try {
    ChildProcess.spawn(command, args, { detached: true })
  } catch (error) {
    console.error('Failed to handle a squirrel event:', command, args)
    console.error(error)
  }
}

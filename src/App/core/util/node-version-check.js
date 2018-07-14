const semver = require('semver')

const version = process.version.slice(1)

const shouldCompile =
  process.env.NODE_ENV === 'production' ||
  semver.satisfies(version, '>=8.7.0 <=10.0.0')

if (!shouldCompile) {
  throw new Error(
    'Please check your Node version and possible rebuild any dependencies.'
  )
}

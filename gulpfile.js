import gulp from 'gulp'
import File from 'vinyl'
import zip from 'gulp-zip'
import yaml from 'js-yaml'
import rimraf from 'rimraf'
import { Transform } from 'stream'
import { setOutput } from '@actions/core'
import rawManifest from './manifest.json'
import pkg from './package.json'


const { version } = pkg
const { name } = rawManifest

/**
 * @param {funciton} handler - deal with object stream
 */
const transform = (handler) => (
  new Transform({
    objectMode: true,
    transform(stream, encoding, callback) {
      callback(null, handler(stream))
    },
  })
)

gulp.task('clean', async () => {
  rimraf.sync(`{dist,build,*.log}`)
})


gulp.task('copy-assets', () => (
  gulp.src('{*.md,*.csv,{avatars,voices}/**/*}')
    .pipe(gulp.dest(`build`))
))

/**
 * depends on `changelog` step in release.yml
 */
gulp.task('build-manifest', () => (
  gulp.src('keywords-voices.yml')
    .pipe(
      transform((file) => {
        const voiceConfig = yaml.safeLoad(file.contents.toString())
        const { languages, contributes } = voiceConfig

        const manifest = {
          version,
          ...rawManifest,
          languages,
          contributes,
        }

        // gulp built-in File class in vinyl
        return new File({
          path: `manifest.json`,
          contents: Buffer.from(JSON.stringify(manifest, null, 2)),
        })
      }),
    )
    .pipe(gulp.dest(`build`))
))


gulp.task('bundle', async () => {
  const bundleName = `${name}-${version}.zip`

  if (process.env.CI) {
    console.log('set actions output - "bundle-file", "bundle-path"')
    setOutput('bundle-file', bundleName)
    setOutput('bundle-path', `./dist/${bundleName}`)
  }

  return await gulp.src('build/**')
    .pipe(zip(bundleName))
    .pipe(gulp.dest('dist'))
})


gulp.task('output-changelog', async () => (
  gulp.src('change.log')
    .pipe(
      transform((file) => {
        const changelog = file.contents.toString()
          .replace(/^---$/mg, '')
          .trim()
        return changelog
      }),
    )
    .pipe(
      transform((changelog) => {
        console.log('changelog', changelog)
        if (process.env.CI) {
          console.log('set actions output - "changelog"')
          setOutput('changelog', changelog)
        }
      }),
    )
))

gulp.task('default', gulp.series(
  'clean',
  'copy-assets',
  'build-manifest',
  'bundle',
))

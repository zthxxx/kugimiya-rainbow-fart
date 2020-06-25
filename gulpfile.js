import fs from 'fs'
import yaml from 'js-yaml'
import gulp from 'gulp'
import zip from 'gulp-zip'
import rimraf from 'rimraf'
import rawManifest from './manifest.json'
import pkg from './package.json'


const { version } = pkg
const { name } = rawManifest


gulp.task('clean', (done) => {
  rimraf.sync(`{dist,build}`)
  return done()
})


gulp.task('copy-assets', () => (
  gulp.src('{*.md,*.csv,{avatars,voices}/**/*}')
    .pipe(gulp.dest(`build`))
))


gulp.task('build-manifest', (done) => {
  const keywordsFilePath = 'keywords-voices.yml'

  const voiceConfig = yaml.safeLoad(
    fs.readFileSync(keywordsFilePath, 'utf8'),
  )
  const { languages, contributes } = voiceConfig

  const manifest = {
    version,
    ...rawManifest,
    languages,
    contributes,
  }

  const manifestData = JSON.stringify(manifest, null, 2)
  fs.writeFileSync(
    'build/manifest.json',
    manifestData,
    'utf8',
  )

  return done()
})


gulp.task('bundle', () => (
  gulp.src('build/**/*')
    .pipe(zip(`${name}-${version}.zip`))
    .pipe(gulp.dest('dist'))
))


gulp.task('default', gulp.series(
  'clean',
  'copy-assets',
  'build-manifest',
  'bundle',
))

import { build, BuildOptions } from 'esbuild'

const options: BuildOptions = {
  entryPoints: ['./index.ts'],
  platform: 'node',
  target: 'node16',
  external: ['jsonwebtoken'],
  minify: true,
  bundle: true,
  outfile: './dist/index.js'
}

build(options).catch((err) => {
  process.stderr.write(err.stderr)
  process.exit(1)
})

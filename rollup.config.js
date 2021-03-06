import nodeResolve from 'rollup-plugin-node-resolve'

const localImports = process.env.LOCALIMPORTS

const customModules = new Set([
  'y-websocket',
  'y-codemirror',
  'y-ace',
  'y-textarea',
  'y-quill',
  'y-dom',
  'y-prosemirror'
])
/**
 * @type {Set<any>}
 */
const customLibModules = new Set([
  'lib0',
  'y-protocols'
])
const debugResolve = {
  resolveId (importee) {
    if (importee === 'yjs') {
      return `${process.cwd()}/src/index.js`
    }
    if (localImports) {
      if (customModules.has(importee.split('/')[0])) {
        return `${process.cwd()}/../${importee}/src/${importee}.js`
      }
      if (customLibModules.has(importee.split('/')[0])) {
        return `${process.cwd()}/../${importee}`
      }
    }
    return null
  }
}

export default [{
  input: './src/index.js',
  output: [{
    name: 'Y',
    file: 'dist/yjs.js',
    format: 'cjs',
    sourcemap: true,
    paths: path => {
      if (/^lib0\//.test(path)) {
        return `lib0/dist/${path.slice(5)}`
      }
      return path
    }
  }, {
    name: 'Y',
    file: 'dist/yjs.mjs',
    format: 'es',
    sourcemap: true
  }],
  external: id => /^lib0\//.test(id)
}, {
  input: './tests/index.js',
  output: {
    name: 'test',
    file: 'dist/tests.js',
    format: 'iife',
    sourcemap: true
  },
  plugins: [
    debugResolve,
    nodeResolve({
      sourcemap: true,
      mainFields: ['module', 'browser', 'main']
    })
  ]
}]

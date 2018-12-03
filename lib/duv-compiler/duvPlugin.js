class DuvPlugin {
  constructor (options) {
    const defaultOptions = {
      commonName: 'common',
      path: 'static/css',
      type: null  // wx || bd
    }
    this.options = Object.assign(options || {}, defaultOptions)
  }
  apply (compiler) {
    compiler.hooks.emit.tap('DuvPlugin', (compilation) => {
      let suffix = ''
      if (!this.options.type) {
        if (compilation.assets['app.wxss']) {
          suffix = 'wxss'
        } else if (compilation.assets['app.css']) {
          suffix = 'css'
        }
      }
      const commonCssFile = `${this.options.path}/${this.options.commonName}.${suffix}`
      if (!compilation.assets[commonCssFile]) {
        compilation.assets[commonCssFile] = {
          source () {
            return ''
          },
          size () {
            return 0
          }
        }
      }
    })
  }
}
module.exports = DuvPlugin

const transform = require('babel-core').transform
const convertApi = require('duv-api-util')
module.exports = function (script, components) {
  components = components || {}
  const scriptContent = script.oldcontent ? script.oldcontent : script.content
  const cJs = convertApi(scriptContent)
  const result = transform(cJs, {
    plugins: [{
      visitor: {
        // 删除组件import
        ImportDeclaration: function (path) {
          for (const k in components) {
            if (path.node.source.value === components[k]) { path.remove() }
          }
        },
        ExportDefaultDeclaration (path) {
          path.traverse({
            Property: function (path) {
              if (path.node.key.name === 'components') {
                path.remove()
              }
            }
          })
        }
      }
    }]
  })
  script.oldcontent = scriptContent
  script.content = result.code
}

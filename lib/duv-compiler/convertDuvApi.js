const transform = require('babel-core').transform
const convertApi = require('duv-api-util')
module.exports = function (script, components) {
  components = components || {}
  const scriptContent = script.oldcontent ? script.oldcontent : script.content
  const cJs = convertApi(scriptContent, {
    type: global.duvType
  })
  const componentsArr = []
  for (const c in components) {
    componentsArr.push(c)
  }
  const result = transform(cJs, {
    plugins: [{
      visitor: {
        // 删除组件import
        ImportDeclaration: function (path) {
          if (componentsArr.indexOf(path.node.source.value) > -1) {
            path.remove()
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

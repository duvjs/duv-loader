const generator = require('babel-generator').default
const babelon = require('babelon')
function getImportsMap (metadata) {
  let { importsMap } = metadata
  const { imports } = metadata.modules

  if (!importsMap) {
    importsMap = {}
    imports.forEach(m => {
      m.specifiers.forEach(v => {
        importsMap[v.local] = m.source
      })
    })
    metadata.importsMap = importsMap
  }

  return metadata
}
// 分析js页面rootComponent
const parseEntry = {
  visitor: {
    ExportDefaultDeclaration (path) {
      path.traverse({
        Property: function (path) {
          const k = path.node.key.name || path.node.key.value
          if (k !== 'config') {
            return
          }
          path.stop()
          const { metadata } = path.hub.file
          const { code } = generator(path.node.value, {}, '')

          metadata.config = {
            code: code,
            node: path.node.value,
            value: babelon.eval(code)
          }
        }
      })
      path.remove()
    },
    NewExpression (path) {
      const { metadata } = path.hub.file
      const { imports } = metadata.modules

      const importsMap = {}

      imports.forEach(m => {
        m.specifiers.forEach(v => {
          importsMap[v.local] = m.source
        })
      })

      // 文件的import结果map
      metadata.importsMap = importsMap

      const calleeName = path.node.callee.name

      const isVue = /vue$/.test(importsMap[calleeName])

      if (!isVue) {
        return
      }
      const arg = path.node.arguments[0]

      // console.log(arg.type === 'Identifier' ? importsMap[arg.name] : importsMap['App'])
      const v = arg.type === 'Identifier' ? importsMap[arg.name] : importsMap['App']

      // rootComponent js中vue模板路径
      metadata.rootComponent = v || importsMap['index'] || importsMap['main']
    }
  }
}
const parserComponent = {
  visitor: {
    ExportDefaultDeclaration: function (path) {
      path.traverse({
        Property: function (path) {
          if (path.node.key.name === 'config') {
            const { metadata } = path.hub.file
            const { code } = generator(path.node.value, {}, '')
            metadata.config = {
              code: code,
              node: path.node.value,
              value: babelon.eval(code)
            }
          } else if (path.node.key.name === 'components') {
            const { metadata } = path.hub.file
            const { importsMap } = getImportsMap(metadata)
            // 找到所有的 imports
            const { properties } = path.node.value
            const components = {}
            properties.forEach(p => {
              const k = p.key.name || p.key.value
              const v = p.value.name || p.value.value

              components[k] = importsMap[v]
            })
            metadata.components = components
          }
        }
      })
    }
  }
}
// 分析 *.vue 引入的组件
module.exports = {
  parseEntry,
  parserComponent
}

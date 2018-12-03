const transform = require('babel-core').transform
const t = require('babel-types')
const duvApiList = require('./apiUtil').duvApiList
module.exports = function (script, components) {
  components = components || {}
  const result = transform(script.oldcontent ? script.oldcontent : script.content, {
    plugins: [{
      visitor: {
        // 删除组件import
        ImportDeclaration: function (path) {
          for (const k in components) {
            path.node.source.value === components[k]
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
        },
        CallExpression (path) {
          if (path.node.callee.object && path.node.callee.object.name === 'duv') {
            const callName = path.node.callee.property.name
            const duvType = global.duvType
            let OwnName = ''
            if (duvType === 'wx') {
              OwnName = 'wx'
            } else if (duvType === 'bd') {
              OwnName = 'swan'
            }

            if (duvApiList[callName] === true) {
              // 只替换duv
              path.replaceWith(t.CallExpression(
                t.MemberExpression(t.identifier(OwnName),
                  t.identifier(callName)),
                path.node.arguments
              ))
            } else if (typeof duvApiList[callName] === 'object') {
              const newCallName = duvApiList[callName][duvType]
              // 替换duv and callname
              path.replaceWith(t.CallExpression(
                t.MemberExpression(t.identifier(OwnName),
                  t.identifier(newCallName)),
                path.node.arguments
              ))
            }
          };
        }
      }
    }]
  })
  script.oldcontent = script.oldcontent ? script.oldcontent : script.content
  script.content = result.code
}

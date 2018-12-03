const { getPathPrefix, getCssSuffix } = require('./util')
function genScript (name, pageType, src) {
  let prefix
  if (pageType === 'page') {
    prefix = getPathPrefix(src)
  } else if (pageType === 'component') {
    prefix = '../'
  } else {
    prefix = './'
  }
  return `
require('${prefix}static/js/common')
require('${prefix}static/js/manifest')
require('${prefix}static/js/${name}')
`
}
function genStyle (name, pageType, src, style) {
  let prefix
  if (pageType === 'page') {
    prefix = getPathPrefix(src)
  } else if (pageType === 'component') {
    prefix = '../'
  } else {
    prefix = './'
  }
  let subStyle = ''
  if (style && style.length > 0) {
    subStyle = `@import "${prefix}static/css/${name}.${getCssSuffix()}";`
  }
  return `
${subStyle}
@import "${prefix}static/css/common.${getCssSuffix()}";
  `
}

module.exports = {
  genScript,
  genStyle
}

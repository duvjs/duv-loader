const babel = require('babel-core')
const duvCompiler = require('duv-template-compiler')
const htmlBeaufify = require('js-beautify').html
const minimatch = require('minimatch')
const loaderUtils = require('loader-utils')
const path = require('path')
const {
  getResourcePathInfo,
  cacheFileInfo,
  getHashNameBySrc,
  getXmlSuffix,
  getCssSuffix,
  resolveSrc
} = require('./util')
const {
  genScript,
  genStyle
} = require('./template')
const {
  parseEntry,
  parserComponent
} = require('./parse')
const defaultOptions = {
  pages: 'src/pages/**/*.vue',
  components: 'src/components/**/*.vue',
  app: 'src/app.vue',
  fileSrc: 'src',
  jsEntry: 'main'
}
/**
 * @param content 入口js文件内容
 * @returns {*}
 */
function compileEntry (content) {
  const { resourcePath, resolve, context } = this
  const options = this._compilation.options
  // 获取文件信息fileInfo {pageType, src, name}
  const fileInfo = getResourcePathInfo(resourcePath, options.entry)
  // 缓存文件信息 key: 文件绝对路径 value: fileInfo
  cacheFileInfo(resourcePath, fileInfo)
  const { src, name, pageType } = fileInfo
  // 根据文件类型 处理、生成文件
  if (pageType === 'app' || pageType === 'page' || pageType === 'component') {
    // 分析入口文件 rootcomponent config(页面json) 信息
    const result = babel.transform(content, {
      plugins: [
        parseEntry
      ]
    })
    const { config, rootComponent } = result.metadata
    resolve(context, rootComponent, (err, rootComponentSrc) => {
      if (err) return
      // 缓存根组件的类型，在生成wxml时候用到
      // src wxml生成时候用到的路径
      cacheFileInfo(rootComponentSrc, { pageType, src, config, name })
    })
  }
  // 解析入口文件
  return content
}

/**
 * page component 类型进入此方法
 * @param emitWarning
 * @param emitError
 * @param emitFile
 * @param resourcePath
 * @param rootComponentSrc
 * @param src
 */
// function createEntryXml (emitWarning, emitError, emitFile, xmlOption) {
//   const { name, pageType, rootComponentSrc } = xmlOption
//   let { src } = xmlOption
//   if (pageType === 'component') {
//     const comName = getHashNameBySrc(rootComponentSrc)
//     src = `/components/${comName}`
//   }
//   emitFile(`${src}.js`, genScript(name, pageType, src))
//   // emitFile(`${src}.${getCssSuffix()}`, genStyle(name, pageType, src))
// }

/**
 * 生成入口文件
 * @param compiled
 * @param html
 * @param script
 * @returns {Promise<{}>}
 */
async function compileToXml (compiled, html, script, style) {
  const { resourcePath, emitFile, resolve, context } = this
  let options = loaderUtils.getOptions(this)
  options = Object.assign(defaultOptions, options)
  const isPage = path.join(process.cwd(), options.pages)
  const isComponent = path.join(process.cwd(), options.components)
  const isApp = path.join(process.cwd(), options.app)
  const fileSrc = resourcePath.replace(path.join(process.cwd(), options.fileSrc), '')
  let src, pageType, name
  if (minimatch(resourcePath, isPage)) {
    // console.log('ispage')
    src = path.resolve(path.dirname(fileSrc), options.jsEntry).substr(1)
    name = src
    pageType = 'page'
  } else if (minimatch(resourcePath, isComponent)) {
    // console.log('iscomponent')
    src = path.resolve(path.dirname(fileSrc), options.jsEntry).substr(1)
    name = src
    pageType = 'component'
  } else if (minimatch(resourcePath, isApp)) {
    // console.log('isapp')
    src = 'app'
    pageType = 'app'
    name = src
    // const commonSrc = path.join('static', 'css', `common.${getCssSuffix()}`)
    // emitFile(`${commonSrc}`, '')
  }
  // const fileInfo = getFileInfo(resourcePath)
  // let { src, pageType, config, name } = fileInfo
  // let { config } = fileInfo
  // console.log({ src, pageType, name })
  const scriptContent = script.oldcontent ? script.oldcontent : script.content
  const { metadata } = babel.transform(scriptContent, {
    plugins: [
      parserComponent
    ]
  })
  const importsMap = metadata.importsMap
  const components = metadata.components
  let config = metadata.config
  config = config ? (config.value || {}) : {}
  if (importsMap) {
    const usingComponents = {}
    for (const k in importsMap) {
      if (components[k]) {
        const resultSrc = await resolveSrc(resolve, context, importsMap[k])
        const rootComName = getHashNameBySrc(resultSrc)
        usingComponents[k] = `/components/${rootComName}`
      }
    }
    config.usingComponents = usingComponents
  }
  const componentXml = genComponentXml(compiled)
  if (pageType === 'app') {
    emitFile(`${src}.js`, genScript(name, pageType, src))
    emitFile(`${src}.${getCssSuffix()}`, genStyle(name, pageType, src, style))
    emitFile(`${src}.json`, JSON.stringify(config, null, '  '))
  } else if (pageType === 'page' && src) {
    emitFile(`${src}.js`, genScript(name, pageType, src))
    emitFile(`${src}.${getXmlSuffix()}`, htmlBeaufify(componentXml))
    emitFile(`${src}.json`, JSON.stringify(config, null, '  '))
    emitFile(`${src}.${getCssSuffix()}`, genStyle(name, pageType, src, style))
  } else if (pageType === 'component') {
    config.component = true
    const hashHame = getHashNameBySrc(resourcePath)
    const xmlSrc = path.join('components', hashHame)
    emitFile(`${xmlSrc}.js`, genScript(name, pageType, src))
    emitFile(`${xmlSrc}.${getXmlSuffix()}`, htmlBeaufify(componentXml))
    emitFile(`${xmlSrc}.json`, JSON.stringify(config, null, '  '))
    emitFile(`${xmlSrc}.${getCssSuffix()}`, genStyle(name, pageType, src, style))
  }
  return metadata.components || {}
}

/**
 * ast 生成 xml
 * @param compiled
 * @returns {*|string|*|string}
 */
function genComponentXml (compiled) {
  const { code } = duvCompiler.compileToWxml(compiled, {})
  return code
}
/**
 * vue生成xml
 * @param html
 */
async function compileTemplate (html, script, style) {
  const compiled = duvCompiler.compile(html.content)
  const { resourcePath, emitError } = this
  if (compiled.errors && compiled.errors.length > 0) {
    for (let i = 0; i < compiled.errors.length; i++) {
      emitError(`
            error file : ${resourcePath}
            error message : ${compiled.errors[i]}
            `)
    }
  }
  return await compileToXml.call(this, compiled, html, script, style)
}
module.exports = {
  compileEntry,
  compileTemplate
}

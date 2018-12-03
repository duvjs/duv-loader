const path = require('path')
const pagesNameMap = Object.create(null)

function cacheFileInfo (resourcePath, ...arg) {
  pagesNameMap[resourcePath] = Object.assign({}, pagesNameMap[resourcePath], ...arg)
}
function getFileInfo (resourcePath) {
  return pagesNameMap[resourcePath] || {}
}

function getKeyPathMaps (val, obj) {
  for (const i in obj) {
    if (obj[i] === val) {
      return i
    }
  }
}

function getResourcePathInfo (resourcePath, entry) {
  const sourceName = getKeyPathMaps(resourcePath, entry)
  let pageType = '' // page component
  let src = ''
  const name = sourceName || getNameByFile(resourcePath)

  // 如果name是app 则此文件为page
  if (sourceName === 'app') {
    pageType = 'app'
    src = 'app'
  } else if (sourceName) {
    pageType = getTypeByFile(resourcePath)
    src = name
  }
  return { pageType, src, name }
}
function getNameByFile (dir) {
  const arr = dir.match(/(pages|components)\/(.*?)\//)
  if (arr && arr[2]) {
    return arr[2]
  }
  return path.parse(dir).name
}
function getTypeByFile (dir) {
  const arr = dir.match(/(page|component)s\/(.*?)\//)
  if (arr && arr[1]) {
    return arr[1]
  }
}
function getPathPrefix (src) {
  const length = src.split('/').length - 1
  return `${'../'.repeat(length)}`
}

const hash = require('hash-sum')
const cache = Object.create(null)
function getHashNameBySrc (file) {
  return cache[file] || (cache[file] = `${getNameByFile(file)}-${hash(file)}`)
}
function getXmlSuffix () {
  let htmlSuffix = 'html'
  if (global.duvType === 'wx') {
    htmlSuffix = 'wxml'
  } else if (global.duvType === 'bd') {
    htmlSuffix = 'swan'
  }
  return htmlSuffix
}
function getCssSuffix () {
  let htmlSuffix = 'css'
  if (global.duvType === 'wx') {
    htmlSuffix = 'wxss'
  } else if (global.duvType === 'bd') {
    htmlSuffix = 'css'
  }
  return htmlSuffix
}
function resolveSrc (resolveSrc, context, src) {
  return new Promise(function (resolve, reject) {
    resolveSrc(context, src, (err, resultSrc) => {
      if (err) {
        reject(err)
      } else {
        resolve(resultSrc)
      }
    })
  })
}
module.exports = {
  cacheFileInfo,
  getFileInfo,
  getResourcePathInfo,
  getHashNameBySrc,
  getXmlSuffix,
  getCssSuffix,
  getPathPrefix,
  resolveSrc
}

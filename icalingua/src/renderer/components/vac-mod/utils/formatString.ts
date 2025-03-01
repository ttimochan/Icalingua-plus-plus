import * as linkify from 'linkifyjs'

linkify.registerCustomProtocol('mqqapi')
linkify.registerCustomProtocol('qqapi')
linkify.registerCustomProtocol('icalingua')

export default (text, doLinkify) => {
    const json = compileToJSON(text, doLinkify)

    const html = compileToHTML(json)

    const flatten = flattenResult(html)

    const result = [].concat.apply([], flatten)

    markdownResult(result)

    if (doLinkify) linkifyResult(result)

    return result
}

const typeMarkdown = {
    bold: '*',
    italic: '_',
    strike: '~',
    underline: '°',
}

const pseudoMarkdown = {
    '[Face: ': {
        end: ']',
        allowed_chars: '\\d',
        type: 'face',
    },
    '[Forward: ': {
        end: ']',
        allowed_chars: '.',
        type: 'forward',
    },
    '[NestedForward: ': {
        end: ']',
        allowed_chars: '.',
        type: 'nestedforward',
    },
    '<IcalinguaAt qq=': {
        end: '</IcalinguaAt>',
        allowed_chars: '.',
        type: 'at',
    },
    '\n': {
        type: 'breakLine',
    },
}

function compileToJSON(str, doLinkify) {
    let result = []
    let minIndexOf = -1
    let minIndexOfKey = null

    str = replaceNoLinkifyCharacters(str)

    let links = doLinkify ? linkify.find(str) : []
    let minIndexFromLink = false

    str = recoverNoLinkifyCharacters(str)

    if (links.length > 0) {
        minIndexOf = str.indexOf(links[0].value)
        minIndexFromLink = true
    }

    Object.keys(pseudoMarkdown).forEach((startingValue) => {
        const io = str.indexOf(startingValue)
        if (io >= 0 && (minIndexOf < 0 || io < minIndexOf)) {
            minIndexOf = io
            minIndexOfKey = startingValue
            minIndexFromLink = false
        }
    })

    if (minIndexFromLink && minIndexOfKey !== -1) {
        let strLeft = str.substr(0, minIndexOf)
        let strLink = str.substr(minIndexOf, links[0].value.length)
        let strRight = str.substr(minIndexOf + links[0].value.length)
        result.push(strLeft)
        result.push(strLink)
        result = result.concat(compileToJSON(strRight, doLinkify))
        return result
    }

    if (minIndexOfKey) {
        let strLeft = str.substr(0, minIndexOf)
        const char = minIndexOfKey
        let strRight = str.substr(minIndexOf + char.length)

        const match = strRight.match(
            new RegExp(
                '^(' +
                    (pseudoMarkdown[char].allowed_chars || '.') +
                    '*' +
                    (pseudoMarkdown[char].end ? '?' : '') +
                    ')' +
                    (pseudoMarkdown[char].end ? '(' + pseudoMarkdown[char].end + ')' : ''),
                'm',
            ),
        )
        if (!match) {
            strLeft = strLeft + char
            result.push(strLeft)
        } else {
            if (strLeft) {
                result.push(strLeft)
            }
            const object = {
                start: char,
                content: compileToJSON(match[1], false),
                end: match[2],
                type: pseudoMarkdown[char].type,
            }
            result.push(object)
            strRight = strRight.substr(match[0].length)
        }
        result = result.concat(compileToJSON(strRight, doLinkify))
        return result
    } else {
        if (str) {
            return [str]
        } else {
            return []
        }
    }
}

function compileToHTML(json) {
    const result = []

    json.forEach((item) => {
        if (typeof item === 'string') {
            result.push({ types: [], value: item })
        } else {
            if (pseudoMarkdown[item.start]) {
                result.push(parseContent(item))
            }
        }
    })

    return result
}

function parseContent(item) {
    const result = []

    for (let j = 0; j < item.content.length; j++) {
        const it = item.content[j]
        if (typeof it === 'string') {
            result.push({
                types: j === 0 ? [item.type] : '',
                value: it,
            })
        } else {
            for (let i = 0; i < it.content.length; i++) {
                let types = []
                if (i === 0) {
                    types = types.concat([it.type])
                    if (j === 0) types = types.concat([item.type])
                }
                if (typeof it.content[i] === 'string') {
                    result.push({
                        types: types,
                        value: it.content[i],
                    })
                } else {
                    types = [it.content[i].type].concat(types)
                    result.push({
                        types: types,
                        value: parseContent(i),
                    })
                }
            }
        }
    }
    if (item.content.length === 0 && item.start === '\n') {
        result.push({
            types: [item.type],
            value: '',
        })
    }

    return result
}

function flattenResult(array, types = []) {
    const result = []

    array.forEach((arr) => {
        if (typeof arr.value === 'string') {
            arr.types = arr.types.concat(types)
            result.push(arr)
        } else {
            arr.forEach((a) => {
                if (typeof a.value === 'string') {
                    a.types = a.types.concat(types)
                    result.push(a)
                } else {
                    result.push(flattenResult(a.value, a.types))
                }
            })
        }
    })

    return result
}

function markdownResult(array) {
    for (let i = 0; i < array.length; i) {
        if (array[i - 1]) {
            const isInline =
                array[i].types.indexOf('inline-code') !== -1 && array[i - 1].types.indexOf('inline-code') !== -1

            const isMultiline =
                array[i].types.indexOf('multiline-code') !== -1 && array[i - 1].types.indexOf('multiline-code') !== -1

            if (isInline || isMultiline) {
                let value = array[i].value
                array[i].types.forEach((type) => {
                    const markdown = typeMarkdown[type] || ''
                    value = markdown + value + markdown
                })

                array[i - 1].value = array[i - 1].value + value

                array.splice(i, 1)
            } else {
                i++
            }
        } else {
            i++
        }
    }
}

function linkifyResult(array) {
    const result = []

    array.forEach((arr) => {
        arr.value = replaceNoLinkifyCharacters(arr.value)
        const links = linkify.find(arr.value)
        arr.value = recoverNoLinkifyCharacters(arr.value)

        if (links.length && arr.types.length === 0) {
            const spaces = arr.value.replace(links[0].value, '')
            result.push({ types: arr.types, value: spaces })

            arr.types = ['url'].concat(arr.types)
            arr.href = links[0].href
            arr.value = links[0].value
        }

        result.push(arr)
    })

    return result
}

const noLinkifyRegexs = [
    /\[Face: +\d{1,3}]/g,
    /<IcalinguaAt qq=\d+>[^<]+<\/IcalinguaAt>/g, //at 不要当作链接一部分
    /[^\x00-\xff]+/g, //中文和全角符号不要当作链接一部分
    /"/g, //引号不要当作链接一部分
]
const replacements = [] //存储替换数据的起始位置、结束位置、替换内容
function replaceNoLinkifyCharacters(str) {
    let array //接受正则表达式的返回值
    const replaceCharacter = (string: string, index: number, lastIndex: number, replacement: string): string => {
        return string.slice(0, index) + replacement + str.slice(lastIndex)
    }
    for (let regex of noLinkifyRegexs) {
        while ((array = regex.exec(str)) !== null) {
            const index: number = array.index
            const lastIndex: number = regex.lastIndex
            const replacement: string = array[0]
            replacements.push({
                index,
                lastIndex,
                replacement,
            })
            str = replaceCharacter(str, index, lastIndex, ' '.repeat(replacement.length))
        }
    }
    return str
}

function recoverNoLinkifyCharacters(str) {
    const replaceCharacter = (string: string, index: number, lastIndex: number, replacement: string): string => {
        return string.slice(0, index) + replacement + str.slice(lastIndex)
    }
    for (const { index, lastIndex, replacement } of replacements) {
        //恢复被替换的数据
        str = replaceCharacter(str, index, lastIndex, replacement)
    }
    replacements.length = 0
    return str
}

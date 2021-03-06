
import { YText, YXmlTextRefID } from '../internals.js'

import * as encoding from 'lib0/encoding.js'
import * as decoding from 'lib0/decoding.js' // eslint-disable-line

/**
 * Represents text in a Dom Element. In the future this type will also handle
 * simple formatting information like bold and italic.
 */
export class YXmlText extends YText {
  _copy () {
    return new YXmlText()
  }
  /**
   * Creates a Dom Element that mirrors this YXmlText.
   *
   * @param {Document} [_document=document] The document object (you must define
   *                                        this when calling this method in
   *                                        nodejs)
   * @param {Object<string, any>} [hooks] Optional property to customize how hooks
   *                                             are presented in the DOM
   * @param {any} [binding] You should not set this property. This is
   *                               used if DomBinding wants to create a
   *                               association to the created DOM type.
   * @return {Text} The {@link https://developer.mozilla.org/en-US/docs/Web/API/Element|Dom Element}
   *
   * @public
   */
  toDOM (_document = document, hooks, binding) {
    const dom = _document.createTextNode(this.toString())
    if (binding !== undefined) {
      binding._createAssociation(dom, this)
    }
    return dom
  }

  toString () {
    // @ts-ignore
    return this.toDelta().map(delta => {
      const nestedNodes = []
      for (let nodeName in delta.attributes) {
        const attrs = []
        for (let key in delta.attributes[nodeName]) {
          attrs.push({ key, value: delta.attributes[nodeName][key] })
        }
        // sort attributes to get a unique order
        attrs.sort((a, b) => a.key < b.key ? -1 : 1)
        nestedNodes.push({ nodeName, attrs })
      }
      // sort node order to get a unique order
      nestedNodes.sort((a, b) => a.nodeName < b.nodeName ? -1 : 1)
      // now convert to dom string
      let str = ''
      for (let i = 0; i < nestedNodes.length; i++) {
        const node = nestedNodes[i]
        str += `<${node.nodeName}`
        for (let j = 0; j < node.attrs.length; j++) {
          const attr = node.attrs[i]
          str += ` ${attr.key}="${attr.value}"`
        }
        str += '>'
      }
      str += delta.insert
      for (let i = nestedNodes.length - 1; i >= 0; i--) {
        str += `</${nestedNodes[i].nodeName}>`
      }
      return str
    }).join('')
  }

  toJSON () {
    return this.toString()
  }

  /**
   * @param {encoding.Encoder} encoder
   *
   * @private
   */
  _write (encoder) {
    encoding.writeVarUint(encoder, YXmlTextRefID)
  }
}

/**
 * @param {decoding.Decoder} decoder
 * @return {YXmlText}
 *
 * @private
 * @function
 */
export const readYXmlText = decoder => new YXmlText()

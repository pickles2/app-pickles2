(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var lookup = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

;(function (exports) {
	'use strict';

  var Arr = (typeof Uint8Array !== 'undefined')
    ? Uint8Array
    : Array

	var PLUS   = '+'.charCodeAt(0)
	var SLASH  = '/'.charCodeAt(0)
	var NUMBER = '0'.charCodeAt(0)
	var LOWER  = 'a'.charCodeAt(0)
	var UPPER  = 'A'.charCodeAt(0)
	var PLUS_URL_SAFE = '-'.charCodeAt(0)
	var SLASH_URL_SAFE = '_'.charCodeAt(0)

	function decode (elt) {
		var code = elt.charCodeAt(0)
		if (code === PLUS ||
		    code === PLUS_URL_SAFE)
			return 62 // '+'
		if (code === SLASH ||
		    code === SLASH_URL_SAFE)
			return 63 // '/'
		if (code < NUMBER)
			return -1 //no match
		if (code < NUMBER + 10)
			return code - NUMBER + 26 + 26
		if (code < UPPER + 26)
			return code - UPPER
		if (code < LOWER + 26)
			return code - LOWER + 26
	}

	function b64ToByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr

		if (b64.length % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}

		// the number of equal signs (place holders)
		// if there are two placeholders, than the two characters before it
		// represent one byte
		// if there is only one, then the three characters before it represent 2 bytes
		// this is just a cheap hack to not do indexOf twice
		var len = b64.length
		placeHolders = '=' === b64.charAt(len - 2) ? 2 : '=' === b64.charAt(len - 1) ? 1 : 0

		// base64 is 4/3 + up to two characters of the original data
		arr = new Arr(b64.length * 3 / 4 - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? b64.length - 4 : b64.length

		var L = 0

		function push (v) {
			arr[L++] = v
		}

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (decode(b64.charAt(i)) << 18) | (decode(b64.charAt(i + 1)) << 12) | (decode(b64.charAt(i + 2)) << 6) | decode(b64.charAt(i + 3))
			push((tmp & 0xFF0000) >> 16)
			push((tmp & 0xFF00) >> 8)
			push(tmp & 0xFF)
		}

		if (placeHolders === 2) {
			tmp = (decode(b64.charAt(i)) << 2) | (decode(b64.charAt(i + 1)) >> 4)
			push(tmp & 0xFF)
		} else if (placeHolders === 1) {
			tmp = (decode(b64.charAt(i)) << 10) | (decode(b64.charAt(i + 1)) << 4) | (decode(b64.charAt(i + 2)) >> 2)
			push((tmp >> 8) & 0xFF)
			push(tmp & 0xFF)
		}

		return arr
	}

	function uint8ToBase64 (uint8) {
		var i,
			extraBytes = uint8.length % 3, // if we have 1 byte left, pad 2 bytes
			output = "",
			temp, length

		function encode (num) {
			return lookup.charAt(num)
		}

		function tripletToBase64 (num) {
			return encode(num >> 18 & 0x3F) + encode(num >> 12 & 0x3F) + encode(num >> 6 & 0x3F) + encode(num & 0x3F)
		}

		// go through the array every three bytes, we'll deal with trailing stuff later
		for (i = 0, length = uint8.length - extraBytes; i < length; i += 3) {
			temp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2])
			output += tripletToBase64(temp)
		}

		// pad the end with zeros, but make sure to not forget the extra bytes
		switch (extraBytes) {
			case 1:
				temp = uint8[uint8.length - 1]
				output += encode(temp >> 2)
				output += encode((temp << 4) & 0x3F)
				output += '=='
				break
			case 2:
				temp = (uint8[uint8.length - 2] << 8) + (uint8[uint8.length - 1])
				output += encode(temp >> 10)
				output += encode((temp >> 4) & 0x3F)
				output += encode((temp << 2) & 0x3F)
				output += '='
				break
		}

		return output
	}

	exports.toByteArray = b64ToByteArray
	exports.fromByteArray = uint8ToBase64
}(typeof exports === 'undefined' ? (this.base64js = {}) : exports))

},{}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = Buffer
exports.INSPECT_MAX_BYTES = 50
Buffer.poolSize = 8192

/**
 * If `Buffer._useTypedArrays`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Use Object implementation (compatible down to IE6)
 */
Buffer._useTypedArrays = (function () {
  // Detect if browser supports Typed Arrays. Supported browsers are IE 10+, Firefox 4+,
  // Chrome 7+, Safari 5.1+, Opera 11.6+, iOS 4.2+. If the browser does not support adding
  // properties to `Uint8Array` instances, then that's the same as no `Uint8Array` support
  // because we need to be able to add all the node Buffer API methods. This is an issue
  // in Firefox 4-29. Now fixed: https://bugzilla.mozilla.org/show_bug.cgi?id=695438
  try {
    var buf = new ArrayBuffer(0)
    var arr = new Uint8Array(buf)
    arr.foo = function () { return 42 }
    return 42 === arr.foo() &&
        typeof arr.subarray === 'function' // Chrome 9-10 lack `subarray`
  } catch (e) {
    return false
  }
})()

/**
 * Class: Buffer
 * =============
 *
 * The Buffer constructor returns instances of `Uint8Array` that are augmented
 * with function properties for all the node `Buffer` API functions. We use
 * `Uint8Array` so that square bracket notation works as expected -- it returns
 * a single octet.
 *
 * By augmenting the instances, we can avoid modifying the `Uint8Array`
 * prototype.
 */
function Buffer (subject, encoding, noZero) {
  if (!(this instanceof Buffer))
    return new Buffer(subject, encoding, noZero)

  var type = typeof subject

  // Workaround: node's base64 implementation allows for non-padded strings
  // while base64-js does not.
  if (encoding === 'base64' && type === 'string') {
    subject = stringtrim(subject)
    while (subject.length % 4 !== 0) {
      subject = subject + '='
    }
  }

  // Find the length
  var length
  if (type === 'number')
    length = coerce(subject)
  else if (type === 'string')
    length = Buffer.byteLength(subject, encoding)
  else if (type === 'object')
    length = coerce(subject.length) // assume that object is array-like
  else
    throw new Error('First argument needs to be a number, array or string.')

  var buf
  if (Buffer._useTypedArrays) {
    // Preferred: Return an augmented `Uint8Array` instance for best performance
    buf = Buffer._augment(new Uint8Array(length))
  } else {
    // Fallback: Return THIS instance of Buffer (created by `new`)
    buf = this
    buf.length = length
    buf._isBuffer = true
  }

  var i
  if (Buffer._useTypedArrays && typeof subject.byteLength === 'number') {
    // Speed optimization -- use set if we're copying from a typed array
    buf._set(subject)
  } else if (isArrayish(subject)) {
    // Treat array-ish objects as a byte array
    for (i = 0; i < length; i++) {
      if (Buffer.isBuffer(subject))
        buf[i] = subject.readUInt8(i)
      else
        buf[i] = subject[i]
    }
  } else if (type === 'string') {
    buf.write(subject, 0, encoding)
  } else if (type === 'number' && !Buffer._useTypedArrays && !noZero) {
    for (i = 0; i < length; i++) {
      buf[i] = 0
    }
  }

  return buf
}

// STATIC METHODS
// ==============

Buffer.isEncoding = function (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'binary':
    case 'base64':
    case 'raw':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.isBuffer = function (b) {
  return !!(b !== null && b !== undefined && b._isBuffer)
}

Buffer.byteLength = function (str, encoding) {
  var ret
  str = str + ''
  switch (encoding || 'utf8') {
    case 'hex':
      ret = str.length / 2
      break
    case 'utf8':
    case 'utf-8':
      ret = utf8ToBytes(str).length
      break
    case 'ascii':
    case 'binary':
    case 'raw':
      ret = str.length
      break
    case 'base64':
      ret = base64ToBytes(str).length
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = str.length * 2
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.concat = function (list, totalLength) {
  assert(isArray(list), 'Usage: Buffer.concat(list, [totalLength])\n' +
      'list should be an Array.')

  if (list.length === 0) {
    return new Buffer(0)
  } else if (list.length === 1) {
    return list[0]
  }

  var i
  if (typeof totalLength !== 'number') {
    totalLength = 0
    for (i = 0; i < list.length; i++) {
      totalLength += list[i].length
    }
  }

  var buf = new Buffer(totalLength)
  var pos = 0
  for (i = 0; i < list.length; i++) {
    var item = list[i]
    item.copy(buf, pos)
    pos += item.length
  }
  return buf
}

// BUFFER INSTANCE METHODS
// =======================

function _hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  // must be an even number of digits
  var strLen = string.length
  assert(strLen % 2 === 0, 'Invalid hex string')

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; i++) {
    var byte = parseInt(string.substr(i * 2, 2), 16)
    assert(!isNaN(byte), 'Invalid hex string')
    buf[offset + i] = byte
  }
  Buffer._charsWritten = i * 2
  return i
}

function _utf8Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf8ToBytes(string), buf, offset, length)
  return charsWritten
}

function _asciiWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(asciiToBytes(string), buf, offset, length)
  return charsWritten
}

function _binaryWrite (buf, string, offset, length) {
  return _asciiWrite(buf, string, offset, length)
}

function _base64Write (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(base64ToBytes(string), buf, offset, length)
  return charsWritten
}

function _utf16leWrite (buf, string, offset, length) {
  var charsWritten = Buffer._charsWritten =
    blitBuffer(utf16leToBytes(string), buf, offset, length)
  return charsWritten
}

Buffer.prototype.write = function (string, offset, length, encoding) {
  // Support both (string, offset, length, encoding)
  // and the legacy (string, encoding, offset, length)
  if (isFinite(offset)) {
    if (!isFinite(length)) {
      encoding = length
      length = undefined
    }
  } else {  // legacy
    var swap = encoding
    encoding = offset
    offset = length
    length = swap
  }

  offset = Number(offset) || 0
  var remaining = this.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }
  encoding = String(encoding || 'utf8').toLowerCase()

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexWrite(this, string, offset, length)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Write(this, string, offset, length)
      break
    case 'ascii':
      ret = _asciiWrite(this, string, offset, length)
      break
    case 'binary':
      ret = _binaryWrite(this, string, offset, length)
      break
    case 'base64':
      ret = _base64Write(this, string, offset, length)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leWrite(this, string, offset, length)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toString = function (encoding, start, end) {
  var self = this

  encoding = String(encoding || 'utf8').toLowerCase()
  start = Number(start) || 0
  end = (end !== undefined)
    ? Number(end)
    : end = self.length

  // Fastpath empty strings
  if (end === start)
    return ''

  var ret
  switch (encoding) {
    case 'hex':
      ret = _hexSlice(self, start, end)
      break
    case 'utf8':
    case 'utf-8':
      ret = _utf8Slice(self, start, end)
      break
    case 'ascii':
      ret = _asciiSlice(self, start, end)
      break
    case 'binary':
      ret = _binarySlice(self, start, end)
      break
    case 'base64':
      ret = _base64Slice(self, start, end)
      break
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      ret = _utf16leSlice(self, start, end)
      break
    default:
      throw new Error('Unknown encoding')
  }
  return ret
}

Buffer.prototype.toJSON = function () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function (target, target_start, start, end) {
  var source = this

  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (!target_start) target_start = 0

  // Copy 0 bytes; we're done
  if (end === start) return
  if (target.length === 0 || source.length === 0) return

  // Fatal error conditions
  assert(end >= start, 'sourceEnd < sourceStart')
  assert(target_start >= 0 && target_start < target.length,
      'targetStart out of bounds')
  assert(start >= 0 && start < source.length, 'sourceStart out of bounds')
  assert(end >= 0 && end <= source.length, 'sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length)
    end = this.length
  if (target.length - target_start < end - start)
    end = target.length - target_start + start

  var len = end - start

  if (len < 100 || !Buffer._useTypedArrays) {
    for (var i = 0; i < len; i++)
      target[i + target_start] = this[i + start]
  } else {
    target._set(this.subarray(start, start + len), target_start)
  }
}

function _base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function _utf8Slice (buf, start, end) {
  var res = ''
  var tmp = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++) {
    if (buf[i] <= 0x7F) {
      res += decodeUtf8Char(tmp) + String.fromCharCode(buf[i])
      tmp = ''
    } else {
      tmp += '%' + buf[i].toString(16)
    }
  }

  return res + decodeUtf8Char(tmp)
}

function _asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; i++)
    ret += String.fromCharCode(buf[i])
  return ret
}

function _binarySlice (buf, start, end) {
  return _asciiSlice(buf, start, end)
}

function _hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; i++) {
    out += toHex(buf[i])
  }
  return out
}

function _utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + bytes[i+1] * 256)
  }
  return res
}

Buffer.prototype.slice = function (start, end) {
  var len = this.length
  start = clamp(start, len, 0)
  end = clamp(end, len, len)

  if (Buffer._useTypedArrays) {
    return Buffer._augment(this.subarray(start, end))
  } else {
    var sliceLen = end - start
    var newBuf = new Buffer(sliceLen, undefined, true)
    for (var i = 0; i < sliceLen; i++) {
      newBuf[i] = this[i + start]
    }
    return newBuf
  }
}

// `get` will be removed in Node 0.13+
Buffer.prototype.get = function (offset) {
  console.log('.get() is deprecated. Access using array indexes instead.')
  return this.readUInt8(offset)
}

// `set` will be removed in Node 0.13+
Buffer.prototype.set = function (v, offset) {
  console.log('.set() is deprecated. Access using array indexes instead.')
  return this.writeUInt8(v, offset)
}

Buffer.prototype.readUInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  return this[offset]
}

function _readUInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    val = buf[offset]
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
  } else {
    val = buf[offset] << 8
    if (offset + 1 < len)
      val |= buf[offset + 1]
  }
  return val
}

Buffer.prototype.readUInt16LE = function (offset, noAssert) {
  return _readUInt16(this, offset, true, noAssert)
}

Buffer.prototype.readUInt16BE = function (offset, noAssert) {
  return _readUInt16(this, offset, false, noAssert)
}

function _readUInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val
  if (littleEndian) {
    if (offset + 2 < len)
      val = buf[offset + 2] << 16
    if (offset + 1 < len)
      val |= buf[offset + 1] << 8
    val |= buf[offset]
    if (offset + 3 < len)
      val = val + (buf[offset + 3] << 24 >>> 0)
  } else {
    if (offset + 1 < len)
      val = buf[offset + 1] << 16
    if (offset + 2 < len)
      val |= buf[offset + 2] << 8
    if (offset + 3 < len)
      val |= buf[offset + 3]
    val = val + (buf[offset] << 24 >>> 0)
  }
  return val
}

Buffer.prototype.readUInt32LE = function (offset, noAssert) {
  return _readUInt32(this, offset, true, noAssert)
}

Buffer.prototype.readUInt32BE = function (offset, noAssert) {
  return _readUInt32(this, offset, false, noAssert)
}

Buffer.prototype.readInt8 = function (offset, noAssert) {
  if (!noAssert) {
    assert(offset !== undefined && offset !== null,
        'missing offset')
    assert(offset < this.length, 'Trying to read beyond buffer length')
  }

  if (offset >= this.length)
    return

  var neg = this[offset] & 0x80
  if (neg)
    return (0xff - this[offset] + 1) * -1
  else
    return this[offset]
}

function _readInt16 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt16(buf, offset, littleEndian, true)
  var neg = val & 0x8000
  if (neg)
    return (0xffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt16LE = function (offset, noAssert) {
  return _readInt16(this, offset, true, noAssert)
}

Buffer.prototype.readInt16BE = function (offset, noAssert) {
  return _readInt16(this, offset, false, noAssert)
}

function _readInt32 (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  var len = buf.length
  if (offset >= len)
    return

  var val = _readUInt32(buf, offset, littleEndian, true)
  var neg = val & 0x80000000
  if (neg)
    return (0xffffffff - val + 1) * -1
  else
    return val
}

Buffer.prototype.readInt32LE = function (offset, noAssert) {
  return _readInt32(this, offset, true, noAssert)
}

Buffer.prototype.readInt32BE = function (offset, noAssert) {
  return _readInt32(this, offset, false, noAssert)
}

function _readFloat (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 3 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 23, 4)
}

Buffer.prototype.readFloatLE = function (offset, noAssert) {
  return _readFloat(this, offset, true, noAssert)
}

Buffer.prototype.readFloatBE = function (offset, noAssert) {
  return _readFloat(this, offset, false, noAssert)
}

function _readDouble (buf, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset + 7 < buf.length, 'Trying to read beyond buffer length')
  }

  return ieee754.read(buf, offset, littleEndian, 52, 8)
}

Buffer.prototype.readDoubleLE = function (offset, noAssert) {
  return _readDouble(this, offset, true, noAssert)
}

Buffer.prototype.readDoubleBE = function (offset, noAssert) {
  return _readDouble(this, offset, false, noAssert)
}

Buffer.prototype.writeUInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'trying to write beyond buffer length')
    verifuint(value, 0xff)
  }

  if (offset >= this.length) return

  this[offset] = value
}

function _writeUInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 2); i < j; i++) {
    buf[offset + i] =
        (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
            (littleEndian ? i : 1 - i) * 8
  }
}

Buffer.prototype.writeUInt16LE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt16BE = function (value, offset, noAssert) {
  _writeUInt16(this, value, offset, false, noAssert)
}

function _writeUInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'trying to write beyond buffer length')
    verifuint(value, 0xffffffff)
  }

  var len = buf.length
  if (offset >= len)
    return

  for (var i = 0, j = Math.min(len - offset, 4); i < j; i++) {
    buf[offset + i] =
        (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff
  }
}

Buffer.prototype.writeUInt32LE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeUInt32BE = function (value, offset, noAssert) {
  _writeUInt32(this, value, offset, false, noAssert)
}

Buffer.prototype.writeInt8 = function (value, offset, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset < this.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7f, -0x80)
  }

  if (offset >= this.length)
    return

  if (value >= 0)
    this.writeUInt8(value, offset, noAssert)
  else
    this.writeUInt8(0xff + value + 1, offset, noAssert)
}

function _writeInt16 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 1 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fff, -0x8000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt16(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt16(buf, 0xffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt16LE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt16BE = function (value, offset, noAssert) {
  _writeInt16(this, value, offset, false, noAssert)
}

function _writeInt32 (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifsint(value, 0x7fffffff, -0x80000000)
  }

  var len = buf.length
  if (offset >= len)
    return

  if (value >= 0)
    _writeUInt32(buf, value, offset, littleEndian, noAssert)
  else
    _writeUInt32(buf, 0xffffffff + value + 1, offset, littleEndian, noAssert)
}

Buffer.prototype.writeInt32LE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, true, noAssert)
}

Buffer.prototype.writeInt32BE = function (value, offset, noAssert) {
  _writeInt32(this, value, offset, false, noAssert)
}

function _writeFloat (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 3 < buf.length, 'Trying to write beyond buffer length')
    verifIEEE754(value, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 23, 4)
}

Buffer.prototype.writeFloatLE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function (value, offset, noAssert) {
  _writeFloat(this, value, offset, false, noAssert)
}

function _writeDouble (buf, value, offset, littleEndian, noAssert) {
  if (!noAssert) {
    assert(value !== undefined && value !== null, 'missing value')
    assert(typeof littleEndian === 'boolean', 'missing or invalid endian')
    assert(offset !== undefined && offset !== null, 'missing offset')
    assert(offset + 7 < buf.length,
        'Trying to write beyond buffer length')
    verifIEEE754(value, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }

  var len = buf.length
  if (offset >= len)
    return

  ieee754.write(buf, value, offset, littleEndian, 52, 8)
}

Buffer.prototype.writeDoubleLE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function (value, offset, noAssert) {
  _writeDouble(this, value, offset, false, noAssert)
}

// fill(value, start=0, end=buffer.length)
Buffer.prototype.fill = function (value, start, end) {
  if (!value) value = 0
  if (!start) start = 0
  if (!end) end = this.length

  if (typeof value === 'string') {
    value = value.charCodeAt(0)
  }

  assert(typeof value === 'number' && !isNaN(value), 'value is not a number')
  assert(end >= start, 'end < start')

  // Fill 0 bytes; we're done
  if (end === start) return
  if (this.length === 0) return

  assert(start >= 0 && start < this.length, 'start out of bounds')
  assert(end >= 0 && end <= this.length, 'end out of bounds')

  for (var i = start; i < end; i++) {
    this[i] = value
  }
}

Buffer.prototype.inspect = function () {
  var out = []
  var len = this.length
  for (var i = 0; i < len; i++) {
    out[i] = toHex(this[i])
    if (i === exports.INSPECT_MAX_BYTES) {
      out[i + 1] = '...'
      break
    }
  }
  return '<Buffer ' + out.join(' ') + '>'
}

/**
 * Creates a new `ArrayBuffer` with the *copied* memory of the buffer instance.
 * Added in Node 0.12. Only available in browsers that support ArrayBuffer.
 */
Buffer.prototype.toArrayBuffer = function () {
  if (typeof Uint8Array !== 'undefined') {
    if (Buffer._useTypedArrays) {
      return (new Buffer(this)).buffer
    } else {
      var buf = new Uint8Array(this.length)
      for (var i = 0, len = buf.length; i < len; i += 1)
        buf[i] = this[i]
      return buf.buffer
    }
  } else {
    throw new Error('Buffer.toArrayBuffer not supported in this browser')
  }
}

// HELPER FUNCTIONS
// ================

function stringtrim (str) {
  if (str.trim) return str.trim()
  return str.replace(/^\s+|\s+$/g, '')
}

var BP = Buffer.prototype

/**
 * Augment a Uint8Array *instance* (not the Uint8Array class!) with Buffer methods
 */
Buffer._augment = function (arr) {
  arr._isBuffer = true

  // save reference to original Uint8Array get/set methods before overwriting
  arr._get = arr.get
  arr._set = arr.set

  // deprecated, will be removed in node 0.13+
  arr.get = BP.get
  arr.set = BP.set

  arr.write = BP.write
  arr.toString = BP.toString
  arr.toLocaleString = BP.toString
  arr.toJSON = BP.toJSON
  arr.copy = BP.copy
  arr.slice = BP.slice
  arr.readUInt8 = BP.readUInt8
  arr.readUInt16LE = BP.readUInt16LE
  arr.readUInt16BE = BP.readUInt16BE
  arr.readUInt32LE = BP.readUInt32LE
  arr.readUInt32BE = BP.readUInt32BE
  arr.readInt8 = BP.readInt8
  arr.readInt16LE = BP.readInt16LE
  arr.readInt16BE = BP.readInt16BE
  arr.readInt32LE = BP.readInt32LE
  arr.readInt32BE = BP.readInt32BE
  arr.readFloatLE = BP.readFloatLE
  arr.readFloatBE = BP.readFloatBE
  arr.readDoubleLE = BP.readDoubleLE
  arr.readDoubleBE = BP.readDoubleBE
  arr.writeUInt8 = BP.writeUInt8
  arr.writeUInt16LE = BP.writeUInt16LE
  arr.writeUInt16BE = BP.writeUInt16BE
  arr.writeUInt32LE = BP.writeUInt32LE
  arr.writeUInt32BE = BP.writeUInt32BE
  arr.writeInt8 = BP.writeInt8
  arr.writeInt16LE = BP.writeInt16LE
  arr.writeInt16BE = BP.writeInt16BE
  arr.writeInt32LE = BP.writeInt32LE
  arr.writeInt32BE = BP.writeInt32BE
  arr.writeFloatLE = BP.writeFloatLE
  arr.writeFloatBE = BP.writeFloatBE
  arr.writeDoubleLE = BP.writeDoubleLE
  arr.writeDoubleBE = BP.writeDoubleBE
  arr.fill = BP.fill
  arr.inspect = BP.inspect
  arr.toArrayBuffer = BP.toArrayBuffer

  return arr
}

// slice(start, end)
function clamp (index, len, defaultValue) {
  if (typeof index !== 'number') return defaultValue
  index = ~~index;  // Coerce to integer.
  if (index >= len) return len
  if (index >= 0) return index
  index += len
  if (index >= 0) return index
  return 0
}

function coerce (length) {
  // Coerce length to a number (possibly NaN), round up
  // in case it's fractional (e.g. 123.456) then do a
  // double negate to coerce a NaN to 0. Easy, right?
  length = ~~Math.ceil(+length)
  return length < 0 ? 0 : length
}

function isArray (subject) {
  return (Array.isArray || function (subject) {
    return Object.prototype.toString.call(subject) === '[object Array]'
  })(subject)
}

function isArrayish (subject) {
  return isArray(subject) || Buffer.isBuffer(subject) ||
      subject && typeof subject === 'object' &&
      typeof subject.length === 'number'
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    var b = str.charCodeAt(i)
    if (b <= 0x7F)
      byteArray.push(str.charCodeAt(i))
    else {
      var start = i
      if (b >= 0xD800 && b <= 0xDFFF) i++
      var h = encodeURIComponent(str.slice(start, i+1)).substr(1).split('%')
      for (var j = 0; j < h.length; j++)
        byteArray.push(parseInt(h[j], 16))
    }
  }
  return byteArray
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; i++) {
    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(str)
}

function blitBuffer (src, dst, offset, length) {
  var pos
  for (var i = 0; i < length; i++) {
    if ((i + offset >= dst.length) || (i >= src.length))
      break
    dst[i + offset] = src[i]
  }
  return i
}

function decodeUtf8Char (str) {
  try {
    return decodeURIComponent(str)
  } catch (err) {
    return String.fromCharCode(0xFFFD) // UTF 8 invalid char
  }
}

/*
 * We have to make sure that the value is a valid integer. This means that it
 * is non-negative. It has no fractional component and that it does not
 * exceed the maximum allowed value.
 */
function verifuint (value, max) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value >= 0, 'specified a negative value for writing an unsigned value')
  assert(value <= max, 'value is larger than maximum value for type')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifsint (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
  assert(Math.floor(value) === value, 'value has a fractional component')
}

function verifIEEE754 (value, max, min) {
  assert(typeof value === 'number', 'cannot write a non-number as a number')
  assert(value <= max, 'value larger than maximum allowed value')
  assert(value >= min, 'value smaller than minimum allowed value')
}

function assert (test, message) {
  if (!test) throw new Error(message || 'Failed assertion')
}

},{"base64-js":1,"ieee754":4}],4:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],5:[function(require,module,exports){
var Buffer = require('buffer').Buffer;
var intSize = 4;
var zeroBuffer = new Buffer(intSize); zeroBuffer.fill(0);
var chrsz = 8;

function toArray(buf, bigEndian) {
  if ((buf.length % intSize) !== 0) {
    var len = buf.length + (intSize - (buf.length % intSize));
    buf = Buffer.concat([buf, zeroBuffer], len);
  }

  var arr = [];
  var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
  for (var i = 0; i < buf.length; i += intSize) {
    arr.push(fn.call(buf, i));
  }
  return arr;
}

function toBuffer(arr, size, bigEndian) {
  var buf = new Buffer(size);
  var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
  for (var i = 0; i < arr.length; i++) {
    fn.call(buf, arr[i], i * 4, true);
  }
  return buf;
}

function hash(buf, fn, hashSize, bigEndian) {
  if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
  var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
  return toBuffer(arr, hashSize, bigEndian);
}

module.exports = { hash: hash };

},{"buffer":3}],6:[function(require,module,exports){
var Buffer = require('buffer').Buffer
var sha = require('./sha')
var sha256 = require('./sha256')
var rng = require('./rng')
var md5 = require('./md5')

var algorithms = {
  sha1: sha,
  sha256: sha256,
  md5: md5
}

var blocksize = 64
var zeroBuffer = new Buffer(blocksize); zeroBuffer.fill(0)
function hmac(fn, key, data) {
  if(!Buffer.isBuffer(key)) key = new Buffer(key)
  if(!Buffer.isBuffer(data)) data = new Buffer(data)

  if(key.length > blocksize) {
    key = fn(key)
  } else if(key.length < blocksize) {
    key = Buffer.concat([key, zeroBuffer], blocksize)
  }

  var ipad = new Buffer(blocksize), opad = new Buffer(blocksize)
  for(var i = 0; i < blocksize; i++) {
    ipad[i] = key[i] ^ 0x36
    opad[i] = key[i] ^ 0x5C
  }

  var hash = fn(Buffer.concat([ipad, data]))
  return fn(Buffer.concat([opad, hash]))
}

function hash(alg, key) {
  alg = alg || 'sha1'
  var fn = algorithms[alg]
  var bufs = []
  var length = 0
  if(!fn) error('algorithm:', alg, 'is not yet supported')
  return {
    update: function (data) {
      if(!Buffer.isBuffer(data)) data = new Buffer(data)
        
      bufs.push(data)
      length += data.length
      return this
    },
    digest: function (enc) {
      var buf = Buffer.concat(bufs)
      var r = key ? hmac(fn, key, buf) : fn(buf)
      bufs = null
      return enc ? r.toString(enc) : r
    }
  }
}

function error () {
  var m = [].slice.call(arguments).join(' ')
  throw new Error([
    m,
    'we accept pull requests',
    'http://github.com/dominictarr/crypto-browserify'
    ].join('\n'))
}

exports.createHash = function (alg) { return hash(alg) }
exports.createHmac = function (alg, key) { return hash(alg, key) }
exports.randomBytes = function(size, callback) {
  if (callback && callback.call) {
    try {
      callback.call(this, undefined, new Buffer(rng(size)))
    } catch (err) { callback(err) }
  } else {
    return new Buffer(rng(size))
  }
}

function each(a, f) {
  for(var i in a)
    f(a[i], i)
}

// the least I can do is make error messages for the rest of the node.js/crypto api.
each(['createCredentials'
, 'createCipher'
, 'createCipheriv'
, 'createDecipher'
, 'createDecipheriv'
, 'createSign'
, 'createVerify'
, 'createDiffieHellman'
, 'pbkdf2'], function (name) {
  exports[name] = function () {
    error('sorry,', name, 'is not implemented yet')
  }
})

},{"./md5":7,"./rng":8,"./sha":9,"./sha256":10,"buffer":3}],7:[function(require,module,exports){
/*
 * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
 * Digest Algorithm, as defined in RFC 1321.
 * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for more info.
 */

var helpers = require('./helpers');

/*
 * Perform a simple self-test to see if the VM is working
 */
function md5_vm_test()
{
  return hex_md5("abc") == "900150983cd24fb0d6963f7d28e17f72";
}

/*
 * Calculate the MD5 of an array of little-endian words, and a bit length
 */
function core_md5(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << ((len) % 32);
  x[(((len + 64) >>> 9) << 4) + 14] = len;

  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;

    a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
    d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
    c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
    b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
    a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
    d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
    c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
    b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
    a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
    d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
    c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
    b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
    a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
    d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
    c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
    b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);

    a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
    d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
    c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
    b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
    a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
    d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
    c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
    b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
    a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
    d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
    c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
    b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
    a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
    d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
    c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
    b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);

    a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
    d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
    c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
    b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
    a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
    d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
    c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
    b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
    a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
    d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
    c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
    b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
    a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
    d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
    c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
    b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);

    a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
    d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
    c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
    b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
    a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
    d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
    c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
    b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
    a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
    d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
    c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
    b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
    a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
    d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
    c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
    b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
  }
  return Array(a, b, c, d);

}

/*
 * These functions implement the four basic operations the algorithm uses.
 */
function md5_cmn(q, a, b, x, s, t)
{
  return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
}
function md5_ff(a, b, c, d, x, s, t)
{
  return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
}
function md5_gg(a, b, c, d, x, s, t)
{
  return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
}
function md5_hh(a, b, c, d, x, s, t)
{
  return md5_cmn(b ^ c ^ d, a, b, x, s, t);
}
function md5_ii(a, b, c, d, x, s, t)
{
  return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function bit_rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function md5(buf) {
  return helpers.hash(buf, core_md5, 16);
};

},{"./helpers":5}],8:[function(require,module,exports){
// Original code adapted from Robert Kieffer.
// details at https://github.com/broofa/node-uuid
(function() {
  var _global = this;

  var mathRNG, whatwgRNG;

  // NOTE: Math.random() does not guarantee "cryptographic quality"
  mathRNG = function(size) {
    var bytes = new Array(size);
    var r;

    for (var i = 0, r; i < size; i++) {
      if ((i & 0x03) == 0) r = Math.random() * 0x100000000;
      bytes[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return bytes;
  }

  if (_global.crypto && crypto.getRandomValues) {
    whatwgRNG = function(size) {
      var bytes = new Uint8Array(size);
      crypto.getRandomValues(bytes);
      return bytes;
    }
  }

  module.exports = whatwgRNG || mathRNG;

}())

},{}],9:[function(require,module,exports){
/*
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
 * in FIPS PUB 180-1
 * Version 2.1a Copyright Paul Johnston 2000 - 2002.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 * Distributed under the BSD License
 * See http://pajhome.org.uk/crypt/md5 for details.
 */

var helpers = require('./helpers');

/*
 * Calculate the SHA-1 of an array of big-endian words, and a bit length
 */
function core_sha1(x, len)
{
  /* append padding */
  x[len >> 5] |= 0x80 << (24 - len % 32);
  x[((len + 64 >> 9) << 4) + 15] = len;

  var w = Array(80);
  var a =  1732584193;
  var b = -271733879;
  var c = -1732584194;
  var d =  271733878;
  var e = -1009589776;

  for(var i = 0; i < x.length; i += 16)
  {
    var olda = a;
    var oldb = b;
    var oldc = c;
    var oldd = d;
    var olde = e;

    for(var j = 0; j < 80; j++)
    {
      if(j < 16) w[j] = x[i + j];
      else w[j] = rol(w[j-3] ^ w[j-8] ^ w[j-14] ^ w[j-16], 1);
      var t = safe_add(safe_add(rol(a, 5), sha1_ft(j, b, c, d)),
                       safe_add(safe_add(e, w[j]), sha1_kt(j)));
      e = d;
      d = c;
      c = rol(b, 30);
      b = a;
      a = t;
    }

    a = safe_add(a, olda);
    b = safe_add(b, oldb);
    c = safe_add(c, oldc);
    d = safe_add(d, oldd);
    e = safe_add(e, olde);
  }
  return Array(a, b, c, d, e);

}

/*
 * Perform the appropriate triplet combination function for the current
 * iteration
 */
function sha1_ft(t, b, c, d)
{
  if(t < 20) return (b & c) | ((~b) & d);
  if(t < 40) return b ^ c ^ d;
  if(t < 60) return (b & c) | (b & d) | (c & d);
  return b ^ c ^ d;
}

/*
 * Determine the appropriate additive constant for the current iteration
 */
function sha1_kt(t)
{
  return (t < 20) ?  1518500249 : (t < 40) ?  1859775393 :
         (t < 60) ? -1894007588 : -899497514;
}

/*
 * Add integers, wrapping at 2^32. This uses 16-bit operations internally
 * to work around bugs in some JS interpreters.
 */
function safe_add(x, y)
{
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
}

/*
 * Bitwise rotate a 32-bit number to the left.
 */
function rol(num, cnt)
{
  return (num << cnt) | (num >>> (32 - cnt));
}

module.exports = function sha1(buf) {
  return helpers.hash(buf, core_sha1, 20, true);
};

},{"./helpers":5}],10:[function(require,module,exports){

/**
 * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
 * in FIPS 180-2
 * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
 * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
 *
 */

var helpers = require('./helpers');

var safe_add = function(x, y) {
  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
  return (msw << 16) | (lsw & 0xFFFF);
};

var S = function(X, n) {
  return (X >>> n) | (X << (32 - n));
};

var R = function(X, n) {
  return (X >>> n);
};

var Ch = function(x, y, z) {
  return ((x & y) ^ ((~x) & z));
};

var Maj = function(x, y, z) {
  return ((x & y) ^ (x & z) ^ (y & z));
};

var Sigma0256 = function(x) {
  return (S(x, 2) ^ S(x, 13) ^ S(x, 22));
};

var Sigma1256 = function(x) {
  return (S(x, 6) ^ S(x, 11) ^ S(x, 25));
};

var Gamma0256 = function(x) {
  return (S(x, 7) ^ S(x, 18) ^ R(x, 3));
};

var Gamma1256 = function(x) {
  return (S(x, 17) ^ S(x, 19) ^ R(x, 10));
};

var core_sha256 = function(m, l) {
  var K = new Array(0x428A2F98,0x71374491,0xB5C0FBCF,0xE9B5DBA5,0x3956C25B,0x59F111F1,0x923F82A4,0xAB1C5ED5,0xD807AA98,0x12835B01,0x243185BE,0x550C7DC3,0x72BE5D74,0x80DEB1FE,0x9BDC06A7,0xC19BF174,0xE49B69C1,0xEFBE4786,0xFC19DC6,0x240CA1CC,0x2DE92C6F,0x4A7484AA,0x5CB0A9DC,0x76F988DA,0x983E5152,0xA831C66D,0xB00327C8,0xBF597FC7,0xC6E00BF3,0xD5A79147,0x6CA6351,0x14292967,0x27B70A85,0x2E1B2138,0x4D2C6DFC,0x53380D13,0x650A7354,0x766A0ABB,0x81C2C92E,0x92722C85,0xA2BFE8A1,0xA81A664B,0xC24B8B70,0xC76C51A3,0xD192E819,0xD6990624,0xF40E3585,0x106AA070,0x19A4C116,0x1E376C08,0x2748774C,0x34B0BCB5,0x391C0CB3,0x4ED8AA4A,0x5B9CCA4F,0x682E6FF3,0x748F82EE,0x78A5636F,0x84C87814,0x8CC70208,0x90BEFFFA,0xA4506CEB,0xBEF9A3F7,0xC67178F2);
  var HASH = new Array(0x6A09E667, 0xBB67AE85, 0x3C6EF372, 0xA54FF53A, 0x510E527F, 0x9B05688C, 0x1F83D9AB, 0x5BE0CD19);
    var W = new Array(64);
    var a, b, c, d, e, f, g, h, i, j;
    var T1, T2;
  /* append padding */
  m[l >> 5] |= 0x80 << (24 - l % 32);
  m[((l + 64 >> 9) << 4) + 15] = l;
  for (var i = 0; i < m.length; i += 16) {
    a = HASH[0]; b = HASH[1]; c = HASH[2]; d = HASH[3]; e = HASH[4]; f = HASH[5]; g = HASH[6]; h = HASH[7];
    for (var j = 0; j < 64; j++) {
      if (j < 16) {
        W[j] = m[j + i];
      } else {
        W[j] = safe_add(safe_add(safe_add(Gamma1256(W[j - 2]), W[j - 7]), Gamma0256(W[j - 15])), W[j - 16]);
      }
      T1 = safe_add(safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]), W[j]);
      T2 = safe_add(Sigma0256(a), Maj(a, b, c));
      h = g; g = f; f = e; e = safe_add(d, T1); d = c; c = b; b = a; a = safe_add(T1, T2);
    }
    HASH[0] = safe_add(a, HASH[0]); HASH[1] = safe_add(b, HASH[1]); HASH[2] = safe_add(c, HASH[2]); HASH[3] = safe_add(d, HASH[3]);
    HASH[4] = safe_add(e, HASH[4]); HASH[5] = safe_add(f, HASH[5]); HASH[6] = safe_add(g, HASH[6]); HASH[7] = safe_add(h, HASH[7]);
  }
  return HASH;
};

module.exports = function sha256(buf) {
  return helpers.hash(buf, core_sha256, 32, true);
};

},{"./helpers":5}],11:[function(require,module,exports){
(function (process,global){
/*!
 * @overview es6-promise - a tiny implementation of Promises/A+.
 * @copyright Copyright (c) 2014 Yehuda Katz, Tom Dale, Stefan Penner and contributors (Conversion to ES6 API by Jake Archibald)
 * @license   Licensed under MIT license
 *            See https://raw.githubusercontent.com/stefanpenner/es6-promise/master/LICENSE
 * @version   3.3.1
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.ES6Promise = factory());
}(this, (function () { 'use strict';

function objectOrFunction(x) {
  return typeof x === 'function' || typeof x === 'object' && x !== null;
}

function isFunction(x) {
  return typeof x === 'function';
}

var _isArray = undefined;
if (!Array.isArray) {
  _isArray = function (x) {
    return Object.prototype.toString.call(x) === '[object Array]';
  };
} else {
  _isArray = Array.isArray;
}

var isArray = _isArray;

var len = 0;
var vertxNext = undefined;
var customSchedulerFn = undefined;

var asap = function asap(callback, arg) {
  queue[len] = callback;
  queue[len + 1] = arg;
  len += 2;
  if (len === 2) {
    // If len is 2, that means that we need to schedule an async flush.
    // If additional callbacks are queued before the queue is flushed, they
    // will be processed by this flush that we are scheduling.
    if (customSchedulerFn) {
      customSchedulerFn(flush);
    } else {
      scheduleFlush();
    }
  }
};

function setScheduler(scheduleFn) {
  customSchedulerFn = scheduleFn;
}

function setAsap(asapFn) {
  asap = asapFn;
}

var browserWindow = typeof window !== 'undefined' ? window : undefined;
var browserGlobal = browserWindow || {};
var BrowserMutationObserver = browserGlobal.MutationObserver || browserGlobal.WebKitMutationObserver;
var isNode = typeof self === 'undefined' && typeof process !== 'undefined' && ({}).toString.call(process) === '[object process]';

// test for web worker but not in IE10
var isWorker = typeof Uint8ClampedArray !== 'undefined' && typeof importScripts !== 'undefined' && typeof MessageChannel !== 'undefined';

// node
function useNextTick() {
  // node version 0.10.x displays a deprecation warning when nextTick is used recursively
  // see https://github.com/cujojs/when/issues/410 for details
  return function () {
    return process.nextTick(flush);
  };
}

// vertx
function useVertxTimer() {
  return function () {
    vertxNext(flush);
  };
}

function useMutationObserver() {
  var iterations = 0;
  var observer = new BrowserMutationObserver(flush);
  var node = document.createTextNode('');
  observer.observe(node, { characterData: true });

  return function () {
    node.data = iterations = ++iterations % 2;
  };
}

// web worker
function useMessageChannel() {
  var channel = new MessageChannel();
  channel.port1.onmessage = flush;
  return function () {
    return channel.port2.postMessage(0);
  };
}

function useSetTimeout() {
  // Store setTimeout reference so es6-promise will be unaffected by
  // other code modifying setTimeout (like sinon.useFakeTimers())
  var globalSetTimeout = setTimeout;
  return function () {
    return globalSetTimeout(flush, 1);
  };
}

var queue = new Array(1000);
function flush() {
  for (var i = 0; i < len; i += 2) {
    var callback = queue[i];
    var arg = queue[i + 1];

    callback(arg);

    queue[i] = undefined;
    queue[i + 1] = undefined;
  }

  len = 0;
}

function attemptVertx() {
  try {
    var r = require;
    var vertx = r('vertx');
    vertxNext = vertx.runOnLoop || vertx.runOnContext;
    return useVertxTimer();
  } catch (e) {
    return useSetTimeout();
  }
}

var scheduleFlush = undefined;
// Decide what async method to use to triggering processing of queued callbacks:
if (isNode) {
  scheduleFlush = useNextTick();
} else if (BrowserMutationObserver) {
  scheduleFlush = useMutationObserver();
} else if (isWorker) {
  scheduleFlush = useMessageChannel();
} else if (browserWindow === undefined && typeof require === 'function') {
  scheduleFlush = attemptVertx();
} else {
  scheduleFlush = useSetTimeout();
}

function then(onFulfillment, onRejection) {
  var _arguments = arguments;

  var parent = this;

  var child = new this.constructor(noop);

  if (child[PROMISE_ID] === undefined) {
    makePromise(child);
  }

  var _state = parent._state;

  if (_state) {
    (function () {
      var callback = _arguments[_state - 1];
      asap(function () {
        return invokeCallback(_state, child, callback, parent._result);
      });
    })();
  } else {
    subscribe(parent, child, onFulfillment, onRejection);
  }

  return child;
}

/**
  `Promise.resolve` returns a promise that will become resolved with the
  passed `value`. It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    resolve(1);
  });

  promise.then(function(value){
    // value === 1
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.resolve(1);

  promise.then(function(value){
    // value === 1
  });
  ```

  @method resolve
  @static
  @param {Any} value value that the returned promise will be resolved with
  Useful for tooling.
  @return {Promise} a promise that will become fulfilled with the given
  `value`
*/
function resolve(object) {
  /*jshint validthis:true */
  var Constructor = this;

  if (object && typeof object === 'object' && object.constructor === Constructor) {
    return object;
  }

  var promise = new Constructor(noop);
  _resolve(promise, object);
  return promise;
}

var PROMISE_ID = Math.random().toString(36).substring(16);

function noop() {}

var PENDING = void 0;
var FULFILLED = 1;
var REJECTED = 2;

var GET_THEN_ERROR = new ErrorObject();

function selfFulfillment() {
  return new TypeError("You cannot resolve a promise with itself");
}

function cannotReturnOwn() {
  return new TypeError('A promises callback cannot return that same promise.');
}

function getThen(promise) {
  try {
    return promise.then;
  } catch (error) {
    GET_THEN_ERROR.error = error;
    return GET_THEN_ERROR;
  }
}

function tryThen(then, value, fulfillmentHandler, rejectionHandler) {
  try {
    then.call(value, fulfillmentHandler, rejectionHandler);
  } catch (e) {
    return e;
  }
}

function handleForeignThenable(promise, thenable, then) {
  asap(function (promise) {
    var sealed = false;
    var error = tryThen(then, thenable, function (value) {
      if (sealed) {
        return;
      }
      sealed = true;
      if (thenable !== value) {
        _resolve(promise, value);
      } else {
        fulfill(promise, value);
      }
    }, function (reason) {
      if (sealed) {
        return;
      }
      sealed = true;

      _reject(promise, reason);
    }, 'Settle: ' + (promise._label || ' unknown promise'));

    if (!sealed && error) {
      sealed = true;
      _reject(promise, error);
    }
  }, promise);
}

function handleOwnThenable(promise, thenable) {
  if (thenable._state === FULFILLED) {
    fulfill(promise, thenable._result);
  } else if (thenable._state === REJECTED) {
    _reject(promise, thenable._result);
  } else {
    subscribe(thenable, undefined, function (value) {
      return _resolve(promise, value);
    }, function (reason) {
      return _reject(promise, reason);
    });
  }
}

function handleMaybeThenable(promise, maybeThenable, then$$) {
  if (maybeThenable.constructor === promise.constructor && then$$ === then && maybeThenable.constructor.resolve === resolve) {
    handleOwnThenable(promise, maybeThenable);
  } else {
    if (then$$ === GET_THEN_ERROR) {
      _reject(promise, GET_THEN_ERROR.error);
    } else if (then$$ === undefined) {
      fulfill(promise, maybeThenable);
    } else if (isFunction(then$$)) {
      handleForeignThenable(promise, maybeThenable, then$$);
    } else {
      fulfill(promise, maybeThenable);
    }
  }
}

function _resolve(promise, value) {
  if (promise === value) {
    _reject(promise, selfFulfillment());
  } else if (objectOrFunction(value)) {
    handleMaybeThenable(promise, value, getThen(value));
  } else {
    fulfill(promise, value);
  }
}

function publishRejection(promise) {
  if (promise._onerror) {
    promise._onerror(promise._result);
  }

  publish(promise);
}

function fulfill(promise, value) {
  if (promise._state !== PENDING) {
    return;
  }

  promise._result = value;
  promise._state = FULFILLED;

  if (promise._subscribers.length !== 0) {
    asap(publish, promise);
  }
}

function _reject(promise, reason) {
  if (promise._state !== PENDING) {
    return;
  }
  promise._state = REJECTED;
  promise._result = reason;

  asap(publishRejection, promise);
}

function subscribe(parent, child, onFulfillment, onRejection) {
  var _subscribers = parent._subscribers;
  var length = _subscribers.length;

  parent._onerror = null;

  _subscribers[length] = child;
  _subscribers[length + FULFILLED] = onFulfillment;
  _subscribers[length + REJECTED] = onRejection;

  if (length === 0 && parent._state) {
    asap(publish, parent);
  }
}

function publish(promise) {
  var subscribers = promise._subscribers;
  var settled = promise._state;

  if (subscribers.length === 0) {
    return;
  }

  var child = undefined,
      callback = undefined,
      detail = promise._result;

  for (var i = 0; i < subscribers.length; i += 3) {
    child = subscribers[i];
    callback = subscribers[i + settled];

    if (child) {
      invokeCallback(settled, child, callback, detail);
    } else {
      callback(detail);
    }
  }

  promise._subscribers.length = 0;
}

function ErrorObject() {
  this.error = null;
}

var TRY_CATCH_ERROR = new ErrorObject();

function tryCatch(callback, detail) {
  try {
    return callback(detail);
  } catch (e) {
    TRY_CATCH_ERROR.error = e;
    return TRY_CATCH_ERROR;
  }
}

function invokeCallback(settled, promise, callback, detail) {
  var hasCallback = isFunction(callback),
      value = undefined,
      error = undefined,
      succeeded = undefined,
      failed = undefined;

  if (hasCallback) {
    value = tryCatch(callback, detail);

    if (value === TRY_CATCH_ERROR) {
      failed = true;
      error = value.error;
      value = null;
    } else {
      succeeded = true;
    }

    if (promise === value) {
      _reject(promise, cannotReturnOwn());
      return;
    }
  } else {
    value = detail;
    succeeded = true;
  }

  if (promise._state !== PENDING) {
    // noop
  } else if (hasCallback && succeeded) {
      _resolve(promise, value);
    } else if (failed) {
      _reject(promise, error);
    } else if (settled === FULFILLED) {
      fulfill(promise, value);
    } else if (settled === REJECTED) {
      _reject(promise, value);
    }
}

function initializePromise(promise, resolver) {
  try {
    resolver(function resolvePromise(value) {
      _resolve(promise, value);
    }, function rejectPromise(reason) {
      _reject(promise, reason);
    });
  } catch (e) {
    _reject(promise, e);
  }
}

var id = 0;
function nextId() {
  return id++;
}

function makePromise(promise) {
  promise[PROMISE_ID] = id++;
  promise._state = undefined;
  promise._result = undefined;
  promise._subscribers = [];
}

function Enumerator(Constructor, input) {
  this._instanceConstructor = Constructor;
  this.promise = new Constructor(noop);

  if (!this.promise[PROMISE_ID]) {
    makePromise(this.promise);
  }

  if (isArray(input)) {
    this._input = input;
    this.length = input.length;
    this._remaining = input.length;

    this._result = new Array(this.length);

    if (this.length === 0) {
      fulfill(this.promise, this._result);
    } else {
      this.length = this.length || 0;
      this._enumerate();
      if (this._remaining === 0) {
        fulfill(this.promise, this._result);
      }
    }
  } else {
    _reject(this.promise, validationError());
  }
}

function validationError() {
  return new Error('Array Methods must be provided an Array');
};

Enumerator.prototype._enumerate = function () {
  var length = this.length;
  var _input = this._input;

  for (var i = 0; this._state === PENDING && i < length; i++) {
    this._eachEntry(_input[i], i);
  }
};

Enumerator.prototype._eachEntry = function (entry, i) {
  var c = this._instanceConstructor;
  var resolve$$ = c.resolve;

  if (resolve$$ === resolve) {
    var _then = getThen(entry);

    if (_then === then && entry._state !== PENDING) {
      this._settledAt(entry._state, i, entry._result);
    } else if (typeof _then !== 'function') {
      this._remaining--;
      this._result[i] = entry;
    } else if (c === Promise) {
      var promise = new c(noop);
      handleMaybeThenable(promise, entry, _then);
      this._willSettleAt(promise, i);
    } else {
      this._willSettleAt(new c(function (resolve$$) {
        return resolve$$(entry);
      }), i);
    }
  } else {
    this._willSettleAt(resolve$$(entry), i);
  }
};

Enumerator.prototype._settledAt = function (state, i, value) {
  var promise = this.promise;

  if (promise._state === PENDING) {
    this._remaining--;

    if (state === REJECTED) {
      _reject(promise, value);
    } else {
      this._result[i] = value;
    }
  }

  if (this._remaining === 0) {
    fulfill(promise, this._result);
  }
};

Enumerator.prototype._willSettleAt = function (promise, i) {
  var enumerator = this;

  subscribe(promise, undefined, function (value) {
    return enumerator._settledAt(FULFILLED, i, value);
  }, function (reason) {
    return enumerator._settledAt(REJECTED, i, reason);
  });
};

/**
  `Promise.all` accepts an array of promises, and returns a new promise which
  is fulfilled with an array of fulfillment values for the passed promises, or
  rejected with the reason of the first passed promise to be rejected. It casts all
  elements of the passed iterable to promises as it runs this algorithm.

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = resolve(2);
  let promise3 = resolve(3);
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // The array here would be [ 1, 2, 3 ];
  });
  ```

  If any of the `promises` given to `all` are rejected, the first promise
  that is rejected will be given as an argument to the returned promises's
  rejection handler. For example:

  Example:

  ```javascript
  let promise1 = resolve(1);
  let promise2 = reject(new Error("2"));
  let promise3 = reject(new Error("3"));
  let promises = [ promise1, promise2, promise3 ];

  Promise.all(promises).then(function(array){
    // Code here never runs because there are rejected promises!
  }, function(error) {
    // error.message === "2"
  });
  ```

  @method all
  @static
  @param {Array} entries array of promises
  @param {String} label optional string for labeling the promise.
  Useful for tooling.
  @return {Promise} promise that is fulfilled when all `promises` have been
  fulfilled, or rejected if any of them become rejected.
  @static
*/
function all(entries) {
  return new Enumerator(this, entries).promise;
}

/**
  `Promise.race` returns a new promise which is settled in the same way as the
  first passed promise to settle.

  Example:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 2');
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // result === 'promise 2' because it was resolved before promise1
    // was resolved.
  });
  ```

  `Promise.race` is deterministic in that only the state of the first
  settled promise matters. For example, even if other promises given to the
  `promises` array argument are resolved, but the first settled promise has
  become rejected before the other promises became fulfilled, the returned
  promise will become rejected:

  ```javascript
  let promise1 = new Promise(function(resolve, reject){
    setTimeout(function(){
      resolve('promise 1');
    }, 200);
  });

  let promise2 = new Promise(function(resolve, reject){
    setTimeout(function(){
      reject(new Error('promise 2'));
    }, 100);
  });

  Promise.race([promise1, promise2]).then(function(result){
    // Code here never runs
  }, function(reason){
    // reason.message === 'promise 2' because promise 2 became rejected before
    // promise 1 became fulfilled
  });
  ```

  An example real-world use case is implementing timeouts:

  ```javascript
  Promise.race([ajax('foo.json'), timeout(5000)])
  ```

  @method race
  @static
  @param {Array} promises array of promises to observe
  Useful for tooling.
  @return {Promise} a promise which settles in the same way as the first passed
  promise to settle.
*/
function race(entries) {
  /*jshint validthis:true */
  var Constructor = this;

  if (!isArray(entries)) {
    return new Constructor(function (_, reject) {
      return reject(new TypeError('You must pass an array to race.'));
    });
  } else {
    return new Constructor(function (resolve, reject) {
      var length = entries.length;
      for (var i = 0; i < length; i++) {
        Constructor.resolve(entries[i]).then(resolve, reject);
      }
    });
  }
}

/**
  `Promise.reject` returns a promise rejected with the passed `reason`.
  It is shorthand for the following:

  ```javascript
  let promise = new Promise(function(resolve, reject){
    reject(new Error('WHOOPS'));
  });

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  Instead of writing the above, your code now simply becomes the following:

  ```javascript
  let promise = Promise.reject(new Error('WHOOPS'));

  promise.then(function(value){
    // Code here doesn't run because the promise is rejected!
  }, function(reason){
    // reason.message === 'WHOOPS'
  });
  ```

  @method reject
  @static
  @param {Any} reason value that the returned promise will be rejected with.
  Useful for tooling.
  @return {Promise} a promise rejected with the given `reason`.
*/
function reject(reason) {
  /*jshint validthis:true */
  var Constructor = this;
  var promise = new Constructor(noop);
  _reject(promise, reason);
  return promise;
}

function needsResolver() {
  throw new TypeError('You must pass a resolver function as the first argument to the promise constructor');
}

function needsNew() {
  throw new TypeError("Failed to construct 'Promise': Please use the 'new' operator, this object constructor cannot be called as a function.");
}

/**
  Promise objects represent the eventual result of an asynchronous operation. The
  primary way of interacting with a promise is through its `then` method, which
  registers callbacks to receive either a promise's eventual value or the reason
  why the promise cannot be fulfilled.

  Terminology
  -----------

  - `promise` is an object or function with a `then` method whose behavior conforms to this specification.
  - `thenable` is an object or function that defines a `then` method.
  - `value` is any legal JavaScript value (including undefined, a thenable, or a promise).
  - `exception` is a value that is thrown using the throw statement.
  - `reason` is a value that indicates why a promise was rejected.
  - `settled` the final resting state of a promise, fulfilled or rejected.

  A promise can be in one of three states: pending, fulfilled, or rejected.

  Promises that are fulfilled have a fulfillment value and are in the fulfilled
  state.  Promises that are rejected have a rejection reason and are in the
  rejected state.  A fulfillment value is never a thenable.

  Promises can also be said to *resolve* a value.  If this value is also a
  promise, then the original promise's settled state will match the value's
  settled state.  So a promise that *resolves* a promise that rejects will
  itself reject, and a promise that *resolves* a promise that fulfills will
  itself fulfill.


  Basic Usage:
  ------------

  ```js
  let promise = new Promise(function(resolve, reject) {
    // on success
    resolve(value);

    // on failure
    reject(reason);
  });

  promise.then(function(value) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Advanced Usage:
  ---------------

  Promises shine when abstracting away asynchronous interactions such as
  `XMLHttpRequest`s.

  ```js
  function getJSON(url) {
    return new Promise(function(resolve, reject){
      let xhr = new XMLHttpRequest();

      xhr.open('GET', url);
      xhr.onreadystatechange = handler;
      xhr.responseType = 'json';
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.send();

      function handler() {
        if (this.readyState === this.DONE) {
          if (this.status === 200) {
            resolve(this.response);
          } else {
            reject(new Error('getJSON: `' + url + '` failed with status: [' + this.status + ']'));
          }
        }
      };
    });
  }

  getJSON('/posts.json').then(function(json) {
    // on fulfillment
  }, function(reason) {
    // on rejection
  });
  ```

  Unlike callbacks, promises are great composable primitives.

  ```js
  Promise.all([
    getJSON('/posts'),
    getJSON('/comments')
  ]).then(function(values){
    values[0] // => postsJSON
    values[1] // => commentsJSON

    return values;
  });
  ```

  @class Promise
  @param {function} resolver
  Useful for tooling.
  @constructor
*/
function Promise(resolver) {
  this[PROMISE_ID] = nextId();
  this._result = this._state = undefined;
  this._subscribers = [];

  if (noop !== resolver) {
    typeof resolver !== 'function' && needsResolver();
    this instanceof Promise ? initializePromise(this, resolver) : needsNew();
  }
}

Promise.all = all;
Promise.race = race;
Promise.resolve = resolve;
Promise.reject = reject;
Promise._setScheduler = setScheduler;
Promise._setAsap = setAsap;
Promise._asap = asap;

Promise.prototype = {
  constructor: Promise,

  /**
    The primary way of interacting with a promise is through its `then` method,
    which registers callbacks to receive either a promise's eventual value or the
    reason why the promise cannot be fulfilled.
  
    ```js
    findUser().then(function(user){
      // user is available
    }, function(reason){
      // user is unavailable, and you are given the reason why
    });
    ```
  
    Chaining
    --------
  
    The return value of `then` is itself a promise.  This second, 'downstream'
    promise is resolved with the return value of the first promise's fulfillment
    or rejection handler, or rejected if the handler throws an exception.
  
    ```js
    findUser().then(function (user) {
      return user.name;
    }, function (reason) {
      return 'default name';
    }).then(function (userName) {
      // If `findUser` fulfilled, `userName` will be the user's name, otherwise it
      // will be `'default name'`
    });
  
    findUser().then(function (user) {
      throw new Error('Found user, but still unhappy');
    }, function (reason) {
      throw new Error('`findUser` rejected and we're unhappy');
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // if `findUser` fulfilled, `reason` will be 'Found user, but still unhappy'.
      // If `findUser` rejected, `reason` will be '`findUser` rejected and we're unhappy'.
    });
    ```
    If the downstream promise does not specify a rejection handler, rejection reasons will be propagated further downstream.
  
    ```js
    findUser().then(function (user) {
      throw new PedagogicalException('Upstream error');
    }).then(function (value) {
      // never reached
    }).then(function (value) {
      // never reached
    }, function (reason) {
      // The `PedgagocialException` is propagated all the way down to here
    });
    ```
  
    Assimilation
    ------------
  
    Sometimes the value you want to propagate to a downstream promise can only be
    retrieved asynchronously. This can be achieved by returning a promise in the
    fulfillment or rejection handler. The downstream promise will then be pending
    until the returned promise is settled. This is called *assimilation*.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // The user's comments are now available
    });
    ```
  
    If the assimliated promise rejects, then the downstream promise will also reject.
  
    ```js
    findUser().then(function (user) {
      return findCommentsByAuthor(user);
    }).then(function (comments) {
      // If `findCommentsByAuthor` fulfills, we'll have the value here
    }, function (reason) {
      // If `findCommentsByAuthor` rejects, we'll have the reason here
    });
    ```
  
    Simple Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let result;
  
    try {
      result = findResult();
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
    findResult(function(result, err){
      if (err) {
        // failure
      } else {
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findResult().then(function(result){
      // success
    }, function(reason){
      // failure
    });
    ```
  
    Advanced Example
    --------------
  
    Synchronous Example
  
    ```javascript
    let author, books;
  
    try {
      author = findAuthor();
      books  = findBooksByAuthor(author);
      // success
    } catch(reason) {
      // failure
    }
    ```
  
    Errback Example
  
    ```js
  
    function foundBooks(books) {
  
    }
  
    function failure(reason) {
  
    }
  
    findAuthor(function(author, err){
      if (err) {
        failure(err);
        // failure
      } else {
        try {
          findBoooksByAuthor(author, function(books, err) {
            if (err) {
              failure(err);
            } else {
              try {
                foundBooks(books);
              } catch(reason) {
                failure(reason);
              }
            }
          });
        } catch(error) {
          failure(err);
        }
        // success
      }
    });
    ```
  
    Promise Example;
  
    ```javascript
    findAuthor().
      then(findBooksByAuthor).
      then(function(books){
        // found books
    }).catch(function(reason){
      // something went wrong
    });
    ```
  
    @method then
    @param {Function} onFulfilled
    @param {Function} onRejected
    Useful for tooling.
    @return {Promise}
  */
  then: then,

  /**
    `catch` is simply sugar for `then(undefined, onRejection)` which makes it the same
    as the catch block of a try/catch statement.
  
    ```js
    function findAuthor(){
      throw new Error('couldn't find that author');
    }
  
    // synchronous
    try {
      findAuthor();
    } catch(reason) {
      // something went wrong
    }
  
    // async with promises
    findAuthor().catch(function(reason){
      // something went wrong
    });
    ```
  
    @method catch
    @param {Function} onRejection
    Useful for tooling.
    @return {Promise}
  */
  'catch': function _catch(onRejection) {
    return this.then(null, onRejection);
  }
};

function polyfill() {
    var local = undefined;

    if (typeof global !== 'undefined') {
        local = global;
    } else if (typeof self !== 'undefined') {
        local = self;
    } else {
        try {
            local = Function('return this')();
        } catch (e) {
            throw new Error('polyfill failed because global object is unavailable in this environment');
        }
    }

    var P = local.Promise;

    if (P) {
        var promiseToString = null;
        try {
            promiseToString = Object.prototype.toString.call(P.resolve());
        } catch (e) {
            // silently ignored
        }

        if (promiseToString === '[object Promise]' && !P.cast) {
            return;
        }
    }

    local.Promise = Promise;
}

polyfill();
// Strange compat..
Promise.polyfill = polyfill;
Promise.Promise = Promise;

return Promise;

})));
//# sourceMappingURL=es6-promise.map
}).call(this,require("r7L21G"),typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"r7L21G":19}],12:[function(require,module,exports){
/**
 * node-iterate79/ary.js
 */
(function(module){
	var Promise = require('es6-promise').Promise;

	/**
	 * 配列の直列処理
	 */
	module.exports = function( ary, fnc, fncComplete ){
		var bundle = 1;
		if( arguments.length >= 4 ){
			ary = arguments[0];
			bundle = arguments[1];
			fnc = arguments[arguments.length-2];
			fncComplete = arguments[arguments.length-1];
		}
		bundle = bundle || 1;

		return new (function( ary, bundle, fnc, fncComplete ){
			var _this = this;
			this.idx = -1;
			this.idxs = []; // <- array keys
			for( var i in ary ){
				this.idxs.push(i);
			}
			this.bundle = bundle||1;
			this.bundleProgress = 1;
			this.ary = ary||[];
			this.fnc = fnc||function(){};
			this.completed = false;
			this.fncComplete = fncComplete||function(){};

			this.next = function(){
				var _this = this;
				new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
					_this.bundleProgress --;
					if( _this.bundleProgress > 0 ){
						// bundleごとの処理が終わっていない
						return;
					}
					if( _this.idx+1 >= _this.idxs.length && _this.bundleProgress<=0 ){
						_this.destroy();
						return;
					}
					var tmp_idx = _this.idx;
					_this.idx = _this.idx+_this.bundle;
					for(var i = 0; i<_this.bundle; i++){
						tmp_idx ++;
						if( tmp_idx >= _this.idxs.length ){
							// 端数があった場合、bundleの数に欠員が出る可能性がある。
							break;
						}
						_this.bundleProgress ++;
						_this.fnc( _this, _this.ary[_this.idxs[tmp_idx]], _this.idxs[tmp_idx] );
					}
					return;
				}); });
				return this;
			}
			this.break = function(){
				var _this = this;
				_this.destroy();
				return;
			}
			this.destroy = function(){
				var _this = this;
				_this.idx = _this.idxs.length - 1;
				_this.bundleProgress = 0;
				if(_this.completed){return;}
				_this.completed = true;
				_this.fncComplete();
				return;
			}
			this.next();
			return;
		})(ary, bundle, fnc, fncComplete);
	}

})(module);

},{"es6-promise":11}],13:[function(require,module,exports){
/**
 * node-iterate79/fnc.js
 */
(function(module){
	var Promise = require('es6-promise').Promise;

	/**
	 * 関数の直列処理
	 */
	module.exports = function(aryFuncs){
		var mode = 'explicit';
		var defaultArg = undefined;
		if( arguments.length >= 2 ){
			mode = 'implicit';
			defaultArg = arguments[0];
			aryFuncs = arguments[arguments.length-1];
		}


		function iterator( aryFuncs ){
			aryFuncs = aryFuncs||[];
			var _this = this;

			_this.idx = 0;
			_this.idxs = []; // <- array keys
			for( var i in aryFuncs ){
				_this.idxs.push(i);
			}
			_this.idxsidxs = {}; // <- array keys keys
			for( var i in _this.idxs ){
				_this.idxsidxs[_this.idxs[i]] = i;
			}
			_this.funcs = aryFuncs;
			var isStarted = false;//2重起動防止

			this.start = function(arg){
				var _this = this;
				if(isStarted){return;}
				isStarted = true;
				new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
					_this.next(arg);
				}); });
				return;
			}
			this.next = function(arg){
				var _this = this;
				arg = arg||{};
				if(_this.idxs.length <= _this.idx){return;}
				new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
					(_this.funcs[_this.idxs[_this.idx++]])(_this, arg);
				}); });
				return;
			};
			this.goto = function(key, arg){
				var _this = this;
				_this.idx = _this.idxsidxs[key];
				arg = arg||{};
				if(_this.idxs.length <= _this.idx){return;}
				new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
					(_this.funcs[_this.idxs[_this.idx++]])(_this, arg);
				}); });
				return;
			};
			this.break = function(){
				this.destroy();
				return;
			}
			this.destroy = function(){
				return;
			}
			return;
		}
		var rtn = new iterator(aryFuncs);
		if( mode == 'implicit' ){
			rtn.start(defaultArg);
			return rtn;
		}
		return rtn;
	}


})(module);

},{"es6-promise":11}],14:[function(require,module,exports){
/**
 * node-iterate79
 */
(function(module){

	/**
	 * 配列の直列処理
	 */
	module.exports.ary = require('./ary.js');

	/**
	 * 関数の直列処理
	 */
	module.exports.fnc = require('./fnc.js');

	/**
	 * キュー処理
	 */
	module.exports.queue = require('./queue.js');


})(module);

},{"./ary.js":12,"./fnc.js":13,"./queue.js":15}],15:[function(require,module,exports){
/**
 * node-iterate79/queue.js
 */
var Promise = require('es6-promise').Promise;

/**
 * construct
 */
module.exports = function(_options){
	var _this = this,
		options = {},
		queue = [],
		threads = [],
		status = {},
		timerRunQueue;

	options = _options || {};
	options.process = _options.process || function(data, done){ done(); };
	options.threadLimit = _options.threadLimit || 1;
	for( var i = 0; i < options.threadLimit; i ++ ){
		threads.push({
			'active': false
		});
	}

	/**
	 * QueueItemを追加する
	 */
	this.push = function(data){
		var newQueueItemId;
		while(1){
			var microtimestamp = (new Date).getTime();
			newQueueItemId = microtimestamp + '-' + md5( microtimestamp );
			if( status[newQueueItemId] ){
				// 登録済みの Queue Item ID は発行不可
				continue;
			}
			break;
		}

		queue.push({
			'id': newQueueItemId,
			'data': data
		});
		status[newQueueItemId] = 1; // 1 = 実行待ち, 2 = 実行中, undefined = 未登録 または 実行済み

		runQueue(); // キュー処理をキックする
		return newQueueItemId;
	}

	/**
	 * QueueItemを更新する
	 */
	this.update = function(queueItemId, data){
		var st = this.checkStatus(queueItemId);
		if(st != 'waiting'){
			// 待ち状態でなければ更新できない
			return false;
		}
		for(var idx in queue){
			if(queue[idx].id == queueItemId){
				queue[idx].data = data;
				break;
			}
		}
		return true;
	}

	/**
	 * QueueItemを削除する
	 */
	this.remove = function(queueItemId){
		var st = this.checkStatus(queueItemId);
		if(st != 'waiting'){
			// 待ち状態でなければ削除できない
			return false;
		}
		status[queueItemId] = 99; // <- removed
		return true;
	}

	/**
	 * 状態を確認する
	 */
	this.checkStatus = function(queueItemId){
		var st = status[queueItemId];
		switch(status[queueItemId]){
			case 1:
				return 'waiting'; break;
			case 2:
				return 'progressing'; break;
			case 99:
				return 'removed'; break;
		}
		return 'undefined'; // <- 未定義および完了済みを含む
	}

	/**
	 * 状態管理情報を取得する
	 */
	this.getAllStatus = function(){
		return status;
	}

	/**
	 * md5ハッシュを求める
	 */
	function md5( str ){
		str = str.toString();
		var crypto = require('crypto');
		var md5 = crypto.createHash('md5');
		md5.update(str, 'utf8');
		return md5.digest('hex');
	}

	/**
	 * 先頭から1件取り出す
	 */
	function shift(){
		// console.log('----- shift');
		var rtn = queue.shift();
		// console.log(rtn);
		return rtn;
	}

	/**
	 * キュー処理をキックする
	 */
	function runQueue(){
		clearTimeout(timerRunQueue);
		if( !queue.length ){
			// 誰も待っていない場合
			return;
		}

		new Promise(function(rlv){rlv();}).then(function(){ return new Promise(function(rlv, rjt){
			var threadNumber = false;

			// 空きスレッドを検索
			for( var idx in threads ){
				if( !threads[idx].active ){
					threadNumber = idx;
					threads[threadNumber].active = true; // スレッドを予約
					break;
				}
			}
			if( threadNumber === false ){
				// スレッドがあいてない場合ポーリング
				timerRunQueue = setTimeout(function(){
					runQueue();
				}, 10);
				return;
			}

			var currentData = shift();

			if(status[currentData.id] == 99){
				// 削除された Queue Item
				status[currentData.id] = undefined; delete(status[currentData.id]); // <- 処理済み にステータスを変更
				threads[threadNumber].active = false; // 予約したスレッドを解放
				runQueue();
				return;
			}


			// ステータスを 実行中 に変更
			status[currentData.id] = 2;

			// 予約したスレッドに、Queue Item ID を記憶する
			threads[threadNumber].active = currentData.id;

			// 実行
			options.process(currentData.data, function(){
				status[currentData.id] = undefined; delete(status[currentData.id]); // <- 処理済み にステータスを変更
				threads[threadNumber].active = false;
				runQueue();
			}, {
				'id': currentData.id
			});
		}); });
		return;
	}

}

},{"crypto":6,"es6-promise":11}],16:[function(require,module,exports){
(function (process){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require("r7L21G"))
},{"r7L21G":19}],17:[function(require,module,exports){
(function (global){
// This file is generated by `make build`. 
// Do NOT edit by hand. 
// 
// Make function changes in ./functions and 
// generator changes in ./lib/phpjsutil.js 
exports.XMLHttpRequest = {};
exports.window = {window: {},document: {lastModified: 1388954399,getElementsByTagName: function(){return [];}},location: {href: ""}};
exports.window.window = exports.window;

exports.array = function () {
  try {
      this.php_js = this.php_js || {};
    } catch (e) {
      this.php_js = {};
    }
  
    var arrInst, e, __, that = this,
      PHPJS_Array = function PHPJS_Array() {};
    mainArgs = arguments, p = this.php_js,
    _indexOf = function(value, from, strict) {
      var i = from || 0,
        nonstrict = !strict,
        length = this.length;
      while (i < length) {
        if (this[i] === value || (nonstrict && this[i] == value)) {
          return i;
        }
        i++;
      }
      return -1;
    };
    // BEGIN REDUNDANT
    if (!p.Relator) {
      p.Relator = (function() { // Used this functional class for giving privacy to the class we are creating
        // Code adapted from http://www.devpro.it/code/192.html
        // Relator explained at http://webreflection.blogspot.com/2008/07/javascript-relator-object-aka.html
        // Its use as privacy technique described at http://webreflection.blogspot.com/2008/10/new-relator-object-plus-unshared.html
        // 1) At top of closure, put: var __ = Relator.$();
        // 2) In constructor, put: var _ = __.constructor(this);
        // 3) At top of each prototype method, put: var _ = __.method(this);
        // 4) Use like:  _.privateVar = 5;
        function _indexOf(value) {
          var i = 0,
            length = this.length;
          while (i < length) {
            if (this[i] === value) {
              return i;
            }
            i++;
          }
          return -1;
        }
  
        function Relator() {
          var Stack = [],
            Array = [];
          if (!Stack.indexOf) {
            Stack.indexOf = _indexOf;
          }
          return {
            // create a new relator
            $: function() {
              return Relator();
            },
            constructor: function(that) {
              var i = Stack.indexOf(that);~
              i ? Array[i] : Array[Stack.push(that) - 1] = {};
              this.method(that)
                .that = that;
              return this.method(that);
            },
            method: function(that) {
              return Array[Stack.indexOf(that)];
            }
          };
        }
        return Relator();
      }());
    }
    // END REDUNDANT
  
    if (p && p.ini && p.ini['phpjs.return_phpjs_arrays'].local_value.toLowerCase() === 'on') {
      if (!p.PHPJS_Array) {
        // We keep this Relator outside the class in case adding prototype methods below
        // Prototype methods added elsewhere can also use this ArrayRelator to share these "pseudo-global mostly-private" variables
        __ = p.ArrayRelator = p.ArrayRelator || p.Relator.$();
        // We could instead allow arguments of {key:XX, value:YY} but even more cumbersome to write
        p.PHPJS_Array = function PHPJS_Array() {
          var _ = __.constructor(this),
            args = arguments,
            i = 0,
            argl, p;
          args = (args.length === 1 && args[0] && typeof args[0] === 'object' &&
            args[0].length && !args[0].propertyIsEnumerable('length')) ? args[0] : args; // If first and only arg is an array, use that (Don't depend on this)
          if (!_.objectChain) {
            _.objectChain = args;
            _.object = {};
            _.keys = [];
            _.values = [];
          }
          for (argl = args.length; i < argl; i++) {
            for (p in args[i]) {
              // Allow for access by key; use of private members to store sequence allows these to be iterated via for...in (but for read-only use, with hasOwnProperty or function filtering to avoid prototype methods, and per ES, potentially out of order)
              this[p] = _.object[p] = args[i][p];
              // Allow for easier access by prototype methods
              _.keys[_.keys.length] = p;
              _.values[_.values.length] = args[i][p];
              break;
            }
          }
        };
        e = p.PHPJS_Array.prototype;
        e.change_key_case = function(cs) {
          var _ = __.method(this),
            oldkey, newkey, i = 0,
            kl = _.keys.length,
            case_fn = (!cs || cs === 'CASE_LOWER') ? 'toLowerCase' : 'toUpperCase';
          while (i < kl) {
            oldkey = _.keys[i];
            newkey = _.keys[i] = _.keys[i][case_fn]();
            if (oldkey !== newkey) {
              this[oldkey] = _.object[oldkey] = _.objectChain[i][oldkey] = null; // Break reference before deleting
              delete this[oldkey];
              delete _.object[oldkey];
              delete _.objectChain[i][oldkey];
              this[newkey] = _.object[newkey] = _.objectChain[i][newkey] = _.values[i]; // Fix: should we make a deep copy?
            }
            i++;
          }
          return this;
        };
        e.flip = function() {
          var _ = __.method(this),
            i = 0,
            kl = _.keys.length;
          while (i < kl) {
            oldkey = _.keys[i];
            newkey = _.values[i];
            if (oldkey !== newkey) {
              this[oldkey] = _.object[oldkey] = _.objectChain[i][oldkey] = null; // Break reference before deleting
              delete this[oldkey];
              delete _.object[oldkey];
              delete _.objectChain[i][oldkey];
              this[newkey] = _.object[newkey] = _.objectChain[i][newkey] = oldkey;
              _.keys[i] = newkey;
            }
            i++;
          }
          return this;
        };
        e.walk = function(funcname, userdata) {
          var _ = __.method(this),
            obj, func, ini, i = 0,
            kl = 0;
  
          try {
            if (typeof funcname === 'function') {
              for (i = 0, kl = _.keys.length; i < kl; i++) {
                if (arguments.length > 1) {
                  funcname(_.values[i], _.keys[i], userdata);
                } else {
                  funcname(_.values[i], _.keys[i]);
                }
              }
            } else if (typeof funcname === 'string') {
              this.php_js = this.php_js || {};
              this.php_js.ini = this.php_js.ini || {};
              ini = this.php_js.ini['phpjs.no-eval'];
              if (ini && (
                parseInt(ini.local_value, 10) !== 0 && (!ini.local_value.toLowerCase || ini.local_value
                  .toLowerCase() !== 'off')
              )) {
                if (arguments.length > 1) {
                  for (i = 0, kl = _.keys.length; i < kl; i++) {
                    this.window[funcname](_.values[i], _.keys[i], userdata);
                  }
                } else {
                  for (i = 0, kl = _.keys.length; i < kl; i++) {
                    this.window[funcname](_.values[i], _.keys[i]);
                  }
                }
              } else {
                if (arguments.length > 1) {
                  for (i = 0, kl = _.keys.length; i < kl; i++) {
                    eval(funcname + '(_.values[i], _.keys[i], userdata)');
                  }
                } else {
                  for (i = 0, kl = _.keys.length; i < kl; i++) {
                    eval(funcname + '(_.values[i], _.keys[i])');
                  }
                }
              }
            } else if (funcname && typeof funcname === 'object' && funcname.length === 2) {
              obj = funcname[0];
              func = funcname[1];
              if (arguments.length > 1) {
                for (i = 0, kl = _.keys.length; i < kl; i++) {
                  obj[func](_.values[i], _.keys[i], userdata);
                }
              } else {
                for (i = 0, kl = _.keys.length; i < kl; i++) {
                  obj[func](_.values[i], _.keys[i]);
                }
              }
            } else {
              return false;
            }
          } catch (e) {
            return false;
          }
  
          return this;
        };
        // Here we'll return actual arrays since most logical and practical for these functions to do this
        e.keys = function(search_value, argStrict) {
          var _ = __.method(this),
            pos,
            search = typeof search_value !== 'undefined',
            tmp_arr = [],
            strict = !! argStrict;
          if (!search) {
            return _.keys;
          }
          while ((pos = _indexOf(_.values, pos, strict)) !== -1) {
            tmp_arr[tmp_arr.length] = _.keys[pos];
          }
          return tmp_arr;
        };
        e.values = function() {
          var _ = __.method(this);
          return _.values;
        };
        // Return non-object, non-array values, since most sensible
        e.search = function(needle, argStrict) {
          var _ = __.method(this),
            strict = !! argStrict,
            haystack = _.values,
            i, vl, val, flags;
          if (typeof needle === 'object' && needle.exec) { // Duck-type for RegExp
            if (!strict) { // Let's consider case sensitive searches as strict
              flags = 'i' + (needle.global ? 'g' : '') +
                (needle.multiline ? 'm' : '') +
                (needle.sticky ? 'y' : ''); // sticky is FF only
              needle = new RegExp(needle.source, flags);
            }
            for (i = 0, vl = haystack.length; i < vl; i++) {
              val = haystack[i];
              if (needle.test(val)) {
                return _.keys[i];
              }
            }
            return false;
          }
          for (i = 0, vl = haystack.length; i < vl; i++) {
            val = haystack[i];
            if ((strict && val === needle) || (!strict && val == needle)) {
              return _.keys[i];
            }
          }
          return false;
        };
        e.sum = function() {
          var _ = __.method(this),
            sum = 0,
            i = 0,
            kl = _.keys.length;
          while (i < kl) {
            if (!isNaN(parseFloat(_.values[i]))) {
              sum += parseFloat(_.values[i]);
            }
            i++;
          }
          return sum;
        };
        // Experimental functions
        e.foreach = function(handler) {
          var _ = __.method(this),
            i = 0,
            kl = _.keys.length;
          while (i < kl) {
            if (handler.length === 1) {
              handler(_.values[i]); // only pass the value
            } else {
              handler(_.keys[i], _.values[i]);
            }
            i++;
          }
          return this;
        };
        e.list = function() {
          var key, _ = __.method(this),
            i = 0,
            argl = arguments.length;
          while (i < argl) {
            key = _.keys[i];
            if (key && key.length === parseInt(key, 10)
              .toString()
              .length && // Key represents an int
              parseInt(key, 10) < argl) { // Key does not exceed arguments
              that.window[arguments[key]] = _.values[key];
            }
            i++;
          }
          return this;
        };
        // Parallel functionality and naming of built-in JavaScript array methods
        e.forEach = function(handler) {
          var _ = __.method(this),
            i = 0,
            kl = _.keys.length;
          while (i < kl) {
            handler(_.values[i], _.keys[i], this);
            i++;
          }
          return this;
        };
        // Our own custom convenience functions
        e.$object = function() {
          var _ = __.method(this);
          return _.object;
        };
        e.$objectChain = function() {
          var _ = __.method(this);
          return _.objectChain;
        };
      }
      PHPJS_Array.prototype = p.PHPJS_Array.prototype;
      arrInst = new PHPJS_Array();
      p.PHPJS_Array.apply(arrInst, mainArgs);
      return arrInst;
    }
    return Array.prototype.slice.call(mainArgs);
};

exports.array_change_key_case = function (array, cs) {
  var case_fn, key, tmp_ar = {};
  
    if (Object.prototype.toString.call(array) === '[object Array]') {
      return array;
    }
    if (array && typeof array === 'object' && array.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
      return array.change_key_case(cs);
    }
    if (array && typeof array === 'object') {
      case_fn = (!cs || cs === 'CASE_LOWER') ? 'toLowerCase' : 'toUpperCase';
      for (key in array) {
        tmp_ar[key[case_fn]()] = array[key];
      }
      return tmp_ar;
    }
  
    return false;
};

exports.array_chunk = function (input, size, preserve_keys) {
  var x, p = '',
      i = 0,
      c = -1,
      l = input.length || 0,
      n = [];
  
    if (size < 1) {
      return null;
    }
  
    if (Object.prototype.toString.call(input) === '[object Array]') {
      if (preserve_keys) {
        while (i < l) {
          (x = i % size) ? n[c][i] = input[i] : n[++c] = {}, n[c][i] = input[i];
          i++;
        }
      } else {
        while (i < l) {
          (x = i % size) ? n[c][x] = input[i] : n[++c] = [input[i]];
          i++;
        }
      }
    } else {
      if (preserve_keys) {
        for (p in input) {
          if (input.hasOwnProperty(p)) {
            (x = i % size) ? n[c][p] = input[p] : n[++c] = {}, n[c][p] = input[p];
            i++;
          }
        }
      } else {
        for (p in input) {
          if (input.hasOwnProperty(p)) {
            (x = i % size) ? n[c][x] = input[p] : n[++c] = [input[p]];
            i++;
          }
        }
      }
    }
    return n;
};

exports.array_combine = function (keys, values) {
  var new_array = {},
      keycount = keys && keys.length,
      i = 0;
  
    // input sanitation
    if (typeof keys !== 'object' || typeof values !== 'object' || // Only accept arrays or array-like objects
      typeof keycount !== 'number' || typeof values.length !== 'number' || !keycount) { // Require arrays to have a count
      return false;
    }
  
    // number of elements does not match
    if (keycount != values.length) {
      return false;
    }
  
    for (i = 0; i < keycount; i++) {
      new_array[keys[i]] = values[i];
    }
  
    return new_array;
};

exports.array_count_values = function (array) {
  var tmp_arr = {},
      key = '',
      t = '';
  
    var __getType = function(obj) {
      // Objects are php associative arrays.
      var t = typeof obj;
      t = t.toLowerCase();
      if (t === 'object') {
        t = 'array';
      }
      return t;
    };
  
    var __countValue = function(value) {
      switch (typeof value) {
        case 'number':
          if (Math.floor(value) !== value) {
            return;
          }
          // Fall-through
        case 'string':
          if (value in this && this.hasOwnProperty(value)) {
            ++this[value];
          } else {
            this[value] = 1;
          }
      }
    };
  
    t = __getType(array);
    if (t === 'array') {
      for (key in array) {
        if (array.hasOwnProperty(key)) {
          __countValue.call(tmp_arr, array[key]);
        }
      }
    }
  
    return tmp_arr;
};

exports.array_diff = function (arr1) {
  var retArr = {},
      argl = arguments.length,
      k1 = '',
      i = 1,
      k = '',
      arr = {};
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < argl; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (arr[k] === arr1[k1]) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_diff_assoc = function (arr1) {
  var retArr = {},
      argl = arguments.length,
      k1 = '',
      i = 1,
      k = '',
      arr = {};
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < argl; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (arr[k] === arr1[k1] && k === k1) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_diff_key = function (arr1) {
  var argl = arguments.length,
      retArr = {},
      k1 = '',
      i = 1,
      k = '',
      arr = {};
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < argl; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (k === k1) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_diff_uassoc = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      cb = arguments[arglm1],
      arr = {},
      i = 1,
      k1 = '',
      k = '';
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (arr[k] === arr1[k1] && cb(k, k1) === 0) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_diff_ukey = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      cb = arguments[arglm1],
      arr = {},
      i = 1,
      k1 = '',
      k = '';
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb(k, k1) === 0) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_fill = function (start_index, num, mixed_val) {
  var key, tmp_arr = {};
  
    if (!isNaN(start_index) && !isNaN(num)) {
      for (key = 0; key < num; key++) {
        tmp_arr[(key + start_index)] = mixed_val;
      }
    }
  
    return tmp_arr;
};

exports.array_fill_keys = function (keys, value) {
  var retObj = {},
      key = '';
  
    for (key in keys) {
      retObj[keys[key]] = value;
    }
  
    return retObj;
};

exports.array_filter = function (arr, func) {
  var retObj = {},
      k;
  
    func = func || function(v) {
      return v;
    };
  
    // Fix: Issue #73
    if (Object.prototype.toString.call(arr) === '[object Array]') {
      retObj = [];
    }
  
    for (k in arr) {
      if (func(arr[k])) {
        retObj[k] = arr[k];
      }
    }
  
    return retObj;
};

exports.array_intersect = function (arr1) {
  var retArr = {},
      argl = arguments.length,
      arglm1 = argl - 1,
      k1 = '',
      arr = {},
      i = 0,
      k = '';
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < argl; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (arr[k] === arr1[k1]) {
            if (i === arglm1) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_intersect_assoc = function (arr1) {
  var retArr = {},
      argl = arguments.length,
      arglm1 = argl - 1,
      k1 = '',
      arr = {},
      i = 0,
      k = '';
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < argl; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (arr[k] === arr1[k1] && k === k1) {
            if (i === arglm1) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_intersect_key = function (arr1) {
  var retArr = {},
      argl = arguments.length,
      arglm1 = argl - 1,
      k1 = '',
      arr = {},
      i = 0,
      k = '';
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < argl; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (k === k1) {
            if (i === arglm1) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_intersect_uassoc = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      arglm2 = arglm1 - 1,
      cb = arguments[arglm1],
      k1 = '',
      i = 1,
      arr = {},
      k = '';
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (arr[k] === arr1[k1] && cb(k, k1) === 0) {
            if (i === arglm2) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_intersect_ukey = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      arglm2 = arglm1 - 1,
      cb = arguments[arglm1],
      k1 = '',
      i = 1,
      arr = {},
      k = '';
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb(k, k1) === 0) {
            if (i === arglm2) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_key_exists = function (key, search) {
  if (!search || (search.constructor !== Array && search.constructor !== Object)) {
      return false;
    }
  
    return key in search;
};

exports.array_keys = function (input, search_value, argStrict) {
  var search = typeof search_value !== 'undefined',
      tmp_arr = [],
      strict = !! argStrict,
      include = true,
      key = '';
  
    if (input && typeof input === 'object' && input.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
      return input.keys(search_value, argStrict);
    }
  
    for (key in input) {
      if (input.hasOwnProperty(key)) {
        include = true;
        if (search) {
          if (strict && input[key] !== search_value) {
            include = false;
          } else if (input[key] != search_value) {
            include = false;
          }
        }
  
        if (include) {
          tmp_arr[tmp_arr.length] = key;
        }
      }
    }
  
    return tmp_arr;
};

exports.array_map = function (callback) {
  var argc = arguments.length,
      argv = arguments,
      glbl = this.window,
      obj = null,
      cb = callback,
      j = argv[1].length,
      i = 0,
      k = 1,
      m = 0,
      tmp = [],
      tmp_ar = [];
  
    while (i < j) {
      while (k < argc) {
        tmp[m++] = argv[k++][i];
      }
  
      m = 0;
      k = 1;
  
      if (callback) {
        if (typeof callback === 'string') {
          cb = glbl[callback];
        } else if (typeof callback === 'object' && callback.length) {
          obj = typeof callback[0] === 'string' ? glbl[callback[0]] : callback[0];
          if (typeof obj === 'undefined') {
            throw 'Object not found: ' + callback[0];
          }
          cb = typeof callback[1] === 'string' ? obj[callback[1]] : callback[1];
        }
        tmp_ar[i++] = cb.apply(obj, tmp);
      } else {
        tmp_ar[i++] = tmp;
      }
  
      tmp = [];
    }
  
    return tmp_ar;
};

exports.array_merge = function () {
  var args = Array.prototype.slice.call(arguments),
      argl = args.length,
      arg,
      retObj = {},
      k = '',
      argil = 0,
      j = 0,
      i = 0,
      ct = 0,
      toStr = Object.prototype.toString,
      retArr = true;
  
    for (i = 0; i < argl; i++) {
      if (toStr.call(args[i]) !== '[object Array]') {
        retArr = false;
        break;
      }
    }
  
    if (retArr) {
      retArr = [];
      for (i = 0; i < argl; i++) {
        retArr = retArr.concat(args[i]);
      }
      return retArr;
    }
  
    for (i = 0, ct = 0; i < argl; i++) {
      arg = args[i];
      if (toStr.call(arg) === '[object Array]') {
        for (j = 0, argil = arg.length; j < argil; j++) {
          retObj[ct++] = arg[j];
        }
      } else {
        for (k in arg) {
          if (arg.hasOwnProperty(k)) {
            if (parseInt(k, 10) + '' === k) {
              retObj[ct++] = arg[k];
            } else {
              retObj[k] = arg[k];
            }
          }
        }
      }
    }
    return retObj;
};

exports.array_multisort = function (arr) {
  var g, i, j, k, l, sal, vkey, elIndex, lastSorts, tmpArray, zlast;
  
    var sortFlag = [0];
    var thingsToSort = [];
    var nLastSort = [];
    var lastSort = [];
    var args = arguments; // possibly redundant
  
    var flags = {
      'SORT_REGULAR': 16,
      'SORT_NUMERIC': 17,
      'SORT_STRING': 18,
      'SORT_ASC': 32,
      'SORT_DESC': 40
    };
  
    var sortDuplicator = function(a, b) {
      return nLastSort.shift();
    };
  
    var sortFunctions = [
      [
  
        function(a, b) {
          lastSort.push(a > b ? 1 : (a < b ? -1 : 0));
          return a > b ? 1 : (a < b ? -1 : 0);
        },
        function(a, b) {
          lastSort.push(b > a ? 1 : (b < a ? -1 : 0));
          return b > a ? 1 : (b < a ? -1 : 0);
        }
      ],
      [
  
        function(a, b) {
          lastSort.push(a - b);
          return a - b;
        },
        function(a, b) {
          lastSort.push(b - a);
          return b - a;
        }
      ],
      [
  
        function(a, b) {
          lastSort.push((a + '') > (b + '') ? 1 : ((a + '') < (b + '') ? -1 : 0));
          return (a + '') > (b + '') ? 1 : ((a + '') < (b + '') ? -1 : 0);
        },
        function(a, b) {
          lastSort.push((b + '') > (a + '') ? 1 : ((b + '') < (a + '') ? -1 : 0));
          return (b + '') > (a + '') ? 1 : ((b + '') < (a + '') ? -1 : 0);
        }
      ]
    ];
  
    var sortArrs = [
      []
    ];
  
    var sortKeys = [
      []
    ];
  
    // Store first argument into sortArrs and sortKeys if an Object.
    // First Argument should be either a Javascript Array or an Object, otherwise function would return FALSE like in PHP
    if (Object.prototype.toString.call(arr) === '[object Array]') {
      sortArrs[0] = arr;
    } else if (arr && typeof arr === 'object') {
      for (i in arr) {
        if (arr.hasOwnProperty(i)) {
          sortKeys[0].push(i);
          sortArrs[0].push(arr[i]);
        }
      }
    } else {
      return false;
    }
  
    // arrMainLength: Holds the length of the first array. All other arrays must be of equal length, otherwise function would return FALSE like in PHP
    //
    // sortComponents: Holds 2 indexes per every section of the array that can be sorted. As this is the start, the whole array can be sorted.
    var arrMainLength = sortArrs[0].length;
    var sortComponents = [0, arrMainLength];
  
    // Loop through all other arguments, checking lengths and sort flags of arrays and adding them to the above variables.
    var argl = arguments.length;
    for (j = 1; j < argl; j++) {
      if (Object.prototype.toString.call(arguments[j]) === '[object Array]') {
        sortArrs[j] = arguments[j];
        sortFlag[j] = 0;
        if (arguments[j].length !== arrMainLength) {
          return false;
        }
      } else if (arguments[j] && typeof arguments[j] === 'object') {
        sortKeys[j] = [];
        sortArrs[j] = [];
        sortFlag[j] = 0;
        for (i in arguments[j]) {
          if (arguments[j].hasOwnProperty(i)) {
            sortKeys[j].push(i);
            sortArrs[j].push(arguments[j][i]);
          }
        }
        if (sortArrs[j].length !== arrMainLength) {
          return false;
        }
      } else if (typeof arguments[j] === 'string') {
        var lFlag = sortFlag.pop();
        // Keep extra parentheses around latter flags check to avoid minimization leading to CDATA closer
        if (typeof flags[arguments[j]] === 'undefined' || ((((flags[arguments[j]]) >>> 4) & (lFlag >>> 4)) > 0)) {
          return false;
        }
        sortFlag.push(lFlag + flags[arguments[j]]);
      } else {
        return false;
      }
    }
  
    for (i = 0; i !== arrMainLength; i++) {
      thingsToSort.push(true);
    }
  
    // Sort all the arrays....
    for (i in sortArrs) {
      if (sortArrs.hasOwnProperty(i)) {
        lastSorts = [];
        tmpArray = [];
        elIndex = 0;
        nLastSort = [];
        lastSort = [];
  
        // If there are no sortComponents, then no more sorting is neeeded. Copy the array back to the argument.
        if (sortComponents.length === 0) {
          if (Object.prototype.toString.call(arguments[i]) === '[object Array]') {
            args[i] = sortArrs[i];
          } else {
            for (k in arguments[i]) {
              if (arguments[i].hasOwnProperty(k)) {
                delete arguments[i][k];
              }
            }
            sal = sortArrs[i].length;
            for (j = 0, vkey = 0; j < sal; j++) {
              vkey = sortKeys[i][j];
              args[i][vkey] = sortArrs[i][j];
            }
          }
          delete sortArrs[i];
          delete sortKeys[i];
          continue;
        }
  
        // Sort function for sorting. Either sorts asc or desc, regular/string or numeric.
        var sFunction = sortFunctions[(sortFlag[i] & 3)][((sortFlag[i] & 8) > 0) ? 1 : 0];
  
        // Sort current array.
        for (l = 0; l !== sortComponents.length; l += 2) {
          tmpArray = sortArrs[i].slice(sortComponents[l], sortComponents[l + 1] + 1);
          tmpArray.sort(sFunction);
          lastSorts[l] = [].concat(lastSort); // Is there a better way to copy an array in Javascript?
          elIndex = sortComponents[l];
          for (g in tmpArray) {
            if (tmpArray.hasOwnProperty(g)) {
              sortArrs[i][elIndex] = tmpArray[g];
              elIndex++;
            }
          }
        }
  
        // Duplicate the sorting of the current array on future arrays.
        sFunction = sortDuplicator;
        for (j in sortArrs) {
          if (sortArrs.hasOwnProperty(j)) {
            if (sortArrs[j] === sortArrs[i]) {
              continue;
            }
            for (l = 0; l !== sortComponents.length; l += 2) {
              tmpArray = sortArrs[j].slice(sortComponents[l], sortComponents[l + 1] + 1);
              nLastSort = [].concat(lastSorts[l]); // alert(l + ':' + nLastSort);
              tmpArray.sort(sFunction);
              elIndex = sortComponents[l];
              for (g in tmpArray) {
                if (tmpArray.hasOwnProperty(g)) {
                  sortArrs[j][elIndex] = tmpArray[g];
                  elIndex++;
                }
              }
            }
          }
        }
  
        // Duplicate the sorting of the current array on array keys
        for (j in sortKeys) {
          if (sortKeys.hasOwnProperty(j)) {
            for (l = 0; l !== sortComponents.length; l += 2) {
              tmpArray = sortKeys[j].slice(sortComponents[l], sortComponents[l + 1] + 1);
              nLastSort = [].concat(lastSorts[l]);
              tmpArray.sort(sFunction);
              elIndex = sortComponents[l];
              for (g in tmpArray) {
                if (tmpArray.hasOwnProperty(g)) {
                  sortKeys[j][elIndex] = tmpArray[g];
                  elIndex++;
                }
              }
            }
          }
        }
  
        // Generate the next sortComponents
        zlast = null;
        sortComponents = [];
        for (j in sortArrs[i]) {
          if (sortArrs[i].hasOwnProperty(j)) {
            if (!thingsToSort[j]) {
              if ((sortComponents.length & 1)) {
                sortComponents.push(j - 1);
              }
              zlast = null;
              continue;
            }
            if (!(sortComponents.length & 1)) {
              if (zlast !== null) {
                if (sortArrs[i][j] === zlast) {
                  sortComponents.push(j - 1);
                } else {
                  thingsToSort[j] = false;
                }
              }
              zlast = sortArrs[i][j];
            } else {
              if (sortArrs[i][j] !== zlast) {
                sortComponents.push(j - 1);
                zlast = sortArrs[i][j];
              }
            }
          }
        }
  
        if (sortComponents.length & 1) {
          sortComponents.push(j);
        }
        if (Object.prototype.toString.call(arguments[i]) === '[object Array]') {
          args[i] = sortArrs[i];
        } else {
          for (j in arguments[i]) {
            if (arguments[i].hasOwnProperty(j)) {
              delete arguments[i][j];
            }
          }
  
          sal = sortArrs[i].length;
          for (j = 0, vkey = 0; j < sal; j++) {
            vkey = sortKeys[i][j];
            args[i][vkey] = sortArrs[i][j];
          }
  
        }
        delete sortArrs[i];
        delete sortKeys[i];
      }
    }
    return true;
};

exports.array_pad = function (input, pad_size, pad_value) {
  var pad = [],
      newArray = [],
      newLength,
      diff = 0,
      i = 0;
  
    if (Object.prototype.toString.call(input) === '[object Array]' && !isNaN(pad_size)) {
      newLength = ((pad_size < 0) ? (pad_size * -1) : pad_size);
      diff = newLength - input.length;
  
      if (diff > 0) {
        for (i = 0; i < diff; i++) {
          newArray[i] = pad_value;
        }
        pad = ((pad_size < 0) ? newArray.concat(input) : input.concat(newArray));
      } else {
        pad = input;
      }
    }
  
    return pad;
};

exports.array_pop = function (inputArr) {
  var key = '',
      lastKey = '';
  
    if (inputArr.hasOwnProperty('length')) {
      // Indexed
      if (!inputArr.length) {
        // Done popping, are we?
        return null;
      }
      return inputArr.pop();
    } else {
      // Associative
      for (key in inputArr) {
        if (inputArr.hasOwnProperty(key)) {
          lastKey = key;
        }
      }
      if (lastKey) {
        var tmp = inputArr[lastKey];
        delete(inputArr[lastKey]);
        return tmp;
      } else {
        return null;
      }
    }
};

exports.array_product = function (input) {
  var idx = 0,
      product = 1,
      il = 0;
  
    if (Object.prototype.toString.call(input) !== '[object Array]') {
      return null;
    }
  
    il = input.length;
    while (idx < il) {
      product *= (!isNaN(input[idx]) ? input[idx] : 0);
      idx++;
    }
    return product;
};

exports.array_push = function (inputArr) {
  var i = 0,
      pr = '',
      argv = arguments,
      argc = argv.length,
      allDigits = /^\d$/,
      size = 0,
      highestIdx = 0,
      len = 0;
    if (inputArr.hasOwnProperty('length')) {
      for (i = 1; i < argc; i++) {
        inputArr[inputArr.length] = argv[i];
      }
      return inputArr.length;
    }
  
    // Associative (object)
    for (pr in inputArr) {
      if (inputArr.hasOwnProperty(pr)) {
        ++len;
        if (pr.search(allDigits) !== -1) {
          size = parseInt(pr, 10);
          highestIdx = size > highestIdx ? size : highestIdx;
        }
      }
    }
    for (i = 1; i < argc; i++) {
      inputArr[++highestIdx] = argv[i];
    }
    return len + i - 1;
};

exports.array_rand = function (input, num_req) {
  var indexes = [];
    var ticks = num_req || 1;
    var checkDuplicate = function(input, value) {
      var exist = false,
        index = 0,
        il = input.length;
      while (index < il) {
        if (input[index] === value) {
          exist = true;
          break;
        }
        index++;
      }
      return exist;
    };
  
    if (Object.prototype.toString.call(input) === '[object Array]' && ticks <= input.length) {
      while (true) {
        var rand = Math.floor((Math.random() * input.length));
        if (indexes.length === ticks) {
          break;
        }
        if (!checkDuplicate(indexes, rand)) {
          indexes.push(rand);
        }
      }
    } else {
      indexes = null;
    }
  
    return ((ticks == 1) ? indexes.join() : indexes);
};

exports.array_reduce = function (a_input, callback) {
  var lon = a_input.length;
    var res = 0,
      i = 0;
    var tmp = [];
  
    for (i = 0; i < lon; i += 2) {
      tmp[0] = a_input[i];
      if (a_input[(i + 1)]) {
        tmp[1] = a_input[(i + 1)];
      } else {
        tmp[1] = 0;
      }
      res += callback.apply(null, tmp);
      tmp = [];
    }
  
    return res;
};

exports.array_replace = function (arr) {
  var retObj = {},
      i = 0,
      p = '',
      argl = arguments.length;
  
    if (argl < 2) {
      throw new Error('There should be at least 2 arguments passed to array_replace()');
    }
  
    // Although docs state that the arguments are passed in by reference, it seems they are not altered, but rather the copy that is returned (just guessing), so we make a copy here, instead of acting on arr itself
    for (p in arr) {
      retObj[p] = arr[p];
    }
  
    for (i = 1; i < argl; i++) {
      for (p in arguments[i]) {
        retObj[p] = arguments[i][p];
      }
    }
    return retObj;
};

exports.array_replace_recursive = function (arr) {
  var retObj = {},
      i = 0,
      p = '',
      argl = arguments.length;
  
    if (argl < 2) {
      throw new Error('There should be at least 2 arguments passed to array_replace_recursive()');
    }
  
    // Although docs state that the arguments are passed in by reference, it seems they are not altered, but rather the copy that is returned (just guessing), so we make a copy here, instead of acting on arr itself
    for (p in arr) {
      retObj[p] = arr[p];
    }
  
    for (i = 1; i < argl; i++) {
      for (p in arguments[i]) {
        if (retObj[p] && typeof retObj[p] === 'object') {
          retObj[p] = this.array_replace_recursive(retObj[p], arguments[i][p]);
        } else {
          retObj[p] = arguments[i][p];
        }
      }
    }
    return retObj;
};

exports.array_reverse = function (array, preserve_keys) {
  var isArray = Object.prototype.toString.call(array) === '[object Array]',
      tmp_arr = preserve_keys ? {} : [],
      key;
  
    if (isArray && !preserve_keys) {
      return array.slice(0)
        .reverse();
    }
  
    if (preserve_keys) {
      var keys = [];
      for (key in array) {
        // if (array.hasOwnProperty(key)) {
        keys.push(key);
        // }
      }
  
      var i = keys.length;
      while (i--) {
        key = keys[i];
        // FIXME: don't rely on browsers keeping keys in insertion order
        // it's implementation specific
        // eg. the result will differ from expected in Google Chrome
        tmp_arr[key] = array[key];
      }
    } else {
      for (key in array) {
        // if (array.hasOwnProperty(key)) {
        tmp_arr.unshift(array[key]);
        // }
      }
    }
  
    return tmp_arr;
};

exports.array_shift = function (inputArr) {
  var props = false,
      shift = undefined,
      pr = '',
      allDigits = /^\d$/,
      int_ct = -1,
      _checkToUpIndices = function(arr, ct, key) {
        // Deal with situation, e.g., if encounter index 4 and try to set it to 0, but 0 exists later in loop (need to
        // increment all subsequent (skipping current key, since we need its value below) until find unused)
        if (arr[ct] !== undefined) {
          var tmp = ct;
          ct += 1;
          if (ct === key) {
            ct += 1;
          }
          ct = _checkToUpIndices(arr, ct, key);
          arr[ct] = arr[tmp];
          delete arr[tmp];
        }
        return ct;
      };
  
    if (inputArr.length === 0) {
      return null;
    }
    if (inputArr.length > 0) {
      return inputArr.shift();
    }
  
    /*
    UNFINISHED FOR HANDLING OBJECTS
    for (pr in inputArr) {
      if (inputArr.hasOwnProperty(pr)) {
        props = true;
        shift = inputArr[pr];
        delete inputArr[pr];
        break;
      }
    }
    for (pr in inputArr) {
      if (inputArr.hasOwnProperty(pr)) {
        if (pr.search(allDigits) !== -1) {
          int_ct += 1;
          if (parseInt(pr, 10) === int_ct) { // Key is already numbered ok, so don't need to change key for value
            continue;
          }
          _checkToUpIndices(inputArr, int_ct, pr);
          arr[int_ct] = arr[pr];
          delete arr[pr];
        }
      }
    }
    if (!props) {
      return null;
    }
    return shift;
    */
};

exports.array_sum = function (array) {
  var key, sum = 0;
  
    if (array && typeof array === 'object' && array.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
      return array.sum.apply(array, Array.prototype.slice.call(arguments, 0));
    }
  
    // input sanitation
    if (typeof array !== 'object') {
      return null;
    }
  
    for (key in array) {
      if (!isNaN(parseFloat(array[key]))) {
        sum += parseFloat(array[key]);
      }
    }
  
    return sum;
};

exports.array_udiff = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      cb = arguments[arglm1],
      arr = '',
      i = 1,
      k1 = '',
      k = '';
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb(arr[k], arr1[k1]) === 0) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_udiff_assoc = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      cb = arguments[arglm1],
      arr = {},
      i = 1,
      k1 = '',
      k = '';
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb(arr[k], arr1[k1]) === 0 && k === k1) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_udiff_uassoc = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      arglm2 = arglm1 - 1,
      cb = arguments[arglm1],
      cb0 = arguments[arglm2],
      k1 = '',
      i = 1,
      k = '',
      arr = {};
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
    cb0 = (typeof cb0 === 'string') ? this.window[cb0] : (Object.prototype.toString.call(cb0) === '[object Array]') ?
      this.window[cb0[0]][cb0[1]] : cb0;
  
    arr1keys: for (k1 in arr1) {
      for (i = 1; i < arglm2; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb0(arr[k], arr1[k1]) === 0 && cb(k, k1) === 0) {
            // If it reaches here, it was found in at least one array, so try next value
            continue arr1keys;
          }
        }
        retArr[k1] = arr1[k1];
      }
    }
  
    return retArr;
};

exports.array_uintersect = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      arglm2 = arglm1 - 1,
      cb = arguments[arglm1],
      k1 = '',
      i = 1,
      arr = {},
      k = '';
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb(arr[k], arr1[k1]) === 0) {
            if (i === arglm2) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_uintersect_assoc = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      arglm2 = arglm1 - 2,
      cb = arguments[arglm1],
      k1 = '',
      i = 1,
      arr = {},
      k = '';
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < arglm1; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (k === k1 && cb(arr[k], arr1[k1]) === 0) {
            if (i === arglm2) {
              retArr[k1] = arr1[k1];
            }
            // If the innermost loop always leads at least once to an equal value, continue the loop until done
            continue arrs;
          }
        }
        // If it reaches here, it wasn't found in at least one array, so try next value
        continue arr1keys;
      }
    }
  
    return retArr;
};

exports.array_uintersect_uassoc = function (arr1) {
  var retArr = {},
      arglm1 = arguments.length - 1,
      arglm2 = arglm1 - 1,
      cb = arguments[arglm1],
      cb0 = arguments[arglm2],
      k1 = '',
      i = 1,
      k = '',
      arr = {};
  
    cb = (typeof cb === 'string') ? this.window[cb] : (Object.prototype.toString.call(cb) === '[object Array]') ? this.window[
      cb[0]][cb[1]] : cb;
    cb0 = (typeof cb0 === 'string') ? this.window[cb0] : (Object.prototype.toString.call(cb0) === '[object Array]') ?
      this.window[cb0[0]][cb0[1]] : cb0;
  
    arr1keys: for (k1 in arr1) {
      arrs: for (i = 1; i < arglm2; i++) {
        arr = arguments[i];
        for (k in arr) {
          if (cb0(arr[k], arr1[k1]) === 0 && cb(k, k1) === 0) {
            if (i === arguments.length - 3) {
              retArr[k1] = arr1[k1];
            }
            continue arrs; // If the innermost loop always leads at least once to an equal value, continue the loop until done
          }
        }
        continue arr1keys; // If it reaches here, it wasn't found in at least one array, so try next value
      }
    }
  
    return retArr;
};

exports.array_unique = function (inputArr) {
  var key = '',
      tmp_arr2 = {},
      val = '';
  
    var __array_search = function(needle, haystack) {
      var fkey = '';
      for (fkey in haystack) {
        if (haystack.hasOwnProperty(fkey)) {
          if ((haystack[fkey] + '') === (needle + '')) {
            return fkey;
          }
        }
      }
      return false;
    };
  
    for (key in inputArr) {
      if (inputArr.hasOwnProperty(key)) {
        val = inputArr[key];
        if (false === __array_search(val, tmp_arr2)) {
          tmp_arr2[key] = val;
        }
      }
    }
  
    return tmp_arr2;
};

exports.array_unshift = function (array) {
  var i = arguments.length;
  
    while (--i !== 0) {
      arguments[0].unshift(arguments[i]);
    }
  
    return arguments[0].length;
};

exports.array_values = function (input) {
  var tmp_arr = [],
      key = '';
  
    if (input && typeof input === 'object' && input.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
      return input.values();
    }
  
    for (key in input) {
      tmp_arr[tmp_arr.length] = input[key];
    }
  
    return tmp_arr;
};

exports.array_walk_recursive = function (array, funcname, userdata) {
  var key;
  
    if (typeof array !== 'object') {
      return false;
    }
  
    for (key in array) {
      if (typeof array[key] === 'object') {
        return this.array_walk_recursive(array[key], funcname, userdata);
      }
  
      if (typeof userdata !== 'undefined') {
        eval(funcname + '( array [key] , key , userdata  )');
      } else {
        eval(funcname + '(  userdata ) ');
      }
    }
  
    return true;
};

exports.compact = function () {
  var matrix = {},
      that = this;
  
    var process = function(value) {
      var i = 0,
        l = value.length,
        key_value = '';
      for (i = 0; i < l; i++) {
        key_value = value[i];
        if (Object.prototype.toString.call(key_value) === '[object Array]') {
          process(key_value);
        } else {
          if (typeof that.window[key_value] !== 'undefined') {
            matrix[key_value] = that.window[key_value];
          }
        }
      }
      return true;
    };
  
    process(arguments);
    return matrix;
};

exports.count = function (mixed_var, mode) {
  var key, cnt = 0;
  
    if (mixed_var === null || typeof mixed_var === 'undefined') {
      return 0;
    } else if (mixed_var.constructor !== Array && mixed_var.constructor !== Object) {
      return 1;
    }
  
    if (mode === 'COUNT_RECURSIVE') {
      mode = 1;
    }
    if (mode != 1) {
      mode = 0;
    }
  
    for (key in mixed_var) {
      if (mixed_var.hasOwnProperty(key)) {
        cnt++;
        if (mode == 1 && mixed_var[key] && (mixed_var[key].constructor === Array || mixed_var[key].constructor ===
          Object)) {
          cnt += this.count(mixed_var[key], 1);
        }
      }
    }
  
    return cnt;
};

exports.current = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
    if (pointers.indexOf(arr) === -1) {
      pointers.push(arr, 0);
    }
    var arrpos = pointers.indexOf(arr);
    var cursor = pointers[arrpos + 1];
    if (Object.prototype.toString.call(arr) === '[object Array]') {
      return arr[cursor] || false;
    }
    var ct = 0;
    for (var k in arr) {
      if (ct === cursor) {
        return arr[k];
      }
      ct++;
    }
    return false; // Empty
};

exports.each = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
    if (pointers.indexOf(arr) === -1) {
      pointers.push(arr, 0);
    }
    var arrpos = pointers.indexOf(arr);
    var cursor = pointers[arrpos + 1];
    var pos = 0;
  
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      var ct = 0;
      for (var k in arr) {
        if (ct === cursor) {
          pointers[arrpos + 1] += 1;
          if (each.returnArrayOnly) {
            return [k, arr[k]];
          } else {
            return {
              1: arr[k],
              value: arr[k],
              0: k,
              key: k
            };
          }
        }
        ct++;
      }
      return false; // Empty
    }
    if (arr.length === 0 || cursor === arr.length) {
      return false;
    }
    pos = cursor;
    pointers[arrpos + 1] += 1;
    if (each.returnArrayOnly) {
      return [pos, arr[pos]];
    } else {
      return {
        1: arr[pos],
        value: arr[pos],
        0: pos,
        key: pos
      };
    }
};

exports.end = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
    if (pointers.indexOf(arr) === -1) {
      pointers.push(arr, 0);
    }
    var arrpos = pointers.indexOf(arr);
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      var ct = 0;
      var val;
      for (var k in arr) {
        ct++;
        val = arr[k];
      }
      if (ct === 0) {
        return false; // Empty
      }
      pointers[arrpos + 1] = ct - 1;
      return val;
    }
    if (arr.length === 0) {
      return false;
    }
    pointers[arrpos + 1] = arr.length - 1;
    return arr[pointers[arrpos + 1]];
};

exports.in_array = function (needle, haystack, argStrict) {
  var key = '',
      strict = !! argStrict;
  
    //we prevent the double check (strict && arr[key] === ndl) || (!strict && arr[key] == ndl)
    //in just one for, in order to improve the performance 
    //deciding wich type of comparation will do before walk array
    if (strict) {
      for (key in haystack) {
        if (haystack[key] === needle) {
          return true;
        }
      }
    } else {
      for (key in haystack) {
        if (haystack[key] == needle) {
          return true;
        }
      }
    }
  
    return false;
};

exports.key = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
  
    if (pointers.indexOf(arr) === -1) {
      pointers.push(arr, 0);
    }
    var cursor = pointers[pointers.indexOf(arr) + 1];
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      var ct = 0;
      for (var k in arr) {
        if (ct === cursor) {
          return k;
        }
        ct++;
      }
      return false; // Empty
    }
    if (arr.length === 0) {
      return false;
    }
    return cursor;
};

exports.next = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
    if (pointers.indexOf(arr) === -1) {
      pointers.push(arr, 0);
    }
    var arrpos = pointers.indexOf(arr);
    var cursor = pointers[arrpos + 1];
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      var ct = 0;
      for (var k in arr) {
        if (ct === cursor + 1) {
          pointers[arrpos + 1] += 1;
          return arr[k];
        }
        ct++;
      }
      return false; // End
    }
    if (arr.length === 0 || cursor === (arr.length - 1)) {
      return false;
    }
    pointers[arrpos + 1] += 1;
    return arr[pointers[arrpos + 1]];
};

exports.prev = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
    var arrpos = pointers.indexOf(arr);
    var cursor = pointers[arrpos + 1];
    if (pointers.indexOf(arr) === -1 || cursor === 0) {
      return false;
    }
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      var ct = 0;
      for (var k in arr) {
        if (ct === cursor - 1) {
          pointers[arrpos + 1] -= 1;
          return arr[k];
        }
        ct++;
      }
      // Shouldn't reach here
    }
    if (arr.length === 0) {
      return false;
    }
    pointers[arrpos + 1] -= 1;
    return arr[pointers[arrpos + 1]];
};

exports.range = function (low, high, step) {
  var matrix = [];
    var inival, endval, plus;
    var walker = step || 1;
    var chars = false;
  
    if (!isNaN(low) && !isNaN(high)) {
      inival = low;
      endval = high;
    } else if (isNaN(low) && isNaN(high)) {
      chars = true;
      inival = low.charCodeAt(0);
      endval = high.charCodeAt(0);
    } else {
      inival = (isNaN(low) ? 0 : low);
      endval = (isNaN(high) ? 0 : high);
    }
  
    plus = ((inival > endval) ? false : true);
    if (plus) {
      while (inival <= endval) {
        matrix.push(((chars) ? String.fromCharCode(inival) : inival));
        inival += walker;
      }
    } else {
      while (inival >= endval) {
        matrix.push(((chars) ? String.fromCharCode(inival) : inival));
        inival -= walker;
      }
    }
  
    return matrix;
};

exports.reset = function (arr) {
  this.php_js = this.php_js || {};
    this.php_js.pointers = this.php_js.pointers || [];
    var indexOf = function(value) {
      for (var i = 0, length = this.length; i < length; i++) {
        if (this[i] === value) {
          return i;
        }
      }
      return -1;
    };
    // END REDUNDANT
    var pointers = this.php_js.pointers;
    if (!pointers.indexOf) {
      pointers.indexOf = indexOf;
    }
    if (pointers.indexOf(arr) === -1) {
      pointers.push(arr, 0);
    }
    var arrpos = pointers.indexOf(arr);
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      for (var k in arr) {
        if (pointers.indexOf(arr) === -1) {
          pointers.push(arr, 0);
        } else {
          pointers[arrpos + 1] = 0;
        }
        return arr[k];
      }
      return false; // Empty
    }
    if (arr.length === 0) {
      return false;
    }
    pointers[arrpos + 1] = 0;
    return arr[pointers[arrpos + 1]];
};

exports.shuffle = function (inputArr) {
  var valArr = [],
      k = '',
      i = 0,
      strictForIn = false,
      populateArr = [];
  
    for (k in inputArr) { // Get key and value arrays
      if (inputArr.hasOwnProperty(k)) {
        valArr.push(inputArr[k]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
    valArr.sort(function() {
      return 0.5 - Math.random();
    });
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    for (i = 0; i < valArr.length; i++) { // Repopulate the old array
      populateArr[i] = valArr[i];
    }
  
    return strictForIn || populateArr;
};

exports.uasort = function (inputArr, sorter) {
  var valArr = [],
      tempKeyVal, tempValue, ret, k = '',
      i = 0,
      strictForIn = false,
      populateArr = {};
  
    if (typeof sorter === 'string') {
      sorter = this[sorter];
    } else if (Object.prototype.toString.call(sorter) === '[object Array]') {
      sorter = this[sorter[0]][sorter[1]];
    }
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    for (k in inputArr) { // Get key and value arrays
      if (inputArr.hasOwnProperty(k)) {
        valArr.push([k, inputArr[k]]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
    valArr.sort(function(a, b) {
      return sorter(a[1], b[1]);
    });
  
    for (i = 0; i < valArr.length; i++) { // Repopulate the old array
      populateArr[valArr[i][0]] = valArr[i][1];
    }
  
    return strictForIn || populateArr;
};

exports.uksort = function (inputArr, sorter) {
  var tmp_arr = {},
      keys = [],
      i = 0,
      k = '',
      strictForIn = false,
      populateArr = {};
  
    if (typeof sorter === 'string') {
      sorter = this.window[sorter];
    }
  
    // Make a list of key names
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        keys.push(k);
      }
    }
  
    // Sort key names
    try {
      if (sorter) {
        keys.sort(sorter);
      } else {
        keys.sort();
      }
    } catch (e) {
      return false;
    }
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Rebuild array with sorted key names
    for (i = 0; i < keys.length; i++) {
      k = keys[i];
      tmp_arr[k] = inputArr[k];
      if (strictForIn) {
        delete inputArr[k];
      }
    }
    for (i in tmp_arr) {
      if (tmp_arr.hasOwnProperty(i)) {
        populateArr[i] = tmp_arr[i];
      }
    }
    return strictForIn || populateArr;
};

exports.usort = function (inputArr, sorter) {
  var valArr = [],
      k = '',
      i = 0,
      strictForIn = false,
      populateArr = {};
  
    if (typeof sorter === 'string') {
      sorter = this[sorter];
    } else if (Object.prototype.toString.call(sorter) === '[object Array]') {
      sorter = this[sorter[0]][sorter[1]];
    }
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    for (k in inputArr) { // Get key and value arrays
      if (inputArr.hasOwnProperty(k)) {
        valArr.push(inputArr[k]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
    try {
      valArr.sort(sorter);
    } catch (e) {
      return false;
    }
    for (i = 0; i < valArr.length; i++) { // Repopulate the old array
      populateArr[i] = valArr[i];
    }
  
    return strictForIn || populateArr;
};

exports.checkdate = function (m, d, y) {
  return m > 0 && m < 13 && y > 0 && y < 32768 && d > 0 && d <= (new Date(y, m, 0))
      .getDate();
};

exports.date = function (format, timestamp) {
  var that = this;
    var jsdate, f;
    // Keep this here (works, but for code commented-out below for file size reasons)
    // var tal= [];
    var txt_words = [
      'Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur',
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    // trailing backslash -> (dropped)
    // a backslash followed by any character (including backslash) -> the character
    // empty string -> empty string
    var formatChr = /\\?(.?)/gi;
    var formatChrCb = function(t, s) {
      return f[t] ? f[t]() : s;
    };
    var _pad = function(n, c) {
      n = String(n);
      while (n.length < c) {
        n = '0' + n;
      }
      return n;
    };
    f = {
      // Day
      d: function() { // Day of month w/leading 0; 01..31
        return _pad(f.j(), 2);
      },
      D: function() { // Shorthand day name; Mon...Sun
        return f.l()
          .slice(0, 3);
      },
      j: function() { // Day of month; 1..31
        return jsdate.getDate();
      },
      l: function() { // Full day name; Monday...Sunday
        return txt_words[f.w()] + 'day';
      },
      N: function() { // ISO-8601 day of week; 1[Mon]..7[Sun]
        return f.w() || 7;
      },
      S: function() { // Ordinal suffix for day of month; st, nd, rd, th
        var j = f.j();
        var i = j % 10;
        if (i <= 3 && parseInt((j % 100) / 10, 10) == 1) {
          i = 0;
        }
        return ['st', 'nd', 'rd'][i - 1] || 'th';
      },
      w: function() { // Day of week; 0[Sun]..6[Sat]
        return jsdate.getDay();
      },
      z: function() { // Day of year; 0..365
        var a = new Date(f.Y(), f.n() - 1, f.j());
        var b = new Date(f.Y(), 0, 1);
        return Math.round((a - b) / 864e5);
      },
  
      // Week
      W: function() { // ISO-8601 week number
        var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3);
        var b = new Date(a.getFullYear(), 0, 4);
        return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
      },
  
      // Month
      F: function() { // Full month name; January...December
        return txt_words[6 + f.n()];
      },
      m: function() { // Month w/leading 0; 01...12
        return _pad(f.n(), 2);
      },
      M: function() { // Shorthand month name; Jan...Dec
        return f.F()
          .slice(0, 3);
      },
      n: function() { // Month; 1...12
        return jsdate.getMonth() + 1;
      },
      t: function() { // Days in month; 28...31
        return (new Date(f.Y(), f.n(), 0))
          .getDate();
      },
  
      // Year
      L: function() { // Is leap year?; 0 or 1
        var j = f.Y();
        return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0;
      },
      o: function() { // ISO-8601 year
        var n = f.n();
        var W = f.W();
        var Y = f.Y();
        return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
      },
      Y: function() { // Full year; e.g. 1980...2010
        return jsdate.getFullYear();
      },
      y: function() { // Last two digits of year; 00...99
        return f.Y()
          .toString()
          .slice(-2);
      },
  
      // Time
      a: function() { // am or pm
        return jsdate.getHours() > 11 ? 'pm' : 'am';
      },
      A: function() { // AM or PM
        return f.a()
          .toUpperCase();
      },
      B: function() { // Swatch Internet time; 000..999
        var H = jsdate.getUTCHours() * 36e2;
        // Hours
        var i = jsdate.getUTCMinutes() * 60;
        // Minutes
        var s = jsdate.getUTCSeconds(); // Seconds
        return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
      },
      g: function() { // 12-Hours; 1..12
        return f.G() % 12 || 12;
      },
      G: function() { // 24-Hours; 0..23
        return jsdate.getHours();
      },
      h: function() { // 12-Hours w/leading 0; 01..12
        return _pad(f.g(), 2);
      },
      H: function() { // 24-Hours w/leading 0; 00..23
        return _pad(f.G(), 2);
      },
      i: function() { // Minutes w/leading 0; 00..59
        return _pad(jsdate.getMinutes(), 2);
      },
      s: function() { // Seconds w/leading 0; 00..59
        return _pad(jsdate.getSeconds(), 2);
      },
      u: function() { // Microseconds; 000000-999000
        return _pad(jsdate.getMilliseconds() * 1000, 6);
      },
  
      // Timezone
      e: function() { // Timezone identifier; e.g. Atlantic/Azores, ...
        // The following works, but requires inclusion of the very large
        // timezone_abbreviations_list() function.
        /*              return that.date_default_timezone_get();
         */
        throw 'Not supported (see source code of date() for timezone on how to add support)';
      },
      I: function() { // DST observed?; 0 or 1
        // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
        // If they are not equal, then DST is observed.
        var a = new Date(f.Y(), 0);
        // Jan 1
        var c = Date.UTC(f.Y(), 0);
        // Jan 1 UTC
        var b = new Date(f.Y(), 6);
        // Jul 1
        var d = Date.UTC(f.Y(), 6); // Jul 1 UTC
        return ((a - c) !== (b - d)) ? 1 : 0;
      },
      O: function() { // Difference to GMT in hour format; e.g. +0200
        var tzo = jsdate.getTimezoneOffset();
        var a = Math.abs(tzo);
        return (tzo > 0 ? '-' : '+') + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
      },
      P: function() { // Difference to GMT w/colon; e.g. +02:00
        var O = f.O();
        return (O.substr(0, 3) + ':' + O.substr(3, 2));
      },
      T: function() { // Timezone abbreviation; e.g. EST, MDT, ...
        // The following works, but requires inclusion of the very
        // large timezone_abbreviations_list() function.
        /*              var abbr, i, os, _default;
        if (!tal.length) {
          tal = that.timezone_abbreviations_list();
        }
        if (that.php_js && that.php_js.default_timezone) {
          _default = that.php_js.default_timezone;
          for (abbr in tal) {
            for (i = 0; i < tal[abbr].length; i++) {
              if (tal[abbr][i].timezone_id === _default) {
                return abbr.toUpperCase();
              }
            }
          }
        }
        for (abbr in tal) {
          for (i = 0; i < tal[abbr].length; i++) {
            os = -jsdate.getTimezoneOffset() * 60;
            if (tal[abbr][i].offset === os) {
              return abbr.toUpperCase();
            }
          }
        }
        */
        return 'UTC';
      },
      Z: function() { // Timezone offset in seconds (-43200...50400)
        return -jsdate.getTimezoneOffset() * 60;
      },
  
      // Full Date/Time
      c: function() { // ISO-8601 date.
        return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb);
      },
      r: function() { // RFC 2822
        return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
      },
      U: function() { // Seconds since UNIX epoch
        return jsdate / 1000 | 0;
      }
    };
    this.date = function(format, timestamp) {
      that = this;
      jsdate = (timestamp === undefined ? new Date() : // Not provided
        (timestamp instanceof Date) ? new Date(timestamp) : // JS Date()
        new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
      );
      return format.replace(formatChr, formatChrCb);
    };
    return this.date(format, timestamp);
};

exports.getdate = function (timestamp) {
  var _w = ['Sun', 'Mon', 'Tues', 'Wednes', 'Thurs', 'Fri', 'Satur'];
    var _m = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
      'November', 'December'
    ];
    var d = ((typeof timestamp === 'undefined') ? new Date() : // Not provided
      (typeof timestamp === 'object') ? new Date(timestamp) : // Javascript Date()
      new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
    );
    var w = d.getDay();
    var m = d.getMonth();
    var y = d.getFullYear();
    var r = {};
  
    r.seconds = d.getSeconds();
    r.minutes = d.getMinutes();
    r.hours = d.getHours();
    r.mday = d.getDate();
    r.wday = w;
    r.mon = m + 1;
    r.year = y;
    r.yday = Math.floor((d - (new Date(y, 0, 1))) / 86400000);
    r.weekday = _w[w] + 'day';
    r.month = _m[m];
    r['0'] = parseInt(d.getTime() / 1000, 10);
  
    return r;
};

exports.gettimeofday = function (return_float) {
  var t = new Date(),
      y = 0;
  
    if (return_float) {
      return t.getTime() / 1000;
    }
  
    y = t.getFullYear(); // Store current year.
    return {
      sec: t.getUTCSeconds(),
      usec: t.getUTCMilliseconds() * 1000,
      minuteswest: t.getTimezoneOffset(),
      // Compare Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC to see if DST is observed.
      dsttime: 0 + (((new Date(y, 0)) - Date.UTC(y, 0)) !== ((new Date(y, 6)) - Date.UTC(y, 6)))
    };
};

exports.gmmktime = function () {
  var d = new Date(),
      r = arguments,
      i = 0,
      e = ['Hours', 'Minutes', 'Seconds', 'Month', 'Date', 'FullYear'];
  
    for (i = 0; i < e.length; i++) {
      if (typeof r[i] === 'undefined') {
        r[i] = d['getUTC' + e[i]]();
        r[i] += (i === 3); // +1 to fix JS months.
      } else {
        r[i] = parseInt(r[i], 10);
        if (isNaN(r[i])) {
          return false;
        }
      }
    }
  
    // Map years 0-69 to 2000-2069 and years 70-100 to 1970-2000.
    r[5] += (r[5] >= 0 ? (r[5] <= 69 ? 2e3 : (r[5] <= 100 ? 1900 : 0)) : 0);
  
    // Set year, month (-1 to fix JS months), and date.
    // !This must come before the call to setHours!
    d.setUTCFullYear(r[5], r[3] - 1, r[4]);
  
    // Set hours, minutes, and seconds.
    d.setUTCHours(r[0], r[1], r[2]);
  
    // Divide milliseconds by 1000 to return seconds and drop decimal.
    // Add 1 second if negative or it'll be off from PHP by 1 second.
    return (d.getTime() / 1e3 >> 0) - (d.getTime() < 0);
};

exports.idate = function (format, timestamp) {
  if (format === undefined) {
      throw 'idate() expects at least 1 parameter, 0 given';
    }
    if (!format.length || format.length > 1) {
      throw 'idate format is one char';
    }
  
    // Fix: Need to allow date_default_timezone_set() (check for this.php_js.default_timezone and use)
    var date = ((typeof timestamp === 'undefined') ? new Date() : // Not provided
      (timestamp instanceof Date) ? new Date(timestamp) : // Javascript Date()
      new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
    ),
      a;
  
    switch (format) {
      case 'B':
        return Math.floor(((date.getUTCHours() * 36e2) + (date.getUTCMinutes() * 60) + date.getUTCSeconds() + 36e2) /
          86.4) % 1e3;
      case 'd':
        return date.getDate();
      case 'h':
        return date.getHours() % 12 || 12;
      case 'H':
        return date.getHours();
      case 'i':
        return date.getMinutes();
      case 'I':
        // capital 'i'
        // Logic original by getimeofday().
        // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
        // If they are not equal, then DST is observed.
        a = date.getFullYear();
        return 0 + (((new Date(a, 0)) - Date.UTC(a, 0)) !== ((new Date(a, 6)) - Date.UTC(a, 6)));
      case 'L':
        a = date.getFullYear();
        return (!(a & 3) && (a % 1e2 || !(a % 4e2))) ? 1 : 0;
      case 'm':
        return date.getMonth() + 1;
      case 's':
        return date.getSeconds();
      case 't':
        return (new Date(date.getFullYear(), date.getMonth() + 1, 0))
          .getDate();
      case 'U':
        return Math.round(date.getTime() / 1000);
      case 'w':
        return date.getDay();
      case 'W':
        a = new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() || 7) + 3);
        return 1 + Math.round((a - (new Date(a.getFullYear(), 0, 4))) / 864e5 / 7);
      case 'y':
        return parseInt((date.getFullYear() + '')
          .slice(2), 10); // This function returns an integer, unlike date()
      case 'Y':
        return date.getFullYear();
      case 'z':
        return Math.floor((date - new Date(date.getFullYear(), 0, 1)) / 864e5);
      case 'Z':
        return -date.getTimezoneOffset() * 60;
      default:
        throw 'Unrecognized date format token';
    }
};

exports.microtime = function (get_as_float) {
  var now = new Date()
      .getTime() / 1000;
    var s = parseInt(now, 10);
  
    return (get_as_float) ? now : (Math.round((now - s) * 1000) / 1000) + ' ' + s;
};

exports.mktime = function () {
  var d = new Date(),
      r = arguments,
      i = 0,
      e = ['Hours', 'Minutes', 'Seconds', 'Month', 'Date', 'FullYear'];
  
    for (i = 0; i < e.length; i++) {
      if (typeof r[i] === 'undefined') {
        r[i] = d['get' + e[i]]();
        r[i] += (i === 3); // +1 to fix JS months.
      } else {
        r[i] = parseInt(r[i], 10);
        if (isNaN(r[i])) {
          return false;
        }
      }
    }
  
    // Map years 0-69 to 2000-2069 and years 70-100 to 1970-2000.
    r[5] += (r[5] >= 0 ? (r[5] <= 69 ? 2e3 : (r[5] <= 100 ? 1900 : 0)) : 0);
  
    // Set year, month (-1 to fix JS months), and date.
    // !This must come before the call to setHours!
    d.setFullYear(r[5], r[3] - 1, r[4]);
  
    // Set hours, minutes, and seconds.
    d.setHours(r[0], r[1], r[2]);
  
    // Divide milliseconds by 1000 to return seconds and drop decimal.
    // Add 1 second if negative or it'll be off from PHP by 1 second.
    return (d.getTime() / 1e3 >> 0) - (d.getTime() < 0);
};

exports.strtotime = function (text, now) {
  var parsed, match, today, year, date, days, ranges, len, times, regex, i, fail = false;
  
    if (!text) {
      return fail;
    }
  
    // Unecessary spaces
    text = text.replace(/^\s+|\s+$/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/[\t\r\n]/g, '')
      .toLowerCase();
  
    // in contrast to php, js Date.parse function interprets:
    // dates given as yyyy-mm-dd as in timezone: UTC,
    // dates with "." or "-" as MDY instead of DMY
    // dates with two-digit years differently
    // etc...etc...
    // ...therefore we manually parse lots of common date formats
    match = text.match(
      /^(\d{1,4})([\-\.\/\:])(\d{1,2})([\-\.\/\:])(\d{1,4})(?:\s(\d{1,2}):(\d{2})?:?(\d{2})?)?(?:\s([A-Z]+)?)?$/);
  
    if (match && match[2] === match[4]) {
      if (match[1] > 1901) {
        switch (match[2]) {
          case '-':
            { // YYYY-M-D
              if (match[3] > 12 || match[5] > 31) {
                return fail;
              }
  
              return new Date(match[1], parseInt(match[3], 10) - 1, match[5],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
          case '.':
            { // YYYY.M.D is not parsed by strtotime()
              return fail;
            }
          case '/':
            { // YYYY/M/D
              if (match[3] > 12 || match[5] > 31) {
                return fail;
              }
  
              return new Date(match[1], parseInt(match[3], 10) - 1, match[5],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
        }
      } else if (match[5] > 1901) {
        switch (match[2]) {
          case '-':
            { // D-M-YYYY
              if (match[3] > 12 || match[1] > 31) {
                return fail;
              }
  
              return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
          case '.':
            { // D.M.YYYY
              if (match[3] > 12 || match[1] > 31) {
                return fail;
              }
  
              return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
          case '/':
            { // M/D/YYYY
              if (match[1] > 12 || match[3] > 31) {
                return fail;
              }
  
              return new Date(match[5], parseInt(match[1], 10) - 1, match[3],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
        }
      } else {
        switch (match[2]) {
          case '-':
            { // YY-M-D
              if (match[3] > 12 || match[5] > 31 || (match[1] < 70 && match[1] > 38)) {
                return fail;
              }
  
              year = match[1] >= 0 && match[1] <= 38 ? +match[1] + 2000 : match[1];
              return new Date(year, parseInt(match[3], 10) - 1, match[5],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
          case '.':
            { // D.M.YY or H.MM.SS
              if (match[5] >= 70) { // D.M.YY
                if (match[3] > 12 || match[1] > 31) {
                  return fail;
                }
  
                return new Date(match[5], parseInt(match[3], 10) - 1, match[1],
                  match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
              }
              if (match[5] < 60 && !match[6]) { // H.MM.SS
                if (match[1] > 23 || match[3] > 59) {
                  return fail;
                }
  
                today = new Date();
                return new Date(today.getFullYear(), today.getMonth(), today.getDate(),
                  match[1] || 0, match[3] || 0, match[5] || 0, match[9] || 0) / 1000;
              }
  
              return fail; // invalid format, cannot be parsed
            }
          case '/':
            { // M/D/YY
              if (match[1] > 12 || match[3] > 31 || (match[5] < 70 && match[5] > 38)) {
                return fail;
              }
  
              year = match[5] >= 0 && match[5] <= 38 ? +match[5] + 2000 : match[5];
              return new Date(year, parseInt(match[1], 10) - 1, match[3],
                match[6] || 0, match[7] || 0, match[8] || 0, match[9] || 0) / 1000;
            }
          case ':':
            { // HH:MM:SS
              if (match[1] > 23 || match[3] > 59 || match[5] > 59) {
                return fail;
              }
  
              today = new Date();
              return new Date(today.getFullYear(), today.getMonth(), today.getDate(),
                match[1] || 0, match[3] || 0, match[5] || 0) / 1000;
            }
        }
      }
    }
  
    // other formats and "now" should be parsed by Date.parse()
    if (text === 'now') {
      return now === null || isNaN(now) ? new Date()
        .getTime() / 1000 | 0 : now | 0;
    }
    if (!isNaN(parsed = Date.parse(text))) {
      return parsed / 1000 | 0;
    }
  
    date = now ? new Date(now * 1000) : new Date();
    days = {
      'sun': 0,
      'mon': 1,
      'tue': 2,
      'wed': 3,
      'thu': 4,
      'fri': 5,
      'sat': 6
    };
    ranges = {
      'yea': 'FullYear',
      'mon': 'Month',
      'day': 'Date',
      'hou': 'Hours',
      'min': 'Minutes',
      'sec': 'Seconds'
    };
  
    function lastNext(type, range, modifier) {
      var diff, day = days[range];
  
      if (typeof day !== 'undefined') {
        diff = day - date.getDay();
  
        if (diff === 0) {
          diff = 7 * modifier;
        } else if (diff > 0 && type === 'last') {
          diff -= 7;
        } else if (diff < 0 && type === 'next') {
          diff += 7;
        }
  
        date.setDate(date.getDate() + diff);
      }
    }
  
    function process(val) {
      var splt = val.split(' '), // Todo: Reconcile this with regex using \s, taking into account browser issues with split and regexes
        type = splt[0],
        range = splt[1].substring(0, 3),
        typeIsNumber = /\d+/.test(type),
        ago = splt[2] === 'ago',
        num = (type === 'last' ? -1 : 1) * (ago ? -1 : 1);
  
      if (typeIsNumber) {
        num *= parseInt(type, 10);
      }
  
      if (ranges.hasOwnProperty(range) && !splt[1].match(/^mon(day|\.)?$/i)) {
        return date['set' + ranges[range]](date['get' + ranges[range]]() + num);
      }
  
      if (range === 'wee') {
        return date.setDate(date.getDate() + (num * 7));
      }
  
      if (type === 'next' || type === 'last') {
        lastNext(type, range, num);
      } else if (!typeIsNumber) {
        return false;
      }
  
      return true;
    }
  
    times = '(years?|months?|weeks?|days?|hours?|minutes?|min|seconds?|sec' +
      '|sunday|sun\\.?|monday|mon\\.?|tuesday|tue\\.?|wednesday|wed\\.?' +
      '|thursday|thu\\.?|friday|fri\\.?|saturday|sat\\.?)';
    regex = '([+-]?\\d+\\s' + times + '|' + '(last|next)\\s' + times + ')(\\sago)?';
  
    match = text.match(new RegExp(regex, 'gi'));
    if (!match) {
      return fail;
    }
  
    for (i = 0, len = match.length; i < len; i++) {
      if (!process(match[i])) {
        return fail;
      }
    }
  
    // ECMAScript 5 only
    // if (!match.every(process))
    //    return false;
  
    return (date.getTime() / 1000);
};

exports.time = function () {
  return Math.floor(new Date()
      .getTime() / 1000);
};

exports.escapeshellarg = function (arg) {
  var ret = '';
  
    ret = arg.replace(/[^\\]'/g, function(m, i, s) {
      return m.slice(0, 1) + '\\\'';
    });
  
    return "'" + ret + "'";
};

exports.basename = function (path, suffix) {
  var b = path;
    var lastChar = b.charAt(b.length - 1);
  
    if (lastChar === '/' || lastChar === '\\') {
      b = b.slice(0, -1);
    }
  
    b = b.replace(/^.*[\/\\]/g, '');
  
    if (typeof suffix === 'string' && b.substr(b.length - suffix.length) == suffix) {
      b = b.substr(0, b.length - suffix.length);
    }
  
    return b;
};

exports.dirname = function (path) {
  return path.replace(/\\/g, '/')
      .replace(/\/[^\/]*\/?$/, '');
};

exports.file_get_contents = function (url, flags, context, offset, maxLen) {
  var tmp, headers = [],
      newTmp = [],
      k = 0,
      i = 0,
      href = '',
      pathPos = -1,
      flagNames = 0,
      content = null,
      http_stream = false;
    var func = function(value) {
      return value.substring(1) !== '';
    };
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    var ini = this.php_js.ini;
    context = context || this.php_js.default_streams_context || null;
  
    if (!flags) {
      flags = 0;
    }
    var OPTS = {
      FILE_USE_INCLUDE_PATH: 1,
      FILE_TEXT: 32,
      FILE_BINARY: 64
    };
    if (typeof flags === 'number') { // Allow for a single string or an array of string flags
      flagNames = flags;
    } else {
      flags = [].concat(flags);
      for (i = 0; i < flags.length; i++) {
        if (OPTS[flags[i]]) {
          flagNames = flagNames | OPTS[flags[i]];
        }
      }
    }
  
    if (flagNames & OPTS.FILE_BINARY && (flagNames & OPTS.FILE_TEXT)) { // These flags shouldn't be together
      throw 'You cannot pass both FILE_BINARY and FILE_TEXT to file_get_contents()';
    }
  
    if ((flagNames & OPTS.FILE_USE_INCLUDE_PATH) && ini.include_path && ini.include_path.local_value) {
      var slash = ini.include_path.local_value.indexOf('/') !== -1 ? '/' : '\\';
      url = ini.include_path.local_value + slash + url;
    } else if (!/^(https?|file):/.test(url)) { // Allow references within or below the same directory (should fix to allow other relative references or root reference; could make dependent on parse_url())
      href = this.window.location.href;
      pathPos = url.indexOf('/') === 0 ? href.indexOf('/', 8) - 1 : href.lastIndexOf('/');
      url = href.slice(0, pathPos + 1) + url;
    }
  
    var http_options;
    if (context) {
      http_options = context.stream_options && context.stream_options.http;
      http_stream = !! http_options;
    }
  
    if (!context || http_stream) {
      var req = this.window.ActiveXObject ? new ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();
      if (!req) {
        throw new Error('XMLHttpRequest not supported');
      }
  
      var method = http_stream ? http_options.method : 'GET';
      var async = !! (context && context.stream_params && context.stream_params['phpjs.async']);
  
      if (ini['phpjs.ajaxBypassCache'] && ini['phpjs.ajaxBypassCache'].local_value) {
        url += (url.match(/\?/) == null ? '?' : '&') + (new Date())
          .getTime(); // Give optional means of forcing bypass of cache
      }
  
      req.open(method, url, async);
      if (async) {
        var notification = context.stream_params.notification;
        if (typeof notification === 'function') {
          // Fix: make work with req.addEventListener if available: https://developer.mozilla.org/En/Using_XMLHttpRequest
          if (0 && req.addEventListener) { // Unimplemented so don't allow to get here
            /*
            req.addEventListener('progress', updateProgress, false);
            req.addEventListener('load', transferComplete, false);
            req.addEventListener('error', transferFailed, false);
            req.addEventListener('abort', transferCanceled, false);
            */
          } else {
            req.onreadystatechange = function(aEvt) { // aEvt has stopPropagation(), preventDefault(); see https://developer.mozilla.org/en/NsIDOMEvent
              // Other XMLHttpRequest properties: multipart, responseXML, status, statusText, upload, withCredentials
              /*
    PHP Constants:
    STREAM_NOTIFY_RESOLVE   1       A remote address required for this stream has been resolved, or the resolution failed. See severity  for an indication of which happened.
    STREAM_NOTIFY_CONNECT   2     A connection with an external resource has been established.
    STREAM_NOTIFY_AUTH_REQUIRED 3     Additional authorization is required to access the specified resource. Typical issued with severity level of STREAM_NOTIFY_SEVERITY_ERR.
    STREAM_NOTIFY_MIME_TYPE_IS  4     The mime-type of resource has been identified, refer to message for a description of the discovered type.
    STREAM_NOTIFY_FILE_SIZE_IS  5     The size of the resource has been discovered.
    STREAM_NOTIFY_REDIRECTED    6     The external resource has redirected the stream to an alternate location. Refer to message .
    STREAM_NOTIFY_PROGRESS  7     Indicates current progress of the stream transfer in bytes_transferred and possibly bytes_max as well.
    STREAM_NOTIFY_COMPLETED 8     There is no more data available on the stream.
    STREAM_NOTIFY_FAILURE   9     A generic error occurred on the stream, consult message and message_code for details.
    STREAM_NOTIFY_AUTH_RESULT   10     Authorization has been completed (with or without success).
  
    STREAM_NOTIFY_SEVERITY_INFO 0     Normal, non-error related, notification.
    STREAM_NOTIFY_SEVERITY_WARN 1     Non critical error condition. Processing may continue.
    STREAM_NOTIFY_SEVERITY_ERR  2     A critical error occurred. Processing cannot continue.
    */
              var objContext = {
                responseText: req.responseText,
                responseXML: req.responseXML,
                status: req.status,
                statusText: req.statusText,
                readyState: req.readyState,
                evt: aEvt
              }; // properties are not available in PHP, but offered on notification via 'this' for convenience
              // notification args: notification_code, severity, message, message_code, bytes_transferred, bytes_max (all int's except string 'message')
              // Need to add message, etc.
              var bytes_transferred;
              switch (req.readyState) {
                case 0:
                  //     UNINITIALIZED     open() has not been called yet.
                  notification.call(objContext, 0, 0, '', 0, 0, 0);
                  break;
                case 1:
                  //     LOADING     send() has not been called yet.
                  notification.call(objContext, 0, 0, '', 0, 0, 0);
                  break;
                case 2:
                  //     LOADED     send() has been called, and headers and status are available.
                  notification.call(objContext, 0, 0, '', 0, 0, 0);
                  break;
                case 3:
                  //     INTERACTIVE     Downloading; responseText holds partial data.
                  bytes_transferred = req.responseText.length * 2; // One character is two bytes
                  notification.call(objContext, 7, 0, '', 0, bytes_transferred, 0);
                  break;
                case 4:
                  //     COMPLETED     The operation is complete.
                  if (req.status >= 200 && req.status < 400) {
                    bytes_transferred = req.responseText.length * 2; // One character is two bytes
                    notification.call(objContext, 8, 0, '', req.status, bytes_transferred, 0);
                  } else if (req.status === 403) { // Fix: These two are finished except for message
                    notification.call(objContext, 10, 2, '', req.status, 0, 0);
                  } else { // Errors
                    notification.call(objContext, 9, 2, '', req.status, 0, 0);
                  }
                  break;
                default:
                  throw 'Unrecognized ready state for file_get_contents()';
              }
            };
          }
        }
      }
  
      if (http_stream) {
        var sendHeaders = http_options.header && http_options.header.split(/\r?\n/);
        var userAgentSent = false;
        for (i = 0; i < sendHeaders.length; i++) {
          var sendHeader = sendHeaders[i];
          var breakPos = sendHeader.search(/:\s*/);
          var sendHeaderName = sendHeader.substring(0, breakPos);
          req.setRequestHeader(sendHeaderName, sendHeader.substring(breakPos + 1));
          if (sendHeaderName === 'User-Agent') {
            userAgentSent = true;
          }
        }
        if (!userAgentSent) {
          var user_agent = http_options.user_agent || (ini.user_agent && ini.user_agent.local_value);
          if (user_agent) {
            req.setRequestHeader('User-Agent', user_agent);
          }
        }
        content = http_options.content || null;
        /*
        // Presently unimplemented HTTP context options
        var request_fulluri = http_options.request_fulluri || false; // When set to TRUE, the entire URI will be used when constructing the request. (i.e. GET http://www.example.com/path/to/file.html HTTP/1.0). While this is a non-standard request format, some proxy servers require it.
        var max_redirects = http_options.max_redirects || 20; // The max number of redirects to follow. Value 1 or less means that no redirects are followed.
        var protocol_version = http_options.protocol_version || 1.0; // HTTP protocol version
        var timeout = http_options.timeout || (ini.default_socket_timeout && ini.default_socket_timeout.local_value); // Read timeout in seconds, specified by a float
        var ignore_errors = http_options.ignore_errors || false; // Fetch the content even on failure status codes.
        */
      }
  
      if (flagNames & OPTS.FILE_TEXT) { // Overrides how encoding is treated (regardless of what is returned from the server)
        var content_type = 'text/html';
        if (http_options && http_options['phpjs.override']) { // Fix: Could allow for non-HTTP as well
          content_type = http_options['phpjs.override']; // We use this, e.g., in gettext-related functions if character set
          //   overridden earlier by bind_textdomain_codeset()
        } else {
          var encoding = (ini['unicode.stream_encoding'] && ini['unicode.stream_encoding'].local_value) ||
            'UTF-8';
          if (http_options && http_options.header && (/^content-type:/im)
            .test(http_options.header)) { // We'll assume a content-type expects its own specified encoding if present
            content_type = http_options.header.match(/^content-type:\s*(.*)$/im)[1]; // We let any header encoding stand
          }
          if (!(/;\s*charset=/)
            .test(content_type)) { // If no encoding
            content_type += '; charset=' + encoding;
          }
        }
        req.overrideMimeType(content_type);
      }
      // Default is FILE_BINARY, but for binary, we apparently deviate from PHP in requiring the flag, since many if not
      //     most people will also want a way to have it be auto-converted into native JavaScript text instead
      else if (flagNames & OPTS.FILE_BINARY) { // Trick at https://developer.mozilla.org/En/Using_XMLHttpRequest to get binary
        req.overrideMimeType('text/plain; charset=x-user-defined');
        // Getting an individual byte then requires:
        // responseText.charCodeAt(x) & 0xFF; // throw away high-order byte (f7) where x is 0 to responseText.length-1 (see notes in our substr())
      }
  
      try {
        if (http_options && http_options['phpjs.sendAsBinary']) { // For content sent in a POST or PUT request (use with file_put_contents()?)
          req.sendAsBinary(content); // In Firefox, only available FF3+
        } else {
          req.send(content);
        }
      } catch (e) {
        // catches exception reported in issue #66
        return false;
      }
  
      tmp = req.getAllResponseHeaders();
      if (tmp) {
        tmp = tmp.split('\n');
        for (k = 0; k < tmp.length; k++) {
          if (func(tmp[k])) {
            newTmp.push(tmp[k]);
          }
        }
        tmp = newTmp;
        for (i = 0; i < tmp.length; i++) {
          headers[i] = tmp[i];
        }
        this.$http_response_header = headers; // see http://php.net/manual/en/reserved.variables.httpresponseheader.php
      }
  
      if (offset || maxLen) {
        if (maxLen) {
          return req.responseText.substr(offset || 0, maxLen);
        }
        return req.responseText.substr(offset);
      }
      return req.responseText;
    }
    return false;
};

exports.realpath = function (path) {
  var p = 0,
      arr = []; /* Save the root, if not given */
    var r = this.window.location.href; /* Avoid input failures */
    path = (path + '')
      .replace('\\', '/'); /* Check if there's a port in path (like 'http://') */
    if (path.indexOf('://') !== -1) {
      p = 1;
    } /* Ok, there's not a port in path, so let's take the root */
    if (!p) {
      path = r.substring(0, r.lastIndexOf('/') + 1) + path;
    } /* Explode the given path into it's parts */
    arr = path.split('/'); /* The path is an array now */
    path = []; /* Foreach part make a check */
    for (var k in arr) { /* This is'nt really interesting */
      if (arr[k] == '.') {
        continue;
      } /* This reduces the realpath */
      if (arr[k] == '..') {
        /* But only if there more than 3 parts in the path-array.
         * The first three parts are for the uri */
        if (path.length > 3) {
          path.pop();
        }
      } /* This adds parts to the realpath */
      else {
        /* But only if the part is not empty or the uri
         * (the first three parts ar needed) was not
         * saved */
        if ((path.length < 2) || (arr[k] !== '')) {
          path.push(arr[k]);
        }
      }
    } /* Returns the absloute path as a string */
    return path.join('/');
};

exports.call_user_func = function (cb) {
  var func;
  
    if (typeof cb === 'string') {
      func = (typeof this[cb] === 'function') ? this[cb] : func = (new Function(null, 'return ' + cb))();
    } else if (Object.prototype.toString.call(cb) === '[object Array]') {
      func = (typeof cb[0] === 'string') ? eval(cb[0] + "['" + cb[1] + "']") : func = cb[0][cb[1]];
    } else if (typeof cb === 'function') {
      func = cb;
    }
  
    if (typeof func !== 'function') {
      throw new Error(func + ' is not a valid function');
    }
  
    var parameters = Array.prototype.slice.call(arguments, 1);
    return (typeof cb[0] === 'string') ? func.apply(eval(cb[0]), parameters) : (typeof cb[0] !== 'object') ? func.apply(
      null, parameters) : func.apply(cb[0], parameters);
};

exports.call_user_func_array = function (cb, parameters) {
  var func;
  
    if (typeof cb === 'string') {
      func = (typeof this[cb] === 'function') ? this[cb] : func = (new Function(null, 'return ' + cb))();
    } else if (Object.prototype.toString.call(cb) === '[object Array]') {
      func = (typeof cb[0] === 'string') ? eval(cb[0] + "['" + cb[1] + "']") : func = cb[0][cb[1]];
    } else if (typeof cb === 'function') {
      func = cb;
    }
  
    if (typeof func !== 'function') {
      throw new Error(func + ' is not a valid function');
    }
  
    return (typeof cb[0] === 'string') ? func.apply(eval(cb[0]), parameters) : (typeof cb[0] !== 'object') ? func.apply(
      null, parameters) : func.apply(cb[0], parameters);
};

exports.create_function = function (args, code) {
  try {
      return Function.apply(null, args.split(',')
        .concat(code));
    } catch (e) {
      return false;
    }
};

exports.function_exists = function (func_name) {
  if (typeof func_name === 'string') {
      func_name = this.window[func_name];
    }
    return typeof func_name === 'function';
};

exports.get_defined_functions = function () {
  var i = '',
      arr = [],
      already = {};
  
    for (i in this.window) {
      try {
        if (typeof this.window[i] === 'function') {
          if (!already[i]) {
            already[i] = 1;
            arr.push(i);
          }
        } else if (typeof this.window[i] === 'object') {
          for (var j in this.window[i]) {
            if (typeof this.window[j] === 'function' && this.window[j] && !already[j]) {
              already[j] = 1;
              arr.push(j);
            }
          }
        }
      } catch (e) {
        // Some objects in Firefox throw exceptions when their properties are accessed (e.g., sessionStorage)
      }
    }
  
    return arr;
};

exports.i18n_loc_set_default = function (name) {
  // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    // END REDUNDANT
  
    this.php_js.i18nLocales = {
      en_US_POSIX: {
        sorting: function(str1, str2) { // Fix: This one taken from strcmp, but need for other locales; we don't use localeCompare since its locale is not settable
          return (str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1);
        }
      }
    };
  
    this.php_js.i18nLocale = name;
    return true;
};

exports.assert_options = function (what, value) {
  // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    this.php_js.assert_values = this.php_js.assert_values || {};
    // END REDUNDANT
  
    var ini, dflt;
    switch (what) {
      case 'ASSERT_ACTIVE':
        ini = 'assert.active';
        dflt = 1;
        break;
      case 'ASSERT_WARNING':
        ini = 'assert.warning';
        dflt = 1;
        throw 'We have not yet implemented warnings for us to throw in JavaScript (assert_options())';
      case 'ASSERT_BAIL':
        ini = 'assert.bail';
        dflt = 0;
        break;
      case 'ASSERT_QUIET_EVAL':
        ini = 'assert.quiet_eval';
        dflt = 0;
        break;
      case 'ASSERT_CALLBACK':
        ini = 'assert.callback';
        dflt = null;
        break;
      default:
        throw 'Improper type for assert_options()';
    }
    // I presume this is to be the most recent value, instead of the default value
    var originalValue = this.php_js.assert_values[ini] || (this.php_js.ini[ini] && this.php_js.ini[ini].local_value) ||
      dflt;
  
    if (value) {
      this.php_js.assert_values[ini] = value; // We use 'ini' instead of 'what' as key to be more convenient for assert() to test for current value
    }
    return originalValue;
};

exports.getenv = function (varname) {
  if (!this.php_js || !this.php_js.ENV || !this.php_js.ENV[varname]) {
      return false;
    }
  
    return this.php_js.ENV[varname];
};

exports.getlastmod = function () {
  return new Date(this.window.document.lastModified)
      .getTime() / 1000;
};

exports.ini_get = function (varname) {
  if (this.php_js && this.php_js.ini && this.php_js.ini[varname] && this.php_js.ini[varname].local_value !==
      undefined) {
      if (this.php_js.ini[varname].local_value === null) {
        return '';
      }
      return this.php_js.ini[varname].local_value;
    }
  
    return '';
};

exports.ini_set = function (varname, newvalue) {
  var oldval = '';
    var self = this;
  
    try {
      this.php_js = this.php_js || {};
    } catch (e) {
      this.php_js = {};
    }
  
    this.php_js.ini = this.php_js.ini || {};
    this.php_js.ini[varname] = this.php_js.ini[varname] || {};
  
    oldval = this.php_js.ini[varname].local_value;
  
    var _setArr = function(oldval) {
      // Although these are set individually, they are all accumulated
      if (typeof oldval === 'undefined') {
        self.php_js.ini[varname].local_value = [];
      }
      self.php_js.ini[varname].local_value.push(newvalue);
    };
  
    switch (varname) {
      case 'extension':
        if (typeof this.dl === 'function') {
          // This function is only experimental in php.js
          this.dl(newvalue);
        }
        _setArr(oldval, newvalue);
        break;
      default:
        this.php_js.ini[varname].local_value = newvalue;
        break;
    }
  
    return oldval;
};

exports.set_time_limit = function (seconds) {
  // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    // END REDUNDANT
  
    this.window.setTimeout(function() {
      if (!this.php_js.timeoutStatus) {
        this.php_js.timeoutStatus = true;
      }
      throw 'Maximum execution time exceeded';
    }, seconds * 1000);
};

exports.version_compare = function (v1, v2, operator) {
  this.php_js = this.php_js || {};
    this.php_js.ENV = this.php_js.ENV || {};
    // END REDUNDANT
    // Important: compare must be initialized at 0.
    var i = 0,
      x = 0,
      compare = 0,
      // vm maps textual PHP versions to negatives so they're less than 0.
      // PHP currently defines these as CASE-SENSITIVE. It is important to
      // leave these as negatives so that they can come before numerical versions
      // and as if no letters were there to begin with.
      // (1alpha is < 1 and < 1.1 but > 1dev1)
      // If a non-numerical value can't be mapped to this table, it receives
      // -7 as its value.
      vm = {
        'dev': -6,
        'alpha': -5,
        'a': -5,
        'beta': -4,
        'b': -4,
        'RC': -3,
        'rc': -3,
        '#': -2,
        'p': 1,
        'pl': 1
      },
      // This function will be called to prepare each version argument.
      // It replaces every _, -, and + with a dot.
      // It surrounds any nonsequence of numbers/dots with dots.
      // It replaces sequences of dots with a single dot.
      //    version_compare('4..0', '4.0') == 0
      // Important: A string of 0 length needs to be converted into a value
      // even less than an unexisting value in vm (-7), hence [-8].
      // It's also important to not strip spaces because of this.
      //   version_compare('', ' ') == 1
      prepVersion = function(v) {
        v = ('' + v)
          .replace(/[_\-+]/g, '.');
        v = v.replace(/([^.\d]+)/g, '.$1.')
          .replace(/\.{2,}/g, '.');
        return (!v.length ? [-8] : v.split('.'));
      };
    // This converts a version component to a number.
    // Empty component becomes 0.
    // Non-numerical component becomes a negative number.
    // Numerical component becomes itself as an integer.
    numVersion = function(v) {
      return !v ? 0 : (isNaN(v) ? vm[v] || -7 : parseInt(v, 10));
    };
    v1 = prepVersion(v1);
    v2 = prepVersion(v2);
    x = Math.max(v1.length, v2.length);
    for (i = 0; i < x; i++) {
      if (v1[i] == v2[i]) {
        continue;
      }
      v1[i] = numVersion(v1[i]);
      v2[i] = numVersion(v2[i]);
      if (v1[i] < v2[i]) {
        compare = -1;
        break;
      } else if (v1[i] > v2[i]) {
        compare = 1;
        break;
      }
    }
    if (!operator) {
      return compare;
    }
  
    // Important: operator is CASE-SENSITIVE.
    // "No operator" seems to be treated as "<."
    // Any other values seem to make the function return null.
    switch (operator) {
      case '>':
      case 'gt':
        return (compare > 0);
      case '>=':
      case 'ge':
        return (compare >= 0);
      case '<=':
      case 'le':
        return (compare <= 0);
      case '==':
      case '=':
      case 'eq':
        return (compare === 0);
      case '<>':
      case '!=':
      case 'ne':
        return (compare !== 0);
      case '':
      case '<':
      case 'lt':
        return (compare < 0);
      default:
        return null;
    }
};

exports.json_decode = function (str_json) {
  /*
      http://www.JSON.org/json2.js
      2008-11-19
      Public Domain.
      NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
      See http://www.JSON.org/js.html
    */
  
    var json = this.window.JSON;
    if (typeof json === 'object' && typeof json.parse === 'function') {
      try {
        return json.parse(str_json);
      } catch (err) {
        if (!(err instanceof SyntaxError)) {
          throw new Error('Unexpected error type in json_decode()');
        }
        this.php_js = this.php_js || {};
        this.php_js.last_error_json = 4; // usable by json_last_error()
        return null;
      }
    }
  
    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
    var j;
    var text = str_json;
  
    // Parsing happens in four stages. In the first stage, we replace certain
    // Unicode characters with escape sequences. JavaScript handles many characters
    // incorrectly, either silently deleting them, or treating them as line endings.
    cx.lastIndex = 0;
    if (cx.test(text)) {
      text = text.replace(cx, function(a) {
        return '\\u' + ('0000' + a.charCodeAt(0)
          .toString(16))
          .slice(-4);
      });
    }
  
    // In the second stage, we run the text against regular expressions that look
    // for non-JSON patterns. We are especially concerned with '()' and 'new'
    // because they can cause invocation, and '=' because it can cause mutation.
    // But just to be safe, we want to reject all unexpected forms.
    // We split the second stage into 4 regexp operations in order to work around
    // crippling inefficiencies in IE's and Safari's regexp engines. First we
    // replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
    // replace all simple value tokens with ']' characters. Third, we delete all
    // open brackets that follow a colon or comma or that begin the text. Finally,
    // we look to see that the remaining characters are only whitespace or ']' or
    // ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.
    if ((/^[\],:{}\s]*$/)
      .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
  
      // In the third stage we use the eval function to compile the text into a
      // JavaScript structure. The '{' operator is subject to a syntactic ambiguity
      // in JavaScript: it can begin a block or an object literal. We wrap the text
      // in parens to eliminate the ambiguity.
      j = eval('(' + text + ')');
  
      return j;
    }
  
    this.php_js = this.php_js || {};
    this.php_js.last_error_json = 4; // usable by json_last_error()
    return null;
};

exports.json_encode = function (mixed_val) {
  /*
      http://www.JSON.org/json2.js
      2008-11-19
      Public Domain.
      NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
      See http://www.JSON.org/js.html
    */
    var retVal, json = this.window.JSON;
    try {
      if (typeof json === 'object' && typeof json.stringify === 'function') {
        retVal = json.stringify(mixed_val); // Errors will not be caught here if our own equivalent to resource
        //  (an instance of PHPJS_Resource) is used
        if (retVal === undefined) {
          throw new SyntaxError('json_encode');
        }
        return retVal;
      }
  
      var value = mixed_val;
  
      var quote = function(string) {
        var escapable =
          /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        var meta = { // table of character substitutions
          '\b': '\\b',
          '\t': '\\t',
          '\n': '\\n',
          '\f': '\\f',
          '\r': '\\r',
          '"': '\\"',
          '\\': '\\\\'
        };
  
        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
          var c = meta[a];
          return typeof c === 'string' ? c : '\\u' + ('0000' + a.charCodeAt(0)
            .toString(16))
            .slice(-4);
        }) + '"' : '"' + string + '"';
      };
  
      var str = function(key, holder) {
        var gap = '';
        var indent = '    ';
        var i = 0; // The loop counter.
        var k = ''; // The member key.
        var v = ''; // The member value.
        var length = 0;
        var mind = gap;
        var partial = [];
        var value = holder[key];
  
        // If the value has a toJSON method, call it to obtain a replacement value.
        if (value && typeof value === 'object' && typeof value.toJSON === 'function') {
          value = value.toJSON(key);
        }
  
        // What happens next depends on the value's type.
        switch (typeof value) {
          case 'string':
            return quote(value);
  
          case 'number':
            // JSON numbers must be finite. Encode non-finite numbers as null.
            return isFinite(value) ? String(value) : 'null';
  
          case 'boolean':
          case 'null':
            // If the value is a boolean or null, convert it to a string. Note:
            // typeof null does not produce 'null'. The case is included here in
            // the remote chance that this gets fixed someday.
            return String(value);
  
          case 'object':
            // If the type is 'object', we might be dealing with an object or an array or
            // null.
            // Due to a specification blunder in ECMAScript, typeof null is 'object',
            // so watch out for that case.
            if (!value) {
              return 'null';
            }
            if ((this.PHPJS_Resource && value instanceof this.PHPJS_Resource) || (window.PHPJS_Resource &&
              value instanceof window.PHPJS_Resource)) {
              throw new SyntaxError('json_encode');
            }
  
            // Make an array to hold the partial results of stringifying this object value.
            gap += indent;
            partial = [];
  
            // Is the value an array?
            if (Object.prototype.toString.apply(value) === '[object Array]') {
              // The value is an array. Stringify every element. Use null as a placeholder
              // for non-JSON values.
              length = value.length;
              for (i = 0; i < length; i += 1) {
                partial[i] = str(i, value) || 'null';
              }
  
              // Join all of the elements together, separated with commas, and wrap them in
              // brackets.
              v = partial.length === 0 ? '[]' : gap ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind +
                ']' : '[' + partial.join(',') + ']';
              gap = mind;
              return v;
            }
  
            // Iterate through all of the keys in the object.
            for (k in value) {
              if (Object.hasOwnProperty.call(value, k)) {
                v = str(k, value);
                if (v) {
                  partial.push(quote(k) + (gap ? ': ' : ':') + v);
                }
              }
            }
  
            // Join all of the member texts together, separated with commas,
            // and wrap them in braces.
            v = partial.length === 0 ? '{}' : gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}' :
              '{' + partial.join(',') + '}';
            gap = mind;
            return v;
          case 'undefined':
            // Fall-through
          case 'function':
            // Fall-through
          default:
            throw new SyntaxError('json_encode');
        }
      };
  
      // Make a fake root object containing our value under the key of ''.
      // Return the result of stringifying the value.
      return str('', {
        '': value
      });
  
    } catch (err) { // Todo: ensure error handling above throws a SyntaxError in all cases where it could
      // (i.e., when the JSON global is not available and there is an error)
      if (!(err instanceof SyntaxError)) {
        throw new Error('Unexpected error type in json_encode()');
      }
      this.php_js = this.php_js || {};
      this.php_js.last_error_json = 4; // usable by json_last_error()
      return null;
    }
};

exports.json_last_error = function () {
  /*
    JSON_ERROR_NONE = 0
    JSON_ERROR_DEPTH = 1 // max depth limit to be removed per PHP comments in json.c (not possible in JS?)
    JSON_ERROR_STATE_MISMATCH = 2 // internal use? also not documented
    JSON_ERROR_CTRL_CHAR = 3 // [\u0000-\u0008\u000B-\u000C\u000E-\u001F] if used directly within json_decode(),
                                    // but JSON functions auto-escape these, so error not possible in JavaScript
    JSON_ERROR_SYNTAX = 4
    */
    return this.php_js && this.php_js.last_error_json ? this.php_js.last_error_json : 0;
};

exports.abs = function (mixed_number) {
  return Math.abs(mixed_number) || 0;
};

exports.acos = function (arg) {
  return Math.acos(arg);
};

exports.acosh = function (arg) {
  return Math.log(arg + Math.sqrt(arg * arg - 1));
};

exports.asin = function (arg) {
  return Math.asin(arg);
};

exports.asinh = function (arg) {
  return Math.log(arg + Math.sqrt(arg * arg + 1));
};

exports.atan = function (arg) {
  return Math.atan(arg);
};

exports.atan2 = function (y, x) {
  return Math.atan2(y, x);
};

exports.atanh = function (arg) {
  return 0.5 * Math.log((1 + arg) / (1 - arg));
};

exports.base_convert = function (number, frombase, tobase) {
  return parseInt(number + '', frombase | 0)
      .toString(tobase | 0);
};

exports.bindec = function (binary_string) {
  binary_string = (binary_string + '')
      .replace(/[^01]/gi, '');
    return parseInt(binary_string, 2);
};

exports.ceil = function (value) {
  return Math.ceil(value);
};

exports.cos = function (arg) {
  return Math.cos(arg);
};

exports.cosh = function (arg) {
  return (Math.exp(arg) + Math.exp(-arg)) / 2;
};

exports.decbin = function (number) {
  if (number < 0) {
      number = 0xFFFFFFFF + number + 1;
    }
    return parseInt(number, 10)
      .toString(2);
};

exports.dechex = function (number) {
  if (number < 0) {
      number = 0xFFFFFFFF + number + 1;
    }
    return parseInt(number, 10)
      .toString(16);
};

exports.decoct = function (number) {
  if (number < 0) {
      number = 0xFFFFFFFF + number + 1;
    }
    return parseInt(number, 10)
      .toString(8);
};

exports.deg2rad = function (angle) {
  return angle * .017453292519943295; // (angle / 180) * Math.PI;
};

exports.exp = function (arg) {
  return Math.exp(arg);
};

exports.expm1 = function (x) {
  var ret = 0,
      n = 50; // degree of precision
    var factorial = function factorial(n) {
      if ((n === 0) || (n === 1)) {
        return 1;
      } else {
        var result = (n * factorial(n - 1));
        return result;
      }
    };
    for (var i = 1; i < n; i++) {
      ret += Math.pow(x, i) / factorial(i);
    }
    return ret;
};

exports.floor = function (value) {
  return Math.floor(value);
};

exports.fmod = function (x, y) {
  var tmp, tmp2, p = 0,
      pY = 0,
      l = 0.0,
      l2 = 0.0;
  
    tmp = x.toExponential()
      .match(/^.\.?(.*)e(.+)$/);
    p = parseInt(tmp[2], 10) - (tmp[1] + '')
      .length;
    tmp = y.toExponential()
      .match(/^.\.?(.*)e(.+)$/);
    pY = parseInt(tmp[2], 10) - (tmp[1] + '')
      .length;
  
    if (pY > p) {
      p = pY;
    }
  
    tmp2 = (x % y);
  
    if (p < -100 || p > 20) {
      // toFixed will give an out of bound error so we fix it like this:
      l = Math.round(Math.log(tmp2) / Math.log(10));
      l2 = Math.pow(10, l);
  
      return (tmp2 / l2)
        .toFixed(l - p) * l2;
    } else {
      return parseFloat(tmp2.toFixed(-p));
    }
};

exports.getrandmax = function () {
  return 2147483647;
};

exports.hexdec = function (hex_string) {
  hex_string = (hex_string + '')
      .replace(/[^a-f0-9]/gi, '');
    return parseInt(hex_string, 16);
};

exports.hypot = function (x, y) {
  return Math.sqrt(x * x + y * y) || 0;
};

exports.is_finite = function (val) {
  var warningType = '';
  
    if (val === Infinity || val === -Infinity) {
      return false;
    }
  
    //Some warnings for maximum PHP compatibility
    if (typeof val === 'object') {
      warningType = (Object.prototype.toString.call(val) === '[object Array]' ? 'array' : 'object');
    } else if (typeof val === 'string' && !val.match(/^[\+\-]?\d/)) {
      //simulate PHP's behaviour: '-9a' doesn't give a warning, but 'a9' does.
      warningType = 'string';
    }
    if (warningType) {
      throw new Error('Warning: is_finite() expects parameter 1 to be double, ' + warningType + ' given');
    }
  
    return true;
};

exports.is_infinite = function (val) {
  var warningType = '';
  
    if (val === Infinity || val === -Infinity) {
      return true;
    }
  
    //Some warnings for maximum PHP compatibility
    if (typeof val === 'object') {
      warningType = (Object.prototype.toString.call(val) === '[object Array]' ? 'array' : 'object');
    } else if (typeof val === 'string' && !val.match(/^[\+\-]?\d/)) {
      //simulate PHP's behaviour: '-9a' doesn't give a warning, but 'a9' does.
      warningType = 'string';
    }
    if (warningType) {
      throw new Error('Warning: is_infinite() expects parameter 1 to be double, ' + warningType + ' given');
    }
  
    return false;
};

exports.is_nan = function (val) {
  var warningType = '';
  
    if (typeof val === 'number' && isNaN(val)) {
      return true;
    }
  
    //Some errors for maximum PHP compatibility
    if (typeof val === 'object') {
      warningType = (Object.prototype.toString.call(val) === '[object Array]' ? 'array' : 'object');
    } else if (typeof val === 'string' && !val.match(/^[\+\-]?\d/)) {
      //simulate PHP's behaviour: '-9a' doesn't give a warning, but 'a9' does.
      warningType = 'string';
    }
    if (warningType) {
      throw new Error('Warning: is_nan() expects parameter 1 to be double, ' + warningType + ' given');
    }
  
    return false;
};

exports.lcg_value = function () {
  return Math.random();
};

exports.log = function (arg, base) {
  return (typeof base === 'undefined') ?
      Math.log(arg) :
      Math.log(arg) / Math.log(base);
};

exports.log10 = function (arg) {
  return Math.log(arg) / 2.302585092994046; // Math.LN10
};

exports.log1p = function (x) {
  var ret = 0,
      n = 50; // degree of precision
    if (x <= -1) {
      return '-INF'; // JavaScript style would be to return Number.NEGATIVE_INFINITY
    }
    if (x < 0 || x > 1) {
      return Math.log(1 + x);
    }
    for (var i = 1; i < n; i++) {
      if ((i % 2) === 0) {
        ret -= Math.pow(x, i) / i;
      } else {
        ret += Math.pow(x, i) / i;
      }
    }
    return ret;
};

exports.max = function () {
  var ar, retVal, i = 0,
      n = 0,
      argv = arguments,
      argc = argv.length,
      _obj2Array = function(obj) {
        if (Object.prototype.toString.call(obj) === '[object Array]') {
          return obj;
        } else {
          var ar = [];
          for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
              ar.push(obj[i]);
            }
          }
          return ar;
        }
      }; //function _obj2Array
    _compare = function(current, next) {
      var i = 0,
        n = 0,
        tmp = 0,
        nl = 0,
        cl = 0;
  
      if (current === next) {
        return 0;
      } else if (typeof current === 'object') {
        if (typeof next === 'object') {
          current = _obj2Array(current);
          next = _obj2Array(next);
          cl = current.length;
          nl = next.length;
          if (nl > cl) {
            return 1;
          } else if (nl < cl) {
            return -1;
          }
          for (i = 0, n = cl; i < n; ++i) {
            tmp = _compare(current[i], next[i]);
            if (tmp == 1) {
              return 1;
            } else if (tmp == -1) {
              return -1;
            }
          }
          return 0;
        }
        return -1;
      } else if (typeof next === 'object') {
        return 1;
      } else if (isNaN(next) && !isNaN(current)) {
        if (current == 0) {
          return 0;
        }
        return (current < 0 ? 1 : -1);
      } else if (isNaN(current) && !isNaN(next)) {
        if (next == 0) {
          return 0;
        }
        return (next > 0 ? 1 : -1);
      }
  
      if (next == current) {
        return 0;
      }
      return (next > current ? 1 : -1);
    }; //function _compare
    if (argc === 0) {
      throw new Error('At least one value should be passed to max()');
    } else if (argc === 1) {
      if (typeof argv[0] === 'object') {
        ar = _obj2Array(argv[0]);
      } else {
        throw new Error('Wrong parameter count for max()');
      }
      if (ar.length === 0) {
        throw new Error('Array must contain at least one element for max()');
      }
    } else {
      ar = argv;
    }
  
    retVal = ar[0];
    for (i = 1, n = ar.length; i < n; ++i) {
      if (_compare(retVal, ar[i]) == 1) {
        retVal = ar[i];
      }
    }
  
    return retVal;
};

exports.min = function () {
  var ar, retVal, i = 0,
      n = 0,
      argv = arguments,
      argc = argv.length,
      _obj2Array = function(obj) {
        if (Object.prototype.toString.call(obj) === '[object Array]') {
          return obj;
        }
        var ar = [];
        for (var i in obj) {
          if (obj.hasOwnProperty(i)) {
            ar.push(obj[i]);
          }
        }
        return ar;
      }; //function _obj2Array
    _compare = function(current, next) {
      var i = 0,
        n = 0,
        tmp = 0,
        nl = 0,
        cl = 0;
  
      if (current === next) {
        return 0;
      } else if (typeof current === 'object') {
        if (typeof next === 'object') {
          current = _obj2Array(current);
          next = _obj2Array(next);
          cl = current.length;
          nl = next.length;
          if (nl > cl) {
            return 1;
          } else if (nl < cl) {
            return -1;
          }
          for (i = 0, n = cl; i < n; ++i) {
            tmp = _compare(current[i], next[i]);
            if (tmp == 1) {
              return 1;
            } else if (tmp == -1) {
              return -1;
            }
          }
          return 0;
        }
        return -1;
      } else if (typeof next === 'object') {
        return 1;
      } else if (isNaN(next) && !isNaN(current)) {
        if (current == 0) {
          return 0;
        }
        return (current < 0 ? 1 : -1);
      } else if (isNaN(current) && !isNaN(next)) {
        if (next == 0) {
          return 0;
        }
        return (next > 0 ? 1 : -1);
      }
  
      if (next == current) {
        return 0;
      }
      return (next > current ? 1 : -1);
    }; //function _compare
    if (argc === 0) {
      throw new Error('At least one value should be passed to min()');
    } else if (argc === 1) {
      if (typeof argv[0] === 'object') {
        ar = _obj2Array(argv[0]);
      } else {
        throw new Error('Wrong parameter count for min()');
      }
      if (ar.length === 0) {
        throw new Error('Array must contain at least one element for min()');
      }
    } else {
      ar = argv;
    }
  
    retVal = ar[0];
    for (i = 1, n = ar.length; i < n; ++i) {
      if (_compare(retVal, ar[i]) == -1) {
        retVal = ar[i];
      }
    }
  
    return retVal;
};

exports.mt_getrandmax = function () {
  return 2147483647;
};

exports.mt_rand = function (min, max) {
  var argc = arguments.length;
    if (argc === 0) {
      min = 0;
      max = 2147483647;
    } else if (argc === 1) {
      throw new Error('Warning: mt_rand() expects exactly 2 parameters, 1 given');
    } else {
      min = parseInt(min, 10);
      max = parseInt(max, 10);
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

exports.octdec = function (oct_string) {
  oct_string = (oct_string + '')
      .replace(/[^0-7]/gi, '');
    return parseInt(oct_string, 8);
};

exports.pi = function () {
  return 3.141592653589793; // Math.PI
};

exports.pow = function (base, exp) {
  return Math.pow(base, exp);
};

exports.rad2deg = function (angle) {
  return angle * 57.29577951308232; // angle / Math.PI * 180
};

exports.rand = function (min, max) {
  var argc = arguments.length;
    if (argc === 0) {
      min = 0;
      max = 2147483647;
    } else if (argc === 1) {
      throw new Error('Warning: rand() expects exactly 2 parameters, 1 given');
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  
    /*
    // See note above for an explanation of the following alternative code
  
    // +   reimplemented by: Brett Zamir (http://brett-zamir.me)
    // -    depends on: srand
    // %          note 1: This is a very possibly imperfect adaptation from the PHP source code
    var rand_seed, ctx, PHP_RAND_MAX=2147483647; // 0x7fffffff
  
    if (!this.php_js || this.php_js.rand_seed === undefined) {
      this.srand();
    }
    rand_seed = this.php_js.rand_seed;
  
    var argc = arguments.length;
    if (argc === 1) {
      throw new Error('Warning: rand() expects exactly 2 parameters, 1 given');
    }
  
    var do_rand = function (ctx) {
      return ((ctx * 1103515245 + 12345) % (PHP_RAND_MAX + 1));
    };
  
    var php_rand = function (ctxArg) { // php_rand_r
      this.php_js.rand_seed = do_rand(ctxArg);
      return parseInt(this.php_js.rand_seed, 10);
    };
  
    var number = php_rand(rand_seed);
  
    if (argc === 2) {
      number = min + parseInt(parseFloat(parseFloat(max) - min + 1.0) * (number/(PHP_RAND_MAX + 1.0)), 10);
    }
    return number;
    */
};

exports.round = function (value, precision, mode) {
  var m, f, isHalf, sgn; // helper variables
    precision |= 0; // making sure precision is integer
    m = Math.pow(10, precision);
    value *= m;
    sgn = (value > 0) | -(value < 0); // sign of the number
    isHalf = value % 1 === 0.5 * sgn;
    f = Math.floor(value);
  
    if (isHalf) {
      switch (mode) {
        case 'PHP_ROUND_HALF_DOWN':
          value = f + (sgn < 0); // rounds .5 toward zero
          break;
        case 'PHP_ROUND_HALF_EVEN':
          value = f + (f % 2 * sgn); // rouds .5 towards the next even integer
          break;
        case 'PHP_ROUND_HALF_ODD':
          value = f + !(f % 2); // rounds .5 towards the next odd integer
          break;
        default:
          value = f + (sgn > 0); // rounds .5 away from zero
      }
    }
  
    return (isHalf ? value : Math.round(value)) / m;
};

exports.sin = function (arg) {
  return Math.sin(arg);
};

exports.sinh = function (arg) {
  return (Math.exp(arg) - Math.exp(-arg)) / 2;
};

exports.sqrt = function (arg) {
  return Math.sqrt(arg);
};

exports.tan = function (arg) {
  return Math.tan(arg);
};

exports.tanh = function (arg) {
  return (Math.exp(arg) - Math.exp(-arg)) / (Math.exp(arg) + Math.exp(-arg));
};

exports.pack = function (format) {
  var formatPointer = 0,
      argumentPointer = 1,
      result = '',
      argument = '',
      i = 0,
      r = [],
      instruction, quantifier, word, precisionBits, exponentBits, extraNullCount;
  
    // vars used by float encoding
    var bias, minExp, maxExp, minUnnormExp, status, exp, len, bin, signal, n, intPart, floatPart, lastBit, rounded, j,
      k, tmpResult;
  
    while (formatPointer < format.length) {
      instruction = format.charAt(formatPointer);
      quantifier = '';
      formatPointer++;
      while ((formatPointer < format.length) && (format.charAt(formatPointer)
        .match(/[\d\*]/) !== null)) {
        quantifier += format.charAt(formatPointer);
        formatPointer++;
      }
      if (quantifier === '') {
        quantifier = '1';
      }
  
      // Now pack variables: 'quantifier' times 'instruction'
      switch (instruction) {
        case 'a':
          // NUL-padded string
        case 'A':
          // SPACE-padded string
          if (typeof arguments[argumentPointer] === 'undefined') {
            throw new Error('Warning:  pack() Type ' + instruction + ': not enough arguments');
          } else {
            argument = String(arguments[argumentPointer]);
          }
          if (quantifier === '*') {
            quantifier = argument.length;
          }
          for (i = 0; i < quantifier; i++) {
            if (typeof argument[i] === 'undefined') {
              if (instruction === 'a') {
                result += String.fromCharCode(0);
              } else {
                result += ' ';
              }
            } else {
              result += argument[i];
            }
          }
          argumentPointer++;
          break;
        case 'h':
          // Hex string, low nibble first
        case 'H':
          // Hex string, high nibble first
          if (typeof arguments[argumentPointer] === 'undefined') {
            throw new Error('Warning: pack() Type ' + instruction + ': not enough arguments');
          } else {
            argument = arguments[argumentPointer];
          }
          if (quantifier === '*') {
            quantifier = argument.length;
          }
          if (quantifier > argument.length) {
            throw new Error('Warning: pack() Type ' + instruction + ': not enough characters in string');
          }
  
          for (i = 0; i < quantifier; i += 2) {
            // Always get per 2 bytes...
            word = argument[i];
            if (((i + 1) >= quantifier) || typeof argument[i + 1] === 'undefined') {
              word += '0';
            } else {
              word += argument[i + 1];
            }
            // The fastest way to reverse?
            if (instruction === 'h') {
              word = word[1] + word[0];
            }
            result += String.fromCharCode(parseInt(word, 16));
          }
          argumentPointer++;
          break;
  
        case 'c':
          // signed char
        case 'C':
          // unsigned char
          // c and C is the same in pack
          if (quantifier === '*') {
            quantifier = arguments.length - argumentPointer;
          }
          if (quantifier > (arguments.length - argumentPointer)) {
            throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
          }
  
          for (i = 0; i < quantifier; i++) {
            result += String.fromCharCode(arguments[argumentPointer]);
            argumentPointer++;
          }
          break;
  
        case 's':
          // signed short (always 16 bit, machine byte order)
        case 'S':
          // unsigned short (always 16 bit, machine byte order)
        case 'v':
          // s and S is the same in pack
          if (quantifier === '*') {
            quantifier = arguments.length - argumentPointer;
          }
          if (quantifier > (arguments.length - argumentPointer)) {
            throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
          }
  
          for (i = 0; i < quantifier; i++) {
            result += String.fromCharCode(arguments[argumentPointer] & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF);
            argumentPointer++;
          }
          break;
  
        case 'n':
          // unsigned short (always 16 bit, big endian byte order)
          if (quantifier === '*') {
            quantifier = arguments.length - argumentPointer;
          }
          if (quantifier > (arguments.length - argumentPointer)) {
            throw new Error('Warning: pack() Type ' + instruction + ': too few arguments');
          }
  
          for (i = 0; i < quantifier; i++) {
            result += String.fromCharCode(arguments[argumentPointer] & 0xFF);
            argumentPointer++;
          }
          break;
  
        case 'i':
          // signed integer (machine dependent size and byte order)
        case 'I':
          // unsigned integer (machine dependent size and byte order)
        case 'l':
          // signed long (always 32 bit, machine byte order)
        case 'L':
          // unsigned long (always 32 bit, machine byte order)
        case 'V':
          // unsigned long (always 32 bit, little endian byte order)
          if (quantifier === '*') {
            quantifier = arguments.length - argumentPointer;
          }
          if (quantifier > (arguments.length - argumentPointer)) {
            throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
          }
  
          for (i = 0; i < quantifier; i++) {
            result += String.fromCharCode(arguments[argumentPointer] & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] >> 16 & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] >> 24 & 0xFF);
            argumentPointer++;
          }
  
          break;
        case 'N':
          // unsigned long (always 32 bit, big endian byte order)
          if (quantifier === '*') {
            quantifier = arguments.length - argumentPointer;
          }
          if (quantifier > (arguments.length - argumentPointer)) {
            throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
          }
  
          for (i = 0; i < quantifier; i++) {
            result += String.fromCharCode(arguments[argumentPointer] >> 24 & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] >> 16 & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] >> 8 & 0xFF);
            result += String.fromCharCode(arguments[argumentPointer] & 0xFF);
            argumentPointer++;
          }
          break;
  
        case 'f':
          // float (machine dependent size and representation)
        case 'd':
          // double (machine dependent size and representation)
          // version original by IEEE754
          precisionBits = 23;
          exponentBits = 8;
          if (instruction === 'd') {
            precisionBits = 52;
            exponentBits = 11;
          }
  
          if (quantifier === '*') {
            quantifier = arguments.length - argumentPointer;
          }
          if (quantifier > (arguments.length - argumentPointer)) {
            throw new Error('Warning:  pack() Type ' + instruction + ': too few arguments');
          }
          for (i = 0; i < quantifier; i++) {
            argument = arguments[argumentPointer];
            bias = Math.pow(2, exponentBits - 1) - 1;
            minExp = -bias + 1;
            maxExp = bias;
            minUnnormExp = minExp - precisionBits;
            status = isNaN(n = parseFloat(argument)) || n === -Infinity || n === +Infinity ? n : 0;
            exp = 0;
            len = 2 * bias + 1 + precisionBits + 3;
            bin = new Array(len);
            signal = (n = status !== 0 ? 0 : n) < 0;
            n = Math.abs(n);
            intPart = Math.floor(n);
            floatPart = n - intPart;
  
            for (k = len; k;) {
              bin[--k] = 0;
            }
            for (k = bias + 2; intPart && k;) {
              bin[--k] = intPart % 2;
              intPart = Math.floor(intPart / 2);
            }
            for (k = bias + 1; floatPart > 0 && k; --floatPart) {
              (bin[++k] = ((floatPart *= 2) >= 1) - 0);
            }
            for (k = -1; ++k < len && !bin[k];) {}
  
            if (bin[(lastBit = precisionBits - 1 + (k = (exp = bias + 1 - k) >= minExp && exp <= maxExp ? k + 1 :
              bias + 1 - (exp = minExp - 1))) + 1]) {
              if (!(rounded = bin[lastBit])) {
                for (j = lastBit + 2; !rounded && j < len; rounded = bin[j++]) {}
              }
              for (j = lastBit + 1; rounded && --j >= 0;
                (bin[j] = !bin[j] - 0) && (rounded = 0)) {}
            }
  
            for (k = k - 2 < 0 ? -1 : k - 3; ++k < len && !bin[k];) {}
  
            if ((exp = bias + 1 - k) >= minExp && exp <= maxExp) {
              ++k;
            } else {
              if (exp < minExp) {
                if (exp !== bias + 1 - len && exp < minUnnormExp) { /*"encodeFloat::float underflow" */ }
                k = bias + 1 - (exp = minExp - 1);
              }
            }
  
            if (intPart || status !== 0) {
              exp = maxExp + 1;
              k = bias + 2;
              if (status === -Infinity) {
                signal = 1;
              } else if (isNaN(status)) {
                bin[k] = 1;
              }
            }
  
            n = Math.abs(exp + bias);
            tmpResult = '';
  
            for (j = exponentBits + 1; --j;) {
              tmpResult = (n % 2) + tmpResult;
              n = n >>= 1;
            }
  
            n = 0;
            j = 0;
            k = (tmpResult = (signal ? '1' : '0') + tmpResult + bin.slice(k, k + precisionBits)
              .join(''))
              .length;
            r = [];
  
            for (; k;) {
              n += (1 << j) * tmpResult.charAt(--k);
              if (j === 7) {
                r[r.length] = String.fromCharCode(n);
                n = 0;
              }
              j = (j + 1) % 8;
            }
  
            r[r.length] = n ? String.fromCharCode(n) : '';
            result += r.join('');
            argumentPointer++;
          }
          break;
  
        case 'x':
          // NUL byte
          if (quantifier === '*') {
            throw new Error('Warning: pack(): Type x: \'*\' ignored');
          }
          for (i = 0; i < quantifier; i++) {
            result += String.fromCharCode(0);
          }
          break;
  
        case 'X':
          // Back up one byte
          if (quantifier === '*') {
            throw new Error('Warning: pack(): Type X: \'*\' ignored');
          }
          for (i = 0; i < quantifier; i++) {
            if (result.length === 0) {
              throw new Error('Warning: pack(): Type X:' + ' outside of string');
            } else {
              result = result.substring(0, result.length - 1);
            }
          }
          break;
  
        case '@':
          // NUL-fill to absolute position
          if (quantifier === '*') {
            throw new Error('Warning: pack(): Type X: \'*\' ignored');
          }
          if (quantifier > result.length) {
            extraNullCount = quantifier - result.length;
            for (i = 0; i < extraNullCount; i++) {
              result += String.fromCharCode(0);
            }
          }
          if (quantifier < result.length) {
            result = result.substring(0, quantifier);
          }
          break;
  
        default:
          throw new Error('Warning:  pack() Type ' + instruction + ': unknown format code');
      }
    }
    if (argumentPointer < arguments.length) {
      throw new Error('Warning: pack(): ' + (arguments.length - argumentPointer) + ' arguments unused');
    }
  
    return result;
};

exports.time_sleep_until = function (timestamp) {
  while (new Date() < timestamp * 1000) {}
    return true;
};

exports.uniqid = function (prefix, more_entropy) {
  if (typeof prefix === 'undefined') {
      prefix = '';
    }
  
    var retId;
    var formatSeed = function(seed, reqWidth) {
      seed = parseInt(seed, 10)
        .toString(16); // to hex str
      if (reqWidth < seed.length) { // so long we split
        return seed.slice(seed.length - reqWidth);
      }
      if (reqWidth > seed.length) { // so short we pad
        return Array(1 + (reqWidth - seed.length))
          .join('0') + seed;
      }
      return seed;
    };
  
    // BEGIN REDUNDANT
    if (!this.php_js) {
      this.php_js = {};
    }
    // END REDUNDANT
    if (!this.php_js.uniqidSeed) { // init seed with big random int
      this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
    }
    this.php_js.uniqidSeed++;
  
    retId = prefix; // start with prefix, add current milliseconds hex string
    retId += formatSeed(parseInt(new Date()
      .getTime() / 1000, 10), 8);
    retId += formatSeed(this.php_js.uniqidSeed, 5); // add seed hex string
    if (more_entropy) {
      // for more entropy we add a float lower to 10
      retId += (Math.random() * 10)
        .toFixed(8)
        .toString();
    }
  
    return retId;
};

exports.gopher_parsedir = function (dirent) {
  /* Types
     * 0 = plain text file
     * 1 = directory menu listing
     * 2 = CSO search query
     * 3 = error message
     * 4 = BinHex encoded text file
     * 5 = binary archive file
     * 6 = UUEncoded text file
     * 7 = search engine query
     * 8 = telnet session pointer
     * 9 = binary file
     * g = Graphics file format, primarily a GIF file
     * h = HTML file
     * i = informational message
     * s = Audio file format, primarily a WAV file
     */
  
    var entryPattern = /^(.)(.*?)\t(.*?)\t(.*?)\t(.*?)\u000d\u000a$/;
    var entry = dirent.match(entryPattern);
  
    if (entry === null) {
      throw 'Could not parse the directory entry';
      // return false;
    }
  
    var type = entry[1];
    switch (type) {
      case 'i':
        type = 255; // GOPHER_INFO
        break;
      case '1':
        type = 1; // GOPHER_DIRECTORY
        break;
      case '0':
        type = 0; // GOPHER_DOCUMENT
        break;
      case '4':
        type = 4; // GOPHER_BINHEX
        break;
      case '5':
        type = 5; // GOPHER_DOSBINARY
        break;
      case '6':
        type = 6; // GOPHER_UUENCODED
        break;
      case '9':
        type = 9; // GOPHER_BINARY
        break;
      case 'h':
        type = 254; // GOPHER_HTTP
        break;
      default:
        return {
          type: -1,
          data: dirent
        }; // GOPHER_UNKNOWN
    }
    return {
      type: type,
      title: entry[2],
      path: entry[3],
      host: entry[4],
      port: entry[5]
    };
};

exports.inet_ntop = function (a) {
  var i = 0,
      m = '',
      c = [];
    a += '';
    if (a.length === 4) { // IPv4
      return [
        a.charCodeAt(0), a.charCodeAt(1), a.charCodeAt(2), a.charCodeAt(3)].join('.');
    } else if (a.length === 16) { // IPv6
      for (i = 0; i < 16; i++) {
        c.push(((a.charCodeAt(i++) << 8) + a.charCodeAt(i))
          .toString(16));
      }
      return c.join(':')
        .replace(/((^|:)0(?=:|$))+:?/g, function(t) {
          m = (t.length > m.length) ? t : m;
          return t;
        })
        .replace(m || ' ', '::');
    } else { // Invalid length
      return false;
    }
};

exports.inet_pton = function (a) {
  var r, m, x, i, j, f = String.fromCharCode;
    m = a.match(/^(?:\d{1,3}(?:\.|$)){4}/); // IPv4
    if (m) {
      m = m[0].split('.');
      m = f(m[0]) + f(m[1]) + f(m[2]) + f(m[3]);
      // Return if 4 bytes, otherwise false.
      return m.length === 4 ? m : false;
    }
    r = /^((?:[\da-f]{1,4}(?::|)){0,8})(::)?((?:[\da-f]{1,4}(?::|)){0,8})$/;
    m = a.match(r); // IPv6
    if (m) {
      // Translate each hexadecimal value.
      for (j = 1; j < 4; j++) {
        // Indice 2 is :: and if no length, continue.
        if (j === 2 || m[j].length === 0) {
          continue;
        }
        m[j] = m[j].split(':');
        for (i = 0; i < m[j].length; i++) {
          m[j][i] = parseInt(m[j][i], 16);
          // Would be NaN if it was blank, return false.
          if (isNaN(m[j][i])) {
            return false; // Invalid IP.
          }
          m[j][i] = f(m[j][i] >> 8) + f(m[j][i] & 0xFF);
        }
        m[j] = m[j].join('');
      }
      x = m[1].length + m[3].length;
      if (x === 16) {
        return m[1] + m[3];
      } else if (x < 16 && m[2].length > 0) {
        return m[1] + (new Array(16 - x + 1))
          .join('\x00') + m[3];
      }
    }
    return false; // Invalid IP.
};

exports.ip2long = function (IP) {
  var i = 0;
    // PHP allows decimal, octal, and hexadecimal IP components.
    // PHP allows between 1 (e.g. 127) to 4 (e.g 127.0.0.1) components.
    IP = IP.match(
      /^([1-9]\d*|0[0-7]*|0x[\da-f]+)(?:\.([1-9]\d*|0[0-7]*|0x[\da-f]+))?(?:\.([1-9]\d*|0[0-7]*|0x[\da-f]+))?(?:\.([1-9]\d*|0[0-7]*|0x[\da-f]+))?$/i
    ); // Verify IP format.
    if (!IP) {
      return false; // Invalid format.
    }
    // Reuse IP variable for component counter.
    IP[0] = 0;
    for (i = 1; i < 5; i += 1) {
      IP[0] += !! ((IP[i] || '')
        .length);
      IP[i] = parseInt(IP[i]) || 0;
    }
    // Continue to use IP for overflow values.
    // PHP does not allow any component to overflow.
    IP.push(256, 256, 256, 256);
    // Recalculate overflow of last component supplied to make up for missing components.
    IP[4 + IP[0]] *= Math.pow(256, 4 - IP[0]);
    if (IP[1] >= IP[5] || IP[2] >= IP[6] || IP[3] >= IP[7] || IP[4] >= IP[8]) {
      return false;
    }
    return IP[1] * (IP[0] === 1 || 16777216) + IP[2] * (IP[0] <= 2 || 65536) + IP[3] * (IP[0] <= 3 || 256) + IP[4] * 1;
};

exports.long2ip = function (ip) {
  if (!isFinite(ip))
      return false;
  
    return [ip >>> 24, ip >>> 16 & 0xFF, ip >>> 8 & 0xFF, ip & 0xFF].join('.');
};

exports.setrawcookie = function (name, value, expires, path, domain, secure) {
  if (typeof expires === 'string' && (/^\d+$/)
      .test(expires)) {
      expires = parseInt(expires, 10);
    }
  
    if (expires instanceof Date) {
      expires = expires.toGMTString();
    } else if (typeof expires === 'number') {
      expires = (new Date(expires * 1e3))
        .toGMTString();
    }
  
    var r = [name + '=' + value],
      s = {},
      i = '';
    s = {
      expires: expires,
      path: path,
      domain: domain
    };
    for (i in s) {
      if (s.hasOwnProperty(i)) { // Exclude items on Object.prototype
        s[i] && r.push(i + '=' + s[i]);
      }
    }
  
    return secure && r.push('secure'), this.window.document.cookie = r.join(';'), true;
};

exports.preg_grep = function (pattern, input, flags) {
  var p = '';
    var retObj = {};
    var invert = (flags === 1 || flags === 'PREG_GREP_INVERT'); // Todo: put flags as number and do bitwise checks (at least if other flags allowable); see pathinfo()
  
    if (typeof pattern === 'string') {
      pattern = eval(pattern);
    }
  
    if (invert) {
      for (p in input) {
        if ((input[p] + '')
          .search(pattern) === -1) {
          retObj[p] = input[p];
        }
      }
    } else {
      for (p in input) {
        if ((input[p] + '')
          .search(pattern) !== -1) {
          retObj[p] = input[p];
        }
      }
    }
  
    return retObj;
};

exports.preg_quote = function (str, delimiter) {
  return String(str)
      .replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
};

exports.addcslashes = function (str, charlist) {
  var target = '',
      chrs = [],
      i = 0,
      j = 0,
      c = '',
      next = '',
      rangeBegin = '',
      rangeEnd = '',
      chr = '',
      begin = 0,
      end = 0,
      octalLength = 0,
      postOctalPos = 0,
      cca = 0,
      escHexGrp = [],
      encoded = '',
      percentHex = /%([\dA-Fa-f]+)/g;
    var _pad = function(n, c) {
      if ((n = n + '')
        .length < c) {
        return new Array(++c - n.length)
          .join('0') + n;
      }
      return n;
    };
  
    for (i = 0; i < charlist.length; i++) {
      c = charlist.charAt(i);
      next = charlist.charAt(i + 1);
      if (c === '\\' && next && (/\d/)
        .test(next)) { // Octal
        rangeBegin = charlist.slice(i + 1)
          .match(/^\d+/)[0];
        octalLength = rangeBegin.length;
        postOctalPos = i + octalLength + 1;
        if (charlist.charAt(postOctalPos) + charlist.charAt(postOctalPos + 1) === '..') { // Octal begins range
          begin = rangeBegin.charCodeAt(0);
          if ((/\\\d/)
            .test(charlist.charAt(postOctalPos + 2) + charlist.charAt(postOctalPos + 3))) { // Range ends with octal
            rangeEnd = charlist.slice(postOctalPos + 3)
              .match(/^\d+/)[0];
            i += 1; // Skip range end backslash
          } else if (charlist.charAt(postOctalPos + 2)) { // Range ends with character
            rangeEnd = charlist.charAt(postOctalPos + 2);
          } else {
            throw 'Range with no end point';
          }
          end = rangeEnd.charCodeAt(0);
          if (end > begin) { // Treat as a range
            for (j = begin; j <= end; j++) {
              chrs.push(String.fromCharCode(j));
            }
          } else { // Supposed to treat period, begin and end as individual characters only, not a range
            chrs.push('.', rangeBegin, rangeEnd);
          }
          i += rangeEnd.length + 2; // Skip dots and range end (already skipped range end backslash if present)
        } else { // Octal is by itself
          chr = String.fromCharCode(parseInt(rangeBegin, 8));
          chrs.push(chr);
        }
        i += octalLength; // Skip range begin
      } else if (next + charlist.charAt(i + 2) === '..') { // Character begins range
        rangeBegin = c;
        begin = rangeBegin.charCodeAt(0);
        if ((/\\\d/)
          .test(charlist.charAt(i + 3) + charlist.charAt(i + 4))) { // Range ends with octal
          rangeEnd = charlist.slice(i + 4)
            .match(/^\d+/)[0];
          i += 1; // Skip range end backslash
        } else if (charlist.charAt(i + 3)) { // Range ends with character
          rangeEnd = charlist.charAt(i + 3);
        } else {
          throw 'Range with no end point';
        }
        end = rangeEnd.charCodeAt(0);
        if (end > begin) { // Treat as a range
          for (j = begin; j <= end; j++) {
            chrs.push(String.fromCharCode(j));
          }
        } else { // Supposed to treat period, begin and end as individual characters only, not a range
          chrs.push('.', rangeBegin, rangeEnd);
        }
        i += rangeEnd.length + 2; // Skip dots and range end (already skipped range end backslash if present)
      } else { // Character is by itself
        chrs.push(c);
      }
    }
  
    for (i = 0; i < str.length; i++) {
      c = str.charAt(i);
      if (chrs.indexOf(c) !== -1) {
        target += '\\';
        cca = c.charCodeAt(0);
        if (cca < 32 || cca > 126) { // Needs special escaping
          switch (c) {
            case '\n':
              target += 'n';
              break;
            case '\t':
              target += 't';
              break;
            case '\u000D':
              target += 'r';
              break;
            case '\u0007':
              target += 'a';
              break;
            case '\v':
              target += 'v';
              break;
            case '\b':
              target += 'b';
              break;
            case '\f':
              target += 'f';
              break;
            default:
              //target += _pad(cca.toString(8), 3);break; // Sufficient for UTF-16
              encoded = encodeURIComponent(c);
  
              // 3-length-padded UTF-8 octets
              if ((escHexGrp = percentHex.exec(encoded)) !== null) {
                target += _pad(parseInt(escHexGrp[1], 16)
                  .toString(8), 3); // already added a slash above
              }
              while ((escHexGrp = percentHex.exec(encoded)) !== null) {
                target += '\\' + _pad(parseInt(escHexGrp[1], 16)
                  .toString(8), 3);
              }
              break;
          }
        } else { // Perform regular backslashed escaping
          target += c;
        }
      } else { // Just add the character unescaped
        target += c;
      }
    }
    return target;
};

exports.addslashes = function (str) {
  return (str + '')
      .replace(/[\\"']/g, '\\$&')
      .replace(/\u0000/g, '\\0');
};

exports.bin2hex = function (s) {
  var i, l, o = '',
      n;
  
    s += '';
  
    for (i = 0, l = s.length; i < l; i++) {
      n = s.charCodeAt(i)
        .toString(16);
      o += n.length < 2 ? '0' + n : n;
    }
  
    return o;
};

exports.chr = function (codePt) {
  if (codePt > 0xFFFF) { // Create a four-byte string (length 2) since this code point is high
      //   enough for the UTF-16 encoding (JavaScript internal use), to
      //   require representation with two surrogates (reserved non-characters
      //   used for building other characters; the first is "high" and the next "low")
      codePt -= 0x10000;
      return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));
    }
    return String.fromCharCode(codePt);
};

exports.chunk_split = function (body, chunklen, end) {
  chunklen = parseInt(chunklen, 10) || 76;
    end = end || '\r\n';
  
    if (chunklen < 1) {
      return false;
    }
  
    return body.match(new RegExp('.{0,' + chunklen + '}', 'g'))
      .join(end);
};

exports.convert_cyr_string = function (str, from, to) {
  var _cyr_win1251 = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
      30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
      58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85,
      86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110,
      111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 46, 46, 46, 46, 46, 46, 46,
      46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 46, 154, 174,
      190, 46, 159, 189, 46, 46, 179, 191, 180, 157, 46, 46, 156, 183, 46, 46, 182, 166, 173, 46, 46, 158, 163, 152,
      164, 155, 46, 46, 46, 167, 225, 226, 247, 231, 228, 229, 246, 250, 233, 234, 235, 236, 237, 238, 239, 240, 242,
      243, 244, 245, 230, 232, 227, 254, 251, 253, 255, 249, 248, 252, 224, 241, 193, 194, 215, 199, 196, 197, 214,
      218, 201, 202, 203, 204, 205, 206, 207, 208, 210, 211, 212, 213, 198, 200, 195, 222, 219, 221, 223, 217, 216,
      220, 192, 209, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
      27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54,
      55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
      83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108,
      109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 32, 32, 32, 32,
      32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
      32, 32, 32, 184, 186, 32, 179, 191, 32, 32, 32, 32, 32, 180, 162, 32, 32, 32, 32, 168, 170, 32, 178, 175, 32,
      32, 32, 32, 32, 165, 161, 169, 254, 224, 225, 246, 228, 229, 244, 227, 245, 232, 233, 234, 235, 236, 237, 238,
      239, 255, 240, 241, 242, 243, 230, 226, 252, 251, 231, 248, 253, 249, 247, 250, 222, 192, 193, 214, 196, 197,
      212, 195, 213, 200, 201, 202, 203, 204, 205, 206, 207, 223, 208, 209, 210, 211, 198, 194, 220, 219, 199, 216,
      221, 217, 215, 218
    ],
      _cyr_cp866 = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
        29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
        56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
        83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107,
        108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 225,
        226, 247, 231, 228, 229, 246, 250, 233, 234, 235, 236, 237, 238, 239, 240, 242, 243, 244, 245, 230, 232,
        227, 254, 251, 253, 255, 249, 248, 252, 224, 241, 193, 194, 215, 199, 196, 197, 214, 218, 201, 202, 203,
        204, 205, 206, 207, 208, 35, 35, 35, 124, 124, 124, 124, 43, 43, 124, 124, 43, 43, 43, 43, 43, 43, 45, 45,
        124, 45, 43, 124, 124, 43, 43, 45, 45, 124, 45, 43, 45, 45, 45, 45, 43, 43, 43, 43, 43, 43, 43, 43, 35, 35,
        124, 124, 35, 210, 211, 212, 213, 198, 200, 195, 222, 219, 221, 223, 217, 216, 220, 192, 209, 179, 163, 180,
        164, 183, 167, 190, 174, 32, 149, 158, 32, 152, 159, 148, 154, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
        14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
        41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67,
        68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94,
        95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116,
        117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
        32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 205, 186, 213, 241, 243, 201,
        32, 245, 187, 212, 211, 200, 190, 32, 247, 198, 199, 204, 181, 240, 242, 185, 32, 244, 203, 207, 208, 202,
        216, 32, 246, 32, 238, 160, 161, 230, 164, 165, 228, 163, 229, 168, 169, 170, 171, 172, 173, 174, 175, 239,
        224, 225, 226, 227, 166, 162, 236, 235, 167, 232, 237, 233, 231, 234, 158, 128, 129, 150, 132, 133, 148,
        131, 149, 136, 137, 138, 139, 140, 141, 142, 143, 159, 144, 145, 146, 147, 134, 130, 156, 155, 135, 152,
        157, 153, 151, 154
      ],
      _cyr_iso88595 = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
        29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
        56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
        83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107,
        108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 32, 32,
        32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
        32, 32, 32, 32, 179, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 225, 226, 247, 231, 228, 229,
        246, 250, 233, 234, 235, 236, 237, 238, 239, 240, 242, 243, 244, 245, 230, 232, 227, 254, 251, 253, 255,
        249, 248, 252, 224, 241, 193, 194, 215, 199, 196, 197, 214, 218, 201, 202, 203, 204, 205, 206, 207, 208,
        210, 211, 212, 213, 198, 200, 195, 222, 219, 221, 223, 217, 216, 220, 192, 209, 32, 163, 32, 32, 32, 32, 32,
        32, 32, 32, 32, 32, 32, 32, 32, 32, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
        20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46,
        47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73,
        74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100,
        101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121,
        122, 123, 124, 125, 126, 127, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
        32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 241, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32,
        32, 32, 32, 32, 32, 161, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 238, 208, 209, 230, 212, 213, 228,
        211, 229, 216, 217, 218, 219, 220, 221, 222, 223, 239, 224, 225, 226, 227, 214, 210, 236, 235, 215, 232,
        237, 233, 231, 234, 206, 176, 177, 198, 180, 181, 196, 179, 197, 184, 185, 186, 187, 188, 189, 190, 191,
        207, 192, 193, 194, 195, 182, 178, 204, 203, 183, 200, 205, 201, 199, 202
      ],
      _cyr_mac = [
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
        29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55,
        56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82,
        83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107,
        108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 225,
        226, 247, 231, 228, 229, 246, 250, 233, 234, 235, 236, 237, 238, 239, 240, 242, 243, 244, 245, 230, 232,
        227, 254, 251, 253, 255, 249, 248, 252, 224, 241, 160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170,
        171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190, 191,
        128, 129, 130, 131, 132, 133, 134, 135, 136, 137, 138, 139, 140, 141, 142, 143, 144, 145, 146, 147, 148,
        149, 150, 151, 152, 153, 154, 155, 156, 179, 163, 209, 193, 194, 215, 199, 196, 197, 214, 218, 201, 202,
        203, 204, 205, 206, 207, 208, 210, 211, 212, 213, 198, 200, 195, 222, 219, 221, 223, 217, 216, 220, 192,
        255, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
        28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54,
        55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81,
        82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106,
        107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127,
        192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 210, 211, 212,
        213, 214, 215, 216, 217, 218, 219, 220, 221, 222, 223, 160, 161, 162, 222, 164, 165, 166, 167, 168, 169,
        170, 171, 172, 173, 174, 175, 176, 177, 178, 221, 180, 181, 182, 183, 184, 185, 186, 187, 188, 189, 190,
        191, 254, 224, 225, 246, 228, 229, 244, 227, 245, 232, 233, 234, 235, 236, 237, 238, 239, 223, 240, 241,
        242, 243, 230, 226, 252, 251, 231, 248, 253, 249, 247, 250, 158, 128, 129, 150, 132, 133, 148, 131, 149,
        136, 137, 138, 139, 140, 141, 142, 143, 159, 144, 145, 146, 147, 134, 130, 156, 155, 135, 152, 157, 153,
        151, 154
      ];
  
    var from_table = null,
      to_table = null,
      tmp, i = 0,
      retStr = '';
  
    switch (from.toUpperCase()) {
      case 'W':
        from_table = _cyr_win1251;
        break;
      case 'A':
      case 'D':
        from_table = _cyr_cp866;
        break;
      case 'I':
        from_table = _cyr_iso88595;
        break;
      case 'M':
        from_table = _cyr_mac;
        break;
      case 'K':
        break;
      default:
        throw 'Unknown source charset: ' + from; // warning
    }
  
    switch (to.toUpperCase()) {
      case 'W':
        to_table = _cyr_win1251;
        break;
      case 'A':
      case 'D':
        to_table = _cyr_cp866;
        break;
      case 'I':
        to_table = _cyr_iso88595;
        break;
      case 'M':
        to_table = _cyr_mac;
        break;
      case 'K':
        break;
      default:
        throw 'Unknown destination charset: ' + to; // fix: make a warning
    }
  
    if (!str) {
      return str;
    }
  
    for (i = 0; i < str.length; i++) {
      tmp = (from_table === null) ? str.charAt(i) : String.fromCharCode(from_table[str.charAt(i)
        .charCodeAt(0)]);
      retStr += (to_table === null) ? tmp : String.fromCharCode(to_table[tmp.charCodeAt(0) + 256]);
    }
    return retStr;
};

exports.count_chars = function (str, mode) {
  var result = {},
      resultArr = [],
      i;
  
    str = ('' + str)
      .split('')
      .sort()
      .join('')
      .match(/(.)\1*/g);
  
    if ((mode & 1) == 0) {
      for (i = 0; i != 256; i++) {
        result[i] = 0;
      }
    }
  
    if (mode === 2 || mode === 4) {
  
      for (i = 0; i != str.length; i += 1) {
        delete result[str[i].charCodeAt(0)];
      }
      for (i in result) {
        result[i] = (mode === 4) ? String.fromCharCode(i) : 0;
      }
  
    } else if (mode === 3) {
  
      for (i = 0; i != str.length; i += 1) {
        result[i] = str[i].slice(0, 1);
      }
  
    } else {
  
      for (i = 0; i != str.length; i += 1) {
        result[str[i].charCodeAt(0)] = str[i].length;
      }
  
    }
    if (mode < 3) {
      return result;
    }
  
    for (i in result) {
      resultArr.push(result[i]);
    }
    return resultArr.join('');
};

exports.explode = function (delimiter, string, limit) {
  if (arguments.length < 2 || typeof delimiter === 'undefined' || typeof string === 'undefined') return null;
    if (delimiter === '' || delimiter === false || delimiter === null) return false;
    if (typeof delimiter === 'function' || typeof delimiter === 'object' || typeof string === 'function' || typeof string ===
      'object') {
      return {
        0: ''
      };
    }
    if (delimiter === true) delimiter = '1';
  
    // Here we go...
    delimiter += '';
    string += '';
  
    var s = string.split(delimiter);
  
    if (typeof limit === 'undefined') return s;
  
    // Support for limit
    if (limit === 0) limit = 1;
  
    // Positive limit
    if (limit > 0) {
      if (limit >= s.length) return s;
      return s.slice(0, limit - 1)
        .concat([s.slice(limit - 1)
          .join(delimiter)
        ]);
    }
  
    // Negative limit
    if (-limit >= s.length) return [];
  
    s.splice(s.length + limit);
    return s;
};

exports.get_html_translation_table = function (table, quote_style) {
  var entities = {},
      hash_map = {},
      decimal;
    var constMappingTable = {},
      constMappingQuoteStyle = {};
    var useTable = {},
      useQuoteStyle = {};
  
    // Translate arguments
    constMappingTable[0] = 'HTML_SPECIALCHARS';
    constMappingTable[1] = 'HTML_ENTITIES';
    constMappingQuoteStyle[0] = 'ENT_NOQUOTES';
    constMappingQuoteStyle[2] = 'ENT_COMPAT';
    constMappingQuoteStyle[3] = 'ENT_QUOTES';
  
    useTable = !isNaN(table) ? constMappingTable[table] : table ? table.toUpperCase() : 'HTML_SPECIALCHARS';
    useQuoteStyle = !isNaN(quote_style) ? constMappingQuoteStyle[quote_style] : quote_style ? quote_style.toUpperCase() :
      'ENT_COMPAT';
  
    if (useTable !== 'HTML_SPECIALCHARS' && useTable !== 'HTML_ENTITIES') {
      throw new Error('Table: ' + useTable + ' not supported');
      // return false;
    }
  
    entities['38'] = '&amp;';
    if (useTable === 'HTML_ENTITIES') {
      entities['160'] = '&nbsp;';
      entities['161'] = '&iexcl;';
      entities['162'] = '&cent;';
      entities['163'] = '&pound;';
      entities['164'] = '&curren;';
      entities['165'] = '&yen;';
      entities['166'] = '&brvbar;';
      entities['167'] = '&sect;';
      entities['168'] = '&uml;';
      entities['169'] = '&copy;';
      entities['170'] = '&ordf;';
      entities['171'] = '&laquo;';
      entities['172'] = '&not;';
      entities['173'] = '&shy;';
      entities['174'] = '&reg;';
      entities['175'] = '&macr;';
      entities['176'] = '&deg;';
      entities['177'] = '&plusmn;';
      entities['178'] = '&sup2;';
      entities['179'] = '&sup3;';
      entities['180'] = '&acute;';
      entities['181'] = '&micro;';
      entities['182'] = '&para;';
      entities['183'] = '&middot;';
      entities['184'] = '&cedil;';
      entities['185'] = '&sup1;';
      entities['186'] = '&ordm;';
      entities['187'] = '&raquo;';
      entities['188'] = '&frac14;';
      entities['189'] = '&frac12;';
      entities['190'] = '&frac34;';
      entities['191'] = '&iquest;';
      entities['192'] = '&Agrave;';
      entities['193'] = '&Aacute;';
      entities['194'] = '&Acirc;';
      entities['195'] = '&Atilde;';
      entities['196'] = '&Auml;';
      entities['197'] = '&Aring;';
      entities['198'] = '&AElig;';
      entities['199'] = '&Ccedil;';
      entities['200'] = '&Egrave;';
      entities['201'] = '&Eacute;';
      entities['202'] = '&Ecirc;';
      entities['203'] = '&Euml;';
      entities['204'] = '&Igrave;';
      entities['205'] = '&Iacute;';
      entities['206'] = '&Icirc;';
      entities['207'] = '&Iuml;';
      entities['208'] = '&ETH;';
      entities['209'] = '&Ntilde;';
      entities['210'] = '&Ograve;';
      entities['211'] = '&Oacute;';
      entities['212'] = '&Ocirc;';
      entities['213'] = '&Otilde;';
      entities['214'] = '&Ouml;';
      entities['215'] = '&times;';
      entities['216'] = '&Oslash;';
      entities['217'] = '&Ugrave;';
      entities['218'] = '&Uacute;';
      entities['219'] = '&Ucirc;';
      entities['220'] = '&Uuml;';
      entities['221'] = '&Yacute;';
      entities['222'] = '&THORN;';
      entities['223'] = '&szlig;';
      entities['224'] = '&agrave;';
      entities['225'] = '&aacute;';
      entities['226'] = '&acirc;';
      entities['227'] = '&atilde;';
      entities['228'] = '&auml;';
      entities['229'] = '&aring;';
      entities['230'] = '&aelig;';
      entities['231'] = '&ccedil;';
      entities['232'] = '&egrave;';
      entities['233'] = '&eacute;';
      entities['234'] = '&ecirc;';
      entities['235'] = '&euml;';
      entities['236'] = '&igrave;';
      entities['237'] = '&iacute;';
      entities['238'] = '&icirc;';
      entities['239'] = '&iuml;';
      entities['240'] = '&eth;';
      entities['241'] = '&ntilde;';
      entities['242'] = '&ograve;';
      entities['243'] = '&oacute;';
      entities['244'] = '&ocirc;';
      entities['245'] = '&otilde;';
      entities['246'] = '&ouml;';
      entities['247'] = '&divide;';
      entities['248'] = '&oslash;';
      entities['249'] = '&ugrave;';
      entities['250'] = '&uacute;';
      entities['251'] = '&ucirc;';
      entities['252'] = '&uuml;';
      entities['253'] = '&yacute;';
      entities['254'] = '&thorn;';
      entities['255'] = '&yuml;';
    }
  
    if (useQuoteStyle !== 'ENT_NOQUOTES') {
      entities['34'] = '&quot;';
    }
    if (useQuoteStyle === 'ENT_QUOTES') {
      entities['39'] = '&#39;';
    }
    entities['60'] = '&lt;';
    entities['62'] = '&gt;';
  
    // ascii decimals to real symbols
    for (decimal in entities) {
      if (entities.hasOwnProperty(decimal)) {
        hash_map[String.fromCharCode(decimal)] = entities[decimal];
      }
    }
  
    return hash_map;
};

exports.echo = function () {
  var isNode = typeof module !== 'undefined' && module.exports && typeof global !== "undefined" && {}.toString.call(global) == '[object global]';
    if (isNode) {
      var args = Array.prototype.slice.call(arguments);
      return console.log(args.join(' '));
    }
  
    var arg = '',
      argc = arguments.length,
      argv = arguments,
      i = 0,
      holder, win = this.window,
      d = win.document,
      ns_xhtml = 'http://www.w3.org/1999/xhtml',
      ns_xul = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul'; // If we're in a XUL context
    var stringToDOM = function(str, parent, ns, container) {
      var extraNSs = '';
      if (ns === ns_xul) {
        extraNSs = ' xmlns:html="' + ns_xhtml + '"';
      }
      var stringContainer = '<' + container + ' xmlns="' + ns + '"' + extraNSs + '>' + str + '</' + container + '>';
      var dils = win.DOMImplementationLS,
        dp = win.DOMParser,
        ax = win.ActiveXObject;
      if (dils && dils.createLSInput && dils.createLSParser) {
        // Follows the DOM 3 Load and Save standard, but not
        // implemented in browsers at present; HTML5 is to standardize on innerHTML, but not for XML (though
        // possibly will also standardize with DOMParser); in the meantime, to ensure fullest browser support, could
        // attach http://svn2.assembla.com/svn/brettz9/DOMToString/DOM3.js (see http://svn2.assembla.com/svn/brettz9/DOMToString/DOM3.xhtml for a simple test file)
        var lsInput = dils.createLSInput();
        // If we're in XHTML, we'll try to allow the XHTML namespace to be available by default
        lsInput.stringData = stringContainer;
        var lsParser = dils.createLSParser(1, null); // synchronous, no schema type
        return lsParser.parse(lsInput)
          .firstChild;
      } else if (dp) {
        // If we're in XHTML, we'll try to allow the XHTML namespace to be available by default
        try {
          var fc = new dp()
            .parseFromString(stringContainer, 'text/xml');
          if (fc && fc.documentElement && fc.documentElement.localName !== 'parsererror' && fc.documentElement.namespaceURI !==
            'http://www.mozilla.org/newlayout/xml/parsererror.xml') {
            return fc.documentElement.firstChild;
          }
          // If there's a parsing error, we just continue on
        } catch (e) {
          // If there's a parsing error, we just continue on
        }
      } else if (ax) { // We don't bother with a holder in Explorer as it doesn't support namespaces
        var axo = new ax('MSXML2.DOMDocument');
        axo.loadXML(str);
        return axo.documentElement;
      }
      /*else if (win.XMLHttpRequest) { // Supposed to work in older Safari
        var req = new win.XMLHttpRequest;
        req.open('GET', 'data:application/xml;charset=utf-8,'+encodeURIComponent(str), false);
        if (req.overrideMimeType) {
          req.overrideMimeType('application/xml');
        }
        req.send(null);
        return req.responseXML;
      }*/
      // Document fragment did not work with innerHTML, so we create a temporary element holder
      // If we're in XHTML, we'll try to allow the XHTML namespace to be available by default
      //if (d.createElementNS && (d.contentType && d.contentType !== 'text/html')) { // Don't create namespaced elements if we're being served as HTML (currently only Mozilla supports this detection in true XHTML-supporting browsers, but Safari and Opera should work with the above DOMParser anyways, and IE doesn't support createElementNS anyways)
      if (d.createElementNS && // Browser supports the method
        (d.documentElement.namespaceURI || // We can use if the document is using a namespace
          d.documentElement.nodeName.toLowerCase() !== 'html' || // We know it's not HTML4 or less, if the tag is not HTML (even if the root namespace is null)
          (d.contentType && d.contentType !== 'text/html') // We know it's not regular HTML4 or less if this is Mozilla (only browser supporting the attribute) and the content type is something other than text/html; other HTML5 roots (like svg) still have a namespace
        )) { // Don't create namespaced elements if we're being served as HTML (currently only Mozilla supports this detection in true XHTML-supporting browsers, but Safari and Opera should work with the above DOMParser anyways, and IE doesn't support createElementNS anyways); last test is for the sake of being in a pure XML document
        holder = d.createElementNS(ns, container);
      } else {
        holder = d.createElement(container); // Document fragment did not work with innerHTML
      }
      holder.innerHTML = str;
      while (holder.firstChild) {
        parent.appendChild(holder.firstChild);
      }
      return false;
      // throw 'Your browser does not support DOM parsing as required by echo()';
    };
  
    var ieFix = function(node) {
      if (node.nodeType === 1) {
        var newNode = d.createElement(node.nodeName);
        var i, len;
        if (node.attributes && node.attributes.length > 0) {
          for (i = 0, len = node.attributes.length; i < len; i++) {
            newNode.setAttribute(node.attributes[i].nodeName, node.getAttribute(node.attributes[i].nodeName));
          }
        }
        if (node.childNodes && node.childNodes.length > 0) {
          for (i = 0, len = node.childNodes.length; i < len; i++) {
            newNode.appendChild(ieFix(node.childNodes[i]));
          }
        }
        return newNode;
      } else {
        return d.createTextNode(node.nodeValue);
      }
    };
  
    var replacer = function(s, m1, m2) {
      // We assume for now that embedded variables do not have dollar sign; to add a dollar sign, you currently must use {$$var} (We might change this, however.)
      // Doesn't cover all cases yet: see http://php.net/manual/en/language.types.string.php#language.types.string.syntax.double
      if (m1 !== '\\') {
        return m1 + eval(m2);
      } else {
        return s;
      }
    };
  
    this.php_js = this.php_js || {};
    var phpjs = this.php_js,
      ini = phpjs.ini,
      obs = phpjs.obs;
    for (i = 0; i < argc; i++) {
      arg = argv[i];
      if (ini && ini['phpjs.echo_embedded_vars']) {
        arg = arg.replace(/(.?)\{?\$(\w*?\}|\w*)/g, replacer);
      }
  
      if (!phpjs.flushing && obs && obs.length) { // If flushing we output, but otherwise presence of a buffer means caching output
        obs[obs.length - 1].buffer += arg;
        continue;
      }
  
      if (d.appendChild) {
        if (d.body) {
          if (win.navigator.appName === 'Microsoft Internet Explorer') { // We unfortunately cannot use feature detection, since this is an IE bug with cloneNode nodes being appended
            d.body.appendChild(stringToDOM(ieFix(arg)));
          } else {
            var unappendedLeft = stringToDOM(arg, d.body, ns_xhtml, 'div')
              .cloneNode(true); // We will not actually append the div tag (just using for providing XHTML namespace by default)
            if (unappendedLeft) {
              d.body.appendChild(unappendedLeft);
            }
          }
        } else {
          d.documentElement.appendChild(stringToDOM(arg, d.documentElement, ns_xul, 'description')); // We will not actually append the description tag (just using for providing XUL namespace by default)
        }
      } else if (d.write) {
        d.write(arg);
      }
      /* else { // This could recurse if we ever add print!
        print(arg);
      }*/
    }
};

exports.htmlspecialchars = function (string, quote_style, charset, double_encode) {
  var optTemp = 0,
      i = 0,
      noquotes = false;
    if (typeof quote_style === 'undefined' || quote_style === null) {
      quote_style = 2;
    }
    string = string.toString();
    if (double_encode !== false) { // Put this first to avoid double-encoding
      string = string.replace(/&/g, '&amp;');
    }
    string = string.replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  
    var OPTS = {
      'ENT_NOQUOTES': 0,
      'ENT_HTML_QUOTE_SINGLE': 1,
      'ENT_HTML_QUOTE_DOUBLE': 2,
      'ENT_COMPAT': 2,
      'ENT_QUOTES': 3,
      'ENT_IGNORE': 4
    };
    if (quote_style === 0) {
      noquotes = true;
    }
    if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
      quote_style = [].concat(quote_style);
      for (i = 0; i < quote_style.length; i++) {
        // Resolve string input to bitwise e.g. 'ENT_IGNORE' becomes 4
        if (OPTS[quote_style[i]] === 0) {
          noquotes = true;
        } else if (OPTS[quote_style[i]]) {
          optTemp = optTemp | OPTS[quote_style[i]];
        }
      }
      quote_style = optTemp;
    }
    if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
      string = string.replace(/'/g, '&#039;');
    }
    if (!noquotes) {
      string = string.replace(/"/g, '&quot;');
    }
  
    return string;
};

exports.htmlspecialchars_decode = function (string, quote_style) {
  var optTemp = 0,
      i = 0,
      noquotes = false;
    if (typeof quote_style === 'undefined') {
      quote_style = 2;
    }
    string = string.toString()
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    var OPTS = {
      'ENT_NOQUOTES': 0,
      'ENT_HTML_QUOTE_SINGLE': 1,
      'ENT_HTML_QUOTE_DOUBLE': 2,
      'ENT_COMPAT': 2,
      'ENT_QUOTES': 3,
      'ENT_IGNORE': 4
    };
    if (quote_style === 0) {
      noquotes = true;
    }
    if (typeof quote_style !== 'number') { // Allow for a single string or an array of string flags
      quote_style = [].concat(quote_style);
      for (i = 0; i < quote_style.length; i++) {
        // Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
        if (OPTS[quote_style[i]] === 0) {
          noquotes = true;
        } else if (OPTS[quote_style[i]]) {
          optTemp = optTemp | OPTS[quote_style[i]];
        }
      }
      quote_style = optTemp;
    }
    if (quote_style & OPTS.ENT_HTML_QUOTE_SINGLE) {
      string = string.replace(/&#0*39;/g, "'"); // PHP doesn't currently escape if more than one 0, but it should
      // string = string.replace(/&apos;|&#x0*27;/g, "'"); // This would also be useful here, but not a part of PHP
    }
    if (!noquotes) {
      string = string.replace(/&quot;/g, '"');
    }
    // Put this in last place to avoid escape being double-decoded
    string = string.replace(/&amp;/g, '&');
  
    return string;
};

exports.implode = function (glue, pieces) {
  var i = '',
      retVal = '',
      tGlue = '';
    if (arguments.length === 1) {
      pieces = glue;
      glue = '';
    }
    if (typeof pieces === 'object') {
      if (Object.prototype.toString.call(pieces) === '[object Array]') {
        return pieces.join(glue);
      }
      for (i in pieces) {
        retVal += tGlue + pieces[i];
        tGlue = glue;
      }
      return retVal;
    }
    return pieces;
};

exports.lcfirst = function (str) {
  str += '';
    var f = str.charAt(0)
      .toLowerCase();
    return f + str.substr(1);
};

exports.levenshtein = function (s1, s2) {
  if (s1 == s2) {
      return 0;
    }
  
    var s1_len = s1.length;
    var s2_len = s2.length;
    if (s1_len === 0) {
      return s2_len;
    }
    if (s2_len === 0) {
      return s1_len;
    }
  
    // BEGIN STATIC
    var split = false;
    try {
      split = !('0')[0];
    } catch (e) {
      split = true; // Earlier IE may not support access by string index
    }
    // END STATIC
    if (split) {
      s1 = s1.split('');
      s2 = s2.split('');
    }
  
    var v0 = new Array(s1_len + 1);
    var v1 = new Array(s1_len + 1);
  
    var s1_idx = 0,
      s2_idx = 0,
      cost = 0;
    for (s1_idx = 0; s1_idx < s1_len + 1; s1_idx++) {
      v0[s1_idx] = s1_idx;
    }
    var char_s1 = '',
      char_s2 = '';
    for (s2_idx = 1; s2_idx <= s2_len; s2_idx++) {
      v1[0] = s2_idx;
      char_s2 = s2[s2_idx - 1];
  
      for (s1_idx = 0; s1_idx < s1_len; s1_idx++) {
        char_s1 = s1[s1_idx];
        cost = (char_s1 == char_s2) ? 0 : 1;
        var m_min = v0[s1_idx + 1] + 1;
        var b = v1[s1_idx] + 1;
        var c = v0[s1_idx] + cost;
        if (b < m_min) {
          m_min = b;
        }
        if (c < m_min) {
          m_min = c;
        }
        v1[s1_idx + 1] = m_min;
      }
      var v_tmp = v0;
      v0 = v1;
      v1 = v_tmp;
    }
    return v0[s1_len];
};

exports.ltrim = function (str, charlist) {
  charlist = !charlist ? ' \\s\u00A0' : (charlist + '')
      .replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
    var re = new RegExp('^[' + charlist + ']+', 'g');
    return (str + '')
      .replace(re, '');
};

exports.metaphone = function (word, max_phonemes) {
  var type = typeof word;
  
    if (type === 'undefined' || type === 'object' && word !== null) {
      return null; // weird!
    }
  
    // infinity and NaN values are treated as strings
    if (type === 'number') {
      if (isNaN(word)) {
        word = 'NAN';
      } else if (!isFinite(word)) {
        word = 'INF';
      }
    }
  
    if (max_phonemes < 0) {
      return false;
    }
  
    max_phonemes = Math.floor(+max_phonemes) || 0;
  
    // alpha depends on locale, so this var might need an update
    // or should be turned into a regex
    // for now assuming pure a-z
    var alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      vowel = 'AEIOU',
      soft = 'EIY',
      leadingNonAlpha = new RegExp('^[^' + alpha + ']+');
  
    word = typeof word === 'string' ? word : '';
    word = word.toUpperCase()
      .replace(leadingNonAlpha, '');
  
    if (!word) {
      return '';
    }
  
    var is = function(p, c) {
      return c !== '' && p.indexOf(c) !== -1;
    };
  
    var i = 0,
      cc = word.charAt(0), // current char. Short name, because it's used all over the function
      nc = word.charAt(1), // next char
      nnc, // after next char
      pc, // previous char
      l = word.length,
      meta = '',
      // traditional is an internal param that could be exposed
      // for now let it be a local var
      traditional = true;
  
    switch (cc) {
      case 'A':
        meta += nc === 'E' ? nc : cc;
        i += 1;
        break;
      case 'G':
      case 'K':
      case 'P':
        if (nc === 'N') {
          meta += nc;
          i += 2;
        }
        break;
      case 'W':
        if (nc === 'R') {
          meta += nc;
          i += 2;
        } else if (nc === 'H' || is(vowel, nc)) {
          meta += 'W';
          i += 2;
        }
        break;
      case 'X':
        meta += 'S';
        i += 1;
        break;
      case 'E':
      case 'I':
      case 'O':
      case 'U':
        meta += cc;
        i++;
        break;
    }
  
    for (; i < l && (max_phonemes === 0 || meta.length < max_phonemes); i += 1) {
      cc = word.charAt(i);
      nc = word.charAt(i + 1);
      pc = word.charAt(i - 1);
      nnc = word.charAt(i + 2);
  
      if (cc === pc && cc !== 'C') {
        continue;
      }
  
      switch (cc) {
        case 'B':
          if (pc !== 'M') {
            meta += cc;
          }
          break;
        case 'C':
          if (is(soft, nc)) {
            if (nc === 'I' && nnc === 'A') {
              meta += 'X';
            } else if (pc !== 'S') {
              meta += 'S';
            }
          } else if (nc === 'H') {
            meta += !traditional && (nnc === 'R' || pc === 'S') ? 'K' : 'X';
            i += 1;
          } else {
            meta += 'K';
          }
          break;
        case 'D':
          if (nc === 'G' && is(soft, nnc)) {
            meta += 'J';
            i += 1;
          } else {
            meta += 'T';
          }
          break;
        case 'G':
          if (nc === 'H') {
            if (!(is('BDH', word.charAt(i - 3)) || word.charAt(i - 4) === 'H')) {
              meta += 'F';
              i += 1;
            }
          } else if (nc === 'N') {
            if (is(alpha, nnc) && word.substr(i + 1, 3) !== 'NED') {
              meta += 'K';
            }
          } else if (is(soft, nc) && pc !== 'G') {
            meta += 'J';
          } else {
            meta += 'K';
          }
          break;
        case 'H':
          if (is(vowel, nc) && !is('CGPST', pc)) {
            meta += cc;
          }
          break;
        case 'K':
          if (pc !== 'C') {
            meta += 'K';
          }
          break;
        case 'P':
          meta += nc === 'H' ? 'F' : cc;
          break;
        case 'Q':
          meta += 'K';
          break;
        case 'S':
          if (nc === 'I' && is('AO', nnc)) {
            meta += 'X';
          } else if (nc === 'H') {
            meta += 'X';
            i += 1;
          } else if (!traditional && word.substr(i + 1, 3) === 'CHW') {
            meta += 'X';
            i += 2;
          } else {
            meta += 'S';
          }
          break;
        case 'T':
          if (nc === 'I' && is('AO', nnc)) {
            meta += 'X';
          } else if (nc === 'H') {
            meta += '0';
            i += 1;
          } else if (word.substr(i + 1, 2) !== 'CH') {
            meta += 'T';
          }
          break;
        case 'V':
          meta += 'F';
          break;
        case 'W':
        case 'Y':
          if (is(vowel, nc)) {
            meta += cc;
          }
          break;
        case 'X':
          meta += 'KS';
          break;
        case 'Z':
          meta += 'S';
          break;
        case 'F':
        case 'J':
        case 'L':
        case 'M':
        case 'N':
        case 'R':
          meta += cc;
          break;
      }
    }
  
    return meta;
  
    /*
    "    abc", "ABK", // skip leading whitespace
    "1234.678!@abc", "ABK", // skip leading non-alpha chars
    "aero", "ER", // leading 'a' followed by 'e' turns into 'e'
    "air", "AR", // leading 'a' turns into 'e', other vowels ignored
    // leading vowels added to result
    "egg", "EK",
    "if", "IF",
    "of", "OF",
    "use", "US",
    // other vowels ignored
    "xAEIOU", "S",
    // GN, KN, PN become 'N'
    "gnome", "NM",
    "knight", "NFT",
    "pneumatic", "NMTK",
    // leading 'WR' becomes 'R'
    "wrong", "RNK",
    // leading 'WH+vowel" becomes 'W'
    "wheel", "WL",
    // leading 'X' becomes 'S', 'KS' otherwise
    "xerox", "SRKS",
    "exchange", "EKSXNJ",
    // duplicate chars, except 'C' are ignored
    "accuracy", "AKKRS",
    "blogger", "BLKR",
    "fffound", "FNT",
    // ignore 'B' if after 'M'
    "billboard", "BLBRT",
    "symbol", "SML",
    // 'CIA' -> 'X'
    "special", "SPXL",
    // 'SC[IEY]' -> 'C' ignored
    "science", "SNS",
    // '[^S]C' -> 'C' becomes 'S'
    "dance", "TNS",
    // 'CH' -> 'X'
    "change", "XNJ",
    "school", "SXL",
    // 'C' -> 'K'
    "micro", "MKR",
    // 'DGE', 'DGI', DGY' -> 'J'
    // 'T' otherwise
    "bridge", "BRJ",
    "pidgin", "PJN",
    "edgy", "EJ",
    "handgun", "HNTKN",
    "draw", "TR",
    //'GN\b' 'GNED' -> ignore 'G'
    "sign", "SN",
    "signed", "SNT",
    "signs", "SKNS",
    // [^G]G[EIY] -> 'J'...
    "agency", "AJNS",
    // 'GH' -> 'F' if not b--gh, d--gh, h--gh
    "night", "NFT",
    "bright", "BRT",
    "height", "HT",
    "midnight", "MTNT",
    // 'K' otherwise
    "jogger", "JKR",
    // '[^CGPST]H[AEIOU]' -> 'H', ignore otherwise
    "horse", "HRS",
    "adhere", "ATHR",
    "mahjong", "MJNK",
    "fight", "FFT", // interesting
    "ghost", "FST",
    // 'K' -> 'K' if not after 'C'
    "ski", "SK",
    "brick", "BRK",
    // 'PH' -> 'F'
    "phrase", "FRS",
    // 'P.' -> 'P'
    "hypnotic", "PNTK",
    "topnotch", "TPNX",
    // 'Q' -> 'K'
    "quit", "KT",
    "squid", "SKT",
    // 'SIO', 'SIA', 'SH' -> 'X'
    "version", "FRXN",
    "silesia", "SLX",
    "enthusiasm", "EN0XSM",
    "shell", "XL",
    // 'S' -> 'S' in other cases
    "spy", "SP",
    "system", "SSTM",
    // 'TIO', 'TIA' -> 'X'
    "ratio", "RX",
    "nation", "NXN",
    "spatial", "SPXL",
    // 'TH' -> '0'
    "the", "0",
    "nth", "N0",
    "truth", "TR0",
    // 'TCH' -> ignore 'T'
    "watch", "WX",
    // 'T' otherwise
    "vote", "FT",
    "tweet", "TWT",
    // 'V' -> 'F'
    "evolve", "EFLF",
    // 'W' -> 'W' if followed by vowel
    "rewrite", "RRT",
    "outwrite", "OTRT",
    "artwork", "ARTWRK",
    // 'X' -> 'KS' if not first char
    "excel", "EKSSL",
    // 'Y' -> 'Y' if followed by vowel
    "cyan", "SYN",
    "way", "W",
    "hybrid", "BRT",
    // 'Z' -> 'S'
    "zip", "SP",
    "zoom", "SM",
    "jazz", "JS",
    "zigzag", "SKSK",
    "abc abc", "ABKBK" // eventhough there are two words, second 'a' is ignored
    */
};

exports.nl2br = function (str, is_xhtml) {
  var breakTag = (is_xhtml || typeof is_xhtml === 'undefined') ? '<br ' + '/>' : '<br>'; // Adjust comment to avoid issue on phpjs.org display
  
    return (str + '')
      .replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
};

exports.number_format = function (number, decimals, dec_point, thousands_sep) {
  number = (number + '')
      .replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
      prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
      sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
      dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
      s = '',
      toFixedFix = function(n, prec) {
        var k = Math.pow(10, prec);
        return '' + (Math.round(n * k) / k)
          .toFixed(prec);
      };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
      .split('.');
    if (s[0].length > 3) {
      s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '')
      .length < prec) {
      s[1] = s[1] || '';
      s[1] += new Array(prec - s[1].length + 1)
        .join('0');
    }
    return s.join(dec);
};

exports.ord = function (string) {
  var str = string + '',
      code = str.charCodeAt(0);
    if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
      var hi = code;
      if (str.length === 1) {
        return code; // This is just a high surrogate with no following low surrogate, so we return its value;
        // we could also throw an error as it is not a complete character, but someone may want to know
      }
      var low = str.charCodeAt(1);
      return ((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000;
    }
    if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
      return code; // This is just a low surrogate with no preceding high surrogate, so we return its value;
      // we could also throw an error as it is not a complete character, but someone may want to know
    }
    return code;
};

exports.parse_str = function (str, array) {
  var strArr = String(str)
      .replace(/^&/, '')
      .replace(/&$/, '')
      .split('&'),
      sal = strArr.length,
      i, j, ct, p, lastObj, obj, lastIter, undef, chr, tmp, key, value,
      postLeftBracketPos, keys, keysLen,
      fixStr = function(str) {
        return decodeURIComponent(str.replace(/\+/g, '%20'));
      };
  
    if (!array) {
      array = this.window;
    }
  
    for (i = 0; i < sal; i++) {
      tmp = strArr[i].split('=');
      key = fixStr(tmp[0]);
      value = (tmp.length < 2) ? '' : fixStr(tmp[1]);
  
      while (key.charAt(0) === ' ') {
        key = key.slice(1);
      }
      if (key.indexOf('\x00') > -1) {
        key = key.slice(0, key.indexOf('\x00'));
      }
      if (key && key.charAt(0) !== '[') {
        keys = [];
        postLeftBracketPos = 0;
        for (j = 0; j < key.length; j++) {
          if (key.charAt(j) === '[' && !postLeftBracketPos) {
            postLeftBracketPos = j + 1;
          } else if (key.charAt(j) === ']') {
            if (postLeftBracketPos) {
              if (!keys.length) {
                keys.push(key.slice(0, postLeftBracketPos - 1));
              }
              keys.push(key.substr(postLeftBracketPos, j - postLeftBracketPos));
              postLeftBracketPos = 0;
              if (key.charAt(j + 1) !== '[') {
                break;
              }
            }
          }
        }
        if (!keys.length) {
          keys = [key];
        }
        for (j = 0; j < keys[0].length; j++) {
          chr = keys[0].charAt(j);
          if (chr === ' ' || chr === '.' || chr === '[') {
            keys[0] = keys[0].substr(0, j) + '_' + keys[0].substr(j + 1);
          }
          if (chr === '[') {
            break;
          }
        }
  
        obj = array;
        for (j = 0, keysLen = keys.length; j < keysLen; j++) {
          key = keys[j].replace(/^['"]/, '')
            .replace(/['"]$/, '');
          lastIter = j !== keys.length - 1;
          lastObj = obj;
          if ((key !== '' && key !== ' ') || j === 0) {
            if (obj[key] === undef) {
              obj[key] = {};
            }
            obj = obj[key];
          } else { // To insert new dimension
            ct = -1;
            for (p in obj) {
              if (obj.hasOwnProperty(p)) {
                if (+p > ct && p.match(/^\d+$/g)) {
                  ct = +p;
                }
              }
            }
            key = ct + 1;
          }
        }
        lastObj[key] = value;
      }
    }
};

exports.quoted_printable_decode = function (str) {
  var RFC2045Decode1 = /=\r\n/gm,
      // Decodes all equal signs followed by two hex digits
      RFC2045Decode2IN = /=([0-9A-F]{2})/gim,
      // the RFC states against decoding lower case encodings, but following apparent PHP behavior
      // RFC2045Decode2IN = /=([0-9A-F]{2})/gm,
      RFC2045Decode2OUT = function(sMatch, sHex) {
        return String.fromCharCode(parseInt(sHex, 16));
      };
    return str.replace(RFC2045Decode1, '')
      .replace(RFC2045Decode2IN, RFC2045Decode2OUT);
};

exports.quoted_printable_encode = function (str) {
  var hexChars = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D', 'E', 'F'],
      RFC2045Encode1IN = / \r\n|\r\n|[^!-<>-~ ]/gm,
      RFC2045Encode1OUT = function(sMatch) {
        // Encode space before CRLF sequence to prevent spaces from being stripped
        // Keep hard line breaks intact; CRLF sequences
        if (sMatch.length > 1) {
          return sMatch.replace(' ', '=20');
        }
        // Encode matching character
        var chr = sMatch.charCodeAt(0);
        return '=' + hexChars[((chr >>> 4) & 15)] + hexChars[(chr & 15)];
      };
    // Split lines to 75 characters; the reason it's 75 and not 76 is because softline breaks are preceeded by an equal sign; which would be the 76th character.
    // However, if the last line/string was exactly 76 characters, then a softline would not be needed. PHP currently softbreaks anyway; so this function replicates PHP.
    RFC2045Encode2IN = /.{1,72}(?!\r\n)[^=]{0,3}/g,
    RFC2045Encode2OUT = function(sMatch) {
      if (sMatch.substr(sMatch.length - 2) === '\r\n') {
        return sMatch;
      }
      return sMatch + '=\r\n';
    };
    str = str.replace(RFC2045Encode1IN, RFC2045Encode1OUT)
      .replace(RFC2045Encode2IN, RFC2045Encode2OUT);
    // Strip last softline break
    return str.substr(0, str.length - 3);
};

exports.quotemeta = function (str) {
  return (str + '')
      .replace(/([\.\\\+\*\?\[\^\]\$\(\)])/g, '\\$1');
};

exports.rtrim = function (str, charlist) {
  charlist = !charlist ? ' \\s\u00A0' : (charlist + '')
      .replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '\\$1');
    var re = new RegExp('[' + charlist + ']+$', 'g');
    return (str + '')
      .replace(re, '');
};

exports.similar_text = function (first, second, percent) {
  if (first === null || second === null || typeof first === 'undefined' || typeof second === 'undefined') {
      return 0;
    }
  
    first += '';
    second += '';
  
    var pos1 = 0,
      pos2 = 0,
      max = 0,
      firstLength = first.length,
      secondLength = second.length,
      p, q, l, sum;
  
    max = 0;
  
    for (p = 0; p < firstLength; p++) {
      for (q = 0; q < secondLength; q++) {
        for (l = 0;
          (p + l < firstLength) && (q + l < secondLength) && (first.charAt(p + l) === second.charAt(q + l)); l++)
        ;
        if (l > max) {
          max = l;
          pos1 = p;
          pos2 = q;
        }
      }
    }
  
    sum = max;
  
    if (sum) {
      if (pos1 && pos2) {
        sum += this.similar_text(first.substr(0, pos1), second.substr(0, pos2));
      }
  
      if ((pos1 + max < firstLength) && (pos2 + max < secondLength)) {
        sum += this.similar_text(first.substr(pos1 + max, firstLength - pos1 - max), second.substr(pos2 + max,
          secondLength - pos2 - max));
      }
    }
  
    if (!percent) {
      return sum;
    } else {
      return (sum * 200) / (firstLength + secondLength);
    }
};

exports.soundex = function (str) {
  str = (str + '')
      .toUpperCase();
    if (!str) {
      return '';
    }
    var sdx = [0, 0, 0, 0],
      m = {
        B: 1,
        F: 1,
        P: 1,
        V: 1,
        C: 2,
        G: 2,
        J: 2,
        K: 2,
        Q: 2,
        S: 2,
        X: 2,
        Z: 2,
        D: 3,
        T: 3,
        L: 4,
        M: 5,
        N: 5,
        R: 6
      },
      i = 0,
      j, s = 0,
      c, p;
  
    while ((c = str.charAt(i++)) && s < 4) {
      if (j = m[c]) {
        if (j !== p) {
          sdx[s++] = p = j;
        }
      } else {
        s += i === 1;
        p = 0;
      }
    }
  
    sdx[0] = str.charAt(0);
    return sdx.join('');
};

exports.sprintf = function () {
  var regex = /%%|%(\d+\$)?([-+\'#0 ]*)(\*\d+\$|\*|\d+)?(\.(\*\d+\$|\*|\d+))?([scboxXuideEfFgG])/g;
    var a = arguments;
    var i = 0;
    var format = a[i++];
  
    // pad()
    var pad = function(str, len, chr, leftJustify) {
      if (!chr) {
        chr = ' ';
      }
      var padding = (str.length >= len) ? '' : new Array(1 + len - str.length >>> 0)
        .join(chr);
      return leftJustify ? str + padding : padding + str;
    };
  
    // justify()
    var justify = function(value, prefix, leftJustify, minWidth, zeroPad, customPadChar) {
      var diff = minWidth - value.length;
      if (diff > 0) {
        if (leftJustify || !zeroPad) {
          value = pad(value, minWidth, customPadChar, leftJustify);
        } else {
          value = value.slice(0, prefix.length) + pad('', diff, '0', true) + value.slice(prefix.length);
        }
      }
      return value;
    };
  
    // formatBaseX()
    var formatBaseX = function(value, base, prefix, leftJustify, minWidth, precision, zeroPad) {
      // Note: casts negative numbers to positive ones
      var number = value >>> 0;
      prefix = prefix && number && {
        '2': '0b',
        '8': '0',
        '16': '0x'
      }[base] || '';
      value = prefix + pad(number.toString(base), precision || 0, '0', false);
      return justify(value, prefix, leftJustify, minWidth, zeroPad);
    };
  
    // formatString()
    var formatString = function(value, leftJustify, minWidth, precision, zeroPad, customPadChar) {
      if (precision != null) {
        value = value.slice(0, precision);
      }
      return justify(value, '', leftJustify, minWidth, zeroPad, customPadChar);
    };
  
    // doFormat()
    var doFormat = function(substring, valueIndex, flags, minWidth, _, precision, type) {
      var number, prefix, method, textTransform, value;
  
      if (substring === '%%') {
        return '%';
      }
  
      // parse flags
      var leftJustify = false;
      var positivePrefix = '';
      var zeroPad = false;
      var prefixBaseX = false;
      var customPadChar = ' ';
      var flagsl = flags.length;
      for (var j = 0; flags && j < flagsl; j++) {
        switch (flags.charAt(j)) {
          case ' ':
            positivePrefix = ' ';
            break;
          case '+':
            positivePrefix = '+';
            break;
          case '-':
            leftJustify = true;
            break;
          case "'":
            customPadChar = flags.charAt(j + 1);
            break;
          case '0':
            zeroPad = true;
            customPadChar = '0';
            break;
          case '#':
            prefixBaseX = true;
            break;
        }
      }
  
      // parameters may be null, undefined, empty-string or real valued
      // we want to ignore null, undefined and empty-string values
      if (!minWidth) {
        minWidth = 0;
      } else if (minWidth === '*') {
        minWidth = +a[i++];
      } else if (minWidth.charAt(0) == '*') {
        minWidth = +a[minWidth.slice(1, -1)];
      } else {
        minWidth = +minWidth;
      }
  
      // Note: undocumented perl feature:
      if (minWidth < 0) {
        minWidth = -minWidth;
        leftJustify = true;
      }
  
      if (!isFinite(minWidth)) {
        throw new Error('sprintf: (minimum-)width must be finite');
      }
  
      if (!precision) {
        precision = 'fFeE'.indexOf(type) > -1 ? 6 : (type === 'd') ? 0 : undefined;
      } else if (precision === '*') {
        precision = +a[i++];
      } else if (precision.charAt(0) == '*') {
        precision = +a[precision.slice(1, -1)];
      } else {
        precision = +precision;
      }
  
      // grab value using valueIndex if required?
      value = valueIndex ? a[valueIndex.slice(0, -1)] : a[i++];
  
      switch (type) {
        case 's':
          return formatString(String(value), leftJustify, minWidth, precision, zeroPad, customPadChar);
        case 'c':
          return formatString(String.fromCharCode(+value), leftJustify, minWidth, precision, zeroPad);
        case 'b':
          return formatBaseX(value, 2, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
        case 'o':
          return formatBaseX(value, 8, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
        case 'x':
          return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
        case 'X':
          return formatBaseX(value, 16, prefixBaseX, leftJustify, minWidth, precision, zeroPad)
            .toUpperCase();
        case 'u':
          return formatBaseX(value, 10, prefixBaseX, leftJustify, minWidth, precision, zeroPad);
        case 'i':
        case 'd':
          number = +value || 0;
          number = Math.round(number - number % 1); // Plain Math.round doesn't just truncate
          prefix = number < 0 ? '-' : positivePrefix;
          value = prefix + pad(String(Math.abs(number)), precision, '0', false);
          return justify(value, prefix, leftJustify, minWidth, zeroPad);
        case 'e':
        case 'E':
        case 'f': // Should handle locales (as per setlocale)
        case 'F':
        case 'g':
        case 'G':
          number = +value;
          prefix = number < 0 ? '-' : positivePrefix;
          method = ['toExponential', 'toFixed', 'toPrecision']['efg'.indexOf(type.toLowerCase())];
          textTransform = ['toString', 'toUpperCase']['eEfFgG'.indexOf(type) % 2];
          value = prefix + Math.abs(number)[method](precision);
          return justify(value, prefix, leftJustify, minWidth, zeroPad)[textTransform]();
        default:
          return substring;
      }
    };
  
    return format.replace(regex, doFormat);
};

exports.sscanf = function (str, format) {
  // SETUP
    var retArr = [],
      num = 0,
      _NWS = /\S/,
      args = arguments,
      that = this,
      digit;
  
    var _setExtraConversionSpecs = function(offset) {
      // Since a mismatched character sets us off track from future legitimate finds, we just scan
      // to the end for any other conversion specifications (besides a percent literal), setting them to null
      // sscanf seems to disallow all conversion specification components (of sprintf) except for type specifiers
      //var matches = format.match(/%[+-]?([ 0]|'.)?-?\d*(\.\d+)?[bcdeufFosxX]/g); // Do not allow % in last char. class
      var matches = format.slice(offset)
        .match(/%[cdeEufgosxX]/g); // Do not allow % in last char. class;
      // b, F,G give errors in PHP, but 'g', though also disallowed, doesn't
      if (matches) {
        var lgth = matches.length;
        while (lgth--) {
          retArr.push(null);
        }
      }
      return _finish();
    };
  
    var _finish = function() {
      if (args.length === 2) {
        return retArr;
      }
      for (var i = 0; i < retArr.length; ++i) {
        that.window[args[i + 2]] = retArr[i];
      }
      return i;
    };
  
    var _addNext = function(j, regex, cb) {
      if (assign) {
        var remaining = str.slice(j);
        var check = width ? remaining.substr(0, width) : remaining;
        var match = regex.exec(check);
        var testNull = retArr[digit !== undefined ? digit : retArr.length] = match ? (cb ? cb.apply(null, match) :
          match[0]) : null;
        if (testNull === null) {
          throw 'No match in string';
        }
        return j + match[0].length;
      }
      return j;
    };
  
    if (arguments.length < 2) {
      throw 'Not enough arguments passed to sscanf';
    }
  
    // PROCESS
    for (var i = 0, j = 0; i < format.length; i++) {
  
      var width = 0,
        assign = true;
  
      if (format.charAt(i) === '%') {
        if (format.charAt(i + 1) === '%') {
          if (str.charAt(j) === '%') { // a matched percent literal
            ++i, ++j; // skip beyond duplicated percent
            continue;
          }
          // Format indicated a percent literal, but not actually present
          return _setExtraConversionSpecs(i + 2);
        }
  
        // CHARACTER FOLLOWING PERCENT IS NOT A PERCENT
  
        var prePattern = new RegExp('^(?:(\\d+)\\$)?(\\*)?(\\d*)([hlL]?)', 'g'); // We need 'g' set to get lastIndex
  
        var preConvs = prePattern.exec(format.slice(i + 1));
  
        var tmpDigit = digit;
        if (tmpDigit && preConvs[1] === undefined) {
          throw 'All groups in sscanf() must be expressed as numeric if any have already been used';
        }
        digit = preConvs[1] ? parseInt(preConvs[1], 10) - 1 : undefined;
  
        assign = !preConvs[2];
        width = parseInt(preConvs[3], 10);
        var sizeCode = preConvs[4];
        i += prePattern.lastIndex;
  
        // Fix: Does PHP do anything with these? Seems not to matter
        if (sizeCode) { // This would need to be processed later
          switch (sizeCode) {
            case 'h':
              // Treats subsequent as short int (for d,i,n) or unsigned short int (for o,u,x)
            case 'l':
              // Treats subsequent as long int (for d,i,n), or unsigned long int (for o,u,x);
              //    or as double (for e,f,g) instead of float or wchar_t instead of char
            case 'L':
              // Treats subsequent as long double (for e,f,g)
              break;
            default:
              throw 'Unexpected size specifier in sscanf()!';
              break;
          }
        }
        // PROCESS CHARACTER
        try {
          switch (format.charAt(i + 1)) {
            // For detailed explanations, see http://web.archive.org/web/20031128125047/http://www.uwm.edu/cgi-bin/IMT/wwwman?topic=scanf%283%29&msection=
            // Also http://www.mathworks.com/access/helpdesk/help/techdoc/ref/sscanf.html
            // p, S, C arguments in C function not available
            // DOCUMENTED UNDER SSCANF
            case 'F':
              // Not supported in PHP sscanf; the argument is treated as a float, and
              //  presented as a floating-point number (non-locale aware)
              // sscanf doesn't support locales, so no need for two (see %f)
              break;
            case 'g':
              // Not supported in PHP sscanf; shorter of %e and %f
              // Irrelevant to input conversion
              break;
            case 'G':
              // Not supported in PHP sscanf; shorter of %E and %f
              // Irrelevant to input conversion
              break;
            case 'b':
              // Not supported in PHP sscanf; the argument is treated as an integer, and presented as a binary number
              // Not supported - couldn't distinguish from other integers
              break;
            case 'i':
              // Integer with base detection (Equivalent of 'd', but base 0 instead of 10)
              j = _addNext(j, /([+-])?(?:(?:0x([\da-fA-F]+))|(?:0([0-7]+))|(\d+))/, function(num, sign, hex,
                oct, dec) {
                return hex ? parseInt(num, 16) : oct ? parseInt(num, 8) : parseInt(num, 10);
              });
              break;
            case 'n':
              // Number of characters processed so far
              retArr[digit !== undefined ? digit : retArr.length - 1] = j;
              break;
              // DOCUMENTED UNDER SPRINTF
            case 'c':
              // Get character; suppresses skipping over whitespace! (but shouldn't be whitespace in format anyways, so no difference here)
              // Non-greedy match
              j = _addNext(j, new RegExp('.{1,' + (width || 1) + '}'));
              break;
            case 'D':
              // sscanf documented decimal number; equivalent of 'd';
            case 'd':
              // Optionally signed decimal integer
              j = _addNext(j, /([+-])?(?:0*)(\d+)/, function(num, sign, dec) {
                // Ignores initial zeroes, unlike %i and parseInt()
                var decInt = parseInt((sign || '') + dec, 10);
                if (decInt < 0) { // PHP also won't allow less than -2147483648
                  return decInt < -2147483648 ? -2147483648 : decInt; // integer overflow with negative
                } else { // PHP also won't allow greater than -2147483647
                  return decInt < 2147483647 ? decInt : 2147483647;
                }
              });
              break;
            case 'f':
              // Although sscanf doesn't support locales, this is used instead of '%F'; seems to be same as %e
            case 'E':
              // These don't discriminate here as both allow exponential float of either case
            case 'e':
              j = _addNext(j, /([+-])?(?:0*)(\d*\.?\d*(?:[eE]?\d+)?)/, function(num, sign, dec) {
                if (dec === '.') {
                  return null;
                }
                return parseFloat((sign || '') + dec); // Ignores initial zeroes, unlike %i and parseFloat()
              });
              break;
            case 'u':
              // unsigned decimal integer
              // We won't deal with integer overflows due to signs
              j = _addNext(j, /([+-])?(?:0*)(\d+)/, function(num, sign, dec) {
                // Ignores initial zeroes, unlike %i and parseInt()
                var decInt = parseInt(dec, 10);
                if (sign === '-') { // PHP also won't allow greater than 4294967295
                  return 4294967296 - decInt; // integer overflow with negative
                } else {
                  return decInt < 4294967295 ? decInt : 4294967295;
                }
              });
              break;
            case 'o':
              // Octal integer // Fix: add overflows as above?
              j = _addNext(j, /([+-])?(?:0([0-7]+))/, function(num, sign, oct) {
                return parseInt(num, 8);
              });
              break;
            case 's':
              // Greedy match
              j = _addNext(j, /\S+/);
              break;
            case 'X':
              // Same as 'x'?
            case 'x':
              // Fix: add overflows as above?
              // Initial 0x not necessary here
              j = _addNext(j, /([+-])?(?:(?:0x)?([\da-fA-F]+))/, function(num, sign, hex) {
                return parseInt(num, 16);
              });
              break;
            case '':
              // If no character left in expression
              throw 'Missing character after percent mark in sscanf() format argument';
            default:
              throw 'Unrecognized character after percent mark in sscanf() format argument';
          }
        } catch (e) {
          if (e === 'No match in string') { // Allow us to exit
            return _setExtraConversionSpecs(i + 2);
          }
        }++i; // Calculate skipping beyond initial percent too
      } else if (format.charAt(i) !== str.charAt(j)) {
        // Fix: Double-check i whitespace ignored in string and/or formats
        _NWS.lastIndex = 0;
        if ((_NWS)
          .test(str.charAt(j)) || str.charAt(j) === '') { // Whitespace doesn't need to be an exact match)
          return _setExtraConversionSpecs(i + 1);
        } else {
          // Adjust strings when encounter non-matching whitespace, so they align in future checks above
          str = str.slice(0, j) + str.slice(j + 1); // Ok to replace with j++;?
          i--;
        }
      } else {
        j++;
      }
    }
  
    // POST-PROCESSING
    return _finish();
};

exports.str_getcsv = function (input, delimiter, enclosure, escape) {
  // These test cases allowing for missing delimiters are not currently supported
    /*
      str_getcsv('"row2""cell1",row2cell2,row2cell3', null, null, '"');
      ['row2"cell1', 'row2cell2', 'row2cell3']
  
      str_getcsv('row1cell1,"row1,cell2",row1cell3', null, null, '"');
      ['row1cell1', 'row1,cell2', 'row1cell3']
  
      str_getcsv('"row2""cell1",row2cell2,"row2""""cell3"');
      ['row2"cell1', 'row2cell2', 'row2""cell3']
  
      str_getcsv('row1cell1,"row1,cell2","row1"",""cell3"', null, null, '"');
      ['row1cell1', 'row1,cell2', 'row1","cell3'];
  
      Should also test newlines within
  */
    var i, inpLen, output = [];
    var backwards = function(str) { // We need to go backwards to simulate negative look-behind (don't split on
      //an escaped enclosure even if followed by the delimiter and another enclosure mark)
      return str.split('')
        .reverse()
        .join('');
    };
    var pq = function(str) { // preg_quote()
      return String(str)
        .replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!<\>\|\:])/g, '\\$1');
    };
  
    delimiter = delimiter || ',';
    enclosure = enclosure || '"';
    escape = escape || '\\';
    var pqEnc = pq(enclosure);
    var pqEsc = pq(escape);
  
    input = input.replace(new RegExp('^\\s*' + pqEnc), '')
      .replace(new RegExp(pqEnc + '\\s*$'), '');
  
    // PHP behavior may differ by including whitespace even outside of the enclosure
    input = backwards(input)
      .split(new RegExp(pqEnc + '\\s*' + pq(delimiter) + '\\s*' + pqEnc + '(?!' + pqEsc + ')',
        'g'))
      .reverse();
  
    for (i = 0, inpLen = input.length; i < inpLen; i++) {
      output.push(backwards(input[i])
        .replace(new RegExp(pqEsc + pqEnc, 'g'), enclosure));
    }
  
    return output;
};

exports.str_ireplace = function (search, replace, subject) {
  var i, k = '';
    var searchl = 0;
    var reg;
  
    var escapeRegex = function(s) {
      return s.replace(/([\\\^\$*+\[\]?{}.=!:(|)])/g, '\\$1');
    };
  
    search += '';
    searchl = search.length;
    if (Object.prototype.toString.call(replace) !== '[object Array]') {
      replace = [replace];
      if (Object.prototype.toString.call(search) === '[object Array]') {
        // If search is an array and replace is a string,
        // then this replacement string is used for every value of search
        while (searchl > replace.length) {
          replace[replace.length] = replace[0];
        }
      }
    }
  
    if (Object.prototype.toString.call(search) !== '[object Array]') {
      search = [search];
    }
    while (search.length > replace.length) {
      // If replace has fewer values than search,
      // then an empty string is used for the rest of replacement values
      replace[replace.length] = '';
    }
  
    if (Object.prototype.toString.call(subject) === '[object Array]') {
      // If subject is an array, then the search and replace is performed
      // with every entry of subject , and the return value is an array as well.
      for (k in subject) {
        if (subject.hasOwnProperty(k)) {
          subject[k] = str_ireplace(search, replace, subject[k]);
        }
      }
      return subject;
    }
  
    searchl = search.length;
    for (i = 0; i < searchl; i++) {
      reg = new RegExp(escapeRegex(search[i]), 'gi');
      subject = subject.replace(reg, replace[i]);
    }
  
    return subject;
};

exports.str_pad = function (input, pad_length, pad_string, pad_type) {
  var half = '',
      pad_to_go;
  
    var str_pad_repeater = function(s, len) {
      var collect = '',
        i;
  
      while (collect.length < len) {
        collect += s;
      }
      collect = collect.substr(0, len);
  
      return collect;
    };
  
    input += '';
    pad_string = pad_string !== undefined ? pad_string : ' ';
  
    if (pad_type !== 'STR_PAD_LEFT' && pad_type !== 'STR_PAD_RIGHT' && pad_type !== 'STR_PAD_BOTH') {
      pad_type = 'STR_PAD_RIGHT';
    }
    if ((pad_to_go = pad_length - input.length) > 0) {
      if (pad_type === 'STR_PAD_LEFT') {
        input = str_pad_repeater(pad_string, pad_to_go) + input;
      } else if (pad_type === 'STR_PAD_RIGHT') {
        input = input + str_pad_repeater(pad_string, pad_to_go);
      } else if (pad_type === 'STR_PAD_BOTH') {
        half = str_pad_repeater(pad_string, Math.ceil(pad_to_go / 2));
        input = half + input + half;
        input = input.substr(0, pad_length);
      }
    }
  
    return input;
};

exports.str_repeat = function (input, multiplier) {
  var y = '';
    while (true) {
      if (multiplier & 1) {
        y += input;
      }
      multiplier >>= 1;
      if (multiplier) {
        input += input;
      } else {
        break;
      }
    }
    return y;
};

exports.str_replace = function (search, replace, subject, count) {
  var i = 0,
      j = 0,
      temp = '',
      repl = '',
      sl = 0,
      fl = 0,
      f = [].concat(search),
      r = [].concat(replace),
      s = subject,
      ra = Object.prototype.toString.call(r) === '[object Array]',
      sa = Object.prototype.toString.call(s) === '[object Array]';
    s = [].concat(s);
    if (count) {
      this.window[count] = 0;
    }
  
    for (i = 0, sl = s.length; i < sl; i++) {
      if (s[i] === '') {
        continue;
      }
      for (j = 0, fl = f.length; j < fl; j++) {
        temp = s[i] + '';
        repl = ra ? (r[j] !== undefined ? r[j] : '') : r[0];
        s[i] = (temp)
          .split(f[j])
          .join(repl);
        if (count && s[i] !== temp) {
          this.window[count] += (temp.length - s[i].length) / f[j].length;
        }
      }
    }
    return sa ? s : s[0];
};

exports.str_rot13 = function (str) {
  return (str + '')
      .replace(/[a-z]/gi, function(s) {
        return String.fromCharCode(s.charCodeAt(0) + (s.toLowerCase() < 'n' ? 13 : -13));
      });
};

exports.str_shuffle = function (str) {
  if (arguments.length === 0) {
      throw 'Wrong parameter count for str_shuffle()';
    }
  
    if (str == null) {
      return '';
    }
  
    str += '';
  
    var newStr = '',
      rand, i = str.length;
  
    while (i) {
      rand = Math.floor(Math.random() * i);
      newStr += str.charAt(rand);
      str = str.substring(0, rand) + str.substr(rand + 1);
      i--;
    }
  
    return newStr;
};

exports.str_split = function (string, split_length) {
  if (split_length === null) {
      split_length = 1;
    }
    if (string === null || split_length < 1) {
      return false;
    }
    string += '';
    var chunks = [],
      pos = 0,
      len = string.length;
    while (pos < len) {
      chunks.push(string.slice(pos, pos += split_length));
    }
  
    return chunks;
};

exports.strcasecmp = function (f_string1, f_string2) {
  var string1 = (f_string1 + '')
      .toLowerCase();
    var string2 = (f_string2 + '')
      .toLowerCase();
  
    if (string1 > string2) {
      return 1;
    } else if (string1 == string2) {
      return 0;
    }
  
    return -1;
};

exports.strcmp = function (str1, str2) {
  return ((str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1));
};

exports.strcspn = function (str, mask, start, length) {
  start = start ? start : 0;
    var count = (length && ((start + length) < str.length)) ? start + length : str.length;
    strct: for (var i = start, lgth = 0; i < count; i++) {
      for (var j = 0; j < mask.length; j++) {
        if (str.charAt(i)
          .indexOf(mask[j]) !== -1) {
          continue strct;
        }
      }++lgth;
    }
  
    return lgth;
};

exports.strip_tags = function (input, allowed) {
  allowed = (((allowed || '') + '')
      .toLowerCase()
      .match(/<[a-z][a-z0-9]*>/g) || [])
      .join(''); // making sure the allowed arg is a string containing only tags in lowercase (<a><b><c>)
    var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi,
      commentsAndPhpTags = /<!--[\s\S]*?-->|<\?(?:php)?[\s\S]*?\?>/gi;
    return input.replace(commentsAndPhpTags, '')
      .replace(tags, function($0, $1) {
        return allowed.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : '';
      });
};

exports.stripos = function (f_haystack, f_needle, f_offset) {
  var haystack = (f_haystack + '')
      .toLowerCase();
    var needle = (f_needle + '')
      .toLowerCase();
    var index = 0;
  
    if ((index = haystack.indexOf(needle, f_offset)) !== -1) {
      return index;
    }
    return false;
};

exports.stripslashes = function (str) {
  return (str + '')
      .replace(/\\(.?)/g, function(s, n1) {
        switch (n1) {
          case '\\':
            return '\\';
          case '0':
            return '\u0000';
          case '':
            return '';
          default:
            return n1;
        }
      });
};

exports.stristr = function (haystack, needle, bool) {
  var pos = 0;
  
    haystack += '';
    pos = haystack.toLowerCase()
      .indexOf((needle + '')
        .toLowerCase());
    if (pos == -1) {
      return false;
    } else {
      if (bool) {
        return haystack.substr(0, pos);
      } else {
        return haystack.slice(pos);
      }
    }
};

exports.strlen = function (string) {
  var str = string + '';
    var i = 0,
      chr = '',
      lgth = 0;
  
    if (!this.php_js || !this.php_js.ini || !this.php_js.ini['unicode.semantics'] || this.php_js.ini[
      'unicode.semantics'].local_value.toLowerCase() !== 'on') {
      return string.length;
    }
  
    var getWholeChar = function(str, i) {
      var code = str.charCodeAt(i);
      var next = '',
        prev = '';
      if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
        if (str.length <= (i + 1)) {
          throw 'High surrogate without following low surrogate';
        }
        next = str.charCodeAt(i + 1);
        if (0xDC00 > next || next > 0xDFFF) {
          throw 'High surrogate without following low surrogate';
        }
        return str.charAt(i) + str.charAt(i + 1);
      } else if (0xDC00 <= code && code <= 0xDFFF) { // Low surrogate
        if (i === 0) {
          throw 'Low surrogate without preceding high surrogate';
        }
        prev = str.charCodeAt(i - 1);
        if (0xD800 > prev || prev > 0xDBFF) { //(could change last hex to 0xDB7F to treat high private surrogates as single characters)
          throw 'Low surrogate without preceding high surrogate';
        }
        return false; // We can pass over low surrogates now as the second component in a pair which we have already processed
      }
      return str.charAt(i);
    };
  
    for (i = 0, lgth = 0; i < str.length; i++) {
      if ((chr = getWholeChar(str, i)) === false) {
        continue;
      } // Adapt this line at the top of any loop, passing in the whole string and the current iteration and returning a variable to represent the individual character; purpose is to treat the first part of a surrogate pair as the whole character and then ignore the second part
      lgth++;
    }
    return lgth;
};

exports.strnatcasecmp = function (str1, str2) {
  var a = (str1 + '')
      .toLowerCase();
    var b = (str2 + '')
      .toLowerCase();
  
    var isWhitespaceChar = function(a) {
      return a.charCodeAt(0) <= 32;
    };
  
    var isDigitChar = function(a) {
      var charCode = a.charCodeAt(0);
      return (charCode >= 48 && charCode <= 57);
    };
  
    var compareRight = function(a, b) {
      var bias = 0;
      var ia = 0;
      var ib = 0;
  
      var ca;
      var cb;
  
      // The longest run of digits wins.  That aside, the greatest
      // value wins, but we can't know that it will until we've scanned
      // both numbers to know that they have the same magnitude, so we
      // remember it in BIAS.
      for (var cnt = 0; true; ia++, ib++) {
        ca = a.charAt(ia);
        cb = b.charAt(ib);
  
        if (!isDigitChar(ca) && !isDigitChar(cb)) {
          return bias;
        } else if (!isDigitChar(ca)) {
          return -1;
        } else if (!isDigitChar(cb)) {
          return 1;
        } else if (ca < cb) {
          if (bias === 0) {
            bias = -1;
          }
        } else if (ca > cb) {
          if (bias === 0) {
            bias = 1;
          }
        } else if (ca === '0' && cb === '0') {
          return bias;
        }
      }
    };
  
    var ia = 0,
      ib = 0;
    var nza = 0,
      nzb = 0;
    var ca, cb;
    var result;
  
    while (true) {
      // only count the number of zeroes leading the last number compared
      nza = nzb = 0;
  
      ca = a.charAt(ia);
      cb = b.charAt(ib);
  
      // skip over leading spaces or zeros
      while (isWhitespaceChar(ca) || ca === '0') {
        if (ca === '0') {
          nza++;
        } else {
          // only count consecutive zeroes
          nza = 0;
        }
  
        ca = a.charAt(++ia);
      }
  
      while (isWhitespaceChar(cb) || cb === '0') {
        if (cb === '0') {
          nzb++;
        } else {
          // only count consecutive zeroes
          nzb = 0;
        }
  
        cb = b.charAt(++ib);
      }
  
      // process run of digits
      if (isDigitChar(ca) && isDigitChar(cb)) {
        if ((result = compareRight(a.substring(ia), b.substring(ib))) !== 0) {
          return result;
        }
      }
  
      if (ca === '0' && cb === '0') {
        // The strings compare the same.  Perhaps the caller
        // will want to call strcmp to break the tie.
        return nza - nzb;
      }
  
      if (ca < cb) {
        return -1;
      } else if (ca > cb) {
        return +1;
      }
  
      // prevent possible infinite loop
      if (ia >= a.length && ib >= b.length) return 0;
  
      ++ia;
      ++ib;
    }
};

exports.strncasecmp = function (argStr1, argStr2, len) {
  var diff, i = 0;
    var str1 = (argStr1 + '')
      .toLowerCase()
      .substr(0, len);
    var str2 = (argStr2 + '')
      .toLowerCase()
      .substr(0, len);
  
    if (str1.length !== str2.length) {
      if (str1.length < str2.length) {
        len = str1.length;
        if (str2.substr(0, str1.length) == str1) {
          return str1.length - str2.length; // return the difference of chars
        }
      } else {
        len = str2.length;
        // str1 is longer than str2
        if (str1.substr(0, str2.length) == str2) {
          return str1.length - str2.length; // return the difference of chars
        }
      }
    } else {
      // Avoids trying to get a char that does not exist
      len = str1.length;
    }
  
    for (diff = 0, i = 0; i < len; i++) {
      diff = str1.charCodeAt(i) - str2.charCodeAt(i);
      if (diff !== 0) {
        return diff;
      }
    }
  
    return 0;
};

exports.strncmp = function (str1, str2, lgth) {
  var s1 = (str1 + '')
      .substr(0, lgth);
    var s2 = (str2 + '')
      .substr(0, lgth);
  
    return ((s1 == s2) ? 0 : ((s1 > s2) ? 1 : -1));
};

exports.strpbrk = function (haystack, char_list) {
  for (var i = 0, len = haystack.length; i < len; ++i) {
      if (char_list.indexOf(haystack.charAt(i)) >= 0) {
        return haystack.slice(i);
      }
    }
    return false;
};

exports.strpos = function (haystack, needle, offset) {
  var i = (haystack + '')
      .indexOf(needle, (offset || 0));
    return i === -1 ? false : i;
};

exports.strrchr = function (haystack, needle) {
  var pos = 0;
  
    if (typeof needle !== 'string') {
      needle = String.fromCharCode(parseInt(needle, 10));
    }
    needle = needle.charAt(0);
    pos = haystack.lastIndexOf(needle);
    if (pos === -1) {
      return false;
    }
  
    return haystack.substr(pos);
};

exports.strrev = function (string) {
  string = string + '';
  
    // Performance will be enhanced with the next two lines of code commented
    //      out if you don't care about combining characters
    // Keep Unicode combining characters together with the character preceding
    //      them and which they are modifying (as in PHP 6)
    // See http://unicode.org/reports/tr44/#Property_Table (Me+Mn)
    // We also add the low surrogate range at the beginning here so it will be
    //      maintained with its preceding high surrogate
    var grapheme_extend =
      /(.)([\uDC00-\uDFFF\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065E\u0670\u06D6-\u06DC\u06DE-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u0901-\u0903\u093C\u093E-\u094D\u0951-\u0954\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C01-\u0C03\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C82\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D02\u0D03\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F90-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B6-\u17D3\u17DD\u180B-\u180D\u18A9\u1920-\u192B\u1930-\u193B\u19B0-\u19C0\u19C8\u19C9\u1A17-\u1A1B\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAA\u1C24-\u1C37\u1DC0-\u1DE6\u1DFE\u1DFF\u20D0-\u20F0\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA67C\uA67D\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C4\uA926-\uA92D\uA947-\uA953\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uFB1E\uFE00-\uFE0F\uFE20-\uFE26]+)/g;
    string = string.replace(grapheme_extend, '$2$1'); // Temporarily reverse
    return string.split('')
      .reverse()
      .join('');
};

exports.strripos = function (haystack, needle, offset) {
  haystack = (haystack + '')
      .toLowerCase();
    needle = (needle + '')
      .toLowerCase();
  
    var i = -1;
    if (offset) {
      i = (haystack + '')
        .slice(offset)
        .lastIndexOf(needle); // strrpos' offset indicates starting point of range till end,
      // while lastIndexOf's optional 2nd argument indicates ending point of range from the beginning
      if (i !== -1) {
        i += offset;
      }
    } else {
      i = (haystack + '')
        .lastIndexOf(needle);
    }
    return i >= 0 ? i : false;
};

exports.strrpos = function (haystack, needle, offset) {
  var i = -1;
    if (offset) {
      i = (haystack + '')
        .slice(offset)
        .lastIndexOf(needle); // strrpos' offset indicates starting point of range till end,
      // while lastIndexOf's optional 2nd argument indicates ending point of range from the beginning
      if (i !== -1) {
        i += offset;
      }
    } else {
      i = (haystack + '')
        .lastIndexOf(needle);
    }
    return i >= 0 ? i : false;
};

exports.strspn = function (str1, str2, start, lgth) {
  var found;
    var stri;
    var strj;
    var j = 0;
    var i = 0;
  
    start = start ? (start < 0 ? (str1.length + start) : start) : 0;
    lgth = lgth ? ((lgth < 0) ? (str1.length + lgth - start) : lgth) : str1.length - start;
    str1 = str1.substr(start, lgth);
  
    for (i = 0; i < str1.length; i++) {
      found = 0;
      stri = str1.substring(i, i + 1);
      for (j = 0; j <= str2.length; j++) {
        strj = str2.substring(j, j + 1);
        if (stri == strj) {
          found = 1;
          break;
        }
      }
      if (found != 1) {
        return i;
      }
    }
  
    return i;
};

exports.strstr = function (haystack, needle, bool) {
  var pos = 0;
  
    haystack += '';
    pos = haystack.indexOf(needle);
    if (pos == -1) {
      return false;
    } else {
      if (bool) {
        return haystack.substr(0, pos);
      } else {
        return haystack.slice(pos);
      }
    }
};

exports.strtok = function (str, tokens) {
  this.php_js = this.php_js || {};
    // END REDUNDANT
    if (tokens === undefined) {
      tokens = str;
      str = this.php_js.strtokleftOver;
    }
    if (str.length === 0) {
      return false;
    }
    if (tokens.indexOf(str.charAt(0)) !== -1) {
      return this.strtok(str.substr(1), tokens);
    }
    for (var i = 0; i < str.length; i++) {
      if (tokens.indexOf(str.charAt(i)) !== -1) {
        break;
      }
    }
    this.php_js.strtokleftOver = str.substr(i + 1);
    return str.substring(0, i);
};

exports.strtolower = function (str) {
  return (str + '')
      .toLowerCase();
};

exports.strtoupper = function (str) {
  return (str + '')
      .toUpperCase();
};

exports.substr = function (str, start, len) {
  var i = 0,
      allBMP = true,
      es = 0,
      el = 0,
      se = 0,
      ret = '';
    str += '';
    var end = str.length;
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    switch ((this.php_js.ini['unicode.semantics'] && this.php_js.ini['unicode.semantics'].local_value.toLowerCase())) {
      case 'on':
        // Full-blown Unicode including non-Basic-Multilingual-Plane characters
        // strlen()
        for (i = 0; i < str.length; i++) {
          if (/[\uD800-\uDBFF]/.test(str.charAt(i)) && /[\uDC00-\uDFFF]/.test(str.charAt(i + 1))) {
            allBMP = false;
            break;
          }
        }
  
        if (!allBMP) {
          if (start < 0) {
            for (i = end - 1, es = (start += end); i >= es; i--) {
              if (/[\uDC00-\uDFFF]/.test(str.charAt(i)) && /[\uD800-\uDBFF]/.test(str.charAt(i - 1))) {
                start--;
                es--;
              }
            }
          } else {
            var surrogatePairs = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
            while ((surrogatePairs.exec(str)) != null) {
              var li = surrogatePairs.lastIndex;
              if (li - 2 < start) {
                start++;
              } else {
                break;
              }
            }
          }
  
          if (start >= end || start < 0) {
            return false;
          }
          if (len < 0) {
            for (i = end - 1, el = (end += len); i >= el; i--) {
              if (/[\uDC00-\uDFFF]/.test(str.charAt(i)) && /[\uD800-\uDBFF]/.test(str.charAt(i - 1))) {
                end--;
                el--;
              }
            }
            if (start > end) {
              return false;
            }
            return str.slice(start, end);
          } else {
            se = start + len;
            for (i = start; i < se; i++) {
              ret += str.charAt(i);
              if (/[\uD800-\uDBFF]/.test(str.charAt(i)) && /[\uDC00-\uDFFF]/.test(str.charAt(i + 1))) {
                se++; // Go one further, since one of the "characters" is part of a surrogate pair
              }
            }
            return ret;
          }
          break;
        }
        // Fall-through
      case 'off':
        // assumes there are no non-BMP characters;
        //    if there may be such characters, then it is best to turn it on (critical in true XHTML/XML)
      default:
        if (start < 0) {
          start += end;
        }
        end = typeof len === 'undefined' ? end : (len < 0 ? len + end : len + start);
        // PHP returns false if start does not fall within the string.
        // PHP returns false if the calculated end comes before the calculated start.
        // PHP returns an empty string if start and end are the same.
        // Otherwise, PHP returns the portion of the string from start to end.
        return start >= str.length || start < 0 || start > end ? !1 : str.slice(start, end);
    }
    return undefined; // Please Netbeans
};

exports.substr_compare = function (main_str, str, offset, length, case_insensitivity) {
  if (!offset && offset !== 0) {
      throw 'Missing offset for substr_compare()';
    }
  
    if (offset < 0) {
      offset = main_str.length + offset;
    }
  
    if (length && length > (main_str.length - offset)) {
      return false;
    }
    length = length || main_str.length - offset;
  
    main_str = main_str.substr(offset, length);
    str = str.substr(0, length); // Should only compare up to the desired length
    if (case_insensitivity) { // Works as strcasecmp
      main_str = (main_str + '')
        .toLowerCase();
      str = (str + '')
        .toLowerCase();
      if (main_str == str) {
        return 0;
      }
      return (main_str > str) ? 1 : -1;
    }
    // Works as strcmp
    return ((main_str == str) ? 0 : ((main_str > str) ? 1 : -1));
};

exports.substr_count = function (haystack, needle, offset, length) {
  var cnt = 0;
  
    haystack += '';
    needle += '';
    if (isNaN(offset)) {
      offset = 0;
    }
    if (isNaN(length)) {
      length = 0;
    }
    if (needle.length == 0) {
      return false;
    }
    offset--;
  
    while ((offset = haystack.indexOf(needle, offset + 1)) != -1) {
      if (length > 0 && (offset + needle.length) > length) {
        return false;
      }
      cnt++;
    }
  
    return cnt;
};

exports.substr_replace = function (str, replace, start, length) {
  if (start < 0) { // start position in str
      start = start + str.length;
    }
    length = length !== undefined ? length : str.length;
    if (length < 0) {
      length = length + str.length - start;
    }
  
    return str.slice(0, start) + replace.substr(0, length) + replace.slice(length) + str.slice(start + length);
};

exports.trim = function (str, charlist) {
  var whitespace, l = 0,
      i = 0;
    str += '';
  
    if (!charlist) {
      // default list
      whitespace =
        ' \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000';
    } else {
      // preg_quote custom list
      charlist += '';
      whitespace = charlist.replace(/([\[\]\(\)\.\?\/\*\{\}\+\$\^\:])/g, '$1');
    }
  
    l = str.length;
    for (i = 0; i < l; i++) {
      if (whitespace.indexOf(str.charAt(i)) === -1) {
        str = str.substring(i);
        break;
      }
    }
  
    l = str.length;
    for (i = l - 1; i >= 0; i--) {
      if (whitespace.indexOf(str.charAt(i)) === -1) {
        str = str.substring(0, i + 1);
        break;
      }
    }
  
    return whitespace.indexOf(str.charAt(0)) === -1 ? str : '';
};

exports.ucfirst = function (str) {
  str += '';
    var f = str.charAt(0)
      .toUpperCase();
    return f + str.substr(1);
};

exports.ucwords = function (str) {
  return (str + '')
      .replace(/^([a-z\u00E0-\u00FC])|\s+([a-z\u00E0-\u00FC])/g, function($1) {
        return $1.toUpperCase();
      });
};

exports.wordwrap = function (str, int_width, str_break, cut) {
  var m = ((arguments.length >= 2) ? arguments[1] : 75);
    var b = ((arguments.length >= 3) ? arguments[2] : '\n');
    var c = ((arguments.length >= 4) ? arguments[3] : false);
  
    var i, j, l, s, r;
  
    str += '';
  
    if (m < 1) {
      return str;
    }
  
    for (i = -1, l = (r = str.split(/\r\n|\n|\r/))
      .length; ++i < l; r[i] += s) {
      for (s = r[i], r[i] = ''; s.length > m; r[i] += s.slice(0, j) + ((s = s.slice(j))
        .length ? b : '')) {
        j = c == 2 || (j = s.slice(0, m + 1)
          .match(/\S*(\s)?$/))[1] ? m : j.input.length - j[0].length || c == 1 && m || j.input.length + (j = s.slice(
            m)
          .match(/^\S*/))[0].length;
      }
    }
  
    return r.join('\n');
};

exports.base64_decode = function (data) {
  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
      ac = 0,
      dec = '',
      tmp_arr = [];
  
    if (!data) {
      return data;
    }
  
    data += '';
  
    do { // unpack four hexets into three octets using index points in b64
      h1 = b64.indexOf(data.charAt(i++));
      h2 = b64.indexOf(data.charAt(i++));
      h3 = b64.indexOf(data.charAt(i++));
      h4 = b64.indexOf(data.charAt(i++));
  
      bits = h1 << 18 | h2 << 12 | h3 << 6 | h4;
  
      o1 = bits >> 16 & 0xff;
      o2 = bits >> 8 & 0xff;
      o3 = bits & 0xff;
  
      if (h3 == 64) {
        tmp_arr[ac++] = String.fromCharCode(o1);
      } else if (h4 == 64) {
        tmp_arr[ac++] = String.fromCharCode(o1, o2);
      } else {
        tmp_arr[ac++] = String.fromCharCode(o1, o2, o3);
      }
    } while (i < data.length);
  
    dec = tmp_arr.join('');
  
    return decodeURIComponent(escape(dec.replace(/\0+$/, '')));
};

exports.base64_encode = function (data) {
  var b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    var o1, o2, o3, h1, h2, h3, h4, bits, i = 0,
      ac = 0,
      enc = '',
      tmp_arr = [];
  
    if (!data) {
      return data;
    }
  
    data = unescape(encodeURIComponent(data))
  
    do { // pack three octets into four hexets
      o1 = data.charCodeAt(i++);
      o2 = data.charCodeAt(i++);
      o3 = data.charCodeAt(i++);
  
      bits = o1 << 16 | o2 << 8 | o3;
  
      h1 = bits >> 18 & 0x3f;
      h2 = bits >> 12 & 0x3f;
      h3 = bits >> 6 & 0x3f;
      h4 = bits & 0x3f;
  
      // use hexets to index into b64, and append result to encoded string
      tmp_arr[ac++] = b64.charAt(h1) + b64.charAt(h2) + b64.charAt(h3) + b64.charAt(h4);
    } while (i < data.length);
  
    enc = tmp_arr.join('');
  
    var r = data.length % 3;
  
    return (r ? enc.slice(0, r - 3) : enc) + '==='.slice(r || 3);
};

exports.parse_url = function (str, component) {
  var query, key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port',
        'relative', 'path', 'directory', 'file', 'query', 'fragment'
      ],
      ini = (this.php_js && this.php_js.ini) || {},
      mode = (ini['phpjs.parse_url.mode'] &&
        ini['phpjs.parse_url.mode'].local_value) || 'php',
      parser = {
        php: /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/\/?)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // Added one optional slash to post-scheme to catch file:/// (should restrict this)
      };
  
    var m = parser[mode].exec(str),
      uri = {},
      i = 14;
    while (i--) {
      if (m[i]) {
        uri[key[i]] = m[i];
      }
    }
  
    if (component) {
      return uri[component.replace('PHP_URL_', '')
        .toLowerCase()];
    }
    if (mode !== 'php') {
      var name = (ini['phpjs.parse_url.queryKey'] &&
        ini['phpjs.parse_url.queryKey'].local_value) || 'queryKey';
      parser = /(?:^|&)([^&=]*)=?([^&]*)/g;
      uri[name] = {};
      query = uri[key[12]] || '';
      query.replace(parser, function($0, $1, $2) {
        if ($1) {
          uri[name][$1] = $2;
        }
      });
    }
    delete uri.source;
    return uri;
};

exports.rawurldecode = function (str) {
  return decodeURIComponent((str + '')
      .replace(/%(?![\da-f]{2})/gi, function() {
        // PHP tolerates poorly formed escape sequences
        return '%25';
      }));
};

exports.rawurlencode = function (str) {
  str = (str + '')
      .toString();
  
    // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
    // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .
    replace(/\)/g, '%29')
      .replace(/\*/g, '%2A');
};

exports.urldecode = function (str) {
  return decodeURIComponent((str + '')
      .replace(/%(?![\da-f]{2})/gi, function() {
        // PHP tolerates poorly formed escape sequences
        return '%25';
      })
      .replace(/\+/g, '%20'));
};

exports.urlencode = function (str) {
  str = (str + '')
      .toString();
  
    // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
    // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
    return encodeURIComponent(str)
      .replace(/!/g, '%21')
      .replace(/'/g, '%27')
      .replace(/\(/g, '%28')
      .
    replace(/\)/g, '%29')
      .replace(/\*/g, '%2A')
      .replace(/%20/g, '+');
};

exports.empty = function (mixed_var) {
  var undef, key, i, len;
    var emptyValues = [undef, null, false, 0, '', '0'];
  
    for (i = 0, len = emptyValues.length; i < len; i++) {
      if (mixed_var === emptyValues[i]) {
        return true;
      }
    }
  
    if (typeof mixed_var === 'object') {
      for (key in mixed_var) {
        // TODO: should we check for own properties only?
        //if (mixed_var.hasOwnProperty(key)) {
        return false;
        //}
      }
      return true;
    }
  
    return false;
};

exports.floatval = function (mixed_var) {
  return (parseFloat(mixed_var) || 0);
};

exports.intval = function (mixed_var, base) {
  var tmp;
  
    var type = typeof mixed_var;
  
    if (type === 'boolean') {
      return +mixed_var;
    } else if (type === 'string') {
      tmp = parseInt(mixed_var, base || 10);
      return (isNaN(tmp) || !isFinite(tmp)) ? 0 : tmp;
    } else if (type === 'number' && isFinite(mixed_var)) {
      return mixed_var | 0;
    } else {
      return 0;
    }
};

exports.is_array = function (mixed_var) {
  var ini,
      _getFuncName = function(fn) {
        var name = (/\W*function\s+([\w\$]+)\s*\(/)
          .exec(fn);
        if (!name) {
          return '(Anonymous)';
        }
        return name[1];
      };
    _isArray = function(mixed_var) {
      // return Object.prototype.toString.call(mixed_var) === '[object Array]';
      // The above works, but let's do the even more stringent approach: (since Object.prototype.toString could be overridden)
      // Null, Not an object, no length property so couldn't be an Array (or String)
      if (!mixed_var || typeof mixed_var !== 'object' || typeof mixed_var.length !== 'number') {
        return false;
      }
      var len = mixed_var.length;
      mixed_var[mixed_var.length] = 'bogus';
      // The only way I can think of to get around this (or where there would be trouble) would be to have an object defined
      // with a custom "length" getter which changed behavior on each call (or a setter to mess up the following below) or a custom
      // setter for numeric properties, but even that would need to listen for specific indexes; but there should be no false negatives
      // and such a false positive would need to rely on later JavaScript innovations like __defineSetter__
      if (len !== mixed_var.length) { // We know it's an array since length auto-changed with the addition of a
        // numeric property at its length end, so safely get rid of our bogus element
        mixed_var.length -= 1;
        return true;
      }
      // Get rid of the property we added onto a non-array object; only possible
      // side-effect is if the user adds back the property later, it will iterate
      // this property in the older order placement in IE (an order which should not
      // be depended on anyways)
      delete mixed_var[mixed_var.length];
      return false;
    };
  
    if (!mixed_var || typeof mixed_var !== 'object') {
      return false;
    }
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
  
    ini = this.php_js.ini['phpjs.objectsAsArrays'];
  
    return _isArray(mixed_var) ||
    // Allow returning true unless user has called
    // ini_set('phpjs.objectsAsArrays', 0) to disallow objects as arrays
    ((!ini || ( // if it's not set to 0 and it's not 'off', check for objects as arrays
      (parseInt(ini.local_value, 10) !== 0 && (!ini.local_value.toLowerCase || ini.local_value.toLowerCase() !==
        'off')))) && (
      Object.prototype.toString.call(mixed_var) === '[object Object]' && _getFuncName(mixed_var.constructor) ===
      'Object' // Most likely a literal and intended as assoc. array
    ));
};

exports.is_binary = function (vr) {
  return typeof vr === 'string'; // If it is a string of any kind, it could be binary
};

exports.is_bool = function (mixed_var) {
  return (mixed_var === true || mixed_var === false); // Faster (in FF) than type checking
};

exports.is_buffer = function (vr) {
  return typeof vr === 'string';
};

exports.is_callable = function (v, syntax_only, callable_name) {
  var name = '',
      obj = {},
      method = '';
    var getFuncName = function(fn) {
      var name = (/\W*function\s+([\w\$]+)\s*\(/)
        .exec(fn);
      if (!name) {
        return '(Anonymous)';
      }
      return name[1];
    };
    if (typeof v === 'string') {
      obj = this.window;
      method = v;
      name = v;
    } else if (typeof v === 'function') {
      return true;
    } else if (Object.prototype.toString.call(v) === '[object Array]' &&
      v.length === 2 && typeof v[0] === 'object' && typeof v[1] === 'string') {
      obj = v[0];
      method = v[1];
      name = (obj.constructor && getFuncName(obj.constructor)) + '::' + method;
    } else {
      return false;
    }
    if (syntax_only || typeof obj[method] === 'function') {
      if (callable_name) {
        this.window[callable_name] = name;
      }
      return true;
    }
    return false;
};

exports.is_float = function (mixed_var) {
  return +mixed_var === mixed_var && (!isFinite(mixed_var) || !! (mixed_var % 1));
};

exports.is_int = function (mixed_var) {
  return mixed_var === +mixed_var && isFinite(mixed_var) && !(mixed_var % 1);
};

exports.is_null = function (mixed_var) {
  return (mixed_var === null);
};

exports.is_numeric = function (mixed_var) {
  var whitespace =
      " \n\r\t\f\x0b\xa0\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u200b\u2028\u2029\u3000";
    return (typeof mixed_var === 'number' || (typeof mixed_var === 'string' && whitespace.indexOf(mixed_var.slice(-1)) === -
      1)) && mixed_var !== '' && !isNaN(mixed_var);
};

exports.is_object = function (mixed_var) {
  if (Object.prototype.toString.call(mixed_var) === '[object Array]') {
      return false;
    }
    return mixed_var !== null && typeof mixed_var === 'object';
};

exports.is_resource = function (handle) {
  var getFuncName = function(fn) {
      var name = (/\W*function\s+([\w\$]+)\s*\(/)
        .exec(fn);
      if (!name) {
        return '(Anonymous)';
      }
      return name[1];
    };
    return !(!handle || typeof handle !== 'object' || !handle.constructor || getFuncName(handle.constructor) !==
      'PHPJS_Resource');
};

exports.is_scalar = function (mixed_var) {
  return (/boolean|number|string/)
      .test(typeof mixed_var);
};

exports.is_string = function (mixed_var) {
  return (typeof mixed_var === 'string');
};

exports.is_unicode = function (vr) {
  if (typeof vr !== 'string') {
      return false;
    }
  
    // If surrogates occur outside of high-low pairs, then this is not Unicode
    var arr = [],
      any = '([\s\S])',
      highSurrogate = '[\uD800-\uDBFF]',
      lowSurrogate = '[\uDC00-\uDFFF]',
      highSurrogateBeforeAny = new RegExp(highSurrogate + any, 'g'),
      lowSurrogateAfterAny = new RegExp(any + lowSurrogate, 'g'),
      singleLowSurrogate = new RegExp('^' + lowSurrogate + '$'),
      singleHighSurrogate = new RegExp('^' + highSurrogate + '$');
  
    while ((arr = highSurrogateBeforeAny.exec(vr)) !== null) {
      if (!arr[1] || !arr[1].match(singleLowSurrogate)) { // If high not followed by low surrogate
        return false;
      }
    }
    while ((arr = lowSurrogateAfterAny.exec(vr)) !== null) {
      if (!arr[1] || !arr[1].match(singleHighSurrogate)) { // If low not preceded by high surrogate
        return false;
      }
    }
    return true;
};

exports.isset = function () {
  var a = arguments,
      l = a.length,
      i = 0,
      undef;
  
    if (l === 0) {
      throw new Error('Empty isset');
    }
  
    while (i !== l) {
      if (a[i] === undef || a[i] === null) {
        return false;
      }
      i++;
    }
    return true;
};

exports.serialize = function (mixed_value) {
  var val, key, okey,
      ktype = '',
      vals = '',
      count = 0,
      _utf8Size = function(str) {
        var size = 0,
          i = 0,
          l = str.length,
          code = '';
        for (i = 0; i < l; i++) {
          code = str.charCodeAt(i);
          if (code < 0x0080) {
            size += 1;
          } else if (code < 0x0800) {
            size += 2;
          } else {
            size += 3;
          }
        }
        return size;
      };
    _getType = function(inp) {
      var match, key, cons, types, type = typeof inp;
  
      if (type === 'object' && !inp) {
        return 'null';
      }
      if (type === 'object') {
        if (!inp.constructor) {
          return 'object';
        }
        cons = inp.constructor.toString();
        match = cons.match(/(\w+)\(/);
        if (match) {
          cons = match[1].toLowerCase();
        }
        types = ['boolean', 'number', 'string', 'array'];
        for (key in types) {
          if (cons == types[key]) {
            type = types[key];
            break;
          }
        }
      }
      return type;
    };
    type = _getType(mixed_value);
  
    switch (type) {
      case 'function':
        val = '';
        break;
      case 'boolean':
        val = 'b:' + (mixed_value ? '1' : '0');
        break;
      case 'number':
        val = (Math.round(mixed_value) == mixed_value ? 'i' : 'd') + ':' + mixed_value;
        break;
      case 'string':
        val = 's:' + _utf8Size(mixed_value) + ':"' + mixed_value + '"';
        break;
      case 'array':
      case 'object':
        val = 'a';
        /*
          if (type === 'object') {
            var objname = mixed_value.constructor.toString().match(/(\w+)\(\)/);
            if (objname == undefined) {
              return;
            }
            objname[1] = this.serialize(objname[1]);
            val = 'O' + objname[1].substring(1, objname[1].length - 1);
          }
          */
  
        for (key in mixed_value) {
          if (mixed_value.hasOwnProperty(key)) {
            ktype = _getType(mixed_value[key]);
            if (ktype === 'function') {
              continue;
            }
  
            okey = (key.match(/^[0-9]+$/) ? parseInt(key, 10) : key);
            vals += this.serialize(okey) + this.serialize(mixed_value[key]);
            count++;
          }
        }
        val += ':' + count + ':{' + vals + '}';
        break;
      case 'undefined':
        // Fall-through
      default:
        // if the JS object has a property which contains a null value, the string cannot be unserialized by PHP
        val = 'N';
        break;
    }
    if (type !== 'object' && type !== 'array') {
      val += ';';
    }
    return val;
};

exports.settype = function (vr, type) {
  var is_array = function(arr) {
      return typeof arr === 'object' && typeof arr.length === 'number' && !(arr.propertyIsEnumerable('length')) &&
        typeof arr.splice === 'function';
    };
    var v, mtch, i, obj;
    v = this[vr] ? this[vr] : vr;
  
    try {
      switch (type) {
        case 'boolean':
          if (is_array(v) && v.length === 0) {
            this[vr] = false;
          } else if (v === '0') {
            this[vr] = false;
          } else if (typeof v === 'object' && !is_array(v)) {
            var lgth = false;
            for (i in v) {
              lgth = true;
            }
            this[vr] = lgth;
          } else {
            this[vr] = !! v;
          }
          break;
        case 'integer':
          if (typeof v === 'number') {
            this[vr] = parseInt(v, 10);
          } else if (typeof v === 'string') {
            mtch = v.match(/^([+\-]?)(\d+)/);
            if (!mtch) {
              this[vr] = 0;
            } else {
              this[vr] = parseInt(v, 10);
            }
          } else if (v === true) {
            this[vr] = 1;
          } else if (v === false || v === null) {
            this[vr] = 0;
          } else if (is_array(v) && v.length === 0) {
            this[vr] = 0;
          } else if (typeof v === 'object') {
            this[vr] = 1;
          }
  
          break;
        case 'float':
          if (typeof v === 'string') {
            mtch = v.match(/^([+\-]?)(\d+(\.\d+)?|\.\d+)([eE][+\-]?\d+)?/);
            if (!mtch) {
              this[vr] = 0;
            } else {
              this[vr] = parseFloat(v, 10);
            }
          } else if (v === true) {
            this[vr] = 1;
          } else if (v === false || v === null) {
            this[vr] = 0;
          } else if (is_array(v) && v.length === 0) {
            this[vr] = 0;
          } else if (typeof v === 'object') {
            this[vr] = 1;
          }
          break;
        case 'string':
          if (v === null || v === false) {
            this[vr] = '';
          } else if (is_array(v)) {
            this[vr] = 'Array';
          } else if (typeof v === 'object') {
            this[vr] = 'Object';
          } else if (v === true) {
            this[vr] = '1';
          } else {
            this[vr] += '';
          } // numbers (and functions?)
          break;
        case 'array':
          if (v === null) {
            this[vr] = [];
          } else if (typeof v !== 'object') {
            this[vr] = [v];
          }
          break;
        case 'object':
          if (v === null) {
            this[vr] = {};
          } else if (is_array(v)) {
            for (i = 0, obj = {}; i < v.length; i++) {
              obj[i] = v;
            }
            this[vr] = obj;
          } else if (typeof v !== 'object') {
            this[vr] = {
              scalar: v
            };
          }
          break;
        case 'null':
          delete this[vr];
          break;
      }
      return true;
    } catch (e) {
      return false;
    }
};

exports.unserialize = function (data) {
  var that = this,
      utf8Overhead = function(chr) {
        // http://phpjs.org/functions/unserialize:571#comment_95906
        var code = chr.charCodeAt(0);
        if (code < 0x0080) {
          return 0;
        }
        if (code < 0x0800) {
          return 1;
        }
        return 2;
      };
    error = function(type, msg, filename, line) {
      throw new that.window[type](msg, filename, line);
    };
    read_until = function(data, offset, stopchr) {
      var i = 2,
        buf = [],
        chr = data.slice(offset, offset + 1);
  
      while (chr != stopchr) {
        if ((i + offset) > data.length) {
          error('Error', 'Invalid');
        }
        buf.push(chr);
        chr = data.slice(offset + (i - 1), offset + i);
        i += 1;
      }
      return [buf.length, buf.join('')];
    };
    read_chrs = function(data, offset, length) {
      var i, chr, buf;
  
      buf = [];
      for (i = 0; i < length; i++) {
        chr = data.slice(offset + (i - 1), offset + i);
        buf.push(chr);
        length -= utf8Overhead(chr);
      }
      return [buf.length, buf.join('')];
    };
    _unserialize = function(data, offset) {
      var dtype, dataoffset, keyandchrs, keys, contig,
        length, array, readdata, readData, ccount,
        stringlength, i, key, kprops, kchrs, vprops,
        vchrs, value, chrs = 0,
        typeconvert = function(x) {
          return x;
        };
  
      if (!offset) {
        offset = 0;
      }
      dtype = (data.slice(offset, offset + 1))
        .toLowerCase();
  
      dataoffset = offset + 2;
  
      switch (dtype) {
        case 'i':
          typeconvert = function(x) {
            return parseInt(x, 10);
          };
          readData = read_until(data, dataoffset, ';');
          chrs = readData[0];
          readdata = readData[1];
          dataoffset += chrs + 1;
          break;
        case 'b':
          typeconvert = function(x) {
            return parseInt(x, 10) !== 0;
          };
          readData = read_until(data, dataoffset, ';');
          chrs = readData[0];
          readdata = readData[1];
          dataoffset += chrs + 1;
          break;
        case 'd':
          typeconvert = function(x) {
            return parseFloat(x);
          };
          readData = read_until(data, dataoffset, ';');
          chrs = readData[0];
          readdata = readData[1];
          dataoffset += chrs + 1;
          break;
        case 'n':
          readdata = null;
          break;
        case 's':
          ccount = read_until(data, dataoffset, ':');
          chrs = ccount[0];
          stringlength = ccount[1];
          dataoffset += chrs + 2;
  
          readData = read_chrs(data, dataoffset + 1, parseInt(stringlength, 10));
          chrs = readData[0];
          readdata = readData[1];
          dataoffset += chrs + 2;
          if (chrs != parseInt(stringlength, 10) && chrs != readdata.length) {
            error('SyntaxError', 'String length mismatch');
          }
          break;
        case 'a':
          readdata = {};
  
          keyandchrs = read_until(data, dataoffset, ':');
          chrs = keyandchrs[0];
          keys = keyandchrs[1];
          dataoffset += chrs + 2;
  
          length = parseInt(keys, 10);
          contig = true;
  
          for (i = 0; i < length; i++) {
            kprops = _unserialize(data, dataoffset);
            kchrs = kprops[1];
            key = kprops[2];
            dataoffset += kchrs;
  
            vprops = _unserialize(data, dataoffset);
            vchrs = vprops[1];
            value = vprops[2];
            dataoffset += vchrs;
  
            if (key !== i)
              contig = false;
  
            readdata[key] = value;
          }
  
          if (contig) {
            array = new Array(length);
            for (i = 0; i < length; i++)
              array[i] = readdata[i];
            readdata = array;
          }
  
          dataoffset += 1;
          break;
        default:
          error('SyntaxError', 'Unknown / Unhandled data type(s): ' + dtype);
          break;
      }
      return [dtype, dataoffset - offset, typeconvert(readdata)];
    };
  
    return _unserialize((data + ''), 0)[2];
};

exports.xdiff_string_diff = function (old_data, new_data, context_lines, minimal) {
  // (This code was done by Imgen Tata; I have only reformatted for use in php.js)
  
    // See http://en.wikipedia.org/wiki/Diff#Unified_format
    var i = 0,
      j = 0,
      k = 0,
      ori_hunk_start, new_hunk_start, ori_hunk_end, new_hunk_end, ori_hunk_line_no, new_hunk_line_no, ori_hunk_size,
      new_hunk_size,
      // Potential configuration
      MAX_CONTEXT_LINES = Number.POSITIVE_INFINITY,
      MIN_CONTEXT_LINES = 0,
      DEFAULT_CONTEXT_LINES = 3,
      //
      HEADER_PREFIX = '@@ ',
      HEADER_SUFFIX = ' @@',
      ORIGINAL_INDICATOR = '-',
      NEW_INDICATOR = '+',
      RANGE_SEPARATOR = ',',
      CONTEXT_INDICATOR = ' ',
      DELETION_INDICATOR = '-',
      ADDITION_INDICATOR = '+',
      ori_lines, new_lines, NEW_LINE = '\n',
      /**
       * Trims string
       */
      trim = function(text) {
        if (typeof text !== 'string') {
          throw new Error('String parameter required');
        }
  
        return text.replace(/(^\s*)|(\s*$)/g, '');
      },
      /**
       * Verifies type of arguments
       */
      verify_type = function(type) {
        var args = arguments,
          args_len = arguments.length,
          basic_types = ['number', 'boolean', 'string', 'function', 'object', 'undefined'],
          basic_type, i, j, type_of_type = typeof type;
        if (type_of_type !== 'string' && type_of_type !== 'function') {
          throw new Error('Bad type parameter');
        }
  
        if (args_len < 2) {
          throw new Error('Too few arguments');
        }
  
        if (type_of_type === 'string') {
          type = trim(type);
  
          if (type === '') {
            throw new Error('Bad type parameter');
          }
  
          for (j = 0; j < basic_types.length; j++) {
            basic_type = basic_types[j];
  
            if (basic_type == type) {
              for (i = 1; i < args_len; i++) {
                if (typeof args[i] !== type) {
                  throw new Error('Bad type');
                }
              }
  
              return;
            }
          }
  
          throw new Error('Bad type parameter');
        }
  
        // Not basic type. we need to use instanceof operator
        for (i = 1; i < args_len; i++) {
          if (!(args[i] instanceof type)) {
            throw new Error('Bad type');
          }
        }
      },
      /**
       * Checks if the specified array contains an element with specified value
       */
      has_value = function(array, value) {
        var i;
        verify_type(Array, array);
  
        for (i = 0; i < array.length; i++) {
          if (array[i] === value) {
            return true;
          }
        }
  
        return false;
      },
      /**
       * Checks the type of arguments
       * @param {String | Function} type Specifies the desired type
       * @return {Boolean} Return true if all arguments after the type argument are of specified type. Else false
       */
      are_type_of = function(type) {
        var args = arguments,
          args_len = arguments.length,
          basic_types = ['number', 'boolean', 'string', 'function', 'object', 'undefined'],
          basic_type, i, j, type_of_type = typeof type;
        if (type_of_type !== 'string' && type_of_type !== 'function') {
          throw new Error('Bad type parameter');
        }
  
        if (args_len < 2) {
          throw new Error('Too few arguments');
        }
  
        if (type_of_type === 'string') {
          type = trim(type);
  
          if (type === '') {
            return false;
          }
  
          for (j = 0; j < basic_types.length; j++) {
            basic_type = basic_types[j];
  
            if (basic_type == type) {
              for (i = 1; i < args_len; i++) {
                if (typeof args[i] != type) {
                  return false;
                }
              }
  
              return true;
            }
          }
  
          throw new Error('Bad type parameter');
        }
  
        // Not basic type. we need to use instanceof operator
        for (i = 1; i < args_len; i++) {
          if (!(args[i] instanceof type)) {
            return false;
          }
        }
  
        return true;
      },
      /*
       * Initialize and return an array with specified size and initial value
       */
      get_initialized_array = function(array_size, init_value) {
        var array = [],
          i;
        verify_type('number', array_size);
  
        for (i = 0; i < array_size; i++) {
          array.push(init_value);
        }
  
        return array;
      },
      /**
       * Splits text into lines and return as a string array
       */
      split_into_lines = function(text) {
        verify_type('string', text);
  
        if (text === '') {
          return [];
        }
        return text.split('\n');
      },
      is_empty_array = function(obj) {
        return are_type_of(Array, obj) && obj.length === 0;
      },
      /**
       * Finds longest common sequence between two sequences
       * @see {@link http://wordaligned.org/articles/longest-common-subsequence}
       */
      find_longest_common_sequence = function(seq1, seq2, seq1_is_in_lcs, seq2_is_in_lcs) {
        if (!are_type_of(Array, seq1, seq2)) {
          throw new Error('Array parameters are required');
        }
  
        // Deal with edge case
        if (is_empty_array(seq1) || is_empty_array(seq2)) {
          return [];
        }
  
        // Function to calculate lcs lengths
        var lcs_lens = function(xs, ys) {
          var i, j, prev,
            curr = get_initialized_array(ys.length + 1, 0);
  
          for (i = 0; i < xs.length; i++) {
            prev = curr.slice(0);
            for (j = 0; j < ys.length; j++) {
              if (xs[i] === ys[j]) {
                curr[j + 1] = prev[j] + 1;
              } else {
                curr[j + 1] = Math.max(curr[j], prev[j + 1]);
              }
            }
          }
  
          return curr;
        },
          // Function to find lcs and fill in the array to indicate the optimal longest common sequence
          find_lcs = function(xs, xidx, xs_is_in, ys) {
            var i, xb, xe, ll_b, ll_e, pivot, max, yb, ye,
              nx = xs.length,
              ny = ys.length;
  
            if (nx === 0) {
              return [];
            }
            if (nx === 1) {
              if (has_value(ys, xs[0])) {
                xs_is_in[xidx] = true;
                return [xs[0]];
              }
              return [];
            }
            i = Math.floor(nx / 2);
            xb = xs.slice(0, i);
            xe = xs.slice(i);
            ll_b = lcs_lens(xb, ys);
            ll_e = lcs_lens(xe.slice(0)
              .reverse(), ys.slice(0)
              .reverse());
  
            pivot = 0;
            max = 0;
            for (j = 0; j <= ny; j++) {
              if (ll_b[j] + ll_e[ny - j] > max) {
                pivot = j;
                max = ll_b[j] + ll_e[ny - j];
              }
            }
            yb = ys.slice(0, pivot);
            ye = ys.slice(pivot);
            return find_lcs(xb, xidx, xs_is_in, yb)
              .concat(find_lcs(xe, xidx + i, xs_is_in, ye));
          };
  
        // Fill in seq1_is_in_lcs to find the optimal longest common subsequence of first sequence
        find_lcs(seq1, 0, seq1_is_in_lcs, seq2);
        // Fill in seq2_is_in_lcs to find the optimal longest common subsequence of second sequence and return the result
        return find_lcs(seq2, 0, seq2_is_in_lcs, seq1);
      };
  
    // First, check the parameters
    if (are_type_of('string', old_data, new_data) === false) {
      return false;
    }
  
    if (old_data == new_data) {
      return '';
    }
  
    if (typeof context_lines !== 'number' || context_lines > MAX_CONTEXT_LINES || context_lines < MIN_CONTEXT_LINES) {
      context_lines = DEFAULT_CONTEXT_LINES;
    }
  
    ori_lines = split_into_lines(old_data);
    new_lines = split_into_lines(new_data);
    var ori_len = ori_lines.length,
      new_len = new_lines.length,
      ori_is_in_lcs = get_initialized_array(ori_len, false),
      new_is_in_lcs = get_initialized_array(new_len, false),
      lcs_len = find_longest_common_sequence(ori_lines, new_lines, ori_is_in_lcs, new_is_in_lcs)
        .length,
      unidiff = '';
  
    if (lcs_len === 0) { // No common sequence
      unidiff = HEADER_PREFIX + ORIGINAL_INDICATOR + (ori_len > 0 ? '1' : '0') + RANGE_SEPARATOR + ori_len + ' ' +
        NEW_INDICATOR + (new_len > 0 ? '1' : '0') + RANGE_SEPARATOR + new_len + HEADER_SUFFIX;
  
      for (i = 0; i < ori_len; i++) {
        unidiff += NEW_LINE + DELETION_INDICATOR + ori_lines[i];
      }
  
      for (j = 0; j < new_len; j++) {
        unidiff += NEW_LINE + ADDITION_INDICATOR + new_lines[j];
      }
  
      return unidiff;
    }
  
    var leading_context = [],
      trailing_context = [],
      actual_leading_context = [],
      actual_trailing_context = [],
  
      // Regularize leading context by the context_lines parameter
      regularize_leading_context = function(context) {
        if (context.length === 0 || context_lines === 0) {
          return [];
        }
  
        var context_start_pos = Math.max(context.length - context_lines, 0);
  
        return context.slice(context_start_pos);
      },
  
      // Regularize trailing context by the context_lines parameter
      regularize_trailing_context = function(context) {
        if (context.length === 0 || context_lines === 0) {
          return [];
        }
  
        return context.slice(0, Math.min(context_lines, context.length));
      };
  
    // Skip common lines in the beginning
    while (i < ori_len && ori_is_in_lcs[i] === true && new_is_in_lcs[i] === true) {
      leading_context.push(ori_lines[i]);
      i++;
    }
  
    j = i;
    k = i; // The index in the longest common sequence
    ori_hunk_start = i;
    new_hunk_start = j;
    ori_hunk_end = i;
    new_hunk_end = j;
  
    while (i < ori_len || j < new_len) {
      while (i < ori_len && ori_is_in_lcs[i] === false) {
        i++;
      }
      ori_hunk_end = i;
  
      while (j < new_len && new_is_in_lcs[j] === false) {
        j++;
      }
      new_hunk_end = j;
  
      // Find the trailing context
      trailing_context = [];
      while (i < ori_len && ori_is_in_lcs[i] === true && j < new_len && new_is_in_lcs[j] === true) {
        trailing_context.push(ori_lines[i]);
        k++;
        i++;
        j++;
      }
  
      if (k >= lcs_len || // No more in longest common lines
        trailing_context.length >= 2 * context_lines) { // Context break found
        if (trailing_context.length < 2 * context_lines) { // It must be last block of common lines but not a context break
          trailing_context = [];
  
          // Force break out
          i = ori_len;
          j = new_len;
  
          // Update hunk ends to force output to the end
          ori_hunk_end = ori_len;
          new_hunk_end = new_len;
        }
  
        // Output the diff hunk
  
        // Trim the leading and trailing context block
        actual_leading_context = regularize_leading_context(leading_context);
        actual_trailing_context = regularize_trailing_context(trailing_context);
  
        ori_hunk_start -= actual_leading_context.length;
        new_hunk_start -= actual_leading_context.length;
        ori_hunk_end += actual_trailing_context.length;
        new_hunk_end += actual_trailing_context.length;
  
        ori_hunk_line_no = ori_hunk_start + 1;
        new_hunk_line_no = new_hunk_start + 1;
        ori_hunk_size = ori_hunk_end - ori_hunk_start;
        new_hunk_size = new_hunk_end - new_hunk_start;
  
        // Build header
        unidiff += HEADER_PREFIX + ORIGINAL_INDICATOR + ori_hunk_line_no + RANGE_SEPARATOR + ori_hunk_size + ' ' +
          NEW_INDICATOR + new_hunk_line_no + RANGE_SEPARATOR + new_hunk_size + HEADER_SUFFIX + NEW_LINE;
  
        // Build the diff hunk content
        while (ori_hunk_start < ori_hunk_end || new_hunk_start < new_hunk_end) {
          if (ori_hunk_start < ori_hunk_end && ori_is_in_lcs[ori_hunk_start] === true && new_is_in_lcs[
            new_hunk_start] === true) { // The context line
            unidiff += CONTEXT_INDICATOR + ori_lines[ori_hunk_start] + NEW_LINE;
            ori_hunk_start++;
            new_hunk_start++;
          } else if (ori_hunk_start < ori_hunk_end && ori_is_in_lcs[ori_hunk_start] === false) { // The deletion line
            unidiff += DELETION_INDICATOR + ori_lines[ori_hunk_start] + NEW_LINE;
            ori_hunk_start++;
          } else if (new_hunk_start < new_hunk_end && new_is_in_lcs[new_hunk_start] === false) { // The additional line
            unidiff += ADDITION_INDICATOR + new_lines[new_hunk_start] + NEW_LINE;
            new_hunk_start++;
          }
        }
  
        // Update hunk position and leading context
        ori_hunk_start = i;
        new_hunk_start = j;
        leading_context = trailing_context;
      }
    }
  
    // Trim the trailing new line if it exists
    if (unidiff.length > 0 && unidiff.charAt(unidiff.length) === NEW_LINE) {
      unidiff = unidiff.slice(0, -1);
    }
  
    return unidiff;
};

exports.xdiff_string_patch = function (originalStr, patch, flags, error) {
  // First two functions were adapted from Steven Levithan, also under an MIT license
    // Adapted from XRegExp 1.5.0
    // (c) 2007-2010 Steven Levithan
    // MIT License
    // <http://xregexp.com>
    var getNativeFlags = function(regex) {
      return (regex.global ? 'g' : '') + (regex.ignoreCase ? 'i' : '') + (regex.multiline ? 'm' : '') + (regex.extended ?
        'x' : '') + // Proposed for ES4; included in AS3
      (regex.sticky ? 'y' : '');
    },
      cbSplit = function(string, sep /* separator */ ) {
        // If separator `s` is not a regex, use the native `split`
        if (!(sep instanceof RegExp)) { // Had problems to get it to work here using prototype test
          return String.prototype.split.apply(string, arguments);
        }
        var str = String(string),
          output = [],
          lastLastIndex = 0,
          match, lastLength, limit = Infinity,
  
          // This is required if not `s.global`, and it avoids needing to set `s.lastIndex` to zero
          // and restore it to its original value when we're done using the regex
          x = sep._xregexp,
          s = new RegExp(sep.source, getNativeFlags(sep) + 'g'); // Brett paring down
        if (x) {
          s._xregexp = {
            source: x.source,
            captureNames: x.captureNames ? x.captureNames.slice(0) : null
          };
        }
  
        while ((match = s.exec(str))) { // Run the altered `exec` (required for `lastIndex` fix, etc.)
          if (s.lastIndex > lastLastIndex) {
            output.push(str.slice(lastLastIndex, match.index));
  
            if (match.length > 1 && match.index < str.length) {
              Array.prototype.push.apply(output, match.slice(1));
            }
  
            lastLength = match[0].length;
            lastLastIndex = s.lastIndex;
  
            if (output.length >= limit) {
              break;
            }
          }
  
          if (s.lastIndex === match.index) {
            s.lastIndex++;
          }
        }
  
        if (lastLastIndex === str.length) {
          if (!s.test('') || lastLength) {
            output.push('');
          }
        } else {
          output.push(str.slice(lastLastIndex));
        }
  
        return output.length > limit ? output.slice(0, limit) : output;
      },
      i = 0,
      ll = 0,
      ranges = [],
      lastLinePos = 0,
      firstChar = '',
      rangeExp = /^@@\s+-(\d+),(\d+)\s+\+(\d+),(\d+)\s+@@$/,
      lineBreaks = /\r?\n/,
      lines = cbSplit(patch.replace(/(\r?\n)+$/, ''), lineBreaks),
      origLines = cbSplit(originalStr, lineBreaks),
      newStrArr = [],
      linePos = 0,
      errors = '',
      // Both string & integer (constant) input is allowed
      optTemp = 0,
      OPTS = { // Unsure of actual PHP values, so better to rely on string
        'XDIFF_PATCH_NORMAL': 1,
        'XDIFF_PATCH_REVERSE': 2,
        'XDIFF_PATCH_IGNORESPACE': 4
      };
  
    // Input defaulting & sanitation
    if (typeof originalStr !== 'string' || !patch) {
      return false;
    }
    if (!flags) {
      flags = 'XDIFF_PATCH_NORMAL';
    }
  
    if (typeof flags !== 'number') { // Allow for a single string or an array of string flags
      flags = [].concat(flags);
      for (i = 0; i < flags.length; i++) {
        // Resolve string input to bitwise e.g. 'XDIFF_PATCH_NORMAL' becomes 1
        if (OPTS[flags[i]]) {
          optTemp = optTemp | OPTS[flags[i]];
        }
      }
      flags = optTemp;
    }
  
    if (flags & OPTS.XDIFF_PATCH_NORMAL) {
      for (i = 0, ll = lines.length; i < ll; i++) {
        ranges = lines[i].match(rangeExp);
        if (ranges) {
          lastLinePos = linePos;
          linePos = ranges[1] - 1;
          while (lastLinePos < linePos) {
            newStrArr[newStrArr.length] = origLines[lastLinePos++];
          }
          while (lines[++i] && (rangeExp.exec(lines[i])) === null) {
            firstChar = lines[i].charAt(0);
            switch (firstChar) {
              case '-':
                ++linePos; // Skip including that line
                break;
              case '+':
                newStrArr[newStrArr.length] = lines[i].slice(1);
                break;
              case ' ':
                newStrArr[newStrArr.length] = origLines[linePos++];
                break;
              default:
                throw 'Unrecognized initial character in unidiff line'; // Reconcile with returning errrors arg?
            }
          }
          if (lines[i]) {
            i--;
          }
        }
      }
      while (linePos > 0 && linePos < origLines.length) {
        newStrArr[newStrArr.length] = origLines[linePos++];
      }
    } else if (flags & OPTS.XDIFF_PATCH_REVERSE) { // Only differs from above by a few lines
      for (i = 0, ll = lines.length; i < ll; i++) {
        ranges = lines[i].match(rangeExp);
        if (ranges) {
          lastLinePos = linePos;
          linePos = ranges[3] - 1;
          while (lastLinePos < linePos) {
            newStrArr[newStrArr.length] = origLines[lastLinePos++];
          }
          while (lines[++i] && (rangeExp.exec(lines[i])) === null) {
            firstChar = lines[i].charAt(0);
            switch (firstChar) {
              case '-':
                newStrArr[newStrArr.length] = lines[i].slice(1);
                break;
              case '+':
                ++linePos; // Skip including that line
                break;
              case ' ':
                newStrArr[newStrArr.length] = origLines[linePos++];
                break;
              default:
                throw 'Unrecognized initial character in unidiff line'; // Reconcile with returning errrors arg?
            }
          }
          if (lines[i]) {
            i--;
          }
        }
      }
      while (linePos > 0 && linePos < origLines.length) {
        newStrArr[newStrArr.length] = origLines[linePos++];
      }
    }
    if (typeof error === 'string') {
      this.window[error] = errors;
    }
    return newStrArr.join('\n');
};

exports.utf8_decode = function (str_data) {
  var tmp_arr = [],
      i = 0,
      ac = 0,
      c1 = 0,
      c2 = 0,
      c3 = 0,
      c4 = 0;
  
    str_data += '';
  
    while (i < str_data.length) {
      c1 = str_data.charCodeAt(i);
      if (c1 <= 191) {
        tmp_arr[ac++] = String.fromCharCode(c1);
        i++;
      } else if (c1 <= 223) {
        c2 = str_data.charCodeAt(i + 1);
        tmp_arr[ac++] = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
        i += 2;
      } else if (c1 <= 239) {
        // http://en.wikipedia.org/wiki/UTF-8#Codepage_layout
        c2 = str_data.charCodeAt(i + 1);
        c3 = str_data.charCodeAt(i + 2);
        tmp_arr[ac++] = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
        i += 3;
      } else {
        c2 = str_data.charCodeAt(i + 1);
        c3 = str_data.charCodeAt(i + 2);
        c4 = str_data.charCodeAt(i + 3);
        c1 = ((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63);
        c1 -= 0x10000;
        tmp_arr[ac++] = String.fromCharCode(0xD800 | ((c1 >> 10) & 0x3FF));
        tmp_arr[ac++] = String.fromCharCode(0xDC00 | (c1 & 0x3FF));
        i += 4;
      }
    }
  
    return tmp_arr.join('');
};

exports.utf8_encode = function (argString) {
  if (argString === null || typeof argString === 'undefined') {
      return '';
    }
  
    var string = (argString + ''); // .replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    var utftext = '',
      start, end, stringl = 0;
  
    start = end = 0;
    stringl = string.length;
    for (var n = 0; n < stringl; n++) {
      var c1 = string.charCodeAt(n);
      var enc = null;
  
      if (c1 < 128) {
        end++;
      } else if (c1 > 127 && c1 < 2048) {
        enc = String.fromCharCode(
          (c1 >> 6) | 192, (c1 & 63) | 128
        );
      } else if ((c1 & 0xF800) != 0xD800) {
        enc = String.fromCharCode(
          (c1 >> 12) | 224, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
        );
      } else { // surrogate pairs
        if ((c1 & 0xFC00) != 0xD800) {
          throw new RangeError('Unmatched trail surrogate at ' + n);
        }
        var c2 = string.charCodeAt(++n);
        if ((c2 & 0xFC00) != 0xDC00) {
          throw new RangeError('Unmatched lead surrogate at ' + (n - 1));
        }
        c1 = ((c1 & 0x3FF) << 10) + (c2 & 0x3FF) + 0x10000;
        enc = String.fromCharCode(
          (c1 >> 18) | 240, ((c1 >> 12) & 63) | 128, ((c1 >> 6) & 63) | 128, (c1 & 63) | 128
        );
      }
      if (enc !== null) {
        if (end > start) {
          utftext += string.slice(start, end);
        }
        utftext += enc;
        start = end = n + 1;
      }
    }
  
    if (end > start) {
      utftext += string.slice(start, stringl);
    }
  
    return utftext;
};

exports.array_flip = function (trans) {
  var key, tmp_ar = {};
  
    // Duck-type check for our own array()-created PHPJS_Array
    if (trans && typeof trans === 'object' && trans.change_key_case) {
      return trans.flip();
    }
  
    for (key in trans) {
      if (!trans.hasOwnProperty(key)) {
        continue;
      }
      tmp_ar[trans[key]] = key;
    }
  
    return tmp_ar;
};

exports.array_merge_recursive = function (arr1, arr2) {
  var idx = '';
  
    if (arr1 && Object.prototype.toString.call(arr1) === '[object Array]' &&
      arr2 && Object.prototype.toString.call(arr2) === '[object Array]') {
      for (idx in arr2) {
        arr1.push(arr2[idx]);
      }
    } else if ((arr1 && (arr1 instanceof Object)) && (arr2 && (arr2 instanceof Object))) {
      for (idx in arr2) {
        if (idx in arr1) {
          if (typeof arr1[idx] === 'object' && typeof arr2 === 'object') {
            arr1[idx] = this.array_merge(arr1[idx], arr2[idx]);
          } else {
            arr1[idx] = arr2[idx];
          }
        } else {
          arr1[idx] = arr2[idx];
        }
      }
    }
  
    return arr1;
};

exports.array_search = function (needle, haystack, argStrict) {
  var strict = !! argStrict,
      key = '';
  
    if (haystack && typeof haystack === 'object' && haystack.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
      return haystack.search(needle, argStrict);
    }
    if (typeof needle === 'object' && needle.exec) { // Duck-type for RegExp
      if (!strict) { // Let's consider case sensitive searches as strict
        var flags = 'i' + (needle.global ? 'g' : '') +
          (needle.multiline ? 'm' : '') +
          (needle.sticky ? 'y' : ''); // sticky is FF only
        needle = new RegExp(needle.source, flags);
      }
      for (key in haystack) {
        if (needle.test(haystack[key])) {
          return key;
        }
      }
      return false;
    }
  
    for (key in haystack) {
      if ((strict && haystack[key] === needle) || (!strict && haystack[key] == needle)) {
        return key;
      }
    }
  
    return false;
};

exports.array_slice = function (arr, offst, lgth, preserve_keys) {
  /*
    if ('callee' in arr && 'length' in arr) {
      arr = Array.prototype.slice.call(arr);
    }
    */
  
    var key = '';
  
    if (Object.prototype.toString.call(arr) !== '[object Array]' ||
      (preserve_keys && offst !== 0)) { // Assoc. array as input or if required as output
      var lgt = 0,
        newAssoc = {};
      for (key in arr) {
        //if (key !== 'length') {
        lgt += 1;
        newAssoc[key] = arr[key];
        //}
      }
      arr = newAssoc;
  
      offst = (offst < 0) ? lgt + offst : offst;
      lgth = lgth === undefined ? lgt : (lgth < 0) ? lgt + lgth - offst : lgth;
  
      var assoc = {};
      var start = false,
        it = -1,
        arrlgth = 0,
        no_pk_idx = 0;
      for (key in arr) {
        ++it;
        if (arrlgth >= lgth) {
          break;
        }
        if (it == offst) {
          start = true;
        }
        if (!start) {
          continue;
        }++arrlgth;
        if (this.is_int(key) && !preserve_keys) {
          assoc[no_pk_idx++] = arr[key];
        } else {
          assoc[key] = arr[key];
        }
      }
      //assoc.length = arrlgth; // Make as array-like object (though length will not be dynamic)
      return assoc;
    }
  
    if (lgth === undefined) {
      return arr.slice(offst);
    } else if (lgth >= 0) {
      return arr.slice(offst, offst + lgth);
    } else {
      return arr.slice(offst, lgth);
    }
};

exports.array_splice = function (arr, offst, lgth, replacement) {
  var _checkToUpIndices = function(arr, ct, key) {
      // Deal with situation, e.g., if encounter index 4 and try to set it to 0, but 0 exists later in loop (need to
      // increment all subsequent (skipping current key, since we need its value below) until find unused)
      if (arr[ct] !== undefined) {
        var tmp = ct;
        ct += 1;
        if (ct === key) {
          ct += 1;
        }
        ct = _checkToUpIndices(arr, ct, key);
        arr[ct] = arr[tmp];
        delete arr[tmp];
      }
      return ct;
    };
  
    if (replacement && typeof replacement !== 'object') {
      replacement = [replacement];
    }
    if (lgth === undefined) {
      lgth = offst >= 0 ? arr.length - offst : -offst;
    } else if (lgth < 0) {
      lgth = (offst >= 0 ? arr.length - offst : -offst) + lgth;
    }
  
    if (Object.prototype.toString.call(arr) !== '[object Array]') {
      /*if (arr.length !== undefined) { // Deal with array-like objects as input
      delete arr.length;
      }*/
      var lgt = 0,
        ct = -1,
        rmvd = [],
        rmvdObj = {},
        repl_ct = -1,
        int_ct = -1;
      var returnArr = true,
        rmvd_ct = 0,
        rmvd_lgth = 0,
        key = '';
      // rmvdObj.length = 0;
      for (key in arr) { // Can do arr.__count__ in some browsers
        lgt += 1;
      }
      offst = (offst >= 0) ? offst : lgt + offst;
      for (key in arr) {
        ct += 1;
        if (ct < offst) {
          if (this.is_int(key)) {
            int_ct += 1;
            if (parseInt(key, 10) === int_ct) { // Key is already numbered ok, so don't need to change key for value
              continue;
            }
            _checkToUpIndices(arr, int_ct, key); // Deal with situation, e.g.,
            // if encounter index 4 and try to set it to 0, but 0 exists later in loop
            arr[int_ct] = arr[key];
            delete arr[key];
          }
          continue;
        }
        if (returnArr && this.is_int(key)) {
          rmvd.push(arr[key]);
          rmvdObj[rmvd_ct++] = arr[key]; // PHP starts over here too
        } else {
          rmvdObj[key] = arr[key];
          returnArr = false;
        }
        rmvd_lgth += 1;
        // rmvdObj.length += 1;
        if (replacement && replacement[++repl_ct]) {
          arr[key] = replacement[repl_ct];
        } else {
          delete arr[key];
        }
      }
      // arr.length = lgt - rmvd_lgth + (replacement ? replacement.length : 0); // Make (back) into an array-like object
      return returnArr ? rmvd : rmvdObj;
    }
  
    if (replacement) {
      replacement.unshift(offst, lgth);
      return Array.prototype.splice.apply(arr, replacement);
    }
    return arr.splice(offst, lgth);
};

exports.array_walk = function (array, funcname, userdata) {
  var key, value, ini;
  
    if (!array || typeof array !== 'object') {
      return false;
    }
    if (typeof array === 'object' && array.change_key_case) { // Duck-type check for our own array()-created PHPJS_Array
      if (arguments.length > 2) {
        return array.walk(funcname, userdata);
      } else {
        return array.walk(funcname);
      }
    }
  
    try {
      if (typeof funcname === 'function') {
        for (key in array) {
          if (arguments.length > 2) {
            funcname(array[key], key, userdata);
          } else {
            funcname(array[key], key);
          }
        }
      } else if (typeof funcname === 'string') {
        this.php_js = this.php_js || {};
        this.php_js.ini = this.php_js.ini || {};
        ini = this.php_js.ini['phpjs.no-eval'];
        if (ini && (
          parseInt(ini.local_value, 10) !== 0 && (!ini.local_value.toLowerCase || ini.local_value.toLowerCase() !==
            'off')
        )) {
          if (arguments.length > 2) {
            for (key in array) {
              this.window[funcname](array[key], key, userdata);
            }
          } else {
            for (key in array) {
              this.window[funcname](array[key], key);
            }
          }
        } else {
          if (arguments.length > 2) {
            for (key in array) {
              eval(funcname + '(array[key], key, userdata)');
            }
          } else {
            for (key in array) {
              eval(funcname + '(array[key], key)');
            }
          }
        }
      } else if (funcname && typeof funcname === 'object' && funcname.length === 2) {
        var obj = funcname[0],
          func = funcname[1];
        if (arguments.length > 2) {
          for (key in array) {
            obj[func](array[key], key, userdata);
          }
        } else {
          for (key in array) {
            obj[func](array[key], key);
          }
        }
      } else {
        return false;
      }
    } catch (e) {
      return false;
    }
  
    return true;
};

exports.natcasesort = function (inputArr) {
  var valArr = [],
      k, i, ret, that = this,
      strictForIn = false,
      populateArr = {};
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Get key and value arrays
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        valArr.push([k, inputArr[k]]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
    valArr.sort(function(a, b) {
      return that.strnatcasecmp(a[1], b[1]);
    });
  
    // Repopulate the old array
    for (i = 0; i < valArr.length; i++) {
      populateArr[valArr[i][0]] = valArr[i][1];
    }
  
    return strictForIn || populateArr;
};

exports.pos = function (arr) {
  return this.current(arr);
};

exports.sizeof = function (mixed_var, mode) {
  return this.count(mixed_var, mode);
};

exports.bcadd = function (left_operand, right_operand, scale) {
  var libbcmath = this._phpjs_shared_bc();
  
    var first, second, result;
  
    if (typeof scale === 'undefined') {
      scale = libbcmath.scale;
    }
    scale = ((scale < 0) ? 0 : scale);
  
    // create objects
    first = libbcmath.bc_init_num();
    second = libbcmath.bc_init_num();
    result = libbcmath.bc_init_num();
  
    first = libbcmath.php_str2num(left_operand.toString());
    second = libbcmath.php_str2num(right_operand.toString());
  
    result = libbcmath.bc_add(first, second, scale);
  
    if (result.n_scale > scale) {
      result.n_scale = scale;
    }
  
    return result.toString();
};

exports.bccomp = function (left_operand, right_operand, scale) {
  var libbcmath = this._phpjs_shared_bc();
  
    var first, second; //bc_num
    if (typeof scale === 'undefined') {
      scale = libbcmath.scale;
    }
    scale = ((scale < 0) ? 0 : scale);
  
    first = libbcmath.bc_init_num();
    second = libbcmath.bc_init_num();
  
    first = libbcmath.bc_str2num(left_operand.toString(), scale); // note bc_ not php_str2num
    second = libbcmath.bc_str2num(right_operand.toString(), scale); // note bc_ not php_str2num
    return libbcmath.bc_compare(first, second, scale);
};

exports.bcdiv = function (left_operand, right_operand, scale) {
  var libbcmath = this._phpjs_shared_bc();
  
    var first, second, result;
  
    if (typeof scale === 'undefined') {
      scale = libbcmath.scale;
    }
    scale = ((scale < 0) ? 0 : scale);
  
    // create objects
    first = libbcmath.bc_init_num();
    second = libbcmath.bc_init_num();
    result = libbcmath.bc_init_num();
  
    first = libbcmath.php_str2num(left_operand.toString());
    second = libbcmath.php_str2num(right_operand.toString());
  
    result = libbcmath.bc_divide(first, second, scale);
    if (result === -1) {
      // error
      throw new Error(11, '(BC) Division by zero');
    }
    if (result.n_scale > scale) {
      result.n_scale = scale;
    }
    return result.toString();
};

exports.bcmul = function (left_operand, right_operand, scale) {
  var libbcmath = this._phpjs_shared_bc();
  
    var first, second, result;
  
    if (typeof scale === 'undefined') {
      scale = libbcmath.scale;
    }
    scale = ((scale < 0) ? 0 : scale);
  
    // create objects
    first = libbcmath.bc_init_num();
    second = libbcmath.bc_init_num();
    result = libbcmath.bc_init_num();
  
    first = libbcmath.php_str2num(left_operand.toString());
    second = libbcmath.php_str2num(right_operand.toString());
  
    result = libbcmath.bc_multiply(first, second, scale);
  
    if (result.n_scale > scale) {
      result.n_scale = scale;
    }
    return result.toString();
};

exports.bcround = function (val, precision) {
  var libbcmath = this._phpjs_shared_bc();
  
    var temp, result, digit;
    var right_operand;
  
    // create number
    temp = libbcmath.bc_init_num();
    temp = libbcmath.php_str2num(val.toString());
  
    // check if any rounding needs
    if (precision >= temp.n_scale) {
      // nothing to round, just add the zeros.
      while (temp.n_scale < precision) {
        temp.n_value[temp.n_len + temp.n_scale] = 0;
        temp.n_scale++;
      }
      return temp.toString();
    }
  
    // get the digit we are checking (1 after the precision)
    // loop through digits after the precision marker
    digit = temp.n_value[temp.n_len + precision];
  
    right_operand = libbcmath.bc_init_num();
    right_operand = libbcmath.bc_new_num(1, precision);
  
    if (digit >= 5) {
      //round away from zero by adding 1 (or -1) at the "precision".. ie 1.44999 @ 3dp = (1.44999 + 0.001).toString().substr(0,5)
      right_operand.n_value[right_operand.n_len + right_operand.n_scale - 1] = 1;
      if (temp.n_sign == libbcmath.MINUS) {
        // round down
        right_operand.n_sign = libbcmath.MINUS;
      }
      result = libbcmath.bc_add(temp, right_operand, precision);
    } else {
      // leave-as-is.. just truncate it.
      result = temp;
    }
  
    if (result.n_scale > precision) {
      result.n_scale = precision;
    }
    return result.toString();
};

exports.bcscale = function (scale) {
  var libbcmath = this._phpjs_shared_bc();
  
    scale = parseInt(scale, 10);
    if (isNaN(scale)) {
      return false;
    }
    if (scale < 0) {
      return false;
    }
    libbcmath.scale = scale;
    return true;
};

exports.bcsub = function (left_operand, right_operand, scale) {
  var libbcmath = this._phpjs_shared_bc();
  
    var first, second, result;
  
    if (typeof scale === 'undefined') {
      scale = libbcmath.scale;
    }
    scale = ((scale < 0) ? 0 : scale);
  
    // create objects
    first = libbcmath.bc_init_num();
    second = libbcmath.bc_init_num();
    result = libbcmath.bc_init_num();
  
    first = libbcmath.php_str2num(left_operand.toString());
    second = libbcmath.php_str2num(right_operand.toString());
  
    result = libbcmath.bc_sub(first, second, scale);
  
    if (result.n_scale > scale) {
      result.n_scale = scale;
    }
  
    return result.toString();
};

exports.date_parse = function (date) {
  // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    // END REDUNDANT
  
    var ts,
      warningsOffset = this.php_js.warnings ? this.php_js.warnings.length : null,
      errorsOffset = this.php_js.errors ? this.php_js.errors.length : null;
  
    try {
      this.php_js.date_parse_state = true; // Allow strtotime to return a decimal (which it normally does not)
      ts = this.strtotime(date);
      this.php_js.date_parse_state = false;
    } finally {
      if (!ts) {
        return false;
      }
    }
  
    var dt = new Date(ts * 1000);
  
    var retObj = { // Grab any new warnings or errors added (not implemented yet in strtotime()); throwing warnings, notices, or errors could also be easily monitored by using 'watch' on this.php_js.latestWarning, etc. and/or calling any defined error handlers
      warning_count: warningsOffset !== null ? this.php_js.warnings.slice(warningsOffset)
        .length : 0,
      warnings: warningsOffset !== null ? this.php_js.warnings.slice(warningsOffset) : [],
      error_count: errorsOffset !== null ? this.php_js.errors.slice(errorsOffset)
        .length : 0,
      errors: errorsOffset !== null ? this.php_js.errors.slice(errorsOffset) : []
    };
    retObj.year = dt.getFullYear();
    retObj.month = dt.getMonth() + 1;
    retObj.day = dt.getDate();
    retObj.hour = dt.getHours();
    retObj.minute = dt.getMinutes();
    retObj.second = dt.getSeconds();
    retObj.fraction = parseFloat('0.' + dt.getMilliseconds());
    retObj.is_localtime = dt.getTimezoneOffset() !== 0;
  
    return retObj;
};

exports.gmdate = function (format, timestamp) {
  var dt = typeof timestamp === 'undefined' ? new Date() : // Not provided
    typeof timestamp === 'object' ? new Date(timestamp) : // Javascript Date()
    new Date(timestamp * 1000); // UNIX timestamp (auto-convert to int)
    timestamp = Date.parse(dt.toUTCString()
      .slice(0, -4)) / 1000;
    return this.date(format, timestamp);
};

exports.pathinfo = function (path, options) {
  var opt = '',
      optName = '',
      optTemp = 0,
      tmp_arr = {},
      cnt = 0,
      i = 0;
    var have_basename = false,
      have_extension = false,
      have_filename = false;
  
    // Input defaulting & sanitation
    if (!path) {
      return false;
    }
    if (!options) {
      options = 'PATHINFO_ALL';
    }
  
    // Initialize binary arguments. Both the string & integer (constant) input is
    // allowed
    var OPTS = {
      'PATHINFO_DIRNAME': 1,
      'PATHINFO_BASENAME': 2,
      'PATHINFO_EXTENSION': 4,
      'PATHINFO_FILENAME': 8,
      'PATHINFO_ALL': 0
    };
    // PATHINFO_ALL sums up all previously defined PATHINFOs (could just pre-calculate)
    for (optName in OPTS) {
      OPTS.PATHINFO_ALL = OPTS.PATHINFO_ALL | OPTS[optName];
    }
    if (typeof options !== 'number') { // Allow for a single string or an array of string flags
      options = [].concat(options);
      for (i = 0; i < options.length; i++) {
        // Resolve string input to bitwise e.g. 'PATHINFO_EXTENSION' becomes 4
        if (OPTS[options[i]]) {
          optTemp = optTemp | OPTS[options[i]];
        }
      }
      options = optTemp;
    }
  
    // Internal Functions
    var __getExt = function(path) {
      var str = path + '';
      var dotP = str.lastIndexOf('.') + 1;
      return !dotP ? false : dotP !== str.length ? str.substr(dotP) : '';
    };
  
    // Gather path infos
    if (options & OPTS.PATHINFO_DIRNAME) {
      var dirName = path.replace(/\\/g, '/')
        .replace(/\/[^\/]*\/?$/, ''); // dirname
      tmp_arr.dirname = dirName === path ? '.' : dirName;
    }
  
    if (options & OPTS.PATHINFO_BASENAME) {
      if (false === have_basename) {
        have_basename = this.basename(path);
      }
      tmp_arr.basename = have_basename;
    }
  
    if (options & OPTS.PATHINFO_EXTENSION) {
      if (false === have_basename) {
        have_basename = this.basename(path);
      }
      if (false === have_extension) {
        have_extension = __getExt(have_basename);
      }
      if (false !== have_extension) {
        tmp_arr.extension = have_extension;
      }
    }
  
    if (options & OPTS.PATHINFO_FILENAME) {
      if (false === have_basename) {
        have_basename = this.basename(path);
      }
      if (false === have_extension) {
        have_extension = __getExt(have_basename);
      }
      if (false === have_filename) {
        have_filename = have_basename.slice(0, have_basename.length - (have_extension ? have_extension.length + 1 :
          have_extension === false ? 0 : 1));
      }
  
      tmp_arr.filename = have_filename;
    }
  
    // If array contains only 1 element: return string
    cnt = 0;
    for (opt in tmp_arr) {
      cnt++;
    }
    if (cnt == 1) {
      return tmp_arr[opt];
    }
  
    // Return full-blown array
    return tmp_arr;
};

exports.i18n_loc_get_default = function () {
  try {
      this.php_js = this.php_js || {};
    } catch (e) {
      this.php_js = {};
    }
  
    // Ensure defaults are set up
    return this.php_js.i18nLocale || (i18n_loc_set_default('en_US_POSIX'), 'en_US_POSIX');
};

exports.setcookie = function (name, value, expires, path, domain, secure) {
  return this.setrawcookie(name, encodeURIComponent(value), expires, path, domain, secure);
};

exports.chop = function (str, charlist) {
  return this.rtrim(str, charlist);
};

exports.convert_uuencode = function (str) {
  var chr = function(c) {
      return String.fromCharCode(c);
    };
  
    if (!str || str === '') {
      return chr(0);
    } else if (!this.is_scalar(str)) {
      return false;
    }
  
    var c = 0,
      u = 0,
      i = 0,
      a = 0;
    var encoded = '',
      tmp1 = '',
      tmp2 = '',
      bytes = {};
  
    // divide string into chunks of 45 characters
    var chunk = function() {
      bytes = str.substr(u, 45);
      for (i in bytes) {
        bytes[i] = bytes[i].charCodeAt(0);
      }
      if (bytes.length != 0) {
        return bytes.length;
      } else {
        return 0;
      }
    };
  
    while (chunk() !== 0) {
      c = chunk();
      u += 45;
  
      // New line encoded data starts with number of bytes encoded.
      encoded += chr(c + 32);
  
      // Convert each char in bytes[] to a byte
      for (i in bytes) {
        tmp1 = bytes[i].charCodeAt(0)
          .toString(2);
        while (tmp1.length < 8) {
          tmp1 = '0' + tmp1;
        }
        tmp2 += tmp1;
      }
  
      while (tmp2.length % 6) {
        tmp2 = tmp2 + '0';
      }
  
      for (i = 0; i <= (tmp2.length / 6) - 1; i++) {
        tmp1 = tmp2.substr(a, 6);
        if (tmp1 == '000000') {
          encoded += chr(96);
        } else {
          encoded += chr(parseInt(tmp1, 2) + 32);
        }
        a += 6;
      }
      a = 0;
      tmp2 = '';
      encoded += '\n';
    }
  
    // Add termination characters
    encoded += chr(96) + '\n';
  
    return encoded;
};

exports.crc32 = function (str) {
  str = this.utf8_encode(str);
    var table =
      '00000000 77073096 EE0E612C 990951BA 076DC419 706AF48F E963A535 9E6495A3 0EDB8832 79DCB8A4 E0D5E91E 97D2D988 09B64C2B 7EB17CBD E7B82D07 90BF1D91 1DB71064 6AB020F2 F3B97148 84BE41DE 1ADAD47D 6DDDE4EB F4D4B551 83D385C7 136C9856 646BA8C0 FD62F97A 8A65C9EC 14015C4F 63066CD9 FA0F3D63 8D080DF5 3B6E20C8 4C69105E D56041E4 A2677172 3C03E4D1 4B04D447 D20D85FD A50AB56B 35B5A8FA 42B2986C DBBBC9D6 ACBCF940 32D86CE3 45DF5C75 DCD60DCF ABD13D59 26D930AC 51DE003A C8D75180 BFD06116 21B4F4B5 56B3C423 CFBA9599 B8BDA50F 2802B89E 5F058808 C60CD9B2 B10BE924 2F6F7C87 58684C11 C1611DAB B6662D3D 76DC4190 01DB7106 98D220BC EFD5102A 71B18589 06B6B51F 9FBFE4A5 E8B8D433 7807C9A2 0F00F934 9609A88E E10E9818 7F6A0DBB 086D3D2D 91646C97 E6635C01 6B6B51F4 1C6C6162 856530D8 F262004E 6C0695ED 1B01A57B 8208F4C1 F50FC457 65B0D9C6 12B7E950 8BBEB8EA FCB9887C 62DD1DDF 15DA2D49 8CD37CF3 FBD44C65 4DB26158 3AB551CE A3BC0074 D4BB30E2 4ADFA541 3DD895D7 A4D1C46D D3D6F4FB 4369E96A 346ED9FC AD678846 DA60B8D0 44042D73 33031DE5 AA0A4C5F DD0D7CC9 5005713C 270241AA BE0B1010 C90C2086 5768B525 206F85B3 B966D409 CE61E49F 5EDEF90E 29D9C998 B0D09822 C7D7A8B4 59B33D17 2EB40D81 B7BD5C3B C0BA6CAD EDB88320 9ABFB3B6 03B6E20C 74B1D29A EAD54739 9DD277AF 04DB2615 73DC1683 E3630B12 94643B84 0D6D6A3E 7A6A5AA8 E40ECF0B 9309FF9D 0A00AE27 7D079EB1 F00F9344 8708A3D2 1E01F268 6906C2FE F762575D 806567CB 196C3671 6E6B06E7 FED41B76 89D32BE0 10DA7A5A 67DD4ACC F9B9DF6F 8EBEEFF9 17B7BE43 60B08ED5 D6D6A3E8 A1D1937E 38D8C2C4 4FDFF252 D1BB67F1 A6BC5767 3FB506DD 48B2364B D80D2BDA AF0A1B4C 36034AF6 41047A60 DF60EFC3 A867DF55 316E8EEF 4669BE79 CB61B38C BC66831A 256FD2A0 5268E236 CC0C7795 BB0B4703 220216B9 5505262F C5BA3BBE B2BD0B28 2BB45A92 5CB36A04 C2D7FFA7 B5D0CF31 2CD99E8B 5BDEAE1D 9B64C2B0 EC63F226 756AA39C 026D930A 9C0906A9 EB0E363F 72076785 05005713 95BF4A82 E2B87A14 7BB12BAE 0CB61B38 92D28E9B E5D5BE0D 7CDCEFB7 0BDBDF21 86D3D2D4 F1D4E242 68DDB3F8 1FDA836E 81BE16CD F6B9265B 6FB077E1 18B74777 88085AE6 FF0F6A70 66063BCA 11010B5C 8F659EFF F862AE69 616BFFD3 166CCF45 A00AE278 D70DD2EE 4E048354 3903B3C2 A7672661 D06016F7 4969474D 3E6E77DB AED16A4A D9D65ADC 40DF0B66 37D83BF0 A9BCAE53 DEBB9EC5 47B2CF7F 30B5FFE9 BDBDF21C CABAC28A 53B39330 24B4A3A6 BAD03605 CDD70693 54DE5729 23D967BF B3667A2E C4614AB8 5D681B02 2A6F2B94 B40BBE37 C30C8EA1 5A05DF1B 2D02EF8D';
  
    var crc = 0;
    var x = 0;
    var y = 0;
  
    crc = crc ^ (-1);
    for (var i = 0, iTop = str.length; i < iTop; i++) {
      y = (crc ^ str.charCodeAt(i)) & 0xFF;
      x = '0x' + table.substr(y * 9, 8);
      crc = (crc >>> 8) ^ x;
    }
  
    return crc ^ (-1);
};

exports.html_entity_decode = function (string, quote_style) {
  var hash_map = {},
      symbol = '',
      tmp_str = '',
      entity = '';
    tmp_str = string.toString();
  
    if (false === (hash_map = this.get_html_translation_table('HTML_ENTITIES', quote_style))) {
      return false;
    }
  
    // fix &amp; problem
    // http://phpjs.org/functions/get_html_translation_table:416#comment_97660
    delete(hash_map['&']);
    hash_map['&'] = '&amp;';
  
    for (symbol in hash_map) {
      entity = hash_map[symbol];
      tmp_str = tmp_str.split(entity)
        .join(symbol);
    }
    tmp_str = tmp_str.split('&#039;')
      .join("'");
  
    return tmp_str;
};

exports.htmlentities = function (string, quote_style, charset, double_encode) {
  var hash_map = this.get_html_translation_table('HTML_ENTITIES', quote_style),
      symbol = '';
    string = string == null ? '' : string + '';
  
    if (!hash_map) {
      return false;
    }
  
    if (quote_style && quote_style === 'ENT_QUOTES') {
      hash_map["'"] = '&#039;';
    }
  
    if ( !! double_encode || double_encode == null) {
      for (symbol in hash_map) {
        if (hash_map.hasOwnProperty(symbol)) {
          string = string.split(symbol)
            .join(hash_map[symbol]);
        }
      }
    } else {
      string = string.replace(/([\s\S]*?)(&(?:#\d+|#x[\da-f]+|[a-zA-Z][\da-z]*);|$)/g, function(ignore, text, entity) {
        for (symbol in hash_map) {
          if (hash_map.hasOwnProperty(symbol)) {
            text = text.split(symbol)
              .join(hash_map[symbol]);
          }
        }
  
        return text + entity;
      });
    }
  
    return string;
};

exports.join = function (glue, pieces) {
  return this.implode(glue, pieces);
};

exports.md5 = function (str) {
  var xl;
  
    var rotateLeft = function(lValue, iShiftBits) {
      return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    };
  
    var addUnsigned = function(lX, lY) {
      var lX4, lY4, lX8, lY8, lResult;
      lX8 = (lX & 0x80000000);
      lY8 = (lY & 0x80000000);
      lX4 = (lX & 0x40000000);
      lY4 = (lY & 0x40000000);
      lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
      if (lX4 & lY4) {
        return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
      }
      if (lX4 | lY4) {
        if (lResult & 0x40000000) {
          return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
        } else {
          return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
        }
      } else {
        return (lResult ^ lX8 ^ lY8);
      }
    };
  
    var _F = function(x, y, z) {
      return (x & y) | ((~x) & z);
    };
    var _G = function(x, y, z) {
      return (x & z) | (y & (~z));
    };
    var _H = function(x, y, z) {
      return (x ^ y ^ z);
    };
    var _I = function(x, y, z) {
      return (y ^ (x | (~z)));
    };
  
    var _FF = function(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_F(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };
  
    var _GG = function(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_G(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };
  
    var _HH = function(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_H(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };
  
    var _II = function(a, b, c, d, x, s, ac) {
      a = addUnsigned(a, addUnsigned(addUnsigned(_I(b, c, d), x), ac));
      return addUnsigned(rotateLeft(a, s), b);
    };
  
    var convertToWordArray = function(str) {
      var lWordCount;
      var lMessageLength = str.length;
      var lNumberOfWords_temp1 = lMessageLength + 8;
      var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
      var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
      var lWordArray = new Array(lNumberOfWords - 1);
      var lBytePosition = 0;
      var lByteCount = 0;
      while (lByteCount < lMessageLength) {
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = (lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition));
        lByteCount++;
      }
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
      lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
      lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
      return lWordArray;
    };
  
    var wordToHex = function(lValue) {
      var wordToHexValue = '',
        wordToHexValue_temp = '',
        lByte, lCount;
      for (lCount = 0; lCount <= 3; lCount++) {
        lByte = (lValue >>> (lCount * 8)) & 255;
        wordToHexValue_temp = '0' + lByte.toString(16);
        wordToHexValue = wordToHexValue + wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
      }
      return wordToHexValue;
    };
  
    var x = [],
      k, AA, BB, CC, DD, a, b, c, d, S11 = 7,
      S12 = 12,
      S13 = 17,
      S14 = 22,
      S21 = 5,
      S22 = 9,
      S23 = 14,
      S24 = 20,
      S31 = 4,
      S32 = 11,
      S33 = 16,
      S34 = 23,
      S41 = 6,
      S42 = 10,
      S43 = 15,
      S44 = 21;
  
    str = this.utf8_encode(str);
    x = convertToWordArray(str);
    a = 0x67452301;
    b = 0xEFCDAB89;
    c = 0x98BADCFE;
    d = 0x10325476;
  
    xl = x.length;
    for (k = 0; k < xl; k += 16) {
      AA = a;
      BB = b;
      CC = c;
      DD = d;
      a = _FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
      d = _FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
      c = _FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
      b = _FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
      a = _FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
      d = _FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
      c = _FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
      b = _FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
      a = _FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
      d = _FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
      c = _FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
      b = _FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
      a = _FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
      d = _FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
      c = _FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
      b = _FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
      a = _GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
      d = _GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
      c = _GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
      b = _GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
      a = _GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
      d = _GG(d, a, b, c, x[k + 10], S22, 0x2441453);
      c = _GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
      b = _GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
      a = _GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
      d = _GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
      c = _GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
      b = _GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
      a = _GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
      d = _GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
      c = _GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
      b = _GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
      a = _HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
      d = _HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
      c = _HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
      b = _HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
      a = _HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
      d = _HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
      c = _HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
      b = _HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
      a = _HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
      d = _HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
      c = _HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
      b = _HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
      a = _HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
      d = _HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
      c = _HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
      b = _HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
      a = _II(a, b, c, d, x[k + 0], S41, 0xF4292244);
      d = _II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
      c = _II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
      b = _II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
      a = _II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
      d = _II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
      c = _II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
      b = _II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
      a = _II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
      d = _II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
      c = _II(c, d, a, b, x[k + 6], S43, 0xA3014314);
      b = _II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
      a = _II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
      d = _II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
      c = _II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
      b = _II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
      a = addUnsigned(a, AA);
      b = addUnsigned(b, BB);
      c = addUnsigned(c, CC);
      d = addUnsigned(d, DD);
    }
  
    var temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
  
    return temp.toLowerCase();
};

exports.md5_file = function (str_filename) {
  var buf = '';
  
    buf = this.file_get_contents(str_filename);
  
    if (!buf) {
      return false;
    }
  
    return this.md5(buf);
};

exports.printf = function () {
  var body, elmt, d = this.window.document;
    var ret = '';
  
    var HTMLNS = 'http://www.w3.org/1999/xhtml';
    body = d.getElementsByTagNameNS ? (d.getElementsByTagNameNS(HTMLNS, 'body')[0] ? d.getElementsByTagNameNS(HTMLNS,
      'body')[0] : d.documentElement.lastChild) : d.getElementsByTagName('body')[0];
  
    if (!body) {
      return false;
    }
  
    ret = this.sprintf.apply(this, arguments);
  
    elmt = d.createTextNode(ret);
    body.appendChild(elmt);
  
    return ret.length;
};

exports.setlocale = function (category, locale) {
  var categ = '',
      cats = [],
      i = 0,
      d = this.window.document;
  
    // BEGIN STATIC
    var _copy = function _copy(orig) {
      if (orig instanceof RegExp) {
        return new RegExp(orig);
      } else if (orig instanceof Date) {
        return new Date(orig);
      }
      var newObj = {};
      for (var i in orig) {
        if (typeof orig[i] === 'object') {
          newObj[i] = _copy(orig[i]);
        } else {
          newObj[i] = orig[i];
        }
      }
      return newObj;
    };
  
    // Function usable by a ngettext implementation (apparently not an accessible part of setlocale(), but locale-specific)
    // See http://www.gnu.org/software/gettext/manual/gettext.html#Plural-forms though amended with others from
    // https://developer.mozilla.org/En/Localization_and_Plurals (new categories noted with "MDC" below, though
    // not sure of whether there is a convention for the relative order of these newer groups as far as ngettext)
    // The function name indicates the number of plural forms (nplural)
    // Need to look into http://cldr.unicode.org/ (maybe future JavaScript); Dojo has some functions (under new BSD),
    // including JSON conversions of LDML XML from CLDR: http://bugs.dojotoolkit.org/browser/dojo/trunk/cldr
    // and docs at http://api.dojotoolkit.org/jsdoc/HEAD/dojo.cldr
    var _nplurals1 = function(n) { // e.g., Japanese
      return 0;
    };
    var _nplurals2a = function(n) { // e.g., English
      return n !== 1 ? 1 : 0;
    };
    var _nplurals2b = function(n) { // e.g., French
      return n > 1 ? 1 : 0;
    };
    var _nplurals2c = function(n) { // e.g., Icelandic (MDC)
      return n % 10 === 1 && n % 100 !== 11 ? 0 : 1;
    };
    var _nplurals3a = function(n) { // e.g., Latvian (MDC has a different order from gettext)
      return n % 10 === 1 && n % 100 !== 11 ? 0 : n !== 0 ? 1 : 2;
    };
    var _nplurals3b = function(n) { // e.g., Scottish Gaelic
      return n === 1 ? 0 : n === 2 ? 1 : 2;
    };
    var _nplurals3c = function(n) { // e.g., Romanian
      return n === 1 ? 0 : (n === 0 || (n % 100 > 0 && n % 100 < 20)) ? 1 : 2;
    };
    var _nplurals3d = function(n) { // e.g., Lithuanian (MDC has a different order from gettext)
      return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    };
    var _nplurals3e = function(n) { // e.g., Croatian
      return n % 10 === 1 && n % 100 !== 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 :
        2;
    };
    var _nplurals3f = function(n) { // e.g., Slovak
      return n === 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2;
    };
    var _nplurals3g = function(n) { // e.g., Polish
      return n === 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    };
    var _nplurals3h = function(n) { // e.g., Macedonian (MDC)
      return n % 10 === 1 ? 0 : n % 10 === 2 ? 1 : 2;
    };
    var _nplurals4a = function(n) { // e.g., Slovenian
      return n % 100 === 1 ? 0 : n % 100 === 2 ? 1 : n % 100 === 3 || n % 100 === 4 ? 2 : 3;
    };
    var _nplurals4b = function(n) { // e.g., Maltese (MDC)
      return n === 1 ? 0 : n === 0 || (n % 100 && n % 100 <= 10) ? 1 : n % 100 >= 11 && n % 100 <= 19 ? 2 : 3;
    };
    var _nplurals5 = function(n) { // e.g., Irish Gaeilge (MDC)
      return n === 1 ? 0 : n === 2 ? 1 : n >= 3 && n <= 6 ? 2 : n >= 7 && n <= 10 ? 3 : 4;
    };
    var _nplurals6 = function(n) { // e.g., Arabic (MDC) - Per MDC puts 0 as last group
      return n === 0 ? 5 : n === 1 ? 0 : n === 2 ? 1 : n % 100 >= 3 && n % 100 <= 10 ? 2 : n % 100 >= 11 && n % 100 <=
        99 ? 3 : 4;
    };
    // END STATIC
    // BEGIN REDUNDANT
    try {
      this.php_js = this.php_js || {};
    } catch (e) {
      this.php_js = {};
    }
  
    var phpjs = this.php_js;
  
    // Reconcile Windows vs. *nix locale names?
    // Allow different priority orders of languages, esp. if implement gettext as in
    //     LANGUAGE env. var.? (e.g., show German if French is not available)
    if (!phpjs.locales) {
      // Can add to the locales
      phpjs.locales = {};
  
      phpjs.locales.en = {
        'LC_COLLATE': // For strcoll
  
        function(str1, str2) { // Fix: This one taken from strcmp, but need for other locales; we don't use localeCompare since its locale is not settable
          return (str1 == str2) ? 0 : ((str1 > str2) ? 1 : -1);
        },
        'LC_CTYPE': { // Need to change any of these for English as opposed to C?
          an: /^[A-Za-z\d]+$/g,
          al: /^[A-Za-z]+$/g,
          ct: /^[\u0000-\u001F\u007F]+$/g,
          dg: /^[\d]+$/g,
          gr: /^[\u0021-\u007E]+$/g,
          lw: /^[a-z]+$/g,
          pr: /^[\u0020-\u007E]+$/g,
          pu: /^[\u0021-\u002F\u003A-\u0040\u005B-\u0060\u007B-\u007E]+$/g,
          sp: /^[\f\n\r\t\v ]+$/g,
          up: /^[A-Z]+$/g,
          xd: /^[A-Fa-f\d]+$/g,
          CODESET: 'UTF-8',
          // Used by sql_regcase
          lower: 'abcdefghijklmnopqrstuvwxyz',
          upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        },
        'LC_TIME': { // Comments include nl_langinfo() constant equivalents and any changes from Blues' implementation
          a: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
          // ABDAY_
          A: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          // DAY_
          b: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          // ABMON_
          B: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October',
            'November', 'December'
          ],
          // MON_
          c: '%a %d %b %Y %r %Z',
          // D_T_FMT // changed %T to %r per results
          p: ['AM', 'PM'],
          // AM_STR/PM_STR
          P: ['am', 'pm'],
          // Not available in nl_langinfo()
          r: '%I:%M:%S %p',
          // T_FMT_AMPM (Fixed for all locales)
          x: '%m/%d/%Y',
          // D_FMT // switched order of %m and %d; changed %y to %Y (C uses %y)
          X: '%r',
          // T_FMT // changed from %T to %r  (%T is default for C, not English US)
          // Following are from nl_langinfo() or http://www.cptec.inpe.br/sx4/sx4man2/g1ab02e/strftime.4.html
          alt_digits: '',
          // e.g., ordinal
          ERA: '',
          ERA_YEAR: '',
          ERA_D_T_FMT: '',
          ERA_D_FMT: '',
          ERA_T_FMT: ''
        },
        // Assuming distinction between numeric and monetary is thus:
        // See below for C locale
        'LC_MONETARY': { // original by Windows "english" (English_United States.1252) locale
          int_curr_symbol: 'USD',
          currency_symbol: '$',
          mon_decimal_point: '.',
          mon_thousands_sep: ',',
          mon_grouping: [3],
          // use mon_thousands_sep; "" for no grouping; additional array members indicate successive group lengths after first group (e.g., if to be 1,23,456, could be [3, 2])
          positive_sign: '',
          negative_sign: '-',
          int_frac_digits: 2,
          // Fractional digits only for money defaults?
          frac_digits: 2,
          p_cs_precedes: 1,
          // positive currency symbol follows value = 0; precedes value = 1
          p_sep_by_space: 0,
          // 0: no space between curr. symbol and value; 1: space sep. them unless symb. and sign are adjacent then space sep. them from value; 2: space sep. sign and value unless symb. and sign are adjacent then space separates
          n_cs_precedes: 1,
          // see p_cs_precedes
          n_sep_by_space: 0,
          // see p_sep_by_space
          p_sign_posn: 3,
          // 0: parentheses surround quantity and curr. symbol; 1: sign precedes them; 2: sign follows them; 3: sign immed. precedes curr. symbol; 4: sign immed. succeeds curr. symbol
          n_sign_posn: 0 // see p_sign_posn
        },
        'LC_NUMERIC': { // original by Windows "english" (English_United States.1252) locale
          decimal_point: '.',
          thousands_sep: ',',
          grouping: [3] // see mon_grouping, but for non-monetary values (use thousands_sep)
        },
        'LC_MESSAGES': {
          YESEXPR: '^[yY].*',
          NOEXPR: '^[nN].*',
          YESSTR: '',
          NOSTR: ''
        },
        nplurals: _nplurals2a
      };
      phpjs.locales.en_US = _copy(phpjs.locales.en);
      phpjs.locales.en_US.LC_TIME.c = '%a %d %b %Y %r %Z';
      phpjs.locales.en_US.LC_TIME.x = '%D';
      phpjs.locales.en_US.LC_TIME.X = '%r';
      // The following are original by *nix settings
      phpjs.locales.en_US.LC_MONETARY.int_curr_symbol = 'USD ';
      phpjs.locales.en_US.LC_MONETARY.p_sign_posn = 1;
      phpjs.locales.en_US.LC_MONETARY.n_sign_posn = 1;
      phpjs.locales.en_US.LC_MONETARY.mon_grouping = [3, 3];
      phpjs.locales.en_US.LC_NUMERIC.thousands_sep = '';
      phpjs.locales.en_US.LC_NUMERIC.grouping = [];
  
      phpjs.locales.en_GB = _copy(phpjs.locales.en);
      phpjs.locales.en_GB.LC_TIME.r = '%l:%M:%S %P %Z';
  
      phpjs.locales.en_AU = _copy(phpjs.locales.en_GB);
      phpjs.locales.C = _copy(phpjs.locales.en); // Assume C locale is like English (?) (We need C locale for LC_CTYPE)
      phpjs.locales.C.LC_CTYPE.CODESET = 'ANSI_X3.4-1968';
      phpjs.locales.C.LC_MONETARY = {
        int_curr_symbol: '',
        currency_symbol: '',
        mon_decimal_point: '',
        mon_thousands_sep: '',
        mon_grouping: [],
        p_cs_precedes: 127,
        p_sep_by_space: 127,
        n_cs_precedes: 127,
        n_sep_by_space: 127,
        p_sign_posn: 127,
        n_sign_posn: 127,
        positive_sign: '',
        negative_sign: '',
        int_frac_digits: 127,
        frac_digits: 127
      };
      phpjs.locales.C.LC_NUMERIC = {
        decimal_point: '.',
        thousands_sep: '',
        grouping: []
      };
      phpjs.locales.C.LC_TIME.c = '%a %b %e %H:%M:%S %Y'; // D_T_FMT
      phpjs.locales.C.LC_TIME.x = '%m/%d/%y'; // D_FMT
      phpjs.locales.C.LC_TIME.X = '%H:%M:%S'; // T_FMT
      phpjs.locales.C.LC_MESSAGES.YESEXPR = '^[yY]';
      phpjs.locales.C.LC_MESSAGES.NOEXPR = '^[nN]';
  
      phpjs.locales.fr = _copy(phpjs.locales.en);
      phpjs.locales.fr.nplurals = _nplurals2b;
      phpjs.locales.fr.LC_TIME.a = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];
      phpjs.locales.fr.LC_TIME.A = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      phpjs.locales.fr.LC_TIME.b = ['jan', 'f\u00E9v', 'mar', 'avr', 'mai', 'jun', 'jui', 'ao\u00FB', 'sep', 'oct',
        'nov', 'd\u00E9c'
      ];
      phpjs.locales.fr.LC_TIME.B = ['janvier', 'f\u00E9vrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'ao\u00FBt',
        'septembre', 'octobre', 'novembre', 'd\u00E9cembre'
      ];
      phpjs.locales.fr.LC_TIME.c = '%a %d %b %Y %T %Z';
      phpjs.locales.fr.LC_TIME.p = ['', ''];
      phpjs.locales.fr.LC_TIME.P = ['', ''];
      phpjs.locales.fr.LC_TIME.x = '%d.%m.%Y';
      phpjs.locales.fr.LC_TIME.X = '%T';
  
      phpjs.locales.fr_CA = _copy(phpjs.locales.fr);
      phpjs.locales.fr_CA.LC_TIME.x = '%Y-%m-%d';
    }
    if (!phpjs.locale) {
      phpjs.locale = 'en_US';
      var NS_XHTML = 'http://www.w3.org/1999/xhtml';
      var NS_XML = 'http://www.w3.org/XML/1998/namespace';
      if (d.getElementsByTagNameNS && d.getElementsByTagNameNS(NS_XHTML, 'html')[0]) {
        if (d.getElementsByTagNameNS(NS_XHTML, 'html')[0].getAttributeNS && d.getElementsByTagNameNS(NS_XHTML,
          'html')[0].getAttributeNS(NS_XML, 'lang')) {
          phpjs.locale = d.getElementsByTagName(NS_XHTML, 'html')[0].getAttributeNS(NS_XML, 'lang');
        } else if (d.getElementsByTagNameNS(NS_XHTML, 'html')[0].lang) { // XHTML 1.0 only
          phpjs.locale = d.getElementsByTagNameNS(NS_XHTML, 'html')[0].lang;
        }
      } else if (d.getElementsByTagName('html')[0] && d.getElementsByTagName('html')[0].lang) {
        phpjs.locale = d.getElementsByTagName('html')[0].lang;
      }
    }
    phpjs.locale = phpjs.locale.replace('-', '_'); // PHP-style
    // Fix locale if declared locale hasn't been defined
    if (!(phpjs.locale in phpjs.locales)) {
      if (phpjs.locale.replace(/_[a-zA-Z]+$/, '') in phpjs.locales) {
        phpjs.locale = phpjs.locale.replace(/_[a-zA-Z]+$/, '');
      }
    }
  
    if (!phpjs.localeCategories) {
      phpjs.localeCategories = {
        'LC_COLLATE': phpjs.locale,
        // for string comparison, see strcoll()
        'LC_CTYPE': phpjs.locale,
        // for character classification and conversion, for example strtoupper()
        'LC_MONETARY': phpjs.locale,
        // for localeconv()
        'LC_NUMERIC': phpjs.locale,
        // for decimal separator (See also localeconv())
        'LC_TIME': phpjs.locale,
        // for date and time formatting with strftime()
        'LC_MESSAGES': phpjs.locale // for system responses (available if PHP was compiled with libintl)
      };
    }
    // END REDUNDANT
    if (locale === null || locale === '') {
      locale = this.getenv(category) || this.getenv('LANG');
    } else if (Object.prototype.toString.call(locale) === '[object Array]') {
      for (i = 0; i < locale.length; i++) {
        if (!(locale[i] in this.php_js.locales)) {
          if (i === locale.length - 1) {
            return false; // none found
          }
          continue;
        }
        locale = locale[i];
        break;
      }
    }
  
    // Just get the locale
    if (locale === '0' || locale === 0) {
      if (category === 'LC_ALL') {
        for (categ in this.php_js.localeCategories) {
          cats.push(categ + '=' + this.php_js.localeCategories[categ]); // Add ".UTF-8" or allow ".@latint", etc. to the end?
        }
        return cats.join(';');
      }
      return this.php_js.localeCategories[category];
    }
  
    if (!(locale in this.php_js.locales)) {
      return false; // Locale not found
    }
  
    // Set and get locale
    if (category === 'LC_ALL') {
      for (categ in this.php_js.localeCategories) {
        this.php_js.localeCategories[categ] = locale;
      }
    } else {
      this.php_js.localeCategories[category] = locale;
    }
    return locale;
};

exports.sha1 = function (str) {
  var rotate_left = function(n, s) {
      var t4 = (n << s) | (n >>> (32 - s));
      return t4;
    };
  
    /*var lsb_hex = function (val) { // Not in use; needed?
      var str="";
      var i;
      var vh;
      var vl;
  
      for ( i=0; i<=6; i+=2 ) {
        vh = (val>>>(i*4+4))&0x0f;
        vl = (val>>>(i*4))&0x0f;
        str += vh.toString(16) + vl.toString(16);
      }
      return str;
    };*/
  
    var cvt_hex = function(val) {
      var str = '';
      var i;
      var v;
  
      for (i = 7; i >= 0; i--) {
        v = (val >>> (i * 4)) & 0x0f;
        str += v.toString(16);
      }
      return str;
    };
  
    var blockstart;
    var i, j;
    var W = new Array(80);
    var H0 = 0x67452301;
    var H1 = 0xEFCDAB89;
    var H2 = 0x98BADCFE;
    var H3 = 0x10325476;
    var H4 = 0xC3D2E1F0;
    var A, B, C, D, E;
    var temp;
  
    str = this.utf8_encode(str);
    var str_len = str.length;
  
    var word_array = [];
    for (i = 0; i < str_len - 3; i += 4) {
      j = str.charCodeAt(i) << 24 | str.charCodeAt(i + 1) << 16 | str.charCodeAt(i + 2) << 8 | str.charCodeAt(i + 3);
      word_array.push(j);
    }
  
    switch (str_len % 4) {
      case 0:
        i = 0x080000000;
        break;
      case 1:
        i = str.charCodeAt(str_len - 1) << 24 | 0x0800000;
        break;
      case 2:
        i = str.charCodeAt(str_len - 2) << 24 | str.charCodeAt(str_len - 1) << 16 | 0x08000;
        break;
      case 3:
        i = str.charCodeAt(str_len - 3) << 24 | str.charCodeAt(str_len - 2) << 16 | str.charCodeAt(str_len - 1) <<
          8 | 0x80;
        break;
    }
  
    word_array.push(i);
  
    while ((word_array.length % 16) != 14) {
      word_array.push(0);
    }
  
    word_array.push(str_len >>> 29);
    word_array.push((str_len << 3) & 0x0ffffffff);
  
    for (blockstart = 0; blockstart < word_array.length; blockstart += 16) {
      for (i = 0; i < 16; i++) {
        W[i] = word_array[blockstart + i];
      }
      for (i = 16; i <= 79; i++) {
        W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);
      }
  
      A = H0;
      B = H1;
      C = H2;
      D = H3;
      E = H4;
  
      for (i = 0; i <= 19; i++) {
        temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
        E = D;
        D = C;
        C = rotate_left(B, 30);
        B = A;
        A = temp;
      }
  
      for (i = 20; i <= 39; i++) {
        temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
        E = D;
        D = C;
        C = rotate_left(B, 30);
        B = A;
        A = temp;
      }
  
      for (i = 40; i <= 59; i++) {
        temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
        E = D;
        D = C;
        C = rotate_left(B, 30);
        B = A;
        A = temp;
      }
  
      for (i = 60; i <= 79; i++) {
        temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
        E = D;
        D = C;
        C = rotate_left(B, 30);
        B = A;
        A = temp;
      }
  
      H0 = (H0 + A) & 0x0ffffffff;
      H1 = (H1 + B) & 0x0ffffffff;
      H2 = (H2 + C) & 0x0ffffffff;
      H3 = (H3 + D) & 0x0ffffffff;
      H4 = (H4 + E) & 0x0ffffffff;
    }
  
    temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);
    return temp.toLowerCase();
};

exports.sha1_file = function (str_filename) {
  var buf = this.file_get_contents(str_filename);
  
    return this.sha1(buf);
};

exports.split = function (delimiter, string) {
  return this.explode(delimiter, string);
};

exports.strchr = function (haystack, needle, bool) {
  return this.strstr(haystack, needle, bool);
};

exports.strnatcmp = function (f_string1, f_string2, f_version) {
  var i = 0;
  
    if (f_version == undefined) {
      f_version = false;
    }
  
    var __strnatcmp_split = function(f_string) {
      var result = [];
      var buffer = '';
      var chr = '';
      var i = 0,
        f_stringl = 0;
  
      var text = true;
  
      f_stringl = f_string.length;
      for (i = 0; i < f_stringl; i++) {
        chr = f_string.substring(i, i + 1);
        if (chr.match(/\d/)) {
          if (text) {
            if (buffer.length > 0) {
              result[result.length] = buffer;
              buffer = '';
            }
  
            text = false;
          }
          buffer += chr;
        } else if ((text == false) && (chr === '.') && (i < (f_string.length - 1)) && (f_string.substring(i + 1, i +
            2)
          .match(/\d/))) {
          result[result.length] = buffer;
          buffer = '';
        } else {
          if (text == false) {
            if (buffer.length > 0) {
              result[result.length] = parseInt(buffer, 10);
              buffer = '';
            }
            text = true;
          }
          buffer += chr;
        }
      }
  
      if (buffer.length > 0) {
        if (text) {
          result[result.length] = buffer;
        } else {
          result[result.length] = parseInt(buffer, 10);
        }
      }
  
      return result;
    };
  
    var array1 = __strnatcmp_split(f_string1 + '');
    var array2 = __strnatcmp_split(f_string2 + '');
  
    var len = array1.length;
    var text = true;
  
    var result = -1;
    var r = 0;
  
    if (len > array2.length) {
      len = array2.length;
      result = 1;
    }
  
    for (i = 0; i < len; i++) {
      if (isNaN(array1[i])) {
        if (isNaN(array2[i])) {
          text = true;
  
          if ((r = this.strcmp(array1[i], array2[i])) != 0) {
            return r;
          }
        } else if (text) {
          return 1;
        } else {
          return -1;
        }
      } else if (isNaN(array2[i])) {
        if (text) {
          return -1;
        } else {
          return 1;
        }
      } else {
        if (text || f_version) {
          if ((r = (array1[i] - array2[i])) != 0) {
            return r;
          }
        } else {
          if ((r = this.strcmp(array1[i].toString(), array2[i].toString())) != 0) {
            return r;
          }
        }
  
        text = false;
      }
    }
  
    return result;
};

exports.vprintf = function (format, args) {
  var body, elmt;
    var ret = '',
      d = this.window.document;
  
    // .shift() does not work to get first item in bodies
    var HTMLNS = 'http://www.w3.org/1999/xhtml';
    body = d.getElementsByTagNameNS ? (d.getElementsByTagNameNS(HTMLNS, 'body')[0] ? d.getElementsByTagNameNS(HTMLNS,
      'body')[0] : d.documentElement.lastChild) : d.getElementsByTagName('body')[0];
  
    if (!body) {
      return false;
    }
  
    ret = this.sprintf.apply(this, [format].concat(args));
  
    elmt = d.createTextNode(ret);
    body.appendChild(elmt);
  
    return ret.length;
};

exports.vsprintf = function (format, args) {
  return this.sprintf.apply(this, [format].concat(args));
};

exports.get_headers = function (url, format) {
  var req = this.window.ActiveXObject ? new ActiveXObject('Microsoft.XMLHTTP') : new XMLHttpRequest();
  
    if (!req) {
      throw new Error('XMLHttpRequest not supported');
    }
    var tmp, headers, pair, i, j = 0;ß;
    req.open('HEAD', url, false);
    req.send(null);
  
    if (req.readyState < 3) {
      return false;
    }
  
    tmp = req.getAllResponseHeaders();
    tmp = tmp.split('\n');
    tmp = this.array_filter(tmp, function(value) {
      return value.substring(1) !== '';
    });
    headers = format ? {} : [];
  
    for (var i in tmp) {
      if (format) {
        pair = tmp[i].split(':');
        headers[pair.splice(0, 1)] = pair.join(':')
          .substring(1);
      } else {
        headers[j++] = tmp[i];
      }
    }
  
    return headers;
};

exports.get_meta_tags = function (file) {
  var fulltxt = '';
  
    if (false) {
      // Use this for testing instead of the line above:
      fulltxt = '<meta name="author" content="name">' + '<meta name="keywords" content="php documentation">' +
        '<meta name="DESCRIPTION" content="a php manual">' + '<meta name="geo.position" content="49.33;-86.59">' +
        '</head>';
    } else {
      fulltxt = this.file_get_contents(file)
        .match(/^[\s\S]*<\/head>/i); // We have to disallow some character, so we choose a Unicode non-character
    }
  
    var patt = /<meta[^>]*?>/gim;
    var patt1 = /<meta\s+.*?name\s*=\s*(['"]?)(.*?)\1\s+.*?content\s*=\s*(['"]?)(.*?)\3/gim;
    var patt2 = /<meta\s+.*?content\s*=\s*(['"?])(.*?)\1\s+.*?name\s*=\s*(['"]?)(.*?)\3/gim;
    var txt, match, name, arr = {};
  
    while ((txt = patt.exec(fulltxt)) !== null) {
      while ((match = patt1.exec(txt)) !== null) {
        name = match[2].replace(/\W/g, '_')
          .toLowerCase();
        arr[name] = match[4];
      }
      while ((match = patt2.exec(txt)) !== null) {
        name = match[4].replace(/\W/g, '_')
          .toLowerCase();
        arr[name] = match[2];
      }
    }
    return arr;
};

exports.http_build_query = function (formdata, numeric_prefix, arg_separator) {
  var value, key, tmp = [],
      that = this;
  
    var _http_build_query_helper = function(key, val, arg_separator) {
      var k, tmp = [];
      if (val === true) {
        val = '1';
      } else if (val === false) {
        val = '0';
      }
      if (val != null) {
        if (typeof val === 'object') {
          for (k in val) {
            if (val[k] != null) {
              tmp.push(_http_build_query_helper(key + '[' + k + ']', val[k], arg_separator));
            }
          }
          return tmp.join(arg_separator);
        } else if (typeof val !== 'function') {
          return that.urlencode(key) + '=' + that.urlencode(val);
        } else {
          throw new Error('There was an error processing for http_build_query().');
        }
      } else {
        return '';
      }
    };
  
    if (!arg_separator) {
      arg_separator = '&';
    }
    for (key in formdata) {
      value = formdata[key];
      if (numeric_prefix && !isNaN(key)) {
        key = String(numeric_prefix) + key;
      }
      var query = _http_build_query_helper(key, value, arg_separator);
      if (query !== '') {
        tmp.push(query);
      }
    }
  
    return tmp.join(arg_separator);
};

exports.doubleval = function (mixed_var) {
  return this.floatval(mixed_var);
};

exports.gettype = function (mixed_var) {
  var s = typeof mixed_var,
      name;
    var getFuncName = function(fn) {
      var name = (/\W*function\s+([\w\$]+)\s*\(/)
        .exec(fn);
      if (!name) {
        return '(Anonymous)';
      }
      return name[1];
    };
    if (s === 'object') {
      if (mixed_var !== null) { // From: http://javascript.crockford.com/remedial.html
        if (typeof mixed_var.length === 'number' && !(mixed_var.propertyIsEnumerable('length')) && typeof mixed_var
          .splice === 'function') {
          s = 'array';
        } else if (mixed_var.constructor && getFuncName(mixed_var.constructor)) {
          name = getFuncName(mixed_var.constructor);
          if (name === 'Date') {
            s = 'date'; // not in PHP
          } else if (name === 'RegExp') {
            s = 'regexp'; // not in PHP
          } else if (name === 'PHPJS_Resource') { // Check against our own resource constructor
            s = 'resource';
          }
        }
      } else {
        s = 'null';
      }
    } else if (s === 'number') {
      s = this.is_float(mixed_var) ? 'double' : 'integer';
    }
    return s;
};

exports.is_double = function (mixed_var) {
  return this.is_float(mixed_var);
};

exports.is_integer = function (mixed_var) {
  return this.is_int(mixed_var);
};

exports.is_long = function (mixed_var) {
  return this.is_float(mixed_var);
};

exports.is_real = function (mixed_var) {
  return this.is_float(mixed_var);
};

exports.print_r = function (array, return_val) {
  var output = '',
      pad_char = ' ',
      pad_val = 4,
      d = this.window.document,
      getFuncName = function(fn) {
        var name = (/\W*function\s+([\w\$]+)\s*\(/)
          .exec(fn);
        if (!name) {
          return '(Anonymous)';
        }
        return name[1];
      };
    repeat_char = function(len, pad_char) {
      var str = '';
      for (var i = 0; i < len; i++) {
        str += pad_char;
      }
      return str;
    };
    formatArray = function(obj, cur_depth, pad_val, pad_char) {
      if (cur_depth > 0) {
        cur_depth++;
      }
  
      var base_pad = repeat_char(pad_val * cur_depth, pad_char);
      var thick_pad = repeat_char(pad_val * (cur_depth + 1), pad_char);
      var str = '';
  
      if (typeof obj === 'object' && obj !== null && obj.constructor && getFuncName(obj.constructor) !==
        'PHPJS_Resource') {
        str += 'Array\n' + base_pad + '(\n';
        for (var key in obj) {
          if (Object.prototype.toString.call(obj[key]) === '[object Array]') {
            str += thick_pad + '[' + key + '] => ' + formatArray(obj[key], cur_depth + 1, pad_val, pad_char);
          } else {
            str += thick_pad + '[' + key + '] => ' + obj[key] + '\n';
          }
        }
        str += base_pad + ')\n';
      } else if (obj === null || obj === undefined) {
        str = '';
      } else { // for our "resource" class
        str = obj.toString();
      }
  
      return str;
    };
  
    output = formatArray(array, 0, pad_val, pad_char);
  
    if (return_val !== true) {
      if (d.body) {
        this.echo(output);
      } else {
        try {
          d = XULDocument; // We're in XUL, so appending as plain text won't work; trigger an error out of XUL
          this.echo('<pre xmlns="http://www.w3.org/1999/xhtml" style="white-space:pre;">' + output + '</pre>');
        } catch (e) {
          this.echo(output); // Outputting as plain text may work in some plain XML
        }
      }
      return true;
    }
    return output;
};

exports.var_dump = function () {
  var output = '',
      pad_char = ' ',
      pad_val = 4,
      lgth = 0,
      i = 0;
  
    var _getFuncName = function(fn) {
      var name = (/\W*function\s+([\w\$]+)\s*\(/)
        .exec(fn);
      if (!name) {
        return '(Anonymous)';
      }
      return name[1];
    };
  
    var _repeat_char = function(len, pad_char) {
      var str = '';
      for (var i = 0; i < len; i++) {
        str += pad_char;
      }
      return str;
    };
    var _getInnerVal = function(val, thick_pad) {
      var ret = '';
      if (val === null) {
        ret = 'NULL';
      } else if (typeof val === 'boolean') {
        ret = 'bool(' + val + ')';
      } else if (typeof val === 'string') {
        ret = 'string(' + val.length + ') "' + val + '"';
      } else if (typeof val === 'number') {
        if (parseFloat(val) == parseInt(val, 10)) {
          ret = 'int(' + val + ')';
        } else {
          ret = 'float(' + val + ')';
        }
      }
      // The remaining are not PHP behavior because these values only exist in this exact form in JavaScript
      else if (typeof val === 'undefined') {
        ret = 'undefined';
      } else if (typeof val === 'function') {
        var funcLines = val.toString()
          .split('\n');
        ret = '';
        for (var i = 0, fll = funcLines.length; i < fll; i++) {
          ret += (i !== 0 ? '\n' + thick_pad : '') + funcLines[i];
        }
      } else if (val instanceof Date) {
        ret = 'Date(' + val + ')';
      } else if (val instanceof RegExp) {
        ret = 'RegExp(' + val + ')';
      } else if (val.nodeName) { // Different than PHP's DOMElement
        switch (val.nodeType) {
          case 1:
            if (typeof val.namespaceURI === 'undefined' || val.namespaceURI === 'http://www.w3.org/1999/xhtml') { // Undefined namespace could be plain XML, but namespaceURI not widely supported
              ret = 'HTMLElement("' + val.nodeName + '")';
            } else {
              ret = 'XML Element("' + val.nodeName + '")';
            }
            break;
          case 2:
            ret = 'ATTRIBUTE_NODE(' + val.nodeName + ')';
            break;
          case 3:
            ret = 'TEXT_NODE(' + val.nodeValue + ')';
            break;
          case 4:
            ret = 'CDATA_SECTION_NODE(' + val.nodeValue + ')';
            break;
          case 5:
            ret = 'ENTITY_REFERENCE_NODE';
            break;
          case 6:
            ret = 'ENTITY_NODE';
            break;
          case 7:
            ret = 'PROCESSING_INSTRUCTION_NODE(' + val.nodeName + ':' + val.nodeValue + ')';
            break;
          case 8:
            ret = 'COMMENT_NODE(' + val.nodeValue + ')';
            break;
          case 9:
            ret = 'DOCUMENT_NODE';
            break;
          case 10:
            ret = 'DOCUMENT_TYPE_NODE';
            break;
          case 11:
            ret = 'DOCUMENT_FRAGMENT_NODE';
            break;
          case 12:
            ret = 'NOTATION_NODE';
            break;
        }
      }
      return ret;
    };
  
    var _formatArray = function(obj, cur_depth, pad_val, pad_char) {
      var someProp = '';
      if (cur_depth > 0) {
        cur_depth++;
      }
  
      var base_pad = _repeat_char(pad_val * (cur_depth - 1), pad_char);
      var thick_pad = _repeat_char(pad_val * (cur_depth + 1), pad_char);
      var str = '';
      var val = '';
  
      if (typeof obj === 'object' && obj !== null) {
        if (obj.constructor && _getFuncName(obj.constructor) === 'PHPJS_Resource') {
          return obj.var_dump();
        }
        lgth = 0;
        for (someProp in obj) {
          lgth++;
        }
        str += 'array(' + lgth + ') {\n';
        for (var key in obj) {
          var objVal = obj[key];
          if (typeof objVal === 'object' && objVal !== null && !(objVal instanceof Date) && !(objVal instanceof RegExp) && !
            objVal.nodeName) {
            str += thick_pad + '[' + key + '] =>\n' + thick_pad + _formatArray(objVal, cur_depth + 1, pad_val,
              pad_char);
          } else {
            val = _getInnerVal(objVal, thick_pad);
            str += thick_pad + '[' + key + '] =>\n' + thick_pad + val + '\n';
          }
        }
        str += base_pad + '}\n';
      } else {
        str = _getInnerVal(obj, thick_pad);
      }
      return str;
    };
  
    output = _formatArray(arguments[0], 0, pad_val, pad_char);
    for (i = 1; i < arguments.length; i++) {
      output += '\n' + _formatArray(arguments[i], 0, pad_val, pad_char);
    }
  
    this.echo(output);
};

exports.var_export = function (mixed_expression, bool_return) {
  var retstr = '',
      iret = '',
      value,
      cnt = 0,
      x = [],
      i = 0,
      funcParts = [],
      // We use the last argument (not part of PHP) to pass in
      // our indentation level
      idtLevel = arguments[2] || 2,
      innerIndent = '',
      outerIndent = '',
      getFuncName = function(fn) {
        var name = (/\W*function\s+([\w\$]+)\s*\(/)
          .exec(fn);
        if (!name) {
          return '(Anonymous)';
        }
        return name[1];
      };
    _makeIndent = function(idtLevel) {
      return (new Array(idtLevel + 1))
        .join(' ');
    };
    __getType = function(inp) {
      var i = 0,
        match, types, cons, type = typeof inp;
      if (type === 'object' && (inp && inp.constructor) &&
        getFuncName(inp.constructor) === 'PHPJS_Resource') {
        return 'resource';
      }
      if (type === 'function') {
        return 'function';
      }
      if (type === 'object' && !inp) {
        return 'null'; // Should this be just null?
      }
      if (type === 'object') {
        if (!inp.constructor) {
          return 'object';
        }
        cons = inp.constructor.toString();
        match = cons.match(/(\w+)\(/);
        if (match) {
          cons = match[1].toLowerCase();
        }
        types = ['boolean', 'number', 'string', 'array'];
        for (i = 0; i < types.length; i++) {
          if (cons === types[i]) {
            type = types[i];
            break;
          }
        }
      }
      return type;
    };
    type = __getType(mixed_expression);
  
    if (type === null) {
      retstr = 'NULL';
    } else if (type === 'array' || type === 'object') {
      outerIndent = _makeIndent(idtLevel - 2);
      innerIndent = _makeIndent(idtLevel);
      for (i in mixed_expression) {
        value = this.var_export(mixed_expression[i], 1, idtLevel + 2);
        value = typeof value === 'string' ? value.replace(/</g, '&lt;')
          .
        replace(/>/g, '&gt;') : value;
        x[cnt++] = innerIndent + i + ' => ' +
          (__getType(mixed_expression[i]) === 'array' ?
          '\n' : '') + value;
      }
      iret = x.join(',\n');
      retstr = outerIndent + 'array (\n' + iret + '\n' + outerIndent + ')';
    } else if (type === 'function') {
      funcParts = mixed_expression.toString()
        .
      match(/function .*?\((.*?)\) \{([\s\S]*)\}/);
  
      // For lambda functions, var_export() outputs such as the following:
      // '\000lambda_1'. Since it will probably not be a common use to
      // expect this (unhelpful) form, we'll use another PHP-exportable
      // construct, create_function() (though dollar signs must be on the
      // variables in JavaScript); if using instead in JavaScript and you
      // are using the namespaced version, note that create_function() will
      // not be available as a global
      retstr = "create_function ('" + funcParts[1] + "', '" +
        funcParts[2].replace(new RegExp("'", 'g'), "\\'") + "')";
    } else if (type === 'resource') {
      retstr = 'NULL'; // Resources treated as null for var_export
    } else {
      retstr = typeof mixed_expression !== 'string' ? mixed_expression :
        "'" + mixed_expression.replace(/(["'])/g, '\\$1')
        .
      replace(/\0/g, '\\0') + "'";
    }
  
    if (!bool_return) {
      this.echo(retstr);
      return null;
    }
  
    return retstr;
};

exports.arsort = function (inputArr, sort_flags) {
  var valArr = [],
      valArrLen = 0,
      k, i, ret, sorter, that = this,
      strictForIn = false,
      populateArr = {};
  
    switch (sort_flags) {
      case 'SORT_STRING':
        // compare items as strings
        sorter = function(a, b) {
          return that.strnatcmp(b, a);
        };
        break;
      case 'SORT_LOCALE_STRING':
        // compare items as strings, original by the current locale (set with i18n_loc_set_default() as of PHP6)
        var loc = this.i18n_loc_get_default();
        sorter = this.php_js.i18nLocales[loc].sorting;
        break;
      case 'SORT_NUMERIC':
        // compare items numerically
        sorter = function(a, b) {
          return (a - b);
        };
        break;
      case 'SORT_REGULAR':
        // compare items normally (don't change types)
      default:
        sorter = function(b, a) {
          var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
          if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
          } else if (aNumeric && !bNumeric) {
            return 1;
          } else if (!aNumeric && bNumeric) {
            return -1;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        };
        break;
    }
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Get key and value arrays
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        valArr.push([k, inputArr[k]]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
    valArr.sort(function(a, b) {
      return sorter(a[1], b[1]);
    });
  
    // Repopulate the old array
    for (i = 0, valArrLen = valArr.length; i < valArrLen; i++) {
      populateArr[valArr[i][0]] = valArr[i][1];
    }
  
    return strictForIn || populateArr;
};

exports.asort = function (inputArr, sort_flags) {
  var valArr = [],
      valArrLen = 0,
      k, i, ret, sorter, that = this,
      strictForIn = false,
      populateArr = {};
  
    switch (sort_flags) {
      case 'SORT_STRING':
        // compare items as strings
        sorter = function(a, b) {
          return that.strnatcmp(a, b);
        };
        break;
      case 'SORT_LOCALE_STRING':
        // compare items as strings, original by the current locale (set with i18n_loc_set_default() as of PHP6)
        var loc = this.i18n_loc_get_default();
        sorter = this.php_js.i18nLocales[loc].sorting;
        break;
      case 'SORT_NUMERIC':
        // compare items numerically
        sorter = function(a, b) {
          return (a - b);
        };
        break;
      case 'SORT_REGULAR':
        // compare items normally (don't change types)
      default:
        sorter = function(a, b) {
          var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
          if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
          } else if (aNumeric && !bNumeric) {
            return 1;
          } else if (!aNumeric && bNumeric) {
            return -1;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        };
        break;
    }
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Get key and value arrays
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        valArr.push([k, inputArr[k]]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
  
    valArr.sort(function(a, b) {
      return sorter(a[1], b[1]);
    });
  
    // Repopulate the old array
    for (i = 0, valArrLen = valArr.length; i < valArrLen; i++) {
      populateArr[valArr[i][0]] = valArr[i][1];
    }
  
    return strictForIn || populateArr;
};

exports.krsort = function (inputArr, sort_flags) {
  var tmp_arr = {},
      keys = [],
      sorter, i, k, that = this,
      strictForIn = false,
      populateArr = {};
  
    switch (sort_flags) {
      case 'SORT_STRING':
        // compare items as strings
        sorter = function(a, b) {
          return that.strnatcmp(b, a);
        };
        break;
      case 'SORT_LOCALE_STRING':
        // compare items as strings, original by the current locale (set with  i18n_loc_set_default() as of PHP6)
        var loc = this.i18n_loc_get_default();
        sorter = this.php_js.i18nLocales[loc].sorting;
        break;
      case 'SORT_NUMERIC':
        // compare items numerically
        sorter = function(a, b) {
          return (b - a);
        };
        break;
      case 'SORT_REGULAR':
        // compare items normally (don't change types)
      default:
        sorter = function(b, a) {
          var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
          if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
          } else if (aNumeric && !bNumeric) {
            return 1;
          } else if (!aNumeric && bNumeric) {
            return -1;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        };
        break;
    }
  
    // Make a list of key names
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        keys.push(k);
      }
    }
    keys.sort(sorter);
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Rebuild array with sorted key names
    for (i = 0; i < keys.length; i++) {
      k = keys[i];
      tmp_arr[k] = inputArr[k];
      if (strictForIn) {
        delete inputArr[k];
      }
    }
    for (i in tmp_arr) {
      if (tmp_arr.hasOwnProperty(i)) {
        populateArr[i] = tmp_arr[i];
      }
    }
  
    return strictForIn || populateArr;
};

exports.ksort = function (inputArr, sort_flags) {
  var tmp_arr = {},
      keys = [],
      sorter, i, k, that = this,
      strictForIn = false,
      populateArr = {};
  
    switch (sort_flags) {
      case 'SORT_STRING':
        // compare items as strings
        sorter = function(a, b) {
          return that.strnatcmp(a, b);
        };
        break;
      case 'SORT_LOCALE_STRING':
        // compare items as strings, original by the current locale (set with  i18n_loc_set_default() as of PHP6)
        var loc = this.i18n_loc_get_default();
        sorter = this.php_js.i18nLocales[loc].sorting;
        break;
      case 'SORT_NUMERIC':
        // compare items numerically
        sorter = function(a, b) {
          return ((a + 0) - (b + 0));
        };
        break;
        // case 'SORT_REGULAR': // compare items normally (don't change types)
      default:
        sorter = function(a, b) {
          var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
          if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
          } else if (aNumeric && !bNumeric) {
            return 1;
          } else if (!aNumeric && bNumeric) {
            return -1;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        };
        break;
    }
  
    // Make a list of key names
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        keys.push(k);
      }
    }
    keys.sort(sorter);
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Rebuild array with sorted key names
    for (i = 0; i < keys.length; i++) {
      k = keys[i];
      tmp_arr[k] = inputArr[k];
      if (strictForIn) {
        delete inputArr[k];
      }
    }
    for (i in tmp_arr) {
      if (tmp_arr.hasOwnProperty(i)) {
        populateArr[i] = tmp_arr[i];
      }
    }
  
    return strictForIn || populateArr;
};

exports.natsort = function (inputArr) {
  var valArr = [],
      k, i, ret, that = this,
      strictForIn = false,
      populateArr = {};
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    // Get key and value arrays
    for (k in inputArr) {
      if (inputArr.hasOwnProperty(k)) {
        valArr.push([k, inputArr[k]]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
    valArr.sort(function(a, b) {
      return that.strnatcmp(a[1], b[1]);
    });
  
    // Repopulate the old array
    for (i = 0; i < valArr.length; i++) {
      populateArr[valArr[i][0]] = valArr[i][1];
    }
  
    return strictForIn || populateArr;
};

exports.rsort = function (inputArr, sort_flags) {
  var valArr = [],
      k = '',
      i = 0,
      sorter = false,
      that = this,
      strictForIn = false,
      populateArr = [];
  
    switch (sort_flags) {
      case 'SORT_STRING':
        // compare items as strings
        sorter = function(a, b) {
          return that.strnatcmp(b, a);
        };
        break;
      case 'SORT_LOCALE_STRING':
        // compare items as strings, original by the current locale (set with  i18n_loc_set_default() as of PHP6)
        var loc = this.i18n_loc_get_default();
        sorter = this.php_js.i18nLocales[loc].sorting;
        break;
      case 'SORT_NUMERIC':
        // compare items numerically
        sorter = function(a, b) {
          return (b - a);
        };
        break;
      case 'SORT_REGULAR':
        // compare items normally (don't change types)
      default:
        sorter = function(b, a) {
          var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
          if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
          } else if (aNumeric && !bNumeric) {
            return 1;
          } else if (!aNumeric && bNumeric) {
            return -1;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        };
        break;
    }
  
    // BEGIN REDUNDANT
    try {
      this.php_js = this.php_js || {};
    } catch (e) {
      this.php_js = {};
    }
  
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    for (k in inputArr) { // Get key and value arrays
      if (inputArr.hasOwnProperty(k)) {
        valArr.push(inputArr[k]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
  
    valArr.sort(sorter);
  
    for (i = 0; i < valArr.length; i++) { // Repopulate the old array
      populateArr[i] = valArr[i];
    }
    return strictForIn || populateArr;
};

exports.sort = function (inputArr, sort_flags) {
  var valArr = [],
      keyArr = [],
      k = '',
      i = 0,
      sorter = false,
      that = this,
      strictForIn = false,
      populateArr = [];
  
    switch (sort_flags) {
      case 'SORT_STRING':
        // compare items as strings
        sorter = function(a, b) {
          return that.strnatcmp(a, b);
        };
        break;
      case 'SORT_LOCALE_STRING':
        // compare items as strings, original by the current locale (set with  i18n_loc_set_default() as of PHP6)
        var loc = this.i18n_loc_get_default();
        sorter = this.php_js.i18nLocales[loc].sorting;
        break;
      case 'SORT_NUMERIC':
        // compare items numerically
        sorter = function(a, b) {
          return (a - b);
        };
        break;
      case 'SORT_REGULAR':
        // compare items normally (don't change types)
      default:
        sorter = function(a, b) {
          var aFloat = parseFloat(a),
            bFloat = parseFloat(b),
            aNumeric = aFloat + '' === a,
            bNumeric = bFloat + '' === b;
          if (aNumeric && bNumeric) {
            return aFloat > bFloat ? 1 : aFloat < bFloat ? -1 : 0;
          } else if (aNumeric && !bNumeric) {
            return 1;
          } else if (!aNumeric && bNumeric) {
            return -1;
          }
          return a > b ? 1 : a < b ? -1 : 0;
        };
        break;
    }
  
    // BEGIN REDUNDANT
    try {
      this.php_js = this.php_js || {};
    } catch (e) {
      this.php_js = {};
    }
  
    this.php_js.ini = this.php_js.ini || {};
    // END REDUNDANT
    strictForIn = this.php_js.ini['phpjs.strictForIn'] && this.php_js.ini['phpjs.strictForIn'].local_value && this.php_js
      .ini['phpjs.strictForIn'].local_value !== 'off';
    populateArr = strictForIn ? inputArr : populateArr;
  
    for (k in inputArr) { // Get key and value arrays
      if (inputArr.hasOwnProperty(k)) {
        valArr.push(inputArr[k]);
        if (strictForIn) {
          delete inputArr[k];
        }
      }
    }
  
    valArr.sort(sorter);
  
    for (i = 0; i < valArr.length; i++) { // Repopulate the old array
      populateArr[i] = valArr[i];
    }
    return strictForIn || populateArr;
};

exports.ctype_alnum = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.an) !== -1;
};

exports.ctype_alpha = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.al) !== -1;
};

exports.ctype_cntrl = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.ct) !== -1;
};

exports.ctype_digit = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.dg) !== -1;
};

exports.ctype_graph = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.gr) !== -1;
};

exports.ctype_lower = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.lw) !== -1;
};

exports.ctype_print = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.pr) !== -1;
};

exports.ctype_punct = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.pu) !== -1;
};

exports.ctype_space = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.sp) !== -1;
};

exports.ctype_upper = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.up) !== -1;
};

exports.ctype_xdigit = function (text) {
  if (typeof text !== 'string') {
      return false;
    }
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    return text.search(this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.xd) !== -1;
};

exports.strftime = function (fmt, timestamp) {
  this.php_js = this.php_js || {};
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
    var phpjs = this.php_js;
  
    // BEGIN STATIC
    var _xPad = function(x, pad, r) {
      if (typeof r === 'undefined') {
        r = 10;
      }
      for (; parseInt(x, 10) < r && r > 1; r /= 10) {
        x = pad.toString() + x;
      }
      return x.toString();
    };
  
    var locale = phpjs.localeCategories.LC_TIME;
    var locales = phpjs.locales;
    var lc_time = locales[locale].LC_TIME;
  
    var _formats = {
      a: function(d) {
        return lc_time.a[d.getDay()];
      },
      A: function(d) {
        return lc_time.A[d.getDay()];
      },
      b: function(d) {
        return lc_time.b[d.getMonth()];
      },
      B: function(d) {
        return lc_time.B[d.getMonth()];
      },
      C: function(d) {
        return _xPad(parseInt(d.getFullYear() / 100, 10), 0);
      },
      d: ['getDate', '0'],
      e: ['getDate', ' '],
      g: function(d) {
        return _xPad(parseInt(this.G(d) / 100, 10), 0);
      },
      G: function(d) {
        var y = d.getFullYear();
        var V = parseInt(_formats.V(d), 10);
        var W = parseInt(_formats.W(d), 10);
  
        if (W > V) {
          y++;
        } else if (W === 0 && V >= 52) {
          y--;
        }
  
        return y;
      },
      H: ['getHours', '0'],
      I: function(d) {
        var I = d.getHours() % 12;
        return _xPad(I === 0 ? 12 : I, 0);
      },
      j: function(d) {
        var ms = d - new Date('' + d.getFullYear() + '/1/1 GMT');
        ms += d.getTimezoneOffset() * 60000; // Line differs from Yahoo implementation which would be equivalent to replacing it here with:
        // ms = new Date('' + d.getFullYear() + '/' + (d.getMonth()+1) + '/' + d.getDate() + ' GMT') - ms;
        var doy = parseInt(ms / 60000 / 60 / 24, 10) + 1;
        return _xPad(doy, 0, 100);
      },
      k: ['getHours', '0'],
      // not in PHP, but implemented here (as in Yahoo)
      l: function(d) {
        var l = d.getHours() % 12;
        return _xPad(l === 0 ? 12 : l, ' ');
      },
      m: function(d) {
        return _xPad(d.getMonth() + 1, 0);
      },
      M: ['getMinutes', '0'],
      p: function(d) {
        return lc_time.p[d.getHours() >= 12 ? 1 : 0];
      },
      P: function(d) {
        return lc_time.P[d.getHours() >= 12 ? 1 : 0];
      },
      s: function(d) { // Yahoo uses return parseInt(d.getTime()/1000, 10);
        return Date.parse(d) / 1000;
      },
      S: ['getSeconds', '0'],
      u: function(d) {
        var dow = d.getDay();
        return ((dow === 0) ? 7 : dow);
      },
      U: function(d) {
        var doy = parseInt(_formats.j(d), 10);
        var rdow = 6 - d.getDay();
        var woy = parseInt((doy + rdow) / 7, 10);
        return _xPad(woy, 0);
      },
      V: function(d) {
        var woy = parseInt(_formats.W(d), 10);
        var dow1_1 = (new Date('' + d.getFullYear() + '/1/1'))
          .getDay();
        // First week is 01 and not 00 as in the case of %U and %W,
        // so we add 1 to the final result except if day 1 of the year
        // is a Monday (then %W returns 01).
        // We also need to subtract 1 if the day 1 of the year is
        // Friday-Sunday, so the resulting equation becomes:
        var idow = woy + (dow1_1 > 4 || dow1_1 <= 1 ? 0 : 1);
        if (idow === 53 && (new Date('' + d.getFullYear() + '/12/31'))
          .getDay() < 4) {
          idow = 1;
        } else if (idow === 0) {
          idow = _formats.V(new Date('' + (d.getFullYear() - 1) + '/12/31'));
        }
        return _xPad(idow, 0);
      },
      w: 'getDay',
      W: function(d) {
        var doy = parseInt(_formats.j(d), 10);
        var rdow = 7 - _formats.u(d);
        var woy = parseInt((doy + rdow) / 7, 10);
        return _xPad(woy, 0, 10);
      },
      y: function(d) {
        return _xPad(d.getFullYear() % 100, 0);
      },
      Y: 'getFullYear',
      z: function(d) {
        var o = d.getTimezoneOffset();
        var H = _xPad(parseInt(Math.abs(o / 60), 10), 0);
        var M = _xPad(o % 60, 0);
        return (o > 0 ? '-' : '+') + H + M;
      },
      Z: function(d) {
        return d.toString()
          .replace(/^.*\(([^)]+)\)$/, '$1');
        /*
        // Yahoo's: Better?
        var tz = d.toString().replace(/^.*:\d\d( GMT[+-]\d+)? \(?([A-Za-z ]+)\)?\d*$/, '$2').replace(/[a-z ]/g, '');
        if(tz.length > 4) {
          tz = Dt.formats.z(d);
        }
        return tz;
        */
      },
      '%': function(d) {
        return '%';
      }
    };
    // END STATIC
    /* Fix: Locale alternatives are supported though not documented in PHP; see http://linux.die.net/man/3/strptime
  Ec
  EC
  Ex
  EX
  Ey
  EY
  Od or Oe
  OH
  OI
  Om
  OM
  OS
  OU
  Ow
  OW
  Oy
    */
  
    var _date = ((typeof timestamp === 'undefined') ? new Date() : // Not provided
      (typeof timestamp === 'object') ? new Date(timestamp) : // Javascript Date()
      new Date(timestamp * 1000) // PHP API expects UNIX timestamp (auto-convert to int)
    );
  
    var _aggregates = {
      c: 'locale',
      D: '%m/%d/%y',
      F: '%y-%m-%d',
      h: '%b',
      n: '\n',
      r: 'locale',
      R: '%H:%M',
      t: '\t',
      T: '%H:%M:%S',
      x: 'locale',
      X: 'locale'
    };
  
    // First replace aggregates (run in a loop because an agg may be made up of other aggs)
    while (fmt.match(/%[cDFhnrRtTxX]/)) {
      fmt = fmt.replace(/%([cDFhnrRtTxX])/g, function(m0, m1) {
        var f = _aggregates[m1];
        return (f === 'locale' ? lc_time[m1] : f);
      });
    }
  
    // Now replace formats - we need a closure so that the date object gets passed through
    var str = fmt.replace(/%([aAbBCdegGHIjklmMpPsSuUVwWyYzZ%])/g, function(m0, m1) {
      var f = _formats[m1];
      if (typeof f === 'string') {
        return _date[f]();
      } else if (typeof f === 'function') {
        return f(_date);
      } else if (typeof f === 'object' && typeof f[0] === 'string') {
        return _xPad(_date[f[0]](), f[1]);
      } else { // Shouldn't reach here
        return m1;
      }
    });
    return str;
};

exports.strptime = function (dateStr, format) {
  // tm_isdst is in other docs; why not PHP?
  
    // Needs more thorough testing and examples
  
    var retObj = {
      tm_sec: 0,
      tm_min: 0,
      tm_hour: 0,
      tm_mday: 0,
      tm_mon: 0,
      tm_year: 0,
      tm_wday: 0,
      tm_yday: 0,
      unparsed: ''
    },
      i = 0,
      that = this,
      amPmOffset = 0,
      prevHour = false,
      _reset = function(dateObj, realMday) {
        // realMday is to allow for a value of 0 in return results (but without
        // messing up the Date() object)
        var jan1,
          o = retObj,
          d = dateObj;
        o.tm_sec = d.getUTCSeconds();
        o.tm_min = d.getUTCMinutes();
        o.tm_hour = d.getUTCHours();
        o.tm_mday = realMday === 0 ? realMday : d.getUTCDate();
        o.tm_mon = d.getUTCMonth();
        o.tm_year = d.getUTCFullYear() - 1900;
        o.tm_wday = realMday === 0 ? (d.getUTCDay() > 0 ? d.getUTCDay() - 1 : 6) : d.getUTCDay();
        jan1 = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        o.tm_yday = Math.ceil((d - jan1) / (1000 * 60 * 60 * 24));
      },
      _date = function() {
        var o = retObj;
        // We set date to at least 1 to ensure year or month doesn't go backwards
        return _reset(new Date(Date.UTC(o.tm_year + 1900, o.tm_mon, o.tm_mday || 1, o.tm_hour, o.tm_min, o.tm_sec)),
          o.tm_mday);
      };
  
    // BEGIN STATIC
    var _NWS = /\S/,
      _WS = /\s/;
  
    var _aggregates = {
      c: 'locale',
      D: '%m/%d/%y',
      F: '%y-%m-%d',
      r: 'locale',
      R: '%H:%M',
      T: '%H:%M:%S',
      x: 'locale',
      X: 'locale'
    };
  
    /* Fix: Locale alternatives are supported though not documented in PHP; see http://linux.die.net/man/3/strptime
  Ec
  EC
  Ex
  EX
  Ey
  EY
  Od or Oe
  OH
  OI
  Om
  OM
  OS
  OU
  Ow
  OW
  Oy
    */
    var _preg_quote = function(str) {
      return (str + '')
        .replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!<>\|\:])/g, '\\$1');
    };
    // END STATIC
  
    // BEGIN REDUNDANT
    this.php_js = this.php_js || {};
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    // END REDUNDANT
  
    var phpjs = this.php_js;
    var locale = phpjs.localeCategories.LC_TIME;
    var locales = phpjs.locales;
    var lc_time = locales[locale].LC_TIME;
  
    // First replace aggregates (run in a loop because an agg may be made up of other aggs)
    while (format.match(/%[cDFhnrRtTxX]/)) {
      format = format.replace(/%([cDFhnrRtTxX])/g, function(m0, m1) {
        var f = _aggregates[m1];
        return (f === 'locale' ? lc_time[m1] : f);
      });
    }
  
    var _addNext = function(j, regex, cb) {
      if (typeof regex === 'string') {
        regex = new RegExp('^' + regex, 'i');
      }
      var check = dateStr.slice(j);
      var match = regex.exec(check);
      // Even if the callback returns null after assigning to the return object, the object won't be saved anyways
      var testNull = match ? cb.apply(null, match) : null;
      if (testNull === null) {
        throw 'No match in string';
      }
      return j + match[0].length;
    };
  
    var _addLocalized = function(j, formatChar, category) {
      return _addNext(j, that.array_map(
          _preg_quote, lc_time[formatChar])
        .join('|'), // Could make each parenthesized instead and pass index to callback
  
        function(m) {
          var match = lc_time[formatChar].search(new RegExp('^' + _preg_quote(m) + '$', 'i'));
          if (match) {
            retObj[category] = match[0];
          }
        });
    };
  
    // BEGIN PROCESSING CHARACTERS
    for (i = 0, j = 0; i < format.length; i++) {
      if (format.charAt(i) === '%') {
        var literalPos = ['%', 'n', 't'].indexOf(format.charAt(i + 1));
        if (literalPos !== -1) {
          if (['%', '\n', '\t'].indexOf(dateStr.charAt(j)) === literalPos) { // a matched literal
            ++i;
            ++j; // skip beyond
            continue;
          }
          // Format indicated a percent literal, but not actually present
          return false;
        }
        var formatChar = format.charAt(i + 1);
        try {
          switch (formatChar) {
            case 'a':
              // Fall-through // Sun-Sat
            case 'A':
              // Sunday-Saturday
              j = _addLocalized(j, formatChar, 'tm_wday'); // Changes nothing else
              break;
            case 'h':
              // Fall-through (alias of 'b');
            case 'b':
              // Jan-Dec
              j = _addLocalized(j, 'b', 'tm_mon');
              _date(); // Also changes wday, yday
              break;
            case 'B':
              // January-December
              j = _addLocalized(j, formatChar, 'tm_mon');
              _date(); // Also changes wday, yday
              break;
            case 'C':
              // 0+; century (19 for 20th)
              j = _addNext(j, /^\d?\d/, // PHP docs say two-digit, but accepts one-digit (two-digit max)
  
                function(d) {
                  var year = (parseInt(d, 10) - 19) * 100;
                  retObj.tm_year = year;
                  _date();
                  if (!retObj.tm_yday) {
                    retObj.tm_yday = -1;
                  }
                  // Also changes wday; and sets yday to -1 (always?)
                });
              break;
            case 'd':
              // Fall-through  01-31 day
            case 'e':
              // 1-31 day
              j = _addNext(j, formatChar === 'd' ? /^(0[1-9]|[1-2]\d|3[0-1])/ : /^([1-2]\d|3[0-1]|[1-9])/,
                function(d) {
                  var dayMonth = parseInt(d, 10);
                  retObj.tm_mday = dayMonth;
                  _date(); // Also changes w_day, y_day
                });
              break;
            case 'g':
              // No apparent effect; 2-digit year (see 'V')
              break;
            case 'G':
              // No apparent effect; 4-digit year (see 'V')'
              break;
            case 'H':
              // 00-23 hours
              j = _addNext(j, /^([0-1]\d|2[0-3])/, function(d) {
                var hour = parseInt(d, 10);
                retObj.tm_hour = hour;
                // Changes nothing else
              });
              break;
            case 'l':
              // Fall-through of lower-case 'L'; 1-12 hours
            case 'I':
              // 01-12 hours
              j = _addNext(j, formatChar === 'l' ? /^([1-9]|1[0-2])/ : /^(0[1-9]|1[0-2])/, function(d) {
                var hour = parseInt(d, 10) - 1 + amPmOffset;
                retObj.tm_hour = hour;
                prevHour = true; // Used for coordinating with am-pm
                // Changes nothing else, but affected by prior 'p/P'
              });
              break;
            case 'j':
              // 001-366 day of year
              j = _addNext(j, /^(00[1-9]|0[1-9]\d|[1-2]\d\d|3[0-6][0-6])/, function(d) {
                var dayYear = parseInt(d, 10) - 1;
                retObj.tm_yday = dayYear;
                // Changes nothing else (oddly, since if original by a given year, could calculate other fields)
              });
              break;
            case 'm':
              // 01-12 month
              j = _addNext(j, /^(0[1-9]|1[0-2])/, function(d) {
                var month = parseInt(d, 10) - 1;
                retObj.tm_mon = month;
                _date(); // Also sets wday and yday
              });
              break;
            case 'M':
              // 00-59 minutes
              j = _addNext(j, /^[0-5]\d/, function(d) {
                var minute = parseInt(d, 10);
                retObj.tm_min = minute;
                // Changes nothing else
              });
              break;
            case 'P':
              // Seems not to work; AM-PM
              return false; // Could make fall-through instead since supposed to be a synonym despite PHP docs
            case 'p':
              // am-pm
              j = _addNext(j, /^(am|pm)/i, function(d) {
                // No effect on 'H' since already 24 hours but
                //   works before or after setting of l/I hour
                amPmOffset = (/a/)
                  .test(d) ? 0 : 12;
                if (prevHour) {
                  retObj.tm_hour += amPmOffset;
                }
              });
              break;
            case 's':
              // Unix timestamp (in seconds)
              j = _addNext(j, /^\d+/, function(d) {
                var timestamp = parseInt(d, 10);
                var date = new Date(Date.UTC(timestamp * 1000));
                _reset(date);
                // Affects all fields, but can't be negative (and initial + not allowed)
              });
              break;
            case 'S':
              // 00-59 seconds
              j = _addNext(j, /^[0-5]\d/, // strptime also accepts 60-61 for some reason
  
                function(d) {
                  var second = parseInt(d, 10);
                  retObj.tm_sec = second;
                  // Changes nothing else
                });
              break;
            case 'u':
              // Fall-through; 1 (Monday)-7(Sunday)
            case 'w':
              // 0 (Sunday)-6(Saturday)
              j = _addNext(j, /^\d/, function(d) {
                retObj.tm_wday = d - (formatChar === 'u');
                // Changes nothing else apparently
              });
              break;
            case 'U':
              // Fall-through (week of year, from 1st Sunday)
            case 'V':
              // Fall-through (ISO-8601:1988 week number; from first 4-weekday week, starting with Monday)
            case 'W':
              // Apparently ignored (week of year, from 1st Monday)
              break;
            case 'y':
              // 69 (or higher) for 1969+, 68 (or lower) for 2068-
              j = _addNext(j, /^\d?\d/, // PHP docs say two-digit, but accepts one-digit (two-digit max)
  
                function(d) {
                  d = parseInt(d, 10);
                  var year = d >= 69 ? d : d + 100;
                  retObj.tm_year = year;
                  _date();
                  if (!retObj.tm_yday) {
                    retObj.tm_yday = -1;
                  }
                  // Also changes wday; and sets yday to -1 (always?)
                });
              break;
            case 'Y':
              // 2010 (4-digit year)
              j = _addNext(j, /^\d{1,4}/, // PHP docs say four-digit, but accepts one-digit (four-digit max)
  
                function(d) {
                  var year = (parseInt(d, 10)) - 1900;
                  retObj.tm_year = year;
                  _date();
                  if (!retObj.tm_yday) {
                    retObj.tm_yday = -1;
                  }
                  // Also changes wday; and sets yday to -1 (always?)
                });
              break;
            case 'z':
              // Timezone; on my system, strftime gives -0800, but strptime seems not to alter hour setting
              break;
            case 'Z':
              // Timezone; on my system, strftime gives PST, but strptime treats text as unparsed
              break;
            default:
              throw 'Unrecognized formatting character in strptime()';
          }
        } catch (e) {
          if (e === 'No match in string') { // Allow us to exit
            return false; // There was supposed to be a matching format but there wasn't
          }
        }++i; // Calculate skipping beyond initial percent too
      } else if (format.charAt(i) !== dateStr.charAt(j)) {
        // If extra whitespace at beginning or end of either, or between formats, no problem
        // (just a problem when between % and format specifier)
  
        // If the string has white-space, it is ok to ignore
        if (dateStr.charAt(j)
          .search(_WS) !== -1) {
          j++;
          i--; // Let the next iteration try again with the same format character
        } else if (format.charAt(i)
          .search(_NWS) !== -1) { // Any extra formatting characters besides white-space causes
          // problems (do check after WS though, as may just be WS in string before next character)
          return false;
        }
        // Extra WS in format
        // Adjust strings when encounter non-matching whitespace, so they align in future checks above
        // Will check on next iteration (against same (non-WS) string character)
      } else {
        j++;
      }
    }
  
    // POST-PROCESSING
    retObj.unparsed = dateStr.slice(j); // Will also get extra whitespace; empty string if none
    return retObj;
};

exports.sql_regcase = function (str) {
  this.setlocale('LC_ALL', 0);
    var i = 0,
      upper = '',
      lower = '',
      pos = 0,
      retStr = '';
  
    upper = this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.upper;
    lower = this.php_js.locales[this.php_js.localeCategories.LC_CTYPE].LC_CTYPE.lower;
  
    for (i = 0; i < str.length; i++) {
      if (((pos = upper.indexOf(str.charAt(i))) !== -1) || ((pos = lower.indexOf(str.charAt(i))) !== -1)) {
        retStr += '[' + upper.charAt(pos) + lower.charAt(pos) + ']';
      } else {
        retStr += str.charAt(i);
      }
    }
    return retStr;
};

exports.localeconv = function () {
  var arr = {},
      prop = '';
  
    // BEGIN REDUNDANT
    this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place, if not already
    // END REDUNDANT
    // Make copies
    for (prop in this.php_js.locales[this.php_js.localeCategories.LC_NUMERIC].LC_NUMERIC) {
      arr[prop] = this.php_js.locales[this.php_js.localeCategories.LC_NUMERIC].LC_NUMERIC[prop];
    }
    for (prop in this.php_js.locales[this.php_js.localeCategories.LC_MONETARY].LC_MONETARY) {
      arr[prop] = this.php_js.locales[this.php_js.localeCategories.LC_MONETARY].LC_MONETARY[prop];
    }
  
    return arr;
};

exports.money_format = function (format, number) {
  // Per PHP behavior, there seems to be no extra padding for sign when there is a positive number, though my
    // understanding of the description is that there should be padding; need to revisit examples
  
    // Helpful info at http://ftp.gnu.org/pub/pub/old-gnu/Manuals/glibc-2.2.3/html_chapter/libc_7.html and http://publib.boulder.ibm.com/infocenter/zos/v1r10/index.jsp?topic=/com.ibm.zos.r10.bpxbd00/strfmp.htm
  
    if (typeof number !== 'number') {
      return null;
    }
    var regex = /%((=.|[+^(!-])*?)(\d*?)(#(\d+))?(\.(\d+))?([in%])/g; // 1: flags, 3: width, 5: left, 7: right, 8: conversion
  
    this.setlocale('LC_ALL', 0); // Ensure the locale data we need is set up
    var monetary = this.php_js.locales[this.php_js.localeCategories['LC_MONETARY']]['LC_MONETARY'];
  
    var doReplace = function(n0, flags, n2, width, n4, left, n6, right, conversion) {
      var value = '',
        repl = '';
      if (conversion === '%') { // Percent does not seem to be allowed with intervening content
        return '%';
      }
      var fill = flags && (/=./)
        .test(flags) ? flags.match(/=(.)/)[1] : ' '; // flag: =f (numeric fill)
      var showCurrSymbol = !flags || flags.indexOf('!') === -1; // flag: ! (suppress currency symbol)
      width = parseInt(width, 10) || 0; // field width: w (minimum field width)
  
      var neg = number < 0;
      number = number + ''; // Convert to string
      number = neg ? number.slice(1) : number; // We don't want negative symbol represented here yet
  
      var decpos = number.indexOf('.');
      var integer = decpos !== -1 ? number.slice(0, decpos) : number; // Get integer portion
      var fraction = decpos !== -1 ? number.slice(decpos + 1) : ''; // Get decimal portion
  
      var _str_splice = function(integerStr, idx, thous_sep) {
        var integerArr = integerStr.split('');
        integerArr.splice(idx, 0, thous_sep);
        return integerArr.join('');
      };
  
      var init_lgth = integer.length;
      left = parseInt(left, 10);
      var filler = init_lgth < left;
      if (filler) {
        var fillnum = left - init_lgth;
        integer = new Array(fillnum + 1)
          .join(fill) + integer;
      }
      if (flags.indexOf('^') === -1) { // flag: ^ (disable grouping characters (of locale))
        // use grouping characters
        var thous_sep = monetary.mon_thousands_sep; // ','
        var mon_grouping = monetary.mon_grouping; // [3] (every 3 digits in U.S.A. locale)
  
        if (mon_grouping[0] < integer.length) {
          for (var i = 0, idx = integer.length; i < mon_grouping.length; i++) {
            idx -= mon_grouping[i]; // e.g., 3
            if (idx <= 0) {
              break;
            }
            if (filler && idx < fillnum) {
              thous_sep = fill;
            }
            integer = _str_splice(integer, idx, thous_sep);
          }
        }
        if (mon_grouping[i - 1] > 0) { // Repeating last grouping (may only be one) until highest portion of integer reached
          while (idx > mon_grouping[i - 1]) {
            idx -= mon_grouping[i - 1];
            if (filler && idx < fillnum) {
              thous_sep = fill;
            }
            integer = _str_splice(integer, idx, thous_sep);
          }
        }
      }
  
      // left, right
      if (right === '0') { // No decimal or fractional digits
        value = integer;
      } else {
        var dec_pt = monetary.mon_decimal_point; // '.'
        if (right === '' || right === undefined) {
          right = conversion === 'i' ? monetary.int_frac_digits : monetary.frac_digits;
        }
        right = parseInt(right, 10);
  
        if (right === 0) { // Only remove fractional portion if explicitly set to zero digits
          fraction = '';
          dec_pt = '';
        } else if (right < fraction.length) {
          fraction = Math.round(parseFloat(fraction.slice(0, right) + '.' + fraction.substr(right, 1))) + '';
          if (right > fraction.length) {
            fraction = new Array(right - fraction.length + 1)
              .join('0') + fraction; // prepend with 0's
          }
        } else if (right > fraction.length) {
          fraction += new Array(right - fraction.length + 1)
            .join('0'); // pad with 0's
        }
        value = integer + dec_pt + fraction;
      }
  
      var symbol = '';
      if (showCurrSymbol) {
        symbol = conversion === 'i' ? monetary.int_curr_symbol : monetary.currency_symbol; // 'i' vs. 'n' ('USD' vs. '$')
      }
      var sign_posn = neg ? monetary.n_sign_posn : monetary.p_sign_posn;
  
      // 0: no space between curr. symbol and value
      // 1: space sep. them unless symb. and sign are adjacent then space sep. them from value
      // 2: space sep. sign and value unless symb. and sign are adjacent then space separates
      var sep_by_space = neg ? monetary.n_sep_by_space : monetary.p_sep_by_space;
  
      // p_cs_precedes, n_cs_precedes // positive currency symbol follows value = 0; precedes value = 1
      var cs_precedes = neg ? monetary.n_cs_precedes : monetary.p_cs_precedes;
  
      // Assemble symbol/value/sign and possible space as appropriate
      if (flags.indexOf('(') !== -1) { // flag: parenth. for negative
        // Fix: unclear on whether and how sep_by_space, sign_posn, or cs_precedes have
        // an impact here (as they do below), but assuming for now behaves as sign_posn 0 as
        // far as localized sep_by_space and sign_posn behavior
        repl = (cs_precedes ? symbol + (sep_by_space === 1 ? ' ' : '') : '') + value + (!cs_precedes ? (
          sep_by_space === 1 ? ' ' : '') + symbol : '');
        if (neg) {
          repl = '(' + repl + ')';
        } else {
          repl = ' ' + repl + ' ';
        }
      } else { // '+' is default
        var pos_sign = monetary.positive_sign; // ''
        var neg_sign = monetary.negative_sign; // '-'
        var sign = neg ? (neg_sign) : (pos_sign);
        var otherSign = neg ? (pos_sign) : (neg_sign);
        var signPadding = '';
        if (sign_posn) { // has a sign
          signPadding = new Array(otherSign.length - sign.length + 1)
            .join(' ');
        }
  
        var valueAndCS = '';
        switch (sign_posn) {
          // 0: parentheses surround value and curr. symbol;
          // 1: sign precedes them;
          // 2: sign follows them;
          // 3: sign immed. precedes curr. symbol; (but may be space between)
          // 4: sign immed. succeeds curr. symbol; (but may be space between)
          case 0:
            valueAndCS = cs_precedes ? symbol + (sep_by_space === 1 ? ' ' : '') + value : value + (sep_by_space ===
              1 ? ' ' : '') + symbol;
            repl = '(' + valueAndCS + ')';
            break;
          case 1:
            valueAndCS = cs_precedes ? symbol + (sep_by_space === 1 ? ' ' : '') + value : value + (sep_by_space ===
              1 ? ' ' : '') + symbol;
            repl = signPadding + sign + (sep_by_space === 2 ? ' ' : '') + valueAndCS;
            break;
          case 2:
            valueAndCS = cs_precedes ? symbol + (sep_by_space === 1 ? ' ' : '') + value : value + (sep_by_space ===
              1 ? ' ' : '') + symbol;
            repl = valueAndCS + (sep_by_space === 2 ? ' ' : '') + sign + signPadding;
            break;
          case 3:
            repl = cs_precedes ? signPadding + sign + (sep_by_space === 2 ? ' ' : '') + symbol + (sep_by_space ===
              1 ? ' ' : '') + value : value + (sep_by_space === 1 ? ' ' : '') + sign + signPadding + (
              sep_by_space === 2 ? ' ' : '') + symbol;
            break;
          case 4:
            repl = cs_precedes ? symbol + (sep_by_space === 2 ? ' ' : '') + signPadding + sign + (sep_by_space ===
              1 ? ' ' : '') + value : value + (sep_by_space === 1 ? ' ' : '') + symbol + (sep_by_space === 2 ?
              ' ' : '') + sign + signPadding;
            break;
        }
      }
  
      var padding = width - repl.length;
      if (padding > 0) {
        padding = new Array(padding + 1)
          .join(' ');
        // Fix: How does p_sep_by_space affect the count if there is a space? Included in count presumably?
        if (flags.indexOf('-') !== -1) { // left-justified (pad to right)
          repl += padding;
        } else { // right-justified (pad to left)
          repl = padding + repl;
        }
      }
      return repl;
    };
  
    return format.replace(regex, doReplace);
};

exports.nl_langinfo = function (item) {
  this.setlocale('LC_ALL', 0); // Ensure locale data is available
    var loc = this.php_js.locales[this.php_js.localeCategories.LC_TIME];
    if (item.indexOf('ABDAY_') === 0) {
      return loc.LC_TIME.a[parseInt(item.replace(/^ABDAY_/, ''), 10) - 1];
    } else if (item.indexOf('DAY_') === 0) {
      return loc.LC_TIME.A[parseInt(item.replace(/^DAY_/, ''), 10) - 1];
    } else if (item.indexOf('ABMON_') === 0) {
      return loc.LC_TIME.b[parseInt(item.replace(/^ABMON_/, ''), 10) - 1];
    } else if (item.indexOf('MON_') === 0) {
      return loc.LC_TIME.B[parseInt(item.replace(/^MON_/, ''), 10) - 1];
    } else {
      switch (item) {
        // More LC_TIME
        case 'AM_STR':
          return loc.LC_TIME.p[0];
        case 'PM_STR':
          return loc.LC_TIME.p[1];
        case 'D_T_FMT':
          return loc.LC_TIME.c;
        case 'D_FMT':
          return loc.LC_TIME.x;
        case 'T_FMT':
          return loc.LC_TIME.X;
        case 'T_FMT_AMPM':
          return loc.LC_TIME.r;
        case 'ERA':
          // all fall-throughs
        case 'ERA_YEAR':
        case 'ERA_D_T_FMT':
        case 'ERA_D_FMT':
        case 'ERA_T_FMT':
          return loc.LC_TIME[item];
      }
      loc = this.php_js.locales[this.php_js.localeCategories.LC_MONETARY];
      if (item === 'CRNCYSTR') {
        item = 'CURRENCY_SYMBOL'; // alias
      }
      switch (item) {
        case 'INT_CURR_SYMBOL':
          // all fall-throughs
        case 'CURRENCY_SYMBOL':
        case 'MON_DECIMAL_POINT':
        case 'MON_THOUSANDS_SEP':
        case 'POSITIVE_SIGN':
        case 'NEGATIVE_SIGN':
        case 'INT_FRAC_DIGITS':
        case 'FRAC_DIGITS':
        case 'P_CS_PRECEDES':
        case 'P_SEP_BY_SPACE':
        case 'N_CS_PRECEDES':
        case 'N_SEP_BY_SPACE':
        case 'P_SIGN_POSN':
        case 'N_SIGN_POSN':
          return loc.LC_MONETARY[item.toLowerCase()];
        case 'MON_GROUPING':
          // Same as above, or return something different since this returns an array?
          return loc.LC_MONETARY[item.toLowerCase()];
      }
      loc = this.php_js.locales[this.php_js.localeCategories.LC_NUMERIC];
      switch (item) {
        case 'RADIXCHAR':
          // Fall-through
        case 'DECIMAL_POINT':
          return loc.LC_NUMERIC[item.toLowerCase()];
        case 'THOUSEP':
          // Fall-through
        case 'THOUSANDS_SEP':
          return loc.LC_NUMERIC[item.toLowerCase()];
        case 'GROUPING':
          // Same as above, or return something different since this returns an array?
          return loc.LC_NUMERIC[item.toLowerCase()];
      }
      loc = this.php_js.locales[this.php_js.localeCategories.LC_MESSAGES];
      switch (item) {
        case 'YESEXPR':
          // all fall-throughs
        case 'NOEXPR':
        case 'YESSTR':
        case 'NOSTR':
          return loc.LC_MESSAGES[item];
      }
      loc = this.php_js.locales[this.php_js.localeCategories.LC_CTYPE];
      if (item === 'CODESET') {
        return loc.LC_CTYPE[item];
      }
      return false;
    }
};

exports.strcoll = function (str1, str2) {
  this.setlocale('LC_ALL', 0); // ensure setup of localization variables takes place
    var cmp = this.php_js.locales[this.php_js.localeCategories.LC_COLLATE].LC_COLLATE;
    // return str1.localeCompare(str2); // We don't use this as it doesn't allow us to control it via setlocale()
    return cmp(str1, str2);
};

exports.strval = function (str) {
  var type = '';
  
    if (str === null) {
      return '';
    }
  
    type = this.gettype(str);
  
    // Comment out the entire switch if you want JS-like
    // behavior instead of PHP behavior
    switch (type) {
      case 'boolean':
        if (str === true) {
          return '1';
        }
        return '';
      case 'array':
        return 'Array';
      case 'object':
        return 'Object';
    }
  
    return str;
};

exports.gmstrftime = function (format, timestamp) {
  var dt = ((typeof timestamp === 'undefined') ? new Date() : // Not provided
      (typeof timestamp === 'object') ? new Date(timestamp) : // Javascript Date()
      new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
    );
    timestamp = Date.parse(dt.toUTCString()
      .slice(0, -4)) / 1000;
    return this.strftime(format, timestamp);
};

exports.str_word_count = function (str, format, charlist) {
  var len = str.length,
      cl = charlist && charlist.length,
      chr = '',
      tmpStr = '',
      i = 0,
      c = '',
      wArr = [],
      wC = 0,
      assoc = {},
      aC = 0,
      reg = '',
      match = false;
  
    // BEGIN STATIC
    var _preg_quote = function(str) {
      return (str + '')
        .replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!<>\|\:])/g, '\\$1');
    };
    _getWholeChar = function(str, i) { // Use for rare cases of non-BMP characters
      var code = str.charCodeAt(i);
      if (code < 0xD800 || code > 0xDFFF) {
        return str.charAt(i);
      }
      if (0xD800 <= code && code <= 0xDBFF) { // High surrogate (could change last hex to 0xDB7F to treat high private surrogates as single characters)
        if (str.length <= (i + 1)) {
          throw 'High surrogate without following low surrogate';
        }
        var next = str.charCodeAt(i + 1);
        if (0xDC00 > next || next > 0xDFFF) {
          throw 'High surrogate without following low surrogate';
        }
        return str.charAt(i) + str.charAt(i + 1);
      }
      // Low surrogate (0xDC00 <= code && code <= 0xDFFF)
      if (i === 0) {
        throw 'Low surrogate without preceding high surrogate';
      }
      var prev = str.charCodeAt(i - 1);
      if (0xD800 > prev || prev > 0xDBFF) { // (could change last hex to 0xDB7F to treat high private surrogates as single characters)
        throw 'Low surrogate without preceding high surrogate';
      }
      return false; // We can pass over low surrogates now as the second component in a pair which we have already processed
    };
    // END STATIC
    if (cl) {
      reg = '^(' + _preg_quote(_getWholeChar(charlist, 0));
      for (i = 1; i < cl; i++) {
        if ((chr = _getWholeChar(charlist, i)) === false) {
          continue;
        }
        reg += '|' + _preg_quote(chr);
      }
      reg += ')$';
      reg = new RegExp(reg);
    }
  
    for (i = 0; i < len; i++) {
      if ((c = _getWholeChar(str, i)) === false) {
        continue;
      }
      match = this.ctype_alpha(c) || (reg && c.search(reg) !== -1) || ((i !== 0 && i !== len - 1) && c === '-') || // No hyphen at beginning or end unless allowed in charlist (or locale)
      (i !== 0 && c === "'"); // No apostrophe at beginning unless allowed in charlist (or locale)
      if (match) {
        if (tmpStr === '' && format === 2) {
          aC = i;
        }
        tmpStr = tmpStr + c;
      }
      if (i === len - 1 || !match && tmpStr !== '') {
        if (format !== 2) {
          wArr[wArr.length] = tmpStr;
        } else {
          assoc[aC] = tmpStr;
        }
        tmpStr = '';
        wC++;
      }
    }
  
    if (!format) {
      return wC;
    } else if (format === 1) {
      return wArr;
    } else if (format === 2) {
      return assoc;
    }
  
    throw 'You have supplied an incorrect format';
};

exports.strtr = function (str, from, to) {
  var fr = '',
      i = 0,
      j = 0,
      lenStr = 0,
      lenFrom = 0,
      tmpStrictForIn = false,
      fromTypeStr = '',
      toTypeStr = '',
      istr = '';
    var tmpFrom = [];
    var tmpTo = [];
    var ret = '';
    var match = false;
  
    // Received replace_pairs?
    // Convert to normal from->to chars
    if (typeof from === 'object') {
      tmpStrictForIn = this.ini_set('phpjs.strictForIn', false); // Not thread-safe; temporarily set to true
      from = this.krsort(from);
      this.ini_set('phpjs.strictForIn', tmpStrictForIn);
  
      for (fr in from) {
        if (from.hasOwnProperty(fr)) {
          tmpFrom.push(fr);
          tmpTo.push(from[fr]);
        }
      }
  
      from = tmpFrom;
      to = tmpTo;
    }
  
    // Walk through subject and replace chars when needed
    lenStr = str.length;
    lenFrom = from.length;
    fromTypeStr = typeof from === 'string';
    toTypeStr = typeof to === 'string';
  
    for (i = 0; i < lenStr; i++) {
      match = false;
      if (fromTypeStr) {
        istr = str.charAt(i);
        for (j = 0; j < lenFrom; j++) {
          if (istr == from.charAt(j)) {
            match = true;
            break;
          }
        }
      } else {
        for (j = 0; j < lenFrom; j++) {
          if (str.substr(i, from[j].length) == from[j]) {
            match = true;
            // Fast forward
            i = (i + from[j].length) - 1;
            break;
          }
        }
      }
      if (match) {
        ret += toTypeStr ? to.charAt(j) : to[j];
      } else {
        ret += str.charAt(i);
      }
    }
  
    return ret;
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],18:[function(require,module,exports){
(function (global){
phpjs = require('./build/npm');

phpjs.registerGlobals = function() {
  for (var key in this) {
    global[key] = this[key];
  }
};

module.exports = phpjs;

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./build/npm":17}],19:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
}

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],20:[function(require,module,exports){
/**
 * 配列(または連想配列)のキーの配列を取得する
 */
module.exports = function(ary){
    var rtn = [];
    for(var key in ary){
        rtn.push(key);
    }
    return rtn;
}

},{}],21:[function(require,module,exports){
(function (Buffer){
/**
 * base64デコードする
 */
module.exports = function( base64 ){
	base64 = this.toStr(base64);
	var bin = new Buffer(base64, 'base64').toString();
	return bin;
}

}).call(this,require("buffer").Buffer)
},{"buffer":3}],22:[function(require,module,exports){
(function (Buffer){
/**
 * base64エンコードする
 */
module.exports = function( bin ){
	bin = this.toStr(bin);
	var base64 = new Buffer(bin).toString('base64');
	return base64;
}

}).call(this,require("buffer").Buffer)
},{"buffer":3}],23:[function(require,module,exports){
/**
 * パス文字列から、ファイル名を取り出す
 */
module.exports = function( path ){
    var rtn = '';
    rtn = path.replace( new RegExp('^.*[\\/\\\\]'), '' );
    return rtn;
}

},{}],24:[function(require,module,exports){
/**
 * 配列(または連想配列)の要素数を数える
 */
module.exports = function(ary){
    return this.array_keys(ary).length;
}

},{}],25:[function(require,module,exports){
/**
 * ディレクトリ名を得る
 */
module.exports = function(path){
    return path.replace(/(?:\/|\\)[^\/\\]*(?:\/|\\)?$/, '');
}

},{}],26:[function(require,module,exports){
/**
 * 文字列をn文字ずつ分割する
 */
module.exports = function(str, n){
	if(typeof(str) !== typeof('')){
		str = this.toStr(str);
	}
	if(typeof(n) !== typeof(0)){return false;}
	if(n <= 0){return false;}
	if(n !== Math.floor(n)){return false;}
	var rtn = [];
	for(var i = 0; i < str.length; i = i+n ){
		var sbstr = str.substring(i,i+n); // i文字目からn文字ずつとりだす
		rtn.push(sbstr);
	}
	return rtn;
}

},{}],27:[function(require,module,exports){
/**
 * HTML特殊文字をエスケープする
 */
module.exports = function(str){
	str = this.toStr(str);
	str = str.replace(/\&/g, '&amp;');
	str = str.replace(/\</g, '&lt;');
	str = str.replace(/\>/g, '&gt;');
	str = str.replace(/\"/g, '&quot;');
	return str;
}

},{}],28:[function(require,module,exports){
/**
 * ディレクトリが存在するか調べる
 */
module.exports = function( path ){
    var fs = require('fs');
    if( !fs.existsSync(path) || !fs.statSync(path).isDirectory() ){
        return false;
    }
    return true;
}

},{"fs":2}],29:[function(require,module,exports){
/**
 * ファイルが存在するか調べる
 */
module.exports = function( path ){
    var fs = require('fs');
    if( !fs.existsSync(path) || !fs.statSync(path).isFile() ){
        return false;
    }
    return true;
}

},{"fs":2}],30:[function(require,module,exports){
/**
 * md5ハッシュを求める
 */
module.exports = function( str ){
	str = this.toStr(str);
	var crypto = require('crypto');
	var md5 = crypto.createHash('md5');
	md5.update(str, 'utf8');
	return md5.digest('hex');
}

},{"crypto":6}],31:[function(require,module,exports){
/**
 * パスを正規化する。
 *
 * 受け取ったパスを、スラッシュ区切りの表現に正規化します。
 * Windowsのボリュームラベルが付いている場合は削除します。
 * URIスキーム(http, https, ftp など) で始まる場合、2つのスラッシュで始まる場合(`//www.example.com/abc/` など)、これを残して正規化します。
 *
 *  - 例： `\a\b\c.html` → `/a/b/c.html` バックスラッシュはスラッシュに置き換えられます。
 *  - 例： `/a/b////c.html` → `/a/b/c.html` 余計なスラッシュはまとめられます。
 *  - 例： `C:\a\b\c.html` → `/a/b/c.html` ボリュームラベルは削除されます。
 *  - 例： `http://a/b/c.html` → `http://a/b/c.html` URIスキームは残されます。
 *  - 例： `//a/b/c.html` → `//a/b/c.html` ドメイン名は残されます。
 *
 * @param string $path 正規化するパス
 * @return string 正規化されたパス
 */
module.exports = function($path){
    $path = this.trim($path);
    // $path = $this->convert_encoding( $path );//文字コードを揃える
    $path = $path.replace( /\/|\\/g, '/' );//バックスラッシュをスラッシュに置き換える。
    $path = $path.replace( /^[A-Za-z]\:\//g, '/' );//Windowsのボリュームラベルを削除
    var $prefix = '';
    if( $path.match( /^((?:[a-zA-Z0-9]+\:)?\/)(\/[\s\S]*)$/, $path ) ){
        $prefix = RegExp.$1;
        $path = RegExp.$2;
    }
    $path = $path.replace( /\/+/g, '/' );//重複するスラッシュを1つにまとめる
    return $prefix+$path;
}

},{}],32:[function(require,module,exports){
/**
 * 正規表現で使えるようにエスケープ処理を施す
 */
module.exports = function(str) {
    if( typeof(str) !== typeof('') ){return str;}
    return str.replace(/([.*+?^=!:${}()|[\]\/\\])/g, "\\$1");
}

},{}],33:[function(require,module,exports){
/**
 * sha1ハッシュを求める
 */
module.exports = function( str ){
	str = this.toStr(str);
	var crypto = require('crypto');
	var sha1 = crypto.createHash('sha1');
	sha1.update(str, 'utf8');
	return sha1.digest('hex');
}

},{"crypto":6}],34:[function(require,module,exports){
/**
 * 文字列型に置き換える
 */
module.exports = function(val){
    if( typeof(val) == typeof('') ){
        return val+'';
    }else if( val === undefined ){
        return '';
    }else if( val === null ){
        return '';
    }else if( typeof(val) == typeof(1.01) ){
        return val+'';
    }else if( typeof(val) == typeof(1) ){
        return val+'';
    }else if( typeof(val) == typeof([]) ){
        var rtn = '';
        for( var i in val ){
            rtn += this.toStr(val[i]);
        }
        return rtn;
    }
    return ''+val;
}

},{}],35:[function(require,module,exports){
/**
 * 文字列の前後から空白文字列を削除する
 */
module.exports = function(str){
	str = this.toStr(str);
	str = str.replace(/[\s]*$/, '');
	str = str.replace(/^[\s]*/, '');
	return str;
}

},{}],36:[function(require,module,exports){
/**
 * 入力値のセットを確認する
 * 内部で validator を使用します。
 * validator のAPI一覧 https://www.npmjs.com/package/validator を参照してください。
 */
module.exports = function(values, rules, callback){
    callback = callback || function(){};
    var err = null;
    var validator = require('validator');

    for( var key in rules ){
        var rule = rules[key];
        // console.log(values[key]);
        for( var idx in rule ){
            // console.log(idx);
            // console.log(rule[idx]);
            var currentRule = rule[idx];
            var errorMessage = 'ERROR on '+key;
            var isValid = null;

            errorMessage = currentRule[currentRule.length-1];
            delete(currentRule[currentRule.length-1]);

            var isNot = false;
            var method = currentRule.shift();
            if( method.match(new RegExp('^(\\!)?([\\s\\S]*)$')) ){
                isNot = (RegExp.$1 == '!' ? true : false );
                method = RegExp.$2;
            }
            currentRule.unshift(values[key]);
            isValid = validator[method].apply( undefined, currentRule );

            if( !isNot && !isValid || isNot && isValid ){
                // NGパターン
                if(err === null){
                    err = {};
                }
                err[key] = err[key] || [];
                err[key].push(errorMessage)
            }
        }
    }

    callback(err);
}

},{"validator":38}],37:[function(require,module,exports){
/**
 * node-iterate79
 */
(function(exports){

	/**
	 * 文字列型に置き換える
	 */
	exports.toStr = require('./apis/toStr.js');

	/**
	 * 文字列の前後から空白文字列を削除する
	 */
	exports.trim = require('./apis/trim.js');

	/**
	 * 配列(または連想配列)のキーの配列を取得する
	 */
	exports.array_keys = require('./apis/array_keys.js');

	/**
	 * 配列(または連想配列)の要素数を数える
	 */
	exports.count = require('./apis/count.js');

	/**
	 * base64エンコードする
	 */
	exports.base64_encode = require('./apis/base64_encode.js');

	/**
	 * base64デコードする
	 */
	exports.base64_decode = require('./apis/base64_decode.js');

	/**
	 * md5ハッシュを求める
	 */
	exports.md5 = require('./apis/md5.js');

	/**
	 * sha1ハッシュを求める
	 */
	exports.sha1 = require('./apis/sha1.js');

	/**
	 * ファイルが存在するか調べる
	 */
	exports.is_file = require('./apis/is_file.js');

	/**
	 * ディレクトリが存在するか調べる
	 */
	exports.is_dir = require('./apis/is_dir.js');

	/**
	 * パス文字列から、ファイル名を取り出す
	 */
	exports.basename = require('./apis/basename.js');

	/**
	 * ディレクトリ名を得る
	 */
	exports.dirname = require('./apis/dirname.js');

	/**
	 * パスを正規化する
	 */
	exports.normalize_path = require('./apis/normalize_path.js');

	/**
	 * 正規表現で使えるようにエスケープ処理を施す
	 */
	exports.regexp_quote = require('./apis/regexp_quote.js');

	/**
	 * 入力値のセットを確認する
	 */
	exports.validate = require('./apis/validate.js');

	/**
	 * 文字列をn文字ずつ分割する
	 */
	exports.divide = require('./apis/divide.js');

	/**
	 * HTML特殊文字をエスケープする
	 */
	exports.h = require('./apis/h.js');

})(exports);

},{"./apis/array_keys.js":20,"./apis/base64_decode.js":21,"./apis/base64_encode.js":22,"./apis/basename.js":23,"./apis/count.js":24,"./apis/dirname.js":25,"./apis/divide.js":26,"./apis/h.js":27,"./apis/is_dir.js":28,"./apis/is_file.js":29,"./apis/md5.js":30,"./apis/normalize_path.js":31,"./apis/regexp_quote.js":32,"./apis/sha1.js":33,"./apis/toStr.js":34,"./apis/trim.js":35,"./apis/validate.js":36}],38:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _toDate = require('./lib/toDate');

var _toDate2 = _interopRequireDefault(_toDate);

var _toFloat = require('./lib/toFloat');

var _toFloat2 = _interopRequireDefault(_toFloat);

var _toInt = require('./lib/toInt');

var _toInt2 = _interopRequireDefault(_toInt);

var _toBoolean = require('./lib/toBoolean');

var _toBoolean2 = _interopRequireDefault(_toBoolean);

var _equals = require('./lib/equals');

var _equals2 = _interopRequireDefault(_equals);

var _contains = require('./lib/contains');

var _contains2 = _interopRequireDefault(_contains);

var _matches = require('./lib/matches');

var _matches2 = _interopRequireDefault(_matches);

var _isEmail = require('./lib/isEmail');

var _isEmail2 = _interopRequireDefault(_isEmail);

var _isURL = require('./lib/isURL');

var _isURL2 = _interopRequireDefault(_isURL);

var _isMACAddress = require('./lib/isMACAddress');

var _isMACAddress2 = _interopRequireDefault(_isMACAddress);

var _isIP = require('./lib/isIP');

var _isIP2 = _interopRequireDefault(_isIP);

var _isFQDN = require('./lib/isFQDN');

var _isFQDN2 = _interopRequireDefault(_isFQDN);

var _isBoolean = require('./lib/isBoolean');

var _isBoolean2 = _interopRequireDefault(_isBoolean);

var _isAlpha = require('./lib/isAlpha');

var _isAlpha2 = _interopRequireDefault(_isAlpha);

var _isAlphanumeric = require('./lib/isAlphanumeric');

var _isAlphanumeric2 = _interopRequireDefault(_isAlphanumeric);

var _isNumeric = require('./lib/isNumeric');

var _isNumeric2 = _interopRequireDefault(_isNumeric);

var _isLowercase = require('./lib/isLowercase');

var _isLowercase2 = _interopRequireDefault(_isLowercase);

var _isUppercase = require('./lib/isUppercase');

var _isUppercase2 = _interopRequireDefault(_isUppercase);

var _isAscii = require('./lib/isAscii');

var _isAscii2 = _interopRequireDefault(_isAscii);

var _isFullWidth = require('./lib/isFullWidth');

var _isFullWidth2 = _interopRequireDefault(_isFullWidth);

var _isHalfWidth = require('./lib/isHalfWidth');

var _isHalfWidth2 = _interopRequireDefault(_isHalfWidth);

var _isVariableWidth = require('./lib/isVariableWidth');

var _isVariableWidth2 = _interopRequireDefault(_isVariableWidth);

var _isMultibyte = require('./lib/isMultibyte');

var _isMultibyte2 = _interopRequireDefault(_isMultibyte);

var _isSurrogatePair = require('./lib/isSurrogatePair');

var _isSurrogatePair2 = _interopRequireDefault(_isSurrogatePair);

var _isInt = require('./lib/isInt');

var _isInt2 = _interopRequireDefault(_isInt);

var _isFloat = require('./lib/isFloat');

var _isFloat2 = _interopRequireDefault(_isFloat);

var _isDecimal = require('./lib/isDecimal');

var _isDecimal2 = _interopRequireDefault(_isDecimal);

var _isHexadecimal = require('./lib/isHexadecimal');

var _isHexadecimal2 = _interopRequireDefault(_isHexadecimal);

var _isDivisibleBy = require('./lib/isDivisibleBy');

var _isDivisibleBy2 = _interopRequireDefault(_isDivisibleBy);

var _isHexColor = require('./lib/isHexColor');

var _isHexColor2 = _interopRequireDefault(_isHexColor);

var _isMD = require('./lib/isMD5');

var _isMD2 = _interopRequireDefault(_isMD);

var _isJSON = require('./lib/isJSON');

var _isJSON2 = _interopRequireDefault(_isJSON);

var _isNull = require('./lib/isNull');

var _isNull2 = _interopRequireDefault(_isNull);

var _isLength = require('./lib/isLength');

var _isLength2 = _interopRequireDefault(_isLength);

var _isByteLength = require('./lib/isByteLength');

var _isByteLength2 = _interopRequireDefault(_isByteLength);

var _isUUID = require('./lib/isUUID');

var _isUUID2 = _interopRequireDefault(_isUUID);

var _isMongoId = require('./lib/isMongoId');

var _isMongoId2 = _interopRequireDefault(_isMongoId);

var _isDate = require('./lib/isDate');

var _isDate2 = _interopRequireDefault(_isDate);

var _isAfter = require('./lib/isAfter');

var _isAfter2 = _interopRequireDefault(_isAfter);

var _isBefore = require('./lib/isBefore');

var _isBefore2 = _interopRequireDefault(_isBefore);

var _isIn = require('./lib/isIn');

var _isIn2 = _interopRequireDefault(_isIn);

var _isCreditCard = require('./lib/isCreditCard');

var _isCreditCard2 = _interopRequireDefault(_isCreditCard);

var _isISIN = require('./lib/isISIN');

var _isISIN2 = _interopRequireDefault(_isISIN);

var _isISBN = require('./lib/isISBN');

var _isISBN2 = _interopRequireDefault(_isISBN);

var _isMobilePhone = require('./lib/isMobilePhone');

var _isMobilePhone2 = _interopRequireDefault(_isMobilePhone);

var _isCurrency = require('./lib/isCurrency');

var _isCurrency2 = _interopRequireDefault(_isCurrency);

var _isISO = require('./lib/isISO8601');

var _isISO2 = _interopRequireDefault(_isISO);

var _isBase = require('./lib/isBase64');

var _isBase2 = _interopRequireDefault(_isBase);

var _isDataURI = require('./lib/isDataURI');

var _isDataURI2 = _interopRequireDefault(_isDataURI);

var _ltrim = require('./lib/ltrim');

var _ltrim2 = _interopRequireDefault(_ltrim);

var _rtrim = require('./lib/rtrim');

var _rtrim2 = _interopRequireDefault(_rtrim);

var _trim = require('./lib/trim');

var _trim2 = _interopRequireDefault(_trim);

var _escape = require('./lib/escape');

var _escape2 = _interopRequireDefault(_escape);

var _unescape = require('./lib/unescape');

var _unescape2 = _interopRequireDefault(_unescape);

var _stripLow = require('./lib/stripLow');

var _stripLow2 = _interopRequireDefault(_stripLow);

var _whitelist = require('./lib/whitelist');

var _whitelist2 = _interopRequireDefault(_whitelist);

var _blacklist = require('./lib/blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

var _isWhitelisted = require('./lib/isWhitelisted');

var _isWhitelisted2 = _interopRequireDefault(_isWhitelisted);

var _normalizeEmail = require('./lib/normalizeEmail');

var _normalizeEmail2 = _interopRequireDefault(_normalizeEmail);

var _toString = require('./lib/util/toString');

var _toString2 = _interopRequireDefault(_toString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var version = '5.7.0';

var validator = {
  version: version,
  toDate: _toDate2.default,
  toFloat: _toFloat2.default, toInt: _toInt2.default,
  toBoolean: _toBoolean2.default,
  equals: _equals2.default, contains: _contains2.default, matches: _matches2.default,
  isEmail: _isEmail2.default, isURL: _isURL2.default, isMACAddress: _isMACAddress2.default, isIP: _isIP2.default, isFQDN: _isFQDN2.default,
  isBoolean: _isBoolean2.default,
  isAlpha: _isAlpha2.default, isAlphanumeric: _isAlphanumeric2.default, isNumeric: _isNumeric2.default, isLowercase: _isLowercase2.default, isUppercase: _isUppercase2.default,
  isAscii: _isAscii2.default, isFullWidth: _isFullWidth2.default, isHalfWidth: _isHalfWidth2.default, isVariableWidth: _isVariableWidth2.default,
  isMultibyte: _isMultibyte2.default, isSurrogatePair: _isSurrogatePair2.default,
  isInt: _isInt2.default, isFloat: _isFloat2.default, isDecimal: _isDecimal2.default, isHexadecimal: _isHexadecimal2.default, isDivisibleBy: _isDivisibleBy2.default,
  isHexColor: _isHexColor2.default,
  isMD5: _isMD2.default,
  isJSON: _isJSON2.default,
  isNull: _isNull2.default,
  isLength: _isLength2.default, isByteLength: _isByteLength2.default,
  isUUID: _isUUID2.default, isMongoId: _isMongoId2.default,
  isDate: _isDate2.default, isAfter: _isAfter2.default, isBefore: _isBefore2.default,
  isIn: _isIn2.default,
  isCreditCard: _isCreditCard2.default,
  isISIN: _isISIN2.default, isISBN: _isISBN2.default,
  isMobilePhone: _isMobilePhone2.default,
  isCurrency: _isCurrency2.default,
  isISO8601: _isISO2.default,
  isBase64: _isBase2.default, isDataURI: _isDataURI2.default,
  ltrim: _ltrim2.default, rtrim: _rtrim2.default, trim: _trim2.default,
  escape: _escape2.default, unescape: _unescape2.default, stripLow: _stripLow2.default,
  whitelist: _whitelist2.default, blacklist: _blacklist2.default,
  isWhitelisted: _isWhitelisted2.default,
  normalizeEmail: _normalizeEmail2.default,
  toString: _toString2.default
};

exports.default = validator;
module.exports = exports['default'];
},{"./lib/blacklist":40,"./lib/contains":41,"./lib/equals":42,"./lib/escape":43,"./lib/isAfter":44,"./lib/isAlpha":45,"./lib/isAlphanumeric":46,"./lib/isAscii":47,"./lib/isBase64":48,"./lib/isBefore":49,"./lib/isBoolean":50,"./lib/isByteLength":51,"./lib/isCreditCard":52,"./lib/isCurrency":53,"./lib/isDataURI":54,"./lib/isDate":55,"./lib/isDecimal":56,"./lib/isDivisibleBy":57,"./lib/isEmail":58,"./lib/isFQDN":59,"./lib/isFloat":60,"./lib/isFullWidth":61,"./lib/isHalfWidth":62,"./lib/isHexColor":63,"./lib/isHexadecimal":64,"./lib/isIP":65,"./lib/isISBN":66,"./lib/isISIN":67,"./lib/isISO8601":68,"./lib/isIn":69,"./lib/isInt":70,"./lib/isJSON":71,"./lib/isLength":72,"./lib/isLowercase":73,"./lib/isMACAddress":74,"./lib/isMD5":75,"./lib/isMobilePhone":76,"./lib/isMongoId":77,"./lib/isMultibyte":78,"./lib/isNull":79,"./lib/isNumeric":80,"./lib/isSurrogatePair":81,"./lib/isURL":82,"./lib/isUUID":83,"./lib/isUppercase":84,"./lib/isVariableWidth":85,"./lib/isWhitelisted":86,"./lib/ltrim":87,"./lib/matches":88,"./lib/normalizeEmail":89,"./lib/rtrim":90,"./lib/stripLow":91,"./lib/toBoolean":92,"./lib/toDate":93,"./lib/toFloat":94,"./lib/toInt":95,"./lib/trim":96,"./lib/unescape":97,"./lib/util/toString":100,"./lib/whitelist":101}],39:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
var alpha = exports.alpha = {
  'en-US': /^[A-Z]+$/i,
  'cs-CZ': /^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+$/i,
  'de-DE': /^[A-ZÄÖÜß]+$/i,
  'es-ES': /^[A-ZÁÉÍÑÓÚÜ]+$/i,
  'fr-FR': /^[A-ZÀÂÆÇÉÈÊËÏÎÔŒÙÛÜŸ]+$/i,
  'nl-NL': /^[A-ZÉËÏÓÖÜ]+$/i,
  'hu-HU': /^[A-ZÁÉÍÓÖŐÚÜŰ]+$/i,
  'pl-PL': /^[A-ZĄĆĘŚŁŃÓŻŹ]+$/i,
  'pt-PT': /^[A-ZÃÁÀÂÇÉÊÍÕÓÔÚÜ]+$/i,
  'ru-RU': /^[А-ЯЁ]+$/i,
  'sr-RS@latin': /^[A-ZČĆŽŠĐ]+$/i,
  'sr-RS': /^[А-ЯЂЈЉЊЋЏ]+$/i,
  'tr-TR': /^[A-ZÇĞİıÖŞÜ]+$/i,
  ar: /^[ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيًٌٍَُِّْٰ]+$/
};

var alphanumeric = exports.alphanumeric = {
  'en-US': /^[0-9A-Z]+$/i,
  'cs-CZ': /^[0-9A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+$/i,
  'de-DE': /^[0-9A-ZÄÖÜß]+$/i,
  'es-ES': /^[0-9A-ZÁÉÍÑÓÚÜ]+$/i,
  'fr-FR': /^[0-9A-ZÀÂÆÇÉÈÊËÏÎÔŒÙÛÜŸ]+$/i,
  'hu-HU': /^[0-9A-ZÁÉÍÓÖŐÚÜŰ]+$/i,
  'nl-NL': /^[0-9A-ZÉËÏÓÖÜ]+$/i,
  'pl-PL': /^[0-9A-ZĄĆĘŚŁŃÓŻŹ]+$/i,
  'pt-PT': /^[0-9A-ZÃÁÀÂÇÉÊÍÕÓÔÚÜ]+$/i,
  'ru-RU': /^[0-9А-ЯЁ]+$/i,
  'sr-RS@latin': /^[0-9A-ZČĆŽŠĐ]+$/i,
  'sr-RS': /^[0-9А-ЯЂЈЉЊЋЏ]+$/i,
  'tr-TR': /^[0-9A-ZÇĞİıÖŞÜ]+$/i,
  ar: /^[٠١٢٣٤٥٦٧٨٩0-9ءآأؤإئابةتثجحخدذرزسشصضطظعغفقكلمنهوىيًٌٍَُِّْٰ]+$/
};

var englishLocales = exports.englishLocales = ['AU', 'GB', 'HK', 'IN', 'NZ', 'ZA', 'ZM'];

for (var locale, i = 0; i < englishLocales.length; i++) {
  locale = 'en-' + englishLocales[i];
  alpha[locale] = alpha['en-US'];
  alphanumeric[locale] = alphanumeric['en-US'];
}

alpha['pt-BR'] = alpha['pt-PT'];
alphanumeric['pt-BR'] = alphanumeric['pt-PT'];

// Source: http://www.localeplanet.com/java/
var arabicLocales = exports.arabicLocales = ['AE', 'BH', 'DZ', 'EG', 'IQ', 'JO', 'KW', 'LB', 'LY', 'MA', 'QM', 'QA', 'SA', 'SD', 'SY', 'TN', 'YE'];

for (var _locale, _i = 0; _i < arabicLocales.length; _i++) {
  _locale = 'ar-' + arabicLocales[_i];
  alpha[_locale] = alpha.ar;
  alphanumeric[_locale] = alphanumeric.ar;
}
},{}],40:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = blacklist;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function blacklist(str, chars) {
  (0, _assertString2.default)(str);
  return str.replace(new RegExp('[' + chars + ']+', 'g'), '');
}
module.exports = exports['default'];
},{"./util/assertString":98}],41:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = contains;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _toString = require('./util/toString');

var _toString2 = _interopRequireDefault(_toString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function contains(str, elem) {
  (0, _assertString2.default)(str);
  return str.indexOf((0, _toString2.default)(elem)) >= 0;
}
module.exports = exports['default'];
},{"./util/assertString":98,"./util/toString":100}],42:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = equals;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function equals(str, comparison) {
  (0, _assertString2.default)(str);
  return str === comparison;
}
module.exports = exports['default'];
},{"./util/assertString":98}],43:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
      value: true
});
exports.default = escape;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function escape(str) {
      (0, _assertString2.default)(str);
      return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\//g, '&#x2F;').replace(/`/g, '&#96;');
}
module.exports = exports['default'];
},{"./util/assertString":98}],44:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isAfter;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _toDate = require('./toDate');

var _toDate2 = _interopRequireDefault(_toDate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isAfter(str) {
  var date = arguments.length <= 1 || arguments[1] === undefined ? String(new Date()) : arguments[1];

  (0, _assertString2.default)(str);
  var comparison = (0, _toDate2.default)(date);
  var original = (0, _toDate2.default)(str);
  return !!(original && comparison && original > comparison);
}
module.exports = exports['default'];
},{"./toDate":93,"./util/assertString":98}],45:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isAlpha;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _alpha = require('./alpha');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isAlpha(str) {
  var locale = arguments.length <= 1 || arguments[1] === undefined ? 'en-US' : arguments[1];

  (0, _assertString2.default)(str);
  if (locale in _alpha.alpha) {
    return _alpha.alpha[locale].test(str);
  }
  throw new Error('Invalid locale \'' + locale + '\'');
}
module.exports = exports['default'];
},{"./alpha":39,"./util/assertString":98}],46:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isAlphanumeric;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _alpha = require('./alpha');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isAlphanumeric(str) {
  var locale = arguments.length <= 1 || arguments[1] === undefined ? 'en-US' : arguments[1];

  (0, _assertString2.default)(str);
  if (locale in _alpha.alphanumeric) {
    return _alpha.alphanumeric[locale].test(str);
  }
  throw new Error('Invalid locale \'' + locale + '\'');
}
module.exports = exports['default'];
},{"./alpha":39,"./util/assertString":98}],47:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isAscii;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-control-regex */
var ascii = /^[\x00-\x7F]+$/;
/* eslint-enable no-control-regex */

function isAscii(str) {
  (0, _assertString2.default)(str);
  return ascii.test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],48:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isBase64;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var notBase64 = /[^A-Z0-9+\/=]/i;

function isBase64(str) {
  (0, _assertString2.default)(str);
  var len = str.length;
  if (!len || len % 4 !== 0 || notBase64.test(str)) {
    return false;
  }
  var firstPaddingChar = str.indexOf('=');
  return firstPaddingChar === -1 || firstPaddingChar === len - 1 || firstPaddingChar === len - 2 && str[len - 1] === '=';
}
module.exports = exports['default'];
},{"./util/assertString":98}],49:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isBefore;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _toDate = require('./toDate');

var _toDate2 = _interopRequireDefault(_toDate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isBefore(str) {
  var date = arguments.length <= 1 || arguments[1] === undefined ? String(new Date()) : arguments[1];

  (0, _assertString2.default)(str);
  var comparison = (0, _toDate2.default)(date);
  var original = (0, _toDate2.default)(str);
  return !!(original && comparison && original < comparison);
}
module.exports = exports['default'];
},{"./toDate":93,"./util/assertString":98}],50:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isBoolean;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isBoolean(str) {
  (0, _assertString2.default)(str);
  return ['true', 'false', '1', '0'].indexOf(str) >= 0;
}
module.exports = exports['default'];
},{"./util/assertString":98}],51:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = isByteLength;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable prefer-rest-params */
function isByteLength(str, options) {
  (0, _assertString2.default)(str);
  var min = void 0;
  var max = void 0;
  if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
    min = options.min || 0;
    max = options.max;
  } else {
    // backwards compatibility: isByteLength(str, min [, max])
    min = arguments[1];
    max = arguments[2];
  }
  var len = encodeURI(str).split(/%..|./).length - 1;
  return len >= min && (typeof max === 'undefined' || len <= max);
}
module.exports = exports['default'];
},{"./util/assertString":98}],52:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isCreditCard;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable max-len */
var creditCard = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|(222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|6(?:011|5[0-9][0-9])[0-9]{12}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})|62[0-9]{14}$/;
/* eslint-enable max-len */

function isCreditCard(str) {
  (0, _assertString2.default)(str);
  var sanitized = str.replace(/[^0-9]+/g, '');
  if (!creditCard.test(sanitized)) {
    return false;
  }
  var sum = 0;
  var digit = void 0;
  var tmpNum = void 0;
  var shouldDouble = void 0;
  for (var i = sanitized.length - 1; i >= 0; i--) {
    digit = sanitized.substring(i, i + 1);
    tmpNum = parseInt(digit, 10);
    if (shouldDouble) {
      tmpNum *= 2;
      if (tmpNum >= 10) {
        sum += tmpNum % 10 + 1;
      } else {
        sum += tmpNum;
      }
    } else {
      sum += tmpNum;
    }
    shouldDouble = !shouldDouble;
  }
  return !!(sum % 10 === 0 ? sanitized : false);
}
module.exports = exports['default'];
},{"./util/assertString":98}],53:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isCurrency;

var _merge = require('./util/merge');

var _merge2 = _interopRequireDefault(_merge);

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function currencyRegex(options) {
  var symbol = '(\\' + options.symbol.replace(/\./g, '\\.') + ')' + (options.require_symbol ? '' : '?'),
      negative = '-?',
      whole_dollar_amount_without_sep = '[1-9]\\d*',
      whole_dollar_amount_with_sep = '[1-9]\\d{0,2}(\\' + options.thousands_separator + '\\d{3})*',
      valid_whole_dollar_amounts = ['0', whole_dollar_amount_without_sep, whole_dollar_amount_with_sep],
      whole_dollar_amount = '(' + valid_whole_dollar_amounts.join('|') + ')?',
      decimal_amount = '(\\' + options.decimal_separator + '\\d{2})?';
  var pattern = whole_dollar_amount + decimal_amount;

  // default is negative sign before symbol, but there are two other options (besides parens)
  if (options.allow_negatives && !options.parens_for_negatives) {
    if (options.negative_sign_after_digits) {
      pattern += negative;
    } else if (options.negative_sign_before_digits) {
      pattern = negative + pattern;
    }
  }

  // South African Rand, for example, uses R 123 (space) and R-123 (no space)
  if (options.allow_negative_sign_placeholder) {
    pattern = '( (?!\\-))?' + pattern;
  } else if (options.allow_space_after_symbol) {
    pattern = ' ?' + pattern;
  } else if (options.allow_space_after_digits) {
    pattern += '( (?!$))?';
  }

  if (options.symbol_after_digits) {
    pattern += symbol;
  } else {
    pattern = symbol + pattern;
  }

  if (options.allow_negatives) {
    if (options.parens_for_negatives) {
      pattern = '(\\(' + pattern + '\\)|' + pattern + ')';
    } else if (!(options.negative_sign_before_digits || options.negative_sign_after_digits)) {
      pattern = negative + pattern;
    }
  }

  /* eslint-disable prefer-template */
  return new RegExp('^' +
  // ensure there's a dollar and/or decimal amount, and that
  // it doesn't start with a space or a negative sign followed by a space
  '(?!-? )(?=.*\\d)' + pattern + '$');
  /* eslint-enable prefer-template */
}

var default_currency_options = {
  symbol: '$',
  require_symbol: false,
  allow_space_after_symbol: false,
  symbol_after_digits: false,
  allow_negatives: true,
  parens_for_negatives: false,
  negative_sign_before_digits: false,
  negative_sign_after_digits: false,
  allow_negative_sign_placeholder: false,
  thousands_separator: ',',
  decimal_separator: '.',
  allow_space_after_digits: false
};

function isCurrency(str, options) {
  (0, _assertString2.default)(str);
  options = (0, _merge2.default)(options, default_currency_options);
  return currencyRegex(options).test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98,"./util/merge":99}],54:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isDataURI;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var dataURI = /^\s*data:([a-z]+\/[a-z0-9\-\+]+(;[a-z\-]+=[a-z0-9\-]+)?)?(;base64)?,[a-z0-9!\$&',\(\)\*\+,;=\-\._~:@\/\?%\s]*\s*$/i; // eslint-disable-line max-len

function isDataURI(str) {
  (0, _assertString2.default)(str);
  return dataURI.test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],55:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isDate;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _isISO = require('./isISO8601');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function getTimezoneOffset(str) {
  var iso8601Parts = str.match(_isISO.iso8601);
  var timezone = void 0,
      sign = void 0,
      hours = void 0,
      minutes = void 0;
  if (!iso8601Parts) {
    str = str.toLowerCase();
    timezone = str.match(/(?:\s|gmt\s*)(-|\+)(\d{1,4})(\s|$)/);
    if (!timezone) {
      return str.indexOf('gmt') !== -1 ? 0 : null;
    }
    sign = timezone[1];
    var offset = timezone[2];
    if (offset.length === 3) {
      offset = '0' + offset;
    }
    if (offset.length <= 2) {
      hours = 0;
      minutes = parseInt(offset, 10);
    } else {
      hours = parseInt(offset.slice(0, 2), 10);
      minutes = parseInt(offset.slice(2, 4), 10);
    }
  } else {
    timezone = iso8601Parts[21];
    if (!timezone) {
      // if no hour/minute was provided, the date is GMT
      return !iso8601Parts[12] ? 0 : null;
    }
    if (timezone === 'z' || timezone === 'Z') {
      return 0;
    }
    sign = iso8601Parts[22];
    if (timezone.indexOf(':') !== -1) {
      hours = parseInt(iso8601Parts[23], 10);
      minutes = parseInt(iso8601Parts[24], 10);
    } else {
      hours = 0;
      minutes = parseInt(iso8601Parts[23], 10);
    }
  }
  return (hours * 60 + minutes) * (sign === '-' ? 1 : -1);
}

function isDate(str) {
  (0, _assertString2.default)(str);
  var normalizedDate = new Date(Date.parse(str));
  if (isNaN(normalizedDate)) {
    return false;
  }

  // normalizedDate is in the user's timezone. Apply the input
  // timezone offset to the date so that the year and day match
  // the input
  var timezoneOffset = getTimezoneOffset(str);
  if (timezoneOffset !== null) {
    var timezoneDifference = normalizedDate.getTimezoneOffset() - timezoneOffset;
    normalizedDate = new Date(normalizedDate.getTime() + 60000 * timezoneDifference);
  }

  var day = String(normalizedDate.getDate());
  var dayOrYear = void 0,
      dayOrYearMatches = void 0,
      year = void 0;
  // check for valid double digits that could be late days
  // check for all matches since a string like '12/23' is a valid date
  // ignore everything with nearby colons
  dayOrYearMatches = str.match(/(^|[^:\d])[23]\d([^T:\d]|$)/g);
  if (!dayOrYearMatches) {
    return true;
  }
  dayOrYear = dayOrYearMatches.map(function (digitString) {
    return digitString.match(/\d+/g)[0];
  }).join('/');

  year = String(normalizedDate.getFullYear()).slice(-2);
  if (dayOrYear === day || dayOrYear === year) {
    return true;
  } else if (dayOrYear === '' + day / year || dayOrYear === '' + year / day) {
    return true;
  }
  return false;
}
module.exports = exports['default'];
},{"./isISO8601":68,"./util/assertString":98}],56:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isDecimal;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var decimal = /^[-+]?([0-9]+|\.[0-9]+|[0-9]+\.[0-9]+)$/;

function isDecimal(str) {
  (0, _assertString2.default)(str);
  return str !== '' && decimal.test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],57:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isDivisibleBy;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _toFloat = require('./toFloat');

var _toFloat2 = _interopRequireDefault(_toFloat);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isDivisibleBy(str, num) {
  (0, _assertString2.default)(str);
  return (0, _toFloat2.default)(str) % parseInt(num, 10) === 0;
}
module.exports = exports['default'];
},{"./toFloat":94,"./util/assertString":98}],58:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isEmail;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _merge = require('./util/merge');

var _merge2 = _interopRequireDefault(_merge);

var _isByteLength = require('./isByteLength');

var _isByteLength2 = _interopRequireDefault(_isByteLength);

var _isFQDN = require('./isFQDN');

var _isFQDN2 = _interopRequireDefault(_isFQDN);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var default_email_options = {
  allow_display_name: false,
  allow_utf8_local_part: true,
  require_tld: true
};

/* eslint-disable max-len */
/* eslint-disable no-control-regex */
var displayName = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~\.\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~\.\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\s]*<(.+)>$/i;
var emailUserPart = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~]+$/i;
var quotedEmailUser = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f]))*$/i;
var emailUserUtf8Part = /^[a-z\d!#\$%&'\*\+\-\/=\?\^_`{\|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+$/i;
var quotedEmailUserUtf8 = /^([\s\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|(\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*$/i;
/* eslint-enable max-len */
/* eslint-enable no-control-regex */

function isEmail(str, options) {
  (0, _assertString2.default)(str);
  options = (0, _merge2.default)(options, default_email_options);

  if (options.allow_display_name) {
    var display_email = str.match(displayName);
    if (display_email) {
      str = display_email[1];
    }
  }

  var parts = str.split('@');
  var domain = parts.pop();
  var user = parts.join('@');

  var lower_domain = domain.toLowerCase();
  if (lower_domain === 'gmail.com' || lower_domain === 'googlemail.com') {
    user = user.replace(/\./g, '').toLowerCase();
  }

  if (!(0, _isByteLength2.default)(user, { max: 64 }) || !(0, _isByteLength2.default)(domain, { max: 256 })) {
    return false;
  }

  if (!(0, _isFQDN2.default)(domain, { require_tld: options.require_tld })) {
    return false;
  }

  if (user[0] === '"') {
    user = user.slice(1, user.length - 1);
    return options.allow_utf8_local_part ? quotedEmailUserUtf8.test(user) : quotedEmailUser.test(user);
  }

  var pattern = options.allow_utf8_local_part ? emailUserUtf8Part : emailUserPart;

  var user_parts = user.split('.');
  for (var i = 0; i < user_parts.length; i++) {
    if (!pattern.test(user_parts[i])) {
      return false;
    }
  }

  return true;
}
module.exports = exports['default'];
},{"./isByteLength":51,"./isFQDN":59,"./util/assertString":98,"./util/merge":99}],59:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isFDQN;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _merge = require('./util/merge');

var _merge2 = _interopRequireDefault(_merge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var default_fqdn_options = {
  require_tld: true,
  allow_underscores: false,
  allow_trailing_dot: false
};

function isFDQN(str, options) {
  (0, _assertString2.default)(str);
  options = (0, _merge2.default)(options, default_fqdn_options);

  /* Remove the optional trailing dot before checking validity */
  if (options.allow_trailing_dot && str[str.length - 1] === '.') {
    str = str.substring(0, str.length - 1);
  }
  var parts = str.split('.');
  if (options.require_tld) {
    var tld = parts.pop();
    if (!parts.length || !/^([a-z\u00a1-\uffff]{2,}|xn[a-z0-9-]{2,})$/i.test(tld)) {
      return false;
    }
  }
  for (var part, i = 0; i < parts.length; i++) {
    part = parts[i];
    if (options.allow_underscores) {
      part = part.replace(/_/g, '');
    }
    if (!/^[a-z\u00a1-\uffff0-9-]+$/i.test(part)) {
      return false;
    }
    if (/[\uff01-\uff5e]/.test(part)) {
      // disallow full-width chars
      return false;
    }
    if (part[0] === '-' || part[part.length - 1] === '-') {
      return false;
    }
  }
  return true;
}
module.exports = exports['default'];
},{"./util/assertString":98,"./util/merge":99}],60:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isFloat;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var float = /^(?:[-+]?(?:[0-9]+))?(?:\.[0-9]*)?(?:[eE][\+\-]?(?:[0-9]+))?$/;

function isFloat(str, options) {
  (0, _assertString2.default)(str);
  options = options || {};
  if (str === '' || str === '.') {
    return false;
  }
  return float.test(str) && (!options.hasOwnProperty('min') || str >= options.min) && (!options.hasOwnProperty('max') || str <= options.max);
}
module.exports = exports['default'];
},{"./util/assertString":98}],61:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fullWidth = undefined;
exports.default = isFullWidth;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fullWidth = exports.fullWidth = /[^\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/;

function isFullWidth(str) {
  (0, _assertString2.default)(str);
  return fullWidth.test(str);
}
},{"./util/assertString":98}],62:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.halfWidth = undefined;
exports.default = isHalfWidth;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var halfWidth = exports.halfWidth = /[\u0020-\u007E\uFF61-\uFF9F\uFFA0-\uFFDC\uFFE8-\uFFEE0-9a-zA-Z]/;

function isHalfWidth(str) {
  (0, _assertString2.default)(str);
  return halfWidth.test(str);
}
},{"./util/assertString":98}],63:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isHexColor;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hexcolor = /^#?([0-9A-F]{3}|[0-9A-F]{6})$/i;

function isHexColor(str) {
  (0, _assertString2.default)(str);
  return hexcolor.test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],64:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isHexadecimal;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var hexadecimal = /^[0-9A-F]+$/i;

function isHexadecimal(str) {
  (0, _assertString2.default)(str);
  return hexadecimal.test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],65:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isIP;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ipv4Maybe = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
var ipv6Block = /^[0-9A-F]{1,4}$/i;

function isIP(str) {
  var version = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

  (0, _assertString2.default)(str);
  version = String(version);
  if (!version) {
    return isIP(str, 4) || isIP(str, 6);
  } else if (version === '4') {
    if (!ipv4Maybe.test(str)) {
      return false;
    }
    var parts = str.split('.').sort(function (a, b) {
      return a - b;
    });
    return parts[3] <= 255;
  } else if (version === '6') {
    var blocks = str.split(':');
    var foundOmissionBlock = false; // marker to indicate ::

    // At least some OS accept the last 32 bits of an IPv6 address
    // (i.e. 2 of the blocks) in IPv4 notation, and RFC 3493 says
    // that '::ffff:a.b.c.d' is valid for IPv4-mapped IPv6 addresses,
    // and '::a.b.c.d' is deprecated, but also valid.
    var foundIPv4TransitionBlock = isIP(blocks[blocks.length - 1], 4);
    var expectedNumberOfBlocks = foundIPv4TransitionBlock ? 7 : 8;

    if (blocks.length > expectedNumberOfBlocks) {
      return false;
    }
    // initial or final ::
    if (str === '::') {
      return true;
    } else if (str.substr(0, 2) === '::') {
      blocks.shift();
      blocks.shift();
      foundOmissionBlock = true;
    } else if (str.substr(str.length - 2) === '::') {
      blocks.pop();
      blocks.pop();
      foundOmissionBlock = true;
    }

    for (var i = 0; i < blocks.length; ++i) {
      // test for a :: which can not be at the string start/end
      // since those cases have been handled above
      if (blocks[i] === '' && i > 0 && i < blocks.length - 1) {
        if (foundOmissionBlock) {
          return false; // multiple :: in address
        }
        foundOmissionBlock = true;
      } else if (foundIPv4TransitionBlock && i === blocks.length - 1) {
        // it has been checked before that the last
        // block is a valid IPv4 address
      } else if (!ipv6Block.test(blocks[i])) {
        return false;
      }
    }
    if (foundOmissionBlock) {
      return blocks.length >= 1;
    }
    return blocks.length === expectedNumberOfBlocks;
  }
  return false;
}
module.exports = exports['default'];
},{"./util/assertString":98}],66:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isISBN;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isbn10Maybe = /^(?:[0-9]{9}X|[0-9]{10})$/;
var isbn13Maybe = /^(?:[0-9]{13})$/;
var factor = [1, 3];

function isISBN(str) {
  var version = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

  (0, _assertString2.default)(str);
  version = String(version);
  if (!version) {
    return isISBN(str, 10) || isISBN(str, 13);
  }
  var sanitized = str.replace(/[\s-]+/g, '');
  var checksum = 0;
  var i = void 0;
  if (version === '10') {
    if (!isbn10Maybe.test(sanitized)) {
      return false;
    }
    for (i = 0; i < 9; i++) {
      checksum += (i + 1) * sanitized.charAt(i);
    }
    if (sanitized.charAt(9) === 'X') {
      checksum += 10 * 10;
    } else {
      checksum += 10 * sanitized.charAt(9);
    }
    if (checksum % 11 === 0) {
      return !!sanitized;
    }
  } else if (version === '13') {
    if (!isbn13Maybe.test(sanitized)) {
      return false;
    }
    for (i = 0; i < 12; i++) {
      checksum += factor[i % 2] * sanitized.charAt(i);
    }
    if (sanitized.charAt(12) - (10 - checksum % 10) % 10 === 0) {
      return !!sanitized;
    }
  }
  return false;
}
module.exports = exports['default'];
},{"./util/assertString":98}],67:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isISIN;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var isin = /^[A-Z]{2}[0-9A-Z]{9}[0-9]$/;

function isISIN(str) {
  (0, _assertString2.default)(str);
  if (!isin.test(str)) {
    return false;
  }

  var checksumStr = str.replace(/[A-Z]/g, function (character) {
    return parseInt(character, 36);
  });

  var sum = 0;
  var digit = void 0;
  var tmpNum = void 0;
  var shouldDouble = true;
  for (var i = checksumStr.length - 2; i >= 0; i--) {
    digit = checksumStr.substring(i, i + 1);
    tmpNum = parseInt(digit, 10);
    if (shouldDouble) {
      tmpNum *= 2;
      if (tmpNum >= 10) {
        sum += tmpNum + 1;
      } else {
        sum += tmpNum;
      }
    } else {
      sum += tmpNum;
    }
    shouldDouble = !shouldDouble;
  }

  return parseInt(str.substr(str.length - 1), 10) === (10000 - sum) % 10;
}
module.exports = exports['default'];
},{"./util/assertString":98}],68:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.iso8601 = undefined;

exports.default = function (str) {
  (0, _assertString2.default)(str);
  return iso8601.test(str);
};

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable max-len */
// from http://goo.gl/0ejHHW
var iso8601 = exports.iso8601 = /^([\+-]?\d{4}(?!\d{2}\b))((-?)((0[1-9]|1[0-2])(\3([12]\d|0[1-9]|3[01]))?|W([0-4]\d|5[0-2])(-?[1-7])?|(00[1-9]|0[1-9]\d|[12]\d{2}|3([0-5]\d|6[1-6])))([T\s]((([01]\d|2[0-3])((:?)[0-5]\d)?|24:?00)([\.,]\d+(?!:))?)?(\17[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3]):?([0-5]\d)?)?)?)?$/;
/* eslint-enable max-len */
},{"./util/assertString":98}],69:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = isIn;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _toString = require('./util/toString');

var _toString2 = _interopRequireDefault(_toString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isIn(str, options) {
  (0, _assertString2.default)(str);
  var i = void 0;
  if (Object.prototype.toString.call(options) === '[object Array]') {
    var array = [];
    for (i in options) {
      if ({}.hasOwnProperty.call(options, i)) {
        array[i] = (0, _toString2.default)(options[i]);
      }
    }
    return array.indexOf(str) >= 0;
  } else if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
    return options.hasOwnProperty(str);
  } else if (options && typeof options.indexOf === 'function') {
    return options.indexOf(str) >= 0;
  }
  return false;
}
module.exports = exports['default'];
},{"./util/assertString":98,"./util/toString":100}],70:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isInt;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var int = /^(?:[-+]?(?:0|[1-9][0-9]*))$/;
var intLeadingZeroes = /^[-+]?[0-9]+$/;

function isInt(str, options) {
  (0, _assertString2.default)(str);
  options = options || {};

  // Get the regex to use for testing, based on whether
  // leading zeroes are allowed or not.
  var regex = options.hasOwnProperty('allow_leading_zeroes') && options.allow_leading_zeroes ? intLeadingZeroes : int;

  // Check min/max
  var minCheckPassed = !options.hasOwnProperty('min') || str >= options.min;
  var maxCheckPassed = !options.hasOwnProperty('max') || str <= options.max;

  return regex.test(str) && minCheckPassed && maxCheckPassed;
}
module.exports = exports['default'];
},{"./util/assertString":98}],71:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = isJSON;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isJSON(str) {
  (0, _assertString2.default)(str);
  try {
    var obj = JSON.parse(str);
    return !!obj && (typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) === 'object';
  } catch (e) {/* ignore */}
  return false;
}
module.exports = exports['default'];
},{"./util/assertString":98}],72:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = isLength;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable prefer-rest-params */
function isLength(str, options) {
  (0, _assertString2.default)(str);
  var min = void 0;
  var max = void 0;
  if ((typeof options === 'undefined' ? 'undefined' : _typeof(options)) === 'object') {
    min = options.min || 0;
    max = options.max;
  } else {
    // backwards compatibility: isLength(str, min [, max])
    min = arguments[1];
    max = arguments[2];
  }
  var surrogatePairs = str.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || [];
  var len = str.length - surrogatePairs.length;
  return len >= min && (typeof max === 'undefined' || len <= max);
}
module.exports = exports['default'];
},{"./util/assertString":98}],73:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isLowercase;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isLowercase(str) {
  (0, _assertString2.default)(str);
  return str === str.toLowerCase();
}
module.exports = exports['default'];
},{"./util/assertString":98}],74:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isMACAddress;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var macAddress = /^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$/;

function isMACAddress(str) {
  (0, _assertString2.default)(str);
  return macAddress.test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],75:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isMD5;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var md5 = /^[a-f0-9]{32}$/;

function isMD5(str) {
  (0, _assertString2.default)(str);
  return md5.test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],76:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isMobilePhone;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable max-len */
var phones = {
  'ar-DZ': /^(\+?213|0)(5|6|7)\d{8}$/,
  'ar-SY': /^(!?(\+?963)|0)?9\d{8}$/,
  'ar-SA': /^(!?(\+?966)|0)?5\d{8}$/,
  'en-US': /^(\+?1)?[2-9]\d{2}[2-9](?!11)\d{6}$/,
  'cs-CZ': /^(\+?420)? ?[1-9][0-9]{2} ?[0-9]{3} ?[0-9]{3}$/,
  'de-DE': /^(\+?49[ \.\-])?([\(]{1}[0-9]{1,6}[\)])?([0-9 \.\-\/]{3,20})((x|ext|extension)[ ]?[0-9]{1,4})?$/,
  'da-DK': /^(\+?45)?(\d{8})$/,
  'el-GR': /^(\+?30)?(69\d{8})$/,
  'en-AU': /^(\+?61|0)4\d{8}$/,
  'en-GB': /^(\+?44|0)7\d{9}$/,
  'en-HK': /^(\+?852\-?)?[569]\d{3}\-?\d{4}$/,
  'en-IN': /^(\+?91|0)?[789]\d{9}$/,
  'en-NZ': /^(\+?64|0)2\d{7,9}$/,
  'en-ZA': /^(\+?27|0)\d{9}$/,
  'en-ZM': /^(\+?26)?09[567]\d{7}$/,
  'es-ES': /^(\+?34)?(6\d{1}|7[1234])\d{7}$/,
  'fi-FI': /^(\+?358|0)\s?(4(0|1|2|4|5)?|50)\s?(\d\s?){4,8}\d$/,
  'fr-FR': /^(\+?33|0)[67]\d{8}$/,
  'hu-HU': /^(\+?36)(20|30|70)\d{7}$/,
  'it-IT': /^(\+?39)?\s?3\d{2} ?\d{6,7}$/,
  'ja-JP': /^(\+?81|0)\d{1,4}[ \-]?\d{1,4}[ \-]?\d{4}$/,
  'ms-MY': /^(\+?6?01){1}(([145]{1}(\-|\s)?\d{7,8})|([236789]{1}(\s|\-)?\d{7}))$/,
  'nb-NO': /^(\+?47)?[49]\d{7}$/,
  'nl-BE': /^(\+?32|0)4?\d{8}$/,
  'nn-NO': /^(\+?47)?[49]\d{7}$/,
  'pl-PL': /^(\+?48)? ?[5-8]\d ?\d{3} ?\d{2} ?\d{2}$/,
  'pt-BR': /^(\+?55|0)\-?[1-9]{2}\-?[2-9]{1}\d{3,4}\-?\d{4}$/,
  'pt-PT': /^(\+?351)?9[1236]\d{7}$/,
  'ru-RU': /^(\+?7|8)?9\d{9}$/,
  'sr-RS': /^(\+3816|06)[- \d]{5,9}$/,
  'tr-TR': /^(\+?90|0)?5\d{9}$/,
  'vi-VN': /^(\+?84|0)?((1(2([0-9])|6([2-9])|88|99))|(9((?!5)[0-9])))([0-9]{7})$/,
  'zh-CN': /^(\+?0?86\-?)?1[345789]\d{9}$/,
  'zh-TW': /^(\+?886\-?|0)?9\d{8}$/
};
/* eslint-enable max-len */

// aliases
phones['en-CA'] = phones['en-US'];
phones['fr-BE'] = phones['nl-BE'];

function isMobilePhone(str, locale) {
  (0, _assertString2.default)(str);
  if (locale in phones) {
    return phones[locale].test(str);
  }
  return false;
}
module.exports = exports['default'];
},{"./util/assertString":98}],77:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isMongoId;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _isHexadecimal = require('./isHexadecimal');

var _isHexadecimal2 = _interopRequireDefault(_isHexadecimal);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isMongoId(str) {
  (0, _assertString2.default)(str);
  return (0, _isHexadecimal2.default)(str) && str.length === 24;
}
module.exports = exports['default'];
},{"./isHexadecimal":64,"./util/assertString":98}],78:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isMultibyte;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/* eslint-disable no-control-regex */
var multibyte = /[^\x00-\x7F]/;
/* eslint-enable no-control-regex */

function isMultibyte(str) {
  (0, _assertString2.default)(str);
  return multibyte.test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],79:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isNull;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isNull(str) {
  (0, _assertString2.default)(str);
  return str.length === 0;
}
module.exports = exports['default'];
},{"./util/assertString":98}],80:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isNumeric;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var numeric = /^[-+]?[0-9]+$/;

function isNumeric(str) {
  (0, _assertString2.default)(str);
  return numeric.test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],81:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isSurrogatePair;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var surrogatePair = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;

function isSurrogatePair(str) {
  (0, _assertString2.default)(str);
  return surrogatePair.test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],82:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isURL;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _isFQDN = require('./isFQDN');

var _isFQDN2 = _interopRequireDefault(_isFQDN);

var _isIP = require('./isIP');

var _isIP2 = _interopRequireDefault(_isIP);

var _merge = require('./util/merge');

var _merge2 = _interopRequireDefault(_merge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var default_url_options = {
  protocols: ['http', 'https', 'ftp'],
  require_tld: true,
  require_protocol: false,
  require_host: true,
  require_valid_protocol: true,
  allow_underscores: false,
  allow_trailing_dot: false,
  allow_protocol_relative_urls: false
};

var wrapped_ipv6 = /^\[([^\]]+)\](?::([0-9]+))?$/;

function isRegExp(obj) {
  return Object.prototype.toString.call(obj) === '[object RegExp]';
}

function checkHost(host, matches) {
  for (var i = 0; i < matches.length; i++) {
    var match = matches[i];
    if (host === match || isRegExp(match) && match.test(host)) {
      return true;
    }
  }
  return false;
}

function isURL(url, options) {
  (0, _assertString2.default)(url);
  if (!url || url.length >= 2083 || /\s/.test(url)) {
    return false;
  }
  if (url.indexOf('mailto:') === 0) {
    return false;
  }
  options = (0, _merge2.default)(options, default_url_options);
  var protocol = void 0,
      auth = void 0,
      host = void 0,
      hostname = void 0,
      port = void 0,
      port_str = void 0,
      split = void 0,
      ipv6 = void 0;

  split = url.split('#');
  url = split.shift();

  split = url.split('?');
  url = split.shift();

  split = url.split('://');
  if (split.length > 1) {
    protocol = split.shift();
    if (options.require_valid_protocol && options.protocols.indexOf(protocol) === -1) {
      return false;
    }
  } else if (options.require_protocol) {
    return false;
  } else if (options.allow_protocol_relative_urls && url.substr(0, 2) === '//') {
    split[0] = url.substr(2);
  }
  url = split.join('://');

  split = url.split('/');
  url = split.shift();

  if (url === '' && !options.require_host) {
    return true;
  }

  split = url.split('@');
  if (split.length > 1) {
    auth = split.shift();
    if (auth.indexOf(':') >= 0 && auth.split(':').length > 2) {
      return false;
    }
  }
  hostname = split.join('@');

  port_str = ipv6 = null;
  var ipv6_match = hostname.match(wrapped_ipv6);
  if (ipv6_match) {
    host = '';
    ipv6 = ipv6_match[1];
    port_str = ipv6_match[2] || null;
  } else {
    split = hostname.split(':');
    host = split.shift();
    if (split.length) {
      port_str = split.join(':');
    }
  }

  if (port_str !== null) {
    port = parseInt(port_str, 10);
    if (!/^[0-9]+$/.test(port_str) || port <= 0 || port > 65535) {
      return false;
    }
  }

  if (!(0, _isIP2.default)(host) && !(0, _isFQDN2.default)(host, options) && (!ipv6 || !(0, _isIP2.default)(ipv6, 6)) && host !== 'localhost') {
    return false;
  }

  host = host || ipv6;

  if (options.host_whitelist && !checkHost(host, options.host_whitelist)) {
    return false;
  }
  if (options.host_blacklist && checkHost(host, options.host_blacklist)) {
    return false;
  }

  return true;
}
module.exports = exports['default'];
},{"./isFQDN":59,"./isIP":65,"./util/assertString":98,"./util/merge":99}],83:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isUUID;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var uuid = {
  3: /^[0-9A-F]{8}-[0-9A-F]{4}-3[0-9A-F]{3}-[0-9A-F]{4}-[0-9A-F]{12}$/i,
  4: /^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  5: /^[0-9A-F]{8}-[0-9A-F]{4}-5[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i,
  all: /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i
};

function isUUID(str) {
  var version = arguments.length <= 1 || arguments[1] === undefined ? 'all' : arguments[1];

  (0, _assertString2.default)(str);
  var pattern = uuid[version];
  return pattern && pattern.test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],84:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isUppercase;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isUppercase(str) {
  (0, _assertString2.default)(str);
  return str === str.toUpperCase();
}
module.exports = exports['default'];
},{"./util/assertString":98}],85:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isVariableWidth;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _isFullWidth = require('./isFullWidth');

var _isHalfWidth = require('./isHalfWidth');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isVariableWidth(str) {
  (0, _assertString2.default)(str);
  return _isFullWidth.fullWidth.test(str) && _isHalfWidth.halfWidth.test(str);
}
module.exports = exports['default'];
},{"./isFullWidth":61,"./isHalfWidth":62,"./util/assertString":98}],86:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = isWhitelisted;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function isWhitelisted(str, chars) {
  (0, _assertString2.default)(str);
  for (var i = str.length - 1; i >= 0; i--) {
    if (chars.indexOf(str[i]) === -1) {
      return false;
    }
  }
  return true;
}
module.exports = exports['default'];
},{"./util/assertString":98}],87:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = ltrim;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ltrim(str, chars) {
  (0, _assertString2.default)(str);
  var pattern = chars ? new RegExp('^[' + chars + ']+', 'g') : /^\s+/g;
  return str.replace(pattern, '');
}
module.exports = exports['default'];
},{"./util/assertString":98}],88:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = matches;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function matches(str, pattern, modifiers) {
  (0, _assertString2.default)(str);
  if (Object.prototype.toString.call(pattern) !== '[object RegExp]') {
    pattern = new RegExp(pattern, modifiers);
  }
  return pattern.test(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],89:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = normalizeEmail;

var _isEmail = require('./isEmail');

var _isEmail2 = _interopRequireDefault(_isEmail);

var _merge = require('./util/merge');

var _merge2 = _interopRequireDefault(_merge);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var default_normalize_email_options = {
  lowercase: true,
  remove_dots: true,
  remove_extension: true
};

function normalizeEmail(email, options) {
  options = (0, _merge2.default)(options, default_normalize_email_options);
  if (!(0, _isEmail2.default)(email)) {
    return false;
  }
  var parts = email.split('@', 2);
  parts[1] = parts[1].toLowerCase();
  if (parts[1] === 'gmail.com' || parts[1] === 'googlemail.com') {
    if (options.remove_extension) {
      parts[0] = parts[0].split('+')[0];
    }
    if (options.remove_dots) {
      parts[0] = parts[0].replace(/\./g, '');
    }
    if (!parts[0].length) {
      return false;
    }
    parts[0] = parts[0].toLowerCase();
    parts[1] = 'gmail.com';
  } else if (options.lowercase) {
    parts[0] = parts[0].toLowerCase();
  }
  return parts.join('@');
}
module.exports = exports['default'];
},{"./isEmail":58,"./util/merge":99}],90:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = rtrim;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function rtrim(str, chars) {
  (0, _assertString2.default)(str);
  var pattern = chars ? new RegExp('[' + chars + ']') : /\s/;

  var idx = str.length - 1;
  while (idx >= 0 && pattern.test(str[idx])) {
    idx--;
  }

  return idx < str.length ? str.substr(0, idx + 1) : str;
}
module.exports = exports['default'];
},{"./util/assertString":98}],91:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = stripLow;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

var _blacklist = require('./blacklist');

var _blacklist2 = _interopRequireDefault(_blacklist);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function stripLow(str, keep_new_lines) {
  (0, _assertString2.default)(str);
  var chars = keep_new_lines ? '\\x00-\\x09\\x0B\\x0C\\x0E-\\x1F\\x7F' : '\\x00-\\x1F\\x7F';
  return (0, _blacklist2.default)(str, chars);
}
module.exports = exports['default'];
},{"./blacklist":40,"./util/assertString":98}],92:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = toBoolean;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function toBoolean(str, strict) {
  (0, _assertString2.default)(str);
  if (strict) {
    return str === '1' || str === 'true';
  }
  return str !== '0' && str !== 'false' && str !== '';
}
module.exports = exports['default'];
},{"./util/assertString":98}],93:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = toDate;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function toDate(date) {
  (0, _assertString2.default)(date);
  date = Date.parse(date);
  return !isNaN(date) ? new Date(date) : null;
}
module.exports = exports['default'];
},{"./util/assertString":98}],94:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = toFloat;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function toFloat(str) {
  (0, _assertString2.default)(str);
  return parseFloat(str);
}
module.exports = exports['default'];
},{"./util/assertString":98}],95:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = toInt;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function toInt(str, radix) {
  (0, _assertString2.default)(str);
  return parseInt(str, radix || 10);
}
module.exports = exports['default'];
},{"./util/assertString":98}],96:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = trim;

var _rtrim = require('./rtrim');

var _rtrim2 = _interopRequireDefault(_rtrim);

var _ltrim = require('./ltrim');

var _ltrim2 = _interopRequireDefault(_ltrim);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function trim(str, chars) {
  return (0, _rtrim2.default)((0, _ltrim2.default)(str, chars), chars);
}
module.exports = exports['default'];
},{"./ltrim":87,"./rtrim":90}],97:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
      value: true
});
exports.default = unescape;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function unescape(str) {
      (0, _assertString2.default)(str);
      return str.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#x2F;/g, '/').replace(/&#96;/g, '`');
}
module.exports = exports['default'];
},{"./util/assertString":98}],98:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = assertString;
function assertString(input) {
  if (typeof input !== 'string') {
    throw new TypeError('This library (validator.js) validates strings only');
  }
}
module.exports = exports['default'];
},{}],99:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = merge;
function merge() {
  var obj = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
  var defaults = arguments[1];

  for (var key in defaults) {
    if (typeof obj[key] === 'undefined') {
      obj[key] = defaults[key];
    }
  }
  return obj;
}
module.exports = exports['default'];
},{}],100:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

exports.default = toString;
function toString(input) {
  if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object' && input !== null) {
    if (typeof input.toString === 'function') {
      input = input.toString();
    } else {
      input = '[object Object]';
    }
  } else if (input === null || typeof input === 'undefined' || isNaN(input) && !input.length) {
    input = '';
  }
  return String(input);
}
module.exports = exports['default'];
},{}],101:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = whitelist;

var _assertString = require('./util/assertString');

var _assertString2 = _interopRequireDefault(_assertString);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function whitelist(str, chars) {
  (0, _assertString2.default)(str);
  return str.replace(new RegExp('[^' + chars + ']+', 'g'), '');
}
module.exports = exports['default'];
},{"./util/assertString":98}],102:[function(require,module,exports){
window.px = window.parent.main || window.opener.main;
window.main = window.parent.main || window.opener.main;
window.contApp = new (function( main ){
	var px = main;
	var _this = this;
	var it79 = require('iterate79');
	var utils79 = require('utils79');
	var php = require('phpjs');
	var _pj = px.getCurrentProject();
	var pickles2ContentsEditor; // px2ce client
	var realpathDataDir;
	var resizeTimer;
	var realpathThemeCollectionDir;

	var _param = px.utils.parseUriParam( window.location.href );

	function resizeEvent(){
		clearTimeout(resizeTimer);
		resizeTimer = setTimeout(function(){
			fitWindowSize(function(){
				if(pickles2ContentsEditor.redraw){
					pickles2ContentsEditor.redraw();
				}
			});
		}, 500);
		return;
	}
	function fitWindowSize(callback){
		callback = callback||function(){};
		callback();
		return;
	}

	function init(){
		it79.fnc({}, [
			function(it1, arg){
				if( window.opener && window.opener.main ){
					// サブウィンドウで開いた場合に、
					// 位置とサイズを opener と同じにする。
					window.moveTo(window.opener.screenX, window.opener.screenY);
					window.resizeTo(window.opener.outerWidth, window.opener.outerHeight);
				}
				it1.next(arg);
			},
			function(it1, arg){
				px.cancelDrop( window );
				fitWindowSize(function(){
					it1.next(arg);
				});
			},
			function(it1, arg){
				_pj.px2dthelperGetAll('/', {}, function(px2all){
					realpathDataDir = px2all.realpath_homedir+'_sys/ram/data/';
					it1.next(arg);
				});
				// console.log(arg);
			},
			function(it1, arg){
				if( _param.page_path ){
					arg.target_mode = 'page_content';
					arg.page_path = _param.page_path;
				}else if( _param.theme_id && _param.layout_id ){
					arg.target_mode = 'theme_layout';
					arg.page_path = require('path').resolve('/'+_param.theme_id+'/'+_param.layout_id+'.html');
				}
				// console.log(arg);
				it1.next(arg);
			},
			function(it1, arg){
				// クライアントリソースをロード
				_pj.execPx2(
					arg.page_path+'?PX=px2dthelper.px2ce.client_resources',
					{
						complete: function(resources){
							try{
								resources = JSON.parse(resources);
							}catch(e){
								console.error('Failed to parse JSON "client_resources".', e);
							}
							it79.ary(
								resources.css,
								function(it2, row, idx){
									var link = document.createElement('link');
									link.addEventListener('load', function(){
										it2.next();
									});
									$('head').append(link);
									link.rel = 'stylesheet';
									link.href = 'file://'+row;
								},
								function(){
									it79.ary(
										resources.js,
										function(it3, row, idx){
											var script = document.createElement('script');
											script.addEventListener('load', function(){
												it3.next();
											});
											$('head').append(script);
											script.src = 'file://'+row;
										},
										function(){
											it1.next(arg);
										}
									);
								}
							);

						}
					}
				);
			},
			function(it1, arg){
				pickles2ContentsEditor = new Pickles2ContentsEditor(); // px2ce client
				it1.next(arg);
			},
			function(it1, arg){
				if( arg.target_mode == 'theme_layout' ){
					_pj.px2dthelperGetRealpathThemeCollectionDir(function(result){
						realpathThemeCollectionDir = result;
						it1.next(arg);
					});
					return;
				}
				it1.next(arg);
			},
			function(it1, arg){

				var px2ceInitOptions = {};

				var _page_url = px.preview.getUrl( arg.page_path );
				var elmA = document.createElement('a');
				elmA.href = _page_url;
				var _page_origin = elmA.origin;
				if( arg.target_mode == 'theme_layout' ){
					px2ceInitOptions.target_mode = arg.target_mode;
				}

				pickles2ContentsEditor.init(
					{
						'target_mode': arg.target_mode,
						'page_path': arg.page_path , // <- 編集対象ページのパス
						'elmCanvas': document.getElementById('canvas'), // <- 編集画面を描画するための器となる要素
						'preview':{ // プレビュー用サーバーの情報を設定します。
							'origin': _page_origin
						},
						'customFields': _pj.mkBroccoliCustomFieldOptionFrontend(window, false),
						'lang': px.getDb().language,
						'gpiBridge': function(input, callback){
							// GPI(General Purpose Interface) Bridge
							// broccoliは、バックグラウンドで様々なデータ通信を行います。
							// GPIは、これらのデータ通信を行うための汎用的なAPIです。

							var realpathBroccoliUserStorageBaseDir = main.px2dtLDA.getAppDataDir('px2dt');

							if( input.api == "broccoliBridge" && input.forBroccoli && input.forBroccoli.api == "saveUserData" ){
								// userStorageの保存要求に対する対応
								console.log('userStorage の保存リクエストを受けました', input.forBroccoli.options, realpathBroccoliUserStorageBaseDir);
								try{
									_pj.appdata.writeCustomDataFile('broccoli-userstorage-modPaletteCondition', input.forBroccoli.options.modPaletteCondition, function(result){
										callback(result);
									});
								}catch(e){
									console.error(e);
									callback(false);
								}
								return;
							}

							// var testTimestamp = (new Date()).getTime();
							var tmpFileName = '__tmp_'+utils79.md5( Date.now() )+'.json';
							px.fs.writeFileSync( realpathDataDir+tmpFileName, JSON.stringify(input) );
							_pj.execPx2(
								arg.page_path+'?PX=px2dthelper.px2ce.gpi&appMode=desktop&target_mode='+encodeURIComponent(arg.target_mode)+'&data_filename='+encodeURIComponent( tmpFileName ),
								{
									complete: function(rtn){
										// console.log('--- returned(millisec)', (new Date()).getTime() - testTimestamp);
										new Promise(function(rlv){rlv();})
											.then(function(){ return new Promise(function(rlv, rjt){
												try{
													rtn = JSON.parse(rtn);
												}catch(e){
													console.error('Failed to parse JSON String -> ' + rtn);
												}
												rlv();
											}); })
											.then(function(){ return new Promise(function(rlv, rjt){
												if( input.api == "broccoliBridge" && input.forBroccoli && input.forBroccoli.api == "getBootupInfomations" ){
													// userStorageの情報を付加して返す。
													rtn.userData = rtn.userData || {};
													rtn.userData.modPaletteCondition = '{}';
													try{
														_pj.appdata.readCustomDataFile('broccoli-userstorage-modPaletteCondition', function(result){
															rtn.userData.modPaletteCondition = result;
															rlv();
														});
													}catch(e){
														console.error(e);
														rlv();
													}
													return;
												}
												rlv();
											}); })
											.then(function(){ return new Promise(function(rlv, rjt){
												px.fs.unlinkSync( realpathDataDir+tmpFileName );
												_pj.updateGitStatus(function(){});
												rlv();
											}); })
											.then(function(){ return new Promise(function(rlv, rjt){
												callback( rtn );
											}); })
										;
									}
								}
							);
							return;
						},
						'clipboard': px.clipboard,
						'complete': function(){
							if( window.opener && window.opener.main ){
								window.close();
								return;
							}
							window.parent.contApp.closeEditor();
						},
						'onClickContentsLink': function( url, data ){
							_page_url.match(new RegExp('^([a-zA-Z0-9]+\\:\\/\\/[^\\/]+\\/)'));
							var currentDomain = RegExp.$1;

							if( url.match( new RegExp(px.utils.escapeRegExp( currentDomain )) ) ){
								// プレビューサーバーのドメインと一致したら、通す。
							}else if( url.match( new RegExp('^(?:[a-zA-Z0-9]+\\:|\\/\\/)') ) ){
								alert('リンク先('+url+')は管理外のURLです。');
								return;
							}
							var to = url;
							var pathControot = px.preview.getUrl();
							to = to.replace( new RegExp( '^'+px.utils.escapeRegExp( pathControot ) ), '/' );
							to = to.replace( new RegExp( '^\\/+' ), '/' );

							if( to != arg.page_path ){
								if( !confirm( '"'+to+'" へ遷移しますか?' ) ){
									return;
								}
								window.parent.contApp.openEditor( to );
							}
						},
						'onMessage': function( message ){
							window.px2style.flashMessage(message);
						}
					},
					function(){
						// スタンバイ完了したら呼び出されるコールバックメソッドです。
						it1.next(arg);
					}
				);

			} ,
			function(it1, arg){
				px.progress.close();
				console.info('standby!!');
			}
		]);

		return;
	}

	$(function(){
		init();
	})
	$(window).on('resize', function(){
		resizeEvent();
	});

})( window.parent.main || window.opener.main );

},{"iterate79":14,"path":16,"phpjs":18,"utils79":37}]},{},[102])
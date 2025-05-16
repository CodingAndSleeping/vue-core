// 判断是否是 on+一个大写字母的格式开头
export const isOn = key => /^on[A-Z]/.test(key)

export const extend = Object.assign

export function isObject(val: any): val is Record<any, any> {
  return val !== null && typeof val === 'object'
}

export function isFunction(val: any): val is Function {
  return typeof val === 'function'
}

export function isString(val: any): val is string {
  return typeof val === 'string'
}

export function isArray(val: any): val is any[] {
  return Array.isArray(val)
}

export function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key)
}

export * from './shapeFlags'

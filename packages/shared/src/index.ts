export function isObject(val: any): val is Record<any, any> {
  return val !== null && typeof val === 'object'
}

export function isFunction(val: any): val is Function {
  return typeof val === 'function'
}

export const extend = Object.assign

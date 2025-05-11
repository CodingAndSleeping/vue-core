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

export const extend = Object.assign

export * from './shapeFlags'

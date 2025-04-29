// 这个文件会当我们打包 packages 目录下的源码

import minimist from 'minimist' // 解析命令行参数
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'
const __filename = fileURLToPath(import.meta.url) // 获取当前文件的绝对路径
const __dirname = dirname(__filename) // 获取当前文件的目录路径
const require = createRequire(import.meta.url) // 创建一个 require 函数

const args = minimist(process.argv.slice(2))

const target = args._[0] || 'reactivity' // 第一个参数是目标包名
const format = args.f || 'iife' // 第二个参数是打包后的模块规范
console.log(target, format)

// 入口文件，根据命令行传入进行打包
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`)
// packages.json 文件
const pkg = require(resolve(__dirname, `../packages/${target}/package.json`))

// 打包
esbuild
  .context({
    entryPoints: [entry], // 入口文件
    outfile: resolve(__dirname, `../packages/${target}/dist/${target}.js`), // 输出文件
    bundle: true, // 所有依赖打包成一个文件
    platform: 'browser', // 平台
    sourcemap: true, // 生成 sourceMap
    format, // cjs esm  iife
    globalName: pkg.buildOptions?.name, // 全局变量名
  })
  .then(ctx => {
    console.log('start build')

    return ctx.watch() // 监听文件变化 持续打包
  })

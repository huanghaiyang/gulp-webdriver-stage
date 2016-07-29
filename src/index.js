import through from 'through2'
import resolve from 'resolve'
import merge from 'deepmerge'
import path from 'path'
import gutil from 'gulp-util'
import _ from 'lodash'
import async from 'async'
import fs from 'graceful-fs'
import ev from 'eval'

const tmp = './tmp/'

module.exports = (options) => {
    return through.obj(function (file, encoding, callback) {
        if (!fs.existsSync(tmp)) {
            fs.mkdirSync(tmp)
        }
        let stream = this
        const webdriverPath = path.dirname(resolve.sync('webdriverio'))
        const Launcher = require(path.join(webdriverPath, 'lib/launcher'))
        const ConfigParser = require(path.join(webdriverPath, 'lib/utils/ConfigParser'))

        // 如果指定了stages属性
        if (!_.isUndefined(options.stages)) {
            // 必须为数组
            if (_.isArray(options.stages)) {
                // 配置解析器
                let configParser = new ConfigParser()

                let configs = merge(ev(file.contents.toString('utf8'), true).config, options)

                // test files
                let specs = configParser.getSpecs(configs.specs, configs.exclude)

                if (specs) {
                    let files = []
                    options.stages.forEach((item, index) => {
                        let configParser_ = new ConfigParser()
                        let stageSpecs = configParser_.getSpecs(_.isArray(item) ? item : [item], [])

                        stageSpecs.forEach((spec) => {
                            if (!_.includes(specs, spec)) {
                                process.nextTick(() => stream.emit('error', new gutil.PluginError('gulp-webdriver-stage', `无效测试文件 ${spec} , 所有stages中指定的测试文件必须在wdio配置文件中声明`, {
                                    showStack: false
                                })))
                            }
                            if (!_.isString(spec)) {
                                process.nextTick(() => stream.emit('error', new gutil.PluginError('gulp-webdriver-stage', `无效测试文件 ${spec} , 此处必须为文件路径字符串`, {
                                    showStack: false
                                })))
                            }
                        })

                        files[index] = stageSpecs
                    })

                    let preFiles = files.reduce((pre, next) => {
                        return pre.concat(next)
                    })

                    files[files.length] = specs.filter((item) => {
                        return !_.includes(preFiles, item)
                    })

                    async.eachOfLimit(files, 1, (item, key, cb) => {
                        key += 1
                            // 创建新的配置文件
                        let newFilename = tmp + 'wdio.config.' + new Date().getTime() + '.js'
                        let newConfigs = _.clone(configs)
                        newConfigs.specs = item
                        let newFileContent = 'exports.config=' + JSON.stringify(newConfigs)
                        fs.writeFileSync(newFilename, newFileContent)

                        let wdio = new Launcher(newFilename, options)

                        gutil.log(`开始执行第 ${key} 阶段测试`)
                        wdio.run().then(code => {
                            gutil.log(`第 ${key} 阶段测试退出, 任务状态码: ${code}`)
                            cb()
                        }, e => {
                            process.nextTick(() => stream.emit('error', new gutil.PluginError('gulp-webdriver-stage', `第 ${key} 阶段测试失败`, {
                                showStack: true
                            })))
                        })
                    }, (e) => {
                        if (e) {
                            process.stdin.pause()
                            process.nextTick(() => stream.emit('error', new gutil.PluginError('gulp-webdriver-stage', e, {
                                showStack: true
                            })))
                        } else {
                            callback()
                            process.nextTick(() => stream.emit('end'))
                        }
                    })
                }
            } else {
                process.nextTick(() => stream.emit('error', new gutil.PluginError('gulp-webdriver-stage', 'property stages type must be Array.', {
                    showStack: false
                })))
            }
        } else {
            let wdio = new Launcher(file.path, options)

            wdio.run().then(code => {
                process.stdin.pause()

                if (code !== 0) {
                    process.nextTick(() => stream.emit('error', new gutil.PluginError('gulp-webdriver-stage', `wdio exited with code ${code}`, {
                        showStack: false
                    })))
                }

                callback()
                process.nextTick(() => stream.emit('end'))
            }, e => {
                process.stdin.pause()
                process.nextTick(() => stream.emit('error', new gutil.PluginError('gulp-webdriver-stage', e, {
                    showStack: true
                })))
            })
        }

        return stream
    })
}

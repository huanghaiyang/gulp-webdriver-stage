# gulp-webdriver-stage
gulp-webdriver 阶段性测试功能扩展

# startup selenium-server
java -jar selenium-server-standalone-2.xx.jar -Dwebdriver.firefox.bin="C:\Program Files (x86)\Mozilla Firefox\firefox.exe"


# 使用方法
首先在wdio.conf.js 中配置需要测试的内容
```
specs: ['./test/specs/**/*.js'],
```
我们指定测试```./test/specs```下的所有js文件
此文件夹下共有如下几个文件:
+ ./test/specs/test_1.js
+ ./test/specs/test_2.js
+ ./test/specs/test_3.js
+ ./test/specs/test_5.js
+ ./test/specs/foo/test_4.js

继续配置Gruntfile.js
```
gulp.src(`${options.test}/wdio.*`)
.pipe(webdriver({
	logLevel: 'verbose',
	waitforTimeout: 12345,
	framework: 'mocha',
	// only for testing purposes
	cucumberOpts: {
		require: 'nothing'
	},
	stages: ['./test/specs/test_1.js', ['./test/specs/test_2.js', './test/specs/test_3.js'], './test/specs/foo/*.js' /*the last test file is ./test/specs/test_5.js*/ ] // webdriver test with 4 stages
}))
```

stages属性配置了webdriver需要阶段性测试的内容，以上共分为4个阶段

+ 第一阶段测试

```
./test/specs/test_1.js
```

+ 第二阶段测试

```
./test/specs/test_2.js
./test/specs/test_3.js
```

+ 第三阶段测试

```
./test/specs/foo/*.js
```

+ 第四阶段属于隐式声明，测试的内容是除去以上测试所剩下的所有未测内容

```
./test/specs/test_5.js
```

# note
it will be generate tmp files in folder ./tmp , please add the folder in your .gitignore

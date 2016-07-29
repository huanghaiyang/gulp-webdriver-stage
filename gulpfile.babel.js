import gulp from 'gulp'
import webdriver from './lib/index'

const options = {
	test: 'test'
}

gulp.task('test', () => {
	return gulp.src(`${options.test}/wdio.*`)
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
})
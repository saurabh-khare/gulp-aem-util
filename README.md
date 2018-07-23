
> Create  [AEM](https://helpx.adobe.com/support/experience-manager.html) client libraries from different sources


## Install

```
$ npm install --save aem-utils
```


## Usage

You need a config json file for aem-utils which it can use to generate AEM client library
Sample file:

```json
{
	"clientLibsConfig": {
		"clientLib1": {
			"js": [{
				"files": [
					"jquery-1.12.4.js",
					"bootstrap.3.3.5.min.js",
					"bootstrap-dialog.1.34.9.min.js"
				],
				"path": "dev/js"
			}, {
				"files": [
					"core.js"
				],
				"path": "dev/resources"
			}, {
				"files": [
					"demo.js"
				],
				"path": "dev/demo/resources"
			}],
			"css": [{
				"files": [
					"*.css",
					"32px.png",
				],
				"path": "dev/css/"
			}],
			"resources": [{
				"files": [
					"**/*",
					"!**/*.txt",
					"!**/*.psd",
					"!**/*.json"
				],
				"path": "dev/resources"
			}]
		},
		"clientLib2": {
			"js": [{
				"files": [
					"vendor.js"
				],
				"path": "dev/js/"
			}]
		},
		"clientLib3": {
			"js": [{
				"files": [
					"setup.js"
				],
				"path": "dev/js/"
			}],
			"embed": [
				"clientLib2"
			]
		}
	}
}
```json


```js
var aemUtils = require("aem-utils");

gulp.task("build-clientlibs", function () {
		return gulp.src("clconfig.json")
  	.pipe(aemUtils())
    .pipe(gulp.dest("../Users/skhare/dev/client-libs/"));
	});
	
```


## API

### read([options])

Generate client libraries for supplied client library configuration json file

#### options

Type: `Object`

##### root

Type: `string`<br>
Default: `/`

Set the root path to evaluate different relative path for library files





## License

MIT © [Saurabh Khare]

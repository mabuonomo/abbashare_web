
build: index.js
	@node_modules/.bin/babel index.js > build.js

test: build
	@node_modules/.bin/babel-node test.js

.PHONY: test


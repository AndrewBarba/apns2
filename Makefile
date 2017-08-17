lint:
	./node_modules/eslint/bin/eslint.js ./

test-all:
	@NODE_ENV=test \
	node --expose-http2 \
	./node_modules/.bin/_mocha \
	--slow 2000 \
	--timeout 20000 \
	./test/test.js

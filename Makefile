lint:
	./node_modules/eslint/bin/eslint.js ./

test-all:
	@NODE_ENV=test \
	./node_modules/.bin/mocha \
	--slow 2000 \
	--timeout 20000 \
	./test/test.js

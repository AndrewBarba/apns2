
default:
	npm install

clean:
	rm -rf node_modules
	npm cache clean

test-all:
	@NODE_ENV=test \
	node_modules/.bin/mocha \
	--slow 2000 \
	--timeout 20000 \
	./test/test.js

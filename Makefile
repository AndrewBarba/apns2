
default:
	npm install

clean:
	rm -rf node_modules
	npm cache clean

updates:
	npm outdated --depth 0

test-unit:
	@NODE_ENV=test \
	node_modules/.bin/mocha \
	--slow 2000 \
	--timeout 20000 \
	./test/unit

test-int:
	@NODE_ENV=test \
	node node_modules/.bin/mocha \
	--slow 2000 \
	--timeout 20000 \
	./test/integration

test-all: test-unit test-int

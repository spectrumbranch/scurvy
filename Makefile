test:
	./node_modules/.bin/mocha \
		$(find test -name '*test.js') \
        --reporter spec
install:
	npm install .
.PHONY: test

test:
	./node_modules/.bin/mocha \
		$(find test -name '*test.js') \
        --reporter list
install:
	npm install .
.PHONY: test
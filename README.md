"Intelligent" find and replace for require() calls

## Install

```
npm install -g require-and-replace
```

## Usage

```
require-and-replce <find> <replace>
```

Finds all `require()` calls for the given `<find>` module and
replaces them will require() calls for given `<replace>` module.

Relative module ids are resolved both when finding and
replacing. For example:

```
require-and-replace ./find ./dir/replace
```

will replace `require('../find')` with `require('./replace')`
in `./dir/example.js`.


## License

BSD

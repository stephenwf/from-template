![r](https://user-images.githubusercontent.com/8266711/34106451-286cde56-e3f0-11e7-8b8d-f1c197775d55.png)

![from-template](https://user-images.githubusercontent.com/8266711/34106471-3b2499b2-e3f0-11e7-92c7-53812f4753f4.gif)

[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fstephenwf%2Ffrom-template.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Fstephenwf%2Ffrom-template?ref=badge_shield) [![Coverage Status](https://coveralls.io/repos/github/stephenwf/from-template/badge.svg?branch=master)](https://coveralls.io/github/stephenwf/from-template?branch=master) [![Build Status](https://travis-ci.org/stephenwf/from-template.svg?branch=master)](https://travis-ci.org/stephenwf/from-template)

Install:
```bash
$ npm install from-template --save-dev
```

Usage:
```bash
$ from-template [my-package]
```
Where my-package is either a local template (see below), or
the name of an NPM package that exposes templates.

You can also pass options to avoid the prompt:
```
$ from-template [my-package] --name=Something
```

## Creating local templates
The structure of local templates from your project root:
```
├── .templates
│   └── my-template-name
│       ├── _template
│       │   └── src
│       │       └── nameOfFile.js
│       └── from-template.js
├── package.json
...
```
You can see an example in the [examples repository](https://github.com/stephenwf/from-template-examples)

You can have as many template folders under `.templates`, you
can also override installed templates, include them, and change
their configuration if required.

## from-template.js examples
Here are a few examples of possible from-template.js configurations.
You can see them in action in the [examples repository](https://github.com/stephenwf/from-template-examples).

If you want to try them out yourself, you can clone this repository, 
run `lerna bootstrap`. Then go into: `packages/demo-project` and
start running any of the npm scripts (see package.json) to generate
some components.

### Asking for user input
```javascript
module.exports = async function({ ask, packageJson, targetProject }) {  
  return { 
    /** The first argument can be used in the args (e.g. --name=SomeName) */
    name: await ask.input('name', 'Components name:')
  };
};
```

### Asking for user yes/no choice
```javascript
module.exports = async function({ ask, packageJson, targetProject }) {
  /** The first argument can be used in the args (e.g. --pure) */
  const type = await ask.bool('pure', 'Pure component?');

  return { 
    type: type ? 'Component' : 'PureComponent'
  };
};
```

### Multiple template directories
```javascript
module.exports = async function({ ask, packageJson, targetProject }) {
  const esVersion = await ask.choice('esVersion', 'Which version of JavaScript?', ['es5', 'es6']);

  return { 
    _template: esVersion, // es5 or es6
  };
};
```

This would require a folder structure like:
```
_template
├── es5
│   └── src
│       └── choiceA.js
└── es6
    └── src
        └── choiceB.js
```

**Note:** These examples use Node 8's async in these examples. Longer configurations
      could use Promise.all instead of async/await.
      
## JSON Configuration
Instead of using javascript for configuration, you can also specify a JSON file. This is 
less flexible, but arguably quicker to develop. The file lives in the root of the project
in the same place as the JS counter part.

### Full example:
from-template.json
```
{
  "name": {
    "$input": {
      "message": "What is the name of the component?"
    }
  },
  "type": {
    "$choice": {
      "message": "What is its type?",
      "choices": ["choiceA", "choiceB"]
    }
  },
  "isSomething": {
    "$bool": {
      "message": "A simple yes or no:",
      "$true": "Its true!",
      "$false": "Its false!"
    }
  }
}
```

## Creating vendor packages
In order to create a vendor package, you need the same structure
as the local templates, but with a package.json. You need this
repository as a dependency and the `_template` and `from-template.js` files
in your `"files"` key in package json. See the examples folder for
some examples.

Once you have published your package, the usage is exactly the same:

```
$ from-template [npm-name-of-package]
``` 

## ask API
When creating configurations you get passed a wrapper around enquire.js
that will populate default parameters from the CLI call.

This will prompt the user for one of several choices you pass in.
```
ask.choice(name: String, message: String, choices: String[]): String
```

ask.bool is a simple yes/no choice for the user, returning a boolean.
```
ask.bool(name: String, message: String, [ defaultValue: String ]): Boolean
```

ask.input will as the user for a line of text, returning a string
```
ask.input(name: String, message: Sting, [ defaultValue: String ]): String
```


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Fstephenwf%2Ffrom-template.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Fstephenwf%2Ffrom-template?ref=badge_large)

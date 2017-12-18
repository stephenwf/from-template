import path from 'path';
import fs from 'fs-extra';
import copy from 'copy-template-dir';
import findPlugins from 'find-plugins';
import chalk from 'chalk';
import Ask from './ask';

export function displayTotal(num, total) {
  if (!num || !total) return '';

  return ` (${num} of ${total})`;
}

export function chopName(name) {
  return name.indexOf('from-template-') === 0 ? name.slice('from-template-'.length) : name;
}

export async function findNpmPlugins() {
  const plugins = await findPlugins({
    filter: function(meta) {
      return /^from-template-/.test(meta.pkg.name);
    }
  });

  return plugins.map(plugin => ({
    value: plugin.pkg.name,
    name: chopName(plugin.pkg.name)
  }));
}

export async function findLocalPlugins() {
  const dir = fs.readdirSync(path.join(process.cwd(), '.templates'));
  return dir.map((dirName) => ({
    value: dirName,
    name: chopName(dirName)
  }));
}

function handleError(err) {
  console.log(err);
  process.exit(1);
}

export async function installFromTemplate(packageName, argv = {}, num, total) {
  const rootDirectory = getInputDirectory(packageName);
  const config = await getFromTemplateFile(rootDirectory, packageName).catch(handleError);
  const packageJson = getPackageJson();
  const ask = new Ask(argv);

  console.log('');
  console.log(`Installing${displayTotal(num, total)}: ${chalk.green(chopName(packageName))}`);

  const {_template, ...generatedConfig} = await Promise.resolve(config({
    ask,
    argv,
    packageJson,
    targetProject: process.cwd()
  })).catch(handleError);

  // Path to templates we want to install.
  const templatePath = getTemplateDirectory(rootDirectory, _template);
  const destination = process.cwd();
  // Create files.
  const createdFiles = await promiseCopy(templatePath, destination, generatedConfig).catch(handleError);

  createdFiles.forEach(filePath => console.log(`${chalk.green('+ Created')} ${path.relative(process.cwd(), filePath)}`));
  console.log('');
  console.log(chalk.green(`Template ${packageName} installed`));
}

export function configurePrettyError(pe) {
  pe.skipNodeFiles();
  pe.skipPackage('from-template');
  pe.skip(function(traceLine){
    if (traceLine.file === 'cli.js') {
      return true;
    }
  });
}

export async function promiseCopy(templatePath, destination, generatedConfig) {
  return new Promise(function(resolve, error) {
    copy(templatePath, destination, generatedConfig, (err, createdFiles) => {
      if (err) error(err);
      resolve(createdFiles);
    })
  })
}

export function getTemplateDirectory(inputDirectory, _template) {
  const inDir = _template ? path.join(inputDirectory, '_template', _template) : path.join(inputDirectory, '_template');
  if (canRead(inDir) === false) {
    throw new Error("Invalid from-template module, _template directory does not exist");
  }

  return inDir;
}

function parseConfigurationValue(name, config, {
  ask,
}) {
  if (
    typeof config !== 'object' ||
    Array.isArray(config)
  ) {
    throw new TypeError('Invalid JSON format for from-template configuration.');
  }

  const {
    $input,
    $choice,
    $bool
  } = config;

  if ($input) {
    return ask.input(name, $input.message, $input.defaultValue);
  }
  if ($choice) {
    return ask.choice(name, $choice.message, $choice.choices);
  }
  if ($bool) {
    return ask.bool(name, $bool.message, $bool.defaultValue).then(val => val ? $bool.$true : $bool.$false);
  }

  throw new TypeError('Invalid JSON format for from-template configuration, must contain either: $input, $choice or $bool fields.');
}

export function parseJsonConfiguration(json) {
  return async (options) => {
    const fields = Object.keys(json);

    return fields.reduce(async (futureState, fieldKey) => {
      const state = await futureState;
      const field = json[fieldKey];
      state[fieldKey] = await parseConfigurationValue(fieldKey, field, options);
      return state;
    }, Promise.resolve({}));
  }
}

export async function getFromTemplateFile(prefix, packageName) {
  const javascriptConfiguration = path.join(prefix, 'from-template.js');
  // JavaScript configuration first.
  if (canRead(javascriptConfiguration)) {
    return require(javascriptConfiguration);
  }

  // JSON configuration next.
  const jsonConfiguration = path.join(prefix, 'from-template.json');
  if (canRead(jsonConfiguration)) {
    return parseJsonConfiguration(require(jsonConfiguration));
  }

  throw new Error(`Cannot find configuration file in ${packageName}`);
}

export function canRead(file) {
  try {
    fs.accessSync(file, fs.constants.R_OK);
  } catch (err) {
    return false;
  }

  return true;
}

function resolveModuleQuiet(name) {
  try {
    return require.resolve(`${name}/from-template.js`);
  } catch (err) {
    try {
      return require.resolve(`${name}/from-template.json`);
    } catch (err) {
      return null;
    }
  }
}

export function getInputDirectory(packageName) {
  const localCopy = path.join(process.cwd(), '.templates', packageName);
  if (canRead(localCopy)) {
    return localCopy;
  }

  const moduleExists = resolveModuleQuiet(packageName);
  if (moduleExists) {
    const nodeModules = path.join(moduleExists, packageName);
    if (canRead(nodeModules)) {
      return nodeModules;
    }
  }

  const nodeModules = path.join(process.cwd(), 'node_modules', packageName);
  if (canRead(nodeModules)) {
    return nodeModules;
  }

  throw Error(`Cannot find from-template module '${packageName}'`);
}

export function getPackageJson() {
  try {
    return require(`${process.cwd()}/package.json`);
  } catch (e) {
    throw new Error('from-template should be called from an existing NPM project (with a package.json)');
  }
}

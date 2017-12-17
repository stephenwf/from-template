import path from 'path';
import fs from 'fs-extra';

export function configurePrettyError(pe) {
  pe.skipNodeFiles();
  pe.skipPackage('from-template');
  pe.skip(function(traceLine){
    if (traceLine.file === 'cli.js') {
      return true;
    }
  });
}

export function getTemplateDirectory(inputDirectory, _template) {
  const inDir = _template ? path.join(inputDirectory, '_template', _template) : path.join(inputDirectory, '_template');
  if (canRead(inDir) === false) {
    throw new Error("Invalid from-template module, _template directory does not exist");
  }
  return inDir;
}

export function getFromTemplateFile(prefix, packageName) {
  try {
    return require.resolve(path.join(prefix, 'from-template.js'));
  } catch (e) {
    throw new Error('Invalid from-template module, from-template.js file is required in root.');
  }
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
    return null;
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
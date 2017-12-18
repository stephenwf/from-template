import program from 'commander';
import copy from 'copy-template-dir';
import optimist from 'optimist';
import prettyError from 'pretty-error';
import path from 'path';
import fromTemplatePackageJson from '../package.json';
import chalk from 'chalk';
import Ask from './ask';
import {
  configurePrettyError,
  getFromTemplateFile,
  getInputDirectory,
  getPackageJson,
  getTemplateDirectory
} from './helpers';

configurePrettyError(prettyError.start());

function handleError(err) {
  console.log(err);
  process.exit(1);
}

program
    .version(fromTemplatePackageJson.version)
    .arguments('<package>')
    .action(async function (packageName) {
      const rootDirectory = getInputDirectory(packageName);
      const config = await getFromTemplateFile(rootDirectory, packageName).catch(handleError);
      const packageJson = getPackageJson();
      const argv = optimist.argv;
      const ask = new Ask(argv);

      const {_template, ...generatedConfig} = await Promise.resolve(config({
        ask,
        argv,
        packageJson,
        targetProject: process.cwd()
      })).catch(handleError);

      const templatePath = getTemplateDirectory(rootDirectory, _template);
      const destination = process.cwd();

      await copy(templatePath, destination, generatedConfig, (err, createdFiles) => {
        if (err) handleError(err);

        createdFiles.forEach(filePath => console.log(`${chalk.green('+ Created')} ${path.relative(process.cwd(), filePath)}`));
        console.log('');
        console.log(chalk.green(`Template ${packageName} installed`));
      });

    })
    .parse(process.argv);

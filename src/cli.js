import program from 'commander';
import optimist from 'optimist';
import prettyError from 'pretty-error';
import fromTemplatePackageJson from '../package.json';
import chalk from 'chalk';
import inquirer from 'inquirer-promise';
import {
  configurePrettyError,
  findLocalPlugins,
  findNpmPlugins,
  installFromTemplate,
} from './index';

configurePrettyError(prettyError.start());

program
    .version(fromTemplatePackageJson.version)
    .arguments('<package>')
    .action(async packageName => {
      await installFromTemplate(packageName, optimist.argv);
      process.exit(0);
    }).parse(process.argv);


if (typeof program.args[0] === 'undefined') {
  async function findAllPlugins() {

    const npmPlugins = await findNpmPlugins();
    const localPlugins = await findLocalPlugins();

    if (npmPlugins.length === 0 && localPlugins.length) {
      console.log(chalk.yellow('We didn\'t find any templates available to use.'));
      process.exit(0);
    }

    const separator = npmPlugins.length > 0 && localPlugins.length > 0 ? new inquirer.Separator() : null;

    const toInstall = await inquirer.checkbox('Which templates would you like to install?', {
      choices: [...npmPlugins, separator, ...localPlugins ].filter(e => e)
    });

    if (toInstall.length === 0) {
      process.exit(0);
    }

    let currentPackageNumber = 0;
    for (const packageName of toInstall) {
      currentPackageNumber += 1;
      await installFromTemplate(packageName, {}, currentPackageNumber, toInstall.length);
    }
  }

  findAllPlugins().then(() => {
    process.exit(0);
  });
}
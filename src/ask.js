import inquirer from "inquirer-promise";

export default class Ask {
  constructor(argv) {
    this.argv = argv;
  }

  choice(name, message, choices) {
    if (this.argv[name]) {
      if (choices.indexOf(this.argv[name]) === -1) {
        throw new RangeError(`Selected choice not valid [${choices.join(', ')}]`);
      }
      return this.argv[name];
    }

    return inquirer.question({
      type: 'list',
      message,
      choices,
    });
  }

  bool(name, message, defaultValue) {
    if (this.argv[name]) {
      return (
          this.argv[name] === 'y' ||
          this.argv[name] === 'Y' ||
          this.argv[name] === 'true' ||
          this.argv[name] === true
      );
    }

    return inquirer.question({
      type: 'confirm',
      message,
      default: defaultValue,
    });
  }

  input(name, message, defaultValue) {
    if (this.argv[name]) {
      return this.argv[name];
    }

    return inquirer.question({
      type: 'input',
      message,
      default: defaultValue,
    });
  }
}
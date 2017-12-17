
module.exports = async function({ask, packageJson, targetProject}) {

  return {
    _template: await ask.choice('type', 'Type of component', [
        'choiceA', 'choiceB'
    ]),
    name: await ask.input('name', 'Name of component:'),
  };
};
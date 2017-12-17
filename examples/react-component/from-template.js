function toPascal(s) {
  return s.replace(/(\w)(\w*)/g, (g0,g1,g2) => g1.toUpperCase() + g2.toLowerCase());
}

module.exports = async function({ask, packageJson, targetProject}) {
  const name = await ask.input('name', 'Name of component:');

  return {
    name,
    pascalName: toPascal(name),
    componentType: await ask.bool('pure', 'Is your component Pure?', true) ? 'PureComponent' : 'Component',
  };
};
module.exports = async function({ask}) {
  return {
    name: await ask.input('name', 'Name of component:'),
  };
};
var deployScript = async function (_) {
    console.log('Deploy script');
}

module.exports["default"] = deployScript;
deployScript.tags = ['third', 'all'];
deployScript.dependencies = ['first', 'second'];
const { join } = require('path');

module.exports = {
  use: [
    'neutrino-preset-node',
    (neutrino) => {
      neutrino.config
        .entry('run-fetch-job')
          .add(join(neutrino.options.source, 'runFetchJob.js'));
    }
  ]
};

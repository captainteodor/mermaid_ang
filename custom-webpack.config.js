// custom-webpack.config.js
const path = require('path');

module.exports = {
  resolve: {
    alias: {
      // This is the critical part - alias 'marked' to our adapter
      'marked': path.resolve(__dirname, 'src/app/utils/marked-adapter.js')
    }
  }
};

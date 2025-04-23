const path = require('path');

module.exports = {
  module: {
    rules: [
      {
        test: /\.ttf$/,
        use: ['file-loader']
      }
    ]
  },
  resolve: {
    alias: {
      // Redirect marked imports to our adapter
      'marked': path.resolve(__dirname, 'src/app/utils/marked-adapter.js')
    }
  }
};

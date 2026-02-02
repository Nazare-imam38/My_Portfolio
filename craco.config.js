module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Find the source-map-loader rule and modify it to ignore missing source maps
      const sourceMapLoader = webpackConfig.module.rules.find(
        (rule) => rule.enforce === 'pre' && rule.use && rule.use.some && rule.use.some(use => use.loader && use.loader.includes('source-map-loader'))
      );

      if (sourceMapLoader) {
        sourceMapLoader.exclude = /node_modules/;
      }

      // Alternative: Modify all rules that use source-map-loader
      webpackConfig.module.rules.forEach((rule) => {
        if (rule.use && Array.isArray(rule.use)) {
          rule.use.forEach((use) => {
            if (use.loader && use.loader.includes('source-map-loader')) {
              // Ignore source map errors
              use.options = use.options || {};
              use.options.filterSourceMappingUrl = () => false;
            }
          });
        }
      });

      // Ignore source map warnings
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map/,
      ];

      return webpackConfig;
    },
  },
};


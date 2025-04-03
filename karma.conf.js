module.exports = function(config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    files: [
      { pattern: "src/test.ts", watched: false },
      { pattern: "src/app/**/*.spec.ts", watched: false }
    ],
    preprocessors: {
      "src/app/**/*.ts": ["coverage"]
    },
    reporters: ["progress", "coverage"], 
    coverageReporter: {
      dir: "coverage/", 
      reporters: [
        { type: "html", subdir: "html" },
        { type: "lcovonly", subdir: "lcov" },
        { type: "text-summary" }
      ]
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ["ChromeHeadless"],
    singleRun: false,
    concurrency: Infinity
  });
};

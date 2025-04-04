const { default: lighthouse } = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const baseUrl = 'https://com668class.netlify.app';

const routes = [
  '/login',
  '/home',
  '/classes',
  '/classes/C001',
  '/classes/C001/assignments',
  '/classes/C001/exams',
  '/classes/C001/assignments/add-assignment',
  '/classes/C001/assignments/67dedd35441b28bc9b68fd64',
  '/exams/add-exam',
  '/exams/67dedd36441b28bc9b690c11',
  '/students/add-student',
  '/students',
  '/students/67ddd3fe9fd80c6179b957e7/edit-student',
  '/students/67ddd3fe9fd80c6179b957e7',
  '/account',
  '/reset-password',
  '/admin/create-teacher'
];

const reportsDir = path.resolve(__dirname, 'lighthouse-reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir);
}

// Keep 2 most recent reports 
function cleanupOldReports(reportDir, routeKey) {
  const allFiles = fs.readdirSync(reportDir);
  const matchingFiles = allFiles
    .filter(file => file.startsWith(routeKey) && (file.endsWith('.report.html') || file.endsWith('.report.json')))
    .map(file => ({
      file,
      time: fs.statSync(path.join(reportDir, file)).mtime
    }))
    .sort((a, b) => b.time - a.time);

  const filesToDelete = matchingFiles.slice(2); 
  for (const { file } of filesToDelete) {
    fs.unlinkSync(path.join(reportDir, file));
  }
}

(async () => {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: ['html', 'json'],
    port: chrome.port,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
  };

  const results = [];

  for (const route of routes) {
    const fullUrl = `${baseUrl}${route}`;
    console.log(`Running Lighthouse for: ${fullUrl}`);

    const runnerResult = await lighthouse(fullUrl, options);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
    const routeKey = `${baseUrl.replace(/^https?:\/\//, '').replace(/[\/:]/g, '_')}-${route.replace(/[\/:]/g, '_')}`;
    const safeRoute = `${routeKey}-${timestamp}`;

    cleanupOldReports(reportsDir, routeKey);

    const htmlPath = path.join(reportsDir, `${safeRoute}.report.html`);
    const jsonPath = path.join(reportsDir, `${safeRoute}.report.json`);

    fs.writeFileSync(htmlPath, runnerResult.report[0]);
    fs.writeFileSync(jsonPath, runnerResult.report[1]);

    const categories = runnerResult.lhr.categories;
    const summary = {
      url: fullUrl,
      isRepresentativeRun: runnerResult.lhr.configSettings.isRepresentativeRun,
      htmlPath: htmlPath,
      jsonPath: jsonPath,
      summary: {
        performance: categories.performance.score,
        accessibility: categories.accessibility.score,
        'best-practices': categories['best-practices'].score,
        seo: categories.seo.score
      }
    };

    results.push(summary);
    console.log(`✔ Report saved for ${fullUrl}`);
  }

  const summaryPath = path.join(reportsDir, 'lighthouse-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`All reports done. Summary saved to: ${summaryPath}`);

  await chrome.kill();
})();

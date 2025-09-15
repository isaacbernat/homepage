/**
 * Test report formatting and generation utilities
 * Provides unified reporting across all test modules
 */

const fs = require('fs');
const path = require('path');

function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Test report generator
 */
class ReportGenerator {
  constructor(options = {}) {
    this.reportDirectory = options.reportDirectory || './test-reports';
    this.ensureReportDirectory();
  }

  /**
   * Ensures the report directory exists
   */
  ensureReportDirectory() {
    if (!fs.existsSync(this.reportDirectory)) {
      fs.mkdirSync(this.reportDirectory, { recursive: true });
    }
  }

  /**
   * Generates a unified test report from multiple test results
   * @param {Array} testResults - Array of test result objects
   * @returns {Object} Unified test report
   */
  generateUnifiedReport(testResults) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalModules: testResults.length,
        passedModules: 0,
        failedModules: 0,
        skippedModules: 0,
        totalDuration: 0,
      },
      modules: {},
      recommendations: [],
    };

    // Process each test result
    for (const result of testResults) {
      report.modules[result.module] = result;
      report.summary.totalDuration += result.duration || 0;

      switch (result.status) {
        case 'passed':
          report.summary.passedModules++;
          break;
        case 'failed':
          report.summary.failedModules++;
          if (result.details && result.details.recommendations) {
            report.recommendations.push(...result.details.recommendations);
          }
          break;
        case 'skipped':
          report.summary.skippedModules++;
          break;
      }
    }

    // Overall status
    report.summary.overallStatus =
      report.summary.failedModules > 0 ? 'failed' : 'passed';

    return report;
  }

  /**
   * Saves report in JSON format
   * @param {Object} report - Test report object
   * @param {string} filename - Output filename
   */
  saveJsonReport(report, filename = 'test-report.json') {
    const filePath = path.join(this.reportDirectory, filename);
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
    console.log(`JSON report saved to: ${filePath}`);
  }

  /**
   * Saves report in HTML format
   * @param {Object} report - Test report object
   * @param {string} filename - Output filename
   */
  saveHtmlReport(report, filename = 'test-report.html') {
    const html = this.generateHtmlReport(report);
    const filePath = path.join(this.reportDirectory, filename);
    fs.writeFileSync(filePath, html);
    console.log(`HTML report saved to: ${filePath}`);
  }

  /**
   * Generates HTML report content
   * @param {Object} report - Test report object
   * @returns {string} HTML content
   */
  generateHtmlReport(report) {
    const statusColor =
      report.summary.overallStatus === 'passed' ? '#28a745' : '#dc3545';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Report - ${report.timestamp}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { background: ${statusColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .content { padding: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #495057; }
        .summary-card .value { font-size: 2em; font-weight: bold; color: #007bff; }
        .module { margin-bottom: 30px; border: 1px solid #dee2e6; border-radius: 6px; }
        .module-header { background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6; }
        .module-content { padding: 15px; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-skipped { color: #6c757d; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin-top: 20px; }
        .recommendations h3 { margin-top: 0; color: #856404; }
        .recommendations ul { margin: 0; padding-left: 20px; }
        .recommendations li { margin-bottom: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Test Report</h1>
            <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
            <p>Overall Status: <strong>${report.summary.overallStatus.toUpperCase()}</strong></p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="summary-card">
                    <h3>Total Modules</h3>
                    <div class="value">${report.summary.totalModules}</div>
                </div>
                <div class="summary-card">
                    <h3>Passed</h3>
                    <div class="value status-passed">${report.summary.passedModules}</div>
                </div>
                <div class="summary-card">
                    <h3>Failed</h3>
                    <div class="value status-failed">${report.summary.failedModules}</div>
                </div>
                <div class="summary-card">
                    <h3>Duration</h3>
                    <div class="value">${Math.round(report.summary.totalDuration / 1000)}s</div>
                </div>
            </div>

            ${Object.entries(report.modules)
              .map(
                ([moduleName, moduleResult]) => `
                <div class="module">
                    <div class="module-header">
                        <h2>${moduleName} <span class="status-${moduleResult.status}">${moduleResult.status.toUpperCase()}</span></h2>
                        <p>Duration: ${Math.round((moduleResult.duration || 0) / 1000)}s</p>
                    </div>
                    <div class="module-content">
                        ${
                          moduleResult.details
                            ? `
                            <p><strong>Tests Run:</strong> ${moduleResult.details.testsRun || 'N/A'}</p>
                            <p><strong>Tests Passed:</strong> ${moduleResult.details.testsPassed || 'N/A'}</p>
                            <p><strong>Tests Failed:</strong> ${moduleResult.details.testsFailed || 'N/A'}</p>
                            ${
                              moduleResult.details.violations &&
                              moduleResult.details.violations.length > 0
                                ? `
                                <h4>Violations:</h4>
                                <ul>
                                ${moduleResult.details.violations.map((violation) => `<li>${escapeHtml(violation)}</li>`).join('')}
                                </ul>
                            `
                                : ''
                            }
                        `
                            : '<p>No detailed results available</p>'
                        }
                    </div>
                </div>
            `,
              )
              .join('')}

            ${
              report.recommendations.length > 0
                ? `
                <div class="recommendations">
                    <h3>Recommendations</h3>
                    <ul>
                    ${report.recommendations.map((rec) => `<li>${escapeHtml(rec)}</li>`).join('')}
                    </ul>
                </div>
            `
                : ''
            }
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Prints console report
   * @param {Object} report - Test report object
   */
  printConsoleReport(report) {
    console.log('\n' + '='.repeat(60));
    console.log('TEST REPORT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Generated: ${new Date(report.timestamp).toLocaleString()}`);
    console.log(
      `Overall Status: ${report.summary.overallStatus.toUpperCase()}`,
    );
    console.log(
      `Total Duration: ${Math.round(report.summary.totalDuration / 1000)}s`,
    );
    console.log('');
    console.log(
      `Modules: ${report.summary.totalModules} total, ${report.summary.passedModules} passed, ${report.summary.failedModules} failed, ${report.summary.skippedModules} skipped`,
    );
    console.log('');

    // Module details
    for (const [moduleName, moduleResult] of Object.entries(report.modules)) {
      const statusSymbol =
        moduleResult.status === 'passed'
          ? '✓'
          : moduleResult.status === 'failed'
            ? '✗'
            : '○';
      console.log(
        `${statusSymbol} ${moduleName}: ${moduleResult.status.toUpperCase()} (${Math.round((moduleResult.duration || 0) / 1000)}s)`,
      );

      if (
        moduleResult.details &&
        moduleResult.details.violations &&
        moduleResult.details.violations.length > 0
      ) {
        moduleResult.details.violations.forEach((violation) => {
          console.log(`  - ${violation}`);
        });
      }
    }

    // Recommendations
    if (report.recommendations.length > 0) {
      console.log('\nRECOMMENDATIONS:');
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    console.log('='.repeat(60));
  }
}

module.exports = ReportGenerator;

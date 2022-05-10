const os = require('os');
const exec = require('child_process').exec;
const puppeteer = require('puppeteer-extra');
const req = require('request-promise');
const fs = require('fs');
const bowserjr = require('@dp6/penguin-datalayer-core');
let resultsArray = [];

/* PDF Make */
const pdfMake = require('pdfmake');
const fonts = require('./pdf_configs/pdfMake_fonts.json');
const printer = new pdfMake(fonts);
let docDefinition = require('./pdf_configs/docDefinition.json');
/* PDF Make */

// Add stealth plugin and use defaults (all tricks to hide puppeteer usage).
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
puppeteer.use(AdblockerPlugin({ useCache: false }));

const config_file = process.argv.slice(2)[0]
  ? process.argv.slice(2)[0]
  : new Error(
      'File not specified as start param. Please inform the filename with its extension as --file in start script.'
    );

// Defining export extension based on export option extracted from command line params.
let filenamePDF = `${new Date().getTime()}.pdf`;

const configFile = require(`./config/${config_file}`);
configFile.validator.forEach(async (config) => {
  const schema = require(`./schema/${config.schema_name[0]}`);

  (async () => {
    const browser = await puppeteer.launch({ headless: false });
    let page = await browser.newPage();

    // Configure the navigation timeout
    await page.setDefaultNavigationTimeout(0);

    if (config.gtmPreviewModeURL) await page.goto(config.gtmPreviewModeURL);

    if (config.mobile_enabled === true) {
      await page.emulate(iPhone);
    } else {
      await page.setViewport({ width: 1366, height: 768 });
    }

    await page.exposeFunction('bowser', (event) => {
      bowserjr.validate(schema, event, function (result) {
        resultsArray.push(result[0]);
      });
    });

    async function runAfterGTMDebug() {
      page.on('load', async () => {
        await page.waitFor(2000);
        if (page.url() === config.url) {
          docDefinition.content[3].text = `Url validating:  ${page.url()}`;
          await page.evaluate(() => {
            //Validate first hits.
            window.dataLayer.forEach((elem) => {
              bowser(elem);
            });
            window.dataLayer.push_c = window.dataLayer.push;
            window.dataLayer.push = function (obj) {
              window.dataLayer.push_c(obj);
              bowser(obj);
            };
          });
          if (config.browserClose) {
            config.time ? await page.waitFor(config.time) : await page.waitFor(0);
            await browser.close();
          }
        } else {
          docDefinition.content.push(`Path :  ${page.url()}`);
        }
      });

      await page.goto(config.url);
    }

    await runAfterGTMDebug();

    let pdfCreate = () => {
      bowserjr.validate(schema, {}, function (result) {
        resultsArray.push(result[0]);
      });

      resultsArray.forEach((resultObject) => {
        if (resultObject) {
          resultObject.dataLayerObject = resultObject.dataLayerObject.replace(/(\r\n|\n|\r)/gm, '');
          resultObject.dataLayerObject = resultObject.dataLayerObject.replace(/\s/g, '');
          resultObject.dataLayerObject = resultObject.dataLayerObject.split(',').join(' ');
          //docDefinition.content.push(`${resultObject.status}, ${resultObject.message}, ${resultObject.dataLayerObject}`);
          docDefinition.content[6].table.body.push([
            {
              text: `${resultObject.status}`,
              alignment: 'center',
            },
            {
              text: `${resultObject.message}`,
              alignment: 'center',
            },
            {
              text: `${resultObject.dataLayerObject}`,
            },
          ]);
        }
      });

      /* Função Obrigatoria */
      pdfMake.tableLayouts = {
        exampleLayout: {
          hLineWidth: function (i, node) {
            if (i === 0 || i === node.table.body.length) {
              return 0;
            }
            return i === node.table.headerRows ? 2 : 1;
          },
          vLineWidth: function (i) {
            return 0;
          },
          hLineColor: function (i) {
            return i === 1 ? 'black' : '#aaa';
          },
          paddingLeft: function (i) {
            return i === 0 ? 0 : 8;
          },
          paddingRight: function (i, node) {
            return i === node.table.widths.length - 1 ? 0 : 8;
          },
        },
      };
      /* ****************** */
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      pdfDoc.pipe(fs.createWriteStream(`results/${filenamePDF}`));
      pdfDoc.end();
    };

    browser.on('disconnected', pdfCreate);
  })();
});

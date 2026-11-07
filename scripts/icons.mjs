// Render toolbar icons (full-bleed) from extension/logo.svg. The 128px store icon is made by store-assets.mjs.
import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const logo='data:image/svg+xml;base64,'+(await fs.readFile('extension/logo.svg')).toString('base64');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
for(const size of [16,32,48]){const page=await browser.newPage({viewport:{width:size,height:size}});await page.setContent(`<body style="margin:0;background:transparent"><img src="${logo}" width="${size}" height="${size}" style="display:block"></body>`);await page.locator('img').evaluate(img=>img.decode());await page.screenshot({path:`extension/icons/icon-${size}.png`,omitBackground:true});}
await browser.close();

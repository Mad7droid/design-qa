import {test} from 'node:test';
import assert from 'node:assert/strict';
import {markdown,zip} from '../extension/report.js';
import {writeFileSync} from 'node:fs';
test('report includes portable evidence paths and preserves multiline observations',()=>{
 const output=markdown({name:'Checkout review',links:['https://figma.com/file/x'],id:'session-1',createdAt:'2026-10-31',findings:[{id:'finding-1',component:'Button',severity:'High',capturedAt:'now',pageTitle:'Checkout',url:'https://example.com/checkout',componentSource:'DOM',comment:'Too small.\nExpected 44px.',links:['https://example.com/spec'],selector:'button[data-label="```"]',specs:{'font-size':'12px'}}]});
 assert.match(output,/screenshots\/finding-1.png/);assert.match(output,/Too small\.\nExpected 44px\./);assert.match(output,/````/);assert.match(output,/font-size/);assert.match(output,/## Reference links\n\n- Figma: <https:\/\/figma.com\/file\/x>/);assert.match(output,/### Links\n\n- Link: <https:\/\/example.com\/spec>/);
});
test('ZIP has correct archive records and supports unicode',async()=>{
 const blob=zip([{name:'report.md',data:'# Review'},{name:'screenshots/é.png',data:new Uint8Array([1,2,3])}]);
 const bytes=new Uint8Array(await blob.arrayBuffer());const view=new DataView(bytes.buffer);assert.equal(view.getUint32(0,true),0x04034b50);assert.equal(view.getUint32(bytes.length-22,true),0x06054b50);assert.equal(view.getUint16(bytes.length-14,true),2);writeFileSync('/tmp/hyper-design-qa-test.zip',bytes);
});

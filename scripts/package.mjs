import {readdir,readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=path.resolve('extension'),manifest=JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8'));
if(!/^\d+(\.\d+){0,3}$/.test(manifest.version)||manifest.description.length>132)throw new Error('Invalid store manifest metadata.');
const files=[];
async function walk(dir=''){for(const item of await readdir(path.join(root,dir),{withFileTypes:true})){if(item.name==='.DS_Store')continue;const relative=path.join(dir,item.name);if(item.isDirectory())await walk(relative);else {if(item.isSymbolicLink()||!['.js','.html','.css','.svg','.png','.json'].includes(path.extname(relative)))throw new Error('Unexpected runtime file: '+relative);files.push(relative);}}}
await walk();
for(const file of [manifest.background.service_worker,manifest.side_panel.default_path,...Object.values(manifest.icons),...Object.values(manifest.action.default_icon)])if(!files.includes(file))throw new Error('Missing manifest asset: '+file);
await mkdir('.context/release',{recursive:true});
const output=path.resolve(`.context/release/hyper-spec-${manifest.version}.zip`);
const script=`import sys,json,zipfile,os\nroot,out=sys.argv[1:3]\nfiles=json.loads(sys.stdin.read())\nwith zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as archive:\n for name in files:\n  info=zipfile.ZipInfo(name.replace(os.sep,'/'),date_time=(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16\n  archive.writestr(info,open(os.path.join(root,name),'rb').read())\n`;
const result=spawnSync('python3',['-c',script,root,output],{input:JSON.stringify(files.sort()),encoding:'utf8'});if(result.status!==0)throw new Error(result.stderr);
const hash=createHash('sha256').update(await readFile(output)).digest('hex');await writeFile(output+'.sha256',hash+'  '+path.basename(output)+'\n');console.log(`${output}\n${files.length} runtime files\nSHA256 ${hash}`);

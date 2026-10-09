const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/1/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const out = path.resolve(__dirname, '../artifacts');
const W=960,H=600,N=120;
const proj=(x,z)=>[W/2+x*240/z, 300+600/z];
const num=x=>x.toFixed(2);
function floor(t){
 let a=[`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><linearGradient id="steel" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#16181a"/><stop offset=".28" stop-color="#c7cbcd"/><stop offset=".45" stop-color="#72777a"/><stop offset=".9" stop-color="#191b1d"/></linearGradient><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop stop-color="black"/><stop offset=".3" stop-color="#08090a"/><stop offset="1" stop-color="#111316"/></linearGradient></defs><rect width="960" height="600" fill="black"/><path d="M0 335H960V600H0Z" fill="url(#fade)"/>`];
 const phase=(t*.55)%.55;
 // Transverse bars approach the camera: perspective naturally enlarges spacing and thickness.
 for(let k=40;k>=0;k--){let z=1.6+k*.55-phase;if(z<1.8||z>18)continue;let y=proj(0,z)[1],d=22/z;
 a.push(`<rect x="-10" y="${num(y)}" width="980" height="${num(d)}" rx="${num(d/2)}" fill="url(#steel)"/>`);
 for(let x=-12;x<=12;x+=.14){let px=proj(x,z)[0];a.push(`<path d="M${num(px)} ${num(y+1)}l${num(4/z)} ${num(d-2)}" stroke="#131517" stroke-width="${num(Math.max(.35,2/z))}"/><path d="M${num(px+1.4)} ${num(y+1)}l${num(4/z)} ${num(d-2)}" stroke="#a6aaae" stroke-width="${num(Math.max(.2,.8/z))}"/>`);}
 }
 // Longitudinal rods, with moving ribs and tapered cylindrical highlights.
 for(let x=-7.15;x<=7.16;x+=.55){
 const p1=proj(x-.045,18),p2=proj(x+.045,18),p3=proj(x+.045,1.8),p4=proj(x-.045,1.8);
 a.push(`<path d="M${p1}L${p2}L${p3}L${p4}Z" fill="#44494d" stroke="#101214" stroke-width="1"/>`);
 const shades=['#292d30','#6d7378','#c6cbcf','#92989d','#51575b','#25292c'];
 for(let j=0;j<6;j++){let off=-.042+j*.014;let b=proj(x+off,18),c=proj(x+off+.014,18),d=proj(x+off+.014,1.8),e=proj(x+off,1.8);a.push(`<path d="M${b}L${c}L${d}L${e}Z" fill="${shades[j]}"/>`);}
 for(let k=250;k>=0;k--){let z=1.7+k*.066-(t*.55)%.066;if(z<1.85||z>18)continue;let l=proj(x-.049,z+.010),r=proj(x+.049,z-.010);a.push(`<path d="M${l}L${r}" stroke="#d4d7d9" stroke-width="${num(Math.max(.32,1.7/z))}"/><path d="M${l[0]} ${l[1]+1.2/z}L${r[0]} ${r[1]+1.2/z}" stroke="#080a0c" stroke-width="${num(Math.max(.35,2.4/z))}"/>`);}
 }
 a.push('</svg>');return Buffer.from(a.join(''));
}
async function main(){
 fs.mkdirSync(out,{recursive:true});
 const machine=await sharp(process.argv[2]).trim().resize({width:530}).png().toBuffer();
 const meta=await sharp(machine).metadata();
 const frames=[];
 for(let i=0;i<N;i++){
   const t=i/20;
   const frame=await sharp(floor(t)).composite([{input:machine,left:215+Math.round(1.2*Math.sin(t*Math.PI*2/3)),top:470-meta.height+Math.round(1.5*Math.sin(t*Math.PI*4))}]).removeAlpha().raw().toBuffer();
   frames.push(frame);
   if(i===30)await sharp(frame,{raw:{width:W,height:H,channels:3}}).png().toFile(path.join(out,'rebar_forward_clean_preview.png'));
   if(i%20===0)console.log(`Rendered ${i}/${N}`);
 }
 const raw=Buffer.concat(frames),opts={raw:{width:W,height:H*N,channels:3,pageHeight:H},limitInputPixels:false};
 await sharp(raw,opts).webp({quality:83,effort:3,loop:0,delay:Array(N).fill(50)}).toFile(path.join(out,'rebar_forward_clean.webp'));
 await sharp(raw,opts).resize({width:720}).gif({effort:3,loop:0,delay:Array(N).fill(50),colours:128,dither:0.5}).toFile(path.join(out,'rebar_forward_clean.gif'));
 console.log(await sharp(path.join(out,'rebar_forward_clean.webp'),{animated:true}).metadata());
}
main().catch(e=>{console.error(e);process.exit(1)});


const FEES=[["licenseFee","লাইসেন্স / নবায়ন ফি"],["signboardFee","সাইনবোর্ড ফি"],["miscFee","বিবিধ ও আবেদন ফি"],["arrear","বকেয়া"],["currentSurcharge","চলতি সারচার্জ"],["surcharge","সারচার্জ"],["vat","ভ্যাট"],["vatArrear","ভ্যাট বকেয়া"],["incomeTax","আয়কর"],["incomeTaxArrear","আয়কর বকেয়া"]];
const KEY="licenseRecords.local.v1";
let base=[],local=[],editingNo=null;
const $=s=>document.querySelector(s);

/* helpers */
const bn2en=s=>String(s||"").replace(/[০-৯]/g,d=>"০১২৩৪৫৬৭৮৯".indexOf(d));
const norm=s=>bn2en(s).trim().toLowerCase().replace(/\s+/g,"");
const digits=s=>norm(s).replace(/\D/g,"");
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=n=>(Number(n)||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtDate=d=>{if(!d)return"-";const p=d.split("-");return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:d};
const total=r=>FEES.reduce((s,[k])=>s+(Number(r.fees?.[k])||0),0);
const keyOf=r=>digits(r.licenseNo)||norm(r.licenseNo);

function merged(){
  const map=new Map();
  base.forEach(r=>map.set(keyOf(r),{...r,_src:"file"}));
  local.forEach(r=>map.set(keyOf(r),{...r,_src:"local"}));
  return [...map.values()];
}
function saveLocal(){try{localStorage.setItem(KEY,JSON.stringify(local))}catch(e){}}
function loadLocal(){try{local=JSON.parse(localStorage.getItem(KEY)||"[]")}catch(e){local=[]}}

/* load */
async function loadBase(){
  loadLocal();
  try{const r=await fetch("data.json?"+Date.now());base=await r.json()}catch(e){base=[]}
}
function findRecord(q){
  const qn=norm(q),qd=digits(q);
  return merged().filter(r=>keyOf(r)===qd||norm(r.licenseNo)===qn||norm(r.licenseId)===qn||(qd&&digits(r.licenseId)===qd));
}
/* কোন তথ্য সবাই (লগইন ছাড়া) দেখতে পাবে — false মানে শুধু লগইন করা ব্যক্তি দেখবে */
const PUBLIC_SHOW={ownerName:true,fatherName:true,motherName:true,spouseName:true,nid:true,mobile:true};
const OWNER_FIELDS=[["ownerName","মালিকের নাম"],["fatherName","পিতার নাম"],["motherName","মাতার নাম"],["spouseName","স্বামী / স্ত্রীর নাম"],["nid","জাতীয় পরিচয়পত্র নং"],["mobile","মোবাইল নম্বর"]];
const _loggedIn=()=>sessionStorage.getItem("licAuth")==="1";
function ownerHTML(r){
  const rows=OWNER_FIELDS.filter(([k])=>_loggedIn()||PUBLIC_SHOW[k]).map(([k,l])=>`<tr><td>${l}</td><td>${esc(r[k]||"-")}</td></tr>`).join("");
  return rows?`<section class="card"><h2>মালিকের তথ্য</h2><table>${rows}</table></section>`:"";
}
/* search */
function expiryStatus(r){
  if(!r.expiryDate)return"";
  const ok=new Date(r.expiryDate+"T23:59:59")>=new Date();
  return `<span class="status ${ok?"ok":"bad"}">${ok?"মেয়াদ বহাল":"মেয়াদ উত্তীর্ণ"}</span>`;
}
function recordHTML(r){
  return `
  <section class="card"><h2>লাইসেন্স তথ্য ${expiryStatus(r)}</h2><table>
    <tr><td>লাইসেন্স নং</td><td>${esc(r.licenseNo)}</td></tr>
    <tr><td>লাইসেন্স আইডি</td><td>${esc(r.licenseId||"-")}</td></tr>
    <tr><td>ইস্যুর তারিখ</td><td>${fmtDate(r.issueDate)}</td></tr>
    <tr><td>নবায়ন বছর</td><td>${esc(r.renewYear||"-")}</td></tr>
    <tr><td>নবায়নের তারিখ</td><td>${fmtDate(r.renewDate)}</td></tr>
    <tr><td>মেয়াদ শেষ</td><td>${fmtDate(r.expiryDate)}</td></tr></table></section>
  <section class="card"><h2>প্রতিষ্ঠানের তথ্য</h2><table>
    <tr><td>প্রতিষ্ঠানের নাম</td><td>${esc(r.businessName)}</td></tr>
    <tr><td>ব্যবসার ধরন</td><td>${esc(r.businessType||"-")}</td></tr>
    <tr><td>ওয়ার্ড</td><td>${esc(r.ward||"-")}</td></tr>
    <tr><td>ঠিকানা</td><td>${esc(r.address||"-")}</td></tr></table></section>
  ${ownerHTML(r)}
  <section class="card"><h2>ফি সংক্রান্ত তথ্য</h2><table>
    ${FEES.map(([k,l])=>`<tr><td>${l}</td><td class="num">${money(r.fees?.[k])}</td></tr>`).join("")}
    <tr class="total"><td>মোট</td><td class="num">${money(total(r))}</td></tr></table></section>`;
}

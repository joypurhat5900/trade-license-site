/* লগইন সেটিং — পাসওয়ার্ড বদলাতে make-password.html খুলে নতুন লাইন বসান */
const AUTH_SALT="lic-v1";
const AUTH_HASH="98e2a02828951f1f5b0e19f4b106186dcec519e98d7338ea4eb1af456e3284ad";

async function sha256(s){
  const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");
}
async function makeHash(user,pass){return sha256(AUTH_SALT+":"+user.trim()+":"+pass)}
async function tryLogin(user,pass){
  const ok=(await makeHash(user,pass))===AUTH_HASH;
  if(ok)sessionStorage.setItem("licAuth","1");
  return ok;
}
const isLoggedIn=()=>sessionStorage.getItem("licAuth")==="1";
function logout(){sessionStorage.removeItem("licAuth");location.reload()}

/* সুরক্ষিত পেজের জন্য: লগইন না থাকলে login.html এ পাঠায় */
function guard(){
  if(isLoggedIn())return;
  const here=location.pathname.split("/").pop()||"index.html";
  location.replace("login.html?next="+encodeURIComponent(here+location.search));
}

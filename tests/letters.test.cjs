const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createHandler}=require('../api/letters.js');
const env={LETTER_SITE_ORIGIN:'https://journal.example',RESEND_API_KEY:'test',LETTER_TO_EMAIL:'recipient@example.com',LETTER_FROM_EMAIL:'sender@example.com',TURNSTILE_SITE_KEY:'test',TURNSTILE_SECRET_KEY:'test'};
const body={message:'A lovely book.',name:'Reader',email:'reader@example.com',type:'A simple hello',consent:true,website:'',requestId:'12345678-1234-4123-8123-123456789012',token:'test'};
async function run(overrides={},fetchImpl=async()=>{throw Error('Unexpected provider call');},configuration=env){
 const res={setHeader(){},status(code){this.code=code;return this;},json(data){this.data=data;}};
 await createHandler({env:configuration,fetchImpl})({method:'POST',headers:{origin:env.LETTER_SITE_ORIGIN,'content-type':'application/json'},body,...overrides},res);return res;
}
test('unconfigured delivery fails closed and reveals no recipient',async()=>{const r=await run({method:'GET'},undefined,{});assert.deepEqual(r.data,{ready:false,siteKey:null});assert.equal((await run({},undefined,{})).code,503);});
test('foreign origin and invalid consent never contact providers',async()=>{assert.equal((await run({headers:{origin:'https://other.example'}})).code,403);assert.equal((await run({body:{...body,consent:false}})).code,400);});
test('verification failure prevents email',async()=>{let count=0;const r=await run({},async()=>{count++;return {ok:true,json:async()=>({success:false})};});assert.equal(r.code,403);assert.equal(count,1);});
test('accepted letter reaches configured recipient and retries use identical keys',async()=>{const sent=[];const fetcher=async(url,options)=>{if(url.includes('siteverify'))return {ok:true,json:async()=>({success:true,hostname:'journal.example',action:'letter'})};sent.push(options);return {ok:true,json:async()=>({id:'message-id'})};};assert.equal((await run({},fetcher)).code,202);assert.equal((await run({},fetcher)).code,202);assert.equal(sent[0].headers['Idempotency-Key'],sent[1].headers['Idempotency-Key']);const payload=JSON.parse(sent[0].body);assert.deepEqual(payload.to,[env.LETTER_TO_EMAIL]);assert.equal(payload.reply_to,body.email);assert.ok(payload.text.includes(body.message));});
test('provider failure never reports success',async()=>{const r=await run({},async(url)=>url.includes('siteverify')?{ok:true,json:async()=>({success:true,hostname:'journal.example',action:'letter'})}:{ok:false,status:429,json:async()=>({})});assert.equal(r.code,429);assert.equal(r.data.accepted,undefined);});

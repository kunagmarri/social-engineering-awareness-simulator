/* CyberAware v3 - Realistic Mode */
const ACTIONS = ['report','ignore','verify','proceed'];
const DIFFICULTY = {EASY:'easy',MEDIUM:'medium',HARD:'hard'};

const state = {
  persona: null, difficulty: 'medium', currentTab: 'phishing',
  scenarioIndex: {phishing:0,smishing:0,whatsapp:0,vishing:0},
  results: {phishing:[],smishing:[],whatsapp:[],vishing:[]},
  completed: {phishing:false,smishing:false,whatsapp:false,vishing:false},
  allResults: [], scenarioStartTime: null, callTimerInterval: null,
  callSeconds: 0, dailyChallengeProgress: 0, chainStep: 0,
  pendingScenario: null, pendingTab: null, adaptiveMode: null,
  reportCount: 0, totalAnswered: 0
};

const STORAGE_KEY = 'cyberaware_v3_history';
const XP_KEY = 'cyberaware_v3_xp';
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);
function getHistory(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||[];}catch{return[];}}
function getXP(){try{return parseInt(localStorage.getItem(XP_KEY))||0;}catch{return 0;}}
function addXP(n){const x=getXP()+n;localStorage.setItem(XP_KEY,x);return x;}
function saveToHistory(score){
  const h=getHistory();
  h.push({score,date:new Date().toISOString(),persona:state.persona,difficulty:state.difficulty,
    results:state.allResults.map(r=>({id:r.id,correct:r.isCorrect,acceptable:r.isAcceptable,time:r.responseTime,type:r.attackType,action:r.action}))});
  localStorage.setItem(STORAGE_KEY,JSON.stringify(h));
}

const SCENARIOS = {
  phishing: {
    student: [
      {id:'ps1',category:'scam',difficulty:'easy',sender:'Financial Aid Office',email:'aid@university-portal-secure.com',avatar:'FA',avatarClass:'danger-bg',
       subject:'Scholarship Approved — Verify Now',urgencyTag:'ACTION REQUIRED',urgencyClass:'danger',
       body:`<p>Dear Student,</p><p>Congratulations! You've been selected for a $5,000 merit scholarship. To claim your award, you must verify your student ID and banking details within 48 hours.</p><p><span class="fake-link">Claim Scholarship Now →</span></p><p>University Financial Aid Office</p>`,
       timestamp:'Today, 8:22 AM',attachment:null,patterns:['authority','urgency','reward'],
       redFlags:['Domain "university-portal-secure.com" is not your real university','Legitimate scholarships never ask for banking details via email','48-hour deadline creates false pressure'],
       correctActions:['report'],acceptableActions:['ignore'],wrongActions:['verify','proceed'],
       feedback:{correct:'Perfect. Reporting this phishing attempt protects everyone.',acceptable:'Safe choice, but reporting helps block the attack for others.',wrong_proceed:'This was a scam — never provide banking details to unverified sources.',wrong_verify:'Good instinct to verify, but this domain has no legitimate connection to your university.'}},
      {id:'ps2',category:'safe',difficulty:'medium',sender:'University Library',email:'library@university.edu',avatar:'UL',avatarClass:'accent-bg',
       subject:'Your Reserved Books Are Ready',urgencyTag:'NOTICE',urgencyClass:'warning',
       body:`<p>Hello,</p><p>The books you reserved are now available for pickup at the main library counter. Please collect them within 5 days.</p><p>Library Hours: Mon-Fri 8am-8pm</p><p>University Library Services</p>`,
       timestamp:'Today, 10:05 AM',attachment:null,patterns:['authority'],
       redFlags:[],
       correctActions:['proceed'],acceptableActions:['verify'],wrongActions:['report','ignore'],
       feedback:{correct:'Correct! This is a legitimate library notification from the official university domain.',acceptable:'Verifying is always smart, but this official .edu domain is genuine.',wrong_report:'This was a REAL message from your university library. Over-reporting causes alert fatigue in security teams.',wrong_ignore:'This was a legitimate message — you might miss your reserved books!'}},
      {id:'ps3',category:'suspicious',difficulty:'medium',sender:'Professor Williams',email:'prof.williams@academe-mail.org',avatar:'PW',avatarClass:'warning-bg',
       subject:'RE: Your Grade — Immediate Attention',urgencyTag:'IMPORTANT',urgencyClass:'warning',
       body:`<p>Hi,</p><p>There's been an error with your final grade submission. I need you to review and confirm your details immediately or the grade cannot be recorded.</p><p><span class="fake-link">Review Grade Submission →</span></p><p>Prof. Williams</p>`,
       timestamp:'Today, 11:05 AM',attachment:'Grade_Review_Form.pdf',patterns:['authority','fear','urgency'],
       redFlags:['Domain "academe-mail.org" is not the official university email','Professors share grades through the official LMS','Attachment could contain malware'],
       correctActions:['verify'],acceptableActions:['ignore'],wrongActions:['report','proceed'],
       feedback:{correct:'Excellent! Verifying through official channels is the safest response to ambiguous messages.',acceptable:'Safe, but verifying through the LMS would confirm if this is real.',wrong_report:'This message was suspicious but not confirmed as a scam — verify first before reporting.',wrong_proceed:'Never click links in emails questioning your grades — always check via the official LMS.'}},
    ],
    employee: [
      {id:'pe1',category:'scam',difficulty:'easy',sender:'HR Department',email:'hr@company-benefits-portal.com',avatar:'HR',avatarClass:'danger-bg',
       subject:'Updated Benefits — Enrollment Closing Today',urgencyTag:'CLOSING TODAY',urgencyClass:'danger',
       body:`<p>Dear Employee,</p><p>Open enrollment for 2026 benefits closes today at 5:00 PM. Failure to update your selections will result in loss of coverage.</p><p><span class="fake-link">Update Benefits Now →</span></p><p>Human Resources</p>`,
       timestamp:'Today, 9:03 AM',attachment:null,patterns:['urgency','authority','fear'],
       redFlags:['Domain "company-benefits-portal.com" is not your company domain','Real HR uses internal systems','Creates fear of losing benefits'],
       correctActions:['report'],acceptableActions:['ignore'],wrongActions:['verify','proceed'],
       feedback:{correct:'Good catch! CEO/HR fraud via external domains is a top attack vector.',acceptable:'Staying safe, but reporting helps your security team investigate.',wrong_proceed:'This was an external phishing domain. Real HR portals use your company intranet.',wrong_verify:'Verifying is smart, but this domain has no connection to your company.'}},
      {id:'pe2',category:'safe',difficulty:'hard',sender:'IT Security Team',email:'security@yourcompany.com',avatar:'IS',avatarClass:'accent-bg',
       subject:'Mandatory Security Awareness Training Due',urgencyTag:'REQUIRED',urgencyClass:'warning',
       body:`<p>Hi Team,</p><p>As part of our annual compliance program, all employees must complete the security awareness training by Friday.</p><p>Access the training through your usual HR portal or click below:</p><p><span class="fake-link">Access Training Portal →</span></p><p>IT Security Team</p>`,
       timestamp:'Today, 9:15 AM',attachment:null,patterns:['authority'],
       redFlags:[],
       correctActions:['proceed'],acceptableActions:['verify'],wrongActions:['report','ignore'],
       feedback:{correct:'Correct. This is a legitimate email from your company security team on the official domain.',acceptable:'Smart to verify — and you would find this is real. Check via your HR portal.',wrong_report:'This was a REAL compliance email from your company. Unnecessary reports waste security team time.',wrong_ignore:'This was real — missing mandatory training has consequences!'}},
      {id:'pe3',category:'social_engineering',difficulty:'medium',sender:'CEO Michael Chen',email:'m.chen@company-exec.net',avatar:'MC',avatarClass:'warning-bg',
       subject:'Urgent Request — Confidential',urgencyTag:'CONFIDENTIAL',urgencyClass:'warning',
       body:`<p>Hi,</p><p>I need you to process an urgent wire transfer of $15,000 to a vendor. I'm in a meeting and can't call. Please handle this immediately and keep it confidential.</p><p>Thanks,<br>Michael</p>`,
       timestamp:'Today, 3:47 PM',attachment:'Wire_Instructions.pdf',patterns:['authority','urgency','trust'],
       redFlags:['CEO fraud — executives never request wire transfers via email','Domain "company-exec.net" is not official','Request for secrecy is a major red flag'],
       correctActions:['verify'],acceptableActions:['ignore'],wrongActions:['report','proceed'],
       feedback:{correct:'Perfect! Always verify financial requests directly with the person through a known phone number.',acceptable:'Wise not to act, but verifying through official channels is even better.',wrong_report:'This needed verification first — it could be real (unlikely) or fraud. Verify before reporting.',wrong_proceed:'NEVER process wire transfers based on email alone. This is a Business Email Compromise (BEC) attack.'}},
    ],
    shopper: [
      {id:'po1',category:'scam',difficulty:'easy',sender:'Amazon Orders',email:'orders@amaz0n-delivery.com',avatar:'AZ',avatarClass:'warning-bg',
       subject:'Your Order Cannot Be Delivered',urgencyTag:'DELIVERY ISSUE',urgencyClass:'warning',
       body:`<p>Your recent order #AMZ-7729341 could not be delivered due to an address error.</p><p>Please update your delivery address within 24 hours or the order will be cancelled.</p><p><span class="fake-link">Update Address Now →</span></p>`,
       timestamp:'Today, 10:14 AM',attachment:null,patterns:['urgency','trust','fear'],
       redFlags:['Domain "amaz0n" uses 0 (zero) instead of "o" — typosquatting','Real Amazon notifications come from amazon.com'],
       correctActions:['report'],acceptableActions:['ignore'],wrongActions:['verify','proceed'],
       feedback:{correct:'Excellent catch! The "amaz0n" typosquatting domain is a classic phishing indicator.',acceptable:'Safe, but reporting helps protect other shoppers.',wrong_proceed:'This was a typosquatting attack. The "0" in "amaz0n" makes it a fake domain.',wrong_verify:'Good instinct, but this domain is a confirmed fake — report it directly.'}},
      {id:'po2',category:'safe',difficulty:'medium',sender:'Amazon',email:'shipment-tracking@amazon.com',avatar:'AM',avatarClass:'accent-bg',
       subject:'Your order has shipped!',urgencyTag:'SHIPPED',urgencyClass:'',
       body:`<p>Hello,</p><p>Your order #112-8834521-9938412 has shipped and is on its way!</p><p>Estimated delivery: Tomorrow by 8 PM</p><p><span class="fake-link">Track your package →</span></p><p>Amazon Customer Service</p>`,
       timestamp:'Today, 2:30 PM',attachment:null,patterns:['trust'],
       redFlags:[],
       correctActions:['proceed'],acceptableActions:['verify'],wrongActions:['report','ignore'],
       feedback:{correct:'Correct! This is a legitimate shipping notification from the official amazon.com domain.',acceptable:'Verifying is smart. This is a real email from amazon.com.',wrong_report:'This was a REAL Amazon shipping notification. Over-reporting legitimate emails wastes resources.',wrong_ignore:'This was real — you just missed your tracking information!'}},
      {id:'po3',category:'suspicious',difficulty:'hard',sender:'PayPal',email:'service@paypal-billing-support.com',avatar:'PP',avatarClass:'accent-bg',
       subject:'Unusual Login Detected on Your Account',urgencyTag:'SECURITY ALERT',urgencyClass:'danger',
       body:`<p>We noticed a sign-in to your PayPal account from a new device.</p><p>If this was you, no action is needed. If not, please secure your account immediately.</p><p><span class="fake-link">Review Recent Activity →</span></p><p>PayPal Security Team</p>`,
       timestamp:'Today, 11:38 AM',attachment:null,patterns:['fear','urgency','authority'],
       redFlags:['Domain "paypal-billing-support.com" is not paypal.com','Real PayPal emails come from @paypal.com only'],
       correctActions:['verify'],acceptableActions:['ignore'],wrongActions:['report','proceed'],
       feedback:{correct:'Smart! You verified instead of clicking — always go directly to paypal.com to check alerts.',acceptable:'Safe choice. A real alert would still be there when you log in directly.',wrong_report:'This was suspicious but worth verifying — it could have been a real PayPal alert.',wrong_proceed:'Never click security alert links in emails. Always go directly to the official site.'}},
    ]
  },
  smishing: {
    student: [
      {id:'ss1',category:'scam',difficulty:'easy',sender:'📚 StudentAid',number:'+1 (888) 555-0291',
       messages:[{type:'incoming',text:'ALERT: Your student loan payment is overdue. Avoid late fees — resolve now: <span class="sms-link">studentloan-verify.com/pay</span>',time:'9:18 AM'}],
       patterns:['fear','urgency','authority'],
       redFlags:['Loan servicers do not send payment links via SMS','Suspicious domain'],
       correctActions:['report'],acceptableActions:['ignore'],wrongActions:['verify','proceed'],
       feedback:{correct:'Right! Real loan servicers never send payment links by SMS.',acceptable:'Safe, but reporting helps block this scam.',wrong_proceed:'Clicking SMS payment links is how attackers steal card information.',wrong_verify:'This domain has no connection to any real loan servicer — report it.'}},
      {id:'ss2',category:'safe',difficulty:'medium',sender:'📦 USPS',number:'28777',
       messages:[{type:'incoming',text:'USPS: Your package 9400111899223461188025 will be delivered TODAY by 8pm. No action needed.',time:'8:01 AM'}],
       patterns:[],
       redFlags:[],
       correctActions:['proceed'],acceptableActions:['verify'],wrongActions:['report','ignore'],
       feedback:{correct:'Correct! This is a standard USPS delivery notification with no links to click.',acceptable:'Smart habit to verify, but official USPS uses short code 28777.',wrong_report:'This was a LEGITIMATE USPS delivery notification. No link, no request — just a delivery update.',wrong_ignore:'This was real tracking info — you might miss your delivery window.'}},
      {id:'ss3',category:'suspicious',difficulty:'hard',sender:'🏦 Chase Bank',number:'+1 (800) 432-3117',
       messages:[{type:'incoming',text:'Chase: Unusual sign-in attempt detected on your account. If this wasn\'t you, call us at 1-800-432-3117 or visit chase.com',time:'3:22 PM'}],
       patterns:['fear','authority'],
       redFlags:[],
       correctActions:['verify'],acceptableActions:['ignore'],wrongActions:['report','proceed'],
       feedback:{correct:'Perfect judgment! This looks real (no suspicious link, directs to official site), but verifying by calling the number on your card is wisest.',acceptable:'Safe choice. If it were real, the alert would remain in your account.',wrong_report:'This message appears legitimate — it contains no suspicious links and directs you to the official site. Verify first.',wrong_proceed:'Before acting on any bank alert, always verify by calling the number on the back of your card.'}},
    ],
    employee: [
      {id:'se1',category:'scam',difficulty:'easy',sender:'🏢 IT Admin',number:'+1 (888) 555-0182',
       messages:[{type:'incoming',text:'Your VPN access expires in 30 min. Re-authenticate now or lose remote access: <span class="sms-link">corp-vpn-auth.com/renew</span>',time:'8:45 AM'}],
       patterns:['urgency','authority','fear'],
       redFlags:['IT does not manage VPN via SMS','External domain, not corporate infrastructure'],
       correctActions:['report'],acceptableActions:['ignore'],wrongActions:['verify','proceed'],
       feedback:{correct:'Good catch! Corporate IT never manages VPN access via external SMS links.',acceptable:'Safe, but reporting alerts your security team.',wrong_proceed:'This external domain is not connected to corporate IT. This is a credential harvesting attack.',wrong_verify:'The domain is clearly external and has no legitimate connection to corporate IT.'}},
      {id:'se2',category:'safe',difficulty:'hard',sender:'🔐 Okta',number:'652-82',
       messages:[{type:'incoming',text:'Okta: Your verification code is 847291. Valid for 5 minutes. Do not share this code.',time:'9:02 AM'}],
       patterns:[],
       redFlags:[],
       correctActions:['proceed'],acceptableActions:['verify'],wrongActions:['report','ignore'],
       feedback:{correct:'Correct! This is a legitimate MFA code you requested — use it to complete your login.',acceptable:'Verifying is a good habit. Official Okta codes come from short codes, not links.',wrong_report:'This is a REAL Okta MFA verification code. You requested it when logging in.',wrong_ignore:'You triggered this by trying to log in — ignoring it means you cannot access your account.'}},
      {id:'se3',category:'social_engineering',difficulty:'medium',sender:'👔 Manager Dave',number:'+1 (555) 234-5678',
       messages:[{type:'incoming',text:'Hey, it\'s Dave. I\'m in a client meeting and locked out of the system. Can you quickly share your login OTP? I\'ll explain later.',time:'2:15 PM'}],
       patterns:['authority','urgency','trust'],
       redFlags:['Managers never need your personal OTP','Urgency + secrecy = social engineering','Verify by calling back on a known number'],
       correctActions:['verify'],acceptableActions:['ignore'],wrongActions:['report','proceed'],
       feedback:{correct:'Excellent! Verifying by calling Dave back on his known number is the perfect response.',acceptable:'Safe, but verifying is better — it could be a real emergency (unlikely).',wrong_report:'Verify identity first before reporting. The number could be spoofed but deserves a callback.',wrong_proceed:'NEVER share OTPs with anyone, including your manager. This is social engineering.'}},
    ],
    shopper: [
      {id:'so1',category:'scam',difficulty:'easy',sender:'📦 FedEx',number:'+1 (888) 555-0165',
       messages:[{type:'incoming',text:'Your package #FDX-8827391 is delayed due to address issue. Update delivery info: <span class="sms-link">fedex-redelivery.com/update</span>',time:'10:23 AM'}],
       patterns:['trust','urgency'],
       redFlags:['FedEx does not use "fedex-redelivery.com"','Real tracking updates come from fedex.com'],
       correctActions:['report'],acceptableActions:['ignore'],wrongActions:['verify','proceed'],
       feedback:{correct:'Right call! FedEx uses fedex.com, not "fedex-redelivery.com".',acceptable:'Safe, but reporting helps block this smishing campaign.',wrong_proceed:'This fake domain steals your personal information. Always track at fedex.com directly.',wrong_verify:'This domain is a confirmed fake — it has no connection to FedEx.'}},
      {id:'so2',category:'safe',difficulty:'easy',sender:'🛒 Flipkart',number:'FKRT-M',
       messages:[{type:'incoming',text:'Flipkart: Order #FK-9922-AB has been confirmed! Estimated delivery in 3-5 days. Track at flipkart.com',time:'11:45 AM'}],
       patterns:[],
       redFlags:[],
       correctActions:['proceed'],acceptableActions:['verify'],wrongActions:['report','ignore'],
       feedback:{correct:'Correct! Order confirmation with no links to click and official short code — completely safe.',acceptable:'Good habit, but this is a standard Flipkart order confirmation.',wrong_report:'This was a REAL Flipkart order confirmation. No suspicious links, official short code.',wrong_ignore:'This was real — you now have your order confirmation details!'}},
      {id:'so3',category:'suspicious',difficulty:'medium',sender:'🏦 BankAlert',number:'+1 (888) 555-0294',
       messages:[{type:'incoming',text:'FRAUD ALERT: Suspicious $847 charge on your card ending 4521. Not you? Block now: <span class="sms-link">bank-card-security.com/block</span>',time:'6:12 PM'}],
       patterns:['fear','urgency','authority'],
       redFlags:['Banks display their name, not "BankAlert"','Suspicious domain not matching any real bank','Call the number on the back of your card instead'],
       correctActions:['verify'],acceptableActions:['ignore'],wrongActions:['report','proceed'],
       feedback:{correct:'Perfect! Call the number on the back of your card to verify — never click SMS links for fraud alerts.',acceptable:'Safe choice. A real fraud hold would show up when you call your bank directly.',wrong_report:'This needed verification first — your bank may have actually flagged a real fraudulent charge.',wrong_proceed:'Never click fraud alert links via SMS. Call your bank directly using the number on your card.'}},
    ]
  },
  whatsapp: {
    student: [
      {id:'ws1',category:'social_engineering',difficulty:'medium',sender:'Prof. Johnson',number:'+1 (555) 012-3456',avatar:'👨‍🏫',
       messages:[{type:'incoming',text:"Hi, this is Prof. Johnson. University email is down so I am reaching out personally.",time:'2:15 PM'},{type:'incoming',text:"I need you to purchase a $200 gift card for a department event ASAP. I will reimburse you.",time:'2:16 PM'}],
       patterns:['authority','urgency','trust'],
       redFlags:['Professors never ask students to buy gift cards','Gift card requests are a classic scam','Claiming email is down prevents verification'],
       correctActions:['verify'],acceptableActions:['ignore'],wrongActions:['report','proceed'],
       feedback:{correct:'Smart! Call your professor on the official university number to verify.',acceptable:'Wise not to comply, but verifying is even better.',wrong_report:'Verify identity first before reporting.',wrong_proceed:'Gift card requests are ALWAYS scams.'}},
      {id:'ws2',category:'safe',difficulty:'hard',sender:'Study Group',number:'+1 (555) 987-0001',avatar:'📚',
       messages:[{type:'incoming',text:'Hey! Study group is moving to Discord: discord.gg/study2026',time:'8:30 PM'},{type:'incoming',text:'Everyone is already there, see you tonight!',time:'8:31 PM'}],
       patterns:['trust'],redFlags:[],
       correctActions:['verify'],acceptableActions:['proceed'],wrongActions:['report','ignore'],
       feedback:{correct:'Good judgment! Verifying in person confirms this is safe.',acceptable:'This appears genuine, though verifying is wise.',wrong_report:'This appears to be a real invitation.',wrong_ignore:'You might miss important study sessions.'}},
    ],
    employee: [
      {id:'we1',category:'social_engineering',difficulty:'easy',sender:'Boss - Michael',number:'+1 (555) 111-2222',avatar:'👔',
       messages:[{type:'incoming',text:'Hey, stuck in a board meeting. Quick favor?',time:'11:32 AM'},{type:'incoming',text:'Buy 5 Apple gift cards ($100 each) for client gifts. Send me the codes ASAP.',time:'11:33 AM'}],
       patterns:['authority','urgency','trust'],
       redFlags:['CEO gift card scam - most common BEC attack','Real bosses use official procurement','Gift card codes = always a scam'],
       correctActions:['verify'],acceptableActions:['ignore'],wrongActions:['report','proceed'],
       feedback:{correct:'Perfect! Call your boss on his known number to verify.',acceptable:'Not complying is right.',wrong_report:'Needs verification before reporting.',wrong_proceed:'Gift card code requests are ALWAYS scams.'}},
      {id:'we2',category:'scam',difficulty:'medium',sender:'IT Helpdesk',number:'+1 (555) 333-4444',avatar:'🖥️',
       messages:[{type:'incoming',text:'Hi, this is IT. Unusual activity on your laptop.',time:'3:45 PM'},{type:'incoming',text:'Install this remote access tool: <span class="wa-link">remote-support-tool.com/install</span>',time:'3:46 PM'}],
       patterns:['authority','fear','trust'],
       redFlags:['IT does not use WhatsApp','Never install remote tools from unknown links'],
       correctActions:['report'],acceptableActions:['ignore'],wrongActions:['verify','proceed'],
       feedback:{correct:'Correct! IT never uses WhatsApp for this.',acceptable:'Safe, but reporting alerts your team.',wrong_proceed:'Remote access tools from unknown links = full compromise.',wrong_verify:'The link is suspicious. Call IT directly.'}},
    ],
    shopper: [
      {id:'wo1',category:'scam',difficulty:'easy',sender:'Deal Hunter Club',number:'+1 (555) 777-8888',avatar:'🏷️',
       messages:[{type:'incoming',text:'EXCLUSIVE: iPhone 16 Pro for $99! Only 5 left!',time:'4:20 PM'},{type:'incoming',text:'Order now: <span class="wa-link">iphone-mega-deal.com/buy</span>',time:'4:20 PM'}],
       patterns:['reward','urgency','fear'],
       redFlags:['$99 iPhone is too good to be true','Unknown retailer domain'],
       correctActions:['report'],acceptableActions:['ignore'],wrongActions:['verify','proceed'],
       feedback:{correct:'Right! Extreme deals are always scams.',acceptable:'Safe, but reporting blocks this scam.',wrong_proceed:'No retailer sells iPhones at this price.',wrong_verify:'The price itself is the red flag.'}},
      {id:'wo2',category:'suspicious',difficulty:'hard',sender:'Amazon Support',number:'+91 98765 43210',avatar:'📦',
       messages:[{type:'incoming',text:'Your Amazon order has a refund of $14.99 pending.',time:'10:05 AM'},{type:'incoming',text:'To receive it, verify your payment method by sharing card details.',time:'10:06 AM'}],
       patterns:['trust','reward','urgency'],
       redFlags:['Amazon never asks for card details via WhatsApp'],
       correctActions:['verify'],acceptableActions:['report'],wrongActions:['ignore','proceed'],
       feedback:{correct:'Smart! Check refund status in your Amazon app.',acceptable:'Reasonable - this is highly suspicious.',wrong_ignore:'This is suspicious enough to act on.',wrong_proceed:'NEVER share card details via WhatsApp.'}},
    ]
  },
  vishing: {
    student: [
      {id:'vs1',category:'scam',difficulty:'easy',caller:'University Registrar',number:'+1 (800) 555-0188',avatar:'🏛️',
       transcript:'"This is the Registrar. Unpaid tuition of $1,245 will cancel your enrollment in 24 hours. Provide student ID and payment now."',
       patterns:['authority','fear','urgency'],
       redFlags:['Registrars do not demand immediate payment by phone'],
       correctActions:['hangup'],acceptableActions:['report'],wrongActions:['verify','share'],
       feedback:{correct:'Correct! Hang up and call the registrar at the official number.',acceptable:'Good - report this vishing attempt.',wrong_share:'Never provide payment info on unsolicited calls.',wrong_verify:'Hang up first, then call independently.'}},
      {id:'vs2',category:'safe',difficulty:'hard',caller:'Campus Health Center',number:'+1 (555) 234-8000',avatar:'🏥',
       transcript:'"Hi, confirming your appointment tomorrow at 2:30 PM for your check-up. Call 555-234-8000 to reschedule. Have a great day!"',
       patterns:[],redFlags:[],
       correctActions:['proceed'],acceptableActions:['verify'],wrongActions:['report','hangup'],
       feedback:{correct:'Correct! Routine appointment reminder, no sensitive info requested.',acceptable:'Smart to verify.',wrong_report:'This was a LEGITIMATE reminder.',wrong_hangup:'This was real.'}},
    ],
    employee: [
      {id:'ve1',category:'scam',difficulty:'easy',caller:'National Bank Fraud Dept.',number:'+1 (800) 555-0199',avatar:'🏦',
       transcript:'"Fraud department. Unauthorized $3,450 transfer detected. Confirm your account number and OTP to block it."',
       patterns:['authority','fear','urgency'],
       redFlags:['Banks never ask for OTP over the phone'],
       correctActions:['hangup'],acceptableActions:['report'],wrongActions:['verify','share'],
       feedback:{correct:'Perfect! Hang up and call your bank directly.',acceptable:'Good - report this.',wrong_share:'OTP sharing = account takeover.',wrong_verify:'Never verify on unsolicited calls.'}},
      {id:'ve2',category:'social_engineering',difficulty:'medium',caller:'IT - Ravi',number:'+1 (555) 100-2030',avatar:'💻',
       transcript:'"Ravi from IT. Emergency maintenance tonight. I need your employee ID and password to migrate your account."',
       patterns:['authority','fear','trust'],
       redFlags:['IT never asks for passwords over the phone'],
       correctActions:['hangup'],acceptableActions:['verify'],wrongActions:['share','report'],
       feedback:{correct:'IT will NEVER ask for your password.',acceptable:'Call IT on the official number.',wrong_share:'Password sharing = full compromise.',wrong_report:'Verify first by calling IT.'}},
    ],
    shopper: [
      {id:'vo1',category:'scam',difficulty:'easy',caller:'Amazon Customer Service',number:'+1 (800) 555-0222',avatar:'📦',
       transcript:'"Amazon here. Suspicious $899 MacBook purchase detected. I need your credit card number to cancel and refund."',
       patterns:['trust','fear','urgency'],
       redFlags:['Amazon never asks for card numbers over the phone'],
       correctActions:['hangup'],acceptableActions:['report'],wrongActions:['verify','share'],
       feedback:{correct:'Hang up and check your Amazon account directly.',acceptable:'Report to Amazon via the official app.',wrong_share:'Card number = stolen funds.',wrong_verify:'Check Amazon directly instead.'}},
      {id:'vo2',category:'safe',difficulty:'medium',caller:'HDFC Bank',number:'+91 60001 60001',avatar:'🏦',
       transcript:'"HDFC Bank. Your card ending 4521 will be upgraded to Millennia next month. Free and automatic. Visit hdfcbank.com for details. No action needed."',
       patterns:[],redFlags:[],
       correctActions:['proceed'],acceptableActions:['verify'],wrongActions:['report','hangup'],
       feedback:{correct:'Correct! Informational call, nothing requested.',acceptable:'Calling HDFC back would confirm.',wrong_report:'This was LEGITIMATE.',wrong_hangup:'This was a real notification.'}},
    ]
  }
};

// ============================================================
// MISSING CONSTANTS
// ============================================================
const DAILY_CHALLENGES = [
  {title:"Sunday Challenge",desc:"Make the right call on 5 scenarios",target:5},
  {title:"Monday Drill",desc:"Correctly identify 4 scam attempts",target:4},
  {title:"Tuesday Training",desc:"Use Verify action at least twice",target:3},
  {title:"Midweek Test",desc:"Get 5 decisions correct in a row",target:5},
  {title:"Thursday Challenge",desc:"Complete the phishing module perfectly",target:3},
  {title:"Friday Skills Check",desc:"Spot 4 real messages correctly",target:4},
  {title:"Weekend Mission",desc:"Complete a full simulation session",target:5}
];

const LEVELS = [
  {minXP:0,   name:'Beginner',      icon:'🌱', subtitle:'Just getting started'},
  {minXP:100, name:'Aware',         icon:'👁️',  subtitle:'Eyes are opening'},
  {minXP:250, name:'Skeptic',       icon:'🤔', subtitle:'Question everything'},
  {minXP:500, name:'Analyst',       icon:'🔍', subtitle:'Digging deeper'},
  {minXP:850, name:'Defender',      icon:'🛡️',  subtitle:'Protecting others'},
  {minXP:1300,name:'Cyber Guardian',icon:'⚔️',  subtitle:'Elite threat hunter'},
  {minXP:2000,name:'Security Pro',  icon:'🏆', subtitle:'Top tier awareness'}
];

const BADGES = [
  {icon:'🎯',name:'First Blood',        desc:'Complete your first scenario.',
   condition:(s)=>s.allResults.length>=1},
  {icon:'🏆',name:'Perfect Score',      desc:'Score 100% in a simulation.',
   condition:(s,h)=>h.some(e=>e.score===100)},
  {icon:'🔍',name:'Verify Master',      desc:'Use Verify action 5 or more times.',
   condition:(s)=>s.allResults.filter(r=>r.action==='verify').length>=5},
  {icon:'🛡️',name:'Scam Slayer',        desc:'Correctly identify 5 scams.',
   condition:(s)=>s.allResults.filter(r=>r.category==='scam'&&r.isCorrect).length>=5},
  {icon:'⚡',name:'Speed Reader',       desc:'Answer a scenario in under 3 seconds.',
   condition:(s)=>s.allResults.some(r=>r.responseTime<3)},
  {icon:'💡',name:'Safe Spotter',       desc:'Correctly proceed on 3 safe messages.',
   condition:(s)=>s.allResults.filter(r=>r.category==='safe'&&r.action==='proceed'&&r.isCorrect).length>=3},
  {icon:'🎓',name:'Scholar',            desc:'Complete all 4 simulator modules.',
   condition:(s)=>Object.values(s.completed).every(Boolean)},
  {icon:'📈',name:'Comeback',           desc:'Improve score by 20+ points.',
   condition:(s,h)=>h.length>=2&&h[h.length-1].score-h[h.length-2].score>=20},
  {icon:'⚠️',name:'Over-Reporter',      desc:'Warning: You reported 3+ legitimate messages.',
   condition:(s)=>s.allResults.filter(r=>r.category==='safe'&&r.action==='report').length>=3,
   warning:true},
  {icon:'😰',name:'Panic Clicker',      desc:'Warning: You proceeded on 3+ scam messages.',
   condition:(s)=>s.allResults.filter(r=>r.category==='scam'&&(r.action==='proceed'||r.action==='share')).length>=3,
   warning:true}
];

const LEADERBOARD_NAMES = [
  {name:'Aisha K.',    avatar:'👩'},
  {name:'Ravi M.',     avatar:'👨'},
  {name:'Priya S.',    avatar:'👩‍💼'},
  {name:'Jordan T.',   avatar:'🧑'},
  {name:'Chen W.',     avatar:'👨‍💻'},
  {name:'Fatima A.',   avatar:'👩‍🔬'},
  {name:'Alex P.',     avatar:'🧑‍🎓'}
];

// ============================================================
// HELPERS
// ============================================================
function getActiveScenarios(type){return SCENARIOS[type]?.[state.persona]||[];}
function getTotalScenarios(){return ['phishing','smishing','whatsapp','vishing'].reduce((s,t)=>s+getActiveScenarios(t).length,0);}
function shuffle(arr){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

function calcScore(){
  let pts=0,max=0;
  state.allResults.forEach(r=>{
    max+=25;
    if(r.isCorrect){
      pts+=25;
      if(r.confidence==='high')pts+=10;
    } else if(r.isAcceptable){
      pts+=10;
    } else {
      pts-=20;
      if(r.category==='safe'&&r.action==='report')pts-=30;
      if(r.confidence==='high')pts-=15;
    }
  });
  if(max===0)return 0;
  const raw=Math.round((pts/max)*100);
  return Math.max(0,Math.min(100,raw));
}

function getBehaviorProfile(){
  const total=state.allResults.length;
  if(!total)return {profile:'Unknown',class:'medium-risk'};
  const reports=state.allResults.filter(r=>r.action==='report').length;
  const safeReports=state.allResults.filter(r=>r.category==='safe'&&r.action==='report').length;
  const verifies=state.allResults.filter(r=>r.action==='verify').length;
  const proceeds=state.allResults.filter(r=>r.action==='proceed'||r.action==='click'||r.action==='share').length;
  const reckless=state.allResults.filter(r=>(r.action==='proceed'||r.action==='click'||r.action==='share')&&r.category==='scam').length;
  const overReport=safeReports/Math.max(total,1);
  const overProceed=reckless/Math.max(total,1);
  const verifyRate=verifies/Math.max(total,1);
  if(overReport>0.3)return{profile:'Over-Cautious',class:'medium-risk',desc:'You tend to report too many legitimate messages. This can cause alert fatigue.',overReportPct:Math.round(overReport*100),verifyPct:Math.round(verifyRate*100),clickPct:Math.round(overProceed*100)};
  if(overProceed>0.25)return{profile:'High Risk Clicker',class:'high-risk',desc:'You tend to trust and act on suspicious messages too quickly.',overReportPct:Math.round(overReport*100),verifyPct:Math.round(verifyRate*100),clickPct:Math.round(overProceed*100)};
  return{profile:'Balanced',class:'low-risk',desc:'You make thoughtful decisions and verify before acting.',overReportPct:Math.round(overReport*100),verifyPct:Math.round(verifyRate*100),clickPct:Math.round(overProceed*100)};
}

function getAdaptiveNextType(){
  if(state.allResults.length<3)return null;
  const last5=state.allResults.slice(-5);
  const allReports=last5.every(r=>r.action==='report');
  const allProceed=last5.every(r=>r.action==='proceed'||r.action==='click');
  if(allReports)state.adaptiveMode='safe';
  else if(allProceed)state.adaptiveMode='easy';
  else if(last5.filter(r=>r.isCorrect).length>=4)state.adaptiveMode='hard';
  else state.adaptiveMode=null;
  return state.adaptiveMode;
}

// ============================================================
// NAVBAR
// ============================================================
function initNavbar(){
  window.addEventListener('scroll',()=>{$('#navbar').classList.toggle('scrolled',window.scrollY>10);});
  $('#hamburger').addEventListener('click',()=>{$('#navLinks').classList.toggle('open');});
  $$('#navLinks a').forEach(a=>{a.addEventListener('click',()=>$('#navLinks').classList.remove('open'));});
}

// ============================================================
// PERSONA + DIFFICULTY SELECTION
// ============================================================
function initPersona(){
  $$('.persona-card').forEach(card=>{
    card.addEventListener('click',()=>{
      $$('.persona-card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      state.persona=card.dataset.persona;
      const diffSec=$('#difficultySection');
      if(diffSec)diffSec.classList.remove('hidden');
    });
  });
  $$('.diff-card').forEach(card=>{
    card.addEventListener('click',()=>{
      $$('.diff-card').forEach(c=>c.classList.remove('selected'));
      card.classList.add('selected');
      state.difficulty=card.dataset.difficulty;
      setTimeout(()=>{
        $('#simulator').classList.remove('hidden');
        updateTabBadges();
        switchTab('phishing');
        initDailyChallenge();
        $('#simulator').scrollIntoView({behavior:'smooth',block:'start'});
      },300);
    });
  });
}

function updateTabBadges(){
  ['phishing','smishing','whatsapp','vishing'].forEach(type=>{
    const badge=$(`#badge${type.charAt(0).toUpperCase()+type.slice(1)}`);
    if(badge){
      const count=getActiveScenarios(type).length;
      badge.textContent=count;
      badge.className=`tab-badge ${state.completed[type]?'':'pending'}`;
      if(state.completed[type])badge.textContent='✓';
    }
  });
}

// ============================================================
// TABS
// ============================================================
function initTabs(){
  $$('.tab-btn').forEach(btn=>{btn.addEventListener('click',()=>switchTab(btn.dataset.tab));});
}
function switchTab(tab){
  state.currentTab=tab;
  $$('.tab-btn').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===tab));
  $$('.sim-panel').forEach(p=>p.classList.remove('active'));
  $(`#panel${tab.charAt(0).toUpperCase()+tab.slice(1)}`)?.classList.add('active');
  renderCurrentScenario(tab);
}

// ============================================================
// SCENARIO NAV
// ============================================================
function updateScenarioNav(tab,index){
  const scenarios=getActiveScenarios(tab);
  const counter=$(`#${tab}Counter`);
  const dots=$(`#${tab}Dots`);
  if(counter)counter.textContent=`Scenario ${index+1} of ${scenarios.length}`;
  if(dots){
    dots.innerHTML=scenarios.map((s,i)=>{
      const res=state.allResults.find(r=>r.id===s.id);
      let cls=i===index?'active':'';
      if(res)cls=res.isCorrect?'completed':res.isAcceptable?'acceptable':'failed';
      return `<div class="scenario-dot ${cls}"></div>`;
    }).join('');
  }
}

// ============================================================
// DIFFICULTY BADGE HELPER
// ============================================================
function diffBadge(d){
  const map={easy:'<span class="diff-badge easy">Easy</span>',medium:'<span class="diff-badge medium">Medium</span>',hard:'<span class="diff-badge hard">Hard</span>'};
  return map[d]||'';
}
function catBadge(c){
  const map={safe:'<span class="cat-badge safe">✅ Safe Message</span>',suspicious:'<span class="cat-badge suspicious">🤔 Suspicious</span>',scam:'<span class="cat-badge scam">⚠️ Scam</span>',social_engineering:'<span class="cat-badge social">🎭 Social Eng.</span>',multi_step:'<span class="cat-badge multi">🔗 Multi-Step</span>'};
  return map[c]||'';
}

// ============================================================
// RENDER CURRENT SCENARIO
// ============================================================
function renderCurrentScenario(tab){
  const index=state.scenarioIndex[tab];
  switch(tab){
    case 'phishing':renderPhishing(index);break;
    case 'smishing':renderSmishing(index);break;
    case 'whatsapp':renderWhatsApp(index);break;
    case 'vishing':renderVishing(index);break;
  }
}

function actionButtons(tab,scenarioId,answered){
  if(answered)return `<button class="btn btn-sm btn-secondary" disabled>Answered</button><button class="btn btn-sm btn-primary" onclick="nextScenario('${tab}')">Next →</button>`;
  const actions=shuffle([
    {action:'report',label:'🚩 Report Suspicious',cls:'btn-report'},
    {action:'ignore',label:'🚫 Ignore',cls:'btn-ignore'},
    {action:'verify',label:'🔍 Verify Source',cls:'btn-verify'},
    {action:'proceed',label:'✅ Proceed Carefully',cls:'btn-proceed'}
  ]);
  return actions.map(a=>`<button class="btn btn-sm ${a.cls}" onclick="handleAction('${tab}','${scenarioId}','${a.action}')">${a.label}</button>`).join('');
}

// ============================================================
// PHISHING
// ============================================================
function renderPhishing(index){
  const scenarios=getActiveScenarios('phishing');
  if(!scenarios[index])return;
  const s=scenarios[index];
  const answered=state.allResults.find(r=>r.id===s.id);
  const card=$('#phishingCard');
  if(!answered)state.scenarioStartTime=performance.now();
  card.innerHTML=`
    <div class="scenario-meta-bar">${diffBadge(s.difficulty)}${catBadge(answered?s.category:'?')}
    ${!answered?`<span class="timer-badge">⏱ <span id="liveTimer">0.0s</span></span>`:''}</div>
    <div class="pattern-tags">${s.patterns.map(p=>`<span class="pattern-tag ${p}">${p.toUpperCase()}</span>`).join('')}</div>
    <div class="email-toolbar">
      <div class="email-toolbar-btn">📥</div><div class="email-toolbar-btn">🗑️</div><div class="email-toolbar-btn">📁</div>
      <div class="email-toolbar-spacer"></div><div class="email-toolbar-btn">⋯</div>
    </div>
    <div class="email-header">
      <div class="email-avatar ${s.avatarClass}">${s.avatar}</div>
      <div class="email-meta">
        <div class="email-sender">${s.sender}</div>
        <div class="email-address">${s.email}</div>
        <div class="email-time-stamp">${s.timestamp}</div>
      </div>
    </div>
    <div class="email-subject"><span class="urgency-tag ${s.urgencyClass}">${s.urgencyTag}</span>${s.subject}</div>
    <div class="email-body">${s.body}${s.attachment?`<div class="email-attachment"><span>📎</span>${s.attachment}</div>`:''}</div>
    <div class="email-actions">${actionButtons('phishing',s.id,answered)}</div>`;
  if(!answered)startLiveTimer();
  updateScenarioNav('phishing',index);
}

// ============================================================
// SMISHING
// ============================================================
function renderSmishing(index){
  const scenarios=getActiveScenarios('smishing');
  if(!scenarios[index])return;
  const s=scenarios[index];
  const answered=state.allResults.find(r=>r.id===s.id);
  const card=$('#smishingCard');
  if(!answered)state.scenarioStartTime=performance.now();
  card.innerHTML=`
    <div class="scenario-meta-bar">${diffBadge(s.difficulty)}${catBadge(answered?s.category:'?')}
    ${!answered?`<span class="timer-badge">⏱ <span id="liveTimer">0.0s</span></span>`:''}</div>
    <div class="pattern-tags">${s.patterns.map(p=>`<span class="pattern-tag ${p}">${p.toUpperCase()}</span>`).join('')}</div>
    <div class="sms-phone-frame">
      <div class="sms-status-bar"><span>9:41</span><div class="sms-status-icons">📶 🔋</div></div>
      <div class="sms-contact-bar">
        <div class="sms-contact-avatar">${s.sender.slice(0,2)}</div>
        <div><div class="sms-contact-name">${s.sender}</div><div class="sms-contact-number">${s.number}</div></div>
      </div>
      <div class="sms-chat-area">${s.messages.map(m=>`<div class="sms-bubble ${m.type}">${m.text}<div class="sms-bubble-time">${m.time}</div></div>`).join('')}</div>
    </div>
    <div class="sms-actions">${actionButtons('smishing',s.id,answered)}</div>`;
  if(!answered)startLiveTimer();
  updateScenarioNav('smishing',index);
}

// ============================================================
// WHATSAPP
// ============================================================
function renderWhatsApp(index){
  const scenarios=getActiveScenarios('whatsapp');
  if(!scenarios[index])return;
  const s=scenarios[index];
  const answered=state.allResults.find(r=>r.id===s.id);
  const card=$('#whatsappCard');
  if(!answered)state.scenarioStartTime=performance.now();
  card.innerHTML=`
    <div class="scenario-meta-bar">${diffBadge(s.difficulty)}${catBadge(answered?s.category:'?')}
    ${!answered?`<span class="timer-badge">⏱ <span id="liveTimer">0.0s</span></span>`:''}</div>
    <div class="pattern-tags">${s.patterns.map(p=>`<span class="pattern-tag ${p}">${p.toUpperCase()}</span>`).join('')}</div>
    <div class="wa-header">
      <div class="wa-header-avatar">${s.avatar}</div>
      <div><div class="wa-header-name">${s.sender}</div><div class="wa-header-status">online</div></div>
    </div>
    <div class="wa-chat-area">${s.messages.map(m=>`<div class="wa-bubble ${m.type}">${m.text}<div class="wa-bubble-time">${m.time}</div></div>`).join('')}</div>
    <div class="wa-actions">${actionButtons('whatsapp',s.id,answered)}</div>`;
  if(!answered)startLiveTimer();
  updateScenarioNav('whatsapp',index);
}

// ============================================================
// VISHING
// ============================================================
function renderVishing(index){
  const scenarios=getActiveScenarios('vishing');
  if(!scenarios[index])return;
  const s=scenarios[index];
  const answered=state.allResults.find(r=>r.id===s.id);
  const card=$('#vishingCard');
  if(!answered){state.scenarioStartTime=performance.now();startCallTimer();}
  const vishActions=answered?
    `<button class="btn btn-sm btn-ghost" style="color:white;border-color:rgba(255,255,255,0.2);" disabled>Answered</button><button class="btn btn-sm btn-accent" onclick="nextScenario('vishing')">Next →</button>`:
    shuffle([
      {action:'share',label:'🗣️ Share Info',cls:'btn-danger'},
      {action:'hangup',label:'📵 Hang Up',cls:'btn-report'},
      {action:'verify',label:'🔍 Verify Identity',cls:'btn-verify'},
      {action:'report',label:'🚩 Report Call',cls:'btn-ignore'}
    ]).map(a=>`<button class="btn btn-sm ${a.cls}" onclick="handleAction('vishing','${s.id}','${a.action}')">${a.label}</button>`).join('');
  card.innerHTML=`
    <div class="scenario-meta-bar" style="background:rgba(255,255,255,0.04)">${diffBadge(s.difficulty)}${catBadge(answered?s.category:'?')}
    ${!answered?`<span class="timer-badge" style="color:rgba(255,255,255,0.6)">⏱ <span id="liveTimer">0.0s</span></span>`:''}</div>
    <div class="pattern-tags" style="background:rgba(255,255,255,0.03)">${s.patterns.map(p=>`<span class="pattern-tag ${p}">${p.toUpperCase()}</span>`).join('')}</div>
    <div class="call-screen">
      <div class="call-header">
        <div class="call-status">${answered?'Call Ended':'<div class="call-dot"></div> Incoming Call'}</div>
        <div class="call-avatar-lg">${s.avatar}</div>
        <div class="call-name">${s.caller}</div>
        <div class="call-number">${s.number}</div>
        <div class="call-timer" id="callTimer">${answered?'Ended':'00:00'}</div>
      </div>
      <div class="call-transcript"><div class="call-transcript-label">Live Transcript</div><p>${s.transcript}</p></div>
      <div class="call-actions">${vishActions}</div>
    </div>`;
  if(answered)stopCallTimer();
  updateScenarioNav('vishing',index);
}

// ============================================================
// TIMERS
// ============================================================
let liveTimerRAF=null;
function startLiveTimer(){
  cancelAnimationFrame(liveTimerRAF);
  function tick(){const el=$('#liveTimer');if(!el||!state.scenarioStartTime)return;el.textContent=`${((performance.now()-state.scenarioStartTime)/1000).toFixed(1)}s`;liveTimerRAF=requestAnimationFrame(tick);}
  liveTimerRAF=requestAnimationFrame(tick);
}
function stopLiveTimer(){cancelAnimationFrame(liveTimerRAF);}
function startCallTimer(){
  stopCallTimer();state.callSeconds=0;
  state.callTimerInterval=setInterval(()=>{state.callSeconds++;const m=String(Math.floor(state.callSeconds/60)).padStart(2,'0');const s=String(state.callSeconds%60).padStart(2,'0');const el=$('#callTimer');if(el)el.textContent=`${m}:${s}`;},1000);
}
function stopCallTimer(){if(state.callTimerInterval){clearInterval(state.callTimerInterval);state.callTimerInterval=null;}}

// ============================================================
// ACTION HANDLER — Step 1: Choose Action
// ============================================================
function handleAction(tab,scenarioId,action){
  stopLiveTimer();
  if(tab==='vishing')stopCallTimer();
  const scenario=getActiveScenarios(tab).find(s=>s.id===scenarioId);
  if(!scenario)return;
  const responseTime=state.scenarioStartTime?parseFloat(((performance.now()-state.scenarioStartTime)/1000).toFixed(1)):0;
  state.scenarioStartTime=null;
  state.pendingScenario={tab,scenarioId,action,responseTime,scenario};
  state.pendingTab=tab;
  showConfidenceSelector(tab,scenarioId,action,responseTime,scenario);
}

// ============================================================
// STEP 2: Confidence Selector
// ============================================================
function showConfidenceSelector(tab,scenarioId,action,responseTime,scenario){
  const overlay=$('#feedbackOverlay');
  const card=$('#feedbackCard');
  const actionLabels={report:'🚩 Report Suspicious',ignore:'🚫 Ignore',verify:'🔍 Verify Source',proceed:'✅ Proceed Carefully',hangup:'📵 Hang Up',share:'🗣️ Share Info'};
  card.innerHTML=`
    <div class="confidence-header">
      <div class="conf-action-chosen">${actionLabels[action]||action}</div>
      <h3>How confident are you?</h3>
      <p>Your confidence affects your score — being certain and wrong costs more.</p>
    </div>
    <div class="confidence-buttons">
      <button class="conf-btn low" onclick="submitWithConfidence('low')">🟡 Low Confidence<span>Not sure</span></button>
      <button class="conf-btn medium" onclick="submitWithConfidence('medium')">🟠 Medium Confidence<span>Fairly sure</span></button>
      <button class="conf-btn high" onclick="submitWithConfidence('high')">🔴 High Confidence<span>Certain</span></button>
    </div>`;
  overlay.classList.add('visible');
}

// ============================================================
// STEP 3: Process result with confidence
// ============================================================
function submitWithConfidence(confidence){
  const {tab,scenarioId,action,responseTime,scenario}=state.pendingScenario;
  const isCorrect=scenario.correctActions.includes(action);
  const isAcceptable=!isCorrect&&scenario.acceptableActions.includes(action);
  const behaviorType=responseTime<2?'impulsive':responseTime>10?'hesitant':'cautious';

  // Points
  let pointsEarned=0;
  if(isCorrect){pointsEarned=25;if(confidence==='high')pointsEarned+=10;}
  else if(isAcceptable){pointsEarned=10;}
  else{pointsEarned=-20;if(scenario.category==='safe'&&action==='report')pointsEarned-=30;if(confidence==='high')pointsEarned-=15;}

  // Smart feedback message
  let feedbackMsg='';
  if(isCorrect)feedbackMsg=scenario.feedback.correct;
  else if(isAcceptable)feedbackMsg=scenario.feedback.acceptable;
  else if(action==='report'&&scenario.category==='safe')feedbackMsg=scenario.feedback.wrong_report;
  else if(action==='proceed'||action==='click'||action==='share')feedbackMsg=scenario.feedback.wrong_proceed||scenario.feedback.wrong_click||scenario.feedback.wrong_share||'This was a risky action.';
  else feedbackMsg=scenario.feedback[`wrong_${action}`]||'This was not the best action.';

  const result={
    id:scenarioId,attackType:tab,action,confidence,responseTime,behaviorType,
    isCorrect,isAcceptable,category:scenario.category,difficulty:scenario.difficulty,
    pointsEarned,feedbackMsg,patterns:scenario.patterns,redFlags:scenario.redFlags,
    correctActions:scenario.correctActions,feedbackDetail:scenario.feedback
  };
  state.results[tab].push(result);
  state.allResults.push(result);
  state.totalAnswered++;
  if(action==='report')state.reportCount++;
  if(isCorrect)state.dailyChallengeProgress++;
  updateDailyChallengeUI();
  getAdaptiveNextType();

  const simCard=$(`#${tab}Card`);
  if(!isCorrect&&!isAcceptable&&simCard){simCard.classList.add('shake');setTimeout(()=>simCard.classList.remove('shake'),500);}

  showResultFeedback(result,scenario,tab);
  renderCurrentScenario(tab);
  updateTabBadges();
}

// ============================================================
// RESULT FEEDBACK OVERLAY
// ============================================================
function showResultFeedback(result,scenario,tab){
  const overlay=$('#feedbackOverlay');
  const card=$('#feedbackCard');
  const behaviorLabels={impulsive:'⚡ Impulsive',cautious:'🧠 Cautious',hesitant:'🤔 Hesitant'};
  const catReveal={safe:'✅ This was a REAL, Legitimate Message',suspicious:'🤔 This was Suspicious but Ambiguous',scam:'⚠️ This was a Clear Scam',social_engineering:'🎭 This was a Social Engineering Trick',multi_step:'🔗 Part of a Multi-Step Attack'};
  const revealClass={safe:'reveal-safe',suspicious:'reveal-suspicious',scam:'reveal-scam',social_engineering:'reveal-social',multi_step:'reveal-social'};
  const pointsHtml=result.pointsEarned>0?`<span class="pts-badge positive">+${result.pointsEarned} pts</span>`:result.pointsEarned===0?`<span class="pts-badge zero">+0 pts</span>`:`<span class="pts-badge negative">${result.pointsEarned} pts</span>`;
  const iconHtml=result.isCorrect?'✅':result.isAcceptable?'🟡':'❌';
  const titleHtml=result.isCorrect?'Correct Decision!':result.isAcceptable?'Acceptable, but not ideal.':'Wrong Decision!';

  card.innerHTML=`
    <div class="feedback-emoji">${iconHtml}</div>
    <h3>${titleHtml} ${pointsHtml}</h3>
    <div class="scenario-reveal ${revealClass[scenario.category]}">${catReveal[scenario.category]}</div>
    <p style="margin:12px 0">${result.feedbackMsg}</p>
    <div class="response-time-badge">
      ⏱ ${result.responseTime}s
      <span class="behavior-tag ${result.behaviorType}">${behaviorLabels[result.behaviorType]}</span>
      <span class="conf-indicator conf-${result.confidence}">${result.confidence} confidence</span>
    </div>
    ${result.redFlags&&result.redFlags.length>0?`
    <div class="feedback-tips">
      <h4>🔍 Red Flags in this scenario:</h4>
      <ul>${result.redFlags.map(t=>`<li>${t}</li>`).join('')}</ul>
    </div>`:''}
    <div class="correct-action-reveal">
      <h4>✅ Best action was: <strong>${result.correctActions.map(a=>({report:'Report Suspicious',ignore:'Ignore',verify:'Verify Source',proceed:'Proceed Carefully',hangup:'Hang Up',share:'Share Info'}[a]||a)).join(' or ')}</strong></h4>
    </div>
    <button class="btn btn-primary" onclick="closeFeedbackAndNext('${tab}')" style="margin-top:16px;width:100%">Continue →</button>`;
  overlay.classList.add('visible');
}

function closeFeedbackAndNext(tab){
  $('#feedbackOverlay').classList.remove('visible');
  setTimeout(()=>nextScenario(tab),200);
}

// ============================================================
// PROGRESSION
// ============================================================
function nextScenario(tab){
  const scenarios=getActiveScenarios(tab);
  if(state.scenarioIndex[tab]<scenarios.length-1){
    state.scenarioIndex[tab]++;
    renderCurrentScenario(tab);
  } else {
    state.completed[tab]=true;
    updateTabBadges();
    checkAllCompleted();
  }
}

function checkAllCompleted(){
  const types=['phishing','smishing','whatsapp','vishing'];
  if(types.every(t=>state.completed[t])){showResults();}
  else{const next=types.find(t=>!state.completed[t]);if(next)switchTab(next);}
}

// ============================================================
// DAILY CHALLENGE
// ============================================================
function initDailyChallenge(){
  const d=DAILY_CHALLENGES[new Date().getDay()%DAILY_CHALLENGES.length];
  $('#dailyChallengeTitle').textContent=d.title;
  $('#dailyChallengeDesc').textContent=d.desc;
  updateDailyChallengeUI();
}
function updateDailyChallengeUI(){
  const d=DAILY_CHALLENGES[new Date().getDay()%DAILY_CHALLENGES.length];
  const p=Math.min(state.dailyChallengeProgress,d.target);
  const pct=Math.round((p/d.target)*100);
  $('#dailyProgressFill').style.width=`${pct}%`;
  $('#dailyLabel').textContent=`${p} / ${d.target}`;
}

// ============================================================
// RESULTS
// ============================================================
function showResults(){
  const resultsSection=$('#results');
  resultsSection.classList.remove('hidden');
  const score=calcScore();
  const xpEarned=Math.round(score*1.5)+state.allResults.filter(r=>r.isCorrect).length*10;
  const totalXP=addXP(xpEarned);
  saveToHistory(score);

  // Score ring
  const circ=2*Math.PI*80;
  const ring=$('#scoreRingFill');
  ring.style.strokeDasharray=circ;
  setTimeout(()=>{
    ring.style.strokeDashoffset=circ-(score/100)*circ;
    ring.classList.remove('success','warning','danger');
    if(score>=80)ring.classList.add('success');
    else if(score>=50)ring.classList.add('warning');
    else ring.classList.add('danger');
  },100);
  animateNumber($('#scoreNumber'),0,score,1500);

  const levelEl=$('#scoreLevel');
  if(score>=90){levelEl.className='score-level high';levelEl.innerHTML='🏆 Security Pro';}
  else if(score>=70){levelEl.className='score-level high';levelEl.innerHTML='🛡️ Aware User';}
  else if(score>=50){levelEl.className='score-level medium';levelEl.innerHTML='⚠️ Needs Improvement';}
  else{levelEl.className='score-level low';levelEl.innerHTML='🚨 Vulnerable';}

  const risk=$('#riskIndicator');
  if(score>=80){risk.className='risk-indicator low-risk';risk.innerHTML='🟢 Risk Level: LOW';}
  else if(score>=50){risk.className='risk-indicator medium-risk';risk.innerHTML='🟡 Risk Level: MEDIUM';}
  else{risk.className='risk-indicator high-risk';risk.innerHTML='🔴 Risk Level: HIGH';}

  // Feedback list
  const typeLabels={phishing:'📧 Phishing',smishing:'📱 Smishing',whatsapp:'💬 WhatsApp',vishing:'📞 Vishing'};
  $('#feedbackList').innerHTML=state.allResults.map((r,i)=>`
    <div class="feedback-item ${r.isCorrect?'correct':r.isAcceptable?'acceptable':'wrong'}" style="animation-delay:${i*0.08}s">
      <div class="feedback-item-icon">${r.isCorrect?'✓':r.isAcceptable?'~':'✗'}</div>
      <div class="feedback-item-text">
        <strong>${typeLabels[r.attackType]}:</strong> ${r.isCorrect?'Correct':'Incorrect'} — ${r.action}
        <span class="pts-badge ${r.pointsEarned>0?'positive':r.pointsEarned<0?'negative':'zero'}" style="margin-left:6px">${r.pointsEarned>0?'+':''}${r.pointsEarned}pts</span>
      </div>
    </div>`).join('');

  renderBehaviorDashboard();
  renderPsychAnalysis();
  renderLearningMode();
  renderLevel(totalXP);
  renderBadges();
  renderProgress();
  renderLeaderboard(score);
  setTimeout(()=>resultsSection.scrollIntoView({behavior:'smooth',block:'start'}),300);
}

// ============================================================
// BEHAVIOR DASHBOARD
// ============================================================
function renderBehaviorDashboard(){
  const container=$('#behaviorDashboard');
  if(!container)return;
  const total=state.allResults.length;
  if(!total){container.innerHTML='<p style="color:var(--text-tertiary);text-align:center">No data yet</p>';return;}
  const bp=getBehaviorProfile();
  const accuracy=Math.round(state.allResults.filter(r=>r.isCorrect).length/total*100);
  const overReport=bp.overReportPct;
  const verifyUsage=bp.verifyPct;
  const profileColors={'Balanced':'low-risk','Over-Cautious':'medium-risk','High Risk Clicker':'high-risk'};
  container.innerHTML=`
    <div class="risk-profile-card ${profileColors[bp.profile]||'medium-risk'}">
      <div class="profile-label">Risk Profile</div>
      <div class="profile-name">${bp.profile==='Balanced'?'⚖️':bp.profile==='Over-Cautious'?'⚠️':'🎲'} ${bp.profile}</div>
      <p>${bp.desc}</p>
    </div>
    <div class="behavior-meters">
      <div class="behavior-meter">
        <label>Decision Accuracy <span>${accuracy}%</span></label>
        <div class="meter-track"><div class="meter-fill accuracy" style="width:0%" data-w="${accuracy}%"></div></div>
      </div>
      <div class="behavior-meter">
        <label>Over-Reporting Rate <span style="color:var(--warning)">${overReport}%</span></label>
        <div class="meter-track"><div class="meter-fill over-report" style="width:0%" data-w="${overReport}%"></div></div>
      </div>
      <div class="behavior-meter">
        <label>Verification Usage <span style="color:var(--success)">${verifyUsage}%</span></label>
        <div class="meter-track"><div class="meter-fill verify-use" style="width:0%" data-w="${verifyUsage}%"></div></div>
      </div>
    </div>`;
  setTimeout(()=>{container.querySelectorAll('.meter-fill').forEach(m=>{m.style.width=m.dataset.w;});},300);
}

// ============================================================
// PSYCH ANALYSIS
// ============================================================
function renderPsychAnalysis(){
  const container=$('#influenceBars');
  if(!container)return;
  const counts={urgency:0,fear:0,authority:0,trust:0,reward:0};
  state.allResults.filter(r=>!r.isCorrect&&!r.isAcceptable).forEach(r=>{(r.patterns||[]).forEach(p=>{if(counts[p]!==undefined)counts[p]++;});});
  const maxVal=Math.max(...Object.values(counts),1);
  const labels={urgency:'⏰ Urgency',fear:'😨 Fear',authority:'👔 Authority',trust:'🤝 Trust',reward:'🎁 Reward'};
  container.innerHTML=Object.entries(counts).map(([key,val])=>{
    const pct=Math.round((val/maxVal)*100);
    return `<div class="influence-item"><label><span>${labels[key]}</span><span>${val} influence${val!==1?'s':''}</span></label><div class="influence-track"><div class="influence-fill ${key}" style="width:0%" data-width="${pct}%"></div></div></div>`;
  }).join('');
  setTimeout(()=>{container.querySelectorAll('.influence-fill').forEach(b=>{b.style.width=b.dataset.width;});},300);
}

// ============================================================
// LEARNING MODE
// ============================================================
function renderLearningMode(){
  const container=$('#learnModeContent');
  if(!container)return;
  const wrong=state.allResults.filter(r=>!r.isCorrect&&!r.isAcceptable);
  if(wrong.length===0){container.innerHTML=`<div class="empty-state" style="padding:20px"><div class="empty-state-icon">🎉</div><p>Perfect decisions! No major mistakes to review.</p></div>`;return;}
  const worst=wrong[0];
  const typeLabels={phishing:'📧 Phishing Email',smishing:'📱 SMS Scam',whatsapp:'💬 WhatsApp Scam',vishing:'📞 Vishing Call'};
  const actionLabels={report:'Report Suspicious',ignore:'Ignore',verify:'Verify Source',proceed:'Proceed Carefully',hangup:'Hang Up',share:'Share Info'};
  container.innerHTML=`
    <div class="learn-mode-card">
      <div class="learn-steps">
        <div class="learn-step highlight">
          <div class="learn-step-num" style="background:var(--danger)">1</div>
          <div><h4>Your Decision</h4><p>In the ${typeLabels[worst.attackType]} scenario, you chose <strong>${actionLabels[worst.action]||worst.action}</strong>, which was incorrect.</p></div>
        </div>
        <div class="learn-step">
          <div class="learn-step-num" style="background:var(--warning)">2</div>
          <div><h4>Why It Was Wrong</h4><p>${worst.redFlags?.[0]||'This action exposed you to risk.'} ${worst.redFlags?.[1]||''}</p></div>
        </div>
        <div class="learn-step correct-highlight">
          <div class="learn-step-num" style="background:var(--success)">3</div>
          <div><h4>The Right Action</h4><p>The best response was: <strong>${worst.correctActions.map(a=>actionLabels[a]||a).join(' or ')}</strong>. ${worst.feedbackDetail?.correct||''}</p></div>
        </div>
      </div>
    </div>`;
}

// ============================================================
// LEVEL SYSTEM
// ============================================================
function renderLevel(totalXP){
  let cur=LEVELS[0],next=LEVELS[1];
  for(let i=LEVELS.length-1;i>=0;i--){if(totalXP>=LEVELS[i].minXP){cur=LEVELS[i];next=LEVELS[i+1]||null;break;}}
  $('#levelIcon').textContent=cur.icon;
  $('#levelName').textContent=cur.name;
  $('#levelSubtitle').textContent=cur.subtitle;
  if(next){const xpIn=totalXP-cur.minXP;const xpN=next.minXP-cur.minXP;const pct=Math.min(Math.round((xpIn/xpN)*100),100);$('#xpLabel').textContent=`${totalXP} / ${next.minXP} XP`;$('#xpFill').style.width=`${pct}%`;}
  else{$('#xpLabel').textContent=`${totalXP} XP — MAX LEVEL`;$('#xpFill').style.width='100%';}
}

// ============================================================
// BADGES
// ============================================================
function renderBadges(){
  const grid=$('#badgesGrid');
  if(!grid)return;
  const history=getHistory();
  grid.innerHTML=BADGES.map(b=>{
    const earned=b.condition(state,history);
    return `<div class="badge-card ${earned?'earned':'locked'} ${b.warning&&earned?'warning-badge':''}">
      <div class="badge-icon-lg">${b.icon}</div>
      <h4>${b.name}</h4>
      <p>${b.desc}</p>
      ${b.warning?'<span class="warning-label">⚠️ Warning</span>':''}
    </div>`;
  }).join('');
}

// ============================================================
// PROGRESS CHART
// ============================================================
function renderProgress(){
  const history=getHistory();
  const chart=$('#progressChart');
  const attemptCount=$('#attemptCount');
  const improvement=$('#progressImprovement');
  const improvText=$('#improvementText');
  if(attemptCount)attemptCount.textContent=`${history.length} attempt${history.length!==1?'s':''}`;
  if(!chart)return;
  if(history.length===0){chart.innerHTML=`<div class="empty-state" style="width:100%"><div class="empty-state-icon">📊</div><p>Complete a simulation to see progress.</p></div>`;return;}
  const recent=history.slice(-8);
  chart.innerHTML=recent.map((e,i)=>`
    <div class="progress-bar-item">
      <div class="progress-bar-value">${e.score}%</div>
      <div class="progress-bar-track"><div class="progress-bar-fill" style="height:0%" data-height="${e.score}%"></div></div>
      <div class="progress-bar-label">#${history.length-recent.length+i+1}</div>
    </div>`).join('');
  setTimeout(()=>{chart.querySelectorAll('.progress-bar-fill').forEach(b=>{b.style.height=b.dataset.height;});},200);
  if(history.length>=2&&improvement&&improvText){
    const diff=history[history.length-1].score-history[history.length-2].score;
    improvement.classList.remove('hidden');
    if(diff>0){improvement.style.background='var(--success-light)';improvement.style.color='#059669';improvText.textContent=`📈 Improved by ${diff}% — great work!`;}
    else if(diff===0){improvement.style.background='var(--accent-light)';improvement.style.color='var(--accent-dark)';improvText.textContent='Consistent performance! Keep training.';}
    else{improvement.style.background='var(--warning-light)';improvement.style.color='#92400E';improvText.textContent=`Score dropped ${Math.abs(diff)}% — review the tips!`;}
  }
}

// ============================================================
// LEADERBOARD
// ============================================================
function renderLeaderboard(userScore){
  const list=$('#leaderboardList');
  if(!list)return;
  let entries=LEADERBOARD_NAMES.map((e,i)=>({...e,score:Math.max(20,Math.min(100,Math.round(95-i*8+(Math.random()*6-3)))),isUser:false}));
  entries.push({name:'You',avatar:'🧑',score:userScore||0,isUser:true});
  entries.sort((a,b)=>b.score-a.score);
  list.innerHTML=entries.map((e,i)=>`
    <div class="leaderboard-item ${e.isUser?'you':''}">
      <div class="lb-rank ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">#${i+1}</div>
      <div class="lb-avatar">${e.avatar}</div>
      <div class="lb-name">${e.name}${e.isUser?'<span class="you-tag">YOU</span>':''}</div>
      <div class="lb-score">${e.score}%</div>
    </div>`).join('');
}

// ============================================================
// UTILITIES
// ============================================================
function animateNumber(el,start,end,dur){
  const t0=performance.now();
  function update(now){const p=Math.min((now-t0)/dur,1);el.textContent=Math.round(start+(end-start)*(1-Math.pow(1-p,3)));if(p<1)requestAnimationFrame(update);}
  requestAnimationFrame(update);
}
function initSmoothScroll(){
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',function(e){const t=document.querySelector(this.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'});}});
  });
}

// ============================================================
// RESET
// ============================================================
function resetSimulation(){
  state.persona=null;state.difficulty='medium';state.currentTab='phishing';
  state.scenarioIndex={phishing:0,smishing:0,whatsapp:0,vishing:0};
  state.results={phishing:[],smishing:[],whatsapp:[],vishing:[]};
  state.completed={phishing:false,smishing:false,whatsapp:false,vishing:false};
  state.allResults=[];state.dailyChallengeProgress=0;state.chainStep=0;
  state.pendingScenario=null;state.pendingTab=null;state.adaptiveMode=null;
  state.reportCount=0;state.totalAnswered=0;
  stopCallTimer();stopLiveTimer();
  $('#results').classList.add('hidden');
  $('#simulator').classList.add('hidden');
  const ds=$('#difficultySection');if(ds)ds.classList.add('hidden');
  $$('.persona-card').forEach(c=>c.classList.remove('selected'));
  $$('.diff-card').forEach(c=>c.classList.remove('selected'));
  $('#feedbackOverlay').classList.remove('visible');
  $('#persona').scrollIntoView({behavior:'smooth'});
}

// ============================================================
// INIT
// ============================================================
function init(){
  initNavbar();initPersona();initTabs();initSmoothScroll();
  renderBadges();renderProgress();renderLeaderboard(0);renderLevel(getXP());
}
document.addEventListener('DOMContentLoaded',init);

/* Money & Grace Co. site script. Settings you are likely to change live in js/config.js. */
'use strict';
/* ---------- content ---------- */
const MG=window.MG_CONFIG||{};
const CHECKOUT_PLACEHOLDER='';
/* status: 'available' shows Buy Now; 'coming-soon' shows Notify me. Flip a product to 'available' and paste its Payhip link into checkout when it is ready. */
const PRODUCTS=[
  {id:'monthly-money-planner',name:'Monthly Money Planner',cat:'Planners',art:'monthly',tone:'blush',status:'available',checkout:CHECKOUT_PLACEHOLDER,
   short:'One calm spread a month for income, bills, goals, and a money-date reflection.',
   description:['The Monthly Money Planner gives your money one calm place to live each month. Map out your income and bills, check in on your goals, and close the month with a short reflection.','It is made for busy women who want a clear picture of their finances without spending hours in spreadsheets.'],
   features:['Monthly budget overview on a single spread','Bill calendar to spot due dates at a glance','Goal check-ins for savings and debt','Reflection prompts written in the Money & Grace voice'],
   included:['Monthly budget overview','Bill and due-date calendar','Savings and goals check-in','End-of-month reflection page','Quick-start guide'],
   previews:[['monthly','blush','Cover'],['calendar','sand','Bill calendar page'],['desk','gold','On the desk']]},
  {id:'budget-planner',name:'Budget Planner',cat:'Planners',art:'budget',tone:'sand',status:'coming-soon',checkout:CHECKOUT_PLACEHOLDER,
   short:'A complete budgeting system for paycheck planning, categories, and sinking funds.',
   description:['The Budget Planner is a complete system for women who want to plan every paycheck with intention.','Track spending by category, set aside money for the expenses you know are coming, and see your whole year at a glance.'],
   features:['Paycheck-by-paycheck planning','Spending tracker by category','Sinking funds for planned expenses','Year-at-a-glance money overview'],
   included:['Paycheck budget pages','Spending category tracker','Sinking funds tracker','Annual money overview','Quick-start guide'],
   previews:[['budget','sand','Budget spread'],['calendar','blush','Planning page'],['desk','blush','On the desk']]},
  {id:'debt-repayment-tracker',name:'Debt Repayment Tracker',cat:'Trackers',art:'debt',tone:'gold',status:'coming-soon',checkout:CHECKOUT_PLACEHOLDER,
   short:'See every balance in one place and color in your progress as you pay it down.',
   description:['The Debt Repayment Tracker puts every balance in one place so you can stop guessing and start planning.','Choose a payoff method, log each payment, and color in your progress as balances shrink.'],
   features:['Debt list with balances, rates, and minimums','Snowball and avalanche payoff planners','Payment log for every extra payment','Coloring progress pages to celebrate wins'],
   included:['Debt overview sheet','Payoff method planner','Payment log','Progress coloring pages','Quick-start guide'],
   previews:[['debt','gold','Tracker'],['debt-close','blush','Progress page'],['desk','sand','On the desk']]},
  {id:'savings-challenges',name:'Savings Challenges',cat:'Challenges',art:'savings',tone:'blush',status:'coming-soon',checkout:CHECKOUT_PLACEHOLDER,
   short:'Fun, flexible challenges that make saving feel like a game you want to win.',
   description:['Savings Challenges turn saving into a game you actually want to play.','Pick a challenge that fits your month, color in your progress, and watch small amounts become real savings.'],
   features:['Classic and flexible 52-week challenge','Emergency fund tracker','No-spend month calendar','Sinking fund jar trackers'],
   included:['52-week savings challenge','Emergency fund tracker','No-spend month calendar','Sinking fund jars','Quick-start guide'],
   previews:[['savings','blush','Challenge'],['savings-close','sand','Tracker page'],['reset','gold','On the desk']]}
];
/* Product status and checkout links come from js/config.js.
   A product only shows Buy Now when its status is 'available' AND it has a real checkout link. */
PRODUCTS.forEach(p=>{const c=(MG.products||{})[p.id]||{};p.checkout=(c.checkout||'').trim();p.status=(c.status==='available'&&/^https:\/\//.test(p.checkout))?'available':'coming-soon'});
const ARTICLES=[
  {id:'zero-based-budget',cat:'Budgeting',title:'The zero-based budget, explained over coffee',dek:'Give every dollar a job before the month begins, and watch the stress quiet down.',read:'6 min read',art:'budget',tone:'blush',
   body:[
    '<p>A zero-based budget sounds strict. It is actually freeing. The idea is simple: your income minus everything you plan to spend, save, and pay toward debt should equal zero. Not because you spend it all, but because every dollar has an assignment.</p>',
    '<h2>How it works</h2>',
    '<p>Start with what you expect to bring home this month. Then list your essentials, your savings goals, your debt payments, and yes, your fun money. Keep assigning until nothing is left unplanned.</p>',
    '<ul><li>Write down your take-home pay for the month.</li><li>List fixed bills first: rent, utilities, insurance.</li><li>Add variable spending: groceries, gas, little treats.</li><li>Assign what remains to savings or debt.</li></ul>',
    '<p class="pull">“A budget is not a cage. It is a permission slip for the things you actually care about.”</p>',
    '<p>Check in once a week. If you overspend in one category, move money from another. Adjusting is not failing; it is the whole system working as it should.</p>']},
  {id:'emergency-fund',cat:'Saving',title:'How to build an emergency fund when every month feels full',dek:'Small, automatic, and boring on purpose. That is how a cushion gets built.',read:'5 min read',art:'savings',tone:'sand',
   body:[
    '<p>An emergency fund is money set aside for the surprises life loves to send: a car repair, a vet bill, a sudden gap between jobs. Having it turns a crisis into an inconvenience.</p>',
    '<h2>Start smaller than you think</h2>',
    '<p>Many people aim for a few months of essential expenses eventually. But your first goal can be a single, specific number that feels reachable. Hitting it builds confidence for the next one.</p>',
    '<ul><li>Open a separate savings account so the money is out of sight.</li><li>Automate a transfer right after payday, even if it is small.</li><li>Send windfalls, like a tax refund, straight to the fund.</li></ul>',
    '<p>Then leave it alone for true emergencies. A sale on boots is not an emergency, no matter how good the boots are.</p>']},
  {id:'snowball-avalanche',cat:'Debt',title:'Snowball or avalanche? Choosing a debt plan you will stick with',dek:'Two proven payoff methods, and how to pick the one that fits your personality.',read:'7 min read',art:'debt',tone:'gold',
   body:[
    '<p>When you have more than one debt, the question is not only how much to pay but in what order. Two popular methods help you decide.</p>',
    '<h2>The snowball</h2>',
    '<p>Pay minimums on everything, then put any extra toward the smallest balance first. When it is gone, roll that payment into the next smallest. Quick wins keep you motivated.</p>',
    '<h2>The avalanche</h2>',
    '<p>Pay minimums on everything, then put extra toward the highest interest rate first. This usually costs less in interest over time.</p>',
    '<p class="pull">“The best payoff plan is the one you will still be following in six months.”</p>',
    '<p>If you need momentum, try the snowball. If you are motivated by math, try the avalanche. Either way, tracking your progress visually makes a real difference.</p>']},
  {id:'money-date',cat:'Planning',title:'Your first money date: a 30-minute monthly check-in',dek:'Candles optional. A calm, recurring ritual that keeps your plan on track.',read:'4 min read',art:'monthly',tone:'blush',
   body:[
    '<p>A money date is a standing appointment with your finances. Once a month, you sit down, look at the numbers, and make a few small decisions. That is it.</p>',
    '<h2>A simple agenda</h2>',
    '<ul><li>Review last month: what went to plan and what did not.</li><li>Check balances on savings and debts.</li><li>Look ahead at bills and events coming up.</li><li>Set one money intention for the month.</li></ul>',
    '<p>Make it pleasant on purpose. Pour something nice, put on music, and use tools you enjoy looking at. When the ritual feels good, you keep showing up.</p>']},
  {id:'sinking-funds',cat:'Budgeting',title:'Sinking funds: the quiet secret to calm holidays',dek:'Save a little each month for expenses you already know are coming.',read:'5 min read',art:'kit',tone:'sand',
   body:[
    '<p>Holidays, birthdays, car registration, back-to-school. These are not surprises, but they often feel like it. Sinking funds fix that.</p>',
    '<h2>How to set one up</h2>',
    '<p>Pick an upcoming expense, estimate the total, and divide it by the months you have left. Set that amount aside each month in its own labeled pot.</p>',
    '<p>When the expense arrives, the money is already waiting. No credit card scramble, no January regret.</p>']},
  {id:'52-week-challenge',cat:'Saving',title:'The 52-week savings challenge, made realistic',dek:'Flexible ways to play along, even when your budget is tight.',read:'4 min read',art:'savings',tone:'blush',
   body:[
    '<p>The classic 52-week challenge has you save a little more each week. It is fun and visual, but the later weeks can sneak up on you.</p>',
    '<h2>Make it work for you</h2>',
    '<ul><li>Reverse it: start with the larger amounts while motivation is high.</li><li>Pick your week: color in whichever amount fits that week.</li><li>Scale it: halve every amount and still celebrate.</li></ul>',
    '<p>The goal is the habit, not perfection. Every circle you color is proof you can do this.</p>']}
];
const RESOURCES=[
  {name:'Sinking Funds Worksheet',art:'kit',tone:'sand',text:'Plan for holidays, birthdays, and annual bills before they arrive.'},
  {name:'Debt List Template',art:'debt',tone:'blush',text:'Write down every balance, rate, and minimum in one place.'},
  {name:'No-Spend Week Tracker',art:'savings',tone:'gold',text:'A seven-day reset for when your spending needs a pause.'}
];
const TIPS=[
  'Give every dollar a job before the month starts. Future you will send a thank-you note.',
  'A sinking fund is just a pretty jar for expenses you already know are coming.',
  'Check your subscriptions this week. Cancel the one you forgot you had.',
  'Pay yourself first, even if it is small. Consistency is the real glow-up.',
  'Schedule a monthly money date. Candles optional, honesty required.',
  'Before you add to cart, wait 48 hours. If you still love it, budget for it.'
];
const SOCIALS=[
  {name:'Instagram',url:'https://www.instagram.com/',svg:'<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/>'},
  {name:'Pinterest',url:'https://www.pinterest.com/',svg:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M11 8.5c3-1 5 .6 5 2.8 0 2.4-1.6 4-3.4 4-1 0-1.6-.6-1.6-.6L9.8 20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'},
  {name:'TikTok',url:'https://www.tiktok.com/',svg:'<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5M14 4c.4 2.4 2 4 4.5 4.3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'},
  {name:'YouTube',url:'https://www.youtube.com/',svg:'<rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 9.2v5.6l4.8-2.8z" fill="currentColor"/>'}
].map(s=>({...s,url:((MG.social||{})[s.name.toLowerCase()]||s.url)}));
const EMAIL=MG.email||'hello@moneyandgraceco.com';

/* ---------- placeholder "photography" (styled flat-lay scenes) ---------- */
const TONES={blush:'var(--blush)',sand:'var(--sand)',gold:'var(--gold-soft)',noir:'var(--noir)'};
const cup=(x,y,s=1)=>`<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sh)"><circle r="46" fill="#FFFDFA"/><circle r="44" fill="none" stroke="#EFE4DA" stroke-width="2"/><circle r="31" fill="#F6EEE6"/><circle r="25" fill="#B78A63"/><path d="M0 9c-9-6-13-11-11-15 2-4 7-3 11 1 4-4 9-5 11-1 2 4-2 9-11 15z" fill="#F4E4D2"/><rect x="40" y="-6" width="22" height="12" rx="6" fill="#FFFDFA"/></g>`;
const pen=(x,y,r)=>`<g transform="translate(${x} ${y}) rotate(${r})" filter="url(#sh2)"><rect x="-4" y="-70" width="8" height="140" rx="4" fill="url(#goldg)"/><rect x="-4.5" y="-30" width="9" height="6" fill="#16110F" opacity=".75"/><path d="M-4 70l4 12 4-12z" fill="#7A5C2E"/></g>`;
const clip=(x,y,r)=>`<g transform="translate(${x} ${y}) rotate(${r})" filter="url(#sh2)"><rect x="-9" y="-22" width="18" height="44" rx="9" fill="none" stroke="url(#goldg)" stroke-width="3"/><rect x="-4" y="-14" width="8" height="30" rx="4" fill="none" stroke="url(#goldg)" stroke-width="2.4"/></g>`;
const petals=(x,y)=>`<g transform="translate(${x} ${y})" opacity=".9"><ellipse rx="9" ry="5" fill="#E7B8BD" transform="rotate(30)"/><ellipse cx="18" cy="12" rx="7" ry="4" fill="#E7B8BD" transform="rotate(-20 18 12)"/><ellipse cx="-14" cy="20" rx="6" ry="3.5" fill="#D9A0A8"/></g>`;
const lines=(x,y,w,n,gap=12,c='#E6D8CC')=>Array.from({length:n},(_,i)=>`<rect x="${x}" y="${y+i*gap}" width="${w*(i%3===2?.6:1)}" height="2" rx="1" fill="${c}"/>`).join('');

function bookMonthly(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s}) rotate(-4)" filter="url(#sh)">
  <rect width="180" height="240" rx="10" fill="#16110F"/><rect x="0" y="0" width="14" height="240" rx="6" fill="#0B0807"/>
  <rect x="26" y="18" width="136" height="204" rx="4" fill="none" stroke="#C9A66B" stroke-width="1"/>
  <text x="94" y="56" text-anchor="middle" class="sv-b" font-size="7.5" letter-spacing="2.4" fill="#C9A66B">MONEY &amp; GRACE CO.</text>
  <text x="94" y="120" text-anchor="middle" class="sv-s" font-size="38" fill="#E2C893">Monthly</text>
  <text x="94" y="146" text-anchor="middle" class="sv-d" font-size="15" letter-spacing="1.5" fill="#F3E6CF">MONEY PLANNER</text>
  <path d="M84 170h20" stroke="#C9A66B"/><text x="94" y="196" text-anchor="middle" class="sv-b" font-size="7" letter-spacing="2" fill="#C9A66B">BUILD WEALTH WITH GRACE</text>
  <rect x="150" y="-2" width="9" height="244" fill="#E7B8BD"/><rect width="180" height="240" rx="10" fill="url(#light)"/></g>`}
function spreadBudget(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s}) rotate(3)" filter="url(#sh)">
  <rect width="290" height="200" rx="8" fill="#FFFDFA"/><rect x="144" y="0" width="2" height="200" fill="#EADCD0"/>
  <text x="18" y="34" class="sv-d" font-size="17" fill="#16110F">Budget</text><text x="80" y="34" class="sv-s" font-size="18" fill="#B08A4E">November</text>
  ${lines(18,50,110,9,14)}
  <text x="162" y="34" class="sv-b" font-size="7" letter-spacing="2" fill="#87672F">CATEGORIES</text>
  ${[0,1,2,3,4,5].map(i=>`<rect x="162" y="${48+i*22}" width="70" height="2" fill="#E6D8CC"/><rect x="242" y="${41+i*22}" width="30" height="10" rx="5" fill="${i%2?'#F4DADB':'#EBDDC2'}"/>`).join('')}
  <rect x="290" y="30" width="10" height="28" rx="3" fill="#C9A66B"/><rect x="290" y="64" width="10" height="28" rx="3" fill="#E7B8BD"/><rect x="290" y="98" width="10" height="28" rx="3" fill="#16110F"/></g>`}
function sheetDebt(x,y,s=1){const w=[.82,.55,.35,.18];return `<g transform="translate(${x} ${y}) scale(${s}) rotate(-3)" filter="url(#sh)">
  <rect width="190" height="250" rx="6" fill="#FFFDFA"/><rect x="70" y="-10" width="50" height="22" rx="5" fill="url(#goldg)"/>
  <text x="20" y="48" class="sv-d" font-size="18" fill="#16110F">Debt Payoff</text><text x="20" y="64" class="sv-b" font-size="6.5" letter-spacing="2" fill="#87672F">TRACK EVERY WIN</text>
  ${w.map((p,i)=>`<rect x="20" y="${88+i*36}" width="60" height="2" fill="#E6D8CC"/><rect x="20" y="${96+i*36}" width="150" height="12" rx="6" fill="#F4DADB"/><rect x="20" y="${96+i*36}" width="${150*p}" height="12" rx="6" fill="${i%2?'#C9A66B':'#16110F'}"/>`).join('')}
  </g>`}
function sheetSavings(x,y,s=1){let c='';for(let r=0;r<6;r++)for(let k=0;k<5;k++){const i=r*5+k;const f=i<13;c+=`<circle cx="${34+k*30}" cy="${92+r*26}" r="10" fill="${f?'#C9A66B':'none'}" stroke="#C9A66B" stroke-width="1.3"/>`}
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(2)" filter="url(#sh)"><rect width="190" height="250" rx="6" fill="#FFFDFA"/>
  <text x="20" y="42" class="sv-d" font-size="17" fill="#16110F">Savings</text><text x="104" y="44" class="sv-s" font-size="20" fill="#B08A4E">challenge</text>
  <text x="20" y="60" class="sv-b" font-size="6.5" letter-spacing="2" fill="#87672F">COLOR ONE IN EACH WEEK</text>${c}</g>`}
function kitStack(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})">
  <g transform="rotate(-10 95 125)" filter="url(#sh)"><rect width="190" height="250" rx="6" fill="#F6EEE6"/>${lines(20,40,150,12,14)}</g>
  <g transform="rotate(6 95 125) translate(14 0)" filter="url(#sh)"><rect width="190" height="250" rx="6" fill="#FFFDFA"/>${lines(20,60,150,11,15)}</g>
  <g transform="translate(6 10)" filter="url(#sh)"><rect width="190" height="250" rx="6" fill="#FFFDFA"/><rect x="0" y="0" width="190" height="70" rx="6" fill="#16110F"/>
  <text x="95" y="34" text-anchor="middle" class="sv-s" font-size="24" fill="#E2C893">Budget</text><text x="95" y="54" text-anchor="middle" class="sv-b" font-size="8" letter-spacing="2.6" fill="#F3E6CF">STARTER KIT</text>
  ${lines(20,92,150,6,16)}<rect x="20" y="196" width="70" height="22" rx="11" fill="#F4DADB"/><text x="55" y="211" text-anchor="middle" class="sv-b" font-size="7" letter-spacing="1.6" fill="#9C4D5C">FREE</text></g></g>`}

function candle(x,y,s=1){return `<g transform="translate(${x} ${y}) scale(${s})" filter="url(#sh)"><circle r="38" fill="#FFFDFA"/><circle r="31" fill="#F4E4D2"/><circle r="31" fill="none" stroke="#E7B8BD" stroke-width="3"/><path d="M0 -20c7 8 7 15 0 19-7-4-7-11 0-19z" fill="url(#goldg)"/><rect x="-1.2" y="-3" width="2.4" height="6" rx="1" fill="#16110F"/></g>`}
function sheetReset(x,y,s=1){const rows=['Check your balances','Review last week','Look at the week ahead','Pay yourself first','Set one intention'];return `<g transform="translate(${x} ${y}) scale(${s}) rotate(-3)" filter="url(#sh)"><rect width="190" height="250" rx="6" fill="#FFFDFA"/>
  <text x="20" y="44" class="sv-d" font-size="19" fill="#16110F">Sunday</text><text x="98" y="46" class="sv-s" font-size="22" fill="#B08A4E">reset</text>
  <text x="20" y="62" class="sv-b" font-size="6.5" letter-spacing="2" fill="#87672F">15 MINUTES · ONE CALM WEEK</text>
  ${rows.map((r,i)=>`<rect x="20" y="${86+i*30}" width="12" height="12" rx="3" fill="${i<3?'#C9A66B':'none'}" stroke="#C9A66B" stroke-width="1.3"/><text x="42" y="${96+i*30}" class="sv-b" font-size="9" fill="#3A2E2C">${r}</text>`).join('')}</g>`}
function sheetCalendar(x,y,s=1){const hot=[3,11,17,24,30];let c='';for(let r=0;r<5;r++)for(let k=0;k<7;k++){const i=r*7+k,h=hot.includes(i);c+=`<rect x="${16+k*23}" y="${84+r*30}" width="20" height="26" rx="3" fill="${h?'#F4DADB':'#FBF6F0'}" stroke="#EADCD0"/>`+(h?`<circle cx="${26+k*23}" cy="${101+r*30}" r="3" fill="#C9A66B"/>`:'')}
  return `<g transform="translate(${x} ${y}) scale(${s}) rotate(2)" filter="url(#sh)"><rect width="190" height="250" rx="6" fill="#FFFDFA"/><text x="16" y="42" class="sv-d" font-size="17" fill="#16110F">Bills &amp; due dates</text><text x="16" y="60" class="sv-b" font-size="6.5" letter-spacing="2" fill="#87672F">MONTHLY MONEY PLANNER</text>${['S','M','T','W','T','F','S'].map((d,k)=>`<text x="${26+k*23}" y="78" text-anchor="middle" class="sv-b" font-size="7" fill="#87672F">${d}</text>`).join('')}${c}</g>`}

function scene(kind){
  let inner='';
  switch(kind){
    case 'hero': return `<svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid meet">
      ${spreadBudget(40,300,.95)}${bookMonthly(120,60,1.15)}${cup(70,120,.95)}${pen(345,250,18)}${clip(330,90,25)}${petals(70,440)}</svg>`;
    case 'monthly': inner=`${bookMonthly(140,40,1)}${cup(76,232,.8)}${pen(340,150,12)}${petals(330,270)}`;break;
    case 'budget': inner=`${spreadBudget(55,60,1)}${pen(60,250,-62)}${clip(350,40,20)}`;break;
    case 'debt': inner=`${sheetDebt(110,40,1)}${cup(330,240,.75)}${pen(70,170,-10)}`;break;
    case 'savings': inner=`${sheetSavings(104,36,1)}${cup(330,90,.7)}${clip(70,260,-30)}${petals(330,270)}`;break;
    case 'kit': inner=`${kitStack(95,30,1)}${pen(350,180,15)}${petals(60,60)}`;break;
    case 'reset': inner=`${sheetReset(150,34,1)}${candle(84,96,1)}${cup(352,268,.6)}${petals(70,250)}`;break;
    case 'calendar': inner=`${sheetCalendar(105,30,1)}${pen(345,170,14)}${clip(62,80,-20)}`;break;
    case 'debt-close': inner=`${sheetDebt(100,22,1.08)}${pen(350,170,10)}`;break;
    case 'savings-close': inner=`${sheetSavings(100,16,1.08)}${petals(345,262)}`;break;
    case 'desk': inner=`${spreadBudget(30,130,.9)}${cup(320,80,.95)}${pen(330,250,40)}${clip(70,70,-15)}${petals(260,40)}`;break;
  }
  return `<svg viewBox="0 0 400 320" preserveAspectRatio="xMidYMid meet">${inner}</svg>`;
}
function photo(kind,tone,label){return `<div class="photo" style="--tone:${TONES[tone]||TONES.blush}" ${label?`role="img" aria-label="${label}"`:'aria-hidden="true"'}>${scene(kind)}</div>`}

/* ---------- Grace mascot ---------- */
const GRACE=`<svg viewBox="0 0 240 280" role="img" aria-label="Grace, the Money and Grace Co. mascot, a stylish woman with a black bob, gold hoops, and a blush blazer">
  <g class="spark"><path d="M200 60l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#E2C893"/></g>
  <g class="spark s2"><path d="M40 90l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#E2C893"/></g>
  <path d="M40 282c0-62 30-96 80-100 50 4 80 38 80 100z" fill="#E7B8BD"/>
  <path d="M108 182l12 40 12-40z" fill="#FFFDFA"/>
  <path d="M96 186l24 40-8-44zM144 186l-24 40 8-44z" fill="#D9A0A8"/>
  <rect x="108" y="150" width="24" height="36" rx="10" fill="#EBC2A6"/>
  ${[0,1,2,3,4,5,6].map(i=>`<circle cx="${102+i*6}" cy="${186+Math.sin(i/6*Math.PI)*7}" r="2.6" fill="#FFF6EC"/>`).join('')}
  <path d="M70 110c-2-50 26-70 52-70s52 22 50 70l2 44c-10 8-22 6-26-4l-2-40c-6-14-18-22-30-24-10 12-26 20-40 22l-2 44c-6 8-18 8-26 0z" fill="#16110F"/>
  <ellipse cx="120" cy="116" rx="40" ry="46" fill="#F1CDB3"/>
  <path d="M78 104c10-4 24-14 36-30 12 14 30 24 46 26-2-30-22-48-40-48-22 0-42 18-42 52z" fill="#16110F"/>
  <circle cx="80" cy="136" r="8" fill="none" stroke="#C9A66B" stroke-width="2.6"/><circle cx="160" cy="136" r="8" fill="none" stroke="#C9A66B" stroke-width="2.6"/>
  <path d="M96 106q8-5 16 0M128 106q8-5 16 0" stroke="#16110F" stroke-width="2.2" fill="none" stroke-linecap="round"/>
  <ellipse class="blink" cx="104" cy="118" rx="3.6" ry="4.6" fill="#16110F"/><ellipse class="blink" cx="136" cy="118" rx="3.6" ry="4.6" fill="#16110F"/>
  <circle cx="96" cy="134" r="7" fill="#E7A2AC" opacity=".55"/><circle cx="144" cy="134" r="7" fill="#E7A2AC" opacity=".55"/>
  <path d="M110 140q10 8 20 0" stroke="#B4505F" stroke-width="3" fill="none" stroke-linecap="round"/>
  <g class="coin"><circle cx="190" cy="196" r="20" fill="url(#goldg)"/><circle cx="190" cy="196" r="15" fill="none" stroke="#FFF2D6" stroke-opacity=".7"/><text x="190" y="203" text-anchor="middle" class="sv-s" font-size="22" fill="#5E4318">g</text></g>
</svg>`;

/* ---------- reusable components ---------- */
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const isAvail=p=>p.status==='available';
function productCard(p){const href=`#product-${p.id}`;return `<article class="p-card">
  <a class="p-img" href="${href}" tabindex="-1" aria-hidden="true"><span class="status ${isAvail(p)?'available':'soon'}">${isAvail(p)?'Available now':'Coming soon'}</span>${photo(p.art,p.tone,'')}</a>
  <div class="p-body"><div class="p-meta"><span>${p.cat}</span><span>Digital download</span></div><h3><a href="${href}">${p.name}</a></h3><p>${p.short}</p></div>
  <div class="p-actions"><span class="price-note">${isAvail(p)?'Ready to download':'Price coming soon'}</span><a class="btn ${isAvail(p)?'btn-primary':'btn-ghost'} btn-sm" href="${href}">${isAvail(p)?'View &amp; buy':'View details'}</a></div></article>`}
function renderProduct(id){const p=PRODUCTS.find(x=>x.id===id);if(!p)return false;const av=isAvail(p);
  $('[data-pdp]').innerHTML=`<div class="page-head" style="padding-bottom:28px"><a class="crumb" href="#shop">← The Shop</a></div>
  <div class="pdp">
    <div class="gallery">
      <div data-gallery-main>${photo(p.previews[0][0],p.previews[0][1],`${p.name}: ${p.previews[0][2]}`)}</div>
      <div class="thumbs" role="group" aria-label="Product previews">${p.previews.map((v,i)=>`<button class="thumb" type="button" aria-pressed="${i===0}" data-preview="${i}" aria-label="Show ${v[2]}">${photo(v[0],v[1],'')}</button>`).join('')}</div>
      <p class="fine" data-preview-cap>Preview: ${p.previews[0][2]}</p>
    </div>
    <div class="pdp-info">
      <div class="p-meta"><span>${p.cat}</span><span>Digital download</span></div>
      <h1 class="h-1">${p.name}</h1>
      <span class="status ${av?'available':'soon'}">${av?'Available now':'Coming soon'}</span>
      <p class="lede">${p.short}</p>
      <div class="buy-box">${av
        ?`<a class="btn btn-primary" href="${p.checkout}" target="_blank" rel="noopener" data-checkout>Buy Now</a><p class="fine">Secure checkout and instant download through Payhip.</p>`
        :`<p><b>Coming soon.</b> Be the first to know when the ${p.name} launches.</p><div data-signup="pdp" data-cta="Notify me" data-resource="${p.name} launch"></div>`}</div>
      <div class="detail-block"><h2>Description</h2>${p.description.map(d=>`<p>${d}</p>`).join('')}</div>
      <div class="detail-block"><h2>Features</h2><ul class="checklist">${p.features.map(i=>`<li>${i}</li>`).join('')}</ul></div>
      <div class="detail-block"><h2>What’s included in the download</h2><ul class="checklist">${p.included.map(i=>`<li>${i}</li>`).join('')}</ul></div>
      <div class="detail-block"><h2>Details</h2><dl class="specs"><dt>Format</dt><dd>Digital download</dd><dt>Delivery</dt><dd>${av?'Download link right after checkout':'Available at launch'}</dd><dt>Price</dt><dd>${av?'Shown at checkout':'Announced at launch'}</dd></dl></div>
    </div>
  </div>`;
  const pdpSignup=$('[data-pdp] [data-signup]');if(pdpSignup)signupForm(pdpSignup);
  const i=PRODUCTS.indexOf(p);$('[data-products="related"]').innerHTML=[1,2].map(k=>productCard(PRODUCTS[(i+k)%PRODUCTS.length])).join('');
  return true}
function articleCard(a){return `<a class="a-card" href="#edit-${a.id}">${photo(a.art,a.tone,`Article image: ${a.title}`,false)}
  <div class="a-meta"><span>${a.cat}</span><span>${a.read}</span></div><h3>${a.title}</h3><p>${a.dek}</p></a>`}
function resourceCard(r){return `<article class="r-card">${photo(r.art,r.tone,`Preview of ${r.name}`)}
  <div class="p-body"><div class="p-meta"><span>Free printable</span></div><h3 class="h-3">${r.name}</h3><p class="muted">${r.text}</p></div>
  <div class="p-actions"><button class="btn btn-primary btn-sm" type="button" data-get-resource="${r.name}">Get it free</button></div></article>`}
let formN=0;
function signupForm(el){const id='su'+(++formN),cta=el.dataset.cta||'Sign up',res=el.dataset.resource||'';
  el.innerHTML=`<form class="signup" novalidate data-res="${res}">
    <div class="signup-row"><label class="sr" for="${id}" style="position:absolute;left:-9999px">Email address</label>
    <input id="${id}" type="email" name="email" autocomplete="email" placeholder="Your email address" required>
    <button class="btn ${el.closest('.band-noir')||el.closest('.site-footer')?'btn-gold':'btn-primary'}" type="submit">${cta}</button></div>
    <p class="form-msg" aria-live="polite"></p>
    <p class="fine">By signing up you agree to receive emails from Money &amp; Grace Co. Unsubscribe anytime.</p></form>`}
const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

/* ---------- render ---------- */
let shopFilter='All',editFilter='All';
function renderShop(){const cats=['All','Planners','Trackers','Challenges'];
  $('[data-shop-filters]').innerHTML=cats.map(c=>`<button class="chip" type="button" aria-pressed="${c===shopFilter}" data-shopcat="${c}">${c}</button>`).join('');
  $('[data-products="shop"]').innerHTML=PRODUCTS.filter(p=>shopFilter==='All'||p.cat===shopFilter).map(productCard).join('')}
function renderEdit(){const cats=['All','Budgeting','Saving','Debt','Planning'];
  $('[data-edit-filters]').innerHTML=cats.map(c=>`<button class="chip" type="button" aria-pressed="${c===editFilter}" data-editcat="${c}">${c}</button>`).join('');
  const f=ARTICLES[0];
  $('[data-article-feature]').innerHTML=`<a class="a-feature" href="#edit-${f.id}">${photo(f.art,'sand',`Feature image: ${f.title}`,false)}
    <div class="a-feature-copy"><span class="eyebrow">Editor’s pick · ${f.cat}</span><h3>${f.title}</h3><p class="lede">${f.dek}</p><span class="link-arrow">Read the article <span>→</span></span></div></a>`;
  $('[data-articles="all"]').innerHTML=ARTICLES.slice(1).filter(a=>editFilter==='All'||a.cat===editFilter).map(articleCard).join('')||'<p class="muted">More articles in this category are coming soon.</p>'}
function renderArticle(id){const a=ARTICLES.find(x=>x.id===id);if(!a)return false;
  $('[data-article-head]').innerHTML=`<a class="crumb" href="#money-edit">← The Money Edit</a><div class="a-meta"><span>${a.cat}</span><span>${a.read}</span></div><h1 class="h-1">${a.title}</h1><p class="lede" style="max-width:52ch">${a.dek}</p>`;
  $('[data-article-hero]').innerHTML=photo(a.art,a.tone,`Article image: ${a.title}`,false);
  $('[data-article-body]').innerHTML=a.body.join('')+`<div class="disclaimer">The Money Edit is for education and encouragement. It is not personalized financial, tax, or legal advice.</div>
    <div style="margin-top:40px;display:flex;flex-wrap:wrap;gap:12px"><a class="btn btn-primary" href="#free-resources">Get the free budget kit</a><a class="btn btn-ghost" href="#shop">Shop planners</a></div>`;
  $('[data-articles="related"]').innerHTML=ARTICLES.filter(x=>x.id!==id).sort((x,y)=>(y.cat===a.cat)-(x.cat===a.cat)).slice(0,3).map(articleCard).join('');
  return true}
function renderStatic(){
  $('[data-products="featured"]').innerHTML=PRODUCTS.map(productCard).join('');
  $('[data-articles="home"]').innerHTML=ARTICLES.slice(0,3).map(articleCard).join('');
  $('[data-resources]').innerHTML=RESOURCES.map(resourceCard).join('');
  $$('[data-art]').forEach(el=>{el.setAttribute('role','img');el.setAttribute('aria-label',el.dataset.label||'');el.style.setProperty('--tone',TONES[el.dataset.tone]||TONES.blush);el.innerHTML=scene(el.dataset.art)});
  $$('[data-grace-art]').forEach(el=>el.innerHTML=GRACE);
  $$('[data-signup]').forEach(signupForm);
  $$('[data-socials]').forEach(el=>el.innerHTML=SOCIALS.map(s=>`<a href="${s.url}" target="_blank" rel="noopener" aria-label="${s.name}"><svg viewBox="0 0 24 24" aria-hidden="true">${s.svg}</svg></a>`).join(''));
  $('[data-year]').textContent=new Date().getFullYear();
  $$('[data-email]').forEach(e=>e.textContent=EMAIL);$$('[data-copy]').forEach(b=>b.dataset.copy=EMAIL);
  if(EMAIL!=='hello@moneyandgraceco.com')$$('[data-email-note]').forEach(e=>e.hidden=true);
  $$('[data-steps-mount]').forEach(mountSteps);
  renderShop();renderEdit();
}

/* ---------- ritual checklists (saved per device) ---------- */
const STEPS={
  sunday:[['Check your balances','Peek at checking, savings, and card balances.','2 min'],['Review last week','Skim your spending. Any surprises?','4 min'],['Look at the week ahead','Bills due, plans, and anything that costs money.','3 min'],['Pay yourself first','Move something to savings, even if it is small.','3 min'],['Set one money intention','One sentence for the week. Keep it kind.','3 min']],
  savings:[['Weekend one','Plan free fun before Saturday arrives.','Week 1'],['Weekend two','Eat from the pantry and skip takeout.','Week 2'],['Weekend three','Invite a friend for a no-cost hangout.','Week 3'],['Weekend four','Move what you saved into savings.','Week 4']],
  debt:[['List every balance','Balance, rate, and minimum for each debt.','10 min'],['Choose your method','Snowball for momentum or avalanche for less interest.','5 min'],['Pay every minimum','Set reminders or autopay so nothing slips.','5 min'],['Send extra to your focus debt','Even a small amount moves the needle.','2 min'],['Color in your progress','Update your tracker and celebrate.','3 min']],
  monthly:[['Close out last month','Compare what you planned with what you spent.','10 min'],['Celebrate one win','Write down a money win, no matter how small.','2 min'],['Plan this month’s budget','Give every dollar a job before the month starts.','15 min'],['Update your goals','Check savings and debt progress. Color in your trackers.','5 min'],['Book your money dates','Put four Sunday check-ins on your calendar.','3 min']]
};
const store={get(k){try{return JSON.parse(localStorage.getItem('mg-'+k))||[]}catch(e){return[]}},set(k,v){try{localStorage.setItem('mg-'+k,JSON.stringify(v))}catch(e){}}};
function mountSteps(el){const k=el.dataset.stepsMount,items=STEPS[k],saved=store.get(k);
  if(el.hasAttribute('data-static')){$$('input[data-step]',el).forEach((c,i)=>c.checked=!!saved[i]);updSteps(el);return}
  el.innerHTML=`<div class="progress"><span data-prog-label>0 of ${items.length} done</span><span class="progress-bar"><i></i></span></div>
  <ol class="steps">${items.map((it,i)=>`<li class="step"><label for="${k}-${i}"><input type="checkbox" id="${k}-${i}" data-step ${saved[i]?'checked':''}><span><b>${it[0]}</b><small>${it[1]}</small></span><span class="mins">${it[2]}</span></label></li>`).join('')}</ol>
  <div class="steps-foot"><button class="link-arrow" type="button" data-reset-steps>Start over <span>↺</span></button></div>`;
  updSteps(el)}
function updSteps(el){const cs=$$('input[data-step]',el),n=cs.filter(c=>c.checked).length;$('[data-prog-label]',el).textContent=`${n} of ${cs.length} ${el.dataset.stepsMount==='challenge'?'weeks ':''}done`;$('.progress-bar i',el).style.width=(n/cs.length*100)+'%';return n===cs.length}
document.addEventListener('change',e=>{const c=e.target;if(!c.hasAttribute('data-step'))return;const el=c.closest('[data-steps-mount]'),k=el.dataset.stepsMount;
  store.set(k,$$('input[data-step]',el).map(x=>x.checked));if(updSteps(el)&&c.checked)toast(DONE_MSG[k])});
const DONE_MSG={sunday:'Sunday Reset done. Have a lovely week.',monthly:'Monthly reset done. Grace is proud of you.',challenge:'Challenge complete. Your Calm Fund is ready.',savings:'Four no-spend weekends. Look at you go.',debt:'Debt check-in done. Every payment counts.'};

const PROMPTS=[...document.querySelectorAll('.prompt-set li')].map(li=>li.textContent);
let promptIdx=-1;
/* ---------- router ---------- */
const PAGES=['home','money-edit','shop','reset-room','free-resources','about','contact'];
let pendingScroll=null;
function route(){
  let h=decodeURIComponent(location.hash.slice(1))||'home',page=h;
  if(h.startsWith('edit-')){page=renderArticle(h.slice(5))?'article':'money-edit'}
  else if(h.startsWith('product-')){page=renderProduct(h.slice(8))?'product':'shop'}
  else if(!PAGES.includes(h)){page='home'}
  $$('[data-page]').forEach(p=>{const on=p.dataset.page===page;p.hidden=!on;if(on){p.style.animation='none';void p.offsetWidth;p.style.animation=''}});
  $$('.nav a,.drawer nav a').forEach(a=>a.toggleAttribute('aria-current',a.getAttribute('href')==='#'+({article:'money-edit',product:'shop'}[page]||page)));
  $$('.nav a,.drawer nav a').forEach(a=>{if(a.hasAttribute('aria-current'))a.setAttribute('aria-current','page')});
  closeMenu();
  if(pendingScroll){const t=$(pendingScroll);pendingScroll=null;if(t){setTimeout(()=>t.scrollIntoView({behavior:'smooth'}),60);return}}
  const de=document.documentElement;de.style.scrollBehavior='auto';window.scrollTo(0,0);de.style.scrollBehavior='';
}
window.addEventListener('hashchange',route);

/* ---------- menu ---------- */
const drawer=$('#drawer'),menuBtn=$('#menu-open');
function openMenu(){drawer.classList.add('open');menuBtn.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';setTimeout(()=>$('#menu-close').focus(),50)}
function closeMenu(){if(!drawer.classList.contains('open'))return;drawer.classList.remove('open');menuBtn.setAttribute('aria-expanded','false');document.body.style.overflow=''}
menuBtn.addEventListener('click',openMenu);$('#menu-close').addEventListener('click',closeMenu);

document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenu()});

/* ---------- toast ---------- */
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(tt);tt=setTimeout(()=>t.classList.remove('show'),2600)}

/* ---------- Grace tips ---------- */
let tip=0;function showTip(){const el=$('[data-tip]');el.parentElement.style.opacity=.2;setTimeout(()=>{el.textContent=TIPS[tip];el.parentElement.style.opacity=1},180)}

/* ---------- events ---------- */
document.addEventListener('click',e=>{
  const t=e.target.closest('button,a');if(!t)return;
  if(t.closest('#drawer')&&t.tagName==='A')closeMenu();
  if(t.tagName==='A'&&!t.dataset.scroll&&/^#[\w-]+$/.test(t.getAttribute('href')||'')&&t.getAttribute('href')===(location.hash||'#home')){e.preventDefault();window.scrollTo({top:0,behavior:'smooth'})}
  if(t.dataset.filter){shopFilter=t.dataset.filter;renderShop()}
  if(t.matches('.nav a[href="#shop"],.drawer a[href="#shop"],.foot-col a[href="#shop"]')){shopFilter='All';renderShop()}
  if(t.dataset.shopcat){shopFilter=t.dataset.shopcat;renderShop()}
  if(t.dataset.editcat){editFilter=t.dataset.editcat;renderEdit()}
  if(t.dataset.preview){const g=t.closest('.gallery'),p=PRODUCTS.find(x=>location.hash==='#product-'+x.id),v=p.previews[+t.dataset.preview];
    $('[data-gallery-main]',g).innerHTML=photo(v[0],v[1],`${p.name}: ${v[2]}`);$$('.thumb',g).forEach(b=>b.setAttribute('aria-pressed',b===t));$('[data-preview-cap]',g).textContent='Preview: '+v[2]}
  if(t.hasAttribute('data-checkout')&&!/^https:\/\//.test(t.getAttribute('href')||'')){e.preventDefault();toast('Checkout is opening soon. Please check back shortly.')}
  if(t.hasAttribute('data-reset-steps')){const el=t.closest('[data-steps-mount]');$$('input[data-step]',el).forEach(c=>c.checked=false);store.set(el.dataset.stepsMount,[]);updSteps(el);toast('Checklist cleared. Fresh start.')}
  if(t.hasAttribute('data-draw-prompt')){const q=$('[data-prompt]');let i;do{i=Math.floor(Math.random()*PROMPTS.length)}while(PROMPTS.length>1&&(i===promptIdx||PROMPTS[i]===q.textContent));promptIdx=i;q.style.opacity=0;setTimeout(()=>{q.textContent=PROMPTS[i];q.style.opacity=1},200)}
  if(t.dataset.pick){const c=document.getElementById(t.dataset.pick);if(c)c.checked=true}
  if(t.hasAttribute('data-next-tip')){tip=(tip+1)%TIPS.length;showTip()}
  if(t.dataset.scroll){const here=(location.hash||'#home')===t.getAttribute('href');if(here){e.preventDefault();const el=$(t.dataset.scroll);el&&el.scrollIntoView({behavior:'smooth'})}else pendingScroll=t.dataset.scroll}
  if(t.dataset.getResource){const f=$('#kit form');f.dataset.res=t.dataset.getResource;$('#kit').scrollIntoView({behavior:'smooth'});setTimeout(()=>f.querySelector('input').focus({preventScroll:true}),500);toast(`Enter your email to get the ${t.dataset.getResource}`)}
  if(t.dataset.copy){const v=t.dataset.copy;(navigator.clipboard?navigator.clipboard.writeText(v):Promise.reject()).then(()=>toast('Email address copied')).catch(()=>{const r=document.createRange();const c=t.closest('.copy-row')?.querySelector('code')||t;r.selectNodeContents(c);const s=getSelection();s.removeAllRanges();s.addRange(r);toast('Address selected. Copy it from here.')})}
});
/* ---------- form delivery ----------
   Each form posts to the endpoint set in js/config.js (MG_CONFIG.forms).
   If no endpoint is set, nothing is sent and the visitor is told so. */
function sendForm(kind,fields){
  const url=((MG.forms||{})[kind]||'').trim();
  if(!url)return Promise.resolve('not-connected');
  const fd=new FormData();Object.entries(fields).forEach(([k,v])=>fd.append(k,v));fd.append('form',kind);
  return fetch(url,{method:'POST',body:fd,headers:{Accept:'application/json'}}).then(r=>{if(!r.ok)throw new Error(r.status);return 'sent'});
}
function notConnected(kind){const m=(MG.notConnectedMessages||{})[kind]||'This form is not connected yet, so nothing was sent or saved. Please check back soon.';
  return `<div class="success" role="status"><b>Thank you for your interest.</b><span>${m}</span></div>`}
function busy(f,on){const b=f.querySelector('button[type=submit]');if(b){b.disabled=on;b.style.opacity=on?.6:''}}
function failed(f,msg){busy(f,false);msg.className='form-msg err';msg.textContent='Something went wrong while sending. Please try again in a moment.'}
document.addEventListener('submit',e=>{
  const f=e.target;e.preventDefault();
  if(f.classList.contains('signup')){
    const inp=f.querySelector('input'),msg=f.querySelector('.form-msg');
    if(!validEmail(inp.value)){msg.className='form-msg err';msg.textContent='Please enter a valid email address, like you@email.com.';inp.focus();return}
    const what=f.dataset.res,kind=what&&what.endsWith('launch')?'notify':'newsletter';busy(f,true);
    sendForm(kind,{email:inp.value.trim(),source:what||'Newsletter'}).then(r=>{
      f.outerHTML=r==='not-connected'?notConnected(kind):`<div class="success" role="status"><b>You’re in, bestie.</b><span>${what?`We’ll send ${what.endsWith('launch')?'news about the '+what:'the '+what} to ${inp.value.trim()}.`:`Welcome to the list. Check ${inp.value.trim()} for a hello from Grace.`}</span></div>`}).catch(()=>failed(f,msg));
    return}
  if(f.id==='reset-form'){
    const msg=$('#reset-msg'),em=$('#r-email'),nm=$('#r-name').value.trim();
    if(!validEmail(em.value)){msg.className='form-msg err';msg.textContent='Please enter a valid email address, like you@email.com.';em.focus();return}
    const picks=$$('.pick input:checked',f).map(c=>c.value);
    busy(f,true);
    sendForm('community',{email:em.value.trim(),first_name:nm,interests:picks.join(', ')}).then(r=>{
      f.innerHTML=r==='not-connected'?notConnected('community'):`<div class="success" role="status"><b>Welcome to the Money &amp; Grace community${nm?', '+nm:''}.</b><span>${picks.length?`You picked: ${picks.join(', ')}.`:'You will get our general Reset Room emails.'} Your welcome kit will go to ${em.value.trim()}.</span></div>`}).catch(()=>failed(f,msg));
    return}
  if(f.id==='win-form'){
    const msg=$('#win-msg'),em=$('#w-email'),tx=$('#w-text');
    const bad=!validEmail(em.value)?[em,'Please enter a valid email address, like you@email.com.']:!tx.value.trim()?[tx,'Please tell us your win. Big or small, it counts.']:null;
    if(bad){msg.className='form-msg err';msg.textContent=bad[1];bad[0].focus();return}
    const ok=$('#w-ok').checked;busy(f,true);
    sendForm('wins',{email:em.value.trim(),first_name:$('#w-name').value.trim(),win:tx.value.trim(),permission_to_share:ok?'yes':'no'}).then(r=>{
      f.innerHTML=r==='not-connected'?notConnected('wins'):`<div class="success" role="status"><b>That is a beautiful win.</b><span>${ok?'Thank you for letting us share it.':'We will keep it just between us.'}</span></div>`}).catch(()=>failed(f,msg));
    return}
  if(f.id==='contact-form'){
    const msg=$('#contact-msg'),n=$('#c-name'),em=$('#c-email'),m=$('#c-msg');
    const bad=!n.value.trim()?[n,'Please add your name.']:!validEmail(em.value)?[em,'Please enter a valid email address.']:!m.value.trim()?[m,'Please write a short message.']:null;
    if(bad){msg.className='form-msg err';msg.textContent=bad[1];bad[0].focus();return}
    msg.className='form-msg';busy(f,true);const first=n.value.trim().split(' ')[0];
    sendForm('contact',{name:n.value.trim(),email:em.value.trim(),topic:$('#c-topic').value,message:m.value.trim()}).then(r=>{
      f.innerHTML=r==='not-connected'?notConnected('contact'):`<div class="success" role="status"><b>Thank you, ${first}.</b><span>Your message about “${$('#c-topic').value}” is on its way. We will reply by email.</span></div>`}).catch(()=>failed(f,msg));
  }
});

renderStatic();tip=0;$('[data-tip]').textContent=TIPS[0];route();

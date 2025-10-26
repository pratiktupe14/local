/* Local Job Portal — Frontend demo
   - Single-page frontend app with localStorage persistence
   - Features: auth (demo), jobs CRUD, filters (district/taluka/village), trainings, guidance, bilingual (en/hi), admin, community, notifications
*/

/* ================= Demo Data & Initialization ================= */
const demoUsers = [
  { id: 'u_admin', name: 'Admin', email: 'admin@portal', password: 'admin123', role: 'admin' },
  { id: 'u_emp', name: 'Employer Demo', email: 'emp@portal', password: 'emp123', role: 'employer' },
  { id: 'u_js', name: 'Seema', email: 'seema@portal', password: 'js123', role: 'jobseeker' }
];

const demoJobs = [
  { id: 'j1', title: 'Farm Assistant', district: 'Pune', taluka: 'Baramati', village: 'Karjat', type: 'Daily Wage', salary: '₹250/day', desc: 'Assist with seeding, harvesting and basic farm work', postedBy: 'u_emp', date: '2025-01-10' },
  { id: 'j2', title: 'Tailoring Apprentice', district: 'Nashik', taluka: 'Sinnar', village: 'Dhulegaon', type: 'Apprenticeship', salary: 'Stipend', desc: 'Learn tailoring and help with local orders', postedBy: 'u_emp', date: '2025-03-02' },
  { id: 'j3', title: 'Data Entry (Local Office)', district: 'Nagpur', taluka: 'Kamptee', village: 'Gondpimpari', type: 'Part Time', salary: '₹8000/month', desc: 'Maintain agriculture records and assist office tasks', postedBy: 'u_emp', date: '2025-04-15' }
];

const demoTrainings = [
  { id:'t1', title: 'Digital Literacy — 2 weeks', provider:'Gov Skill', desc:'Basics of computer use, MS Office & internet' },
  { id:'t2', title: 'Welding & Fabrication — 1 month', provider:'Local NGO', desc:'Hands-on welding, safety & fabrication' },
  { id:'t3', title: 'Mobile Repair Basics — 3 weeks', provider:'Trade School', desc:'Diagnose and repair common phone issues' }
];

const demoCommunity = [
  { id:'c1', author:'Seema', content:'Completed digital literacy, now working as data entry!', date:'2025-06-01' }
];

function read(key){ return JSON.parse(localStorage.getItem(key) || 'null'); }
function write(key,val){ localStorage.setItem(key, JSON.stringify(val)); }

function ensureInit(){
  if(!read('users')) write('users', demoUsers);
  if(!read('jobs')) write('jobs', demoJobs);
  if(!read('trainings')) write('trainings', demoTrainings);
  if(!read('community')) write('community', demoCommunity);
  if(!read('settings')) write('settings', { lang:'en' });
}
ensureInit();

/* ================= Location Data (District -> Taluka) =================
   A compact set of Maharashtra districts & some talukas for demo.
   You can expand this object as needed.
*/
const locationData = {
  "Pune": ["Baramati","Junnar","Maval","Mulshi","Daund","Indapur","Bhor","Haveli"],
  "Mumbai City": ["Colaba","Byculla","Malabar Hill"],
  "Mumbai Suburban": ["Andheri","Borivali","Kurla"],
  "Nagpur": ["Kamptee","Umred","Katol","Hingna"],
  "Nashik": ["Sinnar","Malegaon","Niphad","Baglan"],
  "Aurangabad": ["Kannad","Sillod","Paithan"],
  "Solapur": ["Pandharpur","Barshi","Mohol"],
  "Kolhapur": ["Karveer","Panhala","Hatkanangale"],
  "Satara": ["Karad","Wai","Patan"],
  "Sangli": ["Tasgaon","Miraj","Jat"],
  "Ahmednagar": ["Shrirampur","Sangamner","Kopargaon"],
  "Amravati": ["Achalpur","Daryapur","Morshi"],
  "Chandrapur": ["Warora","Bhadrawati","Mul"],
  "Latur": ["Ausa","Udgir","Renapur"],
  "Beed": ["Ashti","Georai","Ambajogai"]
};

/* ================= Elements ================= */
const filterDistrict = document.getElementById('filterDistrict');
const filterTaluka = document.getElementById('filterTaluka');
const districtPost = document.getElementById('districtPost');
const talukaPost = document.getElementById('talukaPost');

const jobListEl = document.getElementById('jobList');
const jobsCountEl = document.getElementById('jobsCount');
const trainingListEl = document.getElementById('trainingList');
const communityFeedEl = document.getElementById('communityFeed');
const adminJobListEl = document.getElementById('adminJobList');
const adminUserListEl = document.getElementById('adminUserList');

const langSelect = document.getElementById('langSelect');
let currentUser = read('currentUser') || null;

/* ================= Populate Districts into selects ================= */
function populateDistricts(){
  for(let d in locationData){
    const opt = new Option(d,d);
    filterDistrict.add(opt.cloneNode(true));
    districtPost.add(opt.cloneNode(true));
  }
}
populateDistricts();

/* ================= Taluka population functions ================= */
function populateTalukasForFilter(){
  filterTaluka.innerHTML = '<option value="">Select Taluka</option>';
  const tal = locationData[filterDistrict.value] || [];
  tal.forEach(t => filterTaluka.add(new Option(t,t)));
}
function populateTalukasForPost(){
  talukaPost.innerHTML = '<option value="">Select Taluka</option>';
  const tal = locationData[districtPost.value] || [];
  tal.forEach(t => talukaPost.add(new Option(t,t)));
}
filterDistrict.addEventListener('change', populateTalukasForFilter);
districtPost.addEventListener('change', populateTalukasForPost);

/* ================= Render functions ================= */
function renderJobs(list){
  jobListEl.innerHTML = '';
  if(!list || list.length===0){ jobListEl.innerHTML = '<p>No jobs found.</p>'; jobsCountEl.textContent = '0 results'; return; }
  jobsCountEl.textContent = `${list.length} results`;
  list.forEach(j => {
    const wrapper = document.createElement('div'); wrapper.className = 'card job-item';
    wrapper.innerHTML = `
      <div class="job-main">
        <h3>${escapeHTML(j.title)}</h3>
        <div class="job-meta">${escapeHTML(j.district)} · ${escapeHTML(j.taluka)} · ${escapeHTML(j.village||'')}</div>
        <p class="muted">${escapeHTML(j.type||'')} · ${escapeHTML(j.salary||'')}</p>
        <p>${escapeHTML(j.desc||'')}</p>
      </div>
      <div class="job-actions">
        <button class="apply-btn" data-id="${j.id}">Apply</button>
        <button class="save-btn" data-id="${j.id}">Save</button>
        <button class="share-btn" data-id="${j.id}">Share</button>
        ${(currentUser && (currentUser.role==='employer' && currentUser.id===j.postedBy) || (currentUser && currentUser.role==='admin')) ? `<button class="edit-btn" data-id="${j.id}">Edit</button><button class="del-btn" data-id="${j.id}">Delete</button>` : ''}
      </div>
    `;
    jobListEl.appendChild(wrapper);
  });
}

function renderTrainings(){
  const trainings = read('trainings') || [];
  trainingListEl.innerHTML = trainings.map(t => `<li><strong>${escapeHTML(t.title)}</strong> — ${escapeHTML(t.provider)}<div class="small">${escapeHTML(t.desc)}</div></li>`).join('');
}

function renderCommunity(){
  const posts = (read('community') || []).slice().reverse();
  communityFeedEl.innerHTML = posts.map(p => `<div class="post card"><strong>${escapeHTML(p.author)}</strong> <div class="muted small">${escapeHTML(p.date)}</div><p>${escapeHTML(p.content)}</p></div>`).join('');
}

function renderAdmin(){
  const jobs = read('jobs') || [];
  const users = read('users') || [];
  adminJobListEl.innerHTML = jobs.map(j => `<div class="admin-job"><strong>${escapeHTML(j.title)}</strong> <div class="muted small">${escapeHTML(j.district)} · ${escapeHTML(j.taluka)}</div><div><button class="admin-del" data-id="${j.id}">Delete</button></div></div>`).join('');
  adminUserListEl.innerHTML = users.map(u => `<div class="admin-user"><strong>${escapeHTML(u.name)}</strong> <div class="muted small">${escapeHTML(u.email)} · ${escapeHTML(u.role)}</div></div>`).join('');
}

/* ================= Utilities ================= */
function escapeHTML(s){ return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function uid(prefix='id'){ return prefix + Math.random().toString(36).slice(2,9); }
function todayStr(){ return new Date().toISOString().slice(0,10); }

/* ================= Search & Filters ================= */
function getJobs(){ return read('jobs') || []; }
function applyFilters(){
  const q = (document.getElementById('searchQ').value || '').toLowerCase();
  const district = (filterDistrict.value || '');
  const taluka = (filterTaluka.value || '');
  const village = (document.getElementById('filterVillage').value || '').toLowerCase();
  const type = (document.getElementById('filterType').value || '');
  let list = getJobs();
  if(q) list = list.filter(j => (j.title + ' ' + (j.desc||'') + ' ' + (j.meta||'')).toLowerCase().includes(q));
  if(district) list = list.filter(j => j.district === district);
  if(taluka) list = list.filter(j => j.taluka === taluka);
  if(village) list = list.filter(j => (j.village || '').toLowerCase().includes(village));
  if(type) list = list.filter(j => (j.type || '') === type);
  renderJobs(list);
}

/* ======== Bind search button ======== */
document.getElementById('searchBtn').addEventListener('click', applyFilters);
document.getElementById('searchQ').addEventListener('keyup', (e) => { if(e.key === 'Enter') applyFilters(); });

/* ================= Post Job Modal & CRUD ================= */
const modalOverlay = document.getElementById('modalOverlay');
document.getElementById('openPostJob').addEventListener('click', ()=> {
  if(!currentUser || currentUser.role !== 'employer'){ return alert('Please login as employer to post (demo).'); }
  document.getElementById('modalTitle').textContent = 'Post a Job';
  modalOverlay.classList.remove('hidden');
});
document.getElementById('closeModal').addEventListener('click', ()=> modalOverlay.classList.add('hidden'));
document.getElementById('cancelPost').addEventListener('click', ()=> modalOverlay.classList.add('hidden'));

document.getElementById('postJobForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const jobs = read('jobs') || [];
  const job = {
    id: uid('j'),
    title: document.getElementById('jobTitle').value,
    district: document.getElementById('districtPost').value,
    taluka: document.getElementById('talukaPost').value,
    village: document.getElementById('villagePost').value,
    type: document.getElementById('jobType').value,
    salary: document.getElementById('jobSalary').value,
    desc: document.getElementById('jobDesc').value,
    postedBy: currentUser ? currentUser.id : 'guest',
    date: todayStr()
  };
  jobs.unshift(job);
  write('jobs', jobs);
  modalOverlay.classList.add('hidden');
  applyFilters();
  renderAdmin();
  notify(`Job posted: ${job.title}`);
  e.target.reset();
});

/* ================= Jobs list actions (delegation) ================= */
jobListEl.addEventListener('click', (e) => {
  const id = e.target.dataset.id;
  if(e.target.classList.contains('apply-btn')){
    const jobs = getJobs(); const job = jobs.find(j=>j.id===id);
    if(!job) return;
    if(!currentUser || currentUser.role === 'employer'){ alert('Please login as job seeker to apply (demo).'); return; }
    const msg = prompt(`Apply for ${job.title} — write a short message (optional):`);
    if(msg !== null){ notify(`Application demo sent for ${job.title}`); alert('Application (demo) submitted!'); }
  }
  if(e.target.classList.contains('save-btn')){
    const saved = JSON.parse(localStorage.getItem('savedJobs') || '[]');
    if(!saved.includes(id)) saved.push(id);
    localStorage.setItem('savedJobs', JSON.stringify(saved));
    notify('Job saved to your list (demo).');
  }
  if(e.target.classList.contains('share-btn')){
    const job = getJobs().find(j=>j.id===id);
    if(!job) return;
    const text = `Job: ${job.title} — ${job.district} / ${job.taluka} · ${job.type}`;
    navigator.clipboard?.writeText(text).then(()=> alert('Job details copied to clipboard (share demo).'), ()=> alert(text));
  }
  if(e.target.classList.contains('edit-btn')){
    const jobs = getJobs(); const job = jobs.find(j=>j.id===id);
    if(!job) return;
    if(!currentUser || (currentUser.role !== 'employer' && currentUser.role !== 'admin')) return alert('Not allowed.');
    document.getElementById('jobTitle').value = job.title;
    document.getElementById('districtPost').value = job.district;
    populateTalukasForPost();
    document.getElementById('talukaPost').value = job.taluka;
    document.getElementById('villagePost').value = job.village || '';
    document.getElementById('jobType').value = job.type || '';
    document.getElementById('jobSalary').value = job.salary || '';
    document.getElementById('jobDesc').value = job.desc || '';
    document.getElementById('modalTitle').textContent = 'Edit Job';
    modalOverlay.classList.remove('hidden');

    const form = document.getElementById('postJobForm');
    const handler = function(ev){
      ev.preventDefault();
      job.title = document.getElementById('jobTitle').value;
      job.district = document.getElementById('districtPost').value;
      job.taluka = document.getElementById('talukaPost').value;
      job.village = document.getElementById('villagePost').value;
      job.type = document.getElementById('jobType').value;
      job.salary = document.getElementById('jobSalary').value;
      job.desc = document.getElementById('jobDesc').value;
      write('jobs', jobs);
      modalOverlay.classList.add('hidden');
      applyFilters(); renderAdmin(); notify('Job updated (demo).');
      form.removeEventListener('submit', handler);
      form.reset();
    };
    form.addEventListener('submit', handler);
  }
  if(e.target.classList.contains('del-btn')){
    if(!confirm('Delete this job?')) return;
    let jobs = getJobs(); jobs = jobs.filter(j=>j.id !== id); write('jobs', jobs);
    applyFilters(); renderAdmin(); notify('Job deleted (demo).');
  }
});

/* ================= Quick Apply & Alerts demo ================= */
document.getElementById('quickApplyForm').addEventListener('submit', (e) => {
  e.preventDefault();
  alert('Application (demo) sent. In production this would be sent to employer via backend.');
  e.target.reset();
});
document.getElementById('enableAlerts').addEventListener('click', () => {
  const phone = prompt('Enter phone number to receive demo alerts (no real SMS will be sent):');
  if(phone){ localStorage.setItem('alertPhone', phone); notify('Alerts enabled (demo).'); }
});

/* ================= Auth (simple localStorage) ================= */
const authOverlay = document.getElementById('authOverlay');
document.getElementById('openAuth').addEventListener('click', () => { authOverlay.classList.remove('hidden'); });
document.getElementById('closeAuth').addEventListener('click', () => authOverlay.classList.add('hidden'));

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', e => {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  e.currentTarget.classList.add('active');
  const target = e.currentTarget.dataset.tab;
  document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById(target).classList.add('active');
}));

// Login
document.getElementById('loginForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const pwd = document.getElementById('loginPassword').value;
  const role = document.getElementById('loginRole').value;
  const users = read('users') || [];
  const u = users.find(x => x.email === email && x.password === pwd && x.role === role);
  if(!u){ return alert('Invalid credentials (demo). Try demo user.'); }
  currentUser = {...u};
  write('currentUser', currentUser);
  authOverlay.classList.add('hidden');
  afterLogin();
});
document.getElementById('demoUser').addEventListener('click', ()=>{
  document.getElementById('loginEmail').value = 'seema@portal';
  document.getElementById('loginPassword').value = 'js123';
  document.getElementById('loginRole').value = 'jobseeker';
});

// Signup
document.getElementById('signupForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const pwd = document.getElementById('signupPassword').value;
  const role = document.getElementById('signupRole').value;
  const users = read('users') || [];
  if(users.find(u=>u.email === email)) return alert('Email already used (demo).');
  const newUser = { id: uid('u'), name, email, password: pwd, role };
  users.push(newUser);
  write('users', users);
  currentUser = newUser;
  write('currentUser', currentUser);
  authOverlay.classList.add('hidden');
  afterLogin();
  alert('Account created (demo).');
});

/* ================= After login UI changes ================= */
function afterLogin(){
  const openAuthBtn = document.getElementById('openAuth');
  if(currentUser){
    openAuthBtn.textContent = `${currentUser.name} (${currentUser.role}) — Logout`;
    openAuthBtn.removeEventListener('click', () => {});
    openAuthBtn.addEventListener('click', logoutHandler);
  }
  renderAdmin();
}
function logoutHandler(){ localStorage.removeItem('currentUser'); currentUser = null; location.reload(); }

/* ================= Community posts ================= */
document.getElementById('openCommunityPost').addEventListener('click', () => {
  document.getElementById('communityOverlay').classList.remove('hidden');
});
document.getElementById('closeCommunity').addEventListener('click', () => document.getElementById('communityOverlay').classList.add('hidden'));
document.getElementById('cancelCommunity').addEventListener('click', () => document.getElementById('communityOverlay').classList.add('hidden'));
document.getElementById('communityForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const author = document.getElementById('postAuthor').value.trim();
  const content = document.getElementById('postContent').value.trim();
  if(!author || !content) return alert('Fill both fields');
  const posts = read('community') || [];
  posts.push({ id: uid('c'), author, content, date: todayStr() });
  write('community', posts);
  document.getElementById('communityOverlay').classList.add('hidden');
  renderCommunity();
});

/* ================= Admin delete in admin panel ================= */
adminJobListEl.addEventListener('click', (e) => {
  if(e.target.classList.contains('admin-del')){
    if(!confirm('Delete job?')) return;
    const id = e.target.dataset.id;
    let jobs = getJobs(); jobs = jobs.filter(j => j.id !== id); write('jobs', jobs);
    renderAdmin(); applyFilters(); notify('Job removed (admin demo).');
  }
});

/* ================= Notifications (demo) ================= */
function notify(text){
  const notes = read('notifications') || [];
  notes.unshift({ id: uid('n'), text, date: todayStr() });
  write('notifications', notes);
  showToast(text);
}
function showToast(text){
  const t = document.createElement('div');
  t.style.position='fixed'; t.style.right='16px'; t.style.bottom='16px';
  t.style.background='rgba(0,0,0,0.8)'; t.style.color='#fff'; t.style.padding='8px 12px';
  t.style.borderRadius='8px'; t.style.zIndex=9999; t.style.fontSize='14px';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(()=> t.style.opacity='0.01',2200);
  setTimeout(()=> t.remove(),2500);
}

/* ================= Guidance buttons ================= */
document.getElementById('resumeTipsBtn').addEventListener('click', ()=> {
  document.getElementById('guidanceContent').innerHTML = `<h4>Resume Tips</h4><ul><li>Keep it short (1 page)</li><li>Highlight skills & local experience</li><li>Use simple language</li></ul>`;
});
document.getElementById('interviewTipsBtn').addEventListener('click', ()=> {
  document.getElementById('guidanceContent').innerHTML = `<h4>Interview Tips</h4><ul><li>Be on time</li><li>Speak clearly and honestly</li><li>Dress neatly</li></ul>`;
});
document.getElementById('successStoriesBtn').addEventListener('click', ()=> {
  document.getElementById('guidanceContent').innerHTML = `<h4>Success Stories</h4><p>Seema completed digital literacy and got a data entry job in her taluka office.</p>`;
});

/* ================= Language (EN/HI) ================= */
const settings = read('settings') || { lang:'en' };
langSelect.value = settings.lang || 'en';
const translations = {
  hi: {
    'Local Job Portal': 'लोकल जॉब पोर्टल',
    'For Rural Youth': 'ग्रामीण युवा के लिए',
    'Job Listings': 'नौकरी सूची',
    'Search jobs, skills, employers...': 'नौकरियाँ, कौशल, नियोक्ता खोजें...',
    'Post a Job': 'नौकरी डालें',
    'Skill Training': 'कौशल प्रशिक्षण',
    'Career Guidance': 'कैरियर मार्गदर्शन',
    'Community': 'समुदाय',
    'Admin Panel (basic)': 'एडमिन पैनल (बुनियादी)',
    'Login / Signup': 'लॉगिन / साइनअप',
    'Quick Apply (Demo)': 'त्वरित आवेदन (डेमो)',
    'Find Local Jobs': 'स्थानीय नौकरियां खोजें',
    'Job Training': 'नौकरी प्रशिक्षण'
  }
};
function applyLang(l){
  if(l === 'hi'){
    document.getElementById('brandTitle').textContent = translations.hi['Local Job Portal'];
    document.getElementById('brandSubtitle').textContent = translations.hi['For Rural Youth'];
    document.getElementById('jobsTitle').textContent = translations.hi['Job Listings'];
    document.getElementById('searchQ').placeholder = translations.hi['Search jobs, skills, employers...'];
    document.getElementById('openPostJob').textContent = translations.hi['Post a Job'];
    document.querySelector('#trainingSection h3').textContent = translations.hi['Skill Training'];
    document.querySelector('#guidanceSection h3').textContent = translations.hi['Career Guidance'];
    document.querySelector('#communitySection h3').textContent = translations.hi['Community'];
    document.querySelector('#adminSection h2').textContent = translations.hi['Admin Panel (basic)'];
    document.getElementById('openAuth').textContent = translations.hi['Login / Signup'];
    document.querySelector('.quick-apply h3').textContent = translations.hi['Quick Apply (Demo)'];
    document.querySelector('header .nav-btn[data-target="trainingSection"]').textContent = translations.hi['Job Training'];
  } else {
    document.getElementById('brandTitle').textContent = 'Local Job Portal';
    document.getElementById('brandSubtitle').textContent = 'For Rural Youth';
    document.getElementById('jobsTitle').textContent = 'Job Listings';
    document.getElementById('searchQ').placeholder = 'Search jobs, skills, employers...';
    document.getElementById('openPostJob').textContent = 'Post a Job';
    document.querySelector('#trainingSection h3').textContent = 'Skill Training';
    document.querySelector('#guidanceSection h3').textContent = 'Career Guidance';
    document.querySelector('#communitySection h3').textContent = 'Community';
    document.querySelector('#adminSection h2').textContent = 'Admin Panel (basic)';
    document.getElementById('openAuth').textContent = 'Login / Signup';
    document.querySelector('.quick-apply h3').textContent = 'Quick Apply (Demo)';
    document.querySelector('header .nav-btn[data-target="trainingSection"]').textContent = 'Training';
  }
  settings.lang = l; write('settings', settings);
}
langSelect.addEventListener('change', (e)=> applyLang(e.target.value));
applyLang(settings.lang || 'en');

/* ================= Tab navigation ================= */
document.querySelectorAll('.nav-btn').forEach(b => b.addEventListener('click', (e) => {
  const target = e.currentTarget.dataset.target;
  document.getElementById(target).scrollIntoView({behavior:'smooth'});
}));

/* ================= Auth on-load adjustments ================= */
function initAuthUI(){
  const openAuthBtn = document.getElementById('openAuth');
  if(currentUser){
    openAuthBtn.textContent = `${currentUser.name} (${currentUser.role}) — Logout`;
    openAuthBtn.removeEventListener('click', ()=>{});
    openAuthBtn.addEventListener('click', logoutHandler);
  }
}
initAuthUI();

/* ================= Community, trainings, admin rendering on load ================= */
function initialRender(){
  applyFiltersDefault();
  renderTrainings();
  renderCommunity();
  renderAdmin();
}
function applyFiltersDefault(){ renderJobs(getJobs()); }

/* ================= Job data helper for external use ================= */
function getJobs(){ return read('jobs') || []; }

/* ================= Toast welcome (once) ================= */
function showWelcomeOnce(){
  const s = read('settings') || {};
  if(!s.shownWelcome){ notify('Welcome to Local Job Portal (demo)'); s.shownWelcome = true; write('settings', s); }
}

/* ================= Helpers for populating post talukas on open modal ================= */
function populateTalukasForPost(){
  talukaPost.innerHTML = '<option value="">Select Taluka</option>';
  const tal = locationData[districtPost.value] || [];
  tal.forEach(t => talukaPost.add(new Option(t,t)));
}

/* ================= Event: Open Post Job (fills district selects) ================= */
document.getElementById('openPostJob').addEventListener('click', () => {
  if(!currentUser || currentUser.role !== 'employer'){ return alert('Please login as employer to post (demo).'); }
  // ensure district lists are up to date
  districtPost.innerHTML = '<option value="">Select District</option>';
  for(let d in locationData) districtPost.add(new Option(d,d));
  document.getElementById('modalTitle').textContent = 'Post Job';
  document.getElementById('modalOverlay').classList.remove('hidden');
});

/* ================= On load ================= */
initialRender();
showWelcomeOnce();

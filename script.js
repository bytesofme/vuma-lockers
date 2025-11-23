/* script.js - Vuma Lockers rebuilt (localStorage-based full app)
   Pages: index.html, signup.html, admin.html, agent.html, customer.html
   Keys in localStorage:
    - vuma_users (array)
    - vuma_lockers (array)
    - vuma_parcels (array)
    - vuma_otps (array)
    - vuma_logged (object)
*/

const $ = id => document.getElementById(id);
const nowISO = () => new Date().toISOString();
const read = k => JSON.parse(localStorage.getItem(k) || 'null');
const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const seedIfEmpty = (k, val) => { if (!read(k)) write(k, val); };

// --- Seed default data (only first run) ---
(function seedAll(){
  seedIfEmpty('vuma_users', [
    { id: 1, username: "Admin", email: "admin@vuma.com", phone:"0700000000", password:"admin123", role:"admin", createdAt: nowISO() },
    { id: 2, username: "Agent One", email: "agent@vuma.com", phone:"0700000001", password:"agent123", role:"agent", createdAt: nowISO() },
    { id: 3, username: "Customer Demo", email: "customer@vuma.com", phone:"0700000002", password:"customer123", role:"customer", createdAt: nowISO() }
  ]);
  seedIfEmpty('vuma_lockers', [
    { id: 1, lockerNo: 'L-001', size:'small', status:'available' },
    { id: 2, lockerNo: 'L-002', size:'medium', status:'available' },
    { id: 3, lockerNo: 'L-003', size:'large', status:'available' },
    { id: 4, lockerNo: 'L-004', size:'small', status:'available' },
    { id: 5, lockerNo: 'L-005', size:'medium', status:'available' }
  ]);
  seedIfEmpty('vuma_parcels', []);
  seedIfEmpty('vuma_otps', []);
})();

// --- Utils ---
function genParcelId(){ return 'P' + Date.now().toString().slice(-9); }
function genOtp(){ return Math.floor(100000 + Math.random() * 900000).toString(); }
function findLockerBySize(size){
  const lockers = read('vuma_lockers') || [];
  return lockers.find(l => l.size === size && l.status === 'available') || null;
}
function updateLockersStorage(lockers){ write('vuma_lockers', lockers); }
function getLogged(){ return read('vuma_logged'); }
function logout(){ localStorage.removeItem('vuma_logged'); window.location.href = './index.html'; }
window.logout = logout;

// --- Auth: Signup & Login handlers (single delegated listener) ---
document.addEventListener('submit', function(e){
  const form = e.target;
  if (!form) return;

  // SIGNUP
  if (form.id === 'signupForm'){
    e.preventDefault();
    const name = ($('signupName') || {}).value || '';
    const email = (($('signupEmail')||{}).value || '').trim().toLowerCase();
    const pass = ($('signupPassword') || {}).value || '';
    if (!name || !email || !pass) { alert('Fill all fields'); return; }
    const users = read('vuma_users') || [];
    if (users.find(u => u.email === email)) { alert('Email already registered'); return; }
    const newId = (users[users.length-1]?.id || 0) + 1;
    users.push({ id: newId, username: name, email, password: pass, role: 'customer', createdAt: nowISO() });
    write('vuma_users', users);
    alert('Account created — please login');
    window.location.href = './index.html';
    return;
  }

  // LOGIN
  if (form.id === 'loginForm'){
    e.preventDefault();
    const email = (($('loginEmail')||{}).value || '').trim().toLowerCase();
    const pass = ($('loginPassword')||{}).value || '';
    const users = read('vuma_users') || [];
    const user = users.find(u => u.email === email && u.password === pass);
    if (!user){
      const err = $('loginError'); if (err){ err.textContent = 'Invalid credentials'; } else alert('Invalid credentials');
      return;
    }
    // store logged
    write('vuma_logged', { id: user.id, username: user.username, email: user.email, role: user.role });
    // redirect by role
    if (user.role === 'admin') window.location.href = './admin.html';
    else if (user.role === 'agent') window.location.href = './agent.html';
    else window.location.href = './customer.html';
    return;
  }

  // Admin: Add Parcel (manual)
  if (form.id === 'addParcelForm'){
    e.preventDefault();
    const recipient = ($('parcelRecipient')||{}).value || '';
    const email = (($('parcelEmail')||{}).value || '').trim().toLowerCase();
    const phone = ($('parcelPhone')||{}).value || '';
    const size = ($('parcelSize')||{}).value || 'small';
    if (!recipient || !email) { alert('Provide recipient and email'); return; }
    const parcels = read('vuma_parcels') || [];
    const lockers = read('vuma_lockers') || [];
    const assigned = findLockerBySize(size);
    const parcelId = genParcelId();
    parcels.push({ id: parcels.length+1, parcelId, recipient, recipientEmail: email, recipientPhone: phone, lockerId: assigned ? assigned.id : null, size, status: 'awaiting_pickup', depositTime: nowISO(), otp: null });
    write('vuma_parcels', parcels);
    if (assigned){
      const idx = lockers.findIndex(l=>l.id===assigned.id);
      lockers[idx].status = 'occupied';
      updateLockersStorage(lockers);
    }
    renderAdmin(); renderLockers();
    alert('Parcel registered: ' + parcelId);
    form.reset();
    return;
  }

  // Agent: Deposit
  if (form.id === 'agentAddParcel'){
    e.preventDefault();
    const recipient = ($('a_recipient')||{}).value || '';
    const email = (($('a_email')||{}).value || '').trim().toLowerCase();
    const phone = ($('a_phone')||{}).value || '';
    const size = ($('a_size')||{}).value || 'small';
    if (!recipient || !email) { alert('Provide recipient and email'); return; }
    const parcels = read('vuma_parcels') || [];
    const assigned = findLockerBySize(size);
    const parcelId = genParcelId();
    parcels.push({ id: parcels.length+1, parcelId, recipient, recipientEmail: email, recipientPhone: phone, lockerId: assigned ? assigned.id : null, size, status: 'awaiting_pickup', depositTime: nowISO(), otp: null, agentId: getLogged()?.id || null });
    write('vuma_parcels', parcels);
    if (assigned){
      const lockers = read('vuma_lockers') || [];
      const idx = lockers.findIndex(l => l.id === assigned.id);
      lockers[idx].status = 'occupied';
      updateLockersStorage(lockers);
    }
    alert('Parcel deposited: ' + parcelId + (assigned ? ' in ' + assigned.lockerNo : ' (no locker available yet)'));
    renderAgent();
    return;
  }

  // Customer: Verify OTP form
  if (form.id === 'verifyOtpForm'){
    e.preventDefault();
    const pid = ($('verifyParcelId')||{}).value || '';
    const otp = ($('verifyOtp')||{}).value || '';
    if (!pid || !otp) { $('otpResult').textContent = 'Provide parcel ID and OTP'; return; }
    const otps = read('vuma_otps') || [];
    const parcels = read('vuma_parcels') || [];
    const p = parcels.find(x => x.parcelId === pid && x.recipientEmail === getLogged()?.email);
    if (!p){ $('otpResult').textContent = 'Parcel not found or not yours'; return; }
    const otpRec = otps.find(o => o.parcelId === pid && o.code === otp && !o.used && new Date(o.expiresAt) > new Date());
    if (!otpRec){ $('otpResult').textContent = 'Invalid or expired OTP'; return; }
    // mark used, mark parcel picked
    otpRec.used = true;
    write('vuma_otps', otps);
    p.status = 'picked_up'; p.pickupTime = nowISO();
    write('vuma_parcels', parcels);
    // free locker
    if (p.lockerId){
      const lockers = read('vuma_lockers') || [];
      const idx = lockers.findIndex(l => l.id === p.lockerId);
      if (idx >= 0) { lockers[idx].status = 'available'; updateLockersStorage(lockers); }
    }
    $('otpResult').textContent = 'OTP valid — locker opened. Parcel picked up.';
    renderCustomer(); renderLockers(); renderAdmin();
    return;
  }

}, false);

// --- Click handlers delegated ---
document.addEventListener('click', function(e){
  const t = e.target;
  // admin generate OTP / mark delivered / mark picked
  if (t && t.dataset && t.dataset.action){
    const action = t.dataset.action;
    const pid = t.dataset.id;
    if (action === 'gen'){
      // generate OTP for parcel
      const parcels = read('vuma_parcels') || [];
      const p = parcels.find(x => x.parcelId === pid);
      if (!p) { alert('Parcel not found'); return; }
      const code = genOtp();
      const expiresAt = new Date(Date.now() + 10*60*1000).toISOString(); // 10 minutes
      const otps = read('vuma_otps') || [];
      otps.push({ parcelId: pid, code, createdAt: nowISO(), expiresAt, used: false });
      write('vuma_otps', otps);
      alert('OTP for ' + pid + ': ' + code + ' (10m) — (SMS simulated)');
      renderAdmin(); renderCustomer(); renderAgent();
    }
    if (action === 'markdel'){
      const parcels = read('vuma_parcels') || [];
      const p = parcels.find(x => x.parcelId === pid);
      if (p){ p.status = 'delivered'; write('vuma_parcels', parcels); renderAdmin(); }
    }
    if (action === 'markpicked'){
      const parcels = read('vuma_parcels') || [];
      const p = parcels.find(x => x.parcelId === pid);
      if (p){
        p.status = 'picked_up'; p.pickupTime = nowISO(); write('vuma_parcels', parcels);
        if (p.lockerId){
          const lockers = read('vuma_lockers') || [];
          const idx = lockers.findIndex(l => l.id === p.lockerId);
          if (idx >= 0){ lockers[idx].status = 'available'; updateLockersStorage(lockers); }
        }
        renderAdmin(); renderLockers();
      }
    }
  }

  // logout clicks
  if (t && (t.id === 'logoutBtn' || t.id === 'logoutBtnAgent' || t.id === 'logoutBtnCust')) {
    logout();
  }
});

// --- Render functions for pages ---
function renderAdmin(){
  // show username
  const logged = getLogged();
  if (logged) { const el = $('adminWelcome'); if (el) el.textContent = 'Hello, ' + logged.username; }
  // stats
  const parcels = read('vuma_parcels') || [];
  const lockers = read('vuma_lockers') || [];
  const pending = parcels.filter(p => p.status === 'awaiting_pickup').length;
  const picked = parcels.filter(p => p.status === 'picked_up').length;
  $('statTotal') && ($('statTotal').textContent = parcels.length);
  $('statPending') && ($('statPending').textContent = pending);
  $('statPicked') && ($('statPicked').textContent = picked);
  $('statLockers') && ($('statLockers').textContent = lockers.length);

  // parcels table
  const tbody = $('parcelsBody');
  if (tbody){
    tbody.innerHTML = '';
    parcels.slice().reverse().forEach(p => {
      const locker = (read('vuma_lockers') || []).find(l => l.id === p.lockerId);
      const otp = (read('vuma_otps') || []).find(o => o.parcelId === p.parcelId && !o.used);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p.parcelId}</td>
                      <td>${p.recipient}</td>
                      <td>${locker ? locker.lockerNo : '-'}</td>
                      <td>${p.status}</td>
                      <td>${otp ? otp.code + ' (exp ' + new Date(otp.expiresAt).toLocaleTimeString() + ')' : ''}</td>
                      <td>
                        <button class="btn small" data-id="${p.parcelId}" data-action="gen">Generate OTP</button>
                        <button class="btn small" data-id="${p.parcelId}" data-action="markpicked">Mark Picked</button>
                        <button class="btn small" data-id="${p.parcelId}" data-action="markdel">Mark Delivered</button>
                      </td>`;
      tbody.appendChild(tr);
    });
  }
}

function renderLockers(){
  const grid = $('lockersGrid');
  if (!grid) return;
  const lockers = read('vuma_lockers') || [];
  grid.innerHTML = '';
  lockers.forEach(l => {
    const d = document.createElement('div');
    d.className = 'locker card ' + (l.status === 'available' ? 'available' : (l.status === 'occupied' ? 'occupied' : 'maintenance'));
    d.innerHTML = `<div><strong>${l.lockerNo}</strong></div><div>${l.size}</div><div class="muted small">${l.status}</div>`;
    grid.appendChild(d);
  });
}

function renderAgent(){
  const logged = getLogged();
  if (logged) { const el = $('agentWelcome'); if (el) el.textContent = 'Hello, ' + logged.username; }
  const parcels = (read('vuma_parcels') || []).filter(p => p.agentId === (logged?.id || null));
  const tbody = $('agentParcelsBody');
  if (tbody){
    tbody.querySelector('tbody') && (tbody = tbody.querySelector('tbody')); // safe
    const bodyEl = (typeof tbody === 'string') ? null : tbody;
  }
  const bodyRef = document.querySelector('#agentParcelsBody tbody') || document.querySelector('#agentParcelsBody');
  if (bodyRef) {
    bodyRef.innerHTML = '';
    parcels.slice().reverse().forEach(p => {
      const locker = (read('vuma_lockers') || []).find(l => l.id === p.lockerId);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p.parcelId}</td><td>${p.recipient}</td><td>${locker ? locker.lockerNo : '-'}</td><td>${p.status}</td><td>
                        <button class="btn small" data-id="${p.parcelId}" data-action="gen">Generate OTP</button>
                      </td>`;
      bodyRef.appendChild(tr);
    });
  }
}

function renderCustomer(){
  const logged = getLogged();
  if (logged) { const el = $('custWelcome') || $('userWelcome'); if (el) el.textContent = 'Hello, ' + logged.username; }
  const parcels = (read('vuma_parcels') || []).filter(p => p.recipientEmail === (logged?.email));
  const tbody = document.querySelector('#userParcelsBody tbody') || document.getElementById('userParcelsBody');
  if (tbody){
    tbody.innerHTML = '';
    parcels.slice().reverse().forEach(p => {
      const locker = (read('vuma_lockers') || []).find(l => l.id === p.lockerId);
      const otp = (read('vuma_otps') || []).find(o => o.parcelId === p.parcelId && !o.used);
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${p.parcelId}</td><td>${locker ? locker.lockerNo : '-'}</td><td>${p.status}</td><td>${otp ? otp.code : ''}</td>
                      <td><button class="btn small" data-id="${p.parcelId}" data-action="gen">Request OTP</button></td>`;
      tbody.appendChild(tr);
    });
  }
}

// generate on click for customer/admin/agent
document.addEventListener('click', function(e){
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.dataset.action;
  const pid = btn.dataset.id;
  if (!action || !pid) return;
  if (action === 'gen'){
    // generate OTP
    const code = genOtp(); const expiresAt = new Date(Date.now() + 10*60*1000).toISOString();
    const otps = read('vuma_otps') || [];
    otps.push({ parcelId: pid, code, createdAt: nowISO(), expiresAt, used:false });
    write('vuma_otps', otps);
    alert('OTP for ' + pid + ': ' + code + ' (valid 10 minutes) — SMS simulated');
    renderAdmin(); renderAgent(); renderCustomer();
  }
});

// --- Page-specific boot ---
document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname.split('/').pop();

  if (path === '' || path === 'index.html'){
    // nothing to do here
  } else if (path === 'admin.html'){
    const logged = getLogged(); if (!logged || logged.role !== 'admin') { window.location.href = './index.html'; return; }
    renderAdmin(); renderLockers();
    $('logoutBtn') && ($('logoutBtn').addEventListener('click', logout));
  } else if (path === 'agent.html'){
    const logged = getLogged(); if (!logged || logged.role !== 'agent') { window.location.href = './index.html'; return; }
    renderAgent(); renderLockers();
    $('logoutBtnAgent') && ($('logoutBtnAgent').addEventListener('click', logout));
    // agent deposit handler already bound via delegated submit
  } else if (path === 'customer.html'){
    const logged = getLogged(); if (!logged || logged.role !== 'customer') { window.location.href = './index.html'; return; }
    renderCustomer(); renderLockers();
    $('logoutBtnCust') && ($('logoutBtnCust').addEventListener('click', logout));
    // verify form handler already bound via submit delegation
  } else if (path === 'signup.html'){
    // password strength small helper
    const pass = $('signupPassword');
    if (pass){ pass.addEventListener('input', () => {
      const v = pass.value;
      const s = $('strength');
      if (!v) s.textContent = '';
      else if (v.length < 6) { s.textContent = 'Weak'; s.style.color = '#ef4444'; }
      else if (v.length < 10) { s.textContent = 'Medium'; s.style.color = '#f59e0b'; }
      else { s.textContent = 'Strong'; s.style.color = '#16a34a'; }
    }); }
  }

});

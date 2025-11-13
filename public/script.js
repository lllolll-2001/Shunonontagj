// ------------------ Подключение Supabase ------------------
const SUPABASE_URL = 'https://bmasqfcvjwydpwlqqmcu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNxZmN2and5ZHB3bHFxbWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.X2MKrdXkdHPKq-STrsUP-l_SxXYzMttjUU8yc7eWC1k';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ------------------ Аккаунты ------------------
const ACCOUNTS = [
  { login: 'boss', password: 'kolovo.123q', role: 'boss' },
  { login: 'worker', password: 'Vlad.123q', role: 'worker' }
];

let currentUser = null;
let records = [];

// ------------------ Время ------------------
function fillTimeSelect() {
  const select = document.getElementById('guestTime');
  select.innerHTML = '';
  let hour = 8;
  let minute = 0;
  while (hour < 17 || (hour === 17 && minute === 0)) {
    select.innerHTML += `<option>${hour.toString().padStart(2,'0')}:${minute.toString().padStart(2,'0')}</option>`;
    minute += 45;
    if (minute >= 60) { minute -= 60; hour++; }
  }
}
fillTimeSelect();
document.getElementById('guestDate').min = new Date().toISOString().split('T')[0];

// ------------------ Цены ------------------
const priceTable = {
  'Легковая': { '13-15': {balance:400, full:600}, '16-18': {balance:480, full:720}, '19-21': {balance:560, full:840} },
  'Кроссовер': { '13-15': {balance:440, full:680}, '16-18': {balance:520, full:800}, '19-21': {balance:600, full:920} },
  'Внедорожник': { '13-15': {balance:480, full:740}, '16-18': {balance:560, full:860}, '19-21': {balance:640, full:980} },
  'Микроавтобус': { '13-15': {balance:440, full:680}, '16-18': {balance:520, full:800}, '19-21': {balance:600, full:920} },
  'Грузовые': { '13-15': {balance:480, full:740}, '16-18': {balance:560, full:860}, '19-21': {balance:640, full:980} },
  'Коммерческий транспорт': {}
};
function getRadiusRange(radius){
  const r = parseInt(radius.replace('R',''));
  if(r>=13 && r<=15) return '13-15';
  if(r>=16 && r<=18) return '16-18';
  if(r>=19 && r<=21) return '19-21';
  return '';
}
function updatePrice(){
  const car = document.getElementById('guestCarType').value;
  const radius = document.getElementById('radiusSelect').value;
  const service = document.getElementById('serviceSelect').value;
  const range = getRadiusRange(radius);
  let priceText = '-';
  if(priceTable[car] && priceTable[car][range]){
    if(service.includes('Балансировка') && service.includes('с')) priceText = 'от '+priceTable[car][range].full+' грн';
    else if(service.includes('Балансировка')) priceText = 'от '+priceTable[car][range].balance+' грн';
  }
  document.getElementById('priceDisplay').innerText = priceText;
}
document.getElementById('guestCarType').addEventListener('change', updatePrice);
document.getElementById('radiusSelect').addEventListener('change', updatePrice);
document.getElementById('serviceSelect').addEventListener('change', updatePrice);

// ------------------ Работа с записями ------------------
async function fetchRecords() {
  let { data, error } = await supabase.from('records').select('*').order('id', {ascending:true});
  if(!error) records = data;
}
async function addGuestRecord(){
  const name = document.getElementById('guestName').value.trim();
  const phone = document.getElementById('guestPhone').value.trim();
  const car = document.getElementById('guestCarType').value;
  const radius = document.getElementById('radiusSelect').value;
  const service = document.getElementById('serviceSelect').value;
  const date = document.getElementById('guestDate').value;
  const time = document.getElementById('guestTime').value;
  if(!name || !phone || !date || !time){ alert('Заполните все поля!'); return; }

  // Проверка занятости
  await fetchRecords();
  if(records.some(r=>r.date===date && r.time===time)){ alert('Выбранное время уже занято!'); return; }

  const { error } = await supabase.from('records').insert([{ name, phone, car, radius, service, date, time, status:'Не отмечено', addedBy:'Гость', workDescription:'', earned:0 }]);
  if(!error){ alert('Запись добавлена!'); await fetchRecords(); renderRecords(); }
  else alert('Ошибка при добавлении');
}

// ------------------ Вход ------------------
function login(){
  const loginVal = document.getElementById('loginInput').value.trim();
  const passVal = document.getElementById('passwordInput').value.trim();
  const user = ACCOUNTS.find(u=>u.login===loginVal && u.password===passVal);
  if(user){
    currentUser = user;
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    if(user.role==='boss') showBossView();
    else showWorkerView();
    renderRecords();
  } else alert('Неверный логин или пароль');
}
function logout(){
  currentUser=null;
  document.getElementById('loginCard').classList.remove('hidden');
  document.getElementById('logoutBtn').classList.add('hidden');
  document.getElementById('bossCard').classList.add('hidden');
  document.getElementById('workerCard').classList.add('hidden');
}

// ------------------ Отображение записей ------------------
async function renderRecords(){
  await fetchRecords();
  const container = currentUser.role==='boss'? document.getElementById('bossRecords') : document.getElementById('workerRecords');
  container.innerHTML='';
  records.forEach(r=>{
    const div = document.createElement('div');
    div.className='record';
    const range = getRadiusRange(r.radius);
    let price = 0;
    if(priceTable[r.car] && priceTable[r.car][range]){
      if(r.service.includes('Балансировка') && r.service.includes('с')) price=priceTable[r.car][range].full;
      else if(r.service.includes('Балансировка')) price=priceTable[r.car][range].balance;
    }
    div.innerHTML=`<b>${r.name}</b> | ${r.phone} | ${r.car} | ${r.radius} | ${r.service} | ${r.date} ${r.time}
      <div class="meta">Статус: ${r.status} | Отметил: ${r.addedBy} | Работа: ${r.workDescription || '-'} | Цена: ${price>0?'от '+price+' грн':'-'} | Заработано: ${r.earned || 0} грн</div>`;
    
    // Кнопки для работника
    if(currentUser.role==='worker'){
      div.innerHTML+=`<div class="controls">
        <button onclick="markRecord(${r.id},'Сделано')">Приехал</button>
        <button onclick="markRecord(${r.id},'Не приехал')">Не приехал</button>
        <button onclick="addWork(${r.id})">Добавить сумму</button>
      </div>`;
    }
    
    // Кнопки для босса
    if(currentUser.role==='boss'){
      div.innerHTML+=`<div class="controls">
        <button onclick="deleteRecord(${r.id})">Удалить</button>
      </div>`;
    }

    container.appendChild(div);
  });

  if(currentUser.role==='boss') showBossEarnings();
}

// ------------------ Функции босса ------------------
async function deleteRecord(id){
  await supabase.from('records').delete().eq('id',id);
  await fetchRecords();
  renderRecords();
}
function showBossEarnings(){
  const period = document.getElementById('earningPeriod')?.value || 'day';
  const fromDate = document.getElementById('fromDate')?.value;
  const toDate = document.getElementById('toDate')?.value;
  const now = new Date();
  let filtered = records.filter(r=>r.earned && r.status==='Сделано');

  if(period==='day') filtered = filtered.filter(r=>r.date===now.toISOString().split('T')[0]);
  if(period==='week'){
    const start = new Date(now); start.setDate(now.getDate()-now.getDay());
    filtered = filtered.filter(r=>new Date(r.date)>=start && new Date(r.date)<=now);
  }
  if(period==='month') filtered = filtered.filter(r=>{
    const d=new Date(r.date);
    return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear();
  });
  if(fromDate && toDate) filtered = filtered.filter(r=>r.date>=fromDate && r.date<=toDate);

  const total = filtered.reduce((acc,r)=>acc+parseFloat(r.earned||0),0);
  document.getElementById('bossTotal').innerText='Сумма: '+total+' грн';
}

// ------------------ Функции работника ------------------
async function markRecord(id,status){
  const rec = records.find(r=>r.id===id);
  if(!rec) return;
  let earned = rec.earned;
  if(status==='Сделано'){
    const earnedStr = prompt('Введите сумму за услугу (грн):');
    const parsed = parseFloat(earnedStr);
    if(!isNaN(parsed)) earned=parsed;
  }
  await supabase.from('records').update({status,earned,addedBy:currentUser.login}).eq('id',id);
  await fetchRecords();
  renderRecords();
}
async function addWork(id){
  const rec = records.find(r=>r.id===id);
  if(!rec) return;
  const earnedStr = prompt('Введите сумму за услугу (грн):');
  const parsed = parseFloat(earnedStr);
  if(isNaN(parsed)) return;
  await supabase.from('records').update({earned:parsed}).eq('id',id);
  await fetchRecords();
  renderRecords();
}

// ------------------ Инициализация ------------------
renderRecords();
updatePrice();

// ==== Подключение Supabase ====
const supabaseUrl = 'https://bmasqfcvjwydpwlqqmcu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNxZmN2and5ZHB3bHFxbWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.X2MKrdXkdHPKq-STrsUP-l_SxXYzMttjUU8yc7eWC1k';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;
let selectedTime = null;

// ==== Дата ====
const guestDate = document.getElementById('guestDate');
guestDate.min = new Date().toISOString().split('T')[0];
guestDate.addEventListener('change', renderTimeButtons);

// ==== Цены ====
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
    if(service.includes('Балансировка') && service.includes('с')) priceText = 'от ' + priceTable[car][range].full + ' грн';
    else if(service.includes('Балансировка')) priceText = 'от ' + priceTable[car][range].balance + ' грн';
  }
  document.getElementById('priceDisplay').innerText = priceText;
}

document.getElementById('guestCarType').addEventListener('change', updatePrice);
document.getElementById('radiusSelect').addEventListener('change', updatePrice);
document.getElementById('serviceSelect').addEventListener('change', updatePrice);

// ==== Время кнопками 45 минут интервал ====
async function renderTimeButtons(){
  const container = document.getElementById('timeButtonsContainer');
  container.innerHTML='';
  selectedTime=null;

  const date = guestDate.value;
  if(!date) return;

  const { data: records } = await supabase.from('records').select('*').eq('date', date);

  let h=8, m=0;
  while(h<16 || (h===16 && m<=15)){
    const timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
    const taken = records.some(r=>r.time===timeStr);
    const btn = document.createElement('button');
    btn.className = 'time-btn ' + (taken?'taken':'free');
    btn.innerText = timeStr;
    if(!taken) btn.onclick = ()=>{ selectedTime=timeStr; Array.from(container.children).forEach(b=>b.classList.remove('selected')); btn.classList.add('selected'); };
    container.appendChild(btn);

    m+=45;
    if(m>=60){ h++; m-=60; }
  }
}

// ==== Добавление записи ====
async function addGuestRecord(){
  const name = document.getElementById('guestName').value.trim();
  const phone = document.getElementById('guestPhone').value.trim();
  const car = document.getElementById('guestCarType').value;
  const radius = document.getElementById('radiusSelect').value;
  const service = document.getElementById('serviceSelect').value;
  const date = guestDate.value;
  const time = selectedTime;

  if(!name || !phone || !date || !time){ alert('Заполните все поля и выберите время!'); return; }

  const { error } = await supabase.from('records').insert([{name,phone,car,radius,service,date,time,status:'Не отмечено',addedBy:'Гость',earned:0}]);
  if(error) alert('Ошибка при добавлении: '+error.message);
  else { alert('Запись добавлена!'); renderTimeButtons(); updatePrice(); }
}

// ==== Вход ====
async function login(){
  const loginVal = document.getElementById('loginInput').value.trim();
  const passVal = document.getElementById('passwordInput').value.trim();

  const { data, error } = await supabase.from('users').select('*').eq('login',loginVal).eq('password',passVal).single();

  if(error || !data){ alert('Неверный логин или пароль'); return; }

  currentUser = data;
  document.getElementById('loginCard').classList.add('hidden');
  document.getElementById('logoutBtn').classList.remove('hidden');

  if(currentUser.role==='boss') document.getElementById('bossCard').classList.remove('hidden');
  else document.getElementById('workerCard').classList.remove('hidden');
}

// ==== Выход ====
function logout(){
  currentUser=null;
  document.getElementById('bossCard').classList.add('hidden');
  document.getElementById('workerCard').classList.add('hidden');
  document.getElementById('logoutBtn').classList.add('hidden');
  document.getElementById('loginCard').classList.remove('hidden');
}

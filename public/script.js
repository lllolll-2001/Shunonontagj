// ==== Supabase setup ====
const supabaseUrl = 'https://bmasqfcvjwydpwlqqmcu.supabase.co';
const supabaseKey = 'eyJhbGciOiJI...'; // твой anon key
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let currentUser = null;

// ==== Дата ====
document.getElementById('guestDate').min = new Date().toISOString().split('T')[0];

// ==== Время ====
function generateTimeButtons() {
  const container = document.getElementById('timeButtons');
  container.innerHTML = '';
  const times = [];
  for(let h=8; h<17; h++){
    for(let m=0; m<60; m+=45){
      let mm = m<10?'0'+m:m;
      times.push(`${h}:${mm}`);
    }
  }
  times.forEach(t=>{
    const btn = document.createElement('button');
    btn.className='time-btn free';
    btn.innerText=t;
    btn.onclick=()=>selectTime(t, btn);
    container.appendChild(btn);
  });
}
let selectedTime = null;
function selectTime(t, btn){
  if(btn.classList.contains('busy')) return;
  selectedTime = t;
  document.querySelectorAll('.time-btn').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  updatePrice();
}
generateTimeButtons();

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
    if(service.includes('Балансировка') && service.includes('с')) priceText = 'от '+priceTable[car][range].full+' грн';
    else if(service.includes('Балансировка')) priceText = 'от '+priceTable[car][range].balance+' грн';
  }
  document.getElementById('priceDisplay').innerText = priceText;
}
document.getElementById('guestCarType').addEventListener('change', updatePrice);
document.getElementById('radiusSelect').addEventListener('change', updatePrice);
document.getElementById('serviceSelect').addEventListener('change', updatePrice);

// ==== Добавление записи ====
async function addGuestRecord(){
  const name = document.getElementById('guestName').value.trim();
  const phone = document.getElementById('guestPhone').value.trim();
  const car = document.getElementById('guestCarType').value;
  const radius = document.getElementById('radiusSelect').value;
  const service = document.getElementById('serviceSelect').value;
  const date = document.getElementById('guestDate').value;
  const time = selectedTime;

  if(!name || !phone || !date || !time){ alert('Заполните все поля!'); return; }

  // проверка занятости
  const { data: existing } = await supabase
    .from('records')
    .select('*')
    .eq('date', date)
    .eq('time', time);

  if(existing.length>0){ alert('Это время уже занято'); return; }

  const { error } = await supabase
    .from('records')
    .insert([{name, phone, car, radius, service, date, time, status:'Не отмечено', addedBy:'Гость', earned:0}]);

  if(error) alert('Ошибка добавления: '+error.message);
  else { alert('Запись добавлена!'); generateTimeButtons(); }
}

// ==== Вход ====
async function login(){
  const loginVal = document.getElementById('loginInput').value.trim();
  const passVal = document.getElementById('passwordInput').value.trim();

  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('login', loginVal)
    .eq('password', passVal)
    .single();

  if(user){
    currentUser = user;
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');
    if(user.role==='boss') document.getElementById('bossCard').classList.remove('hidden');
    else document.getElementById('workerCard').classList.remove('hidden');
  } else alert('Неверный логин или пароль');
}

// ==== Выход ====
function logout(){
  currentUser = null;
  document.getElementById('loginCard').classList.remove('hidden');
  document.getElementById('bossCard').classList.add('hidden');
  document.getElementById('workerCard').classList.add('hidden');
  document.getElementById('logoutBtn').classList.add('hidden');
}

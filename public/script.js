// ===== Подключение к Supabase =====
const SUPABASE_URL = "https://bmasqfcvjwydpwlqqmcu.supabase.co";
const SUPABASE_KEY = "sb_publishable_vd51ZeFzGmbof7TY5ZDoUg_z-dak7Jg";
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

// ===== Минимальная дата =====
document.getElementById('guestDate').min = new Date().toISOString().split('T')[0];

// ===== Заполнение времени =====
function fillTimeSelect() {
  const select = document.getElementById('guestTime');
  select.innerHTML = '';
  let hour = 8;
  let minute = 0;
  while(hour < 17){
    select.innerHTML += `<option>${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}</option>`;
    minute += 45;
    if(minute >= 60){ hour++; minute=minute-60; }
  }
}
fillTimeSelect();

// ===== Цены =====
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
    if(service.includes('Балансировка') && service.includes('с')) priceText = "от " + priceTable[car][range].full + " грн";
    else if(service.includes('Балансировка')) priceText = "от " + priceTable[car][range].balance + " грн";
  }
  document.getElementById('priceDisplay').innerText = priceText;
}

document.getElementById('guestCarType').addEventListener('change', updatePrice);
document.getElementById('radiusSelect').addEventListener('change', updatePrice);
document.getElementById('serviceSelect').addEventListener('change', updatePrice);

// ===== Добавление записи =====
async function addGuestRecord(){
  const name = document.getElementById('guestName').value.trim();
  const phone = document.getElementById('guestPhone').value.trim();
  const car = document.getElementById('guestCarType').value;
  const radius = document.getElementById('radiusSelect').value;
  const service = document.getElementById('serviceSelect').value;
  const date = document.getElementById('guestDate').value;
  const time = document.getElementById('guestTime').value;

  if(!name || !phone || !date || !time){ alert('Заполните все поля!'); return; }

  const {data, error} = await supabase
    .from('records')
    .insert([{name, phone, car, radius, service, date, time, status:'Не отмечено', addedBy:'Гость', earned:0}]);

  if(error) alert("Ошибка: " + error.message);
  else { alert("Запись добавлена!"); updatePrice(); }
}

// ===== Вход =====
async function login(){
  const loginVal = document.getElementById('loginInput').value.trim();
  const passVal = document.getElementById('passwordInput').value.trim();

  const {data, error} = await supabase
    .from('users')
    .select('*')
    .eq('login', loginVal)
    .eq('password', passVal)
    .single();

  if(error){ alert("Неверный логин или пароль"); return; }

  currentUser = data;
  document.getElementById('loginCard').classList.add('hidden');
  document.getElementById('logoutBtn').classList.remove('hidden');

  if(currentUser.role==='boss') document.getElementById('bossCard').classList.remove('hidden');
  else document.getElementById('workerCard').classList.remove('hidden');
}

// ===== Выход =====
function logout(){
  currentUser = null;
  document.getElementById('loginCard').classList.remove('hidden');
  document.getElementById('bossCard').classList.add('hidden');
  document.getElementById('workerCard').classList.add('hidden');
  document.getElementById('logoutBtn').classList.add('hidden');
}

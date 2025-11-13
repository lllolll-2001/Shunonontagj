// ==== Настройка Supabase ====
const SUPABASE_URL = 'https://bmasqfcvjwydpwlqqmcu.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vd51ZeFzGmbof7TY5ZDoUg_z-dak7Jg';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let currentUser = null;

// ==== Заполнение слотов времени ====
const timeContainer = document.getElementById('timeButtons');

function generateTimeButtons() {
  const startHour = 8;
  const endHour = 16;
  const interval = 45; // минут

  timeContainer.innerHTML = '';
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += interval) {
      if (h === endHour && m > 15) break;
      const timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
      const btn = document.createElement('button');
      btn.innerText = timeStr;
      btn.dataset.time = timeStr;
      btn.className = 'time-btn';
      btn.onclick = () => selectTime(btn);
      timeContainer.appendChild(btn);
    }
  }
  updateTimeAvailability();
}

let selectedTime = null;

function selectTime(btn) {
  selectedTime = btn.dataset.time;
  document.querySelectorAll('.time-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
}

// ==== Проверка доступности времени ====
async function updateTimeAvailability() {
  if (!document.getElementById('guestDate').value) return;
  const date = document.getElementById('guestDate').value;

  const { data: records } = await supabase
    .from('records')
    .select('*')
    .eq('date', date);

  document.querySelectorAll('.time-btn').forEach(btn => {
    const taken = records.some(r => r.time === btn.dataset.time);
    btn.style.backgroundColor = taken ? 'grey' : '#ff3b3b';
    btn.disabled = taken;
  });
}

// ==== Обновление цены ====
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

function updatePrice() {
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

// ==== Добавление записи ====
async function addGuestRecord() {
  const name = document.getElementById('guestName').value.trim();
  const phone = document.getElementById('guestPhone').value.trim();
  const car = document.getElementById('guestCarType').value;
  const radius = document.getElementById('radiusSelect').value;
  const service = document.getElementById('serviceSelect').value;
  const date = document.getElementById('guestDate').value;
  const time = selectedTime;

  if(!name || !phone || !date || !time){
    alert('Заполните все поля и выберите время!');
    return;
  }

  const { error } = await supabase
    .from('records')
    .insert([{ name, phone, car, radius, service, date, time, status:'Не отмечено', addedBy:'Гость', earned:0 }]);

  if(error) alert('Ошибка: '+error.message);
  else { alert('Запись добавлена!'); generateTimeButtons(); }
}

// ==== Вход ====
async function login() {
  const loginVal = document.getElementById('loginInput').value.trim();
  const passVal = document.getElementById('passwordInput').value.trim();

  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('login', loginVal)
    .eq('password', passVal);

  if(users && users.length){
    currentUser = users[0];
    alert(`Вход выполнен. Роль: ${currentUser.role}`);
    document.getElementById('loginCard').classList.add('hidden');
    document.getElementById('logoutBtn').classList.remove('hidden');

    if(currentUser.role==='boss') document.getElementById('bossCard').classList.remove('hidden');
    else document.getElementById('workerCard').classList.remove('hidden');

  } else alert('Неверный логин или пароль');
}

// ==== Выход ====
function logout() {
  currentUser = null;
  document.getElementById('loginCard').classList.remove('hidden');
  document.getElementById('bossCard').classList.add('hidden');
  document.getElementById('workerCard').classList.add('hidden');
  document.getElementById('logoutBtn').classList.add('hidden');
}

// ==== Дата минимальная ====
document.getElementById('guestDate').min = new Date().toISOString().split('T')[0];
document.getElementById('guestDate').addEventListener('change', updateTimeAvailability);

generateTimeButtons();
updatePrice();

// ---------- Supabase ----------
const supabaseUrl = 'https://bmasqfcvjwydpwlqqmcu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNxZmN2and5ZHB3bHFxbWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.X2MKrdXkdHPKq-STrsUP-l_SxXYzMttjUU8yc7eWC1k';
const supabase = supabaseJs.createClient(supabaseUrl, supabaseKey);

// ---------- Данные ----------
let currentUser = null;
let timeSelected = null;

// ---------- Слоты времени ----------
const timeButtonsContainer = document.getElementById('timeButtonsContainer');
const startHour = 8;
const endHour = 16; // последний слот
const intervalMin = 45;

function generateTimeSlots() {
  const slots = [];
  for(let h=startHour; h<=endHour; h++){
    let m=0;
    while(m<60){
      let timeStr = `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
      slots.push(timeStr);
      m += intervalMin;
    }
  }
  return slots;
}

// ---------- Цена ----------
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

function updatePriceDisplay() {
  const car = document.getElementById('guestCarType').value;
  const radius = document.getElementById('radiusSelect').value;
  const service = document.getElementById('serviceSelect').value;
  const range = getRadiusRange(radius);
  let price = '-';
  if(priceTable[car] && priceTable[car][range]){
    if(service.includes('Балансировка') && service.includes('с')) price = 'от '+priceTable[car][range].full + ' грн';
    else if(service.includes('Балансировка')) price = 'от '+priceTable[car][range].balance + ' грн';
  }
  document.getElementById('priceDisplay').innerText = price;
}

document.getElementById('guestCarType').addEventListener('change', updatePriceDisplay);
document.getElementById('radiusSelect').addEventListener('change', updatePriceDisplay);
document.getElementById('serviceSelect').addEventListener('change', updatePriceDisplay);

// ---------- Дата ----------
document.getElementById('guestDate').min = new Date().toISOString().split('T')[0];

// ---------- Отображение кнопок ----------
async function renderTimeButtons() {
  const slots = generateTimeSlots();
  timeButtonsContainer.innerHTML = '';
  const date = document.getElementById('guestDate').value;
  if(!date) return;

  const { data: records } = await supabase.from('records').select().eq('date', date);
  slots.forEach(t=>{
    const busy = records.some(r=>r.time===t);
    const btn = document.createElement('button');
    btn.innerText = t;
    btn.className = busy ? 'busy' : 'free';
    if(!busy){
      btn.onclick = () => {
        timeSelected = t;
        document.querySelectorAll('.time-buttons button').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
      };
    }
    timeButtonsContainer.appendChild(btn);
  });
}

document.getElementById('guestDate').addEventListener('change', renderTimeButtons);
renderTimeButtons();

// ---------- Добавление записи ----------
async function addGuestRecord() {
  const name = document.getElementById('guestName').value.trim();
  const phone = document.getElementById('guestPhone').value.trim();
  const car = document.getElementById('guestCarType').value;
  const radius = document.getElementById('radiusSelect').value;
  const service = document.getElementById('serviceSelect').value;
  const date = document.getElementById('guestDate').value;
  const time = timeSelected;

  if(!name || !phone || !date || !time){ alert('Заполните все поля!'); return; }

  const { error } = await supabase.from('records').insert([{ name, phone, car, radius, service, date, time, status:'Не отмечено', addedBy:'Гость', earned:0 }]);
  if(error){ alert('Ошибка при добавлении: '+error.message); return; }
  alert('Запись добавлена!');
  timeSelected = null;
  renderTimeButtons();
  updatePriceDisplay();
}

// ---------- Вход (только босс/работник) ----------
async function login(){
  const loginVal = document.getElementById('loginInput').value.trim();
  const passVal = document.getElementById('passwordInput').value.trim();

  const { data: users, error } = await supabase.from('users').select().eq('login', loginVal).eq('password', passVal);
  if(error || users.length===0){ alert('Неверный логин или пароль'); return; }
  currentUser = users[0];
  alert(`Вход выполнен. Роль: ${currentUser.role}`);

  document.getElementById('loginCard').classList.add('hidden');
  document.getElementById('logoutBtn').classList.remove('hidden');
  if(currentUser.role==='boss') document.getElementById('bossCard').classList.remove('hidden');
  else document.getElementById('workerCard').classList.remove('hidden');
}

function logout(){
  currentUser = null;
  document.getElementById('bossCard').classList.add('hidden');
  document.getElementById('workerCard').classList.add('hidden');
  document.getElementById('logoutBtn').classList.add('hidden');
  document.getElementById('loginCard').classList.remove('hidden');
}

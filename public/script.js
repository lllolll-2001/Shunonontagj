// ----------------- Supabase -----------------
const SUPABASE_URL = 'https://bmasqfcvjwydpwlqqmcu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtYXNxZmN2and5ZHB3bHFxbWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NTczNDYsImV4cCI6MjA3ODUzMzM0Nn0.X2MKrdXkdHPKq-STrsUP-l_SxXYzMttjUU8yc7eWC1k';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----------------- Глобальные переменные -----------------
let currentUser = null;
let records = [];

// ----------------- ВРЕМЯ -----------------
function fillTimeSelect(){
    const select = document.getElementById('guestTime');
    select.innerHTML = '';
    let hour = 8;
    let minute = 0;
    while(hour < 17 || (hour === 17 && minute === 0)){
        const hh = hour.toString().padStart(2,'0');
        const mm = minute.toString().padStart(2,'0');
        const option = document.createElement('option');
        option.value = `${hh}:${mm}`;
        option.textContent = `${hh}:${mm}`;
        select.appendChild(option);
        minute += 45;
        if(minute >= 60){
            minute -= 60;
            hour++;
        }
    }
}
document.addEventListener('DOMContentLoaded', fillTimeSelect);

// Минимальная дата для выбора
document.getElementById('guestDate').min = new Date().toISOString().split('T')[0];

// ----------------- ЦЕНЫ -----------------
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

// ----------------- ЗАПИСЬ -----------------
async function fetchRecords() {
    const { data, error } = await supabase.from('records').select('*').order('date', {ascending:true});
    if(!error) records = data;
    renderRecords();
}
async function addGuestRecord() {
    const name = document.getElementById('guestName').value.trim();
    const phone = document.getElementById('guestPhone').value.trim();
    const car = document.getElementById('guestCarType').value;
    const radius = document.getElementById('radiusSelect').value;
    const service = document.getElementById('serviceSelect').value;
    const date = document.getElementById('guestDate').value;
    const time = document.getElementById('guestTime').value;

    if(!name || !phone || !date || !time){ alert('Заполните все поля!'); return; }

    // Проверка на занятость времени
    const conflict = records.find(r => r.date===date && r.time===time);
    if(conflict){ alert(`Время ${time} на ${date} уже занято`); return; }

    const { data, error } = await supabase.from('records').insert([{name, phone, car, radius, service, date, time, status:'Не отмечено', addedBy:'Гость', earned:0}]);
    if(error) alert('Ошибка при добавлении: ' + error.message);
    else { alert('Запись добавлена!'); fetchRecords(); }
}

// ----------------- ЛОГИН -----------------
async function login() {
    const loginVal = document.getElementById('loginInput').value.trim();
    const passVal = document.getElementById('passwordInput').value.trim();

    let user = null;
    if(loginVal==='boss' && passVal==='kolovo.123q') user={login:'boss', role:'boss'};
    else if(loginVal==='worker' && passVal==='Vlad.123q') user={login:'worker', role:'worker'};

    if(user){
        currentUser = user;
        document.getElementById('loginCard').classList.add('hidden');
        document.getElementById('logoutBtn').classList.remove('hidden');
        if(user.role==='boss') document.getElementById('bossCard').classList.remove('hidden');
        else document.getElementById('workerCard').classList.remove('hidden');
        fetchRecords();
    } else alert('Неверный логин или пароль');
}
function logout(){
    currentUser=null;
    document.getElementById('bossCard').classList.add('hidden');
    document.getElementById('workerCard').classList.add('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    document.getElementById('loginCard').classList.remove('hidden');
}

// ----------------- РЕНДЕР -----------------
function renderRecords(){
    const containerWorker = document.getElementById('workerRecords');
    const containerBoss = document.getElementById('bossRecords');
    if(containerWorker) containerWorker.innerHTML='';
    if(containerBoss) containerBoss.innerHTML='';

    let total=0;
    const now = new Date();
    const bossFilter = document.getElementById('earningPeriod')?.value || 'day';

    records.forEach(r=>{
        // Цена по прайсу
        const range = getRadiusRange(r.radius);
        let price=0;
        if(priceTable[r.car] && priceTable[r.car][range]){
            if(r.service.includes('Балансировка') && r.service.includes('с')) price=priceTable[r.car][range].full;
            else if(r.service.includes('Балансировка')) price=priceTable[r.car][range].balance;
        }
        total += price + (r.earned || 0);

        // --- Работник ---
        if(currentUser?.role==='worker'){
            const div = document.createElement('div');
            div.className='record';
            div.innerHTML = `<b>${r.name}</b> | ${r.phone} | ${r.car} | ${r.radius} | ${r.service} | ${r.date} ${r.time}
            <div class="meta">Статус: ${r.status} | Отметил: ${r.addedBy} | Заработано: ${r.earned} грн</div>
            <div class="controls">
              <button onclick="markRecord(${r.id},'Приехал')">Приехал</button>
              <button onclick="markRecord(${r.id},'Не приехал')">Не приехал</button>
            </div>`;
            containerWorker.appendChild(div);
        }

        // --- Босс ---
        if(currentUser?.role==='boss'){
            const div = document.createElement('div');
            div.className='record';
            div.innerHTML = `<b>${r.name}</b> | ${r.phone} | ${r.car} | ${r.radius} | ${r.service} | ${r.date} ${r.time}
            <div class="meta">Статус: ${r.status} | Отметил: ${r.addedBy} | Цена: ${price} грн | Заработано: ${r.earned} грн</div>
            <div class="controls">
              <button onclick="deleteRecord(${r.id})">Удалить</button>
            </div>`;
            containerBoss.appendChild(div);
        }
    });

    if(currentUser?.role==='boss'){
        document.getElementById('bossTotal').innerText = 'Сумма: '+total+' грн';
    }
}

// ----------------- ФУНКЦИИ ИЗМЕНЕНИЯ -----------------
async function markRecord(id, status){
    const earned = status==='Приехал' ? parseFloat(prompt('Введите сумму за услугу:')) : 0;
    const { data, error } = await supabase.from('records').update({status, earned}).eq('id', id);
    if(!error) fetchRecords();
}

async function deleteRecord(id){
    const { data, error } = await supabase.from('records').delete().eq('id', id);
    if(!error) fetchRecords();
}

// ----------------- ИНИЦИАЛИЗАЦИЯ -----------------
document.addEventListener('DOMContentLoaded', ()=>{
    fillTimeSelect();
    updatePrice();
    fetchRecords();
});

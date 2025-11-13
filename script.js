const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxb9bRbS1SG_KX1Iu5Bu2bgt0zRQNTTe7S2mraf5WpoWftm11aZNCdCjN_LMnivqMxuJA/exec';

let currentUser = null;
let users = [
  {login:'boss', role:'boss'},
  {login:'worker', role:'worker'}
];

let records = [];
let bossFilter = 'day';

// ====== Заполнение времени ======
function fillTimeSelect(){
  const select = document.getElementById('guestTime');
  select.innerHTML = '';
  for(let h=8; h<17; h++){
    select.innerHTML += `<option>${h}:00</option>`;
    select.innerHTML += `<option>${h}:50</option>`;
  }
}
fillTimeSelect();

// ====== Минимальная дата ======
document.getElementById('guestDate').min = new Date().toISOString().split('T')[0];

// ====== Получение записей с таблицы ======
async function fetchRecords(){
  const res = await fetch(SCRIPT_URL);
  records = await res.json();
  if(currentUser){
    if(currentUser.role==='worker') renderWorkerRecords();
    else renderBossRecords();
  }
}

// ====== Добавление записи ======
async function addGuestRecord(){
  const name = document.getElementById('guestName').value.trim();
  const carType = document.getElementById('guestCarType').value;
  const radius = document.getElementById('radiusSelect').value;
  const service = document.getElementById('serviceSelect').value;
  const date = document.getElementById('guestDate').value;
  const time = document.getElementById('guestTime').value;

  if(!name || !date || !time){
    alert('Заполните все поля!');
    return;
  }

  // Проверка занятости
  const conflict = records.find(r=>r.name===name && r.date===date && r.time===time);
  if(conflict){
    alert('На это время уже есть запись!');
    return;
  }

  const payload = {name, carType, radius, service, date, time};
  await fetch(SCRIPT_URL,{
    method:'POST',
    body: JSON.stringify(payload)
  });
  alert('Запись добавлена!');
  fetchRecords();
}

// ====== Вход ======
function login(){
  const loginVal = document.getElementById('loginInput').value.trim();
  const user = users.find(u=>u.login===loginVal);
  if(user){
    currentUser = user;
    document.getElementById('loginCard').classList.add('hidden');
    if(user.role==='boss') showBossView();
    else showWorkerView();
  } else alert('Неверный логин');
}

// ====== Кабинет работника ======
function showWorkerView(){
  document.getElementById('workerCard').classList.remove('hidden');
  fetchRecords();
}

// ====== Кабинет босса ======
function showBossView(){
  document.getElementById('bossCard').classList.remove('hidden');
  fetchRecords();
}

// ====== Отметка выполнения работы ======
async function markRecord(id, action){
  const note = action==='Сделано'? prompt('Что сделано?','') : '';
  const sum = action==='Сделано'? prompt('Сумма получена','') : '';
  const payload = {
    action:'update',
    name: id.name,
    date: id.date,
    time: id.time,
    worker: currentUser.login,
    note,
    sum
  };
  await fetch(SCRIPT_URL,{
    method:'POST',
    body: JSON.stringify(payload)
  });
  fetchRecords();
}

// ====== Рендер для работника ======
function renderWorkerRecords(){
  const container = document.getElementById('workerRecords');
  container.innerHTML = '';
  records.forEach(r=>{
    const div = document.createElement('div');
    div.className='record';
    div.innerHTML = `<b>${r.name}</b> | ${r.carType} | ${r.radius} | ${r.service} | ${r.date} ${r.time}
      <div class="controls">
        <button onclick='markRecord(${JSON.stringify(r)},"Сделано")'>Приехал</button>
        <button onclick='markRecord(${JSON.stringify(r)},"Не приехал")'>Не приехал</button>
      </div>`;
    container.appendChild(div);
  });
}

// ====== Фильтр для босса ======
function setBossFilter(f){
  bossFilter = f;
  renderBossRecords();
}

// ====== Рендер для босса ======
function renderBossRecords(){
  const container = document.getElementById('bossRecords');
  container.innerHTML = '';
  let total = 0;
  const now = new Date();

  const filtered = records.filter(r=>{
    const recDate = new Date(r.date);
    if(bossFilter==='day') return recDate.toDateString()===now.toDateString();
    if(bossFilter==='week'){
      const weekStart = new Date(now); weekStart.setDate(now.getDate()-now.getDay());
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);
      return recDate>=weekStart && recDate<=weekEnd;
    }
    if(bossFilter==='month') return recDate.getMonth()===now.getMonth() && recDate.getFullYear()===now.getFullYear();
    return true;
  });

  filtered.forEach(r=>{
    const div = document.createElement('div');
    div.className='record';
    div.innerHTML = `<b>${r.name}</b> | ${r.carType} | ${r.radius} | ${r.service} | ${r.date} ${r.time}
      <div>Работник: ${r.worker || '-'} | Работа: ${r.note || '-'} | Сумма: ${r.sum || 0} грн</div>`;
    container.appendChild(div);
    total += parseFloat(r.sum || 0);
  });

  document.getElementById('bossTotal').innerText = 'Сумма: '+total+' грн';
}
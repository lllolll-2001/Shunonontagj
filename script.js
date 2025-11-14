const SPREADSHEET_URL = 'https://script.google.com/macros/s/AKfycbwkWctotFr9nlRRhNxfUPUfdOKR41he7NvrhgLU8iNF5YF82jlx6Y9Fata5eiP6tmPbjw/exec';

let records = [];
let currentUser = null;
let bossFilter = 'day';

// ====== Время ======
function fillTimeSelect() {
  const select = document.getElementById('guestTime');
  select.innerHTML = '';
  for(let h=8; h<17; h++){
    select.innerHTML += `<option>${h}:00</option>`;
    select.innerHTML += `<option>${h}:50</option>`;
  }
}
fillTimeSelect();
document.getElementById('guestDate').min = new Date().toISOString().split('T')[0];

// ====== Добавление записи ======
function addGuestRecord(){
  const name = document.getElementById('guestName').value.trim();
  const car = document.getElementById('guestCarType').value;
  const radius = document.getElementById('radiusSelect').value;
  const service = document.getElementById('serviceSelect').value;
  const date = document.getElementById('guestDate').value;
  const time = document.getElementById('guestTime').value;

  if(!name || !date || !time){
    alert('Заполните все поля!');
    return;
  }

  // Проверка занятости времени
  const conflict = records.find(r => r.date === date && r.time === time);
  if(conflict){
    alert(`Время ${time} на ${date} уже занято.`);
    return;
  }

  const newRecord = {name, car, radius, service, date, time, status:'Не отмечено', addedBy:'Гость', workDescription:'', earned:0};

  // Сохраняем через Apps Script
  fetch(SPREADSHEET_URL, {
    method: 'POST',
    body: JSON.stringify({action:'add', record:newRecord}),
    headers:{'Content-Type':'application/json'}
  }).then(res => res.json()).then(data=>{
    if(data.success){
      records.push(newRecord);
      alert('Запись добавлена!');
    } else {
      alert('Ошибка сервера');
    }
  });
}

// ====== Вход ======
function login(){
  const loginVal = document.getElementById('loginInput').value.trim();
  const passVal = document.getElementById('passwordInput').value.trim();

  fetch(SPREADSHEET_URL, {
    method: 'POST',
    body: JSON.stringify({action:'login', login:loginVal, password:passVal}),
    headers:{'Content-Type':'application/json'}
  }).then(res=>res.json()).then(data=>{
    if(data.success){
      currentUser = data.user;
      document.getElementById('logoutBtn').classList.remove('hidden');
      document.getElementById('loginCard').classList.add('hidden');
      if(data.user.role==='boss') showBossView();
      else showWorkerView();
    } else alert('Неверный логин или пароль');
  });
}

function logout(){
  currentUser = null;
  document.getElementById('bossCard').classList.add('hidden');
  document.getElementById('workerCard').classList.add('hidden');
  document.getElementById('logoutBtn').classList.add('hidden');
  document.getElementById('loginCard').classList.remove('hidden');
}

// ====== Кабинет работника ======
function showWorkerView(){
  document.getElementById('workerCard').classList.remove('hidden');
  fetchRecords();
}

function showBossView(){
  document.getElementById('bossCard').classList.remove('hidden');
  fetchRecords();
}

function fetchRecords(){
  fetch(SPREADSHEET_URL, {
    method:'POST',
    body:JSON.stringify({action:'get'}),
    headers:{'Content-Type':'application/json'}
  }).then(res=>res.json()).then(data=>{
    if(data.success){
      records = data.records;
      renderWorkerRecords();
      renderBossRecords();
    }
  });
}

// ====== Рендер ======
function renderWorkerRecords(){
  const container = document.getElementById('workerRecords');
  container.innerHTML='';
  records.forEach(r=>{
    const div = document.createElement('div');
    div.className='record';
    div.innerHTML = `<b>${r.name}</b> | ${r.car} | ${r.radius} | ${r.service} | ${r.date} ${r.time}
      <div class="controls">
        <button onclick="markRecord('${r.date}','${r.time}','Сделано')">Приехал</button>
        <button onclick="markRecord('${r.date}','${r.time}','Не приехал')">Не приехал</button>
      </div>`;
    container.appendChild(div);
  });
}

function markRecord(date,time,status){
  const rec = records.find(r=>r.date===date && r.time===time);
  if(!rec) return;
  const workDesc = prompt("Что выполнено?");
  const earnedStr = prompt("Сумма (грн):");
  const earned = parseFloat(earnedStr)||0;
  rec.status=status;
  rec.workDescription=workDesc;
  rec.earned=earned;

  // Сохраняем изменения
  fetch(SPREADSHEET_URL,{
    method:'POST',
    body:JSON.stringify({action:'update', record:rec}),
    headers:{'Content-Type':'application/json'}
  }).then(res=>res.json()).then(data=>fetchRecords());
}

// ====== Босс ======
function setBossFilter(f){
  bossFilter=f;
  renderBossRecords();
}

function renderBossRecords(){
  const container = document.getElementById('bossRecords');
  container.innerHTML='';
  let total=0;
  const now=new Date();
  const filterFunc=r=>{
    const recDate=new Date(r.date);
    if(bossFilter==='day') return recDate.toDateString()===now.toDateString();
    if(bossFilter==='week'){
      const weekStart=new Date(now); weekStart.setDate(now.getDate()-now.getDay());
      const weekEnd=new Date(weekStart); weekEnd.setDate(weekStart.getDate()+6);
      return recDate>=weekStart && recDate<=weekEnd;
    }
    if(bossFilter==='month') return recDate.getMonth()===now.getMonth() && recDate.getFullYear()===now.getFullYear();
  };
  records.filter(filterFunc).forEach(r=>{
    const div=document.createElement('div');
    div.className='record';
    div.innerHTML=`<b>${r.name}</b> | ${r.car} | ${r.radius} | ${r.service} | ${r.date} ${r.time} | Статус: ${r.status} | Работа: ${r.workDescription||'-'} | Сумма: ${r.earned} грн`;
    container.appendChild(div);
    total+=r.earned||0;
  });
  document.getElementById('bossTotal').innerText='Сумма: '+total+' грн';
}

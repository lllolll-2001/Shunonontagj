window.addEventListener('DOMContentLoaded', () => {

  // ====== Слоты времени 08:00 - 17:00 с шагом 45 мин ======
  const timeSelect = document.getElementById('guestTime');
  if(timeSelect){
    timeSelect.innerHTML = '';
    let start = 8 * 60;
    const end = 17 * 60;
    const interval = 45;
    while(start <= end){
      const h = Math.floor(start / 60);
      const m = start % 60;
      const display = `${h}:${m.toString().padStart(2,'0')}`;
      timeSelect.innerHTML += `<option>${display}</option>`;
      start += interval;
    }
  }

  // ====== Минимальная дата ======
  const dateInput = document.getElementById('guestDate');
  if(dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  // ====== Таблица цен ======
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

  // ====== Обновление цены ======
  function updatePrice(){
    const car = document.getElementById('guestCarType').value;
    const radius = document.getElementById('radiusSelect').value;
    const service = document.getElementById('serviceSelect').value;
    const range = getRadiusRange(radius);
    let priceText = '-';
    if(priceTable[car] && priceTable[car][range]){
      if(service.includes('Балансировка') && service.includes('с')) priceText = priceTable[car][range].full;
      else if(service.includes('Балансировка')) priceText = priceTable[car][range].balance;
      if(priceText !== '-') priceText = 'от ' + priceText + ' грн';
    }
    const priceDisplay = document.getElementById('priceDisplay');
    if(priceDisplay) priceDisplay.innerText = priceText;
  }

  ['guestCarType','radiusSelect','serviceSelect'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.addEventListener('change', updatePrice);
  });

  updatePrice();

  // ====== Записи и пользователи ======
  let records = [];
  let currentUser = null;

  // ====== Добавление записи ======
  window.addGuestRecord = async () => {
    const name = document.getElementById('guestName').value.trim();
    const phone = document.getElementById('guestPhone').value.trim();
    const car = document.getElementById('guestCarType').value;
    const radius = document.getElementById('radiusSelect').value;
    const service = document.getElementById('serviceSelect').value;
    const date = document.getElementById('guestDate').value;
    const time = document.getElementById('guestTime').value;

    if(!name || !phone || !date || !time){
      alert('Заполните все поля!');
      return;
    }

    // Проверка на конфликт времени
    const conflict = records.find(r=>r.date===date && r.time===time);
    if(conflict){
      alert(`Время ${time} на ${date} уже занято`);
      return;
    }

    const newRecord = {
      id: Date.now(),
      name, phone, car, radius, service, date, time,
      status:'Не отмечено', earned:0
    };

    records.push(newRecord);
    alert('Запись добавлена!');
    renderRecords();
  };

  // ====== Вход ======
  window.login = async () => {
    const loginVal = document.getElementById('loginInput').value.trim();
    const passVal = document.getElementById('passwordInput').value.trim();

    // Жёстко заданные пользователи
    const users = [
      {login:'boss', password:'kolovo.123q', role:'boss'},
      {login:'worker', password:'Vlad.123q', role:'worker'}
    ];

    const user = users.find(u=>u.login===loginVal && u.password===passVal);
    if(user){
      currentUser = user;
      document.getElementById('loginCard').classList.add('hidden');
      document.getElementById('logoutBtn').classList.remove('hidden');
      if(user.role==='boss') document.getElementById('bossCard').classList.remove('hidden');
      else document.getElementById('workerCard').classList.remove('hidden');
      renderRecords();
    } else alert('Неверный логин или пароль');
  };

  window.logout = () => {
    currentUser = null;
    document.getElementById('loginCard').classList.remove('hidden');
    document.getElementById('logoutBtn').classList.add('hidden');
    document.getElementById('bossCard').classList.add('hidden');
    document.getElementById('workerCard').classList.add('hidden');
  };

  // ====== Рендер записей ======
  function renderRecords(){
    if(!currentUser) return;

    if(currentUser.role==='worker'){
      const container = document.getElementById('workerRecords');
      container.innerHTML = '';
      records.forEach(r=>{
        const div = document.createElement('div');
        div.className='record';
        div.innerHTML = `
          <b>${r.name}</b> | ${r.phone} | ${r.car} | ${r.radius} | ${r.service} | ${r.date} ${r.time} <br>
          Статус: ${r.status} | Цена: ${r.earned} грн <br>
          <button onclick="markRecord(${r.id},'Приехал')">Приехал</button>
          <button onclick="markRecord(${r.id},'Не приехал')">Не приехал</button>
        `;
        container.appendChild(div);
      });
    }

    if(currentUser.role==='boss'){
      const container = document.getElementById('bossRecords');
      container.innerHTML = '';
      let total = 0;
      records.forEach(r=>{
        const div = document.createElement('div');
        div.className='record';
        let price = r.earned || 0;
        total += price;
        div.innerHTML = `
          <b>${r.name}</b> | ${r.phone} | ${r.car} | ${r.radius} | ${r.service} | ${r.date} ${r.time} <br>
          Статус: ${r.status} | Цена: ${price} грн <br>
          <button onclick="deleteRecord(${r.id})">Удалить</button>
        `;
        container.appendChild(div);
      });
      document.getElementById('bossTotal').innerText = 'Сумма: ' + total + ' грн';
    }
  }

  window.markRecord = (id, status) => {
    const rec = records.find(r=>r.id===id);
    if(!rec) return;
    rec.status = status;
    if(status==='Приехал'){
      const earned = prompt('Введите сумму за услугу:');
      rec.earned = parseFloat(earned) || 0;
    }
    renderRecords();
  };

  window.deleteRecord = (id) => {
    if(confirm('Удалить запись?')){
      records = records.filter(r=>r.id!==id);
      renderRecords();
    }
  };

});

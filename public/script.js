document.getElementById('guestDate').min = new Date().toISOString().split('T')[0];

async function fetchRecords() {
  const res = await fetch('/api/records');
  return await res.json();
}

async function addGuestRecord() {
  const name = document.getElementById('guestName').value.trim();
  const phone = document.getElementById('guestPhone').value.trim();
  const car = document.getElementById('guestCarType').value;
  const radius = document.getElementById('radiusSelect').value;
  const service = document.getElementById('serviceSelect').value;
  const date = document.getElementById('guestDate').value;
  const time = document.getElementById('guestTime').value;

  if (!name || !phone || !date || !time) { alert('Заполните все поля!'); return; }

  const res = await fetch('/api/records', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({name,phone,car,radius,service,date,time})
  });

  if(res.ok) alert('Запись добавлена!');
  else alert('Ошибка при добавлении');
}

async function login() {
  const loginVal = document.getElementById('loginInput').value.trim();
  const passVal = document.getElementById('passwordInput').value.trim();

  const res = await fetch('/api/records', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify({action:'login',login:loginVal,password:passVal})
  });

  if(res.ok){
    const data = await res.json();
    alert(`Вход выполнен. Роль: ${data.user.role}`);
    if(data.user.role==='boss') document.getElementById('bossCard').classList.remove('hidden');
    else document.getElementById('workerCard').classList.remove('hidden');
    document.getElementById('loginCard').classList.add('hidden');
  } else alert('Неверный логин или пароль');
}

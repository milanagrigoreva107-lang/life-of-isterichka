// ============================================================
// ===== НАВИГАЦИЯ =====
// ============================================================
const navButtons = document.querySelectorAll('.nav-btn');
const screens = document.querySelectorAll('.screen');

const headerTitles = {
schedule: 'Расписание',
tasks: 'Задачи',
finance: 'Финансы',
links: 'Ссылки',
plans:'Планы'
};

navButtons.forEach(btn => {
btn.addEventListener('click', () => {
const target = btn.dataset.screen;
navButtons.forEach(b => b.classList.remove('active'));
btn.classList.add('active');
screens.forEach(s => s.classList.remove('active'));
document.getElementById('screen-' + target).classList.add('active');
document.getElementById('header-title').textContent = headerTitles[target];
document.body.className = 'theme-' + target;
});
});

document.body.className = 'theme-schedule';


// ============================================================
// ===== ОБЩИЕ УТИЛИТЫ =====
// ============================================================
function makeId() {
return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function dateToKey(date) {
const y = date.getFullYear();
const m = String(date.getMonth() + 1).padStart(2, '0');
const d = String(date.getDate()).padStart(2, '0');
return `${y}-${m}-${d}`;
}

function escapeHtml(str) {
return String(str)
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;');
}

const monthNames = [
'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const dayNames = [
'Понедельник', 'Вторник', 'Среда',
'Четверг', 'Пятница', 'Суббота', 'Воскресенье'
];

function getMondayOf(date) {
const d = new Date(date);
const day = d.getDay();
const diff = (day === 0) ? -6 : 1 - day;
d.setDate(d.getDate() + diff);
d.setHours(0, 0, 0, 0);
return d;
}

function getWeekNumber(date) {
const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
const dayNum = d.getUTCDay() || 7;
d.setUTCDate(d.getUTCDate() + 4 - dayNum);
const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}


// ============================================================
// ===== РАСПИСАНИЕ: ДАННЫЕ =====
// ============================================================
let records = loadRecords();

function loadRecords() {
const raw = localStorage.getItem('isterichka-records');
return raw ? JSON.parse(raw) : [];
}

function saveRecords() {
localStorage.setItem('isterichka-records', JSON.stringify(records));
}


// ============================================================
// ===== РАСПИСАНИЕ: НЕДЕЛЯ =====
// ============================================================
let currentMonday = getMondayOf(new Date());

function renderWeekHeader() {
const sunday = new Date(currentMonday);
sunday.setDate(sunday.getDate() + 6);

let title;
if (currentMonday.getMonth() === sunday.getMonth()) {
title = monthNames[currentMonday.getMonth()] + ' ' + currentMonday.getFullYear();
} else {
title = monthNames[currentMonday.getMonth()] + ' – ' +
monthNames[sunday.getMonth()] + ' ' + sunday.getFullYear();
}

document.getElementById('week-month').textContent = title;
document.getElementById('week-sub').textContent = 'Неделя ' + getWeekNumber(currentMonday);
}


// ============================================================
// ===== РАСПИСАНИЕ: ОТРИСОВКА =====
// ============================================================
function renderRecordHTML(record) {
if (record.type === 'timed') {
return `
<div class="record record-timed" data-id="${record.id}">
<span class="record-time">${escapeHtml(record.time)}</span>
<span class="record-text">${escapeHtml(record.text)}</span>
<button class="record-delete" data-id="${record.id}" aria-label="Удалить">✕</button>
</div>
`;
}
return `
<div class="record record-no-time" data-id="${record.id}">
<span class="record-text">${escapeHtml(record.text)}</span>
<button class="record-delete" data-id="${record.id}" aria-label="Удалить">✕</button>
</div>
`;
}

function renderDays(animationClass) {
const container = document.getElementById('days-list');
container.innerHTML = '';

for (let i = 0; i < 7; i++) {
const d = new Date(currentMonday);
d.setDate(d.getDate() + i);
const key = dateToKey(d);

const dayRecords = records.filter(r => r.date === key);
const noTime = dayRecords.filter(r => r.type === 'no-time');
const timed = dayRecords
.filter(r => r.type === 'timed')
.sort((a, b) => a.time.localeCompare(b.time));

const noTimeHtml = noTime.length
? noTime.map(renderRecordHTML).join('')
: `<div class="add-line" data-action="add" data-type="no-time" data-date="${key}">Кликни, чтобы добавить…</div>`;

const timedHtml = timed.length
? timed.map(renderRecordHTML).join('') +
`<div class="add-line add-line-small" data-action="add" data-type="timed" data-date="${key}">+ добавить запись со временем</div>`
: `<div class="add-line" data-action="add" data-type="timed" data-date="${key}">+ добавить запись со временем</div>`;
// Долги на этот день
    const dayDebts = debts.filter(d => d.date === key);
    const debtsHtml = dayDebts.length
      ? `<div class="day-debts">
           <div class="no-time-label">💰 Отдать</div>
           ${dayDebts.map(d => `
             <div class="record record-debt" data-id="${d.id}">
               <span class="record-text">${escapeHtml(d.text)}</span>
               <span class="record-amount">${d.amount.toLocaleString('ru-RU')} ₽</span>
             </div>
           `).join('')}
         </div>`
      : '';
const card = document.createElement('article');
card.className = 'day-card';
card.innerHTML = `
<header class="day-header">
<span class="day-name">${dayNames[i]}</span>
<span class="day-date">${d.getDate()}</span>
</header>
<div class="day-no-time">
<div class="no-time-label">На день</div>
${noTimeHtml}
</div>
<div class="day-timed">
${timedHtml}
</div>
${debtsHtml}
`;
container.appendChild(card);
}

if (animationClass) {
container.classList.remove('animate-from-right', 'animate-from-left');
void container.offsetWidth;
container.classList.add(animationClass);
setTimeout(() => {
container.classList.remove(animationClass);
}, 320);
}

renderTodayCard();
}


// ============================================================
// ===== КАРТОЧКА "НА СЕГОДНЯ" =====
// ============================================================
function renderTodayCard() {
const content = document.getElementById('today-content');
const todayKey = dateToKey(new Date());
const todayRecords = records.filter(r => r.date === todayKey);

if (todayRecords.length === 0) {
content.innerHTML = `<div class="today-empty">🌸 Свободный день, отдыхай</div>`;
return;
}

const timed = todayRecords.filter(r => r.type === 'timed')
.sort((a, b) => a.time.localeCompare(b.time));
const noTime = todayRecords.filter(r => r.type === 'no-time');

let html = '';
noTime.forEach(r => {
html += `<div class="today-line"><span class="record-text">${escapeHtml(r.text)}</span></div>`;
});

const MAX_SHOW = 3;
timed.slice(0, MAX_SHOW).forEach(r => {
html += `<div class="today-line"><span class="today-time">${escapeHtml(r.time)}</span><span class="record-text">${escapeHtml(r.text)}</span></div>`;
});

const totalShown = noTime.length + Math.min(timed.length, MAX_SHOW);
if (todayRecords.length > totalShown) {
html += `<div class="today-more">и ещё ${todayRecords.length - totalShown}…</div>`;
}

content.innerHTML = html;
}


// ============================================================
// ===== МОДАЛЬНОЕ ОКНО РАСПИСАНИЯ =====
// ============================================================
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const fieldTime = document.getElementById('field-time');
const inputTime = document.getElementById('input-time');
const inputText = document.getElementById('input-text');

let modalContext = { date: '', type: '' };

function openModal(date, type) {
modalContext = { date, type };

const d = new Date(date + 'T00:00:00');
const weekday = dayNames[(d.getDay() + 6) % 7];
const monthsGenitive = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
                        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const monthName = monthsGenitive[d.getMonth()];
const dateLabel = `${weekday}, ${d.getDate()} ${monthName}`;

if (type === 'timed') {
modalTitle.textContent = dateLabel + ' · со временем';
fieldTime.style.display = 'block';
inputTime.value = '';
} else {
modalTitle.textContent = dateLabel + ' · на день';
fieldTime.style.display = 'none';
}
inputText.value = '';

modal.classList.add('open');
setTimeout(() => {
type === 'timed' ? inputTime.focus() : inputText.focus();
}, 100);
}

function closeModal() {
modal.classList.remove('open');
modalContext = { date: '', type: '' };
}

function saveModal() {
const text = inputText.value.trim();
if (!text) { showAlert('Пустую запись сохранить нельзя 🙂'); return; }

if (modalContext.type === 'timed') {
const time = inputTime.value.trim();
if (!time) { showAlert('Укажи время'); return; }
const timePattern = /^\d{1,2}:\d{2}(\s*[–-]\s*\d{1,2}:\d{2})?$/;
if (!timePattern.test(time)) { showAlert('Формат: 19:40 или 19:40–21:10'); return; }
addRecord(modalContext.date, 'timed', time, text);
} else {
addRecord(modalContext.date, 'no-time', '', text);
}
closeModal();
}

function addRecord(date, type, time, text) {
records.push({ id: makeId(), date, type, time: time || '', text });
saveRecords();
renderDays();
}

function deleteRecord(id) {
records = records.filter(r => r.id !== id);
saveRecords();
renderDays();
}


// ============================================================
// ===== ОБРАБОТЧИКИ РАСПИСАНИЯ =====
// ============================================================
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-save').addEventListener('click', saveModal);

modal.addEventListener('click', (e) => {
if (e.target === modal) closeModal();
});

document.addEventListener('keydown', (e) => {
if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
});

document.getElementById('days-list').addEventListener('click', (e) => {
const delBtn = e.target.closest('.record-delete');
if (delBtn) { deleteRecord(delBtn.dataset.id); return; }

const addLine = e.target.closest('[data-action="add"]');
if (addLine) {
openModal(addLine.dataset.date, addLine.dataset.type);
}
});

document.getElementById('today-card').addEventListener('click', () => {
currentMonday = getMondayOf(new Date());
renderWeekHeader();
renderDays('animate-from-right');
});

document.getElementById('btn-prev-week').addEventListener('click', () => {
currentMonday.setDate(currentMonday.getDate() - 7);
renderWeekHeader();
renderDays('animate-from-left');
});

document.getElementById('btn-next-week').addEventListener('click', () => {
currentMonday.setDate(currentMonday.getDate() + 7);
renderWeekHeader();
renderDays('animate-from-right');
});

document.getElementById('btn-today').addEventListener('click', () => {
currentMonday = getMondayOf(new Date());
renderWeekHeader();
renderDays();
});


// ============================================================
// ===== СВАЙПЫ =====
// ============================================================
const daysList = document.getElementById('days-list');
const SWIPE_THRESHOLD = 60;
let startX = 0;
let isDragging = false;

function handleSwipe(deltaX) {
if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
if (deltaX < 0) {
currentMonday.setDate(currentMonday.getDate() + 7);
renderWeekHeader();
renderDays('animate-from-right');
} else {
currentMonday.setDate(currentMonday.getDate() - 7);
renderWeekHeader();
renderDays('animate-from-left');
}
}

daysList.addEventListener('touchstart', (e) => {
startX = e.touches[0].clientX;
isDragging = true;
}, { passive: true });

daysList.addEventListener('touchend', (e) => {
if (!isDragging) return;
isDragging = false;
handleSwipe(e.changedTouches[0].clientX - startX);
}, { passive: true });

daysList.addEventListener('mousedown', (e) => {
if (e.target.closest('button') || e.target.closest('.add-line')) {
isDragging = false;
return;
}
startX = e.clientX;
isDragging = true;
});

daysList.addEventListener('mouseup', (e) => {
if (!isDragging) return;
isDragging = false;
const deltaX = e.clientX - startX;
if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
handleSwipe(deltaX);
});


// ============================================================
// ===== ЗАДАЧИ =====
// ============================================================
let tasks = loadTasks();

function loadTasks() {
const raw = localStorage.getItem('isterichka-tasks');
return raw ? JSON.parse(raw) : [];
}

function saveTasks() {
localStorage.setItem('isterichka-tasks', JSON.stringify(tasks));
}

const taskModal = document.getElementById('task-modal');
const taskInputText = document.getElementById('task-input-text');
const taskInputDate = document.getElementById('task-input-date');

function openTaskModal() {
taskInputText.value = '';
taskInputDate.value = '';
taskModal.classList.add('open');
setTimeout(() => taskInputText.focus(), 100);
}

function closeTaskModal() {
taskModal.classList.remove('open');
}

function saveTask() {
const text = taskInputText.value.trim();
if (!text) { showAlert('Пустую задачу сохранить нельзя 🙂'); return; }
const date = taskInputDate.value || '';

tasks.push({
id: makeId(),
text: text,
deadline: date,
done: false,
createdAt: Date.now()
});

saveTasks();
closeTaskModal();
renderTasks();
}

function daysUntil(deadlineStr) {
if (!deadlineStr) return null;
const today = new Date();
today.setHours(0, 0, 0, 0);
const deadline = new Date(deadlineStr + 'T00:00:00');
return Math.round((deadline - today) / 86400000);
}

function getTaskStatus(task) {
if (task.done) return 'done';
if (!task.deadline) return 'no-deadline';
const days = daysUntil(task.deadline);
if (days < 0) return 'overdue';
if (days <= 2) return 'soon';
return 'normal';
}

function formatDeadline(deadlineStr) {
if (!deadlineStr) return '';
const d = new Date(deadlineStr + 'T00:00:00');
const months = [
'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
];
return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatDaysLeft(deadlineStr) {
if (!deadlineStr) return '';
const days = daysUntil(deadlineStr);
if (days < 0) return `просрочено на ${Math.abs(days)} дн.`;
if (days === 0) return 'сегодня';
if (days === 1) return 'осталось 1 день';
if (days <= 4) return `осталось ${days} дня`;
return `осталось ${days} дней`;
}

function renderTaskHTML(task) {
const status = getTaskStatus(task);
const deadlineText = formatDeadline(task.deadline);
const daysText = formatDaysLeft(task.deadline);

return `
<div class="task-card status-${status}" data-id="${task.id}">
<button class="task-check" data-action="toggle" data-id="${task.id}" aria-label="Отметить">✓</button>
<div class="task-content">
<div class="task-text">${escapeHtml(task.text)}</div>
${deadlineText ? `
<div class="task-meta">
<span class="task-deadline">до ${deadlineText}</span>
<span class="task-days">${daysText}</span>
</div>
` : ''}
</div>
<button class="task-delete" data-action="delete" data-id="${task.id}" aria-label="Удалить">✕</button>
</div>
`;
}

function renderTasks() {
const container = document.getElementById('tasks-list');
const overdueBlock = document.getElementById('overdue-block');
const allGoodBlock = document.getElementById('all-good-block');
renderDebtsInTasks();

if (tasks.length === 0) {
container.innerHTML = '';
overdueBlock.style.display = 'none';
allGoodBlock.style.display = 'block';
return;
}

const overdue = tasks.filter(t => getTaskStatus(t) === 'overdue');
const active = tasks.filter(t => {
const s = getTaskStatus(t);
return s !== 'overdue' && s !== 'done';
});
const done = tasks.filter(t => t.done);

if (overdue.length > 0) {
overdueBlock.style.display = 'block';
allGoodBlock.style.display = 'none';
overdueBlock.innerHTML = `
<div class="overdue-title">⚠ Просрочено: ${overdue.length}</div>
${overdue.map(renderTaskHTML).join('')}
`;
} else {
overdueBlock.style.display = 'none';
allGoodBlock.style.display = 'block';
}

const sortOrder = { soon: 0, normal: 1, 'no-deadline': 2 };
active.sort((a, b) => {
const sa = sortOrder[getTaskStatus(a)] ?? 3;
const sb = sortOrder[getTaskStatus(b)] ?? 3;
if (sa !== sb) return sa - sb;
return (a.deadline || '9999').localeCompare(b.deadline || '9999');
});

const activeHtml = active.map(renderTaskHTML).join('');
  const doneHtml = done.map(renderTaskHTML).join('');

  container.innerHTML = activeHtml + doneHtml;
}

// ============================================================
// ===== ДОЛГИ В ЗАДАЧАХ =====
// ============================================================
function renderDebtsInTasks() {
  const container = document.getElementById('debts-in-tasks');
  if (!container) return;

  if (debts.length === 0) {
    container.innerHTML = '';
    return;
  }

  const sorted = [...debts].sort((a, b) => a.date.localeCompare(b.date));

  const cardsHtml = sorted.map(debt => {
    const d = new Date(debt.date + 'T00:00:00');
    const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн',
                    'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
    const dateText = d.getDate() + ' ' + months[d.getMonth()];

    const days = daysUntil(debt.date);
    let daysText = '';
    if (days < 0) daysText = ' · просрочено на ' + Math.abs(days) + ' дн.';
    else if (days === 0) daysText = ' · сегодня';
    else if (days === 1) daysText = ' · завтра';

    return '<div class="debt-task-card" data-id="' + debt.id + '">' +
      '<div class="debt-task-content">' +
        '<div class="debt-task-text">💰 ' + escapeHtml(debt.text) + '</div>' +
        '<div class="debt-task-meta">до ' + dateText + daysText + '</div>' +
      '</div>' +
      '<div class="debt-task-amount">' + debt.amount.toLocaleString('ru-RU') + ' ₽</div>' +
      '<button class="debt-pay-task-btn" data-action="pay-debt" data-id="' + debt.id + '">Отдал</button>' +
    '</div>';
  }).join('');

  container.innerHTML = '<div class="debts-in-tasks-title">💰 Долги из финансов</div>' + cardsHtml;
}

// Обработчик кнопки "Отдал"
document.getElementById('debts-in-tasks').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action="pay-debt"]');
  if (!btn) return;

  const id = btn.dataset.id;
 showConfirm('Долг отдан? Запись удалится из финансов.', (ok) => {
    if (!ok) return;
    debts = debts.filter(d => d.id !== id);
    saveDebts();
    renderDebts();
    renderDebtsInTasks();
    renderReminders();
  });
});

function handleTaskClick(e) {
const btn = e.target.closest('[data-action]');
if (!btn) return;

const id = btn.dataset.id;
const action = btn.dataset.action;

if (action === 'toggle') {
const task = tasks.find(t => t.id === id);
if (task) {
task.done = !task.done;
saveTasks();
renderTasks();
}
}

if (action === 'delete') {
tasks = tasks.filter(t => t.id !== id);
saveTasks();
renderTasks();
}
}

document.getElementById('btn-add-task').addEventListener('click', openTaskModal);
document.getElementById('task-modal-close').addEventListener('click', closeTaskModal);
document.getElementById('task-modal-cancel').addEventListener('click', closeTaskModal);
document.getElementById('task-modal-save').addEventListener('click', saveTask);

taskModal.addEventListener('click', (e) => {
if (e.target === taskModal) closeTaskModal();
});

document.getElementById('tasks-list').addEventListener('click', handleTaskClick);
document.getElementById('overdue-block').addEventListener('click', handleTaskClick);


// ============================================================
// ===== ФИНАНСЫ: КРЕДИТЫ =====
// ============================================================
let credits = loadCredits();

function loadCredits() {
const raw = localStorage.getItem('isterichka-credits');
return raw ? JSON.parse(raw) : [];
}

function saveCredits() {
localStorage.setItem('isterichka-credits', JSON.stringify(credits));
}

const cardModal = document.getElementById('card-modal');
const cardInputName = document.getElementById('card-input-name');
const cardInputTotal = document.getElementById('card-input-total');
const cardInputMonthly = document.getElementById('card-input-monthly');
const cardInputDay = document.getElementById('card-input-day');

function openCardModal() {
cardInputName.value = '';
cardInputTotal.value = '';
cardInputMonthly.value = '';
cardInputDay.value = '';
cardModal.classList.add('open');
setTimeout(() => cardInputName.focus(), 100);
}

function closeCardModal() {
cardModal.classList.remove('open');
}

function saveCard() {
const name = cardInputName.value.trim();
const total = Number(cardInputTotal.value);
const monthly = Number(cardInputMonthly.value);
const day = Number(cardInputDay.value);

if (!name) { showAlert('Введи название кредитки'); return; }
if (!total || total <= 0) { showAlert('Введи сумму остатка'); return; }
if (!monthly || monthly <= 0) { showAlert('Введи ежемесячный платёж'); return; }
if (!day || day < 1 || day > 31) { showAlert('Введи дату платежа (1–31)'); return; }

credits.push({
id: makeId(),
name: name,
total: total,
monthly: monthly,
day: day,
payments: [],
createdAt: Date.now()
});

saveCredits();
closeCardModal();
renderCredits();
renderReminders();
}

function deleteCredit(id) {
  showConfirm('Удалить эту кредитку?', (ok) => {
    if (!ok) return;
    credits = credits.filter(c => c.id !== id);
    saveCredits();
    renderCredits();
    renderReminders();
  });
}

function payCredit(id) {
const credit = credits.find(c => c.id === id);
if (!credit) return;

const newTotal = Math.max(0, credit.total - credit.monthly);

credit.payments = credit.payments || [];
credit.payments.push({
date: new Date().toISOString().slice(0, 10),
amount: credit.monthly
});

credit.total = newTotal;

saveCredits();
renderCredits();
renderReminders();

if (newTotal === 0) {
showAlert('🎉 Поздравляю! Кредитка "' + credit.name + '" полностью выплачена!');
}
}

function renderCredits() {
const container = document.getElementById('cards-list');
if (!container) return;

if (credits.length === 0) {
container.innerHTML = `<div class="finance-empty">Пока нет кредиток</div>`;
return;
}

container.innerHTML = credits.map(credit => {
const paidCount = (credit.payments || []).length;
const paidSum = (credit.payments || []).reduce((s, p) => s + p.amount, 0);
const progress = paidSum > 0
? `<div class="credit-card-info">Выплачено: ${paidCount} раз, ${paidSum.toLocaleString('ru-RU')} ₽</div>`
: '';

return `
<div class="credit-card">
<div class="credit-card-header">
<span class="credit-card-name">${escapeHtml(credit.name)}</span>
<span class="credit-card-total">${credit.total.toLocaleString('ru-RU')} ₽</span>
</div>
<div class="credit-card-info">
<span>Платёж: ${credit.monthly.toLocaleString('ru-RU')} ₽</span>
<span>Дата: ${credit.day}-е число</span>
</div>
${progress}
<div class="credit-card-actions">
<button class="credit-pay-btn" data-action="pay" data-id="${credit.id}">
Оплачено −${credit.monthly.toLocaleString('ru-RU')} ₽
</button>
<button class="credit-delete-btn" data-action="delete" data-id="${credit.id}" aria-label="Удалить">✕</button>
</div>
</div>
`;
}).join('');
}

document.getElementById('btn-add-card').addEventListener('click', openCardModal);
document.getElementById('card-modal-close').addEventListener('click', closeCardModal);
document.getElementById('card-modal-cancel').addEventListener('click', closeCardModal);
document.getElementById('card-modal-save').addEventListener('click', saveCard);

cardModal.addEventListener('click', (e) => {
if (e.target === cardModal) closeCardModal();
});

document.getElementById('cards-list').addEventListener('click', (e) => {
const btn = e.target.closest('[data-action]');
if (!btn) return;

const id = btn.dataset.id;
const action = btn.dataset.action;

if (action === 'pay') payCredit(id);
if (action === 'delete') deleteCredit(id);
});


// ============================================================
// ===== ФИНАНСЫ: КРУПНЫЕ ТРАТЫ =====
// ============================================================
let debts = loadDebts();

function loadDebts() {
const raw = localStorage.getItem('isterichka-debts');
return raw ? JSON.parse(raw) : [];
}

function saveDebts() {
localStorage.setItem('isterichka-debts', JSON.stringify(debts));
}

const debtModal = document.getElementById('debt-modal');
const debtInputText = document.getElementById('debt-input-text');
const debtInputAmount = document.getElementById('debt-input-amount');
const debtInputDate = document.getElementById('debt-input-date');

function openDebtModal() {
debtInputText.value = '';
debtInputAmount.value = '';
debtInputDate.value = '';
debtModal.classList.add('open');
setTimeout(() => debtInputText.focus(), 100);
}

function closeDebtModal() {
debtModal.classList.remove('open');
}

function saveDebt() {
const text = debtInputText.value.trim();
const amount = Number(debtInputAmount.value);
const date = debtInputDate.value;

if (!text) { showAlert('Что за трата?'); return; }
if (!amount || amount <= 0) { showAlert('Введи сумму'); return; }
if (!date) { showAlert('Укажи, до какого числа'); return; }

debts.push({
id: makeId(),
text: text,
amount: amount,
date: date,
createdAt: Date.now()
});

saveDebts();
closeDebtModal();
renderDebts();
renderReminders();
renderDebtsInTasks();
}

function deleteDebt(id) {
  showConfirm('Удалить эту запись?', (ok) => {
    if (!ok) return;
    debts = debts.filter(d => d.id !== id);
    saveDebts();
    renderDebts();
    renderReminders();
    renderDebtsInTasks();
  });
}

function renderDebts() {
const container = document.getElementById('debts-list');
if (!container) return;

if (debts.length === 0) {
container.innerHTML = `<div class="finance-empty">Нет крупных трат</div>`;
return;
}

const sorted = [...debts].sort((a, b) => a.date.localeCompare(b.date));

container.innerHTML = sorted.map(debt => {
const d = new Date(debt.date + 'T00:00:00');
const months = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн',
'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const dateText = `${d.getDate()} ${months[d.getMonth()]}`;

return `
<div class="debt-card">
<div class="debt-card-info">
<div class="debt-card-text">${escapeHtml(debt.text)}</div>
<div class="debt-card-meta">до ${dateText}</div>
</div>
<div class="debt-card-amount">${debt.amount.toLocaleString('ru-RU')} ₽</div>
<button class="credit-delete-btn" data-action="delete" data-id="${debt.id}" aria-label="Удалить">✕</button>
</div>
`;
}).join('');
}

document.getElementById('btn-add-debt').addEventListener('click', openDebtModal);
document.getElementById('debt-modal-close').addEventListener('click', closeDebtModal);
document.getElementById('debt-modal-cancel').addEventListener('click', closeDebtModal);
document.getElementById('debt-modal-save').addEventListener('click', saveDebt);

debtModal.addEventListener('click', (e) => {
if (e.target === debtModal) closeDebtModal();
});

document.getElementById('debts-list').addEventListener('click', (e) => {
const btn = e.target.closest('[data-action]');
if (!btn) return;
if (btn.dataset.action === 'delete') deleteDebt(btn.dataset.id);
});


// ============================================================
// ===== ФИНАНСЫ: БЫСТРЫЕ ТРАТЫ =====
// ============================================================
const DEFAULT_CATEGORIES = [
{ id: 'food', name: 'Еда', emoji: '🍔', custom: false },
{ id: 'transport', name: 'Транспорт', emoji: '🚌', custom: false },
{ id: 'fun', name: 'Развлечения', emoji: '🎬', custom: false },
{ id: 'debts', name: 'Долги', emoji: '💳', custom: false },
{ id: 'unexpected', name: 'Непредвиденные', emoji: '⚠️', custom: false },
{ id: 'auto', name: 'Авто', emoji: '🚗', custom: false },
{ id: 'shops', name: 'Магазины', emoji: '🛍️', custom: false }
];

let categories = loadCategories();
let expenses = loadExpenses();

function loadCategories() {
const raw = localStorage.getItem('isterichka-categories');
if (raw) return JSON.parse(raw);
localStorage.setItem('isterichka-categories', JSON.stringify(DEFAULT_CATEGORIES));
return [...DEFAULT_CATEGORIES];
}

function saveCategories() {
localStorage.setItem('isterichka-categories', JSON.stringify(categories));
}

function loadExpenses() {
const raw = localStorage.getItem('isterichka-expenses');
return raw ? JSON.parse(raw) : [];
}

function saveExpenses() {
localStorage.setItem('isterichka-expenses', JSON.stringify(expenses));
}

const expenseModal = document.getElementById('expense-modal');
const expenseModalTitle = document.getElementById('expense-modal-title');
const expenseInputAmount = document.getElementById('expense-input-amount');
const expenseInputComment = document.getElementById('expense-input-comment');

let expenseContext = { categoryId: null };

function openExpenseModal(categoryId) {
  expenseModal.dataset.mode = 'expense';
const cat = categories.find(c => c.id === categoryId);
if (!cat) return;

expenseContext = { categoryId };
expenseModalTitle.textContent = cat.emoji + ' ' + cat.name;
expenseInputAmount.value = '';
expenseInputComment.value = '';
expenseModal.classList.add('open');
setTimeout(() => expenseInputAmount.focus(), 100);
}

function closeExpenseModal() {
expenseModal.classList.remove('open');
delete expenseModal.dataset.mode;
}
function saveExpense() {
  const amount = Number(expenseInputAmount.value);
  if (!amount || amount <= 0) {
    showAlert('Введи сумму');
    return;
  }

  // Если открыто из блока "Доходы" — сохраняем как доход
  if (expenseModal.dataset.mode === 'income') {
    saveIncome();
    return;
  }

  // Иначе — трата
  expenses.push({
    id: makeId(),
    categoryId: expenseContext.categoryId,
    amount: amount,
    comment: expenseInputComment.value.trim(),
    date: new Date().toISOString().slice(0, 10),
    createdAt: Date.now()
  });

  saveExpenses();
  closeExpenseModal();
  renderCategories();
  renderReminders();
}

const categoryModal = document.getElementById('category-modal');
const categoryInputName = document.getElementById('category-input-name');

function openCategoryModal() {
categoryInputName.value = '';
categoryModal.classList.add('open');
setTimeout(() => categoryInputName.focus(), 100);
}

function closeCategoryModal() {
categoryModal.classList.remove('open');
}

function saveCategory() {
const name = categoryInputName.value.trim();
if (!name) {
showAlert('Введи название');
return;
}

categories.push({
id: 'custom_' + makeId(),
name: name,
emoji: '📦',
custom: true
});

saveCategories();
closeCategoryModal();
renderCategories();
}

function deleteCategory(id) {
  showConfirm('Удалить эту категорию?', (ok) => {
    if (!ok) return;
    categories = categories.filter(c => c.id !== id);
    saveCategories();
    renderCategories();
    renderReminders();
  });
}

function renderCategories() {
const container = document.getElementById('categories-grid');
if (!container) return;

container.innerHTML = categories.map(cat => `
<button class="category-btn" data-action="spend" data-id="${cat.id}">
<span class="cat-emoji">${cat.emoji}</span>
<span>${escapeHtml(cat.name)}</span>
${cat.custom ? `<span class="cat-remove" data-action="remove-cat" data-id="${cat.id}">✕</span>` : ''}
</button>
`).join('');
}

document.getElementById('btn-add-category').addEventListener('click', openCategoryModal);
document.getElementById('category-modal-close').addEventListener('click', closeCategoryModal);
document.getElementById('category-modal-cancel').addEventListener('click', closeCategoryModal);
document.getElementById('category-modal-save').addEventListener('click', saveCategory);

categoryModal.addEventListener('click', (e) => {
if (e.target === categoryModal) closeCategoryModal();
});

document.getElementById('expense-modal-close').addEventListener('click', closeExpenseModal);
document.getElementById('expense-modal-cancel').addEventListener('click', closeExpenseModal);
document.getElementById('expense-modal-save').addEventListener('click', saveExpense);

expenseModal.addEventListener('click', (e) => {
if (e.target === expenseModal) closeExpenseModal();
});

document.getElementById('categories-grid').addEventListener('click', (e) => {
const btn = e.target.closest('[data-action]');
if (!btn) return;

const id = btn.dataset.id;
const action = btn.dataset.action;

if (action === 'spend') openExpenseModal(id);
if (action === 'remove-cat') {
e.stopPropagation();
deleteCategory(id);
}
});


// ============================================================
// ===== СВОДКА (пока заглушка) =====
// ============================================================

function renderSummary() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // ===== ТРАТЫ =====
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date + 'T00:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

  const byCategory = {};
  monthExpenses.forEach(e => {
    byCategory[e.categoryId] = (byCategory[e.categoryId] || 0) + e.amount;
  });

  // ===== КРУПНЫЕ ТРАТЫ =====
  const monthDebts = debts.filter(d => {
    const dd = new Date(d.date + 'T00:00:00');
    return dd.getMonth() === currentMonth && dd.getFullYear() === currentYear;
  });
  const totalDebts = monthDebts.reduce((sum, d) => sum + d.amount, 0);

  // ===== КРЕДИТЫ (платежи) =====
  let totalCreditPaid = 0;
  credits.forEach(c => {
    (c.payments || []).forEach(p => {
      const pd = new Date(p.date + 'T00:00:00');
      if (pd.getMonth() === currentMonth && pd.getFullYear() === currentYear) {
        totalCreditPaid += p.amount;
      }
    });
  });

  // ===== ДОХОДЫ =====
  const monthIncomes = incomes.filter(i => {
    const d = new Date(i.date + 'T00:00:00');
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalIncomes = monthIncomes.reduce((sum, i) => sum + i.amount, 0);

  // ===== ИТОГИ =====
  const totalAll = totalExpenses + totalDebts + totalCreditPaid;
  const balance = totalIncomes - totalAll;

  // ===== ВЫВОД В СВОДКУ =====
  const totalEl = document.getElementById('summary-total');
  const catsEl = document.getElementById('summary-categories');
  const cardsEl = document.getElementById('summary-cards');

  // Общая цифра = БАЛАНС (доходы − расходы)
  if (totalEl) {
    totalEl.textContent = balance.toLocaleString('ru-RU') + ' ₽';
    totalEl.style.color = balance >= 0 ? '#2e7d32' : '#c0392b';
  }

  // Разбивка по категориям трат
  if (catsEl) {
    const lines = Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([catId, sum]) => {
        const cat = categories.find(c => c.id === catId);
        if (!cat) return '';
        return '<div class="summary-cat-line"><span class="cat-name">' + cat.emoji + ' ' + escapeHtml(cat.name) + '</span><span class="cat-amount">' + sum.toLocaleString('ru-RU') + ' ₽</span></div>';
      })
      .join('');

    catsEl.innerHTML = lines;
  }

  // Доходы / расходы / крупные / кредиты
  if (cardsEl) {
    const lines = [];
    if (totalIncomes > 0) {
      lines.push('💰 Доходы: ' + totalIncomes.toLocaleString('ru-RU') + ' ₽');
    }
    if (totalAll > 0) {
      lines.push('💸 Расходы: ' + totalAll.toLocaleString('ru-RU') + ' ₽');
    }
    if (totalDebts > 0) {
      lines.push('📌 Крупные траты: ' + totalDebts.toLocaleString('ru-RU') + ' ₽');
    }
    if (totalCreditPaid > 0) {
      lines.push('💳 Оплата кредитов: ' + totalCreditPaid.toLocaleString('ru-RU') + ' ₽');
    }
    cardsEl.innerHTML = lines.join('<br>');
  }
}


// ============================================================
// ===== ФИНАНСЫ: ДОХОДЫ =====
// ============================================================
const DEFAULT_INCOME_CATEGORIES = [
  { id: 'salary',    name: 'Зарплата',      emoji: '💼', custom: false },
  { id: 'back-debt', name: 'Вернули долг',  emoji: '🤝', custom: false },
  { id: 'gift',      name: 'Подарок',       emoji: '🎁', custom: false },
  { id: 'side-job',  name: 'Подработка',    emoji: '💻', custom: false },
  { id: 'other-inc', name: 'Другое',        emoji: '📈', custom: false }
];

let incomeCategories = loadIncomeCategories();
let incomes = loadIncomes();

function loadIncomeCategories() {
  const raw = localStorage.getItem('isterichka-income-categories');
  if (raw) return JSON.parse(raw);
  localStorage.setItem('isterichka-income-categories', JSON.stringify(DEFAULT_INCOME_CATEGORIES));
  return [...DEFAULT_INCOME_CATEGORIES];
}

function saveIncomeCategories() {
  localStorage.setItem('isterichka-income-categories', JSON.stringify(incomeCategories));
}

function loadIncomes() {
  const raw = localStorage.getItem('isterichka-incomes');
  return raw ? JSON.parse(raw) : [];
}

function saveIncomes() {
  localStorage.setItem('isterichka-incomes', JSON.stringify(incomes));
}

// Модальное окно дохода (переиспользуем модалку траты)
// Но с другим контекстом — см. ниже через флаг
let incomeContext = { categoryId: null };

function openIncomeModal(categoryId) {
  const cat = incomeCategories.find(c => c.id === categoryId);
  if (!cat) return;

  incomeContext = { categoryId };
  expenseModalTitle.textContent = '💰 ' + cat.emoji + ' ' + cat.name;
  expenseInputAmount.value = '';
  expenseInputComment.value = '';
  expenseModal.classList.add('open');
  expenseModal.dataset.mode = 'income';
  setTimeout(() => expenseInputAmount.focus(), 100);
}

function saveIncome() {
  const amount = Number(expenseInputAmount.value);
  if (!amount || amount <= 0) {
    showAlert('Введи сумму');
    return;
  }

  incomes.push({
    id: makeId(),
    categoryId: incomeContext.categoryId,
    amount: amount,
    comment: expenseInputComment.value.trim(),
    date: new Date().toISOString().slice(0, 10),
    createdAt: Date.now()
  });

  saveIncomes();
  closeExpenseModal();
  renderIncomeCategories();
  renderReminders();
}

function renderIncomeCategories() {
  const container = document.getElementById('incomes-grid');
  if (!container) return;

  container.innerHTML = incomeCategories.map(cat => `
    <button class="category-btn category-btn-income" data-action="earn" data-id="${cat.id}">
      <span class="cat-emoji">${cat.emoji}</span>
      <span>${escapeHtml(cat.name)}</span>
      ${cat.custom ? `<span class="cat-remove" data-action="remove-income-cat" data-id="${cat.id}">✕</span>` : ''}
    </button>
  `).join('');
}

function deleteIncomeCategory(id) {
  showConfirm('Удалить эту категорию?', (ok) => {
    if (!ok) return;
    incomeCategories = incomeCategories.filter(c => c.id !== id);
    saveIncomeCategories();
    renderIncomeCategories();
    renderReminders();
  });
}

document.getElementById('btn-add-income-category').addEventListener('click', () => {
  const name = prompt('Название категории дохода?');
  if (!name) return;
  incomeCategories.push({
    id: 'custom_' + makeId(),
    name: name.trim(),
    emoji: '📦',
    custom: true
  });
  saveIncomeCategories();
  renderIncomeCategories();
});

document.getElementById('incomes-grid').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const id = btn.dataset.id;
  const action = btn.dataset.action;

  if (action === 'earn') openIncomeModal(id);
  if (action === 'remove-income-cat') {
    e.stopPropagation();
    deleteIncomeCategory(id);
  }
});
// ============================================================
// ===== ССЫЛКИ =====
// ============================================================
const LINK_CATEGORIES = {
  work:     { emoji: '💼', name: 'Работа' },
  study:    { emoji: '📚', name: 'Учёба' },
  clients:  { emoji: '👥', name: 'У клиентов' },
  personal: { emoji: '🌸', name: 'Личное' }
};

let links = loadLinks();

function loadLinks() {
  const raw = localStorage.getItem('isterichka-links');
  return raw ? JSON.parse(raw) : [];
}

function saveLinks() {
  localStorage.setItem('isterichka-links', JSON.stringify(links));
}

// --- Модальное окно ссылки ---
const linkModal = document.getElementById('link-modal');
const linkInputName = document.getElementById('link-input-name');
const linkInputUrl = document.getElementById('link-input-url');
const linkInputDesc = document.getElementById('link-input-desc');
const linkInputCategory = document.getElementById('link-input-category');

function openLinkModal() {
  linkInputName.value = '';
  linkInputUrl.value = '';
  linkInputDesc.value = '';
  linkInputCategory.value = 'work';
  linkModal.classList.add('open');
  setTimeout(() => linkInputName.focus(), 100);
}

function closeLinkModal() {
  linkModal.classList.remove('open');
}

function saveLink() {
  const name = linkInputName.value.trim();
  let url = linkInputUrl.value.trim();
  const description = linkInputDesc.value.trim();
  const category = linkInputCategory.value;

  if (!name) { showAlert('Введи название'); return; }
  if (!url) { showAlert('Введи ссылку'); return; }

  // Если нет http:// или https:// — добавляем https://
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  links.push({
    id: makeId(),
    name: name,
    url: url,
    description: description,
    category: category,
    createdAt: Date.now()
  });

  saveLinks();
  closeLinkModal();
  renderLinks();
}

function deleteLink(id) {
  showConfirm('Удалить эту ссылку?', (ok) => {
    if (!ok) return;
    links = links.filter(l => l.id !== id);
    saveLinks();
    renderLinks();
  });
}

// --- Отображение ссылок ---
function renderLinks() {
  const container = document.getElementById('links-list');
  if (!container) return;

  if (links.length === 0) {
    container.innerHTML = `<div class="links-empty">Пока нет ссылок 🔗
Н
 «+ новая ссылка» выше</div>`;
    return;
  }

  // Группируем по категориям
  const grouped = {};
  Object.keys(LINK_CATEGORIES).forEach(key => {
    grouped[key] = [];
  });

  links.forEach(link => {
    if (grouped[link.category]) {
      grouped[link.category].push(link);
    }
  });

  // Строим HTML
  let html = '';

  Object.entries(LINK_CATEGORIES).forEach(([catKey, catInfo]) => {
    const catLinks = grouped[catKey];
    if (catLinks.length === 0) return;

    html += `<div class="links-category">
      <div class="links-category-title">${catInfo.emoji} ${catInfo.name}</div>
      ${catLinks.map(link => `
        <div class="link-card" data-id="${link.id}">
          <div class="link-card-info">
            <div class="link-card-name">${escapeHtml(link.name)}</div>
            ${link.description ? `<div class="link-card-desc">${escapeHtml(link.description)}</div>` : ''}
          </div>
          <div class="link-card-actions">
            <a class="link-open-btn" href="${escapeHtml(link.url)}" target="_blank" rel="noopener">Открыть</a>
            <button class="credit-delete-btn" data-action="delete" data-id="${link.id}" aria-label="Удалить">✕</button>
          </div>
        </div>
      `).join('')}
    </div>`;
  });

  container.innerHTML = html;
}

// --- Обработчики ссылок ---
document.getElementById('btn-add-link').addEventListener('click', openLinkModal);
document.getElementById('link-modal-close').addEventListener('click', closeLinkModal);
document.getElementById('link-modal-cancel').addEventListener('click', closeLinkModal);
document.getElementById('link-modal-save').addEventListener('click', saveLink);

linkModal.addEventListener('click', (e) => {
  if (e.target === linkModal) closeLinkModal();
});

document.getElementById('links-list').addEventListener('click',(e) => {
  const btn = e.target.closest('[data-action="delete"]');
  if (!btn) return;
  deleteLink(btn.dataset.id);
});
// ============================================================
// ===== УНИВЕРСАЛЬНЫЕ МОДАЛКИ =====
// ============================================================
const confirmModal = document.getElementById('confirm-modal');
const confirmTitle = document.getElementById('confirm-title');
const confirmText = document.getElementById('confirm-text');

let confirmCallback = null;

function showConfirm(text, callback, title) {
  confirmTitle.textContent = title || 'Подтверждение';
  confirmText.textContent = text;
  confirmCallback = callback;
  confirmModal.classList.add('open');
}

function closeConfirm(result) {
  confirmModal.classList.remove('open');
  if (confirmCallback) {
    confirmCallback(result);
    confirmCallback = null;
  }
}

document.getElementById('confirm-cancel').addEventListener('click', () => closeConfirm(false));
document.getElementById('confirm-ok').addEventListener('click', () => closeConfirm(true));
confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) closeConfirm(false);
});

// Alert
const alertModal = document.getElementById('alert-modal');
const alertTitle = document.getElementById('alert-title');
const alertText = document.getElementById('alert-text');

function showAlert(text, title) {
  alertTitle.textContent = title || 'Уведомление';
  alertText.textContent = text;
  alertModal.classList.add('open');
}

function closeAlert() {
  alertModal.classList.remove('open');
}

document.getElementById('alert-ok').addEventListener('click', closeAlert);
alertModal.addEventListener('click', (e) => {
  if (e.target === alertModal) closeAlert();
});
// ============================================================
// ===== СПИСКИ ПОКУПОК =====
// ============================================================
let shops = loadShops();

function loadShops() {
const raw = localStorage.getItem('isterichka-shops');
return raw ? JSON.parse(raw) : [];
}

function saveShops() {
localStorage.setItem('isterichka-shops', JSON.stringify(shops));
}

// --- Модальное окно ---
const shopModal = document.getElementById('shop-modal');
const shopModalTitle = document.getElementById('shop-modal-title');
const shopInputName = document.getElementById('shop-input-name');
const shopInputPrice = document.getElementById('shop-input-price');

let shopContext = { type: 'basic' };

function openShopModal(type) {
shopContext = { type: type };
shopModalTitle.textContent = type === 'basic' ? '🛒 Новая покупка' : '🎁 Большая покупка';
shopInputName.value = '';
shopInputPrice.value = '';
shopModal.classList.add('open');
setTimeout(() => shopInputName.focus(), 100);
}

function closeShopModal() {
shopModal.classList.remove('open');
}

function saveShop() {
const name = shopInputName.value.trim();
const price = Number(shopInputPrice.value) || 0;

if (!name) {
showAlert('Введи название');
return;
}

shops.push({
id: makeId(),
name: name,
price: price,
type: shopContext.type,
done: false,
createdAt: Date.now()
});

saveShops();
closeShopModal();
renderShops();
}

function toggleShop(id) {
const shop = shops.find(s => s.id === id);
if (!shop) return;
shop.done = !shop.done;
saveShops();
renderShops();
}

function deleteShop(id) {
showConfirm('Удалить эту покупку?', (ok) => {
if (!ok) return;
shops = shops.filter(s => s.id !== id);
saveShops();
renderShops();
});
}

// --- Отображение ---
function renderShops() {
const basicList = document.getElementById('basic-shops-list');
const bigList = document.getElementById('big-shops-list');
if (!basicList || !bigList) return;

const basic = shops.filter(s => s.type === 'basic');
const big = shops.filter(s => s.type === 'big');

basicList.innerHTML = renderShopListHTML(basic, 'basic');
bigList.innerHTML = renderShopListHTML(big, 'big');
}

function renderShopListHTML(list, type) {
if (list.length === 0) {
return `<div class="shops-empty">Пока пусто</div>`;
}

// Сортируем: не купленные сверху
const sorted = [...list].sort((a, b) => {
if (a.done !== b.done) return a.done ? 1 : -1;
return b.createdAt - a.createdAt;
});

const itemsHtml = sorted.map(shop => {
const doneClass = shop.done ? 'shop-done' : '';
const priceText = shop.price > 0 ? shop.price.toLocaleString('ru-RU') + ' ₽' : '';
return '<div class="shop-card shop-' + type + ' ' + doneClass + '" data-id="' + shop.id + '">' +
'<button class="shop-check" data-action="toggle-shop" data-id="' + shop.id + '" aria-label="Куплено">✓</button>' +
'<div class="shop-info">' +
'<div class="shop-name">' + escapeHtml(shop.name) + '</div>' +
(priceText ? '<div class="shop-price">' + priceText + '</div>' : '') +
'</div>' +
'<button class="credit-delete-btn" data-action="delete-shop" data-id="' + shop.id + '" aria-label="Удалить">✕</button>' +
'</div>';
}).join('');

// Итоговая сумма (не купленных)
const activeItems = list.filter(s => !s.done);
const total = activeItems.reduce((sum, s) => sum + s.price, 0);
const totalHtml = total > 0
? '<div class="shops-total">Итого: ' + total.toLocaleString('ru-RU') + ' ₽</div>'
: '';

return itemsHtml + totalHtml;
}

// --- Обработчики ---
document.getElementById('btn-add-basic-shop').addEventListener('click', () => openShopModal('basic'));
document.getElementById('btn-add-big-shop').addEventListener('click', () => openShopModal('big'));
document.getElementById('shop-modal-close').addEventListener('click', closeShopModal);
document.getElementById('shop-modal-cancel').addEventListener('click', closeShopModal);
document.getElementById('shop-modal-save').addEventListener('click', saveShop);

shopModal.addEventListener('click', (e) => {
if (e.target === shopModal) closeShopModal();
});

function handleShopClick(e) {
const btn = e.target.closest('[data-action]');
if (!btn) return;
const id = btn.dataset.id;
const action = btn.dataset.action;

if (action === 'toggle-shop') toggleShop(id);
if (action === 'delete-shop') deleteShop(id);
}

document.getElementById('basic-shops-list').addEventListener('click', handleShopClick);
document.getElementById('big-shops-list').addEventListener('click', handleShopClick);
// ============================================================
// ===== ПЛАНЫ НА БУДУЩЕЕ =====
// ============================================================
let plans = loadPlans();

function loadPlans() {
const raw = localStorage.getItem('isterichka-plans');
return raw ? JSON.parse(raw) : [];
}

function savePlans() {
localStorage.setItem('isterichka-plans', JSON.stringify(plans));
}

// --- Модальное окно плана ---
const planModal = document.getElementById('plan-modal');
const planInputName = document.getElementById('plan-input-name');
const planInputPeriodType = document.getElementById('plan-input-period-type');
const planInputDate = document.getElementById('plan-input-date');
const planDateHint = document.getElementById('plan-date-hint');

function openPlanModal() {
planInputName.value = '';
planInputPeriodType.value = 'month';
planInputDate.value = '';
updatePlanDateHint();
planModal.classList.add('open');
setTimeout(() => planInputName.focus(), 100);
}

function closePlanModal() {
planModal.classList.remove('open');
}

function updatePlanDateHint() {
const type = planInputPeriodType.value;
if (type === 'week') {
planDateHint.textContent = 'Выбери любую дату из нужной недели';
} else if (type === 'month') {
planDateHint.textContent = 'Выбери любую дату из нужного месяца';
} else {
planDateHint.textContent = 'Выбери любую дату из нужного года';
}
}

planInputPeriodType.addEventListener('change', updatePlanDateHint);

function savePlan() {
const name = planInputName.value.trim();
const periodType = planInputPeriodType.value;
const dateStr = planInputDate.value;

if (!name) {
showAlert('Введи название плана');
return;
}
if (!dateStr) {
showAlert('Выбери дату');
return;
}

plans.push({
id: makeId(),
name: name,
periodType: periodType, // 'week' | 'month' | 'year'
date: dateStr, // YYYY-MM-DD
tasks: [], // задачи внутри плана
createdAt: Date.now()
});

savePlans();
closePlanModal();
renderPlans();
}

function deletePlan(id) {
showConfirm('Удалить этот план?', (ok) => {
if (!ok) return;
plans = plans.filter(p => p.id !== id);
savePlans();
renderPlans();
});
}

// --- Получение ключа и названия периода ---
function getPlanPeriodKey(plan) {
const d = new Date(plan.date + 'T00:00:00');
const y = d.getFullYear();
const m = d.getMonth();
const day = d.getDate();

if (plan.periodType === 'year') {
return 'year-' + y;
}

if (plan.periodType === 'month') {
return 'month-' + y + '-' + String(m + 1).padStart(2, '0');
}

// неделя — ISO
const monday = getMondayOf(d);
return 'week-' + dateToKey(monday);
}

function getPlanPeriodLabel(plan) {
const d = new Date(plan.date + 'T00:00:00');
const monthsFull = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const y = d.getFullYear();

if (plan.periodType === 'year') {
return '📅 ' + y + ' год';
}

if (plan.periodType === 'month') {
return '📅 ' + monthsFull[d.getMonth()] + ' ' + y;
}

// неделя
const monday = getMondayOf(d);
const sunday = new Date(monday);
sunday.setDate(sunday.getDate() + 6);
const monthsShort = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн',
'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
return '📅 ' + monday.getDate() + ' ' + monthsShort[monday.getMonth()] +
' — ' + sunday.getDate() + ' ' + monthsShort[sunday.getMonth()];
}

// --- Отрисовка ---
function renderPlans() {
const container = document.getElementById('plans-list');
if (!container) return;

if (plans.length === 0) {
container.innerHTML = '<div class="plans-empty">Пока нет планов 📋<br>Нажми «+ новый план» выше</div>';
return;
}

// Группируем по периоду
const groups = {};
plans.forEach(plan => {
const key = getPlanPeriodKey(plan);
if (!groups[key]) {
groups[key] = {
label: getPlanPeriodLabel(plan),
sortDate: plan.date,
plans: []
};
}
groups[key].plans.push(plan);
});

// Сортируем группы по дате (ближайшие сверху)
const sortedGroups = Object.values(groups).sort((a, b) =>
a.sortDate.localeCompare(b.sortDate)
);

let html = '';
sortedGroups.forEach(group => {
html += '<div class="plans-group">';
html += '<div class="plans-group-title">' + group.label + '</div>';
group.plans.forEach(plan => {
html += renderPlanCardHTML(plan);
});
html += '</div>';
});

container.innerHTML = html;
}

function renderPlanCardHTML(plan) {
const total = plan.tasks.length;
const done = plan.tasks.filter(t => t.done).length;
const progressText = total > 0 ? done + '/' + total : 'пусто';

const tasksHtml = plan.tasks.map(task => {
const doneClass = task.done ? 'plan-task-done' : '';
const priceHtml = task.price > 0
  ? '<span class="plan-task-price">' + task.price.toLocaleString('ru-RU') + ' ₽</span>'
  : '';
const typeIcon = task.type === 'money' ? '💰 ' : '';
return '<div class="plan-task ' + doneClass + '" data-task-id="' + task.id + '">' +
'<button class="plan-task-check" data-action="toggle-plan-task" data-plan-id="' + plan.id + '" data-task-id="' + task.id + '">✓</button>' +
'<span class="plan-task-text">' + typeIcon + escapeHtml(task.text) + '</span>' +
priceHtml +
'<button class="plan-task-delete" data-action="delete-plan-task" data-plan-id="' + plan.id + '" data-task-id="' + task.id + '">✕</button>' +
'</div>';
}).join('');

return '<div class="plan-card" data-plan-id="' + plan.id + '">' +
'<div class="plan-header">' +
'<div class="plan-name">' + escapeHtml(plan.name) + '</div>' +
'<div class="plan-progress">' + progressText + '</div>' +
'<button class="plan-delete" data-action="delete-plan" data-id="' + plan.id + '" aria-label="Удалить">✕</button>' +
'</div>' +
'<div class="plan-tasks">' + tasksHtml + '</div>' +
'<button class="plan-add-task" data-action="add-plan-task" data-plan-id="' + plan.id + '">+ добавить задачу</button>' +
'</div>';
}
// ===== МОДАЛКА ЗАДАЧИ ПЛАНА =====
const planTaskModal = document.getElementById('plan-task-modal');
const planTaskInputText = document.getElementById('plan-task-input-text');
const planTaskInputType = document.getElementById('plan-task-input-type');
const planTaskInputPrice = document.getElementById('plan-task-input-price');
const planTaskPriceField = document.getElementById('plan-task-price-field');

let planTaskContext = { planId: null };

function openPlanTaskModal(planId) {
planTaskContext = { planId: planId };
planTaskInputText.value = '';
planTaskInputType.value = 'task';
planTaskInputPrice.value = '';
planTaskPriceField.style.display = 'none';
planTaskModal.classList.add('open');
setTimeout(() => planTaskInputText.focus(), 100);
}

function closePlanTaskModal() {
planTaskModal.classList.remove('open');
}

planTaskInputType.addEventListener('change', () => {
planTaskPriceField.style.display = planTaskInputType.value === 'money' ? 'block' : 'none';
});

function savePlanTask() {
const plan = plans.find(p => p.id === planTaskContext.planId);
if (!plan) return;

const text = planTaskInputText.value.trim();
const type = planTaskInputType.value;
const price = Number(planTaskInputPrice.value) || 0;

if (!text) { showAlert('Введи, что нужно сделать'); return; }
if (type === 'money' && price <= 0) { showAlert('Введи сумму'); return; }

// Создаём задачу плана
const planTask = {
id: makeId(),
text: text,
done: false,
type: type,
price: price,
linkedId: null
};

// Синхронизация
if (type === 'money') {
const debtId = makeId();
debts.push({
id: debtId,
text: text,
amount: price,
date: plan.date,
fromPlan: plan.name,
createdAt: Date.now()
});
saveDebts();
planTask.linkedId = debtId;
} else {
const taskId = makeId();
tasks.push({
id: taskId,
text: text,
deadline: plan.date,
done: false,
fromPlan: plan.name,
createdAt: Date.now()
});
saveTasks();
planTask.linkedId = taskId;
}

plan.tasks.push(planTask);
savePlans();

closePlanTaskModal();
renderPlans();
renderDebts();
renderDebtsInTasks();
renderTasks();
renderReminders();
}

// ===== УПРАВЛЕНИЕ ЗАДАЧАМИ ПЛАНА =====
function togglePlanTask(planId, taskId) {
const plan = plans.find(p => p.id === planId);
if (!plan) return;
const task = plan.tasks.find(t => t.id === taskId);
if (!task) return;

task.done = !task.done;

// Синхронизация
if (task.linkedId) {
if (task.type === 'money') {
// Деньги отданы — удаляем долг
if (task.done) {
debts = debts.filter(d => d.id !== task.linkedId);
saveDebts();
task.linkedId = null;
}
} else {
// Дело — обновляем done в задачах
const linkedTask = tasks.find(t => t.id === task.linkedId);
if (linkedTask) {
linkedTask.done = task.done;
saveTasks();
}
}
}

savePlans();
renderPlans();
renderDebts();
renderDebtsInTasks();
renderTasks();
renderReminders();
}

function deletePlanTask(planId, taskId) {
const plan = plans.find(p => p.id === planId);
if (!plan) return;
const task = plan.tasks.find(t => t.id === taskId);
if (!task) return;

showConfirm('Удалить эту задачу?', (ok) => {
if (!ok) return;

// Удаляем связанную запись
if (task.linkedId) {
if (task.type === 'money') {
debts = debts.filter(d => d.id !== task.linkedId);
saveDebts();
} else {
tasks = tasks.filter(t => t.id !== task.linkedId);
saveTasks();
}
}

plan.tasks = plan.tasks.filter(t => t.id !== taskId);
savePlans();
renderPlans();
renderDebts();
renderDebtsInTasks();
renderTasks();
renderReminders();
});
}

// ===== ОБРАБОТЧИКИ =====
document.getElementById('plan-task-modal-close').addEventListener('click', closePlanTaskModal);
document.getElementById('plan-task-modal-cancel').addEventListener('click', closePlanTaskModal);
document.getElementById('plan-task-modal-save').addEventListener('click', savePlanTask);

planTaskModal.addEventListener('click', (e) => {
if (e.target === planTaskModal) closePlanTaskModal();
});
// --- Обработчики ---
document.getElementById('btn-add-plan').addEventListener('click', openPlanModal);
document.getElementById('plan-modal-close').addEventListener('click', closePlanModal);
document.getElementById('plan-modal-cancel').addEventListener('click', closePlanModal);
document.getElementById('plan-modal-save').addEventListener('click', savePlan);

planModal.addEventListener('click', (e) => {
if (e.target === planModal) closePlanModal();
});

document.getElementById('plans-list').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const action = btn.dataset.action;

  if (action === 'delete-plan') {
    deletePlan(btn.dataset.id);
  }
  if (action === 'add-plan-task') {
    openPlanTaskModal(btn.dataset.planId);
  }
  if (action === 'toggle-plan-task') {
    togglePlanTask(btn.dataset.planId, btn.dataset.taskId);
  }
  if (action === 'delete-plan-task') {
    deletePlanTask(btn.dataset.planId, btn.dataset.taskId);
  }
});
// ============================================================
// ===== НАПОМИНАНИЯ ПРИ ЗАХОДЕ =====
// ============================================================
function renderReminders() {
  const banner = document.getElementById('reminder-banner');
  if (!banner) return;

  const todayKey = dateToKey(new Date());
  const todayDate = new Date();
  const todayDay = todayDate.getDate();

  // 1. Просроченные задачи
  const overdueTasks = tasks.filter(t => getTaskStatus(t) === 'overdue');

  // 2. Долги на сегодня
  const debtsToday = debts.filter(d => d.date === todayKey);

  // 3. Кредитки с платежом сегодня
  const creditsToday = credits.filter(c => c.day === todayDay);

  // 4. Записи в расписании на сегодня
  const recordsToday = records.filter(r => r.date === todayKey);

  const lines = [];

  if (overdueTasks.length > 0) {
    lines.push({
      cls: 'reminder-overdue',
      text: '⚠️ Просрочено: ' + overdueTasks.length + ' ' + pluralize(overdueTasks.length, 'задача', 'задачи', 'задач'),
      screen: 'tasks'
    });
  }

  if (debtsToday.length > 0) {
    lines.push({
      cls: 'reminder-debt',
      text: '💰 Сегодня отдать: ' + debtsToday.length + ' ' + pluralize(debtsToday.length, 'долг', 'долга', 'долгов'),
      screen: 'finance'
    });
  }

  if (creditsToday.length > 0) {
    lines.push({
      cls: 'reminder-credit',
      text: '💳 Сегодня платёж: ' + creditsToday.map(c => c.name).join(', '),
      screen: 'finance'
    });
  }

  if (recordsToday.length > 0) {
    lines.push({
      cls: 'reminder-today',
      text: '📅 Сегодня: ' + recordsToday.length + ' ' + pluralize(recordsToday.length, 'запись', 'записи', 'записей'),
      screen: 'schedule'
    });
  }

  if (lines.length === 0) {
    banner.style.display = 'none';
    return;
  }

  banner.innerHTML = lines.map(l =>
    '<div class="reminder-line ' + l.cls + '" data-screen="' + l.screen + '">' + l.text + '</div>'
  ).join('');

  banner.style.display = 'flex';
}

// Склонение слов (1 задача, 2 задачи, 5 задач)
function pluralize(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

// Клик по строке баннера — переход в раздел
document.getElementById('reminder-banner').addEventListener('click', (e) => {
  const line = e.target.closest('[data-screen]');
  if (!line) return;

  const target = line.dataset.screen;

  // Активируем нужную кнопку навигации
  navButtons.forEach(b => {
    if (b.dataset.screen === target) {
      b.click();
    }
  });
});
// ============================================================
// ===== МИНИ-КАЛЕНДАРЬ =====
// ============================================================
const calendarModal = document.getElementById('calendar-modal');
const calendarGrid = document.getElementById('calendar-grid');
const calMonthLabel = document.getElementById('cal-month-label');

// Текущий отображаемый месяц в календаре
let calendarDate = new Date();

function openCalendar() {
  calendarDate = new Date(currentMonday);
  renderCalendar();
  calendarModal.classList.add('open');
}

function closeCalendar() {
  calendarModal.classList.remove('open');
}

function renderCalendar() {
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();

  // Заголовок
  calMonthLabel.textContent = monthNames[month] + ' ' + year;

  // Первое число месяца и его день недели
  const firstDay = new Date(year, month, 1);
  let startWeekday = firstDay.getDay(); // 0=вс, 1=пн, ...
  // Приводим к 0=пн, ... 6=вс
  startWeekday = (startWeekday === 0) ? 6 : startWeekday - 1;

  // Количество дней в месяце
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Сегодня для подсветки
  const todayKey = dateToKey(new Date());

  // Собираем HTML
  let html = '';

  // Пустые ячейки
  for (let i = 0; i < startWeekday; i++) {
    html += '<div class="cal-day cal-empty"></div>';
  }

  // Дни месяца
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const key = dateToKey(d);
    const weekday = d.getDay(); // 0=вс

    // Есть ли записи или долги в этот день
    const hasRecords = records.some(r => r.date === key);
    const hasDebts = debts.some(dd => dd.date === key);
    const hasSomething = hasRecords || hasDebts;

    // Классы
    let classes = 'cal-day';
    if (key === todayKey) classes += ' cal-today';
    if (hasSomething) classes += ' cal-has-records';
    if (weekday === 0 || weekday === 6) classes += ' cal-weekend';

    html += '<button class="' + classes + '" data-date="' + key + '">' + day + '</button>';
  }

  calendarGrid.innerHTML = html;
}

// --- Обработчики ---
document.getElementById('btn-calendar').addEventListener('click', openCalendar);
document.getElementById('calendar-modal-close').addEventListener('click', closeCalendar);

calendarModal.addEventListener('click', (e) => {
  if (e.target === calendarModal) closeCalendar();
});

document.getElementById('cal-prev').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() - 1);
  renderCalendar();
});

document.getElementById('cal-next').addEventListener('click', () => {
  calendarDate.setMonth(calendarDate.getMonth() + 1);
  renderCalendar();
});

calendarGrid.addEventListener('click', (e) => {
  const day = e.target.closest('.cal-day');
  if (!day || !day.dataset.date) return;

  const selectedDate = new Date(day.dataset.date + 'T00:00:00');
  currentMonday = getMondayOf(selectedDate);
  renderWeekHeader();
  renderDays('animate-from-right');
  closeCalendar();
})
// ============================================================
// ===== СТАРТ =====
// ============================================================
renderWeekHeader();
renderDays();
renderTasks();
renderCredits();
renderDebts();
renderCategories();
renderIncomeCategories();
renderReminders();
renderLinks();
renderShops();
renderPlans();
renderReminders();
// ===== SERVICE WORKER (PWA) =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js')
      .then(() => console.log('PWA: Service Worker активен'))
      .catch((err) => console.log('PWA: ошибка регистрации', err));
  });
}
console.log('Жизнь истерички — новая версия запущена');
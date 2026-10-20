// ==========================================
// 1. КОНФІГУРАЦІЯ ТЕЛЕГРАМ ТА БРОНЮВАННЯ
// ==========================================
const TELEGRAM_CONFIG = {
  token: '', // наприклад: '123456789:AAFxxx...'
  chatId: '' // наприклад: '123456789' або ID групи
};

// Відкриття та закриття модального вікна
function openBookingModal(roomName = '') {
  const modal = document.getElementById('bookingModal');
  if (modal) {
    if (roomName) {
      const select = modal.querySelector('select[name="room"]');
      if (select) select.value = roomName;
    }
    modal.style.display = 'flex';
  }
}

function closeBookingModal() {
  const modal = document.getElementById('bookingModal');
  if (modal) modal.style.display = 'none';
}

window.onclick = function (e) {
  const modal = document.getElementById('bookingModal');
  if (e.target === modal) closeBookingModal();
};

// Відправка замовлення в Telegram
async function submitBooking(event) {
  event.preventDefault();
  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const data = {
    name: form.name ? form.name.value : '',
    phone: form.phone ? form.phone.value : '',
    room: form.room ? form.room.value : 'Не вказано',
    checkin: form.checkin ? form.checkin.value : 'Не обрано',
    checkout: form.checkout ? form.checkout.value : 'Не обрано',
    guests: form.guests ? form.guests.value : 'Не обрано',
    breakfast: form.breakfast && form.breakfast.checked ? 'Так (+200 грн/особа)' : 'Ні'
  };

  const message = `
🛎 <b>НОВА ЗАЯВКА НА БРОНЮВАННЯ</b>
🏨 <b>Готель:</b> Guculka Apartments
🚪 <b>Номер:</b> ${data.room}
👤 <b>Гість:</b> ${data.name}
📞 <b>Телефон:</b> ${data.phone}
📅 <b>Заїзд:</b> ${data.checkin}
📅 <b>Виїзд:</b> ${data.checkout}
👥 <b>Гостей:</b> ${data.guests}
🍳 <b>Сніданки:</b> ${data.breakfast}
  `.trim();

  submitBtn.disabled = true;
  submitBtn.innerText = 'Надсилаємо...';

  if (TELEGRAM_CONFIG.token && TELEGRAM_CONFIG.chatId) {
    try {
      const url = `https://api.telegram.org/bot${TELEGRAM_CONFIG.token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: TELEGRAM_CONFIG.chatId,
          text: message,
          parse_mode: 'HTML'
        })
      });

      if (response.ok) {
        alert('Дякуємо! Ваша заявка успішно надіслана. Менеджер зв\'яжеться з вами найближчим часом.');
        form.reset();
        closeBookingModal();
      } else {
        throw new Error('Помилка відправки');
      }
    } catch (err) {
      alert('Заявку збережено! Менеджер отримає сповіщення.');
      form.reset();
      closeBookingModal();
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerText = 'Забронювати відпочинок';
    }
  } else {
    alert(`Дякуємо, ${data.name}! Ваша заявка на номер «${data.room}» прийнята. Адміністратор зателефонує вам на номер ${data.phone}.`);
    form.reset();
    closeBookingModal();
    submitBtn.disabled = false;
    submitBtn.innerText = 'Забронювати відпочинок';
  }
}

// ==========================================
// 2. БЕЗКІНЕЧНИЙ СЛАЙДЕР З ПІДСВІЧУВАННЯМ
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  initInfiniteRoomsSlider();
});

function initInfiniteRoomsSlider() {
  const track = document.getElementById('roomsTrack');
  const dotsContainer = document.getElementById('sliderDots');

  if (!track || !dotsContainer) return;

  // Отримуємо початкові картки номерів
  const originalCards = Array.from(track.querySelectorAll('.room-card'));
  const total = originalCards.length;
  if (total === 0) return;

  // Присвоюємо порядковий індекс кожній картці (0..total-1)
  originalCards.forEach((card, idx) => {
    card.setAttribute('data-index', idx);
  });

  // Клонуємо картки для створення безкінечного кола
  originalCards.forEach(card => {
    track.appendChild(card.cloneNode(true));
  });
  originalCards.slice().reverse().forEach(card => {
    track.insertBefore(card.cloneNode(true), track.firstChild);
  });

  // Генерація крапок знизу
  dotsContainer.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('div');
    dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
    dot.setAttribute('data-dot-index', i);
    dot.addEventListener('click', () => {
      scrollToIndex(i);
    });
    dotsContainer.appendChild(dot);
  }

  const getStep = () => {
    const first = track.querySelector('.room-card');
    return first ? first.offsetWidth + 26 : 366;
  };

  // Перемикання активної видовженої смужки-крапки
  function setActiveDot(index) {
    const dots = dotsContainer.querySelectorAll('.slider-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === Number(index));
    });
  }

  // Підсвічування картки та синхронізація нижньої крапки
  function highlightCard(card) {
    const all = track.querySelectorAll('.room-card');
    all.forEach(c => c.classList.remove('active-room'));
    card.classList.add('active-room');

    const idx = card.getAttribute('data-index');
    if (idx !== null) {
      setActiveDot(idx);
    }
  }

  // Плавний перехід до конкретного номера за кліком на крапку
  function scrollToIndex(index) {
    const all = Array.from(track.querySelectorAll('.room-card'));
    const target = all.slice(total, total * 2).find(c => c.getAttribute('data-index') == index);
    if (target) {
      const trackCenter = track.offsetWidth / 2;
      const cardCenter = target.offsetLeft + target.offsetWidth / 2;
      track.scrollTo({
        left: cardCenter - trackCenter,
        behavior: 'smooth'
      });
      highlightCard(target);
    }
  }

  // ПІДСВІЧУВАННЯ ПРИ НАВЕДЕННІ КУРСОРА (HOVER)
  const allCards = track.querySelectorAll('.room-card');
  allCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      highlightCard(card);
    });
  });

  // Стартова позиція (перший номер по центру)
  setTimeout(() => {
    const all = Array.from(track.querySelectorAll('.room-card'));
    const startCard = all.slice(total, total * 2)[0];
    if (startCard) {
      const trackCenter = track.offsetWidth / 2;
      const cardCenter = startCard.offsetLeft + startCard.offsetWidth / 2;
      track.scrollLeft = cardCenter - trackCenter;
      highlightCard(startCard);
    }
  }, 100);

  // СИНХРОНІЗАЦІЯ ПРИ СКРОЛІ
  let isResetting = false;
  track.addEventListener('scroll', () => {
    const step = getStep();
    const currentScroll = track.scrollLeft;
    const baseWidth = step * total;

    // Визначаємо, яка картка найближча до центру екрана
    const trackRect = track.getBoundingClientRect();
    const trackCenter = trackRect.left + trackRect.width / 2;
    const currentCards = Array.from(track.querySelectorAll('.room-card'));
    let closest = null;
    let minDiff = Infinity;

    currentCards.forEach(card => {
      const rect = card.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      const diff = Math.abs(trackCenter - center);
      if (diff < minDiff) {
        minDiff = diff;
        closest = card;
      }
    });

    if (closest) {
      highlightCard(closest);
    }

    // Безшовний стрибок безкінечного кола
    if (!isResetting) {
      if (currentScroll <= 15) {
        isResetting = true;
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = currentScroll + baseWidth;
        track.style.scrollBehavior = 'smooth';
        setTimeout(() => { isResetting = false; }, 60);
      } else if (currentScroll >= baseWidth * 2) {
        isResetting = true;
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = currentScroll - baseWidth;
        track.style.scrollBehavior = 'smooth';
        setTimeout(() => { isResetting = false; }, 60);
      }
    }
  });

  // Кнопки-стрілки (назад / вперед)
  window.slideRooms = function (direction) {
    const step = getStep();
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  // Перетягування мишкою (Drag-and-drop)
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
    track.style.scrollBehavior = 'auto';
  });

  window.addEventListener('mouseup', () => {
    if (isDown) {
      isDown = false;
      track.style.scrollBehavior = 'smooth';
    }
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.3;
    track.scrollLeft = scrollLeft - walk;
  });
}
// Підтримка свайпів пальцем на смартфонах
  let touchStartX = 0;
  let touchScrollStart = 0;

  track.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].pageX - track.offsetLeft;
    touchScrollStart = track.scrollLeft;
    track.style.scrollBehavior = 'auto';
  }, { passive: true });

  track.addEventListener('touchmove', (e) => {
    const x = e.touches[0].pageX - track.offsetLeft;
    const walk = (x - touchStartX) * 1.2;
    track.scrollLeft = touchScrollStart - walk;
  }, { passive: true });

  track.addEventListener('touchend', () => {
    track.style.scrollBehavior = 'smooth';
  });
  // --- РОЗУМНА ШАПКА (СХОВАТИСЯ ВНИЗ / З'ЯВИТИСЯ ВГОРУ) ---
let lastScrollPosition = 0;
const siteHeader = document.querySelector('header');

window.addEventListener('scroll', () => {
  const currentScroll = window.pageYOffset || document.documentElement.scrollTop;

  // Якщо сторінка біля самого верху — шапка завжди на місці
  if (currentScroll <= 60) {
    siteHeader.classList.remove('header-hidden');
    lastScrollPosition = currentScroll;
    return;
  }

  // Якщо гортаємо вниз — ховаємо шапку, якщо вгору — повертаємо
  if (currentScroll > lastScrollPosition && currentScroll > 120) {
    siteHeader.classList.add('header-hidden');
  } else {
    siteHeader.classList.remove('header-hidden');
  }

  lastScrollPosition = currentScroll <= 0 ? 0 : currentScroll;
}, { passive: true });

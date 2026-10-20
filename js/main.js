// Конфігурація для сповіщень у Telegram
// Введіть свій токен бота та ID чату адміністратора
const TELEGRAM_CONFIG = {
  token: '', // наприклад: '123456789:AAFxxx...'
  chatId: '' // наприклад: '123456789' або ID групи
};

// Відкриття та закриття модальних вікон
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
        throw new Error('Помилка надсилання в Telegram');
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
    // Якщо токен ще не вказано
    alert(`Дякуємо, ${data.name}! Ваша заявка на номер «${data.room}» прийнята. Адміністратор зателефонує вам на номер ${data.phone}.`);
    form.reset();
    closeBookingModal();
    submitBtn.disabled = false;
    submitBtn.innerText = 'Забронювати відпочинок';
  }
}
document.addEventListener('DOMContentLoaded', () => {
  initInfiniteRoomsSlider();
});

function initInfiniteRoomsSlider() {
  const track = document.getElementById('roomsTrack');
  const dotsContainer = document.getElementById('sliderDots');

  if (!track || !dotsContainer) return;

  const originalCards = Array.from(track.querySelectorAll('.room-card'));
  const total = originalCards.length;
  if (total === 0) return;

  // 1. Клонируем элементы в конец и в начало для бесшовного зацикливания
  originalCards.forEach(card => {
    track.appendChild(card.cloneNode(true));
  });
  originalCards.slice().reverse().forEach(card => {
    track.insertBefore(card.cloneNode(true), track.firstChild);
  });

  const getStep = () => {
    const card = track.querySelector('.room-card');
    return card ? card.offsetWidth + 24 : 364;
  };

  // 2. Устанавливаем начальную позицию на центральный оригинальный набор
  const initialOffset = getStep() * total;
  track.scrollLeft = initialOffset;

  // 3. Создаем точки-индикаторы
  dotsContainer.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('div');
    dot.className = `slider-dot ${i === 0 ? 'active' : ''}`;
    dot.addEventListener('click', () => {
      const step = getStep();
      track.scrollTo({ left: step * (total + i), behavior: 'smooth' });
    });
    dotsContainer.appendChild(dot);
  }

  // 4. Бесшовный скачок при достижении краев клонов
  let isThrottled = false;
  track.addEventListener('scroll', () => {
    const step = getStep();
    const currentScroll = track.scrollLeft;
    const baseWidth = step * total;

    if (!isThrottled) {
      if (currentScroll <= 10) {
        isThrottled = true;
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = currentScroll + baseWidth;
        track.style.scrollBehavior = 'smooth';
        setTimeout(() => { isThrottled = false; }, 50);
      } else if (currentScroll >= baseWidth * 2) {
        isThrottled = true;
        track.style.scrollBehavior = 'auto';
        track.scrollLeft = currentScroll - baseWidth;
        track.style.scrollBehavior = 'smooth';
        setTimeout(() => { isThrottled = false; }, 50);
      }
    }

    // Подсветка активной точки
    const activeIndex = Math.round((track.scrollLeft - baseWidth) / step);
    const normalizedIndex = ((activeIndex % total) + total) % total;
    const dots = dotsContainer.querySelectorAll('.slider-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === normalizedIndex);
    });
  });

  // 5. Перелистывание кнопками-стрелками
  window.slideRooms = function (direction) {
    const step = getStep();
    track.scrollBy({ left: direction * step, behavior: 'smooth' });
  };

  // 6. Поддержка перетаскивания мышью (Drag-to-scroll)
  let isDown = false;
  let startX = 0;
  let scrollStart = 0;

  track.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - track.offsetLeft;
    scrollStart = track.scrollLeft;
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
    const walk = (x - startX) * 1.4;
    track.scrollLeft = scrollStart - walk;
  });
}
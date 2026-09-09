/* =========================
   НАСТРОЙКИ
========================= */

// Дата свадьбы
const weddingDate = new Date("October 10, 2026 12:00").getTime();

// URL веб-приложения Google Apps Script (код скрипта — в apps-script/Code.gs,
// пошаговая настройка — в SETUP.md). Ссылка выглядит так:
// https://script.google.com/macros/s/XXXXX/exec

const API_URL =
    "https://script.google.com/macros/s/AKfycbyv5X2ImCHFBzIJl8tNYwaM3qxxRBmVIDYq6Zc8gZcLjL_svnkYYROwL4bcaJ_kZwY_/exec";

/* =========================
   ТАЙМЕР
========================= */

function updateCountdown() {
    const now = new Date().getTime();

    const distance = weddingDate - now;

    if (distance < 0) {
        document.getElementById("days").innerHTML = "0";
        document.getElementById("hours").innerHTML = "0";
        document.getElementById("minutes").innerHTML = "0";
        document.getElementById("seconds").innerHTML = "0";

        return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));

    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("days").innerHTML = days;

    document.getElementById("hours").innerHTML = hours;

    document.getElementById("minutes").innerHTML = minutes;

    document.getElementById("seconds").innerHTML = seconds;
}

setInterval(updateCountdown, 1000);

updateCountdown();

/* =========================
   АНИМАЦИИ ПРИ СКРОЛЛЕ
========================= */

const reveals = document.querySelectorAll(".reveal");

function revealOnScroll() {
    reveals.forEach((element) => {
        const windowHeight = window.innerHeight;

        const elementTop = element.getBoundingClientRect().top;

        const visiblePoint = 120;

        if (elementTop < windowHeight - visiblePoint) {
            element.classList.add("active");
        }
    });
}

window.addEventListener("scroll", revealOnScroll);

revealOnScroll();

/* =========================
   КАРТА МЕСТА ПРОВЕДЕНИЯ
========================= */

const mapElement = document.getElementById("map");

if (mapElement && typeof L !== "undefined") {
    const venuePoint = [52.981693, 84.679547];

    const venueMap = L.map(mapElement, {
        // Колесо мыши и палец не перехватывают прокрутку страницы
        scrollWheelZoom: false,

        dragging: !L.Browser.mobile,
    }).setView(venuePoint, 17);

    // Убирает префикс «флажок + Leaflet», оставляя обязательные © OSM и CARTO
    venueMap.attributionControl.setPrefix(false);

    const apiKey = "cb1_32vu_1_2bf270affca0d7ea82ed8808";

    L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${apiKey}`, {
        attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',

        maxZoom: 19,
    }).addTo(venueMap);

    // Метка в палитре сайта
    const venuePin = L.divIcon({
        className: "venue-pin",

        html:
            '<svg width="40" height="52" viewBox="0 0 40 52" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M20 0C9 0 0 8.9 0 19.9 0 34 20 52 20 52s20-18 20-32.1C40 8.9 31 0 20 0z" fill="#c7a17a"/>' +
            '<circle cx="20" cy="20" r="7.5" fill="#faf7f2"/>' +
            "</svg>",

        iconSize: [40, 52],

        iconAnchor: [20, 52],

        popupAnchor: [0, -46],
    });

    L.marker(venuePoint, { icon: venuePin })
        .addTo(venueMap)
        .bindPopup(`<b>Столовая "Центральная"</b><br>улица Пушкина, 16`)
        .openPopup();
}

/* =========================
   RSVP ФОРМА
========================= */

const form = document.getElementById("rsvp");

const success = document.getElementById("success");

/* — Показ и добавление полей сопровождающих — */

const guestsBlock = document.getElementById("guests");

const addGuestButton = document.getElementById("addGuest");

function toggleGuests() {
    const attending = form.attend.value === "Буду";

    // Тем, кто не придёт, выбор сопровождающего не показываем вовсе
    form.plusOne.hidden = !attending;

    guestsBlock.hidden = !attending || form.plusOne.value !== "Да";
}

form.attend.addEventListener("change", toggleGuests);

form.plusOne.addEventListener("change", toggleGuests);

toggleGuests();

addGuestButton.addEventListener("click", function () {
    const row = document.createElement("div");

    row.className = "guest-row";

    row.innerHTML =
        '<input type="text" name="guest" placeholder="Имя сопровождающего" />' +
        '<button type="button" class="remove-guest" aria-label="Убрать сопровождающего">×</button>';

    guestsBlock.insertBefore(row, addGuestButton);

    row.querySelector("input").focus();
});

guestsBlock.addEventListener("click", function (event) {
    const removeButton = event.target.closest(".remove-guest");

    if (removeButton) {
        removeButton.closest(".guest-row").remove();
    }
});

/* — Отправка — */

form.addEventListener("submit", async function (event) {
    event.preventDefault();

    // Именно кнопка отправки: в форме есть и другие кнопки («×», «+ Добавить»)
    const button = form.querySelector('button[type="submit"]');

    button.innerHTML = "Отправляем...";

    button.disabled = true;

    // Собираем имена из всех полей сопровождающих (пустые пропускаем);
    // в таблицу они попадают одной строкой через запятую
    const guestNames = Array.from(guestsBlock.querySelectorAll('input[name="guest"]'))
        .map((input) => input.value.trim())
        .filter(Boolean);

    // Кто не придёт — тот без сопровождающих, что бы ни осталось в скрытых полях
    const withGuests = form.attend.value === "Буду" && form.plusOne.value === "Да";

    const formData = {
        // В таблице имя и фамилия лежат одной ячейкой в колонке «Имя»
        name: [form.firstName.value, form.lastName.value]
            .map((part) => part.trim())
            .filter(Boolean)
            .join(" "),

        attend: form.attend.value,

        plusOne: withGuests ? "Да" : "Нет",

        guest: withGuests ? guestNames.join(", ") : "",

        comment: form.comment.value,
    };

    try {
        if (API_URL && !API_URL.includes("ВСТАВЬ")) {
            // Content-Type не указываем: «простой» запрос идёт без preflight,
            // который веб-приложения Apps Script не поддерживают
            const response = await fetch(API_URL, {
                method: "POST",

                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.result !== "success") {
                throw new Error(result.message || "Сервер вернул ошибку");
            }
        } else {
            console.warn("API_URL не настроен — ответ гостя показан, но никуда не сохранён");
        }

        form.style.display = "none";

        success.style.display = "block";
    } catch (error) {
        console.log(error);

        alert("Произошла ошибка. Попробуйте еще раз.");

        button.disabled = false;

        button.innerHTML = "Подтвердить";
    }
});

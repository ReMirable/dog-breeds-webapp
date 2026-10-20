"use strict";

// При запуске из Telegram появляется объект WebApp.
const tg = window.Telegram?.WebApp ?? null;
if (tg) {
  tg.ready();
  tg.expand();
  if (tg.MainButton) {
    tg.MainButton.color = "#39745d";
    tg.MainButton.textColor = "#ffffff";
  }
}

let selectedSlug = null;
let breeds = [];

const grid = document.getElementById("breed-list");
const counter = document.getElementById("breed-count");
const selectedName = document.getElementById("selected-name");
const selectedDescription = document.getElementById("selected-description");
const status = document.getElementById("app-status");
const sendButton = document.getElementById("send-button");

function chooseBreed(breed) {
  selectedSlug = breed.slug;
  selectedName.textContent = breed.title;
  selectedDescription.textContent = `${breed.origin}. ${breed.character}. ${breed.description}`;
  sendButton.disabled = false;

  document.querySelectorAll(".breed-card").forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.slug === selectedSlug);
  });

  if (tg?.MainButton) {
    tg.MainButton.setText("📨 Отправить породу в чат");
    tg.MainButton.show();
  }
  document.querySelector(".selection").scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function submitSelection() {
  if (!selectedSlug) return;
  if (!tg || typeof tg.sendData !== "function") {
    status.textContent = "Просмотр работает и в браузере. Чтобы отправить породу боту, открой каталог через кнопку в личном чате Telegram.";
    return;
  }
  // Telegram передаёт идентификатор выбранной породы боту.
  // Работает при запуске через KeyboardButton(web_app=...).
  tg.sendData(selectedSlug);
}

function makeCard(breed) {
  const card = document.createElement("article");
  card.className = "breed-card";
  card.dataset.slug = breed.slug;

  const img = document.createElement("img");
  img.src = `./images/${encodeURIComponent(breed.photo)}`;
  img.alt = `Фотография породы: ${breed.title}`;
  img.loading = "lazy";

  const body = document.createElement("div");
  body.className = "breed-card__body";
  const title = document.createElement("h3");
  title.textContent = breed.title;
  const desc = document.createElement("p");
  desc.textContent = `${breed.origin} · ${breed.size}`;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Выбрать";
  button.addEventListener("click", () => chooseBreed(breed));

  body.append(title, desc, button);
  card.append(img, body);
  return card;
}

async function loadCatalog() {
  try {
    const response = await fetch("./breeds.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    breeds = await response.json();
    if (!Array.isArray(breeds) || breeds.length === 0) {
      throw new Error("В каталоге нет пород");
    }
    grid.replaceChildren(...breeds.map(makeCard));
    counter.textContent = `${breeds.length} пород`;
  } catch (err) {
    const errorBox = document.getElementById("load-error");
    errorBox.hidden = false;
    errorBox.textContent = `Не удалось открыть каталог (${err.message}). Проверьте breeds.json и запуск сайта через HTTPS или локальный сервер.`;
    counter.textContent = "Ошибка загрузки";
  }
}

sendButton.addEventListener("click", submitSelection);
if (tg?.onEvent) tg.onEvent("mainButtonClicked", submitSelection);
loadCatalog();

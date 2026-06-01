const totalPages = 32;
const sheetsCount = totalPages / 2;
const turnFallbackMs = 1200;
const driveImageIds = [
  "1G21s50oq2iq0MWIGxZjlR_bCo2xW0CVu",
  "1ueUHj1iOc6w8MUl9OZQ_0pRsL8MfxJJy",
  "1A_jS38TJ8hJgVgHq9GA9VnaQycMQa4t3",
  "1iYr09-aLmzTro3QyUvxqHo9O6amhzxfk",
  "1WmHvBmyufmF5BM-Berx6RU9kyvMRYcl5",
  "1ueyV_WmPKpki4vm0-7zYspGQ4Gp0XLAA",
  "18ieiQiy9-x56ciHkLcIqBjxCWt9iLU8E",
  "1qg4KP2oh3XslhtiNxsxozSVvQcKCMlwl",
  "16BH-tSY15GzcdWb2vGuOQ28AmE9n0Ph3",
  "1fGeT1ANaSl6xCvJ1p2zyRX7BX5eCn0JQ",
  "14xdLcVJGiuyE3bR5h9LP9z0hNQIHhu3p",
  "1ULFoc5q8zJ98Frh_YSfxpLMPtYkiLWkr",
  "1HDAMCJJqmQ2HF-tZxY6rC8cuDlk8_sv8",
  "1Y18pqufRMdnq2ebfLSztzVdsmKgoJUP-",
  "1-JNLqSL3AWRoP6a4AXjdIk5xprn64cqS",
  "198qKillJMir7-xf0Yfxzkzzm-j19l-Hv",
  "1JL8UZC2cDy4uUSmJKBU5Q9zBgn3juA36",
  "1C0NcV5UrZurqJiQm99NfZNE_IRpEzFG5",
  "18d01BAsoCy9Mcih5D5iuHoy0FryoJXra",
  "1-itJHR4Y1rUHdFGjJCEbVsKbWP_CNl7d",
  "1GI7WUTz7xpqMSqlLgbFI6mzjruXICHYn",
  "1y6gn_FUheglQ62mqasX54y1g1hfq8T86",
  "1OhaE1kecdN7WwTle1m9C6JmuGeiyaflz",
  "1MOPONW8h53FxlBI2XwhGUsPLcDLda_5s",
  "1NbQzNQharRGi3OzR26ZsQYjNKt4EpALg",
  "16FIncYTx7nwhL9yqcGvy57ntYBa9cNgU",
  "15njGQRtsCDFV-rLHGbidZX0LnrljygR4",
  "1IkAh1hkz_JisnKjBi-22avIIq6HfNgC5",
  "1hS_I0Ns60m2gf3uB2N2rXu15qWVkVD1W",
  "17NAAE4PIKXkgqdv7qcrJ_SQQWj7Ot-zB",
  "16ZTfl7gK3gCbPqdFEPaqhitMTdY4kDPR",
  "1INtGOP7v_IwXhCMkRR42-dj3YhX-XyQn"
];
const imageFiles = driveImageIds.map(id => `https://drive.google.com/thumbnail?id=${id}&sz=w6631`);

const book = document.querySelector("#book");
const pageLabel = document.querySelector("#pageLabel");
const pageCounter = document.querySelector("#pageCounter");
const pageRange = document.querySelector("#pageRange");
const prevButton = document.querySelector('[data-action="prev"]');
const nextButton = document.querySelector('[data-action="next"]');
const firstButton = document.querySelector('[data-action="first"]');
const lastButton = document.querySelector('[data-action="last"]');

let currentSheet = 0;
let isAnimating = false;
const sheets = [];

function clampSheet(sheetIndex) {
  return Math.max(0, Math.min(sheetsCount, sheetIndex));
}

function shouldLoadImmediately(pageNumber) {
  return pageNumber <= 4;
}

function makePage(side, imageSrc, pageNumber) {
  const page = document.createElement("div");
  page.className = `page ${side}`;
  page.setAttribute("aria-label", `P\u00e1gina ${pageNumber}`);

  const image = document.createElement("img");
  if (shouldLoadImmediately(pageNumber)) {
    image.src = imageSrc;
  } else {
    image.dataset.src = imageSrc;
  }
  image.alt = pageNumber === 1
    ? "Portada"
    : pageNumber === totalPages
      ? "Contraportada"
      : `P\u00e1gina ${pageNumber}`;
  image.loading = pageNumber <= 4 ? "eager" : "lazy";
  image.decoding = "async";
  image.dataset.page = String(pageNumber);
  if (pageNumber === 1) {
    image.fetchPriority = "high";
  }
  image.draggable = false;

  page.append(image);
  return page;
}

function loadImage(image) {
  if (!image.dataset.src) return;
  image.src = image.dataset.src;
  image.removeAttribute("data-src");
}

async function waitForImage(image) {
  loadImage(image);
  if (image.complete && image.naturalWidth > 0) return;
  if (image.complete) return;

  try {
    await image.decode();
  } catch (error) {
    let fallback;
    await new Promise(resolve => {
      fallback = window.setTimeout(resolve, 4000);
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    }).finally(() => window.clearTimeout(fallback));
  }
}

async function markBookReady() {
  const cover = book.querySelector('img[data-page="1"]');
  if (cover) await waitForImage(cover);
  book.classList.add("is-ready");
}

function preloadPagesAround(sheetIndex) {
  const firstPage = Math.max(1, sheetIndex * 2 - 3);
  const lastPage = Math.min(totalPages, sheetIndex * 2 + 6);

  for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber += 1) {
    const image = book.querySelector(`img[data-page="${pageNumber}"]`);
    if (image) loadImage(image);
  }
}

function buildBook() {
  for (let index = 0; index < sheetsCount; index += 1) {
    const frontPage = index * 2 + 1;
    const backPage = frontPage + 1;
    const sheet = document.createElement("div");

    sheet.className = "sheet";
    sheet.style.zIndex = String(sheetsCount - index);
    sheet.dataset.index = String(index);
    sheet.tabIndex = 0;
    sheet.setAttribute("role", "button");
    sheet.setAttribute("aria-label", `Pasar hoja ${index + 1}`);
    sheet.append(
      makePage("front", imageFiles[frontPage - 1], frontPage),
      makePage("back", imageFiles[backPage - 1], backPage)
    );
    sheet.addEventListener("click", () => {
      const sheetIndex = Number(sheet.dataset.index);
      goToSheet(sheetIndex >= currentSheet ? sheetIndex + 1 : sheetIndex);
    });
    sheet.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        sheet.click();
      }
    });

    sheets.push(sheet);
    book.append(sheet);
  }
}

function updateRatioFromFirstImage() {
  const image = new Image();
  image.onload = () => {
    if (image.naturalWidth && image.naturalHeight) {
      document.documentElement.style.setProperty("--page-ratio", image.naturalWidth / image.naturalHeight);
    }
  };
  image.src = imageFiles[0];
}

function getVisibleLabel() {
  if (currentSheet === 0) return "Portada";
  if (currentSheet === sheetsCount) return "Contraportada";

  const leftPage = currentSheet * 2;
  const rightPage = leftPage + 1;
  return `P\u00e1ginas ${leftPage}-${rightPage}`;
}

function getCounterText() {
  if (currentSheet === 0) return `1 / ${totalPages}`;
  if (currentSheet === sheetsCount) return `${totalPages} / ${totalPages}`;
  return `${currentSheet * 2}-${currentSheet * 2 + 1} / ${totalPages}`;
}

function updateSheetLayers() {
  sheets.forEach((sheet, index) => {
    const flipped = index < currentSheet;
    sheet.classList.toggle("flipped", flipped);
    sheet.style.zIndex = flipped
      ? String(index + 1)
      : String(sheetsCount - index);
  });
}

function updateControls() {
  pageLabel.textContent = getVisibleLabel();
  pageCounter.textContent = getCounterText();
  pageRange.value = String(currentSheet);
  prevButton.disabled = currentSheet === 0 || isAnimating;
  nextButton.disabled = currentSheet === sheetsCount || isAnimating;
  firstButton.disabled = currentSheet === 0 || isAnimating;
  lastButton.disabled = currentSheet === sheetsCount || isAnimating;
  pageRange.disabled = isAnimating;
  book.classList.toggle("is-animating", isAnimating);
}

function waitForSheet(sheet) {
  return new Promise(resolve => {
    let resolved = false;
    const finish = () => {
      if (resolved) return;
      resolved = true;
      sheet.removeEventListener("transitionend", onTransitionEnd);
      window.clearTimeout(fallback);
      resolve();
    };
    const onTransitionEnd = event => {
      if (event.target === sheet && event.propertyName === "transform") finish();
    };
    const fallback = window.setTimeout(finish, turnFallbackMs);

    sheet.addEventListener("transitionend", onTransitionEnd);
  });
}

async function goToSheet(targetSheet) {
  const nextSheet = clampSheet(targetSheet);
  if (nextSheet === currentSheet || isAnimating) return;

  const activeSheetIndex = nextSheet > currentSheet ? currentSheet : nextSheet;
  const activeSheet = sheets[activeSheetIndex];

  isAnimating = true;
  preloadPagesAround(nextSheet);
  updateControls();

  await Promise.all([...activeSheet.querySelectorAll("img")].map(waitForImage));

  currentSheet = nextSheet;
  updateSheetLayers();
  activeSheet.style.zIndex = String(sheetsCount + 1);
  await waitForSheet(activeSheet);

  isAnimating = false;
  updateSheetLayers();
  updateControls();
}

function bindControls() {
  prevButton.addEventListener("click", () => goToSheet(currentSheet - 1));
  nextButton.addEventListener("click", () => goToSheet(currentSheet + 1));
  firstButton.addEventListener("click", () => goToSheet(0));
  lastButton.addEventListener("click", () => goToSheet(sheetsCount));
  pageRange.addEventListener("input", event => goToSheet(Number(event.target.value)));

  window.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") goToSheet(currentSheet - 1);
    if (event.key === "ArrowRight") goToSheet(currentSheet + 1);
    if (event.key === "Home") goToSheet(0);
    if (event.key === "End") goToSheet(sheetsCount);
  });
}

buildBook();
bindControls();
updateRatioFromFirstImage();
preloadPagesAround(0);
updateSheetLayers();
updateControls();
markBookReady();


const NEWS_URL = "./noticias.json";

let allNews = [];
let currentCategory = "Todas";

const grid = document.getElementById("newsGrid");
const searchInput = document.getElementById("searchInput");
const newsCount = document.getElementById("newsCount");

document.getElementById("year").textContent =
  new Date().getFullYear();

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function safeDate(value) {
  if (!value) return "";
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("pt-BR");
}

function getNewsValue(news, upper, lower) {
  return news[upper] ?? news[lower] ?? "";
}

function renderNews() {
  const term = normalize(searchInput.value);

  const filtered = allNews.filter(news => {
    const title = getNewsValue(news, "TITULO", "titulo");
    const summary = getNewsValue(news, "RESUMO", "resumo");
    const category = getNewsValue(news, "CATEGORIA", "categoria");

    const matchesSearch = normalize(
      title + " " + summary + " " + category
    ).includes(term);

    const matchesCategory =
      currentCategory === "Todas" ||
      normalize(category) === normalize(currentCategory);

    return matchesSearch && matchesCategory;
  });

  grid.replaceChildren();

  newsCount.textContent =
    filtered.length + " notícia(s)";

  if (!filtered.length) {
    const message = document.createElement("p");
    message.textContent = allNews.length
      ? "Nenhuma notícia encontrada."
      : "Ainda não há notícias disponíveis.";
    grid.appendChild(message);
    return;
  }

  filtered.forEach(news => {
    const title = getNewsValue(news, "TITULO", "titulo");
    const summary = getNewsValue(news, "RESUMO", "resumo");
    const category = getNewsValue(news, "CATEGORIA", "categoria");
    const source = getNewsValue(news, "FONTE", "fonte");
    const date = getNewsValue(news, "DATA_PUBLICACAO", "data_publicacao");
    const url = getNewsValue(news, "URL_ARTIGO", "url_artigo");
    const image = getNewsValue(news, "IMAGEM", "imagem");

    const card = document.createElement("article");
    card.className = "news-card";

    if (image) {
      try {
        const parsedImage = new URL(image);

        if (parsedImage.protocol === "https:") {
          const img = document.createElement("img");
          img.src = parsedImage.href;
          img.alt = String(title || "Imagem da notícia");
          img.loading = "lazy";
          img.onerror = () => img.remove();
          card.appendChild(img);
        }
      } catch (error) {
        // Ignora endereços de imagem inválidos.
      }
    }

    const content = document.createElement("div");
    content.className = "news-content";

    const categoryElement = document.createElement("span");
    categoryElement.className = "news-category";
    categoryElement.textContent = category || "Notícias";

    const heading = document.createElement("h3");
    heading.textContent = title || "Notícia sem título";

    const description = document.createElement("p");
    description.textContent = summary || "";

    const meta = document.createElement("div");
    meta.className = "news-meta";
    meta.textContent =
      [source, safeDate(date)].filter(Boolean).join(" • ");

    content.append(
      categoryElement,
      heading,
      description,
      meta
    );

    if (url) {
      try {
        const parsedUrl = new URL(url);

        if (parsedUrl.protocol === "https:" ||
            parsedUrl.protocol === "http:") {
          const link = document.createElement("a");
          link.className = "read-more";
          link.href = parsedUrl.href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = "Leia mais →";
          content.appendChild(link);
        }
      } catch (error) {
        // Ignora links inválidos.
      }
    }

    card.appendChild(content);
    grid.appendChild(card);
  });
}

async function loadNews() {
  try {
    const response = await fetch(NEWS_URL, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Não foi possível carregar as notícias.");
    }

    const data = await response.json();

    allNews = Array.isArray(data)
      ? data
      : Array.isArray(data.noticias)
        ? data.noticias
        : [];

    renderNews();

  } catch (error) {
    grid.textContent =
      "Não foi possível carregar as notícias. Tente novamente mais tarde.";

    newsCount.textContent = "Indisponível";
    console.error("Erro ao carregar notícias:", error);
  }
}

document.querySelectorAll("[data-category]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();

    currentCategory = link.dataset.category;
    renderNews();
  });
});

document.getElementById("searchButton")
  .addEventListener("click", renderNews);

searchInput.addEventListener("keydown", event => {
  if (event.key === "Enter") renderNews();
});

loadNews();

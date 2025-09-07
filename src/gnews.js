import fetch from "node-fetch";

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;

export async function buscarNoticias(limit = 5) {
  const url = `https://gnews.io/api/v4/search?q=artificial%20intelligence&lang=en&max=${limit}&apikey=${GNEWS_API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());

    const data = await res.json();
    return data.articles.map(item => ({
      titulo: item.title,
      descricao: item.description,
      url: item.url
    }));
  } catch (err) {
    console.error("❌ Erro ao buscar no GNews:", err.message);
    return [];
  }
}

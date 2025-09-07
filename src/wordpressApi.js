import fetch from "node-fetch";
import fs from "fs";

const WP_URL = process.env.WP_URL;
const WP_USER = process.env.WP_USER;
const WP_PASS = process.env.WP_PASS;

async function gerarToken() {
  const res = await fetch(`${WP_URL}/wp-json/jwt-auth/v1/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: WP_USER, password: WP_PASS })
  });

  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  console.log("✅ Token JWT gerado");
  return data.token;
}

async function enviarImagem(caminhoImagem, token) {
  const stats = fs.statSync(caminhoImagem);
  const stream = fs.createReadStream(caminhoImagem);

  const res = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Disposition": `attachment; filename=${caminhoImagem}`,
      "Content-Type": "image/png",
      "Content-Length": stats.size
    },
    body: stream
  });

  if (!res.ok) {
    console.error("❌ Erro ao enviar imagem:", await res.text());
    return null;
  }

  const data = await res.json();
  console.log("✅ Imagem enviada, ID:", data.id);
  return data.id;
}

export async function obterIdsTags(tags) {
  const ids = [];
  for (const tag of tags) {
    try {
      const res = await fetch(`${WP_URL}/wp-json/wp/v2/tags?search=${encodeURIComponent(tag)}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      if (data.length > 0) ids.push(data[0].id);
      else console.warn(`⚠️ Tag '${tag}' não encontrada no WP.`);
    } catch (err) {
      console.error(`❌ Erro ao buscar tag '${tag}':`, err.message);
    }
  }
  return ids;
}

export async function publicarPost(titulo, conteudo, caminhoImagem, categorias = [], tags = []) {
  let token;
  try {
    token = await gerarToken();

    // Upload da imagem
    let imagemId = null;
    if (caminhoImagem) {
      imagemId = await enviarImagem(caminhoImagem, token);
    }

    // Publicar o post
    const res = await fetch(`${WP_URL}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: titulo,
        content: conteudo,
        status: "publish",
        categories: categorias,
        tags,
        featured_media: imagemId
      })
    });

    if (!res.ok) throw new Error(await res.text());
    console.log("✅ Post publicado com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao publicar post:", err.message);
  } finally {
    // Apagar imagem local após publicar
    if (caminhoImagem && fs.existsSync(caminhoImagem)) {
      try {
        fs.unlinkSync(caminhoImagem);
        console.log(`🧼 Imagem local '${caminhoImagem}' removida.`);
      } catch (err) {
        console.warn("⚠️ Erro ao remover imagem local:", err.message);
      }
    }
  }
}

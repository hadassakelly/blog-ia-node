import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function gerarConteudoBlog(noticias) {
  const noticiasFormatadas = noticias
    .map(n => `Título: ${n.titulo}\nDescrição: ${n.descricao}\nLink: ${n.url}`)
    .join("\n");

  try {
    const resposta = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Você é um redator de blog especializado em tecnologia." },
        { role: "user", content: `Escreva um artigo em português-br sobre a notícia mais importante:\n\n${noticiasFormatadas}` }
      ],
      max_tokens: 1200,
      temperature: 0.7
    });

    return resposta.choices[0].message.content.trim();
  } catch (err) {
    console.error("❌ Erro ao gerar conteúdo:", err.message);
    return "Erro ao gerar conteúdo.";
  }
}

export async function gerarTitulo(conteudo) {
  try {
    const resposta = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Você é um redator especializado em títulos de blog em português." },
        { role: "user", content: `Crie um título breve e atrativo baseado no texto abaixo:\n\n${conteudo}` }
      ],
      max_tokens: 60,
      temperature: 0.7
    });

    return resposta.choices[0].message.content.replace(/['"]+/g, "").trim();
  } catch (err) {
    console.error("❌ Erro ao gerar título:", err.message);
    return "Notícias sobre Inteligência Artificial – Semana";
  }
}

export async function gerarImagem(titulo) {
  try {
    const prompt = `Imagem moderna e minimalista em preto e branco representando: ${titulo}`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      response_format: "b64_json"
    });

    const b64 = response.data[0].b64_json;
    const buffer = Buffer.from(b64, "base64");

    const slug = titulo.toLowerCase().replace(/\W+/g, "-").slice(0, 50);
    const filename = `imagem_${slug}_${Date.now()}.png`;
    const filepath = path.resolve(filename);

    fs.writeFileSync(filepath, buffer);
    console.log("✅ Imagem gerada:", filename);
    return filepath;
  } catch (err) {
    console.error("❌ Erro ao gerar imagem:", err.message);
    return null;
  }
}

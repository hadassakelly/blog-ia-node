import "dotenv/config.js";
import { buscarNoticias } from "./gnews.js";
import { gerarConteudoBlog, gerarTitulo, gerarImagem } from "./geradorConteudo.js";
import { publicarPost, obterIdsTags } from "./wordpressApi.js";

async function automatizarPostagem() {
  const noticias = await buscarNoticias(5);
  if (!noticias.length) {
    console.log("⚠️ Nenhuma notícia encontrada.");
    return;
  }

  const conteudo = await gerarConteudoBlog(noticias);
  const titulo = await gerarTitulo(conteudo);
  const caminhoImagem = await gerarImagem(titulo);

  const categorias = [1]; // ajuste para o ID real da sua categoria
  const nomesTags = ["inteligência artificial", "tecnologia", "notícias"];
  const tags = await obterIdsTags(nomesTags);

  await publicarPost(titulo, conteudo, caminhoImagem, categorias, tags);
}

automatizarPostagem();

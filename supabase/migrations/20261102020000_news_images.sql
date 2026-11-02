-- Foto delle news: immagine di copertina dell'articolo originale (og:image della
-- pagina o immagine del feed). Il sito la mostra con il credito alla fonte e,
-- se manca o non si carica, un'immagine di riserva per categoria.
alter table public.news_feed_items add column if not exists image_url text;
alter table public.news_articles add column if not exists image_url text;

notify pgrst, 'reload schema';

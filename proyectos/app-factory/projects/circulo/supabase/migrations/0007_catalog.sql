-- 0007 — reference data. Catalogs are part of the schema: the client renders
-- these labels, and the matching package matches on the slugs.

insert into friendship_intentions (code, label, description) values
  ('close_friendship', 'Crear una amistad cercana', 'Busco pocas personas y una relación que crezca con el tiempo.'),
  ('casual_meetups', 'Conocer gente casualmente', 'Me interesa charlar y coincidir sin compromiso.'),
  ('activity_partner', 'Encontrar compañía para planes', 'Quiero alguien con quien hacer actividades concretas.'),
  ('expand_circle', 'Ampliar mi círculo social', 'Quiero conocer a más personas cerca de mí.'),
  ('new_in_city', 'Adaptarme a una ciudad nueva', 'Me mudé hace poco y estoy empezando de cero.'),
  ('language_practice', 'Practicar un idioma', 'Quiero conversar para practicar.'),
  ('similar_life_stage', 'Conocer gente en una etapa similar', 'Busco personas que estén viviendo algo parecido.')
on conflict (code) do nothing;

insert into languages (code, label) values
  ('es', 'Español'), ('en', 'Inglés'), ('pt', 'Portugués'), ('fr', 'Francés'),
  ('de', 'Alemán'), ('it', 'Italiano'), ('ja', 'Japonés'), ('zh', 'Chino'),
  ('ar', 'Árabe'), ('nah', 'Náhuatl')
on conflict (code) do nothing;

insert into interests (slug, label, category) values
  ('cine', 'Cine', 'cultura'),
  ('series', 'Series', 'cultura'),
  ('libros', 'Libros', 'cultura'),
  ('museos', 'Museos', 'cultura'),
  ('musica-en-vivo', 'Música en vivo', 'cultura'),
  ('teatro', 'Teatro', 'cultura'),
  ('cafe', 'Cafeterías', 'social'),
  ('cocinar', 'Cocinar', 'social'),
  ('juegos-de-mesa', 'Juegos de mesa', 'social'),
  ('videojuegos', 'Videojuegos', 'social'),
  ('caminatas', 'Caminatas', 'aire-libre'),
  ('ciclismo', 'Ciclismo', 'aire-libre'),
  ('correr', 'Correr', 'aire-libre'),
  ('senderismo', 'Senderismo', 'aire-libre'),
  ('natacion', 'Natación', 'aire-libre'),
  ('gimnasio', 'Gimnasio', 'bienestar'),
  ('yoga', 'Yoga', 'bienestar'),
  ('meditacion', 'Meditación', 'bienestar'),
  ('fotografia', 'Fotografía', 'creatividad'),
  ('dibujo', 'Dibujo y pintura', 'creatividad'),
  ('escritura', 'Escritura', 'creatividad'),
  ('musica-tocar', 'Tocar un instrumento', 'creatividad'),
  ('idiomas', 'Idiomas', 'aprendizaje'),
  ('tecnologia', 'Tecnología', 'aprendizaje'),
  ('ciencia', 'Ciencia', 'aprendizaje'),
  ('emprender', 'Emprender', 'aprendizaje'),
  ('voluntariado', 'Voluntariado', 'comunidad'),
  ('mascotas', 'Mascotas', 'comunidad'),
  ('jardineria', 'Jardinería', 'comunidad'),
  ('viajes', 'Viajes', 'comunidad')
on conflict (slug) do nothing;

insert into feature_flags (key, enabled, description) values
  ('conversation_reminders', true, 'Recordatorio suave cuando un match lleva días sin mensaje.'),
  ('photo_moderation_queue', true, 'Las fotos nuevas requieren revisión antes de ser visibles.'),
  ('identity_verification', false, 'Verificación opcional con selfie. Fase posterior al MVP.'),
  ('premium_filters', false, 'Filtros adicionales de pago. No implementado en el MVP.'),
  ('travel_mode', false, 'Descubrimiento en otra ciudad. No implementado en el MVP.')
on conflict (key) do nothing;

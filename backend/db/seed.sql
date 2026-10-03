INSERT INTO pokemon (id,nombre,altura,peso,imagen,movimiento1,movimiento2) VALUES
(1,'bulbasaur',0.7,6.9,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png','tackle','vine-whip'),
(4,'charmander',0.6,8.5,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/4.png','scratch','ember'),
(7,'squirtle',0.5,9.0,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/7.png','tackle','water-gun'),
(25,'pikachu',0.4,6.0,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png','quick-attack','thunder-shock'),
(39,'jigglypuff',0.5,5.5,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/39.png','sing','pound'),
(52,'meowth',0.4,4.2,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/52.png','scratch','pay-day'),
(94,'gengar',1.5,40.5,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png','shadow-punch','hypnosis'),
(133,'eevee',0.3,6.5,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png','tackle','quick-attack'),
(143,'snorlax',2.1,460.0,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png','rest','body-slam'),
(491,'darkrai',1.5,50.5,'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/491.png','swords-dance','cut')
ON CONFLICT (id) DO UPDATE SET nombre=EXCLUDED.nombre, altura=EXCLUDED.altura, peso=EXCLUDED.peso, imagen=EXCLUDED.imagen, movimiento1=EXCLUDED.movimiento1, movimiento2=EXCLUDED.movimiento2;

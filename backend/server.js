const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Ruta para comprobar que el servidor funciona
app.get("/", (req, res) => {
  res.json({
    mensaje: "Microservicio PokeApp funcionando",
  });
});

// Ruta para buscar un Pokémon
app.get("/pokemon/:nombre", async (req, res) => {
  try {
    const nombre = req.params.nombre.toLowerCase().trim();

    console.log("Buscando Pokémon:", nombre);

    // El BACKEND consulta PokeAPI
    const respuesta = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${nombre}`
    );

    // Si PokeAPI no encuentra el Pokémon
    if (!respuesta.ok) {
      return res.status(404).json({
        mensaje: "Pokémon no encontrado",
      });
    }

    const datos = await respuesta.json();

    // Seleccionamos únicamente los datos que necesita la app
    const pokemon = {
      id: datos.id,
      nombre: datos.name,
      altura: datos.height,
      peso: datos.weight,

      imagen:
        datos.sprites.other["official-artwork"].front_default ||
        datos.sprites.front_default,

      movimientos: datos.moves
        .slice(0, 2)
        .map((movimiento) => movimiento.move.name),
    };

    // Enviamos el Pokémon al frontend
    res.json(pokemon);
  } catch (error) {
    console.error("Error:", error);

    res.status(500).json({
      mensaje: "Error interno del servidor",
    });
  }
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(
    `Microservicio ejecutándose en http://localhost:${PORT}`
  );
});
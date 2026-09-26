# PokeApp

Aplicación móvil desarrollada con React Native y Expo que permite consultar información de Pokémon mediante un microservicio propio.

## Arquitectura

La aplicación utiliza la siguiente arquitectura:

React Native -> Microservicio Node.js/Express -> PokeAPI

Los datos obtenidos son almacenados mediante Context y compartidos entre diferentes pantallas.

## Funcionalidades

- Búsqueda de Pokémon por nombre o ID.
- Consumo de un microservicio propio.
- El microservicio consulta PokeAPI.
- Manejo de estado mediante useState.
- Manejo de información global mediante useContext.
- Pantalla independiente para la imagen del Pokémon.
- Pantalla independiente para los datos del Pokémon.
- Visualización de nombre, ID, altura, peso y movimientos.

## Tecnologías

- React Native
- Expo
- Expo Router
- TypeScript
- React Context
- Node.js
- Express
- PokeAPI

## Instalación

### Frontend

Desde la raíz del proyecto:

```bash
npm install
npx expo start
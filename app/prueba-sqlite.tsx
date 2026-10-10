import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Text,
  View,
} from "react-native";

import {
  guardarDocenteLocal,
  obtenerDocentesLocales,
  type DocenteLocal,
} from "../database/docentesRepository";

import { inicializarBaseDatos } from "../database/sqlite";

export default function PruebaSQLite() {
  const [docentes, setDocentes] = useState<DocenteLocal[]>([]);
  const [listo, setListo] = useState(false);

  async function cargarDocentes() {
    const datos = await obtenerDocentesLocales();
    setDocentes(datos);
  }

  useEffect(() => {
    async function iniciar() {
      try {
        await inicializarBaseDatos();
        await cargarDocentes();
        setListo(true);
      } catch (error) {
        console.error(error);
        Alert.alert("Error", "No se pudo inicializar SQLite");
      }
    }

    iniciar();
  }, []);

  async function agregarDocente() {
    try {
      await guardarDocenteLocal({
        nombre: "Carlos",
        apellido: "Pérez",
        programa: "Desarrollo de Software",
        cargo: "Docente",
        perfil: "Profesor de programación",
        imagen: null,
      });

      await cargarDocentes();

      Alert.alert("Éxito", "Docente guardado localmente");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo guardar el docente");
    }
  }

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 60 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        Prueba SQLite (datos locales)
      </Text>

      <Button
        title="Guardar docente"
        onPress={agregarDocente}
        disabled={!listo}
      />

      <FlatList
        data={docentes}
        keyExtractor={(item) => item.id_local}
        renderItem={({ item }) => (
          <View style={{ padding: 12 }}>
            <Text>
              {item.nombre} {item.apellido}
            </Text>
            <Text>{item.programa}</Text>
            <Text>
              Sincronización:{" "}
              {item.pendiente_sync === 1
                ? "Pendiente"
                : "Sincronizado"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
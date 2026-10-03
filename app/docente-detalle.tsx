import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

const API =
  process.env.EXPO_PUBLIC_DOCENTES_API_URL ||
  "https://pokeanime-docentes-api.onrender.com";

type Docente = {
  id: number;
  nombre: string;
  cargo?: string;
  programa?: string;
  correo?: string;
  descripcion?: string;
  imagen?: string;
};

type PerfilDocente = {
  formacion: string;
  especialidad: string;
  experiencia: string;
  informacion: string;
};

/*
  Información adicional de los docentes.

  Aquí puedes agregar más docentes usando como clave
  el nombre exactamente como llega desde la API.
*/
const PERFILES: Record<string, PerfilDocente> = {
  "Jimy Javier": {
    formacion:
      "Ingeniero de Sistemas y Magíster en Informática Educativa de la Universidad de La Sabana. También es especialista certificado en Microsoft Excel.",

    especialidad:
      "Ingeniería de software, desarrollo de software, informática educativa, Microsoft Excel y proyectos tecnológicos.",

    experiencia:
      "Cuenta con experiencia en docencia universitaria, formación en tecnologías de la información, desarrollo de software y acompañamiento de proyectos académicos relacionados con ingeniería y tecnología.",

    informacion:
      "Docente Líder de Programa del área de Ingeniería y Tecnologías de la Información.",
  },

  "Edgar Humberto": {
    formacion:
      "Profesional vinculado al área de Ingeniería y Tecnologías de la Información, con experiencia académica y tecnológica.",

    especialidad:
      "Multimedia, tecnologías de la información, herramientas digitales y desarrollo de proyectos tecnológicos.",

    experiencia:
      "Cuenta con experiencia en procesos académicos y en el acompañamiento de proyectos relacionados con multimedia y tecnologías de la información.",

    informacion:
      "Docente líder del área multimedia.",
  },
};

/*
  Componente reutilizable para mostrar cada tarjeta.
*/
function Seccion({
  icono,
  titulo,
  contenido,
}: {
  icono: keyof typeof Ionicons.glyphMap;
  titulo: string;
  contenido: string;
}) {
  return (
    <View style={styles.tarjeta}>
      <View style={styles.tituloFila}>
        <Ionicons
          name={icono}
          size={26}
          color="#ef3340"
          style={styles.icono}
        />

        <Text style={styles.tituloTarjeta}>{titulo}</Text>
      </View>

      <Text style={styles.contenidoTarjeta}>{contenido}</Text>
    </View>
  );
}

export default function DocenteDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [docente, setDocente] = useState<Docente | null>(null);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDocente = async () => {
      try {
        setCargando(true);
        setError("");

        const respuesta = await fetch(`${API}/docentes/${id}`);

        if (!respuesta.ok) {
          throw new Error(`Error del servidor: ${respuesta.status}`);
        }

        const data = await respuesta.json();

        setDocente(data);
      } catch (err) {
        console.error("Error cargando docente:", err);

        setError("No se pudo cargar la información del docente.");
      } finally {
        setCargando(false);
      }
    };

    if (id) {
      cargarDocente();
    }
  }, [id]);

  /*
    Pantalla de carga
  */
  if (cargando) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.botonAtras}
          >
            <Ionicons name="arrow-back" size={30} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.headerTitulo}>
            Detalle del docente
          </Text>
        </View>

        <View style={styles.centro}>
          <ActivityIndicator size="large" color="#ef3340" />
          <Text style={styles.cargandoTexto}>
            Cargando información...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
    Pantalla de error
  */
  if (error || !docente) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.botonAtras}
          >
            <Ionicons name="arrow-back" size={30} color="#ffffff" />
          </TouchableOpacity>

          <Text style={styles.headerTitulo}>
            Detalle del docente
          </Text>
        </View>

        <View style={styles.centro}>
          <Ionicons
            name="alert-circle-outline"
            size={60}
            color="#ef3340"
          />

          <Text style={styles.errorTexto}>
            {error || "No se encontró el docente."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
    Busca información adicional usando el nombre.
  */
  const perfil = PERFILES[docente.nombre];

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.botonAtras}
        >
          <Ionicons name="arrow-back" size={30} color="#ffffff" />
        </TouchableOpacity>

        <Text style={styles.headerTitulo}>
          Detalle del docente
        </Text>
      </View>

      {/* CONTENIDO CON SCROLL */}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {/* PERFIL PRINCIPAL */}

        <View style={styles.perfil}>
          {docente.imagen ? (
            <Image
              source={{ uri: docente.imagen }}
              style={styles.imagen}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.imagen, styles.sinImagen]}>
              <Ionicons
                name="person"
                size={60}
                color="#777777"
              />
            </View>
          )}

          <Text style={styles.nombre}>
            {docente.nombre}
          </Text>

          {docente.cargo ? (
            <Text style={styles.cargo}>
              {docente.cargo}
            </Text>
          ) : null}

          {docente.programa ? (
            <Text style={styles.programa}>
              {docente.programa}
            </Text>
          ) : null}
        </View>

        {/* INFORMACIÓN ADICIONAL */}

        {perfil ? (
          <>
            <Seccion
              icono="school-outline"
              titulo="Formación académica"
              contenido={perfil.formacion}
            />

            <Seccion
              icono="bulb-outline"
              titulo="Áreas de conocimiento"
              contenido={perfil.especialidad}
            />

            <Seccion
              icono="briefcase-outline"
              titulo="Experiencia"
              contenido={perfil.experiencia}
            />

            <Seccion
              icono="information-circle-outline"
              titulo="Información adicional"
              contenido={perfil.informacion}
            />
          </>
        ) : (
          <View style={styles.tarjeta}>
            <View style={styles.tituloFila}>
              <Ionicons
                name="information-circle-outline"
                size={26}
                color="#ef3340"
                style={styles.icono}
              />

              <Text style={styles.tituloTarjeta}>
                Información profesional
              </Text>
            </View>

            <Text style={styles.contenidoTarjeta}>
              La información profesional adicional de este docente
              no se encuentra disponible.
            </Text>
          </View>
        )}

        {/* CORREO */}

        {docente.correo ? (
          <Seccion
            icono="mail-outline"
            titulo="Correo institucional"
            contenido={docente.correo}
          />
        ) : null}

        {/* DESCRIPCIÓN */}

        {docente.descripcion ? (
          <Seccion
            icono="person-outline"
            titulo="Perfil profesional"
            contenido={docente.descripcion}
          />
        ) : null}

        {/* ESPACIO FINAL */}

        <View style={styles.espacioFinal} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },

  /*
    HEADER
  */

  header: {
    backgroundColor: "#ef3340",
    minHeight: 74,
    paddingHorizontal: 28,
    flexDirection: "row",
    alignItems: "center",
  },

  botonAtras: {
    paddingVertical: 12,
    paddingRight: 18,
  },

  headerTitulo: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "bold",
  },

  /*
    SCROLL
  */

  scroll: {
    flex: 1,
    width: "100%",
  },

  body: {
    width: "100%",
    maxWidth: 900,
    alignSelf: "center",

    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 80,
  },

  /*
    PERFIL
  */

  perfil: {
    alignItems: "center",
    marginBottom: 32,
  },

  imagen: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },

  sinImagen: {
    backgroundColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
  },

  nombre: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#222222",
    textAlign: "center",
  },

  cargo: {
    fontSize: 19,
    color: "#ef3340",
    fontWeight: "600",
    marginTop: 8,
    textAlign: "center",
  },

  programa: {
    fontSize: 17,
    color: "#666666",
    marginTop: 8,
    textAlign: "center",
  },

  /*
    TARJETAS
  */

  tarjeta: {
    width: "100%",
    backgroundColor: "#ffffff",

    borderRadius: 16,

    paddingHorizontal: 22,
    paddingVertical: 22,

    marginBottom: 18,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 6,

    elevation: 3,
  },

  tituloFila: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  icono: {
    marginRight: 14,
  },

  tituloTarjeta: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },

  contenidoTarjeta: {
    fontSize: 16,
    color: "#5f5f5f",
    lineHeight: 25,
  },

  /*
    CARGA / ERROR
  */

  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },

  cargandoTexto: {
    marginTop: 15,
    fontSize: 16,
    color: "#666666",
  },

  errorTexto: {
    marginTop: 15,
    fontSize: 17,
    color: "#555555",
    textAlign: "center",
  },

  espacioFinal: {
    height: 30,
  },
});
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { Alert, Platform } from "react-native";

const API_DOCENTES = process.env.EXPO_PUBLIC_DOCENTES_API_URL || "https://pokeanime-docentes-api.onrender.com";

type Docente = { id:number; nombre:string; cargo?:string; programa?:string; correo?:string; descripcion?:string; imagen?:string };

export default function DocentesScreen() {
  const [docentes,setDocentes]=useState<Docente[]>([]);
  const [busqueda,setBusqueda]=useState("");
  const [cargando,setCargando]=useState(false);
  const [error,setError]=useState("");

  const consultar = async (nombre="") => {
    try {
      setCargando(true); setError("");
      const url = nombre.trim() ? `${API_DOCENTES}/docentes?nombre=${encodeURIComponent(nombre.trim())}` : `${API_DOCENTES}/docentes`;
      const response = await fetch(url);
      if(!response.ok) throw new Error(`Error del servidor: ${response.status}`);
      const data=await response.json();
      setDocentes(Array.isArray(data) ? data : Array.isArray(data.docentes) ? data.docentes : []);
    } catch(err) {
      console.error("Error cargando docentes:",err);
      setError("No se pudo conectar con el servicio de docentes."); setDocentes([]);
    } finally { setCargando(false); }
  };

  useFocusEffect(useCallback(() => { consultar(); }, []));
  const eliminar = (item:Docente) => {
    const ejecutar = async () => {
      try {
        const r = await fetch(`${API_DOCENTES}/docentes/${item.id}`, {method:"DELETE"});
        if (!r.ok) throw new Error(String(r.status));
        consultar(busqueda);
      } catch { Alert.alert("Error", "No se pudo eliminar el docente."); }
    };
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.confirm(`¿Eliminar a ${item.nombre}?`)) ejecutar();
    } else {
      Alert.alert("Eliminar docente", `¿Eliminar a ${item.nombre}?`, [
        {text:"Cancelar",style:"cancel"},{text:"Eliminar",style:"destructive",onPress:ejecutar}
      ]);
    }
  };

  return <SafeAreaView style={styles.container}>
    <View style={styles.header}><Ionicons name="school-outline" size={34} color="#fff"/><View style={{marginLeft:12}}><Text style={styles.titulo}>Docentes</Text><Text style={styles.subtitulo}>Docentes de Uninpahu</Text></View></View>
    <View style={styles.contenido}><TouchableOpacity style={[styles.verMas,{alignSelf:"flex-end",marginBottom:12}]} onPress={()=>router.push("/docente-formulario")}><Ionicons name="add" size={20} color="#fff"/><Text style={styles.btnTxt}>Nuevo docente</Text></TouchableOpacity>
      <View style={styles.buscador}><View style={styles.inputBox}><Ionicons name="search-outline" size={21} color="#777"/><TextInput style={styles.input} placeholder="Buscar docente..." value={busqueda} onChangeText={setBusqueda} onSubmitEditing={()=>consultar(busqueda)}/>{busqueda ? <TouchableOpacity onPress={()=>{setBusqueda(""); consultar();}}><Ionicons name="close-circle" size={22} color="#999"/></TouchableOpacity>:null}</View><TouchableOpacity style={styles.buscarBtn} onPress={()=>consultar(busqueda)}><Ionicons name="search" size={23} color="#fff"/></TouchableOpacity></View>
      {cargando ? <View style={styles.estado}><ActivityIndicator size="large"/><Text style={styles.estadoTxt}>Cargando docentes...</Text></View> : error ? <View style={styles.estado}><Ionicons name="cloud-offline-outline" size={65} color="#777"/><Text style={styles.estadoTxt}>{error}</Text><TouchableOpacity style={styles.reintentar} onPress={()=>consultar()}><Text style={styles.btnTxt}>Reintentar</Text></TouchableOpacity></View> : docentes.length===0 ? <View style={styles.estado}><Ionicons name="people-outline" size={65} color="#777"/><Text style={styles.estadoTxt}>No se encontraron docentes.</Text></View> : <FlatList data={docentes} keyExtractor={x=>String(x.id)} contentContainerStyle={{paddingBottom:30}} renderItem={({item})=><View style={styles.card}>{item.imagen ? <Image source={{uri:item.imagen}} style={styles.foto}/> : <View style={[styles.foto,styles.sinFoto]}><Ionicons name="person" size={50} color="#777"/></View>}<View style={styles.info}><Text style={styles.nombre}>{item.nombre}</Text>{item.cargo?<Text style={styles.cargo}>{item.cargo}</Text>:null}{item.programa?<Text style={styles.programa}>{item.programa}</Text>:null}<TouchableOpacity style={styles.verMas} onPress={()=>router.push({pathname:"/docente-detalle",params:{id:String(item.id)}})}><Text style={styles.btnTxt}>Ver más</Text><Ionicons name="arrow-forward" size={17} color="#fff"/></TouchableOpacity><View style={{flexDirection:"row",gap:8,marginTop:8}}><TouchableOpacity style={[styles.verMas,{backgroundColor:"#2866ae"}]} onPress={()=>router.push({pathname:"/docente-formulario",params:{id:String(item.id)}})}><Ionicons name="pencil" size={16} color="#fff"/><Text style={styles.btnTxt}>Editar</Text></TouchableOpacity><TouchableOpacity style={[styles.verMas,{backgroundColor:"#aa2935"}]} onPress={()=>eliminar(item)}><Ionicons name="trash" size={16} color="#fff"/><Text style={styles.btnTxt}>Eliminar</Text></TouchableOpacity></View></View></View>}/>} 
    </View>
  </SafeAreaView>;
}

const styles=StyleSheet.create({container:{flex:1,backgroundColor:"#F4F6F8"},header:{backgroundColor:"#e63946",padding:20,flexDirection:"row",alignItems:"center"},titulo:{fontSize:25,fontWeight:"bold",color:"#fff"},subtitulo:{fontSize:14,color:"#fff",marginTop:2},contenido:{flex:1,padding:16},buscador:{flexDirection:"row",marginBottom:15},inputBox:{flex:1,height:50,backgroundColor:"#fff",borderRadius:12,paddingHorizontal:14,flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:"#ddd"},input:{flex:1,marginLeft:8,fontSize:16},buscarBtn:{width:50,height:50,marginLeft:8,backgroundColor:"#e63946",borderRadius:12,alignItems:"center",justifyContent:"center"},card:{backgroundColor:"#fff",borderRadius:16,marginBottom:15,padding:14,flexDirection:"row",elevation:3},foto:{width:100,height:115,borderRadius:12},sinFoto:{backgroundColor:"#eee",alignItems:"center",justifyContent:"center"},info:{flex:1,marginLeft:14,justifyContent:"center"},nombre:{fontSize:18,fontWeight:"bold",color:"#222",marginBottom:5},cargo:{fontSize:14,color:"#e63946",fontWeight:"600",marginBottom:4},programa:{fontSize:13,color:"#666",marginBottom:10},verMas:{alignSelf:"flex-start",backgroundColor:"#e63946",paddingVertical:8,paddingHorizontal:14,borderRadius:8,flexDirection:"row",alignItems:"center",gap:6},btnTxt:{color:"#fff",fontWeight:"bold"},estado:{flex:1,alignItems:"center",justifyContent:"center",padding:25},estadoTxt:{marginTop:15,fontSize:16,color:"#666",textAlign:"center"},reintentar:{marginTop:18,backgroundColor:"#e63946",paddingVertical:11,paddingHorizontal:25,borderRadius:10}});

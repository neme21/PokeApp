import React, {useEffect,useState} from "react";
import {ActivityIndicator,Alert,Platform,ScrollView,StyleSheet,Text,TextInput,TouchableOpacity,View} from "react-native";
import {router,useLocalSearchParams} from "expo-router";
import {Ionicons} from "@expo/vector-icons";
const API=process.env.EXPO_PUBLIC_DOCENTES_API_URL || "https://pokeanime-docentes-api.onrender.com";
type Campo="nombre"|"cargo"|"programa"|"descripcion"|"imagen";
const vacio={nombre:"",cargo:"",programa:"",descripcion:"",imagen:""};
export default function DocenteFormulario(){
 const {id}=useLocalSearchParams<{id?:string}>();
 const [datos,setDatos]=useState(vacio);const [guardando,setGuardando]=useState(false);
 useEffect(()=>{if(!id)return;fetch(`${API}/docentes/${id}`).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>setDatos({nombre:d.nombre||"",cargo:d.cargo||"",programa:d.programa||"",descripcion:d.descripcion||"",imagen:d.imagen||""})).catch(()=>Alert.alert("Error","No se pudo consultar el docente"));},[id]);
 const guardar=async()=>{
  if(!datos.nombre.trim()){Alert.alert("Validación","El nombre es obligatorio");return;}
  setGuardando(true);
  try {const r=await fetch(`${API}/docentes${id?`/${id}`:""}`,{method:id?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(datos)});
   if(!r.ok)throw Error(`HTTP ${r.status}`);
   if(Platform.OS==="web")window.alert(id?"Docente actualizado":"Docente registrado");else Alert.alert("Correcto",id?"Docente actualizado":"Docente registrado");
   router.back();
  }catch(e){Alert.alert("Error","No fue posible guardar. Verifica que Render tenga desplegado el CRUD.");}finally{setGuardando(false)}
 };
 return <View style={s.container}><View style={s.header}><TouchableOpacity onPress={()=>router.back()}><Ionicons name="arrow-back" size={28} color="#fff"/></TouchableOpacity><Text style={s.title}>{id?"Editar docente":"Nuevo docente"}</Text></View><ScrollView style={{flex:1}} contentContainerStyle={s.content}>
 {([ ["nombre","Nombre completo"],["cargo","Cargo"],["programa","Programa"],["descripcion","Descripción"],["imagen","URL de imagen"]] as [Campo,string][]).map(([key,label])=><View key={key} style={s.group}><Text style={s.label}>{label}{key==="nombre"?" *":""}</Text><TextInput style={[s.input,key==="descripcion"&&{height:110,textAlignVertical:"top"}]} multiline={key==="descripcion"} value={datos[key]} onChangeText={v=>setDatos(p=>({...p,[key]:v}))} placeholder={label}/></View>)}
 <TouchableOpacity style={s.button} disabled={guardando} onPress={guardar}>{guardando?<ActivityIndicator color="#fff"/>:<Text style={s.buttonText}>{id?"Guardar cambios":"Registrar docente"}</Text>}</TouchableOpacity>
 </ScrollView></View>
}
const s=StyleSheet.create({container:{flex:1,backgroundColor:"#f4f6f8"},header:{backgroundColor:"#e63946",padding:22,flexDirection:"row",alignItems:"center",gap:16},title:{color:"#fff",fontWeight:"bold",fontSize:21},content:{padding:22,paddingBottom:70,maxWidth:800,width:"100%",alignSelf:"center"},group:{marginBottom:18},label:{fontSize:16,fontWeight:"600",marginBottom:7},input:{backgroundColor:"#fff",borderWidth:1,borderColor:"#ddd",borderRadius:10,padding:13,fontSize:16},button:{backgroundColor:"#e63946",padding:17,borderRadius:12,alignItems:"center"},buttonText:{color:"#fff",fontWeight:"bold",fontSize:17}});

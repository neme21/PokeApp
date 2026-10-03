require("dotenv").config();
const express=require("express"); const cors=require("cors"); const {Pool}=require("pg"); const swaggerUi=require("swagger-ui-express"); const swaggerJsdoc=require("swagger-jsdoc");
const app=express(); const PORT=process.env.PORT||3000;
const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:process.env.DATABASE_URL?.includes("localhost")?false:{rejectUnauthorized:false}});
app.use(cors()); app.use(express.json());
const spec=swaggerJsdoc({definition:{openapi:"3.0.0",info:{title:"PokeAnime - Pokémon API",version:"1.0.0",description:"Microservicio Node.js que consulta una base PostgreSQL propia con 10 Pokémon."},servers:[{url:"/"}]},apis:[__filename]});
app.use("/api-docs",swaggerUi.serve,swaggerUi.setup(spec)); app.get("/openapi.json",(_,res)=>res.json(spec));
/** @openapi
 * /:
 *   get:
 *     summary: Estado del microservicio
 *     responses: { '200': { description: OK } }
 */
app.get("/",(_,res)=>res.json({mensaje:"Microservicio Pokémon funcionando",swagger:"/api-docs"}));
/** @openapi
 * /pokemon:
 *   get:
 *     summary: Lista los 10 Pokémon almacenados
 *     responses: { '200': { description: Lista de Pokémon } }
 */
app.get("/pokemon",async(_,res)=>{try{const {rows}=await pool.query("SELECT * FROM pokemon ORDER BY id");res.json(rows.map(format));}catch(e){fail(res,e)}});
/** @openapi
 * /pokemon/{busqueda}:
 *   get:
 *     summary: Busca un Pokémon por nombre o ID
 *     parameters:
 *       - in: path
 *         name: busqueda
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       '200': { description: Pokémon encontrado }
 *       '404': { description: Pokémon no encontrado }
 */
app.get("/pokemon/:busqueda",async(req,res)=>{try{const q=req.params.busqueda.trim().toLowerCase(); const numeric=/^\d+$/.test(q); const {rows}=await pool.query(numeric?"SELECT * FROM pokemon WHERE id=$1":"SELECT * FROM pokemon WHERE LOWER(nombre)=$1",[numeric?Number(q):q]); if(!rows[0]) return res.status(404).json({mensaje:"Pokémon no encontrado en la base propia"});res.json(format(rows[0]));}catch(e){fail(res,e)}});
function format(p){return {id:p.id,nombre:p.nombre,altura:Number(p.altura),peso:Number(p.peso),imagen:p.imagen,movimientos:[p.movimiento1,p.movimiento2]}}
function fail(res,e){console.error(e);res.status(500).json({mensaje:"Error de base de datos"})}
app.listen(PORT,"0.0.0.0",()=>console.log(`Pokémon API en puerto ${PORT}`));

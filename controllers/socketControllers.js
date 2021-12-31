const { join, dirname }  =require('path')
const  { Low, JSONFile } =require( 'lowdb')
const { fileURLToPath } =require( 'url')


// Use JSON file for storage
const file = join(__dirname, 'db.json')
const adapter = new JSONFile(file)
const db = new Low(adapter)
db.read()
db.data = { posts: [] }
db.data.posts.push({ id: 1, title: 'lowdb is awesome' })

console.log(db);




module.exports={
    addOnlineUser:({socketId,userId})=>{

        console.log("add online user");
        return new Promise(async(resolve,reject)=>{

            

            
        })
    },
    removeOnlineuser:({socketId})=>{
       
    }
}
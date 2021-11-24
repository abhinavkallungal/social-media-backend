const mongoClient =require("mongodb").MongoClient

const state = {
    db:null

}

module.exports.connect=function(done){
     const url ="mongodb://localhost:27017/"
     const dbName="socialMedia"
     mongoClient.connect(url,(err,data)=>{
        if(err){
            console.log("err",err);
            return done(err);
        } 

        if(data){
        }
        state.db=data.db(dbName)
        done()
     })
}

module.exports.get= function(){
    return state.db
}
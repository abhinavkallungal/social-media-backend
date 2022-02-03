const express = require("express");

require('dotenv').config()

var morgan = require('morgan')
const cors = require('cors')

const bodyParser = require('body-parser')
const socket = require('socket.io')

const UserRouter = require('./routers/User')
const AuthRouter = require('./routers/auth')
const AdminRouter = require('./routers/Admin')
const db = require('./config/connection');
const userHandlers = require('./socket/userHandlers')
const { removeOnlineuser } = require('./controllers/socketControllers')





const app = express()

const PORT = process.env.PORT


app.use(cors());
app.use(passport.initialize())

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.raw({ type: 'application/octet-stream', limit: '100mb' }));

app.use(express.json());


app.use('/api/v1/user/', UserRouter);
app.use('/auth', AuthRouter);
app.use('/api/v1/admin/', AdminRouter);

app.use(morgan('tiny'))

db.connect((err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("db connected");
  }
})




const server = app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("server started at ", PORT);
  }
})


const io = socket(server);





const onConnection = (socket) => {

  console.log("new connection ", socket.id);
  userHandlers(io, socket);


  socket.on('disconnect', () => {
    console.log("disconnect", socket.id);
    removeOnlineuser({ socketId: socket.id })
   
  })


}



io.on("connection", onConnection);



const express = require("express");
const socketio = require("socket.io");
const cors = require("cors");



const app = express();
app.use(cors());
const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, ()=>{
    console.log(`El servisor esta funcionando en el puerto ${PORT}`);
});

const host = "http://localhost:3000";
const io = socketio(server,{
    cors: {
        origin: host,
        methods: ["GET", "POST"],
      },
});

//un array donde se almacenaran todos los usuarios
let users=[];

//salas donde se encuentran los mensajes
let messages={
    general:[],
    C:[],
    Javascript:[],
    Java:[],
};

io.on('connection',(socket)=>{
    
    /*mostrar cuando se conecte al servidor,con su respectivo usuario*/
    socket.on("join server",(username)=>{
        const user ={
            username,
            id: socket.id
        };
        /*agregamos el nuevo usuario al array y lo mandamos como un evento*/
        users.push(user);
        io.emit("new user",users);
    });
    /* crear un array nuevo con el nombre de la nueva sala*/
     socket.on("add room",(roomName)=>{
         let newArray = [];
         messages={
             ...messages,
             newArray
         }
         messages[roomName]=messages['newArray'];
         delete messages['newArray'];
         console.log(messages);
         return messages;
     });
     
    /*Unirse a una sala*/
    socket.on("join room",(roomName,cb)=>{
        socket.join(roomName);
        /*servira para poder mostrar los mensajes anteriores de ese chat,
        cuando se una a la sala le pasara los mensajes a esa funcion*/
        cb(messages[roomName]);
        socket.emit("joined",messages[roomName]);
    });

    //mostrar a los demas las salas menos a mi
    socket.on("show rooms",(nRoom)=>{
        socket.broadcast.emit("show nRooms",nRoom);
        console.log(nRoom);
    });
   
    /*Mandar mensajes, esto sera para el oyende de los mensajes,
    content = contenido del mensaje
    to= sera el nombre del chat o a una persona en especifico(id usuario)
    sender= es quien esta enviando el mensaje(usuario)
    chatName= nombre del chat done se envia el mensaje
    isChannel= es un booleano revisara si el mensaje se envia desde un chat o para alguien es especifico*/
    socket.on("send message",({content,to,sender,chatName,isChannel})=>{

        /*si el mensaje se envia desde un canal, se toma el contenido del mensaje,
        el nombre del chat y quien lo envia */
        if(isChannel){
            const payload={
                content,
                chatName,
                sender
            };
            /*socket.to sirve para poder emitir o transmitir el mensaje a quien se le esta especificando
            en este caso sera el nombre de la sala */
            socket.to(to).emit("new message",payload);
        }else{
            /*cuando es a un usuario en especifico, contenido, el nombre del chat sera el nombre del usuario
            el nombre del usuario*/
            const payload={
                content,
                chatName:sender,
                sender
            }
            socket.to(to).emit("new message",payload);
        }
        /*si hay mensajes en algun canal, vas a agregar todos los mensajes
        nombre y contenido*/
        if(messages[chatName]){
            messages[chatName].push({
                sender,
                content
            });
        }
    });
    socket.on("disconnect",()=>{
        /*compara los id, que se encuentran guardados en el array de users con los id
        que se genera socket.io */
        users = users.filter(user => user.id !== socket.id);
        io.emit("new user",users);
    });

});
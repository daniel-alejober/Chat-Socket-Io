import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { produce } from "immer";
/*immer sirve para inmutar estados,
guardara los mensajes para que el usuario nuevo pueda leer los
mensajes anteriores */

import Chat from "./components/Chat";
import Form from "./components/Form";

/*salas por defecto */
const initialMessagesState = {
  general: [],
  C: [],
  Javascript: [],
  Java: [],
};

function App() {
  const [username, setUsername] = useState(""); //nombre de usuario
  const [connected, setConnected] = useState(false); //estado para saber cuando se inicia socket.io
  const [currentChat, setCurrentChat] = useState({
    isChannel: true,
    chatName: "general",
    receiverId: "",
    programing: false
  }); /*vamos a mandar un objeto para saber en sala de chat nos encontramos, o una sala,
    aqui es donde se decide a que canal lo queremos mandar pero puede cambiar,
    receiverId sera el id de socket.io forzosamente*/
  const [connectedRooms, setConectedRooms] = useState([
    "general",
  ]); /*mostrara un boton para unirse a una sala */
  const [allUsers, setAllUsers] = useState([]); //mostrara todos los usuarios conectados hasta el momento
  const [messages, setMessages] = useState(initialMessagesState); //los mensajes guardados en las salas
  const [message, setMessage] = useState(""); //mensaje que escribes
  const [nRoom, setnRoom] = useState([]);//mandar al servidor las nuevas salas
  const [resnewR, setResnewR] = useState([]);//guarda la respuesta del servidor cuando se crea una nueva sala
  const socketRef = useRef(); //definir una referencia que almacenara socket.io, una vez que este conectado

  /*leera lo que escribe el usuario en el input, para despues mandarlo 
  a la variable message */
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
  };
  /*cuando se envia el mensaje el input se limpiara */
  useEffect(() => {
    setMessage("");
  }, [messages]);

  /*mandar mensajes, creamos un objeto,
  contenido del emnsaje,
  para quien es el mensaje, si el canal es true entonces, lo enviara al nombre del canal,
  si no lo mandara al id de la persona,
  quien esta mandando el mensaje,
  el nombre del chat,
  si es un canal o no */
  const sendMessage = () => {
    const payload = {
      content: message,
      to: currentChat.isChannel ? currentChat.chatName : currentChat.receiverId,
      sender: username,
      chatName: currentChat.chatName,
      isChannel: currentChat.isChannel,
    };
    /**con la referencia de socket.io vamos a emitir el evento mandar mensaje, y le enviamos el objeto
     creamos una funcion newMessages,
     producer 2 parametros
     1.- un estado base(messages) los cuales no se tocaran,
     2.- el draft, aqui agregan cosas al estado inicial
     le pasamos el nombre del chat actual y le vamos a ir agregando, el mensaje y el usuario que manda ese
     mensaje, despues vamos a actualizar los mensajes, con su funcion setMessages y le psamos 
     esta nueva funcion que guarda los mensajes*/
    socketRef.current.emit("send message", payload);
    const newMessages = produce(messages, (draft) => {
      draft[currentChat.chatName].push({
        sender: username,
        content: message,
      });
    });
    setMessages(newMessages);
  };

  /*esta funcion acepta los mensajes entrantes,y la sala
  lo que hace es tomar los mensajes actuales, y va a seguir recibiendo
  los mensajes de la salas que estemos conectados, aunque no las tengamos a foco*/
  const roomJoinCallback = (incomingMessages, room) => {
    const newMessages = produce(messages, (draft) => {
      draft[room] = incomingMessages;
    });
    setMessages(newMessages);
  };
  /*mostrar las nuevas salas */
  const shownewRooms=()=>{
    socketRef.current.emit("show rooms",nRoom);
  }
  /*funcion para unirse a las salas le pasaremos por parametro una sala,
   newConnectedRooms nos servira para pasarle las room en las cuales
   hemos estado, y las unira a room*/
  const joinRoom = (room) => {
    const newConnectedRooms = produce(connectedRooms, (draft) => {
      draft.push(room);
    });
    /*vamos a emitir un evento join room, le pasaremos las room, 
    la segunda es una funcion que recibe los mensajes como argumento,
    llama a la funcion roomJoinCallback que recibe los mensajes, y la room
    por ultimo vamos a actualizar la funcion setConectedRooms que
    por defecto tiene ''general', para pasarle todas las room
    a las que estemos conectados*/
    socketRef.current.emit("add room", currentChat.chatName);
    socketRef.current.emit("join room", room, (messages) =>
      roomJoinCallback(messages, room)
    );
    /*---show rooms---*/
    shownewRooms();
    setConectedRooms(newConnectedRooms);
  };

  /* recibe como parametro la sala actual, cuando le das 
  click a una sala se convierte en un chat,
  si no hay mensajes en ese chat, se empezaran a guardar todos los mensajes
  desde ese punto gracias a produce*/
  const toggleChat = (currentChat) => {
    if (!messages[currentChat.chatName]) {
      const newMessages = produce(messages, (draft) => {
        draft[currentChat.chatName] = [];
      });
      setMessages(newMessages);
    }
    /*despues vamos a actualizar,setCurrentChat, cambiara de estar 
    en general a donde le demos click*/
    setCurrentChat(currentChat);
  };
  /*------Form------ */
  /*guarda el nombre de usuario */
  const handleChange = (e) => {
    setUsername(e.target.value);
  };
  /*realiza la coneccion de socket.io,
  se crea una referencia de sockect.io se guarda en socketRef,
  se ejecuta el evento de unirse al servidor,
  el evento de unirse a una sala que por defecto es la general, la cual
  tiene la funcion roomJoinCallback() la que hace que se guarden los 
  mensajes anteriores de esa sala,
  despues recibimos nuevo usuario y se actualiza allUsers, con todos los usuarios
  que esten conectados en el canal*/
  const connect = () => {
    setConnected(true);
    socketRef.current = io.connect("http://localhost:8000/");
    socketRef.current.emit("join server", username);
    socketRef.current.emit("join room", "general", (messages) =>
      roomJoinCallback(messages, "general")
    );
    socketRef.current.on("new user", (allUsers) => {
      setAllUsers(allUsers);
    });
    /*mostrar nuevas salas*/
    socketRef.current.on("show nRooms",(nRoom)=>{
      setResnewR(nRoom);
    });
    /*para poder mandar un mensaje en el chat o canal actual,
    se actualizan los mensajes y se guardaran */
    socketRef.current.on("new message", ({ content, sender, chatName }) => {
      setMessages((messages) => {
        const newMessages = produce(messages, (draft) => {
          if (draft[chatName]) {
            draft[chatName].push({ content, sender });
          } else {
            draft[chatName] = [{ content, sender }];
          }
        });
        return newMessages;
      });
    });
    
  };

  //si hay una coneccion
  let body;
  if (connected) {
    body = (
      <Chat
        message={message}
        handleMessageChange={handleMessageChange}
        sendMessage={sendMessage}
        yourId={
          socketRef.current ? socketRef.current.id : ""
        } /*si hay una conexion en socket.io
        tomara el id del usuario*/
        allUsers={allUsers}
        joinRoom={joinRoom}
        connectedRooms={connectedRooms}
        currentChat={currentChat}
        toggleChat={toggleChat}
        messages={messages[currentChat.chatName]}
        setnRoom={setnRoom}
        resnewR={resnewR}
  
      />
    );
  } else {
  /*si no hay muestra un formulario donde se debe ingresar el usuario,
   para asi mandar a llamar a la funcion connect que hace la conexion al backend*/
    body = (
      <Form username={username} onChange={handleChange} connect={connect} />
    );
  }

  return <div>{body}</div>;
}

export default App;

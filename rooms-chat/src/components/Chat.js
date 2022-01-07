import React, { useState } from "react";
import styled from "styled-components";
import { v4 as uuidv4 } from 'uuid';

const Container = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
`;

const SideBar = styled.div`
  height: 100%;
  width: 15%;
  border-right: 1px solid black;
`;

const ChatPanel = styled.div`
  height: 100;
  width: 85%;
  display: flex;
  flex-direction: column;
`;

const BodyContainer = styled.div`
  width: 100%;
  height: 75%;
  overflow: scroll;
  border-bottom: 1px solid black;
`;

const TextBox = styled.textarea`
  height: 15%;
  width: 90%;
`;

const ChannelInfo = styled.div`
  height: 10%;
  width: 100%;
  border-bottom: 1px solid black;
`;

const Row = styled.div`
  cursor: pointer;
`;

const Messages = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
`;
const ContainerMessages = styled.div`
  overflow: scroll;
`;
/*----------------------------------- */

const Chat = (props) => {
  //habitaciones por defecto
  let rooms = ["general", "C", "Javascript", "Java"];

  let roomsUsers = [];

  const [roomName, setRoomName] = useState("");
  const [newRoomCreate, setNewRoomCreate] = useState('');
  
  const createRoom = (e)=>{
    e.preventDefault();
    if(roomName.trim() === ''){
      return;
    }
    else {
      setNewRoomCreate(roomName)
      props.setnRoom(roomName);
    }
  }
  roomsUsers.push(newRoomCreate);
  roomsUsers.push(props.resnewR);

  
  /* recibe por parametro las salas que tenemos, crea un objeto
    nombre de la sala, si es un canal, el id del usuario(socketio.id),
    regresa pinta el elemento el la columna, si le damos click,
    tomata como parametro el nombre de la sala*/
  const renderRooms = (room) => {
    const currentChat = {
      chatName: room,
      isChannel: true,
      receiverId: "",
      programing: false
    };
    /*al dar click en un usuario mandara a llamar a toggleChat, que se encarga de almacenar
        los mensajes del chat cuando se cambia y actualizar el estado del sala actual */
    return (
      <Row onClick={() => props.toggleChat(currentChat)} key={uuidv4()}>
        {room}
      </Row>
    );
  };
  /*crear las salas de programacion */
  const renderRoomsPrograming = (room) => {
    const currentChat = {
      chatName: room,
      isChannel: true,
      receiverId: "",
      programing: true
    };
    /*al dar click en un usuario mandara a llamar a toggleChat, que se encarga de almacenar
        los mensajes del chat cuando se cambia y actualizar el estado del sala actual */
    return (
      <Row onClick={() => props.toggleChat(currentChat)} key={uuidv4()}>
        {room}
      </Row>
    );
  };
  /*esta funcion sirve para iterar uno a uno todos los usuarios y mostrarlo
    mostrando en la pantalla el "YOU" */
  const renderUser = (user) => {
    if (user.id === props.yourId) {
      return <Row key={user.id}>You: {user.username}</Row>;
    }
    /*crea un objeto para poder hablar entre usuarios,
        nombre del chat(usuario), no hay canal, el id del usuario(socket.io) */
    const currentChat = {
      chatName: user.username,
      isChannel: false,
      receiverId: user.id,
    };
    /*al dar click en un usuario mandara a llamar a toggleChat, que se encarga de almacenar
        los mensajes del chat cuando se cambia y actualizar el estado del chat actual */
    return (
      <Row
        onClick={() => {
          props.toggleChat(currentChat);
        }}
        key={user.id}
      >
        {user.username}
      </Row>
    );
  };

  /* acepta un mensaje y un indice, ya que los estamos
    mapeando solo mostrara quien envio el mensaje y su contenido*/
  const renderMessages = (message, index) => {
    return (
      <div key={index}>
        <h3>{message.sender}</h3>
        <h3>{message.content}</h3>
      </div>
    );
  };

  /*aplica para la primera vez que te vas a unir a un canal,
    si no la variable isChannel es false(estas hablando con un usuario) 
    o es si es un canal tenemos que verificar que el nombre del canal se encuentra
    en connectedRooms*/
  let body;
  if (
    !props.currentChat.isChannel ||
    props.connectedRooms.includes(props.currentChat.chatName)
  ) {
    if(props.currentChat.programing){
      body=<div>
          <ContainerMessages>
            <Messages>{props.messages.map(renderMessages)}</Messages>
          </ContainerMessages>
      </div>
    }
    else{
      body = <Messages>{props.messages.map(renderMessages)}</Messages>;
    }
  }
 
   else {
  /*si no, entonces te mostrara un boton para poder unirte a dicha sala */
    body = (
      <button
        type="button"
        onClick={() => props.joinRoom(props.currentChat.chatName)}
      >
        Join {props.currentChat.chatName}
      </button>
    );
  }
  /*si, el usuario presiona la tecla enter llama la funcion
    sendMessage que se encarga de crear el objeto que manda el mensaje al servidor */
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      props.sendMessage();
    }
  };

  return (
    <Container>
      <SideBar>
        <h3>Create Rooms</h3>
        <form onSubmit={createRoom}>
          <input
            type="text"
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="createRoom"
          />
          <button type="submit">Create</button>
        </form>

        <h3>Channels</h3>
        {/*iteramos todas las salas, y las mostramos una a una */}
        {rooms.map(renderRooms)}

        <h3>New Rooms</h3>
        {roomsUsers.length === 0 ? null : roomsUsers.map(renderRoomsPrograming)}

        {/*iteramos todos los usuarios, para mostrarle especificamente
                quien eres por si hay nombres repetidos */}
        <h3>All Users</h3>
        {props.allUsers.map(renderUser)}
      </SideBar>
      <ChatPanel>
        <ChannelInfo>
          {/*muestra el nombre del chat actual en donde te encuentres */}
          {props.currentChat.chatName}
        </ChannelInfo>
        <BodyContainer>
          {/*esta definida si te quieres unir a una sala o solo chatear */}
          {body}
        </BodyContainer>
        <TextBox
          /*handleMessageChange se encarga de guardar el mensaje,
                    message es el contenido del mensaje, 
                    handleKeyPress se encarga de enviar el mensaje */
          value={props.message}
          onChange={props.handleMessageChange}
          onKeyPress={handleKeyPress}
          placeholder="say something"
        ></TextBox>
      </ChatPanel>
    </Container>
  );
};

export default Chat;

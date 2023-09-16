#!/usr/bin/env bun
import { v4 as uuidv4 } from 'uuid';

interface WSMessage {
  action: string,
  payload: WSUserInfo & WSCursorPosition & WSResult
}
interface WSUserInfo {
  username: string,
  password: string,
  room: string
}
interface WSCursorPosition { // action "cpu"
  x: number,
  y: number
}
interface WSResult { // action: "result"
  forAction: string,
  result: boolean, 
  msg: string,
}
interface UserState {
  username: string,
  room: string,
}

let userState = new Map<string, UserState>;

Bun.serve({
  fetch(req, server) {
    // upgrade the request to a WebSocket
    if (server.upgrade(req, {
      data: {
        uuid: uuidv4(),
      },
    })) {

      return; // do not return a Response
    }
    return new Response("Websockets only", { status: 500 });
  },
  websocket: {
     async message(ws,message) {
      let msg: WSMessage = JSON.parse(message.toString());      
      switch (msg.action) {
        case "login":
          let userinfo: WSUserInfo = msg.payload;
          console.log(userinfo.username + " attempted to login");
          if (userinfo.username === "admin" && userinfo.password === "password" && userinfo.room) {
            console.log(userinfo.username + " logged in");
            ws.send(JSON.stringify({
              action: "result",
              payload: {
                forAction: "login",
                result: true,
                // @ts-ignore
                msg: ws.data.uuid,
              } as WSResult
            } as WSMessage));
            // @ts-ignore
            userState.set(ws.data.uuid, {
              username: userinfo.username,
              room: userinfo.room,
            } as UserState)
          } else {
            console.log(userinfo.username + " failed to login");
            ws.send(JSON.stringify({
              action: "result",
              payload: {
                result: false,
                msg: "Username/password incorrect, or room missing",
              } as WSResult
            } as WSMessage));
            ws.close();
          }
      }
      // ws.send("msg.applism");
      // console.log(msg);
    }
  },
});

#!/usr/bin/env bun
import { ServerWebSocket } from 'bun';
import { stat } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
const openai = new OpenAI({});


interface WSMessage {
  action: string,
  payload: WSUserInfo & WSResult & WSBroadcast & WSAiComplete
}
interface WSUserInfo {
  username: string,
  password: string,
  room: string
}

interface WSResult { // action: "result"
  forAction: string,
  result: boolean, 
  msg: any,
}
interface WSServerData {
  uuid: string,
}
interface WSBroadcast {
  data: string,
}
interface WSAiComplete { // action: "ai-complete"
  model: string,
  prompt: string,
}

interface UserState {
  username: string,
  room: string,
  ws: ServerWebSocket<WSServerData>,
}

let userState = new Map<string, UserState>;

function userLoggedIn(username: string) { // Returns userState if user exists
  for (let [key, value] of userState) {
    if (value.username === username) {
      return value;
    }
  }
}

function getRoomUsers(room: string) {
  let users: UserState[] = [];
  for (let [key, value] of userState) {
    if (value.room === room) {
      users.push(value);
      // console.log(room);
    }
  }
  return users;
}

function roomBroadcast(room: string, data: WSMessage, username: string) {
  let users = getRoomUsers(room);
  for (let user of users) {
    if (user.username !== username) {
      user.ws.send(JSON.stringify(data));
    }
  }
}

function getRooms() { //Returns a list of all active rooms
  let rooms: string[] = [];
  for (let [key, value] of userState) {
    if (!rooms.includes(value.room)) {
      rooms.push(value.room);
    }
  }
  return rooms;
}

Bun.serve({
  fetch(req, server) {
    // upgrade the request to a WebSocket
    if (server.upgrade(req, {
      data: {
        uuid: uuidv4(),
      },
    })) {
      console.log("connection:", req.headers.get("host"));
      return; // do not return a Response
    }
    return new Response("Websockets only", { status: 500 });
  },
  websocket: {
     async message(ws: ServerWebSocket<WSServerData>,message) {
      let msg: WSMessage = JSON.parse(message.toString());
      switch (msg.action) {
        case "login": {
          const userinfo: WSUserInfo = msg.payload;  
          if ((userinfo.username === "sesh" && userinfo.password === "password" && userinfo.room) || (userinfo.username === "aron" && userinfo.password === "password1")) {
            let existingUser = userLoggedIn(userinfo.username);
            if (existingUser) {
              existingUser.ws.send(JSON.stringify({
                action: "result",
                payload: {
                  forAction: "login",
                  result: false,
                  msg: "You logged in elsewhere.",
                } as WSResult
              } as WSMessage));
              existingUser.ws.close();  
            }
            console.log(userinfo.username  + " logged in");
            ws.send(JSON.stringify({
              action: "result",
              payload: {
                forAction: "login",
                result: true,
                msg: ws.data.uuid,
              } as WSResult
            } as WSMessage));
            userState.set(ws.data.uuid, {
              username: userinfo.username,
              room: userinfo.room,
              ws,
            } as UserState)
          } else {
            console.log(userinfo.username + " failed to login");
            ws.send(JSON.stringify({
              action: "result",
              payload: {
                forAction: "login",
                result: false,
                msg: "Username/password incorrect, or room missing",
              } as WSResult
            } as WSMessage));
            ws.close();
          }
        } break;
        case "broadcast": {
          const state = userState.get(ws.data.uuid);
          if (state) { // if user is logged in
            roomBroadcast(state.room, msg, state.username);
            console.log(msg.payload);
          }
        } break;
        case "ai-complete": {
          const payload : WSAiComplete = msg.payload;
          const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: payload.prompt }],
            model: payload.model,
          });
          console.log("ew AI", completion)
          ws.send(JSON.stringify({
            action: "result",
            payload: {
              forAction: "ai-complete",
              result: true,
              msg: completion
            } as WSResult
          } as WSMessage))
        } break;
        case "get-room-details": {
          const state = userState.get(ws.data.uuid);
          if (state) {
            let users = getRoomUsers(state.room);

            ws.send(JSON.stringify({
              action: "result",
              payload: {
                forAction: "get-room-details",
                result: true,
                msg: users,
              } as WSResult
            } as WSMessage))
          }
        } break;
        case "get-all-rooms": {
          ws.send(JSON.stringify({
            action: "result",
            payload: {
              forAction: "get-all-rooms",
              result: true,
              msg: getRooms()
            } as WSResult
          } as WSMessage))
        } break;
      }
      // ws.send("msg.applism");
      // console.log(msg);
    },
    close(ws) {
      console.log(ws.data.uuid + " / " + userState.get(ws.data.uuid)?.username + " disconnected");
      userState.delete(ws.data.uuid);
      
    }
  },
});

#!/usr/bin/env bun
import { ServerWebSocket, password } from 'bun';
import { v4 as uuidv4 } from 'uuid';
import OpenAI from 'openai';
const openai = new OpenAI({});
import { Client } from 'pg';
import { APIResource } from 'openai/core.mjs';
const client = new Client()
await client.connect()
import express from 'express'
const app = express()
const port = 3001
// Webhook server for Github
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Hello World!');
})
app.post('/webhook/:id', async (req, res) => {
  console.log('webhook recieved');
  let promptBody;
  try {
    const sqlres = await client.query('SELECT * FROM saved_prompts WHERE uuid = $1', [req.params.id]);
    console.log(req.params.id);
    console.log(req.body.commits[0].modified[0]);
    const changedFile = await fetch(`https://raw.githubusercontent.com/espisesh-hacks/northhacking2023-penguin/main/${req.body.commits[0].modified[0]}`);
    promptBody = await changedFile.text(); // HTML string
    res.send(sqlres.rows[0].prompt);
    let mergedPrompt = sqlres.rows[0].prompt + "\n" + promptBody;
    // console.log(mergedPrompt);
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: mergedPrompt }],
      model: sqlres.rows[0].model,
    });
    const response = await fetch("http://edu.applism.ca:3002", {
      method: "POST",
      body: JSON.stringify({ message: completion.choices[0].message.content }),
      headers: { "Content-Type": "application/json" },
  });
  console.log(completion.choices[0].message.content);
  const body = await response.json();
  } catch(err) {
    console.log("Postgres error:", err);
    res.send("Error finding prompt.");
  }  
  
}) 
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

try {
  const res = await client.query('SELECT * FROM credentials WHERE username = \'aron\'');
  console.log(res.rows);
} catch(err) {
  console.log("Postgres error:", err);
}
interface WSMessage { // all Websocket messages use the interface WSMessage
  action: string,
  payload: WSUserInfo & WSResult & WSBroadcast & WSAiComplete & WSSavePrompt & WSDeletePrompt
}
interface WSUserInfo { // Determined on login, used to create Map userState
  username: string,
  password: string,
  room: string
}

interface WSResult { // action: "result"
  forAction: string,
  result: boolean, 
  msg: any,
}
interface WSServerData { // for ServerWebSocket
  uuid: string,
}
interface WSBroadcast { // action: "broadcast"
  data: string,
}
interface WSAiComplete { // action: "ai-complete"
  model: string,
  prompt: string,
}
interface WSSavePrompt { // action: "save-prompt"
  prompt: string,
  model: string,
}
interface WSDeletePrompt { // action "delete-prompt"
  uuid: string,
}
interface UserState { // used in userState Map
  username: string,
  room: string,
  ws: ServerWebSocket<WSServerData>,
}

let userState = new Map<string, UserState>; // Map of UUID to user information
let credentials = new Map<string, string>; // Usernames and passwords


function userLoggedIn(username: string) { // Returns userState if user exists
  for (let [key, value] of userState) {
    if (value.username === username) {
      return value;
    }
  }
}

function getRoomUsers(room: string) { // returns an array of userStates in the same room
  let users: UserState[] = [];
  for (let [key, value] of userState) {
    if (value.room === room) {
      users.push(value);
      // console.log(room);
    }
  }
  return users;
}

// Function redirects data from one user in a room, to all the others
function roomBroadcast(room: string, data: WSMessage, username: string) {
  let users = getRoomUsers(room);
  for (let user of users) {
    if (user.username !== username) { // Does not send to sender
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

// Main Function

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
    const url = new URL(req.url);
    switch (url.pathname) {
      case "/test": {
        return new Response("hello");
      }
      default: {
        return new Response("404 not found :(", { status: 404 });
      }
    }
  },
  websocket: {
     async message(ws: ServerWebSocket<WSServerData>,message) {
      let msg: WSMessage = JSON.parse(message.toString());
      switch (msg.action) {
        case "login": {
          const userinfo: WSUserInfo = msg.payload;  
          let pass;
          try {
            const res = await client.query('SELECT * FROM credentials WHERE username = $1', [userinfo.username]);
            pass = res.rows[0].password;
            console.log(userinfo.username, pass);
            console.log('hi')
          } catch(err) {
            console.log("Postgres error:", err);
          }
          
          if ((userinfo.password === pass)) {
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
            // console.log(msg.payload);
          }
        } break;
        case "ai-complete": {
          const payload : WSAiComplete = msg.payload;
          try {
          const completion = await openai.chat.completions.create({
            messages: [{ role: 'user', content: payload.prompt }],
            model: payload.model,
          });
          console.log("ew AI", completion)
          console.log("test", completion.choices[0].message.content) // Print response directly
          let airesult = {
            action: "result",
            payload: {
              forAction: "ai-complete",
              result: true,
              msg: completion.choices[0].message.content,
            } as WSResult
          } as WSMessage
          ws.send(JSON.stringify(airesult));
          roomBroadcast(userState.get(ws.data.uuid)?.room!, airesult, userState.get(ws.data.uuid)?.username!);
          // Add to Postgres list
          try {
            const res = await client.query('INSERT INTO prompts(prompt, model, room) VALUES($1, $2, $3)', [payload.prompt, payload.model, userState.get(ws.data.uuid)?.room]);
            console.log('adding ', payload.prompt, ' to', userState.get(ws.data.uuid)?.room);
          } catch(err) {
            console.log("Postgres error:", err);
          }
        } catch(err) { // AI Generation has failed :(
          console.log("AI Gen Error: ", err);
          ws.send(JSON.stringify({
            action: "result",
            payload: {
              forAction: "ai-complete",
              result: false,
              msg: "AI Generation has failed. "  + JSON.stringify(err)
            } as WSResult
          }as WSMessage))
        }
        } break;
        case "save-prompt": { // takes in a Prompt and Model, then returns the associated Database UUID
          const prompt = msg.payload.prompt;
          const model = msg.payload.model;
          const uuid = uuidv4();
          try {
            const res = await client.query('INSERT INTO saved_prompts(prompt, model, room, uuid) VALUES($1, $2, $3, $4)', [prompt, model, userState.get(ws.data.uuid)?.room, uuid]);
            console.log('adding ', prompt, ' to', userState.get(ws.data.uuid)?.room);
          } catch(err) {
            console.log("Postgres error:", err);
          }
          ws.send(JSON.stringify({
            action: "result",
            payload: {
              forAction: "save-prompt",
              result: true,
              msg: uuid
            } as WSResult
          } as WSMessage))
        } break;
        case "delete-prompt": {
          const uuid = msg.payload.uuid;
          let res;
          try {
            res = await client.query('DELETE FROM saved_prompts WHERE uuid = $1', [uuid]);
            console.log("deleting saved-prompt item: ", res);
            ws.send(JSON.stringify({
              action: "result",
              payload: {
                forAction: "delete-prompt",
                result: true,
                msg: "Deleted Prompt."
              } as WSResult
            } as WSMessage))
          } catch(err) {
            console.log("Postgres error:", err);
            ws.send(JSON.stringify({
              action: "result",
              payload: {
                forAction: "delete-prompt",
                result: false,
                msg: "Failed to delete Prompt."
              } as WSResult
            }as WSMessage))
          }
        } break;
        case "get-saved-prompts": {
          let res;
          try {
            res = await client.query('SELECT * FROM saved_prompts WHERE room = $1', [userState.get(ws.data.uuid)?.room]);
            console.log("sending saved-prompt list: ", res);
          } catch(err) {
            console.log("Postgres error:", err);
          }
          ws.send(JSON.stringify({
            action: "result",
            payload: {
              forAction: "get-saved-prompts",
              result: true,
              msg: res?.rows
            } as WSResult
          } as WSMessage))
        } break;
        case "get-prompts": {
          let res;
          try {
            res = await client.query('SELECT * FROM prompts WHERE room = $1', [userState.get(ws.data.uuid)?.room]);
            console.log("sending prompt list: ", res);
          } catch(err) {
            console.log("Postgres error:", err);
          }
          ws.send(JSON.stringify({
            action: "result",
            payload: {
              forAction: "get-prompts",
              result: true,
              msg: res?.rows
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

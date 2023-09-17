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
// Serveur de webhook pour Github
app.use(express.json());
app.get('/', (req, res) => {
  res.send('Bonjour le monde!');
})
app.post('/webhook/:id', async (req, res) => {
  console.log('webhook reçu');
  let promptBody;
  try {
    const sqlres = await client.query('SELECT * FROM saved_prompts WHERE uuid = $1', [req.params.id]);
    console.log(req.params.id);
    console.log(req.body.commits[0].modified[0]);
    const changedFile = await fetch(`https://raw.githubusercontent.com/espisesh-hacks/northhacking2023-penguin/main/${req.body.commits[0].modified[0]}`);
    promptBody = await changedFile.text(); // Chaîne HTML
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
    console.log("Erreur de Postgres:", err);
    res.send("Erreur lors de la recherche de la prompte.");
  }  
  
}) 
app.listen(port, () => {
  console.log(`Exemple d'application en écoute sur le port ${port}`)
})

try {
  const res = await client.query('SELECT * FROM credentials WHERE username = \'aron\'');
  console.log(res.rows);
} catch(err) {
  console.log("Erreur de Postgres:", err);
}
interface WSMessage { // tous les messages WebSocket utilisent l'interface WSMessage
  action: string,
  payload: WSUserInfo & WSResult & WSBroadcast & WSAiComplete & WSSavePrompt & WSDeletePrompt
}
interface WSUserInfo { // Déterminé à la connexion, utilisé pour créer une Map avec des informations sur l'utilisateur
  username: string,
  password: string,
  room: string
}

interface WSResult { // action: "result"
  forAction: string,
  result: boolean, 
  msg: any,
}
interface WSServerData { // pour ServerWebSocket
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
interface UserState { // utilisé dans la Map userState
  username: string,
  room: string,
  ws: ServerWebSocket<WSServerData>,
}

let userState = new Map<string, UserState>; // Map du UUID aux informations sur l'utilisateur
let credentials = new Map<string, string>; // Noms d'utilisateur et mots de passe


function userLoggedIn(username: string) { // Renvoie userState si l'utilisateur existe
  for (let [key, value] of userState) {
    if (value.username === username) {
      return value;
    }
  }
}

function getRoomUsers(room: string) { // renvoie un tableau de userStates dans la même salle
  let users: UserState[] = [];
  for (let [key, value] of userState) {
    if (value.room === room) {
      users.push(value);
      // console.log(room);
    }
  }
  return users;
}

// Fonction de redirection des données d'un utilisateur dans une salle, vers tous les autres utilisateurs
function roomBroadcast(room: string, data: WSMessage, username: string) {
  let users = getRoomUsers(room);
  for (let user of users) {
    if (user.username !== username) { // Ne pas envoyer à l'expéditeur
      user.ws.send(JSON.stringify(data));
    }
  }
}

function getRooms() { // Renvoie une liste de toutes les salles actives
  let rooms: string[] = [];
  for (let [key, value] of userState) {
    if (!rooms.includes(value.room)) {
      rooms.push(value.room);
    }
  }
  return rooms;
}

// Fonction principale

Bun.serve({
  fetch(req, server) {
    // passer à un WebSocket
    if (server.upgrade(req, {
      data: {
        uuid: uuidv4(),
      },
    })) {
      console.log("connexion:", req.headers.get("host"));
      return; // ne pas renvoyer de réponse
    }
    const url = new URL(req.url);
    switch (url.pathname) {
      case "/test": {
        return new Response("bonjour");
      }
      default: {
        return new Response("404 introuvable :(", { status: 404 });
      }
    }
  },
  websocket: {
     async message(ws: ServerWebSocket<WSServerData>,message) {
      let msg: WSMessage = JSON.parse(message.toString());
      switch (msg.action) {
        case "login": {
          const userinfo: WSUserInfo = msg.payload;
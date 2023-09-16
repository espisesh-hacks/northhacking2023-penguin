#!/usr/bin/env bun
Bun.serve({
  fetch(req, server) {
    // upgrade the request to a WebSocket
    if (server.upgrade(req)) {
      return; // do not return a Response
    }
    return new Response("Websockets only", { status: 500 });
  },
  websocket: {
    message(ws,message) {
      let msg = JSON.parse(message.toString());
      switch (msg.action) {
        case "login":
          let userinfo = msg.payload;
          console.log(userinfo.username + " attempted to login");
          if (userinfo.username === "admin" && userinfo.password === "password") {
            console.log(userinfo.username + " logged in");
            ws.send("logged in!");
          } else {
            console.log(userinfo.username + " failed to login");
            ws.send("username or password was incorrect.")
          }
      }
      // ws.send("msg.applism");
      // console.log(msg);
      ws.close();
    }
  },
});

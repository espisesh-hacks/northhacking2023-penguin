#!/usr//bin/env bun
import { marked } from 'marked';
import express from 'express';
const app = express();
const port = 3002;
const path = "./README.md";
const header = `<!DOCTYPE html>
<html>

  <style>
  body {
  font: 1.0rem Inconsolata, monospace;
  }
  </style>
  <head>
    <title>Collabi AI Studio</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/sakura.css/css/sakura.css" type="text/css">
  </head>
  <body>`
const footer = `</body>
</html>`
app.use(express.json());
app.get('/', async (req, res) => {
    let file = Bun.file(path);
    let text = await file.text();
    res.send(header + marked.parse(text) + footer);
  })
app.post('/', async (req, res) => {
    console.log(req.body.message);
    await Bun.write(path, req.body.message);
})
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
  
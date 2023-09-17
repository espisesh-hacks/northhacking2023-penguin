> The Following ReadMe was created with help of GPT-3 using Collabi AI Studio
# Collabi AI Studio

Collabi AI Studio is a collaborative platform designed to enhance brainstorming and prompt sharing among users. Built during Hack The North 2023, this application allows users to work on LLM (Language Model) prompts together in real-time. Additionally, it enables users to insert the developed prompts seamlessly into a DevOps pipeline using webhooks.
                                                                                                                        
![Collabi AI Studio Screenshot](screenshot.png)
## Features
- **Real-time Collaboration**: Multiple users can simultaneously work on LLM prompts, making brainstorming more efficient and engaging.
- **Prompt Sharing**: Users can easily share prompts with their team members, promoting knowledge exchange and idea generation.
- **DevOps Integration**: Collabi AI Studio seamlessly integrates with DevOps pipelines through webhooks, enabling prompt insertion for further development and deployment.
- **User-Friendly Interface**: The intuitive and responsive user interface makes navigation and collaboration effortless.
                                                                                                                        
## How to Use

### Prerequisites
- [Bun](https://bun.sh)
- Expo
### Installation
1. Clone the repository.
```bash
git clone https://github.com/espisesh-hacks/northhacking2023-penguin.git
```
2. Install required dependencies.
```bash
cd northhacking2023-penguin/backend
bun install
```

3. Create a `.env` file at the root of the project directory and add the following environment variables:
```bash
OPENAI_API_KEY==<OpenAI_Key>
PGUSER=<PostGres_User>
PGHOST=<PostGres_ServerIP>
PGDATABASE=collabi
PGPORT=<PostGres_-_port>```

4. Start the server.
```bash
bun run index.ts
```

5. The Backend server is now runnign at: `http://localhost:3000`.

### Adding Collaborators

1. Share your custom room ID with your team members (e.g., `collabi-devs`)

2. Once they have joined the session, you can see their cursors and edits in real time.

### Inserting Prompts into DevOps Pipeline
1. Configure a webhook URL to your DevOps pipeline.

2. Choose or create a project in Collabi AI Studio.

3. Select the desired prompt and click the **Insert into Pipeline** button.

4. Confirm the insertion by clicking the **Submit** button.

## Technologies Used

- Bun JS
- Express.js
- CockroachDB
- Expo
- Webhooks

## Contributing

Collabi AI Studio is an open-source project, and contributions are always welcome! If you have any suggestions, bug repo
rts, or feature requests, please submit an issue or open a pull request.

## Authors

- Aron Ravikumar
- Seshan Ravikumar

## License

This project is licensed under the GNU AGPL License. See the [LICENSE](LICENSE) file for more details..
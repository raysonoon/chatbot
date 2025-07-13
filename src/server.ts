import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// use the `.env` file
dotenv.config();

// create web server
const server = express();
const port = 3000;

// get api key
const googleAiStudioApiKey = process.env['GOOGLE_AI_STUDIO_API_KEY'];

if (!googleAiStudioApiKey) {
  throw new Error('Provide GOOGLE_AI_STUDIO_API_KEY in a .env file');
}

// create chat session
const genAI = new GoogleGenerativeAI(googleAiStudioApiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
const chat = model.startChat();

// parse bodies as strings and allow requests from all origins
server.use(express.text());
server.use(cors());

// start the server on port 3000
server.listen(port, () => {
  console.log('Server is running on port', port);
});

// create /message POST endpoint
server.post('/message', async (req, res) => {
  const prompt: string = req.body;
  const result = await chat.sendMessageStream(prompt);

  for await (const partialMessage of result.stream) {
    res.write(partialMessage.text());
  }

  res.end();
});
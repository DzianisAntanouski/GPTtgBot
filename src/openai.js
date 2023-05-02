import { Configuration, OpenAIApi } from "openai";
import config from "config";
import { createReadStream, createWriteStream } from "fs";
import axios from "axios";

class OpenAI {
    roles = {
        ASSIS: "assistant",
        USER: "user",
        SYS: "system",
    };
    constructor(apiKey) {
        const configuration = new Configuration({
            apiKey,
        });
        this.openai = new OpenAIApi(configuration);
    }

    async chat(messages) {
        try {
            const response = await this.openai.createChatCompletion({
                model: "gpt-3.5-turbo",
                messages,
            });
            return response.data.choices[0].message;
        } catch (error) {
            console.log("Err while GPT chat", error.message);
        }
    }

    async transcription(filepath) {
        try {
            const response = await this.openai.createTranscription(createReadStream(filepath), "whisper-1");
            return response.data.text;
        } catch (error) {
            console.log("Err while transcription", error.message);
        }
    }

    async getJpg(prompt) {
        try {
            const response = await axios({
                method: "post",
                url: "https://api.openai.com/v1/images/generations",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${config.get("OPENAI_KEY")}`,
                },
                data: {
                    model: "image-alpha-001",
                    prompt: prompt,
                    num_images: 1,
                    size: "256x256",
                    response_format: "url",
                },
            });
            const imageUrl = response.data.data[0].url;
            return await axios({
                method: "get",
                url: imageUrl,
                responseType: "stream",
            });
        } catch (error) {
            console.log(error.message)
        }
    }
}

export const openai = new OpenAI(config.get("OPENAI_KEY"));

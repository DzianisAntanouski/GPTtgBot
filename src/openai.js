import { Configuration, OpenAIApi } from 'openai'
import config from 'config'
import { createReadStream } from 'fs'

class OpenAI {
    roles = {
        ASSIS: 'assistant',
        USER: 'user',
        SYS: 'system',
    }
    constructor(apiKey) {
        const configuration = new Configuration({
            apiKey,
          });
          this.openai = new OpenAIApi(configuration);
    }

    async chat(messages) {
        try {
            const response = await this.openai.createChatCompletion({
                model: 'gpt-3.5-turbo',
                messages
            })
            return response.data.choices[0].message
        } catch (error) {
            console.log("Err while GPT chat", error.message)
        }
    }

    async transcription(filepath) {
        try {
            const response = await this.openai.createTranscription(createReadStream(filepath), 'whisper-1')
            return response.data.text
        } catch (error) {
            console.log("Err while transcription", error.message)
        }
    }
}

export const openai = new OpenAI(config.get('OPENAI_KEY'))
import { Prompt } from '@/types'
import OpenAI from 'openai'

const systemPrompt = `
You are a brainstorm generator for any idea that user asks.
You have to answer a list of ideas and make the respective corrections that are requested of you.
`.trim()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function wrapperWriteList<T extends (value: string[]) => void>(resolve: T) {
  const writeList = (params: any) => {
    const list: string[] = []
    try {
      list.push(...JSON.parse(params).list)
    } catch (err) {
      return `Error to parse JSON: ${err}`
    }

    console.log('AI:', list)

    resolve(list)

    return 'Done'
  }

  return writeList
}

export default function callAI(messages: Prompt[]) {
  const promise = new Promise<string[]>((resolve, reject) => {
    openai.beta.chat.completions
      .runTools({
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        model: 'gpt-4o-mini',
        // tool_choice: 'required',
        tools: [
          {
            type: 'function',
            function: {
              name: 'write-list',
              function: wrapperWriteList(resolve),
              description: 'Allow you to write the list of ideas',
              parameters: {
                type: 'object',
                properties: {
                  list: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        ],
      })
      .on('error', (error) => {
        console.error('Error to call the runner:', error)
        reject()
      })
  })

  return promise
}

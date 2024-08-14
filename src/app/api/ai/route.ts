import callAI from '@/lib/ai'
import { AI, Prompt, schema } from '@/types'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  let ai: AI = {} as any

  try {
    const data = await request.json()
    console.debug('raw data:', data)
    ai = await schema.validate(data, { abortEarly: false })
  } catch (err) {
    console.error(err)
    return NextResponse.json({
      error: 'Bad data format',
      err: (err as any).toString(),
    })
  }

  console.log('ai data:', ai)

  const userBlock = `
  I want you to generate 10 ideas around the suggested topic. You must write them in Spanish.

  Topic:
  """
  ${ai.topic}
  """
  `.trim()

  const prompts: Prompt[] = [{ role: 'user', content: userBlock }]

  ai.histories.forEach((history) => {
    prompts.push({
      role: 'assistant',
      content: history.ideas.map((idea) => `- ${idea}`).join('\n'),
    })

    const feedbackBlock = history.feedbacks
      .map((line) => `${line}\n`)
      .join('- ')

    const feedbackPrompt = `
Of all the ideas you have generated, the user has found the following text fragments interesting. Use these as feedback and improve the generated ideas according to the user's new preferences and ignore the rest. Add new things never suggested before:

Fragments interesting:
"""
${feedbackBlock}
"""

If there are no snippets, use the suggested ideas to generate new ideas because the user has not liked any of them.
`.trim()

    prompts.push({ role: 'system', content: feedbackPrompt })
  })

  console.log(prompts)

  const newIdeas = await callAI(prompts)

  return NextResponse.json({ ok: true, ideas: newIdeas })
}

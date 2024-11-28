import OpenAI from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import starterCode from './starter-code.js?raw';

export default async function runExplainer() {
  const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
  });

  const LineExplanation = z.object({
    lineNumber: z.number(),
    code: z.string(),
    explanation: z.string()
  })

  const BlockExplanation = z.object({
    startLine: z.number(),
    endLine: z.number(),
    codeLines: z.array(z.string()),
    explanation: z.string()
  })

  const CodeExplanation = z.object({
    lineExplanations: z.array(LineExplanation),
    blockExplanations: z.array(BlockExplanation)
  })

  const completion = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: "You are a helpful programming assistant. Your goal is to \
                analyze the code that is provided and respond with explanations for the code that match \
                the requested granularity. For high level explanations, try to understand the goal of \
                the program and the task acomplished by a section of code and use that in your explanations" },
      { role: 'user', content: "Explain the following React code line by line:\n\n" + starterCode },
    ],
    response_format: zodResponseFormat(CodeExplanation, 'explanation'),
  });

  const explanation = completion.choices[0].message.parsed;
  console.log(explanation)
}

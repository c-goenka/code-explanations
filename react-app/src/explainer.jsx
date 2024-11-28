import OpenAI from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import starterCode from './starter-code.js?raw';

function getCached(key) {
  // if item is in cache, return it. otherwise, return null
  return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)) : null;
}

function setCached(key, value) {
  // set item in cache
  localStorage.setItem(key, JSON.stringify(value));
}

export default async function runExplainer(code) {
  console.log("Running explainer");
  if (getCached(code)) {
    console.log("Using cached explanation", getCached(code));
    return getCached(code);
  }
  
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
      { role: 'user', content: "Explain the following React code line by line; for ease of \
                numbering, each line in the code is prefixed with a line number in the format L1234, \
                DO NOT INCLUDE THIS IN THE CODE OR EXPLANATION, but do use this number as the\
                line number.\n\n" + code.split('\n').map((line, i) => `L${i+1}${line}`).join('\n') },
    ],
    response_format: zodResponseFormat(CodeExplanation, 'explanation'),
  });

  const explanation = completion.choices[0].message.parsed;
  setCached(code, explanation);
  console.log(explanation)
  return explanation;
}

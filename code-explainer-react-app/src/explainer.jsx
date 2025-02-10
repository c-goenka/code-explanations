import OpenAI from 'openai';
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";

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

  const DataFlowExplanation = z.object({
    paramName: z.string(),
    explanation: z.string(),
    functionDefinitionLineNumber: z.number(),
    occurrences: z.array(z.object({
      lineNumber: z.number(),
      explanation: z.string()
    }))
  });

  const CodeExplanation = z.object({
    lineExplanations: z.array(LineExplanation),
    blockExplanations: z.array(BlockExplanation),
    dataFlowExplanations: z.array(DataFlowExplanation)
  })

  const messages = [
    {
      role: 'system',
      content: 'You are a helpful programming assistant. Your goal is to analyze the provided code and respond with explanations that match the requested granularity.'
    },
    {
      role: 'user',
      content: 'Part 1: LINE-BY-LINE EXPLANATIONS. \
        Provide a line-by-line explanation of the code. Start each explanation with 2-4 words that succinctly summarize the purpose of the line and can function independently. Ensure the few words encapsulate the essence of the line of code, while providing context for the full explanation. Follow that with text explaning the entire line, making sure to be clear of its specific use. Use the format: [2-4 WORD SUMMARY] : [FULL EXPLANATION]'
    },
    {
      role: 'user',
      content: 'Part 2: BLOCKWISE EXPLANATIONS.\
                Divide the code into logical blocks. For each block, provide a high-level summary that includes:\
                - What the block does.\
                - How it achieves its functionality.\
                - Its Inputs: the key data, variables, or components used.\
                - Its Outputs: the results or changes produced.\
                - Its Process: a concise description of the steps followed.'
    },
    {
      role: 'user',
      content: 'Part 3: DATA FLOW EXPLANATIONS.\
                Analyze all function definitions in the code.\
                For every function parameter, provide the following details:\
                1. The name of the parameter.\
                2. A high-level explanation of the parameter\'s purpose and how it is used in the overall code (from the function definition).\
                3. The line number where the parameter is defined.\
                4. Every single occurrence of the parameter in the code—outside its definition, including cases where the parameter is passed in to a different function or is used in indexing, property accesses, arithmetic operations, or any other context-aware usage—provide:\
                    - the line number where this occurrence appears.\
                    - a context-aware explanation for that specific occurrence.'
    },
    {
      role: 'user',
      content: "For ease of numbering, each line in the code is prefixed with a line number in the format L1234,\
                DO NOT INCLUDE THIS IN THE CODE OR EXPLANATION, but do use this number as the line number.\n\n"
                + code.split('\n').map((line, i) => `L${i+1} ${line}`).join('\n')
    }
  ];

  const completion = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini',
    temperature: 0.3,
    messages,
    response_format: zodResponseFormat(CodeExplanation, 'explanation'),
  });

  const explanation = completion.choices[0].message.parsed;
  setCached(code, explanation);
  console.log(explanation)
  return explanation;
}

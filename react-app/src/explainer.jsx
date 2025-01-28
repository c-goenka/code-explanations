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
    references: z.array(z.object({
      lineNumber: z.number(),
      startChar: z.number(),
      endChar: z.number()
    }))
  })

  const CodeExplanation = z.object({
    lineExplanations: z.array(LineExplanation),
    blockExplanations: z.array(BlockExplanation),
    dataFlowExplanations: z.array(DataFlowExplanation)
  })

  const completion = await openai.beta.chat.completions.parse({
    model: 'gpt-4o-mini',
    temperature: 0.5,
    messages: [
      { role: 'system', content: "You are a helpful programming assistant. Your goal is to analyze \
                                  the provided code and respond with explanations that match the requested \
                                  granularity. For high-level explanations, focus on the goal of the program \
                                  and the task accomplished by sections of code then use that in the explanations \
                                  that you will provide." },

      { role: 'user', content: "Explain the following React code line by line, blockwise (blocks for code performing a particular task), and using a data flow analysis for function parameters. \
                                ONLY FOR BLOCK EXPLANATIONS, provide a high-level summary of what the block does, how it achieves its functionality, and include details about its Inputs: The key data, variables, or components the block uses, Outputs: The results or changes produced by the block, and Process: A concise description of the steps the block follows to achieve its purpose. \
                                ONLY FOR LINE EXPLANATIONS, start each explanations with two words that succinctly summarize the idea and can function independently. Ensure the two words encapsulate the essence of the line of code while providing context for the full explanation. \
                                ONLY FOR DATA FLOW EXPLANATIONS: DO THIS FOR ALL FUNCTION PARAMETERS PRESENT IN THE FILE. Select the parameters present in each function definition. Summarize and explain the purpose of the parameter and how its being used. Also, find every occurence of that varible in the code and provide the corresponding line number, starting character number, and ending character number. \
                                For ease of numbering, each line in the code is prefixed with a line number in the format L1234, DO NOT INCLUDE THIS IN THE CODE OR EXPLANATION, but do use this number as the line number.\n\n" + code.split('\n').map((line, i) => `L${i+1}${line}`).join('\n') },
    ],
    response_format: zodResponseFormat(CodeExplanation, 'explanation'),
  });

  const explanation = completion.choices[0].message.parsed;
  setCached(code, explanation);
  console.log(explanation)
  return explanation;
}

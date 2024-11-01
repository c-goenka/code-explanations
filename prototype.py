from pydantic import BaseModel
from openai import OpenAI

client = OpenAI()

file_path = "./test-code-1.txt"
with open(file_path, 'r') as file:
    code = file.read()

class LineExplanation(BaseModel):
  lineNumber: int
  code: str
  explanation: str

class BlockExplanation(BaseModel):
  startLine: int
  endLine: int
  codeLines: list[str]
  explanation: str

class CodeExplanation(BaseModel):
  lineExplanations: list[LineExplanation]
  blockExplanations: list[BlockExplanation]

def get_code_explanations(code_snippet):
    completion = client.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful programming assistant. Your goal is to \
                analyze the code that is provided and respond with explanations for the code that match \
                the requested granularity. For high level explanations, try to understand the goal of \
                the program and the task acomplished by a section of code and use that in your explanations"},
            {"role": "user", "content": "Explain the following React code line by line:\n\n" + code_snippet},
        ],
        response_format=CodeExplanation,
    )
    return completion.choices[0].message.parsed

explanation_text = get_code_explanations(code)
print(explanation_text)

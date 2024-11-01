from openai import OpenAI
import re

client = OpenAI()

file_path = "./test-code-1.txt"

with open(file_path, 'r') as file:
    code = file.read()

code_lines = {i+1: line for i, line in enumerate(code.splitlines())}

def get_code_explanations(code_snippet):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful programming assistant. Your goal is to \
             analyze the code that is provided and respond with explanations for the code that match \
             the requested granularity. Give the corresponding individual or grouped line numbers. \
             Do not return any of the code. For high level explanations, try to understand the goal of \
             the program and the task acomplished by a section of code and use that in your explanations"},
            {
                "role": "user",
                "content": "Explain the following React code line by line:\n\n" + code_snippet
            }
        ]
    )
    explanation = response.choices[0].message.content
    return explanation

explanation_text = get_code_explanations(code)

line_dict = {}
e = explanation_text.splitlines()
for line in e:
    if len(line.split(':')) == 2:
        p1, p2 = line.split(':')
        if re.findall(r".*Lines? (\d+)-(\d+)", p1):
            line_dict[re.findall(r".*Lines? (\d+)-(\d+)", p1)[0]] = p2
        elif re.findall(r".*Lines? (\d+)", p1):
            line_dict[re.findall(r".*Lines? (\d+)", p1)[0]] = p2

for key in line_dict.keys():
    if type(key) == str:
        print('*' * 10)
        print(code_lines[int(key)])
        print('*' * 10)
        print(line_dict[key])
        print()
    else:
        start, end = int(key[0]), int(key[1])
        print('*' * 10)
        for i in range(start, end+1):
            print(code_lines[i])
        print('*' * 10)
        print(line_dict[key])
        print()

import os

import groq

client = groq.AsyncClient(api_key=os.getenv("GROQ_API_KEY"))

SYS_PROMPT = """
You are a helpful assistant for a community platform called 'SGEN'
SGEN is a platform where users can create and join communities, participate in events, and interact with other members. 
You will be given a conversation history between a user and the assistant. 
The user may ask questions about the platform, how to use it, or any other related topic. 
Your task is to provide accurate and helpful responses based on the conversation history and your knowledge of the platform. If you don't know the answer to a question, it's okay to say you don't know.

Information:
To find a community, you can look it up by 
"""

async def get_response(messages: list):
    messages = messages.insert(0, {"role": "system", "content": "You are a helpful assistant for a community platform called 'Communities'. You will be given a conversation history between a user and the assistant. The user may ask questions about the platform, how to use it, or any other related topic. Your task is to provide accurate and helpful responses based on the conversation history and your knowledge of the platform. If you don't know the answer to a question, it's okay to say you don't know."})
    chat = await client.chat.completions.create(model="openai/gpt-oss-120b",
                                         messages=messages,
                                         max_completion_tokens=3000)
    return chat.choices[0].message.content
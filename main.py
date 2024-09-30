from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel
from jnugpt import handle_query

app = FastAPI()
templates = Jinja2Templates(directory="templates")
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def read_root(request: Request):
    return templates.TemplateResponse("chat.html", {"request": request})

class Query(BaseModel):
    question: str


@app.post("/query/")
async def post_query(query: Query):
    try:
        # 질문을 처리하고 답변을 반환
        answer = await handle_query(query.question)
        return {"answer": answer}
    except Exception as e:
        # 오류 처리
        raise HTTPException(status_code=500, detail=str(e))

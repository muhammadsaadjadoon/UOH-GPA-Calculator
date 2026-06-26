import base64, os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Optional
app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
SCALE = [
    (85,100,"A",4.00),
    (80,84,"A-",3.50),
    (75,79,"B+",3.00),
    (70,74,"B",2.50),
    (65,69,"B-",2.00),
    (60,64,"C+",1.50),
    (55,59,"C",1.00),
    (50,54,"D",0.50),
    (0,49,"F",0.00)
]
def get_grade(marks):
    if 85 <= marks <= 100:
        return "A", 4.00

    elif 80 <= marks <= 84:
        return "A-", round(3.50 + ((marks - 80) * 0.10), 2)

    elif 75 <= marks <= 79:
        return "B+", round(3.00 + ((marks - 75) * 0.10), 2)

    elif 70 <= marks <= 74:
        return "B", round(2.50 + ((marks - 70) * 0.10), 2)

    elif 65 <= marks <= 69:
        return "B-", round(2.00 + ((marks - 65) * 0.10), 2)

    elif 60 <= marks <= 64:
        return "C+", round(1.50 + ((marks - 60) * 0.10), 2)

    elif 55 <= marks <= 59:
        return "C", round(1.00 + ((marks - 55) * 0.10), 2)

    elif 50 <= marks <= 54:
        return "D", round(0.50 + ((marks - 50) * 0.10), 2)

    return "F", 0.00
def gpa_to_letter(gpa):
    for _,_,l,p in SCALE:
        if p<=gpa: return l
    return "F"
class Subject(BaseModel):
    name: Optional[str]="Subject"
    marks: float=Field(...,ge=0,le=100)
    credit_hours: float=Field(...,gt=0,le=6)
class Semester(BaseModel):
    name: Optional[str]="Semester"
    gpa: float=Field(...,ge=0,le=4)
    credit_hours: float=Field(...,gt=0,le=30)
class GPAReq(BaseModel):
    subjects: List[Subject]
class CGPAReq(BaseModel):
    semesters: List[Semester]
@app.post("/calculate-gpa")
def calc_gpa(req: GPAReq):
    if not req.subjects: raise HTTPException(400,"No subjects")
    tQ=tC=0
    details=[]
    for s in req.subjects:
        l,p = get_grade(s.marks)
        qp = p*s.credit_hours
        tQ+=qp; tC+=s.credit_hours
        details.append({"name":s.name,"marks":s.marks,"credit_hours":s.credit_hours,
                         "grade":l,"points":p,"quality_points":round(qp,2)})
    gpa=round(tQ/tC,2) if tC else 0
    return {"gpa":gpa,"letter":gpa_to_letter(gpa),"total_credits":tC,
            "total_quality_points":round(tQ,2),"subjects":details,
            "passed":all(d["grade"]!="F" for d in details)}
@app.post("/calculate-cgpa")
def calc_cgpa(req: CGPAReq):
    if not req.semesters: raise HTTPException(400,"No semesters")
    tQ=tC=0
    details=[]
    for s in req.semesters:
        qp=s.gpa*s.credit_hours
        tQ+=qp; tC+=s.credit_hours
        details.append({"name":s.name,"gpa":s.gpa,"credit_hours":s.credit_hours,
                         "letter":gpa_to_letter(s.gpa),"quality_points":round(qp,2)})
    cgpa=round(tQ/tC,2) if tC else 0
    return {"cgpa":cgpa,"letter":gpa_to_letter(cgpa),"total_credits":tC,
            "total_quality_points":round(tQ,2),"semesters":details}
@app.get("/grading-scale")
def grading_scale():
    return [{"range":f"{lo}-{hi}","grade":l,"points":p} for lo,hi,l,p in SCALE]
@app.get("/logo")
def logo():
    for f in ["logo.png","logo.jpg","logo_png.jpg"]:
        if os.path.exists(f):
            with open(f,"rb") as img:
                enc=base64.b64encode(img.read()).decode()
            return {"logo":f"data:image/png;base64,{enc}"}
    return {"logo":""}
@app.get("/health")
def health(): return {"status":"ok","version":"2.0"}
@app.get("/")
def root(): return FileResponse("index.html")
if __name__=="__main__":
    import uvicorn
    uvicorn.run("main:app",host="0.0.0.0",port=int(os.environ.get("PORT",5000)))
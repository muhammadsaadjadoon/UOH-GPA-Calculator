# 🎓 UoH GPA Calculator

<p align="center">
  <img src="static/logo.png.jpg" alt="UoH GPA Calculator Logo" width="120">
</p>

<h3 align="center">A modern GPA, CGPA, and academic planning calculator for University of Haripur students</h3>

<p align="center">
  <a href="https://uoh-gpa-calculator-dt4u.onrender.com/"><strong>🚀 Live Demo</strong></a>
  ·
  <a href="#-screenshots">Screenshots</a>
  ·
  <a href="#-features">Features</a>
  ·
  <a href="#-installation--setup">Setup</a>
  ·
  <a href="#-api-endpoints">API</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-blue?style=for-the-badge&logo=python" alt="Python">
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi" alt="FastAPI">
  <img src="https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge&logo=render" alt="Render">
  <img src="https://img.shields.io/badge/Status-Live-success?style=for-the-badge" alt="Status">
</p>

---

## 📌 Project Overview

**UoH GPA Calculator** is a clean, responsive, and student-friendly web application designed to help students of the **University of Haripur** calculate, track, and plan their academic performance.

The application allows students to calculate semester **GPA**, cumulative **CGPA**, convert marks into grades, view grading scale mapping, save result history locally, and use academic planning tools such as **Target Finder** and **What-If Simulator**.

This project is built with a **FastAPI Python backend** and a modern responsive frontend using **HTML, CSS, and JavaScript**. It is fully deployed on **Render** and available online.

🔗 **Live Demo:**
https://uoh-gpa-calculator-dt4u.onrender.com/

---

## 🎯 Purpose of the Project

Many students calculate GPA and CGPA manually, which can easily lead to mistakes because GPA calculation depends on:

* Marks obtained in each subject
* Grade point conversion
* Credit hours of each subject
* Weighted quality points
* Semester-wise CGPA calculation

This project solves that problem by providing a simple and accurate web-based calculator where students can enter their academic data and instantly get their GPA, CGPA, grade letters, grade points, and academic status.

---

## ✨ Features

### ✅ GPA Calculator

Calculate semester GPA by entering:

* Subject name
* Marks obtained
* Credit hours

The system automatically calculates:

* Grade letter
* Grade points
* Quality points
* Total credit hours
* Final GPA
* Pass/fail status

---

### ✅ CGPA Calculator

Calculate cumulative CGPA by entering semester-wise data:

* Semester name
* Semester GPA
* Semester credit hours

The system calculates weighted CGPA using credit hours.

---

### ✅ Target Finder

The **Target Finder** helps students plan their academic goals.

Students can select a goal such as:

* Dean's List
* Good Standing
* Academic Improvement Target

The tool helps estimate the marks or performance level required to achieve the selected academic goal.

---

### ✅ What-If Simulator

The **What-If Simulator** allows students to plan future semesters.

Students can enter:

* Current CGPA
* Completed credit hours
* Remaining credit hours
* Target CGPA

The system estimates the GPA required in future semesters to reach the desired CGPA.

---

### ✅ Marks-to-Grade Converter

The calculator includes a grading system that converts marks into:

* Grade letter
* Grade points
* Academic performance level

This helps students quickly understand how their marks affect GPA.

---

### ✅ Grading Scale Mapping

A clear grading scale is included inside the application so students can easily view the relationship between:

* Marks range
* Grade letter
* Grade points

---

### ✅ Result History

The application includes a local result history layout so students can review previous calculations.

History is stored locally in the browser, which means:

* No login required
* No database required
* No personal academic data is sent to a third-party database

---

### ✅ Responsive UI

The interface is designed to work smoothly on:

* Desktop screens
* Laptops
* Tablets
* Mobile phones

---

### ✅ FastAPI Backend

The backend provides clean API endpoints for:

* GPA calculation
* CGPA calculation
* Grading scale
* Health check
* API documentation

FastAPI also provides automatic Swagger documentation at:

```text
/docs
```

---

## 🛠️ Tech Stack

| Category        | Technology                    |
| --------------- | ----------------------------- |
| Backend         | Python                        |
| Web Framework   | FastAPI                       |
| Server          | Uvicorn ASGI Server           |
| Data Validation | Pydantic                      |
| Frontend        | HTML, CSS, JavaScript         |
| Styling         | Custom CSS, Responsive Layout |
| Storage         | Browser Local Storage         |
| Deployment      | Render                        |
| API Docs        | Swagger UI / FastAPI Docs     |

---

## 🧠 Calculation Logic

### GPA Formula

```text
GPA = Total Quality Points / Total Credit Hours
```

Where:

```text
Quality Points = Grade Points × Credit Hours
```

Example:

```text
Subject Marks = 85
Grade Point = 4.00
Credit Hours = 3

Quality Points = 4.00 × 3 = 12.00
```

---

### CGPA Formula

```text
CGPA = Sum of Semester Quality Points / Sum of Semester Credit Hours
```

Where:

```text
Semester Quality Points = Semester GPA × Semester Credit Hours
```

---

## 📊 Grading Scale

The project uses a UoH/HEC-style grading scale.

| Marks Range | Grade | Grade Points |
| ----------- | ----: | -----------: |
| 85 - 100    |     A |         4.00 |
| 80 - 84     |    A- |  3.50 - 3.90 |
| 75 - 79     |    B+ |  3.00 - 3.40 |
| 70 - 74     |     B |  2.50 - 2.90 |
| 65 - 69     |    B- |  2.00 - 2.40 |
| 60 - 64     |    C+ |  1.50 - 1.90 |
| 55 - 59     |     C |  1.00 - 1.40 |
| 50 - 54     |     D |  0.50 - 0.90 |
| 0 - 49      |     F |         0.00 |

> Note: Grading rules can vary by department or university policy. The grading logic can be adjusted from the backend file if required.

---

## 📸 Screenshots

### Main Dashboard

<img width="1600" height="755" alt="Screenshot 2026-06-30 223301" src="https://github.com/user-attachments/assets/f285b03b-bc77-489f-b1c7-b1844bf1b6a9" />

---

### Main Dashboard on Iphone
<img width="873" height="1600" alt="WhatsApp Image 2026-06-30 at 10 38 02 PM" src="https://github.com/user-attachments/assets/3a9d16e5-9605-4abe-8df9-010f32c690b8" />

---

### Main Dashboard on Android
<img width="1080" height="2284" alt="WhatsApp Image 2026-06-30 at 10 38 57 PM" src="https://github.com/user-attachments/assets/e6800f9d-f9a1-40a6-ac7b-d8c0a6ecd579" />

---

### Grading Scale Mapping

<img width="1600" height="765" alt="Screenshot 2026-06-30 223321" src="https://github.com/user-attachments/assets/511ed0df-eb2e-419b-bb09-092b9a7dcbe5" />

---

### Result History

<img width="1600" height="757" alt="Screenshot 2026-06-30 223339" src="https://github.com/user-attachments/assets/e3f3ac50-0987-4f7c-b5cc-515f2bade504" />

---

### What-If Simulator

<img width="1600" height="755" alt="Screenshot 2026-06-30 223400" src="https://github.com/user-attachments/assets/e2b1b96a-ea2e-42a9-9dc7-e0cb4f2b5b9f" />

---

### Target Finder

<img width="1600" height="757" alt="Screenshot 2026-06-30 223419" src="https://github.com/user-attachments/assets/4716eb3a-6026-465f-aeae-dc497988ffd1" />

---

## 📁 Project Structure

```text
UoH-GPA-Calculator/
│
├── main.py                  # FastAPI backend application
├── requirements.txt          # Python dependencies
├── runtime.txt               # Python runtime version for deployment
├── Procfile                  # Render start command
├── render.yaml               # Render deployment configuration
├── Dockerfile                # Optional Docker deployment file
├── .dockerignore             # Docker ignore file
├── .gitignore                # Git ignored files
├── README.md                 # Project documentation
├── COMMANDS.md               # Useful project commands
├── DEPLOYMENT.md             # Deployment guide
├── PROJECT_REPORT.md         # Academic project report
│
├── static/
│   └── logo.png.jpg          # Project logo/static assets
│
├── templates/
│   └── index.html            # Main frontend interface
│
└── tests/
    └── test_api.py           # API test cases
```

---

## 🚀 Installation & Setup

Follow these steps to run the project locally.

---

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/uoh-gpa-calculator.git
```

```bash
cd uoh-gpa-calculator
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

### 2. Create Virtual Environment

#### Windows

```bash
python -m venv venv
```

#### Mac/Linux

```bash
python3 -m venv venv
```

---

### 3. Activate Virtual Environment

#### Windows CMD

```cmd
venv\Scripts\activate
```

#### Windows PowerShell

```powershell
venv\Scripts\Activate.ps1
```

#### Mac/Linux

```bash
source venv/bin/activate
```

---

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 5. Run the Application Locally

```bash
uvicorn main:app --reload
```

Now open this URL in your browser:

```text
http://127.0.0.1:8000
```

---

## 🌐 Useful Local URLs

| Purpose           | URL                                   |
| ----------------- | ------------------------------------- |
| Main App          | `http://127.0.0.1:8000`               |
| API Docs          | `http://127.0.0.1:8000/docs`          |
| Health Check      | `http://127.0.0.1:8000/health`        |
| Grading Scale API | `http://127.0.0.1:8000/grading-scale` |

---

## 🔌 API Endpoints

| Method | Endpoint          | Description                       |
| ------ | ----------------- | --------------------------------- |
| GET    | `/`               | Serves the main web application   |
| GET    | `/health`         | Returns application health status |
| GET    | `/logo`           | Serves project logo               |
| GET    | `/grading-scale`  | Returns grading scale data        |
| POST   | `/calculate-gpa`  | Calculates GPA from subjects      |
| POST   | `/calculate-cgpa` | Calculates CGPA from semesters    |

---

## 📤 GPA API Example

### Request

```http
POST /calculate-gpa
Content-Type: application/json
```

```json
{
  "subjects": [
    {
      "name": "Artificial Intelligence",
      "marks": 88,
      "credit_hours": 3
    },
    {
      "name": "Database Systems",
      "marks": 76,
      "credit_hours": 3
    }
  ]
}
```

### Response

```json
{
  "gpa": 3.7,
  "letter": "A-",
  "total_credits": 6,
  "total_quality_points": 22.2,
  "subjects": [
    {
      "name": "Artificial Intelligence",
      "marks": 88,
      "credit_hours": 3,
      "grade": "A",
      "points": 4.0,
      "quality_points": 12.0
    },
    {
      "name": "Database Systems",
      "marks": 76,
      "credit_hours": 3,
      "grade": "B+",
      "points": 3.1,
      "quality_points": 9.3
    }
  ],
  "passed": true
}
```

---

## 📤 CGPA API Example

### Request

```http
POST /calculate-cgpa
Content-Type: application/json
```

```json
{
  "semesters": [
    {
      "name": "Semester 1",
      "gpa": 3.2,
      "credit_hours": 18
    },
    {
      "name": "Semester 2",
      "gpa": 3.6,
      "credit_hours": 18
    }
  ]
}
```

### Response

```json
{
  "cgpa": 3.4,
  "letter": "A-",
  "total_credits": 36,
  "total_quality_points": 122.4,
  "semesters": [
    {
      "name": "Semester 1",
      "gpa": 3.2,
      "credit_hours": 18,
      "letter": "B+",
      "quality_points": 57.6
    },
    {
      "name": "Semester 2",
      "gpa": 3.6,
      "credit_hours": 18,
      "letter": "A-",
      "quality_points": 64.8
    }
  ]
}
```

---

## 🧪 Testing

If you want to run the API tests, install test dependencies first:

```bash
pip install pytest httpx
```

Then run:

```bash
pytest
```

---

## ☁️ Deployment on Render

This project is ready to deploy on **Render**.

### Render Settings

| Setting           | Value                                          |
| ----------------- | ---------------------------------------------- |
| Service Type      | Web Service                                    |
| Language          | Python                                         |
| Branch            | `main`                                         |
| Build Command     | `pip install -r requirements.txt`              |
| Start Command     | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Health Check Path | `/health`                                      |

---

### Manual Render Deployment Steps

1. Push your code to GitHub.
2. Open your Render dashboard.
3. Click **New +**.
4. Select **Web Service**.
5. Connect your GitHub repository.
6. Select the repository.
7. Add the build and start commands.
8. Click **Create Web Service**.
9. Wait for deployment to complete.
10. Open the live Render URL.

---

## 🧾 GitHub Push Commands

Use these commands when pushing the project to GitHub for the first time:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit: UoH GPA Calculator"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/YOUR_USERNAME/uoh-gpa-calculator.git
```

```bash
git push -u origin main
```

---

## 🔐 Data Privacy

This project does not require user login and does not store student data on a server database.

Result history is stored in the user's browser local storage, which keeps the project lightweight and privacy-friendly.

---

## ⚙️ Environment Variables

No custom environment variables are required for local development.

For Render deployment, the platform automatically provides the `$PORT` variable used in the start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

---

## 🧩 Future Improvements

Planned or possible future improvements:

* PDF result export
* Dark mode
* Student profile-based saved history
* Department-wise grading scale options
* Semester planner dashboard
* GPA trend charts
* Authentication system
* Admin panel for grading policy updates

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

To contribute:

1. Fork the repository.
2. Create a new branch.

```bash
git checkout -b feature/your-feature-name
```

3. Make your changes.
4. Commit your changes.

```bash
git commit -m "Add new feature"
```

5. Push to your branch.

```bash
git push origin feature/your-feature-name
```

6. Open a pull request.

---

## 📄 License

This project is open-source and can be used for learning, academic, and educational purposes.

You may add an MIT License file if you want to make the repository formally open-source.

---

## 👨‍💻 Author

**Muhammad Saad Jadoon**
BS Artificial Intelligence
IT Student at University of Haripur

---

## ⭐ Support

If this project helps you, please consider giving the repository a star.

Your support helps improve and grow student-focused academic tools.

---

## 🔎 Keywords

```text
UoH GPA Calculator, University of Haripur GPA Calculator, CGPA Calculator Pakistan, HEC GPA Calculator, FastAPI GPA Calculator, Python GPA Calculator, Student Academic Planner, GPA Target Finder, CGPA What-If Simulator
```

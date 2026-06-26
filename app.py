from flask import Flask, request, jsonify
app = Flask(__name__)
def calculate_gpa(subjects):
    total_marks = 0
    total_credits = 0
    for sub in subjects:
        marks = sub.get("marks", 0)
        credit = sub.get("credit_hours", 1)
        # Example conversion: percentage to 4.0 scale
        gpa = (marks / 100) * 4
        total_marks += gpa * credit
        total_credits += credit
    return total_marks / total_credits if total_credits else 0
def calculate_cgpa(semesters):
    total_points = 0
    total_credits = 0
    for sem in semesters:
        gpa = sem.get("gpa", 0)
        credit = sem.get("credit_hours", 1)
        total_points += gpa * credit
        total_credits += credit
    return total_points / total_credits if total_credits else 0
@app.route("/calculate-gpa", methods=["POST"])
def gpa():
    data = request.json
    result = calculate_gpa(data.get("subjects", []))
    return jsonify({"result": result})
@app.route("/calculate-cgpa", methods=["POST"])
def cgpa():
    data = request.json
    result = calculate_cgpa(data.get("semesters", []))
    return jsonify({"result": result})
if __name__ == "__main__":
    app.run(debug=True)

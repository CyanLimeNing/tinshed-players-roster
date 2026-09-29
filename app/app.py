from flask import Flask, request, jsonify

app = Flask(__name__)

# ========== In‑memory data store ==========
volunteers = []
productions = []
performances = []
assignments = []

next_volunteer_id = 1
next_production_id = 1
next_performance_id = 1
next_assignment_id = 1

# reset for pytest
def reset_data():
    global volunteers, productions, performances, assignments
    global next_volunteer_id, next_production_id, next_performance_id, next_assignment_id
    volunteers.clear()
    productions.clear()
    performances.clear()
    assignments.clear()
    next_volunteer_id = 1
    next_production_id = 1
    next_performance_id = 1
    next_assignment_id = 1

# ========== Volunteer CRUD ==========
@app.route("/volunteers", methods=["GET"])
def get_all_volunteers():
    return jsonify(volunteers)

@app.route("/volunteers", methods=["POST"])
def create_volunteer():
    global next_volunteer_id
    data = request.get_json()
    new_v = {
        "id": next_volunteer_id,
        "name": data.get("name"),
        "contact": data.get("contact"),
        "is_active": True
    }
    volunteers.append(new_v)
    next_volunteer_id += 1
    return jsonify(new_v), 201

@app.route("/volunteers/<int:vid>", methods=["GET"])
def get_volunteer(vid):
    v = next((x for x in volunteers if x["id"] == vid), None)
    if not v:
        return jsonify({"message": "Volunteer not found"}), 404
    return jsonify(v)

@app.route("/volunteers/<int:vid>", methods=["PUT"])
def update_volunteer(vid):
    v = next((x for x in volunteers if x["id"] == vid), None)
    if not v:
        return jsonify({"message": "Volunteer not found"}), 404
    data = request.get_json()
    v["name"] = data.get("name", v["name"])
    v["contact"] = data.get("contact", v["contact"])
    v["is_active"] = data.get("is_active", v["is_active"])
    return jsonify(v)

@app.route("/volunteers/<int:vid>", methods=["DELETE"])
def delete_volunteer(vid):
    global volunteers
    v = next((x for x in volunteers if x["id"] == vid), None)
    if not v:
        return jsonify({"message": "Volunteer not found"}),404
    volunteers = [x for x in volunteers if x["id"] != vid]
    return jsonify({"message":"Volunteer deleted"})

# ========== Production（剧目）CRUD ==========
@app.route("/productions", methods=["GET"])
def get_all_productions():
    return jsonify(productions)

@app.route("/productions", methods=["POST"])
def create_production():
    global next_production_id
    data = request.get_json()
    prod = {
        "id": next_production_id,
        "title": data.get("title")
    }
    productions.append(prod)
    next_production_id +=1
    return jsonify(prod),201

@app.route("/productions/<int:pid>", methods=["GET"])
def get_production(pid):
    p = next((x for x in productions if x["id"]==pid), None)
    if not p:
        return jsonify({"message":"Production not found"}),404
    return jsonify(p)

@app.route("/productions/<int:pid>", methods=["PUT"])
def update_production(pid):
    p = next((x for x in productions if x["id"]==pid), None)
    if not p:
        return jsonify({"message":"Production not found"}),404
    data = request.get_json()
    p["title"] = data.get("title", p["title"])
    return jsonify(p)

@app.route("/productions/<int:pid>", methods=["DELETE"])
def delete_production(pid):
    global productions
    p = next((x for x in productions if x["id"]==pid), None)
    if not p:
        return jsonify({"message":"Production not found"}),404
    productions = [x for x in productions if x["id"] != pid]
    return jsonify({"message":"Production deleted"})

# ========== Performance（单场演出）CRUD ==========
@app.route("/performances", methods=["GET"])
def get_all_performances():
    return jsonify(performances)

@app.route("/performances", methods=["POST"])
def create_performance():
    global next_performance_id
    data = request.get_json()
    perf = {
        "id": next_performance_id,
        "production_id": data.get("production_id"),
        "show_date": data.get("show_date"),
        "start_time": data.get("start_time")
    }
    performances.append(perf)
    next_performance_id +=1
    return jsonify(perf),201

@app.route("/performances/<int:pfid>", methods=["GET"])
def get_performance(pfid):
    pf = next((x for x in performances if x["id"]==pfid), None)
    if not pf:
        return jsonify({"message":"Performance not found"}),404
    return jsonify(pf)

# ========== Assignment 岗位分配【核心业务校验在这里】 ==========
@app.route("/assignments", methods=["GET"])
def get_all_assignments():
    return jsonify(assignments)

@app.route("/assignments", methods=["POST"])
def create_assignment():
    global next_assignment_id
    data = request.get_json()
    volunteer_id = data.get("volunteer_id")
    performance_id = data.get("performance_id")
    role = data.get("role")

    # 业务规则：同一个志愿者，同一场演出，不能重复分配岗位
    conflict = any(
        a["volunteer_id"] == volunteer_id and a["performance_id"] == performance_id
        for a in assignments
    )
    if conflict:
        return jsonify({"error":"Rule violation: One volunteer cannot hold multiple roles for same performance"}),400

    new_a = {
        "id": next_assignment_id,
        "volunteer_id": volunteer_id,
        "performance_id": performance_id,
        "role": role,
        "confirmed": False
    }
    assignments.append(new_a)
    next_assignment_id += 1
    return jsonify(new_a),201

@app.route("/assignments/<int:aid>", methods=["PUT"])
def update_assignment(aid):
    a = next((x for x in assignments if x["id"]==aid), None)
    if not a:
        return jsonify({"message":"Assignment not found"}),404
    data = request.get_json()
    a["role"] = data.get("role", a["role"])
    a["confirmed"] = data.get("confirmed", a["confirmed"])
    return jsonify(a)

@app.route("/assignments/<int:aid>", methods=["DELETE"])
def delete_assignment(aid):
    global assignments
    a = next((x for x in assignments if x["id"]==aid), None)
    if not a:
        return jsonify({"message":"Assignment not found"}),404
    assignments = [x for x in assignments if x["id"] != aid]
    return jsonify({"message":"Assignment removed"})


if __name__ == "__main__":
    app.run(debug=True)

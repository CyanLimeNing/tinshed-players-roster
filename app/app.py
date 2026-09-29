from flask import Flask, request, jsonify

app = Flask(__name__)
volunteers = []
next_id = 1

@app.route('/volunteers', methods=['GET'])
def get_all():
    return jsonify(volunteers)

@app.route('/volunteers/<int:vid>', methods=['GET'])
def get_one(vid):
    item = next((v for v in volunteers if v["id"] == vid), None)
    if not item:
        return jsonify({"msg":"not found"}),404
    return jsonify(item)

@app.route('/volunteers', methods=['POST'])
def create():
    global next_id
    data = request.get_json()
    new_item = {
        "id": next_id,
        "name": data["name"],
        "role": data["role"],
        "contact": data["contact"]
    }
    volunteers.append(new_item)
    next_id += 1
    return jsonify(new_item), 201

@app.route('/volunteers/<int:vid>', methods=['PUT'])
def update(vid):
    item = next((v for v in volunteers if v["id"] == vid), None)
    if not item:
        return jsonify({"msg":"not found"}),404
    data = request.get_json()
    item["name"] = data["name"]
    item["role"] = data["role"]
    item["contact"] = data["contact"]
    return jsonify(item)

@app.route('/volunteers/<int:vid>', methods=['DELETE'])
def delete(vid):
    global volunteers
    item = next((v for v in volunteers if v["id"] == vid), None)
    if not item:
        return jsonify({"msg":"not found"}),404
    volunteers = [v for v in volunteers if v["id"] != vid]
    return jsonify({"msg":"deleted"})

# 新增：供pytest重置数据
def reset_data():
    global volunteers, next_id
    volunteers = []
    next_id = 1

if __name__ == '__main__':
    app.run(debug=True)

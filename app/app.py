from flask import Flask, request, jsonify

app = Flask(__name__)

# In-memory volunteer data storage (for demo purpose, no database)
volunteers = []

# Get all volunteer records
@app.route('/volunteers', methods=['GET'])
def get_all_volunteers():
    return jsonify(volunteers)

# Create a new volunteer record
@app.route('/volunteers', methods=['POST'])
def add_volunteer():
    data = request.get_json()
    new_volunteer = {
        "id": len(volunteers) + 1,
        "name": data.get("name"),
        "role": data.get("role"),
        "contact": data.get("contact")
    }
    volunteers.append(new_volunteer)
    return jsonify(new_volunteer), 201

# Get single volunteer by ID
@app.route('/volunteers/<int:vid>', methods=['GET'])
def get_volunteer(vid):
    for volunteer in volunteers:
        if volunteer["id"] == vid:
            return jsonify(volunteer)
    return jsonify({"message": "Volunteer not found"}), 404

# Update volunteer information by ID
@app.route('/volunteers/<int:vid>', methods=['PUT'])
def update_volunteer(vid):
    data = request.get_json()
    for volunteer in volunteers:
        if volunteer["id"] == vid:
            volunteer["name"] = data.get("name", volunteer["name"])
            volunteer["role"] = data.get("role", volunteer["role"])
            volunteer["contact"] = data.get("contact", volunteer["contact"])
            return jsonify(volunteer)
    return jsonify({"message": "Volunteer not found"}), 404

# Delete volunteer record by ID
@app.route('/volunteers/<int:vid>', methods=['DELETE'])
def delete_volunteer(vid):
    global volunteers
    for volunteer in volunteers:
        if volunteer["id"] == vid:
            volunteers = [item for item in volunteers if item["id"] != vid]
            return jsonify({"message": "Deleted successfully"})
    return jsonify({"message": "Volunteer not found"}), 404

if __name__ == "__main__":
    app.run(debug=True)

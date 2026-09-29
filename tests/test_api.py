import pytest
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_get_empty_volunteers(client):
    response = client.get('/volunteers')
    assert response.status_code == 200
    assert response.get_json() == []

def test_create_volunteer(client):
    payload = {
        "name": "Alice Smith",
        "role": "Event Coordinator",
        "contact": "alice@example.com"
    }
    response = client.post('/volunteers', json=payload)
    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "Alice Smith"

def test_get_single_volunteer(client):
    payload = {"name": "Bob Brown", "role": "Helper", "contact": "bob@example.com"}
    client.post('/volunteers', json=payload)
    response = client.get('/volunteers/1')
    assert response.status_code == 200
    assert response.get_json()["name"] == "Bob Brown"

def test_update_volunteer(client):
    client.post('/volunteers', json={"name": "Charlie", "role": "Volunteer", "contact": "charlie@example.com"})
    update_payload = {"name": "Charlie Updated"}
    response = client.put('/volunteers/1', json=update_payload)
    assert response.status_code == 200
    assert response.get_json()["name"] == "Charlie Updated"

def test_delete_volunteer(client):
    client.post('/volunteers', json={"name": "David", "role": "Driver", "contact": "david@example.com"})
    response = client.delete('/volunteers/1')
    assert response.status_code == 200
    get_response = client.get('/volunteers/1')
    assert get_response.status_code == 404

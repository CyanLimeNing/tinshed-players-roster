import pytest
from app import app
from app.app import reset_data

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        reset_data()  # 每个测试用例执行前清空数据！
        yield client

def test_get_all_volunteer(client):
    payload = {"name": "Alice Smith", "role": "Manager", "contact": "alice@example.com"}
    client.post('/volunteers', json=payload)
    response = client.get('/volunteers')
    assert response.status_code == 200
    assert len(response.get_json()) == 1

def test_get_single_volunteer(client):
    payload = {"name": "Bob Brown", "role": "Helper", "contact": "bob@example.com"}
    client.post('/volunteers', json=payload)
    response = client.get('/volunteers/1')
    assert response.status_code == 200
    assert response.get_json()["name"] == "Bob Brown"

def test_create_volunteer(client):
    payload = {"name": "Charlie", "role": "Tester", "contact": "charlie@example.com"}
    response = client.post('/volunteers', json=payload)
    assert response.status_code == 201
    assert response.get_json()["name"] == "Charlie"

def test_update_volunteer(client):
    payload = {"name": "Dave", "role": "Worker", "contact": "dave@example.com"}
    client.post('/volunteers', json=payload)
    update_payload = {"name": "Dave Updated", "role": "Worker", "contact": "dave@example.com"}
    response = client.put('/volunteers/1', json=update_payload)
    assert response.get_json()["name"] == "Dave Updated"

def test_delete_volunteer(client):
    payload = {"name": "Eve", "role": "Admin", "contact": "eve@example.com"}
    client.post('/volunteers', json=payload)
    response = client.delete('/volunteers/1')
    assert response.status_code == 200
    get_resp = client.get('/volunteers/1')
    assert get_resp.status_code == 404

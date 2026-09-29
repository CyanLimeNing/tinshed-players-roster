import pytest
from app import app
from app.app import reset_data

@pytest.fixture
def client():
    app.config["TESTING"] = True
    reset_data()
    with app.test_client() as c:
        yield c

# Volunteer tests
def test_create_and_get_volunteer(client):
    payload = {"name":"Alice Smith","contact":"alice@example.com"}
    resp = client.post("/volunteers", json=payload)
    assert resp.status_code ==201
    data = resp.get_json()
    assert data["name"] == "Alice Smith"

def test_get_all_volunteers(client):
    client.post("/volunteers", json={"name":"Bob","contact":"bob@test.com"})
    r = client.get("/volunteers")
    assert len(r.get_json()) ==1

# Production tests
def test_create_production(client):
    r = client.post("/productions", json={"title":"The Weather House"})
    assert r.status_code == 201
    assert r.get_json()["title"] == "The Weather House"

# Performance tests
def test_create_performance(client):
    prod_resp = client.post("/productions", json={"title":"Show A"})
    pid = prod_resp.get_json()["id"]
    perf_payload = {"production_id":pid,"show_date":"2026‑09‑05","start_time":"19:30"}
    res = client.post("/performances", json=perf_payload)
    assert res.status_code ==201

# Assignment 普通分配
def test_create_assignment(client):
    v = client.post("/volunteers",json={"name":"Col","contact":"col@test.com"}).get_json()
    p = client.post("/productions",json={"title":"Show"}).get_json()
    pf = client.post("/performances",json={"production_id":p["id"],"show_date":"2026‑09‑05","start_time":"19:30"}).get_json()
    assign_payload = {"volunteer_id":v["id"],"performance_id":pf["id"],"role":"Stage Manager"}
    r = client.post("/assignments", json=assign_payload)
    assert r.status_code ==201

# ✅【作业硬性要求】业务规则测试：同一志愿者不能分配同一场演出两个岗位
def test_prevent_duplicate_volunteer_same_performance(client):
    v = client.post("/volunteers",json={"name":"Marion","contact":"marion@test.com"}).get_json()
    p = client.post("/productions",json={"title":"The Weather House"}).get_json()
    pf = client.post("/performances",json={"production_id":p["id"],"show_date":"2026‑09‑05","start_time":"19:30"}).get_json()
    # 第一次分配，成功
    payload1 = {"volunteer_id":v["id"],"performance_id":pf["id"],"role":"Box Office"}
    client.post("/assignments", json=payload1)
    # 第二次给同一个志愿者+同一场演出分配另外角色，应当返回400拒绝
    payload2 = {"volunteer_id":v["id"],"performance_id":pf["id"],"role":"Usher"}
    resp2 = client.post("/assignments", json=payload2)
    assert resp2.status_code ==400
    assert "Rule violation" in resp2.get_json()["error"]

from app import db
from app.models import Order, Product


def test_catalog_and_filter(client):
    response = client.get("/api/products?category=running")
    assert response.status_code == 200
    assert [item["slug"] for item in response.json["products"]] == ["test-runner"]
    assert client.get("/api/products?category=training").json["products"] == []


def test_order_uses_server_price_and_reduces_stock(client):
    response = client.post("/api/orders", json={"customer_name": "Ana Torres", "customer_email": "ana@example.com", "items": [{"product_id": 1, "size": 39, "quantity": 2, "price_cop": 1}]})
    assert response.status_code == 201
    assert response.json["order"]["total_cop"] == 200000
    assert db.session.get(Product, 1).stock == 1
    assert Order.query.count() == 1


def test_rejects_bad_size_without_changing_stock(client):
    response = client.post("/api/orders", json={"customer_name": "Ana Torres", "customer_email": "ana@example.com", "items": [{"product_id": 1, "size": 45, "quantity": 1}]})
    assert response.status_code == 400
    assert db.session.get(Product, 1).stock == 3


def test_rejects_insufficient_stock(client):
    response = client.post("/api/orders", json={"customer_name": "Ana Torres", "customer_email": "ana@example.com", "items": [{"product_id": 1, "size": 39, "quantity": 4}]})
    assert response.status_code == 409
    assert db.session.get(Product, 1).stock == 3


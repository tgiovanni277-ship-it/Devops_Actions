import re
import secrets
from flask import Blueprint, jsonify, request
from sqlalchemy import update
from . import db
from .models import Order, OrderItem, Product

api = Blueprint("api", __name__)


def error(message, status=400):
    return jsonify(error=message), status


@api.get("/products")
def list_products():
    query = Product.query
    category = request.args.get("category", "").strip().lower()
    search = request.args.get("q", "").strip()
    if category and category != "todos":
        query = query.filter(db.func.lower(Product.category) == category)
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    return jsonify(products=[product.to_dict() for product in query.order_by(Product.id).all()])


@api.get("/products/<slug>")
def get_product(slug):
    product = Product.query.filter_by(slug=slug).first()
    if product is None:
        return error("Producto no encontrado", 404)
    return jsonify(product=product.to_dict())


@api.post("/orders")
def create_order():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return error("Envía un objeto JSON")
    name = str(payload.get("customer_name", "")).strip()
    email = str(payload.get("customer_email", "")).strip().lower()
    items = payload.get("items")
    if len(name) < 2 or len(name) > 120:
        return error("Ingresa un nombre válido")
    if len(email) > 180 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        return error("Ingresa un correo válido")
    if not isinstance(items, list) or not 1 <= len(items) <= 20:
        return error("Agrega al menos un producto")

    normalized = {}
    for item in items:
        if not isinstance(item, dict):
            return error("Producto inválido")
        product_id, size, quantity = item.get("product_id"), item.get("size"), item.get("quantity")
        if not all(type(value) is int for value in (product_id, size, quantity)) or quantity < 1 or quantity > 10:
            return error("Talla o cantidad inválida")
        key = (product_id, size)
        normalized[key] = normalized.get(key, 0) + quantity
        if normalized[key] > 10:
            return error("Máximo 10 unidades por talla")

    product_ids = {product_id for product_id, _ in normalized}
    products = {product.id: product for product in Product.query.filter(Product.id.in_(product_ids)).all()}
    if len(products) != len(product_ids):
        return error("Hay productos que ya no están disponibles")
    requested_by_product = {}
    for (product_id, size), quantity in normalized.items():
        if size not in [int(s) for s in products[product_id].sizes.split(",")]:
            return error("La talla seleccionada no está disponible")
        requested_by_product[product_id] = requested_by_product.get(product_id, 0) + quantity

    try:
        for product_id, quantity in requested_by_product.items():
            result = db.session.execute(
                update(Product).where(Product.id == product_id, Product.stock >= quantity)
                .values(stock=Product.stock - quantity)
            )
            if result.rowcount != 1:
                db.session.rollback()
                return error("No hay suficientes unidades disponibles", 409)
        total = sum(products[product_id].price_cop * quantity for (product_id, _), quantity in normalized.items())
        order = Order(code=secrets.token_hex(4).upper(), customer_name=name, customer_email=email, total_cop=total)
        db.session.add(order)
        db.session.flush()
        for (product_id, size), quantity in normalized.items():
            db.session.add(OrderItem(order_id=order.id, product_id=product_id, size=size,
                                     quantity=quantity, unit_price_cop=products[product_id].price_cop))
        db.session.commit()
    except Exception:
        db.session.rollback()
        raise
    return jsonify(order={"code": order.code, "total_cop": total, "status": order.status}), 201


from datetime import datetime, timezone
from . import db


class Product(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    slug = db.Column(db.String(80), unique=True, nullable=False)
    name = db.Column(db.String(120), nullable=False)
    category = db.Column(db.String(40), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price_cop = db.Column(db.Integer, nullable=False)
    image = db.Column(db.String(150), nullable=False)
    color = db.Column(db.String(50), nullable=False)
    sizes = db.Column(db.String(100), nullable=False)
    stock = db.Column(db.Integer, nullable=False, default=0)

    def to_dict(self):
        return {
            "id": self.id, "slug": self.slug, "name": self.name,
            "category": self.category, "description": self.description,
            "price_cop": self.price_cop, "image": self.image,
            "color": self.color, "sizes": [int(s) for s in self.sizes.split(",")],
            "stock": self.stock,
        }


class Order(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(16), unique=True, nullable=False)
    customer_name = db.Column(db.String(120), nullable=False)
    customer_email = db.Column(db.String(180), nullable=False)
    total_cop = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(30), nullable=False, default="recibido")
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    items = db.relationship("OrderItem", backref="order", cascade="all, delete-orphan")


class OrderItem(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey("product.id"), nullable=False)
    size = db.Column(db.Integer, nullable=False)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price_cop = db.Column(db.Integer, nullable=False)


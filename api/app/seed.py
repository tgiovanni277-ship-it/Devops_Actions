from . import create_app, db
from .models import Product

PRODUCTS = [
    dict(slug="aero-01", name="AERO 01", category="Running", description="Ligereza que sigue tu ritmo. Malla transpirable y amortiguación suave para ir más lejos.", price_cop=329900, image="/images/hero.png", color="Marfil / Terracota", sizes="36,37,38,39,40,41,42,43", stock=18),
    dict(slug="terra-knit", name="TERRA KNIT", category="Lifestyle", description="Una silueta esencial para cada día. Tejido flexible y comodidad sin esfuerzo.", price_cop=289900, image="/images/black.png", color="Grafito / Hueso", sizes="36,37,38,39,40,41,42,43", stock=24),
    dict(slug="pulse-trail", name="PULSE TRAIL", category="Training", description="Presencia y rendimiento en cada paso. Tracción firme y energía vibrante.", price_cop=349900, image="/images/orange.png", color="Óxido / Crema", sizes="37,38,39,40,41,42,43", stock=15),
]


def initialize():
    app = create_app()
    with app.app_context():
        db.create_all()
        for data in PRODUCTS:
            if not Product.query.filter_by(slug=data["slug"]).first():
                db.session.add(Product(**data))
        db.session.commit()


if __name__ == "__main__":
    initialize()


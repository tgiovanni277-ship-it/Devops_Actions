import pytest
from app import create_app, db
from app.models import Product


@pytest.fixture
def client():
    app = create_app({"TESTING": True, "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"})
    with app.app_context():
        db.create_all()
        db.session.add(Product(slug="test-runner", name="Runner", category="Running", description="Prueba", price_cop=100000, image="/images/hero.png", color="Blanco", sizes="38,39,40", stock=3))
        db.session.commit()
        yield app.test_client()
        db.session.remove()
        db.drop_all()


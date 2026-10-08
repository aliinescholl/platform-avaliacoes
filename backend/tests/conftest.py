import pytest
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

import app.core.database as database
from app.core.database import Base, get_db
from app.main import app
from app.models.employee import Employee
from app.models.leader_lead import LeaderLead
from app.seeds.seed_data import EMPLOYEES_DATA, LEADER_LEAD_DATA

TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Point the app database engine and sessionmaker to test engine during test run
database.engine = test_engine
database.SessionLocal = TestingSessionLocal

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()

    # Seed dump data
    for emp_id, name, email, pos in EMPLOYEES_DATA:
        session.add(Employee(id=emp_id, name=name, email=email, position_name=pos))
    session.commit()

    for ldr_id, ld_id in LEADER_LEAD_DATA:
        session.add(LeaderLead(leader_id=ldr_id, lead_id=ld_id))
    session.commit()

    yield session

    session.close()
    Base.metadata.drop_all(bind=test_engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

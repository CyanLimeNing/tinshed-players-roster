from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Volunteer(db.Model):
    __tablename__ = "volunteers"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120))
    phone = db.Column(db.String(40))
    member_number = db.Column(db.String(40))
    financial_to = db.Column(db.Date)
    emergency_contact_name = db.Column(db.String(120))
    emergency_contact_phone = db.Column(db.String(40))
    active = db.Column(db.Boolean, default=True, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "member_number": self.member_number,
            "financial_to": self.financial_to.isoformat() if self.financial_to else None,
            "emergency_contact_name": self.emergency_contact_name,
            "emergency_contact_phone": self.emergency_contact_phone,
            "active": self.active,
        }

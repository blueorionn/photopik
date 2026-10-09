import uuid
import enum
from datetime import date, datetime, timezone

from photopik.src.extensions import db

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Text,
    String,
    text,
    CheckConstraint,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, CITEXT
from sqlalchemy.orm import Mapped, mapped_column


class UserGender(enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class UserRole(enum.Enum):
    ADMIN = "admin"
    STAFF = "staff"
    USER = "user"


class UserStatus(enum.Enum):
    INVITED = "invited"
    ACTIVE = "active"
    SUSPENDED = "suspended"


class User(db.Model):
    __tablename__ = "user"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    email: Mapped[str] = mapped_column(CITEXT, nullable=False, unique=True)
    username: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    phone_number: Mapped[str] = mapped_column(String(15), nullable=True, unique=True)
    first_name: Mapped[str] = mapped_column(String(255), nullable=True)
    last_name: Mapped[str] = mapped_column(String(255), nullable=True)
    bio: Mapped[str] = mapped_column(Text, nullable=True)
    dob: Mapped[date] = mapped_column(Date(), nullable=True)
    gender: Mapped[str] = mapped_column(
        SAEnum(
            UserGender,
            name="user_gender",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=True,
    )
    role: Mapped[str] = mapped_column(
        SAEnum(
            UserRole,
            name="user_role",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        server_default=text("'user'"),
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    is_email_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
    is_phone_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
    status: Mapped[str] = mapped_column(
        SAEnum(
            UserStatus,
            name="user_status",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        server_default=text("'invited'"),
    )

    __table_args__ = (
        CheckConstraint(
            "(is_phone_verified AND phone_number IS NOT NULL) OR "
            "(NOT is_phone_verified AND phone_number IS NULL)",
            name="phone_number_verification_state_check",
        ),
    )

import uuid
import enum
from datetime import date, datetime, timezone

from photopik.src.extensions import db

from sqlalchemy import (
    Integer,
    Boolean,
    Date,
    DateTime,
    Text,
    String,
    text,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import ARRAY, CITEXT, UUID
from sqlalchemy.orm import Mapped, mapped_column


class UserGender(enum.Enum):
    """Gender options for user profiles."""

    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class UserRole(enum.Enum):
    """Access roles controlling permissions."""

    ADMIN = "admin"
    STAFF = "staff"
    USER = "user"


class UserStatus(enum.Enum):
    """Account lifecycle states."""

    INVITED = "invited"
    ACTIVE = "active"
    SUSPENDED = "suspended"


class MagicTokenPurpose(enum.Enum):
    """Purposes for single-use magic tokens."""

    INVITE = "invite"
    LOGIN = "login"
    WEBAUTHN_ENROLL = "webauthn_enroll"


class User(db.Model):
    """User account with role, status, and profile fields."""

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


class WebAuthnCredential(db.Model):
    """A registered WebAuthn passkey or security key."""

    __tablename__ = "webauthn_credential"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    credential_id: Mapped[str] = mapped_column(Text, unique=True)
    public_key: Mapped[str] = mapped_column(Text, nullable=False)
    sign_count: Mapped[int] = mapped_column(Integer, default=0)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    transports: Mapped[list[str] | None] = mapped_column(ARRAY(String), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=text("now()"),
    )
    last_used_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )


class MagicToken(db.Model):
    """Single-use email-delivered token for login or enrollment links."""

    __tablename__ = "magic_token"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    purpose: Mapped[str] = mapped_column(
        SAEnum(
            MagicTokenPurpose,
            name="magic_token_purpose",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    used_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )


class RefreshToken(db.Model):
    """Server-side record of an issued refresh JWT for rotation/revocation."""

    __tablename__ = "refresh_token"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    jti: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    revoked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    replaced_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("refresh_token.id"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
    )

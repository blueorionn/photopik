import uuid
import enum
from datetime import datetime, timezone

from photopik.src.extensions import db

from sqlalchemy import (
    Table,
    Column,
    Integer,
    BigInteger,
    Boolean,
    DateTime,
    Text,
    String,
    text,
    ForeignKey,
    CheckConstraint,
)
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

# Association table
collection_photos = Table(
    "collection_photos",
    db.metadata,
    Column(
        "collection_id",
        UUID(as_uuid=True),
        ForeignKey("collection.collection_id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "photo_id",
        UUID(as_uuid=True),
        ForeignKey("photo.photo_id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    ),
    Column(
        "added_at",
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    ),
)

# hidden photos association table
hidden_photos = Table(
    "hidden_photos",
    db.metadata,
    Column(
        "user_id",
        UUID(as_uuid=True),
        ForeignKey("user.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "photo_id",
        UUID(as_uuid=True),
        ForeignKey("photo.photo_id", ondelete="CASCADE"),
        primary_key=True,
        index=True,
    ),
    Column(
        "hidden_at",
        DateTime(timezone=True),
        server_default=text("now()"),
        nullable=False,
    ),
)


class PhotoLicense(enum.Enum):
    RESERVED = "reserved"
    PUBLIC_DOMAIN = "public_domain"
    CC0_1_0 = "cc0_1_0"
    CC_BY_3_0 = "cc_by_3_0"
    CC_BY_4_0 = "cc_by_4_0"
    CC_BY_SA_3_0 = "cc_by_sa_3_0"
    CC_BY_SA_4_0 = "cc_by_sa_4_0"
    CC_BY_NC_3_0 = "cc_by_nc_3_0"
    CC_BY_NC_4_0 = "cc_by_nc_4_0"
    CC_BY_NC_SA_3_0 = "cc_by_nc_sa_3_0"
    CC_BY_NC_SA_4_0 = "cc_by_nc_sa_4_0"
    CC_BY_ND_3_0 = "cc_by_nd_3_0"
    CC_BY_ND_4_0 = "cc_by_nd_4_0"
    CC_BY_NC_ND_3_0 = "cc_by_nc_nd_3_0"
    CC_BY_NC_ND_4_0 = "cc_by_nc_nd_4_0"


class Photo(db.Model):
    __tablename__ = "photo"

    photo_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    license: Mapped[str] = mapped_column(
        SAEnum(
            PhotoLicense,
            name="photo_license",
            values_callable=lambda e: [m.value for m in e],
        ),
        nullable=False,
        server_default=text("'reserved'"),
    )
    uploaded_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    upload_time: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=text("now()")
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
    width: Mapped[int] = mapped_column(Integer, nullable=False)
    height: Mapped[int] = mapped_column(Integer, nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(128), nullable=False)
    storage_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    file_hash: Mapped[str] = mapped_column(String(512), nullable=False)
    is_nsfw: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
    is_private: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("true"),
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # collection relationship
    collections: Mapped[list["Collection"]] = db.relationship(
        secondary=collection_photos, back_populates="photos"
    )

    __table_args__ = (
        CheckConstraint(
            "width > 0 AND height > 0",
            name="photo_dimensions_check",
        ),
        CheckConstraint(
            "file_size > 0",
            name="photo_file_size_check",
        ),
        CheckConstraint(
            "(is_deleted AND deleted_at IS NOT NULL) OR "
            "(NOT is_deleted AND deleted_at IS NULL)",
            name="photo_deletion_state_check",
        ),
    )


class Collection(db.Model):
    __tablename__ = "collection"

    collection_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()")
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("user.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
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
    is_private: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("true"),
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("false"),
    )
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    photos: Mapped[list["Photo"]] = db.relationship(
        secondary=collection_photos, back_populates="collections"
    )

    __table_args__ = (
        CheckConstraint(
            "(is_deleted AND deleted_at IS NOT NULL) OR "
            "(NOT is_deleted AND deleted_at IS NULL)",
            name="collection_deletion_state_check",
        ),
    )

from pydantic import BaseModel, ConfigDict
from typing import Literal, TypeAlias


class Architecture(BaseModel):
    model_config = ConfigDict(extra="allow")

    input_modalities: list[str]
    output_modalities: list[str]


class EnumParameter(BaseModel):
    type: Literal["enum"]
    values: list[str | int | float]


class RangeParameter(BaseModel):
    type: Literal["range"]
    min: int | float
    max: int | float


class BooleanParameter(BaseModel):
    type: Literal["boolean"]


Parameter: TypeAlias = EnumParameter | RangeParameter | BooleanParameter


class ImageModel(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    name: str
    description: str
    created: int
    architecture: Architecture
    supported_parameters: dict[str, Parameter]
    supports_streaming: bool
    endpoints: str

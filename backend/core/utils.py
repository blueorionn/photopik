import httpx
import json
from ..types.image_model import ImageModel


def get_text_to_image_model_data():
    """Fetch all text-to-image models and it's subsequent data available on OpenRouter.

    Returns:
        list[ImageModel]:  A list of validated image model objects containing
            model metadata, architecture modalities, supported parameters,
            streaming support, and endpoint information.

    Raises:
        httpx.HTTPError: If the HTTP request fails.
        KeyError: If the API response does not contain the expected key.
    """
    url = "https://openrouter.ai/api/v1/images/models"

    response = httpx.get(url, timeout=30.0)
    response.raise_for_status()

    data = [
        ImageModel.model_validate(item, extra="allow")
        for item in response.json()["data"]
    ]
    
    return [model.model_dump(mode="json") for model in data]

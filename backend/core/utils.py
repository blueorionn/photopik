import httpx
import base64

from flask import current_app
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


def generate_image(
    prompt: str, model: str = "qwen/qwen-image-2.1-turbo", timeout: int = 120.0
) -> bytes:
    """Generate an image from a text prompt using OpenRouter.

    Args:
        prompt: Description of the image to generate.
        model: OpenRouter image-generation model ID.
        timeout: Request timeout in seconds.

    Returns:
        bytes: The generated image as binary data.

    Raises:
        httpx.HTTPError: If the API request fails.
        KeyError: If the response does not contain image data.
    """
    api_key = current_app.config["OPENROUTER_API_KEY"]

    response = httpx.post(
        "https://openrouter.ai/api/v1/images",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json={
            "model": model,
            "prompt": prompt,
            "aspect_ratio": "16:9",
            "resolution": "2K",
        },
        timeout=timeout,
    )
    response.raise_for_status()

    result = response.json()
    image_base64 = result["data"][0]["b64_json"]

    return base64.b64decode(image_base64)

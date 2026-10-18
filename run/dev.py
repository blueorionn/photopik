from dotenv import load_dotenv

load_dotenv()

from backend import create_app

app = create_app()


if __name__ == "__main__":
    if app.config["ENV"] == "dev":
        app.run(host="0.0.0.0", port=8000)
FROM python:3.12-slim
WORKDIR /service
COPY pyproject.toml README.md ./
COPY app ./app
RUN pip install --no-cache-dir .
EXPOSE 10000
CMD ["sh", "-c", "python -m app.seed && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-10000}"]

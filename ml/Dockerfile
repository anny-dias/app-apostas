FROM python:3.11-slim

WORKDIR /app

# Cria usuário não-root
RUN useradd -m app

# Instala dependências
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia a aplicação
COPY app.py ./app.py

# Executa como usuário não-root
USER app

EXPOSE 8000
CMD ["python", "app.py"]

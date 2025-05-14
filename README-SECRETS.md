# Работа с секретами в проекте

## Настройка для локальной разработки

1. Создайте файл `secrets.json` с помощью скрипта `add_secret.py`:
   ```bash
   python add_secret.py
   ```

2. Введите пароль для шифрования и API ключ DeepSeek.

3. Установите переменную окружения `SECRETS_PASSWORD` с тем же паролем:
   ```bash
   # Linux/macOS
   export SECRETS_PASSWORD="ваш-пароль"
   
   # Windows (CMD)
   set SECRETS_PASSWORD=ваш-пароль
   
   # Windows (PowerShell)
   $env:SECRETS_PASSWORD="ваш-пароль"
   ```

## Настройка для Docker

1. Файл `secrets.json` будет скопирован в Docker-образ благодаря обновленному Dockerfile.

2. При запуске контейнера передайте переменную окружения:
   ```bash
   docker run -e SECRETS_PASSWORD="ваш-пароль" -p 3000:3000 ваш-образ
   ```

## Настройка для AWS

1. В консоли AWS AppRunner добавьте переменную окружения `SECRETS_PASSWORD`.

2. Убедитесь, что файл `secrets.json` включен в деплой (он копируется в Docker-образ).

## Проверка перед деплоем

Выполните следующие шаги для проверки:

1. Убедитесь, что файл `secrets.json` существует локально.

2. Проверьте, что файл не отслеживается Git:
   ```bash
   git ls-files | grep secrets.json
   ```
   Если вывод пустой - файл не отслеживается Git (это хорошо).

3. Убедитесь, что файл `.dockerignore` НЕ содержит `secrets.json`.

4. Проверьте, что в Dockerfile есть строка:
   ```dockerfile
   COPY secrets.json ./
   ```

## Использование секретов в коде

```python
from secrets_manager import SecretsManager

# Инициализируем менеджер секретов
secrets = SecretsManager()

# Получаем API ключ
api_key = secrets.get_secret('deepseek_api_key')

# Используем API ключ
# ...
```
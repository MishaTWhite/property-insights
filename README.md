# Property Insights

Property Insights is a web application for analyzing real estate properties and mortgage calculations.

## Project Structure

- `/client` - React frontend with Vite
- `/server` - Node.js/Express backend API
- `/server/src/otodom_parser` - Python scraper for Otodom property listings

## Getting Started

1. **Install Dependencies**:
   ```
   npm run install-all
   ```

2. **Start the Development Environment**:
   ```
   npm start
   ```

3. **Debugging**:
   - Use the "Launch Server" configuration to debug the Node.js backend
   - Use the "Launch Client" configuration to debug the React frontend in Chrome
   - Use the "Server/Client" compound configuration to debug both simultaneously
   - Use the "Full Stack" configuration for an integrated debugging experience

## API Communication

The Vite development server is configured to proxy API requests to the backend:
- Frontend requests to `/api/*` are automatically forwarded to `http://localhost:3000/api/*`
- No need to hardcode the backend URL in frontend code

## Секреты и API ключи

В проекте используется система управления секретами для безопасного хранения API ключей.

### Как получить API ключ DeepSeek

```python
from secrets_manager import SecretsManager

# Инициализация менеджера секретов (пароль берется из переменной окружения)
secrets = SecretsManager()

# Получение API ключа DeepSeek
api_key = secrets.get_secret('deepseek_api_key')

# Теперь можно использовать api_key для работы с DeepSeek API
# Пример:
# from deepseek_client import DeepSeekClient
# client = DeepSeekClient(api_key=api_key)
# response = client.generate_text("Ваш запрос")
```

### Доступные секреты

- `deepseek_api_key` - API ключ для сервиса DeepSeek

### Добавление новых секретов

```python
from secrets_manager import SecretsManager

# Инициализация менеджера секретов (пароль берется из переменной окружения)
secrets = SecretsManager()
secrets.set_secret('название_ключа', 'значение_ключа')
```

### Примечания по безопасности

- Все секреты хранятся в зашифрованном виде в файле `secrets.json`
- Для шифрования используется библиотека cryptography
- Пароль для доступа к секретам хранится в переменной окружения SECRETS_PASSWORD

## Дополнительная документация

- [VS Code Setup](README_VS_CODE_SETUP.md) - Настройка VS Code для проекта
- [Deployment Guide](DEPLOYMENT.md) - Руководство по развертыванию
- [Windows Setup](WINDOWS_SETUP.md) - Настройка для Windows

## Работа с секретами

Для работы с API ключами и другими секретами используйте `secrets_manager.py`:

```python
from secrets_manager import SecretsManager

# Инициализация менеджера секретов (пароль должен быть в переменной окружения SECRETS_PASSWORD)
secrets = SecretsManager()

# Получение API ключа
api_key = secrets.get_secret('deepseek_api_key')

# Использование API ключа в коде
# ...
```

Файл `secrets.json` добавлен в `.gitignore` и не должен попадать в репозиторий.
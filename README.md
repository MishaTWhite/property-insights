# Property Insights

## Секреты и API ключи

В проекте используется система управления секретами для безопасного хранения API ключей.

### Как получить API ключ DeepSeek

```python
from secrets_manager import SecretsManager

# Инициализация менеджера секретов с паролем
secrets = SecretsManager(password='G1hdrjti')

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

secrets = SecretsManager(password='G1hdrjti')
secrets.set_secret('название_ключа', 'значение_ключа')
```

### Примечания по безопасности

- Все секреты хранятся в зашифрованном виде в файле `secrets.json`
- Для шифрования используется библиотека cryptography
- Пароль для доступа к секретам: `G1hdrjti`
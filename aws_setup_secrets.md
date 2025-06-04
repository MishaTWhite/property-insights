# Настройка секретов для AWS

Для использования зашифрованных секретов в AWS AppRunner или другой среде AWS, необходимо настроить переменную окружения `SECRETS_PASSWORD`.

## Настройка в AWS AppRunner

1. В консоли AWS AppRunner выберите ваш сервис
2. Перейдите в раздел "Configuration" -> "Environment variables"
3. Добавьте переменную окружения:
   - Ключ: `SECRETS_PASSWORD`
   - Значение: [ваш пароль для шифрования секретов]

## Настройка в AWS через apprunner.yaml

```yaml
env:
  - name: SECRETS_PASSWORD
    value: ${SECRETS_PASSWORD}
```

И передайте значение через переменные окружения при деплое.

## Использование AWS Secrets Manager (рекомендуемый подход)

Для продакшн-среды рекомендуется использовать AWS Secrets Manager:

1. Создайте секрет в AWS Secrets Manager с вашим паролем
2. Настройте доступ к этому секрету из AppRunner
3. Загрузите секрет в переменную окружения при запуске приложения

```python
import boto3
import os

def load_secrets_password():
    # Получаем пароль из AWS Secrets Manager
    session = boto3.session.Session()
    client = session.client(service_name='secretsmanager')
    secret = client.get_secret_value(SecretId='your-secret-name')
    
    # Устанавливаем пароль как переменную окружения
    os.environ['SECRETS_PASSWORD'] = secret['SecretString']
```

Вызовите эту функцию при запуске приложения.
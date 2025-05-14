import os
import sys
from secrets_manager import SecretsManager

def add_deepseek_api_key():
    # Проверяем, что пароль для секретов установлен
    if 'SECRETS_PASSWORD' not in os.environ:
        password = input("Введите пароль для шифрования секретов: ")
        os.environ['SECRETS_PASSWORD'] = password
    
    # Получаем API ключ от пользователя
    api_key = input("Введите новый API ключ DeepSeek: ")
    
    try:
        # Инициализируем менеджер секретов
        secrets = SecretsManager()
        
        # Сохраняем API ключ
        secrets.set_secret('deepseek_api_key', api_key)
        
        print("API ключ DeepSeek успешно сохранен в зашифрованном виде.")
        print("Для использования в коде:")
        print("from secrets_manager import SecretsManager")
        print("secrets = SecretsManager()")
        print("api_key = secrets.get_secret('deepseek_api_key')")
    except Exception as e:
        print(f"Ошибка при сохранении секрета: {e}")
        sys.exit(1)

if __name__ == "__main__":
    add_deepseek_api_key()
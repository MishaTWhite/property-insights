import os
from secrets_manager import SecretsManager

# Пример использования API ключа DeepSeek в коде
def use_deepseek_api():
    # Убедитесь, что пароль для секретов установлен в переменной окружения
    if 'SECRETS_PASSWORD' not in os.environ:
        print("Ошибка: Переменная окружения SECRETS_PASSWORD не установлена")
        return
    
    try:
        # Инициализируем менеджер секретов
        secrets = SecretsManager()
        
        # Получаем API ключ
        api_key = secrets.get_secret('deepseek_api_key')
        
        if not api_key:
            print("API ключ DeepSeek не найден в секретах")
            return
        
        # Здесь можно использовать API ключ для вызова DeepSeek API
        print(f"Используем API ключ DeepSeek: {api_key[:5]}...{api_key[-5:]} (скрыт)")
        
        # Пример использования с API
        # response = requests.post(
        #     "https://api.deepseek.com/v1/...",
        #     headers={"Authorization": f"Bearer {api_key}"},
        #     json={"prompt": "Hello, DeepSeek!"}
        # )
        
    except Exception as e:
        print(f"Ошибка при получении секрета: {e}")

if __name__ == "__main__":
    use_deepseek_api()
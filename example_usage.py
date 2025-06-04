from secrets_manager import SecretsManager

def main():
    # Создание менеджера секретов с вашим паролем
    secrets = SecretsManager(password='G1hdrjti')
    
    # Сохранение вашего API ключа DeepSeek
    secrets.set_secret('deepseek_api_key', 'sk-01f3bd04dae94ab399bc84427e9f377b')
    
    # Получение API ключа для проверки
    retrieved_key = secrets.get_secret('deepseek_api_key')
    print(f"Сохраненный API ключ DeepSeek: {retrieved_key}")

if __name__ == "__main__":
    main()
